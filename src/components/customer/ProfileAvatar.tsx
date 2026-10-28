import { useState } from 'react'
import { profilePhotoSrc } from '../../lib/profilePhoto'

export function ProfileAvatar({src,name,large=false}:{src?:string;name:string;large?:boolean}) {
 const [failed,setFailed]=useState<string>()
 const image=profilePhotoSrc(src)
 return <span className={`avatar ${large?'large-avatar':''}`}>{image&&failed!==image?<img src={image} alt={`${name||'Your'} profile`} referrerPolicy="no-referrer" onError={()=>setFailed(image)}/>:name.trim().charAt(0).toUpperCase()||'B'}</span>
}
