// src/pages/Profile.jsx — User Profile Page
import React, { useEffect, useState } from 'react';
import { userAPI } from '../services/api';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await userAPI.getProfile();
        setUser(response.data.user);
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (!user) return <p>No profile found</p>;

  return (
    <div>
      <h1>My Profile</h1>
      <p>Email: {user.email}</p>
      <p>Name: {user.full_name}</p>
      <p>Phone: {user.phone}</p>
      <button>Edit Profile</button>
    </div>
  );
};

export default Profile;
