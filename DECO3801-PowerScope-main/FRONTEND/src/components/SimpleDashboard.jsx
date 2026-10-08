import { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';

const API_BASE = 'http://localhost:8080/api';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function SimpleDashboard() {
  console.log("SimpleDashboard is Rendering!");
  const energyRef = useRef(null);
  const costRef = useRef(null);
  const tempRef = useRef(null);

  const energyChart = useRef(null);
  const costChart = useRef(null);
  const tempChart = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [hourlyData, setHourlyData] = useState([]);
  const [view, setView] = useState('monthly');
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [hourRange, setHourRange] = useState(null);

  // Initialize charts
  useEffect(() => {
    if (energyRef.current && !energyChart.current) energyChart.current = echarts.init(energyRef.current);
    if (costRef.current && !costChart.current) costChart.current = echarts.init(costRef.current);
    if (tempRef.current && !tempChart.current) tempChart.current = echarts.init(tempRef.current);

    const ro = new ResizeObserver(() => {
      energyChart.current?.resize();
      costChart.current?.resize();
      tempChart.current?.resize();
    });
    if (energyRef.current) ro.observe(energyRef.current);
    if (costRef.current) ro.observe(costRef.current);
    if (tempRef.current) ro.observe(tempRef.current);
    return () => ro.disconnect();
  }, []);

  // Fetch monthly data
  useEffect(() => {
    const fetchMonthly = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/dashboard/metrics?resolution=month`);
        if (!res.ok) throw new Error('Failed to fetch monthly data');
        const data = await res.json();
        setMonthlyData(data);
        if (!selectedYear) setSelectedYear(Math.max(...data.map(d => new Date(d.timestamp).getFullYear())));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchMonthly();
  }, []);

  // Update charts based on current view
  useEffect(() => {
    if (view === 'monthly' && monthlyData.length && selectedYear != null) {
      updateMonthlyCharts();
    }
  }, [view, monthlyData, selectedYear]);

  // Fetch weekly data
  useEffect(() => {
    if (view !== 'weekly' || selectedMonth == null || !selectedYear) return;
    const fetchWeekly = async () => {
      setLoading(true);
      setError(null);
      try {
        const start = new Date(selectedYear, selectedMonth, 1);
        const end = new Date(selectedYear, selectedMonth + 1, 0);
        const params = new URLSearchParams({ 
          start_date: start.toISOString(), 
          end_date: end.toISOString(), 
          resolution: 'week' 
        });
        const res = await fetch(`${API_BASE}/dashboard/metrics?${params}`);
        if (!res.ok) throw new Error('Failed to fetch weekly data');
        const data = await res.json();
        setWeeklyData(data);
        updateWeeklyCharts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchWeekly();
  }, [view, selectedMonth, selectedYear]);

  // Fetch daily data
  useEffect(() => {
    if (view !== 'daily') return;
    const fetchDaily = async () => {
      if (!selectedWeek || !selectedYear || selectedMonth == null) return;
      setLoading(true);
      setError(null);
      try {
        let startIso, endIso;
        if (dateRange && dateRange[0] && dateRange[1]) {
          startIso = dateRange[0].toISOString();
          endIso = dateRange[1].toISOString();
        } else {
          const [weekStart, weekEnd] = selectedWeek;
          startIso = weekStart.toISOString();
          endIso = weekEnd.toISOString();
        }
        const params = new URLSearchParams({ start_date: startIso, end_date: endIso, resolution: 'day' });
        const res = await fetch(`${API_BASE}/dashboard/metrics?${params}`);
        if (!res.ok) throw new Error('Failed to fetch daily data');
        const data = await res.json();
        setDailyData(data);
        updateDailyCharts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDaily();
  }, [view, selectedWeek, selectedYear, selectedMonth, dateRange]);

  // Fetch hourly data
  useEffect(() => {
    if (view !== 'hourly') return;
    const fetchHourly = async () => {
      if (!selectedDay) return;
      setLoading(true);
      setError(null);
      try {
        let startIso, endIso;
        if (hourRange && hourRange[0] && hourRange[1]) {
          startIso = hourRange[0].toISOString();
          endIso = hourRange[1].toISOString();
        } else {
          const dayStart = new Date(selectedDay);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(selectedDay);
          dayEnd.setHours(23, 59, 59, 999);
          startIso = dayStart.toISOString();
          endIso = dayEnd.toISOString();
        }
        const params = new URLSearchParams({ start_date: startIso, end_date: endIso, resolution: 'hour' });
        const res = await fetch(`${API_BASE}/dashboard/metrics?${params}`);
        if (!res.ok) throw new Error('Failed to fetch hourly data');
        const data = await res.json();
        setHourlyData(data);
        updateHourlyCharts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchHourly();
  }, [view, selectedDay, hourRange]);

  const handleBackToMonthly = () => {
    setView('monthly');
    setSelectedMonth(null);
    setSelectedWeek(null);
    setSelectedDay(null);
    setDateRange(null);
    setHourRange(null);
  };

  const handleBackToWeekly = () => {
    setView('weekly');
    setSelectedWeek(null);
    setSelectedDay(null);
    setDateRange(null);
    setHourRange(null);
  };

  const handleBackToDaily = () => {
    setView('daily');
    setSelectedDay(null);
    setHourRange(null);
  };

  const formatDateShort = (date) => {
    const d = new Date(date);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const groupMonthlyData = () => {
    const grouped = {};
    monthlyData.forEach(d => {
      const dt = new Date(d.timestamp);
      const key = `${dt.getFullYear()}-${dt.getMonth()}`;
      if (!grouped[key]) grouped[key] = { month: dt.getMonth(), year: dt.getFullYear(), energy: 0, cost: 0, temperature: 0, count: 0 };
      grouped[key].energy += Number(d.total_energy_kwh || 0);
      grouped[key].cost += Number(d.total_cost || 0);
      grouped[key].temperature += Number(d.avg_temp_c || 0);
      grouped[key].count += 1;
    });

    return Object.values(grouped).map(g => ({
      month: g.month,
      year: g.year,
      energy: g.energy,
      cost: g.cost,
      temperature: g.count ? g.temperature / g.count : 0
    })).filter(d => d.year === selectedYear).sort((a,b) => a.month - b.month);
  };

  const getWeeksInMonth = (year, month) => {
    const weeks = [];
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    let current = new Date(start);
    current.setDate(current.getDate() - current.getDay());

    while (current <= end) {
      const weekStart = new Date(current);
      const weekEnd = new Date(current);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weeks.push({ start: weekStart, end: weekEnd });
      current.setDate(current.getDate() + 7);
    }
    return weeks;
  };

  const updateMonthlyCharts = () => {
    const data = groupMonthlyData();
    const categories = MONTHS;

    const setChart = (chartRef, metric, color, title) => {
      const chartData = data.map(d => Number(d[metric]));
      const maxValue = Math.max(...chartData, 0);
      
      chartRef.setOption({
        title: { text: title, left: 'center' },
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: categories },
        yAxis: { 
          type: 'value', 
          min: 0,
          max: maxValue > 0 ? maxValue * 1.1 : 100,
          axisLabel: {
            formatter: (val) => {
              if (val >= 1000000) return (val / 1000000).toFixed(0) + 'M';
              if (val >= 1000) return (val / 1000).toFixed(0) + 'K';
              return Math.round(val);
            }
          }
        },
        series: [{ type: 'bar', name: title, data: chartData, itemStyle: { color } }]
      });

      chartRef.off('click');
      chartRef.on('click', (params) => {
        setSelectedMonth(params.dataIndex);
        setView('weekly');
        setSelectedWeek(null);
        setSelectedDay(null);
        setDateRange(null);
        setHourRange(null);
      });
    };

    if (energyChart.current) setChart(energyChart.current, 'energy', '#06b6d4', 'Energy (kWh)');
    if (costChart.current) setChart(costChart.current, 'cost', '#8b5cf6', 'Cost (AUD)');
    if (tempChart.current) setChart(tempChart.current, 'temperature', '#f59e0b', 'Temperature (°C)');
  };

  const updateWeeklyCharts = (data) => {
    const sorted = data.sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp));
    const weeks = getWeeksInMonth(selectedYear, selectedMonth);
    const labels = weeks.map(w => `${formatDateShort(w.start)} - ${formatDateShort(w.end)}`);

    const groupByWeek = (metric) => {
      return weeks.map(week => {
        const weekData = sorted.filter(d => {
          const dt = new Date(d.timestamp);
          return dt >= week.start && dt <= week.end;
        });
        return weekData.reduce((sum, d) => sum + Number(d[metric] || 0), 0) / Math.max(weekData.length, 1);
      });
    };

    const setChart = (chartRef, metric, color, title) => {
      const chartData = groupByWeek(metric);
      const maxValue = Math.max(...chartData, 0);
      
      chartRef.setOption({
        title: { text: title, left: 'center' },
        tooltip: { trigger: 'axis' },
        xAxis: { 
          type: 'category', 
          data: labels,
          axisLabel: {
            rotate: 45,
            fontSize: 10
          }
        },
        yAxis: { 
          type: 'value', 
          min: 0,
          max: maxValue > 0 ? maxValue * 1.1 : 100,
          axisLabel: {
            formatter: (val) => {
              if (val >= 1000000) return (val / 1000000).toFixed(0) + 'M';
              if (val >= 1000) return (val / 1000).toFixed(0) + 'K';
              return Math.round(val);
            }
          }
        },
        grid: { bottom: 80 },
        series: [{ type: 'bar', name: title, data: chartData, itemStyle: { color } }]
      });

      chartRef.off('click');
      chartRef.on('click', (params) => {
        const week = weeks[params.dataIndex];
        setSelectedWeek([week.start, week.end]);
        setView('daily');
        setSelectedDay(null);
        setDateRange(null);
        setHourRange(null);
      });
    };

    if (energyChart.current) setChart(energyChart.current, 'total_energy_kwh', '#06b6d4', 'Energy (kWh)');
    if (costChart.current) setChart(costChart.current, 'total_cost', '#8b5cf6', 'Cost (AUD)');
    if (tempChart.current) setChart(tempChart.current, 'avg_temp_c', '#f59e0b', 'Temperature (°C)');
  };

  const updateDailyCharts = (data) => {
    const sorted = data.sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp));
    const labels = sorted.map(d => new Date(d.timestamp).toISOString().slice(0,10));

    const setChart = (chartRef, metric, color, title) => {
      const chartData = sorted.map(d => Number(d[metric] || 0));
      const maxValue = Math.max(...chartData, 0);
      
      chartRef.setOption({
        title: { text: title, left: 'center' },
        tooltip: { trigger: 'axis' },
        xAxis: { 
          type: 'category', 
          data: labels,
          axisLabel: {
            rotate: 45,
            fontSize: 10
          }
        },
        yAxis: { 
          type: 'value', 
          min: 0, 
          max: maxValue > 0 ? maxValue * 1.1 : 100,
          axisLabel: {
            formatter: (val) => {
              if (val >= 1000000) return (val / 1000000).toFixed(0) + 'M';
              if (val >= 1000) return (val / 1000).toFixed(0) + 'K';
              return Math.round(val);
            }
          }
        },
        grid: { bottom: 80 },
        series: [{ type: 'bar', name: title, data: chartData, itemStyle: { color } }]
      });

      chartRef.off('click');
      chartRef.on('click', (params) => {
        if (params.dataIndex !== undefined && sorted[params.dataIndex]) {
          const dayDate = new Date(sorted[params.dataIndex].timestamp);
          setSelectedDay(dayDate);
          setView('hourly');
          setHourRange(null);
        }
      });
    };

    if (energyChart.current) setChart(energyChart.current, 'total_energy_kwh', '#06b6d4', 'Energy (kWh)');
    if (costChart.current) setChart(costChart.current, 'total_cost', '#8b5cf6', 'Cost (AUD)');
    if (tempChart.current) setChart(tempChart.current, 'avg_temp_c', '#f59e0b', 'Temperature (°C)');
  };

  const updateHourlyCharts = (data) => {
    const sorted = data.sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp));
    const labels = sorted.map(d => {
      const date = new Date(d.timestamp);
      return `${date.getHours()}:00`;
    });

    const setChart = (chartRef, metric, color, title) => {
      const chartData = sorted.map(d => Number(d[metric] || 0));
      const maxValue = Math.max(...chartData, 0);
      
      chartRef.setOption({
        title: { text: title, left: 'center' },
        tooltip: { trigger: 'axis' },
        xAxis: { 
          type: 'category', 
          data: labels,
          axisLabel: {
            fontSize: 10
          }
        },
        yAxis: { 
          type: 'value', 
          min: 0, 
          max: maxValue > 0 ? maxValue * 1.1 : 100,
          axisLabel: {
            formatter: (val) => {
              if (val >= 1000000) return (val / 1000000).toFixed(0) + 'M';
              if (val >= 1000) return (val / 1000).toFixed(0) + 'K';
              return Math.round(val);
            }
          }
        },
        series: [{ type: 'line', name: title, data: chartData, itemStyle: { color }, smooth: true }]
      });
    };

    if (energyChart.current) setChart(energyChart.current, 'total_energy_kwh', '#06b6d4', 'Energy (kWh)');
    if (costChart.current) setChart(costChart.current, 'total_cost', '#8b5cf6', 'Cost (AUD)');
    if (tempChart.current) setChart(tempChart.current, 'avg_temp_c', '#f59e0b', 'Temperature (°C)');
  };

  const handleDateRangeChange = (index, newDate) => {
    if (!newDate) return;
    
    const date = new Date(newDate);
    date.setHours(12, 0, 0, 0);
    
    if (!dateRange) {
      setDateRange([date, date]);
    } else {
      const newRange = [...dateRange];
      newRange[index] = date;
      
      if (newRange[0] > newRange[1]) {
        if (index === 0) {
          newRange[1] = date;
        } else {
          newRange[0] = date;
        }
      }
      setDateRange(newRange);
    }
  };

  const handleHourRangeChange = (index, value) => {
    if (value === '') return;
    
    const hour = parseInt(value);
    const date = new Date(selectedDay);
    date.setHours(hour, 0, 0, 0);
    
    if (!hourRange) {
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      setHourRange([date, endDate]);
    } else {
      const newRange = [...hourRange];
      newRange[index] = new Date(date);
      if (index === 1) {
        newRange[1].setHours(hour, 59, 59, 999);
      }
      
      if (newRange[0] > newRange[1]) {
        if (index === 0) {
          newRange[1] = new Date(date);
          newRange[1].setHours(23, 59, 59, 999);
        } else {
          newRange[0] = new Date(date);
          newRange[0].setHours(0, 0, 0, 0);
        }
      }
      setHourRange(newRange);
    }
  };

  // Initialize date range when entering daily view
  useEffect(() => {
    if (view === 'daily' && !dateRange && selectedWeek) {
      const [start, end] = selectedWeek;
      setDateRange([new Date(start), new Date(end)]);
    }
  }, [view, selectedWeek, dateRange]);

  return (
    <div className="w-full p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Energy Dashboard</h1>

        {view === 'monthly' && (
          <div className="mb-4">
            <label className="mr-2">Select Year:</label>
            <select
              value={selectedYear || ''}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="border rounded p-1"
            >
              {[...new Set(monthlyData.map(d => new Date(d.timestamp).getFullYear()))].sort().map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        )}

        {view === 'weekly' && (
          <div className="mb-4 flex items-center justify-between">
            <div>
              <span className="font-medium">{MONTHS[selectedMonth]} {selectedYear}</span>
            </div>
            <button
              onClick={handleBackToMonthly}
              className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700"
            >
              Back to Monthly
            </button>
          </div>
        )}

        {view === 'daily' && (
          <div className="mb-4 flex items-center justify-between">
            <div className="flex gap-2 items-center">
              <span className="text-sm font-medium">Date Range:</span>
              <input
                type="date"
                value={dateRange?.[0]?.toISOString().slice(0, 10) || ''}
                onChange={(e) => handleDateRangeChange(0, e.target.value)}
                className="border rounded p-2"
              />
              <span className="text-sm">to</span>
              <input
                type="date"
                value={dateRange?.[1]?.toISOString().slice(0, 10) || ''}
                onChange={(e) => handleDateRangeChange(1, e.target.value)}
                className="border rounded p-2"
              />
              <button
                onClick={() => {
                  if (selectedWeek) {
                    setDateRange([new Date(selectedWeek[0]), new Date(selectedWeek[1])]);
                  }
                }}
                className="bg-gray-400 text-white rounded px-3 py-2 text-sm hover:bg-gray-500"
              >
                Reset
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleBackToWeekly}
                className="bg-gray-600 text-white rounded px-4 py-2 hover:bg-gray-700"
              >
                Back to Weekly
              </button>
              <button
                onClick={handleBackToMonthly}
                className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700"
              >
                Back to Monthly
              </button>
            </div>
          </div>
        )}

        {view === 'hourly' && (
          <div className="mb-4 flex items-center justify-between">
            <div className="flex gap-2 items-center">
              <span className="text-sm font-medium">
                {selectedDay?.toISOString().slice(0, 10)} - Hour Range:
              </span>
              <select
                value={hourRange?.[0]?.getHours() || 0}
                onChange={(e) => handleHourRangeChange(0, e.target.value)}
                className="border rounded p-2"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>{i}:00</option>
                ))}
              </select>
              <span className="text-sm">to</span>
              <select
                value={hourRange?.[1]?.getHours() || 23}
                onChange={(e) => handleHourRangeChange(1, e.target.value)}
                className="border rounded p-2"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>{i}:00</option>
                ))}
              </select>
              <button
                onClick={() => setHourRange(null)}
                className="bg-gray-400 text-white rounded px-3 py-2 text-sm hover:bg-gray-500"
              >
                Reset
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleBackToDaily}
                className="bg-gray-600 text-white rounded px-4 py-2 hover:bg-gray-700"
              >
                Back to Daily
              </button>
              <button
                onClick={handleBackToWeekly}
                className="bg-gray-500 text-white rounded px-4 py-2 hover:bg-gray-600"
              >
                Back to Weekly
              </button>
              <button
                onClick={handleBackToMonthly}
                className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700"
              >
                Back to Monthly
              </button>
            </div>
          </div>
        )}

        {loading && <div className="text-center py-4">Loading...</div>}
        {error && <div className="text-red-600 text-center py-4">Error: {error}</div>}

        <div className="grid grid-cols-1 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div ref={energyRef} style={{ height: '500px', width: '100%' }} />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div ref={costRef} style={{ height: '500px', width: '100%' }} />
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div ref={tempRef} style={{ height: '500px', width: '100%' }}/>
          </div>
        </div>
      </div>
    </div>
  );
}