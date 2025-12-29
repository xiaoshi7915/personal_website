import React, { useState, useCallback, memo } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

/**
 * 全局文档工具组件
 * 整合分享按钮和PDF导出按钮，统一管理按钮位置和样式
 * 使用memo优化，避免不必要的重新渲染
 * @param {Function} onShareClick - 分享按钮点击回调
 */
const GlobalDocToolsInner = memo(function GlobalDocToolsInner({ onShareClick }) {
  const [isExporting, setIsExporting] = useState(false);

  /**
   * 处理PDF导出
   */
  const handleExportPDF = useCallback(async () => {
    // 动态导入html2pdf，确保只在客户端加载
    const html2pdf = (await import('html2pdf.js')).default;
    
    setIsExporting(true);
    
    try {
      // 获取要导出的元素 - 优先使用指定的ID，否则尝试Docusaurus的主内容区域
      let element = null;
      if (typeof document !== 'undefined') {
        element = document.getElementById('main-content');
        
        // 如果找不到指定元素，尝试查找Docusaurus的主内容区域
        if (!element || element.scrollHeight === 0) {
          // 尝试查找Docusaurus的主内容区域
          const mainContent = document.querySelector('main article') || 
                             document.querySelector('main .markdown') ||
                             document.querySelector('article') ||
                             document.querySelector('.markdown');
          
          if (mainContent && mainContent.scrollHeight > 0) {
            element = mainContent;
          } else if (!element) {
            // 最后回退到body
            element = document.body;
          }
        }
      }
      
      if (!element) {
        throw new Error('Document not available');
      }
      
      // 确保元素有内容
      if (element.scrollHeight === 0 && element !== document.body) {
        // 尝试查找父元素或主内容区域
        const alternative = document.querySelector('main article') || 
                           document.querySelector('main .markdown') ||
                           document.querySelector('article') ||
                           document.querySelector('.markdown') ||
                           document.querySelector('main');
        if (alternative && alternative.scrollHeight > 0) {
          element = alternative;
        }
      }
      
      // 生成文件名
      const pdfFilename = `${document.title || '文档'}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      // 配置选项 - 优化html2canvas配置以确保正确渲染
      const opt = {
        margin: [10, 10, 10, 10],
        filename: pdfFilename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          letterRendering: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          windowWidth: element.scrollWidth || element.offsetWidth || 1200,
          windowHeight: element.scrollHeight || element.offsetHeight || 1600,
          scrollX: 0,
          scrollY: 0,
          x: 0,
          y: 0,
          width: element.scrollWidth || element.offsetWidth || 1200,
          height: element.scrollHeight || element.offsetHeight || 1600,
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait',
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      };

      // 隐藏不需要的元素
      const elementsToHide = document.querySelectorAll(
        '.navbar, .sidebar, .back-to-top, .pdf-export-btn, .share-btn, .theme-toggle, .global-doc-tools'
      );
      const originalDisplay = [];
      
      elementsToHide.forEach((el) => {
        originalDisplay.push(el.style.display);
        el.style.display = 'none';
      });

      // 导出PDF
      await html2pdf().set(opt).from(element).save();

      // 恢复隐藏的元素
      elementsToHide.forEach((el, index) => {
        el.style.display = originalDisplay[index];
      });

      setIsExporting(false);
    } catch (error) {
      console.error('PDF导出失败:', error);
      alert('PDF导出失败，请稍后重试');
      setIsExporting(false);
    }
  }, []);

  return (
    <div className="global-doc-tools">
      {/* 分享按钮 - 右上角 */}
      <button
        onClick={onShareClick}
        className="global-doc-tools__share-btn share-btn"
        title="分享页面"
        aria-label="分享页面"
      >
        📤
      </button>

      {/* PDF导出按钮 - 右下角，在返回顶部按钮上方 */}
      <button
        onClick={handleExportPDF}
        disabled={isExporting}
        className="global-doc-tools__pdf-btn pdf-export-btn"
        title="导出为PDF"
        aria-label="导出为PDF"
      >
        {isExporting ? '⏳' : '📄'}
      </button>
    </div>
  );
});

/**
 * 全局文档工具组件 - 使用BrowserOnly确保只在客户端渲染
 * 使用memo优化，避免不必要的重新渲染
 */
const GlobalDocTools = memo(function GlobalDocTools({ onShareClick }) {
  return (
    <BrowserOnly>
      {() => <GlobalDocToolsInner onShareClick={onShareClick} />}
    </BrowserOnly>
  );
});

export default GlobalDocTools;

