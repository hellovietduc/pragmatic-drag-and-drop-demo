<script setup lang="ts">
import { useDummyData } from '@/composables/useDummyData'
import SurfaceContainer from '@/components/SurfaceContainer.vue'

const { sectionsCount, postsPerSectionCount } = useDummyData()
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
    <SurfaceContainer
      class="grow flex justify-center items-center gap-2.5 overflow-hidden w-screen p-2"
    />
  </main>
</template>
