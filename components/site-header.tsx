import Link from "next/link";
const items=[["/catalog","Каталог"],["/analytics","Аналитика"],["/map","Карта"],["/methodology","Методология"],["/admin","Админка"]];
export function SiteHeader(){return <header className="site-header"><Link href="/" className="brand"><span className="brand-mark">ч.</span><span>честная цена<span style={{color:"#8aa94a"}}>.</span></span></Link><nav className="nav">{items.map(([href,label])=><Link href={href} key={href}>{label}</Link>)}</nav></header>}
export function SiteFooter(){return <footer className="footer">Честная цена · Независимый мониторинг стоимости повседневных услуг · Москва</footer>}
