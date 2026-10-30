import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import "./globals.css";
export const metadata: Metadata = { title: "Честная цена — сравнение стоимости услуг в Москве", description: "Независимый сервис сравнения стоимости повседневных услуг в Москве." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
 return <html lang="ru"><body><SiteHeader/>{children}<SiteFooter/></body></html>;
}
