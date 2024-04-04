<script setup lang="ts">
import { useDummyData } from '@/composables/useDummyData'
import SurfaceSection from '@/components/SurfaceSection.vue'

const { sectionsCount, postsPerSectionCount, sections } = useDummyData()
</script>

<template>
  <main
    class="flex flex-col justify-center items-center gap-8 overflow-hidden h-screen pt-7 bg-gray-200"
  >
    <div class="shrink-0 flex items-center gap-20">
      <div>
        <label for="sectionsCount">Number of sections:</label>
        <input
          id="sectionsCount"
          type="number"
          min="1"
          v-model="sectionsCount"
          class="text-center"
        />
      </div>
      <div>
        <label for="postsPerSectionCount">Posts per section:</label>
        <input
          id="postsPerSectionCount"
          type="number"
          min="1"
          v-model="postsPerSectionCount"
          class="text-center"
        />
      </div>
    </div>
    <div class="grow flex justify-center items-center gap-2.5 overflow-hidden p-2">
      <SurfaceSection v-for="section in sections" :key="section.id" :id="section.id" />
    </div>
  </main>
</template>
