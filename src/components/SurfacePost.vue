<script setup lang="ts">
import { flashElement } from '@/bits/flash'
import SurfacePostDragPreview from '@/components/SurfacePostDragPreview.vue'
import DragIndicator, { DragIndicatorOrientation } from '@/components/DragIndicator.vue'
import { computed, ref } from 'vue'
import { useDummyData } from '@/stores/useDummyData'
import { useDraggingState } from '@/stores/useDraggingState'
import {
  isVerticalEdge,
  type OnDropPayload,
  type OnDropFromExternalPayload,
  useDraggableElement,
  useDropTargetForElements,
  type ItemDataForExternal
} from '@/composables/useElementDragAndDrop'
import type { PostDragData } from '@/composables/usePostReorder'
import { useNativeDragPreviewState } from '@/stores/useNativeDragPreviewState'
import { raf } from '@/bits/raf'

const props = defineProps<{
  id: string
  sectionId: string
}>()

const emit = defineEmits<{
  (e: 'reorder', payload: OnDropPayload<PostDragData>): void
  (e: 'add-from-external', payload: OnDropFromExternalPayload<PostDragData>): void
}>()

const { postById } = useDummyData()
const post = computed(() => postById.value[props.id])

const { isDraggingPost } = useDraggingState()
const { useNativeDragPreview } = useNativeDragPreviewState()

const rootEl = ref<HTMLElement>()
const itemData = computed<PostDragData>(() => ({ postId: props.id, sectionId: props.sectionId }))
const itemDataForExternal = computed<ItemDataForExternal>(() => ({
  nativeData: {
    'text/plain': `Post: ${post.value.subject}`,
    'text/html': `<h1>${post.value.subject}</h1><img src="${post.value.attachment}" alt="Attachment" />`
  },
  customData: post.value
}))
const dragPreviewComponentProps = computed(() => ({ id: props.id, isDragPreview: true }))

const { isDragging: isDraggingThisPost } = useDraggableElement({
  elementRef: rootEl,
  type: 'post',
  itemData,
  itemDataForExternal,
  dragPreviewComponent: SurfacePostDragPreview,
  dragPreviewComponentProps,
  useNativeDragPreview: useNativeDragPreview.value,
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

    raf(async () => {
      const movedElement = document.querySelector<HTMLElement>(
        `[data-post-id="${payload.sourceData.postId}"]`
      )
      if (!movedElement) return
      movedElement.scrollIntoView({
        block: 'center',
        inline: 'center'
      })
      flashElement(movedElement, '#9466e8', 500)
    })
  },
  onDropFromExternal: (payload) => {
    emit('add-from-external', payload)

    raf(async () => {
      const movedElement = document.querySelector<HTMLElement>(
        `[data-post-id="${payload.sourceData.id}"]`
      )
      if (!movedElement) return
      movedElement.scrollIntoView({
        block: 'center',
        inline: 'center'
      })
      flashElement(movedElement, '#9466e8', 500)
    })
  }
})

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
