import type { ReactNode } from 'react'
export function SellerPageHeading({title,description,children}:{title:string;description:string;children?:ReactNode}){return <div className="seller-page-heading"><div><h1>{title}</h1><p>{description}</p></div>{children&&<div>{children}</div>}</div>}
