import { groupBy, keyBy, mapValues, sortBy, uniqueId } from 'lodash-es'
import { computed, ref, watch } from 'vue'
import { createSharedComposable, useSessionStorage } from '@vueuse/core'
import { nanoid } from 'nanoid'

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
    const id = nanoid(5)
    return {
      id,
      title: `Section: ${id}`,
      sortIndex: index * 1000 + 1000
    }
  })
}

const generatePosts = (count: number, sectionId: string, sectionIndex: number): Post[] => {
  return Array.from({ length: count }, (_, index) => {
    const id = nanoid(5)
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
  const sectionsCount = useSessionStorage('sectionsCount', 5)
  const postsPerSectionCount = useSessionStorage('postsPerSectionCount', 20)

  const sections = ref<Section[]>([])
  const posts = ref<Post[]>([])

  const createPost = (post: Pick<Post, 'sectionId'> & Partial<Post>): Post => {
    return {
      id: post.id ?? nanoid(5),
      sectionId: post.sectionId,
      subject: post.subject ?? `New post: ${uniqueId()}`,
      attachment: post.attachment ?? `https://padlet.net/monsters/${posts.value.length}.png`,
      sortIndex: post.sortIndex ?? 0
    }
  }

  const addPost = (post: Post) => {
    posts.value.push(post)
  }

  const doesPostExist = (postId: string) => {
    return posts.value.some((post) => post.id === postId)
  }

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
    postsBySectionId,

    createPost,
    addPost,
    doesPostExist
  }
})
