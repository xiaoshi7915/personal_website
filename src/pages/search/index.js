import React from 'react';
import Layout from '@theme/Layout';
import SearchEnhancement from '@site/src/components/SearchEnhancement';

export default function SearchPage() {
  return (
    <Layout
      title="搜索"
      description="搜索文档内容">
      <div className="container margin-vert--lg">
        <div className="row">
          <div className="col col--8 col--offset-2">
            <h1>搜索文档</h1>
            <SearchEnhancement />
          </div>
        </div>
      </div>
    </Layout>
  );
}


