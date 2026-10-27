<template>
  <!-- Backdrop only matters in drawer mode (<900px); hidden by CSS on desktop -->
  <div class="sidebar-backdrop" :class="{ open }" aria-hidden="true" @click="$emit('close')"></div>

  <aside class="sidebar" :class="{ open, collapsed }">
    <div class="sidebar-brand">
      <span class="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 20 20">
          <path d="M3 6.5 10 3l7 3.5v7L10 17l-7-3.5v-7ZM3 6.5 10 10l7-3.5M10 10v7" />
        </svg>
      </span>
      <div class="brand-text">
        <div class="brand-name">{{ t('nav.companyName') }}</div>
        <div class="brand-sub">{{ t('nav.subtitle') }}</div>
      </div>
    </div>

    <nav aria-label="Primary" class="sidebar-nav">
      <!-- router-link-exact-active (not -active) so "/" does not match every page -->
      <router-link
        v-for="item in items"
        :key="item.to"
        :to="item.to"
        class="nav-item"
        :title="collapsed ? item.label : null"
        :aria-label="collapsed ? item.label : null"
        @click="$emit('close')"
      >
        <svg class="nav-icon" viewBox="0 0 20 20" aria-hidden="true">
          <path :d="item.icon" />
        </svg>
        <span class="nav-label">{{ item.label }}</span>
      </router-link>
    </nav>

    <!-- Tasks is an action (opens the shared modal), not a route, so it is a button -->
    <div class="sidebar-tasks">
      <button
        type="button"
        class="nav-item tasks-button"
        :title="tasksLabel"
        :aria-label="tasksLabel"
        @click="openFromSidebar"
      >
        <span class="tasks-icon-wrap">
          <svg class="nav-icon" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M4 4.5h12v12H4v-12ZM7 10l2 2 4-4.5" />
          </svg>
          <span v-if="pendingCount > 0" class="tasks-dot" aria-hidden="true">{{ pendingCount > 99 ? '99+' : pendingCount }}</span>
        </span>
        <span class="nav-label">{{ t('tasks.title') }}</span>
        <span v-if="pendingCount > 0" class="tasks-badge nav-label" aria-hidden="true">{{ pendingCount }}</span>
      </button>

      <ul v-if="!collapsed && nextTasks.length" class="tasks-preview">
        <li v-for="task in nextTasks" :key="task.id" class="tasks-preview-item" :class="{ overdue: isOverdue(task) }">
          {{ task.title }}
        </li>
      </ul>
    </div>

    <button
      v-if="canToggle"
      type="button"
      class="collapse-toggle"
      :aria-expanded="collapsed ? 'false' : 'true'"
      :aria-label="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
      :title="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
      @click="$emit('toggle-collapsed')"
    >
      <svg class="nav-icon chevron" viewBox="0 0 20 20" aria-hidden="true">
        <path d="M12 5l-5 5 5 5" />
      </svg>
      <span class="nav-label">{{ collapsed ? '' : 'Collapse' }}</span>
    </button>
  </aside>
</template>

<script>
import { computed } from 'vue'
import { useI18n } from '../composables/useI18n'
import { useTasks, taskStatusClass } from '../composables/useTasks'

export default {
  name: 'AppSidebar',
  props: {
    open: {
      type: Boolean,
      default: false
    },
    // Icons-only rail; labels are hidden but exposed via aria-label/title
    collapsed: {
      type: Boolean,
      default: false
    },
    // Toggle is hidden on tablets where the rail is forced
    canToggle: {
      type: Boolean,
      default: true
    }
  },
  emits: ['close', 'toggle-collapsed'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const { pendingTasks, pendingCount, openTasks } = useTasks()

    const nextTasks = computed(() => pendingTasks.value.slice(0, 3))
    const tasksLabel = computed(() => t('tasks.myTasksAria', { count: pendingCount.value }))
    const isOverdue = (task) => taskStatusClass(task) === 'overdue'

    const openFromSidebar = () => {
      openTasks()
      // Drawer mode: get the drawer out of the way of the modal
      emit('close')
    }

    // Icon paths are 20x20 stroke-only outlines
    const items = computed(() => [
      { to: '/', label: t('nav.overview'), icon: 'M3 3h5.5v6H3V3ZM11.5 3H17v3.5h-5.5V3ZM11.5 9.5H17V17h-5.5V9.5ZM3 12h5.5v5H3v-5Z' },
      { to: '/inventory', label: t('nav.inventory'), icon: 'M3 6.5 10 3l7 3.5v7L10 17l-7-3.5v-7ZM3 6.5 10 10l7-3.5M10 10v7' },
      { to: '/orders', label: t('nav.orders'), icon: 'M5 3h10v14l-2-1.5-1.5 1.5L10 15.5 8.5 17 7 15.5 5 17V3ZM8 7h4M8 10.5h4' },
      { to: '/spending', label: t('nav.finance'), icon: 'M3 16.5h14M5 16.5V10M9 16.5V5M13 16.5V8M17 16.5V12' },
      { to: '/demand', label: t('nav.demandForecast'), icon: 'M3 14l4-4 3 3 7-7M13 6h4v4' },
      // "Reports" has no i18n key yet, so it stays hardcoded
      { to: '/reports', label: 'Reports', icon: 'M5 2.5h7l3.5 3.5V17.5H5V2.5ZM12 2.5V6h3.5M8 10h5M8 13h5' }
    ])

    return { t, items, pendingCount, nextTasks, tasksLabel, isOverdue, openFromSidebar }
  }
}
</script>

