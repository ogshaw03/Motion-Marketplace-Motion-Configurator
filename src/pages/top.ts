import { h } from '../util/dom'
import { AppHeader } from '../components/header'
import { MotionCard } from '../components/motion-card'
import { href } from '../router'
import { createPreview, type PreviewController } from '../three/preview'

export function TopPage(): HTMLElement {
  const featuredMotions = window.DB.motions.slice(0, 8)
  const featuredSeq = window.DB.featuredSequences

  const previewHost = h('div', { class: 'hero-preview' }, [])
  let preview: PreviewController | null = null
  queueMicrotask(() => {
    preview = createPreview({ background: 0x14161d, showGround: true })
    previewHost.appendChild(preview.el)
    preview.setSequence([
      { clip: 'run', durationSec: 0.6, loopCount: 3 },
      { clip: 'takeoff', durationSec: 0.5, loopCount: 1 },
      { clip: 'jump', durationSec: 0.9, loopCount: 1 },
      { clip: 'landing', durationSec: 0.8, loopCount: 1 },
      { clip: 'idle', durationSec: 1.0, loopCount: 2 },
    ])
  })

  const scrollToFeatured = (e: Event) => {
    e.preventDefault()
    const el = document.getElementById('main-door')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const root = h('div', { class: 'app-main' }, [
    AppHeader(),
    h('div', { class: 'page' }, [
      // Hero: minimal copy, one CTA
      h('div', { class: 'hero' }, [
        previewHost,
        h('div', { style: 'position: relative; z-index: 2; max-width: 560px;' }, [
          h('div', { class: 'tag' }, ['Animator-Crafted Motion × Motion Configurator']),
          h('h1', {}, [
            'プロが作った動きを、',
            h('br', {}, []),
            'Webで組み立てて試す。',
          ]),
          h('p', { class: 'lead' }, [
            '完成された動きの例から始めて、気に入った1つを自分の作品向けに組み替える。',
          ]),
          h('div', { class: 'cta-row' }, [
            h('a', {
              class: 'btn primary',
              href: '#main-door',
              onclick: scrollToFeatured,
            }, ['▶ 完成した動きの例を見る']),
          ]),
        ]),
      ]),

      // Main door: Featured Sequences
      h('div', { id: 'main-door' }, []),
      h('div', { class: 'main-section-title' }, [
        h('span', { class: 'mark' }, []),
        h('h2', {}, ['完成した動きから始める']),
        h('span', { class: 'desc' }, [
          '一連の動きを触ってみて、気に入った1つを自分用にカスタマイズ',
        ]),
      ]),
      h('div', { class: 'featured-grid' },
        featuredSeq.map((s) =>
          h('a', { class: 'featured-card', href: href(`/configurator?seq=${s.id}`) }, [
            h('div', {
              class: 'banner',
              style: `background: linear-gradient(120deg, ${s.thumbColor} 0%, #1a1c26 100%);`,
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
              h('div', { class: 'cta' }, ['この構成をカスタマイズ →']),
            ]),
          ]),
        ),
      ),

      // Sub doors: small
      h('div', { class: 'mini-section-title' }, ['または、別の入口から']),
      h('div', { class: 'sub-doors' }, [
        h('a', { class: 'sub-door', href: href('/motions') }, [
          h('span', { class: 'icon' }, ['🔍']),
          h('span', { class: 'txt' }, ['Motionを個別に探す']),
          h('span', { class: 'arrow' }, ['→']),
        ]),
        h('a', { class: 'sub-door', href: href('/creators') }, [
          h('span', { class: 'icon' }, ['✎']),
          h('span', { class: 'txt' }, ['Animatorから探す']),
          h('span', { class: 'arrow' }, ['→']),
        ]),
        h('a', { class: 'sub-door', href: href('/configurator') }, [
          h('span', { class: 'icon' }, ['⚡']),
          h('span', { class: 'txt' }, ['ゼロから自分で組む']),
          h('span', { class: 'arrow' }, ['→']),
        ]),
      ]),

      // Featured Motions: subordinate
      h('div', { class: 'section-title' }, [
        h('h2', {}, ['Featured Motions']),
        h('a', { class: 'link', href: href('/motions') }, ['See all →']),
      ]),
      h('div', { class: 'motions-grid' }, featuredMotions.map(MotionCard)),
    ]),
  ])

  ;(root as any).__onLeave = () => preview?.dispose()
  return root
}
