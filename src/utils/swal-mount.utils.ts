export function mountComponentInSwal<T extends object>(
  tagName: string,
  container: HTMLElement,
  props: Partial<T>,
  events?: Array<{ name: string; handler: (e: CustomEvent) => void }>,
): T {
  const el = document.createElement(tagName) as unknown as T;
  Object.assign(el, props);
  container.appendChild(el as unknown as Node);
  for (const { name, handler } of events ?? []) {
    (el as unknown as EventTarget).addEventListener(name, handler as EventListener);
  }
  return el;
}
