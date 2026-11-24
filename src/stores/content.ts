import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Category, PageSummary, Profile, Space } from '@/types/models'
import { useAuthStore } from '@/stores/auth'
import * as profilesService from '@/services/supabase/profiles'
import * as spacesService from '@/services/supabase/spaces'
import * as categoriesService from '@/services/supabase/categories'
import * as pagesService from '@/services/supabase/pages'

/**
 * Content store — shared workspace data (profile, spaces, categories, page tree).
 * Components read from this store instead of issuing their own queries,
 * which keeps network traffic low and the UI consistent (Workflow §36, §42).
 */
export const useContentStore = defineStore('content', () => {
  const auth = useAuthStore()

  const profile = ref<Profile | null>(null)
  const spaces = ref<Space[]>([])
  const categories = ref<Category[]>([])
  const spacesLoading = ref(false)
  const loaded = ref(false)

  /** Root pages per space — keyed by space id or 'inbox' for space-less pages. */
  const rootPagesBySpace = ref<Record<string, PageSummary[]>>({})

  const favoritePages = ref<PageSummary[]>([])
  const recentPages = ref<PageSummary[]>([])

  /** Modal state for creating a space from anywhere in the UI. */
  const createSpaceOpen = ref(false)

  const spaceMap = computed(() => Object.fromEntries(spaces.value.map((s) => [s.id, s])))
  const categoryMap = computed(() => Object.fromEntries(categories.value.map((c) => [c.id, c])))

  async function loadProfile() {
    if (!auth.userId) return
    profile.value = await profilesService.getProfile(auth.userId)
  }

  async function loadSpaces() {
    if (!auth.userId) return
    spacesLoading.value = true
    try {
      spaces.value = await spacesService.listSpaces(auth.userId)
    } finally {
      spacesLoading.value = false
    }
  }

  async function loadCategories() {
    if (!auth.userId) return
    categories.value = await categoriesService.listCategories(auth.userId)
  }

  async function loadRootPages(spaceId: string | 'inbox') {
    if (!auth.userId) return
    const spaceParam = spaceId === 'inbox' ? null : spaceId
    rootPagesBySpace.value[spaceId] = await pagesService.listRootPages(auth.userId, {
      spaceId: spaceParam,
    })
  }

  async function loadAll() {
    if (loaded.value) return
    await Promise.all([loadProfile(), loadSpaces(), loadCategories()])
    loaded.value = true
  }

  async function loadRecents() {
    if (!auth.userId) return
    recentPages.value = await pagesService.listRecent(auth.userId)
  }

  async function loadFavorites() {
    if (!auth.userId) return
    favoritePages.value = await pagesService.listFavorites(auth.userId)
  }

  // --- Mutations that keep local state in sync ---

  async function createSpace(name: string) {
    if (!auth.userId) throw new Error('Not signed in.')
    const space = await spacesService.createSpace(
      auth.userId,
      name,
      spaces.value.length,
    )
    spaces.value.push(space)
    return space
  }

  async function renameSpace(id: string, name: string) {
    const err = await spacesService.renameSpace(id, name)
    if (err) throw new Error(err)
    const space = spaces.value.find((s) => s.id === id)
    if (space) space.name = name.trim()
  }

  async function deleteSpace(id: string) {
    const err = await spacesService.deleteSpace(id)
    if (err) throw new Error(err)
    spaces.value = spaces.value.filter((s) => s.id !== id)
    delete rootPagesBySpace.value[id]
  }

  async function createCategory(name: string, color?: string | null) {
    if (!auth.userId) throw new Error('Not signed in.')
    const category = await categoriesService.createCategory(auth.userId, name, color)
    categories.value.push(category)
    return category
  }

  async function deleteCategory(id: string) {
    const err = await categoriesService.deleteCategory(id)
    if (err) throw new Error(err)
    categories.value = categories.value.filter((c) => c.id !== id)
  }

  async function createPage(input: {
    spaceId?: string | null
    parentId?: string | null
    title?: string
    type?: 'page' | 'checklist'
  }) {
    if (!auth.userId) throw new Error('Not signed in.')
    const page = await pagesService.createPage({ userId: auth.userId, ...input })
    const key = input.parentId
      ? undefined
      : input.spaceId ?? 'inbox'
    if (key) {
      rootPagesBySpace.value[key] = [...(rootPagesBySpace.value[key] ?? []), page]
    }
    return page
  }

  function openCreateSpace() {
    createSpaceOpen.value = true
  }

  return {
    profile,
    spaces,
    categories,
    spacesLoading,
    loaded,
    rootPagesBySpace,
    favoritePages,
    recentPages,
    createSpaceOpen,
    spaceMap,
    categoryMap,
    loadProfile,
    loadSpaces,
    loadCategories,
    loadRootPages,
    loadAll,
    loadRecents,
    loadFavorites,
    createSpace,
    renameSpace,
    deleteSpace,
    createCategory,
    deleteCategory,
    createPage,
    openCreateSpace,
  }
})
