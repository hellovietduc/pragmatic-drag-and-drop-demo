import { useDummyData, type Post } from '@/stores/useDummyData'
import { getSortIndexBetweenItems } from '@/bits/reorder'
import type { RelativePosition } from '@/pragmatic-drag-and-drop/helpers'

export const usePostReorder = () => {
  const { postsBySectionId, postById } = useDummyData()

  const calculateNewSortIndex = (
    anchorPost: Post,
    newPostRelativePosition: RelativePosition
  ): number | null => {
    const allPostsInSection = postsBySectionId.value[anchorPost.sectionId]
    const anchorPostIndex = allPostsInSection?.findIndex((post) => post.id === anchorPost.id) ?? -1
    if (anchorPostIndex === -1) {
      return null
    }

    let prevPost: Post
    let nextPost: Post
    if (newPostRelativePosition === 'before') {
      prevPost = allPostsInSection[anchorPostIndex - 1]
      nextPost = allPostsInSection[anchorPostIndex]
    } else {
      prevPost = allPostsInSection[anchorPostIndex]
      nextPost = allPostsInSection[anchorPostIndex + 1]
    }

    return getSortIndexBetweenItems(prevPost, nextPost)
  }

  const reorderPost = (
    anchorPost: Post,
    movingPost: Post,
    newPostRelativePosition: RelativePosition
  ) => {
    const newSortIndex = calculateNewSortIndex(anchorPost, newPostRelativePosition)
    if (newSortIndex === null) return
    const post = postById.value[movingPost.id]
    if (!post) return
    post.sortIndex = newSortIndex
    post.sectionId = anchorPost.sectionId
  }

  return {
    calculateNewSortIndex,
    reorderPost
  }
}
