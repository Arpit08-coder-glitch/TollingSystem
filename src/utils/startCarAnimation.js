import L from "leaflet";
import { haversineDistance } from "./haversineDistance";

export const startCarAnimation = (coordinates, mapRef, setCarMarker, setTrips) => {
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
      if (distance > 0.75) {
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
