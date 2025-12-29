import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import styles from './FAQ.module.css';

/**
 * FAQ项组件
 * 单个FAQ项，支持展开/收起、平滑动画
 * 
 * @param {string} question - 问题文本
 * @param {React.ReactNode} children - 答案内容
 * @param {number} index - FAQ项的索引（由FAQ组件提供）
 * @param {boolean} isOpen - 是否展开（手风琴模式时由FAQ组件控制）
 * @param {function} onToggle - 切换展开/收起状态的回调（手风琴模式时由FAQ组件提供）
 * @param {boolean} accordion - 是否使用手风琴模式
 */
export default function FAQItem({
  question,
  children,
  index,
  isOpen: controlledIsOpen,
  onToggle,
  accordion = true,
}) {
  // 独立模式时使用内部状态
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const contentRef = React.useRef(null);
  const [contentHeight, setContentHeight] = useState(0);

  // 根据模式决定使用哪个状态
  const isOpen = accordion ? controlledIsOpen : internalIsOpen;

  // 计算内容高度
  useEffect(() => {
    if (contentRef.current) {
      if (isOpen) {
        // 展开时，设置高度为实际内容高度
        setContentHeight(contentRef.current.scrollHeight);
      } else {
        // 收起时，高度为0
        setContentHeight(0);
      }
    }
  }, [isOpen, children]);

  const handleToggle = () => {
    if (accordion && onToggle) {
      // 手风琴模式：使用父组件提供的onToggle
      onToggle();
    } else {
      // 独立模式：使用内部状态
      setInternalIsOpen(!internalIsOpen);
    }
  };

  return (
    <div className={clsx(styles.faqItem, isOpen && styles.faqItemOpen)}>
      <button
        className={styles.faqQuestion}
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-controls={`faq-answer-${index}`}
      >
        <span className={styles.questionText}>{question}</span>
        <svg
          className={clsx(styles.arrowIcon, isOpen && styles.arrowIconOpen)}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      <div
        id={`faq-answer-${index}`}
        className={styles.faqAnswer}
        style={{
          maxHeight: `${contentHeight}px`,
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div ref={contentRef} className={styles.faqAnswerContent}>
          {children}
        </div>
      </div>
    </div>
  );
}

