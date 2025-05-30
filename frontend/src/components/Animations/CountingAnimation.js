import React, { useEffect, useState, useRef } from 'react';
import { logDebug, logError } from '../../utils/logger';

const CountingAnimation = ({ 
  end, 
  start = 0, 
  duration = 2000, 
  suffix = '', 
  prefix = '', 
  className = '',
  trigger = true 
}) => {
  const [count, setCount] = useState(start);
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    try {
      logDebug('CountingAnimation: Setting up intersection observer');
      
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !isVisible) {
            setIsVisible(true);
            logDebug('CountingAnimation: Element is visible, starting animation');
          }
        },
        { threshold: 0.5 }
      );

      if (elementRef.current) {
        observer.observe(elementRef.current);
      }

      return () => {
        if (elementRef.current) {
          observer.unobserve(elementRef.current);
        }
      };
    } catch (error) {
      logError('CountingAnimation: Error setting up observer', error);
    }
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible || !trigger) return;

    try {
      logDebug(`CountingAnimation: Starting count from ${start} to ${end}`);
      
      const startTime = Date.now();
      const startValue = start;
      const endValue = end;
      const totalDuration = duration;

      const updateCount = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / totalDuration, 1);
        
        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = Math.floor(startValue + (endValue - startValue) * easeOutQuart);
        
        setCount(currentValue);

        if (progress < 1) {
          requestAnimationFrame(updateCount);
        } else {
          setCount(endValue);
          logDebug(`CountingAnimation: Animation completed at ${endValue}`);
        }
      };

      updateCount();
    } catch (error) {
      logError('CountingAnimation: Error during animation', error);
      setCount(end); // Fallback to end value
    }
  }, [isVisible, trigger, start, end, duration]);

  return (
    <span ref={elementRef} className={className}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
};

export default CountingAnimation;