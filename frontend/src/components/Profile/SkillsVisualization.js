import React, { useEffect, useRef, useState } from 'react';
import { logComponent, logError, logInteraction } from '../../utils/logger';
import styles from './SkillsVisualization.module.css';

const SkillsVisualization = ({ 
  skills = [], 
  maxSkills = 20,
  interactive = true,
  variant = 'cloud', // 'cloud', 'bars', 'circles'
  onSkillClick,
  className = ''
}) => {
  const containerRef = useRef(null);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 400, height: 300 });

  useEffect(() => {
    logComponent('SkillsVisualization', 'mounted', { 
      variant, 
      skillsCount: skills.length 
    });
    
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width: width || 400, height: height || 300 });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, [variant, skills.length]);

  const processedSkills = React.useMemo(() => {
    if (!skills || skills.length === 0) return [];
    
    // If skills are just strings, convert to objects with default values
    const skillObjects = skills.map(skill => {
      if (typeof skill === 'string') {
        return {
          name: skill,
          level: Math.floor(Math.random() * 5) + 1, // Random level 1-5
          experience: Math.floor(Math.random() * 10) + 1, // Random experience 1-10
          category: 'General'
        };
      }
      return skill;
    });

    // Sort by level/experience and take top skills
    return skillObjects
      .sort((a, b) => (b.level + b.experience) - (a.level + a.experience))
      .slice(0, maxSkills);
  }, [skills, maxSkills]);

  const handleSkillClick = (skill) => {
    if (!interactive) return;
    
    setSelectedSkill(skill);
    logInteraction(document.createElement('button'), 'skill_clicked', { 
      skillName: skill.name,
      level: skill.level 
    });
    
    if (onSkillClick) {
      onSkillClick(skill);
    }
  };

  const getSkillColor = (skill, index) => {
    const colors = [
      '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', 
      '#EF4444', '#6366F1', '#EC4899', '#14B8A6',
      '#F97316', '#84CC16', '#06B6D4', '#8B5A2B'
    ];
    
    if (skill.category) {
      const categoryColors = {
        'Programming': '#3B82F6',
        'Design': '#8B5CF6',
        'Marketing': '#10B981',
        'Business': '#F59E0B',
        'Writing': '#EF4444',
        'Teaching': '#6366F1',
        'Other': '#6B7280'
      };
      return categoryColors[skill.category] || colors[index % colors.length];
    }
    
    return colors[index % colors.length];
  };

  const getSkillSize = (skill, minSize = 12, maxSize = 32) => {
    const totalScore = skill.level + skill.experience;
    const maxScore = 15; // max level (5) + max experience (10)
    const sizeRange = maxSize - minSize;
    return minSize + (totalScore / maxScore) * sizeRange;
  };

  const renderCloudVisualization = () => {
    if (processedSkills.length === 0) return null;

    try {
      const centerX = dimensions.width / 2;
      const centerY = dimensions.height / 2;
      const radius = Math.min(dimensions.width, dimensions.height) / 3;

      return (
        <div className={styles.cloudContainer}>
          {processedSkills.map((skill, index) => {
            const angle = (index / processedSkills.length) * 2 * Math.PI;
            const distance = radius * (0.3 + Math.random() * 0.7);
            const x = centerX + Math.cos(angle) * distance;
            const y = centerY + Math.sin(angle) * distance;
            const size = getSkillSize(skill);
            
            return (
              <div
                key={skill.name}
                className={`${styles.skillBubble} ${
                  selectedSkill?.name === skill.name ? styles.selected : ''
                }`}
                style={{
                  left: x - size / 2,
                  top: y - size / 2,
                  width: size * 2,
                  height: size * 2,
                  backgroundColor: getSkillColor(skill, index),
                  fontSize: `${size * 0.6}px`,
                  animationDelay: `${index * 0.1}s`
                }}
                onClick={() => handleSkillClick(skill)}
                title={`${skill.name} - Level ${skill.level}`}
              >
                <span className={styles.skillName}>{skill.name}</span>
                <div className={styles.skillLevel}>
                  {'★'.repeat(skill.level)}
                </div>
              </div>
            );
          })}
        </div>
      );
    } catch (error) {
      logError('Error rendering cloud visualization:', error);
      return <div className={styles.errorMessage}>Unable to render skills visualization</div>;
    }
  };

  const renderBarsVisualization = () => {
    if (processedSkills.length === 0) return null;

    const maxLevel = Math.max(...processedSkills.map(s => s.level));
    
    return (
      <div className={styles.barsContainer}>
        {processedSkills.map((skill, index) => (
          <div
            key={skill.name}
            className={`${styles.skillBar} ${
              selectedSkill?.name === skill.name ? styles.selected : ''
            }`}
            onClick={() => handleSkillClick(skill)}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className={styles.skillBarLabel}>
              <span className={styles.skillName}>{skill.name}</span>
              <span className={styles.skillValue}>{skill.level}/5</span>
            </div>
            <div className={styles.skillBarTrack}>
              <div
                className={styles.skillBarFill}
                style={{
                  width: `${(skill.level / 5) * 100}%`,
                  backgroundColor: getSkillColor(skill, index),
                  animationDelay: `${index * 0.1 + 0.3}s`
                }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderCirclesVisualization = () => {
    if (processedSkills.length === 0) return null;

    return (
      <div className={styles.circlesContainer}>
        {processedSkills.map((skill, index) => {
          const size = getSkillSize(skill, 60, 120);
          const circumference = 2 * Math.PI * 20; // radius = 20
          const strokeDashoffset = circumference - (skill.level / 5) * circumference;
          
          return (
            <div
              key={skill.name}
              className={`${styles.skillCircle} ${
                selectedSkill?.name === skill.name ? styles.selected : ''
              }`}
              style={{
                width: size,
                height: size,
                animationDelay: `${index * 0.1}s`
              }}
              onClick={() => handleSkillClick(skill)}
            >
              <svg className={styles.circleProgress} viewBox="0 0 50 50">
                <circle
                  className={styles.circleTrack}
                  cx="25"
                  cy="25"
                  r="20"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="3"
                />
                <circle
                  className={styles.circleFill}
                  cx="25"
                  cy="25"
                  r="20"
                  fill="none"
                  stroke={getSkillColor(skill, index)}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  style={{ animationDelay: `${index * 0.1 + 0.3}s` }}
                />
              </svg>
              <div className={styles.circleContent}>
                <span className={styles.skillName}>{skill.name}</span>
                <span className={styles.skillLevel}>{skill.level}/5</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderVisualization = () => {
    switch (variant) {
      case 'bars':
        return renderBarsVisualization();
      case 'circles':
        return renderCirclesVisualization();
      case 'cloud':
      default:
        return renderCloudVisualization();
    }
  };

  if (!skills || skills.length === 0) {
    return (
      <div className={`${styles.skillsVisualization} ${styles.empty} ${className}`}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🎯</div>
          <h3 className={styles.emptyTitle}>No skills to display</h3>
          <p className={styles.emptyMessage}>
            Add some skills to see them visualized here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`${styles.skillsVisualization} ${styles[variant]} ${className}`}
    >
      <div className={styles.header}>
        <h3 className={styles.title}>Skills Overview</h3>
        <div className={styles.controls}>
          <button
            className={`${styles.variantButton} ${variant === 'cloud' ? styles.active : ''}`}
            onClick={() => setSelectedSkill(null)}
            title="Cloud view"
          >
            ☁️
          </button>
          <button
            className={`${styles.variantButton} ${variant === 'bars' ? styles.active : ''}`}
            title="Bar chart view"
          >
            📊
          </button>
          <button
            className={`${styles.variantButton} ${variant === 'circles' ? styles.active : ''}`}
            title="Circle view"
          >
            ⭕
          </button>
        </div>
      </div>

      <div className={styles.visualizationContainer}>
        {renderVisualization()}
      </div>

      {selectedSkill && (
        <div className={styles.skillDetails}>
          <h4 className={styles.detailsTitle}>{selectedSkill.name}</h4>
          <div className={styles.detailsContent}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Level:</span>
              <span className={styles.detailValue}>
                {'★'.repeat(selectedSkill.level)}{'☆'.repeat(5 - selectedSkill.level)}
              </span>
            </div>
            {selectedSkill.experience && (
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Experience:</span>
                <span className={styles.detailValue}>{selectedSkill.experience} years</span>
              </div>
            )}
            {selectedSkill.category && (
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Category:</span>
                <span className={styles.detailValue}>{selectedSkill.category}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className={styles.legend}>
        <span className={styles.legendText}>
          Click on skills to see details • Size represents proficiency level
        </span>
      </div>
    </div>
  );
};

export default SkillsVisualization;