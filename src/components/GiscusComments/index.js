import React, {useEffect, useRef} from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {useLocation} from '@docusaurus/router';

export default function GiscusComments() {
  const {siteConfig} = useDocusaurusContext();
  const location = useLocation();
  const giscusRef = useRef(null);

  useEffect(() => {
    if (!giscusRef.current) return;
    
    // 检查是否配置了Giscus
    const giscusConfig = siteConfig.themeConfig?.giscus;
    if (!giscusConfig || !giscusConfig.repoId || !giscusConfig.categoryId) {
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.setAttribute('data-repo', giscusConfig.repo);
    script.setAttribute('data-repo-id', giscusConfig.repoId);
    script.setAttribute('data-category', giscusConfig.category);
    script.setAttribute('data-category-id', giscusConfig.categoryId);
    script.setAttribute('data-mapping', giscusConfig.mapping || 'pathname');
    script.setAttribute('data-strict', giscusConfig.strict !== undefined ? (giscusConfig.strict ? '1' : '0') : '0');
    script.setAttribute('data-reactions-enabled', giscusConfig.reactionsEnabled ? '1' : '0');
    script.setAttribute('data-emit-metadata', giscusConfig.emitMetadata ? '1' : '0');
    script.setAttribute('data-input-position', giscusConfig.inputPosition || 'bottom');
    script.setAttribute('data-theme', document.documentElement.getAttribute('data-theme') === 'dark' 
      ? giscusConfig.darkTheme 
      : giscusConfig.theme);
    script.setAttribute('data-lang', giscusConfig.lang || 'zh-CN');
    script.setAttribute('crossorigin', 'anonymous');
    script.async = true;

    // 清除旧的脚本
    const existingScript = giscusRef.current.querySelector('script');
    if (existingScript) {
      existingScript.remove();
    }

    giscusRef.current.appendChild(script);

    // 监听主题变化
    const observer = new MutationObserver(() => {
      const giscusConfig = siteConfig.themeConfig?.giscus;
      if (!giscusConfig) return;
      
      const theme = document.documentElement.getAttribute('data-theme') === 'dark'
        ? giscusConfig.darkTheme
        : giscusConfig.theme;
      
      const iframe = giscusRef.current?.querySelector('iframe');
      if (iframe) {
        iframe.contentWindow.postMessage(
          {giscus: {setConfig: {theme}}},
          'https://giscus.app'
        );
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => {
      observer.disconnect();
    };
  }, [location.pathname, siteConfig]);

  return (
    <div 
      ref={giscusRef} 
      style={{
        marginTop: '3rem',
        paddingTop: '2rem',
        borderTop: '1px solid var(--ifm-color-emphasis-200)',
      }}
    />
  );
}

