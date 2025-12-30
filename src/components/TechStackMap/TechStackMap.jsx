import React from 'react';

/**
 * 技术栈关联图谱组件
 * 注意：Mermaid图表应该在MDX文件中直接使用mermaid代码块
 * 这个组件主要用于样式包装（如果需要）
 */
export default function TechStackMap({ children }) {
  return (
    <div className="tech-stack-map">
      {children}
    </div>
  );
}
