<script setup lang="ts">
import { computed } from 'vue'
import { useDummyData } from '@/stores/useDummyData'

const props = defineProps<{
  id: string
  isDragPreview?: boolean
}>()

const { sectionById } = useDummyData()
const section = computed(() => sectionById.value[props.id])
</script>

<template>
  <section :class="['relative', 'flex', 'flex-col', 'gap-4']">
    <!-- Section title -->
    <h1
      :class="[
        'rounded-lg',
        'px-3',
        'py-2',
        'font-semibold',
        'select-none',
        isDragPreview ? 'bg-[rgba(148,102,232)]' : 'bg-sky-300',
        isDragPreview && 'text-slate-200'
      ]"
    >
      {{ section.title }}
    </h1>
  </section>
</template>
