<script setup lang="ts">
import { computed, ref } from 'vue'
import { useSectionDragAndDrop } from '@/composables/useSectionDragAndDrop'
import { usePostDragAndDropSetup } from '@/composables/usePostDragAndDrop'
import { useDummyData } from '@/composables/useDummyData'
import SurfaceSection from '@/components/SurfaceSection.vue'

const { sections } = useDummyData()

const surfaceSections = ref<InstanceType<typeof SurfaceSection>[]>([])
const sectionEls = computed(() => surfaceSections.value.map((section) => section.$el))

useSectionDragAndDrop({ sectionEls })
usePostDragAndDropSetup({ sectionEls})
</script>

<template>
  <main class="flex justify-center items-center gap-5 p-10 bg-gray-200">
    <SurfaceSection
      v-for="section in sections"
      :key="section.id"
      ref="surfaceSections"
      :id="section.id"
    />
  </main>
</template>
