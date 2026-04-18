import { useContext, useEffect, useMemo } from "react";
import { Link as RouterLink } from "react-router";
import { ThemeContext } from "../../../contexts/ThemeContext";
import { useCalendar } from "../../../contexts/CalendarContext";
import "../../landing.css";

const coreFeatures = [
  {
    title: "Year-Based Event Generation",
    description:
      "Generate Islamic events for one year or multiple years so your calendar remains future-ready.",
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    title: "Subscriptions and Export",
    description:
      "Use subscription links for continuous updates or export .ics files for one-time imports.",
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
      >
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    ),
  },
  {
    title: "Definition-Level Control",
    description:
      "Show, hide, and color specific Islamic definitions so only relevant events appear in your workflow.",
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
      >
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
      </svg>
    ),
  },
  {
    title: "Prayer-Aligned Scheduling",
    description:
      "Coordinate reminders, offsets, and timing choices with your local routine and calendar habits.",
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
      >
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
  {
    title: "Location and Timezone Aware",
    description:
      "Event generation and display adapt to your selected location context and timezone behavior.",
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  },
  {
    title: "Privacy-Centered by Default",
    description:
      "Your account data is used for app functionality, with clear controls for subscriptions and account deletion.",
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
      >
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
  },
];

const howItWorks = [
  {
    title: "Sign In",
    desc: "Sign in with your Google or Microsoft account to unlock the calendar dashboard.",
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
      >
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
        <polyline points="10 17 15 12 10 7" />
        <line x1="15" y1="12" x2="3" y2="12" />
      </svg>
    ),
  },
  {
    title: "Choose Location & Definitions",
    desc: "Pick your location and select which Islamic definitions to track, with full color and visibility control.",
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
      >
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
  {
    title: "Generate Years of Events",
    desc: "Generate one year or many years of Islamic events at once so your calendar stays future-ready.",
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <polyline points="9 16 11 18 15 14" />
      </svg>
    ),
  },
  {
    title: "Sync or Export",
    desc: "Subscribe via a live URL for ongoing updates or export an .ics file for a one-time import into Google, Outlook, or Apple.",
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    ),
  },
];

const faqs = [
  {
    q: "How do I sync my prayers?",
    a: "Simply log in with your provider, select your location, and click the Sync button in the Calendar dashboard.",
  },
  {
    q: "How do upcoming Islamic days appear on Home?",
    a: "Generate events for at least one year in Calendar. Once generated, Home automatically shows your next upcoming Islamic days.",
  },
  {
    q: "Can I choose which Islamic events are included?",
    a: "Yes. Use the Islamic definitions panel to hide, show, or recolor definitions before syncing or exporting.",
  },
  {
    q: "Where can I learn what each event means?",
    a: "Use the Learn page for concise draft summaries and significance notes for each tracked Islamic event.",
  },
];

const trustBadges = [
  "Google / Outlook / Apple support",
  "Year-based event generation",
  "Definition-level filtering",
  "Learn-based event significance",
];

function formatDisplayDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function pickEnglishName(rawName) {
  const text = String(rawName ?? "").trim();
  if (!text) return "Untitled Islamic Event";
  if (!text.includes("|")) return text;
  const parts = text
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);
  return parts[1] ?? parts[0] ?? "Untitled Islamic Event";
}

