import React from 'react';
import { logComponent } from '../../../utils/logger';
import styles from './Loading.module.css';

const Loading = ({
  size = 'medium',
  color = 'primary',
  text = '',
  variant = 'spinner',
  className = '',
  centered = false,
  overlay = false,
  ...props
}) => {
  // Log component usage for debugging
  React.useEffect(() => {
    logComponent('Loading', 'displayed', { size, color, variant, text });
  }, [size, color, variant, text]);

  const loadingClasses = [
    styles.loading,
    styles[size],
    styles[color],
    styles[variant],
    centered && styles.centered,
    overlay && styles.overlay,
    className
  ].filter(Boolean).join(' ');

  const renderSpinner = () => (
    <div className={styles.spinner}>
      <div className={styles.spinnerInner}></div>
    </div>
  );

  const renderDots = () => (
    <div className={styles.dots}>
      <div className={styles.dot}></div>
      <div className={styles.dot}></div>
      <div className={styles.dot}></div>
    </div>
  );

  const renderPulse = () => (
    <div className={styles.pulse}>
      <div className={styles.pulseRing}></div>
      <div className={styles.pulseCore}></div>
    </div>
  );

  const renderBars = () => (
    <div className={styles.bars}>
      <div className={styles.bar}></div>
      <div className={styles.bar}></div>
      <div className={styles.bar}></div>
      <div className={styles.bar}></div>
    </div>
  );

  const renderWave = () => (
    <div className={styles.wave}>
      <div className={styles.waveBar}></div>
      <div className={styles.waveBar}></div>
      <div className={styles.waveBar}></div>
      <div className={styles.waveBar}></div>
      <div className={styles.waveBar}></div>
    </div>
  );

  const renderRipple = () => (
    <div className={styles.ripple}>
      <div className={styles.rippleRing}></div>
      <div className={styles.rippleRing}></div>
    </div>
  );

  const renderProgress = () => (
    <div className={styles.progress}>
      <div className={styles.progressBar}></div>
    </div>
  );

  const renderSkeleton = () => (
    <div className={styles.skeleton}>
      <div className={styles.skeletonLine}></div>
      <div className={styles.skeletonLine}></div>
      <div className={styles.skeletonLine}></div>
    </div>
  );

  const renderLoader = () => {
    switch (variant) {
      case 'dots':
        return renderDots();
      case 'pulse':
        return renderPulse();
      case 'bars':
        return renderBars();
      case 'wave':
        return renderWave();
      case 'ripple':
        return renderRipple();
      case 'progress':
        return renderProgress();
      case 'skeleton':
        return renderSkeleton();
      case 'spinner':
      default:
        return renderSpinner();
    }
  };

  return (
    <div className={loadingClasses} {...props}>
      <div className={styles.loaderContainer}>
        {renderLoader()}
        {text && (
          <div className={styles.loadingText}>
            {text}
          </div>
        )}
      </div>
    </div>
  );
};

// Preset loading components for common use cases
export const PageLoading = ({ text = 'Loading page...', ...props }) => (
  <Loading 
    size="large" 
    variant="spinner" 
    text={text} 
    centered 
    overlay 
    {...props} 
  />
);

export const ButtonLoading = ({ text = '', ...props }) => (
  <Loading 
    size="small" 
    variant="spinner" 
    text={text} 
    color="white" 
    {...props} 
  />
);

export const CardLoading = ({ ...props }) => (
  <Loading 
    size="medium" 
    variant="skeleton" 
    {...props} 
  />
);

export const InlineLoading = ({ text = 'Loading...', ...props }) => (
  <Loading 
    size="small" 
    variant="dots" 
    text={text} 
    {...props} 
  />
);

export const FullPageLoading = ({ text = 'Loading application...', ...props }) => (
  <Loading 
    size="large" 
    variant="pulse" 
    text={text} 
    centered 
    overlay 
    {...props} 
  />
);

export default Loading;