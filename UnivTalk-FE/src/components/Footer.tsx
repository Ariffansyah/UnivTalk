import React from "react";
import { Link } from "react-router-dom";
import logo from "../assets/LogoNoName.png";

const Footer: React.FC = () => {
  return (
    <footer className="bg-white/80 backdrop-blur-md border-t border-gray-200/50 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="absolute inset-0 bg-linear-to-tr from-blue-500 to-indigo-600 rounded-xl blur-sm opacity-50"></div>
                <img
                  src={logo}
                  alt="UnivTalk Logo"
                  className="w-10 h-10 object-contain relative z-10"
                />
              </div>
              <span className="text-xl font-bold">
                <span className="bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Univ
                </span>
                <span className="bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Talk
                </span>
              </span>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              Platform for university communities to create and engage in
              forums, share ideas, and connect with peers.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
              Quick Links
            </h3>
            <Link
              to="/"
              className="text-gray-600 hover:text-blue-600 text-sm transition-colors duration-200 cursor-pointer"
            >
              Home
            </Link>
            <Link
              to="/forums"
              className="text-gray-600 hover:text-blue-600 text-sm transition-colors duration-200 cursor-pointer"
            >
              Forums
            </Link>
            <Link
              to="/forums/new"
              className="text-gray-600 hover:text-blue-600 text-sm transition-colors duration-200 cursor-pointer"
            >
              Create Forum
            </Link>
            <Link
              to="/credits"
              className="text-gray-600 hover:text-blue-600 text-sm transition-colors duration-200 cursor-pointer"
            >
              Credits
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
              About
            </h3>
            <Link
              to="/privacy-policy"
              className="text-gray-600 hover:text-blue-600 text-sm transition-colors duration-200 cursor-pointer"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms"
              className="text-gray-600 hover:text-blue-600 text-sm transition-colors duration-200 cursor-pointer"
            >
              Terms of Service
            </Link>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-200/50">
          <div className="flex flex-col md:flex-row justify-center items-center gap-4">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()}{" "}
              <span className="font-semibold text-gray-700">UnivTalk</span>. All
              rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
