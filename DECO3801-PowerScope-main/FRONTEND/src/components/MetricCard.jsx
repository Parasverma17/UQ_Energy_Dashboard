export default function MetricCard({ title, value, unit, change, changeType }) {
  const isPositive = changeType === "up";
  const isNegative = changeType === "down";

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-purple-800 uppercase tracking-wide">{title}</h3>
        <div className={`w-3 h-3 rounded-full ${
          isPositive ? 'bg-green-500' : isNegative ? 'bg-red-500' : 'bg-yellow-500'
        }`}></div>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-gray-900">{value}</span>
          <span className="text-sm font-medium text-gray-600">{unit}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
            isPositive 
              ? 'bg-green-100 text-green-800' 
              : isNegative 
                ? 'bg-red-100 text-red-800' 
                : 'bg-yellow-100 text-yellow-800'
          }`}>
            {isPositive && (
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 17a.5.5 0 01-.5-.5V5.707L5.354 9.853a.5.5 0 11-.708-.708l5-5a.5.5 0 01.708 0l5 5a.5.5 0 01-.708.708L10.5 5.707V16.5a.5.5 0 01-.5.5z"/>
              </svg>
            )}
            {isNegative && (
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a.5.5 0 01.5.5v10.793l4.146-4.146a.5.5 0 01.708.708l-5 5a.5.5 0 01-.708 0l-5-5a.5.5 0 01.708-.708L9.5 14.293V3.5A.5.5 0 0110 3z"/>
              </svg>
            )}
            {change}
          </span>
          <span className="text-xs text-gray-500">vs last period</span>
        </div>
      </div>
    </div>
  );
}