import { h, yen } from '../util/dom'
import { AppHeader } from '../components/header'
import { getCreator, getMotion, isOwned, purchase } from '../db'
import { createPreview } from '../three/preview'
import type { PreviewController } from '../three/preview'
import type { ClipKey } from '../three/character'
import { href, navigate } from '../router'

export function MotionDetailPage(params: Record<string, string>): HTMLElement {
  const motion = getMotion(params.id)
  if (!motion) {
    return h('div', { class: 'app-main' }, [
      AppHeader(),
      h('div', { class: 'page' }, [
        h('h1', {}, ['Not found']),
        h('p', { class: 'sub' }, ['指定されたMotionが見つかりません。']),
      ]),
    ])
  }

  const creator = getCreator(motion.creatorId)
  const owned = isOwned(motion.id)

  const previewHost = h('div', { class: 'detail-preview' }, [])
  let preview: PreviewController | null = null
  queueMicrotask(() => {
    preview = createPreview({ clip: motion.animationClipKey as ClipKey, loop: motion.loop })
    previewHost.appendChild(preview.el)
    previewHost.appendChild(playControls(preview))
  })

  const buyBtn = h('button', {
    class: 'btn primary wide',
    onclick: () => {
      purchase([motion.id])
      buyBtn.replaceWith(ownedTag())
    },
  }, [`Buy Motion — ${yen(motion.price)}`])

  const ownedTag = () => h('div', {
    class: 'chip owned',
    style: 'padding: 10px 12px; justify-content: center; font-size: 13px; width: 100%; display: flex;',
  }, ['✓ In Your Library'])

  const container = h('div', { class: 'app-main' }, [
    AppHeader(),
    h('div', { class: 'page' }, [
      h('div', { class: 'creator-line', style: 'margin-bottom: 8px;' }, [
        h('a', { href: href('/motions') }, ['← All Motions']),
      ]),
      h('div', { class: 'detail-grid' }, [
        previewHost,
        h('div', { class: 'detail-side' }, [
          h('h1', { class: 'detail-title' }, [motion.name]),
          h('div', { class: 'creator-line' }, [
            h('div', { class: 'creator-avatar', style: `background: ${creator?.icon || '#666'}` }, []),
            creator ? creator.name : 'Anonymous',
            h('span', { class: 'chip' }, [motion.productionMethod]),
          ]),
          h('div', { class: 'badge-row' }, [
            h('span', { class: 'chip' }, [motion.style]),
            h('span', { class: 'chip' }, [motion.category]),
            h('span', { class: 'chip' }, [motion.state]),
            motion.isDesignedTransition
              ? h('span', { class: 'chip designed' }, ['Designed Transition'])
              : null,
            motion.rootMotion
              ? h('span', { class: 'chip' }, ['Root Motion'])
              : h('span', { class: 'chip' }, ['In-Place']),
            motion.loop ? h('span', { class: 'chip' }, ['Loopable']) : null,
          ]),
          h('div', { class: 'price-block' }, [
            h('div', { class: 'row' }, [
              h('span', { style: 'color: var(--text-dim); font-size: 12px;' }, ['PRICE']),
              h('span', { class: 'price-big' }, [yen(motion.price)]),
            ]),
            h('div', { class: 'row' }, [
              h('button', {
                class: 'btn wide',
                onclick: () => {
                  window.DB.currentSequence.steps.push({
                    motionId: motion.id,
                    loopCount: 1,
                    transitionToNext: { kind: 'Auto', blendLengthSec: 0.2 },
                  })
                  navigate('#/configurator')
                },
              }, ['+ Add to Configurator']),
            ]),
            owned ? ownedTag() : buyBtn,
          ]),
          h('div', { class: 'description' }, [motion.description]),
          motion.isDesignedTransition
            ? h('div', { class: 'description' }, [
                h('div', { style: 'color: var(--accent); font-size: 11px; letter-spacing: 0.08em; margin-bottom: 6px;' }, [
                  'DESIGNED TRANSITION',
                ]),
                h('div', { style: 'display: flex; gap: 16px; font-size: 14px;' }, [
                  h('div', {}, [
                    h('div', { style: 'color: var(--text-mute); font-size: 11px;' }, ['FROM']),
                    h('div', {}, [motion.from || '?']),
                  ]),
                  h('div', { style: 'color: var(--text-mute); align-self: center;' }, ['→']),
                  h('div', {}, [
                    h('div', { style: 'color: var(--text-mute); font-size: 11px;' }, ['TO']),
                    h('div', {}, [motion.to || '?']),
                  ]),
                ]),
              ])
            : null,
          h('div', { class: 'metadata-block' }, [
            h('h4', {}, ['Motion Metadata']),
            h('div', { class: 'kv' }, [
              h('div', { class: 'k' }, ['Duration']),
              h('div', {}, [`${motion.metadata.durationSec.toFixed(2)} sec`]),
              h('div', { class: 'k' }, ['Speed']),
              h('div', {}, [`${motion.metadata.speed.toFixed(1)} m/s`]),
              h('div', { class: 'k' }, ['Root Velocity']),
              h('div', {}, [`${motion.metadata.rootVelocity.toFixed(1)} m/s`]),
              h('div', { class: 'k' }, ['Direction']),
              h('div', {}, [motion.metadata.direction]),
              h('div', { class: 'k' }, ['Start Foot']),
              h('div', {}, [motion.metadata.startFoot]),
              h('div', { class: 'k' }, ['End Foot']),
              h('div', {}, [motion.metadata.endFoot]),
              h('div', { class: 'k' }, ['Start Condition']),
              h('div', {}, [motion.metadata.startCondition]),
              h('div', { class: 'k' }, ['End Condition']),
              h('div', {}, [motion.metadata.endCondition]),
            ]),
          ]),
        ]),
      ]),
    ]),
  ])

  ;(container as any).__onLeave = () => {
    preview?.dispose()
  }

  return container
}

function playControls(preview: PreviewController): HTMLElement {
  const playIcon = h('button', { class: 'btn small' }, ['⏸ Pause'])
  playIcon.addEventListener('click', () => {
    if (preview.isPlaying()) {
      preview.pause()
      playIcon.textContent = '▶ Play'
    } else {
      preview.play()
      playIcon.textContent = '⏸ Pause'
    }
  })
  return h('div', { class: 'play-controls' }, [
    h('div', { class: 'left' }, [
      playIcon,
      h('button', {
        class: 'btn small',
        title: 'Frame character (F)',
        onclick: () => preview.frame(),
      }, ['⟲ Frame']),
    ]),
    h('div', { class: 'timing' }, ['00:00 / --:--']),
    h('div', { class: 'right' }, [
      h('button', { class: 'btn small', onclick: () => preview.setSpeed(0.5) }, ['0.5×']),
      h('button', { class: 'btn small', onclick: () => preview.setSpeed(1.0) }, ['1×']),
      h('button', { class: 'btn small', onclick: () => preview.setSpeed(2.0) }, ['2×']),
    ]),
  ])
}
