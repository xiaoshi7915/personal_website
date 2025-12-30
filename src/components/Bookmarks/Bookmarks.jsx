import React, { useState, useEffect } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import Link from '@docusaurus/Link';
import {useLocation} from '@docusaurus/router';

/**
 * 收藏功能组件
 * 允许用户收藏和取消收藏文档
 */
function BookmarksInner() {
  const location = useLocation();
  const [bookmarks, setBookmarks] = useState([]);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // 从localStorage加载收藏列表
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('bookmarks');
      if (stored) {
        try {
          const bookmarksList = JSON.parse(stored);
          setBookmarks(bookmarksList);
          // 检查当前页面是否已收藏
          const currentPath = location.pathname;
          setIsBookmarked(bookmarksList.some(b => b.path === currentPath));
        } catch (e) {
          console.error('Failed to parse bookmarks:', e);
        }
      }
    }
  }, [location.pathname]);

  // 切换收藏状态
  const toggleBookmark = () => {
    if (typeof window === 'undefined') return;

    const currentDoc = {
      path: location.pathname,
      title: document.title || location.pathname.split('/').pop(),
      timestamp: Date.now(),
    };

    let newBookmarks;
    if (isBookmarked) {
      // 取消收藏
      newBookmarks = bookmarks.filter(b => b.path !== currentDoc.path);
      setIsBookmarked(false);
    } else {
      // 添加收藏
      newBookmarks = [...bookmarks, currentDoc];
      setIsBookmarked(true);
    }

    localStorage.setItem('bookmarks', JSON.stringify(newBookmarks));
    setBookmarks(newBookmarks);
  };

  // 只在文档页面显示收藏按钮
  if (!location.pathname.startsWith('/docs/')) {
    return null;
  }

  return (
    <div className="bookmarks">
      <button
        onClick={toggleBookmark}
        className={`bookmarks__button ${isBookmarked ? 'bookmarks__button--active' : ''}`}
        title={isBookmarked ? '取消收藏' : '收藏此文档'}
        aria-label={isBookmarked ? '取消收藏' : '收藏此文档'}
      >
        {isBookmarked ? '⭐' : '☆'}
        <span className="bookmarks__text">{isBookmarked ? '已收藏' : '收藏'}</span>
      </button>
    </div>
  );
}

/**
 * 收藏列表组件 - 显示所有收藏的文档
 */
function BookmarksList() {
  const [bookmarks, setBookmarks] = useState([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('bookmarks');
      if (stored) {
        try {
          setBookmarks(JSON.parse(stored));
        } catch (e) {
          console.error('Failed to parse bookmarks:', e);
        }
      }
    }
  }, []);

  if (bookmarks.length === 0) {
    return (
      <div className="bookmarks-list">
        <p className="bookmarks-list__empty">暂无收藏的文档</p>
      </div>
    );
  }

  return (
    <div className="bookmarks-list">
      <h3 className="bookmarks-list__title">我的收藏</h3>
      <ul className="bookmarks-list__list">
        {bookmarks.map((bookmark, index) => (
          <li key={index} className="bookmarks-list__item">
            <Link to={bookmark.path} className="bookmarks-list__link">
              {bookmark.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * 收藏功能组件 - 使用BrowserOnly确保只在客户端渲染
 */
export default function Bookmarks() {
  return (
    <BrowserOnly>
      {() => <BookmarksInner />}
    </BrowserOnly>
  );
}

// 导出收藏列表组件
export { BookmarksList };

