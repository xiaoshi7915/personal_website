import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

/**
 * 交互式Mermaid图表组件
 * 支持缩放、拖拽和全屏功能
 */
export default function InteractiveMermaid({ children, id }) {
  const containerRef = useRef(null);
  const mermaidRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // 触摸相关状态
  const touchStateRef = useRef({
    isTouch: false,
    touchStartTime: 0,
    initialDistance: 0,
    initialScale: 1,
    isPinching: false,
    startX: 0,
    startY: 0,
  });

  // 初始化Mermaid
  useEffect(() => {
    setIsClient(true);
    
    mermaid.initialize({
      startOnLoad: true,
      theme: 'base',
      themeVariables: {
        primaryColor: '#f8fafc',
        primaryTextColor: '#0f172a',
        primaryBorderColor: '#1e40af',
        lineColor: '#64748b',
        secondaryColor: '#e2e8f0',
        tertiaryColor: '#f1f5f9',
        background: '#ffffff',
        mainBkg: '#f8fafc',
        secondBkg: '#e2e8f0',
        tertiaryBkg: '#f1f5f9',
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
      },
      flowchart: {
        useMaxWidth: false,
        htmlLabels: true,
        curve: 'basis',
        padding: 20,
      },
      securityLevel: 'loose',
    });

    return () => {
      // 清理函数
    };
  }, []);

  // 渲染Mermaid图表
  useEffect(() => {
    if (!isClient || !mermaidRef.current || !children) return;

    const mermaidId = id || `mermaid-${Math.random().toString(36).substr(2, 9)}`;
    const mermaidContent = typeof children === 'string' ? children.trim() : children;

    mermaid.render(mermaidId, mermaidContent).then((result) => {
      if (mermaidRef.current) {
        mermaidRef.current.innerHTML = result.svg;
      }
    }).catch((error) => {
      console.error('Mermaid渲染错误:', error);
    });
  }, [isClient, children, id]);

  // 更新变换
  const updateTransform = () => {
    if (mermaidRef.current) {
      mermaidRef.current.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
      mermaidRef.current.style.transformOrigin = 'center center';
      mermaidRef.current.style.cursor = isDragging ? 'grabbing' : 'grab';
      
      if (containerRef.current) {
        if (scale > 1) {
          containerRef.current.classList.add('zoomed');
        } else {
          containerRef.current.classList.remove('zoomed');
        }
      }
    }
  };

  useEffect(() => {
    updateTransform();
  }, [scale, translateX, translateY, isDragging]);

  // 缩放控制
  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev * 1.25, 4));
  };

  const handleZoomOut = () => {
    setScale((prev) => {
      const newScale = Math.max(prev / 1.25, 0.3);
      if (newScale <= 1) {
        setTranslateX(0);
        setTranslateY(0);
      }
      return newScale;
    });
  };

  const handleReset = () => {
    setScale(1);
    setTranslateX(0);
    setTranslateY(0);
  };

  const handleFullscreen = () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      } else if (containerRef.current.webkitRequestFullscreen) {
        containerRef.current.webkitRequestFullscreen();
      } else if (containerRef.current.msRequestFullscreen) {
        containerRef.current.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  };

  // 监听全屏变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(
        !!(document.fullscreenElement ||
          document.webkitFullscreenElement ||
          document.msFullscreenElement)
      );
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // 鼠标事件处理
  const handleMouseDown = (e) => {
    if (touchStateRef.current.isTouch) return;
    setIsDragging(true);
    touchStateRef.current.startX = e.clientX - translateX;
    touchStateRef.current.startY = e.clientY - translateY;
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging && !touchStateRef.current.isTouch) {
        setTranslateX(e.clientX - touchStateRef.current.startX);
        setTranslateY(e.clientY - touchStateRef.current.startY);
      }
    };

    const handleMouseUp = () => {
      if (isDragging && !touchStateRef.current.isTouch) {
        setIsDragging(false);
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('mouseleave', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseUp);
    };
  }, [isDragging]);

  // 触摸事件处理
  const getTouchDistance = (touch1, touch2) => {
    return Math.hypot(
      touch2.clientX - touch1.clientX,
      touch2.clientY - touch1.clientY
    );
  };

  const handleTouchStart = (e) => {
    touchStateRef.current.isTouch = true;
    touchStateRef.current.touchStartTime = Date.now();

    if (e.touches.length === 1) {
      // 单指拖动
      touchStateRef.current.isPinching = false;
      setIsDragging(true);
      const touch = e.touches[0];
      touchStateRef.current.startX = touch.clientX - translateX;
      touchStateRef.current.startY = touch.clientY - translateY;
    } else if (e.touches.length === 2) {
      // 双指缩放
      touchStateRef.current.isPinching = true;
      setIsDragging(false);
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      touchStateRef.current.initialDistance = getTouchDistance(touch1, touch2);
      touchStateRef.current.initialScale = scale;
    }

    e.preventDefault();
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 1 && isDragging && !touchStateRef.current.isPinching) {
      // 单指拖动
      const touch = e.touches[0];
      setTranslateX(touch.clientX - touchStateRef.current.startX);
      setTranslateY(touch.clientY - touchStateRef.current.startY);
    } else if (e.touches.length === 2 && touchStateRef.current.isPinching) {
      // 双指缩放
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentDistance = getTouchDistance(touch1, touch2);

      if (touchStateRef.current.initialDistance > 0) {
        const newScale = Math.min(
          Math.max(
            touchStateRef.current.initialScale *
              (currentDistance / touchStateRef.current.initialDistance),
            0.3
          ),
          4
        );
        setScale(newScale);
      }
    }

    e.preventDefault();
  };

  const handleTouchEnd = (e) => {
    if (e.touches.length === 0) {
      setIsDragging(false);
      touchStateRef.current.isPinching = false;
      touchStateRef.current.initialDistance = 0;
      setTimeout(() => {
        touchStateRef.current.isTouch = false;
      }, 100);
    } else if (e.touches.length === 1 && touchStateRef.current.isPinching) {
      // 从双指变为单指，切换为拖动模式
      touchStateRef.current.isPinching = false;
      setIsDragging(true);
      const touch = e.touches[0];
      touchStateRef.current.startX = touch.clientX - translateX;
      touchStateRef.current.startY = touch.clientY - translateY;
    }
  };

  if (!isClient) {
    return <div className="mermaid-container">加载中...</div>;
  }

  return (
    <div
      ref={containerRef}
      className="mermaid-container"
      style={{
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        minHeight: '300px',
        maxHeight: '800px',
        background: '#ffffff',
        border: '2px solid #e5e7eb',
        borderRadius: '12px',
        padding: '30px',
        margin: '30px 0',
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.08)',
        overflow: 'hidden',
      }}
    >
      {/* 控制按钮 */}
      <div
        className="mermaid-controls"
        style={{
          position: 'absolute',
          top: '15px',
          right: '15px',
          display: 'flex',
          gap: '10px',
          zIndex: 20,
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '8px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        }}
      >
        <button
          className="mermaid-control-btn zoom-in"
          onClick={handleZoomIn}
          title="放大"
          style={{
            background: '#ffffff',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            padding: '10px',
            cursor: 'pointer',
            minWidth: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span>+</span>
        </button>
        <button
          className="mermaid-control-btn zoom-out"
          onClick={handleZoomOut}
          title="缩小"
          style={{
            background: '#ffffff',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            padding: '10px',
            cursor: 'pointer',
            minWidth: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span>-</span>
        </button>
        <button
          className="mermaid-control-btn reset-zoom"
          onClick={handleReset}
          title="重置"
          style={{
            background: '#ffffff',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            padding: '10px',
            cursor: 'pointer',
            minWidth: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span>↻</span>
        </button>
        <button
          className="mermaid-control-btn fullscreen"
          onClick={handleFullscreen}
          title="全屏查看"
          style={{
            background: '#ffffff',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            padding: '10px',
            cursor: 'pointer',
            minWidth: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span>⛶</span>
        </button>
      </div>

      {/* Mermaid图表 */}
      <div
        ref={mermaidRef}
        className="mermaid"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          width: '100%',
          maxWidth: '100%',
          height: '100%',
          cursor: 'grab',
          transition: 'transform 0.3s ease',
          transformOrigin: 'center center',
          touchAction: 'none',
          userSelect: 'none',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      />
    </div>
  );
}


