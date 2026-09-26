import {
  Armchair,
  Baby,
  Backpack,
  BedDouble,
  Bike,
  BookOpen,
  Camera,
  Car,
  Coffee,
  CookingPot,
  Droplets,
  Dumbbell,
  Ellipsis,
  Flower2,
  Footprints,
  Gamepad2,
  Gem,
  Glasses,
  Gift,
  Guitar,
  Headphones,
  Heart,
  Lamp,
  Laptop,
  Monitor,
  Music,
  Package,
  PawPrint,
  Pill,
  Plane,
  Refrigerator,
  Scissors,
  Shirt,
  Smartphone,
  Sofa,
  Sparkles,
  Sprout,
  Stethoscope,
  Tv,
  Utensils,
  WashingMachine,
  Wallet,
  Watch,
  Wine,
  type LucideIcon,
} from 'lucide-react'
import type { Category } from '../types'

export const ICONS: Record<string, LucideIcon> = {
  smartphone: Smartphone,
  laptop: Laptop,
  monitor: Monitor,
  tv: Tv,
  headphones: Headphones,
  camera: Camera,
  watch: Watch,
  gamepad2: Gamepad2,
  shirt: Shirt,
  footprints: Footprints,
  glasses: Glasses,
  backpack: Backpack,
  gem: Gem,
  sparkles: Sparkles,
  droplets: Droplets,
  scissors: Scissors,
  dumbbell: Dumbbell,
  bike: Bike,
  car: Car,
  plane: Plane,
  sofa: Sofa,
  armchair: Armchair,
  'bed-double': BedDouble,
  lamp: Lamp,
  refrigerator: Refrigerator,
  'washing-machine': WashingMachine,
  'cooking-pot': CookingPot,
  utensils: Utensils,
  coffee: Coffee,
  wine: Wine,
  'book-open': BookOpen,
  music: Music,
  guitar: Guitar,
  flower2: Flower2,
  sprout: Sprout,
  baby: Baby,
  'paw-print': PawPrint,
  package: Package,
  gift: Gift,
  heart: Heart,
  wallet: Wallet,
  stethoscope: Stethoscope,
  pill: Pill,
  other: Ellipsis,
}

export const ICON_KEYS = Object.keys(ICONS)

export function iconComp(key: string | null | undefined): LucideIcon {
  return (key && ICONS[key]) || ICONS.other
}

/** 分类头像配色（按 id 稳定取色，冷色调） */
const COLOR_CLASSES = [
  'bg-sky-100 text-sky-600',
  'bg-cyan-100 text-cyan-600',
  'bg-teal-100 text-teal-600',
  'bg-emerald-100 text-emerald-600',
  'bg-green-100 text-green-600',
  'bg-blue-100 text-blue-600',
  'bg-indigo-100 text-indigo-600',
  'bg-violet-100 text-violet-600',
  'bg-purple-100 text-purple-600',
  'bg-slate-100 text-slate-600',
]

export function categoryColor(id: string): string {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return COLOR_CLASSES[h % COLOR_CLASSES.length]
}

/** 图表配色由 chartPalette（lib/color.ts）按主题动态派生，保证与主题统一 */

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'c_digital', name: '数码', icon: 'smartphone' },
  { id: 'c_computer', name: '电脑', icon: 'laptop' },
  { id: 'c_clothes', name: '服饰', icon: 'shirt' },
  { id: 'c_shoes', name: '鞋包', icon: 'footprints' },
  { id: 'c_beauty', name: '美妆', icon: 'sparkles' },
  { id: 'c_skincare', name: '护肤', icon: 'droplets' },
  { id: 'c_sports', name: '运动', icon: 'dumbbell' },
  { id: 'c_home', name: '家居', icon: 'sofa' },
  { id: 'c_kitchen', name: '厨房', icon: 'cooking-pot' },
  { id: 'c_book', name: '图书', icon: 'book-open' },
  { id: 'c_toy', name: '玩具', icon: 'gamepad2' },
  { id: 'c_other', name: '其他', icon: 'other' },
]
