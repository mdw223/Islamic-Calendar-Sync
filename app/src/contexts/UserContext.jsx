import React, { createContext, useContext, useState } from "react";
import { createUser, defaultUser } from "../models/User";

const UserContext = createContext(undefined);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(createUser(defaultUser));

  const login = (userData) => {
    const newUser = createUser(userData);
    newUser.login(userData);
    setUser(newUser);
  };

  const logout = () => {
    const newUser = createUser(defaultUser);
    setUser(newUser);
  };

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

  const addUserAddress = (address) => {
    const updatedUser = createUser(user.toJSON());
    updatedUser.addAddress(address);
    setUser(updatedUser);
  };

  const removeUserAddress = (address) => {
    const updatedUser = createUser(user.toJSON());
    updatedUser.removeAddress(address);
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
        addUserAddress,
        removeUserAddress,
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
