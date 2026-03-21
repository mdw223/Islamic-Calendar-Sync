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

const UserContext = createContext(undefined);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(createUser(defaultUser));
  const [userLocations, setUserLocations] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [ready, setReady] = useState(false);

  // Sync any IndexedDB data to the backend, then clear local stores.
  const syncOfflineData = async () => {
    try {
      const hasData = await OfflineClient.hasData();
      if (!hasData) return;
      const data = await OfflineClient.getAllDataForSync();
      if (!data) return;
      const { events, preferences, userLocations: offlineUserLocations } = data;
      if (events.length > 0) await APIClient.syncOfflineEvents(events);
      if (preferences.length > 0)
        await APIClient.syncOfflinePreferences(preferences);
      if (offlineUserLocations?.length > 0) {
        await APIClient.syncOfflineUserLocations(offlineUserLocations);
      }
      await OfflineClient.clearAll();
    } catch (err) {
      console.error("Offline sync failed:", err);
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
        window.history.replaceState(
          null,
          "",
          window.location.pathname + window.location.search,
        );
      }
    }

    let cancelled = false;

    APIClient.getCurrentUser()
      .then(async (data) => {
        if (cancelled) return;
        if (data?.success && data?.user) {
          await syncOfflineData();
          const refreshed = await APIClient.getCurrentUser();
          const nextUser = createUser(refreshed?.user ?? data.user);
          setUser(nextUser);
          setUserLocations(nextUser.userLocations ?? []);
        } else {
          setUser(createUser(defaultUser));
          const offlineLocations = await OfflineClient.getUserLocations();
          setUserLocations(offlineLocations?.userLocations ?? []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUser(createUser(defaultUser));
          OfflineClient.getUserLocations()
            .then((offlineLocations) =>
              setUserLocations(offlineLocations?.userLocations ?? []),
            )
            .catch(() => setUserLocations([]));
        }
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
    setUserLocations(newUser.userLocations ?? []);
  }, []);

  const logout = useCallback(async () => {
    try {
      await APIClient.logout();
    } finally {
      clearToken();
      setUser(createUser(defaultUser));
      setUserLocations([]);
      setSubscriptions([]);
    }
  }, []);

  const updateUser = (updates) => {
    const updatedUser = createUser(user.toJSON());
    updatedUser.updateProfile(updates);
    setUser(updatedUser);
    if (updates?.userLocations) {
      setUserLocations(updates.userLocations);
    }
  };

  const refreshUser = useCallback(async () => {
    const data = await APIClient.getCurrentUser();
    if (data?.success && data?.user) {
      const nextUser = createUser(data.user);
      setUser(nextUser);
      setUserLocations(nextUser.userLocations ?? []);
      return nextUser;
    }
    return null;
  }, []);

  const saveUserProfile = useCallback(
    async (updates) => {
      const data = await APIClient.updateCurrentUser(updates);
      if (data?.success && data?.user) {
        const nextUser = createUser(data.user);
        nextUser.updateProfile({
          userLocations,
          authProviderName: user?.authProviderName ?? null,
          authProviderTypeId: user?.authProviderTypeId ?? null,
        });
        setUser(nextUser);
      } else {
        updateUser(updates);
      }
    },
    [updateUser, userLocations],
  );

  const addUserLocation = useCallback(
    async (location) => {
      if (userLocations.length >= 3) {
        throw new Error("You can save up to 3 locations.");
      }

      let created;
      if (user?.isLoggedIn) {
        const res = await APIClient.createUserLocation(location);
        created = res?.userLocation;
      } else {
        const res = await OfflineClient.createUserLocation(location);
        created = res?.userLocation;
      }
      const next = [...userLocations, created].slice(0, 3);
      setUserLocations(next);
      updateUser({ userLocations: next });
      return created;
    },
    [updateUser, user?.isLoggedIn, userLocations],
  );

  const updateUserLocation = useCallback(
    async (userLocationId, updates) => {
      let updated;
      if (user?.isLoggedIn) {
        const res = await APIClient.updateUserLocation(userLocationId, updates);
        updated = res?.userLocation;
      } else {
        const res = await OfflineClient.updateUserLocation(
          userLocationId,
          updates,
        );
        updated = res?.userLocation;
      }
      const next = userLocations.map((location) =>
        location.userlocationid === userLocationId ||
        location.userLocationId === userLocationId
          ? updated
          : location,
      );
      setUserLocations(next);
      updateUser({ userLocations: next });
      return updated;
    },
    [updateUser, user?.isLoggedIn, userLocations],
  );

  const removeUserLocation = useCallback(
    async (userLocationId) => {
      if (user?.isLoggedIn) {
        await APIClient.deleteUserLocation(userLocationId);
      } else {
        await OfflineClient.deleteUserLocation(userLocationId);
      }
      const next = userLocations.filter(
        (location) =>
          location.userlocationid !== userLocationId &&
          location.userLocationId !== userLocationId,
      );
      setUserLocations(next);
      updateUser({ userLocations: next });
    },
    [updateUser, user?.isLoggedIn, userLocations],
  );

  const updateUserPreferences = (preferences) => {
    const updatedUser = createUser(user.toJSON());
    updatedUser.updatePreferences(preferences);
    setUser(updatedUser);
  };

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
        userLocations,
        setUserLocations,
        refreshUser,
        saveUserProfile,
        addUserLocation,
        updateUserLocation,
        removeUserLocation,
        ready,
        showAuthPrompt,
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
