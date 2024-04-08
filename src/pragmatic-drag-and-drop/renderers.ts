import { centerUnderPointer } from '@atlaskit/pragmatic-drag-and-drop/element/center-under-pointer'
import type { CleanupFn, Position } from '@atlaskit/pragmatic-drag-and-drop/types'
import { createSharedComposable } from '@vueuse/core'
import { Teleport, createApp, h, type Component, type ComponentPublicInstance } from 'vue'

type ComponentProps = Record<string, unknown>

const renderNativeDragPreview = <TProps extends ComponentProps>(
  container: HTMLElement,
  component: Component,
  props?: TProps
) => {
  const app = createApp({
    render: () => h(Teleport, { to: container }, [h(component, props)])
  })
  app.mount(container)
  return () => app.unmount()
}

const renderCustomDragPreview = <TProps extends ComponentProps>(
  container: HTMLElement,
  position: Position,
  component: Component,
  props?: TProps
) => {
  const app = createApp({
    data() {
      return {
        x: position.x,
        y: position.y
      }
    },
    methods: {
      reposition(position: Position) {
        const previewEl = this.$refs.previewEl as HTMLElement
        const { x, y } = centerUnderPointer({ container: previewEl })
        this.x = position.x - x
        this.y = position.y - y
      }
    },
    expose: ['reposition'],
    render() {
      return h(Teleport, { to: 'body' }, [
        h(
          'div',
          {
            ref: 'previewEl',
            style: {
              position: 'fixed',
              zIndex: Number.MAX_SAFE_INTEGER,
              left: `${this.x}px`,
              top: `${this.y}px`,
              pointerEvents: 'none'
            }
          },
          [h(component, props)]
        )
      ])
    }
  })

  const child = document.createElement('div')
  container.appendChild(child)
  const vm = app.mount(child) as ComponentPublicInstance<{
    reposition: (position: Position) => void
  }>

  return {
    reposition: vm.reposition,
    unmount: app.unmount
  }
}

const useRenderCustomDragPreview = createSharedComposable(() => {
  type RepositionFn = ReturnType<typeof renderCustomDragPreview>['reposition']
  let repositionFn: RepositionFn = () => {}
  let unmountFn: CleanupFn = () => {}

  const render = <TProps extends ComponentProps>(
    container: HTMLElement,
    position: Position,
    component: Component,
    props?: TProps
  ) => {
    const ctx = renderCustomDragPreview<TProps>(container, position, component, props)
    unmountFn = ctx.unmount
    repositionFn = ctx.reposition
  }

  const reposition: RepositionFn = (position) => {
    repositionFn(position)
  }

  const unmount = () => {
    unmountFn()
  }

  return {
    render,
    reposition,
    unmount
  }
})

export { renderNativeDragPreview, useRenderCustomDragPreview }
export type { ComponentProps }
