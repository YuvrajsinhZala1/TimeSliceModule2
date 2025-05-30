import { useEffect, useRef, useState } from 'react';
import { logDebug, logError } from '../utils/logger';

export const useAnimation = (trigger = true) => {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    if (!trigger) return;

    try {
      logDebug('useAnimation: Setting up intersection observer');
      
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            logDebug('useAnimation: Element became visible');
            // Once visible, we can disconnect as we don't need to observe anymore
            observer.disconnect();
          }
        },
        {
          threshold: 0.1,
          rootMargin: '50px'
        }
      );

      if (elementRef.current) {
        observer.observe(elementRef.current);
      }

      return () => {
        observer.disconnect();
      };
    } catch (error) {
      logError('useAnimation: Error setting up intersection observer', error);
    }
  }, [trigger]);

  return { isVisible, elementRef };
};

export const useParallax = (speed = 0.5) => {
  const [offset, setOffset] = useState(0);
  const elementRef = useRef(null);

  useEffect(() => {
    try {
      const handleScroll = () => {
        if (elementRef.current) {
          const scrolled = window.pageYOffset;
          const element = elementRef.current;
          const elementTop = element.offsetTop;
          const elementHeight = element.offsetHeight;
          const windowHeight = window.innerHeight;

          // Calculate if element is in viewport
          const elementBottom = elementTop + elementHeight;
          const viewportTop = scrolled;
          const viewportBottom = scrolled + windowHeight;

          if (elementBottom >= viewportTop && elementTop <= viewportBottom) {
            const yPos = -(scrolled * speed);
            setOffset(yPos);
          }
        }
      };

      window.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll(); // Calculate initial position

      return () => {
        window.removeEventListener('scroll', handleScroll);
      };
    } catch (error) {
      logError('useParallax: Error setting up scroll listener', error);
    }
  }, [speed]);

  return { offset, elementRef };
};

export const useCountUp = (end, duration = 2000, start = 0) => {
  const [count, setCount] = useState(start);
  const [isAnimating, setIsAnimating] = useState(false);

  const startAnimation = () => {
    if (isAnimating) return;

    try {
      logDebug(`useCountUp: Starting animation from ${start} to ${end}`);
      setIsAnimating(true);
      
      const startTime = Date.now();
      const startValue = start;
      const endValue = end;

      const updateCount = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = Math.floor(startValue + (endValue - startValue) * easeOutQuart);
        
        setCount(currentValue);

        if (progress < 1) {
          requestAnimationFrame(updateCount);
        } else {
          setCount(endValue);
          setIsAnimating(false);
          logDebug(`useCountUp: Animation completed at ${endValue}`);
        }
      };

      updateCount();
    } catch (error) {
      logError('useCountUp: Error during animation', error);
      setCount(end);
      setIsAnimating(false);
    }
  };

  return { count, startAnimation, isAnimating };
};

export const useHover = () => {
  const [isHovered, setIsHovered] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleMouseEnter = () => {
      setIsHovered(true);
      logDebug('useHover: Mouse entered');
    };

    const handleMouseLeave = () => {
      setIsHovered(false);
      logDebug('useHover: Mouse left');
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return { isHovered, elementRef };
};

export const useMousePosition = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return mousePosition;
};