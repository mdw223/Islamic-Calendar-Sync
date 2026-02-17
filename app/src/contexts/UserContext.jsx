import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { createUser, defaultUser } from "../models/User";
import APIClient from "../util/ApiClient";
import { setToken, clearToken } from "../util/authToken";

const UserContext = createContext(undefined);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(createUser(defaultUser));

  // On mount: handle OAuth redirect (#token=...), then fetch current user (JWT in Authorization).
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      const token = params.get("token");
      if (token) {
        setToken(decodeURIComponent(token));
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      }
    }

    let cancelled = false;
    APIClient.getCurrentUser()
      .then((data) => {
        if (cancelled) return;
        if (data?.success && data?.user) {
          console.log("user fetched", data.user);
          setUser(createUser(data.user));
        } else {
          console.log("user not fetched", data);
          setUser(createUser(defaultUser));
        }
      })
      .catch((err) => {
        console.warn("getCurrentUser failed:", err?.message ?? err); // TODO: remove consoles
        if (!cancelled) setUser(createUser(defaultUser));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback((userData) => {
    const newUser = createUser(userData);
    newUser.login(userData);
    setUser(newUser);
  }, []);

  const logout = useCallback(async () => {
    try {
      await APIClient.logout();
    } finally {
      clearToken();
      setUser(createUser(defaultUser));
    }
  }, []);

  const updateUser = (updates) => {
    const updatedUser = createUser(user.toJSON());
    updatedUser.updateProfile(updates);
    setUser(updatedUser);
  };

  const updateUserPreferences = (preferences) => {
    const updatedUser = createUser(user.toJSON());
    updatedUser.updatePreferences(preferences);
    setUser(updatedUser);
  };

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        login,
        logout,
        updateUser,
        updateUserPreferences,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
