import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthenticated = localStorage.getItem('token'); // Check for authentication token
  
  // Don't show navbar on dashboard and session pages
  if (location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/session')) {
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole'); // Also clear the stored user role
    navigate('/login'); // Redirect to login page after logout
  };

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">C</span>
              </div>
              <span className="text-xl font-bold text-gray-900">CodeCrew</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <a href="/#features" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Features
              </a>
              <a href="/#about" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                About
              </a>
              <a href="/#contact" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Contact
              </a>
            </div>
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
              <Button onClick={() => navigate('/dashboard/profile')} className="bg-blue-500 hover:bg-blue-600">
                Profile
              </Button>
              <Button onClick={handleLogout} className="bg-red-500 hover:bg-red-600">
                Logout
              </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" className="text-gray-700 hover:text-blue-600">
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-blue-600 focus:outline-none focus:text-blue-600"
            >
              <span className="sr-only">Open main menu</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
            <a href="/#features" className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium">
              Features
            </a>
            <a href="/#about" className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium">
              About
            </a>
            <a href="/#contact" className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium">
              Contact
            </a>
            <div className="pt-4 pb-3 border-t border-gray-200">
              {isAuthenticated ? (
                <>
                <Button onClick={() => navigate('/dashboard/profile')} className="bg-blue-500 hover:bg-blue-600">
                  Profile
                </Button>
                <Button onClick={handleLogout} className="bg-red-500 hover:bg-red-600">
                  Logout
                </Button>
                </>
              ) : (
                <>
                  <Link to="/login" className="block px-3 py-2 text-gray-700 hover:text-blue-600">
                    Sign In
                  </Link>
                  <Link to="/signup" className="block px-3 py-2 text-gray-700 hover:text-blue-600">
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
} 