import React from 'react';
import styles from './Timeline.module.css';

/**
 * Timeline组件 - 垂直时间线容器
 * 支持多个时间节点，响应式设计，暗色模式适配
 */
export default function Timeline({ children, className = '' }) {
  return (
    <div className={`${styles.timeline} ${className}`}>
      {children}
    </div>
  );
}

