import { h } from '../util/dom'
import { AppHeader } from '../components/header'
import { MotionCard } from '../components/motion-card'
import type { Motion, Style, MotionCategory } from '../types'

const STYLES: (Style | 'All')[] = ['All', 'Anime', 'Stylized', 'Realistic', 'Cinematic', 'Cartoon']
const CATS: (MotionCategory | 'All')[] = ['All', 'Locomotion', 'Action', 'Transition', 'Idle', 'Acting']

export function MotionsPage(): HTMLElement {
  let selectedStyle: Style | 'All' = 'All'
  let selectedCat: MotionCategory | 'All' = 'All'
  let designedOnly = false

  const grid = h('div', { class: 'motions-grid' }, [])

  function apply() {
    while (grid.firstChild) grid.removeChild(grid.firstChild)
    const filtered = window.DB.motions.filter((m: Motion) => {
      if (selectedStyle !== 'All' && m.style !== selectedStyle) return false
      if (selectedCat !== 'All' && m.category !== selectedCat) return false
      if (designedOnly && !m.isDesignedTransition) return false
      return true
    })
    if (filtered.length === 0) {
      grid.appendChild(h('div', { class: 'empty-state' }, ['該当するMotionが見つかりません。']))
    } else {
      filtered.forEach((m: Motion) => grid.appendChild(MotionCard(m)))
    }
  }

  const styleBar = h('div', { class: 'filter-bar' }, [
    h('span', { class: 'label' }, ['STYLE']),
    ...STYLES.map((s) =>
      h('button', {
        class: `filter ${s === selectedStyle ? 'active' : ''}`,
        'data-style': s,
        onclick: (e: Event) => {
          selectedStyle = s
          styleBar.querySelectorAll('.filter').forEach((b) => b.classList.remove('active'))
          ;(e.currentTarget as HTMLElement).classList.add('active')
          apply()
        },
      }, [s]),
    ),
  ])

  const catBar = h('div', { class: 'filter-bar' }, [
    h('span', { class: 'label' }, ['CATEGORY']),
    ...CATS.map((c) =>
      h('button', {
        class: `filter ${c === selectedCat ? 'active' : ''}`,
        'data-cat': c,
        onclick: (e: Event) => {
          selectedCat = c
          catBar.querySelectorAll('.filter').forEach((b) => b.classList.remove('active'))
          ;(e.currentTarget as HTMLElement).classList.add('active')
          apply()
        },
      }, [c]),
    ),
    h('span', { style: 'flex: 1', class: 'label' }, ['']),
    h('button', {
      class: 'filter',
      onclick: (e: Event) => {
        designedOnly = !designedOnly
        ;(e.currentTarget as HTMLElement).classList.toggle('active', designedOnly)
        apply()
      },
    }, ['Designed Transition Only']),
  ])

  apply()

  return h('div', { class: 'app-main' }, [
    AppHeader(),
    h('div', { class: 'page' }, [
      h('h1', {}, ['Explore Motions']),
      h('p', { class: 'sub' }, ['単品Motionから探す。Configuratorへ追加、詳細確認、購入ができます。']),
      styleBar,
      catBar,
      grid,
    ]),
  ])
}
