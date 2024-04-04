import { groupBy, keyBy, uniqueId } from 'lodash-es'
import { computed, ref } from 'vue'
import { createSharedComposable } from '@vueuse/core'

export interface Section {
  id: string
  title: string
}

export interface Post {
  id: string
  sectionId: string
  subject: string
  attachment: string
}

const generateSections = (count: number) => {
  return Array.from({ length: count }, () => {
    const id = uniqueId('section')
    return {
      id,
      title: `Section: ${id}`
    }
  })
}

const generatePosts = (count: number, sectionId: string, sectionIndex: number) => {
  return Array.from({ length: count }, (_, index) => {
    const id = uniqueId('post')
    return {
      id,
      sectionId,
      subject: `Post: ${id}`,
      attachment: `https://padlet.net/monsters/${(sectionIndex + 1) * (index + 1)}.png`
    }
  })
}

export const useDummyData = createSharedComposable(() => {
  const sectionsCount = ref(5)
  const postsPerSectionCount = ref(7)

  const sections = computed(() => generateSections(sectionsCount.value))
  const posts = computed(() =>
    sections.value.flatMap((section, index) =>
      generatePosts(postsPerSectionCount.value, section.id, index)
    )
  )

  const sectionById = computed(() => keyBy(sections.value, 'id'))
  const postById = computed(() => keyBy(posts.value, 'id'))
  const postsBySectionId = computed(() => groupBy(posts.value, 'sectionId'))

  return {
    sectionsCount,
    postsPerSectionCount,

    sections,
    posts,
    sectionById,
    postById,
    postsBySectionId
  }
})
