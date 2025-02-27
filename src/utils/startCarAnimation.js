import L from "leaflet";
import { haversineDistance } from "./haversineDistance";

export const startCarAnimation = (coordinates, mapRef, setCarMarker) => {
  if (coordinates.length < 2) return;

  // Filter out invalid coordinates
  const validCoordinates = coordinates.filter((coord) => {
    const lat = coord.lat;
    const lon = coord.lon;
    return (
      lat >= -90 &&
      lat <= 90 &&
      lon >= -180 &&
      lon <= 180 &&
      !(lat === 0 && lon === 0)
    );
  });

  let tripCounter = 1;
  const tripsArray = [];

  // Create car icon
  const carIcon = L.divIcon({
    html: `
      <div class="bg-black w-8 h-8 rounded-full shadow-lg border-2 border-gray-400 hover:border-blue-500 hover:scale-125 transition-all duration-300 flex items-center justify-center">
          <i class="fas fa-car text-white text-sm"></i> 
      </div>`,
    iconSize: [30, 30],
    className: "",
  });

  // Initialize car marker at the first valid coordinate
  const firstCoord = [validCoordinates[0].lat, validCoordinates[0].lon];
  const carMarker = L.marker(firstCoord, {
    icon: carIcon,
    zIndexOffset: 1000,
  }).addTo(mapRef.current);
  mapRef.current.setView(firstCoord, 15);
  setCarMarker(carMarker);

  // Loop through coordinates and calculate trips
  for (let i = 0; i < validCoordinates.length - 1; i++) {
    const lat1 = validCoordinates[i].lat;
    const lon1 = validCoordinates[i].lon;
    const lat2 = validCoordinates[i + 1].lat;
    const lon2 = validCoordinates[i + 1].lon;

    // Calculate the distance between consecutive points
    const distance = haversineDistance(lat1, lon1, lat2, lon2);

    // Only add the trip if the distance is greater than 1.5 km
    if (distance > 0) {
      tripsArray.push({
        tripName: `Trip ${tripCounter}`,
        from: [lat1, lon1],
        to: [lat2, lon2],
        distance: distance,
      });
      tripCounter++;
    }
  }

  console.log(tripsArray);

  // Add popups with lat, lon, and timestamp
  validCoordinates.forEach((coord) => {

    // Convert timestamp to human-readable date and time
    const date = new Date(parseInt(coord.timestamp));
    const formattedTime = date.toLocaleString();

    // Create a popup for each coordinate
    const popupContent = `
      <div>
        <b>Latitude:</b> ${coord.lat.toFixed(6)}<br>
        <b>Longitude:</b> ${coord.lon.toFixed(6)}<br>
        <b>Time:</b> ${formattedTime}
      </div>
    `;

    // Bind popup to each coordinate
    carMarker
      .bindPopup(popupContent)
      .addTo(mapRef.current);
  });

  // Set car marker at the last valid coordinate
  const lastCoord = [validCoordinates[validCoordinates.length - 1].lat, validCoordinates[validCoordinates.length - 1].lon];
  carMarker.setLatLng(lastCoord);
  mapRef.current.setView(lastCoord, 15);
};