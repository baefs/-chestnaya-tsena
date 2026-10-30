import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { currentAdmin } from "@/lib/admin";

type Context = {
  params: Promise<{ id: string }>;
};

const reviewSchema = z.object({
  action: z.enum(["approve", "reject"]),
  organizationId: z.string().uuid().optional(),
  sourceUrl: z.string().url().optional(),
});

export async function PATCH(
  request: Request,
  { params }: Context,
) {
  if (!(await currentAdmin())) {
    return NextResponse.json({ error: "Нет доступа." }, { status: 401 });
  }

  try {
    const { id } = await params;
    z.string().uuid().parse(id);

    const body = reviewSchema.parse(await request.json());
    const submission = await db.submission.findUnique({ where: { id } });

    if (!submission) {
      return NextResponse.json(
        { error: "Предложение не найдено." },
        { status: 404 },
      );
    }

    if (body.action === "reject") {
      await db.submission.update({
        where: { id },
        data: {
          status: "REJECTED",
          reviewedAt: new Date(),
          reviewNote: "Отклонено модератором.",
        },
      });

      return NextResponse.json({ ok: true, status: "REJECTED" });
    }

    const organizationId = body.organizationId || submission.organizationId;
    if (!organizationId) {
      return NextResponse.json(
        { error: "Для подтверждения выберите организацию." },
        { status: 400 },
      );
    }

    const sourceUrl = body.sourceUrl || submission.evidence;
    if (!sourceUrl || !/^https?:\/\//i.test(sourceUrl)) {
      return NextResponse.json(
        { error: "Для подтверждения нужна ссылка на проверяемый первоисточник." },
        { status: 400 },
      );
    }

    const source = await db.source.create({
      data: {
        sourceType: "MODERATOR_VERIFICATION",
        sourceUrl,
        description: "Источник, проверенный модератором",
      },
    });

    const offer = await db.offer.create({
      data: {
        serviceId: submission.serviceId,
        organizationId,
        price: submission.proposedPrice,
        priceType: "FIXED",
        sourceId: source.id,
        sourceUrl,
        verificationMethod: "Проверка модератором",
        status: "VERIFIED",
        checkedAt: new Date(),
        isPublished: true,
        notes: "Подтверждено через модерацию пользовательского предложения.",
      },
    });

    await db.submission.update({
      where: { id },
      data: {
        status: "VERIFIED",
        reviewedAt: new Date(),
        reviewNote: "Подтверждено и добавлено в публичную базу.",
      },
    });

    return NextResponse.json({
      ok: true,
      offerId: offer.id,
      status: "VERIFIED",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Некорректные параметры." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Не удалось обработать предложение." },
      { status: 500 },
    );
  }
}
