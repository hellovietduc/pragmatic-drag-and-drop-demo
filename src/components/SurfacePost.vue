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
  isVerticalEdge
} from '@/pragmatic-drag-and-drop/helpers'
import { useDropTargetElement } from '@/pragmatic-drag-and-drop/useDropTargetElement'
import { useDropTargetForExternal } from '@/pragmatic-drag-and-drop/useDropTargetForExternal'

const props = defineProps<{
  id: string
  sectionId: string
}>()

const emit = defineEmits<{
  (e: 'reorder', payload: OnDropPayload<Post, Post>): void
  (e: 'add-from-external', payload: OnDropPayload<Post, Post>): void
}>()

const { isDraggingPost } = useDraggingState()
const { postById } = useDummyData()
const post = computed(() => postById.value[props.id])
const isPostPinned = computed(() => post.value.isPinned)

const togglePostPin = () => {
  post.value.isPinned = !post.value.isPinned
}

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
  isDraggable: computed(() => !isPostPinned.value),
  dragPreviewComponent: SurfacePostDragPreview,
  dragPreviewComponentProps,
  onDragStart: () => (isDraggingPost.value = true),
  onDrop: () => (isDraggingPost.value = false)
})

const { dragIndicatorEdge: internalDragIndicatorEdge, addDraggableSource } = useDropTargetElement({
  elementRef: rootEl,
  type: 'post',
  data: post
})

addDraggableSource<Post>({
  type: 'post',
  axis: 'vertical',
  // Example when preventing dropping above a pinned post
  // canDrop: ({ sourceItem, targetItem }) => {
  //   return sourceItem.data.sortIndex >= targetItem.data.sortIndex
  // },
  onDrop: (payload) => {
    isDraggingPost.value = false
    emit('reorder', payload)
    scrollAndFlashElement(`[data-post-id="${payload.sourceItem.data.id}"]`)
  }
})

const {
  dragIndicatorEdge: externalDragIndicatorEdge,
  addDraggableSource: addExternalDraggableSource
} = useDropTargetForExternal({
  elementRef: rootEl,
  type: 'post',
  data: post
})

addExternalDraggableSource<Post>({
  type: 'post',
  axis: 'vertical',
  onDrop: (payload) => {
    isDraggingPost.value = false
    emit('add-from-external', payload)
    scrollAndFlashElement(`[data-post-id="${payload.sourceItem.data.id}"]`)
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
        'relative',
        'flex',
        'flex-col',
        'gap-2',
        'rounded-xl',
        'shadow-lg',
        'max-w-full',
        'w-max',
        'p-2',
        'bg-stone-100',
        isDraggingThisPost && 'opacity-30'
      ]"
      :data-post-id="id"
    >
      <h2 class="select-none">{{ post.subject }}</h2>
      <p class="select-none text-sm break-words">{{ post.body }}</p>
      <p class="select-none text-sm">{{ post.sortIndex }}</p>
      <img
        :src="post.attachment"
        alt="Attachment"
        class="rounded-lg overflow-hidden"
        :width="200"
        :height="200"
        :style="{ width: `200px`, height: `200px` }"
        draggable="false"
      />
      <div class="absolute top-1 end-1 border border-dotted border-gray-600 rounded p-0.5 text-sm">
        <label for="`post-pin-toggle-${post.id}`">{{ isPostPinned ? 'Unpin' : 'Pin' }}</label>
        <input
          :id="`post-pin-toggle-${post.id}`"
          type="checkbox"
          :value="isPostPinned"
          @change="togglePostPin"
        />
      </div>
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
