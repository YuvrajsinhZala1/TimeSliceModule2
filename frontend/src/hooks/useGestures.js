import { useState, useEffect, useRef, useCallback } from 'react';
import { logDebug, logError } from '../utils/logger';

export const useGestures = (options = {}) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onPinch,
    onDoubleTap,
    threshold = 50,
    timeThreshold = 500,
    preventScroll = false
  } = options;

  const [gestureState, setGestureState] = useState({
    isGesturing: false,
    startPoint: null,
    currentPoint: null,
    direction: null,
    distance: 0,
    velocity: 0
  });

  const elementRef = useRef(null);
  const gestureDataRef = useRef({
    startTime: 0,
    lastTap: 0,
    touches: []
  });

  // Touch start handler
  const handleTouchStart = useCallback((e) => {
    try {
      if (preventScroll) {
        e.preventDefault();
      }

      const touch = e.touches[0];
      const startPoint = { x: touch.clientX, y: touch.clientY };
      
      gestureDataRef.current.startTime = Date.now();
      gestureDataRef.current.touches = Array.from(e.touches).map(t => ({
        x: t.clientX,
        y: t.clientY,
        id: t.identifier
      }));

      setGestureState({
        isGesturing: true,
        startPoint,
        currentPoint: startPoint,
        direction: null,
        distance: 0,
        velocity: 0
      });

      logDebug('Gesture started:', startPoint);
    } catch (error) {
      logError('Error in touch start:', error);
    }
  }, [preventScroll]);

  // Touch move handler
  const handleTouchMove = useCallback((e) => {
    try {
      if (preventScroll) {
        e.preventDefault();
      }

      if (!gestureState.isGesturing) return;

      const touch = e.touches[0];
      const currentPoint = { x: touch.clientX, y: touch.clientY };
      const { startPoint } = gestureState;

      if (!startPoint) return;

      const deltaX = currentPoint.x - startPoint.x;
      const deltaY = currentPoint.y - startPoint.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      // Calculate direction
      let direction = null;
      if (distance > threshold) {
        const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
        if (angle >= -45 && angle < 45) direction = 'right';
        else if (angle >= 45 && angle < 135) direction = 'down';
        else if (angle >= 135 || angle < -135) direction = 'left';
        else direction = 'up';
      }

      // Calculate velocity
      const currentTime = Date.now();
      const timeDelta = currentTime - gestureDataRef.current.startTime;
      const velocity = timeDelta > 0 ? distance / timeDelta : 0;

      setGestureState(prev => ({
        ...prev,
        currentPoint,
        direction,
        distance,
        velocity
      }));

      // Handle pinch gesture (two fingers)
      if (e.touches.length === 2 && onPinch) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        
        const currentDistance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2)
        );
        
        if (gestureDataRef.current.initialPinchDistance) {
          const scale = currentDistance / gestureDataRef.current.initialPinchDistance;
          onPinch({ scale, distance: currentDistance });
        } else {
          gestureDataRef.current.initialPinchDistance = currentDistance;
        }
      }
    } catch (error) {
      logError('Error in touch move:', error);
    }
  }, [gestureState.isGesturing, gestureState.startPoint, threshold, onPinch, preventScroll]);

  // Touch end handler
  const handleTouchEnd = useCallback((e) => {
    try {
      if (preventScroll) {
        e.preventDefault();
      }

      const { direction, distance, velocity } = gestureState;
      const currentTime = Date.now();
      const timeDelta = currentTime - gestureDataRef.current.startTime;

      // Handle swipe gestures
      if (direction && distance > threshold && timeDelta < timeThreshold) {
        logDebug('Swipe detected:', { direction, distance, velocity });
        
        switch (direction) {
          case 'left':
            onSwipeLeft?.({ distance, velocity, duration: timeDelta });
            break;
          case 'right':
            onSwipeRight?.({ distance, velocity, duration: timeDelta });
            break;
          case 'up':
            onSwipeUp?.({ distance, velocity, duration: timeDelta });
            break;
          case 'down':
            onSwipeDown?.({ distance, velocity, duration: timeDelta });
            break;
        }
      }

      // Handle double tap
      if (onDoubleTap && distance < 10 && timeDelta < 300) {
        const timeSinceLastTap = currentTime - gestureDataRef.current.lastTap;
        if (timeSinceLastTap < 300) {
          logDebug('Double tap detected');
          onDoubleTap({ point: gestureState.currentPoint });
        }
        gestureDataRef.current.lastTap = currentTime;
      }

      // Reset state
      setGestureState({
        isGesturing: false,
        startPoint: null,
        currentPoint: null,
        direction: null,
        distance: 0,
        velocity: 0
      });

      gestureDataRef.current.initialPinchDistance = null;
    } catch (error) {
      logError('Error in touch end:', error);
    }
  }, [gestureState, threshold, timeThreshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onDoubleTap, preventScroll]);

  // Mouse event handlers for desktop
  const handleMouseDown = useCallback((e) => {
    const startPoint = { x: e.clientX, y: e.clientY };
    gestureDataRef.current.startTime = Date.now();
    
    setGestureState({
      isGesturing: true,
      startPoint,
      currentPoint: startPoint,
      direction: null,
      distance: 0,
      velocity: 0
    });
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!gestureState.isGesturing) return;

    const currentPoint = { x: e.clientX, y: e.clientY };
    const { startPoint } = gestureState;

    if (!startPoint) return;

    const deltaX = currentPoint.x - startPoint.x;
    const deltaY = currentPoint.y - startPoint.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    setGestureState(prev => ({
      ...prev,
      currentPoint,
      distance
    }));
  }, [gestureState.isGesturing, gestureState.startPoint]);

  const handleMouseUp = useCallback(() => {
    setGestureState({
      isGesturing: false,
      startPoint: null,
      currentPoint: null,
      direction: null,
      distance: 0,
      velocity: 0
    });
  }, []);

  // Set up event listeners
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Touch events
    element.addEventListener('touchstart', handleTouchStart, { passive: !preventScroll });
    element.addEventListener('touchmove', handleTouchMove, { passive: !preventScroll });
    element.addEventListener('touchend', handleTouchEnd, { passive: !preventScroll });

    // Mouse events (for desktop testing)
    element.addEventListener('mousedown', handleMouseDown);
    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseup', handleMouseUp);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('mousedown', handleMouseDown);
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, handleMouseDown, handleMouseMove, handleMouseUp, preventScroll]);

  return {
    elementRef,
    gestureState,
    isGesturing: gestureState.isGesturing
  };
};

