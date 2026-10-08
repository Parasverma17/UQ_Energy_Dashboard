import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import MetricCard from "../components/MetricCard";
import MonthlyChart from "../components/MonthlyChart";
import FacilitiesTable from "../components/FacilitiesTable";
import Campus3DMap from "../components/Campus3DMap";
import BreakdownChart from "../components/BreakdownChart";
import SankeyDiagram from "../components/SankeyDiagram";
import PublicDashboard from "../components/PublicDash";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function DashboardPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [selectedInfo, setSelectedInfo] = useState({ month: "Jul", y2024: 0, y2025: 0 });

  const [sankeyData, setSankeyData] = useState([]);
  const [loadingSankey, setLoadingSankey] = useState(true);
  const [sankeyError, setSankeyError] = useState(null);

  const [facilities, setFacilities] = useState([]);
  const [facilitiesLoading, setFacilitiesLoading] = useState(true);
  const [facilitiesError, setFacilitiesError] = useState(null);

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
        const res = await fetch("http://localhost:8080/api/buildings/sankey");
        const data = await res.json();

        if (gone) return;

        console.log("Sankey data fetched:", data);
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
  }, []);

  // Load facilities data from API
  useEffect(() => {
    let gone = false;

    (async function loadFacilities() {
      setFacilitiesLoading(true);
      setFacilitiesError(null);

      try {
        const res = await fetch("http://localhost:8080/api/buildings/energy_usage");
        const data = await res.json();

        if (gone) return;

        console.log("Facilities data fetched:", data);
        
        // Transform the data to match the expected format
        const transformedFacilities = data.map(item => ({
          name: item.facility || item.building_name || `Building ${item.building}`,
          facility: item.facility || item.building_name || `Building ${item.building}`,
         // cost: Math.round(item.kwh * 0.15), // Estimate cost at $0.15/kWh
          energy: Math.round(item.kwh / 277.8), // Convert kWh to GJ (1 GJ = 277.8 kWh)
          energy_gj: Math.round(item.kwh / 277.8),
          emissions: Math.round(item.kwh * 0.0007), // Estimate emissions factor
          emissions_t_co2e: Math.round(item.kwh * 0.0007),
          consumption: Math.round(item.kwh),
          kwh: item.kwh
        }));

        setFacilities(transformedFacilities);
      } catch (e) {
        setFacilitiesError(String(e));
        // Fallback to dummy data if API fails
        setFacilities([
          { name: "Advanced Engineering Building", facility: "Advanced Engineering Building", cost: 285420, energy: 8245, energy_gj: 8245, emissions: 578.3, emissions_t_co2e: 578.3, consumption: 2290500, kwh: 2290500 },
          { name: "Biological Sciences Library", facility: "Biological Sciences Library", cost: 189750, energy: 5730, energy_gj: 5730, emissions: 401.1, emissions_t_co2e: 401.1, consumption: 1591000, kwh: 1591000 },
          { name: "Chemistry Building", facility: "Chemistry Building", cost: 342890, energy: 9875, energy_gj: 9875, emissions: 692.3, emissions_t_co2e: 692.3, consumption: 2743120, kwh: 2743120 },
          { name: "Duhig Tower", facility: "Duhig Tower", cost: 156320, energy: 4510, energy_gj: 4510, emissions: 315.7, emissions_t_co2e: 315.7, consumption: 1250560, kwh: 1250560 },
          { name: "Forgan Smith Building", facility: "Forgan Smith Building", cost: 178450, energy: 5150, energy_gj: 5150, emissions: 360.5, emissions_t_co2e: 360.5, consumption: 1428600, kwh: 1428600 },
          { name: "Goddard Building", facility: "Goddard Building", cost: 224780, energy: 6480, energy_gj: 6480, emissions: 453.6, emissions_t_co2e: 453.6, consumption: 1798240, kwh: 1798240 },
        ]);
      } finally {
        setFacilitiesLoading(false);
      }
    })();

    return () => {
      gone = true;
    };
  }, []);

  // Dummy data
  const breakdownData = {};

  const [filters, setFilters] = useState({
    startDate: "2024-07-01",
    endDate: "2025-06-30",
    resource: "Electricity",
    campus: "St Lucia",
    search: "",
  });

  const [selectedFacility, setSelectedFacility] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("Jul");

  // Update selected facility when facilities are loaded
  useEffect(() => {
    if (facilities.length > 0 && !selectedFacility) {
      setSelectedFacility(facilities[0].name);
    }
  }, [facilities, selectedFacility]);

  const filteredFacilities = facilities.filter(f =>
    f.name.toLowerCase().includes(filters.search.toLowerCase())
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

        {/* Login button (top-right) */}
        <Link
          to="/login"
          className="px-4 py-2 rounded-lg bg-yellow-500 text-purple-900 font-semibold hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-purple-800 transition-all duration-200"
        >
          Login
        </Link>
      </header>

      <main className="flex-1 px-6 py-8 space-y-8">
        {/* Filters Section */}
        <Header filters={filters} setFilters={setFilters} />
        
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

        {/* Public Energy Charts Section */}
        <div className="w-full">
          <PublicDashboard />
        </div>

        {/* One Column Layout */}
        <div className="w-full space-y-8">
          {/* Building Energy Usage Chart */}
          <BreakdownChart />

          {/* Facilities Table */}
          {facilitiesLoading ? (
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
              <div className="animate-pulse flex items-center justify-center h-32">
                <p className="text-purple-600">Loading facilities...</p>
              </div>
            </div>
          ) : facilitiesError ? (
            <div className="bg-white p-6 rounded-xl shadow-lg border border-red-200">
              <p className="text-red-600">Error loading facilities: {facilitiesError}</p>
            </div>
          ) : (
            <FacilitiesTable
              facilities={filteredFacilities}
              selected={selectedFacility}
              setSelected={setSelectedFacility}
            />
          )}
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
                  alt="UQ Crest" 
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