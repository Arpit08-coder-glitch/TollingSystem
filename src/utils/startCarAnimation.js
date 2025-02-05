export const startCarAnimation = (coordinates) => {
  if (coordinates.length < 2) return;

  // Filter out invalid coordinates (those that are undefined, null, or out of valid range)
  const validCoordinates = coordinates.filter(coord => {
    const lat = coord[0];
    const lon = coord[1];
    return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180 && !(lat === 0 && lon === 0);
  });

  // Initialize total distance
  let totalDistance = 0;
  let tollDistance = 0;
  let tollCost = 0;
  let enteredTollRoad = false;
  let entry = ""; // Initialize entry time
  let exit = ""; // Initialize exit time

  // Add car marker at the first valid coordinate
  const carIcon = L.divIcon({
    html: `
        <div class="bg-black w-8 h-8 rounded-full shadow-lg border-2 border-gray-400 hover:border-blue-500 hover:scale-125 transition-all duration-300 flex items-center justify-center">
            <i class="fas fa-car text-white text-sm"></i> 
        </div>`,
    iconSize: [30, 30], // Ensure the size matches the div's dimensions
    className: '',
  });

  // Initialize car marker at the first valid coordinate
  const carMarker = L.marker(validCoordinates[0], { icon: carIcon, zIndexOffset: 1000 }).addTo(mapRef.current);
  mapRef.current.setView(validCoordinates[0], 15); // Adjust zoom level (15) for ~2 km radius
  setCarMarker(carMarker);
  // Add a pointer marker at each valid coordinate with a popup
  validCoordinates.forEach((coord) => {
    const [lat, lon, timestamp] = coord;

    // Pointer icon
    const pointerIcon = L.divIcon({
      html: `<div class="bg-blue-500 w-4 h-4 rounded-full"></div>`, // Blue dot as pointer
      iconSize: [1, 1],
      className: '',
    });

    // Add marker with popup showing lat, lng, and timestamp
    L.marker([lat, lon], { icon: pointerIcon, zIndexOffset: 1 })
      .addTo(mapRef.current)
      .bindPopup(`
        <div>
          <strong>Latitude:</strong> ${lat}<br>
          <strong>Longitude:</strong> ${lon}<br>
          <strong>Timestamp:</strong> ${timestamp || 'N/A'}<br>
        </div>
      `)
      .on('click', function (e) {
        this.openPopup(); // Open popup on click
      });
  });
  const pathPolyline = L.polyline(validCoordinates, {
    color: 'blue',
    weight: 5,
    opacity: 0.7
  }).addTo(mapRef.current);  // Adding polyline to the map

  // Function to calculate the cumulative distance between all consecutive coordinates
  for (let i = 0; i < validCoordinates.length - 1; i++) {
    const [lat1, lon1] = validCoordinates[i];
    const [lat2, lon2] = validCoordinates[i + 1];

    // Calculate distance between consecutive coordinates
    const distance = haversineDistance(lat1, lon1, lat2, lon2);
    totalDistance += distance;

    // Check if the current position is on any highlighted toll road
    let onTollRoad = checkTollIntersection(lat1, lon1); // Check if current point is on a toll road; // Check if current point is on a toll road
    let alertMessage = "";

    // Handle toll road logic
    if (onTollRoad && !enteredTollRoad) {
      enteredTollRoad = true;
      entry = new Date().toLocaleTimeString();
      tollDistance += distance;
      tollCost += distance * 2; // ₹2/km
      alertMessage = "You have entered the toll road.";
    } else if (!onTollRoad && enteredTollRoad) {
      enteredTollRoad = false;
      exit = new Date().toLocaleTimeString();
      alertMessage = "You have exited the toll road.";
    } else if (onTollRoad) {
      tollDistance += distance;
      tollCost += distance * 2; // ₹2/km
      alertMessage = "You are On Toll Road!";
    }

    // Update info box with the current distance and status
    updateInfoBox(totalDistance, tollDistance, tollCost, entry, exit, alertMessage);
  }

  // Set car marker at the last valid coordinate
  carMarker.setLatLng(validCoordinates[validCoordinates.length - 1]);
  mapRef.current.setView(validCoordinates[validCoordinates.length - 1], 15); // Adjust zoom level (15) for ~2 km radius
};