<script setup lang="ts">
import { useVirtualizedListState } from '@/stores/useVirtualizedListState'
import DragOverlay from '@/components/DragOverlay.vue'
import DragIndicator, { DragIndicatorOrientation } from '@/components/DragIndicator.vue'
import SurfacePost from '@/components/SurfacePost.vue'
import { computed, ref } from 'vue'
import { useDummyData, type Section, type Post } from '@/stores/useDummyData'
import SurfaceSectionDragPreview from '@/components/SurfaceSectionDragPreview.vue'
import { usePostReorder } from '@/composables/usePostReorder'
import { scrollAndFlashElement } from '@/bits/flash'
import {
  type OnDropPayload,
  type OnDropExternalPayload,
  isVerticalEdge
} from '@/pragmatic-drag-and-drop/helpers'
import { useAutoScrollForElements } from '@/pragmatic-drag-and-drop/useAutoScrollForElements'
import { useDraggableElement } from '@/pragmatic-drag-and-drop/useDraggableElement'
import { useDropTargetElement } from '@/pragmatic-drag-and-drop/useDropTargetElement'
import { useDropTargetForExternal } from '@/pragmatic-drag-and-drop/useDropTargetForExternal'

const props = defineProps<{
  id: string
}>()

const emit = defineEmits<{
  (e: 'reorder', payload: OnDropPayload<Section, Section>): void
}>()

const { isVirtualized } = useVirtualizedListState()
const { sectionById, postById, postsBySectionId, createPost, addPost, doesPostExist } =
  useDummyData()
const section = computed(() => sectionById.value[props.id])

const { calculateNewSortIndex, reorderPost } = usePostReorder()

const handlePostReorder = ({
  sourceItem: { data: movingPost },
  targetItem: { data: anchorPost },
  relativePositionToTarget
}: OnDropPayload<Post, Post>) => {
  console.log(`🚀 ~ reordered post`, movingPost, `to`, anchorPost)
  reorderPost(anchorPost, movingPost, relativePositionToTarget)
}

const movePostToSection = ({ movingPost, section }: { movingPost: Post; section: Section }) => {
  console.log(`🚀 ~ moved post`, movingPost, `to`, section)
  const post = postById.value[movingPost.id]
  if (!post) return
  post.sectionId = section.id
}

const addPostFromExternal = ({
  sourceItem: { data: movingPost },
  targetItem: { data: anchorPost },
  relativePositionToTarget
}: OnDropExternalPayload<Post>) => {
  console.log('🚀 dragged external post', movingPost, 'to', anchorPost)
  const post = movingPost as unknown as Post
  const newPost = createPost({
    ...post,
    sectionId: anchorPost.id,
    sortIndex: calculateNewSortIndex(anchorPost, relativePositionToTarget) ?? post.sortIndex
  })
  if (doesPostExist(newPost.id)) {
    window.alert(`Post ${newPost.id} already exists`)
    return
  }
  addPost(newPost)
}

const rootEl = ref<HTMLElement>()
const dragHandle = ref<HTMLElement>()
const scrollContainer = ref<HTMLElement>()
const dragPreviewComponentProps = computed(() => ({ id: props.id, isDragPreview: true }))

const { isDragging: isDraggingThisSection } = useDraggableElement({
  elementRef: rootEl,
  type: 'section',
  data: section,
  dragHandleElementRef: dragHandle,
  dragPreviewComponent: SurfaceSectionDragPreview,
  dragPreviewComponentProps
})

const {
  isDraggingOver: internalIsDraggingOver,
  dragIndicatorEdge: internalDragIndicatorEdge,
  addDraggableSource
} = useDropTargetElement({
  elementRef: rootEl,
  type: 'section',
  data: section,
  ignoresNestedDrops: true
})

addDraggableSource<Section>({
  type: 'section',
  axis: 'horizontal',
  onDrop: (payload) => {
    emit('reorder', payload)
    scrollAndFlashElement(`[data-section-header-id="${payload.sourceItem.data.id}"]`)
  }
})

addDraggableSource<Post>({
  type: 'post',
  axis: 'vertical',
  onDrop: (payload) => {
    movePostToSection({
      movingPost: payload.sourceItem.data as unknown as Post,
      section: payload.targetItem.data
    })
    scrollAndFlashElement(`[data-post-id="${payload.sourceItem.data.id}"]`)
  }
})

const { isDraggingOver: externalIsDraggingOver, dragIndicatorEdge: externalDragIndicatorEdge } =
  useDropTargetForExternal({
    elementRef: rootEl,
    type: 'section',
    acceptedDragTypes: [
      {
        type: 'post',
        axis: 'vertical'
      }
    ],
    data: section,
    ignoresNestedDrops: true,
    onDrop: (payload) => {
      if (payload.sourceItem.type === 'post') {
        addPostFromExternal(payload as unknown as OnDropExternalPayload<Post>)
        scrollAndFlashElement(`[data-post-id="${payload.sourceItem.data.id}"]`)
      }
    }
  })

useAutoScrollForElements({ scrollContainerElementRef: scrollContainer, type: 'post' })

const isDraggingOver = computed(() => internalIsDraggingOver.value || externalIsDraggingOver.value)
const dragIndicatorEdge = computed(
  () => internalDragIndicatorEdge.value ?? externalDragIndicatorEdge.value
)
const xDragIndicator = computed(
  () => dragIndicatorEdge.value && !isVerticalEdge(dragIndicatorEdge.value)
)
</script>

<template>
  <div class="relative h-full">
    <section
      ref="rootEl"
      :class="[
        'relative',
        'flex',
        'flex-col',
        'w-[246px]',
        'h-full',
        isDraggingThisSection && 'opacity-30'
      ]"
    >
      <!-- Section title -->
      <h1
        ref="dragHandle"
        class="z-10 rounded-lg mx-3.5 px-3 py-2 bg-sky-300 font-semibold select-none"
        :data-section-header-id="id"
      >
        {{ section.title }}
      </h1>

      <!-- Post list -->
      <DynamicScroller
        v-if="isVirtualized"
        :items="postsBySectionId[section.id] || []"
        :min-item-size="216"
        class="h-full"
        item-class="ps-3.5 pt-4"
      >
        <template #default="{ item, index, active }">
          <DynamicScrollerItem :item="item" :active="active" :data-index="index" class="pb-4 w-max">
            <SurfacePost :id="item.id" :section-id="id" @reorder="handlePostReorder" />
          </DynamicScrollerItem>
        </template>
      </DynamicScroller>

      <div v-else ref="scrollContainer" class="flex flex-col gap-4 overflow-y-auto pt-4 ps-3.5">
        <SurfacePost
          v-for="post in postsBySectionId[section.id] || []"
          :key="post.id"
          :id="post.id"
          :section-id="id"
          class="z-10 last:mb-4"
          @reorder="handlePostReorder"
          @add-from-external="addPostFromExternal"
        />
      </div>
      <DragOverlay v-if="isDraggingOver && !xDragIndicator" class="absolute inset-x-0 -inset-y-2" />
    </section>
    <DragIndicator
      v-if="xDragIndicator"
      :orientation="DragIndicatorOrientation.Vertical"
      :class="[
        'absolute',
        'inset-y-0',
        {
          'start-0': dragIndicatorEdge === 'left',
          '-end-3': dragIndicatorEdge === 'right'
        }
      ]"
    />
  </div>
</template>
