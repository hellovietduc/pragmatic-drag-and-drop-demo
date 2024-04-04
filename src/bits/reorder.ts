type SortableItem = { sortIndex: number }

export const getSortIndexBetweenItems = (
  prevItem: SortableItem,
  nextItem: SortableItem
): number | null => {
  if (!prevItem && !nextItem) {
    return null
  }

  let newSortIndex: number
  if (!prevItem) {
    newSortIndex = nextItem.sortIndex / 2
  } else if (!nextItem) {
    newSortIndex = prevItem.sortIndex * 2
  } else {
    newSortIndex = Math.round((prevItem.sortIndex + nextItem.sortIndex) / 2)
  }

  return newSortIndex
}
