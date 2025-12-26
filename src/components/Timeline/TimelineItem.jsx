import React from 'react';
import styles from './Timeline.module.css';

/**
 * TimelineItem组件 - 单个时间线节点
 * @param {string} time - 时间标签（如 "1960s - 2010s"）
 * @param {string} title - 节点标题
 * @param {string} color - 颜色主题（blue, green, purple, red）
 * @param {React.ReactNode} children - 节点内容
 * @param {string} id - 节点ID（用于锚点链接）
 */
export default function TimelineItem({ 
  time, 
  title, 
  color = 'blue', 
  children, 
  id 
}) {
  const colorClass = styles[`color-${color}`] || styles['color-blue'];
  
  return (
    <div 
      id={id}
      className={`${styles.timelineItem} ${colorClass}`}
    >
      <div className={styles.timelineContent}>
        <div className={styles.timelineHeader}>
          <span className={`${styles.timeLabel} ${styles[`timeLabel-${color}`]}`}>
            {time}
          </span>
          <h3 className={styles.timelineTitle}>{title}</h3>
        </div>
        <div className={styles.timelineBody}>
          {children}
        </div>
      </div>
    </div>
  );
}

