export type Theme = 'light' | 'dark' | 'midnight' | 'forest' | 'sunset' | 'ocean'

export type ThemeOption = {
  id: Theme
  label: string
  swatch: string
}

export const THEMES: ThemeOption[] = [
  { id: 'light', label: 'Light', swatch: '#cccccc' },
  { id: 'dark', label: 'Dark', swatch: '#a78bfa' },
  { id: 'midnight', label: 'Midnight', swatch: '#60a5fa' },
  { id: 'forest', label: 'Forest', swatch: '#34d399' },
  { id: 'sunset', label: 'Sunset', swatch: '#fb923c' },
  { id: 'ocean', label: 'Ocean', swatch: '#22d3ee' },
]

export const DEFAULT_THEME: Theme = 'dark'

export function isTheme(value: unknown): value is Theme {
  return THEMES.some((t) => t.id === value)
}
