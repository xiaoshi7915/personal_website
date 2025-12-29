import React, { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import styles from './InteractiveArchitecture.module.css';

/**
 * InteractiveArchitecture组件 - 交互式架构图
 * 支持可点击节点、缩放拖拽和详细信息显示
 * 
 * @param {string} type - 架构图类型 ('mcp-layers', 'tool-flow', 'transport-comparison')
 * @param {string} title - 架构图标题
 * @param {string} description - 架构图描述
 */
export default function InteractiveArchitecture({ type = 'mcp-layers', title, description }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const svgRef = useRef(null);

  // MCP三层架构数据
  const mcpLayersData = {
    layers: [
      {
        id: 'host',
        name: 'MCP Host',
        description: 'AI模型运行的宿主环境',
        features: ['启动和管理AI模型', '建立与MCP服务器的连接', '协调客户端和服务器交互'],
        color: '#3b82f6',
        icon: '🖥️',
        position: { x: 50, y: 20 },
      },
      {
        id: 'client',
        name: 'MCP Client',
        description: '位于AI模型与MCP服务器之间的关键代理层',
        features: ['处理所有通信细节', '消息路由和会话管理', '安全和权限控制'],
        color: '#10b981',
        icon: '🔗',
        position: { x: 50, y: 50 },
      },
      {
        id: 'server',
        name: 'MCP Server',
        description: '提供具体功能或数据接口的组件',
        features: ['暴露工具、资源和提示', '封装外部系统能力', '处理客户端调用请求'],
        color: '#8b5cf6',
        icon: '⚙️',
        position: { x: 50, y: 80 },
      },
    ],
    connections: [
      { from: 'host', to: 'client' },
      { from: 'client', to: 'server' },
    ],
  };

  // 工具调用流程数据
  const toolFlowData = {
    steps: [
      {
        id: 'request',
        name: '客户端发起请求',
        description: 'AI模型判断需要调用外部工具',
        position: { x: 10, y: 50 },
      },
      {
        id: 'build',
        name: '构建JSON-RPC请求',
        description: '客户端将工具调用转换为JSON-RPC 2.0格式',
        position: { x: 30, y: 50 },
      },
      {
        id: 'receive',
        name: '服务器接收',
        description: 'MCP服务器接收并解析请求',
        position: { x: 50, y: 50 },
      },
      {
        id: 'execute',
        name: '执行工具',
        description: '服务器执行对应的工具函数',
        position: { x: 70, y: 50 },
      },
      {
        id: 'return',
        name: '返回结果',
        description: '服务器将执行结果返回给客户端',
        position: { x: 90, y: 50 },
      },
    ],
  };

  // A2A协议整体架构数据
  const a2aArchitectureData = {
    components: [
      {
        id: 'agent-card',
        name: 'Agent Card',
        description: '智能体的"数字名片"或"能力说明书"',
        features: ['身份描述', '服务端点', '能力声明', '技能列表', '认证要求'],
        color: '#3b82f6',
        icon: '🆔',
        position: { x: 20, y: 20 },
      },
      {
        id: 'task',
        name: 'Task',
        description: '管理复杂、长周期协作的核心抽象',
        features: ['任务生命周期管理', '状态跟踪', '异步处理', '结果交付'],
        color: '#10b981',
        icon: '📋',
        position: { x: 80, y: 20 },
      },
      {
        id: 'message',
        name: 'Message',
        description: '智能体之间信息交换的基本单元',
        features: ['多模态内容支持', '文本、文件、结构化数据', 'UI元素交换'],
        color: '#8b5cf6',
        icon: '💬',
        position: { x: 20, y: 80 },
      },
      {
        id: 'artifact',
        name: 'Artifact',
        description: '交付任务最终成果的核心组件',
        features: ['标准化结果格式', '可扩展结构', '多模态输出'],
        color: '#f59e0b',
        icon: '💎',
        position: { x: 80, y: 80 },
      },
    ],
    connections: [
      { from: 'agent-card', to: 'task' },
      { from: 'task', to: 'message' },
      { from: 'message', to: 'artifact' },
      { from: 'agent-card', to: 'message' },
    ],
  };

  // A2A通信流程数据
  const a2aCommunicationFlowData = {
    flows: [
      {
        id: 'sync',
        name: '同步请求/响应',
        description: 'HTTP POST + JSON-RPC，适用于简单查询、快速任务',
        steps: [
          { id: 'request', name: '发送请求', position: { x: 20, y: 30 } },
          { id: 'process', name: '处理请求', position: { x: 50, y: 30 } },
          { id: 'response', name: '返回响应', position: { x: 80, y: 30 } },
        ],
        color: '#3b82f6',
      },
      {
        id: 'stream',
        name: '流式传输',
        description: 'Server-Sent Events (SSE)，适用于实时更新、增量结果',
        steps: [
          { id: 'connect', name: '建立连接', position: { x: 20, y: 50 } },
          { id: 'stream', name: '流式推送', position: { x: 50, y: 50 } },
          { id: 'complete', name: '完成传输', position: { x: 80, y: 50 } },
        ],
        color: '#10b981',
      },
      {
        id: 'async',
        name: '异步推送通知',
        description: 'Webhook回调，适用于长期任务、异步处理',
        steps: [
          { id: 'submit', name: '提交任务', position: { x: 20, y: 70 } },
          { id: 'process', name: '后台处理', position: { x: 50, y: 70 } },
          { id: 'callback', name: '回调通知', position: { x: 80, y: 70 } },
        ],
        color: '#f59e0b',
      },
    ],
  };

  // A2A任务生命周期数据
  const a2aTaskLifecycleData = {
    states: [
      {
        id: 'submitted',
        name: 'Submitted',
        description: '任务已提交，等待处理',
        color: '#64748b',
        position: { x: 10, y: 50 },
      },
      {
        id: 'working',
        name: 'Working',
        description: '任务正在执行中',
        color: '#3b82f6',
        position: { x: 50, y: 50 },
      },
      {
        id: 'completed',
        name: 'Completed',
        description: '任务成功完成',
        color: '#10b981',
        position: { x: 90, y: 30 },
      },
      {
        id: 'failed',
        name: 'Failed',
        description: '任务执行失败',
        color: '#ef4444',
        position: { x: 90, y: 70 },
      },
    ],
    transitions: [
      { from: 'submitted', to: 'working' },
      { from: 'working', to: 'completed' },
      { from: 'working', to: 'failed' },
    ],
  };

  // 根据类型获取数据
  const getArchitectureData = () => {
    switch (type) {
      case 'mcp-layers':
        return mcpLayersData;
      case 'tool-flow':
        return toolFlowData;
      case 'a2a-architecture':
        return a2aArchitectureData;
      case 'a2a-communication-flow':
        return a2aCommunicationFlowData;
      case 'a2a-task-lifecycle':
        return a2aTaskLifecycleData;
      default:
        return mcpLayersData;
    }
  };

  const data = getArchitectureData();

  // 缩放控制
  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev * 1.25, 3));
  };

  const handleZoomOut = () => {
    setScale((prev) => {
      const newScale = Math.max(prev / 1.25, 0.5);
      if (newScale <= 1) {
        setTranslateX(0);
        setTranslateY(0);
      }
      return newScale;
    });
  };

  const handleReset = () => {
    setScale(1);
    setTranslateX(0);
    setTranslateY(0);
  };

  // 拖拽处理
  const handleMouseDown = (e) => {
    if (e.target.closest('.architecture-node')) return; // 如果点击的是节点，不启动拖拽
    setIsDragging(true);
    setDragStart({
      x: e.clientX - translateX,
      y: e.clientY - translateY,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        setTranslateX(e.clientX - dragStart.x);
        setTranslateY(e.clientY - dragStart.y);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  // 节点点击处理
  const handleNodeClick = (node) => {
    setSelectedNode(node);
  };

  // 关闭详情模态框
  const handleCloseModal = () => {
    setSelectedNode(null);
  };

  // 渲染MCP三层架构
  const renderMCPLayers = () => {
    const { layers, connections } = data;
    const viewBox = '0 0 100 100';

    return (
      <svg
        ref={svgRef}
        viewBox={viewBox}
        className={styles.architectureSvg}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* 连接线 */}
        {connections.map((conn, index) => {
          const fromLayer = layers.find((l) => l.id === conn.from);
          const toLayer = layers.find((l) => l.id === conn.to);
          if (!fromLayer || !toLayer) return null;

          return (
            <line
              key={index}
              x1={fromLayer.position.x}
              y1={fromLayer.position.y + 5}
              x2={toLayer.position.x}
              y2={toLayer.position.y - 5}
              stroke={fromLayer.color}
              strokeWidth="0.5"
              strokeDasharray="2,2"
              opacity="0.5"
            />
          );
        })}

        {/* 节点 */}
        {layers.map((layer) => (
          <g
            key={layer.id}
            className={clsx('architecture-node', styles.architectureNode)}
            transform={`translate(${layer.position.x}, ${layer.position.y})`}
            onClick={() => handleNodeClick(layer)}
          >
            {/* 节点背景 */}
            <rect
              x="-15"
              y="-8"
              width="30"
              height="16"
              rx="4"
              fill={layer.color}
              opacity="0.1"
              stroke={layer.color}
              strokeWidth="0.5"
            />
            {/* 节点图标 */}
            <text
              x="0"
              y="2"
              textAnchor="middle"
              fontSize="6"
              fill={layer.color}
            >
              {layer.icon}
            </text>
            {/* 节点名称 */}
            <text
              x="0"
              y="12"
              textAnchor="middle"
              fontSize="3"
              fill={layer.color}
              fontWeight="600"
            >
              {layer.name}
            </text>
          </g>
        ))}
      </svg>
    );
  };

  // 渲染工具调用流程
  const renderToolFlow = () => {
    const { steps } = data;
    const viewBox = '0 0 100 100';

    return (
      <svg
        ref={svgRef}
        viewBox={viewBox}
        className={styles.architectureSvg}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* 流程箭头 */}
        {steps.slice(0, -1).map((step, index) => {
          const nextStep = steps[index + 1];
          return (
            <line
              key={index}
              x1={step.position.x + 5}
              y1={step.position.y}
              x2={nextStep.position.x - 5}
              y2={nextStep.position.y}
              stroke="#64748b"
              strokeWidth="0.5"
              markerEnd="url(#arrowhead)"
            />
          );
        })}

        {/* 箭头标记定义 */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="4"
            markerHeight="4"
            refX="3"
            refY="2"
            orient="auto"
          >
            <polygon points="0 0, 4 2, 0 4" fill="#64748b" />
          </marker>
        </defs>

        {/* 步骤节点 */}
        {steps.map((step) => (
          <g
            key={step.id}
            className={clsx('architecture-node', styles.architectureNode)}
            transform={`translate(${step.position.x}, ${step.position.y})`}
            onClick={() => handleNodeClick(step)}
          >
            <circle r="4" fill="#3b82f6" opacity="0.2" stroke="#3b82f6" strokeWidth="0.5" />
            <text
              x="0"
              y="2"
              textAnchor="middle"
              fontSize="2.5"
              fill="#3b82f6"
              fontWeight="600"
            >
              {step.name.substring(0, 4)}
            </text>
          </g>
        ))}
      </svg>
    );
  };

  // 渲染A2A整体架构
  const renderA2AArchitecture = () => {
    const { components, connections } = data;
    const viewBox = '0 0 100 100';

    return (
      <svg
        ref={svgRef}
        viewBox={viewBox}
        className={styles.architectureSvg}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* 连接线 */}
        {connections.map((conn, index) => {
          const fromComp = components.find((c) => c.id === conn.from);
          const toComp = components.find((c) => c.id === conn.to);
          if (!fromComp || !toComp) return null;

          return (
            <line
              key={index}
              x1={fromComp.position.x}
              y1={fromComp.position.y + 3}
              x2={toComp.position.x}
              y2={toComp.position.y - 3}
              stroke={fromComp.color}
              strokeWidth="0.5"
              strokeDasharray="2,2"
              opacity="0.5"
              markerEnd="url(#arrowhead-a2a)"
            />
          );
        })}

        {/* 箭头标记定义 */}
        <defs>
          <marker
            id="arrowhead-a2a"
            markerWidth="4"
            markerHeight="4"
            refX="3"
            refY="2"
            orient="auto"
          >
            <polygon points="0 0, 4 2, 0 4" fill="#64748b" />
          </marker>
        </defs>

        {/* 组件节点 */}
        {components.map((component) => (
          <g
            key={component.id}
            className={clsx('architecture-node', styles.architectureNode)}
            transform={`translate(${component.position.x}, ${component.position.y})`}
            onClick={() => handleNodeClick(component)}
          >
            {/* 节点背景 */}
            <rect
              x="-12"
              y="-8"
              width="24"
              height="16"
              rx="4"
              fill={component.color}
              opacity="0.1"
              stroke={component.color}
              strokeWidth="0.5"
            />
            {/* 节点图标 */}
            <text
              x="0"
              y="2"
              textAnchor="middle"
              fontSize="6"
              fill={component.color}
            >
              {component.icon}
            </text>
            {/* 节点名称 */}
            <text
              x="0"
              y="12"
              textAnchor="middle"
              fontSize="3"
              fill={component.color}
              fontWeight="600"
            >
              {component.name}
            </text>
          </g>
        ))}
      </svg>
    );
  };

  // 渲染A2A通信流程
  const renderA2ACommunicationFlow = () => {
    const { flows } = data;
    const viewBox = '0 0 100 100';

    return (
      <svg
        ref={svgRef}
        viewBox={viewBox}
        className={styles.architectureSvg}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* 箭头标记定义 */}
        <defs>
          <marker
            id="arrowhead-comm"
            markerWidth="4"
            markerHeight="4"
            refX="3"
            refY="2"
            orient="auto"
          >
            <polygon points="0 0, 4 2, 0 4" fill="#64748b" />
          </marker>
        </defs>

        {flows.map((flow) => (
          <g key={flow.id}>
            {/* 流程箭头 */}
            {flow.steps.slice(0, -1).map((step, index) => {
              const nextStep = flow.steps[index + 1];
              return (
                <line
                  key={index}
                  x1={step.position.x + 5}
                  y1={step.position.y}
                  x2={nextStep.position.x - 5}
                  y2={nextStep.position.y}
                  stroke={flow.color}
                  strokeWidth="0.5"
                  markerEnd="url(#arrowhead-comm)"
                />
              );
            })}

            {/* 流程步骤节点 */}
            {flow.steps.map((step) => (
              <g
                key={step.id}
                className={clsx('architecture-node', styles.architectureNode)}
                transform={`translate(${step.position.x}, ${step.position.y})`}
                onClick={() => handleNodeClick({ ...step, flowName: flow.name })}
              >
                <circle
                  r="3"
                  fill={flow.color}
                  opacity="0.2"
                  stroke={flow.color}
                  strokeWidth="0.5"
                />
                <text
                  x="0"
                  y="1.5"
                  textAnchor="middle"
                  fontSize="2"
                  fill={flow.color}
                  fontWeight="600"
                >
                  {step.name.substring(0, 3)}
                </text>
              </g>
            ))}
          </g>
        ))}
      </svg>
    );
  };

  // 渲染A2A任务生命周期
  const renderA2ATaskLifecycle = () => {
    const { states, transitions } = data;
    const viewBox = '0 0 100 100';

    return (
      <svg
        ref={svgRef}
        viewBox={viewBox}
        className={styles.architectureSvg}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* 箭头标记定义 */}
        <defs>
          <marker
            id="arrowhead-lifecycle"
            markerWidth="4"
            markerHeight="4"
            refX="3"
            refY="2"
            orient="auto"
          >
            <polygon points="0 0, 4 2, 0 4" fill="#64748b" />
          </marker>
        </defs>

        {/* 状态转换线 */}
        {transitions.map((trans, index) => {
          const fromState = states.find((s) => s.id === trans.from);
          const toState = states.find((s) => s.id === trans.to);
          if (!fromState || !toState) return null;

          return (
            <line
              key={index}
              x1={fromState.position.x + 3}
              y1={fromState.position.y}
              x2={toState.position.x - 3}
              y2={toState.position.y}
              stroke={fromState.color}
              strokeWidth="0.5"
              markerEnd="url(#arrowhead-lifecycle)"
            />
          );
        })}

        {/* 状态节点 */}
        {states.map((state) => (
          <g
            key={state.id}
            className={clsx('architecture-node', styles.architectureNode)}
            transform={`translate(${state.position.x}, ${state.position.y})`}
            onClick={() => handleNodeClick(state)}
          >
            <circle
              r="5"
              fill={state.color}
              opacity="0.2"
              stroke={state.color}
              strokeWidth="1"
            />
            <text
              x="0"
              y="2"
              textAnchor="middle"
              fontSize="2.5"
              fill={state.color}
              fontWeight="600"
            >
              {state.name}
            </text>
          </g>
        ))}
      </svg>
    );
  };

  // 根据类型渲染不同的架构图
  const renderArchitecture = () => {
    switch (type) {
      case 'mcp-layers':
        return renderMCPLayers();
      case 'tool-flow':
        return renderToolFlow();
      case 'a2a-architecture':
        return renderA2AArchitecture();
      case 'a2a-communication-flow':
        return renderA2ACommunicationFlow();
      case 'a2a-task-lifecycle':
        return renderA2ATaskLifecycle();
      default:
        return renderMCPLayers();
    }
  };

  return (
    <div className={styles.architectureContainer}>
      {(title || description) && (
        <div className={styles.architectureHeader}>
          {title && <h3 className={styles.architectureTitle}>{title}</h3>}
          {description && <p className={styles.architectureDescription}>{description}</p>}
        </div>
      )}

      <div
        ref={containerRef}
        className={styles.architectureWrapper}
        onMouseDown={handleMouseDown}
        style={{
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
      >
        <div
          className={styles.architectureContent}
          style={{
            transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
            transformOrigin: 'center center',
          }}
        >
          {renderArchitecture()}
        </div>

        {/* 控制按钮 */}
        <div className={styles.controls}>
          <button
            className={styles.controlButton}
            onClick={handleZoomIn}
            title="放大"
            aria-label="放大"
          >
            +
          </button>
          <button
            className={styles.controlButton}
            onClick={handleZoomOut}
            title="缩小"
            aria-label="缩小"
          >
            −
          </button>
          <button
            className={styles.controlButton}
            onClick={handleReset}
            title="重置"
            aria-label="重置"
          >
            ↻
          </button>
        </div>
      </div>

      {/* 节点详情模态框 */}
      {selectedNode && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button
              className={styles.modalClose}
              onClick={handleCloseModal}
              aria-label="关闭"
            >
              ×
            </button>
            <h3 className={styles.modalTitle}>{selectedNode.name}</h3>
            <p className={styles.modalDescription}>{selectedNode.description}</p>
            {selectedNode.features && (
              <ul className={styles.modalFeatures}>
                {selectedNode.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

