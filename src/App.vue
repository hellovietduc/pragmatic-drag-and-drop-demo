<script setup lang="ts">
import { uniqueId } from 'lodash-es'

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
</script>

<template>
  <main class="flex justify-center items-center gap-5 p-10 bg-gray-200">
    <section v-for="section in sections" :key="section.id" class="flex flex-col gap-4">
      <!-- Section title -->
      <h1 class="rounded-lg px-3 py-2 bg-sky-300 font-semibold">{{ section.title }}</h1>

      <!-- Post list -->
      <div class="flex flex-col gap-4">
        <article
          v-for="post in section.posts"
          :key="post.id"
          class="flex flex-col gap-2 rounded-xl shadow-lg p-2 bg-stone-100"
        >
          <h2>{{ post.subject }}</h2>
          <img
            :src="post.attachment"
            alt="Attachment"
            class="rounded-lg overflow-hidden"
            :width="200"
            :height="200"
            :style="{ width: '200px', height: '200px' }"
          />
        </article>
      </div>
    </section>
  </main>
</template>
