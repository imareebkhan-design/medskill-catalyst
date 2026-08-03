/* ─────────────────────────────────────────────────────────────────────────
   MedSkills Catalyst — Meta (Facebook) Pixel
   Single source of truth for the STATIC site (index.html + policy/marketing
   pages). Loaded once, cached, and shared by every static page so the Pixel
   ID lives in exactly one place.

   The Next.js app (src/app) loads the pixel separately via <MetaPixel/> using
   the NEXT_PUBLIC_META_PIXEL_ID env var — see src/components/MetaPixel.tsx.

   Note: a Meta Pixel ID is a PUBLIC client-side identifier (it appears in
   every request to facebook.com/tr), not a secret.

   Usage on a page:
     <script async src="/assets/meta-pixel.js"></script>
     <noscript><img height="1" width="1" style="display:none"
       src="https://www.facebook.com/tr?id=2086725265526325&ev=PageView&noscript=1"/></noscript>

   Fire a conversion elsewhere on the page (safe no-op if the pixel is blocked
   or still loading):
     window.fbTrack('Lead', { content_name: 'Lead magnet' });
   ──────────────────────────────────────────────────────────────────────── */
(function () {
  var PIXEL_ID = '2086725265526325';

  // Standard Meta Pixel bootstrap (defines fbq and queues calls until
  // fbevents.js has loaded).
  !(function (f, b, e, v, n, t, s) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = '2.0';
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

  window.fbq('init', PIXEL_ID);
  window.fbq('track', 'PageView');

  /**
   * Safe wrapper for standard/custom Meta events. No-ops if fbq is unavailable
   * (blocked, not yet loaded, or errored) so page logic is never affected.
   * @param {string} event     Standard event name, e.g. 'Lead'.
   * @param {object} [params]   Optional event parameters.
   * @param {string} [eventId]  Shared id for browser↔server (Conversions API)
   *                            deduplication. Pass the same value your form
   *                            sends to the server as `fb_event_id`.
   */
  window.fbTrack = function (event, params, eventId) {
    try {
      if (typeof window.fbq === 'function') {
        if (eventId) {
          window.fbq('track', event, params || {}, { eventID: eventId });
        } else {
          window.fbq('track', event, params || {});
        }
      }
    } catch (e) {
      /* never let analytics break the page */
    }
  };

  /**
   * Generate a unique event id to share between the browser pixel and the
   * server-side Conversions API call for the same action (deduplication).
   * @returns {string}
   */
  window.fbNewId = function () {
    try {
      if (window.crypto && typeof window.crypto.randomUUID === 'function') {
        return window.crypto.randomUUID();
      }
    } catch (e) {
      /* fall through */
    }
    return 'e' + Date.now() + '-' + Math.random().toString(36).slice(2);
  };
})();
