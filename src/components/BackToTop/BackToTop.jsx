import React, { useEffect, useState, useCallback, useRef } from 'react';

/**
 * 返回顶部按钮组件
 * 当页面滚动一定距离后显示，点击返回顶部
 * 使用requestAnimationFrame优化性能
 */
export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const rafId = useRef(null);

  // 使用requestAnimationFrame优化滚动事件处理
  const toggleVisibility = useCallback(() => {
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
    }

    rafId.current = requestAnimationFrame(() => {
      // 当页面滚动超过300px时显示按钮
      const shouldShow = window.pageYOffset > 300;
      setIsVisible(shouldShow);
    });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    // 监听滚动事件 - 使用passive选项提升性能
    window.addEventListener('scroll', toggleVisibility, { passive: true });

    return () => {
      window.removeEventListener('scroll', toggleVisibility);
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [toggleVisibility]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <button
      onClick={scrollToTop}
      className="back-to-top"
      style={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        zIndex: 40,
        backgroundColor: '#2563eb',
        color: 'white',
        padding: '1rem',
        borderRadius: '50%',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s',
        cursor: 'pointer',
        border: 'none',
        width: '48px',
        height: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px',
        opacity: isVisible ? 1 : 0,
        visibility: isVisible ? 'visible' : 'hidden',
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#1d4ed8';
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 6px 12px -1px rgba(0, 0, 0, 0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#2563eb';
        e.currentTarget.style.transform = isVisible ? 'translateY(0)' : 'translateY(20px)';
        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
      }}
      title="返回顶部"
    >
      ↑
    </button>
  );
}

