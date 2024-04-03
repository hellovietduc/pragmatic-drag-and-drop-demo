<script setup lang="ts">
import SurfacePost from '@/components/SurfacePost.vue'
import { computed, ref } from 'vue'
import { useDummyData } from '@/composables/useDummyData'
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

usePostDragAndDrop({ postEls })
</script>

<template>
  <section :data-dnd-section-id="id" class="flex flex-col gap-4">
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
  </section>
</template>
