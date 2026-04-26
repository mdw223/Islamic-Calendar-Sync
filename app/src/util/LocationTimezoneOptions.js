/**
 * Build timezone options for Islamic event generation: device first, then unique saved locations.
 * @param {Array<{ name?: string, timezone?: string }> | null | undefined} userLocations
 * @param {string} browserTimezone — IANA zone from Intl (e.g. device)
 * @returns {{ label: string, timezone: string }[]}
 */
export function buildLocationTimezoneOptions(userLocations, browserTimezone) {
  const options = [];
  const seen = new Set();
  const deviceTz = browserTimezone ?? "UTC";

  options.push({
    label: `Current Device (${deviceTz})`,
    timezone: deviceTz,
  });
  seen.add(deviceTz);

  for (const location of userLocations ?? []) {
    if (!location?.timezone || seen.has(location.timezone)) continue;
    seen.add(location.timezone);
    options.push({
      label: location?.name ?? location.timezone,
      timezone: location.timezone,
    });
  }

  return options;
}
