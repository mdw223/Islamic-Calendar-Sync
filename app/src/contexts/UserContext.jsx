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
  const [subscriptions, setSubscriptions] = useState([]);
  const [ready, setReady] = useState(false);

  // On mount: handle OAuth redirect (#token=...), then fetch current user (JWT in Authorization).
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      const token = params.get("token");
      if (token) {
        setToken(decodeURIComponent(token));
        window.history.replaceState(
          null,
          "",
          window.location.pathname + window.location.search,
        );
      }
    }

    let cancelled = false;
    APIClient.getCurrentUser()
      .then((data) => {
        if (cancelled) return;
        if (data?.success && data?.user) {
          // Always set the user — even if isGuest is true (guest users now have a userId).
          setUser(createUser(data.user));
        } else {
          setUser(createUser(defaultUser));
        }
      })
      .catch((err) => {
        if (!cancelled) setUser(createUser(defaultUser));
      })
      .finally(() => {
        if (!cancelled) setReady(true);
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
      setSubscriptions([]);
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

  /**
   * Explicitly create a guest session via POST /auth/guest.
   * Called when the user clicks "Continue as Guest" in the auth prompt.
   */
  const startGuestSession = useCallback(async () => {
    const data = await APIClient.createGuestSession();
    if (data?.success && data?.user) {
      setUser(createUser(data.user));
    }
  }, []);

  // True when the initial session check is done and no user was found.
  // Used to show the auth prompt modal.
  const showAuthPrompt = ready && !user?.userId;

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        login,
        logout,
        updateUser,
        updateUserPreferences,
        subscriptions,
        setSubscriptions,
        ready,
        showAuthPrompt,
        startGuestSession,
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
