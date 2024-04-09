import { useDummyData, type Section } from '@/stores/useDummyData'
import { getSortIndexBetweenItems } from '@/bits/reorder'
import type { RelativePosition } from '@/pragmatic-drag-and-drop/helpers'

export type SectionDragData = { sectionId: string }

export const useSectionReorder = () => {
  const { sortedSections, sectionById } = useDummyData()

  const calculateNewSortIndex = (
    anchorSection: Section,
    newSectionRelativePosition: RelativePosition
  ): number | null => {
    const anchorSectionIndex =
      sortedSections.value?.findIndex((post) => post.id === anchorSection.id) ?? -1
    if (anchorSectionIndex === -1) {
      return null
    }

    let prevSection: Section
    let nextSection: Section
    if (newSectionRelativePosition === 'before') {
      prevSection = sortedSections.value[anchorSectionIndex - 1]
      nextSection = sortedSections.value[anchorSectionIndex]
    } else {
      prevSection = sortedSections.value[anchorSectionIndex]
      nextSection = sortedSections.value[anchorSectionIndex + 1]
    }

    return getSortIndexBetweenItems(prevSection, nextSection)
  }

  const reorderSection = (
    anchorSection: Section,
    movingSection: Section,
    newSectionRelativePosition: RelativePosition
  ) => {
    const newSortIndex = calculateNewSortIndex(anchorSection, newSectionRelativePosition)
    if (newSortIndex === null) return
    const section = sectionById.value[movingSection.id]
    if (!section) return
    section.sortIndex = newSortIndex
  }

  return {
    calculateNewSortIndex,
    reorderSection
  }
}
