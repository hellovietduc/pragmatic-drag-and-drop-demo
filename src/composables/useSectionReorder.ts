import { extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import { useDummyData, type Section } from '@/composables/useDummyData'

type Data = { sectionId: string } & any

export const useSectionReorder = () => {
  const { sortedSections } = useDummyData()

  const reorderSection = (source: Data, target: Data) => {
    const closestEdgeOfTarget = extractClosestEdge(target)

    const sourceIndex = sortedSections.value.findIndex((section) => section.id === source.sectionId)
    const targetIndex = sortedSections.value.findIndex((section) => section.id === target.sectionId)
    const isValidSource = sourceIndex >= 0 && sourceIndex < sortedSections.value.length
    const isValidTarget = targetIndex >= 0 && targetIndex < sortedSections.value.length

    if (!isValidSource || !isValidTarget) {
      return
    }

    let previousSection: Section
    let nextSection: Section
    if (closestEdgeOfTarget === 'left') {
      previousSection = sortedSections.value[targetIndex - 1]
      nextSection = sortedSections.value[targetIndex]
    } else {
      previousSection = sortedSections.value[targetIndex]
      nextSection = sortedSections.value[targetIndex + 1]
    }

    if (!previousSection && !nextSection) {
      return
    }

    let newSortIndex: number
    if (!previousSection) {
      newSortIndex = Math.floor(nextSection.sortIndex / 2)
    } else if (!nextSection) {
      newSortIndex = previousSection.sortIndex * 2
    } else {
      newSortIndex = Math.floor((previousSection.sortIndex + nextSection.sortIndex) / 2)
    }

    const targetSection = sortedSections.value[sourceIndex]
    targetSection.sortIndex = newSortIndex
  }

  return {
    reorderSection
  }
}
