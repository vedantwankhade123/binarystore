import type { LucideIcon } from 'lucide-react'
export function DashboardStatCard({title,value,detail,icon:Icon}:{title:string;value:string|number;detail:string;icon:LucideIcon}){return <article className="dashboard-stat"><div><span>{title}</span><Icon size={19}/></div><strong>{value}</strong><small>{detail}</small></article>}
