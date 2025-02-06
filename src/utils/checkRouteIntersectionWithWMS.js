import { haversineDistance } from "./haversineDistance";
import * as turf from "@turf/turf"; // Ensure you install Turf.js

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

    // Convert polyline to Turf.js format
    const routeLine = turf.lineString(latLngs.map(({ lat, lng }) => [lng, lat]));

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

                    // Store intersection points by feature ID
                    const featureIntersections = {};

                    for (const feature of data.features) {
                        const featureId = feature.id; // Get feature ID

                        if (feature.geometry.type === "MultiPolygon") {
                            // Convert the MultiPolygon to a Turf.js polygon
                            const polygon = turf.multiPolygon(feature.geometry.coordinates);

                            // Check if the start and end points of the polyline are inside or intersecting the polygon
                            const startPoint = turf.point([latLngs[0].lng, latLngs[0].lat]);
                            const endPoint = turf.point([latLngs[latLngs.length - 1].lng, latLngs[latLngs.length - 1].lat]);

                            const startInside = turf.booleanWithin(startPoint, polygon) || turf.booleanIntersects(startPoint, polygon);
                            const endInside = turf.booleanWithin(endPoint, polygon) || turf.booleanIntersects(endPoint, polygon);

                            if (startInside && endInside) {
                                // If both start and end points are inside or intersecting, set the total distance equal to polyline length
                                const polylineLength = turf.length(routeLine, { units: "kilometers" });
                                totalIntersectionDistance = polylineLength;
                                console.log(`Both start and end points are inside or intersecting the polygon. Total distance: ${totalIntersectionDistance.toFixed(2)} km`);
                                break;
                            }

                            // Otherwise, find intersection points
                            const intersections = turf.lineIntersect(routeLine, polygon);

                            // Store only the intersection points
                            if (!featureIntersections[featureId]) {
                                featureIntersections[featureId] = { intersections: [], inside: [] };
                            }

                            // Add intersection points to feature
                            featureIntersections[featureId].intersections.push(...intersections.features.map(f => f.geometry.coordinates));

                            // Check if the polyline is fully inside the polygon using turf.booleanWithin
                            if (turf.booleanWithin(routeLine, polygon)) {
                                featureIntersections[featureId].inside.push('inside');
                            }
                        }
                    }

                    // Process each feature's intersection points and inside information
                    for (const [featureId, data] of Object.entries(featureIntersections)) {
                        if (data.intersections.length > 1) {
                            // Calculate the total intersection distance between each consecutive point
                            let featureIntersectionDistance = 0;
                            for (let i = 0; i < data.intersections.length - 1; i++) {
                                const firstPoint = data.intersections[i];
                                const secondPoint = data.intersections[i + 1];

                                // Calculate distance between consecutive intersection points
                                featureIntersectionDistance += haversineDistance(
                                    firstPoint[1], firstPoint[0], // Lat, Lon of first point
                                    secondPoint[1], secondPoint[0]   // Lat, Lon of second point
                                );
                            }

                            // Convert to kilometers
                            featureIntersectionDistance = featureIntersectionDistance;

                            console.log(`Feature ID: ${featureId}`);
                            console.log(`Intersection Points:`, data.intersections);
                            console.log(`Distance between consecutive intersection points: ${featureIntersectionDistance.toFixed(2)} km`);

                            totalIntersectionDistance += featureIntersectionDistance; // Add to total
                        }

                        if (data.inside.length > 0) {
                            console.log(`Feature ID: ${featureId} - Polyline is inside the polygon.`);
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
        console.log(`Total intersection distance: ${totalIntersectionDistance.toFixed(2)} km.`);
    } else {
        console.log("No intersection found with toll roads.");
    }

    return { onTollRoad, totalIntersectionDistance };
};
