import { useState, useEffect, useRef, useCallback } from 'react';
import { logDebug, logError } from '../utils/logger';

export const useParallax = (options = {}) => {
  const {
    speed = 0.5,
    direction = 'vertical', // 'vertical', 'horizontal', 'both'
    rootMargin = '0px',
    threshold = 0,
    disabled = false
  } = options;

  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isInView, setIsInView] = useState(false);
  const elementRef = useRef(null);
  const observerRef = useRef(null);

  // Calculate parallax offset based on scroll position
  const calculateOffset = useCallback(() => {
    if (disabled || !elementRef.current || !isInView) {
      return { x: 0, y: 0 };
    }

    try {
      const element = elementRef.current;
      const rect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      // Calculate how much the element has scrolled relative to viewport
      const scrolledY = (viewportHeight - rect.top) / (viewportHeight + rect.height);
      const scrolledX = (viewportWidth - rect.left) / (viewportWidth + rect.width);

      let offsetX = 0;
      let offsetY = 0;

      switch (direction) {
        case 'vertical':
          offsetY = (scrolledY - 0.5) * speed * 100;
          break;
        case 'horizontal':
          offsetX = (scrolledX - 0.5) * speed * 100;
          break;
        case 'both':
          offsetY = (scrolledY - 0.5) * speed * 100;
          offsetX = (scrolledX - 0.5) * speed * 100;
          break;
      }

      return { x: offsetX, y: offsetY };
    } catch (error) {
      logError('Error calculating parallax offset:', error);
      return { x: 0, y: 0 };
    }
  }, [speed, direction, disabled, isInView]);

  // Throttled scroll handler for performance
  const handleScroll = useCallback(() => {
    if (disabled) return;

    const newOffset = calculateOffset();
    setOffset(newOffset);
  }, [calculateOffset, disabled]);

  // Set up intersection observer
  useEffect(() => {
    if (disabled || !elementRef.current) return;

    try {
      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          setIsInView(entry.isIntersecting);
          if (entry.isIntersecting) {
            logDebug('Parallax element entered viewport');
          }
        },
        {
          rootMargin,
          threshold
        }
      );

      observerRef.current.observe(elementRef.current);

      return () => {
        if (observerRef.current) {
          observerRef.current.disconnect();
        }
      };
    } catch (error) {
      logError('Error setting up parallax intersection observer:', error);
    }
  }, [disabled, rootMargin, threshold]);

  // Set up scroll listener
  useEffect(() => {
    if (disabled) return;

    let ticking = false;

    const throttledHandleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledHandleScroll, { passive: true });
    window.addEventListener('resize', throttledHandleScroll, { passive: true });

    // Initial calculation
    throttledHandleScroll();

    return () => {
      window.removeEventListener('scroll', throttledHandleScroll);
      window.removeEventListener('resize', throttledHandleScroll);
    };
  }, [handleScroll, disabled]);

  // Generate transform style
  const transform = `translate3d(${offset.x}px, ${offset.y}px, 0)`;

  return {
    elementRef,
    offset,
    transform,
    isInView,
    style: {
      transform,
      willChange: disabled ? 'auto' : 'transform'
    }
  };
};

export const useParallaxLayer = (options = {}) => {
  const {
    speed = 0.5,
    zIndex = 0,
    opacity = 1,
    scale = 1,
    ...parallaxOptions
  } = options;

  const parallax = useParallax({ speed, ...parallaxOptions });

  const layerStyle = {
    ...parallax.style,
    zIndex,
    opacity,
    transform: `${parallax.transform} scale(${scale})`,
    position: 'relative'
  };

  return {
    ...parallax,
    style: layerStyle
  };
};

export const useMouseParallax = (options = {}) => {
  const {
    strength = 20,
    inverted = false,
    disabled = false,
    resetOnLeave = true
  } = options;

  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const elementRef = useRef(null);

  const handleMouseMove = useCallback((e) => {
    if (disabled || !elementRef.current) return;

    try {
      const rect = elementRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = (e.clientX - centerX) / rect.width;
      const deltaY = (e.clientY - centerY) / rect.height;

      const multiplier = inverted ? -1 : 1;

      setOffset({
        x: deltaX * strength * multiplier,
        y: deltaY * strength * multiplier
      });
    } catch (error) {
      logError('Error calculating mouse parallax:', error);
    }
  }, [disabled, strength, inverted]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    if (resetOnLeave) {
      setOffset({ x: 0, y: 0 });
    }
  }, [resetOnLeave]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || disabled) return;

    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [handleMouseMove, handleMouseEnter, handleMouseLeave, disabled]);

  const transform = `translate3d(${offset.x}px, ${offset.y}px, 0)`;

  return {
    elementRef,
    offset,
    transform,
    isHovered,
    style: {
      transform,
      transition: disabled ? 'none' : 'transform 0.1s ease-out',
      willChange: disabled ? 'auto' : 'transform'
    }
  };
};

export const useScrollParallax = (options = {}) => {
  const {
    speed = 1,
    direction = 'vertical',
    disabled = false
  } = options;

  const [scrollY, setScrollY] = useState(0);
  const [scrollX, setScrollX] = useState(0);

  useEffect(() => {
    if (disabled) return;

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrollY(window.pageYOffset);
          setScrollX(window.pageXOffset);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial call

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [disabled]);

  const offset = {
    x: direction === 'horizontal' || direction === 'both' ? scrollX * speed : 0,
    y: direction === 'vertical' || direction === 'both' ? scrollY * speed : 0
  };

  const transform = `translate3d(${offset.x}px, ${offset.y}px, 0)`;

  return {
    scrollY,
    scrollX,
    offset,
    transform,
    style: {
      transform,
      willChange: disabled ? 'auto' : 'transform'
    }
  };
};

export default useParallax;