import { useLayoutEffect, useState, type RefObject } from 'react';

export interface Size {
  width: number;
  height: number;
}

/**
 * Border-box size of the element's parent, in whole pixels. Updates only when the size
 * really changes, so drawings regenerate on resize and nothing else.
 */
export function useParentSize(ref: RefObject<Element | null>): Size | null {
  const [size, setSize] = useState<Size | null>(null);

  useLayoutEffect(() => {
    const parent = ref.current?.parentElement;
    if (!parent) return;
    const update = () => {
      const width = Math.round(parent.offsetWidth);
      const height = Math.round(parent.offsetHeight);
      setSize((previous) =>
        previous && previous.width === width && previous.height === height
          ? previous
          : { width, height },
      );
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(parent);
    return () => observer.disconnect();
  }, [ref]);

  return size;
}
