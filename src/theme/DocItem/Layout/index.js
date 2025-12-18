import React from 'react';
import OriginalLayout from '@theme-original/DocItem/Layout';
import GiscusComments from '@site/src/components/GiscusComments';
import DocFeedback from '@site/src/components/DocFeedback';

export default function Layout(props) {
  // 从props中获取文档元数据
  const docId = props?.metadata?.id || '';
  const docTitle = props?.metadata?.title || '文档';
  
  return (
    <>
      <OriginalLayout {...props} />
      {docId && (
        <DocFeedback 
          docId={docId}
          docTitle={docTitle}
        />
      )}
      <GiscusComments />
    </>
  );
}

