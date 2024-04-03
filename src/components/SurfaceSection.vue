<script setup lang="ts">
import DragIndicator, { DragIndicatorOrientation } from '@/components/DragIndicator.vue'
import SurfacePost from '@/components/SurfacePost.vue'
import { computed, ref } from 'vue'
import { useDummyData } from '@/composables/useDummyData'
import { useDragIndicator } from '@/composables/useSectionDragAndDrop'
import { usePostDragAndDrop } from '@/composables/usePostDragAndDrop'

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

const surfacePosts = ref<InstanceType<typeof SurfacePost>[]>([])
const postEls = computed(() => surfacePosts.value.map((post) => post.$el))

const { dragIndicatorEdge, dragOverSectionId } = useDragIndicator()
usePostDragAndDrop({ postEls })
</script>

<template>
  <section :data-dnd-section-id="id" class="relative flex flex-col gap-4">
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
        ref="surfacePosts"
        :id="post.id"
        class="my-2"
      />
    </div>
    <DragIndicator
      v-if="dragOverSectionId === id"
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
