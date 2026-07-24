import './styles.css'
import { initDB } from './db'
import { defineRoutes, initRouter } from './router'
import { TopPage } from './pages/top'
import { MotionsPage } from './pages/motions'
import { MotionDetailPage } from './pages/motion-detail'
import { ConfiguratorPage } from './pages/configurator'
import { LibraryPage } from './pages/library'
import { PurchasePage } from './pages/purchase'
import { CreatorsPage, CreatorDetailPage } from './pages/creators'

initDB()

defineRoutes([
  { path: '/', render: () => TopPage() },
  { path: '/motions', render: () => MotionsPage() },
  { path: '/motion/:id', render: (p) => MotionDetailPage(p) },
  { path: '/configurator', render: (p) => ConfiguratorPage(p) },
  { path: '/library', render: () => LibraryPage() },
  { path: '/purchase', render: () => PurchasePage() },
  { path: '/creators', render: () => CreatorsPage() },
  { path: '/creator/:id', render: (p) => CreatorDetailPage(p) },
])

const app = document.getElementById('app')
if (!app) throw new Error('app root missing')
initRouter(app)
