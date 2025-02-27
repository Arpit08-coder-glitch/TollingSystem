import React from "react";

const Header = () => {
  return (
    <div className="absolute top-0 left-0 w-full bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white py-2 shadow-lg z-10">
      <div className="flex items-center justify-between px-8">
        {/* Logo Section */}
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-2 rounded-full shadow-md">
            <span className="text-white text-3xl font-bold">🚗</span>
          </div>
          <h1 className="text-2xl font-bold tracking-wide uppercase">
            Vehicle Tracking System
          </h1>
        </div>
        {/* CTA Button */}
        <div>
          <button className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded-lg shadow-lg transition-all duration-300">
            Contact Us
          </button>
        </div>
      </div>

      {/* Sub-header Line */}
      <div className="w-full h-[2px] bg-gradient-to-r from-yellow-500 to-orange-500 mt-2"></div>
    </div>
  );
};

export default Header;
