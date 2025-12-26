import React, { useState } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

/**
 * PDF导出组件
 * 提供PDF导出功能按钮
 * @param {string} targetId - 要导出的元素ID，默认为'main-content'
 * @param {string} filename - PDF文件名，默认为页面标题
 */
function PDFExportInner({ targetId = 'main-content', filename }) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    // 动态导入html2pdf，确保只在客户端加载
    const html2pdf = (await import('html2pdf.js')).default;
    
    setIsExporting(true);
    
    try {
      // 获取要导出的元素 - 优先使用指定的ID，否则尝试Docusaurus的主内容区域
      let element = null;
      if (typeof document !== 'undefined') {
        element = document.getElementById(targetId);
        
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
      const pdfFilename = filename || `${document.title || '文档'}_${new Date().toISOString().split('T')[0]}.pdf`;
      
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
        '.navbar, .sidebar, .back-to-top, .pdf-export-btn, .share-btn, .theme-toggle'
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
  };

  return (
    <button
      onClick={handleExportPDF}
      disabled={isExporting}
      className="pdf-export-btn"
      title="导出为PDF"
      style={{
        position: 'fixed',
        bottom: '8rem',
        right: '2rem',
        zIndex: 40,
        backgroundColor: '#dc2626',
        color: 'white',
        padding: '1rem',
        borderRadius: '50%',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s',
        cursor: isExporting ? 'not-allowed' : 'pointer',
        border: 'none',
        width: '56px',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px',
        opacity: isExporting ? 0.6 : 1,
      }}
      onMouseEnter={(e) => {
        if (!isExporting) {
          e.currentTarget.style.backgroundColor = '#b91c1c';
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 12px -1px rgba(0, 0, 0, 0.2)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isExporting) {
          e.currentTarget.style.backgroundColor = '#dc2626';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
        }
      }}
    >
      {isExporting ? '⏳' : '📄'}
    </button>
  );
}

/**
 * PDF导出组件 - 使用BrowserOnly确保只在客户端渲染
 */
export default function PDFExport(props) {
  return (
    <BrowserOnly>
      {() => <PDFExportInner {...props} />}
    </BrowserOnly>
  );
}

