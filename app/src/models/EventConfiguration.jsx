export const defaultEventConfiguration = {
  eventConfigurationStart: Date.now(),
  eventConfigurationEnd: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days from now
};

export class EventConfiguration {
  constructor(data = {}) {
    this.eventConfigurationStart = data.eventConfigurationStart || Date.now();
    this.eventConfigurationEnd =
      data.eventConfigurationEnd || Date.now() + 7 * 24 * 60 * 60 * 1000;
  }

  setDateRange(start, end) {
    this.eventConfigurationStart = start;
    this.eventConfigurationEnd = end;
  }

  extendDateRange(days) {
    this.eventConfigurationEnd =
      this.eventConfigurationEnd + days * 24 * 60 * 60 * 1000;
  }
}
