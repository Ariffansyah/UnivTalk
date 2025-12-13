import React from "react";
import { Link } from "react-router-dom";

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-500 via-yellow-100 to-white px-4">
      <div className="bg-white bg-opacity-90 rounded-xl shadow-xl px-10 py-12 flex flex-col items-center max-w-md w-full">
        <h1 className="text-7xl font-extrabold text-blue-600 mb-2 drop-shadow-lg select-none">
          404
        </h1>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Page Not Found
        </h2>
        <p className="text-gray-600 text-base mb-6 text-center">
          The page you’re looking for doesn’t exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 shadow-md transition"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
