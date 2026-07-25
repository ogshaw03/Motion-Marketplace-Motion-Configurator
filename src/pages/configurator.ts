import { h, yen } from '../util/dom'
import { AppHeader } from '../components/header'
import {
  BLEND_SLIDER_MAX_SEC,
  candidateNextMotions,
  compatibility,
  defaultAutoBlendSec,
  defaultDesignedInBlendSec,
  defaultDesignedOutBlendSec,
  getCreator,
  getMotion,
  isOwned,
  recommendedBandSec,
  totalMissingPrice,
} from '../db'
import { createPreview, type PreviewController } from '../three/preview'
import type { ClipKey } from '../three/character'
import type { Motion, RecommendedBlend, SequenceStep, Transition } from '../types'
import { href, navigate } from '../router'

export function ConfiguratorPage(_params: Record<string, string>): HTMLElement {
  const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '')
  const seqParam = urlParams.get('seq')
  if (seqParam) {
    const fs = window.DB.featuredSequences.find((s) => s.id === seqParam)
    if (fs) {
      window.DB.currentSequence.steps = fs.steps.map((s, i, arr) => ({
        motionId: s.motionId,
        loopCount: s.loopCount,
        transitionToNext:
          i < arr.length - 1
            ? {
                kind: 'Auto' as const,
                blendLengthSec: defaultAutoBlendSec(
                  s.motionId,
                  arr[i + 1].motionId,
                ),
              }
            : undefined,
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
    previewHost.appendChild(
      makePlayControls(() => preview && playAllSequence(preview), () => preview),
    )
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
        if (trans?.kind === 'Designed') {
          const t = getMotion(trans.designedMotionId)
          if (t) {
            seq.push({
              clip: t.animationClipKey as ClipKey,
              durationSec: t.metadata.durationSec,
              loopCount: 1,
            })
          }
        }
      }
    })
    pv.setSequence(seq)
  }

  const sidePanel = h('div', { class: 'side-panel' }, [])
  const sequenceArea = h('div', { class: 'sequence-area' }, [])
  const priceStrip = h('div', {
    style:
      'display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: var(--bg-elev-2); border: 1px solid var(--border); border-radius: var(--radius-sm); margin-top: 10px;',
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
          h('div', { style: 'font-weight: 600; margin-bottom: 4px;' }, [
            currentMotion.name,
          ]),
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
            const prevSteps = window.DB.currentSequence.steps
            const prev = prevSteps[prevSteps.length - 1]
            if (prev && !prev.transitionToNext) {
              prev.transitionToNext = {
                kind: 'Auto',
                blendLengthSec: defaultAutoBlendSec(prev.motionId, m.id),
              }
            }
            prevSteps.push({ motionId: m.id, loopCount: 1 })
            activeStepIndex = prevSteps.length - 1
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
          h('div', {
            style:
              'display: flex; flex-direction: column; align-items: flex-end; gap: 3px;',
          }, [
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
            h('span', {}, ['Transitionノードから個別に調整']),
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
    const trans = stepA.transitionToNext
    const currentKind = trans?.kind ?? 'Auto'
    const currentDesignedId = trans?.kind === 'Designed' ? trans.designedMotionId : undefined

    host.appendChild(
      h('div', { style: 'display: flex; align-items: center; gap: 8px;' }, [
        h('button', { class: 'btn small ghost', onclick: back }, ['← Back']),
        h('span', { style: 'color: var(--text-dim); font-size: 12px;' }, ['TRANSITION']),
      ]),
    )
    host.appendChild(
      h('div', {
        style:
          'padding: 10px; background: var(--bg-elev-2); border: 1px solid var(--border); border-radius: var(--radius-sm); display: flex; align-items: center; gap: 8px; font-size: 13px;',
      }, [
        h('div', {}, [mA?.name || '?']),
        h('span', { style: 'color: var(--text-mute);' }, ['→']),
        h('div', {}, [mB?.name || '?']),
      ]),
    )

    const setAuto = () => {
      stepA.transitionToNext = {
        kind: 'Auto',
        blendLengthSec:
          trans?.kind === 'Auto'
            ? trans.blendLengthSec
            : defaultAutoBlendSec(stepA.motionId, stepB.motionId),
      }
      renderAll()
    }
    const setDesigned = (designedId: string) => {
      const keepIn = trans?.kind === 'Designed' && trans.designedMotionId === designedId ? trans.inBlendSec : defaultDesignedInBlendSec(stepA.motionId, designedId)
      const keepOut = trans?.kind === 'Designed' && trans.designedMotionId === designedId ? trans.outBlendSec : defaultDesignedOutBlendSec(designedId, stepB.motionId)
      stepA.transitionToNext = {
        kind: 'Designed',
        designedMotionId: designedId,
        inBlendSec: keepIn,
        outBlendSec: keepOut,
      }
      renderAll()
    }

    // AUTO group
    host.appendChild(h('h3', { style: 'margin-top: 10px;' }, ['AUTO']))
    host.appendChild(
      h('div', {
        class: 'next-motion-item',
        style: currentKind === 'Auto' ? 'border-color: var(--accent);' : '',
        onclick: setAuto,
      }, [
        h('div', {
          class: 'swatch',
          style: 'background: linear-gradient(135deg, #4c8dff 0%, #12141c 100%);',
        }, []),
        h('div', { class: 'info' }, [
          h('div', { class: 'name' }, ['Auto Transition']),
          h('div', { class: 'meta' }, ['Phase-aware Blend']),
        ]),
        h('span', { style: 'font-size: 11px; color: var(--good);' }, ['Free']),
      ]),
    )

    if (trans?.kind === 'Auto') {
      const band = recommendedBandSec(mA, 'out', mB, 'in')
      host.appendChild(
        blendSlider({
          label: 'Blend Length',
          valueSec: trans.blendLengthSec,
          band,
          onChange: (v) => {
            if (stepA.transitionToNext?.kind === 'Auto') {
              stepA.transitionToNext.blendLengthSec = v
            }
            renderSequence()
          },
        }),
      )
    }

    // DESIGNED group
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
        const selected = currentDesignedId === m.id
        host.appendChild(
          h('div', {
            class: 'next-motion-item',
            style: selected ? 'border-color: var(--accent);' : '',
            onclick: () => setDesigned(m.id),
          }, [
            h('div', {
              class: 'swatch',
              style: `background: linear-gradient(135deg, ${m.thumbColor} 0%, #12141c 100%);`,
            }, []),
            h('div', { class: 'info' }, [
              h('div', { class: 'name' }, [m.name]),
              h('div', { class: 'meta' }, [`${getCreator(m.creatorId)?.name || '?'} · ${m.style}`]),
            ]),
            owned
              ? h('span', { class: 'chip owned', style: 'font-size: 10px;' }, ['OWNED'])
              : h('span', { style: 'font-size: 11px; color: var(--text-mute);' }, [yen(m.price)]),
          ]),
        )

        // If this designed motion is currently selected, render two sliders + designer note
        if (selected && stepA.transitionToNext?.kind === 'Designed') {
          const designed = m
          const inBand = recommendedBandSec(mA, 'out', designed, 'in')
          const outBand = recommendedBandSec(designed, 'out', mB, 'in')

          host.appendChild(
            h('div', {
              style:
                'padding: 12px; background: var(--bg-elev-2); border: 1px solid var(--border); border-radius: var(--radius-sm); display: flex; flex-direction: column; gap: 12px;',
            }, [
              h('div', {
                style:
                  'display: flex; align-items: center; gap: 8px; font-size: 11px; color: var(--text-mute);',
              }, [
                h('span', {}, [mA?.name || '?']),
                h('span', {}, ['→']),
                h('span', { style: 'color: var(--accent);' }, [designed.name]),
                h('span', {}, ['→']),
                h('span', {}, [mB?.name || '?']),
              ]),
              blendSlider({
                label: `In Blend  (${mA?.name || '?'} → ${designed.name})`,
                valueSec: stepA.transitionToNext.inBlendSec,
                band: inBand,
                onChange: (v) => {
                  if (stepA.transitionToNext?.kind === 'Designed') {
                    stepA.transitionToNext.inBlendSec = v
                  }
                  renderSequence()
                },
              }),
              blendSlider({
                label: `Out Blend  (${designed.name} → ${mB?.name || '?'})`,
                valueSec: stepA.transitionToNext.outBlendSec,
                band: outBand,
                onChange: (v) => {
                  if (stepA.transitionToNext?.kind === 'Designed') {
                    stepA.transitionToNext.outBlendSec = v
                  }
                  renderSequence()
                },
              }),
              designerNote(designed.recommendedBlend),
            ]),
          )
        }
      })
    }
  }

  function renderSequence() {
    while (sequenceArea.firstChild) sequenceArea.removeChild(sequenceArea.firstChild)
    const steps = window.DB.currentSequence.steps

    const header = h('div', { class: 'sequence-header' }, [
      h('div', { style: 'display: flex; align-items: center; gap: 10px;' }, [
        h('h3', {
          style:
            'font-size: 12px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.08em; margin: 0; font-weight: 500;',
        }, ['SEQUENCE']),
        h('span', { style: 'color: var(--text-mute); font-size: 12px;' }, [`${steps.length} steps`]),
      ]),
      h('div', { style: 'display: flex; gap: 8px;' }, [
        h('button', {
          class: 'btn small ghost',
          onclick: () => {
            window.DB.currentSequence.steps = []
            activeStepIndex = -1
            editingTransitionAt = null
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
          editingTransitionAt = null
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
              editingTransitionAt = null
              renderAll()
            },
          }, ['✕']),
        ]),
      ])
      strip.appendChild(stepEl)

      if (i < steps.length - 1) {
        const trans = step.transitionToNext
        const nextMotion = getMotion(steps[i + 1].motionId)
        const isDesigned = trans?.kind === 'Designed'
        const designedMotion = isDesigned ? getMotion(trans.designedMotionId) : null
        const compat = nextMotion
          ? compatibility(
              motion.id,
              isDesigned && trans ? trans.designedMotionId : nextMotion.id,
            )
          : 'Good'

        const blendLabel = trans
          ? trans.kind === 'Auto'
            ? `${trans.blendLengthSec.toFixed(2)}s`
            : `${trans.inBlendSec.toFixed(2)} + ${trans.outBlendSec.toFixed(2)}s`
          : '—'

        strip.appendChild(
          h('div', {
            class: `transition-node ${isDesigned ? 'designed' : ''} ${editingTransitionAt === i ? 'editing' : ''}`,
            onclick: () => {
              editingTransitionAt = i
              renderSide()
            },
          }, [
            h('span', { class: 'arrow' }, ['→']),
            h('span', {}, [isDesigned ? 'Designed' : 'Auto']),
            designedMotion
              ? h('span', {
                  style: 'font-size: 9px; color: var(--accent); text-align: center;',
                }, [designedMotion.name])
              : null,
            h('span', { style: 'font-size: 9px; color: var(--text-mute); font-family: ui-monospace, monospace;' }, [blendLabel]),
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
    const uniqueIds = new Set<string>()
    steps.forEach((s: SequenceStep) => {
      uniqueIds.add(s.motionId)
      if (s.transitionToNext?.kind === 'Designed') {
        uniqueIds.add(s.transitionToNext.designedMotionId)
      }
    })
    const idList = Array.from(uniqueIds)
    const missingCount = idList.filter((id) => !isOwned(id)).length
    const ownedCount = idList.length - missingCount
    const totalPrice = totalMissingPrice(idList.map((id) => ({ motionId: id })))

    priceStrip.appendChild(
      h('div', { style: 'display: flex; align-items: center; gap: 14px; font-size: 13px;' }, [
        h('span', { style: 'color: var(--text-dim);' }, [`Missing motions: ${missingCount}`]),
        h('span', { style: 'color: var(--accent-2);' }, [`Owned: ${ownedCount}`]),
      ]),
    )
    priceStrip.appendChild(
      h('div', { style: 'display: flex; align-items: center; gap: 14px;' }, [
        h('span', { style: 'color: var(--text-mute); font-size: 12px;' }, ['This Sequence']),
        h('span', { style: 'font-weight: 700; font-size: 18px;' }, [yen(totalPrice)]),
        h('button', {
          class: 'btn primary',
          disabled: missingCount === 0,
          onclick: () => navigate('#/purchase'),
        }, [missingCount === 0 ? '✓ All Owned' : 'Buy Missing Motions']),
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

function makePlayControls(
  onPlayAll: () => void,
  getPreview: () => PreviewController | null,
): HTMLElement {
  const playBtn = h('button', { class: 'btn small' }, ['⏸']) as HTMLButtonElement
  playBtn.addEventListener('click', () => {
    const p = getPreview()
    if (!p) return
    if (p.isPlaying()) {
      p.pause()
      playBtn.textContent = '▶'
    } else {
      p.play()
      playBtn.textContent = '⏸'
    }
  })

  const makeSpeedBtn = (label: string, s: number, active = false) => {
    const b = h('button', { class: `btn small ${active ? 'primary' : ''}` }, [label]) as HTMLButtonElement
    b.addEventListener('click', () => {
      const p = getPreview()
      if (!p) return
      p.setSpeed(s)
      speedGroup.querySelectorAll('button').forEach((x) => x.classList.remove('primary'))
      b.classList.add('primary')
    })
    return b
  }
  const speedGroup = h('div', { class: 'right' }, [
    makeSpeedBtn('0.5×', 0.5),
    makeSpeedBtn('1×', 1.0, true),
    makeSpeedBtn('2×', 2.0),
  ])

  const frameBtn = h('button', {
    class: 'btn small',
    title: 'Frame character (F)',
    onclick: () => {
      const p = getPreview()
      p?.frame()
    },
  }, ['⟲ Frame']) as HTMLButtonElement

  return h('div', { class: 'play-controls' }, [
    h('div', { class: 'left' }, [
      h('button', { class: 'btn small primary', onclick: onPlayAll }, ['▶ PLAY ALL']),
      playBtn,
      frameBtn,
    ]),
    h('div', { class: 'timing' }, ['SEQUENCE PREVIEW']),
    speedGroup,
  ])
}

function blendSlider(opts: {
  label: string
  valueSec: number
  band: { minSec: number; maxSec: number } | null
  onChange: (v: number) => void
}): HTMLElement {
  const max = BLEND_SLIDER_MAX_SEC
  const step = 0.01
  const pct = (s: number) => `${Math.min(100, Math.max(0, (s / max) * 100))}%`

  const valueLabel = h('span', {
    style: 'font-family: ui-monospace, monospace; font-size: 12px; color: var(--text);',
  }, [`${opts.valueSec.toFixed(2)}s`])

  const band = opts.band
  const bandEl = band
    ? h('div', {
        class: 'blend-rec-band',
        style: `left: ${pct(band.minSec)}; width: calc(${pct(band.maxSec)} - ${pct(band.minSec)});`,
        title: `推奨: ${band.minSec.toFixed(2)}s 〜 ${band.maxSec.toFixed(2)}s`,
      }, [])
    : null

  const input = h('input', {
    type: 'range',
    min: 0,
    max,
    step,
    value: opts.valueSec,
    class: 'blend-range',
    oninput: (e: Event) => {
      const v = parseFloat((e.currentTarget as HTMLInputElement).value)
      valueLabel.textContent = `${v.toFixed(2)}s`
      opts.onChange(v)
    },
  }) as HTMLInputElement

  return h('div', { class: 'blend-slider' }, [
    h('div', { class: 'blend-labels' }, [
      h('span', { class: 'blend-label' }, [opts.label]),
      valueLabel,
    ]),
    h('div', { class: 'blend-track' }, [
      bandEl,
      input,
    ]),
    h('div', { class: 'blend-minmax' }, [
      h('span', {}, ['0.00s']),
      band
        ? h('span', { style: 'color: var(--good);' }, [
            `推奨 ${band.minSec.toFixed(2)}–${band.maxSec.toFixed(2)}s`,
          ])
        : h('span', {}, ['—']),
      h('span', {}, [`${max.toFixed(2)}s`]),
    ]),
  ])
}

function designerNote(rb: RecommendedBlend): HTMLElement | null {
  if (!rb.designerNote) return null
  return h('div', {
    style:
      'font-size: 11px; color: var(--text-dim); line-height: 1.5; padding: 8px 10px; background: rgba(255, 92, 138, 0.06); border: 1px solid rgba(255, 92, 138, 0.25); border-radius: var(--radius-sm);',
  }, [
    h('div', {
      style:
        'color: var(--accent); font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 4px;',
    }, ['Designer Note']),
    rb.designerNote,
  ])
}
