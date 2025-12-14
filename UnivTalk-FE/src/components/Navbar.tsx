import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/LogoNoName.png";

const Navbar: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate("/signin");
  };

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link
              to="/"
              className="flex items-center gap-2.5 group transition-all duration-300 hover:scale-105 cursor-pointer"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-linear-to-tr from-blue-500 to-indigo-600 rounded-xl blur-sm opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
                <img
                  src={logo}
                  alt="UnivTalk Logo"
                  className="w-10 h-10 object-contain relative z-10"
                />
              </div>
              <span className="logo-text text-2xl font-bold">
                <span className="bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Univ
                </span>
                <span className="bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Talk
                </span>
              </span>
            </Link>
          </div>

          <div className="flex items-center">
            {user ? (
              <div className="relative ml-3" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-3 bg-linear-to-r from-gray-50 to-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 px-2 py-1.5 hover:from-gray-100 hover:to-gray-200 transition-all duration-300 border border-gray-200/50 shadow-sm hover:shadow-md cursor-pointer"
                >
                  <span className="sr-only">Open user menu</span>

                  <div className="relative">
                    <div className="absolute inset-0 bg-linear-to-tr from-blue-500 via-indigo-500 to-purple-600 rounded-full blur-sm opacity-75"></div>
                    <div className="relative w-9 h-9 rounded-full bg-linear-to-tr from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-lg">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                  </div>

                  <span className="hidden md:block text-sm font-semibold text-gray-700 pr-2">
                    {user.username}
                  </span>

                  <svg
                    className={`w-4 h-4 text-gray-500 transition-transform duration-300 mr-1 ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {isDropdownOpen && (
                  <div className="origin-top-right absolute right-0 mt-3 w-56 rounded-xl shadow-xl bg-white ring-1 ring-black/5 focus:outline-none animate-fadeIn overflow-hidden border border-gray-100">
                    <div className="px-4 py-3 bg-linear-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Signed in as
                      </p>
                      <p className="text-sm font-bold text-gray-900 truncate mt-1">
                        {user.email}
                      </p>
                    </div>

                    <div className="py-1">
                      <Link
                        to="/profile"
                        className="group flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-linear-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 cursor-pointer"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <span className="text-base">👤</span>
                        <span className="font-medium">Your Profile</span>
                      </Link>

                      <Link
                        to="/forums/new"
                        className="group flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-linear-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 cursor-pointer"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <span className="text-base">➕</span>
                        <span className="font-medium">Create Forum</span>
                      </Link>

                      <Link
                        to="/credits"
                        className="group flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-linear-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 cursor-pointer"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <span className="text-base">👥</span>
                        <span className="font-medium">Credits</span>
                      </Link>
                    </div>

                    <div className="border-t border-gray-100">
                      <button
                        onClick={handleLogout}
                        className="group w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-all duration-200 font-medium cursor-pointer"
                      >
                        <span className="text-base">🚪</span>
                        <span>Sign out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex gap-3">
                <Link
                  to="/signin"
                  className="text-gray-700 hover:text-blue-600 font-semibold px-4 py-2 text-sm rounded-lg hover:bg-gray-50 transition-all duration-200 cursor-pointer"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="relative group bg-linear-to-r from-blue-600 to-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/50 hover:scale-105 cursor-pointer"
                >
                  <span className="relative z-10">Sign Up</span>
                  <div className="absolute inset-0 bg-linear-to-r from-blue-700 to-indigo-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
