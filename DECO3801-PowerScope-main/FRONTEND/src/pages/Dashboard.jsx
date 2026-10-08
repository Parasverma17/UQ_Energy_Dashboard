import { useState, useEffect } from "react";
import Header from "../components/Header";
import MetricCard from "../components/MetricCard";
import MonthlyChart from "../components/MonthlyChart";
import FacilitiesTable from "../components/FacilitiesTable";
import Campus3DMap from "../components/Campus3DMap";
import BreakdownChart from "../components/BreakdownChart";
import SankeyDiagram from "../components/SankeyDiagram";
import SimpleDashboard from "../components/SimpleDashboard";
import ForecastChart from "../components/ForecastChart";
import HourlyUsageLineChart from "../components/HourlyUsageLineChart";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const PERIOD_DAYS = 30;
const KWH_TO_GJ = 0.0036;

function pctChange(curr, prev) {
  if (prev === 0 || prev == null || curr == null) return 0;
  return((curr - prev) / prev) * 100;
}

function formatNumber(x, opts = {}) {
  if (x == null || Number.isNaN(x)) return "-";
  return new Intl.NumberFormat("en-AU",opts).format(x);
}

function fmtDelta(pct) {
  if (pct == null || Number.isNaN(pct)) return "-";
  const sign = pct > 0 ? "+": "";
  return `${sign}${pct.toFixed(1)}%`;
}

function changeTypeFromDelta(delta, invert = false) {
  const effective = invert ? -delta: delta;
  if(effective > 0) return "up";
  if (effective < 0) return "down";
  return "flat";
}



export default function DashboardPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [selectedInfo, setSelectedInfo] = useState({ month: "Jul", y2024: 0, y2025: 0 });

  const [sankeyData, setSankeyData] = useState([]);
  const [loadingSankey, setLoadingSankey] = useState(true);
  const [sankeyError, setSankeyError] = useState(null);

  const [facilities, setfacilities] = useState([]);
  const [facilitiesLoading, setfacilitiesLoading] = useState(true);
  const [facilitiesErr, setfacilitiesErr] = useState(null);

  const [overview, setOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewErr, setOverviewErr] = useState(null);

  // Add forecast state
  const [forecastData, setForecastData] = useState([]);
  const [forecastLoading, setForecastLoading] = useState(true);
  const [forecastError, setForecastError] = useState(null);

  // Add building ID state
  const [selectedBuildingId, setSelectedBuildingId] = useState("0051"); // Default building

  //Hourly usage line char
  const [hourlyData, setHourlyData] =  useState([]);;
  const [hourlyLoading, setHourlyLoading] = useState(true);
  const [hourlyErr, setHourlyErr]= useState(null);
  // Get username from localStorage
  const [username, setUsername] = useState(localStorage.getItem('username') || 'User');

  // uq overlook
  useEffect(() => {
    let gone = false;
    (async function loadOverview (){
      setOverviewLoading(true);
      setOverviewErr(null);
      try {
        const res = await fetch("http://localhost:8080/api/analytics/uq_overlook");
        if (!res.ok) throw new Error(`uq_overlook ${res.status}`);
        const data = await res.json();
        if (gone) return;
        setOverview(Array.isArray(data) ? data[0] : data);



      } catch (e) {
        setOverviewErr(String(e));
      } finally {
        setOverviewLoading(false);
      }
    })();
    return () => {gone = true; };

    




  },[]);

  const o = overview || {
    current_kwh:0 , previous_kwh:0, current_tco2e: 0, previous_tco2e: 0, current_cost:0, prev_cost: 0
  };

  const cost = o.current_cost;
  const consumption = o.current_kwh;
  const energy = o.current_kwh * KWH_TO_GJ;
  const emissions = o.current_tco2e;

  const costDelta = pctChange(o.current_cost, o.prev_cost);
  const consumptionDelta = pctChange(o.current_kwh, o.previous_kwh);
  const energyDelta = pctChange(o.current_kwh, o.previous_kwh);
  const emissionsDelta = pctChange(o.current_tco2e, o.previous_tco2e);

  // Building mapping function
  function getBuildingId(facilityName) {
    const buildingMapping = {
      "Advanced Engineering Building": "0049",
      "Zelman Cowan Building": "0051", 
      "Chemistry Building": "0052",
      "Duhig Tower": "0053",
      "Forgan Smith Building": "0054",
      "Goddard Building": "0055",
    };
    
    return buildingMapping[facilityName] || "0051"; // Default to 0051
  }

  // Update the building selection handler
  const handleBuildingSelect = (buildingName, buildingId) => {
    console.log("Dashboard received:", buildingName, buildingId);
    setSelectedFacility(buildingName);
    if (buildingId) {
      setSelectedBuildingId(buildingId);
    } else {
      // If no buildingId provided, derive it from building name
      setSelectedBuildingId(getBuildingId(buildingName));
    }
  };



