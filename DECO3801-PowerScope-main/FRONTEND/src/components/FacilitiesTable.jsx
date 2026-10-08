export default function FacilitiesTable({ facilities, selected, setSelected }) {  
  return (
    <div className="bg-white rounded-lg shadow p-4 overflow-x-auto">
      <div className="text-sm font-semibold mb-2">Facilities</div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-500">
            <th className="text-left py-1">Facility</th>
            <th className="text-right py-1">Cost ($)</th>
            <th className="text-right py-1">Energy (GJ)</th>
            <th className="text-right py-1">Emissions (T CO2-E)</th>
            <th className="text-right py-1">Consumption (KWH)</th>
          </tr>
        </thead>
        <tbody>
          {facilities.map(f => (
            <tr
              key={f.facility}
              className={`cursor-pointer transition ${selected === f.facility ? "bg-purple-50" : "hover:bg-gray-50"}`}
              onClick={() => setSelected(f.facility)}
            >
              <td className="py-1">{f.facility}</td>
              <td className="py-1 text-right">{f.cost}</td>
              <td className="py-1 text-right">{Number(f.energy_gj).toLocaleString()}</td>
              <td className="py-1 text-right">{Number(f.emissions_t_co2e).toLocaleString()}</td>
              <td className="py-1 text-right">{Number(f.consumption).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
