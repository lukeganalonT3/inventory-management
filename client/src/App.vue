<template>
  <!-- --sidebar-width follows the collapsed state so the grid column resizes with it -->
  <div class="app-shell" :style="{ '--sidebar-width': collapsed ? 'var(--sidebar-width-rail)' : 'var(--sidebar-width-full)' }">
    <AppSidebar
      :open="sidebarOpen"
      :collapsed="collapsed"
      :can-toggle="!isNarrow"
      @close="sidebarOpen = false"
      @toggle-collapsed="toggleCollapsed"
    />

    <div class="app-body">
      <header class="app-header">
        <button
          type="button"
          class="menu-button"
          aria-label="Open navigation"
          :aria-expanded="sidebarOpen ? 'true' : 'false'"
          @click="sidebarOpen = true"
        >
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="M3 5h14M3 10h14M3 15h14" />
          </svg>
        </button>
        <h1 class="app-title">{{ pageTitle }}</h1>
        <div class="app-actions">
          <LanguageSwitcher />
          <ProfileMenu
            @show-profile-details="showProfileDetails = true"
            @show-tasks="openTasks"
          />
        </div>
      </header>

      <FilterBar />

      <main class="main-content">
        <router-view />
      </main>
    </div>

    <ProfileDetailsModal
      :is-open="showProfileDetails"
      @close="showProfileDetails = false"
    />

    <TasksModal
      :is-open="showTasks"
      :tasks="tasks"
      @close="closeTasks"
      @add-task="addTask"
      @delete-task="deleteTask"
      @toggle-task="toggleTask"
    />
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useTasks } from './composables/useTasks'
import { useI18n } from './composables/useI18n'
import AppSidebar from './components/AppSidebar.vue'
import FilterBar from './components/FilterBar.vue'
import ProfileMenu from './components/ProfileMenu.vue'
import ProfileDetailsModal from './components/ProfileDetailsModal.vue'
import TasksModal from './components/TasksModal.vue'
import LanguageSwitcher from './components/LanguageSwitcher.vue'

export default {
  name: 'App',
  components: {
    AppSidebar,
    FilterBar,
    ProfileMenu,
    ProfileDetailsModal,
    TasksModal,
    LanguageSwitcher
  },
  setup() {
    const { tasks, showTasks, closeTasks, openTasks, loadTasks, addTask, deleteTask, toggleTask } = useTasks()
    const { t } = useI18n()
    const route = useRoute()
    const showProfileDetails = ref(false)
    const sidebarOpen = ref(false)

    // Page title comes from the route path, reusing the sidebar's i18n labels.
    // "Reports" has no i18n key yet, so it stays hardcoded like in the sidebar.
    const pageTitle = computed(() => {
      const titles = {
        '/': t('nav.overview'),
        '/inventory': t('nav.inventory'),
        '/orders': t('nav.orders'),
        '/spending': t('nav.finance'),
        '/demand': t('nav.demandForecast'),
        '/reports': 'Reports'
      }
      return titles[route.path] || t('nav.companyName')
    })

    // Sidebar mode. Width defaults come from matchMedia (not CSS alone) because the
    // collapsed state also drives labels, aria attributes and the grid width in JS.
    // <900px: icons-only rail; <640px: off-canvas drawer with full labels.
    const STORAGE_KEY = 'sidebar-collapsed'
    const readSaved = () => {
      try {
        const v = localStorage.getItem(STORAGE_KEY)
        return v === null ? null : v === 'true'
      } catch (e) {
        return null // storage blocked: fall back to the width default
      }
    }
    const savedCollapsed = ref(readSaved())
    const narrowQuery = window.matchMedia('(max-width: 900px)')
    const drawerQuery = window.matchMedia('(max-width: 639px)')
    const isNarrow = ref(narrowQuery.matches)
    const isDrawer = ref(drawerQuery.matches)
    const onNarrow = (e) => { isNarrow.value = e.matches }
    const onDrawer = (e) => { isDrawer.value = e.matches }
    narrowQuery.addEventListener('change', onNarrow)
    drawerQuery.addEventListener('change', onDrawer)
    onBeforeUnmount(() => {
      narrowQuery.removeEventListener('change', onNarrow)
      drawerQuery.removeEventListener('change', onDrawer)
    })

    // The saved choice only applies on wide screens: on tablets the rail is forced
    // so a choice made on a desktop does not break a small viewport (and vice versa).
    const collapsed = computed(() => {
      if (isDrawer.value) return false
      if (isNarrow.value) return true
      return savedCollapsed.value === true
    })

    const toggleCollapsed = () => {
      savedCollapsed.value = !collapsed.value
      try {
        localStorage.setItem(STORAGE_KEY, String(savedCollapsed.value))
      } catch (e) {
        // ignore: the choice just will not persist
      }
    }

    // Close the mobile drawer whenever navigation happens.
    watch(() => route.path, () => {
      sidebarOpen.value = false
    })

    onMounted(loadTasks)

    return {
      t,
      showProfileDetails,
      showTasks,
      openTasks,
      closeTasks,
      sidebarOpen,
      collapsed,
      isNarrow,
      toggleCollapsed,
      pageTitle,
      tasks,
      addTask,
      deleteTask,
      toggleTask
    }
  }
}
</script>


