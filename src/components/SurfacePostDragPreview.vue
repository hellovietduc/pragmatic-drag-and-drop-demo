<script setup lang="ts">
import { computed } from 'vue'
import { useDummyData } from '@/stores/useDummyData'

const props = defineProps<{
  id: string
  isDragPreview?: boolean
}>()

const { postById } = useDummyData()
const post = computed(() => postById.value[props.id])
</script>

<template>
  <article
    ref="rootEl"
    :class="[
      'relative',
      'flex',
      'justify-between',
      'w-[216px]',
      'rounded-xl',
      'shadow-lg',
      'p-2',
      isDragPreview ? 'bg-[rgba(148,102,232)]' : 'bg-stone-100',
      isDragPreview && 'text-slate-200'
    ]"
  >
    <h2 class="select-none">{{ post.subject }}</h2>
    <img
      :src="post.attachment"
      alt="Attachment"
      class="rounded-lg overflow-hidden"
      :width="56"
      :height="56"
      :style="{ width: `56px`, height: `56px` }"
      draggable="false"
    />
  </article>
</template>
