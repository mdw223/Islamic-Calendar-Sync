import { useContext, useEffect, useMemo } from "react";
import { ThemeContext } from "../../contexts/ThemeContext";
import islamicEventsData from "../../data/islamicEvents.json";
import "../landing.css";

const categoryMeta = {
  annual: {
    label: "Annual Days and Seasons",
    sub: "Yearly Islamic occasions and sacred seasons that anchor the Hijri calendar.",
  },
  monthly: {
    label: "Monthly Rhythms",
    sub: "Recurring days throughout each month that build steady spiritual habits.",
  },
  monthStart: {
    label: "Month Openings",
    sub: "The first day of each Islamic month — sacred reset points across the year.",
  },
};

const draftSummaries = {
  islamic_new_year:
    "Marks the opening of a new Hijri year and invites reflection on renewal, intention, and sincere repentance.",
  ashura:
    "A day tied to gratitude, fasting, and remembrance of divine deliverance, traditionally honored with devotion.",
  eid_mawlid:
    "Remembered by many communities as a time to increase salawat, gratitude, and love for the Prophet.",
  isra_miraj:
    "Commemorates the Night Journey tradition and renews focus on prayer, nearness, and spiritual ascent.",
  shab_e_barat:
    "Observed by many as a night of repentance, supplication, and spiritual preparation before Ramadan.",
  last_10_nights:
    "Signals the most intense final stretch of Ramadan worship, marked by night prayer and seeking mercy.",
  laylatul_qadr:
    "A night greater than a thousand months, centered on deep dua, Qur'an recitation, and hope in forgiveness.",
  eid_ul_fitr:
    "Celebrates completion of Ramadan with gratitude, prayer, charity, and communal joy.",
  dhul_hijjah_begins:
    "Begins a sacred season of devotion, sacrifice, and preparation for the days of Hajj and Eid.",
  first_10_dhul_hijjah:
    "The opening ten days are widely treated as exceptionally virtuous for worship, dhikr, and good deeds.",
  hajj:
    "The pilgrimage season recalls surrender, unity, and prophetic legacy through sacred rites.",
  arafah:
    "A day of immense supplication and mercy, especially known for fasting by non-pilgrims.",
  eid_al_adha:
    "Commemorates sacrifice, obedience, and generosity through prayer, family ties, and charitable giving.",
  days_of_tashreeq:
    "Days of remembrance, gratitude, and takbir following Eid al-Adha.",
  white_days:
    "Monthly fasting days that cultivate discipline and steady spiritual rhythm across the year.",
  month_start_muharram:
    "Muharram opens the year with sacred time consciousness and a call to renewed devotion.",
  month_start_safar:
    "Safar invites continuity in worship and character, away from superstition and toward trust in Allah.",
  month_start_rabi_awwal:
    "Rabi al-Awwal reminds believers of prophetic mercy, character, and gratitude.",
  month_start_rabi_thani:
    "A month-opening checkpoint to maintain consistency in worship and sincere intention.",
  month_start_jumada_awwal:
    "A renewed monthly beginning for reflection, family responsibility, and steady obedience.",
  month_start_jumada_thani:
    "An opportunity to continue spiritual momentum before the sacred months approach.",
  month_start_rajab:
    "Rajab, a sacred month, encourages restraint from wrongdoing and growth in remembrance.",
  month_start_shaban:
    "Sha'ban is often viewed as a preparation month for Ramadan through voluntary worship.",
  month_start_ramadan:
    "The beginning of Ramadan signals fasting, Qur'an focus, mercy, and disciplined worship.",
  month_start_shawwal:
    "Shawwal sustains post-Ramadan momentum through gratitude and continued worship.",
  month_start_dhul_qadah:
    "A sacred-month opening that emphasizes peace, reverence, and preparation for Hajj season.",
  month_start_dhul_hijjah:
    "Dhul Hijjah opens with pilgrimage focus, sacrifice themes, and heightened devotion.",
};

function groupEventsByCategory(events) {
  return events.reduce(
    (acc, event) => {
      const category = event.category || "annual";
      if (!acc[category]) acc[category] = [];
      acc[category].push(event);
      return acc;
    },
    { annual: [], monthly: [], monthStart: [] },
  );
}

export default function Learn() {
  const themeContext = useContext(ThemeContext);
  const themeMode = themeContext?.themeMode ?? "light";
  const grouped = useMemo(
    () => groupEventsByCategory(islamicEventsData.events || []),
    [],
  );

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const elements = document.querySelectorAll(
      ".lp-root .animate-on-scroll",
    );
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
  }, [grouped]);

  return (
    <div className="lp-root" data-lp-theme={themeMode}>
      {/* ===================== HERO ===================== */}
      <section className="lp-hero">
        <div className="lp-container lp-hero-inner lp-hero-single">
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
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              Learn
            </span>
            <h1 className="lp-hero-headline">
              Learn the Meaning Behind
              <br />
              <span className="lp-gradient-text">Islamic Events</span>
            </h1>
            <p className="lp-hero-sub">
              This page introduces the significance of events already present in
              the app. Summaries are short placeholders that will be refined
              with final wording over time.
            </p>
            <p
              className="lp-hero-sub"
              style={{ fontSize: "0.9375rem", marginTop: "-18px" }}
            >
              Source note: Draft framing is based on themes associated with the
              work commonly referred to as <em>The Islamic Months</em> by
              al-Hafiz Ibn Rajab al-Hanbali, presented here as paraphrased
              summaries.
            </p>
          </div>
        </div>
      </section>

      {/* ===================== CATEGORY SECTIONS ===================== */}
      {Object.entries(categoryMeta).map(([category, meta], categoryIdx) => {
        const events = grouped[category] || [];
        if (events.length === 0) return null;

        const sectionClass =
          categoryIdx % 2 === 0
            ? "lp-section lp-features-section"
            : "lp-section lp-hiw-section";

        return (
          <section key={category} className={sectionClass}>
            <div className="lp-container">
              <div className="lp-section-header animate-on-scroll" data-delay="0">
                <h2 className="lp-section-title">{meta.label}</h2>
                <p className="lp-section-sub">{meta.sub}</p>
              </div>
              <div className="lp-features-grid lp-features-grid-2">
                {events.map((event, idx) => (
                  <div
                    key={event.id}
                    className="lp-feature-card animate-on-scroll"
                    data-delay={(idx % 4) * 60}
                  >
                    <div className="lp-feature-icon">
                      <svg
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                      >
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                      </svg>
                    </div>
                    <h3 className="lp-feature-title">{event.titleEn}</h3>
                    <p className="lp-feature-subtitle">{event.titleAr}</p>
                    <p className="lp-feature-desc">
                      {draftSummaries[event.id] ||
                        "Draft summary coming soon for this event."}
                    </p>
                    <span className="lp-feature-caption">
                      Draft status: summary placeholder
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