const Home = () => {
  const themeContext = useContext(ThemeContext);
  const themeMode = themeContext?.themeMode ?? "light";
  const { events, generatedYearsRange } = useCalendar();

  const upcomingIslamicEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return events
      .filter(
        (event) =>
          Boolean(event.islamicDefinitionId) && Boolean(event.startDate),
      )
      .map((event) => ({ ...event, parsedDate: new Date(event.startDate) }))
      .filter(
        (event) =>
          !Number.isNaN(event.parsedDate.getTime()) &&
          event.parsedDate >= today,
      )
      .sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime())
      .slice(0, 5);
  }, [events]);

  const hasGeneratedIslamicYears =
    generatedYearsRange?.start != null && generatedYearsRange?.end != null;
  const shouldShowUpcomingIslamicDays =
    hasGeneratedIslamicYears && upcomingIslamicEvents.length > 0;

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const elements = document.querySelectorAll(".lp-root .animate-on-scroll");
    if (!("IntersectionObserver" in window)) {
      elements.forEach((el) => el.classList.add("visible"));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const delay = parseInt(el.getAttribute("data-delay") || "0", 10);
            if (delay > 0) {
              el.style.transitionDelay = `${delay}ms`;
            }
            requestAnimationFrame(() => {
              el.classList.add("visible");
            });
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [shouldShowUpcomingIslamicDays]);

  return (
    <div className="lp-root" data-lp-theme={themeMode}>
      {/* ===================== HERO ===================== */}
      <section className="lp-hero">
        <div className="lp-container lp-hero-inner">
          <div className="lp-hero-content animate-on-scroll" data-delay="0">
            <span className="lp-hero-badge">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              Designed for practical daily consistency
            </span>
            <h1 className="lp-hero-headline">
              Build a Living Islamic Calendar for
              <br />
              <span className="lp-gradient-text">Your Real Daily Routine</span>
            </h1>
            <p className="lp-hero-sub">
              Generate upcoming Islamic events, control what appears, and keep
              Google, Outlook, Apple, and subscription feeds aligned with your
              worship rhythm.
            </p>
            <div className="lp-hero-ctas" style={{ justifyContent: "center" }}>
              <RouterLink
                to="/auth/login"
                className="lp-btn lp-btn-primary lp-btn-lg"
              >
                Get Started
              </RouterLink>
              <RouterLink
                to="/learn"
                className="lp-btn lp-btn-outline lp-btn-lg"
              >
                Learn More
              </RouterLink>
            </div>
            <div className="lp-hero-trust">
              <span className="lp-trust-label">Includes:</span>
              {trustBadges.map((label) => (
                <span key={label} className="lp-trust-badge">
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div className="lp-hero-visual animate-on-scroll" data-delay="100">
            <img
              src="/ics-logo.png"
              alt="ICS Logo"
              width={82}
              height={82}
              className="lp-hero-logo"
            />
            <div className="lp-mockup-glow" />
            <div className="lp-calendar-mockup">
              <div className="lp-mockup-chrome">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{ color: "var(--lp-accent-bright)" }}
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span className="lp-mockup-title">Islamic Calendar Sync</span>
              </div>
              <div className="lp-mockup-body">
                <div className="lp-mockup-month">Ramadan 1446</div>
                <div className="lp-mockup-grid">
                  {Array.from({ length: 28 }).map((_, idx) => {
                    const day = idx + 1;
                    let cls = "lp-mockup-day";
                    if (day === 12) cls += " lp-mockup-day-today";
                    else if ([15, 21, 27].includes(day))
                      cls += " lp-mockup-day-event";
                    return (
                      <div key={day} className={cls}>
                        {day}
                      </div>
                    );
                  })}
                </div>
                <div className="lp-mockup-events">
                  <div className="lp-mockup-event-row">
                    <span className="lp-mockup-event-dot" />
                    <span className="lp-mockup-event-name">
                      Last 10 Nights Begin
                    </span>
                    <span className="lp-mockup-event-date">Day 21</span>
                  </div>
                  <div className="lp-mockup-event-row">
                    <span className="lp-mockup-event-dot" />
                    <span className="lp-mockup-event-name">Laylatul Qadr</span>
                    <span className="lp-mockup-event-date">Day 27</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== WHY / FRICTION VS APPROACH ===================== */}
      <section className="lp-section lp-why-section">
        <div className="lp-container">
          <div className="lp-why-grid">
            <div
              className="lp-why-col lp-why-problem animate-on-scroll"
              data-delay="0"
            >
              <h2 className="lp-why-heading">The Common Friction</h2>
              <ul className="lp-why-list">
                <li className="lp-why-item lp-why-bad">
                  <span className="lp-why-icon lp-bad-icon">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </span>
                  <span>
                    Islamic dates live in fragmented notes, static PDFs, and
                    inconsistent feeds.
                  </span>
                </li>
                <li className="lp-why-item lp-why-bad">
                  <span className="lp-why-icon lp-bad-icon">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </span>
                  <span>
                    Important days slip by when yearly updates are not generated
                    or synced early enough.
                  </span>
                </li>
                <li className="lp-why-item lp-why-bad">
                  <span className="lp-why-icon lp-bad-icon">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </span>
                  <span>
                    Generic calendars include events you don't follow and hide
                    the ones you actually care about.
                  </span>
                </li>
              </ul>
            </div>

            <div className="lp-why-divider" aria-hidden="true" />

            <div
              className="lp-why-col lp-why-solution animate-on-scroll"
              data-delay="100"
            >
              <h2 className="lp-why-heading">
                The Islamic Calendar Sync Approach
              </h2>
              <ul className="lp-why-list">
                <li className="lp-why-item lp-why-good">
                  <span className="lp-why-icon lp-good-icon">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  <span>
                    Generate event years in advance so future days are always
                    ready.
                  </span>
                </li>
                <li className="lp-why-item lp-why-good">
                  <span className="lp-why-icon lp-good-icon">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  <span>
                    Control every Islamic definition from a single panel —
                    visibility, color, and naming.
                  </span>
                </li>
                <li className="lp-why-item lp-why-good">
                  <span className="lp-why-icon lp-good-icon">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  <span>
                    Push reliable updates to Google, Outlook, and Apple via
                    subscription URLs or .ics export.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== FEATURES ===================== */}
      <section className="lp-section lp-features-section">
        <div className="lp-container">
          <div className="lp-section-header animate-on-scroll" data-delay="0">
            <h2 className="lp-section-title">
              Core Capabilities, Clearly Explained
            </h2>
            <p className="lp-section-sub">
              Purpose-built tools for managing Islamic dates, visibility, and
              synchronization.
            </p>
          </div>
          <div className="lp-features-grid">
            {coreFeatures.map((feature, idx) => (
              <div
                key={feature.title}
                className="lp-feature-card animate-on-scroll"
                data-delay={(idx % 3) * 60}
              >
                <div className="lp-feature-icon">{feature.icon}</div>
                <h3 className="lp-feature-title">{feature.title}</h3>
                <p className="lp-feature-desc">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== HOW IT WORKS ===================== */}
      <section className="lp-section lp-hiw-section">
        <div className="lp-container">
          <div className="lp-section-header animate-on-scroll" data-delay="0">
            <h2 className="lp-section-title">How It Works</h2>
            <p className="lp-section-sub">
              From sign-in to a synced calendar in four steps.
            </p>
          </div>
          <div className="lp-hiw-steps">
            <div className="lp-hiw-connector" aria-hidden="true" />
            {howItWorks.map((step, idx) => (
              <div
                key={step.title}
                className="lp-hiw-step animate-on-scroll"
                data-delay={idx * 80}
              >
                <div className="lp-step-number">{idx + 1}</div>
                <div className="lp-step-icon">{step.icon}</div>
                <h3 className="lp-step-title">{step.title}</h3>
                <p className="lp-step-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== UPCOMING ISLAMIC DAYS ===================== */}
      <section className="lp-section lp-upcoming-section">
        <div className="lp-container">
          <div className="lp-section-header animate-on-scroll" data-delay="0">
            <h2 className="lp-section-title">Upcoming Islamic Days</h2>
            <p className="lp-section-sub">
              These dates appear after event generation. Open Calendar to
              generate more years whenever you need longer planning coverage.
            </p>
          </div>

          {shouldShowUpcomingIslamicDays ? (
            <div className="lp-upcoming-grid animate-on-scroll" data-delay="0">
              {upcomingIslamicEvents.map((event) => (
                <div
                  key={
                    event.eventId ||
                    `${event.islamicDefinitionId}-${event.startDate}`
                  }
                  className="lp-upcoming-card"
                >
                  <div className="lp-upcoming-chip">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    Upcoming
                  </div>
                  <div className="lp-upcoming-info">
                    <h3 className="lp-upcoming-title">
                      {pickEnglishName(event.name)}
                    </h3>
                    <p className="lp-upcoming-date">
                      {formatDisplayDate(event.startDate)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="lp-info-banner animate-on-scroll" data-delay="0">
              <span className="lp-info-banner-icon">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
              </span>
              <span>
                Generate your first event year in Calendar to unlock upcoming
                Islamic days on Home.
              </span>
            </div>
          )}
        </div>
      </section>

      {/* ===================== LEARN CTA ===================== */}
      <section className="lp-section lp-cta-section">
        <div className="lp-container">
          <div className="lp-cta-card animate-on-scroll" data-delay="0">
            <div className="lp-cta-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
              >
                <path d="M12 3l1.9 5.8H20l-4.9 3.6 1.9 5.8L12 14.6l-5 3.6 1.9-5.8L4 8.8h6.1L12 3z" />
              </svg>
            </div>
            <h2 className="lp-cta-title">Explore Meanings on the Learn Page</h2>
            <p className="lp-cta-desc">
              Read concise significance notes for every tracked Islamic event,
              then refine them over time with your preferred scholarship
              summaries.
            </p>
            <RouterLink to="/learn" className="lp-btn lp-btn-primary lp-btn-lg">
              Open Learn
            </RouterLink>
          </div>
        </div>
      </section>

      {/* ===================== FAQ ===================== */}
      <section className="lp-section lp-faq-section" id="faq">
        <div className="lp-container">
          <div className="lp-section-header animate-on-scroll" data-delay="0">
            <h2 className="lp-section-title">Frequently Asked Questions</h2>
          </div>
          <div className="lp-faq-list">
            {faqs.map((faq, idx) => (
              <details
                key={faq.q}
                className="lp-faq-item animate-on-scroll"
                data-delay={idx * 60}
              >
                <summary className="lp-faq-summary">
                  <span>{faq.q}</span>
                  <span className="lp-faq-chevron">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </span>
                </summary>
                <div className="lp-faq-answer">{faq.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
