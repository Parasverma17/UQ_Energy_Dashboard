import { useState } from "react";
import Header from "../components/Header";
import MetricCard from "../components/MetricCard";
import MonthlyChart from "../components/MonthlyChart";
import CompletenessWidget from "../components/CompletenessWidget";
import FacilitiesTable from "../components/FacilitiesTable";
import Campus3DMap from '../components/Campus3DMap';
import BreakdownChart from "../components/BreakdownChart";
import SankeyDiagram from "../components/SankeyDiagram";
// import ExportButton from "../components/ExportButton";

// Dummy data
const facilities = [
  { name: "Advanced Engineering Building", cost: 285420, energy: 8245, emissions: 578.3, consumption: 2290500 },
  { name: "Biological Sciences Library", cost: 189750, energy: 5730, emissions: 401.1, consumption: 1591000 },
  { name: "Chemistry Building", cost: 342890, energy: 9875, emissions: 692.3, consumption: 2743120 },
  { name: "Duhig Tower", cost: 156320, energy: 4510, emissions: 315.7, consumption: 1250560 },
  { name: "Forgan Smith Building", cost: 178450, energy: 5150, emissions: 360.5, consumption: 1428600 },
  { name: "Goddard Building", cost: 224780, energy: 6480, emissions: 453.6, consumption: 1798240 },
];

const monthlyData = [
  { month: "Jul", "2023/2024": 350, "2024/2025": 400 },
  { month: "Aug", "2023/2024": 420, "2024/2025": 480 },
  { month: "Sep", "2023/2024": 500, "2024/2025": 550 },
  { month: "Oct", "2023/2024": 600, "2024/2025": 650 },
  { month: "Nov", "2023/2024": 700, "2024/2025": 750 },
  { month: "Dec", "2023/2024": 800, "2024/2025": 850 },
  { month: "Jan", "2023/2024": 750, "2024/2025": 800 },
  { month: "Feb", "2023/2024": 700, "2024/2025": 750 },
  { month: "Mar", "2023/2024": 650, "2024/2025": 700 },
  { month: "Apr", "2023/2024": 600, "2024/2025": 650 },
  { month: "May", "2023/2024": 500, "2024/2025": 550 },
  { month: "Jun", "2023/2024": 400, "2024/2025": 450 },
];

const breakdownData = {
  "Chemistry Building": [
    { label: "HVAC", value: 3950 },
    { label: "Lighting", value: 2000 },
    { label: "Lab Equipment", value: 2500 },
    { label: "Computing", value: 1200 },
    { label: "Refrigeration", value: 900 },
    { label: "Other", value: 325 },
  ],
};

export default function DashboardPage() {
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
    f.name.toLowerCase().includes(filters.search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/vite.svg" alt="UQ Logo" className="h-8" />
          <span className="font-bold text-purple-700 text-lg">UQ Energy Dashboard</span>
        </div>
        {/* <div className="flex items-center gap-4">
          <span className="text-gray-600 text-sm">energy</span> */}
          <button className="px-3 py-1 rounded bg-purple-100 text-purple-700 font-medium hover:bg-purple-200 transition">Profile</button>
        {/* </div> */}
      </header>

      <main className="flex-1 px-6 py-8">
        <Header filters={filters} setFilters={setFilters} />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <MetricCard title="Cost" value="$4,328" unit="/day" change="-8.2%" changeType="down" />
          <MetricCard title="Energy" value="1,245" unit="GJ/day" change="+3.7%" changeType="up" />
          <MetricCard title="Emissions" value="87.2" unit="t CO2-e/day" change="-5.1%" changeType="down" />
          <MetricCard title="Consumption" value="345,928" unit="kWh/day" change="+2.8%" changeType="up" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <MonthlyChart
              data={monthlyData}
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
            />
            <SankeyDiagram />
            <FacilitiesTable
              facilities={filteredFacilities}
              selected={selectedFacility}
              setSelected={setSelectedFacility}
            />
            <BreakdownChart data={breakdownData[selectedFacility]} />
          </div>
          <div className="flex flex-col gap-6">
            <CompletenessWidget />
            <MapWidget
              facilities={filteredFacilities}
              selected={selectedFacility}
              setSelected={setSelectedFacility}
            />
          </div>
        </div>
      </main>
      <footer className="mt-12 py-4 text-center text-gray-500 text-sm">
        &copy; 2025 University of Queensland. All rights reserved. <br />
        Last updated: 18 August 2025, 04:29 AM
      </footer>
    </div>
  );
}
