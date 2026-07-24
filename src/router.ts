export type Route = {
  path: string
  render: (params: Record<string, string>) => HTMLElement | Promise<HTMLElement>
  onLeave?: () => void
}

let routes: Route[] = []
let currentOnLeave: (() => void) | undefined
let mountEl: HTMLElement | null = null

export function defineRoutes(rs: Route[]): void {
  routes = rs
}

function matchRoute(hash: string): { route: Route; params: Record<string, string> } | null {
  const withoutHash = hash.replace(/^#/, '') || '/'
  const path = withoutHash.split('?')[0]
  for (const route of routes) {
    const routeParts = route.path.split('/').filter(Boolean)
    const pathParts = path.split('/').filter(Boolean)
    if (routeParts.length !== pathParts.length && !route.path.endsWith('*')) continue
    const params: Record<string, string> = {}
    let ok = true
    for (let i = 0; i < routeParts.length; i++) {
      const rp = routeParts[i]
      const pp = pathParts[i]
      if (rp.startsWith(':')) {
        if (pp == null) {
          ok = false
          break
        }
        params[rp.slice(1)] = decodeURIComponent(pp)
      } else if (rp !== pp) {
        ok = false
        break
      }
    }
    if (ok) return { route, params }
  }
  return null
}

export async function navigate(hash: string): Promise<void> {
  if (!mountEl) return
  const m = matchRoute(hash)
  if (currentOnLeave) currentOnLeave()
  currentOnLeave = undefined
  while (mountEl.firstChild) mountEl.removeChild(mountEl.firstChild)
  if (!m) {
    const div = document.createElement('div')
    div.className = 'page'
    div.innerHTML = '<h1>Not found</h1><p class="sub">No route matched.</p>'
    mountEl.appendChild(div)
    return
  }
  const el = await m.route.render(m.params)
  mountEl.appendChild(el)
  currentOnLeave = m.route.onLeave
  window.scrollTo(0, 0)
  window.__APP_READY__ = true
}

export function initRouter(el: HTMLElement): void {
  mountEl = el
  window.addEventListener('hashchange', () => {
    navigate(window.location.hash)
  })
  if (!window.location.hash) window.location.hash = '#/'
  navigate(window.location.hash)
}

export function href(path: string): string {
  return `#${path}`
}
