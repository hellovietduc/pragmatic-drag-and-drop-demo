import { groupBy, keyBy, mapValues, sortBy, uniqueId, sample } from 'lodash-es'
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
  body: string
  attachment: string
  sortIndex: number
  isPinned: boolean
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

const getLoremIpsum = (): string => {
  return sample([
    'Lorem ipsum dolor sit amet.',
    'Lorem ipsum dolor sit amet.',
    'Lorem ipsum dolor sit amet consectetur adipiscing elit urna eu proin viverra.',
    'Lorem ipsum dolor sit amet consectetur adipiscing elit urna eu proin viverra.',
    'Lorem ipsum dolor sit amet consectetur adipiscing elit urna eu proin viverra.',
    'Lorem ipsum dolor sit amet consectetur adipiscing elit urna eu proin viverra faucibus sem dictum quisque suspendisse hendrerit tempus mi fusce tempor egestas erat bibendum ex.',
    'Lorem ipsum dolor sit amet consectetur adipiscing elit urna eu proin viverra faucibus sem dictum quisque suspendisse hendrerit tempus mi fusce tempor egestas erat bibendum ex.',
    'Lorem ipsum dolor sit amet consectetur adipiscing elit vitae ad dictumst neque fringilla tortor sed enim suspendisse. Sagittis praesent parturient curae justo cursus eu a congue commodo ipsum penatibus quam mollis felis dapibus risus dictum consequat pharetra hendrerit.'
  ])
}

const generatePosts = (count: number, sectionId: string, sectionIndex: number): Post[] => {
  return Array.from({ length: count }, (_, index) => {
    const id = nanoid(5)
    return {
      id,
      sectionId,
      subject: `Post: ${id}`,
      body: getLoremIpsum(),
      attachment: `https://padlet.net/monsters/${(sectionIndex + 1) * (index + 1)}.png`,
      sortIndex: index * 10000 + 10000,
      isPinned: false
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
      body: post.body ?? getLoremIpsum(),
      attachment: post.attachment ?? `https://padlet.net/monsters/${posts.value.length}.png`,
      sortIndex: post.sortIndex ?? 0,
      isPinned: false
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
