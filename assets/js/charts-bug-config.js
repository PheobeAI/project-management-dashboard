/**
 * Bug 统计图表配置
 * 项目：project-management-dashboard
 * 版本：v1.0
 * 更新：2026-03-21
 */

// Bug 状态颜色
const BUG_STATUS_COLORS = {
  fixed: '#10B981',      // 已修复 - 绿
  inProgress: '#F59E0B', // 进行中 - 黄
  open: '#EF4444'        // 未修复 - 红
};

// Bug 优先级颜色
const BUG_PRIORITY_COLORS = {
  high: '#EF4444',   // High - 红
  medium: '#F59E0B', // Medium - 黄
  low: '#3B82F6'     // Low - 蓝
};

/**
 * 生成 Bug 环形图配置
 * @param {object} stats - { fixed: number, inProgress: number, open: number }
 * @returns {object} Chart.js 配置对象
 */
function getBugDonutChartConfig(stats) {
  return {
    type: 'doughnut',
    data: {
      labels: ['已修复', '进行中', '未修复'],
      datasets: [{
        data: [stats.fixed, stats.inProgress, stats.open],
        backgroundColor: [
          BUG_STATUS_COLORS.fixed,
          BUG_STATUS_COLORS.inProgress,
          BUG_STATUS_COLORS.open
        ],
        borderWidth: 0,
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      animation: {
        animateRotate: true,
        animateScale: true,
        duration: 800,
        easing: 'easeOutQuart'
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
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((context.raw / total) * 100).toFixed(1);
              return `${context.raw} 个 (${percentage}%)`;
            }
          }
        }
      }
    }
  };
}

/**
 * 生成 Bug 趋势图配置（折线图）
 * @param {object[]} trendData - [{ date: string, count: number }]
 * @returns {object} Chart.js 配置对象
 */
function getBugTrendChartConfig(trendData) {
  return {
    type: 'line',
    data: {
      labels: trendData.map(d => d.date),
      datasets: [{
        label: 'Bug 数',
        data: trendData.map(d => d.count),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#3B82F6',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 1000,
        easing: 'easeOutQuart'
      },
      interaction: {
        intersect: false,
        mode: 'index'
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
          displayColors: false,
          callbacks: {
            title: (context) => context[0].label,
            label: (context) => `${context.raw} 个 Bug`
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
 * 生成 Bug 优先级柱状图配置
 * @param {object} stats - { high: number, medium: number, low: number }
 * @returns {object} Chart.js 配置对象
 */
function getBugPriorityChartConfig(stats) {
  return {
    type: 'bar',
    data: {
      labels: ['High', 'Medium', 'Low'],
      datasets: [{
        label: 'Bug 数',
        data: [stats.high, stats.medium, stats.low],
        backgroundColor: [
          BUG_PRIORITY_COLORS.high,
          BUG_PRIORITY_COLORS.medium,
          BUG_PRIORITY_COLORS.low
        ],
        borderRadius: 4,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      animation: {
        duration: 600,
        easing: 'easeOutQuart',
        delay: (context) => context.dataIndex * 100
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
            label: (context) => `${context.raw} 个`
          }
        }
      },
      scales: {
        x: {
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
        },
        y: {
          grid: {
            display: false
          },
          ticks: {
            font: {
              family: 'Inter, sans-serif',
              size: 12,
              weight: '500'
            },
            color: '#64748B'
          }
        }
      }
    }
  };
};

// 导出配置生成器
window.ChartConfigs = {
  ...window.ChartConfigs,
  getBugDonutChartConfig,
  getBugTrendChartConfig,
  getBugPriorityChartConfig,
  BUG_STATUS_COLORS,
  BUG_PRIORITY_COLORS
};
