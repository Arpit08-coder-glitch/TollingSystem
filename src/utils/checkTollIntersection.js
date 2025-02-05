export const checkTollIntersection = (lat, lon) => {
  let onTollRoad = false;
  const wmsLayerUrl = "http://gs.quantasip.com/geoserver/ne/wms"; // Your GeoServer WMS URL

  // Layers to check
  const layers = ["ne:D2_Polygon", "ne:D4_Polygon"]; // The two toll road layers

  // Iterate through both layers and check if the point is on any of the toll roads
  layers.forEach((layer) => {
      // Build the GetFeatureInfo URL manually
      const WMSurl = `${wmsLayerUrl}?service=WMS&version=1.1.1&request=GetFeatureInfo&layers=${layer}&bbox=${mapRef.current.getBounds().toBBoxString()}&width=1&height=1&srs=EPSG:4326&x=0&y=0&info_format=application/json`;
      const url=`http://3.109.124.23:3000/proxy?url=${encodeURIComponent(WMSurl)}`;

      // Fetch the WMS GetFeatureInfo
      fetch(url)
      .then((response) => {
          // Check if the response is XML
          return response.text(); // Get response as text (XML)
      })
      .then((data) => {
          // Parse XML response
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(data, "application/xml");

          // Check if there are features in the XML response
          const features = xmlDoc.getElementsByTagName("Feature");
          if (features.length > 0) {
              onTollRoad = true; // Set onTollRoad to true if features are found
          }
      })
      .catch((error) => {
          console.error("Error fetching coordinates:", error);
      });
  });

  return onTollRoad;
};