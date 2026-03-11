// Utility to merge system events and user overrides (child events)

/**
 * Merge system events and user overrides for a user.
 * If a child event exists for a system event, use the child; otherwise, use the system event occurrence.
 * @param {Array<Object>} systemEvents - All system events (IsSystemEvent = true)
 * @param {Array<Object>} userEvents - All user events (IsSystemEvent = false, ParentEventId set)
 * @returns {Array<Object>} - Merged events for calendar display
 */
export function mergeSystemAndUserEvents(systemEvents, userEvents) {
  const merged = [];
  const childMap = new Map();

  for (const child of userEvents) {
    if (child.parentEventId) {
      childMap.set(child.parentEventId, child);
    }
  }

  for (const sysEvent of systemEvents) {
    if (childMap.has(sysEvent.eventId)) {
      merged.push(childMap.get(sysEvent.eventId));
    } else {
      merged.push(sysEvent);
    }
  }

  // Optionally, add user-created events not linked to system events
  for (const child of userEvents) {
    if (!child.parentEventId) {
      merged.push(child);
    }
  }

  return merged;
}
