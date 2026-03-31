import React from 'react';
import { motion } from 'motion/react';

/**
 * DotGrid
 * A subtle, repeating dot pattern that fades out towards the edges
 */
export const DotGrid = ({ opacity = 0.5, color = 'rgba(207, 181, 59, 0.4)' }) => (
  <div style={{
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 0,
    pointerEvents: 'none',
    opacity,
    backgroundSize: '20px 20px',
    backgroundImage: `radial-gradient(${color} 1.5px, transparent 1.5px)`,
    maskImage: 'radial-gradient(ellipse at top, black 40%, transparent 70%)',
    WebkitMaskImage: 'radial-gradient(ellipse at top, black 40%, transparent 70%)',
  }} />
);

/**
 * Orb
 * A softly glowing, blurred background element
 */
export const Orb = ({ top, right, bottom, left, size = '300px', color = 'rgba(207, 181, 59, 0.15)', delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1, y: [0, 15, 0] }}
    transition={{ 
      opacity: { duration: 1, delay },
      scale: { duration: 1, delay },
      y: { duration: 6, repeat: Infinity, ease: 'easeInOut' } 
    }}
    style={{
      position: 'absolute',
      width: size,
      height: size,
      borderRadius: '50%',
      background: `radial-gradient(circle at center, ${color} 0%, transparent 70%)`,
      filter: 'blur(40px)',
      top, right, bottom, left,
      zIndex: 0,
      pointerEvents: 'none'
    }}
  />
);

/**
 * AnimatedContent
 * Wraps children in a smooth slide-up + fade-in animation
 */
export const AnimatedContent = ({ children, delay = 0, style, className }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay, ease: 'easeOut' }}
    style={{ ...style, position: 'relative', zIndex: 1 }}
    className={className}
  >
    {children}
  </motion.div>
);

/**
 * MagicBento
 * A CSS Grid container optimized for dashboard bento layouts
 */
export const MagicBento = ({ children, columns = 'repeat(auto-fit, minmax(150px, 1fr))', gap = '0.75rem', style }) => (
  <div style={{ 
    display: 'grid', 
    gridTemplateColumns: columns, 
    gap,
    position: 'relative',
    zIndex: 1,
    ...style 
  }}>
    {children}
  </div>
);

/**
 * MagicBentoCard
 * An interactive glassmorphic card with a subtle border hover glow
 */
export const MagicBentoCard = ({ children, onClick, delay = 0, style }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.4, delay }}
    whileHover={{ y: -4, boxShadow: '0 8px 25px rgba(207, 181, 59, 0.15)' }}
    onClick={onClick}
    style={{
      background: 'var(--card-bg)',
      border: '1px solid rgba(227, 175, 27, 0.1)',
      borderRadius: '16px',
      padding: '1.2rem',
      cursor: onClick ? 'pointer' : 'default',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      ...style
    }}
  >
    {/* Optional internal gradient glow on hover */}
    {onClick && (
      <div className="hover-glow" style={{
        position: 'absolute', inset: 0, zIndex: 0, opacity: 0, transition: 'opacity 0.3s ease',
        background: 'radial-gradient(150px circle at center, rgba(139,92,246,0.08), transparent)'
      }} />
    )}
    <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%' }}>
      {children}
    </div>
  </motion.div>
);
