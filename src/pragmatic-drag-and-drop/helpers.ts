import { type Edge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import type {
  ExternalDragPayload,
  NativeMediaType
} from '@atlaskit/pragmatic-drag-and-drop/dist/types/internal-types'
import { type ElementDragPayload } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import type {
  DragLocationHistory,
  DropTargetRecord,
  Position
} from '@atlaskit/pragmatic-drag-and-drop/types'

const isVerticalEdge = (edge: Edge): boolean => {
  return edge === 'top' || edge === 'bottom'
}

type DragData = Record<string | symbol, unknown>

/** Symbol to identify events made by Pragmatic DnD. */
const ITEM_KEY = Symbol('item')
const EXTERNAL_DRAG_TYPE_PREFIX = 'application/x.pdnd-'

type ItemData = DragData & {
  [ITEM_KEY]: true
  type: string
}

type ItemDataForExternal = {
  text?: string
  html?: string
  dragData?: DragData
}

const isItemData = (data: DragData): data is ItemData => {
  return data[ITEM_KEY] === true
}

const extractItemData = (payload: ElementDragPayload | DropTargetRecord): ItemData => {
  return payload.data as ItemData
}

const makeItemData = <TItemData>(itemData: TItemData & { type: ItemData['type'] }): ItemData => {
  return { ...itemData, [ITEM_KEY]: true }
}

const extractExternalDragType = (source: ExternalDragPayload): string | undefined => {
  return source.types
    .find((type) => type.startsWith(EXTERNAL_DRAG_TYPE_PREFIX))
    ?.replace(EXTERNAL_DRAG_TYPE_PREFIX, '')
}

const makeItemDataForExternal = (
  itemData: ItemDataForExternal & { type: ItemData['type'] }
): { [K in NativeMediaType]?: string } => {
  return {
    'text/plain': itemData.text,
    'text/html': itemData.html,
    [`${EXTERNAL_DRAG_TYPE_PREFIX}${itemData.type}`]:
      itemData.dragData && JSON.stringify(itemData.dragData)
  }
}

const extractPointerPosition = (location: DragLocationHistory): Position => {
  return {
    x: location.current.input.clientX,
    y: location.current.input.clientY
  }
}

export {
  ITEM_KEY,
  EXTERNAL_DRAG_TYPE_PREFIX,
  isVerticalEdge,
  isItemData,
  extractItemData,
  makeItemData,
  extractExternalDragType,
  makeItemDataForExternal,
  extractPointerPosition,
}
export type { DragData, ItemData, ItemDataForExternal }
