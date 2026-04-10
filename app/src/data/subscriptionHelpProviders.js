export const SUBSCRIPTION_HELP_PROVIDERS = [
  {
    id: "google-calendar",
    title: "Google Calendar",
    audience: "Web and mobile",
    officialLabel: "Open Google Help",
    officialUrl: "https://support.google.com/calendar/answer/37100?hl=en",
    youtubeLabel: "Watch a YouTube tutorial",
    youtubeUrl:
      "https://www.youtube.com/results?search_query=add+calendar+subscription+url+to+google+calendar",
    summary:
      "Add the subscription URL from your feed settings into Google Calendar so it stays subscribed and updates automatically.",
    steps: [
      "Open Google Calendar.",
      "Find the Add other calendars option and choose From URL.",
      "Paste the subscription URL you copied from this app.",
      "Save or add the calendar, then wait for Google to sync it.",
    ],
    note:
      "Google may refresh subscribed calendars on its own schedule, so changes can take a little time to appear.",
  },
  {
    id: "outlook",
    title: "Outlook",
    audience: "Web and desktop",
    officialLabel: "Open Microsoft Support",
    officialUrl:
      "https://support.microsoft.com/en-us/office/import-or-subscribe-to-a-calendar-in-outlook-com-or-outlook-on-the-web-7eacb5b1-5b86-4f43-8d0b-8e8a3b1f8b39",
    youtubeLabel: "Watch a YouTube tutorial",
    youtubeUrl:
      "https://www.youtube.com/results?search_query=subscribe+to+calendar+url+in+outlook",
    summary:
      "Use Outlook's calendar add or subscribe flow and paste the feed URL when prompted.",
    steps: [
      "Open Outlook Calendar.",
      "Choose Add calendar or Subscribe from web.",
      "Paste the subscription URL from this app.",
      "Save the calendar and wait for Outlook to fetch the feed.",
    ],
    note:
      "Outlook wording can differ between web, new Outlook, and desktop versions, so the official guide is the safest source.",
  },
  {
    id: "apple-calendar",
    title: "Apple Calendar",
    audience: "macOS and iPhone/iPad",
    officialLabel: "Open Apple Support",
    officialUrl: "https://support.apple.com/guide/calendar/subscribe-to-calendars-icl1022/mac",
    youtubeLabel: "Watch a YouTube tutorial",
    youtubeUrl:
      "https://www.youtube.com/results?search_query=add+subscription+url+to+apple+calendar",
    summary:
      "Subscribe to the feed in Apple Calendar so your calendar app keeps pulling updates from the URL.",
    steps: [
      "Open Apple Calendar.",
      "Use the File or Calendar menu and choose New Calendar Subscription.",
      "Paste the subscription URL from this app.",
      "Confirm the subscription and choose your refresh settings if prompted.",
    ],
    note:
      "The menu path can vary slightly by device and OS version, which is why the Apple Support article is linked here.",
  },
  {
    id: "ical",
    title: "iCal / ICS-compatible apps",
    audience: "Generic calendar apps",
    officialLabel: "View the iCalendar spec",
    officialUrl: "https://datatracker.ietf.org/doc/html/rfc5545",
    youtubeLabel: "Watch a YouTube tutorial",
    youtubeUrl:
      "https://www.youtube.com/results?search_query=subscribe+to+ics+calendar+url",
    summary:
      "If your app supports subscribed calendars or a web calendar URL, you can usually paste the feed directly.",
    steps: [
      "Open the calendar app you want to use.",
      "Look for Subscribe by URL, Add calendar from web, or similar wording.",
      "Paste the subscription URL from this app.",
      "Save and allow the app time to sync the feed.",
    ],
    note:
      "Apps that support the iCalendar standard may label the feature differently, but the feed format is the same.",
  },
];