// useage per month
  useEffect(() => {
    let gone = false;

    (async function load() {
      setLoading(true);
      setErr(null);

      try {
        const res = await fetch("http://localhost:8080/api/analytics/usage_per_month");
        const data = await res.json();

        if (gone) return;

        const months = Object.fromEntries(MONTHS.map((m) => [m, { y2024: 0, y2025: 0 }]));

        for (const r of data) {
          if (r.year !== 2024 && r.year !== 2025) continue;
          const mName = r.month.charAt(0).toUpperCase() + r.month.slice(1).toLowerCase();
          if (!months[mName]) continue;
          const key = r.year === 2024 ? "y2024" : "y2025";
          months[mName][key] = Math.round(r.total_energy_usage);
        }

        const tableRows = MONTHS.map((m) => ({ month: m, ...months[m] }));
        setRows(tableRows);
        console.log(tableRows);
      } catch (e) {
        setErr(String(e));
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      gone = true;
    };
  }, []);

  useEffect(() => {
    let gone = false;

    (async function loadSankeyData() {
      setLoadingSankey(true);
      setSankeyError(null);

      try {
        const res = await fetch(`http://localhost:8080/api/buildings/sankey?building=${selectedBuildingId}`);
        const data = await res.json();

        if (gone) return;

        console.log("Sankey data fetched for building:", selectedBuildingId, data);
        setSankeyData(data);
      } catch (e) {
        setSankeyError(String(e));
      } finally {
        setLoadingSankey(false);
      }
    })();

    return () => {
      gone = true;
    };
  }, [selectedBuildingId]); // Add selectedBuildingId dependency
  
  useEffect(() => {
    if(selectedFacility) {
      setSelectedBuildingId(getBuildingId(selectedFacility))
    }

  })

  useEffect(() => {
    let gone = false;
    (async function loadHourlyUsage() {
      setHourlyLoading(true);
      setHourlyErr(null);
      try {
        const res = await fetch(`http://localhost:8080/api/buildings/hourly_usage?building=${selectedBuildingId}`);
        if (!res.ok) throw new Error("hourly dev usage");
        const data = await res.json();
        if (gone) return;
        const cleaned = (Array.isArray(data) ? data : []).map((r) => ({hour_of_day: Number(r.hour_of_day), avg_kwh: Number(r.avg_kwh),})).sort((a,b)=>a.hour_of_day - b.hour_of_day);
        setHourlyData(cleaned);

      } catch (e) {if (!gone) setHourlyErr(String(e));

      } finally {if (!gone) setHourlyLoading(false);

      }
    })();
    return () => {gone = true; };
  }, [selectedBuildingId])








  useEffect(() => {
    let gone = false;
    (async function loadFacilities() {
      setfacilitiesLoading(true);
      setfacilitiesErr(null);
    
    try {
      const res = await fetch ("http://localhost:8080/api/buildings/facilities");
      if (!res.ok) throw new Error("facilities not loaded");
      const data = await res.json();
      if (gone) return;

      setfacilities(Array.isArray(data) ? data :[]);
    } catch (e) {
      setfacilitiesErr(String(e));
    }
    finally {
      setfacilitiesLoading(false);
    }

  })();
    return () => {gone = true;
    
    };
},[]);

  // Load forecast data
  useEffect(() => {
    let gone = false;
    (async function loadForecast() {
      setForecastLoading(true);
      setForecastError(null);
      try {
        const res = await fetch("http://localhost:8080/api/forecast");
        if (!res.ok) throw new Error(`Forecast API ${res.status}`);
        const data = await res.json();
        if (gone) return;
        setForecastData(data.predictions || []);
      } catch (e) {
        setForecastError(String(e));
      } finally {
        setForecastLoading(false);
      }
    })();
    return () => { gone = true; };
  }, []);


  // Dummy data
//  const facilities = [
 //   { name: "Advanced Engineering Building", cost: 285420, energy: 8245, emissions: 578.3, consumption: 2290500 },
 //   { name: "Biological Sciences Library", cost: 189750, energy: 5730, emissions: 401.1, consumption: 1591000 },
 //   { name: "Chemistry Building", cost: 342890, energy: 9875, emissions: 692.3, consumption: 2743120 },
 //   { name: "Duhig Tower", cost: 156320, energy: 4510, emissions: 315.7, consumption: 1250560 },
 //   { name: "Forgan Smith Building", cost: 178450, energy: 5150, emissions: 360.5, consumption: 1428600 },
 //   { name: "Goddard Building", cost: 224780, energy: 6480, emissions: 453.6, consumption: 1798240 },
 // ];

  // Removed old hardcoded breakdown data - now using real API data in BreakdownChart component

  const [filters, setFilters] = useState({
    startDate: "2024-07-01",
    endDate: "2025-06-30",
    resource: "Electricity",
    campus: "St Lucia",
    search: "",
  });

  const [selectedFacility, setSelectedFacility] = useState("Chemistry Building");
  const [selectedMonth, setSelectedMonth] = useState("Jul");

  const filteredFacilities = facilities.filter(f =>
    String(f.facility)
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Updated Header with UQ Branding */}
      <header className="bg-gradient-to-r from-purple-800 to-purple-900 shadow-lg px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* UQ Logo with Shield Shape Styling */}
          <div className="relative">
            <img 
              src="/uq_logo.svg" 
              alt="UQ Logo"
              // alt="UQ Logo" 
              className="h-14 w-auto object-contain bg-white p-1 rounded-lg shadow-md border-2 border-yellow-400 hover:border-yellow-300 transition-all duration-300"
              style={{
                filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))',
                maxWidth: '60px'
              }}
            />
          </div>
          <div className="flex flex-col">
            <h1 className="font-bold text-white text-xl tracking-wide">UQ Energy Dashboard</h1>
            <p className="text-purple-200 text-sm font-medium">PowerScope Analytics Platform</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-white text-right">
            <p className="font-semibold text-sm">Welcome back!</p>
            <p className="text-purple-200 text-xs">{username}</p>
          </div>
          <button 
            className="px-4 py-2 rounded-lg bg-yellow-500 text-purple-900 font-semibold hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-purple-800 transition-all duration-200"
            tabIndex="0"
          >
            {username}
          </button>
        </div>
      </header>

      <main className="flex-1 px-6 py-8 space-y-8">
        {/* Filters Section */}
        <Header filters={filters} setFilters={setFilters} />
        
        {/* Metrics Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard title="Cost" value={formatNumber(cost, {style: "currency", currency: "AUD", maximumFractionDigits: 0})} unit="(30-day)" change={fmtDelta(costDelta)} changeType={changeTypeFromDelta(costDelta,true)} />
          <MetricCard title="Energy" value={formatNumber(energy, {maximumFractionDigits: 1})} unit="GJ (30-day)" change={fmtDelta(energyDelta)} changeType={changeTypeFromDelta(energyDelta,true)} />
          <MetricCard title="Emissions" value={formatNumber(Math.round(emissions))} unit="t CO2-e (30-day)" change={fmtDelta(emissionsDelta)} changeType={changeTypeFromDelta(emissionsDelta,true)} />
          <MetricCard title="Consumption" value={formatNumber(Math.round(consumption))} unit="kWh(30-day)" change={fmtDelta(consumptionDelta)} changeType={changeTypeFromDelta(consumptionDelta,true)} />
        </div>

        {/* Full-width Monthly Chart */}
        <div className="w-full">
          <MonthlyChart
            data={rows}
            selectedMonth={selectedMonth}
            setSelectedMonth={(m, y24, y25) => {
              setSelectedMonth(m);
              setSelectedInfo({month: m, y2024:y24, y2025:y25})
            }}
          />
        </div>

        {/* Full-width Forecast Chart */}
        <div className="w-full">
          <ForecastChart 
            data={forecastData}
            loading={forecastLoading}
            error={forecastError}
          />
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column - Charts and Data */}
          <div className="xl:col-span-2 space-y-8">
            {/* Sankey Diagram */}
            {loadingSankey ? (
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                <div className="animate-pulse flex items-center justify-center h-64">
                  <p className="text-purple-600">Loading Sankey diagram...</p>
                </div>
              </div>
            ) : sankeyError ? (
              <div className="bg-white p-6 rounded-xl shadow-lg border border-red-200">
                <p className="text-red-600">Error loading Sankey diagram: {sankeyError}</p>
              </div>
            ) : (
              <SankeyDiagram data={sankeyData} selectedBuilding={selectedFacility} />
            )}
           

            {/* Facilities Table */}
            <FacilitiesTable
              facilities={filteredFacilities}
              selected={selectedFacility}
              setSelected={setSelectedFacility}
            />

            {/* Building Energy Usage Chart */}
            <BreakdownChart />
          </div>

          {/* Right Column - 3D Map with more space */}
          <div className="xl:col-span-1">
            <Campus3DMap
              selectedBuilding={selectedFacility}
              onBuildingSelect={handleBuildingSelect}
              facilities={filteredFacilities}
            />
             <HourlyUsageLineChart data={hourlyData} loading={hourlyLoading} error={hourlyErr} buildingName={selectedFacility}/>
          </div>
        </div>

        {/*Overlay Dashboard Preview Container*/}
        <div className="bg-white rounded-lg shadow p-6 mt-8">
          <h2 className="text-xl font-semibold mb-4">Explore Campus Data</h2>
          <SimpleDashboard />
        </div>
      </main>

      {/* Updated Footer with UQ Branding */}
      <footer className="bg-gray-900 text-white py-8 px-6 mt-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* UQ Crest and Info */}
            <div className="flex items-start gap-4">
              <div className="relative">
                <img 
                  src="/uq_logo.svg" 
                  alt="UQ Logo" 
                  className="h-16 w-auto object-contain bg-white p-2 rounded-lg shadow-lg"
                  style={{
                    filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))',
                    maxWidth: '64px'
                  }}
                />
              </div>
              <div>
                <h3 className="font-bold text-lg text-yellow-400">University of Queensland</h3>
                <p className="text-gray-300 text-sm mt-1">Leading global university excellence</p>
                <p className="text-purple-300 text-xs mt-1 font-medium">Australia</p>
              </div>
            </div>

            {/* Links */}
            <div className="space-y-2">
              <h4 className="font-semibold text-yellow-400">Quick Links</h4>
              <div className="space-y-1">
                <a href="#" className="block text-gray-300 hover:text-yellow-400 text-sm transition-colors focus:outline-none focus:text-yellow-400">Privacy Policy</a>
                <a href="#" className="block text-gray-300 hover:text-yellow-400 text-sm transition-colors focus:outline-none focus:text-yellow-400">Accessibility</a>
                <a href="#" className="block text-gray-300 hover:text-yellow-400 text-sm transition-colors focus:outline-none focus:text-yellow-400">Send Feedback</a>
                <a href="#" className="block text-gray-300 hover:text-yellow-400 text-sm transition-colors focus:outline-none focus:text-yellow-400">Contact Support</a>
              </div>
            </div>

            {/* Copyright and Updates */}
            <div className="text-right md:text-left lg:text-right">
              <p className="text-gray-400 text-sm">&copy; 2025 The University of Queensland</p>
              <p className="text-gray-400 text-sm">All rights reserved.</p>
              <p className="text-gray-500 text-xs mt-2">Last updated: 18 August 2025, 04:29 AM</p>
              <p className="text-yellow-400 text-xs">CRICOS Provider No: 00025B</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}