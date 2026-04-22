// DaddyRecorder landing — custom cursor + interactive hero demo.
// Everything here is progressive enhancement: if a piece doesn't
// initialize, the page still reads fine.

(() => {
  "use strict";

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
  // A ghost cursor walks between the four cards in the window, pauses,
  // "clicks" (ripple + card highlight + zoom reticle), and moves on.

  const demo = document.getElementById("demo");
  const demoBody = document.getElementById("demoBody");
  const ghostCursor = demo?.querySelector(".ghost-cursor");
  const ripple = document.getElementById("demoRipple");
  const reticle = document.getElementById("demoReticle");
  const cards = demoBody?.querySelectorAll("[data-target]") || [];

  if (demo && cards.length > 0 && ghostCursor && ripple && reticle) {
    const advance = async () => {
      // Cycle through the cards in a varied order so it feels alive.
      const order = [0, 2, 1, 3];
      let i = 0;

      // Always-running loop. Uses getBoundingClientRect relative to the
      // demo body so it adapts to size changes.
      const tick = async () => {
        const body = demoBody.getBoundingClientRect();
        const card = cards[order[i % order.length]];
        const rect = card.getBoundingClientRect();

        // Target point: centerish of the card, with small random offset.
        const jitterX = (Math.random() - 0.5) * 30;
        const jitterY = (Math.random() - 0.5) * 20;
        const tx = rect.left - body.left + rect.width / 2 + jitterX;
        const ty = rect.top - body.top + rect.height / 2 + jitterY;

        // Move the ghost cursor.
        ghostCursor.style.left = `${tx - 11}px`;
        ghostCursor.style.top = `${ty - 11}px`;

        // After the move finishes (matches CSS transition duration),
        // fire a click visual: ripple + card highlight + zoom reticle.
        await delay(760);

        ripple.style.left = `${tx}px`;
        ripple.style.top = `${ty}px`;
        ripple.classList.remove("active");
        void ripple.offsetWidth; // restart animation
        ripple.classList.add("active");

        card.classList.add("hit");

        reticle.style.left = `${tx}px`;
        reticle.style.top = `${ty}px`;
        reticle.classList.add("active");

        await delay(1400);

        card.classList.remove("hit");
        reticle.classList.remove("active");

        i++;
        await delay(400);
        tick();
      };

      // Start after the window-entrance animation has played.
      await delay(1400);
      tick();
    };

    const delay = (ms) => new Promise((r) => setTimeout(r, ms));

    // Only animate when the demo is actually visible — saves cycles
    // when the user scrolls far past the hero.
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            advance();
            io.disconnect();
          }
        });
      },
      { threshold: 0.2 }
    );
    io.observe(demo);

    // Window-local fake recording timer, mm:ss.
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
})();
