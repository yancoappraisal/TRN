/* =========================================================
   TRN Mobile Auto Detailers — site behavior
   ========================================================= */

/*
 * CONTACT FORM DELIVERY
 * Paste your Formspree endpoint here to turn on email delivery, e.g.
 *   const FORM_ENDPOINT = "https://formspree.io/f/abcdwxyz";
 * While empty, the form validates and then offers one-tap buttons to
 * text (or email) the visitor's details to Tyler, so no lead is lost.
 */
const FORM_ENDPOINT = "https://formspree.io/f/xkjjkjvo";

const TRN = {
  phone: "+16032338580",
  phonePretty: "(603) 233-8580",
  email: "trnautodetail@gmail.com",
  smsGreeting: "Hi Tyler, I'd like to schedule a detail.",
};

(() => {
  "use strict";
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // sms: URI with a prefilled body. "?&body=" is understood by both iOS and Android.
  const smsHref = (body) => `sms:${TRN.phone}?&body=${encodeURIComponent(body)}`;
  // Phones/tablets can open Messages; desktops get the QR dialog instead.
  const canText = matchMedia("(pointer: coarse)").matches || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  /* ---------- Text Tyler links ---------- */
  $$(".js-text").forEach((a) => { a.href = smsHref(TRN.smsGreeting); });

  const dialog = $("#text-dialog");
  let qrDrawn = false;
  const drawQR = () => {
    if (qrDrawn || typeof qrcode !== "function") return;
    const qr = qrcode(0, "M");
    qr.addData(`SMSTO:${TRN.phone}:${TRN.smsGreeting}`);
    qr.make();
    $("#td-qr").innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
    qrDrawn = true;
  };
  document.addEventListener("click", (e) => {
    const link = e.target.closest(".js-text");
    if (!link || canText || !dialog?.showModal) return;
    e.preventDefault();
    drawQR();
    dialog.showModal();
  });
  if (dialog) {
    $(".td-close", dialog).addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); }); // backdrop
    $("#td-copy").addEventListener("click", async (e) => {
      const label = $("span", e.currentTarget);
      try { await navigator.clipboard.writeText(TRN.phonePretty); label.textContent = "Copied"; }
      catch { label.textContent = TRN.phonePretty; }
      setTimeout(() => { label.textContent = "Copy number"; }, 2200);
    });
  }

  /* ---------- Header + mobile bar ---------- */
  const header = $(".site-header");
  const hero = $(".hero");
  const mbar = $(".mbar");
  const contact = $("#contact");
  const onScroll = () => {
    const y = scrollY;
    header.classList.toggle("solid", y > 30 || document.body.classList.contains("menu-open"));
    if (mbar) {
      const r = contact.getBoundingClientRect();
      const contactInView = r.top < innerHeight * 0.8 && r.bottom > 0;
      mbar.classList.toggle("show", y > hero.offsetHeight * 0.55 && !contactInView);
    }
  };
  let raf = 0;
  addEventListener("scroll", () => { if (!raf) raf = requestAnimationFrame(() => { onScroll(); raf = 0; }); }, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  const menuBtn = $(".menu-btn");
  const nav = $("#nav");
  const setMenu = (open) => {
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    nav.classList.toggle("open", open);
    document.body.classList.toggle("menu-open", open);
    onScroll();
  };
  menuBtn.addEventListener("click", () => setMenu(menuBtn.getAttribute("aria-expanded") !== "true"));
  $$("a", nav).forEach((a) => a.addEventListener("click", () => setMenu(false)));
  addEventListener("keydown", (e) => { if (e.key === "Escape" && nav.classList.contains("open")) { setMenu(false); menuBtn.focus(); } });

  /* ---------- Active nav link ---------- */
  const navLinks = $$(".nav ul a");
  if ("IntersectionObserver" in window) {
    const spy = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) navLinks.forEach((a) => a.classList.toggle("on", a.hash === "#" + en.target.id));
    }), { rootMargin: "-45% 0px -50% 0px" });
    navLinks.forEach((a) => { const s = $(a.hash); if (s) spy.observe(s); });
  }

  /* ---------- Reveal on scroll (staggered in grids) ---------- */
  $$(".svc-grid, .where, .steps").forEach((g) => $$(".reveal", g).forEach((el, i) => el.style.setProperty("--d", `${i * 80}ms`)));
  const reveals = $$(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
    }), { threshold: 0.14, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("in"));
  }

  /* ---------- Cursor-tracked glow on service cards (desktop only) ---------- */
  if (matchMedia("(hover: hover)").matches) {
    $$(".svc").forEach((card) => card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    }));
  }

  /* Hero entrance safety net: guarantee content is visible after the entrance window */
  setTimeout(() => document.documentElement.classList.add("anim-done"), 4200);

  /* ---------- Footer year ---------- */
  const yr = $("#yr");
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- Contact form ---------- */
  const form = $("#contact-form");
  const done = $("#form-done");
  const btn = $("#submit-btn");
  const alertBox = $(".form-alert", form);
  const dateInput = $("#f-date");
  if (dateInput) dateInput.min = new Date().toISOString().slice(0, 10);

  const rules = {
    name: { el: $("#f-name"), ok: (v) => v.trim().length >= 2, msg: "Please enter your name." },
    phone: { el: $("#f-phone"), ok: (v) => v.replace(/\D/g, "").length >= 10, msg: "Please enter a 10-digit phone number so Tyler can text you back." },
    email: { el: $("#f-email"), ok: (v) => !v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()), msg: "That email doesn't look right. Check it, or leave it blank." },
    vehicle: { el: $("#f-vehicle"), ok: (v) => v.trim().length >= 3, msg: "Please tell us the year, make and model." },
  };
  const mark = (key, bad) => {
    const { el, msg } = rules[key];
    const err = $(`#${el.id}-err`);
    el.closest(".field").classList.toggle("bad", bad);
    el.setAttribute("aria-invalid", String(bad));
    if (bad) el.setAttribute("aria-describedby", err.id); else el.removeAttribute("aria-describedby");
    err.textContent = bad ? msg : "";
  };
  const check = (key) => { const good = rules[key].ok(rules[key].el.value); mark(key, !good); return good; };
  Object.keys(rules).forEach((key) => {
    const el = rules[key].el;
    el.addEventListener("blur", () => { if (el.value) check(key); });
    el.addEventListener("input", () => { if (el.closest(".bad")) check(key); });
  });

  rules.phone.el.addEventListener("input", (e) => {
    const d = e.target.value.replace(/\D/g, "").slice(0, 10);
    if (d.length < 4) return;
    e.target.value = d.length < 7 ? `(${d.slice(0, 3)}) ${d.slice(3)}` : `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  });

  const summarize = (d) => [
    `Hi Tyler, I'd like to book a detail.`,
    `Name: ${d.name}`,
    `Phone: ${d.phone}`,
    d.email && `Email: ${d.email}`,
    `Vehicle: ${d.vehicle}`,
    d.service && `Service: ${d.service}`,
    d.town && `Location: ${d.town}`,
    d.preferred_date && `Preferred date: ${d.preferred_date}`,
    d.notes && `Notes: ${d.notes}`,
  ].filter(Boolean).join("\n");

  const finish = (mode, data) => {
    form.hidden = true;
    done.hidden = false;
    if (mode === "handoff") {
      const text = summarize(data);
      $("#done-title").textContent = "Almost there.";
      $("#done-text").textContent = "Send your details to Tyler with one tap. Your message is already written for you.";
      $("#done-actions").hidden = false;
      const sms = $("#done-sms");
      sms.href = smsHref(text);
      if (!canText) sms.hidden = true; // desktop: email is the reliable path
      $("#done-mail").href = `mailto:${TRN.email}?subject=${encodeURIComponent(`Detail request: ${data.vehicle}`)}&body=${encodeURIComponent(text)}`;
    }
    done.focus({ preventScroll: true });
    done.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const failed = Object.keys(rules).filter((k) => !check(k));
    if (failed.length) {
      alertBox.hidden = false;
      alertBox.textContent = failed.length === 1 ? "Please fix the highlighted field." : `Please fix the ${failed.length} highlighted fields.`;
      rules[failed[0]].el.focus();
      return;
    }
    alertBox.hidden = true;
    const data = Object.fromEntries(new FormData(form).entries());
    if (data._gotcha) return;

    if (!FORM_ENDPOINT) { finish("handoff", data); return; }

    btn.classList.add("loading");
    btn.setAttribute("aria-busy", "true");
    $(".btn-text", btn).textContent = "Sending…";
    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ ...data, _subject: `Detail request: ${data.vehicle}`, _replyto: data.email || undefined }),
      });
      if (!res.ok) throw new Error(String(res.status));
      finish("sent", data);
    } catch {
      alertBox.hidden = false;
      alertBox.innerHTML = `We couldn't send that just now. Please try again, or <a href="${smsHref(TRN.smsGreeting)}">text Tyler at ${TRN.phonePretty}</a>.`;
    } finally {
      btn.classList.remove("loading");
      btn.removeAttribute("aria-busy");
      $(".btn-text", btn).textContent = "Send Request";
    }
  });
})();
