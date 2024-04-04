import { groupBy, keyBy, mapValues, sortBy, uniqueId } from 'lodash-es'
import { computed, ref, watch } from 'vue'
import { createSharedComposable } from '@vueuse/core'

export interface Section {
  id: string
  title: string
  sortIndex: number
}

export interface Post {
  id: string
  sectionId: string
  subject: string
  attachment: string
  sortIndex: number
}

const generateSections = (count: number): Section[] => {
  return Array.from({ length: count }, (_, index) => {
    const id = uniqueId('section')
    return {
      id,
      title: `Section: ${id}`,
      sortIndex: index * 1000 + 1000
    }
  })
}

const generatePosts = (count: number, sectionId: string, sectionIndex: number): Post[] => {
  return Array.from({ length: count }, (_, index) => {
    const id = uniqueId('post')
    return {
      id,
      sectionId,
      subject: `Post: ${id}`,
      attachment: `https://padlet.net/monsters/${(sectionIndex + 1) * (index + 1)}.png`,
      sortIndex: index * 10000 + 10000
    }
  })
}

export const useDummyData = createSharedComposable(() => {
  const sectionsCount = ref(5)
  const postsPerSectionCount = ref(20)

  const sections = ref<Section[]>([])
  const posts = ref<Post[]>([])

  setTimeout(() => {
    watch(
      sectionsCount,
      (count) => {
        sections.value = generateSections(count)
        posts.value = sections.value.flatMap((section, index) =>
          generatePosts(postsPerSectionCount.value, section.id, index)
        )
      },
      { immediate: true }
    )

    watch(
      postsPerSectionCount,
      (count) => {
        posts.value = sections.value.flatMap((section, index) =>
          generatePosts(count, section.id, index)
        )
      },
      { immediate: true }
    )
  }, 0)

  const sectionById = computed(() => keyBy(sections.value, 'id'))
  const postById = computed(() => keyBy(posts.value, 'id'))

  const sortedSections = computed(() => sortBy(sections.value, 'sortIndex'))
  const postsBySectionId = computed(() =>
    mapValues(groupBy(posts.value, 'sectionId'), (posts) => sortBy(posts, 'sortIndex'))
  )

  return {
    sectionsCount,
    postsPerSectionCount,
    sections,
    posts,

    sectionById,
    postById,

    sortedSections,
    postsBySectionId
  }
})
