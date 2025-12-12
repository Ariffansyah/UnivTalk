import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center text-gray-500 text-xs font-bold">
              UT
            </div>
            <span className="text-gray-500 text-sm">
              © {new Date().getFullYear()} UnivTalk. All rights reserved.
            </span>
          </div>

          <div className="flex gap-6 text-sm text-gray-500">
            <a href="#" className="hover:text-blue-600 transition">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-blue-600 transition">
              Terms of Service
            </a>
            <a href="#" className="hover:text-blue-600 transition">
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
