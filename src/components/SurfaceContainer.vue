<script setup lang="ts">
import { type OnDropPayload } from '@/composables/useElementDragAndDrop'
import SurfaceSection from '@/components/SurfaceSection.vue'
import { useDummyData } from '@/stores/useDummyData'
import { useSectionReorder, type SectionDragData } from '@/composables/useSectionReorder'

const { sortedSections } = useDummyData()

const { reorderSection } = useSectionReorder()

const handleSectionReorder = ({ sourceData, targetData }: OnDropPayload<SectionDragData>) => {
  reorderSection(sourceData, targetData)
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
