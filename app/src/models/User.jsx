/**
 * User model aligned with DB schema (User table).
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
    language: row.language ?? null,
    generatedYearsStart: row.generatedyearsstart ?? null,
    generatedYearsEnd: row.generatedyearsend ?? null,
    prayerConfigurationStart: row.prayerconfigurationstart ?? null,
    prayerConfigurationEnd: row.prayerconfigurationend ?? null,
    calculationMethodId: row.calculationmethodid ?? null,
    hanafi: row.hanafi ?? false,
    use24HourTime: row.use24hourtime ?? row.use24HourTime ?? false,
    authProviderTypeId: row.authprovidertypeid ?? null,
    authProviderName: row.authprovidername ?? row.authProviderName ?? null,
    userLocations: row.userlocations ?? row.userLocations ?? [],
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
  language: null,
  generatedYearsStart: null,
  generatedYearsEnd: null,
  prayerConfigurationStart: null,
  prayerConfigurationEnd: null,
  calculationMethodId: null,
  hanafi: false,
  use24HourTime: false,
  notifications: true,
  emailUpdates: false,
  authProviderTypeId: null,
  authProviderName: null,
  userLocations: [],
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
    this.language = normalized.language ?? null;
    this.authProviderTypeId = normalized.authProviderTypeId ?? null;
    this.authProviderName = normalized.authProviderName ?? null;
    this.userLocations = normalized.userLocations ?? [];
    this.generatedYearsStart = normalized.generatedYearsStart ?? null;
    this.generatedYearsEnd = normalized.generatedYearsEnd ?? null;
    this.prayerConfigurationStart = normalized.prayerConfigurationStart ?? null;
    this.prayerConfigurationEnd = normalized.prayerConfigurationEnd ?? null;
    this.calculationMethodId = normalized.calculationMethodId ?? null;
    this.hanafi = normalized.hanafi ?? false;
    this.use24HourTime = normalized.use24HourTime ?? false;
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
      this.language = normalized.language ?? this.language;
      this.authProviderTypeId =
        normalized.authProviderTypeId ?? this.authProviderTypeId;
      this.authProviderName =
        normalized.authProviderName ?? this.authProviderName;
      this.userLocations = normalized.userLocations ?? this.userLocations;
      this.generatedYearsStart =
        normalized.generatedYearsStart ?? this.generatedYearsStart;
      this.generatedYearsEnd =
        normalized.generatedYearsEnd ?? this.generatedYearsEnd;
      this.prayerConfigurationStart =
        normalized.prayerConfigurationStart ?? this.prayerConfigurationStart;
      this.prayerConfigurationEnd =
        normalized.prayerConfigurationEnd ?? this.prayerConfigurationEnd;
      this.calculationMethodId =
        normalized.calculationMethodId ?? this.calculationMethodId;
      this.hanafi = normalized.hanafi ?? this.hanafi;
      this.use24HourTime = normalized.use24HourTime ?? this.use24HourTime;
    }
  }

  logout() {
    Object.assign(this, new User(defaultUser));
  }

  updatePreferences(preferences) {
    // TODO USE THESE
    if (preferences && typeof preferences.notifications !== "undefined")
      this.notifications = preferences.notifications;
    if (preferences && typeof preferences.emailUpdates !== "undefined")
      this.emailUpdates = preferences.emailUpdates;
  }

  updateProfile(updates) {
    const allowed = [
      "name",
      "email",
      "language",
      "authProviderTypeId",
      "authProviderName",
      "userLocations",
      "generatedYearsStart",
      "generatedYearsEnd",
      "prayerConfigurationStart",
      "prayerConfigurationEnd",
      "calculationMethodId",
      "hanafi",
      "use24HourTime",
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
      language: this.language,
      authProviderTypeId: this.authProviderTypeId,
      authProviderName: this.authProviderName,
      userLocations: this.userLocations,
      generatedYearsStart: this.generatedYearsStart,
      generatedYearsEnd: this.generatedYearsEnd,
      prayerConfigurationStart: this.prayerConfigurationStart,
      prayerConfigurationEnd: this.prayerConfigurationEnd,
      calculationMethodId: this.calculationMethodId,
      hanafi: this.hanafi,
      use24HourTime: this.use24HourTime,
      emailUpdates: this.emailUpdates,
      notificaitons: this.notifications,
      isLoggedIn: this.isLoggedIn,
    };
  }
}

export const createUser = (data = {}) => new User(data);

export const createAnonymousUser = () => new User(defaultUser);

/** Session-based: user is logged in if they have a userId (from API/cookie). */
export const isUserLoggedIn = (user) =>
  user != null && (user.userId != null || user.id != null);

export const userFromApiResponse = (response) => {
  const raw = response?.user ?? response;
  return raw ? new User(raw) : createAnonymousUser();
};

export const validateUserEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
