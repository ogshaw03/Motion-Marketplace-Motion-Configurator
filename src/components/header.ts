import { h } from '../util/dom'
import { href } from '../router'

const NAV: [string, string][] = [
  ['/', 'Top'],
  ['/motions', 'Motions'],
  ['/configurator', 'Configurator'],
  ['/creators', 'Creators'],
  ['/library', 'My Library'],
  ['/purchase', 'Cart'],
]

export function AppHeader(): HTMLElement {
  const currentPath = window.location.hash.replace(/^#/, '') || '/'

  const navEl = h('nav', {}, NAV.map(([path, label]) => {
    const isActive =
      (path === '/' && currentPath === '/') ||
      (path !== '/' && currentPath.startsWith(path))
    return h('a', { href: href(path), class: isActive ? 'active' : '' }, [label])
  }))

  const logo = h('a', { href: href('/'), class: 'logo' }, [
    h('span', { class: 'mark' }, ['◆ ']),
    'MotionForge',
  ])

  return h('header', { class: 'app-header' }, [
    logo,
    navEl,
    h('div', { class: 'header-right' }, [
      h('span', { class: 'chip' }, ['MVP · Mock Mode']),
    ]),
  ])
}
