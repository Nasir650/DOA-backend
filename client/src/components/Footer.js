import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-black/20 backdrop-blur-md border-t border-white/10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">D</span>
              </div>
              <span className="text-white font-bold text-xl">DOA</span>
            </div>
            <p className="text-gray-400 text-sm">
              Decentralized Organization for Autonomous governance and community-driven decision making.
            </p>
          </div>

          {/* Platform */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold">Platform</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/voting"
                  className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                >
                  Voting
                </Link>
              </li>
              <li>
                <Link
                  to="/contribute"
                  className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                >
                  Contribute
                </Link>
              </li>
              <li>
                <Link
                  to="/leaderboard"
                  className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                >
                  Leaderboard
                </Link>
              </li>
              <li>
                <Link
                  to="/dashboard"
                  className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                >
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

  {/* Resources */}
  <div className="space-y-4">
    <h3 className="text-white font-semibold">Resources</h3>
    <ul className="space-y-2">
      <li>
        <Link
          to="/whitepaper"
          className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
        >
          Documentation
        </Link>
      </li>
      <li>
        <Link
          to="/whitepaper"
          className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
        >
          API Reference
        </Link>
      </li>
      <li>
        <Link
          to="/whitepaper"
          className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
        >
          Whitepaper
        </Link>
      </li>
      <li>
        <Link
          to="/whitepaper"
          className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
        >
          FAQ
        </Link>
      </li>
    </ul>
  </div>

  {/* Legal */}
  <div className="space-y-4">
    <h3 className="text-white font-semibold">Legal</h3>
    <ul className="space-y-2">
      <li>
        <Link
          to="/whitepaper"
          className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
        >
          Privacy Policy
        </Link>
      </li>
      <li>
        <Link
          to="/whitepaper"
          className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
        >
          Terms of Service
        </Link>
      </li>
      <li>
        <Link
          to="/whitepaper"
          className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
        >
          Cookie Policy
        </Link>
      </li>
      <li>
        <Link
          to="/whitepaper"
          className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
        >
          Disclaimer
        </Link>
      </li>
    </ul>
  </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 DOA Platform. All rights reserved.
            </p>
            <p className="text-gray-400 text-sm mt-2 md:mt-0">
              Built with ❤️ for the decentralized future
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;