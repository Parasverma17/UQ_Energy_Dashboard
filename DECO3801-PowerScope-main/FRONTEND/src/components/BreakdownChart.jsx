// Building Energy Usage Chart - Shows energy consumption by building

import { useState, useEffect } from "react";
import ExportButton from "./ExportButton";

export default function BreakdownChart() {
  const [buildingData, setBuildingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Building name mapping
  const buildingNames = {
    "0049": "Advanced Engineering",
    "0051": "Zelman Cowen", 
    "0052": "Chemistry Building",
    "0053": "Duhig Tower",
    "0054": "Forgan Smith",
    "0055": "Goddard Building"
  };

  // Load building energy data
  useEffect(() => {
    let gone = false;
    
    (async function loadBuildingEnergy() {
      setLoading(true);
      setError(null);
      
      try {
        const res = await fetch("http://localhost:8080/api/buildings/energy_usage");
        if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
        
        const data = await res.json();
        if (gone) return;
        
        // Process and format the data
        const processedData = data.map(building => ({
          id: building.building,
          name: buildingNames[building.building] || `Building ${building.building}`,
          kwh: building.kwh,
          energy_share: building.energy_share,
          // Convert kWh to GJ for display (1 kWh = 0.0036 GJ)
          gj: building.kwh * 0.0036
        }));
        
        // Sort by energy consumption (highest first)
        processedData.sort((a, b) => b.kwh - a.kwh);
        
        setBuildingData(processedData);
      } catch (e) {
        console.error("Building Energy API error:", e);
        setError(String(e));
        
        // Set fallback data when API fails
        setBuildingData([
          {
            id: "0051",
            name: "Zelman Cowen",
            kwh: 1578106.767,
            energy_share: 100,
            gj: 1578106.767 * 0.0036
          }
        ]);
      } finally {
        setLoading(false);
      }
    })();
    
    return () => { gone = true; };
  }, []); // No dependencies - this chart should not change based on other interactions

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-800">Building Energy Usage</h2>
          <ExportButton />
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse">
            <div className="h-4 bg-purple-200 rounded w-48 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-32"></div>
          </div>
          <p className="text-purple-600 ml-4">Loading building data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-red-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-800">Building Energy Usage</h2>
          <ExportButton />
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-2">Connection Issue</p>
            <p className="text-sm text-gray-500">Showing sample data</p>
          </div>
        </div>
      </div>
    );
  }

  if (!buildingData || buildingData.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-800">Building Energy Usage</h2>
          <ExportButton />
        </div>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">No building energy data available</p>
        </div>
      </div>
    );
  }

  // Calculate max value for scaling
  const maxKwh = Math.max(...buildingData.map(d => d.kwh));
  const maxHeight = 200; // Maximum bar height in pixels

  return (
    <div id="building-energy-chart" className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 breakdown-chart">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Building Energy Usage</h2>
          <p className="text-sm text-gray-500">Energy consumption by building (kWh)</p>
        </div>
        <ExportButton type="chart" chartId="building-energy-chart" chartTitle="Building Energy Usage" />
      </div>

      <div className="flex items-end justify-center gap-6 h-64 px-4">
        {buildingData.map((building, index) => {
          const barHeight = (building.kwh / maxKwh) * maxHeight;
          const colors = [
            'bg-purple-500 hover:bg-purple-600',
            'bg-blue-500 hover:bg-blue-600', 
            'bg-green-500 hover:bg-green-600',
            'bg-yellow-500 hover:bg-yellow-600',
            'bg-red-500 hover:bg-red-600',
            'bg-indigo-500 hover:bg-indigo-600'
          ];
          
          return (
            <div key={building.id} className="flex flex-col items-center group">
              <div
                className={`w-12 ${colors[index % colors.length]} rounded-t-lg transition-all duration-300 transform group-hover:scale-105 shadow-md`}
                style={{ height: `${Math.max(barHeight, 20)}px` }}
                title={`${building.name}: ${building.kwh.toLocaleString()} kWh (${building.energy_share.toFixed(1)}%)`}
              />
              <div className="mt-2 text-center">
                <span className="text-xs font-medium text-gray-700 block">{building.name}</span>
                <span className="text-xs text-gray-500 block">{building.kwh.toLocaleString()} kWh</span>
                <span className="text-xs text-purple-600 font-semibold block">{building.energy_share.toFixed(1)}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Statistics */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Total Buildings:</span>
            <span className="ml-2 font-semibold text-gray-800">{buildingData.length}</span>
          </div>
          <div>
            <span className="text-gray-500">Total Consumption:</span>
            <span className="ml-2 font-semibold text-purple-600">
              {buildingData.reduce((sum, b) => sum + b.kwh, 0).toLocaleString()} kWh
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
