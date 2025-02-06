import { haversineDistance } from "./haversineDistance";
export const checkRouteIntersectionWithWMS = async (polyline) => {
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