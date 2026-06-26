import type { ReactNode } from 'react'
import type { MonsterProfile } from '../../types/content'
import { getColorValue } from '../../lib/shop'

type Props = {
  bodyColor: string
  equipped: MonsterProfile['equipped']
  size?: number
  className?: string
}

// Default eyes used when no eye item is equipped.
function DefaultEyes() {
  return (
    <>
      <circle cx="48" cy="58" r="11" fill="#fff" stroke="#2b2b2b" strokeWidth="2" />
      <circle cx="72" cy="58" r="11" fill="#fff" stroke="#2b2b2b" strokeWidth="2" />
      <circle cx="50" cy="60" r="4.5" fill="#2b2b2b" />
      <circle cx="74" cy="60" r="4.5" fill="#2b2b2b" />
    </>
  )
}

// Eye item id -> SVG. Returning non-null overrides the default eyes.
const EYES: Record<string, () => ReactNode> = {
  'eyes-sleepy': () => (
    <>
      <circle cx="48" cy="58" r="11" fill="#fff" stroke="#2b2b2b" strokeWidth="2" />
      <circle cx="72" cy="58" r="11" fill="#fff" stroke="#2b2b2b" strokeWidth="2" />
      <path d="M40 60 q8 6 16 0" fill="none" stroke="#2b2b2b" strokeWidth="3" strokeLinecap="round" />
      <path d="M64 60 q8 6 16 0" fill="none" stroke="#2b2b2b" strokeWidth="3" strokeLinecap="round" />
    </>
  ),
  'eyes-star': () => (
    <>
      <circle cx="48" cy="58" r="11" fill="#fff" stroke="#2b2b2b" strokeWidth="2" />
      <circle cx="72" cy="58" r="11" fill="#fff" stroke="#2b2b2b" strokeWidth="2" />
      <path d="M48 51 l2.2 4.5 5 .7 -3.6 3.5 .9 5 -4.5-2.4 -4.5 2.4 .9-5 -3.6-3.5 5-.7z" fill="#f1c40f" />
      <path d="M72 51 l2.2 4.5 5 .7 -3.6 3.5 .9 5 -4.5-2.4 -4.5 2.4 .9-5 -3.6-3.5 5-.7z" fill="#f1c40f" />
    </>
  ),
  'eyes-cyclops': () => (
    <>
      <circle cx="60" cy="56" r="16" fill="#fff" stroke="#2b2b2b" strokeWidth="2" />
      <circle cx="62" cy="58" r="6.5" fill="#2b2b2b" />
      <circle cx="59" cy="55" r="2.2" fill="#fff" />
    </>
  ),
}

// Hat item id -> SVG, drawn above the body.
const HATS: Record<string, () => ReactNode> = {
  'hat-party': () => (
    <>
      <path d="M60 2 L74 30 L46 30 Z" fill="#e84393" stroke="#2b2b2b" strokeWidth="2" />
      <circle cx="60" cy="2" r="4" fill="#f1c40f" stroke="#2b2b2b" strokeWidth="1.5" />
      <circle cx="55" cy="20" r="2.2" fill="#fff" />
      <circle cx="64" cy="25" r="2.2" fill="#fff" />
    </>
  ),
  'hat-top': () => (
    <>
      <rect x="40" y="26" width="40" height="6" rx="3" fill="#2b2b2b" />
      <rect x="47" y="4" width="26" height="24" rx="3" fill="#2b2b2b" />
      <rect x="47" y="18" width="26" height="5" fill="#c0392b" />
    </>
  ),
  'hat-crown': () => (
    <>
      <path
        d="M42 30 L42 14 L52 22 L60 10 L68 22 L78 14 L78 30 Z"
        fill="#f1c40f"
        stroke="#b8860b"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="60" cy="18" r="2.6" fill="#e84393" />
      <circle cx="46" cy="26" r="2.2" fill="#4a90d9" />
      <circle cx="74" cy="26" r="2.2" fill="#4a90d9" />
    </>
  ),
}

// Accessory item id -> SVG, drawn over the face/body.
const ACCESSORIES: Record<string, () => ReactNode> = {
  'acc-glasses': () => (
    <>
      <circle cx="48" cy="58" r="13" fill="none" stroke="#2b2b2b" strokeWidth="3" />
      <circle cx="72" cy="58" r="13" fill="none" stroke="#2b2b2b" strokeWidth="3" />
      <line x1="61" y1="56" x2="59" y2="56" stroke="#2b2b2b" strokeWidth="3" />
    </>
  ),
  'acc-bowtie': () => (
    <>
      <path d="M60 92 L48 86 L48 98 Z" fill="#c0392b" stroke="#2b2b2b" strokeWidth="1.5" />
      <path d="M60 92 L72 86 L72 98 Z" fill="#c0392b" stroke="#2b2b2b" strokeWidth="1.5" />
      <circle cx="60" cy="92" r="3.5" fill="#922b21" stroke="#2b2b2b" strokeWidth="1.5" />
    </>
  ),
  'acc-scarf': () => (
    <>
      <path d="M40 90 q20 12 40 0 l0 8 q-20 10 -40 0 Z" fill="#4a90d9" stroke="#2b2b2b" strokeWidth="1.5" />
      <path d="M58 96 l-3 16 l8 0 l-3 -16 Z" fill="#357abd" stroke="#2b2b2b" strokeWidth="1.5" />
    </>
  ),
}

export function Monster({ bodyColor, equipped, size = 160, className }: Props) {
  const color = getColorValue(bodyColor)
  const eyeItem = equipped.eyes
  const hatItem = equipped.hat
  const accItem = equipped.accessory

  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Your monster"
    >
      {/* Feet */}
      <ellipse cx="46" cy="104" rx="11" ry="7" fill={color} stroke="#2b2b2b" strokeWidth="2" />
      <ellipse cx="74" cy="104" rx="11" ry="7" fill={color} stroke="#2b2b2b" strokeWidth="2" />

      {/* Antennae */}
      <line x1="48" y1="30" x2="42" y2="14" stroke="#2b2b2b" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="72" y1="30" x2="78" y2="14" stroke="#2b2b2b" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="42" cy="13" r="3.5" fill={color} stroke="#2b2b2b" strokeWidth="2" />
      <circle cx="78" cy="13" r="3.5" fill={color} stroke="#2b2b2b" strokeWidth="2" />

      {/* Body */}
      <path
        d="M60 26
           C86 26 96 46 96 70
           C96 92 82 102 60 102
           C38 102 24 92 24 70
           C24 46 34 26 60 26 Z"
        fill={color}
        stroke="#2b2b2b"
        strokeWidth="2.5"
      />
      {/* Belly highlight */}
      <ellipse cx="60" cy="78" rx="22" ry="16" fill="#ffffff" opacity="0.18" />

      {/* Eyes */}
      {eyeItem && EYES[eyeItem] ? EYES[eyeItem]() : <DefaultEyes />}

      {/* Mouth (hidden behind cyclops? keep, looks fine) */}
      <path d="M50 80 q10 9 20 0" fill="none" stroke="#2b2b2b" strokeWidth="3" strokeLinecap="round" />

      {/* Accessory over the face/neck */}
      {accItem && ACCESSORIES[accItem]?.()}

      {/* Hat on top, drawn last so it sits above everything */}
      {hatItem && HATS[hatItem]?.()}
    </svg>
  )
}
