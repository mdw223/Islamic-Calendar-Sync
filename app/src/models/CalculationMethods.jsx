export const CalculationMethodId = {
  JAFARI: 0,
  KARACHI: 1,
  ISNA: 2,
  MWL: 3,
  MAKKAH: 4,
  EGYPT: 5,
  TEHRAN: 7,
  GULF: 8,
  KUWAIT: 9,
  QATAR: 10,
  SINGAPORE: 11,
  FRANCE: 12,
  TURKEY: 13,
  RUSSIA: 14,
  MOONSIGHTING: 15,
  DUBAI: 16,
  JAKIM: 17,
  TUNISIA: 18,
  ALGERIA: 19,
  KEMENAG: 20,
  MOROCCO: 21,
  PORTUGAL: 22,
  JORDAN: 23,
  CUSTOM: 99,
};

// Reverse lookup (ID to name)
export const CalculationMethodName = {
  0: "JAFARI",
  1: "KARACHI",
  2: "ISNA",
  3: "MWL",
  4: "MAKKAH",
  5: "EGYPT",
  7: "TEHRAN",
  8: "GULF",
  9: "KUWAIT",
  10: "QATAR",
  11: "SINGAPORE",
  12: "FRANCE",
  13: "TURKEY",
  14: "RUSSIA",
  15: "MOONSIGHTING",
  16: "DUBAI",
  17: "JAKIM",
  18: "TUNISIA",
  19: "ALGERIA",
  20: "KEMENAG",
  21: "MOROCCO",
  22: "PORTUGAL",
  23: "JORDAN",
  99: "CUSTOM",
};

// full calculation methods data
export const CalculationMethods = {
  MWL: {
    id: 3,
    name: "Muslim World League",
    params: { Fajr: 18, Isha: 17 },
    location: { latitude: 51.5194682, longitude: -0.1360365 },
  },
  ISNA: {
    id: 2,
    name: "Islamic Society of North America (ISNA)",
    params: { Fajr: 15, Isha: 15 },
    location: { latitude: 39.7042123, longitude: -86.3994387 },
  },
  EGYPT: {
    id: 5,
    name: "Egyptian General Authority of Survey",
    params: { Fajr: 19.5, Isha: 17.5 },
    location: { latitude: 30.0444196, longitude: 31.2357116 },
  },
  MAKKAH: {
    id: 4,
    name: "Umm Al-Qura University, Makkah",
    params: { Fajr: 18.5, Isha: "90 min" },
    location: { latitude: 21.3890824, longitude: 39.8579118 },
  },
  KARACHI: {
    id: 1,
    name: "University of Islamic Sciences, Karachi",
    params: { Fajr: 18, Isha: 18 },
    location: { latitude: 24.8614622, longitude: 67.0099388 },
  },
  TEHRAN: {
    id: 7,
    name: "Institute of Geophysics, University of Tehran",
    params: { Fajr: 17.7, Isha: 14, Maghrib: 4.5, Midnight: "JAFARI" },
    location: { latitude: 35.6891975, longitude: 51.3889736 },
  },
  JAFARI: {
    id: 0,
    name: "Shia Ithna-Ashari, Leva Institute, Qum",
    params: { Fajr: 16, Isha: 14, Maghrib: 4, Midnight: "JAFARI" },
    location: { latitude: 34.6415764, longitude: 50.8746035 },
  },
  GULF: {
    id: 8,
    name: "Gulf Region",
    params: { Fajr: 19.5, Isha: "90 min" },
    location: { latitude: 24.1323638, longitude: 53.3199527 },
  },
  KUWAIT: {
    id: 9,
    name: "Kuwait",
    params: { Fajr: 18, Isha: 17.5 },
    location: { latitude: 29.375859, longitude: 47.9774052 },
  },
  QATAR: {
    id: 10,
    name: "Qatar",
    params: { Fajr: 18, Isha: "90 min" },
    location: { latitude: 25.2854473, longitude: 51.5310398 },
  },
  SINGAPORE: {
    id: 11,
    name: "Majlis Ugama Islam Singapura, Singapore",
    params: { Fajr: 20, Isha: 18 },
    location: { latitude: 1.352083, longitude: 103.819836 },
  },
  FRANCE: {
    id: 12,
    name: "Union Organization Islamic de France",
    params: { Fajr: 12, Isha: 12 },
    location: { latitude: 48.856614, longitude: 2.3522219 },
  },
  TURKEY: {
    id: 13,
    name: "Diyanet İşleri Başkanlığı, Turkey (experimental)",
    params: { Fajr: 18, Isha: 17 },
    location: { latitude: 39.9333635, longitude: 32.8597419 },
  },
  RUSSIA: {
    id: 14,
    name: "Spiritual Administration of Muslims of Russia",
    params: { Fajr: 16, Isha: 15 },
    location: { latitude: 54.734791, longitude: 55.9578555 },
  },
  MOONSIGHTING: {
    id: 15,
    name: "Moonsighting Committee Worldwide (Moonsighting.com)",
    params: { shafaq: "general" },
  },
  DUBAI: {
    id: 16,
    name: "Dubai (experimental)",
    params: { Fajr: 18.2, Isha: 18.2 },
    location: { latitude: 25.0762677, longitude: 55.087404 },
  },
  JAKIM: {
    id: 17,
    name: "Jabatan Kemajuan Islam Malaysia (JAKIM)",
    params: { Fajr: 20, Isha: 18 },
    location: { latitude: 3.139003, longitude: 101.686855 },
  },
  TUNISIA: {
    id: 18,
    name: "Tunisia",
    params: { Fajr: 18, Isha: 18 },
    location: { latitude: 36.8064948, longitude: 10.1815316 },
  },
  ALGERIA: {
    id: 19,
    name: "Algeria",
    params: { Fajr: 18, Isha: 17 },
    location: { latitude: 36.753768, longitude: 3.0587561 },
  },
  KEMENAG: {
    id: 20,
    name: "Kementerian Agama Republik Indonesia",
    params: { Fajr: 20, Isha: 18 },
    location: { latitude: -6.2087634, longitude: 106.845599 },
  },
  MOROCCO: {
    id: 21,
    name: "Morocco",
    params: { Fajr: 19, Isha: 17 },
    location: { latitude: 33.9715904, longitude: -6.8498129 },
  },
  PORTUGAL: {
    id: 22,
    name: "Comunidade Islamica de Lisboa",
    params: { Fajr: 18, Maghrib: "3 min", Isha: "77 min" },
    location: { latitude: 38.7222524, longitude: -9.1393366 },
  },
  JORDAN: {
    id: 23,
    name: "Ministry of Awqaf, Islamic Affairs and Holy Places, Jordan",
    params: { Fajr: 18, Maghrib: "5 min", Isha: 18 },
    location: { latitude: 31.9461222, longitude: 35.923844 },
  },
  CUSTOM: {
    id: 99,
  },
};

// Helper function to get method by ID
export const getMethodById = (id) => {
  return Object.values(CalculationMethods).find((method) => method.id === id);
};

// Helper function to get method name by ID
export const getMethodNameById = (id) => {
  return CalculationMethodName[id] || "UNKNOWN";
};
