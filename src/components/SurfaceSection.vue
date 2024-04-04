<script setup lang="ts">
import DragIndicator, { DragIndicatorOrientation } from '@/components/DragIndicator.vue'
import SurfacePost from '@/components/SurfacePost.vue'
import { computed, ref } from 'vue'
import { useDummyData } from '@/composables/useDummyData'
import { useElementDragAndDrop, type OnDropPayload } from '@/composables/useElementDragAndDrop'
import SurfaceSectionDragPreview from '@/components/SurfaceSectionDragPreview.vue'

const props = defineProps<{
  id: string
}>()

const emit = defineEmits<{
  (e: 'reorder', payload: OnDropPayload): void
}>()

const { sectionById, postsBySectionId } = useDummyData()
const section = computed(() => sectionById.value[props.id])

const rootEl = ref<HTMLElement>()
const dragHandle = ref<HTMLElement>()
const scrollContainer = ref<HTMLElement>()

const { itemState, dragIndicatorEdge } = useElementDragAndDrop({
  elementRef: rootEl,
  type: 'section',
  axis: 'horizontal',
  itemData: { sectionId: props.id },
  dragHandleElementRef: dragHandle,
  dragPreviewComponent: SurfaceSectionDragPreview,
  dragPreviewComponentProps: { id: props.id },
  scrollContainerElementRef: scrollContainer,
  onDrop: (payload) => emit('reorder', payload)
})

const isDragging = computed(() => itemState.value.type === 'dragging')

const handlePostReorder = ({ sourceData, targetData, closestEdgeOfTarget }: OnDropPayload) => {
  console.log('🚀 dragged post', sourceData, 'to', targetData, 'near the', closestEdgeOfTarget)
}
</script>

<template>
  <section
    ref="rootEl"
    :class="['relative', 'flex', 'flex-col', 'h-full', isDragging && 'opacity-40']"
  >
    <!-- Section title -->
    <h1 ref="dragHandle" class="rounded-lg mx-3.5 px-3 py-2 bg-sky-300 font-semibold select-none">
      {{ section.title }}
    </h1>

    <!-- Post list -->
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
    <DragIndicator
      v-if="dragIndicatorEdge"
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
  </section>
</template>
