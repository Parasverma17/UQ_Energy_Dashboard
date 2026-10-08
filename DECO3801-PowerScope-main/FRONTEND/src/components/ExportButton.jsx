import React, { useState } from 'react';

export default function ExportButton({ type = "chart", chartId = null, chartTitle = "Chart" }) {
  const [isExporting, setIsExporting] = useState(false);

  // Try to export using ECharts built-in functionality first
  const exportAsImage = async (format = 'png') => {
    try {
      setIsExporting(true);
      
      // Try to find ECharts instance through the React component
      let chartInstance = null;
      
      if (chartId) {
        // First try to get from stored global instances
        switch(chartId) {
          case 'sankey-diagram':
            chartInstance = window.sankeyChartInstance;
            break;
          case 'monthly-chart':
            chartInstance = window.monthlyChartInstance;
            break;
          case 'forecast-chart':
            chartInstance = window.forecastChartInstance;
            break;
          case 'breakdown-chart':
            chartInstance = window.breakdownChartInstance;
            break;
        }
        
        // If not found in global instances, try to get from DOM
        if (!chartInstance) {
          const chartElement = document.getElementById(chartId);
          if (chartElement) {
            // Look for the ReactECharts component
            const echartsContainer = chartElement.querySelector('.echarts-for-react');
            if (echartsContainer && window.echarts) {
              // Get the ECharts instance from the DOM element
              chartInstance = window.echarts.getInstanceByDom(echartsContainer);
            }
          }
        }
      }
      
      // If we have ECharts instance, use its built-in export
      if (chartInstance) {
        const dataURL = chartInstance.getDataURL({
          type: format,
          pixelRatio: 2,
          backgroundColor: '#fff'
        });
        
        // Download the image
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = `${chartTitle.replace(/\s+/g, '-')}_${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        return;
      }
      
      // Fallback: Try to use canvas toDataURL if available
      const canvas = document.querySelector(`#${chartId} canvas`) || 
                   document.querySelector('.echarts-for-react canvas') ||
                   document.querySelector('canvas');
      
      if (canvas) {
        const dataURL = canvas.toDataURL(`image/${format}`, 0.9);
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = `${chartTitle.replace(/\s+/g, '-')}_${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }
      
      // If no canvas found, show message and export data instead
      alert('Chart image export requires the chart to be fully loaded. Exporting data instead.');
      exportChartData();
      
    } catch (error) {
      console.error('Export failed:', error);
      alert('Image export failed. Using data export instead.');
      exportChartData();
    } finally {
      setIsExporting(false);
    }
  };

  const exportChartData = () => {
    const chartData = {
      title: chartTitle,
      chartId: chartId,
      exported: new Date().toLocaleString(),
      note: "Chart data export - for image export, additional packages are required",
      instructions: "To enable JPG/PDF export, install: npm install html2canvas jspdf"
    };
    
    const fileName = `${chartTitle.replace(/\s+/g, '-')}_${new Date().toISOString().split('T')[0]}.json`;
    const blob = new Blob([JSON.stringify(chartData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportImage = () => {
    exportAsImage('png');
  };

  const handleExportData = () => {
    exportChartData();
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handleExportImage}
        disabled={isExporting}
        className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label={`Export ${chartTitle} as Image`}
        title="Export as PNG Image"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        {isExporting ? 'Exporting...' : 'PNG'}
      </button>
      
      <button
        onClick={handleExportData}
        disabled={isExporting}
        className="inline-flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label={`Export ${chartTitle} data`}
        title="Export chart data as JSON"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        {isExporting ? 'Exporting...' : 'Data'}
      </button>
    </div>
  );
}