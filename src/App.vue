<script setup lang="ts">
import { uniqueId } from 'lodash-es'
import { ref } from 'vue'
import { usePostDragAndDrop } from '@/composables/usePostDragAndDrop'
import { useSectionDragAndDrop } from '@/composables/useSectionDragAndDrop'

// START DUMMY DATA
const generateSections = (count: number) => {
  return Array.from({ length: count }, (_, index) => {
    const id = uniqueId('section')
    return {
      id,
      title: `Section: ${id}`,
      posts: generatePosts(10, index)
    }
  })
}

const generatePosts = (count: number, sectionIndex: number) => {
  return Array.from({ length: count }, (_, index) => {
    const id = uniqueId('post')
    return {
      id,
      subject: `Post: ${id}`,
      attachment: `https://padlet.net/monsters/${(sectionIndex + 1) * (index + 1)}.png`
    }
  })
}

const sections = generateSections(5)
// END DUMMY DATA

const sectionEls = ref<HTMLElement[]>([])
const postEls = ref<HTMLElement[]>([])

useSectionDragAndDrop({ sectionEls })
usePostDragAndDrop({ postEls })
</script>

<template>
  <main class="flex justify-center items-center gap-5 p-10 bg-gray-200">
    <section
      v-for="section in sections"
      :key="section.id"
      ref="sectionEls"
      class="flex flex-col gap-4"
    >
      <!-- Section title -->
      <h1 data-drag-handle class="rounded-lg px-3 py-2 bg-sky-300 font-semibold select-none">
        {{ section.title }}
      </h1>

      <!-- Post list -->
      <div class="flex flex-col gap-4">
        <article
          v-for="post in section.posts"
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
  </main>
</template>
