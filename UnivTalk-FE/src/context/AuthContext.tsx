import React, { createContext, useContext, useState, useEffect } from "react";
import {
  getUserProfile,
  signOut as apiSignOut,
  type UserProfile,
} from "../services/api/auth";

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const res = await getUserProfile();
        if (res.success && res.profile) {
          setUser(res.profile as UserProfile);
        }
      } catch (error) {
        console.log("No active session found");
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const signOut = async () => {
    try {
      await apiSignOut();
      setUser(null);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
