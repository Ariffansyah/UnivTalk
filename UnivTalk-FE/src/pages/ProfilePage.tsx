import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type Profile = {
  uid?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  university?: string;
  status?: string;
  created_at?: string;
};

const ProfilePage: React.FC = () => {
  const token = localStorage.getItem("token") || "";
  const navigate = useNavigate();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          if (res.status === 401) {
            navigate("/signin");
            return;
          }
          throw new Error("Failed to fetch profile");
        }
        const data = await res.json();
        const profileData = data.profile || data;
        setProfile({
          uid: profileData.uid || profileData.id || "",
          username: profileData.username || "",
          first_name: profileData.first_name || "",
          last_name: profileData.last_name || "",
          email: profileData.email || "",
          university: profileData.university || "",
          status: profileData.status || "",
          created_at: profileData.created_at || "",
        });
      } catch (err: any) {
        setError(err.message || "Error loading profile");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchProfile();
    } else {
      navigate("/signin");
    }
  }, [token, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/signin");
  };

  if (loading)
    return (
      <div className="max-w-2xl mx-auto p-4 mt-8 text-gray-600">
        Loading...
      </div>
    );

  if (error)
    return (
      <div className="max-w-2xl mx-auto p-4 mt-8 text-red-600 bg-red-50 p-3 rounded">
        {error}
      </div>
    );

  if (!profile)
    return (
      <div className="max-w-2xl mx-auto p-4 mt-8 text-gray-600">
        Profile not found
      </div>
    );

  return (
    <div className="max-w-2xl mx-auto p-4 mt-8">
      <div className="bg-white border rounded-lg p-6 shadow-md">
        <h1 className="text-3xl font-bold mb-4">
          {profile.first_name} {profile.last_name}
        </h1>

        <div className="space-y-3 mb-6">
          <div>
            <label className="font-semibold text-gray-700">Username:</label>
            <p className="text-gray-600">{profile.username}</p>
          </div>

          <div>
            <label className="font-semibold text-gray-700">Email:</label>
            <p className="text-gray-600">{profile.email}</p>
          </div>

          <div>
            <label className="font-semibold text-gray-700">University:</label>
            <p className="text-gray-600">{profile.university}</p>
          </div>

          <div>
            <label className="font-semibold text-gray-700">Status:</label>
            <p className="text-gray-600">
              <span
                className={`px-3 py-1 rounded text-sm font-semibold ${
                  profile.status === "active"
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {profile.status}
              </span>
            </p>
          </div>

          <div>
            <label className="font-semibold text-gray-700">Joined:</label>
            <p className="text-gray-600">{profile.created_at}</p>
          </div>
        </div>

        <div className="border-t pt-4">
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 font-semibold"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
