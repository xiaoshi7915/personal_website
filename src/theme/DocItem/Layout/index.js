import React, { useState, useCallback, memo } from 'react';
import OriginalLayout from '@theme-original/DocItem/Layout';
import GiscusComments from '@site/src/components/GiscusComments';
import DocFeedback from '@site/src/components/DocFeedback';
import BackToTop from '@site/src/components/BackToTop/BackToTop';
import ShareModal from '@site/src/components/ShareModal/ShareModal';
import ReadingProgress from '@site/src/components/ReadingProgress/ReadingProgress';
import GlobalDocTools from '@site/src/components/GlobalDocTools/GlobalDocTools';

/**
 * 文档布局组件
 * 集成所有全局文档工具组件
 * 使用memo优化，避免不必要的重新渲染
 */
function Layout(props) {
  // 从props中获取文档元数据
  const docId = props?.metadata?.id || '';
  const docTitle = props?.metadata?.title || '文档';
  
  // 分享模态框状态管理
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  
  // 使用useCallback优化分享按钮点击回调，避免GlobalDocTools组件不必要的重新渲染
  const handleShareClick = useCallback(() => {
    setIsShareModalOpen(true);
  }, []);
  
  // 使用useCallback优化关闭分享模态框回调
  const handleCloseShareModal = useCallback(() => {
    setIsShareModalOpen(false);
  }, []);
  
  return (
    <>
      {/* 阅读进度条 - 页面顶部 */}
      <ReadingProgress />
      
      {/* 原始布局 */}
      <OriginalLayout {...props} />
      
      {/* 全局文档工具 - 分享按钮和PDF导出按钮 */}
      <GlobalDocTools 
        onShareClick={handleShareClick}
      />
      
      {/* 分享模态框 */}
      <ShareModal 
        isOpen={isShareModalOpen} 
        onClose={handleCloseShareModal}
      />
      
      {/* PDF导出按钮 - 保留原有组件以兼容，但会被GlobalDocTools替代 */}
      {/* 注意：PDFExport组件现在由GlobalDocTools内部处理，这里可以移除 */}
      
      {/* 返回顶部按钮 - 右下角 */}
      <BackToTop />
      
      {/* 文档反馈组件 */}
      {docId && (
        <DocFeedback 
          docId={docId}
          docTitle={docTitle}
        />
      )}
      
      {/* Giscus评论组件 */}
      <GiscusComments />
    </>
  );
}

// 使用memo优化，避免不必要的重新渲染
export default memo(Layout);

