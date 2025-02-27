import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "font-awesome/css/font-awesome.min.css";
import "./index.css";
import { highlightSelectedTrip } from "./utils/highlightSelectedTrip";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import { fetchCoordinates } from "./utils/fetchCoordinates";
import "leaflet-routing-machine";
import { startCarAnimation } from "./utils/startCarAnimation";
import { highlightPoints } from "./utils/highlightPoints";

const App = () => {
  ;
  const mapRef = useRef(null); // Reference for the map
  let [carMarker, setCarMarker] = useState(null);
  const [info, setInfo] = useState({
    totalDistance: 0,
    tollDistance: 0,
    tollCost: 0,
  });
  const MAP_LAYERS = [
    { name: "Google Road Map", url: "http://mt0.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}" },
    { name: "Google Satellite Map", url: "http://mt0.google.com/vt/lyrs=s&hl=en&x={x}&y={y}&z={z}" },
  ];
  const initializeMap = (mapRef, fetchCoordinates) => {
    const map = L.map("map", {
      maxZoom: 100
    });
    mapRef.current = map;
    // Add base layers
    const baseLayers = {};
    MAP_LAYERS.forEach(({ name, url }) => {
      const layer = L.tileLayer(url, { maxZoom: 100, attribution: "© QuantaSIP", zIndex: 100, });
      baseLayers[name] = layer;
      if (name === "Google Road Map") layer.addTo(map); // Default base layer
    });
    // Add layer control
    L.control.layers(baseLayers, null, { position: "bottomleft" }).addTo(map);
    // Fetch and plot coordinates
    fetchCoordinates((coordinates) => startCarAnimation(coordinates, mapRef, setCarMarker));

    return map;
  };
  useEffect(() => {
    // Initialize the map and layers
    const map = initializeMap(mapRef, fetchCoordinates);

    return () => {
      // Cleanup: Remove map instance and references
      map.remove();
    };
  }, []);
  // Fetch the coordinates from the API
  // Update info box

  const handleTripSelect = (startTimestamp, endTimestamp) => {
    console.log("Day History:", startTimestamp, endTimestamp);
    // Use the timestamps to fetch and highlight the selected trip
    highlightSelectedTrip(mapRef, startTimestamp, endTimestamp);
  };
  
  const allHistory = (startTimestamp, endTimestamp) => {
    console.log("All History:", startTimestamp, endTimestamp);
    // Use the timestamps to highlight points for all history
    highlightPoints(mapRef, startTimestamp, endTimestamp);
  };
  return (
    <div className="relative h-screen w-full flex items-center justify-center">
      <Header />
      {/* Map container */}
      <div
        id="map"
        className="w-[70%] h-[calc(100vh-48px)] mt-[100px] z-0"
      ></div>
      <Sidebar
        info={info} onTripSelect={handleTripSelect} // Pass the handleTripSelect function to Sidebar
        mapRef={mapRef} // Pass mapRef to Sidebar
        onPOints = {allHistory}
      />

    </div>
  );
};
export default App;
