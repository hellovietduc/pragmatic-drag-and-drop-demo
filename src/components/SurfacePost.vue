<script setup lang="ts">
import SurfacePostDragPreview from '@/components/SurfacePostDragPreview.vue'
import DragIndicator, { DragIndicatorOrientation } from '@/components/DragIndicator.vue'
import { computed, ref } from 'vue'
import { useDummyData } from '@/composables/useDummyData'
import {
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

const rootEl = ref<HTMLElement>()
const itemData: PostDragData = { postId: props.id, sectionId: props.sectionId }

const { itemState } = useDraggableElement({
  elementRef: rootEl,
  type: 'post',
  itemData,
  dragPreviewComponent: SurfacePostDragPreview,
  dragPreviewComponentProps: { id: props.id }
})

const { dragIndicatorEdge } = useDropTargetForElements({
  elementRef: rootEl,
  type: 'post',
  itemData,
  axis: 'vertical',
  onDrop: (payload) => emit('reorder', payload)
})

const isDragging = computed(() => itemState.value.type === 'dragging')
</script>

<template>
  <div class="relative w-max">
    <article
      ref="rootEl"
      :class="[
        'flex',
        'flex-col',
        'gap-2',
        'rounded-xl',
        'shadow-lg',
        'w-max',
        'p-2',
        'bg-stone-100',
        isDragging && 'opacity-40'
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
    <DragIndicator
      v-if="dragIndicatorEdge"
      :orientation="DragIndicatorOrientation.Horizontal"
      :class="[
        '!absolute',
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
