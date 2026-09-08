import { escapeHtml } from "@/src/lib/homepage-sentinels";
import type { PublicFaculty, PublicStory } from "@/src/lib/site-content";

/**
 * HTML generators for the homepage's success-story and faculty cards.
 *
 * These reproduce the existing hand-written markup exactly — same elements,
 * same class names, same attribute order. The homepage's own CSS and
 * JavaScript then keep working untouched:
 *
 *   - `.success-marquee-track` auto-scroll measures `scrollWidth - clientWidth`
 *     at run time. It never clones cards and never derives distance from a card
 *     count, so a different number of cards is safe: fewer cards simply means
 *     less overflow, and none means no scroll.
 *   - `toggleTestimonial(this)` walks up from the button to `.success-card`,
 *     so the button must stay inside the card with that exact handler.
 *   - `.fade-up` on faculty cards is the existing scroll-reveal hook.
 *
 * Pure and dependency-free so every generator can be unit-tested. Every value
 * that reaches the document goes through escapeHtml — CMS text is trusted to
 * be authored by staff, but it is still never interpolated raw.
 */

const LINKEDIN_SVG =
  '<svg class="card-linkedin-icon" viewBox="0 0 24 24" style="width: 14px; height: 14px; fill: currentColor;"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>';

const ARROW_SVG =
  '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';

/**
 * Only http(s) and site-relative image paths are emitted.
 *
 * Returns null for anything else — including `javascript:` and `data:` — so a
 * bad value produces no <img> at all rather than `src="undefined"` or an
 * executable attribute. The CMS validates on write; this is the second gate,
 * because the homepage renders whatever is already in the database.
 */
export function safeImageSrc(value: string | null): string | null {
  if (!value) return null;
  const v = value.trim();
  if (!v) return null;
  if (/^(javascript|data|vbscript|file):/i.test(v)) return null;
  if (/^https?:\/\//i.test(v)) return v;
  if (v.startsWith("//")) return null;
  if (v.includes("..")) return null;
  // Site-relative: match how the original markup references assets/…
  return v.replace(/^\/+/, "");
}

/** Only absolute http(s) links become anchors. */
export function safeLinkHref(value: string | null): string | null {
  if (!value) return null;
  const v = value.trim();
  if (!/^https?:\/\//i.test(v)) return null;
  return v;
}

/** "Marketing Manager, Medtronic India" from separate role and company. */
function joinRole(designation: string | null, company: string | null): string {
  const parts = [designation, company].filter(
    (p): p is string => !!p && p.trim().length > 0,
  );
  return parts.join(", ");
}

// ── Success stories ──────────────────────────────────────────────────

export function renderStoryCard(story: PublicStory): string {
  const img = safeImageSrc(story.profileImageUrl);
  const linkedin = safeLinkHref(story.linkedinUrl);
  const before = joinRole(story.previousDesignation, story.previousCompany);
  const after = joinRole(story.currentDesignation, story.currentCompany);
  const name = escapeHtml(story.fullName);

  const avatar = img
    ? `<img src="${escapeHtml(img)}" alt="${name}" class="success-avatar-img" loading="lazy" decoding="async">`
    : "";

  const linkedinAnchor = linkedin
    ? `<a href="${escapeHtml(linkedin)}" target="_blank" rel="noopener noreferrer" class="success-card-linkedin" title="LinkedIn Profile">${LINKEDIN_SVG}</a>`
    : "";

  const category = story.growthHeadline
    ? `<span class="success-card-category">${escapeHtml(story.growthHeadline)}</span>`
    : "";

  // The journey block only renders when there is a transition to show, so a
  // partially filled record cannot produce an empty arrow with blank nodes.
  const journey =
    before || after
      ? `<div class="growth-journey">
              <span class="growth-journey-title">Growth Journey</span>
              <span class="growth-journey-node node-before">${escapeHtml(before)}</span>
              <span class="growth-journey-arrow-down">${ARROW_SVG}</span>
              <span class="growth-journey-node node-after">${escapeHtml(after)}</span>
            </div>`
      : "";

  const quote = story.testimonial ?? story.shortDescription ?? "";
  const testimonial = quote
    ? `<div class="success-testimonial-section">
              <div class="success-testimonial-wrapper">
                <p class="success-testimonial-text">${escapeHtml(quote)}</p>
              </div>
              <button type="button" class="success-story-toggle-btn" onclick="toggleTestimonial(this)">Read Full Story <span>&rarr;</span></button>
            </div>`
    : "";

  return `
          <div class="success-card">
            <div class="success-card-top">
              <div class="success-badge-verified">
                <span class="badge-dot-blue"></span> VERIFIED TRANSITION
              </div>
            </div>
            <div class="success-profile-row">
              ${avatar}
              <div class="success-profile-info">
                <div class="success-card-name-row">
                  <span class="success-card-name">${name}</span>
                  ${linkedinAnchor}
                </div>
                ${category}
              </div>
            </div>
            ${journey}
            ${testimonial}
          </div>`;
}

/**
 * Split published stories across the two marquee tracks.
 *
 * The homepage today shows display_order 1-3 in track-1 and 4-6 in track-2, so
 * a straight split in half reproduces the current page exactly when all six are
 * published in order. An odd count puts the extra card in the first track,
 * matching how the rows are already weighted.
 *
 * The alternative — alternating 1,3,5 / 2,4,6 — would reshuffle the existing
 * page for no editorial reason, so it is deliberately not used.
 */
export function splitIntoTracks<T>(items: T[]): [T[], T[]] {
  if (items.length === 0) return [[], []];
  const firstCount = Math.ceil(items.length / 2);
  return [items.slice(0, firstCount), items.slice(firstCount)];
}

/** Cards for one track, or null when there is nothing to show. */
export function renderStoryTrack(stories: PublicStory[]): string | null {
  if (stories.length === 0) return null;
  return stories.map(renderStoryCard).join("\n") + "\n        ";
}

// ── Faculty ──────────────────────────────────────────────────────────

export function renderFacultyCard(member: PublicFaculty): string {
  const img = safeImageSrc(member.profileImageUrl);
  const name = escapeHtml(member.fullName);

  // The original markup always has a portrait container; keeping it when the
  // image is missing preserves the grid's sizing rather than collapsing a card.
  const portrait = img
    ? `<img class="faculty-portrait" src="${escapeHtml(img)}" alt="${name}" loading="lazy" style="object-position: center;">`
    : "";

  const badges =
    member.expertise.length > 0
      ? `<div class="faculty-badges">
            ${member.expertise
              .map((tag) => `<span class="faculty-badge">${escapeHtml(tag)}</span>`)
              .join("\n            ")}
          </div>`
      : "";

  const bioText = member.fullBio ?? member.shortBio ?? "";
  const bio = bioText ? `<p class="faculty-bio">${escapeHtml(bioText)}</p>` : "";

  const role = joinRole(member.designation, member.organization);

  return `
      <div class="faculty-card fade-up">
        <div class="faculty-av-wrap">
          <div class="faculty-portrait-container">
            ${portrait}
          </div>
        </div>
        <div class="faculty-details">
          <div class="faculty-name">${name}</div>
          <div class="faculty-role">${escapeHtml(role)}</div>
          ${badges}
          ${bio}
        </div>
      </div>`;
}

/** All faculty cards, or null when there are none. */
export function renderFacultyGrid(faculty: PublicFaculty[]): string | null {
  if (faculty.length === 0) return null;
  return faculty.map(renderFacultyCard).join("\n") + "\n    ";
}
