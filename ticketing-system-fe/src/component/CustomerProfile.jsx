import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const CustomerProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(
          "http://localhost:3001/api/customer/profile",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("customerToken")}`,
            },
          }
        );

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem("customerToken");
            navigate("/customer/login");
            return;
          }
          throw new Error("Failed to fetch profile");
        }

        const data = await response.json();
        setProfile(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  if (loading) return <div className="loading">Loading profile...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="customer-profile">
      <div className="profile-card">
        <h2>Customer Profile</h2>
        {profile && (
          <div className="profile-info">
            <div className="info-row">
              <label>Name:</label>
              <span>{profile.name}</span>
            </div>
            <div className="info-row">
              <label>Email:</label>
              <span>{profile.email}</span>
            </div>
            <div className="info-row">
              <label>Phone:</label>
              <span>{profile.phone}</span>
            </div>
            <div className="info-row">
              <label>Member Since:</label>
              <span>{new Date(profile.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerProfile;