export const useSwipeNavigation = (options = {}) => {
  const {
    onNext,
    onPrevious,
    threshold = 50,
    enabled = true
  } = options;

  const swipeHandlers = useGestures({
    onSwipeLeft: enabled ? onNext : undefined,
    onSwipeRight: enabled ? onPrevious : undefined,
    threshold,
    preventScroll: true
  });

  return swipeHandlers;
};

export const usePinchZoom = (options = {}) => {
  const {
    onZoom,
    minScale = 0.5,
    maxScale = 3,
    enabled = true
  } = options;

  const [scale, setScale] = useState(1);
  const [isZooming, setIsZooming] = useState(false);

  const handlePinch = useCallback(({ scale: newScale }) => {
    if (!enabled) return;

    const clampedScale = Math.min(Math.max(newScale, minScale), maxScale);
    setScale(clampedScale);
    setIsZooming(true);
    
    if (onZoom) {
      onZoom(clampedScale);
    }

    // Reset zooming state after a delay
    setTimeout(() => setIsZooming(false), 100);
  }, [enabled, minScale, maxScale, onZoom]);

  const gestureHandlers = useGestures({
    onPinch: handlePinch,
    preventScroll: true
  });

  const resetZoom = useCallback(() => {
    setScale(1);
    if (onZoom) {
      onZoom(1);
    }
  }, [onZoom]);

  return {
    ...gestureHandlers,
    scale,
    isZooming,
    resetZoom
  };
};

export default useGestures;