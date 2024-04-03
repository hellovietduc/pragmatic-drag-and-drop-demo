import { groupBy, uniqueId } from 'lodash-es'
import { computed, ref } from 'vue'

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

export const useDummyData = () => {
  const sections = ref<Section[]>(generateSections(5))
  const posts = ref<Post[]>(
    sections.value.map((section, index) => generatePosts(7, section.id, index)).flat()
  )

  const sectionById = computed(() => groupBy(sections.value, 'id'))
  const postById = computed(() => groupBy(posts.value, 'id'))
  const postsBySectionId = computed(() => groupBy(posts.value, 'sectionId'))

  return {
    sections,
    posts,
    sectionById,
    postById,
    postsBySectionId
  }
}
