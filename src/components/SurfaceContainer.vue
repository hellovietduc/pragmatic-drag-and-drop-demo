<script setup lang="ts">
import SurfaceSection from '@/components/SurfaceSection.vue'
import { useDummyData, type Section } from '@/stores/useDummyData'
import { useSectionReorder } from '@/composables/useSectionReorder'
import { type OnDropPayload } from '@/pragmatic-drag-and-drop/helpers'

const { sortedSections } = useDummyData()

const { reorderSection } = useSectionReorder()

const handleSectionReorder = ({
  sourceItem: { data: movingSection },
  targetItem: { data: anchorSection },
  relativePositionToTarget
}: OnDropPayload<Section, Section>) => {
  console.log(`🚀 ~ reordered section`, movingSection, `to`, anchorSection)
  reorderSection(anchorSection, movingSection, relativePositionToTarget)
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
