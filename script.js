(function () {
  const siteApi = window.QuantumSiteData;

  function $(selector) {
    return document.querySelector(selector);
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function bindMobileMenu() {
    const button = $("#mobile-menu-button");
    const nav = $("#premium-nav");
    if (!button || !nav) {
      return;
    }

    button.addEventListener("click", function () {
      button.classList.toggle("is-open");
      nav.classList.toggle("is-open");
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        button.classList.remove("is-open");
        nav.classList.remove("is-open");
      });
    });
  }

  function bindHeaderState() {
    const header = $(".premium-header");
    if (!header) {
      return;
    }

    function update() {
      header.classList.toggle("is-scrolled", window.scrollY > 18);
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  function bindReveal() {
    const items = document.querySelectorAll(".reveal");
    if (!items.length) {
      return;
    }

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { threshold: 0.14 },
    );

    items.forEach(function (item) {
      observer.observe(item);
    });
  }

  function bindCounters() {
    const counters = document.querySelectorAll("[data-counter]");
    const animated = new WeakSet();
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting || animated.has(entry.target)) {
            return;
          }

          animated.add(entry.target);
          animateCounter(entry.target);
        });
      },
      { threshold: 0.45 },
    );

    counters.forEach(function (counter) {
      observer.observe(counter);
    });
  }

  function animateCounter(element) {
    const target = Number(element.dataset.counter || 0);
    const suffix = element.dataset.suffix || "";
    const start = performance.now();
    const duration = 1300;

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = Math.round(target * eased) + suffix;

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    }

    requestAnimationFrame(tick);
  }

  function bindModal() {
    const modal = $("#application-modal");
    if (!modal) {
      return;
    }

    function open() {
      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      document.body.classList.add("body-locked");
    }

    function close() {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("body-locked");
    }

    document.querySelectorAll("[data-open-modal]").forEach(function (trigger) {
      trigger.addEventListener("click", open);
    });

    document.querySelectorAll("[data-close-modal]").forEach(function (trigger) {
      trigger.addEventListener("click", close);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        close();
      }
    });
  }

  function bindApplicationForm() {
    const form = $("#modal-application-form");
    const feedback = $("#modal-feedback");
    if (!form || !siteApi) {
      return;
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      const formData = new FormData(form);
      const name = String(formData.get("name") || "").trim();
      const phone = String(formData.get("phone") || "").trim();
      const ageGroup = String(formData.get("ageGroup") || "").trim();
      const programInterest = String(
        formData.get("programInterest") || "",
      ).trim();

      if (!name || !phone || !ageGroup || !programInterest) {
        if (feedback) {
          feedback.textContent = "Заполните все поля заявки.";
        }
        return;
      }

      const data = siteApi.loadSiteData();
      data.leads = data.leads || [];
      data.leads.unshift({
        name: name,
        phone: phone,
        ageGroup: ageGroup,
        programInterest: programInterest,
        status: "new",
        source: "premium-site",
        createdAt: new Date().toISOString(),
      });
      siteApi.saveSiteData(data);
      form.reset();

      if (feedback) {
        feedback.textContent =
          "Спасибо. Заявка отправлена, школа скоро свяжется с вами.";
      }
    });
  }

  function renderCalendar() {
    const grid = $("#calendar-grid");
    if (!grid) {
      return;
    }

    const eventDays = new Set([3, 8, 14, 22, 24, 27, 31]);
    grid.innerHTML = Array.from({ length: 35 }, function (_, index) {
      const day = index - 2;
      if (day < 1 || day > 31) {
        return '<span class="muted"></span>';
      }

      return (
        '<button class="' +
        (eventDays.has(day) ? "has-event" : "") +
        '" type="button">' +
        day +
        "</button>"
      );
    }).join("");
  }

  function bindGalleryPreview() {
    const preview = $("#gallery-preview");
    const title = $("#gallery-preview-title");
    const close = $("#gallery-preview-close");
    if (!preview || !title || !close) {
      return;
    }

    document.querySelectorAll("[data-preview]").forEach(function (item) {
      item.addEventListener("click", function () {
        title.textContent = item.dataset.preview || "Quantum Gallery";
        preview.classList.add("is-open");
        preview.setAttribute("aria-hidden", "false");
      });
    });

    close.addEventListener("click", function () {
      preview.classList.remove("is-open");
      preview.setAttribute("aria-hidden", "true");
    });
  }

  function initQuantumCanvas() {
    const canvas = $("#quantum-canvas");
    const hero = $(".premium-hero");
    if (!canvas || !hero) {
      return;
    }

    const ctx = canvas.getContext("2d");
    const particles = [];
    const count = 72;

    function resize() {
      canvas.width = hero.offsetWidth;
      canvas.height = hero.offsetHeight;
      particles.length = 0;
      for (let index = 0; index < count; index += 1) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: Math.random() * 2 + 0.6,
          vx: (Math.random() - 0.5) * 0.32,
          vy: (Math.random() - 0.5) * 0.32,
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(function (p, index) {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.fillStyle = "rgba(255, 215, 0, 0.82)";
        ctx.shadowColor = "rgba(255, 215, 0, 0.9)";
        ctx.shadowBlur = 12;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        for (let next = index + 1; next < particles.length; next += 1) {
          const other = particles[next];
          const dx = p.x - other.x;
          const dy = p.y - other.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < 125) {
            ctx.beginPath();
            ctx.strokeStyle =
              "rgba(255, 215, 0, " + (0.18 - distance / 820) + ")";
            ctx.lineWidth = 1;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
          }
        }
      });

      requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener("resize", resize);
  }

  function bindParallax() {
    const heroLogo = $(".hero-logo-wrap");
    const atom = $(".floating-atom");
    if (!heroLogo && !atom) {
      return;
    }

    window.addEventListener(
      "mousemove",
      function (event) {
        const x = (event.clientX / window.innerWidth - 0.5) * 20;
        const y = (event.clientY / window.innerHeight - 0.5) * 20;
        if (heroLogo) {
          heroLogo.style.transform =
            "translate3d(" + x * 0.25 + "px," + y * 0.25 + "px,0)";
        }
        if (atom) {
          atom.style.transform =
            "translate3d(" + -x * 0.45 + "px," + -y * 0.45 + "px,0)";
        }
      },
      { passive: true },
    );
  }

  function init() {
    bindMobileMenu();
    bindHeaderState();
    bindReveal();
    bindCounters();
    bindModal();
    bindApplicationForm();
    renderCalendar();
    bindGalleryPreview();
    initQuantumCanvas();
    bindParallax();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
