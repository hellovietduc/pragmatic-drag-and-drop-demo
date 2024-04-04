import { extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import { useDummyData, type Post } from '@/composables/useDummyData'
import type { ItemData } from '@/composables/useElementDragAndDrop'
import { getSortIndexBetweenItems } from '@/bits/reorder'

export type PostDragData = { postId: string; sectionId: string }

export const usePostReorder = () => {
  const { postsBySectionId } = useDummyData()

  const reorderPost = (source: PostDragData & ItemData, target: PostDragData & ItemData) => {
    const sourcePostsArray = postsBySectionId.value[source.sectionId]
    const targetPostsArray = postsBySectionId.value[target.sectionId]

    const sourceIndex = sourcePostsArray.findIndex((post) => post.id === source.postId)
    const targetIndex = targetPostsArray.findIndex((post) => post.id === target.postId)

    const isValidSource = sourceIndex >= 0 && sourceIndex < sourcePostsArray.length
    const isValidTarget = targetIndex >= 0 && targetIndex < targetPostsArray.length

    if (!isValidSource || !isValidTarget) {
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

    const targetPost = sourcePostsArray[sourceIndex]
    targetPost.sortIndex = newSortIndex
    targetPost.sectionId = target.sectionId
  }

  return {
    reorderPost
  }
}
