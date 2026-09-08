import { test } from "node:test";
import assert from "node:assert/strict";
import {
  injectSentinels,
  startMarker,
  endMarker,
  escapeHtml,
  escapeJsString,
} from "../src/lib/homepage-sentinels";

const wrap = (key: string, inner: string) =>
  `${startMarker(key)}${inner}${endMarker(key)}`;

test("replaces content between a sentinel pair", () => {
  const tpl = `<p>${wrap("cohort.long", "26 September 2026")}</p>`;
  const r = injectSentinels(tpl, [{ key: "cohort.long", value: "3 November 2026" }]);
  assert.ok(r.html.includes("3 November 2026"));
  assert.ok(!r.html.includes("26 September 2026"));
  assert.deepEqual(r.replaced, ["cohort.long"]);
});

test("keeps the markers so injection is repeatable", () => {
  const tpl = wrap("k", "old");
  const once = injectSentinels(tpl, [{ key: "k", value: "first" }]).html;
  const twice = injectSentinels(once, [{ key: "k", value: "second" }]).html;
  assert.ok(twice.includes("second"));
  assert.ok(!twice.includes("first"));
  assert.ok(twice.includes(startMarker("k")) && twice.includes(endMarker("k")));
});

test("replaces EVERY occurrence of a key", () => {
  const tpl = `${wrap("d", "old")} … ${wrap("d", "old")} … ${wrap("d", "old")}`;
  const r = injectSentinels(tpl, [{ key: "d", value: "new" }]);
  assert.equal(r.html.split("new").length - 1, 3);
  assert.ok(!r.html.includes("old"));
});

test("a missing sentinel leaves the document untouched", () => {
  const tpl = "<p>original content</p>";
  const r = injectSentinels(tpl, [{ key: "absent", value: "injected" }]);
  assert.equal(r.html, tpl);
  assert.deepEqual(r.missing, ["absent"]);
  assert.ok(!r.html.includes("injected"));
});

test("a null or empty value keeps the fallback — this is the safety net", () => {
  const tpl = wrap("faculty", "<div>original faculty</div>");
  for (const value of [null, ""]) {
    const r = injectSentinels(tpl, [{ key: "faculty", value }]);
    assert.ok(
      r.html.includes("original faculty"),
      "an empty CMS must never blank a section",
    );
    assert.deepEqual(r.skipped, ["faculty"]);
  }
});

test("an unbalanced sentinel is skipped, not guessed at", () => {
  // Opening marker with no closing marker: the rest of the document must not
  // be swallowed.
  const tpl = `<p>before</p>${startMarker("k")}dangling<p>after</p>`;
  const r = injectSentinels(tpl, [{ key: "k", value: "X" }]);
  assert.equal(r.html, tpl, "document must be returned unchanged");
  assert.ok(r.missing.includes("k") || r.malformed.includes("k"));
  assert.ok(r.html.includes("after"), "trailing content must survive");
});

test("a closing marker before an opening one does not corrupt the page", () => {
  const tpl = `${endMarker("k")}stray${startMarker("k")}real${endMarker("k")}`;
  const r = injectSentinels(tpl, [{ key: "k", value: "X" }]);
  assert.ok(r.html.includes("stray"), "content before the pair must survive");
  assert.ok(r.html.includes("X"));
});

test("unrelated content is never touched", () => {
  const tpl = `<h1>Cohort starts 26 September 2026</h1>${wrap("k", "26 September 2026")}`;
  const r = injectSentinels(tpl, [{ key: "k", value: "3 November 2026" }]);
  assert.ok(
    r.html.includes("<h1>Cohort starts 26 September 2026</h1>"),
    "text outside the sentinels must be left alone",
  );
  assert.equal(r.html.split("3 November 2026").length - 1, 1);
});

test("JS-syntax sentinels work inside script content", () => {
  const tpl = `var a = {q:'x', a:'starts on /* cms:d:start */26 September 2026/* cms:d:end */.'};`;
  const r = injectSentinels(tpl, [{ key: "d", syntax: "js", value: "3 November 2026" }]);
  assert.ok(r.html.includes("3 November 2026"));
  assert.ok(!r.html.includes("<!--"), "must not introduce HTML comments into JS");
  assert.deepEqual(r.replaced, ["d"]);
});

test("HTML and JS markers for the same key do not collide", () => {
  const tpl = `${wrap("d", "html-old")} /* cms:d:start */js-old/* cms:d:end */`;
  const html = injectSentinels(tpl, [{ key: "d", value: "H" }]).html;
  const both = injectSentinels(html, [{ key: "d", syntax: "js", value: "J" }]).html;
  assert.ok(both.includes("H") && both.includes("J"));
  assert.ok(!both.includes("html-old") && !both.includes("js-old"));
});

test("several keys are applied independently", () => {
  const tpl = `${wrap("a", "1")}${wrap("b", "2")}${wrap("c", "3")}`;
  const r = injectSentinels(tpl, [
    { key: "a", value: "A" },
    { key: "b", value: null },
    { key: "missing", value: "X" },
  ]);
  assert.ok(r.html.includes("A"));
  assert.ok(r.html.includes("2"), "b keeps its fallback");
  assert.ok(r.html.includes("3"), "c untouched");
  assert.deepEqual(r.replaced, ["a"]);
  assert.deepEqual(r.skipped, ["b"]);
  assert.deepEqual(r.missing, ["missing"]);
});

test("escapeHtml neutralises markup from CMS content", () => {
  assert.equal(
    escapeHtml('<img src=x onerror="alert(1)">'),
    "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;",
  );
  assert.equal(escapeHtml("Tom & Jerry's"), "Tom &amp; Jerry&#39;s");
});

test("escapeJsString cannot break out of a JS string or the script tag", () => {
  assert.equal(escapeJsString("it's"), "it\\'s");
  assert.equal(escapeJsString("a\\b"), "a\\\\b");
  assert.ok(!escapeJsString("</script><script>alert(1)</script>").includes("</script"));
  assert.ok(!escapeJsString("line1\nline2").includes("\n"));
});
