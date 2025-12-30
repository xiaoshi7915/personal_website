import React, { useState, useEffect } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import Link from '@docusaurus/Link';
import {useLocation} from '@docusaurus/router';

/**
 * 最近浏览文档组件
 * 使用localStorage存储用户最近浏览的文档
 */
function RecentDocsInner() {
  const location = useLocation();
  const [recentDocs, setRecentDocs] = useState([]);
  const maxDocs = 5; // 最多显示5个最近浏览的文档

  // 从localStorage加载最近浏览的文档
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('recentDocs');
      if (stored) {
        try {
          const docs = JSON.parse(stored);
          setRecentDocs(docs);
        } catch (e) {
          console.error('Failed to parse recent docs:', e);
        }
      }
    }
  }, []);

  // 当页面变化时，更新最近浏览列表
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // 只记录文档页面
    if (!location.pathname.startsWith('/docs/')) return;
    
    // 获取当前页面信息
    const currentDoc = {
      path: location.pathname,
      title: document.title || location.pathname.split('/').pop(),
      timestamp: Date.now(),
    };

    // 从localStorage获取现有列表
    const stored = localStorage.getItem('recentDocs');
    let docs = stored ? JSON.parse(stored) : [];

    // 移除重复项（相同路径）
    docs = docs.filter(doc => doc.path !== currentDoc.path);

    // 添加到列表开头
    docs.unshift(currentDoc);

    // 限制数量
    docs = docs.slice(0, maxDocs);

    // 保存到localStorage
    localStorage.setItem('recentDocs', JSON.stringify(docs));
    setRecentDocs(docs);
  }, [location.pathname]);

  if (recentDocs.length === 0) {
    return null;
  }

  return (
    <div className="recent-docs">
      <h3 className="recent-docs__title">最近浏览</h3>
      <ul className="recent-docs__list">
        {recentDocs.map((doc, index) => (
          <li key={index} className="recent-docs__item">
            <Link to={doc.path} className="recent-docs__link">
              {doc.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * 最近浏览文档组件 - 使用BrowserOnly确保只在客户端渲染
 */
export default function RecentDocs() {
  return (
    <BrowserOnly>
      {() => <RecentDocsInner />}
    </BrowserOnly>
  );
}

