import React, { useEffect, useRef } from 'react';
import { logDebug, logError } from '../../utils/logger';

const MorphingShapes = () => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      logError('MorphingShapes: Canvas not found');
      return;
    }

    logDebug('MorphingShapes: Initializing morphing shapes');
    const ctx = canvas.getContext('2d');

    const resizeCanvas = () => {
      try {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        logDebug(`MorphingShapes: Canvas resized to ${canvas.width}x${canvas.height}`);
      } catch (error) {
        logError('MorphingShapes: Error resizing canvas', error);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const drawMorphingShape = (centerX, centerY, radius, time, color) => {
      try {
        ctx.beginPath();
        
        const sides = 8;
        for (let i = 0; i <= sides; i++) {
          const angle = (i / sides) * Math.PI * 2;
          const morphFactor = 1 + Math.sin(time * 0.002 + angle * 3) * 0.3;
          const x = centerX + Math.cos(angle) * radius * morphFactor;
          const y = centerY + Math.sin(angle) * radius * morphFactor;
          
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
      } catch (error) {
        logError('MorphingShapes: Error drawing shape', error);
      }
    };

    const animate = () => {
      try {
        timeRef.current += 16;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw multiple morphing shapes
        const shapes = [
          {
            x: canvas.width * 0.2,
            y: canvas.height * 0.3,
            radius: 100,
            color: 'rgba(59, 130, 246, 0.1)',
            speed: 1
          },
          {
            x: canvas.width * 0.8,
            y: canvas.height * 0.7,
            radius: 150,
            color: 'rgba(147, 51, 234, 0.1)',
            speed: 1.5
          },
          {
            x: canvas.width * 0.6,
            y: canvas.height * 0.2,
            radius: 80,
            color: 'rgba(236, 72, 153, 0.1)',
            speed: 0.8
          }
        ];

        shapes.forEach(shape => {
          drawMorphingShape(
            shape.x, 
            shape.y, 
            shape.radius, 
            timeRef.current * shape.speed, 
            shape.color
          );
        });

        animationRef.current = requestAnimationFrame(animate);
      } catch (error) {
        logError('MorphingShapes: Animation error', error);
      }
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      logDebug('MorphingShapes: Cleanup completed');
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0"
      style={{ background: 'transparent' }}
    />
  );
};

export default MorphingShapes;