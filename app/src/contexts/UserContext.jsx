import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { createUser, defaultUser } from "../models/User";
import APIClient from "../util/ApiClient";
import OfflineClient from "../util/OfflineClient";
import { setToken, clearToken } from "../util/AuthToken";
import { OFFLINE_GUEST_KEY } from "../Constants";

const UserContext = createContext(undefined);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(createUser(defaultUser));
  const [subscriptions, setSubscriptions] = useState([]);
  const [ready, setReady] = useState(false);

  // Sync any IndexedDB guest data to the backend, then clear local stores.
  const syncOfflineData = async () => {
    try {
      const hasData = await OfflineClient.hasData();
      if (!hasData) return;
      const { events, preferences } = await OfflineClient.getAllDataForSync();
      if (events.length > 0) await APIClient.syncOfflineEvents(events);
      if (preferences.length > 0) await APIClient.syncOfflinePreferences(preferences);
      await OfflineClient.clearAll();
    } catch (err) {
      console.error("Offline sync failed:", err);
    } finally {
      localStorage.removeItem(OFFLINE_GUEST_KEY);
    }
  };

  // On mount: handle OAuth redirect (#token=...), then fetch current user (JWT in Authorization).
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      const token = params.get("token");
      if (token) {
        setToken(decodeURIComponent(token));
        localStorage.removeItem(OFFLINE_GUEST_KEY);
        window.history.replaceState(
          null,
          "",
          window.location.pathname + window.location.search,
        );
      }
    }

    let cancelled = false;

    const offlineGuestEnabled = localStorage.getItem(OFFLINE_GUEST_KEY) === "1";
    if (offlineGuestEnabled) {
      setUser(createUser({ ...defaultUser, isOfflineGuest: true }));
      setReady(true);
      return () => {
        cancelled = true;
      };
    }

    APIClient.getCurrentUser()
      .then(async (data) => {
        if (cancelled) return;
        if (data?.success && data?.user) {
          await syncOfflineData();
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

  const login = useCallback(async (userData) => {
    await syncOfflineData();
    const newUser = createUser(userData);
    newUser.login(userData);
    setUser(newUser);
  }, []);

  const logout = useCallback(async () => {
    try {
      await APIClient.logout();
    } finally {
      localStorage.removeItem(OFFLINE_GUEST_KEY);
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

  const startOfflineGuestSession = useCallback(() => {
    localStorage.setItem(OFFLINE_GUEST_KEY, "1");
    setUser(createUser({ ...defaultUser, isOfflineGuest: true }));
  }, []);

  // True when the initial session check is done and no user was found.
  // Used to show the auth prompt modal.
  const showAuthPrompt = ready && !user?.userId && !user?.isOfflineGuest;

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
        startOfflineGuestSession,
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
