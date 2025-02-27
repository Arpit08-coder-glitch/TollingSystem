export const fetchCoordinates = async (startCarAnimation) => {
  const url = `https://vts.quantasip.com/vts/interval-gps-data?start_time=1740547743652&end_time=1740548569652`;
  try {
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();

      // Map the received data to include all details
      const featureCoordinates = data.map((coordinate) => {
        return {
          lat: coordinate.latitude,
          lon: coordinate.longitude,
          timestamp: coordinate.timestamp,
          ...coordinate, // Include all other properties from the API response
        };
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
