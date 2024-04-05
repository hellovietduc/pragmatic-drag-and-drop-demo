<script setup lang="ts">
import { useVirtualizedListState } from '@/composables/useVirtualizedListState'
import DragOverlay from '@/components/DragOverlay.vue'
import DragIndicator, { DragIndicatorOrientation } from '@/components/DragIndicator.vue'
import SurfacePost from '@/components/SurfacePost.vue'
import { computed, ref } from 'vue'
import { useDummyData } from '@/composables/useDummyData'
import {
  useDraggableElement,
  useDropTargetForElements,
  useDragAndDropAutoScroll,
  type OnDropPayload,
  isVerticalEdge
} from '@/composables/useElementDragAndDrop'
import SurfaceSectionDragPreview from '@/components/SurfaceSectionDragPreview.vue'
import { usePostReorder, type PostDragData } from '@/composables/usePostReorder'
import type { SectionDragData } from '@/composables/useSectionReorder'
import { flashElement } from '@/bits/flash'
import { raf } from '@/bits/raf'

const props = defineProps<{
  id: string
}>()

const emit = defineEmits<{
  (e: 'reorder', payload: OnDropPayload<SectionDragData>): void
}>()

const { isVirtualized } = useVirtualizedListState()

const { sectionById, postsBySectionId } = useDummyData()
const section = computed(() => sectionById.value[props.id])

const { reorderPost } = usePostReorder()

const handlePostReorder = ({ sourceData, targetData }: OnDropPayload<PostDragData>) => {
  console.log(`🚀 ~ dragged post from`, sourceData, `to`, targetData)
  reorderPost(sourceData, targetData)
}

const rootEl = ref<HTMLElement>()
const dragHandle = ref<HTMLElement>()
const scrollContainer = ref<HTMLElement>()
const itemData = computed<SectionDragData>(() => ({ sectionId: props.id }))
const dragPreviewComponentProps = computed(() => ({ id: props.id, isDragPreview: true }))

const { itemState } = useDraggableElement({
  elementRef: rootEl,
  type: 'section',
  itemData,
  dragHandleElementRef: dragHandle,
  dragPreviewComponent: SurfaceSectionDragPreview,
  dragPreviewComponentProps
})

const { isDraggingOver, dragIndicatorEdge } = useDropTargetForElements<
  SectionDragData | PostDragData
>({
  elementRef: rootEl,
  types: [
    {
      type: 'section',
      axis: 'horizontal'
    },
    {
      type: 'post',
      axis: 'vertical'
    }
  ],
  itemData,
  ignoresInnerDrops: true,
  onDrop: (payload) => {
    if (payload.sourceData.type === 'post' && payload.targetData.postId === undefined) {
      handlePostReorder(payload as OnDropPayload<PostDragData>)
      return
    }
    if (payload.sourceData.type === 'section') {
      emit('reorder', payload)

      raf(async () => {
        const movedElement = document.querySelector<HTMLElement>(
          `[data-section-header-id="${payload.sourceData.sectionId}"]`
        )
        if (!movedElement) return
        movedElement.scrollIntoView()
        flashElement(movedElement, '#9466e8', 500)
      })
    }
  }
})

useDragAndDropAutoScroll({ scrollContainerElementRef: scrollContainer, type: 'post' })

const isDragging = computed(() => itemState.value.type === 'dragging')
const xDragIndicator = computed(
  () => dragIndicatorEdge.value && !isVerticalEdge(dragIndicatorEdge.value)
)
</script>

<template>
  <div class="relative h-full">
    <section
      ref="rootEl"
      :class="['relative', 'flex', 'flex-col', 'w-[246px]', 'h-full', isDragging && 'opacity-30']"
    >
      <!-- Section title -->
      <h1
        ref="dragHandle"
        class="z-10 rounded-lg mx-3.5 px-3 py-2 bg-sky-300 font-semibold select-none"
        :data-section-header-id="id"
      >
        {{ section.title }}
      </h1>

      <!-- Post list -->
      <DynamicScroller
        v-if="isVirtualized"
        :items="postsBySectionId[section.id] || []"
        :min-item-size="216"
        class="h-full"
        item-class="ps-3.5 pt-4"
      >
        <template #default="{ item, index, active }">
          <DynamicScrollerItem :item="item" :active="active" :data-index="index" class="pb-4 w-max">
            <SurfacePost :id="item.id" :section-id="id" @reorder="handlePostReorder" />
          </DynamicScrollerItem>
        </template>
      </DynamicScroller>

      <div v-else ref="scrollContainer" class="flex flex-col gap-4 overflow-y-auto pt-4 ps-3.5">
        <SurfacePost
          v-for="post in postsBySectionId[section.id] || []"
          :key="post.id"
          :id="post.id"
          :section-id="id"
          class="z-10 last:mb-4"
          @reorder="handlePostReorder"
        />
      </div>
      <DragOverlay v-if="isDraggingOver && !xDragIndicator" class="absolute inset-x-0 -inset-y-2" />
    </section>
    <DragIndicator
      v-if="xDragIndicator"
      :orientation="DragIndicatorOrientation.Vertical"
      :class="[
        'absolute',
        'inset-y-0',
        {
          'start-0': dragIndicatorEdge === 'left',
          '-end-3': dragIndicatorEdge === 'right'
        }
      ]"
    />
  </div>
</template>
