import React, { useEffect, useRef } from 'react';
import { logDebug, logError } from '../../utils/logger';

const InteractiveBackground = ({ mousePosition }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const nodesRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      logError('InteractiveBackground: Canvas not found');
      return;
    }

    logDebug('InteractiveBackground: Initializing canvas');
    const ctx = canvas.getContext('2d');
    
    const resizeCanvas = () => {
      try {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        logDebug(`InteractiveBackground: Canvas resized to ${canvas.width}x${canvas.height}`);
      } catch (error) {
        logError('InteractiveBackground: Error resizing canvas', error);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize nodes
    const initNodes = () => {
      try {
        nodesRef.current = [];
        const nodeCount = Math.min(100, Math.floor((canvas.width * canvas.height) / 15000));
        
        for (let i = 0; i < nodeCount; i++) {
          nodesRef.current.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            radius: Math.random() * 2 + 1,
            opacity: Math.random() * 0.5 + 0.2,
            hue: Math.random() * 360
          });
        }
        logDebug(`InteractiveBackground: Initialized ${nodeCount} nodes`);
      } catch (error) {
        logError('InteractiveBackground: Error initializing nodes', error);
      }
    };

    initNodes();

    // Animation loop
    const animate = () => {
      try {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Update and draw nodes
        nodesRef.current.forEach((node, i) => {
          // Update position
          node.x += node.vx;
          node.y += node.vy;
          
          // Bounce off edges
          if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
          if (node.y < 0 || node.y > canvas.height) node.vy *= -1;
          
          // Mouse interaction
          if (mousePosition.x && mousePosition.y) {
            const dx = mousePosition.x - node.x;
            const dy = mousePosition.y - node.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 150) {
              const force = (150 - distance) / 150;
              node.x -= dx * force * 0.01;
              node.y -= dy * force * 0.01;
              node.opacity = Math.min(1, node.opacity + force * 0.02);
            } else {
              node.opacity = Math.max(0.2, node.opacity - 0.01);
            }
          }
          
          // Draw node
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${node.hue + Date.now() * 0.01}, 70%, 60%, ${node.opacity})`;
          ctx.fill();
          
          // Draw connections
          nodesRef.current.slice(i + 1).forEach(otherNode => {
            const dx = node.x - otherNode.x;
            const dy = node.y - otherNode.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 100) {
              const opacity = (100 - distance) / 100 * 0.2;
              ctx.beginPath();
              ctx.moveTo(node.x, node.y);
              ctx.lineTo(otherNode.x, otherNode.y);
              ctx.strokeStyle = `hsla(${(node.hue + otherNode.hue) / 2 + Date.now() * 0.01}, 70%, 60%, ${opacity})`;
              ctx.lineWidth = 0.5;
              ctx.stroke();
            }
          });
        });
        
        animationRef.current = requestAnimationFrame(animate);
      } catch (error) {
        logError('InteractiveBackground: Animation error', error);
      }
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      logDebug('InteractiveBackground: Cleanup completed');
    };
  }, [mousePosition]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ background: 'transparent' }}
    />
  );
};

export default InteractiveBackground;