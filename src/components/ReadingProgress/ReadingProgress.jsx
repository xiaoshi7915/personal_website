import React, { useEffect, useState, useCallback, useRef } from 'react';

/**
 * 阅读进度条组件
 * 在页面顶部显示阅读进度
 * 使用节流优化性能，避免频繁更新
 */
export default function ReadingProgress() {
  const [progress, setProgress] = useState(0);
  const rafId = useRef(null);

  // 使用requestAnimationFrame优化滚动事件处理
  const updateProgress = useCallback(() => {
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
    }

    rafId.current = requestAnimationFrame(() => {
      // 获取页面总高度和当前滚动位置
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      // 计算进度百分比
      const scrollableHeight = documentHeight - windowHeight;
      const progressPercent = scrollableHeight > 0 
        ? (scrollTop / scrollableHeight) * 100 
        : 0;
      
      setProgress(Math.min(progressPercent, 100));
    });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    // 监听滚动事件 - 使用passive选项提升性能
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress, { passive: true });
    
    // 初始计算
    updateProgress();

    return () => {
      window.removeEventListener('scroll', updateProgress);
      window.removeEventListener('resize', updateProgress);
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [updateProgress]);

  return (
    <div
      className="reading-progress"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: `${progress}%`,
        height: '3px',
        background: 'linear-gradient(90deg, #3b82f6, #0ea5e9)',
        zIndex: 9999,
        transition: 'width 0.1s ease',
        boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)',
      }}
    />
  );
}

