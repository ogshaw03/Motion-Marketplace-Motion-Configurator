import { h } from '../util/dom'
import { AppHeader } from '../components/header'
import { MotionCard } from '../components/motion-card'
import { href } from '../router'

const ENTRIES: [string, string, string, string][] = [
  ['01', 'Explore Motions', '単品Motionから探す。Style別、Creator別に絞り込み可能。', '/motions'],
  ['02', 'Build a Sequence', 'ConfiguratorでMotionを組み合わせて動きの流れを作る。', '/configurator'],
  ['03', 'Featured Sequences', 'おすすめSequenceからカスタマイズを始める。', '/#featured'],
  ['04', 'Explore Creators', 'AnimatorからMotionを探す。', '/creators'],
]

export function TopPage(): HTMLElement {
  const featuredMotions = window.DB.motions.slice(0, 8)
  const featuredSeq = window.DB.featuredSequences

  return h('div', { class: 'app-main' }, [
    AppHeader(),
    h('div', { class: 'page' }, [
      h('div', { class: 'hero' }, [
        h('div', { class: 'tag' }, ['Animator-Crafted Motion × Motion Configurator']),
        h('h1', {}, [
          'プロのアニメーターがデザインした動きを、',
          h('br', {}, []),
          'Web上で組み合わせて試して買う。',
        ]),
        h('p', { class: 'lead' }, [
          'Run → Designed Transition → Jump → Landing。',
          'カーコンフィギュレーター型の3D Configuratorで、',
          '一連のSequenceとして構築・Preview・購入できるMotion Marketplace。',
        ]),
        h('div', { class: 'cta-row' }, [
          h('a', { class: 'btn primary', href: href('/configurator') }, ['Configuratorを開く']),
          h('a', { class: 'btn ghost', href: href('/motions') }, ['Motionを探す']),
        ]),
      ]),

      h('div', { class: 'entry-grid' },
        ENTRIES.map(([num, title, desc, path]) =>
          h('a', { class: 'entry-card', href: href(path) }, [
            h('span', { class: 'num' }, [num]),
            h('h3', {}, [title]),
            h('p', {}, [desc]),
          ]),
        ),
      ),

      h('div', { class: 'section-title' }, [
        h('h2', {}, ['Featured Sequences']),
        h('a', { class: 'link', href: href('/configurator') }, ['Customize in Configurator →']),
      ]),
      h('div', { class: 'featured-grid', id: 'featured' },
        featuredSeq.map((s) =>
          h('a', { class: 'featured-card', href: href(`/configurator?seq=${s.id}`) }, [
            h('div', {
              class: 'banner',
              style: `background: linear-gradient(120deg, ${s.thumbColor} 0%, #12141c 100%);`,
            }, [s.name]),
            h('div', { class: 'body' }, [
              h('h3', {}, [s.name]),
              h('p', {}, [s.description]),
              h('div', { class: 'step-tags' },
                s.steps.map((step) => {
                  const m = window.DB.motions.find((mm) => mm.id === step.motionId)
                  return h('span', { class: 'step-tag' }, [m?.name ?? '?'])
                }),
              ),
              h('span', { class: 'btn small' }, ['Customize →']),
            ]),
          ]),
        ),
      ),

      h('div', { class: 'section-title' }, [
        h('h2', {}, ['Featured Motions']),
        h('a', { class: 'link', href: href('/motions') }, ['See all →']),
      ]),
      h('div', { class: 'motions-grid' }, featuredMotions.map(MotionCard)),
    ]),
  ])
}
