import { extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import { useDummyData, type Post } from '@/stores/useDummyData'
import type { ItemData } from '@/composables/useElementDragAndDrop'
import { getSortIndexBetweenItems } from '@/bits/reorder'

export type PostDragData = { postId: string; sectionId: string }

type Optional<T extends object, K extends keyof T> = Omit<T, K> & Partial<T>

export const usePostReorder = () => {
  const { postsBySectionId } = useDummyData()

  const calculateSortIndex = (target: Optional<PostDragData, 'postId'> & ItemData) => {
    const targetPostsArray = postsBySectionId.value[target.sectionId]
    const targetIndex = targetPostsArray?.findIndex((post) => post.id === target.postId)

    if (targetIndex === -1 || targetIndex === undefined) {
      return
    }

    const closestEdgeOfTarget = extractClosestEdge(target)
    if (!closestEdgeOfTarget) return

    let prevPost: Post
    let nextPost: Post
    if (closestEdgeOfTarget === 'top') {
      prevPost = targetPostsArray[targetIndex - 1]
      nextPost = targetPostsArray[targetIndex]
    } else {
      prevPost = targetPostsArray[targetIndex]
      nextPost = targetPostsArray[targetIndex + 1]
    }

    return getSortIndexBetweenItems(prevPost, nextPost)
  }

  const reorderPost = (
    source: PostDragData,
    target: Optional<PostDragData, 'postId'> & ItemData
  ) => {
    const sourcePostsArray = postsBySectionId.value[source.sectionId]
    const targetPostsArray = postsBySectionId.value[target.sectionId]

    const sourceIndex = sourcePostsArray.findIndex((post) => post.id === source.postId)
    const targetIndex = targetPostsArray?.findIndex((post) => post.id === target.postId)

    const isValidSource = sourceIndex >= 0 && sourceIndex < sourcePostsArray.length

    if (!isValidSource) {
      return
    }

    if (targetIndex === -1 || targetIndex === undefined) {
      const sourcePost = sourcePostsArray[sourceIndex]
      sourcePost.sectionId = target.sectionId
      return
    }

    const closestEdgeOfTarget = extractClosestEdge(target)
    if (!closestEdgeOfTarget) return

    let prevPost: Post
    let nextPost: Post
    if (closestEdgeOfTarget === 'top') {
      prevPost = targetPostsArray[targetIndex - 1]
      nextPost = targetPostsArray[targetIndex]
    } else {
      prevPost = targetPostsArray[targetIndex]
      nextPost = targetPostsArray[targetIndex + 1]
    }

    const newSortIndex = getSortIndexBetweenItems(prevPost, nextPost)
    if (!newSortIndex) return

    const sourcePost = sourcePostsArray[sourceIndex]
    sourcePost.sortIndex = newSortIndex
    sourcePost.sectionId = target.sectionId
  }

  return {
    calculateSortIndex,
    reorderPost
  }
}
