import React, { useEffect, useState } from 'react';
import API from '../api';

export default function StudentProfile() {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await API.get('/users/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setProfileData(res.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching student profile:", err);
        setError("Failed to load student profile.");
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return <div className="text-center py-8">Loading student profile...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>;
  }

  if (!profileData) {
    return <div className="text-center py-8">No student profile data found.</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4">Student Profile</h2>
      <div className="space-y-3">
        <p className="text-lg"><span className="font-semibold">Name:</span> {profileData.name}</p>
        <p className="text-lg"><span className="font-semibold">Email:</span> {profileData.email}</p>
        <p className="text-lg"><span className="font-semibold">Role:</span> {profileData.role}</p>
        {/* Add more student-specific profile fields here */}
      </div>
    </div>
  );
} 