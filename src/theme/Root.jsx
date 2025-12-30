import React from 'react';
import OriginalRoot from '@theme-original/Root';
import StructuredData from '@site/src/components/StructuredData/StructuredData';
import Analytics from '@site/src/components/Analytics/Analytics';
import BaiduAnalytics from '@site/src/components/Analytics/BaiduAnalytics';
import PerformanceMonitor from '@site/src/components/PerformanceMonitor/PerformanceMonitor';

/**
 * Root组件 - 为所有页面添加结构化数据和网站分析
 * 这个组件会在所有页面的根级别渲染，确保SEO和分析功能在所有页面都可用
 */
export default function Root({children}) {
  return (
    <>
      <OriginalRoot>{children}</OriginalRoot>
      {/* 百度统计脚本加载 */}
      <BaiduAnalytics />
      {/* 结构化数据 - 确保在所有页面都可用 */}
      <StructuredData />
      {/* 网站分析 - 追踪用户行为 */}
      <Analytics />
      {/* 性能监控 - Core Web Vitals */}
      <PerformanceMonitor />
    </>
  );
}

