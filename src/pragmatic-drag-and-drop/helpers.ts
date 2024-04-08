import {
  type Edge,
  extractClosestEdge
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
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

/** Symbol to identify events made by Pragmatic DnD. */
const ITEM_KEY = Symbol('item')
const EXTERNAL_DRAG_TYPE_PREFIX = 'application/x.pdnd-'

type DragData = Record<string | symbol, unknown>

type ItemData = DragData & {
  [ITEM_KEY]: true
  type: string
}

type ItemDataForExternal = {
  text?: string
  html?: string
  dragData?: DragData
}

type RelativePosition = 'before' | 'after'

type CanDropPayload<TData> = {
  sourceData: ItemData & TData
  targetData: ItemData & TData
}

type OnDropPayload<TData> = {
  sourceData: ItemData & TData
  targetData: ItemData & TData
  relativePositionToTarget: RelativePosition
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

const isVerticalEdge = (edge: Edge): boolean => {
  return edge === 'top' || edge === 'bottom'
}

const extractRelativePositionToTarget = (target: DragData): RelativePosition | null => {
  const closestEdge = extractClosestEdge(target)
  if (!closestEdge) return null
  if (closestEdge === 'top' || closestEdge === 'left') return 'before'
  return 'after'
}

export {
  ITEM_KEY,
  EXTERNAL_DRAG_TYPE_PREFIX,
  isItemData,
  extractItemData,
  makeItemData,
  extractExternalDragType,
  makeItemDataForExternal,
  extractPointerPosition,
  isVerticalEdge,
  extractRelativePositionToTarget
}
export type {
  DragData,
  ItemData,
  ItemDataForExternal,
  RelativePosition,
  CanDropPayload,
  OnDropPayload
}
