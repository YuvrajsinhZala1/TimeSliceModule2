import React, { useEffect, useRef } from 'react';
import { logDebug, logError } from '../../utils/logger';

const ParticleSystem = ({ count = 50, color = 'white' }) => {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const animationRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      logError('ParticleSystem: Canvas not found');
      return;
    }

    logDebug('ParticleSystem: Initializing particle system');
    const ctx = canvas.getContext('2d');

    const resizeCanvas = () => {
      try {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        logDebug(`ParticleSystem: Canvas resized to ${canvas.width}x${canvas.height}`);
      } catch (error) {
        logError('ParticleSystem: Error resizing canvas', error);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize particles
    const initParticles = () => {
      try {
        particlesRef.current = [];
        for (let i = 0; i < count; i++) {
          particlesRef.current.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            radius: Math.random() * 3 + 1,
            opacity: Math.random() * 0.8 + 0.1,
            life: Math.random() * 100 + 50
          });
        }
        logDebug(`ParticleSystem: Initialized ${count} particles`);
      } catch (error) {
        logError('ParticleSystem: Error initializing particles', error);
      }
    };

    initParticles();

    const animate = () => {
      try {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particlesRef.current.forEach((particle, index) => {
          // Update particle
          particle.x += particle.vx;
          particle.y += particle.vy;
          particle.life -= 0.5;

          // Reset particle if it dies or goes off screen
          if (particle.life <= 0 || particle.x < 0 || particle.x > canvas.width || particle.y < 0 || particle.y > canvas.height) {
            particle.x = Math.random() * canvas.width;
            particle.y = Math.random() * canvas.height;
            particle.vx = (Math.random() - 0.5) * 2;
            particle.vy = (Math.random() - 0.5) * 2;
            particle.life = Math.random() * 100 + 50;
            particle.opacity = Math.random() * 0.8 + 0.1;
          }

          // Draw particle
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity * (particle.life / 100)})`;
          ctx.fill();
        });

        animationRef.current = requestAnimationFrame(animate);
      } catch (error) {
        logError('ParticleSystem: Animation error', error);
      }
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      logDebug('ParticleSystem: Cleanup completed');
    };
  }, [count, color]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-5"
      style={{ background: 'transparent' }}
    />
  );
};

export default ParticleSystem;