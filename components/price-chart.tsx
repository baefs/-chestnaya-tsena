"use client";
import {Bar,BarChart,CartesianGrid,ResponsiveContainer,Tooltip,XAxis,YAxis} from "recharts";
type Point={label:string;count:number};
export function PriceChart({data}:{data:Point[]}){if(!data.length)return <div className="empty">Недостаточно данных для графика.</div>;return <div style={{width:"100%",height:300}}><ResponsiveContainer><BarChart data={data} margin={{top:12,right:12,left:0,bottom:8}}><CartesianGrid strokeDasharray="3 3" stroke="#e8eae3"/><XAxis dataKey="label" tick={{fontSize:11}}/><YAxis allowDecimals={false} tick={{fontSize:11}}/><Tooltip/><Bar dataKey="count" name="Предложений" fill="#8ca85c" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></div>}
