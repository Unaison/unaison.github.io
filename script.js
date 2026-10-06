(function () {
  var cfg = window.SITE_CONFIG || {};
  var lang = document.documentElement.lang === "eu" ? "eu" : "es";

  // Textos que genera el script, en cada idioma
  var T = {
    es: {
      wa: cfg.whatsappMessage,
      sending: "Enviando…",
      inactive: "El formulario aún no está activado. Escríbeme por WhatsApp mientras tanto.",
      ok: "¡Gracias! He recibido tu mensaje y te responderé pronto.",
      error: "No se ha podido enviar. Inténtalo de nuevo o escríbeme por WhatsApp.",
      subject: "Nueva consulta desde la web: "
    },
    eu: {
      wa: cfg.whatsappMessageEu || cfg.whatsappMessage,
      sending: "Bidaltzen…",
      inactive: "Formularioa ez dago oraindik aktibatuta. Bitartean, idatzi iezadazu WhatsAppez.",
      ok: "Eskerrik asko! Zure mezua jaso dut eta laster erantzungo dizut.",
      error: "Ezin izan da bidali. Saiatu berriro edo idatzi iezadazu WhatsAppez.",
      subject: "Nueva consulta desde la web (euskera): "
    }
  }[lang];

  // Año en el pie
  document.getElementById("year").textContent = new Date().getFullYear();

  // Menú móvil
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("nav");
  toggle.addEventListener("click", function () {
    var open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open);
  });
  nav.addEventListener("click", function (e) {
    if (e.target.tagName === "A") {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });

  // Aparición suave de los bloques al hacer scroll (una sola vez).
  // Cada entrada es un bloque suelto o un grupo cuyos hijos llegan escalonados.
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduce && "IntersectionObserver" in window) {
    var singles = "main .section h2, .statement, .block-head .lead, .cal-embed, .faq-head p, .contact-head .lead, .form";
    var groups = [".about-cols", ".topics", ".places", ".faq"];
    var items = [];

    document.querySelectorAll(singles).forEach(function (el) { items.push(el); });
    groups.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (group) {
        Array.prototype.forEach.call(group.children, function (child, i) {
          child.style.setProperty("--reveal-delay", Math.min(i * 70, 420) + "ms");
          items.push(child);
        });
      });
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add("is-in");
        io.unobserve(en.target);
      });
    }, { rootMargin: "0px 0px -40px 0px", threshold: 0 });

    items.forEach(function (el) {
      el.classList.add("reveal");
      io.observe(el);
    });
  }

  // Enlaces de WhatsApp
  var waUrl = "https://wa.me/" + (cfg.whatsapp || "") +
    "?text=" + encodeURIComponent(T.wa || "");
  document.querySelectorAll(".js-whatsapp").forEach(function (a) {
    a.href = waUrl;
    a.target = "_blank";
    a.rel = "noopener";
  });

  // Calendario de reservas (Cal.com)
  if (cfg.calLink) {
    (function (C, A, L) { var p = function (a, ar) { a.q.push(ar); }; var d = C.document; C.Cal = C.Cal || function () { var cal = C.Cal; var ar = arguments; if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement("script")).src = A; cal.loaded = true; } if (ar[0] === L) { var api = function () { p(api, arguments); }; var namespace = ar[1]; api.q = api.q || []; if (typeof namespace === "string") { cal.ns[namespace] = cal.ns[namespace] || api; p(cal.ns[namespace], ar); p(cal, ["initNamespace", namespace]); } else p(cal, ar); return; } p(cal, ar); }; })(window, "https://app.cal.com/embed/embed.js", "init");
    var box = document.getElementById("cal-embed");
    box.innerHTML = "";
    box.classList.add("loaded");
    document.querySelector(".cal-alt").hidden = false;
    Cal("init", { origin: "https://cal.com" });
    Cal("inline", { elementOrSelector: "#cal-embed", calLink: cfg.calLink, layout: "month_view" });
    Cal("ui", { theme: "light", styles: { branding: { brandColor: "#000628" } }, hideEventTypeDetails: false, layout: "month_view" });
  }

  // Formulario de contacto (Web3Forms)
  var form = document.getElementById("contact-form");
  var status = form.querySelector(".form-status");
  var fields = form.querySelectorAll("[required]");

  function validate(el) {
    var msg = document.getElementById(el.getAttribute("aria-describedby"));
    var ok = el.checkValidity();
    el.setAttribute("aria-invalid", ok ? "false" : "true");
    if (msg) msg.textContent = ok ? "" : msg.getAttribute("data-msg");
    return ok;
  }
  fields.forEach(function (el) {
    var evt = el.type === "checkbox" ? "change" : "input";
    el.addEventListener(evt, function () {
      if (el.getAttribute("aria-invalid") === "true") validate(el);
    });
    if (el.type !== "checkbox") el.addEventListener("blur", function () { if (el.value) validate(el); });
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var firstBad = null;
    fields.forEach(function (el) { if (!validate(el) && !firstBad) firstBad = el; });
    if (firstBad) {
      firstBad.focus();
      return;
    }
    if (!cfg.web3formsKey) {
      status.textContent = T.inactive;
      status.className = "form-status error";
      return;
    }
    var data = new FormData(form);
    data.append("access_key", cfg.web3formsKey);
    data.append("subject", T.subject + data.get("nombre"));
    data.append("from_name", "Web Ailen García");
    var btn = form.querySelector("button");
    var label = btn.textContent;
    btn.disabled = true;
    btn.setAttribute("aria-busy", "true");
    btn.textContent = T.sending;
    status.textContent = "";
    status.className = "form-status";
    fetch("https://api.web3forms.com/submit", { method: "POST", body: data })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res.success) throw new Error(res.message);
        form.reset();
        status.textContent = T.ok;
        status.className = "form-status ok";
      })
      .catch(function () {
        status.textContent = T.error;
        status.className = "form-status error";
      })
      .finally(function () {
        btn.disabled = false;
        btn.removeAttribute("aria-busy");
        btn.textContent = label;
      });
  });
})();
