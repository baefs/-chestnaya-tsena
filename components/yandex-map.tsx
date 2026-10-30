"use client";
import Script from "next/script";
import {useCallback,useRef} from "react";
declare global{interface Window{ymaps?:any}}
type Point={id:string;name:string;address:string;lat:number;lng:number;details:string;href:string};
export function YandexMap({points}:{points:Point[]}){
 const ref=useRef<HTMLDivElement>(null);const mapRef=useRef<any>(null);
 const init=useCallback(()=>{if(!window.ymaps||!ref.current)return;window.ymaps.ready(()=>{if(mapRef.current)return;const center=points.length?[points[0].lat,points[0].lng]:[55.751244,37.618423];mapRef.current=new window.ymaps.Map(ref.current,{center,zoom:10,controls:["zoomControl","fullscreenControl"]});points.forEach(p=>{const html=p.address+"<br/>"+p.details+'<br/><a href="'+p.href+'">Карточка организации</a>';const marker=new window.ymaps.Placemark([p.lat,p.lng],{balloonContentHeader:p.name,balloonContentBody:html},{preset:"islands#darkGreenDotIcon"});mapRef.current.geoObjects.add(marker);});if(points.length>1)mapRef.current.setBounds(mapRef.current.geoObjects.getBounds(),{checkZoomRange:true,zoomMargin:30});});},[points]);
 const key=process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY;
 return <><div ref={ref} style={{height:520,width:"100%",borderRadius:14,overflow:"hidden",background:"#e8eae3"}}/>{key?<Script src={"https://api-maps.yandex.ru/2.1/?apikey="+key+"&lang=ru_RU"} strategy="afterInteractive" onReady={init}/>:<div className="notice" style={{marginTop:12}}>Для загрузки Яндекс Карт добавь NEXT_PUBLIC_YANDEX_MAPS_API_KEY в переменные окружения Vercel.</div>}</>;
}
