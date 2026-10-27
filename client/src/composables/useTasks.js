import { ref, computed } from 'vue'
import { api } from '../api'
import { useAuth } from './useAuth'

// Module-scoped state: App, AppSidebar and Dashboard all call useTasks() and must
// see the same list and the same modal open state, so it lives outside the function.
const apiTasks = ref([])
const showTasks = ref(false)
// currentUser is a computed returning plain (non-reactive) mock task objects, so
// in-place mutations (toggle/delete) would not trigger updates. Bumping this
// counter, which `tasks` reads, forces the merged list to recompute.
const mockVersion = ref(0)

const { currentUser } = useAuth()

const tasks = computed(() => {
  mockVersion.value // reactive dependency, see above
  return [...currentUser.value.tasks, ...apiTasks.value]
})

const dayMs = 1000 * 60 * 60 * 24

// 'YYYY-MM-DD' parsed as a LOCAL date. new Date('2025-10-06') is UTC midnight, which
// shows as the previous day in timezones behind UTC.
export const parseDueDate = (dueDate) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(dueDate || '')
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(dueDate)
}

// Whole days from today (local midnight) until dueDate; negative = overdue.
// Mirrors TasksModal.getStatusClass. Invalid dates sort last as far-future.
export const daysUntil = (dueDate) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = parseDueDate(dueDate)
  if (isNaN(due.getTime())) return Infinity
  due.setHours(0, 0, 0, 0)
  return Math.ceil((due - today) / dayMs)
}

// 'overdue' | 'urgent' | 'upcoming' | 'completed' (same buckets as TasksModal)
export const taskStatusClass = (task) => {
  if (task.status === 'completed') return 'completed'
  const d = daysUntil(task.dueDate)
  if (d < 0) return 'overdue'
  if (d <= 1) return 'urgent'
  return 'upcoming'
}

// Pending only, soonest due date first. Overdue tasks have the smallest (negative)
// day counts, so a plain ascending sort puts them first, most overdue at the top.
const pendingTasks = computed(() =>
  tasks.value
    .filter(task => task.status === 'pending')
    .sort((a, b) => daysUntil(a.dueDate) - daysUntil(b.dueDate))
)

const pendingCount = computed(() => pendingTasks.value.length)

const loadTasks = async () => {
  try {
    apiTasks.value = await api.getTasks()
  } catch (err) {
    console.error('Failed to load tasks:', err)
  }
}

const addTask = async (taskData) => {
  try {
    const newTask = await api.createTask(taskData)
    // Add new task to the beginning of the array
    apiTasks.value.unshift(newTask)
  } catch (err) {
    console.error('Failed to add task:', err)
  }
}

const deleteTask = async (taskId) => {
  try {
    // Mock tasks (from currentUser) are local-only; the rest live in the API
    const index = currentUser.value.tasks.findIndex(t => t.id === taskId)
    if (index !== -1) {
      currentUser.value.tasks.splice(index, 1)
      mockVersion.value++
    } else {
      await api.deleteTask(taskId)
      apiTasks.value = apiTasks.value.filter(t => t.id !== taskId)
    }
  } catch (err) {
    console.error('Failed to delete task:', err)
  }
}

const toggleTask = async (taskId) => {
  try {
    const mockTask = currentUser.value.tasks.find(t => t.id === taskId)
    if (mockTask) {
      mockTask.status = mockTask.status === 'pending' ? 'completed' : 'pending'
      mockVersion.value++
    } else {
      const updatedTask = await api.toggleTask(taskId)
      const index = apiTasks.value.findIndex(t => t.id === taskId)
      if (index !== -1) {
        apiTasks.value[index] = updatedTask
      }
    }
  } catch (err) {
    console.error('Failed to toggle task:', err)
  }
}

const openTasks = () => { showTasks.value = true }
const closeTasks = () => { showTasks.value = false }

export function useTasks() {
  return {
    tasks,
    pendingTasks,
    pendingCount,
    showTasks,
    openTasks,
    closeTasks,
    loadTasks,
    addTask,
    deleteTask,
    toggleTask
  }
}
