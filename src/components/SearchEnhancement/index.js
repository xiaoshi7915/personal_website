import React, {useState, useEffect} from 'react';
import {useHistory} from '@docusaurus/router';
import clsx from 'clsx';
import styles from './styles.module.css';

export default function SearchEnhancement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const history = useHistory();

  useEffect(() => {
    // 加载最近搜索记录
    const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    setRecentSearches(recent);
  }, []);

  const handleSearch = (query) => {
    if (!query.trim()) return;

    // 保存到最近搜索
    const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    const updated = [query, ...recent.filter(s => s !== query)].slice(0, 5);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
    setRecentSearches(updated);

    // 执行搜索（使用Docusaurus内置搜索）
    history.push(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch(searchQuery);
    }
  };

  const clearRecentSearches = () => {
    localStorage.removeItem('recentSearches');
    setRecentSearches([]);
  };

  return (
    <div className={styles.searchEnhancement}>
      <div className={styles.searchBox}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="搜索文档..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <button
          className={styles.searchButton}
          onClick={() => handleSearch(searchQuery)}
        >
          🔍
        </button>
      </div>

      {recentSearches.length > 0 && (
        <div className={styles.recentSearches}>
          <div className={styles.recentHeader}>
            <span>最近搜索</span>
            <button
              className={styles.clearButton}
              onClick={clearRecentSearches}
            >
              清除
            </button>
          </div>
          <div className={styles.recentList}>
            {recentSearches.map((search, index) => (
              <button
                key={index}
                className={styles.recentItem}
                onClick={() => handleSearch(search)}
              >
                {search}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={styles.searchTips}>
        <strong>搜索提示：</strong>
        <ul>
          <li>使用引号搜索精确短语</li>
          <li>使用 - 排除关键词</li>
          <li>支持中文和英文搜索</li>
        </ul>
      </div>
    </div>
  );
}


