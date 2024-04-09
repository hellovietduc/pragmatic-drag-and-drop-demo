<script setup lang="ts">
import { scrollAndFlashElement } from '@/bits/flash'
import SurfacePostDragPreview from '@/components/SurfacePostDragPreview.vue'
import DragIndicator, { DragIndicatorOrientation } from '@/components/DragIndicator.vue'
import { computed, ref } from 'vue'
import { useDummyData, type Post } from '@/stores/useDummyData'
import { useDraggingState } from '@/stores/useDraggingState'
import { useDraggableElement } from '@/pragmatic-drag-and-drop/useDraggableElement'
import {
  type DragDataForExternal,
  type OnDropPayload,
  type OnDropExternalPayload,
  isVerticalEdge
} from '@/pragmatic-drag-and-drop/helpers'
import { useDropTargetForElements } from '@/pragmatic-drag-and-drop/useDropTargetForElements'
import { useDropTargetForExternal } from '@/pragmatic-drag-and-drop/useDropTargetForExternal'

const props = defineProps<{
  id: string
  sectionId: string
}>()

const emit = defineEmits<{
  (e: 'reorder', payload: OnDropPayload<Post>): void
  (e: 'add-from-external', payload: OnDropExternalPayload<Post>): void
}>()

const { isDraggingPost } = useDraggingState()
const { postById } = useDummyData()
const post = computed(() => postById.value[props.id])

const rootEl = ref<HTMLElement>()

const dataForExternal = computed<DragDataForExternal>(() => ({
  text: `Post: ${post.value.subject}`,
  html: `<h1>${post.value.subject}</h1><img src="${post.value.attachment}" alt="Attachment" />`,
  dragData: post.value
}))

const dragPreviewComponentProps = computed(() => ({ id: props.id, isDragPreview: true }))

const { isDragging: isDraggingThisPost } = useDraggableElement({
  elementRef: rootEl,
  type: 'post',
  data: post,
  dataForExternal,
  dragPreviewComponent: SurfacePostDragPreview,
  dragPreviewComponentProps,
  onDragStart: () => (isDraggingPost.value = true),
  onDrop: () => (isDraggingPost.value = false)
})

const { dragIndicatorEdge: internalDragIndicatorEdge } = useDropTargetForElements({
  elementRef: rootEl,
  type: 'post',
  acceptedDragTypes: [{ type: 'post', axis: 'vertical' }],
  data: post,
  onDrop: (payload) => {
    isDraggingPost.value = false
    emit('reorder', payload)
    scrollAndFlashElement(`[data-post-id="${payload.sourceData.id}"]`)
  }
})

const { dragIndicatorEdge: externalDragIndicatorEdge } = useDropTargetForExternal({
  elementRef: rootEl,
  type: 'post',
  acceptedDragTypes: [{ type: 'post', axis: 'vertical' }],
  data: post,
  onDrop: (payload) => {
    isDraggingPost.value = false
    emit('add-from-external', payload)
    scrollAndFlashElement(`[data-post-id="${payload.sourceData.id}"]`)
  }
})

const dragIndicatorEdge = computed(
  () => internalDragIndicatorEdge.value ?? externalDragIndicatorEdge.value
)
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
        isDraggingThisPost && 'opacity-30'
      ]"
      :data-post-id="id"
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
      :class="isDraggingThisPost && 'opacity-30'"
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
