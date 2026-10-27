<template>
  <Teleport to="body">
    <div
      v-if="tip.visible"
      :id="tip.id"
      ref="el"
      class="chart-tooltip"
      role="tooltip"
      :style="{ left: pos.left + 'px', top: pos.top + 'px' }"
    >
      <div v-if="tip.title" class="chart-tooltip-title">{{ tip.title }}</div>
      <div v-for="row in tip.rows" :key="row.label" class="chart-tooltip-row">
        <span class="chart-tooltip-label">
          <span v-if="row.color" class="chart-tooltip-swatch" :style="{ background: row.color }"></span>
          {{ row.label }}
        </span>
        <span class="chart-tooltip-value">{{ row.value }}</span>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'

const props = defineProps({
  tip: { type: Object, required: true }
})

const el = ref(null)
const pos = ref({ left: 0, top: 0 })
const OFFSET = 12
const MARGIN = 8

// Default placement is below-right of the anchor. We measure the rendered
// tooltip and flip to the opposite side when it would overflow the viewport,
// then clamp so it never leaves the screen on small viewports.
const place = async () => {
  if (!props.tip.visible) return
  // First pass renders near the anchor; wait for the element to measure it.
  pos.value = { left: props.tip.x + OFFSET, top: props.tip.y + OFFSET }
  await nextTick()
  if (!el.value) return
  const w = el.value.offsetWidth
  const h = el.value.offsetHeight
  const vw = document.documentElement.clientWidth
  const vh = window.innerHeight

  let left = props.tip.x + OFFSET
  if (left + w + MARGIN > vw) left = props.tip.x - OFFSET - w
  let top = props.tip.y + OFFSET
  if (top + h + MARGIN > vh) top = props.tip.y - OFFSET - h

  left = Math.max(MARGIN, Math.min(left, vw - w - MARGIN))
  top = Math.max(MARGIN, Math.min(top, vh - h - MARGIN))
  pos.value = { left, top }
}

watch(() => [props.tip.visible, props.tip.x, props.tip.y, props.tip.title, props.tip.rows], place, { flush: 'post' })
</script>

<style scoped>
.chart-tooltip {
  position: fixed;
  z-index: 2000;
  min-width: 8rem;
  max-width: min(20rem, calc(100vw - 16px));
  padding: 0.5rem 0.75rem;
  background: #0f172a;
  color: #f8fafc;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.25);
  font-size: 0.75rem;
  line-height: 1.4;
  pointer-events: none;
}

.chart-tooltip-title {
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.chart-tooltip-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.chart-tooltip-label {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  color: #cbd5e1;
}

.chart-tooltip-swatch {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  flex-shrink: 0;
}

.chart-tooltip-value {
  font-weight: 600;
  white-space: nowrap;
}
</style>
