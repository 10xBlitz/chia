import React from "react";

const Loading: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="flex flex-col items-center">
      <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin mb-4"></div>
      <span className="text-lg font-semibold text-gray-700">
        로딩 중 {/**Loading... */}
      </span>
    </div>
  </div>
);

export default Loading;
