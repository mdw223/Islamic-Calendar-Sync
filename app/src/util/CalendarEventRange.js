/**
 * Default GET /events query range: cover generated years plus padding around today.
 *
 * @param {{ generatedYearsStart?: number | null, generatedYearsEnd?: number | null }} opts
 * @returns {{ from: string, to: string }} ISO date-only strings YYYY-MM-DD
 */
export function getDefaultEventsQueryRange(opts = {}) {
  const y = new Date().getFullYear();
  const gStart = opts.generatedYearsStart ?? y;
  const gEnd = opts.generatedYearsEnd ?? y;
  const pad = 1;
  const fromYear = Math.min(gStart, y - pad);
  const toYear = Math.max(gEnd, y + pad);
  return {
    from: `${fromYear}-01-01`,
    to: `${toYear}-12-31`,
  };
}
