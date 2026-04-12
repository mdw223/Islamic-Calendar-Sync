import { sanitizeDescription } from "./SanitizeHtml.js";

describe("sanitizeDescription", () => {
  test("returns null for falsy input", () => {
    expect(sanitizeDescription(undefined)).toBeNull();
    expect(sanitizeDescription(null)).toBeNull();
    expect(sanitizeDescription("")).toBeNull();
  });

  test("removes disallowed tags and keeps allowed formatting tags", () => {
    const raw = `<script>alert(1)</script><p><strong>Bold</strong> and <em>italic</em></p>`;
    const clean = sanitizeDescription(raw);

    expect(clean).toContain("<p>");
    expect(clean).toContain("<strong>Bold</strong>");
    expect(clean).toContain("<em>italic</em>");
    expect(clean).not.toContain("<script>");
    expect(clean).not.toContain("alert(1)");
  });

  test("trims and returns null when sanitized output is empty", () => {
    const clean = sanitizeDescription("<script>only-script</script>");
    expect(clean).toBeNull();
  });
});
