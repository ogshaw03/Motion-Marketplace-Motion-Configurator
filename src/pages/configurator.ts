import { h, yen } from '../util/dom'
import { AppHeader } from '../components/header'
import { candidateNextMotions, compatibility, getCreator, getMotion, isOwned, totalMissingPrice } from '../db'
import { createPreview, type PreviewController } from '../three/preview'
import type { ClipKey } from '../three/character'
import type { Motion, SequenceStep } from '../types'
import { href, navigate } from '../router'

export function ConfiguratorPage(_params: Record<string, string>): HTMLElement {
  const params = new URLSearchParams(window.location.hash.split('?')[1] || '')
  const seqParam = params.get('seq')
  if (seqParam) {
    const fs = window.DB.featuredSequences.find((s) => s.id === seqParam)
    if (fs) {
      window.DB.currentSequence.steps = fs.steps.map((s, i, arr) => ({
        motionId: s.motionId,
        loopCount: s.loopCount,
        transitionToNext:
          i < arr.length - 1 ? { kind: 'Auto' as const, blendLengthSec: 0.2 } : undefined,
      }))
    }
  }

  let showLowCompat = false
  let activeStepIndex = window.DB.currentSequence.steps.length - 1
  let editingTransitionAt: number | null = null

  const previewHost = h('div', { class: 'preview-area' }, [])
  let preview: PreviewController | null = null
  queueMicrotask(() => {
    preview = createPreview({ clip: 'idle', loop: true })
    previewHost.appendChild(preview.el)
    previewHost.appendChild(playAllControls(() => playAllSequence(preview!)))
    applyActiveClipToPreview()
  })

  function applyActiveClipToPreview() {
    if (!preview) return
    const step = window.DB.currentSequence.steps[activeStepIndex]
    if (!step) return
    const motion = getMotion(step.motionId)
    if (motion) preview.setClip(motion.animationClipKey as ClipKey, motion.loop)
  }

  function playAllSequence(pv: PreviewController) {
    const steps = window.DB.currentSequence.steps
    const seq: { clip: ClipKey; durationSec: number; loopCount: number }[] = []
    steps.forEach((step, idx) => {
      const motion = getMotion(step.motionId)
      if (motion) {
        seq.push({
          clip: motion.animationClipKey as ClipKey,
          durationSec: motion.metadata.durationSec,
          loopCount: step.loopCount,
        })
      }
      if (idx < steps.length - 1) {
        const trans = step.transitionToNext
        if (trans?.kind === 'Designed' && trans.designedMotionId) {
          const t = getMotion(trans.designedMotionId)
          if (t) seq.push({ clip: t.animationClipKey as ClipKey, durationSec: t.metadata.durationSec, loopCount: 1 })
        }
      }
    })
    pv.setSequence(seq)
  }

  const sidePanel = h('div', { class: 'side-panel' }, [])
  const sequenceArea = h('div', { class: 'sequence-area' }, [])
  const priceStrip = h('div', {
    style: 'display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: var(--bg-elev-2); border: 1px solid var(--border); border-radius: var(--radius-sm); margin-top: 10px;',
  }, [])

  function renderSide() {
    while (sidePanel.firstChild) sidePanel.removeChild(sidePanel.firstChild)
    const currentStep = window.DB.currentSequence.steps[activeStepIndex]
    const currentMotion = currentStep ? getMotion(currentStep.motionId) : null

    if (editingTransitionAt != null) {
      renderTransitionEditor(sidePanel, editingTransitionAt, () => {
        editingTransitionAt = null
        renderAll()
      })
      return
    }

    sidePanel.appendChild(h('h3', {}, ['CURRENT']))
    if (currentMotion) {
      sidePanel.appendChild(
        h('div', {
          style:
            'padding: 10px; background: var(--bg-elev-2); border: 1px solid var(--border); border-radius: var(--radius-sm);',
        }, [
          h('div', { style: 'font-weight: 600; margin-bottom: 4px;' }, [currentMotion.name]),
          h('div', { style: 'color: var(--text-dim); font-size: 12px;' }, [
            `${currentMotion.state} · ${currentMotion.style}`,
          ]),
        ]),
      )
    }

    sidePanel.appendChild(h('h3', {}, ['NEXT MOTION']))
    const candidates = currentMotion
      ? candidateNextMotions(currentMotion.id, showLowCompat).slice(0, 20)
      : window.DB.motions.slice(0, 20)
    const nextList = h('div', { class: 'next-motion-list' }, [])
    candidates.forEach((m: Motion) => {
      const compat = currentMotion ? compatibility(currentMotion.id, m.id) : 'Good'
      const owned = isOwned(m.id)
      nextList.appendChild(
        h('div', {
          class: 'next-motion-item',
          onclick: () => {
            window.DB.currentSequence.steps.push({
              motionId: m.id,
              loopCount: 1,
              transitionToNext: { kind: 'Auto', blendLengthSec: 0.2 },
            })
            // add auto transition to previous step
            const prev = window.DB.currentSequence.steps[window.DB.currentSequence.steps.length - 2]
            if (prev && !prev.transitionToNext) {
              prev.transitionToNext = { kind: 'Auto', blendLengthSec: 0.2 }
            }
            activeStepIndex = window.DB.currentSequence.steps.length - 1
            renderAll()
          },
        }, [
          h('div', {
            class: 'swatch',
            style: `background: linear-gradient(135deg, ${m.thumbColor} 0%, #12141c 100%);`,
          }, []),
          h('div', { class: 'info' }, [
            h('div', { class: 'name' }, [m.name]),
            h('div', { class: 'meta' }, [`${m.state} · ${m.style}`]),
          ]),
          h('div', { style: 'display: flex; flex-direction: column; align-items: flex-end; gap: 3px;' }, [
            h('span', {
              class: `chip ${compat.toLowerCase()}`,
              style: 'font-size: 10px; padding: 1px 6px;',
            }, [compat]),
            owned
              ? h('span', { class: 'chip owned', style: 'font-size: 10px; padding: 1px 6px;' }, ['OWNED'])
              : h('span', { style: 'font-size: 11px; color: var(--text-mute);' }, [yen(m.price)]),
          ]),
        ]),
      )
    })
    sidePanel.appendChild(nextList)

    // advanced panel
    sidePanel.appendChild(
      h('div', { class: 'advanced-panel' }, [
        h('details', {}, [
          h('summary', {}, ['Advanced']),
          h('div', { class: 'toggle-row' }, [
            h('label', { style: 'display: flex; gap: 6px; align-items: center;' }, [
              h('input', {
                type: 'checkbox',
                checked: showLowCompat,
                onchange: (e: Event) => {
                  showLowCompat = (e.currentTarget as HTMLInputElement).checked
                  renderSide()
                },
              }, []),
              'Show Low Compatibility',
            ]),
          ]),
          h('div', { class: 'toggle-row' }, [
            h('span', {}, ['Blend Length']),
            h('span', {}, ['0.20s']),
          ]),
          h('div', { class: 'toggle-row' }, [
            h('span', {}, ['Playback Speed']),
            h('span', {}, ['1.0×']),
          ]),
          h('div', { class: 'toggle-row' }, [
            h('span', {}, ['Root / In-Place']),
            h('span', {}, ['Root Motion']),
          ]),
        ]),
      ]),
    )
  }

  function renderTransitionEditor(host: HTMLElement, atIndex: number, back: () => void) {
    const stepA = window.DB.currentSequence.steps[atIndex]
    const stepB = window.DB.currentSequence.steps[atIndex + 1]
    if (!stepA || !stepB) {
      back()
      return
    }
    const mA = getMotion(stepA.motionId)
    const mB = getMotion(stepB.motionId)
    const currentKind = stepA.transitionToNext?.kind ?? 'Auto'
    const currentDesignedId = stepA.transitionToNext?.designedMotionId

    host.appendChild(
      h('div', { style: 'display: flex; align-items: center; gap: 8px;' }, [
        h('button', { class: 'btn small ghost', onclick: back }, ['← Back']),
        h('span', { style: 'color: var(--text-dim); font-size: 12px;' }, ['TRANSITION']),
      ]),
    )
    host.appendChild(
      h('div', { style: 'padding: 10px; background: var(--bg-elev-2); border: 1px solid var(--border); border-radius: var(--radius-sm); display: flex; align-items: center; gap: 8px; font-size: 13px;' }, [
        h('div', {}, [mA?.name || '?']),
        h('span', { style: 'color: var(--text-mute);' }, ['→']),
        h('div', {}, [mB?.name || '?']),
      ]),
    )

    const setTransition = (kind: 'Auto' | 'Designed', designedId?: string) => {
      stepA.transitionToNext = {
        kind,
        blendLengthSec: 0.2,
        designedMotionId: designedId,
      }
      renderAll()
    }

    host.appendChild(h('h3', { style: 'margin-top: 10px;' }, ['AUTO']))
    host.appendChild(
      h('div', {
        class: 'next-motion-item',
        style: currentKind === 'Auto' ? 'border-color: var(--accent);' : '',
        onclick: () => setTransition('Auto'),
      }, [
        h('div', { class: 'swatch', style: 'background: linear-gradient(135deg, #4c8dff 0%, #12141c 100%);' }, []),
        h('div', { class: 'info' }, [
          h('div', { class: 'name' }, ['Auto Transition']),
          h('div', { class: 'meta' }, ['Phase-aware Blend']),
        ]),
        h('span', { style: 'font-size: 11px; color: var(--good);' }, ['Free']),
      ]),
    )

    host.appendChild(h('h3', { style: 'margin-top: 12px;' }, ['DESIGNED']))
    const designedCandidates = window.DB.motions.filter((m) => {
      if (!m.isDesignedTransition) return false
      if (mA && m.from && m.from !== mA.state) return false
      if (mB && m.to && m.to !== mB.state) return false
      return true
    })

    if (designedCandidates.length === 0) {
      host.appendChild(
        h('div', { style: 'color: var(--text-dim); font-size: 12px; padding: 10px;' }, [
          `${mA?.state} → ${mB?.state} のDesigned Transitionは現在ありません。`,
        ]),
      )
    } else {
      designedCandidates.forEach((m: Motion) => {
        const owned = isOwned(m.id)
        host.appendChild(
          h('div', {
            class: 'next-motion-item',
            style: currentDesignedId === m.id ? 'border-color: var(--accent);' : '',
            onclick: () => setTransition('Designed', m.id),
          }, [
            h('div', { class: 'swatch', style: `background: linear-gradient(135deg, ${m.thumbColor} 0%, #12141c 100%);` }, []),
            h('div', { class: 'info' }, [
              h('div', { class: 'name' }, [m.name]),
              h('div', { class: 'meta' }, [`${getCreator(m.creatorId)?.name || '?'} · ${m.style}`]),
            ]),
            owned
              ? h('span', { class: 'chip owned', style: 'font-size: 10px;' }, ['OWNED'])
              : h('span', { style: 'font-size: 11px; color: var(--text-mute);' }, [yen(m.price)]),
          ]),
        )
      })
    }
  }

  function renderSequence() {
    while (sequenceArea.firstChild) sequenceArea.removeChild(sequenceArea.firstChild)
    const steps = window.DB.currentSequence.steps

    const header = h('div', { class: 'sequence-header' }, [
      h('div', { style: 'display: flex; align-items: center; gap: 10px;' }, [
        h('h3', { style: 'font-size: 12px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.08em; margin: 0; font-weight: 500;' }, ['SEQUENCE']),
        h('span', { style: 'color: var(--text-mute); font-size: 12px;' }, [`${steps.length} steps`]),
      ]),
      h('div', { style: 'display: flex; gap: 8px;' }, [
        h('button', {
          class: 'btn small ghost',
          onclick: () => {
            window.DB.currentSequence.steps = []
            activeStepIndex = -1
            renderAll()
          },
        }, ['Clear']),
        h('button', {
          class: 'btn primary',
          onclick: () => preview && playAllSequence(preview),
        }, ['▶ PLAY ALL']),
      ]),
    ])
    sequenceArea.appendChild(header)

    const strip = h('div', { class: 'sequence-strip' }, [])

    steps.forEach((step: SequenceStep, i: number) => {
      const motion = getMotion(step.motionId)
      if (!motion) return

      const stepEl = h('div', {
        class: `seq-step ${i === activeStepIndex ? 'active' : ''}`,
        onclick: () => {
          activeStepIndex = i
          applyActiveClipToPreview()
          renderAll()
        },
      }, [
        h('span', { class: 'step-badge' }, [motion.state]),
        h('div', { class: 'step-name' }, [motion.name]),
        h('div', { class: 'step-meta' }, [
          `Loop ×${step.loopCount}`,
          motion.isDesignedTransition ? ' · Designed' : '',
        ]),
        h('div', { style: 'display: flex; gap: 4px; margin-top: 6px;' }, [
          isOwned(motion.id)
            ? h('span', { class: 'chip owned', style: 'font-size: 9px; padding: 0px 4px;' }, ['OWNED'])
            : h('span', { style: 'font-size: 10px; color: var(--text-mute);' }, [yen(motion.price)]),
          h('span', {
            style: 'font-size: 10px; color: var(--text-mute); margin-left: auto; cursor: pointer;',
            onclick: (e: Event) => {
              e.stopPropagation()
              window.DB.currentSequence.steps.splice(i, 1)
              if (activeStepIndex >= window.DB.currentSequence.steps.length) {
                activeStepIndex = window.DB.currentSequence.steps.length - 1
              }
              renderAll()
            },
          }, ['✕']),
        ]),
      ])
      strip.appendChild(stepEl)

      if (i < steps.length - 1) {
        const trans = step.transitionToNext
        const nextMotion = getMotion(steps[i + 1].motionId)
        const compat = nextMotion
          ? compatibility(motion.id, trans?.kind === 'Designed' && trans.designedMotionId ? trans.designedMotionId : nextMotion.id)
          : 'Good'
        const isDesigned = trans?.kind === 'Designed' && trans.designedMotionId
        const designedMotion = isDesigned && trans.designedMotionId ? getMotion(trans.designedMotionId) : null

        strip.appendChild(
          h('div', {
            class: `transition-node ${isDesigned ? 'designed' : ''}`,
            onclick: () => {
              editingTransitionAt = i
              renderSide()
            },
          }, [
            h('span', { class: 'arrow' }, ['→']),
            h('span', {}, [isDesigned ? 'Designed' : 'Auto']),
            designedMotion
              ? h('span', { style: 'font-size: 9px; color: var(--accent); text-align: center;' }, [designedMotion.name])
              : null,
            h('span', { class: `chip ${compat.toLowerCase()}`, style: 'font-size: 9px; padding: 1px 5px; margin-top: 2px;' }, [compat]),
          ]),
        )
      }
    })

    if (steps.length === 0) {
      strip.appendChild(
        h('div', { style: 'padding: 30px; color: var(--text-dim); font-size: 13px;' }, [
          '右のMotion候補からクリックしてSequenceを組み立ててください。',
        ]),
      )
    }
    sequenceArea.appendChild(strip)

    // price strip
    while (priceStrip.firstChild) priceStrip.removeChild(priceStrip.firstChild)
    const missingIds = steps.map((s: SequenceStep) => s.motionId).concat(
      steps
        .map((s: SequenceStep) => s.transitionToNext?.designedMotionId)
        .filter((x: string | undefined): x is string => Boolean(x)),
    ).filter((id: string) => !isOwned(id))
    const totalPrice = totalMissingPrice(
      steps
        .map((s: SequenceStep) => ({ motionId: s.motionId }))
        .concat(steps.map((s: SequenceStep) => ({ motionId: s.transitionToNext?.designedMotionId || '' })).filter((x: { motionId: string }) => x.motionId)),
    )
    priceStrip.appendChild(
      h('div', { style: 'display: flex; align-items: center; gap: 14px; font-size: 13px;' }, [
        h('span', { style: 'color: var(--text-dim);' }, [
          `Missing motions: ${missingIds.length}`,
        ]),
        h('span', { style: 'color: var(--accent-2);' }, [
          `Owned: ${steps.length - missingIds.filter((id: string) => steps.some((s: SequenceStep) => s.motionId === id)).length}`,
        ]),
      ]),
    )
    priceStrip.appendChild(
      h('div', { style: 'display: flex; align-items: center; gap: 14px;' }, [
        h('span', { style: 'color: var(--text-mute); font-size: 12px;' }, ['This Sequence']),
        h('span', { style: 'font-weight: 700; font-size: 18px;' }, [yen(totalPrice)]),
        h('button', {
          class: 'btn primary',
          disabled: missingIds.length === 0,
          onclick: () => navigate('#/purchase'),
        }, [missingIds.length === 0 ? '✓ All Owned' : 'Buy Missing Motions']),
      ]),
    )
    sequenceArea.appendChild(priceStrip)
  }

  function renderAll() {
    renderSide()
    renderSequence()
  }

  renderAll()

  const container = h('div', { class: 'app-main' }, [
    AppHeader(),
    h('div', { class: 'configurator' }, [previewHost, sidePanel, sequenceArea]),
  ])

  ;(container as any).__onLeave = () => {
    preview?.dispose()
  }
  return container
}

function playAllControls(onPlay: () => void): HTMLElement {
  return h('div', { class: 'play-controls' }, [
    h('div', { class: 'left' }, [
      h('button', { class: 'btn small primary', onclick: onPlay }, ['▶ PLAY ALL']),
      h('button', { class: 'btn small' }, ['⏸']),
    ]),
    h('div', { class: 'timing' }, ['SEQUENCE']),
    h('div', { class: 'right' }, [
      h('button', { class: 'btn small' }, ['0.5×']),
      h('button', { class: 'btn small' }, ['1×']),
      h('button', { class: 'btn small' }, ['2×']),
    ]),
  ])
}
