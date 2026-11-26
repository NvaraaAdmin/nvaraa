/* Nvaraa — interactions (vanilla JS) */
(function () {
  "use strict";

  document.documentElement.classList.remove("no-js");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- Year ---------- */
  var year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Split headings into words (keeps <em> etc.) ---------- */
  $$("[data-split]").forEach(function (el) {
    var i = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var parts = child.textContent.split(/(\s+)/);
          var frag = document.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(" ")); return; }
            var span = document.createElement("span");
            span.className = "w";
            span.style.setProperty("--i", i++);
            span.textContent = p;
            frag.appendChild(span);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1) {
          walk(child);
        }
      });
    })(el);
  });

  /* ---------- Reveal on scroll ---------- */
  $$(".reveal").forEach(function (el) {
    var d = el.getAttribute("data-delay");
    if (d) el.style.setProperty("--d", d + "ms");
  });

  var hero = $(".hero");
  var revealTargets = $$(".reveal, [data-split]");

  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });

    revealTargets.forEach(function (el) {
      // hero content plays on load with a small stagger
      if (hero && hero.contains(el)) {
        if (el.matches("[data-split]")) el.style.setProperty("--base", "150ms");
        requestAnimationFrame(function () {
          setTimeout(function () { el.classList.add("is-in"); }, 80);
        });
      } else {
        io.observe(el);
      }
    });
  } else {
    revealTargets.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------- Nav: scrolled state, mobile menu, active link ---------- */
  var nav = $("#nav");
  var toggle = $("#navToggle");

  function onScrollNav() {
    nav.classList.toggle("is-scrolled", window.scrollY > 24);
  }

  if (toggle) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    $$("#navMobile a").forEach(function (a) {
      a.addEventListener("click", function () {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  var navLinks = $$(".nav__links a");
  var sections = navLinks
    .map(function (a) { return $(a.getAttribute("href")); })
    .filter(Boolean);

  function onScrollActive() {
    var y = window.scrollY + window.innerHeight * 0.35;
    var current = null;
    sections.forEach(function (s) { if (s.offsetTop <= y) current = s; });
    navLinks.forEach(function (a) {
      a.classList.toggle("is-active", current && a.getAttribute("href") === "#" + current.id);
    });
  }

  /* ---------- "First 50" grid ---------- */
  var grid = $("#team50");
  var dots = [];
  var hireCount = $("#hireCount");
  var hireBar = $("#hireBar");
  // A few coral highlights for the leadership hires
  var coralIdx = { 0: 1, 1: 1, 4: 1, 12: 1, 27: 1, 41: 1 };

  if (grid) {
    for (var n = 0; n < 50; n++) {
      var s = document.createElement("span");
      if (coralIdx[n]) s.className = "c";
      grid.appendChild(s);
      dots.push(s);
    }
  }

  var lastFilled = -1;
  function updateGrid() {
    if (!grid) return;
    var r = grid.getBoundingClientRect();
    var vh = window.innerHeight;
    // progress 0 → 1 as the grid travels from 90% to 35% of the viewport
    var p = (vh * 0.9 - r.top) / (vh * 0.55);
    if (reduceMotion) p = 1;
    p = Math.max(0, Math.min(1, p));
    var filled = Math.round(p * 50);
    if (filled === lastFilled) return;
    lastFilled = filled;
    for (var k = 0; k < 50; k++) dots[k].classList.toggle("on", k < filled);
    hireCount.textContent = (filled < 10 ? "0" : "") + filled;
    hireBar.style.width = (p * 100) + "%";
  }

  /* ---------- Journey line ---------- */
  var journey = $(".journey");
  var journeyFill = $("#journeyFill");
  var steps = $$(".journey__steps li");

  function updateJourney() {
    if (!journey) return;
    var r = journey.getBoundingClientRect();
    var vh = window.innerHeight;
    var p = (vh * 0.85 - r.top) / (vh * 0.45);
    if (reduceMotion) p = 1;
    p = Math.max(0, Math.min(1, p));
    journeyFill.style.width = (p * 100) + "%";
    steps.forEach(function (li, idx) {
      li.classList.toggle("on", p >= idx / (steps.length - 1) - 0.001);
    });
  }

  /* ---------- Count-up ---------- */
  function countUp(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    if (reduceMotion) { el.textContent = target; return; }
    var start = null;
    var dur = 1600;
    function tick(t) {
      if (!start) start = t;
      var k = Math.min(1, (t - start) / dur);
      var eased = 1 - Math.pow(1 - k, 4);
      el.textContent = Math.round(eased * target);
      if (k < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  var counters = $$("[data-count]");
  if ("IntersectionObserver" in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { countUp(e.target); cio.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { cio.observe(c); });
  } else {
    counters.forEach(function (c) { c.textContent = c.getAttribute("data-count"); });
  }

  /* ---------- Card glow follows pointer ---------- */
  $$(".card--glow").forEach(function (card) {
    card.addEventListener("pointermove", function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty("--mx", (e.clientX - r.left) + "px");
      card.style.setProperty("--my", (e.clientY - r.top) + "px");
    });
  });

  /* ---------- Magnetic buttons (fine pointers only) ---------- */
  if (!reduceMotion && window.matchMedia("(pointer: fine)").matches) {
    $$(".magnetic").forEach(function (btn) {
      btn.addEventListener("pointermove", function (e) {
        var r = btn.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * 0.18;
        var y = (e.clientY - r.top - r.height / 2) * 0.28;
        btn.style.transform = "translate(" + x + "px," + y + "px)";
      });
      btn.addEventListener("pointerleave", function () { btn.style.transform = ""; });
    });
  }

  /* ---------- Subtle hero parallax ---------- */
  var heroBg = $(".hero__bg");

  /* ---------- Scroll loop ---------- */
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      onScrollNav();
      onScrollActive();
      updateGrid();
      updateJourney();
      if (heroBg && !reduceMotion && window.scrollY < window.innerHeight * 1.2) {
        heroBg.style.transform = "translateY(" + window.scrollY * 0.25 + "px)";
      }
      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();
})();


/* ---------- Email picker for "Talk to us" ---------- */
(function () {
  "use strict";

  var EMAIL = "contact@nvaraa.com";
  var picker = document.getElementById("mailpick");
  if (!picker) return;

  var panel = picker.querySelector(".mailpick__panel");
  var copyBtn = document.getElementById("mailpickCopy");
  var copyLabel = copyBtn.querySelector("[data-copy-label]");
  var lastTrigger = null;
  var closeTimer = null;
  var copyTimer = null;

  function open(trigger) {
    clearTimeout(closeTimer);
    lastTrigger = trigger || null;
    picker.hidden = false;
    document.body.classList.add("mailpick-lock");
    // next frame so the transition plays
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { picker.classList.add("is-open"); });
    });
    var first = picker.querySelector(".mailpick__opt");
    if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, 60);
  }

  function close() {
    picker.classList.remove("is-open");
    document.body.classList.remove("mailpick-lock");
    closeTimer = setTimeout(function () {
      picker.hidden = true;
      resetCopy();
    }, 350);
    if (lastTrigger) lastTrigger.focus({ preventScroll: true });
  }

  function resetCopy() {
    copyBtn.classList.remove("is-copied");
    if (copyLabel) copyLabel.textContent = "Copy";
  }

  // Open from every "Talk to us" button
  Array.prototype.forEach.call(document.querySelectorAll("[data-email-picker]"), function (btn) {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      open(btn);
    });
  });

  // Close: backdrop, close button, Esc
  Array.prototype.forEach.call(picker.querySelectorAll("[data-mailpick-close]"), function (el) {
    el.addEventListener("click", close);
  });
  document.addEventListener("keydown", function (e) {
    if (picker.hidden) return;
    if (e.key === "Escape") { close(); return; }
    // keep keyboard focus inside the panel
    if (e.key === "Tab") {
      var f = panel.querySelectorAll("a, button");
      var firstEl = f[0], lastEl = f[f.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) { e.preventDefault(); lastEl.focus(); }
      else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); firstEl.focus(); }
    }
  });

  // Gmail / Outlook / mail app: let the link work, then close the panel
  Array.prototype.forEach.call(picker.querySelectorAll("a.mailpick__opt"), function (a) {
    a.addEventListener("click", function () { setTimeout(close, 150); });
  });

  // Copy email address
  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (err) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }

  function showCopied(ok) {
    clearTimeout(copyTimer);
    if (ok) {
      copyBtn.classList.add("is-copied");
      if (copyLabel) copyLabel.textContent = "Copied";
    } else {
      // clipboard blocked: select the address so it can be copied manually
      var sel = window.getSelection();
      var range = document.createRange();
      range.selectNodeContents(copyBtn.querySelector(".mailpick__email"));
      sel.removeAllRanges();
      sel.addRange(range);
    }
    copyTimer = setTimeout(resetCopy, 2500);
  }

  copyBtn.addEventListener("click", function () {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(EMAIL).then(
        function () { showCopied(true); },
        function () { showCopied(fallbackCopy(EMAIL)); }
      );
    } else {
      showCopied(fallbackCopy(EMAIL));
    }
  });
})();
