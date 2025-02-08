import L from "leaflet";
import { haversineDistance } from "./haversineDistance";
import { getEntryTimeFromAPI } from "./getEntryTimeFromAPI";
import { checkRouteIntersectionWithWMS } from "./checkRouteIntersectionWithWMS";

export const highlightSelectedTrip = async (mapRef, trip, updateInfoBox) => {
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
     tollDistance = totalIntersectionDistance; // Convert meters to km
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
