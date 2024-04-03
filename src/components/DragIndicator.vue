<script setup lang="ts">
withDefaults(
  defineProps<{
    orientation: Orientation
    darkMode?: boolean | 'auto'
  }>(),
  {
    darkMode: 'auto',
  },
)
</script>

<script lang="ts">
enum Orientation {
  Horizontal = 'horizontal',
  Vertical = 'vertical',
}

export { Orientation as DragIndicatorOrientation }
</script>

<template>
  <div
    :class="[
      // Styles for the line
      'relative',
      {
        'w-0.5': orientation === Orientation.Vertical,
        'h-0.5': orientation === Orientation.Horizontal,
      },
      {
        'bg-grape-500': darkMode === false,
        'bg-canary-500': darkMode === true,
        'bg-grape-500 dark:bg-canary-500': darkMode === 'auto',
      },

      // Styles for the starting dot
      'before:visible',
      'before:absolute',
      {
        'before:-top-1.5': orientation === Orientation.Vertical,
        'before:-left-0.5': orientation === Orientation.Vertical,
        'before:-top-0.5': orientation === Orientation.Horizontal,
        'before:-left-1.5': orientation === Orientation.Horizontal,
      },
      'before:rounded-full',
      'before:w-1.5',
      'before:h-1.5',
      {
        'before:bg-grape-500': darkMode === false,
        'before:bg-canary-500': darkMode === true,
        'before:bg-grape-500 dark:before:bg-canary-500': darkMode === 'auto',
      },

      // Styles for the ending dot
      'after:visible',
      'after:absolute',
      {
        'after:-bottom-1.5': orientation === Orientation.Vertical,
        'after:-left-0.5': orientation === Orientation.Vertical,
        'after:-bottom-0.5': orientation === Orientation.Horizontal,
        'after:-right-1.5': orientation === Orientation.Horizontal,
      },
      'after:rounded-full',
      'after:w-1.5',
      'after:h-1.5',
      {
        'after:bg-grape-500': darkMode === false,
        'after:bg-canary-500': darkMode === true,
        'after:bg-grape-500 dark:after:bg-canary-500': darkMode === 'auto',
      },
    ]"
  />
</template>
