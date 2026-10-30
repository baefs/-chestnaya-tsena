import {redirect} from "next/navigation";import {currentAdmin} from "@/lib/admin";import {AdminCategories} from "@/components/admin-categories";
export const dynamic="force-dynamic";export default async function AdminCategoriesPage(){if(!await currentAdmin())redirect("/admin/login");return <AdminCategories/>}
