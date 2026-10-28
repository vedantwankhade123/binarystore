/** Google photos use a fixed, same-origin proxy so browser referrers and Google cookies are not needed. */
export function profilePhotoSrc(value:string|undefined):string {
 if(!value)return ''
 try {
  const url=new URL(value)
  if(url.protocol==='https:'&&url.hostname==='lh3.googleusercontent.com'&&!url.username&&!url.password&&/^\/a(?:-)?\//.test(url.pathname)) {
   return `/profile-image/google${url.pathname}${url.search}`
  }
 }catch{return ''}
 return value
}

export function isGoogleProfilePhoto(value:string|undefined):boolean {
 if(!value)return false
 try{const url=new URL(value);return url.protocol==='https:'&&(url.hostname==='googleusercontent.com'||url.hostname.endsWith('.googleusercontent.com')||url.hostname.endsWith('.ggpht.com'))}catch{return false}
}

/** Keep custom images. Refresh provider photos, or import a newly linked Google photo into an empty legacy profile. */
export function updatedProfilePhoto(saved:string,authPhoto:string|null):string {
 return authPhoto&&(!saved||isGoogleProfilePhoto(saved))?authPhoto:saved
}
