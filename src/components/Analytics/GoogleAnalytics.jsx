import React, { useEffect } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

/**
 * Google Analytics脚本加载组件
 * 注意：需要将 G-XXXXXXXXXX 替换为实际的Google Analytics跟踪ID
 */
function GoogleAnalyticsInner() {
  const {siteConfig} = useDocusaurusContext();
  
  // Google Analytics跟踪ID - 需要替换为实际ID
  const GA_TRACKING_ID = 'G-XXXXXXXXXX'; // 请替换为您的Google Analytics跟踪ID

  useEffect(() => {
    if (typeof window === 'undefined' || !GA_TRACKING_ID || GA_TRACKING_ID === 'G-XXXXXXXXXX') {
      // 如果没有配置跟踪ID，不加载脚本
      return;
    }

    // 加载Google Analytics脚本
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`;
    document.head.appendChild(script1);

    // 初始化Google Analytics
    window.dataLayer = window.dataLayer || [];
    function gtag() {
      window.dataLayer.push(arguments);
    }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', GA_TRACKING_ID, {
      anonymize_ip: true,
      cookie_flags: 'SameSite=None;Secure',
    });
  }, []);

  return null;
}

/**
 * Google Analytics组件 - 使用BrowserOnly确保只在客户端渲染
 */
export default function GoogleAnalytics() {
  return (
    <BrowserOnly>
      {() => <GoogleAnalyticsInner />}
    </BrowserOnly>
  );
}

