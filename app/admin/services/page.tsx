import {redirect} from "next/navigation";import {currentAdmin} from "@/lib/admin";import {AdminResource} from "@/components/admin-resource";
export const dynamic="force-dynamic";export default async function AdminServices(){if(!await currentAdmin())redirect("/admin/login");return <main className="wrap"><AdminResource resource="services"/></main>}
