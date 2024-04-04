<script setup lang="ts">
import { type OnDropPayload } from '@/composables/useElementDragAndDrop'
import SurfaceSection from '@/components/SurfaceSection.vue'
import { useDummyData } from '@/composables/useDummyData'
import { useSectionReorder } from '@/composables/useSectionReorder'

const { sortedSections } = useDummyData()

const { reorderSection } = useSectionReorder()

const handleSectionReorder = ({ sourceData, targetData, closestEdgeOfTarget }: OnDropPayload) => {
  console.log('🚀 dragged section', sourceData, 'to', targetData, 'near the', closestEdgeOfTarget)
  reorderSection(sourceData, targetData)
}
</script>

<template>
  <div>
    <SurfaceSection
      v-for="section in sortedSections"
      :key="section.id"
      :id="section.id"
      @reorder="handleSectionReorder"
    />
  </div>
</template>
