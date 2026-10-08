import React from 'react';
import ReactECharts from 'echarts-for-react';
import ExportButton from './ExportButton';

const ForecastChart = ({ data, loading, error }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-red-600 font-semibold mb-4">Forecast Error</h3>
        <p className="text-gray-600">Error loading forecast data: {error}</p>
      </div>
    );
  }

  // Process the data to get unique dates and average values
  const processedData = data.reduce((acc, item) => {
    const existingDate = acc.find(d => d.forecast_date === item.forecast_date);
    if (existingDate) {
      existingDate.total_energy += item.forecast_energy;
      existingDate.count += 1;
    } else {
      acc.push({
        forecast_date: item.forecast_date,
        horizon_day: item.horizon_day,
        total_energy: item.forecast_energy,
        count: 1
      });
    }
    return acc;
  }, []);

  // Calculate averages and sort by date
  const chartData = processedData
    .map(item => ({
      ...item,
      avg_energy: item.total_energy / item.count
    }))
    .sort((a, b) => new Date(a.forecast_date) - new Date(b.forecast_date));

  // Prepare chart configuration
  const values = chartData.map(d=> d.avg_energy);
  const vMin = values.length ? Math.min(...values) :0;
  const vMax = values.length ? Math.max(...values): 1;

  const range = Math.max(1, vMax - vMin);
  const pad = Math.max(5000, range * 0.08);
  const niceMin = Math.floor((vMin - pad) / 10000) * 10000;
  const niceMax = Math.floor((vMax + pad + 10000) / 10000) * 10000;
  const option = {
    title: {
      text: '7-Day Energy Forecast',
      left: 'left',
      textStyle: {
        color: '#7C3AED',
        fontSize: 18,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#7C3AED',
      borderWidth: 1,
      textStyle: {
        color: '#374151'
      },
      formatter: function(params) {
        const point = params[0];
        const date = new Date(point.axisValue).toLocaleDateString('en-AU', {
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        });
        const energy = (point.value).toFixed(1);
        return `
          <div style="padding: 8px;">
            <div style="font-weight: bold; margin-bottom: 4px;">${date}</div>
            <div style="color: #7C3AED;">
              <span style="display: inline-block; width: 10px; height: 10px; background: #7C3AED; border-radius: 50%; margin-right: 6px;"></span>
              Energy: ${energy} kWh
            </div>
            <div style="font-size: 12px; color: #6B7280; margin-top: 4px;">
              Day ${chartData.find(d => d.forecast_date === point.axisValue)?.horizon_day || 'N/A'} forecast
            </div>
          </div>
        `;
      }
    },
    legend: {
      data: ['Forecast Energy'],
      top: 30,
      textStyle: {
        color: '#6B7280'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '20%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: chartData.map(item => item.forecast_date),
      axisLabel: {
        formatter: function(value) {
          return new Date(value).toLocaleDateString('en-AU', {
            month: 'short',
            day: 'numeric'
          });
        },
        color: '#6B7280'
      },
      axisLine: {
        lineStyle: {
          color: '#E5E7EB'
        }
      }
    },
    yAxis: {
      type: 'value',
      name: 'Energy (kWh)',
      nameTextStyle: {
        color: '#6B7280'
      },
      min: () => niceMin,
      max: () => niceMax,


      axisLabel: {
        formatter: function(value) {
          return (value / 1000).toFixed(0) + 'K';
        },
        color: '#6B7280'
      },
      axisLine: {
        lineStyle: {
          color: '#E5E7EB'
        }
      },
      splitLine: {
        lineStyle: {
          color: '#F3F4F6'
        }
      }
    },
    series: [
      {
        name: 'Forecast Energy',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        data: chartData.map(item => item.avg_energy),
        lineStyle: {
          color: '#7C3AED',
          width: 3
        },
        itemStyle: {
          color: '#7C3AED',
          borderColor: '#ffffff',
          borderWidth: 2
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(124, 58, 237, 0.3)' },
              { offset: 1, color: 'rgba(124, 58, 237, 0.05)' }
            ]
          }
        }
      }
    ]
  };

  // Calculate summary stats
  const totalForecast = chartData.reduce((sum, item) => sum + item.avg_energy, 0);
  const avgDaily = totalForecast / chartData.length;
  const maxDaily = Math.max(...chartData.map(item => item.avg_energy));
  const minDaily = Math.min(...chartData.map(item => item.avg_energy));

 
  return (
    <div id="forecast-chart" className="bg-white rounded-lg shadow-lg overflow-hidden forecast-chart">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-700 flex justify-between items-center">
        <div>
          <h3 className="text-white font-semibold text-lg">Energy Forecast</h3>
          <p className="text-purple-100 text-sm">7-day predictive analytics</p>
        </div>
        <ExportButton type="chart" chartId="forecast-chart" chartTitle="Energy Forecast" />
      </div>

      {/* Chart */}
      <div className="p-6">
        <ReactECharts 
          option={option} 
          style={{ height: '350px' }}
          opts={{ renderer: 'canvas' }}
          onChartReady={(chartInstance) => {
            // Store chart instance for export functionality
            if (window.forecastChartInstance) {
              window.forecastChartInstance.dispose();
            }
            window.forecastChartInstance = chartInstance;
          }}
        />
      </div>

      {/* Summary Stats */}
      <div className="px-6 py-4 bg-gray-50 border-t">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">Total 7-Day</p>
            <p className="text-lg font-semibold text-purple-700">
              {(totalForecast ).toFixed(1)} kWh
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Daily Average</p>
            <p className="text-lg font-semibold text-blue-600">
              {(avgDaily ).toFixed(1)} kWh
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Peak Day</p>
            <p className="text-lg font-semibold text-orange-600">
              {(maxDaily).toFixed(1)} kWh
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Low Day</p>
            <p className="text-lg font-semibold text-green-600">
              {(minDaily ).toFixed(1)} kWh
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForecastChart;