import React, { useState } from 'react';
import styles from './FAQ.module.css';

/**
 * FAQ容器组件
 * 管理多个FAQ项的状态，支持手风琴模式（一次只展开一个）或独立模式
 * 
 * @param {React.ReactNode} children - FAQItem组件列表
 * @param {boolean} accordion - 是否使用手风琴模式（默认true）
 */
export default function FAQ({ children, accordion = true }) {
  const [openIndex, setOpenIndex] = useState(null);

  const handleToggle = (index) => {
    if (accordion) {
      // 手风琴模式：如果点击的是已展开的项，则关闭；否则展开该项并关闭其他项
      setOpenIndex(openIndex === index ? null : index);
    } else {
      // 独立模式：由FAQItem自己管理状态
      // 这里不做处理，让FAQItem自己处理
    }
  };

  // 将children转换为数组，并为每个child添加index和onToggle prop
  const faqItems = React.Children.map(children, (child, index) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        index,
        isOpen: accordion ? openIndex === index : undefined,
        onToggle: () => handleToggle(index),
        accordion,
      });
    }
    return child;
  });

  return <div className={styles.faqContainer}>{faqItems}</div>;
}

