<script setup lang="ts">
import { computed } from 'vue'
import { useDummyData } from '@/composables/useDummyData'

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
</script>

<template>
  <article
    :data-dnd-post-id="post.id"
    :class="[
      'flex',
      mode === 'normal' && 'flex-col gap-2',
      mode === 'drag-preview' && 'justify-between w-64',
      'rounded-xl',
      'overflow-hidden',
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
  </article>
</template>
