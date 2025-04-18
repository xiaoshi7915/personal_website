import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

/**
 * 信息卡片组件
 * 
 * 用于在文档中显示提示、警告、信息等重要内容
 * 
 * @param {Object} props 组件属性
 * @param {String} props.type 卡片类型 ('info', 'tip', 'warning', 'danger', 'success')
 * @param {String} props.title 卡片标题
 * @param {React.ReactNode} props.children 卡片内容
 * @param {Boolean} props.collapsible 是否可折叠
 * @returns {React.ReactElement} 信息卡片组件
 */
export default function InfoCard({ 
  type = 'info',
  title,
  children,
  collapsible = false,
}) {
  // 根据不同类型显示不同图标
  const getIcon = () => {
    switch (type) {
      case 'info':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
            <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM11 7h2v2h-2V7zm0 4h2v6h-2v-6z"/>
          </svg>
        );
      case 'tip':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
            <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-11v6h2v-6h-2zm0-4v2h2V7h-2z"/>
          </svg>
        );
      case 'warning':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
            <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-2zm0-8v6h2V7h-2z"/>
          </svg>
        );
      case 'danger':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
            <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-2zm0-8v6h2V7h-2z"/>
          </svg>
        );
      case 'success':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
            <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-.997-6l7.07-7.071-1.414-1.414-5.656 5.657-2.829-2.829-1.414 1.414L11.003 16z"/>
          </svg>
        );
      default:
        return null;
    }
  };
  
  // 如果可折叠，使用useState管理展开/折叠状态
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  
  return (
    <div className={clsx(styles.infoCard, styles[type])}>
      <div className={styles.infoCardHeader}>
        <div className={styles.infoCardIcon}>
          {getIcon()}
        </div>
        
        <div className={styles.infoCardTitle}>
          {title || type.charAt(0).toUpperCase() + type.slice(1)}
        </div>
        
        {collapsible && (
          <button 
            className={styles.collapseButton}
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? '展开' : '折叠'}
          </button>
        )}
      </div>
      
      {(!collapsible || !isCollapsed) && (
        <div className={styles.infoCardContent}>
          {children}
        </div>
      )}
    </div>
  );
} 