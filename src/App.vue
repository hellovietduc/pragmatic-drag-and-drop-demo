<script setup lang="ts">
import { useDummyData } from '@/stores/useDummyData'
import SurfaceContainer from '@/components/SurfaceContainer.vue'
import { useVirtualizedListState } from '@/stores/useVirtualizedListState'

const { sectionsCount, postsPerSectionCount } = useDummyData()
const { isVirtualized } = useVirtualizedListState()
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
      <div>
        <label for="isVirtualized">Use virtualized list:</label>
        <input id="isVirtualized" type="checkbox" v-model="isVirtualized" />
      </div>
    </div>
    <SurfaceContainer
      class="grow flex justify-center items-center gap-2.5 overflow-hidden w-screen p-2"
    />
  </main>
</template>
