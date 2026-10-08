import React, { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import ExportButton from "./ExportButton";


export default function HourlyUsageLineChart({data = [], loading = false, error=null, buildingName }) {

if (loading) {
    return (
        <div className = "bg-white rounded-lg shadow p-4 flex items-center justify-center" style={{height:400}}>
            <p className="text-gray-500">Loading Hourly usage</p>
            </div>
    );
}

if (error) {
    return (
        <div className = "bg-white rounded-lg shadow p-4 flex items-center justify-center" style={{height:400}}>
            <p className="text-red-500">Error loading Hourly usage</p>
            </div>
    );
}

const {xData, yData} = useMemo(() => {
    const x = Array.from({length:24}, (_,h) => String(h).padStart(2, "0"));
    const map = new Map((data || []).map((r) => [Number(r.hour_of_day), Number(r.avg_kwh)]));
    const y = x.map((hh) => (map.has(Number(hh)) ? map.get(Number(hh)): null));
    return {xData : x ,yData :y}

},[data]);

const option = {
    grid: {left:40, right:20, top:20, bottom:25},
    tooltip: {
        trigger: "axis", axisPointer: {type : "line"}, valueFormatter: (v) => (v == null ? "-" : `${v.toFixed(1)} kwh`),

    },
    
    xAxis: {type: "category", data: xData, boundaryGap: false, name: "hour of day", nameLocation: "middle", axisLabel: {fontSize:10},},
    yAxis: {type: "value" ,name: "Average KWH", nameLocation: "middle", axisLabel: {fontSize:10}, splitLine: {show: true},},

    series: [ {
        data: yData, type: 'line', smooth:true, showSymbol: true, symbolSize: 4, lineStyle: {color: '#f59e0b', width: 2}, itemStyle: {color: '#f59e0b'},

    },],
    };

return (
    <div className="bg-white rounded-lg shadow p-4">
        {buildingName ? <h3 className="text-sm text-gray-600 mb-2">Hourly usage - {buildingName}</h3> :null }
        <ReactECharts option={option} style={{height:400, width:"100%"}} />
        </div>
);
}