export function categoryLabel(category: string): string {
  if (category === 'jewelery') return 'Jewelry'
  return category.replace(/\b\w/g, letter => letter.toUpperCase()).replace(/'S\b/g, "'s")
}
export const categoryImages: Record<string, string> = {
  electronics: '/images/headphones.jpg',
  jewelery: '/images/jewelry.jpg',
  "men's clothing": '/images/shirt.jpg',
  "women's clothing": '/images/fashion.jpg',
}
