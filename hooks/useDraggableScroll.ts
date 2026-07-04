import { useEffect, useRef, useState } from 'react';

export function useDraggableScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let isDown = false;
    let startX: number;
    let scrollLeft: number;
    let velocity = 0;
    let animationFrameId: number;
    let lastX = 0;
    let lastTime = 0;

    const applyMomentum = () => {
      if (Math.abs(velocity) > 0.5) {
        el.scrollLeft -= velocity;
        velocity *= 0.95; // friction
        animationFrameId = requestAnimationFrame(applyMomentum);
      }
    };

    const onDown = (e: PointerEvent | MouseEvent | TouchEvent) => {
      isDown = true;
      setIsDragging(true);
      el.style.cursor = 'grabbing';
      el.style.userSelect = 'none';
      cancelAnimationFrame(animationFrameId);

      const pageX = 'touches' in e ? e.touches[0].pageX : (e as MouseEvent).pageX;
      startX = pageX - el.offsetLeft;
      scrollLeft = el.scrollLeft;
      lastX = pageX;
      lastTime = performance.now();
      velocity = 0;
    };

    const onLeaveOrUp = () => {
      isDown = false;
      setIsDragging(false);
      el.style.cursor = 'grab';
      el.style.userSelect = 'auto';
      
      // Apply momentum when released
      if (Math.abs(velocity) > 1) {
        animationFrameId = requestAnimationFrame(applyMomentum);
      }
    };

    const onMove = (e: PointerEvent | MouseEvent | TouchEvent) => {
      if (!isDown) return;
      e.preventDefault(); // prevent native scroll
      const pageX = 'touches' in e ? e.touches[0].pageX : (e as MouseEvent).pageX;
      const x = pageX - el.offsetLeft;
      const walk = (x - startX) * 1.5; 
      el.scrollLeft = scrollLeft - walk;

      // Calculate velocity
      const now = performance.now();
      const dt = now - lastTime;
      if (dt > 0) {
        velocity = (pageX - lastX) / dt * 15;
      }
      lastX = pageX;
      lastTime = now;
    };

    // Smooth scroll config
    el.style.overflowX = 'auto';
    el.style.scrollbarWidth = 'none'; 
    el.style.cursor = 'grab';
    el.style.scrollBehavior = 'auto'; // allow JS to scroll instantly

    el.addEventListener('mousedown', onDown);
    el.addEventListener('mouseleave', onLeaveOrUp);
    el.addEventListener('mouseup', onLeaveOrUp);
    el.addEventListener('mousemove', onMove);
    
    el.addEventListener('touchstart', onDown, { passive: false });
    el.addEventListener('touchend', onLeaveOrUp);
    el.addEventListener('touchcancel', onLeaveOrUp);
    el.addEventListener('touchmove', onMove, { passive: false });

    return () => {
      el.removeEventListener('mousedown', onDown);
      el.removeEventListener('mouseleave', onLeaveOrUp);
      el.removeEventListener('mouseup', onLeaveOrUp);
      el.removeEventListener('mousemove', onMove);
      
      el.removeEventListener('touchstart', onDown);
      el.removeEventListener('touchend', onLeaveOrUp);
      el.removeEventListener('touchcancel', onLeaveOrUp);
      el.removeEventListener('touchmove', onMove);
      
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return { ref, isDragging };
}
