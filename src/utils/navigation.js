import { ChartNoAxesColumn, CirclePlus, House, ReceiptText, SlidersHorizontal } from 'lucide-react'

export const navigationItems = [
  {
    label: 'Home',
    path: '/home',
    icon: House,
  },
  {
    label: 'Portfolio',
    path: '/portfolio',
    icon: ChartNoAxesColumn,
  },
  {
    label: 'Add',
    path: '/add',
    icon: CirclePlus,
  },
  {
    label: 'Transactions',
    path: '/transactions',
    icon: ReceiptText,
  },
  {
    label: 'Settings',
    path: '/settings',
    icon: SlidersHorizontal,
  },
]
