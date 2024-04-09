<script setup lang="ts">
import SurfaceSection from '@/components/SurfaceSection.vue'
import { useDummyData, type Section } from '@/stores/useDummyData'
import { useSectionReorder } from '@/composables/useSectionReorder'
import { type OnDropPayload } from '@/pragmatic-drag-and-drop/helpers'

const { sortedSections } = useDummyData()

const { reorderSection } = useSectionReorder()

const handleSectionReorder = ({
  sourceData,
  targetData,
  relativePositionToTarget
}: OnDropPayload<Section>) => {
  console.log(`🚀 ~ reordered section`, sourceData, `to`, targetData)
  reorderSection(targetData, sourceData, relativePositionToTarget)
}
</script>

<template>
  <div class="flex justify-center items-center gap-2.5 overflow-hidden p-2">
    <SurfaceSection
      v-for="section in sortedSections"
      :key="section.id"
      :id="section.id"
      @reorder="handleSectionReorder"
    />
  </div>
</template>
