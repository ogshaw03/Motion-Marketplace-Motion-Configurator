import { h, yen } from '../util/dom'
import type { Motion } from '../types'
import { getCreator, isOwned } from '../db'
import { href } from '../router'

export function MotionCard(motion: Motion): HTMLElement {
  const creator = getCreator(motion.creatorId)
  const owned = isOwned(motion.id)

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('class', 'figure')
  svg.setAttribute('viewBox', '0 0 100 100')
  svg.innerHTML = figureSvg(motion.animationClipKey, motion.thumbColor)

  const thumb = h('div', {
    class: 'motion-thumb',
    style: `background: linear-gradient(160deg, ${motion.thumbColor}22 0%, #12141c 100%);`,
  }, [
    svg,
    h('div', { class: 'badges' }, [
      motion.isDesignedTransition
        ? h('span', { class: 'chip designed' }, ['Designed Transition'])
        : null,
    ]),
    h('div', { class: 'badges-right' }, [
      owned ? h('span', { class: 'chip owned' }, ['OWNED']) : null,
    ]),
  ])

  return h('a', {
    class: 'motion-card',
    href: href(`/motion/${motion.id}`),
  }, [
    thumb,
    h('div', { class: 'motion-body' }, [
      h('div', { class: 'motion-name' }, [motion.name]),
      h('div', { class: 'motion-meta' }, [
        creator ? creator.name : 'Anonymous',
        h('span', { class: 'dot' }, []),
        motion.style,
        h('span', { class: 'dot' }, []),
        motion.productionMethod,
      ]),
      h('div', { class: 'motion-price' }, [
        h('span', { class: 'price' }, [yen(motion.price)]),
        owned
          ? h('span', { class: 'free' }, ['In Library'])
          : h('span', { class: 'chip' }, [motion.category]),
      ]),
    ]),
  ])
}

function figureSvg(clip: string, color: string): string {
  const stroke = color
  const opacity = 0.7
  const common = `stroke="${stroke}" stroke-opacity="${opacity}" stroke-width="3" fill="none" stroke-linecap="round"`
  // pose by clip key
  const poses: Record<string, string> = {
    idle: `
      <circle cx="50" cy="26" r="6" ${common}/>
      <line x1="50" y1="32" x2="50" y2="60" ${common}/>
      <line x1="50" y1="42" x2="40" y2="52" ${common}/>
      <line x1="50" y1="42" x2="60" y2="52" ${common}/>
      <line x1="50" y1="60" x2="43" y2="80" ${common}/>
      <line x1="50" y1="60" x2="57" y2="80" ${common}/>
    `,
    walk: `
      <circle cx="50" cy="26" r="6" ${common}/>
      <line x1="50" y1="32" x2="50" y2="60" ${common}/>
      <line x1="50" y1="42" x2="38" y2="50" ${common}/>
      <line x1="50" y1="42" x2="62" y2="52" ${common}/>
      <line x1="50" y1="60" x2="40" y2="80" ${common}/>
      <line x1="50" y1="60" x2="60" y2="78" ${common}/>
    `,
    run: `
      <circle cx="52" cy="24" r="6" ${common}/>
      <line x1="52" y1="30" x2="46" y2="58" ${common}/>
      <line x1="49" y1="40" x2="34" y2="42" ${common}/>
      <line x1="49" y1="40" x2="66" y2="48" ${common}/>
      <line x1="46" y1="58" x2="32" y2="72" ${common}/>
      <line x1="46" y1="58" x2="62" y2="80" ${common}/>
    `,
    jump: `
      <circle cx="50" cy="20" r="6" ${common}/>
      <line x1="50" y1="26" x2="50" y2="54" ${common}/>
      <line x1="50" y1="36" x2="36" y2="26" ${common}/>
      <line x1="50" y1="36" x2="64" y2="26" ${common}/>
      <line x1="50" y1="54" x2="40" y2="72" ${common}/>
      <line x1="50" y1="54" x2="60" y2="72" ${common}/>
    `,
    landing: `
      <circle cx="50" cy="38" r="6" ${common}/>
      <line x1="50" y1="44" x2="50" y2="62" ${common}/>
      <line x1="50" y1="50" x2="38" y2="58" ${common}/>
      <line x1="50" y1="50" x2="62" y2="58" ${common}/>
      <line x1="50" y1="62" x2="38" y2="80" ${common}/>
      <line x1="50" y1="62" x2="62" y2="80" ${common}/>
    `,
    attack: `
      <circle cx="52" cy="26" r="6" ${common}/>
      <line x1="52" y1="32" x2="50" y2="60" ${common}/>
      <line x1="52" y1="40" x2="30" y2="34" ${common}/>
      <line x1="52" y1="40" x2="74" y2="20" ${common}/>
      <line x1="70" y1="22" x2="80" y2="12" ${common}/>
      <line x1="50" y1="60" x2="42" y2="80" ${common}/>
      <line x1="50" y1="60" x2="58" y2="80" ${common}/>
    `,
    skidStop: `
      <circle cx="46" cy="30" r="6" ${common}/>
      <line x1="46" y1="36" x2="52" y2="62" ${common}/>
      <line x1="47" y1="44" x2="30" y2="52" ${common}/>
      <line x1="49" y1="42" x2="66" y2="36" ${common}/>
      <line x1="52" y1="62" x2="70" y2="76" ${common}/>
      <line x1="52" y1="62" x2="38" y2="76" ${common}/>
    `,
    takeoff: `
      <circle cx="50" cy="30" r="6" ${common}/>
      <line x1="50" y1="36" x2="52" y2="60" ${common}/>
      <line x1="50" y1="42" x2="38" y2="28" ${common}/>
      <line x1="50" y1="42" x2="62" y2="28" ${common}/>
      <line x1="52" y1="60" x2="42" y2="78" ${common}/>
      <line x1="52" y1="60" x2="62" y2="78" ${common}/>
    `,
  }
  return poses[clip] || poses.idle
}
