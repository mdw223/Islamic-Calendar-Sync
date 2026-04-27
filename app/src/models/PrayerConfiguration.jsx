import { CalculationMethods } from "./CalculationMethods";
export const defaultPrayerConfiguration = {
  prayerConfigurationStart: Date.now(),
  prayerConfigurationEnd: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days from now
  calculationMethod: null,
  hanafi: false,
};

export class PrayerConfiguration {
  constructor(data = {}) {
    this.prayerConfigurationStart = data.prayerConfigurationStart || Date.now();
    this.prayerConfigurationEnd =
      data.prayerConfigurationEnd || Date.now() + 7 * 24 * 60 * 60 * 1000;
    this.calculationMethod = data.calculationMethod || null; // TODO: fetch from API instead ? https://api.aladhan.com/v1/methods refer to user's calculationMethodId
    this.hanafi = data.hanafi || false;
  }

  setDateRange(start, end) {
    this.prayerConfigurationStart = start;
    this.prayerConfigurationEnd = end;
  }

  extendDateRange(days) {
    this.prayerConfigurationEnd =
      this.prayerConfigurationEnd + days * 24 * 60 * 60 * 1000;
  }
}
