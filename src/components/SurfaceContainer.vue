<script setup lang="ts">
import { type OnDropPayload } from '@/composables/useElementDragAndDrop'
import SurfaceSection from '@/components/SurfaceSection.vue'
import { useDummyData } from '@/composables/useDummyData'

const { sections } = useDummyData()

const handleSectionReorder = ({ sourceData, targetData, closestEdgeOfTarget }: OnDropPayload) => {
  console.log('🚀 dragged section', sourceData, 'to', targetData, 'near the', closestEdgeOfTarget)
}
</script>

<template>
  <div>
    <SurfaceSection
      v-for="section in sections"
      :key="section.id"
      :id="section.id"
      @reorder="handleSectionReorder"
    />
  </div>
</template>
