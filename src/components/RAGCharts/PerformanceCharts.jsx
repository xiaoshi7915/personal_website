import React, { useEffect, useState, lazy, Suspense } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Radar } from 'react-chartjs-2';
import { useColorMode } from '@docusaurus/theme-common';

// 注册Chart.js组件
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

/**
 * RAG性能对比图表组件
 * 包含准确率对比、幻觉率对比和综合性能雷达图
 */
export default function PerformanceCharts() {
  const { colorMode } = useColorMode();
  const [isClient, setIsClient] = useState(false);

  // 确保只在客户端渲染（避免SSR问题）
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 根据主题获取颜色
  const textColor = colorMode === 'dark' ? '#f1f5f9' : '#374151';
  const gridColor = colorMode === 'dark' ? '#334155' : '#e5e7eb';

  // 准确率对比数据
  const accuracyData = {
    labels: ['标准LLM', 'RAG增强'],
    datasets: [
      {
        label: '准确率 (%)',
        data: [62, 89],
        backgroundColor: ['#ef4444', '#10b981'],
        borderColor: ['#dc2626', '#059669'],
        borderWidth: 2,
      },
    ],
  };

  // 幻觉率对比数据
  const hallucinationData = {
    labels: ['标准LLM', 'RAG增强'],
    datasets: [
      {
        label: '幻觉率 (%)',
        data: [23, 5],
        backgroundColor: ['#ef4444', '#10b981'],
        borderColor: ['#dc2626', '#059669'],
        borderWidth: 2,
      },
    ],
  };

  // 综合性能雷达图数据
  const radarData = {
    labels: ['准确率', '相关性', '完整性', '可解释性', '响应速度', '成本效益'],
    datasets: [
      {
        label: '标准LLM',
        data: [62, 58, 55, 45, 85, 70],
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        borderWidth: 2,
      },
      {
        label: 'RAG增强',
        data: [89, 92, 88, 85, 75, 80],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        borderWidth: 2,
      },
    ],
  };

  // 图表通用配置
  const barOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return label ? `${label}: ${value}%` : `${value}%`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: textColor,
          callback: function (value) {
            return value + '%';
          },
        },
        grid: {
          color: gridColor,
        },
      },
      x: {
        ticks: {
          color: textColor,
        },
        grid: {
          color: gridColor,
        },
      },
    },
  };

  // 准确率图表配置
  const accuracyOptions = {
    ...barOptions,
    scales: {
      ...barOptions.scales,
      y: {
        ...barOptions.scales.y,
        max: 100,
      },
    },
    plugins: {
      ...barOptions.plugins,
      tooltip: {
        callbacks: {
          label: function (context) {
            return '准确率: ' + context.parsed.y + '%';
          },
        },
      },
    },
  };

  // 幻觉率图表配置
  const hallucinationOptions = {
    ...barOptions,
    scales: {
      ...barOptions.scales,
      y: {
        ...barOptions.scales.y,
        max: 30,
      },
    },
    plugins: {
      ...barOptions.plugins,
      tooltip: {
        callbacks: {
          label: function (context) {
            return '幻觉率: ' + context.parsed.y + '%';
          },
        },
      },
    },
  };

  // 雷达图配置
  const radarOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        labels: {
          color: textColor,
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return context.dataset.label + ': ' + context.parsed.r + '%';
          },
        },
      },
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          color: textColor,
          stepSize: 20,
        },
        grid: {
          color: gridColor,
        },
        pointLabels: {
          color: textColor,
        },
      },
    },
  };

  // 如果不在客户端，返回占位符
  if (!isClient) {
    return (
      <div className="performance-charts-container">
        <div className="chart-placeholder">图表加载中...</div>
      </div>
    );
  }

  return (
    <div className="performance-charts-container">
      {/* 准确率对比图表 */}
      <div className="mb-8">
        <h4 className="font-semibold mb-4 text-gray-700 dark:text-gray-300">
          准确率对比
        </h4>
        <div style={{ maxHeight: '300px' }}>
          <Bar data={accuracyData} options={accuracyOptions} />
        </div>
      </div>

      {/* 幻觉率对比图表 */}
      <div className="mb-8">
        <h4 className="font-semibold mb-4 text-gray-700 dark:text-gray-300">
          幻觉率对比
        </h4>
        <div style={{ maxHeight: '300px' }}>
          <Bar data={hallucinationData} options={hallucinationOptions} />
        </div>
      </div>

      {/* 综合性能雷达图 */}
      <div className="mt-8">
        <h4 className="font-semibold mb-4 text-gray-700 dark:text-gray-300 text-center">
          综合性能对比雷达图
        </h4>
        <div className="flex justify-center" style={{ maxWidth: '500px', maxHeight: '500px', margin: '0 auto' }}>
          <Radar data={radarData} options={radarOptions} />
        </div>
      </div>
    </div>
  );
}

