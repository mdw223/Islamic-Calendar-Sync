/**
 * sanitizeHtml.js
 *
 * Server-side HTML sanitisation for event descriptions.
 * Uses sanitize-html with an allowlist of safe tags/attributes.
 */

import sanitize from "sanitize-html";

const SANITIZE_OPTIONS = {
  allowedTags: [
    "p",
    "br",
    "b",
    "strong",
    "i",
    "em",
    "u",
    "s",
    "ul",
    "ol",
    "li",
    "span",
  ],
  allowedAttributes: {
    span: ["style", "class"],
    p: ["style", "class"],
  },
  allowedStyles: {
    "*": {
      "text-decoration": [/^line-through$/],
      "font-weight": [/^bold$|^700$/],
      "font-style": [/^italic$/],
    },
  },
  // Strip everything not on the allowlist rather than escaping it.
  disallowedTagsMode: "discard",
};

/**
 * Sanitise an HTML description string.
 * Returns the cleaned HTML, or null if the input is falsy.
 *
 * @param {string|null|undefined} html
 * @returns {string|null}
 */
export function sanitizeDescription(html) {
  if (!html) return null;
  const clean = sanitize(html, SANITIZE_OPTIONS).trim();
  return clean || null;
}
