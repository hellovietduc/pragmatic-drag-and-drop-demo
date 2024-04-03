import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview'
import { h, createApp, Teleport, onMounted, type Ref, ref, nextTick, onBeforeUnmount } from 'vue'
import SurfaceSection from '@/components/SurfaceSection.vue'
import { centerUnderPointer } from '@atlaskit/pragmatic-drag-and-drop/element/center-under-pointer'
import {
  attachClosestEdge,
  extractClosestEdge,
  type Edge
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import { isEmpty } from 'lodash-es'

const renderDragPreview = (container: HTMLElement, { sectionId }: { sectionId: string }) => {
  const app = createApp({
    render: () =>
      h(Teleport, { to: container }, [h(SurfaceSection, { id: sectionId, mode: 'drag-preview' })])
  })
  app.mount(container)
  return () => app.unmount()
}

export const useSectionDragAndDrop = ({
  sectionId,
  sectionEl
}: {
  sectionId: string
  sectionEl: Ref<HTMLElement | undefined>
}) => {
  const draggingSectionId = ref<string | null>(null)
  const dragIndicatorEdge = ref<Edge | null>(null)

  let cleanUpDraggable: () => void | undefined
  let cleanUpDropTarget: () => void | undefined

  const makeSectionDraggable = () => {
    if (!sectionEl.value) return
    cleanUpDraggable = draggable({
      element: sectionEl.value,
      dragHandle: sectionEl.value.querySelector('[data-dnd-section-drag-handle]') ?? undefined,
      getInitialData: () => {
        return { sectionId }
      },
      onGenerateDragPreview: ({ nativeSetDragImage }) => {
        if (!sectionId) return
        setCustomNativeDragPreview({
          getOffset: centerUnderPointer,
          render: ({ container }) => {
            return renderDragPreview(container, { sectionId })
          },
          nativeSetDragImage
        })
      },
      onDragStart: ({ source }) => {
        console.log('🚀 section drag start', source.data)
        draggingSectionId.value = source.data.sectionId as string
      },
      onDrop: ({ source }) => {
        console.log('🚀 section drop', source.data)
        draggingSectionId.value = null
      }
    })
  }

  const setupDropTarget = () => {
    if (!sectionEl.value) return
    dropTargetForElements({
      element: sectionEl.value,
      getData: ({ source, input }) => {
        if (!sectionEl.value) return source.data
        return attachClosestEdge(
          { sectionId },
          {
            element: sectionEl.value,
            input,
            allowedEdges: ['left', 'right']
          }
        )
      },
      canDrop: ({ source }) => {
        return !isEmpty(source.data.sectionId)
      },
      onDrag: ({ self, source }) => {
        const isSource = source.element === sectionEl.value
        if (isSource) {
          dragIndicatorEdge.value = null
          return
        }
        const closestEdge = extractClosestEdge(self.data)
        dragIndicatorEdge.value = closestEdge
      },
      onDragLeave() {
        dragIndicatorEdge.value = null
      },
      onDrop() {
        dragIndicatorEdge.value = null
      }
    })
  }

  onMounted(async () => {
    await nextTick()
    makeSectionDraggable()
    setupDropTarget()
  })

  onBeforeUnmount(() => {
    cleanUpDraggable?.()
    cleanUpDropTarget?.()
  })

  return { draggingSectionId, dragIndicatorEdge }
}
