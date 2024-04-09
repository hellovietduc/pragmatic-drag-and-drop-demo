import { Teleport, createApp, h, type Component } from 'vue'

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

export { renderNativeDragPreview }
export type { ComponentProps }
