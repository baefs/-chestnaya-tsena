import {redirect} from "next/navigation";import {currentAdmin} from "@/lib/admin";import {ModerationQueue} from "@/components/moderation-queue";
export const dynamic="force-dynamic";export default async function ModerationPage(){if(!await currentAdmin())redirect("/admin/login");return <ModerationQueue/>}
