/**
 * Phase Distribution Chart 配置
 * 项目：project-management-dashboard
 * 版本：v1.0
 * 更新：2026-03-21
 */

// Phase 颜色配置
const PHASE_COLORS = {
  0: '#94A3B8', // 初始化 - 灰
  1: '#3B82F6', // 需求分析 - 蓝
  2: '#8B5CF6', // 设计 - 紫
  3: '#10B981', // 开发 - 绿
  4: '#F59E0B', // 测试 - 黄
  5: '#EC4899', // 部署 - 粉
  6: '#06B6D4', // 维护 - 青
  7: '#64748B', // 完成 - 灰
  8: '#1E40AF'  // 已发布 - 深蓝
};

// Phase 名称配置
const PHASE_NAMES = {
  0: '初始化',
  1: '需求',
  2: '设计',
  3: '开发',
  4: '测试',
  5: '部署',
  6: '维护',
  7: '完成',
  8: '发布'
};

/**
 * 生成 Phase 柱状图配置
 * @param {number[]} data - 每个 Phase 的项目数量
 * @returns {object} Chart.js 配置对象
 */
function getPhaseBarChartConfig(data) {
  return {
    type: 'bar',
    data: {
      labels: Object.values(PHASE_NAMES),
      datasets: [{
        label: '项目数',
        data: data,
        backgroundColor: Object.values(PHASE_COLORS),
        borderRadius: 4,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 600,
        easing: 'easeOutQuart',
        delay: (context) => {
          return context.dataIndex * 100;
        }
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          titleFont: {
            family: 'Inter, sans-serif',
            size: 12
          },
          bodyFont: {
            family: 'Inter, sans-serif',
            size: 14
          },
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: (context) => {
              return `${context.raw} 个项目`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            font: {
              family: 'Inter, sans-serif',
              size: 10
            },
            color: '#64748B'
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: '#E2E8F0',
            drawBorder: false
          },
          ticks: {
            font: {
              family: 'Inter, sans-serif',
              size: 10
            },
            color: '#94A3B8',
            stepSize: 1
          }
        }
      }
    }
  };
}

/**
 * 生成 Phase 饼图配置
 * @param {number[]} data - 每个 Phase 的项目数量
 * @returns {object} Chart.js 配置对象
 */
function getPhasePieChartConfig(data) {
  return {
    type: 'doughnut',
    data: {
      labels: Object.values(PHASE_NAMES),
      datasets: [{
        data: data,
        backgroundColor: Object.values(PHASE_COLORS),
        borderWidth: 0,
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '60%',
      animation: {
        animateRotate: true,
        animateScale: true,
        duration: 800,
        easing: 'easeOutQuart'
      },
      plugins: {
        legend: {
          position: 'right',
          labels: {
            font: {
              family: 'Inter, sans-serif',
              size: 11
            },
            color: '#64748B',
            padding: 12,
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          titleFont: {
            family: 'Inter, sans-serif',
            size: 12
          },
          bodyFont: {
            family: 'Inter, sans-serif',
            size: 14
          },
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: (context) => {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((context.raw / total) * 100).toFixed(1);
              return `${context.raw} 个项目 (${percentage}%)`;
            }
          }
        }
      }
    }
  };
}

// 导出配置生成器
window.ChartConfigs = {
  getPhaseBarChartConfig,
  getPhasePieChartConfig,
  PHASE_COLORS,
  PHASE_NAMES
};
