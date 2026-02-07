export const defaultUser = {
  id: null,
  name: "",
  email: "",
  isLoggedIn: false,
  addresses: [], // TODO: move to locations obj
  timezone: "UTC+0", // TODO: move to locations obj
  language: "English", // TODO: CHANGE TO ENUM?

  preferences: {
    theme: "light",
    notifications: true,
    emailUpdates: false,
  },
};

// User class model
export class User {
  constructor(data = {}) {
    this.id = data.id || null;
    this.name = data.name || "";
    this.email = data.email || "";
    this.isLoggedIn = data.isLoggedIn || false;
    this.addresses = data.addresses || [];
    this.timezone = data.timezone || "UTC+0";
    this.language = data.language || "English";
    this.preferences = {
      theme: data.preferences?.theme || "light",
      notifications: data.preferences?.notifications ?? true,
      emailUpdates: data.preferences?.emailUpdates ?? false,
    };
    this.createdAt = data.createdAt || null;
    this.lastLogin = data.lastLogin || null;
  }

  // Methods
  login(userData) {
    this.id = userData.id;
    this.name = userData.name;
    this.email = userData.email;
    this.isLoggedIn = true;
    this.lastLogin = new Date().toISOString();
  }

  logout() {
    Object.assign(this, defaultUser);
  }

  updateProfile(updates) {
    Object.keys(updates).forEach((key) => {
      if (key in this && key !== "id" && key !== "isLoggedIn") {
        this[key] = updates[key];
      }
    });
  }

  updatePreferences(preferences) {
    this.preferences = { ...this.preferences, ...preferences };
  }

  addAddress(address) {
    if (!this.addresses.includes(address)) {
      this.addresses.push(address);
    }
  }

  removeAddress(address) {
    this.addresses = this.addresses.filter((addr) => addr !== address);
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      isLoggedIn: this.isLoggedIn,
      addresses: this.addresses,
      timezone: this.timezone,
      language: this.language,
      preferences: this.preferences,
      createdAt: this.createdAt,
      lastLogin: this.lastLogin,
    };
  }
}

export const createUser = (data = {}) => {
  return new User(data);
};

export const createGuestUser = () => {
  return new User(defaultUser);
};

export const isUserLoggedIn = (user) => {
  return user && user.isLoggedIn === true;
};

export const validateUserEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
