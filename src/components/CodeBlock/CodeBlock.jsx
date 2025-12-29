import React, { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import styles from './CodeBlock.module.css';

/**
 * CodeBlock组件 - 支持代码高亮、一键复制和复制成功反馈
 * 
 * @param {string} language - 代码语言（如 'python', 'javascript'）
 * @param {string} children - 代码内容
 * @param {string} title - 可选的代码块标题
 */
export default function CodeBlock({ language, children, title }) {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef(null);
  const timeoutRef = useRef(null);

  // 获取代码文本
  const getCodeText = () => {
    if (typeof children === 'string') {
      return children;
    }
    if (codeRef.current) {
      return codeRef.current.textContent || '';
    }
    return '';
  };

  // 复制代码到剪贴板
  const handleCopy = async () => {
    const codeText = getCodeText();
    
    try {
      // 优先使用现代 Clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(codeText);
      } else {
        // 降级方案：使用 document.execCommand
        const textArea = document.createElement('textarea');
        textArea.value = codeText;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      // 显示复制成功反馈
      setCopied(true);
      
      // 清除之前的定时器
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // 3秒后恢复按钮状态
      timeoutRef.current = setTimeout(() => {
        setCopied(false);
      }, 3000);
    } catch (err) {
      console.error('复制失败:', err);
      // 可以在这里添加错误提示
    }
  };

  // 清理定时器
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={styles.codeBlockWrapper}>
      {title && (
        <div className={styles.codeBlockTitle}>
          <span className={styles.titleText}>{title}</span>
          {language && (
            <span className={styles.languageLabel}>{language}</span>
          )}
        </div>
      )}
      <div className={styles.codeBlockContainer}>
        <button
          className={clsx(styles.copyButton, copied && styles.copied)}
          onClick={handleCopy}
          title={copied ? '已复制!' : '复制代码'}
          aria-label={copied ? '已复制!' : '复制代码'}
        >
          {copied ? (
            <>
              <svg
                className={styles.checkIcon}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className={styles.copyText}>已复制</span>
            </>
          ) : (
            <>
              <svg
                className={styles.copyIcon}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              <span className={styles.copyText}>复制</span>
            </>
          )}
        </button>
        <pre
          ref={codeRef}
          className={clsx(styles.codeBlock, language && `language-${language}`)}
        >
          <code className={language ? `language-${language}` : ''}>
            {typeof children === 'string' ? children.trim() : children}
          </code>
        </pre>
      </div>
    </div>
  );
}

