/* ============================================================
   Faiq Aziz — Portfolio interactions
   Vanilla JS, no dependencies. Everything degrades gracefully.
   Includes: nav, mobile menu, scroll-reveal, stat counters,
   contact form, and a 3D tilt + parallax motion layer.
   ============================================================ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer  = window.matchMedia("(pointer: fine)").matches;
  var motion3d = finePointer && !reduceMotion;

  /* ---------- Current year in footer ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Sticky nav shadow + scroll parallax ---------- */
  var nav = document.querySelector(".nav");
  var showcase = document.querySelector(".hero__showcase");
  function onScroll() {
    if (nav) nav.classList.toggle("is-stuck", window.scrollY > 8);
    if (motion3d && showcase && window.innerWidth > 1000) {
      var offset = Math.min(window.scrollY, 700) * 0.05;
      showcase.style.setProperty("--sy", offset.toFixed(1) + "px");
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  var toggle = document.getElementById("navToggle");
  var links = document.getElementById("navLinks");

  function closeMenu() {
    if (!links || !toggle) return;
    links.classList.remove("is-open");
    toggle.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
  }

  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("is-open");
      toggle.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });

    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 760) closeMenu();
    });
  }

  /* ---------- Scroll reveal ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ---------- Animated stat counters ---------- */
  var counters = document.querySelectorAll(".hero__stats strong[data-count]");
  function animateCount(el) {
    var target = parseFloat(el.getAttribute("data-count")) || 0;
    var suffix = el.getAttribute("data-suffix") || "";
    if (reduceMotion) { el.textContent = target + suffix; return; }
    var start = null, dur = 1100;
    function tick(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  if (counters.length && "IntersectionObserver" in window) {
    var countObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { animateCount(entry.target); obs.unobserve(entry.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { countObserver.observe(el); });
  } else {
    counters.forEach(function (el) {
      el.textContent = (el.getAttribute("data-count") || "") + (el.getAttribute("data-suffix") || "");
    });
  }

  /* ---------- Active nav link highlight ---------- */
  var sections = document.querySelectorAll("section[id]");
  var navLinkMap = {};
  document.querySelectorAll(".nav__link").forEach(function (a) {
    var id = a.getAttribute("href");
    if (id && id.charAt(0) === "#") navLinkMap[id.slice(1)] = a;
  });
  if (sections.length && "IntersectionObserver" in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = navLinkMap[entry.target.id];
        if (link && entry.isIntersecting) {
          document.querySelectorAll(".nav__link").forEach(function (l) { l.style.color = ""; });
          link.style.color = "var(--accent-ink)";
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ============================================================
     3D TILT — mouse-tracking rotation + glare on cards & mock
     ============================================================ */
  if (motion3d) {
    var tiltEls = document.querySelectorAll(".card, .step, .portrait, .browser");
    tiltEls.forEach(function (el) {
      var isFeature = el.classList.contains("portrait") || el.classList.contains("browser");
      var maxDeg = isFeature ? 10 : 7;
      // resting pose (the portrait keeps its stylised angle when idle)
      var restRx = isFeature ? "3deg" : "0deg";
      var restRy = isFeature ? "-8deg" : "0deg";

      el.classList.add("is3d");
      el.style.setProperty("--rx", restRx);
      el.style.setProperty("--ry", restRy);

      var raf = null, pending = null;

      el.addEventListener("pointerenter", function () {
        el.style.setProperty("--sc", "1.02");
        el.style.setProperty("--ty", "-6px");
        el.style.setProperty("--glare", "1");
      });

      el.addEventListener("pointermove", function (e) {
        var rect = el.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        pending = {
          ry: ((x / rect.width - 0.5) * maxDeg).toFixed(2),
          rx: ((0.5 - y / rect.height) * maxDeg).toFixed(2),
          mx: x.toFixed(0),
          my: y.toFixed(0)
        };
        if (raf) return;
        raf = requestAnimationFrame(function () {
          raf = null;
          if (!pending) return;
          el.style.setProperty("--ry", pending.ry + "deg");
          el.style.setProperty("--rx", pending.rx + "deg");
          el.style.setProperty("--mx", pending.mx + "px");
          el.style.setProperty("--my", pending.my + "px");
        });
      });

      el.addEventListener("pointerleave", function () {
        el.style.setProperty("--rx", restRx);
        el.style.setProperty("--ry", restRy);
        el.style.setProperty("--sc", "1");
        el.style.setProperty("--ty", "0px");
        el.style.setProperty("--glare", "0");
      });
    });

    /* ---------- Hero pointer parallax (glow / showcase / badges) ---------- */
    var hero = document.querySelector(".hero");
    if (hero) {
      var hraf = null, hp = null;
      hero.addEventListener("pointermove", function (e) {
        var rect = hero.getBoundingClientRect();
        hp = {
          px: (e.clientX - rect.left) / rect.width - 0.5,
          py: (e.clientY - rect.top) / rect.height - 0.5
        };
        if (hraf) return;
        hraf = requestAnimationFrame(function () {
          hraf = null;
          if (!hp) return;
          hero.style.setProperty("--px", hp.px.toFixed(3));
          hero.style.setProperty("--py", hp.py.toFixed(3));
        });
      });
      hero.addEventListener("pointerleave", function () {
        hero.style.setProperty("--px", "0");
        hero.style.setProperty("--py", "0");
      });
    }
  }

  /* ============================================================
     Contact form (graceful, no backend required)
     ============================================================ */
  var form = document.getElementById("contactForm");
  var note = document.getElementById("formNote");

  function setNote(msg, type) {
    if (!note) return;
    note.textContent = msg;
    note.className = "contact-form__note " + (type || "");
  }

  if (form) {
    form.addEventListener("submit", function (e) {
      var name = form.querySelector("#cf-name");
      var email = form.querySelector("#cf-email");
      var message = form.querySelector("#cf-message");
      var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((email && email.value) || "");
      var ok = true;

      [name, message].forEach(function (f) {
        if (!f) return;
        var bad = !f.value.trim();
        f.classList.toggle("invalid", bad);
        if (bad) ok = false;
      });
      if (email) {
        email.classList.toggle("invalid", !emailOk);
        if (!emailOk) ok = false;
      }

      if (!ok) {
        e.preventDefault();
        setNote("Please fill in your name, a valid email, and a short message.", "err");
        return;
      }

      // If the Formspree endpoint hasn't been set up yet, fall back to a
      // pre-filled email so the message is never lost.
      var action = form.getAttribute("action") || "";
      if (action.indexOf("YOUR_FORMSPREE_ID") !== -1) {
        e.preventDefault();
        var subject = encodeURIComponent("New project enquiry from " + name.value);
        var body = encodeURIComponent(
          "Name: " + name.value +
          "\nEmail: " + email.value +
          "\nProject: " + (form.querySelector("#cf-project") ? form.querySelector("#cf-project").value : "") +
          "\n\n" + message.value
        );
        setNote("Opening your email app… if nothing happens, email faiqaziz360@gmail.com directly.", "ok");
        window.location.href = "mailto:faiqaziz360@gmail.com?subject=" + subject + "&body=" + body;
        return;
      }

      setNote("Sending…", "ok");
    });

    form.querySelectorAll("input, textarea").forEach(function (f) {
      f.addEventListener("input", function () { f.classList.remove("invalid"); });
    });
  }
})();
