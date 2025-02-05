import React, { useState } from "react";

const Sidebar = ({ info, trips, onTripSelect }) => {
  const [vehicleNumber] = useState("ABC1234");
  const [selectedTrip, setSelectedTrip] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  // Convert timestamp to date format (YYYY-MM-DD)
  const formatDate = (timestamp) => {
    return new Date(parseInt(timestamp)).toISOString().split("T")[0];
  };

  // Handle Date Change
  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    setSelectedTrip(""); // Reset selected trip when changing date
  };

  // Handle Trip Change
  const handleTripChange = (e) => {
    setSelectedTrip(e.target.value);
  };

  // Handle Search Button Click
  const handleSearch = () => {
    const selectedTripIndex = parseInt(selectedTrip.replace("Trip ", "")) - 1;
    const trip = filteredTrips[selectedTripIndex]; // Find the actual trip
    onTripSelect(trip);
  };

  // Filter trips by selected date
  const filteredTrips = selectedDate
    ? trips.filter((trip) => formatDate(trip.to[2]) === selectedDate)
    : [];

  return (
    <div className="w-full sm:w-[30%] h-[calc(100vh-48px)] mt-[120px] bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white p-6 z-10 overflow-y-auto shadow-lg">
      <h3 className="text-3xl font-extrabold mb-6 text-center tracking-widest text-gradient">
        Vehicle Details
      </h3>

      {info.alertMessage && (
        <div className="text-sm font-bold text-red-500 bg-red-900/20 p-3 mb-6 rounded-lg shadow-md text-center">
          {info.alertMessage}
        </div>
      )}

      {/* Date Selector */}
      <div className="mb-6">
        <label className="block text-lg font-semibold mb-2">Select a Date</label>
        <input
          type="date"
          className="w-full p-3 rounded-lg bg-gray-800 text-white shadow-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
          value={selectedDate}
          onChange={handleDateChange}
        />
      </div>

      {/* Trip Selector */}
      <div className="mb-6">
        <label className="block text-lg font-semibold mb-2">Select a Trip</label>
        <div className="flex items-center gap-2">
          <select
            className="w-full p-3 rounded-lg bg-gray-800 text-white shadow-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            value={selectedTrip}
            onChange={handleTripChange}
          >
            <option value="" disabled>
              Choose a Trip
            </option>
            {filteredTrips.length > 0 ? (
              filteredTrips.map((_, i) => (
                <option key={i} value={`Trip ${i + 1}`}>
                  Trip {i + 1}
                </option>
              ))
            ) : (
              <option disabled>No Trips Available</option>
            )}
          </select>
          <button
            className="px-5 py-3 bg-yellow-500 text-black font-semibold rounded-lg shadow-md hover:bg-yellow-600 transition-all"
            onClick={handleSearch}
            disabled={!selectedTrip}
          >
            Search
          </button>
        </div>
      </div>

      {/* Vehicle Details */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6 text-center">
        <div>
          <p className="text-lg text-white/70">Vehicle Number</p>
          <span className="text-xl font-semibold">{vehicleNumber}</span>
        </div>
        <div>
          <p className="text-lg text-white/70">Vehicle Type</p>
          <span className="text-xl font-semibold">XUV</span>
        </div>
        <div>
          <p className="text-lg text-white/70">Current Speed</p>
          <span className="text-xl font-semibold">55 km/h</span>
        </div>
      </div>

      {/* Statistics */}
      <div className="space-y-4 border-t border-gray-700 pt-4">
        <div className="flex justify-between items-center">
          <p className="text-lg text-white/70">Total Distance</p>
          <span className="text-xl font-bold">{info.totalDistance} km</span>
        </div>
        <div className="flex justify-between items-center">
          <p className="text-lg text-white/70">Toll Distance</p>
          <span className="text-xl font-bold">{info.tollDistance.toFixed(2)} km</span>
        </div>
        <div className="flex justify-between items-center">
          <p className="text-lg text-white/70">Toll Cost</p>
          <span className="text-xl font-bold">₹{info.tollCost.toFixed(2)}</span>
        </div>
      </div>

      {/* Timestamps */}
      <div className="mt-6 border-t border-gray-700 pt-4">
        <div className="flex justify-between items-center mb-3">
          <p className="text-lg text-white/70">Entry Time</p>
          <span className="text-sm font-medium">{info.entryTime || "-"}</span>
        </div>
        <div className="flex justify-between items-center">
          <p className="text-lg text-white/70">Exit Time</p>
          <span className="text-sm font-medium">{info.exitTime || "-"}</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
