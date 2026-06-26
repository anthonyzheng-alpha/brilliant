import type { MonsterSlot } from '../types/content'

export type ItemCategory = 'color' | MonsterSlot

export type ShopItem = {
  id: string
  name: string
  category: ItemCategory
  price: number
  // Hex value for color items; used to recolor the monster body.
  colorValue?: string
}

// Items granted to every learner for free so the monster always renders.
export const DEFAULT_COLOR = 'color-green'
export const DEFAULT_OWNED = [DEFAULT_COLOR]

export const SHOP_ITEMS: ShopItem[] = [
  // Body colors
  { id: 'color-green', name: 'Slime Green', category: 'color', price: 0, colorValue: '#5cb85c' },
  { id: 'color-blue', name: 'Ocean Blue', category: 'color', price: 50, colorValue: '#4a90d9' },
  { id: 'color-purple', name: 'Grape Purple', category: 'color', price: 100, colorValue: '#9b59b6' },
  { id: 'color-orange', name: 'Sunset Orange', category: 'color', price: 100, colorValue: '#e67e22' },
  { id: 'color-pink', name: 'Bubblegum Pink', category: 'color', price: 150, colorValue: '#e84393' },
  { id: 'color-gold', name: 'Royal Gold', category: 'color', price: 250, colorValue: '#f1c40f' },

  // Hats
  { id: 'hat-party', name: 'Party Hat', category: 'hat', price: 60 },
  { id: 'hat-top', name: 'Top Hat', category: 'hat', price: 150 },
  { id: 'hat-crown', name: 'Golden Crown', category: 'hat', price: 300 },

  // Eyes
  { id: 'eyes-sleepy', name: 'Sleepy Eyes', category: 'eyes', price: 40 },
  { id: 'eyes-star', name: 'Star Eyes', category: 'eyes', price: 90 },
  { id: 'eyes-cyclops', name: 'Cyclops Eye', category: 'eyes', price: 120 },

  // Accessories
  { id: 'acc-scarf', name: 'Cozy Scarf', category: 'accessory', price: 40 },
  { id: 'acc-glasses', name: 'Cool Glasses', category: 'accessory', price: 70 },
  { id: 'acc-bowtie', name: 'Bow Tie', category: 'accessory', price: 70 },
]

export const ITEMS_BY_ID: Record<string, ShopItem> = Object.fromEntries(
  SHOP_ITEMS.map((item) => [item.id, item]),
)

export const CATEGORY_LABELS: Record<ItemCategory, string> = {
  color: 'Colors',
  hat: 'Hats',
  eyes: 'Eyes',
  accessory: 'Accessories',
}

export const CATEGORY_ORDER: ItemCategory[] = ['color', 'eyes', 'hat', 'accessory']

export function getColorValue(colorId: string): string {
  return ITEMS_BY_ID[colorId]?.colorValue ?? '#5cb85c'
}
