import React from 'react';
import styles from './ComparisonTable.module.css';

/**
 * ComparisonTable组件 - 技术对比表格
 * 支持多列对比，高亮显示关键信息，响应式设计
 * @param {Array<string>} headers - 表头数组
 * @param {Array<Array<string|React.ReactNode>>} rows - 表格行数据，每行是一个数组
 * @param {string} className - 额外的CSS类名
 */
export default function ComparisonTable({ headers, rows, className = '' }) {
  return (
    <div className={`${styles.comparisonTableWrapper} ${className}`}>
      <div className={styles.comparisonTable}>
        <table>
          <thead>
            <tr>
              {headers.map((header, index) => (
                <th key={index}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


