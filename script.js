// DaddyRecorder landing — custom cursor + interactive hero demo.
// Everything here is progressive enhancement: if a piece doesn't
// initialize, the page still reads fine.

(() => {
  "use strict";

  // Respect users who prefer reduced motion. Every motion feature checks
  // this flag; when on, we skip trails, parallax, tilts, and ambient
  // loops (the core layout + the one ghost-cursor demo still play).
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  // ---------- Custom cursor + trailing ring ----------

  const cursor = document.getElementById("cursor");
  const ring = document.getElementById("cursorRing");

  if (cursor && ring) {
    let tx = window.innerWidth / 2;
    let ty = window.innerHeight / 2;
    let rx = tx;
    let ry = ty;

    window.addEventListener("pointermove", (e) => {
      tx = e.clientX;
      ty = e.clientY;
      cursor.style.transform = `translate(${tx}px, ${ty}px) translate(-50%, -50%)`;
    });

    // Ring follows via simple critically-damped-ish tween.
    const loop = () => {
      rx += (tx - rx) * 0.18;
      ry += (ty - ry) * 0.18;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      requestAnimationFrame(loop);
    };
    loop();

    // Hover state on interactive elements.
    const hoverables = "a, button, .shortcut, .take, .demo-card, kbd";
    document.querySelectorAll(hoverables).forEach((el) => {
      el.addEventListener("pointerenter", () => ring.classList.add("hover"));
      el.addEventListener("pointerleave", () => ring.classList.remove("hover"));
    });
  }

  // ---------- HUD timer (pretend we're recording the page visit) ----------

  const hudTimer = document.getElementById("hudTimer");
  const windowTimer = document.getElementById("windowTimer");
  if (hudTimer) {
    const start = performance.now();
    const tick = () => {
      const ms = performance.now() - start;
      const s = Math.floor(ms / 1000);
      const hh = String(Math.floor(s / 3600)).padStart(2, "0");
      const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
      const ss = String(s % 60).padStart(2, "0");
      hudTimer.textContent = `${hh}:${mm}:${ss}`;
      requestAnimationFrame(tick);
    };
    tick();
  }

  // ---------- Interactive hero demo ----------
  // A ghost cursor walks through the recorder UI the way a real user
  // would: flips each source toggle on in sequence, then clicks the
  // big gradient Start button. The window then "starts recording"
  // (red state + running timer) for a beat, resets, and loops.

  const demo = document.getElementById("demo");
  const demoBody = document.getElementById("demoBody");
  const ghostCursor = demo?.querySelector(".ghost-cursor");
  const ripple = document.getElementById("demoRipple");
  const srcRows = demoBody?.querySelectorAll(".src-row") || [];
  const startBtn = document.getElementById("demoStart");

  // Each tick the ghost cursor moves to an element, pauses (simulating
  // aim), then fires a "click" (ripple) and runs a per-target callback.
  const delay = (ms) => new Promise((r) => setTimeout(r, ms));

  if (demo && srcRows.length > 0 && ghostCursor && ripple && startBtn) {
    // Apply initial toggle states from data-initial on each row.
    const resetState = () => {
      srcRows.forEach((row) => {
        const initial = row.dataset.initial === "on";
        row.classList.toggle("on", initial);
        row.querySelector(".src-toggle")?.classList.toggle("on", initial);
      });
      startBtn.classList.remove("recording", "pulse");
      startBtn.querySelector(".app-start-label").textContent = "Start recording";
    };
    resetState();

    const moveTo = async (el, offset = {}) => {
      const body = demoBody.getBoundingClientRect();
      const rect = el.getBoundingClientRect();
      const tx = rect.left - body.left + rect.width / 2 + (offset.x || 0);
      const ty = rect.top - body.top + rect.height / 2 + (offset.y || 0);
      ghostCursor.style.left = `${tx - 11}px`;
      ghostCursor.style.top = `${ty - 11}px`;
      // Await the CSS transition on the cursor (700ms).
      await delay(780);
      return { tx, ty };
    };

    const fireRipple = (tx, ty) => {
      ripple.style.left = `${tx}px`;
      ripple.style.top = `${ty}px`;
      ripple.classList.remove("active");
      void ripple.offsetWidth;
      ripple.classList.add("active");
    };

    const clickToggle = async (row) => {
      // Aim at the toggle on the right side of the row.
      const toggle = row.querySelector(".src-toggle");
      const { tx, ty } = await moveTo(toggle);
      fireRipple(tx, ty);
      row.classList.add("hit");
      await delay(60);
      // Flip state.
      const isOn = toggle.classList.contains("on");
      toggle.classList.toggle("on", !isOn);
      row.classList.toggle("on", !isOn);
      await delay(420);
      row.classList.remove("hit");
    };

    const clickStart = async () => {
      const { tx, ty } = await moveTo(startBtn);
      fireRipple(tx, ty);
      startBtn.classList.add("pulse");
      await delay(520);
      startBtn.classList.remove("pulse");
      startBtn.classList.add("recording");
      startBtn.querySelector(".app-start-label").textContent = "● Recording";
    };

    const runCycle = async () => {
      // Move cursor to a neutral starting spot (upper-left of body).
      ghostCursor.style.left = "24px";
      ghostCursor.style.top = "24px";
      await delay(300);

      // Flip any currently-off toggles on, in row order.
      for (const row of srcRows) {
        if (!row.classList.contains("on")) {
          await clickToggle(row);
          await delay(160);
        }
      }

      // Walk down to Start and click it.
      await delay(240);
      await clickStart();

      // Sit in the "recording" state briefly so the user can read it.
      await delay(1800);

      // Reset and loop.
      resetState();
      await delay(600);
      runCycle();
    };

    // Only animate when the demo is actually on screen.
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(runCycle, 1400); // wait out the window entrance
            io.disconnect();
          }
        });
      },
      { threshold: 0.2 }
    );
    io.observe(demo);

    // Small running timer in the window chrome.
    if (windowTimer) {
      const started = performance.now();
      const update = () => {
        const s = Math.floor((performance.now() - started) / 1000) + 7;
        const mm = String(Math.floor(s / 60)).padStart(2, "0");
        const ss = String(s % 60).padStart(2, "0");
        windowTimer.textContent = `${mm}:${ss}`;
        requestAnimationFrame(update);
      };
      update();
    }
  }

  // ---------- Feature-reel countdown viz ----------
  const countEl = document.getElementById("countdownCount");
  if (countEl) {
    const seq = ["3", "2", "1"];
    let i = 0;
    const step = () => {
      countEl.textContent = seq[i % seq.length];
      countEl.classList.remove("pulse");
      void countEl.offsetWidth;
      countEl.classList.add("pulse");
      i++;
    };
    step();
    setInterval(step, 1000);
  }

  // ---------- Year stamp ----------

  const yr = document.getElementById("year");
  if (yr) yr.textContent = new Date().getFullYear();

  // ---------- Smooth scroll for nav ----------

  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (!id || id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  // ==============================================================
  //                Motion additions (layered, optional)
  //
  // Each block below is independent. If any piece fails to set up
  // (missing element, reduced-motion flag, etc.) the rest still work
  // and the page is still usable.
  // ==============================================================

  // ---------- Cursor trail ----------
  // Echoes the app's cursor-tracking feature: a short decaying trail
  // of neon particles follows the user's real pointer.
  if (!prefersReducedMotion) {
    const trailCount = 14;
    const trail = [];
    for (let i = 0; i < trailCount; i++) {
      const dot = document.createElement("div");
      dot.className = "cursor-trail";
      document.body.appendChild(dot);
      trail.push({ el: dot, x: -100, y: -100 });
    }
    let px = window.innerWidth / 2;
    let py = window.innerHeight / 2;
    window.addEventListener("pointermove", (e) => {
      px = e.clientX;
      py = e.clientY;
    });

    // Each segment lazily tweens toward the one in front of it, giving
    // a slinky-style tail. Opacity tapers off toward the tip.
    const trailLoop = () => {
      let tx = px;
      let ty = py;
      for (let i = 0; i < trail.length; i++) {
        const p = trail[i];
        p.x += (tx - p.x) * (0.28 - i * 0.012);
        p.y += (ty - p.y) * (0.28 - i * 0.012);
        p.el.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -50%)`;
        p.el.style.opacity = String((1 - i / trail.length) * 0.22);
        p.el.style.width = p.el.style.height = 10 - i * 0.4 + "px";
        tx = p.x;
        ty = p.y;
      }
      requestAnimationFrame(trailLoop);
    };
    trailLoop();
  }

  // ---------- Pointer-driven 3D tilt on the hero window ----------
  // Subtle parallax on the fake app window. The further the pointer
  // drifts from center, the more the window tilts — capped at ±6°.
  const tiltTarget = document.querySelector(".demo .window");
  if (tiltTarget && !prefersReducedMotion) {
    const hero = document.querySelector(".hero");
    let rx = 4; // matches the static tilt in CSS
    let ry = 0;
    let trx = rx;
    let tryy = ry;

    hero.addEventListener("pointermove", (e) => {
      const rect = tiltTarget.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / (rect.width / 2);
      const dy = (e.clientY - cy) / (rect.height / 2);
      trx = 4 - dy * 3;      // pitch
      tryy = dx * 4;         // yaw
    });
    hero.addEventListener("pointerleave", () => {
      trx = 4; tryy = 0;
    });

    const tiltLoop = () => {
      rx += (trx - rx) * 0.08;
      ry += (tryy - ry) * 0.08;
      tiltTarget.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
      requestAnimationFrame(tiltLoop);
    };
    // Wait out the CSS entrance animation (windowIn, 1.1s + 0.4s delay)
    // before taking ownership of transform. Otherwise the two fight.
    setTimeout(tiltLoop, 1600);
  }

  // ---------- Scroll parallax (overlap-safe) ----------
  // Earlier revision also parallax'd the headline and the hero window,
  // which pushed text into the subheading and the CTA row. That's a
  // nope: content layers must not drift relative to each other.
  //
  // New rule: only things that live OUTSIDE the main content column
  // parallax — the left/right filmstrip timecodes. Everything inside
  // the column scrolls at 1:1. The hero still feels alive via cursor
  // trail + pointer tilt, which don't touch layout.
  if (!prefersReducedMotion) {
    const parallaxEls = [
      ...document.querySelectorAll(".filmstrip span"),
    ].map((el) => ({ el, speed: 0.35 }));

    if (parallaxEls.length) {
      let lastScrollY = -1;
      const onScroll = () => {
        const y = window.scrollY;
        if (y === lastScrollY) {
          requestAnimationFrame(onScroll);
          return;
        }
        lastScrollY = y;
        parallaxEls.forEach(({ el, speed }) => {
          el.style.transform = `translateY(${y * speed}px)`;
        });
        requestAnimationFrame(onScroll);
      };
      onScroll();
    }
  }

  // ---------- Reveal-on-scroll for feature takes ----------
  // Each .take starts translated down + faded; IntersectionObserver
  // lifts them as they enter the viewport. Staggered via index.
  const reveals = document.querySelectorAll(".take, .step-list li, .shortcut");
  if (reveals.length && "IntersectionObserver" in window) {
    reveals.forEach((el, i) => {
      if (!prefersReducedMotion) el.classList.add("reveal");
      el.style.setProperty("--reveal-delay", `${Math.min(i, 8) * 60}ms`);
    });
    const revealIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealIO.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14 }
    );
    reveals.forEach((el) => revealIO.observe(el));
  }

  // ---------- Demo → headline sync ----------
  // Every time the ghost cursor clicks a card in the hero window, we
  // pulse a matching zoom reticle around the word "edits" in the
  // headline. Visually bridges the product's "click → auto-zoom"
  // behaviour to the marketing promise.
  const editsWord = document.querySelector(".headline em");
  if (editsWord && ripple) {
    const pulseEdits = () => {
      editsWord.classList.remove("zoom-pulse");
      void editsWord.offsetWidth;
      editsWord.classList.add("zoom-pulse");
    };
    // Observe class changes on the ripple — when it activates, so does
    // the headline pulse. No new timers, stays in sync with the demo.
    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.attributeName === "class" && ripple.classList.contains("active")) {
          pulseEdits();
        }
      }
    });
    mo.observe(ripple, { attributes: true });
  }
})();
