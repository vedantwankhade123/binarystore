/** Image bytes belong in Cloudinary, never Firestore or Firebase Storage. */
export async function persistImage(url:string,_kind:'avatars'|'products'|'logos'){
 if(!url)return ''
 if(!url.startsWith('https://')||url.length>2048)throw new Error('Use the HTTPS URL of an image already uploaded to Cloudinary. Local files are previews only; Cloudinary upload will be connected separately.')
 return url
}
