<script setup lang="ts">
import DragIndicator, { DragIndicatorOrientation } from '@/components/DragIndicator.vue'
import SurfacePost from '@/components/SurfacePost.vue'
import { computed, ref } from 'vue'
import { useDummyData } from '@/composables/useDummyData'
import { useSectionDragAndDrop } from '@/composables/useSectionDragAndDrop'

const props = withDefaults(
  defineProps<{
    id: string
    mode?: 'normal' | 'drag-preview'
  }>(),
  {
    mode: 'normal'
  }
)

const { sectionById, postsBySectionId } = useDummyData()
const section = computed(() => sectionById.value[props.id])

const rootEl = ref<HTMLElement>()
const { dragIndicatorEdge } = useSectionDragAndDrop({ sectionId: props.id, sectionEl: rootEl })
</script>

<template>
  <section ref="rootEl" :data-dnd-section-id="id" class="relative flex flex-col gap-4">
    <!-- Section title -->
    <h1
      data-dnd-section-drag-handle
      class="rounded-lg px-3 py-2 bg-sky-300 font-semibold select-none"
    >
      {{ section.title }}
    </h1>

    <!-- Post list -->
    <div v-if="mode === 'normal'" class="flex flex-col">
      <SurfacePost
        v-for="post in postsBySectionId[section.id]"
        :key="post.id"
        :id="post.id"
        class="my-2"
      />
    </div>
    <DragIndicator
      v-if="dragIndicatorEdge"
      :orientation="DragIndicatorOrientation.Vertical"
      :class="[
        '!absolute',
        'inset-y-0',
        {
          '-start-2.5': dragIndicatorEdge === 'left',
          '-end-2.5': dragIndicatorEdge === 'right'
        }
      ]"
    />
  </section>
</template>
