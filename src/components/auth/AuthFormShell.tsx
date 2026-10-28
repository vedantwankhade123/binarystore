import type { ReactNode } from 'react'
import { Logo } from '../layout/HeaderFooter'
export function AuthFormShell({title,description,children,variant=''}:{title:string;description:string;children:ReactNode;variant?:string}){return <section className={`auth-form-panel auth-modern ${variant}`} aria-labelledby="auth-title"><Logo/><div className="auth-form-heading"><h1 id="auth-title">{title}</h1><p>{description}</p></div>{children}</section>}
