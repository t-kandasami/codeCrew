import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';

export default function Landing() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Transform Learning with
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {" "}Collaborative Education
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Join the future of education where students and teachers collaborate in real-time, 
              creating an interactive and engaging learning experience that goes beyond traditional classrooms.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-lg px-8 py-3">
                  Start Learning Today
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg" className="text-lg px-8 py-3 border-2">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Why Choose CodeCrew?
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Experience the next generation of collaborative learning with our innovative features.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-6 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl">👥</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Real-time Collaboration</h3>
                <p className="text-gray-600">
                  Work together with classmates and teachers in real-time, making learning more interactive and engaging.
                </p>
              </div>
              <div className="text-center p-6 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50">
                <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl">📚</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Interactive Quizzes</h3>
                <p className="text-gray-600">
                  Test your knowledge with interactive quizzes and get instant feedback to improve your learning.
                </p>
              </div>
              <div className="text-center p-6 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl">⚡</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Smart Whiteboard</h3>
                <p className="text-gray-600">
                  Draw, write, and collaborate on a digital whiteboard that syncs across all participants.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 