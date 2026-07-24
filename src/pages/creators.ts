import { h } from '../util/dom'
import { AppHeader } from '../components/header'
import { MotionCard } from '../components/motion-card'
import type { Creator, Motion } from '../types'
import { href } from '../router'

export function CreatorsPage(): HTMLElement {
  return h('div', { class: 'app-main' }, [
    AppHeader(),
    h('div', { class: 'page' }, [
      h('h1', {}, ['Creators']),
      h('p', { class: 'sub' }, [
        'Animator Marketplace。Motionをデザイン・調整・品質保証するプロたち。',
      ]),
      h('div', { class: 'creator-grid' },
        window.DB.creators.map((c: Creator) => {
          const motionCount = window.DB.motions.filter((m: Motion) => m.creatorId === c.id).length
          return h('a', { class: 'creator-card', href: href(`/creator/${c.id}`) }, [
            h('div', { class: 'avatar', style: `background: ${c.icon}` }, []),
            h('div', { style: 'flex: 1; min-width: 0;' }, [
              h('h3', {}, [
                c.name,
                c.displayMode === 'Private'
                  ? h('span', { class: 'chip', style: 'margin-left: 6px; font-size: 10px;' }, ['Private'])
                  : c.displayMode === 'Alias'
                    ? h('span', { class: 'chip', style: 'margin-left: 6px; font-size: 10px;' }, ['Alias'])
                    : null,
              ]),
              h('p', {}, [c.bio || 'Private profile']),
              h('div', { style: 'display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 6px;' },
                c.specialty.map((s: string) => h('span', { class: 'chip', style: 'font-size: 10px;' }, [s])),
              ),
              h('div', { style: 'color: var(--text-mute); font-size: 12px;' }, [`${motionCount} motions`]),
            ]),
          ])
        }),
      ),
    ]),
  ])
}

export function CreatorDetailPage(params: Record<string, string>): HTMLElement {
  const creator = window.DB.creators.find((c: Creator) => c.id === params.id)
  if (!creator) {
    return h('div', { class: 'app-main' }, [
      AppHeader(),
      h('div', { class: 'page' }, [h('h1', {}, ['Creator not found'])]),
    ])
  }
  const motions = window.DB.motions.filter((m: Motion) => m.creatorId === creator.id)
  return h('div', { class: 'app-main' }, [
    AppHeader(),
    h('div', { class: 'page' }, [
      h('div', { class: 'creator-header' }, [
        h('div', { class: 'avatar-lg', style: `background: ${creator.icon}` }, []),
        h('div', { style: 'flex: 1;' }, [
          h('h1', {}, [
            creator.name,
            creator.displayMode !== 'Public'
              ? h('span', {
                  class: 'chip',
                  style: 'margin-left: 8px; font-size: 12px; vertical-align: middle;',
                }, [creator.displayMode])
              : null,
          ]),
          h('p', { style: 'color: var(--text-dim); margin: 4px 0 8px 0;' }, [
            creator.bio || 'This creator has chosen to keep their profile private.',
          ]),
          h('div', { style: 'display: flex; gap: 6px;' },
            creator.specialty.map((s: string) => h('span', { class: 'chip' }, [s])),
          ),
        ]),
      ]),
      h('div', { class: 'section-title' }, [h('h2', {}, [`Motions (${motions.length})`])]),
      h('div', { class: 'motions-grid' }, motions.map(MotionCard)),
    ]),
  ])
}
