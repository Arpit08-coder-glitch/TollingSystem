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

const App = () => {;
  const mapRef = useRef(null); // Reference for the map
  const [trips, setTrips] = useState([]); // State to store trips array
  let [carMarker, setCarMarker] = useState(null);
  const [selectedTrip, setSelectedTrip] = useState(null); // To store the selected trip
  const [info, setInfo] = useState({
    totalDistance: 0,
    tollDistance: 0,
    tollCost: 0,
  });

  const WMS_BASE_URL = "http://gs.quantasip.com/geoserver/ne/wms"; // Base URL for GeoServer WMS
  const MAP_LAYERS = [
    { name: "Google Road Map", url: "http://mt0.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}" },
    { name: "Google Satellite Map", url: "http://mt0.google.com/vt/lyrs=s&hl=en&x={x}&y={y}&z={z}" },
  ];
  const WMS_LAYERS = [
    { layer: "ne:D2_Polygon", attribution: "GeoServer © QuantaSIP" },
    { layer: "ne:D4_Polygon", attribution: "GeoServer © QuantaSIP" },
  ];
  
  const initializeMap = (mapRef, fetchCoordinates) => {
    const map = L.map("map", {
      maxZoom: 80
    });
    mapRef.current = map;
  
    // Add base layers
    const baseLayers = {};
    MAP_LAYERS.forEach(({ name, url }) => {
      const layer = L.tileLayer(url, { maxZoom: 80, attribution: "© QuantaSIP", zIndex:100,});
      baseLayers[name] = layer;
      if (name === "Google Road Map") layer.addTo(map); // Default base layer
    });
  
    // Add layer control
    L.control.layers(baseLayers, null, { position: "bottomleft" }).addTo(map);
  
    // Add GeoServer WMS layers
    WMS_LAYERS.forEach(({ layer, attribution }) => {
  L.tileLayer.wms(WMS_BASE_URL, {
    layers: layer,
    format: "image/png",
    transparent: true,
    attribution,
    maxZoom: 80, // Set maximum zoom level to 80
    zIndex:400,
  }).addTo(map);
});  
    // Fetch and plot coordinates
    fetchCoordinates((coordinates) => startCarAnimation(coordinates, mapRef, setCarMarker, setTrips));
  
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
  const updateInfoBox = (
    totalDistance,
    tollDistance,
    tollCost,
    entryTime = "",
    exitTime = "",
    alertMessage = ""
  ) => {
    setInfo((prevInfo) => ({
      totalDistance,
      tollDistance,
      tollCost,
      entryTime: entryTime || prevInfo.entryTime,
      exitTime: exitTime || prevInfo.exitTime,
      alertMessage, // Update the alertMessage directly
    }));
  };
  const handleTripSelect = (trip) => {
    setSelectedTrip(trip); // Update selected trip
    highlightSelectedTrip(mapRef, trip, updateInfoBox); // Highlight the selected trip
  }; 
  return (
    <div className="relative h-screen w-full flex items-center justify-center">
      <Header/>
      {/* Map container */}
      <div
        id="map"
        className="w-[70%] h-[calc(100vh-48px)] mt-[100px] z-0"
      ></div>
        <Sidebar
         info={info} trips={trips} onTripSelect={handleTripSelect} // Pass the handleTripSelect function to Sidebar
      />
     
    </div>
  );
};
export default App;
