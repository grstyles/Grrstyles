import { useEffect, useRef } from 'react';

export function useDraggableScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let isDown = false;
    let startX: number;
    let scrollLeft: number;

    const onPointerDown = (e: PointerEvent) => {
      // Only apply drag logic for mouse, let touch use native scrolling
      if (e.pointerType !== 'mouse') return;
      
      isDown = true;
      el.style.cursor = 'grabbing';
      el.style.userSelect = 'none';
      startX = e.pageX - el.offsetLeft;
      scrollLeft = el.scrollLeft;
    };

    const onPointerLeave = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      isDown = false;
      el.style.cursor = 'grab';
      el.style.userSelect = 'auto';
    };

    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      isDown = false;
      el.style.cursor = 'grab';
      el.style.userSelect = 'auto';
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDown || e.pointerType !== 'mouse') return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      const walk = (x - startX) * 2.5; 
      el.scrollLeft = scrollLeft - walk;
    };

    // Ensure native smooth scrolling for touch devices
    el.style.overflowX = 'auto';
    el.style.WebkitOverflowScrolling = 'touch';
    // Remove scrollbar for cleaner look if not already done by CSS
    el.style.scrollbarWidth = 'none'; 
    el.style.cursor = 'grab';

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointerleave', onPointerLeave);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointermove', onPointerMove);

    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointerleave', onPointerLeave);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointermove', onPointerMove);
    };
  }, []);

  return ref;
}
