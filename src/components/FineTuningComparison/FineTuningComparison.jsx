import React, { useEffect, useState } from 'react';
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
import clsx from 'clsx';
import styles from './FineTuningComparison.module.css';

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
 * 微调方法对比可视化组件
 * 支持参数量对比柱状图、资源消耗雷达图、性能对比柱状图和适用场景对比表格
 */
export default function FineTuningComparison({
  methods = ['FFT', 'LoRA', 'QLoRA', 'Prompt Tuning', 'Prefix Tuning', 'Adapter', 'IA3'],
  defaultChartType = 'bar',
}) {
  const { colorMode } = useColorMode();
  const [isClient, setIsClient] = useState(false);
  const [chartType, setChartType] = useState(defaultChartType);

  // 确保只在客户端渲染（避免SSR问题）
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 根据主题获取颜色
  const textColor = colorMode === 'dark' ? '#f1f5f9' : '#374151';
  const gridColor = colorMode === 'dark' ? '#334155' : '#e5e7eb';

  // 微调方法对比数据
  const comparisonData = {
    'FFT': {
      params: 100, // 可训练参数量占比 (%)
      compute: 100, // 计算资源消耗
      storage: 100, // 存储开销
      speed: 20, // 训练速度 (反向，值越小越快)
      performance: 100, // 性能表现
      memory: 100, // 内存占用
    },
    'LoRA': {
      params: 0.1, // 约0.1%参数量
      compute: 30,
      storage: 0.2,
      speed: 80,
      performance: 95,
      memory: 30,
    },
    'QLoRA': {
      params: 0.1,
      compute: 15,
      storage: 0.1,
      speed: 85,
      performance: 92,
      memory: 10,
    },
    'Prompt Tuning': {
      params: 0.01,
      compute: 10,
      storage: 0.01,
      speed: 90,
      performance: 75,
      memory: 5,
    },
    'Prefix Tuning': {
      params: 0.1,
      compute: 25,
      storage: 0.2,
      speed: 75,
      performance: 88,
      memory: 25,
    },
    'Adapter': {
      params: 0.5,
      compute: 40,
      storage: 0.5,
      speed: 70,
      performance: 90,
      memory: 40,
    },
    'IA3': {
      params: 0.01,
      compute: 12,
      storage: 0.01,
      speed: 88,
      performance: 80,
      memory: 8,
    },
  };

  // 参数量对比柱状图数据
  const paramsData = {
    labels: methods,
    datasets: [
      {
        label: '可训练参数量占比 (%)',
        data: methods.map(method => comparisonData[method]?.params || 0),
        backgroundColor: methods.map((_, i) => {
          const colors = [
            'rgba(239, 68, 68, 0.8)',   // FFT - 红色
            'rgba(59, 130, 246, 0.8)',  // LoRA - 蓝色
            'rgba(16, 185, 129, 0.8)',  // QLoRA - 绿色
            'rgba(251, 191, 36, 0.8)', // Prompt Tuning - 黄色
            'rgba(139, 92, 246, 0.8)', // Prefix Tuning - 紫色
            'rgba(236, 72, 153, 0.8)', // Adapter - 粉色
            'rgba(14, 165, 233, 0.8)', // IA3 - 天蓝
          ];
          return colors[i % colors.length];
        }),
        borderColor: methods.map((_, i) => {
          const colors = [
            '#dc2626', '#2563eb', '#059669', '#d97706', '#7c3aed', '#db2777', '#0284c7',
          ];
          return colors[i % colors.length];
        }),
        borderWidth: 2,
      },
    ],
  };

  // 资源消耗雷达图数据
  const resourceData = {
    labels: ['计算资源', '存储开销', '训练速度', '内存占用'],
    datasets: methods.slice(0, 4).map((method, index) => {
      const data = comparisonData[method];
      const colors = [
        { border: '#dc2626', fill: 'rgba(239, 68, 68, 0.2)' }, // FFT
        { border: '#2563eb', fill: 'rgba(59, 130, 246, 0.2)' }, // LoRA
        { border: '#059669', fill: 'rgba(16, 185, 129, 0.2)' }, // QLoRA
        { border: '#d97706', fill: 'rgba(251, 191, 36, 0.2)' }, // Prompt Tuning
      ];
      return {
        label: method,
        data: [
          data.compute,
          data.storage * 100, // 转换为百分比显示
          data.speed,
          data.memory,
        ],
        borderColor: colors[index]?.border || '#666',
        backgroundColor: colors[index]?.fill || 'rgba(100, 100, 100, 0.2)',
        borderWidth: 2,
      };
    }),
  };

  // 性能对比柱状图数据
  const performanceData = {
    labels: methods,
    datasets: [
      {
        label: '性能表现 (%)',
        data: methods.map(method => comparisonData[method]?.performance || 0),
        backgroundColor: methods.map((_, i) => {
          const colors = [
            'rgba(239, 68, 68, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(251, 191, 36, 0.8)',
            'rgba(139, 92, 246, 0.8)',
            'rgba(236, 72, 153, 0.8)',
            'rgba(14, 165, 233, 0.8)',
          ];
          return colors[i % colors.length];
        }),
        borderColor: methods.map((_, i) => {
          const colors = [
            '#dc2626', '#2563eb', '#059669', '#d97706', '#7c3aed', '#db2777', '#0284c7',
          ];
          return colors[i % colors.length];
        }),
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
            if (label.includes('参数量')) {
              return `${label}: ${value.toFixed(2)}%`;
            }
            return `${label}: ${value}%`;
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
            return context.dataset.label + ': ' + context.parsed.r.toFixed(1);
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

  // 适用场景对比数据
  const scenarioData = {
    'FFT': {
      pros: ['性能最优', '完全控制', '适合所有任务'],
      cons: ['资源消耗极高', '训练时间长', '需要大量数据'],
      scenarios: ['资源充足', '追求极致性能', '大规模部署'],
    },
    'LoRA': {
      pros: ['参数量减少99%+', '性能接近FFT', '训练速度快'],
      cons: ['需要选择合适rank', '可能影响某些任务'],
      scenarios: ['资源有限', '多任务适配', '快速迭代'],
    },
    'QLoRA': {
      pros: ['内存占用极低', '4位量化', '适合单卡训练'],
      cons: ['性能略低于LoRA', '需要量化库支持'],
      scenarios: ['单GPU训练', '内存受限', '成本敏感'],
    },
    'Prompt Tuning': {
      pros: ['参数量极少', '训练快速', '易于部署'],
      cons: ['依赖模型规模', '表达能力有限'],
      scenarios: ['超大模型', '快速原型', '轻量级应用'],
    },
    'Prefix Tuning': {
      pros: ['表达能力更强', '参数量适中', '性能较好'],
      cons: ['需要调整前缀长度', '训练稍慢'],
      scenarios: ['需要更强表达', '中等资源', '复杂任务'],
    },
    'Adapter': {
      pros: ['灵活插入', '参数量中等', '易于扩展'],
      cons: ['增加推理延迟', '需要适配架构'],
      scenarios: ['模块化设计', '多任务学习', '可扩展系统'],
    },
    'IA3': {
      pros: ['参数量极少', '训练快速', '简单高效'],
      cons: ['表达能力有限', '适用场景较窄'],
      scenarios: ['超轻量级', '快速实验', '资源极度受限'],
    },
  };

  // 如果不在客户端，返回占位符
  if (!isClient) {
    return (
      <div className={styles.container}>
        <div className={styles.placeholder}>图表加载中...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* 图表类型切换按钮 */}
      <div className={styles.chartTypeSelector}>
        <button
          className={clsx(styles.chartTypeBtn, chartType === 'bar' && styles.active)}
          onClick={() => setChartType('bar')}
        >
          参数量对比
        </button>
        <button
          className={clsx(styles.chartTypeBtn, chartType === 'radar' && styles.active)}
          onClick={() => setChartType('radar')}
        >
          资源消耗
        </button>
        <button
          className={clsx(styles.chartTypeBtn, chartType === 'performance' && styles.active)}
          onClick={() => setChartType('performance')}
        >
          性能对比
        </button>
        <button
          className={clsx(styles.chartTypeBtn, chartType === 'table' && styles.active)}
          onClick={() => setChartType('table')}
        >
          适用场景
        </button>
      </div>

      {/* 参数量对比柱状图 */}
      {chartType === 'bar' && (
        <div className={styles.chartSection}>
          <h4 className={styles.chartTitle}>可训练参数量占比对比</h4>
          <div className={styles.chartWrapper}>
            <Bar data={paramsData} options={barOptions} />
          </div>
          <p className={styles.chartNote}>
            注：参数量占比相对于全参数微调（FFT）的比例。值越小表示需要训练的参数越少。
          </p>
        </div>
      )}

      {/* 资源消耗雷达图 */}
      {chartType === 'radar' && (
        <div className={styles.chartSection}>
          <h4 className={styles.chartTitle}>资源消耗对比雷达图</h4>
          <div className={styles.chartWrapper}>
            <Radar data={resourceData} options={radarOptions} />
          </div>
          <p className={styles.chartNote}>
            注：对比FFT、LoRA、QLoRA和Prompt Tuning四种方法在计算资源、存储开销、训练速度和内存占用四个维度的表现。
          </p>
        </div>
      )}

      {/* 性能对比柱状图 */}
      {chartType === 'performance' && (
        <div className={styles.chartSection}>
          <h4 className={styles.chartTitle}>性能表现对比</h4>
          <div className={styles.chartWrapper}>
            <Bar data={performanceData} options={barOptions} />
          </div>
          <p className={styles.chartNote}>
            注：性能表现基于典型任务的平均得分，FFT作为100%基准。
          </p>
        </div>
      )}

      {/* 适用场景对比表格 */}
      {chartType === 'table' && (
        <div className={styles.tableSection}>
          <h4 className={styles.chartTitle}>适用场景对比</h4>
          <div className={styles.tableWrapper}>
            <table className={styles.comparisonTable}>
              <thead>
                <tr>
                  <th>方法</th>
                  <th>优点</th>
                  <th>缺点</th>
                  <th>适用场景</th>
                </tr>
              </thead>
              <tbody>
                {methods.map((method) => {
                  const data = scenarioData[method];
                  if (!data) return null;
                  return (
                    <tr key={method}>
                      <td className={styles.methodName}>{method}</td>
                      <td>
                        <ul className={styles.prosList}>
                          {data.pros.map((pro, i) => (
                            <li key={i}>{pro}</li>
                          ))}
                        </ul>
                      </td>
                      <td>
                        <ul className={styles.consList}>
                          {data.cons.map((con, i) => (
                            <li key={i}>{con}</li>
                          ))}
                        </ul>
                      </td>
                      <td>
                        <ul className={styles.scenariosList}>
                          {data.scenarios.map((scenario, i) => (
                            <li key={i}>{scenario}</li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

