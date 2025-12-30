import React, { useEffect } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

/**
 * 性能监控组件
 * 监控Core Web Vitals (LCP, FID, CLS) 和其他性能指标
 */
function PerformanceMonitorInner() {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.PerformanceObserver === 'undefined') {
      return;
    }

    // 监控LCP (Largest Contentful Paint)
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        // 发送到分析服务
        if (window.gtag) {
          window.gtag('event', 'web_vitals', {
            event_category: 'Web Vitals',
            event_label: 'LCP',
            value: Math.round(lastEntry.renderTime || lastEntry.loadTime),
            non_interaction: true,
          });
        }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      console.warn('LCP monitoring not supported:', e);
    }

    // 监控FID (First Input Delay)
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (window.gtag) {
            window.gtag('event', 'web_vitals', {
              event_category: 'Web Vitals',
              event_label: 'FID',
              value: Math.round(entry.processingStart - entry.startTime),
              non_interaction: true,
            });
          }
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      console.warn('FID monitoring not supported:', e);
    }

    // 监控CLS (Cumulative Layout Shift)
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        
        // 在页面卸载时发送CLS值
        window.addEventListener('beforeunload', () => {
          if (window.gtag && clsValue > 0) {
            window.gtag('event', 'web_vitals', {
              event_category: 'Web Vitals',
              event_label: 'CLS',
              value: Math.round(clsValue * 1000) / 1000,
              non_interaction: true,
            });
          }
        });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      console.warn('CLS monitoring not supported:', e);
    }

    // 监控页面加载时间
    window.addEventListener('load', () => {
      if (window.performance && window.performance.timing) {
        const timing = window.performance.timing;
        const loadTime = timing.loadEventEnd - timing.navigationStart;
        
        if (window.gtag) {
          window.gtag('event', 'page_load_time', {
            event_category: 'Performance',
            event_label: 'Page Load',
            value: Math.round(loadTime),
            non_interaction: true,
          });
        }
      }
    });

    // 监控资源加载时间
    if (window.performance && window.performance.getEntriesByType) {
      window.addEventListener('load', () => {
        const resources = window.performance.getEntriesByType('resource');
        const slowResources = resources.filter(
          (resource) => resource.duration > 3000
        );

        if (slowResources.length > 0 && window.gtag) {
          window.gtag('event', 'slow_resources', {
            event_category: 'Performance',
            event_label: 'Slow Resources',
            value: slowResources.length,
            non_interaction: true,
          });
        }
      });
    }
  }, []);

  return null;
}

/**
 * 性能监控组件 - 使用BrowserOnly确保只在客户端渲染
 */
export default function PerformanceMonitor() {
  return (
    <BrowserOnly fallback={null}>
      {() => <PerformanceMonitorInner />}
    </BrowserOnly>
  );
}

