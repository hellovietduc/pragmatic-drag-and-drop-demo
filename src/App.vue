<script setup lang="ts">
import { useDummyData } from '@/composables/useDummyData'
import SurfaceSection from '@/components/SurfaceSection.vue'

const { sections } = useDummyData()
</script>

<template>
  <main class="flex justify-center items-center box-content h-screen p-10 bg-gray-200">
    <SurfaceSection v-for="section in sections" :key="section.id" :id="section.id" class="mx-2.5" />
  </main>
</template>
