import { createContext, useContext, useState } from "react";

const DashboardContext = createContext();

export function DashboardProvider({ children }) {
  const [filters, setFilters] = useState({
    startDate: "2024-07-01",
    endDate: "2025-06-30",
    resource: "Electricity",
    campus: "St Lucia",
    search: "",
  });
  const [selectedFacility, setSelectedFacility] = useState("Chemistry Building");

  return (
    <DashboardContext.Provider value={{ filters, setFilters, selectedFacility, setSelectedFacility }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  return useContext(DashboardContext);
}