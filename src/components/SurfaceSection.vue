<script setup lang="ts">
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

const postEls = ref<HTMLElement[]>([])

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
    <div v-if="mode === 'normal'" class="flex flex-col gap-4" data-dnd-post-drop-target>
      <article
        v-for="post in postsBySectionId[section.id]"
        :key="post.id"
        ref="postEls"
        class="flex flex-col gap-2 rounded-xl shadow-lg p-2 bg-stone-100 select-none"
      >
        <h2>{{ post.subject }}</h2>
        <img
          :src="post.attachment"
          alt="Attachment"
          class="rounded-lg overflow-hidden"
          :width="200"
          :height="200"
          :style="{ width: '200px', height: '200px' }"
          draggable="false"
        />
      </article>
    </div>
  </section>
</template>
