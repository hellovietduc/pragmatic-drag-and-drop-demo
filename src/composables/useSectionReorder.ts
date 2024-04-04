import { extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import { useDummyData, type Section } from '@/composables/useDummyData'
import { getSortIndexBetweenItems } from '@/bits/reorder'
import type { ItemData } from '@/composables/useElementDragAndDrop'

export type SectionDragData = { sectionId: string }

export const useSectionReorder = () => {
  const { sortedSections } = useDummyData()

  const reorderSection = (
    source: SectionDragData & ItemData,
    target: SectionDragData & ItemData
  ) => {
    const sourceIndex = sortedSections.value.findIndex((section) => section.id === source.sectionId)
    const targetIndex = sortedSections.value.findIndex((section) => section.id === target.sectionId)
    const isValidSource = sourceIndex >= 0 && sourceIndex < sortedSections.value.length
    const isValidTarget = targetIndex >= 0 && targetIndex < sortedSections.value.length

    if (!isValidSource || !isValidTarget) {
      return
    }

    const closestEdgeOfTarget = extractClosestEdge(target)
    if (!closestEdgeOfTarget) return

    let prevSection: Section
    let nextSection: Section
    if (closestEdgeOfTarget === 'left') {
      prevSection = sortedSections.value[targetIndex - 1]
      nextSection = sortedSections.value[targetIndex]
    } else {
      prevSection = sortedSections.value[targetIndex]
      nextSection = sortedSections.value[targetIndex + 1]
    }

    const newSortIndex = getSortIndexBetweenItems(prevSection, nextSection)
    if (!newSortIndex) return

    const targetSection = sortedSections.value[sourceIndex]
    targetSection.sortIndex = newSortIndex
  }

  return {
    reorderSection
  }
}
