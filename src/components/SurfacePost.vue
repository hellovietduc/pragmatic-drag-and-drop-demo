<script setup lang="ts">
import SurfacePostDragPreview from '@/components/SurfacePostDragPreview.vue'
import DragIndicator, { DragIndicatorOrientation } from '@/components/DragIndicator.vue'
import { computed, ref } from 'vue'
import { useDummyData } from '@/composables/useDummyData'
import { useDraggingState } from '@/composables/useDraggingState'
import {
  isVerticalEdge,
  type OnDropPayload,
  useDraggableElement,
  useDropTargetForElements
} from '@/composables/useElementDragAndDrop'
import type { PostDragData } from '@/composables/usePostReorder'

const props = defineProps<{
  id: string
  sectionId: string
}>()

const emit = defineEmits<{
  (e: 'reorder', payload: OnDropPayload<PostDragData>): void
}>()

const { postById } = useDummyData()
const post = computed(() => postById.value[props.id])

const { isDraggingPost } = useDraggingState()

const rootEl = ref<HTMLElement>()
const itemData: PostDragData = { postId: props.id, sectionId: props.sectionId }

const { itemState } = useDraggableElement({
  elementRef: rootEl,
  type: 'post',
  itemData,
  dragPreviewComponent: SurfacePostDragPreview,
  dragPreviewComponentProps: { id: props.id },
  onDragStart: () => (isDraggingPost.value = true),
  onDrop: () => (isDraggingPost.value = false)
})

const { dragIndicatorEdge } = useDropTargetForElements({
  elementRef: rootEl,
  types: [{ type: 'post', axis: 'vertical' }],
  itemData,
  onDrop: (payload) => {
    isDraggingPost.value = false
    emit('reorder', payload)
  }
})

const isDraggingThisPost = computed(() => itemState.value.type === 'dragging')
const xDragIndicator = computed(
  () => dragIndicatorEdge.value && isVerticalEdge(dragIndicatorEdge.value)
)
</script>

<template>
  <div ref="rootEl" class="relative w-max">
    <article
      v-show="!isDraggingPost"
      :class="[
        'flex',
        'flex-col',
        'gap-2',
        'rounded-xl',
        'shadow-lg',
        'w-max',
        'p-2',
        'bg-stone-100',
        isDraggingThisPost && 'opacity-40'
      ]"
    >
      <h2 class="select-none">{{ post.subject }}</h2>
      <h3 class="select-none text-sm">{{ post.sortIndex }}</h3>
      <img
        :src="post.attachment"
        alt="Attachment"
        class="rounded-lg overflow-hidden"
        :width="200"
        :height="200"
        :style="{ width: `200px`, height: `200px` }"
        draggable="false"
      />
    </article>
    <SurfacePostDragPreview
      v-show="isDraggingPost"
      :id="id"
      :class="isDraggingThisPost && 'opacity-40'"
    />
    <DragIndicator
      v-if="xDragIndicator"
      :orientation="DragIndicatorOrientation.Horizontal"
      :class="[
        'absolute',
        'start-0',
        'end-1.5',
        {
          '-top-[9px]': dragIndicatorEdge === 'top',
          '-bottom-[9px]': dragIndicatorEdge === 'bottom'
        }
      ]"
    />
  </div>
</template>
