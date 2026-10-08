export default function Header({ filters, setFilters }) {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Title Section */}
        <div>
          <h1 className="text-2xl font-bold text-purple-800 mb-2">Energy Analytics Dashboard</h1>
          <p className="text-gray-600">Monitor and analyze campus energy consumption patterns</p>
        </div>

        {/* Filters Section */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          {/* Date Range */}
          <div className="flex flex-col sm:flex-row gap-2">
            <label htmlFor="start-date" className="sr-only">Start Date</label>
            <input
              id="start-date"
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              aria-label="Start date for data range"
            />
            <span className="hidden sm:block text-gray-500 self-center">to</span>
            <label htmlFor="end-date" className="sr-only">End Date</label>
            <input
              id="end-date"
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              aria-label="End date for data range"
            />
          </div>

          {/* Static Campus Display - Button Style */}
          <div className="px-4 py-2 bg-purple-100 border border-purple-300 rounded-lg text-sm font-medium text-purple-800 cursor-default">
            St Lucia
          </div>
        </div>
      </div>
    </div>
  );
}