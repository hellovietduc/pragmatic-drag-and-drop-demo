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

type DragDataForExternal = {
  text?: string
  html?: string
  dragData?: DragData
}

type ItemData<TData = DragData> = {
  [K: symbol]: unknown
  type: string
  data: TData
  [ITEM_KEY]: true
}

type DraggableSource = {
  /**
   * Type of draggable elements that can be dropped on this target.
   */
  type: ItemData['type']
  /**
   * Which axis the draggable elements of this type move on.
   */
  axis: 'vertical' | 'horizontal'
}

type RelativePosition = 'before' | 'after'

type CanDropPayload<TSourceData, TTargetData> = {
  sourceItem: ItemData<TSourceData>
  targetItem: ItemData<TTargetData>
}

type OnDropPayload<TSourceData, TTargetData> = {
  sourceItem: ItemData<TSourceData>
  targetItem: ItemData<TTargetData>
  relativePositionToTarget: RelativePosition
}

const makeItemData = (data: DragData, type: ItemData['type']): ItemData => {
  return { data, type, [ITEM_KEY]: true }
}

const extractItemData = (payload: ElementDragPayload | DropTargetRecord): ItemData | null => {
  const sourceType = payload.data.type
  const data = payload.data.data
  if (!sourceType || !data) return null
  return { ...payload.data, [ITEM_KEY]: true } as ItemData
}

const isItemData = (data: any): data is ItemData => {
  return data[ITEM_KEY] === true
}

const makeItemDataForExternal = (
  data: DragDataForExternal,
  type: ItemData['type']
): { [K in NativeMediaType]?: string } => {
  return {
    'text/plain': data.text,
    'text/html': data.html,
    [`${EXTERNAL_DRAG_TYPE_PREFIX}${type}`]: data.dragData && JSON.stringify(data.dragData)
  }
}

const extractExternalDragType = (payload: ExternalDragPayload): string | undefined => {
  return payload.types
    .find((type) => type.startsWith(EXTERNAL_DRAG_TYPE_PREFIX))
    ?.replace(EXTERNAL_DRAG_TYPE_PREFIX, '')
}

const extractItemDataFromExternal = (payload: ExternalDragPayload): ItemData | null => {
  const sourceType = extractExternalDragType(payload)
  if (!sourceType) return null
  const rawData = payload.getStringData(`${EXTERNAL_DRAG_TYPE_PREFIX}${sourceType}`)
  if (!rawData) return null
  return makeItemData(JSON.parse(rawData), sourceType)
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

const extractRelativePositionToTarget = (data: ItemData): RelativePosition | null => {
  const closestEdge = extractClosestEdge(data)
  if (!closestEdge) return null
  if (closestEdge === 'top' || closestEdge === 'left') return 'before'
  return 'after'
}

export {
  ITEM_KEY,
  EXTERNAL_DRAG_TYPE_PREFIX,
  isItemData,
  makeItemData,
  extractItemData,
  makeItemDataForExternal,
  extractExternalDragType,
  extractItemDataFromExternal,
  extractPointerPosition,
  isVerticalEdge,
  extractRelativePositionToTarget
}
export type {
  DragData,
  ItemData,
  DragDataForExternal,
  DraggableSource,
  RelativePosition,
  CanDropPayload,
  OnDropPayload
}
