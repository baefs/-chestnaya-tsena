const categories = [
 {name:"Красота",icon:"✳",services:["Мужская стрижка","Женская стрижка"]},
 {name:"Ремонт обуви",icon:"⌁",services:["Замена набоек","Установка профилактики"]},
 {name:"Печать",icon:"▤",services:["Чёрно-белая печать А4","Цветная печать А4"]},
 {name:"Химчистка",icon:"◌",services:["Чистка мужской рубашки","Чистка брюк"]},
 {name:"Велосервис",icon:"◎",services:["Замена велосипедной камеры","Регулировка тормозов"]}
];
const descriptions = {
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
let selectedCategory="Все категории", currentService="Мужская стрижка";
const allServices=categories.flatMap(c=>c.services.map(s=>({name:s,category:c.name})));
function go(page){document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));const target=document.getElementById("page-"+page);if(target)target.classList.add("active");document.querySelectorAll("[data-page]").forEach(a=>a.classList.toggle("selected",a.dataset.page===page));document.getElementById("mobileNav").classList.remove("open");window.scrollTo({top:0,behavior:"smooth"});}
document.addEventListener("click",e=>{const nav=e.target.closest("[data-page]");if(nav){e.preventDefault();go(nav.dataset.page);}});
function openService(name){currentService=name;document.getElementById("compareTitle").textContent=name;const c=allServices.find(x=>x.name===name);document.getElementById("compareCategory").textContent=(c?.category||"УСЛУГА").toUpperCase();document.getElementById("compareDescription").textContent=descriptions[name]||"Стандартизированное описание услуги.";go("compare");}
function renderHome(){
 const cg=document.getElementById("categoryGrid");cg.innerHTML=categories.map(c=>`<article class="category-card" data-cat="${c.name}"><div class="cat-icon">${c.icon}</div><div><div class="cat-name">${c.name}</div><div class="cat-count">${c.services.length} услуги</div></div><span class="cat-arrow">↗</span></article>`).join("");
 cg.querySelectorAll(".category-card").forEach(el=>el.onclick=()=>{selectedCategory=el.dataset.cat;renderCatalog();go("catalog");});
 document.getElementById("popularList").innerHTML=allServices.slice(0,6).map((s,i)=>`<div class="popular-row" data-service="${s.name}"><span class="popular-num">0${i+1}</span><span class="popular-name">${s.name}</span><span class="popular-category">${s.category}</span><span class="popular-arrow">↗</span></div>`).join("");
 document.querySelectorAll(".popular-row").forEach(el=>el.onclick=()=>openService(el.dataset.service));
}
function renderCatalog(){
 const filters=document.getElementById("categoryFilters");filters.innerHTML=["Все категории",...categories.map(c=>c.name)].map(c=>`<button class="${selectedCategory===c?"active":""}" data-filter="${c}">${c}</button>`).join("");
 filters.querySelectorAll("button").forEach(b=>b.onclick=()=>{selectedCategory=b.dataset.filter;renderCatalog();});
 const q=(document.getElementById("catalogQuery").value||"").toLowerCase();
 const list=categories.filter(c=>selectedCategory==="Все категории"||selectedCategory===c.name).map(c=>({...c,services:c.services.filter(s=>s.toLowerCase().includes(q))})).filter(c=>c.services.length);
 document.getElementById("catalogGroups").innerHTML=list.length?list.map(c=>`<section class="catalog-group"><div class="catalog-group-head"><h2>${c.name}</h2><span>${c.services.length} услуги</span></div><div class="service-grid">${c.services.map(s=>`<article class="service-card" data-service="${s}"><div><strong>${s}</strong><small>${descriptions[s]}</small></div><b>↗</b></article>`).join("")}</div></section>`).join(""):`<div class="empty-state"><h3>Ничего не найдено</h3><p>Попробуй изменить запрос или выбрать другую категорию.</p></div>`;
 document.querySelectorAll(".service-card").forEach(el=>el.onclick=()=>openService(el.dataset.service));
}
document.getElementById("catalogQuery").addEventListener("input",renderCatalog);
document.getElementById("heroSearch").addEventListener("submit",e=>{e.preventDefault();const q=document.getElementById("heroQuery").value.toLowerCase();const found=allServices.find(s=>s.name.toLowerCase().includes(q)||s.category.toLowerCase().includes(q));if(found)openService(found.name);else{document.getElementById("catalogQuery").value=document.getElementById("heroQuery").value;selectedCategory="Все категории";renderCatalog();go("catalog");}});
document.querySelectorAll("[data-search]").forEach(b=>b.onclick=()=>{document.getElementById("heroQuery").value=b.dataset.search;document.getElementById("heroSearch").requestSubmit();});
document.getElementById("menuToggle").onclick=()=>document.getElementById("mobileNav").classList.toggle("open");
document.getElementById("resetFilters").onclick=()=>{["districtFilter","statusFilter","minPrice","maxPrice"].forEach(id=>document.getElementById(id).value="");document.getElementById("sortSelect").value="asc";};
document.getElementById("mapService").innerHTML+=[...allServices].map(s=>`<option>${s.name}</option>`).join("");
renderHome();renderCatalog();
