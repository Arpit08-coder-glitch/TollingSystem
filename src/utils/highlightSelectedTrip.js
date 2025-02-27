import L from "leaflet";

export const highlightSelectedTrip = async (mapRef, startTimeStamp, endTimeStamp) => {
  let featureCoordinates2;
  
  const url = `https://vts.quantasip.com/vts/interval-gps-data?start_time=${startTimeStamp}&end_time=${endTimeStamp}`;

  try {
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      featureCoordinates2 = data.map((coordinate) => {
        return {
          lat: coordinate.latitude,
          lon: coordinate.longitude,
          timestamp: coordinate.timestamp,
        };
      });
    } else {
      console.error("Error fetching coordinates");
    }
  } catch (error) {
    console.error("Error fetching coordinates:", error);
  }

  if (featureCoordinates2 && featureCoordinates2.length > 0) {
    // Create waypoints by accessing latitude and longitude
    const waypoints = featureCoordinates2.map(coord => L.latLng(coord.lat, coord.lon));

    // Clear existing route (if any)
    if (mapRef.current.routingControl) {
      mapRef.current.routingControl.getPlan().setWaypoints([]); // Clear waypoints
      mapRef.current.removeControl(mapRef.current.routingControl); // Properly remove control
      mapRef.current.routingControl = null; // Reset the reference
    }

    // Clear existing markers
    if (mapRef.current.routeMarkers) {
      mapRef.current.routeMarkers.forEach(marker => mapRef.current.removeLayer(marker));
      mapRef.current.routeMarkers = [];
    }
    if (mapRef.current.markers) {
      mapRef.current.markers.forEach(marker => marker.remove());
      mapRef.current.markers = [];
    } else {
      mapRef.current.markers = [];
    }

    // Create a new route using Leaflet Routing Machine without instructions
    mapRef.current.routingControl = L.Routing.control({
      waypoints: waypoints,
      routeWhileDragging: true,
      showAlternatives: true,
      altLineOptions: {
        styles: [{ color: 'black', opacity: 0.15, weight: 9 }]
      },
      createMarker: () => null,  // No markers for waypoints
      lineOptions: {
        styles: [{ color: '#ff0000', weight: 4 }]
      },
      router: L.Routing.osrmv1({
        show: false  // Hide instructions
      })
    }).addTo(mapRef.current);

    // Store markers for easy removal later
    mapRef.current.routeMarkers = [];

    // Add popups with timestamp conversion
    featureCoordinates2.forEach((coord) => {
      const date = new Date(parseInt(coord.timestamp));
      const formattedDate = date.toLocaleString();

      const marker = L.marker([coord.lat, coord.lon])
        .addTo(mapRef.current)
        .bindPopup(`
          <div>
            <strong>Latitude:</strong> ${coord.lat}<br>
            <strong>Longitude:</strong> ${coord.lon}<br>
            <strong>Timestamp:</strong> ${formattedDate}
          </div>
        `);

      // Store marker for future clearing
      mapRef.current.routeMarkers.push(marker);
    });

    // Fit map bounds to the route
    const bounds = L.latLngBounds(waypoints);
    mapRef.current.fitBounds(bounds);
  } else {
    console.error("No coordinates available for routing");
  }
};