<style>
/* Design tokens: defined once here, read by shared primitives and components. */
:root {
  /* Color */
  --color-bg: #f8fafc;
  --color-surface: #ffffff;
  --color-border: #e2e8f0;
  --color-border-strong: #cbd5e1;
  --color-text: #0f172a;
  --color-text-body: #334155;
  --color-text-muted: #64748b;
  --color-accent: #2563eb;
  --color-accent-soft: #eff6ff;
  --color-success: #059669;
  --color-warning: #ea580c;
  --color-danger: #dc2626;

  /* Sidebar */
  --sidebar-bg: #0f172a;
  --sidebar-text: #cbd5e1;
  --sidebar-text-active: #ffffff;
  --sidebar-hover: rgba(255, 255, 255, 0.06);
  --sidebar-active: rgba(255, 255, 255, 0.1);
  --sidebar-width-full: 248px;
  --sidebar-width-rail: 72px;
  --sidebar-width: var(--sidebar-width-full); /* overridden on .app-shell */

  /* Spacing: 4px base */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.5rem;
  --space-6: 2rem;

  /* Radius: sm for controls and badges, md for cards and panels */
  --radius-sm: 6px;
  --radius-md: 10px;

  --shadow-hover: 0 2px 8px rgba(15, 23, 42, 0.06);

  /* Type */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 0.938rem;
  --text-lg: 1.125rem;
  --text-xl: 1.5rem;
  --text-stat: 2rem;

  --header-height: 56px;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--font-sans);
  background: var(--color-bg);
  color: var(--color-text-body);
  font-size: var(--text-base);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

/* Shell: sidebar + content column */
.app-shell {
  display: grid;
  /* minmax(0, 1fr) lets the column shrink below its content's min width,
     so wide tables scroll inside .table-container instead of widening the page. */
  grid-template-columns: var(--sidebar-width) minmax(0, 1fr);
  min-height: 100vh;
  transition: grid-template-columns 0.2s ease;
}

.app-body {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.app-header {
  position: sticky;
  top: 0;
  /* Above page content, below the drawer (50) and modals */
  z-index: 40;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  height: var(--header-height);
  padding: 0 var(--space-6);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.app-title {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-text);
  letter-spacing: -0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.app-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.menu-button {
  display: none;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-body);
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.menu-button:hover {
  background: var(--color-bg);
  border-color: var(--color-border-strong);
}

.menu-button svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.5;
  stroke-linecap: round;
}

.main-content {
  flex: 1;
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  padding: var(--space-5) var(--space-6);
  /* Safety net: some views have fixed-width chart/search elements that overflow on
     narrow screens; scroll inside the content area instead of the whole page. */
  overflow-x: auto;
}

/* In-page heading used by views (their scoped rules may add layout) */
.page-header {
  margin-bottom: var(--space-5);
}

.page-header h2 {
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: var(--space-1);
  letter-spacing: -0.02em;
}

.page-header p {
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-5);
}

.stat-card {
  background: var(--color-surface);
  padding: var(--space-4) var(--space-5);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.stat-card:hover {
  border-color: var(--color-border-strong);
  box-shadow: var(--shadow-hover);
}

.stat-label {
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  font-weight: 500;
  margin-bottom: var(--space-2);
}

.stat-value {
  font-size: var(--text-stat);
  font-weight: 600;
  color: var(--color-text);
  letter-spacing: -0.02em;
}

.stat-card.warning .stat-value { color: var(--color-warning); }
.stat-card.success .stat-value { color: var(--color-success); }
.stat-card.danger .stat-value { color: var(--color-danger); }
.stat-card.info .stat-value { color: var(--color-accent); }

.card {
  background: var(--color-surface);
  border-radius: var(--radius-md);
  padding: var(--space-5);
  border: 1px solid var(--color-border);
  margin-bottom: var(--space-5);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--color-border);
}

.card-title {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-text);
  letter-spacing: -0.01em;
}

.table-container {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background: var(--color-bg);
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
}

th {
  text-align: left;
  padding: var(--space-2) var(--space-3);
  font-weight: 500;
  color: var(--color-text-muted);
  font-size: var(--text-xs);
}

td {
  padding: var(--space-2) var(--space-3);
  border-top: 1px solid #f1f5f9;
  color: var(--color-text-body);
  font-size: var(--text-sm);
}

tbody tr {
  transition: background-color 0.15s ease;
}

tbody tr:hover {
  background: var(--color-bg);
}

.badge {
  display: inline-block;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: 500;
}

/* Status colors are unchanged so views and charts stay consistent */
.badge.success,
.badge.increasing { background: #d1fae5; color: #065f46; }

.badge.warning,
.badge.medium { background: #fed7aa; color: #92400e; }

.badge.danger,
.badge.decreasing,
.badge.high { background: #fecaca; color: #991b1b; }

.badge.info,
.badge.low { background: #dbeafe; color: #1e40af; }

.badge.stable { background: #e0e7ff; color: #3730a3; }

.loading {
  text-align: center;
  padding: var(--space-6);
  color: var(--color-text-muted);
  font-size: var(--text-base);
}

.error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  padding: var(--space-4);
  border-radius: var(--radius-sm);
  margin: var(--space-4) 0;
  font-size: var(--text-base);
}

@media (max-width: 900px) {
  .app-header {
    padding: 0 var(--space-4);
  }

  .main-content {
    padding: var(--space-4);
  }
}

/* Below 640px the sidebar leaves the grid and becomes an off-canvas drawer */
@media (max-width: 639px) {
  .app-shell {
    grid-template-columns: minmax(0, 1fr);
  }

  .menu-button {
    display: inline-flex;
  }
}

@media (prefers-reduced-motion: reduce) {
  .app-shell {
    transition: none;
  }
}

/* Drop the profile name on small screens so the header actions fit */
@media (max-width: 639px) {
  .app-actions .profile-name {
    display: none;
  }
}
</style>
