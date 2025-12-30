import React, { useEffect } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {useLocation} from '@docusaurus/router';

/**
 * 网站分析组件
 * 集成Google Analytics和自定义事件追踪
 * 追踪文档阅读时长、代码复制、搜索关键词等
 */
function AnalyticsInner() {
  const {siteConfig} = useDocusaurusContext();
  const location = useLocation();

  // 页面访问追踪
  useEffect(() => {
    // 如果配置了Google Analytics，发送页面浏览事件
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', 'G-XXXXXXXXXX', { // 需要替换为实际的跟踪ID
        page_path: location.pathname,
        page_title: document.title,
      });
    }
  }, [location.pathname]);

  // 追踪代码复制事件
  useEffect(() => {
    const handleCopy = (event) => {
      // 检查是否是从代码块复制的
      const codeBlock = event.target.closest('pre, .code-block, .prism-code');
      if (codeBlock) {
        // 发送自定义事件
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'code_copy', {
            event_category: 'engagement',
            event_label: location.pathname,
            value: 1,
          });
        }
        
        // 也可以使用dataLayer
        if (typeof window !== 'undefined' && window.dataLayer) {
          window.dataLayer.push({
            event: 'code_copy',
            page_path: location.pathname,
            timestamp: new Date().toISOString(),
          });
        }
      }
    };

    document.addEventListener('copy', handleCopy);
    return () => {
      document.removeEventListener('copy', handleCopy);
    };
  }, [location.pathname]);

  // 追踪外部链接点击
  useEffect(() => {
    const handleExternalLinkClick = (event) => {
      const link = event.target.closest('a');
      if (link && link.href && !link.href.startsWith(window.location.origin)) {
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'external_link_click', {
            event_category: 'outbound',
            event_label: link.href,
            transport_type: 'beacon',
          });
        }
      }
    };

    document.addEventListener('click', handleExternalLinkClick);
    return () => {
      document.removeEventListener('click', handleExternalLinkClick);
    };
  }, []);

  // 追踪文档阅读时长
  useEffect(() => {
    const startTime = Date.now();
    const isDocPage = location.pathname.startsWith('/docs/');

    if (!isDocPage) return;

    // 计算阅读时长
    const calculateReadingTime = () => {
      const endTime = Date.now();
      const readingTime = Math.round((endTime - startTime) / 1000); // 秒

      // 只有在阅读时间超过10秒时才记录
      if (readingTime > 10) {
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'page_read_time', {
            event_category: 'engagement',
            event_label: location.pathname,
            value: readingTime,
          });
        }
      }
    };

    // 页面卸载时记录阅读时长
    window.addEventListener('beforeunload', calculateReadingTime);
    
    // 页面隐藏时也记录（用户切换标签页）
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        calculateReadingTime();
      }
    });

    return () => {
      window.removeEventListener('beforeunload', calculateReadingTime);
      calculateReadingTime(); // 组件卸载时也记录
    };
  }, [location.pathname]);

  // 追踪搜索关键词
  useEffect(() => {
    const handleSearch = (event) => {
      const searchInput = event.target;
      if (searchInput && searchInput.value && searchInput.value.length > 2) {
        // 延迟发送，避免频繁触发
        const timeoutId = setTimeout(() => {
          if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'search', {
              event_category: 'engagement',
              search_term: searchInput.value,
            });
          }
        }, 1000);

        return () => clearTimeout(timeoutId);
      }
    };

    // 监听搜索输入框
    const searchInputs = document.querySelectorAll('input[type="search"], input[placeholder*="搜索"]');
    searchInputs.forEach(input => {
      input.addEventListener('input', handleSearch);
    });

    return () => {
      searchInputs.forEach(input => {
        input.removeEventListener('input', handleSearch);
      });
    };
  }, []);

  return null; // 这个组件不渲染任何内容
}

/**
 * 网站分析组件 - 使用BrowserOnly确保只在客户端渲染
 */
export default function Analytics() {
  return (
    <BrowserOnly fallback={null}>
      {() => <AnalyticsInner />}
    </BrowserOnly>
  );
}

