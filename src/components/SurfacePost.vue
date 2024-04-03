<script setup lang="ts">
import DragIndicator, { DragIndicatorOrientation } from '@/components/DragIndicator.vue'
import { computed, ref } from 'vue'
import { useDummyData } from '@/composables/useDummyData'
import { usePostDragAndDrop } from '@/composables/usePostDragAndDrop'

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

const rootEl = ref<HTMLElement>()
const { dragIndicatorEdge } = usePostDragAndDrop({ postId: props.id, postEl: rootEl })
</script>

<template>
  <article
    ref="rootEl"
    :data-dnd-post-id="id"
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
