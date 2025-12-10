import React from "react";
import { useNavigate } from "react-router-dom";

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/signin");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <nav className="bg-white shadow p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-blue-600">UnivTalk</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
        >
          Logout
        </button>
      </nav>

      <div className="flex-1 flex flex-col justify-center items-center text-center px-4">
        <h2 className="text-3xl font-bold mb-4">
          Welcome to Your Homepage 🎉
        </h2>
        <p className="text-gray-700 max-w-xl">
          You are successfully logged in. From here, you can explore features,
          join university discussions, and connect with other students.
        </p>

        <button
          onClick={() => alert("Coming soon!")}
          className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition"
        >
          Explore Features
        </button>
      </div>
    </div>
  );
};

export default HomePage;
