import React from 'react';
import { logDebug } from '../../utils/logger';

const GlassmorphicCard = ({ 
  children, 
  className = '', 
  hover = true,
  blur = 'backdrop-blur-xl',
  background = 'bg-white/10',
  border = 'border-white/20',
  shadow = 'shadow-2xl',
  ...props 
}) => {
  
  const handleMouseEnter = () => {
    logDebug('GlassmorphicCard: Mouse enter event');
  };

  const baseClasses = `
    ${background} 
    ${blur} 
    border 
    ${border} 
    ${shadow} 
    rounded-2xl 
    backdrop-saturate-150 
    transition-all 
    duration-300 
    ease-out
    ${hover ? 'hover:bg-white/20 hover:border-white/30 hover:shadow-3xl hover:scale-105' : ''}
    ${className}
  `;

  return (
    <div 
      className={baseClasses}
      onMouseEnter={handleMouseEnter}
      {...props}
    >
      {children}
    </div>
  );
};

export default GlassmorphicCard;