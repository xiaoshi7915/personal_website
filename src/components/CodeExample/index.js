import React, { useState } from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

/**
 * 代码示例组件
 * 
 * 用于在文档中显示带有标题和选项卡的代码示例
 * 
 * @param {Object} props 组件属性
 * @param {String} props.title 示例标题
 * @param {Array} props.tabs 代码选项卡配置
 * @param {React.ReactNode} props.children 子组件
 * @returns {React.ReactElement} 代码示例组件
 */
export default function CodeExample({ title, tabs, children }) {
  // 当前选中的选项卡索引
  const [activeTab, setActiveTab] = useState(0);
  
  // 如果没有提供选项卡，直接渲染子组件
  if (!tabs || tabs.length === 0) {
    return (
      <div className={styles.codeExample}>
        {title && <div className={styles.codeHeader}>{title}</div>}
        <div className={styles.codeContent}>
          {children}
        </div>
      </div>
    );
  }
  
  // 计算活动选项卡内容
  const activeTabContent = Array.isArray(children) 
    ? children[activeTab] 
    : activeTab === 0 ? children : null;
  
  return (
    <div className={styles.codeExample}>
      {title && <div className={styles.codeHeader}>{title}</div>}
      
      <div className={styles.codeTabs}>
        {tabs.map((tab, index) => (
          <button
            key={index}
            className={clsx(
              styles.codeTab,
              activeTab === index && styles.codeTabActive
            )}
            onClick={() => setActiveTab(index)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      <div className={styles.codeContent}>
        {activeTabContent}
      </div>
    </div>
  );
} 