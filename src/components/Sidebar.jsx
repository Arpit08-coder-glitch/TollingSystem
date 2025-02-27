import React, { useState } from "react";

const Sidebar = ({ info, onTripSelect, onPOints }) => {
  const [vehicleNumber] = useState("ABC1234");
  const [selectedDate, setSelectedDate] = useState("");

  // Handle Date Change
  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  // Convert selected date to start and end timestamps of that day
  const getStartEndTimestamps = (dateString) => {
    const date = new Date(dateString);
    const startOfDay = new Date(date.setHours(0, 0, 0, 0)).getTime();
    const endOfDay = new Date(date.setHours(23, 59, 59, 999)).getTime();
    return { startOfDay, endOfDay };
  };

  const handleAllHistory = () => {
    if (selectedDate) {
      const { startOfDay, endOfDay } = getStartEndTimestamps(selectedDate);
      onPOints(startOfDay, endOfDay);
    } else {
      alert("Please select a date first.");
    }
  };
  const handleSearch = () => {
    if (selectedDate) {
      const { startOfDay, endOfDay } = getStartEndTimestamps(selectedDate);
      onTripSelect(startOfDay, endOfDay);
    } else {
      alert("Please select a date first.");
    }
  };
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

      {/* History Buttons */}
      <div className="flex justify-center gap-4">
        <button
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-all"
          onClick={handleSearch}
        >
          Day History
        </button>
        <button
          className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-all"
          onClick={handleAllHistory}
        >
          All History
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
