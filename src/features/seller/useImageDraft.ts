import { useEffect, useRef, useState } from 'react'
import type { SellerImage } from '../../types/seller'
import {discardImage} from '../../services/cloudinary'
import { revokeImages } from './logic'
/** Draft URLs belong to the form until saved, then ownership passes to the seller store. */
export function useImageDraft(initial:SellerImage[]){const [images,setImages]=useState(initial),created=useRef(new Map<string,SellerImage>()),initialUrls=useRef(new Set(initial.map(i=>i.url)))
 const change=(next:SellerImage[])=>{for(const image of next)if(!initialUrls.current.has(image.url))created.current.set(image.url,image);for(const [url,image]of created.current)if(!next.some(i=>i.url===url)){revokeImages([image]);if(image.publicId)void discardImage(image.id);created.current.delete(url)}setImages(next)}
 useEffect(()=>{const urls=created.current;return()=>{for(const image of urls.values())if(image.publicId)void discardImage(image.id);revokeImages([...urls.values()])}},[])
 return {images,change,commit:(saved?:SellerImage[])=>{revokeImages([...created.current.values()]);created.current.clear();if(saved){setImages(saved);initialUrls.current=new Set(saved.map(i=>i.url))}else initialUrls.current=new Set(images.map(i=>i.url))}}
}
