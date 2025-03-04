export const getEntryTimeFromAPI = async (lat, lon) => {
    const apiUrl = "https://vts.quantasip.com/vts/interval-gps-data?start_time=1740547743652&end_time=1740548569652"; // API URL
    try {
      const response = await fetch(apiUrl);
      const data = await response.json(); // Parse the JSON response
  
      // Iterate over the API response to check for matching coordinates
      for (const entry of data) {
        const apiLat = entry.latitude;
        const apiLon = entry.longitude;
  
        // Check if the coordinates are within a certain tolerance (e.g., 0.0001 degrees)
        if (Math.abs(lat - apiLat) < 0.0001 && Math.abs(lon - apiLon) < 0.0001) {
          // If coordinates match, convert the timestamp to a readable date-time format
          const entryTimestamp = new Date(parseInt(entry.timestamp));
  
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