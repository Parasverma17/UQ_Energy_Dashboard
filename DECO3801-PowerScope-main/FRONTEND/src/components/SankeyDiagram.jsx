import React from "react";
import ReactECharts from "echarts-for-react";

import ExportButton from "./ExportButton";

const SankeyDiagram = ({ data, selectedBuilding, loading, error }) => {
  // Debug logging
  console.log("SankeyDiagram received data:", data);
  console.log("Selected building:", selectedBuilding);
  console.log("Data type:", typeof data);
  console.log("Is array:", Array.isArray(data));

  // More comprehensive data validation
  if (data === undefined || data === null) {
    console.log("Data is undefined or null");
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200" style={{ height: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="text-center">
          <div className="animate-pulse">
            <div className="h-4 bg-purple-200 rounded w-48 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-32"></div>
          </div>
          <p className="text-purple-600 mt-2">Loading Sankey diagram...</p>
        </div>
      </div>
    );
  }

  if (!Array.isArray(data)) {
    console.log("Data is not an array:", data);
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg border border-red-200" style={{ height: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="text-center">
          <p className="text-red-600">Invalid data format for Sankey diagram</p>
          {selectedBuilding && <p className="text-sm text-gray-500 mt-1">Building: {selectedBuilding}</p>}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    console.log("Data array is empty");
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200" style={{ height: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="text-center">
          <p className="text-gray-600">No energy flow data available</p>
          {selectedBuilding ? (
            <p className="text-sm text-gray-500 mt-1">Building: {selectedBuilding}</p>
          ) : (
            <p className="text-sm text-gray-500 mt-1">Select a building to view energy flow</p>
          )}
        </div>
      </div>
    );
  }

  // Validate data structure and filter out zero values
  const validData = data.filter(item => {
    if (!item || typeof item !== 'object') {
      console.log("Invalid item:", item);
      return false;
    }
    if (!item.source || !item.end_point || typeof item.kwh !== 'number') {
      console.log("Invalid item structure:", item);
      return false;
    }
    return item.kwh > 0; // Filter out zero values
  });

  if (validData.length === 0) {
    console.log("No valid data items found");
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200" style={{ height: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="text-center">
          <p className="text-gray-600">No valid energy flow data</p>
          {selectedBuilding && <p className="text-sm text-gray-500 mt-1">Building: {selectedBuilding}</p>}
        </div>
      </div>
    );
  }

  console.log("Filtered data:", validData);

  // Extract unique nodes from links with error handling
  let nodes;
  try {
    const nodeNames = new Set();
    validData.forEach(item => {
      nodeNames.add(item.source);
      nodeNames.add(item.end_point);
    });
    nodes = Array.from(nodeNames).map(name => ({ name }));
    console.log("Generated nodes:", nodes);
  } catch (error) {
    console.error("Error generating nodes:", error);
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg border border-red-200" style={{ height: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p className="text-red-600">Error processing Sankey data</p>
      </div>
    );
  }

  // Generate links with error handling
  let links;
  try {
    links = validData.map(item => ({
      source: item.source,
      target: item.end_point,
      value: item.kwh,
    }));
    console.log("Generated links:", links);
  } catch (error) {
    console.error("Error generating links:", error);
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg border border-red-200" style={{ height: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p className="text-red-600">Error processing Sankey links</p>
      </div>
    );
  }

  // ECharts Sankey diagram options
  const option = {
    title: {
      text: selectedBuilding ? `Building ${selectedBuilding} - Energy Flow` : "Building Energy Flow Sankey",
      left: "center",
      textStyle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#7C3AED"
      },
    },
    tooltip: {
      trigger: "item",
      triggerOn: "mousemove",
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#E5E7EB',
      textStyle: {
        color: '#374151'
      },
      formatter: (params) => {
        if (params.dataType === "edge") {
          const value = params.data.value.toLocaleString();
          return `<div style="padding: 8px;">
                    <strong>${params.data.source}</strong><br/>
                    ↓<br/>
                    <strong>${params.data.target}</strong><br/>
                    <span style="color: #7C3AED; font-weight: bold;">${value} kWh</span>
                  </div>`;
        }
        return `<div style="padding: 8px;"><strong>${params.name}</strong></div>`;
      },
    },
    series: [
      {
        type: "sankey",
        layout: "none",
        data: nodes,
        links: links,
        emphasis: {
          focus: "adjacency",
        },
        lineStyle: {
          color: "gradient",
          curveness: 0.5,
        },
        label: {
          fontSize: 12,
          color: "#374151",
          fontWeight: "500"
        },
        itemStyle: {
          color: "#8B5CF6",
          borderColor: "#7C3AED",
          borderWidth: 1
        }
      },
    ],
  };

  console.log("ECharts option:", option);

  return (
    <div id="sankey-diagram" className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 sankey-diagram">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-800">Energy Flow Analysis</h2>
        <ExportButton type="chart" chartId="sankey-diagram" chartTitle="Building Energy Flow Diagram" />
      </div>
      <ReactECharts 
        option={option} 
        style={{ height: 500 }}
        onChartReady={(chartInstance) => {
          // Store chart instance for export functionality
          if (window.sankeyChartInstance) {
            window.sankeyChartInstance.dispose();
          }
          window.sankeyChartInstance = chartInstance;
        }}
      />
    </div>
  );
};

export default SankeyDiagram;