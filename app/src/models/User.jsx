/**
 * User model aligned with DB schema (Users table).
 * API returns lowercase column names (e.g. userid, createdat); we map to camelCase.
 * "Logged in" is session-based (cookie): no isLoggedIn in DB; use user.userId != null or user.isLoggedIn getter.
 */
function fromApiRow(row) {
  if (!row) return null;
  return {
    userId: row.userid ?? null,
    id: row.userid ?? null,
    name: row.name ?? "",
    email: row.email ?? "",
    createdAt: row.createdat ?? null,
    updatedAt: row.updatedat ?? null,
    lastLogin: row.lastlogin ?? null,
    isAdmin: row.isadmin ?? false,
    timezone: row.timezone ?? null,
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
    language: row.language ?? null,
    eventConfigurationStart: row.eventconfigurationstart ?? null,
    eventConfigurationEnd: row.eventconfigurationend ?? null,
    prayerConfigurationStart: row.prayerconfigurationstart ?? null,
    prayerConfigurationEnd: row.prayerconfigurationend ?? null,
    calculationMethodId: row.calculationmethodid ?? null,
    hanafi: row.hanafi ?? false,
  };
}

export const defaultUser = {
  userId: null,
  id: null,
  name: "",
  email: "",
  createdAt: null,
  updatedAt: null,
  lastLogin: null,
  isAdmin: false,
  timezone: null,
  latitude: null,
  longitude: null,
  language: null,
  eventConfigurationStart: null,
  eventConfigurationEnd: null,
  prayerConfigurationStart: null,
  prayerConfigurationEnd: null,
  calculationMethodId: null,
  hanafi: false,
  notifications: true,
  emailUpdates: false,
};

export class User {
  constructor(data = {}) {
    const normalized =
      data.userid != null ? fromApiRow(data) : { ...defaultUser, ...data };
    this.userId = normalized.userId ?? normalized.id ?? null;
    this.id = this.userId;
    this.name = normalized.name ?? "";
    this.email = normalized.email ?? "";
    this.createdAt = normalized.createdAt ?? null;
    this.updatedAt = normalized.updatedAt ?? null;
    this.lastLogin = normalized.lastLogin ?? null;
    this.isAdmin = normalized.isAdmin ?? false;
    this.timezone = normalized.timezone ?? null;
    this.latitude = normalized.latitude ?? null;
    this.longitude = normalized.longitude ?? null;
    this.language = normalized.language ?? null;
    this.eventConfigurationStart = normalized.eventConfigurationStart ?? null;
    this.eventConfigurationEnd = normalized.eventConfigurationEnd ?? null;
    this.prayerConfigurationStart = normalized.prayerConfigurationStart ?? null;
    this.prayerConfigurationEnd = normalized.prayerConfigurationEnd ?? null;
    this.calculationMethodId = normalized.calculationMethodId ?? null;
    this.hanafi = normalized.hanafi ?? false;
    this.notifications = normalized.preferences?.notifications ?? true;
    this.emailUpdates = normalized.preferences?.emailUpdates ?? false;
  }

  // Session-based: logged in when we have a user id (from API/cookie).
  get isLoggedIn() {
    return this.userId != null;
  }

  login(userData) {
    const normalized =
      userData?.userid != null ? fromApiRow(userData) : userData;
    if (normalized) {
      this.userId = normalized.userId ?? normalized.id ?? null;
      this.id = this.userId;
      this.name = normalized.name ?? this.name;
      this.email = normalized.email ?? this.email;
      this.createdAt = normalized.createdAt ?? this.createdAt;
      this.updatedAt = normalized.updatedAt ?? this.updatedAt;
      this.lastLogin = normalized.lastLogin ?? new Date().toISOString();
      this.isAdmin = normalized.isAdmin ?? this.isAdmin;
      this.timezone = normalized.timezone ?? this.timezone;
      this.latitude = normalized.latitude ?? this.latitude;
      this.longitude = normalized.longitude ?? this.longitude;
      this.language = normalized.language ?? this.language;
      this.eventConfigurationStart =
        normalized.eventConfigurationStart ?? this.eventConfigurationStart;
      this.eventConfigurationEnd =
        normalized.eventConfigurationEnd ?? this.eventConfigurationEnd;
      this.prayerConfigurationStart =
        normalized.prayerConfigurationStart ?? this.prayerConfigurationStart;
      this.prayerConfigurationEnd =
        normalized.prayerConfigurationEnd ?? this.prayerConfigurationEnd;
      this.calculationMethodId =
        normalized.calculationMethodId ?? this.calculationMethodId;
      this.hanafi = normalized.hanafi ?? this.hanafi;
    }
  }

  logout() {
    Object.assign(this, new User(defaultUser));
  }

  updateProfile(updates) {
    const allowed = [
      "name",
      "email",
      "timezone",
      "latitude",
      "longitude",
      "language",
      "eventConfigurationStart",
      "eventConfigurationEnd",
      "prayerConfigurationStart",
      "prayerConfigurationEnd",
      "calculationMethodId",
      "hanafi",
    ];
    allowed.forEach((key) => {
      if (key in updates) this[key] = updates[key];
    });
  }

  toJSON() {
    return {
      userId: this.userId,
      id: this.id,
      name: this.name,
      email: this.email,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastLogin: this.lastLogin,
      isAdmin: this.isAdmin,
      timezone: this.timezone,
      latitude: this.latitude,
      longitude: this.longitude,
      language: this.language,
      eventConfigurationStart: this.eventConfigurationStart,
      eventConfigurationEnd: this.eventConfigurationEnd,
      prayerConfigurationStart: this.prayerConfigurationStart,
      prayerConfigurationEnd: this.prayerConfigurationEnd,
      calculationMethodId: this.calculationMethodId,
      hanafi: this.hanafi,
      emailUpdates: this.emailUpdates,
      notificaitons: this.notifications,
      isLoggedIn: this.isLoggedIn,
    };
  }
}

export const createUser = (data = {}) => new User(data);

export const createGuestUser = () => new User(defaultUser);

/** Session-based: user is logged in if they have a userId (from API/cookie). */
export const isUserLoggedIn = (user) =>
  user != null && (user.userId != null || user.id != null);

export const userFromApiResponse = (response) => {
  const raw = response?.user ?? response;
  return raw ? new User(raw) : createGuestUser();
};

export const validateUserEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
