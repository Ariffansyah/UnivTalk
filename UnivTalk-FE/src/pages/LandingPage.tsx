import React from "react";

const LandingPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-400 to-purple-600 text-white">
      <h1 className="text-5xl font-bold mb-4">Welcome to My App</h1>
      <p className="text-xl mb-8">
        This is a simple landing page built with React and Tailwind CSS.
      </p>
      <button className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg shadow-md hover:bg-gray-100 transition">
        Get Started
      </button>
    </div>
  );
};

export default LandingPage;
