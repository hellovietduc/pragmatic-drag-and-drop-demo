<script setup lang="ts">
import DragIndicator, { DragIndicatorOrientation } from '@/components/DragIndicator.vue'
import { computed } from 'vue'
import { useDummyData } from '@/composables/useDummyData'
import { useDragIndicator } from '@/composables/usePostDragAndDrop'

const props = withDefaults(
  defineProps<{
    id: string
    mode?: 'normal' | 'drag-preview'
  }>(),
  {
    mode: 'normal'
  }
)

const { postById } = useDummyData()
const post = computed(() => postById.value[props.id])

const attachmentSize = computed(() => (props.mode === 'normal' ? 200 : 56))

const { dragIndicatorEdge, dragOverPostId } = useDragIndicator()
</script>

<template>
  <article
    :data-dnd-post-id="post.id"
    :class="[
      'relative',
      'flex',
      mode === 'normal' && 'flex-col gap-2',
      mode === 'drag-preview' && 'justify-between w-64',
      'rounded-xl',
      'shadow-lg',
      'p-2',
      'bg-stone-100'
    ]"
  >
    <h2 class="select-none">{{ post.subject }}</h2>
    <img
      :src="post.attachment"
      alt="Attachment"
      class="rounded-lg overflow-hidden"
      :width="attachmentSize"
      :height="attachmentSize"
      :style="{ width: `${attachmentSize}px`, height: `${attachmentSize}px` }"
      draggable="false"
    />
    <DragIndicator
      v-if="dragOverPostId === post.id"
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
