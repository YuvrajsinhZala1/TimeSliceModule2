import React, { useState, useEffect } from 'react';
import { logDebug } from '../../utils/logger';
import CountingAnimation from '../Animations/CountingAnimation';

const StatsCard = ({ 
  title, 
  value, 
  icon, 
  color = 'blue', 
  trend, 
  subtitle,
  animate = true,
  onClick 
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const colorVariants = {
    blue: {
      bg: 'from-blue-500 to-cyan-500',
      icon: 'bg-blue-100 text-blue-600',
      trend: trend > 0 ? 'text-green-600' : 'text-red-600'
    },
    purple: {
      bg: 'from-purple-500 to-pink-500',
      icon: 'bg-purple-100 text-purple-600',
      trend: trend > 0 ? 'text-green-600' : 'text-red-600'
    },
    green: {
      bg: 'from-green-500 to-teal-500',
      icon: 'bg-green-100 text-green-600',
      trend: trend > 0 ? 'text-green-600' : 'text-red-600'
    },
    orange: {
      bg: 'from-orange-500 to-red-500',
      icon: 'bg-orange-100 text-orange-600',
      trend: trend > 0 ? 'text-green-600' : 'text-red-600'
    }
  };

  const colors = colorVariants[color] || colorVariants.blue;

  const handleMouseEnter = () => {
    setIsHovered(true);
    logDebug('StatsCard: Mouse enter', { title });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
      logDebug('StatsCard: Clicked', { title });
    }
  };

  return (
    <div 
      className={`
        relative group bg-white rounded-2xl shadow-lg overflow-hidden 
        transform transition-all duration-300 ease-out cursor-pointer
        ${isHovered ? 'scale-105 shadow-2xl' : 'hover:scale-102'}
        ${onClick ? 'cursor-pointer' : 'cursor-default'}
      `}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {/* Gradient Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colors.bg} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
      
      {/* Animated Border */}
      <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-gradient-to-r group-hover:from-transparent group-hover:via-blue-500 group-hover:to-transparent opacity-0 group-hover:opacity-50 transition-opacity duration-300" />

      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl ${colors.icon} flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-300`}>
            <span className="text-xl">{icon}</span>
          </div>
          
          {trend !== undefined && (
            <div className={`text-sm font-medium ${colors.trend} flex items-center gap-1`}>
              <span>{trend > 0 ? '↗' : '↘'}</span>
              <span>{Math.abs(trend)}%</span>
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="text-gray-600 text-sm font-medium mb-2 group-hover:text-gray-800 transition-colors">
          {title}
        </h3>

        {/* Value */}
        <div className="mb-2">
          {animate && typeof value === 'number' ? (
            <CountingAnimation 
              end={value}
              duration={1500}
              className="text-3xl font-black text-gray-900 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600"
            />
          ) : (
            <span className="text-3xl font-black text-gray-900 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300">
              {value}
            </span>
          )}
        </div>

        {/* Subtitle */}
        {subtitle && (
          <p className="text-gray-500 text-xs">
            {subtitle}
          </p>
        )}

        {/* Hover Effect Glow */}
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-20 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 blur-xl transition-opacity duration-300 -z-10" />
      </div>
    </div>
  );
};

export default StatsCard;