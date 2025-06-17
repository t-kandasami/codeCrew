import React, { useEffect, useState } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import API from '../api';
import Sidebar from '../components/Sidebar';
import { cn } from '../lib/utils'; // Import cn for conditional classes

export default function DashboardLayout() {
  const [userRole, setUserRole] = useState(null);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false); // State for sidebar expansion
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        const res = await API.get('/users/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUserRole(res.data.role);
        // Store user role in localStorage or context if needed elsewhere
        localStorage.setItem('userRole', res.data.role);
      } catch (error) {
        console.error("Failed to fetch user role:", error);
        navigate('/login');
      }
    };

    fetchUserRole();
  }, [navigate]);

  if (userRole === null) {
    return <div className="flex items-center justify-center min-h-screen">Loading dashboard...</div>; 
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar 
        isExpanded={isSidebarExpanded} 
        setIsExpanded={setIsSidebarExpanded} 
      />
      <main 
        className={cn(
          "flex-1 p-6 transition-all duration-300 ease-in-out",
          isSidebarExpanded ? "ml-64" : "ml-20" // Adjust margin based on sidebar width
        )}
      >
        <Outlet /> {/* This is where nested routes will render */}
      </main>
    </div>
  );
} 