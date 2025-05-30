import React, { useEffect, useState } from 'react';
import { logDebug, logError } from '../../utils/logger';

const FloatingElements = () => {
  const [elements, setElements] = useState([]);

  useEffect(() => {
    try {
      logDebug('FloatingElements: Initializing floating elements');
      
      // Generate floating elements
      const floatingElements = [
        { 
          icon: '⏰', 
          position: { top: '10%', left: '5%' }, 
          delay: 0,
          duration: 6,
          size: 'text-3xl'
        },
        { 
          icon: '🚀', 
          position: { top: '20%', right: '10%' }, 
          delay: 1,
          duration: 8,
          size: 'text-4xl'
        },
        { 
          icon: '💡', 
          position: { top: '60%', left: '8%' }, 
          delay: 2,
          duration: 7,
          size: 'text-2xl'
        },
        { 
          icon: '⭐', 
          position: { top: '70%', right: '5%' }, 
          delay: 3,
          duration: 9,
          size: 'text-3xl'
        },
        { 
          icon: '🎯', 
          position: { top: '40%', left: '3%' }, 
          delay: 4,
          duration: 6,
          size: 'text-2xl'
        },
        { 
          icon: '🔥', 
          position: { top: '80%', left: '15%' }, 
          delay: 5,
          duration: 8,
          size: 'text-3xl'
        }
      ];

      setElements(floatingElements);
      logDebug(`FloatingElements: Created ${floatingElements.length} floating elements`);
    } catch (error) {
      logError('FloatingElements: Error initializing elements', error);
    }
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
      {elements.map((element, index) => (
        <div
          key={index}
          className={`absolute ${element.size} opacity-20 hover:opacity-40 transition-opacity duration-300 animate-float`}
          style={{
            ...element.position,
            animation: `float-${index % 3} ${element.duration}s ease-in-out infinite`,
            animationDelay: `${element.delay}s`
          }}
        >
          {element.icon}
        </div>
      ))}
      
      <style jsx>{`
        @keyframes float-0 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-20px) rotate(5deg); }
          50% { transform: translateY(-10px) rotate(0deg); }
          75% { transform: translateY(-15px) rotate(-5deg); }
        }
        
        @keyframes float-1 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-15px) rotate(-3deg); }
          66% { transform: translateY(-25px) rotate(3deg); }
        }
        
        @keyframes float-2 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          20% { transform: translateY(-10px) rotate(2deg); }
          40% { transform: translateY(-20px) rotate(-2deg); }
          60% { transform: translateY(-15px) rotate(1deg); }
          80% { transform: translateY(-5px) rotate(-1deg); }
        }
      `}</style>
    </div>
  );
};

export default FloatingElements;