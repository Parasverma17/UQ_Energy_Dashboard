import React from "react";
import ReactECharts from "echarts-for-react";
import ExportButton from "./ExportButton";

export default function MonthlyChart({ data, selectedMonth, setSelectedMonth }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  const option = {
    title: {
      text: 'Monthly Energy Usage Comparison',
      left: 'center',
      textStyle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#7C3AED'
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        crossStyle: {
          color: '#999'
        }
      },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#E5E7EB',
      textStyle: {
        color: '#374151'
      }
    },
    legend: {
      data: ['2024', '2025'],
      top: 40,
      textStyle: {
        color: '#6B7280'
      }
    },
    xAxis: {
      type: 'category',
      data: data.map(row => row.month),
      axisPointer: {
        type: 'shadow'
      },
      axisLabel: {
        color: '#6B7280'
      }
    },
    yAxis: {
      type: 'value',
      name: 'Energy Usage (kWh)',
      nameTextStyle: {
        color: '#6B7280'
      },
      axisLabel: {
        color: '#6B7280',
        formatter: (value) => {
          if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
          if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
          return value;
        }
      }
    },
    series: [
      {
        name: '2024',
        type: 'bar',
        data: data.map(row => row.y2024),
        itemStyle: {
          color: '#8B5CF6',
          borderRadius: [4, 4, 0, 0]
        },
        emphasis: {
          itemStyle: {
            color: '#7C3AED'
          }
        }
      },
      {
        name: '2025',
        type: 'bar',
        data: data.map(row => row.y2025),
        itemStyle: {
          color: '#EAB308',
          borderRadius: [4, 4, 0, 0]
        },
        emphasis: {
          itemStyle: {
            color: '#CA8A04'
          }
        }
      }
    ],
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    }
  };

  const onEvents = {
    click: (params) => {
      const monthData = data[params.dataIndex];
      setSelectedMonth(monthData.month, monthData.y2024, monthData.y2025);
    }
  };

  return (
    <div id="monthly-chart" className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 monthly-chart">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-800">Monthly Energy Usage</h2>
        <ExportButton type="chart" chartId="monthly-chart" chartTitle="Monthly Energy Usage Comparison" />
      </div>
      <ReactECharts 
        option={option} 
        style={{ height: 400, width: '100%' }} 
        onEvents={onEvents}
        onChartReady={(chartInstance) => {
          // Store chart instance for export functionality
          if (window.monthlyChartInstance) {
            window.monthlyChartInstance.dispose();
          }
          window.monthlyChartInstance = chartInstance;
        }}
      />
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
          Selected: <span className="font-semibold text-purple-800">{selectedMonth}</span>
        </p>
      </div>
    </div>
  );
}