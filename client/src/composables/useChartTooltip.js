import { reactive, onMounted, onBeforeUnmount } from 'vue'

let nextId = 0

/**
 * Shared hover/focus tooltip state for custom charts.
 *
 * Usage: spread `markProps(key, content)` onto each chart mark and render one
 * <ChartTooltip :tip="tip" /> per view. `content` is
 * { title, rows: [{ label, value, color? }] }. Marks become keyboard focusable
 * (tabindex=0) and the tooltip is linked to the active mark via aria-describedby.
 */
export function useChartTooltip() {
  const id = `chart-tooltip-${++nextId}`
  const tip = reactive({ id, visible: false, key: null, x: 0, y: 0, title: '', rows: [] })

  const show = (key, content, x, y) => {
    tip.key = key
    tip.title = content.title || ''
    tip.rows = content.rows || []
    tip.x = x
    tip.y = y
    tip.visible = true
  }

  const hide = () => {
    tip.visible = false
    tip.key = null
  }

  // Keyboard focus has no pointer, so anchor to the top-centre of the mark.
  const anchorToElement = (el) => {
    const r = el.getBoundingClientRect()
    return [r.left + r.width / 2, r.top]
  }

  const markProps = (key, content) => ({
    tabindex: 0,
    role: 'img',
    'aria-label': [content.title, ...(content.rows || []).map(r => `${r.label} ${r.value}`)]
      .filter(Boolean).join(', '),
    'aria-describedby': tip.visible && tip.key === key ? id : undefined,
    class: 'chart-mark',
    onMouseenter: (e) => show(key, content, e.clientX, e.clientY),
    onMousemove: (e) => show(key, content, e.clientX, e.clientY),
    onMouseleave: hide,
    onFocus: (e) => show(key, content, ...anchorToElement(e.currentTarget)),
    onBlur: hide
  })

  const onKeydown = (e) => {
    if (e.key === 'Escape' && tip.visible) hide()
  }

  onMounted(() => document.addEventListener('keydown', onKeydown))
  onBeforeUnmount(() => {
    document.removeEventListener('keydown', onKeydown)
    hide()
  })

  return { tip, markProps, hide }
}