<style scoped>
.sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding: var(--space-5) var(--space-3);
  background: var(--sidebar-bg);
  color: var(--sidebar-text);
  overflow-x: hidden;
  overflow-y: auto;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 0 var(--space-2);
}

.brand-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  background: var(--color-accent);
  border-radius: var(--radius-sm);
}

.brand-mark svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: #ffffff;
  stroke-width: 1.5;
  stroke-linejoin: round;
}

.brand-name {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--sidebar-text-active);
  line-height: 1.25;
}

.brand-sub {
  font-size: var(--text-xs);
  color: #94a3b8;
  line-height: 1.3;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  color: var(--sidebar-text);
  text-decoration: none;
  font-size: var(--text-sm);
  font-weight: 500;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.nav-item:hover {
  background: var(--sidebar-hover);
  color: var(--sidebar-text-active);
}

.nav-item.router-link-exact-active {
  background: var(--sidebar-active);
  color: var(--sidebar-text-active);
}

/* Light outline: the global accent blue is too dark against the slate sidebar */
.nav-item:focus-visible {
  outline: 2px solid #93c5fd;
  outline-offset: -2px;
}

.nav-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.sidebar-tasks {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding-top: var(--space-3);
  border-top: 1px solid var(--sidebar-hover);
}

.tasks-button {
  width: 100%;
  background: transparent;
  border: 0;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
}

.tasks-icon-wrap {
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
}

.tasks-badge {
  margin-left: auto;
  min-width: 20px;
  padding: 0 6px;
  border-radius: 10px;
  background: var(--color-accent);
  color: #ffffff;
  font-size: var(--text-xs);
  line-height: 20px;
  text-align: center;
}

/* Count dot on the icon: only shown in the rail, where the badge is hidden */
.tasks-dot {
  display: none;
  position: absolute;
  top: -6px;
  right: -8px;
  min-width: 16px;
  padding: 0 4px;
  border-radius: 8px;
  background: var(--color-accent);
  color: #ffffff;
  font-size: 10px;
  font-weight: 600;
  line-height: 16px;
  text-align: center;
}

.collapsed .tasks-dot {
  display: block;
}

.tasks-preview {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: 0 var(--space-3) 0 calc(var(--space-3) + 18px + var(--space-3));
}

.tasks-preview-item {
  font-size: var(--text-xs);
  color: #94a3b8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tasks-preview-item.overdue {
  color: #fca5a5;
}

.collapse-toggle {
  margin-top: auto;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  background: transparent;
  border: 0;
  border-radius: var(--radius-sm);
  color: var(--sidebar-text);
  font: inherit;
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.collapse-toggle:hover {
  background: var(--sidebar-hover);
  color: var(--sidebar-text-active);
}

.collapse-toggle:focus-visible {
  outline: 2px solid #93c5fd;
  outline-offset: -2px;
}

/* Chevron points left to collapse, flips right when collapsed */
.chevron {
  transition: transform 0.2s ease;
}

.collapsed .chevron {
  transform: rotate(180deg);
}

.nav-label {
  white-space: nowrap;
}

.brand-text {
  min-width: 0;
}

/* Rail mode: hide text, center icons */
.collapsed .nav-label,
.collapsed .tasks-badge,
.collapsed .brand-text {
  display: none;
}

.collapsed .sidebar-brand,
.collapsed .nav-item,
.collapsed .collapse-toggle {
  justify-content: center;
}

.collapsed .sidebar-brand {
  padding: 0;
}

.sidebar-backdrop {
  display: none;
}

@media (max-width: 639px) {
  .sidebar {
    position: fixed;
    inset: 0 auto 0 0;
    width: min(var(--sidebar-width), 85vw);
    z-index: 50;
    transform: translateX(-100%);
    transition: transform 0.2s ease, visibility 0s linear 0.2s;
    /* Keep offscreen drawer links out of tab order and a11y tree */
    visibility: hidden;
  }

  .sidebar.open {
    transform: translateX(0);
    visibility: visible;
    transition-delay: 0s;
  }

  .sidebar-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 45;
    background: rgba(15, 23, 42, 0.5);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s ease;
  }

  .sidebar-backdrop.open {
    opacity: 1;
    pointer-events: auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  .sidebar,
  .sidebar-backdrop,
  .nav-item,
  .chevron {
    transition: none;
  }
}
</style>
