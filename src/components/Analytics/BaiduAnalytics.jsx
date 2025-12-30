import React, { useEffect } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

/**
 * 百度统计脚本加载组件
 * 注意：需要将 hm.js 后面的ID替换为实际的百度统计ID
 */
function BaiduAnalyticsInner() {
  const {siteConfig} = useDocusaurusContext();
  
  // 百度统计跟踪ID - 需要替换为实际ID
  // 格式：从百度统计获取的代码中提取，通常是类似 "abc123def456" 的字符串
  const BAIDU_TRACKING_ID = 'f0e3ed13929e3f000378cf2accbe5f7c'; // 请替换为您的百度统计跟踪ID

  useEffect(() => {
    if (typeof window === 'undefined' || !BAIDU_TRACKING_ID || BAIDU_TRACKING_ID === 'YOUR_BAIDU_TRACKING_ID') {
      // 如果没有配置跟踪ID，不加载脚本
      return;
    }

    // 加载百度统计脚本
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://hm.baidu.com/hm.js?${BAIDU_TRACKING_ID}`;
    document.head.appendChild(script);

    // 百度统计会自动初始化，无需额外配置
  }, []);

  return null;
}

/**
 * 百度统计组件 - 使用BrowserOnly确保只在客户端渲染
 */
export default function BaiduAnalytics() {
  return (
    <BrowserOnly fallback={null}>
      {() => <BaiduAnalyticsInner />}
    </BrowserOnly>
  );
}

