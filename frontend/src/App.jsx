import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import DashboardLayout from './pages/DashboardLayout';
import Dashboard from './pages/Dashboard'; // This is the old Dashboard, might need to be renamed or repurposed
import Session from './pages/Session';
import QuizCreator from './pages/QuizCreator';
import TeacherProfile from './pages/TeacherProfile';
import StudentProfile from './pages/StudentProfile';
import Classes from './pages/Classes';
import Sessions from './pages/Sessions';

function App() {
  const token = localStorage.getItem('token');
  
  return (
    <Router>
      <div className="min-h-screen">
        <Navbar />
      <Routes>
          <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected routes */}          
          <Route path="/dashboard" element={<PrivateRoute />}>
            <Route path="" element={<Navigate to="profile" replace />} /> {/* Redirect /dashboard to /dashboard/profile */}
            <Route element={<DashboardLayout />}>
              <Route path="profile" element={<DashboardContent />} /> {/* Placeholder for initial dashboard view */}
              <Route path="teacher" element={<TeacherProfile />} />
              <Route path="student" element={<StudentProfile />} />
              <Route path="classes" element={<Classes />} />
              <Route path="sessions" element={<Sessions />} />
              {/* Add more dashboard routes here, e.g., /dashboard/settings */}
            </Route>
          </Route>

          {/* Original session route, if still needed outside dashboard layout */}
        <Route
          path="/session/:id"
          element={token ? <Session /> : <Navigate to="/login" />}
        />

          {/* Quiz Creator route */}
        <Route
          path="/session/:sessionId/quiz/create"
          element={token ? <QuizCreator /> : <Navigate to="/login" />}
        />

          <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      </div>
    </Router>
  );
}

// A component to determine which profile to render based on user role.
// This is a temporary solution for /dashboard/profile to show the correct role's profile.
// In a real app, /dashboard could directly render role-specific components.
function DashboardContent() {
  const userRole = localStorage.getItem('userRole'); // Get role from localStorage
  if (userRole === 'teacher') {
    return <TeacherProfile />;
  } else if (userRole === 'student') {
    return <StudentProfile />;
  } else {
    return <div className="text-center py-8 text-red-500">Unauthorized or role not found.</div>;
  }
}

export default App;
