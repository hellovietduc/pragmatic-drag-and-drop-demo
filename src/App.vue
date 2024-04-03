<script setup lang="ts">
import { computed, ref } from 'vue'
import { useSectionDragAndDrop } from '@/composables/useSectionDragAndDrop'
import { useDummyData } from '@/composables/useDummyData'
import SurfaceSection from '@/components/SurfaceSection.vue'

const { sections } = useDummyData()

const surfaceSections = ref<InstanceType<typeof SurfaceSection>[]>([])
const sectionEls = computed(() => surfaceSections.value.map((section) => section.$el))

useSectionDragAndDrop({ sectionEls })
</script>

<template>
  <main class="flex justify-center items-center p-10 bg-gray-200">
    <SurfaceSection
      v-for="section in sections"
      :key="section.id"
      ref="surfaceSections"
      :id="section.id"
      class="mx-2.5"
    />
  </main>
</template>
