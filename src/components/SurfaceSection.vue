<script setup lang="ts">
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

const props = defineProps<{
  id: string
}>()

const emit = defineEmits<{
  (e: 'reorder', payload: OnDropPayload<SectionDragData>): void
}>()

const { sectionById, postsBySectionId } = useDummyData()
const section = computed(() => sectionById.value[props.id])

const { reorderPost } = usePostReorder()

const handlePostReorder = ({ sourceData, targetData }: OnDropPayload<PostDragData>) => {
  reorderPost(sourceData, targetData)
}

const rootEl = ref<HTMLElement>()
const dragHandle = ref<HTMLElement>()
const scrollContainer = ref<HTMLElement>()
const itemData: SectionDragData = { sectionId: props.id }

const { itemState } = useDraggableElement({
  elementRef: rootEl,
  type: 'section',
  itemData,
  dragHandleElementRef: dragHandle,
  dragPreviewComponent: SurfaceSectionDragPreview,
  dragPreviewComponentProps: { id: props.id }
})

const { dragIndicatorEdge } = useDropTargetForElements<SectionDragData | PostDragData>({
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
    if (payload.sourceData.type === 'section') {
      emit('reorder', payload)
    } else if (payload.sourceData.type === 'post' && payload.targetData.postId === undefined) {
      handlePostReorder(payload as OnDropPayload<PostDragData>)
    }
  }
})

useDragAndDropAutoScroll({ scrollContainerElementRef: scrollContainer })

const isDragging = computed(() => itemState.value.type === 'dragging')
const xDragIndicator = computed(
  () => dragIndicatorEdge.value && !isVerticalEdge(dragIndicatorEdge.value)
)
</script>

<template>
  <div class="relative h-full">
    <section
      ref="rootEl"
      :class="['flex', 'flex-col', 'w-[246px]', 'h-full', isDragging && 'opacity-40']"
    >
      <!-- Section title -->
      <h1 ref="dragHandle" class="rounded-lg mx-3.5 px-3 py-2 bg-sky-300 font-semibold select-none">
        {{ section.title }}
      </h1>

      <!-- Post list -->
      <!-- <DynamicScroller
      :items="postsBySectionId[section.id]"
      :min-item-size="340"
      class="h-full"
      item-class="ps-3.5 pt-4"
    >
      <template #default="{ item, index, active }">
        <DynamicScrollerItem :item="item" :active="active" :data-index="index" class="pb-4 w-max">
          <SurfacePost :id="item.id" :section-id="id" @reorder="handlePostReorder" />
        </DynamicScrollerItem>
      </template>
    </DynamicScroller> -->

      <div ref="scrollContainer" class="flex flex-col gap-4 overflow-y-scroll pt-4 ps-3.5">
        <SurfacePost
          v-for="post in postsBySectionId[section.id]"
          :key="post.id"
          :id="post.id"
          :section-id="id"
          class="last:mb-4"
          @reorder="handlePostReorder"
        />
      </div>
    </section>
    <DragIndicator
      v-if="xDragIndicator"
      :orientation="DragIndicatorOrientation.Vertical"
      :class="[
        '!absolute',
        'inset-y-0',
        {
          'start-0': dragIndicatorEdge === 'left',
          '-end-3': dragIndicatorEdge === 'right'
        }
      ]"
    />
  </div>
</template>
