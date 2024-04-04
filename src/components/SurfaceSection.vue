<script setup lang="ts">
import DragIndicator, { DragIndicatorOrientation } from '@/components/DragIndicator.vue'
import SurfacePost from '@/components/SurfacePost.vue'
import { computed, ref } from 'vue'
import { useDummyData } from '@/composables/useDummyData'
import { useDragAndDrop } from '@/composables/useDragAndDrop'
import SurfaceSectionDragPreview from '@/components/SurfaceSectionDragPreview.vue'

const props = defineProps<{
  id: string
}>()

const { sectionById, postsBySectionId } = useDummyData()
const section = computed(() => sectionById.value[props.id])

const rootEl = ref<HTMLElement>()
const dragHandle = ref<HTMLElement>()
const scrollContainer = ref<HTMLElement>()

const { itemState, dragIndicatorEdge } = useDragAndDrop({
  elementRef: rootEl,
  itemData: { type: 'section', sectionId: props.id },
  axis: 'horizontal',
  dragHandleElementRef: dragHandle,
  dragPreviewComponent: SurfaceSectionDragPreview,
  dragPreviewComponentProps: { id: props.id },
  canDrop: ({ type }) => type === 'section',
  scrollContainerElementRef: scrollContainer
})

const isDragging = computed(() => itemState.value.type === 'dragging')
</script>

<template>
  <section
    ref="rootEl"
    :class="['relative', 'flex', 'flex-col', 'gap-4', 'h-full', isDragging && 'opacity-40']"
  >
    <!-- Section title -->
    <h1 ref="dragHandle" class="rounded-lg mx-3.5 px-3 py-2 bg-sky-300 font-semibold select-none">
      {{ section.title }}
    </h1>

    <!-- Post list -->
    <div ref="scrollContainer" class="flex flex-col gap-4 overflow-y-scroll ps-3.5">
      <SurfacePost
        v-for="post in postsBySectionId[section.id]"
        :key="post.id"
        :id="post.id"
        class="last:mb-4"
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
        },
      ]"
    />
  </section>
</template>
