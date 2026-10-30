import {NextResponse} from "next/server";import {db} from "@/lib/db";
export const dynamic="force-dynamic";export async function GET(){try{return NextResponse.json(await db.service.findMany({where:{isActive:true,category:{isActive:true}},include:{category:true},orderBy:{name:"asc"}}));}catch{return NextResponse.json({error:"Не удалось загрузить услуги."},{status:503});}}
