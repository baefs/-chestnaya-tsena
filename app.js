const categories=[
{name:"Красота",icon:"✳",services:["Мужская стрижка","Женская стрижка"]},
{name:"Ремонт обуви",icon:"⌁",services:["Замена набоек","Установка профилактики"]},
{name:"Печать",icon:"▤",services:["Чёрно-белая печать А4","Цветная печать А4"]},
{name:"Химчистка",icon:"◌",services:["Чистка мужской рубашки","Чистка брюк"]},
{name:"Велосервис",icon:"◎",services:["Замена велосипедной камеры","Регулировка тормозов"]}
];
const descriptions={
"Мужская стрижка":"Стрижка волос машинкой и/или ножницами, без дополнительных услуг. Мытьё и укладка не включены.",
"Женская стрижка":"Стрижка волос по длине и форме. Дополнительный уход, окрашивание и укладка не включены.",
"Замена набоек":"Снятие изношенных набоек и установка новой пары. Материал и тип набоек должны быть указаны в предложении.",
"Установка профилактики":"Установка защитного материала на подошву пары обуви. Стоимость материалов должна быть включена или обозначена отдельно.",
"Чёрно-белая печать А4":"Печать одной стороны листа формата А4 в чёрно-белом режиме, стандартная бумага 80 г/м².",
"Цветная печать А4":"Печать одной стороны листа формата А4 в цветном режиме, стандартная бумага 80 г/м².",
"Чистка мужской рубашки":"Химическая чистка одной мужской рубашки без дополнительных услуг.",
"Чистка брюк":"Химическая чистка одной пары брюк без дополнительных услуг.",
"Замена велосипедной камеры":"Замена камеры на одном колесе велосипеда. Камера и работа должны быть указаны отдельно.",
"Регулировка тормозов":"Регулировка одного тормозного механизма велосипеда без замены комплектующих."
};
const DBKEY="chestnaya_admin_demo_v1";
const $=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const money=n=>Number(n).toLocaleString("ru-RU",{maximumFractionDigits:2});
const fallbackServices=categories.flatMap(c=>c.services.map(name=>({name:name,category:c.name})));
let selectedCategory="Все категории",currentService="Мужская стрижка",currentPage="home",analyticsPeriod=30;
function readData(){try{const d=JSON.parse(localStorage.getItem(DBKEY)||"null");return d&&Array.isArray(d.services)&&Array.isArray(d.organizations)&&Array.isArray(d.offers)?d:{services:[],organizations:[],offers:[]};}catch(e){return {services:[],organizations:[],offers:[]};}}
function services(){const d=readData();return d.services.length?d.services.map(s=>({name:s.name,category:s.category||"Другое"})):fallbackServices;}
function go(page,push=true){
 const allowed=["home","catalog","compare","analytics","map","method"];if(!allowed.includes(page))page="home";currentPage=page;
 document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id==="page-"+page));
 if($("home-content"))$("home-content").hidden=page!=="home";
 document.querySelectorAll("[data-page]").forEach(a=>a.classList.toggle("selected",a.dataset.page===page));
 $("mobileNav").classList.remove("open");if(push)history.pushState({page:page},"","#"+page);
 window.scrollTo({top:0,behavior:"smooth"});if(page==="analytics")renderAnalytics();if(page==="map")renderMap();
}
window.addEventListener("popstate",()=>go(location.hash.slice(1)||"home",false));
function openService(name){
 currentService=name;const s=services().find(x=>x.name===name)||{};
 $("compareTitle").textContent=name;$("compareCategory").textContent=(s.category||"УСЛУГА").toUpperCase();
 $("compareDescription").textContent=descriptions[name]||readData().services.find(x=>x.name===name)?.description||"Стандартизированное описание услуги.";
 renderComparison();go("compare");
}
function renderHome(){
 const ss=services(),d=readData();
 $("categoryGrid").innerHTML=categories.map(c=>'<article class="category-card" data-cat="'+esc(c.name)+'" role="button" tabindex="0"><div class="cat-icon">'+c.icon+'</div><div><div class="cat-name">'+esc(c.name)+'</div><div class="cat-count">'+ss.filter(s=>s.category===c.name).length+' услуг</div></div><span class="cat-arrow">↗</span></article>').join("");
 $("categoryGrid").querySelectorAll(".category-card").forEach(el=>{const act=()=>{selectedCategory=el.dataset.cat;renderCatalog();go("catalog");};el.onclick=act;el.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();act();}};});
 $("popularList").innerHTML=ss.slice(0,6).map((s,i)=>'<div class="popular-row" data-service="'+esc(s.name)+'" role="button" tabindex="0"><span class="popular-num">'+String(i+1).padStart(2,"0")+'</span><span class="popular-name">'+esc(s.name)+'</span><span class="popular-category">'+esc(s.category)+'</span><span class="popular-arrow">↗</span></div>').join("");
 $("popularList").querySelectorAll(".popular-row").forEach(el=>el.onclick=()=>openService(el.dataset.service));
 const stats=$("home-content").querySelectorAll(".stats-strip>div strong");if(stats[0])stats[0].textContent=d.organizations.length;if(stats[1])stats[1].textContent=d.offers.filter(o=>["CONFIRMED","VERIFIED"].includes(o.status)).length;
}
function renderCatalog(){
 const ss=services(),cats=["Все категории",...new Set(ss.map(s=>s.category))];
 $("categoryFilters").innerHTML=cats.map(c=>'<button type="button" class="'+(selectedCategory===c?"active":"")+'" data-filter="'+esc(c)+'">'+esc(c)+'</button>').join("");
 $("categoryFilters").querySelectorAll("button").forEach(b=>b.onclick=()=>{selectedCategory=b.dataset.filter;renderCatalog();});
 const q=$("catalogQuery").value.trim().toLocaleLowerCase("ru");
 const groups=cats.slice(1).filter(c=>selectedCategory==="Все категории"||selectedCategory===c).map(c=>({name:c,items:ss.filter(s=>s.category===c&&s.name.toLocaleLowerCase("ru").includes(q))})).filter(c=>c.items.length);
 $("catalogGroups").innerHTML=groups.length?groups.map(c=>'<section class="catalog-group"><div class="catalog-group-head"><h2>'+esc(c.name)+'</h2><span>'+c.items.length+' услуг</span></div><div class="service-grid">'+c.items.map(s=>'<article class="service-card" data-service="'+esc(s.name)+'" role="button" tabindex="0"><div><strong>'+esc(s.name)+'</strong><small>'+esc(descriptions[s.name]||"Стандартизированное описание услуги.")+'</small></div><b>↗</b></article>').join("")+'</div></section>').join(""):'<div class="empty-state"><h3>Ничего не найдено</h3><p>Измени запрос или категорию.</p><button class="small-btn" id="clearCatalogSearch">Сбросить поиск</button></div>';
 $("catalogGroups").querySelectorAll(".service-card").forEach(el=>{const act=()=>openService(el.dataset.service);el.onclick=act;el.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();act();}};});
 $("clearCatalogSearch")?.addEventListener("click",()=>{$("catalogQuery").value="";selectedCategory="Все категории";renderCatalog();});
}
function offersFor(name){
 const d=readData();return d.offers.filter(o=>{const s=d.services.find(x=>x.id===Number(o.serviceId));return s&&s.name===name&&["CONFIRMED","VERIFIED"].includes(o.status)&&Number(o.price)>0;}).map(o=>{const org=d.organizations.find(x=>x.id===Number(o.orgId))||{};return {...o,organization:org.name||"Организация",address:org.address||"",district:org.district||"",source:o.source_url||org.source_url||""};});
}
function renderComparison(){
 let rows=offersFor(currentService);const district=$("districtFilter").value,status=$("statusFilter").value,min=Number($("minPrice").value)||0,max=Number($("maxPrice").value)||Infinity;
 rows=rows.filter(o=>(!district||o.district===district)&&(!status||o.status===status)&&Number(o.price)>=min&&Number(o.price)<=max);
 const sort=$("sortSelect").value;rows.sort((a,b)=>sort==="desc"?b.price-a.price:sort==="date"?(b.checked_at||"").localeCompare(a.checked_at||""):a.price-b.price);
 const p=rows.map(o=>Number(o.price)).sort((a,b)=>a-b),median=p.length?(p.length%2?p[(p.length-1)/2]:(p[p.length/2-1]+p[p.length/2])/2):0;
 const k=document.querySelectorAll(".compare-kpis>div");if(k[0]){k[0].querySelector("strong").textContent=p.length>=5?money(median)+" ₽":"—";k[0].querySelector("small").textContent=p.length>=5?"По актуальным предложениям":"Нужно минимум 5 подтверждённых предложений";}
 if(k[1]){k[1].querySelector("strong").textContent=p.length?money(p[0])+" ₽":"—";k[1].querySelector("small").textContent=p.length?"Минимум в выборке":"Нет данных";}
 if(k[2]){k[2].querySelector("strong").textContent=p.length?money(p[p.length-1])+" ₽":"—";k[2].querySelector("small").textContent=p.length?"Максимум в выборке":"Нет данных";}
 if(k[3]){k[3].querySelector("strong").textContent=p.length;k[3].querySelector("small").textContent="актуальных предложений";}
 $("resultsCount").textContent=rows.length+" предложений";
 $("offersList").innerHTML=rows.length?rows.map(o=>'<article class="offer-card"><div><b>'+esc(o.organization)+'</b><small>'+esc(o.address)+(o.district?" · "+esc(o.district)+" округ":"")+'</small><small class="tag">'+(o.status==="CONFIRMED"?"Подтверждено":"Проверено командой")+'</small></div><strong>'+money(o.price)+' ₽</strong><div>'+(o.source?'<a class="text-link" href="'+esc(o.source)+'" target="_blank" rel="noopener noreferrer">Источник ↗</a>':'<small>Источник не указан</small>')+'</div></article>').join(""):'<div class="empty-state"><div class="empty-symbol">⌕</div><h3>Пока нет подтверждённых предложений</h3><p>В базе пока нет актуальных цен со статусом «Подтверждено» или «Проверено командой». Непроверенные сообщения не участвуют в сравнении.</p><a class="text-link" href="#method" data-page="method">Как формируется выборка ↗</a></div>';
 const chart=document.querySelector(".chart-placeholder .chart-empty");if(chart)chart.textContent=p.length>=5?"Достаточно данных для построения распределения.":"Недостаточно данных для построения графика";
}
function renderAnalytics(){
 const d=readData(),since=new Date();since.setDate(since.getDate()-analyticsPeriod);
 const valid=d.offers.filter(o=>["CONFIRMED","VERIFIED"].includes(o.status)&&Number(o.price)>0&&(!o.checked_at||new Date(o.checked_at)>=since));
 const p=valid.map(o=>Number(o.price)).sort((a,b)=>a-b),med=p.length?(p.length%2?p[(p.length-1)/2]:(p[p.length/2-1]+p[p.length/2])/2):0;
 const vals=[p.length>=5?money(med)+" ₽":"—",p.length?money(p[0])+" ₽":"—",p.length?money(p[p.length-1])+" ₽":"—",new Set(valid.map(o=>o.orgId)).size];
 document.querySelectorAll(".analytics-kpis>div").forEach((el,i)=>{const b=el.querySelector("b");if(b)b.textContent=vals[i]??"—";});
 const msg=document.querySelector(".chart-center span");if(msg)msg.textContent=p.length>=5?"История цен будет отображаться после накопления наблюдений за разные даты.":"График появится после накопления минимум 5 актуальных предложений.";
 const district=document.querySelector(".district-empty");if(district){const names=["Центральный","Северный","Юго-Западный"];district.innerHTML=names.map(n=>{const count=new Set(valid.filter(o=>d.organizations.find(x=>x.id===Number(o.orgId))?.district===n).map(o=>o.orgId)).size;return '<div><span>'+(n==="Центральный"?"ЦАО":n==="Северный"?"САО":"ЮЗАО")+'</span><i></i><b>'+count+'</b></div>';}).join("")+'<small>Для сравнения нужно минимум 5 организаций в каждой группе</small>';}
}
function renderMap(){
 const d=readData(),service=$("mapService").value,district=$("mapDistrict").value;
 const valid=d.organizations.filter(o=>(!district||o.district===district)&&o.lat!==""&&o.lng!==""&&Number.isFinite(Number(o.lat))&&Number.isFinite(Number(o.lng))&&d.offers.some(v=>v.orgId===o.id&&["CONFIRMED","VERIFIED"].includes(v.status)&&(!service||d.services.find(s=>s.id===v.serviceId)?.name===service)));
 const msg=document.querySelector(".map-message");if(!msg)return;
 document.querySelector(".map-empty").querySelectorAll(".map-results").forEach(x=>x.remove());
 if(!valid.length){msg.hidden=false;msg.querySelector("h2").textContent="Карта пока без отметок";msg.querySelector("p").textContent="Здесь появятся организации с проверенными координатами и подтверждёнными предложениями. Случайные маркеры не используются.";return;}
 msg.hidden=true;const list=document.createElement("div");list.className="map-results";list.innerHTML=valid.map(o=>'<article><b>'+esc(o.name)+'</b><span>'+esc(o.address||"Адрес не указан")+'</span></article>').join("");document.querySelector(".map-empty").append(list);
}
function updateMapOptions(){const old=$("mapService").value;const ss=services();$("mapService").innerHTML='<option value="">Все услуги</option>'+ss.map(s=>'<option value="'+esc(s.name)+'">'+esc(s.name)+'</option>').join("");if(ss.some(s=>s.name===old))$("mapService").value=old;}
$("catalogQuery").addEventListener("input",renderCatalog);
$("heroSearch").addEventListener("submit",e=>{e.preventDefault();const q=$("heroQuery").value.trim().toLocaleLowerCase("ru");if(!q){$("heroQuery").focus();return;}const found=services().find(s=>s.name.toLocaleLowerCase("ru").includes(q)||s.category.toLocaleLowerCase("ru").includes(q));if(found)openService(found.name);else{$("catalogQuery").value=$("heroQuery").value;selectedCategory="Все категории";renderCatalog();go("catalog");}});
document.querySelectorAll("[data-search]").forEach(b=>b.onclick=()=>{$("heroQuery").value=b.dataset.search;$("heroSearch").requestSubmit();});
$("menuToggle").onclick=()=>$("mobileNav").classList.toggle("open");
$("resetFilters").onclick=()=>{["districtFilter","statusFilter","minPrice","maxPrice"].forEach(id=>$(id).value="");$("sortSelect").value="asc";renderComparison();};
["districtFilter","statusFilter","minPrice","maxPrice","sortSelect"].forEach(id=>$(id).addEventListener("input",renderComparison));
["mapService","mapDistrict"].forEach(id=>$(id).addEventListener("change",renderMap));
const period=$(".analytics-intro .period-select");if(period)period.innerHTML='Период <select id="analyticsPeriod" aria-label="Период аналитики"><option value="7">Последние 7 дней</option><option value="30" selected>Последние 30 дней</option><option value="90">Последние 90 дней</option><option value="365">Последний год</option><option value="all">За всё время</option></select>';
$("analyticsPeriod").onchange=e=>{analyticsPeriod=e.target.value==="all"?36500:Number(e.target.value);renderAnalytics();};
document.addEventListener("click",e=>{const a=e.target.closest("[data-page]");if(a&&a.dataset.page){e.preventDefault();go(a.dataset.page);}});
window.addEventListener("storage",e=>{if(e.key===DBKEY){renderHome();renderCatalog();updateMapOptions();if(currentPage==="compare")renderComparison();if(currentPage==="analytics")renderAnalytics();if(currentPage==="map")renderMap();}});
renderHome();renderCatalog();updateMapOptions();go(location.hash.slice(1)||"home",false);
