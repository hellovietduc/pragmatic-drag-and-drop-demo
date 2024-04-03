<script setup lang="ts">
import { computed } from 'vue'
import { useDummyData } from '@/composables/useDummyData'

const props = defineProps<{
  id: string
}>()

const { sectionById } = useDummyData()
const section = computed(() => sectionById.value[props.id])
</script>

<template>
  <section :class="['relative', 'flex', 'flex-col', 'gap-4']">
    <!-- Section title -->
    <h1 class="rounded-lg px-3 py-2 bg-sky-300 font-semibold select-none">
      {{ section.title }}
    </h1>
  </section>
</template>
