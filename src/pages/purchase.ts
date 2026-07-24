import { h, yen } from '../util/dom'
import { AppHeader } from '../components/header'
import { getCreator, getMotion, isOwned, purchase } from '../db'
import type { SequenceStep } from '../types'
import { href, navigate } from '../router'

export function PurchasePage(): HTMLElement {
  const steps = window.DB.currentSequence.steps
  const allIds: string[] = []
  steps.forEach((s: SequenceStep) => {
    allIds.push(s.motionId)
    if (s.transitionToNext?.kind === 'Designed' && s.transitionToNext.designedMotionId) {
      allIds.push(s.transitionToNext.designedMotionId)
    }
  })
  const uniqueIds = Array.from(new Set(allIds))
  const missing = uniqueIds.filter((id) => !isOwned(id))
  const total = missing.map((id) => getMotion(id)?.price ?? 0).reduce((a, b) => a + b, 0)

  const list = h('div', { class: 'purchase-list' }, [])
  uniqueIds.forEach((id) => {
    const m = getMotion(id)
    if (!m) return
    const creator = getCreator(m.creatorId)
    const owned = isOwned(id)
    list.appendChild(
      h('div', { class: 'purchase-row' }, [
        h('div', {
          class: 'swatch',
          style: `background: linear-gradient(135deg, ${m.thumbColor} 0%, #12141c 100%);`,
        }, []),
        h('div', { class: 'info' }, [
          h('div', { class: 'name' }, [m.name]),
          h('div', { class: 'meta' }, [
            `${creator?.name || '?'} · ${m.style} · ${m.state}`,
            m.isDesignedTransition ? ' · Designed Transition' : '',
          ]),
        ]),
        owned
          ? h('div', { class: 'price owned' }, ['OWNED'])
          : h('div', { class: 'price' }, [yen(m.price)]),
      ]),
    )
  })
  list.appendChild(
    h('div', { class: 'purchase-total' }, [
      h('span', {}, ['Purchase']),
      h('span', {}, [yen(total)]),
    ]),
  )

  const buyBtn = h('button', {
    class: 'btn primary wide',
    disabled: missing.length === 0,
    onclick: () => {
      purchase(missing)
      alert(`${missing.length} Motions purchased. Motion Package をダウンロードできます。`)
      navigate('#/library')
    },
  }, [missing.length === 0 ? '✓ All Owned' : `Buy Missing Motions (${missing.length})`])

  return h('div', { class: 'app-main' }, [
    AppHeader(),
    h('div', { class: 'page' }, [
      h('div', { style: 'margin-bottom: 8px;' }, [
        h('a', { href: href('/configurator'), style: 'color: var(--text-dim); font-size: 12px;' }, ['← Configurator']),
      ]),
      h('h1', {}, ['Current Sequence']),
      h('p', { class: 'sub' }, [
        '所有済みMotionは自動的に除外されます。未所有分だけを購入します。',
      ]),
      list,
      h('div', { style: 'display: flex; gap: 10px; margin-top: 16px; align-items: center;' }, [
        buyBtn,
        h('a', { class: 'btn ghost', href: href('/configurator') }, ['← Back to Configurator']),
      ]),
      h('div', {
        style: 'background: var(--bg-elev); border: 1px solid var(--border); border-radius: var(--radius); padding: 16px; margin-top: 20px;',
      }, [
        h('div', { style: 'color: var(--text-dim); font-size: 12px; margin-bottom: 8px;' }, [
          'AFTER PURCHASE',
        ]),
        h('div', { style: 'font-size: 13px; color: var(--text-dim); line-height: 1.7;' }, [
          '購入完了後、Motion Package (Motion Files + sequence.json + metadata.json) をダウンロードできます。',
          h('br', {}, []),
          'Maya Buyer Tool から Import Motion Package → Character選択 → Apply Sequence で、Webで作ったSequenceを自分のキャラクターに再構築できます。',
        ]),
      ]),
    ]),
  ])
}
