import { h } from '../util/dom'
import { AppHeader } from '../components/header'
import { MotionCard } from '../components/motion-card'
import type { Motion } from '../types'
import { href } from '../router'

export function LibraryPage(): HTMLElement {
  const owned = window.DB.motions.filter((m: Motion) => window.DB.ownedMotionIds.has(m.id))
  return h('div', { class: 'app-main' }, [
    AppHeader(),
    h('div', { class: 'page' }, [
      h('h1', {}, ['My Motion Library']),
      h('p', { class: 'sub' }, [
        '購入済みMotion。Configuratorから何度でも使用可能。Maya Buyer ToolでDownload可能。',
      ]),
      owned.length === 0
        ? h('div', { class: 'empty-state' }, [
            h('p', {}, ['まだMotionを購入していません。']),
            h('a', { class: 'btn primary', href: href('/motions') }, ['Explore Motions']),
          ])
        : h('div', { class: 'motions-grid' }, owned.map(MotionCard)),
    ]),
  ])
}
