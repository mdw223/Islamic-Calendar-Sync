import React, { useEffect, useContext } from "react";
import { AuthContext } from "./Context";
import APIClient from "../util/ApiClient";
import { clearToken } from "../util/authToken";

export default function AuthContextProvider({ children }) {
  const [user, setUser] = React.useState(null);
  const [subscriptions, setSubscriptions] = React.useState([]);

  // TODO: PUT BACK INTO USE. CURRENTLY ONLY USING USER CONTEXT
  useEffect(() => {
    APIClient.getCurrentUser()
      .then((data) => {
        setUser(data?.success && data?.user ? data.user : null);
      })
      .catch(() => {
        setUser(null);
      });
  }, []);

  const logout = React.useCallback(async () => {
    try {
      await APIClient.logout();
    } finally {
      clearToken();
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, setUser, logout, subscriptions, setSubscriptions }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context == null) {
    throw new Error("useAuth must be used within an AuthContextProvider");
  }
  return context;
}
