import {
  AddEntryIcon,
  ControlsIcon,
  HomeIcon,
  LedgerIcon,
  PortfolioIcon,
} from '../components/AppIcons'

export const navigationItems = [
  {
    label: 'Home',
    path: '/home',
    icon: HomeIcon,
  },
  {
    label: 'Portfolio',
    path: '/portfolio',
    icon: PortfolioIcon,
  },
  {
    label: 'Add',
    path: '/add',
    icon: AddEntryIcon,
  },
  {
    label: 'Transactions',
    path: '/transactions',
    icon: LedgerIcon,
  },
  {
    label: 'Settings',
    path: '/settings',
    icon: ControlsIcon,
  },
]
