import type { CartLine } from '../types/customer'
export const money = (value:number) => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(value)
export const clampQuantity = (value:number) => Math.max(1,Math.min(99,Math.floor(value)||1))
/** Client estimates; trusted checkout validates prices and stock on the server. */
export function calculateTotals(items:CartLine[]) {
  const cents=items.reduce((sum,line)=>sum+Math.round(line.product.price*100)*line.quantity,0)
  const shipping=items.length && cents<7500 ? 595 : 0
  return {subtotal:cents/100,shipping:shipping/100,total:(cents+shipping)/100,count:items.reduce((sum,line)=>sum+line.quantity,0)}
}
