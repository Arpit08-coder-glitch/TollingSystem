import { startCarAnimation } from "./startCarAnimation";

export const fetchCoordinates = async () => {
  let [featureCoordinates, setFeatureCoordinates] = useState([]);
    const url = `http://tolldata.quantasip.com/get-coordinates`;
    try {
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
  
        // Map the received data to include [lat, lng, timestamp]
        featureCoordinates = data.map(coordinate => {
          return [coordinate.gps_lat, coordinate.gps_long, coordinate.gps_timestamp]; // Map gps_lat, gps_long, and gps_timestamp
        });
  
        // Start car animation with the fetched coordinates
        startCarAnimation(featureCoordinates);
      } else {
        console.error('Error fetching coordinates');
      }
    } catch (error) {
      console.error('Error fetching coordinates:', error);
    }
  };