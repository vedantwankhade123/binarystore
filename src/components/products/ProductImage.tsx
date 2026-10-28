import { useState, type ImgHTMLAttributes } from 'react'
import { PRODUCT_IMAGE_FALLBACK } from '../../services/productService'
export function ProductImage({src, alt, ...props}: ImgHTMLAttributes<HTMLImageElement>) {
  const [failedSource, setFailedSource] = useState<string>()
  return <img {...props} src={!src || failedSource === src ? PRODUCT_IMAGE_FALLBACK : src} alt={alt} onError={() => setFailedSource(src)} />
}
