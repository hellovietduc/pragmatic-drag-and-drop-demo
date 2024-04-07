<script setup lang="ts">
import SurfaceContainer from '@/components/SurfaceContainer.vue'
import AppController from '@/components/AppController.vue'
</script>

<template>
  <main
    class="flex flex-col justify-center items-center gap-8 overflow-hidden h-screen pt-7 bg-gray-200"
  >
    <AppController class="shrink-0" />
    <SurfaceContainer class="grow w-screen" />
  </main>
</template>
