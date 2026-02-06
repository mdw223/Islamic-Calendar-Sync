import React, { useEffect } from "react";
import { AuthContext } from "./context";
import APIClient from "../util/APIClient";

export default function AuthContextProvider({ children }) {
  const [user, setUser] = React.useState(null);
  const [subscriptions, setSubscriptions] = React.useState([]);

  useEffect(() => {
    APIClient.getCurrentUser()
      .then((userData) => {
        setUser(userData);
      })
      .catch(() => {
        setUser(null);
      });
  }, []);
  // TODO: finish
  return (
    <AuthContext.Provider
      value={{ user, setUser, subscriptions, setSubscriptions }}
    >
      {children}
    </AuthContext.Provider>
  );
}
