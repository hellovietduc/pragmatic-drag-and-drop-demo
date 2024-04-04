import { extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import { useDummyData, type Post } from '@/composables/useDummyData'

type Data = { postId: string; sectionId: string } & any

export const usePostReorder = () => {
  const { postsBySectionId } = useDummyData()

  const reorderPost = (source: Data, target: Data) => {
    const sourcePostsArray = postsBySectionId.value[source.sectionId]
    const targetPostsArray = postsBySectionId.value[target.sectionId]
    const closestEdgeOfTarget = extractClosestEdge(target)

    const sourceIndex = sourcePostsArray.findIndex((post) => post.id === source.postId)
    const targetIndex = targetPostsArray.findIndex((post) => post.id === target.postId)
    const isValidSource = sourceIndex >= 0 && sourceIndex < sourcePostsArray.length
    const isValidTarget = targetIndex >= 0 && targetIndex < targetPostsArray.length

    if (!isValidSource || !isValidTarget) {
      return
    }

    let previousPost: Post
    let nextPost: Post
    if (closestEdgeOfTarget === 'top') {
      previousPost = targetPostsArray[targetIndex - 1]
      nextPost = targetPostsArray[targetIndex]
    } else {
      previousPost = targetPostsArray[targetIndex]
      nextPost = targetPostsArray[targetIndex + 1]
    }

    if (!previousPost && !nextPost) {
      return
    }

    let newSortIndex: number
    if (!previousPost) {
      newSortIndex = nextPost.sortIndex / 2
    } else if (!nextPost) {
      newSortIndex = previousPost.sortIndex * 2
    } else {
      newSortIndex = Math.round((previousPost.sortIndex + nextPost.sortIndex) / 2)
    }

    const targetPost = sourcePostsArray[sourceIndex]
    targetPost.sortIndex = newSortIndex
    targetPost.sectionId = target.sectionId
  }

  return {
    reorderPost
  }
}
