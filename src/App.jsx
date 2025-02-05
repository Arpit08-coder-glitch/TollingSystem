import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "font-awesome/css/font-awesome.min.css";
import "./index.css";
import { haversineDistance } from "./utils/haversineDistance";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import "leaflet-routing-machine";

const App = () => {;
  const mapRef = useRef(null); // Reference for the map
  let [featureCoordinates, setFeatureCoordinates] = useState([]);
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
      const layer = L.tileLayer(url, { maxZoom: 80, attribution: "© QuantaSIP" });
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
  }).addTo(map);
});

  
    // Fetch and plot coordinates
    fetchCoordinates();
  
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
  const fetchCoordinates = async () => {
    const url = `http://tolldata.quantasip.com/get-coordinates`;
    try {
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();

        // Map the received data to include [lat, lng, timestamp]
        featureCoordinates = data.map((coordinate) => {
          return [
            coordinate.gps_lat,
            coordinate.gps_long,
            coordinate.gps_timestamp,
          ]; // Map gps_lat, gps_long, and gps_timestamp
        });

        // Start car animation with the fetched coordinates
        startCarAnimation(featureCoordinates);
      } else {
        console.error("Error fetching coordinates");
      }
    } catch (error) {
      console.error("Error fetching coordinates:", error);
    }
  };
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
  const checkRouteIntersectionWithWMS = async (polyline) => {
    const wmsLayerUrl = "http://gs.quantasip.com/geoserver/ne/wms"; // GeoServer WMS URL
    const proxyUrl = "http://3.109.124.23:3000/proxy"; // Proxy to handle CORS
    const layers = ["ne:D2_Polygon", "ne:D4_Polygon"]; // Toll road layers
    let onTollRoad = false;
    let totalIntersectionDistance = 0;
  
    // Extract polyline coordinates as WKT LINESTRING
    const latLngs = polyline.getLatLngs();
    const wktCoordinates = latLngs.map(({ lat, lng }) => `${lng} ${lat}`).join(", ");
    const wktLineString = `LINESTRING(${wktCoordinates})`;
  
    // Iterate through the layers
    for (const layer of layers) {
      const WMSurl = `${wmsLayerUrl}?service=WFS&version=1.0.0&request=GetFeature&typeName=${layer}&outputFormat=application/json&cql_filter=INTERSECTS(geom, ${wktLineString})`;
      const url = `${proxyUrl}?url=${encodeURIComponent(WMSurl)}`;
  
      try {
        // Fetch the WFS response
        const response = await fetch(url);
        const responseText = await response.text(); // Get response as text
  
        if (response.headers.get("Content-Type").includes("application/json")) {
          // Parse JSON response
          const data = JSON.parse(responseText);
  
          // Check if there are intersecting features
          if (data.features && data.features.length > 0) {
            onTollRoad = true;
  
            // Iterate through each intersecting feature
            for (const feature of data.features) {
              if (feature.geometry.type === "MultiPolygon") {
                // Flatten all coordinates of the MultiPolygon
                const allCoordinates = feature.geometry.coordinates.flat(2);
  
                // Calculate the total intersection distance
                let featureIntersectionDistance = 0;
                for (let i = 0; i < allCoordinates.length - 1; i++) {
                  const [lon1, lat1] = allCoordinates[i];
                  const [lon2, lat2] = allCoordinates[i + 1];
                  featureIntersectionDistance += haversineDistance(lat1, lon1, lat2, lon2);
                }
  
                console.log(`Intersection distance for feature: ${featureIntersectionDistance} meters.`);
                totalIntersectionDistance += featureIntersectionDistance; // Add to total
              }
            }
  
            break; // Stop checking further if intersections are found
          }
        } else {
          console.error("Unknown response format:", responseText);
        }
      } catch (error) {
        console.error("Error checking route intersection with WMS:", error);
      }
    }
  
    if (onTollRoad) {
      console.log(`Total intersection distance: ${totalIntersectionDistance} meters.`);
    } else {
      console.log("No intersection found with toll roads.");
    }
    return { onTollRoad, totalIntersectionDistance };
  };
  const startCarAnimation = (coordinates) => {
    if (coordinates.length < 2) return;
  
    // Filter out invalid coordinates (those that are undefined, null, or out of valid range)
    const validCoordinates = coordinates.filter((coord) => {
      const lat = coord[0];
      const lon = coord[1];
      return (
        lat >= -90 &&
        lat <= 90 &&
        lon >= -180 &&
        lon <= 180 &&
        !(lat === 0 && lon === 0)
      );
    });
  
    // Initialize total distance, toll distance, toll cost, etc.

    let tripCounter = 1; // Initialize trip counter
    const tripsArray = []; // Array to store all the trips
    // Add car marker at the first valid coordinate
    const carIcon = L.divIcon({
      html: `
        <div class="bg-black w-8 h-8 rounded-full shadow-lg border-2 border-gray-400 hover:border-blue-500 hover:scale-125 transition-all duration-300 flex items-center justify-center">
            <i class="fas fa-car text-white text-sm"></i> 
        </div>`,
      iconSize: [30, 30], // Ensure the size matches the div's dimensions
      className: "",
    });
  
    // Initialize car marker at the first valid coordinate
    const carMarker = L.marker(validCoordinates[0], {
      icon: carIcon,
      zIndexOffset: 1000,
    }).addTo(mapRef.current);
    mapRef.current.setView(validCoordinates[0], 15); // Adjust zoom level (15) for ~2 km radius
    setCarMarker(carMarker);
  
    for (let i = 0; i < validCoordinates.length - 1; i++) {
      const [lat1, lon1] = validCoordinates[i];
      const [lat2, lon2] = validCoordinates[i + 1];
  
      // Calculate the distance between consecutive points
      const distance = haversineDistance(lat1, lon1, lat2, lon2);
  
      // Only add the trip if the distance is greater than 1.5 km
      if (distance > 0.0) {
        tripsArray.push({
          tripName: `Trip ${tripCounter}`,
          from: validCoordinates[i],
          to: validCoordinates[i + 1],
          distance: distance, // Store the distance for reference
        });
  
        // Increment the trip counter for the next trip
        tripCounter++;
      }
    }
     // Set trips state to the updated tripsArray
     setTrips(tripsArray);

  
    // Set car marker at the last valid coordinate
    carMarker.setLatLng(validCoordinates[validCoordinates.length - 1]);
    mapRef.current.setView(validCoordinates[validCoordinates.length - 1], 15); // Adjust zoom level (15) for ~2 km radius
  };
  const getEntryTimeFromAPI = async (lat, lon) => {
    const apiUrl = "http://tolldata.quantasip.com/get-coordinates"; // API URL
    try {
      const response = await fetch(apiUrl);
      const data = await response.json(); // Parse the JSON response
  
      // Iterate over the API response to check for matching coordinates
      for (const entry of data) {
        const apiLat = entry.gps_lat;
        const apiLon = entry.gps_long;
  
        // Check if the coordinates are within a certain tolerance (e.g., 0.0001 degrees)
        if (Math.abs(lat - apiLat) < 0.0001 && Math.abs(lon - apiLon) < 0.0001) {
          // If coordinates match, convert the timestamp to a readable date-time format
          const entryTimestamp = new Date(parseInt(entry.gps_timestamp));
  
          // Format the date as MM/DD/YYYY
          const date = entryTimestamp.toLocaleDateString();
  
          // Format the time as HH:MM:SS
          const time = entryTimestamp.toLocaleTimeString();
  
          // Return both date and time as a single string
          return `${date} ${time}`;
        }
      }
      // If no match found, return null or some default value
      console.log("No matching coordinates found.");
      return null;
  
    } catch (error) {
      console.error("Error fetching coordinates from API:", error);
      return null;
    }
  };
  const highlightSelectedTrip = async (trip) => {
    if (!trip || !trip.from || !trip.to) return; // Ensure the trip is valid
  
    const { from, to } = trip;
  
    // Remove the previous start and end markers if they exist
    if (mapRef.current.startMarker) {
      mapRef.current.startMarker.remove();
    }
    if (mapRef.current.endMarker) {
      mapRef.current.endMarker.remove();
    }
    if (mapRef.current.polyline) {
      mapRef.current.polyline.remove(); // Remove existing polyline
    }
  
    // Create a polyline from start to end points
    const polyline = L.polyline([from, to], {
      color: "blue",
      weight: 5,
      opacity: 1,
    }).addTo(mapRef.current);
  
    // Store reference for future removal
    mapRef.current.polyline = polyline;
  
    // Calculate the total distance using the Haversine formula
    const totalDistance = haversineDistance(from[0], from[1], to[0], to[1]).toFixed(2); // Distance in km

    // Track toll distances and costs
    let tollDistance = 0;
    let tollCost = 0;
    let enteredTollRoad = false;
    let entry= await getEntryTimeFromAPI(from[0], from[1]); // Initialize entry time
    let exit= await getEntryTimeFromAPI(to[0], to[1]); // Initialize exit time
  
    // Check if the polyline intersects with a toll road
    const { onTollRoad, totalIntersectionDistance } = await checkRouteIntersectionWithWMS(polyline);
    tollDistance = totalIntersectionDistance / 1000; // Convert meters to km
    tollCost = tollDistance * 2; // ₹2/km
    if (onTollRoad) {
      console.log(`The polyline intersects with a toll road. Distance: ${totalIntersectionDistance} meters.`);
    } else {
      console.log("The polyline does not intersect with any toll road.");
    }
  
    console.log(`Total Distance: ${totalDistance} km`);
    // Handle toll road logic
    if (onTollRoad) {
      enteredTollRoad = true;
      console.log(`Entered toll road at: ${entry}, distance: ${tollDistance} km`);
    } else if (enteredTollRoad) {
      enteredTollRoad = false;
      console.log(`Exited toll road at: ${exit}`);
    }
    // Update your info box with toll info
    updateInfoBox(totalDistance, tollDistance, tollCost, entry, exit);
  
    // Add Start and End Markers
    const pointerIcon = L.divIcon({
      html: `<div class="bg-blue-500 w-4 h-4 rounded-full"></div>`, // Blue dot as pointer
      iconSize: [10, 10],
      className: "",
    });
  
    const startMarker = L.marker(from, {
      icon: pointerIcon,
      zIndexOffset: 1,
    })
      .addTo(mapRef.current)
      .bindPopup(
        `
          <div>
            <strong>Latitude:</strong> ${from[0]}<br>
            <strong>Longitude:</strong> ${from[1]}<br>
            <strong>Timestamp:</strong> ${entry}
          </div>`
      );
  
    const endMarker = L.marker(to, {
      icon: pointerIcon,
      zIndexOffset: 1,
    })
      .addTo(mapRef.current)
      .bindPopup(
        `
          <div>
            <strong>Latitude:</strong> ${to[0]}<br>
            <strong>Longitude:</strong> ${to[1]}<br>
            <strong>Timestamp:</strong> ${exit}
          </div>`
      );
  
    // Store references for later removal
    mapRef.current.startMarker = startMarker;
    mapRef.current.endMarker = endMarker;
  };
  const handleTripSelect = (trip) => {
    setSelectedTrip(trip); // Update selected trip
    highlightSelectedTrip(trip); // Highlight the selected trip
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
