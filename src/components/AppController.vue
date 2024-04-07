<script setup lang="ts">
import { useDummyData } from '@/stores/useDummyData'
import { useVirtualizedListState } from '@/stores/useVirtualizedListState'
import { useNativeDragPreviewState } from '@/stores/useNativeDragPreviewState'

const { sectionsCount, postsPerSectionCount } = useDummyData()
const { isVirtualized } = useVirtualizedListState()
const { useNativeDragPreview } = useNativeDragPreviewState()

const reload = () => {
  window.location.reload()
}
</script>

<template>
  <div class="flex items-center gap-12">
    <div>
      <label for="sectionsCount">Number of sections:</label>
      <input
        id="sectionsCount"
        type="number"
        min="1"
        v-model="sectionsCount"
        class="text-center w-12"
      />
    </div>
    <div>
      <label for="postsPerSectionCount">Posts per section:</label>
      <input
        id="postsPerSectionCount"
        type="number"
        min="1"
        v-model="postsPerSectionCount"
        class="text-center w-12"
      />
    </div>
    <div>
      <label for="useNativeDragPreview">Use native drag preview:</label>
      <input
        id="useNativeDragPreview"
        type="checkbox"
        v-model="useNativeDragPreview"
        @change="reload"
      />
    </div>
    <div>
      <label for="isVirtualized">Use virtualized list:</label>
      <input id="isVirtualized" type="checkbox" v-model="isVirtualized" />
    </div>
  </div>
</template>
