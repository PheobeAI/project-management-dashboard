/**
 * Phase Distribution Chart 配置
 * 项目：project-management-dashboard
 *
 * Uses shared constants from constants.js: window.PHASE_COLORS, PHASE_SHORT_NAMES
 */

/**
 * 生成 Phase 柱状图配�? * @param {number[]} data - 每个 Phase 的项目数�? * @returns {object} Chart.js 配置对象
 */
function getPhaseBarChartConfig(data) {
  return {
    type: 'bar',
    data: {
      labels: Object.values(window.PHASE_DISPLAY_NAMES),
      datasets: [{
        label: '项目�?,
        data: data,
        backgroundColor: Object.values(window.PHASE_COLORS),
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
 * @param {number[]} data - 每个 Phase 的项目数�? * @returns {object} Chart.js 配置对象
 */
function getPhasePieChartConfig(data) {
  return {
    type: 'doughnut',
    data: {
      labels: Object.values(window.PHASE_DISPLAY_NAMES),
      datasets: [{
        data: data,
        backgroundColor: Object.values(window.PHASE_COLORS),
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
              return `${context.raw} 个项�?(${percentage}%)`;
            }
          }
        }
      }
    }
  };
}

// 导出配置生成�?window.ChartConfigs = {
  getPhaseBarChartConfig,
  getPhasePieChartConfig,
  window.PHASE_COLORS,
  window.PHASE_DISPLAY_NAMES
};
