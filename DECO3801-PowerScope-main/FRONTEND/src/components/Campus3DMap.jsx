import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';


// Debug: Log all environment variables
console.log('All env variables:', import.meta.env);
console.log('Mapbox token:', import.meta.env.VITE_MAPBOX_TOKEN);
console.log('Token exists:', !!import.meta.env.VITE_MAPBOX_TOKEN);


// Set Mapbox access token
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const Campus3DMap = ({ selectedBuilding, onBuildingSelect, facilities = [] }) => {
  
  if (!import.meta.env.VITE_MAPBOX_TOKEN) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-red-600 font-semibold mb-4">Mapbox Token Missing</h3>
        <p className="text-gray-600">
          Mapbox access token not found. Please check your environment configuration.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Expected: VITE_MAPBOX_TOKEN in .env file
        </p>
      </div>
    );
  }
  
  
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markers = useRef([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Building data with coordinates
  const buildings = [
    {
      name: "Advanced Engineering Building",
      coordinates: [153.0117, -27.4983],
      id: "aeb",
      buildingId: "0049",
      color: "#8B5CF6"
    },
    {
      name: "Zelman Cowen Building",
      coordinates: [153.0131, -27.4975],
      id: "zelman",
      buildingId: "0051",
      color: "#3dfc17ff"
    },
    {
      name: "Chemistry Building",
      coordinates: [153.0138, -27.4978],
      id: "chemistry",
      buildingId: "0052",
      color: "#F59E0B"
    },
    {
      name: "Duhig Tower",
      coordinates: [153.0128, -27.4972],
      id: "duhig",
      buildingId: "0053",
      color: "#EF4444"
    },
    {
      name: "Forgan Smith Building",
      coordinates: [153.0122, -27.4977],
      id: "forgan",
      buildingId: "0054",
      color: "#3B82F6"
    },
    {
      name: "Goddard Building",
      coordinates: [153.0135, -27.4981],
      id: "goddard",
      buildingId: "0055",
      color: "#EC4899"
    }
  ];

  // Initialize map
  useEffect(() => {
    if (map.current) return; // Initialize map only once

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12', // 3D style with buildings
      center: [153.012, -27.497], // UQ St Lucia campus center
      zoom: 16,
      pitch: 60, // 3D tilt
      bearing: -20, // Rotation angle
      antialias: true // Smooth 3D rendering
    });

    // Wait for map to load before adding markers
    map.current.on('load', () => {
      setMapLoaded(true);
      
      // Add 3D buildings layer
      map.current.addLayer({
        'id': 'add-3d-buildings',
        'source': 'composite',
        'source-layer': 'building',
        'filter': ['==', 'extrude', 'true'],
        'type': 'fill-extrusion',
        'minzoom': 15,
        'paint': {
          'fill-extrusion-color': '#aaa',
          'fill-extrusion-height': [
            'interpolate',
            ['linear'],
            ['zoom'],
            15,
            0,
            15.05,
            ['get', 'height']
          ],
          'fill-extrusion-base': [
            'interpolate',
            ['linear'],
            ['zoom'],
            15,
            0,
            15.05,
            ['get', 'min_height']
          ],
          'fill-extrusion-opacity': 0.6
        }
      });
    });

    // Cleanup function
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Add markers when map is loaded
  useEffect(() => {
    if (!mapLoaded || !map.current) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add markers for each building
    buildings.forEach(building => {
      // Create custom marker element
      const markerElement = document.createElement('div');
      markerElement.className = 'campus-marker';
      markerElement.style.cssText = `
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background-color: ${building.color};
        border: 3px solid white;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        cursor: pointer;
        transition: all 0.3s ease;
        transform: ${selectedBuilding === building.name ? 'scale(1.5)' : 'scale(1)'};
      `;

      // Create popup content
      const facilityData = facilities.find(f => f.name === building.name);
      const popupContent = `
        <div class="p-3 min-w-[200px]">
          <h3 class="font-bold text-lg text-purple-700 mb-2">${building.name}</h3>
          ${facilityData ? `
            <div class="space-y-1 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">Energy:</span>
                <span class="font-medium">${facilityData.energy.toLocaleString()} GJ</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Cost:</span>
                <span class="font-medium">$${facilityData.cost.toLocaleString()}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Emissions:</span>
                <span class="font-medium">${facilityData.emissions} t CO2-e</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Consumption:</span>
                <span class="font-medium">${facilityData.consumption.toLocaleString()} kWh</span>
              </div>
            </div>
            <button class="mt-3 w-full px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm font-medium">
              View Energy Breakdown
            </button>
          ` : `
            <p class="text-gray-500 text-sm">Click to view energy data</p>
          `}
        </div>
      `;

      // Create popup
      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: true,
        closeOnClick: false,
        className: 'campus-popup'
      }).setHTML(popupContent);

      // Create marker WITHOUT popup to prevent movement
      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat(building.coordinates)
        .addTo(map.current);

      // Add click event to marker for immediate selection
      markerElement.addEventListener('click', (e) => {
        // Prevent default behavior that causes movement
        e.preventDefault();
        e.stopPropagation();
        
        // Use the buildingId directly from building data
        const buildingId = building.buildingId;
        console.log("Building clicked:", building.name, "ID:", buildingId);
        
        // Immediately trigger building selection
        onBuildingSelect && onBuildingSelect(building.name, buildingId);
      });

      markers.current.push(marker);
    });
  }, [mapLoaded, selectedBuilding, facilities, onBuildingSelect]);

  // Update marker styles when selectedBuilding changes
  useEffect(() => {
    markers.current.forEach((marker, index) => {
      const building = buildings[index];
      const element = marker.getElement();
      if (element) {
        const scale = selectedBuilding === building.name ? '1.5' : '1';
        element.style.transform = `scale(${scale})`;
        element.style.boxShadow = selectedBuilding === building.name 
          ? '0 6px 12px rgba(139, 92, 246, 0.4)' 
          : '0 4px 8px rgba(0,0,0,0.3)';
      }
    });
  }, [selectedBuilding]);

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700">
        <h3 className="text-white font-semibold text-lg">Campus 3D Map</h3>
        <p className="text-purple-100 text-sm">Click buildings to view energy data</p>
      </div>

      {/* Map Container */}
      <div className="relative">
        <div 
          ref={mapContainer} 
          className="w-full h-96"
          style={{ minHeight: '400px' }}
        />
        
        {/* Loading overlay */}
        {!mapLoaded && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
              <p className="text-gray-600 text-sm">Loading 3D campus map...</p>
            </div>
          </div>
        )}

        {/* Map controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <button 
            onClick={() => map.current?.flyTo({ center: [153.012, -27.497], zoom: 16, pitch: 60, bearing: -20 })}
            className="bg-white hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-md shadow-lg border text-sm font-medium transition-colors"
          >
            Reset View
          </button>
          <button 
            onClick={() => map.current?.flyTo({ pitch: map.current.getPitch() === 0 ? 60 : 0 })}
            className="bg-white hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-md shadow-lg border text-sm font-medium transition-colors"
          >
            Toggle 3D
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 py-3 bg-gray-50 border-t">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-600"></div>
            <span className="text-sm text-gray-600">Campus Buildings</span>
          </div>
          <div className="text-xs text-gray-500">
            {selectedBuilding ? `Selected: ${selectedBuilding}` : 'Click a building to select'}
          </div>
        </div>
      </div>

      {/* Custom CSS */}
      <style jsx>{`
        .campus-popup .mapboxgl-popup-content {
          padding: 0;
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.15);
        }
        .campus-popup .mapboxgl-popup-tip {
          border-top-color: white;
        }
        .campus-marker {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .campus-marker:hover {
          box-shadow: 0 6px 12px rgba(139, 92, 246, 0.4) !important;
        }
      `}</style>
    </div>
  );
};

export default Campus3DMap;