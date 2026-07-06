import {
  LayoutDashboard,
  Server,
  HardDrive,
  Network,
  Shield,
  Users,
  Bot,
  Settings,
  Activity,
  Layers,
} from 'lucide-vue-next'

export default [
  {
    title: 'Dashboard',

    icon: LayoutDashboard,

    path: '/',
  },

  {
    title: 'Instances',

    icon: Server,

    path: '/compute',
  },

  {
    title: 'Volumes',

    icon: HardDrive,

    path: '/storage',
  },

  {
    title: 'Networking',

    icon: Network,

    path: '/network',
  },

  {
    title: 'Load Balancers',

    icon: Shield,

    path: '/load-balancers',
  },

  {
    title: 'Orchestration',

    icon: Layers,

    path: '/orchestration',
  },

  {
    title: 'Identity',

    icon: Users,

    path: '/identity',
  },

  {
    title: 'Monitoring',

    icon: Activity,

    path: '/monitoring',
  },

  {
    title: 'AI Assistant',

    icon: Bot,

    path: '/ai',
  },

  {
    title: 'Settings',

    icon: Settings,

    path: '/settings',
  },
]
