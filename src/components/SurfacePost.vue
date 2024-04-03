<script setup lang="ts">
import SurfacePostDragPreview from '@/components/SurfacePostDragPreview.vue'
import DragIndicator, { DragIndicatorOrientation } from '@/components/DragIndicator.vue'
import { computed, ref } from 'vue'
import { useDummyData } from '@/composables/useDummyData'
import { useDragAndDrop } from '@/composables/useDragAndDrop'

const props = defineProps<{
  id: string
}>()

const { postById } = useDummyData()
const post = computed(() => postById.value[props.id])

const rootEl = ref<HTMLElement>()
const { draggingItemData, dragIndicatorEdge } = useDragAndDrop({
  elementRef: rootEl,
  itemData: { type: 'post', postId: props.id },
  dragPreviewComponent: SurfacePostDragPreview,
  dragPreviewComponentProps: { id: props.id },
  dropTargetEdges: ['top', 'bottom'],
  canDrop: ({ type }) => type === 'post'
})

const draggingPostId = computed(() => draggingItemData.value?.postId)
</script>

<template>
  <article
    ref="rootEl"
    :class="[
      'relative',
      'flex',
      'flex-col',
      'gap-2',
      'rounded-xl',
      'shadow-lg',
      'p-2',
      'bg-stone-100',
      draggingPostId === id && 'opacity-50'
    ]"
  >
    <h2 class="select-none">{{ post.subject }}</h2>
    <img
      :src="post.attachment"
      alt="Attachment"
      class="rounded-lg overflow-hidden"
      :width="200"
      :height="200"
      :style="{ width: `200px`, height: `200px` }"
      draggable="false"
    />
    <DragIndicator
      v-if="dragIndicatorEdge"
      :orientation="DragIndicatorOrientation.Horizontal"
      :class="[
        '!absolute',
        'inset-x-0',
        {
          '-top-2': dragIndicatorEdge === 'top',
          '-bottom-2': dragIndicatorEdge === 'bottom'
        }
      ]"
    />
  </article>
</template>
