(function () {
  const siteApi = window.QuantumSiteData;

  if (!siteApi) {
    return;
  }

  let data = siteApi.loadSiteData();
  const normalizedPath = window.location.pathname.replace(/\\/g, "/");
  const isStandaloneLoginPage = /\/admin\/login\.html$/.test(normalizedPath);
  const loginUrl = isStandaloneLoginPage ? "login.html" : "admin/login.html";
  const dashboardUrl = isStandaloneLoginPage ? "../admin.html" : "admin.html";

  const loginScreen = document.querySelector("#admin-login-screen");
  const dashboard = document.querySelector("#admin-dashboard");
  const loginForm = document.querySelector("#admin-login-form");
  const loginFeedback = document.querySelector("#admin-login-feedback");

  // Если это отдельная страница входа — покажем подсказку с демо-учёткой
  // и кнопку для сброса демо-данных (удобно, если локально что-то поменяли).
  if (
    isStandaloneLoginPage &&
    loginFeedback &&
    siteApi &&
    siteApi.DEFAULT_SITE_DATA
  ) {
    try {
      const demo = siteApi.DEFAULT_SITE_DATA.admin || {};
      const hint = document.createElement("div");
      hint.className = "admin-login-hint";
      hint.innerHTML =
        '<p style="margin:8px 0;font-size:0.95rem">Демо-доступ — логин: <strong>' +
        escapeHtml(demo.username) +
        "</strong>, пароль: <strong>" +
        escapeHtml(demo.password) +
        "</strong></p>" +
        '<button class="button button-secondary" type="button" id="admin-reset-demo">Сбросить демо-данные</button>';

      loginFeedback.parentNode.appendChild(hint);

      const resetBtn = document.getElementById("admin-reset-demo");
      if (resetBtn) {
        resetBtn.addEventListener("click", function () {
          siteApi.resetSiteData();
          if (loginFeedback) {
            loginFeedback.textContent =
              "Демо-данные сброшены — попробуйте войти снова.";
          }
        });
      }
    } catch (e) {
      // noop
    }
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function escapeAttribute(value) {
    return escapeHtml(value == null ? "" : value);
  }

  function sanitizeMediaUrl(url) {
    const value = String(url || "").trim();
    if (!value) {
      return "";
    }

    if (
      value.startsWith("http://") ||
      value.startsWith("https://") ||
      value.startsWith("data:image/") ||
      value.startsWith("/") ||
      value.startsWith("./") ||
      value.startsWith("../") ||
      value.startsWith("assets/")
    ) {
      return value;
    }

    return "";
  }

  function formatMoney(value) {
    const number = Number(value) || 0;
    return new Intl.NumberFormat("ru-RU").format(number) + " сум";
  }

  function makeId(prefix) {
    return (
      prefix +
      "-" +
      Date.now().toString(36) +
      "-" +
      Math.random().toString(36).slice(2, 7)
    );
  }

  function getService(serviceId) {
    return (data.services || []).find(function (service) {
      return service.id === serviceId;
    });
  }

  function getStudent(studentId) {
    return (data.students || []).find(function (student) {
      return student.id === studentId;
    });
  }

  function getStudentPayments(studentId) {
    return (data.payments || []).filter(function (payment) {
      return payment.studentId === studentId;
    });
  }

  function getPaymentTotals() {
    return (data.payments || []).reduce(
      function (totals, payment) {
        const amount = Number(payment.amount) || 0;
        totals.total += amount;
        if (payment.status === "paid") {
          totals.paid += amount;
        } else {
          totals.unpaid += amount;
        }
        return totals;
      },
      { total: 0, paid: 0, unpaid: 0 },
    );
  }

  function getLeadStatusLabel(status) {
    const labels = {
      new: "Новая",
      contacted: "Связались",
      enrolled: "Зачислен",
      archived: "Архив",
    };
    return labels[status || "new"] || "Новая";
  }

  function getStudentStatusLabel(status) {
    const labels = {
      active: "Учится",
      lead: "Кандидат",
      paused: "Пауза",
      archived: "Архив",
    };
    return labels[status || "active"] || "Учится";
  }

  function fillTemplate(template, values) {
    return String(template || "").replace(/\{(\w+)\}/g, function (_, key) {
      return values[key] == null ? "" : String(values[key]);
    });
  }

  function buildSmsUrl(phone, message) {
    const integrations = data.integrations || {};
    const apiUrl = String(integrations.smsApiUrl || "").trim();
    if (!apiUrl) {
      return "";
    }

    return fillTemplate(apiUrl, {
      phone: encodeURIComponent(phone),
      message: encodeURIComponent(message),
      token: encodeURIComponent(integrations.smsApiToken || ""),
      sender: encodeURIComponent(integrations.smsSender || ""),
    });
  }

  async function sendSms(phone, message, meta) {
    const url = buildSmsUrl(phone, message);
    const logItem = {
      id: makeId("sms"),
      phone: phone,
      message: message,
      studentId: (meta && meta.studentId) || "",
      type: (meta && meta.type) || "notice",
      status: url ? "sent" : "demo",
      createdAt: new Date().toISOString(),
    };

    if (url) {
      const response = await fetch(url, { method: "GET" });
      if (!response.ok) {
        logItem.status = "error";
      }
    }

    data.smsLog = data.smsLog || [];
    data.smsLog.unshift(logItem);
    siteApi.saveSiteData(data);
    return logItem;
  }

  function saveAndRefresh(nextData) {
    data = siteApi.saveSiteData(nextData);
    renderDashboard();
  }

  function isAuthenticated() {
    return localStorage.getItem(siteApi.SESSION_KEY) === "authorized";
  }

  function setAuthenticated(value) {
    if (value) {
      localStorage.setItem(siteApi.SESSION_KEY, "authorized");
    } else {
      localStorage.removeItem(siteApi.SESSION_KEY);
    }
  }

  function redirectToLogin() {
    window.location.replace(loginUrl);
  }

  function redirectToDashboard() {
    window.location.replace(dashboardUrl);
  }

  function toggleDashboard() {
    const authenticated = isAuthenticated();

    if (loginScreen) {
      loginScreen.classList.toggle("hidden", authenticated);
    }

    if (dashboard) {
      dashboard.classList.toggle("hidden", !authenticated);
    }
  }

  function renderSummary() {
    const summary = document.querySelector("#admin-summary");
    if (!summary) {
      return;
    }

    const integrations = data.integrations || {};
    const telegramReady =
      String(integrations.telegramBotToken || "").trim() &&
      String(integrations.telegramChatId || "").trim();
    const paymentTotals = getPaymentTotals();
    const unpaidCount = (data.payments || []).filter(function (payment) {
      return payment.status !== "paid";
    }).length;

    summary.innerHTML = [
      '<article class="stats-card">',
      '  <span class="stats-number">' +
        escapeHtml(String((data.students || []).length)) +
        "</span>",
      '  <span class="stats-label">учеников в CRM</span>',
      "</article>",
      '<article class="stats-card">',
      '  <span class="stats-number">' +
        escapeHtml(formatMoney(paymentTotals.paid)) +
        "</span>",
      '  <span class="stats-label">оплачено</span>',
      "</article>",
      '<article class="stats-card">',
      '  <span class="stats-number">' +
        escapeHtml(String(unpaidCount)) +
        "</span>",
      '  <span class="stats-label">неоплаченных услуг</span>',
      "</article>",
      '<article class="stats-card">',
      '  <span class="stats-number">' +
        (telegramReady ? "ON" : "OFF") +
        "</span>",
      '  <span class="stats-label">Telegram заявки</span>',
      "</article>",
    ].join("");
  }

  function renderSettingsForm() {
    const form = document.querySelector("#settings-form");
    if (!form) {
      return;
    }

    form.heroTitle.value = data.hero.title;
    form.heroSubtitle.value = data.hero.subtitle;
    form.heroDescription.value = data.hero.description;
    form.aboutText.value = data.about.text;
    form.founded.value = data.about.founded;
    form.studentsCount.value = data.about.studentsCount;
    form.experienceCount.value = data.about.experienceCount;
    form.phone.value = data.contacts.phone;
    form.telegramUrl.value = data.contacts.telegramUrl;
    form.address.value = data.contacts.address;
    form.youtubeEmbed.value = data.contacts.youtubeEmbed;
    form.mapEmbed.value = data.contacts.mapEmbed;
    form.telegramBotToken.value =
      (data.integrations && data.integrations.telegramBotToken) || "";
    form.telegramChatId.value =
      (data.integrations && data.integrations.telegramChatId) || "";
    form.smsApiUrl.value =
      (data.integrations && data.integrations.smsApiUrl) || "";
    form.smsApiToken.value =
      (data.integrations && data.integrations.smsApiToken) || "";
    form.smsSender.value =
      (data.integrations && data.integrations.smsSender) || "";
  }

  function renderAdmissionList() {
    const list = document.querySelector("#admission-admin-list");
    if (!list) {
      return;
    }

    list.innerHTML = (data.admissionSteps || [])
      .map(function (item, index) {
        return [
          '<article class="admin-item-card" data-admission-index="' +
            index +
            '">',
          '  <div class="admin-item-grid">',
          '    <label><span>Номер шага</span><input type="text" data-field="step" value="' +
            escapeAttribute(item.step) +
            '" /></label>',
          '    <label><span>Заголовок</span><input type="text" data-field="title" value="' +
            escapeAttribute(item.title) +
            '" /></label>',
          '    <label class="field-wide"><span>Описание</span><textarea rows="3" data-field="description">' +
            escapeHtml(item.description) +
            "</textarea></label>",
          "  </div>",
          '  <div class="admin-item-actions"><button class="button button-secondary" type="button" data-remove-admission="' +
            index +
            '">Удалить шаг</button></div>',
          "</article>",
        ].join("");
      })
      .join("");
  }

  function renderLeadOptionsForm() {
    const form = document.querySelector("#lead-options-form");
    if (!form) {
      return;
    }

    const leadOptions = data.leadOptions || {};
    form.ageGroups.value = Array.isArray(leadOptions.ageGroups)
      ? leadOptions.ageGroups.join("\n")
      : "";
    form.interests.value = Array.isArray(leadOptions.interests)
      ? leadOptions.interests.join("\n")
      : "";
  }

  function renderFaqList() {
    const list = document.querySelector("#faq-admin-list");
    if (!list) {
      return;
    }

    list.innerHTML = (data.faq || [])
      .map(function (item, index) {
        return [
          '<article class="admin-item-card" data-faq-index="' + index + '">',
          '  <div class="admin-item-grid">',
          '    <label class="field-wide"><span>Вопрос</span><input type="text" data-field="question" value="' +
            escapeAttribute(item.question) +
            '" /></label>',
          '    <label class="field-wide"><span>Ответ</span><textarea rows="4" data-field="answer">' +
            escapeHtml(item.answer) +
            "</textarea></label>",
          "  </div>",
          '  <div class="admin-item-actions"><button class="button button-secondary" type="button" data-remove-faq="' +
            index +
            '">Удалить вопрос</button></div>',
          "</article>",
        ].join("");
      })
      .join("");
  }

  function renderImagePreview(image, title) {
    if (sanitizeMediaUrl(image)) {
      return [
        '<div class="admin-upload-preview">',
        '  <img src="' +
          escapeAttribute(image) +
          '" alt="' +
          escapeAttribute(title || "Фото") +
          '">',
        "</div>",
      ].join("");
    }

    return [
      '<div class="admin-upload-preview">',
      '  <div class="admin-upload-empty">Фото пока не загружено. Можно выбрать файл с компьютера или вставить ссылку.</div>',
      "</div>",
    ].join("");
  }

  function renderGalleryList() {
    const list = document.querySelector("#gallery-admin-list");
    if (!list) {
      return;
    }

    list.innerHTML = data.gallery
      .map(function (item, index) {
        return [
          '<article class="admin-item-card" data-gallery-index="' +
            index +
            '">',
          '  <div class="admin-item-grid">',
          '    <label><span>Название</span><input type="text" data-field="title" value="' +
            escapeAttribute(item.title) +
            '" /></label>',
          '    <label><span>Подпись</span><input type="text" data-field="caption" value="' +
            escapeAttribute(item.caption) +
            '" /></label>',
          '    <label><span>Фото</span><input type="text" data-field="image" value="' +
            escapeAttribute(item.image) +
            '" placeholder="assets/photos/file.jpg, data URL или https://..." /></label>',
          '    <label><span>Подсказка пути</span><input type="text" data-field="pathHint" value="' +
            escapeAttribute(item.pathHint) +
            '" /></label>',
          "  </div>",
          renderImagePreview(item.image, item.title),
          '  <div class="admin-upload-row">',
          '    <label><span>Загрузить фото</span><input class="admin-upload-input" type="file" accept="image/*" data-upload-gallery="' +
            index +
            '" /></label>',
          '    <button class="button button-secondary" type="button" data-clear-gallery-image="' +
            index +
            '">Убрать фото</button>',
          "  </div>",
          '  <p class="admin-inline-note">Если загрузить файл здесь, изображение сохранится в браузере и сразу появится на сайте.</p>',
          '  <div class="admin-item-actions"><button class="button button-secondary" type="button" data-remove-gallery="' +
            index +
            '">Удалить карточку</button></div>',
          "</article>",
        ].join("");
      })
      .join("");
  }

  function renderTeachersList() {
    const list = document.querySelector("#teachers-admin-list");
    if (!list) {
      return;
    }

    list.innerHTML = data.teachers
      .map(function (teacher, index) {
        return [
          '<article class="admin-item-card" data-teacher-index="' +
            index +
            '">',
          '  <div class="admin-item-grid">',
          '    <label><span>Имя и отчество</span><input type="text" data-field="name" value="' +
            escapeAttribute(teacher.name) +
            '" /></label>',
          '    <label><span>Предмет</span><input type="text" data-field="subject" value="' +
            escapeAttribute(teacher.subject) +
            '" /></label>',
          '    <label><span>Фото</span><input type="text" data-field="image" value="' +
            escapeAttribute(teacher.image) +
            '" placeholder="assets/photos/teacher.jpg, data URL или https://..." /></label>',
          '    <label class="field-wide"><span>Описание</span><textarea rows="3" data-field="bio">' +
            escapeHtml(teacher.bio) +
            "</textarea></label>",
          "  </div>",
          renderImagePreview(teacher.image, teacher.name),
          '  <div class="admin-upload-row">',
          '    <label><span>Загрузить фото</span><input class="admin-upload-input" type="file" accept="image/*" data-upload-teacher="' +
            index +
            '" /></label>',
          '    <button class="button button-secondary" type="button" data-clear-teacher-image="' +
            index +
            '">Убрать фото</button>',
          "  </div>",
          '  <p class="admin-inline-note">Здесь можно быстро загрузить фото преподавателя прямо из компьютера.</p>',
          '  <div class="admin-item-actions"><button class="button button-secondary" type="button" data-remove-teacher="' +
            index +
            '">Удалить преподавателя</button></div>',
          "</article>",
        ].join("");
      })
      .join("");
  }

  function renderTestimonialsLists() {
    const pendingList = document.querySelector("#pending-testimonials-list");
    const approvedList = document.querySelector("#approved-testimonials-list");

    if (pendingList) {
      pendingList.innerHTML = data.testimonialsPending.length
        ? data.testimonialsPending
            .map(function (item, index) {
              return [
                '<article class="admin-list-card">',
                "  <strong>" + escapeHtml(item.name) + "</strong>",
                "  <p>" + escapeHtml(item.text) + "</p>",
                item.image
                  ? '  <span class="media-card-path">' +
                    escapeHtml(item.image) +
                    "</span>"
                  : "",
                '  <div class="admin-item-actions">',
                '    <button class="button button-primary" type="button" data-approve-testimonial="' +
                  index +
                  '">Одобрить</button>',
                '    <button class="button button-secondary" type="button" data-delete-pending="' +
                  index +
                  '">Удалить</button>',
                "  </div>",
                "</article>",
              ].join("");
            })
            .join("")
        : '<div class="admin-list-card"><p>Новых отзывов пока нет.</p></div>';
    }

    if (approvedList) {
      approvedList.innerHTML = data.testimonialsApproved.length
        ? data.testimonialsApproved
            .map(function (item, index) {
              return [
                '<article class="admin-list-card">',
                "  <strong>" + escapeHtml(item.name) + "</strong>",
                "  <p>" + escapeHtml(item.text) + "</p>",
                item.image
                  ? '  <span class="media-card-path">' +
                    escapeHtml(item.image) +
                    "</span>"
                  : "",
                '  <div class="admin-item-actions">',
                '    <button class="button button-secondary" type="button" data-delete-approved="' +
                  index +
                  '">Снять с сайта</button>',
                "  </div>",
                "</article>",
              ].join("");
            })
            .join("")
        : '<div class="admin-list-card"><p>Опубликованных отзывов пока нет.</p></div>';
    }
  }

  function renderLeadsList() {
    const list = document.querySelector("#leads-list");
    if (!list) {
      return;
    }

    list.innerHTML = data.leads.length
      ? data.leads
          .map(function (lead, index) {
            const date = new Date(lead.createdAt);
            const dateLabel = isNaN(date.getTime())
              ? "без даты"
              : date.toLocaleString("ru-RU");
            return [
              '<article class="admin-list-card" data-lead-index="' +
                index +
                '">',
              '  <div class="admin-card-title-row">',
              "    <strong>" + escapeHtml(lead.name) + "</strong>",
              '    <span class="status-pill">' +
                escapeHtml(getLeadStatusLabel(lead.status)) +
                "</span>",
              "  </div>",
              "  <p>Телефон: " + escapeHtml(lead.phone) + "</p>",
              "  <p>Возраст ребёнка: " +
                escapeHtml(lead.ageGroup || "не указан") +
                "</p>",
              "  <p>Направление: " +
                escapeHtml(lead.programInterest || "не указано") +
                "</p>",
              "  <p>Источник: " + escapeHtml(lead.source || "форма") + "</p>",
              '  <span class="media-card-path">' +
                escapeHtml(dateLabel) +
                "</span>",
              '  <div class="admin-item-actions">',
              '    <button class="button button-primary" type="button" data-enroll-lead="' +
                index +
                '">Зачислить в CRM</button>',
              '    <button class="button button-secondary" type="button" data-update-lead-status="' +
                index +
                '" data-status="contacted">Связались</button>',
              '    <button class="button button-secondary" type="button" data-update-lead-status="' +
                index +
                '" data-status="archived">Архив</button>',
              "  </div>",
              "</article>",
            ].join("");
          })
          .join("")
      : '<div class="admin-list-card"><p>Пока нет заявок с форм сайта.</p></div>';
  }

  function renderDirectorAnalytics() {
    const holder = document.querySelector("#director-analytics");
    if (!holder) {
      return;
    }

    const totals = getPaymentTotals();
    const activeStudents = (data.students || []).filter(function (student) {
      return student.status === "active";
    }).length;
    const unpaidParents = new Set(
      (data.payments || [])
        .filter(function (payment) {
          return payment.status !== "paid";
        })
        .map(function (payment) {
          return payment.studentId;
        }),
    ).size;
    const newLeads = (data.leads || []).filter(function (lead) {
      return !lead.status || lead.status === "new";
    }).length;

    holder.innerHTML = [
      '<article class="director-card"><span>Активные ученики</span><strong>' +
        escapeHtml(String(activeStudents)) +
        "</strong></article>",
      '<article class="director-card"><span>Новые заявки</span><strong>' +
        escapeHtml(String(newLeads)) +
        "</strong></article>",
      '<article class="director-card"><span>Оплачено услуг</span><strong>' +
        escapeHtml(formatMoney(totals.paid)) +
        "</strong></article>",
      '<article class="director-card"><span>К оплате</span><strong>' +
        escapeHtml(formatMoney(totals.unpaid)) +
        "</strong></article>",
      '<article class="director-card"><span>Родителей с долгом</span><strong>' +
        escapeHtml(String(unpaidParents)) +
        "</strong></article>",
      '<article class="director-card"><span>SMS в логе</span><strong>' +
        escapeHtml(String((data.smsLog || []).length)) +
        "</strong></article>",
    ].join("");
  }

  function renderPaymentRows(student) {
    const payments = getStudentPayments(student.id);
    if (!payments.length) {
      return '<div class="payment-row"><span>Услуги не добавлены</span><span>-</span></div>';
    }

    return payments
      .map(function (payment) {
        const service = getService(payment.serviceId);
        return [
          '<div class="payment-row">',
          "  <span>" +
            escapeHtml(service ? service.title : "Услуга") +
            "</span>",
          "  <span>" + escapeHtml(formatMoney(payment.amount)) + "</span>",
          '  <span class="status-pill ' +
            (payment.status === "paid" ? "status-paid" : "status-unpaid") +
            '">' +
            (payment.status === "paid" ? "Оплачено" : "Не оплачено") +
            "</span>",
          '  <button class="mini-action" type="button" data-toggle-payment="' +
            escapeAttribute(payment.id) +
            '">' +
            (payment.status === "paid" ? "Сделать долгом" : "Отметить оплату") +
            "</button>",
          "</div>",
        ].join("");
      })
      .join("");
  }

  function renderStudentsList() {
    const list = document.querySelector("#students-admin-list");
    if (!list) {
      return;
    }

    const filter = document.querySelector("#payment-status-filter");
    const search = document.querySelector("#student-search");
    const paymentStatus = filter ? filter.value : "all";
    const searchValue = search ? search.value.trim().toLowerCase() : "";

    const students = (data.students || []).filter(function (student) {
      const haystack = [
        student.name,
        student.parentName,
        student.parentPhone,
        student.group,
        student.program,
      ]
        .join(" ")
        .toLowerCase();
      const payments = getStudentPayments(student.id);
      const hasPaid = payments.some(function (payment) {
        return payment.status === "paid";
      });
      const hasUnpaid = payments.some(function (payment) {
        return payment.status !== "paid";
      });

      if (searchValue && haystack.indexOf(searchValue) === -1) {
        return false;
      }
      if (paymentStatus === "paid") {
        return hasPaid;
      }
      if (paymentStatus === "unpaid") {
        return hasUnpaid;
      }
      return true;
    });

    list.innerHTML = students.length
      ? students
          .map(function (student, index) {
            const realIndex = (data.students || []).findIndex(function (item) {
              return item.id === student.id;
            });
            return [
              '<article class="admin-item-card student-card" data-student-index="' +
                realIndex +
                '">',
              '  <div class="admin-card-title-row">',
              "    <strong>" + escapeHtml(student.name) + "</strong>",
              '    <span class="status-pill">' +
                escapeHtml(getStudentStatusLabel(student.status)) +
                "</span>",
              "  </div>",
              '  <div class="admin-item-grid">',
              '    <label><span>Ученик</span><input type="text" data-field="name" value="' +
                escapeAttribute(student.name) +
                '" /></label>',
              '    <label><span>Родитель</span><input type="text" data-field="parentName" value="' +
                escapeAttribute(student.parentName) +
                '" /></label>',
              '    <label><span>Телефон родителя</span><input type="tel" data-field="parentPhone" value="' +
                escapeAttribute(student.parentPhone) +
                '" /></label>',
              '    <label><span>Группа</span><input type="text" data-field="group" value="' +
                escapeAttribute(student.group) +
                '" /></label>',
              '    <label><span>Направление</span><input type="text" data-field="program" value="' +
                escapeAttribute(student.program) +
                '" /></label>',
              '    <label><span>Статус</span><select data-field="status"><option value="active"' +
                (student.status === "active" ? " selected" : "") +
                '>Учится</option><option value="lead"' +
                (student.status === "lead" ? " selected" : "") +
                '>Кандидат</option><option value="paused"' +
                (student.status === "paused" ? " selected" : "") +
                '>Пауза</option><option value="archived"' +
                (student.status === "archived" ? " selected" : "") +
                ">Архив</option></select></label>",
              '    <label class="field-wide"><span>Комментарий</span><textarea rows="2" data-field="note">' +
                escapeHtml(student.note || "") +
                "</textarea></label>",
              "  </div>",
              '  <div class="payment-list">' +
                renderPaymentRows(student) +
                "</div>",
              '  <div class="admin-item-actions">',
              '    <button class="button button-primary" type="button" data-send-student-sms="' +
                realIndex +
                '" data-type="debt">SMS о задолженности</button>',
              '    <button class="button button-secondary" type="button" data-send-student-sms="' +
                realIndex +
                '" data-type="notice">Важная SMS</button>',
              '    <button class="button button-secondary" type="button" data-add-registration-payment="' +
                realIndex +
                '">Добавить регистрацию</button>',
              '    <button class="button button-secondary" type="button" data-remove-student="' +
                realIndex +
                '">Удалить</button>',
              "  </div>",
              "</article>",
            ].join("");
          })
          .join("")
      : '<div class="admin-list-card"><p>Ученики по выбранным условиям не найдены.</p></div>';
  }

  function renderSmsTemplatesForm() {
    const form = document.querySelector("#sms-templates-form");
    const bulkForm = document.querySelector("#bulk-sms-form");
    if (form) {
      const templates = data.smsTemplates || {};
      form.debt.value = templates.debt || "";
      form.notice.value = templates.notice || "";
      form.event.value = templates.event || "";
    }
    if (bulkForm) {
      bulkForm.message.value =
        (data.smsTemplates && data.smsTemplates.event) || "";
    }
  }

  function renderSmsLog() {
    const list = document.querySelector("#sms-log-list");
    if (!list) {
      return;
    }

    list.innerHTML = (data.smsLog || []).length
      ? data.smsLog
          .slice(0, 12)
          .map(function (item) {
            const student = item.studentId ? getStudent(item.studentId) : null;
            const date = new Date(item.createdAt);
            const dateLabel = isNaN(date.getTime())
              ? "без даты"
              : date.toLocaleString("ru-RU");
            return [
              '<article class="admin-list-card">',
              '  <div class="admin-card-title-row">',
              "    <strong>" +
                escapeHtml(student ? student.name : item.phone) +
                "</strong>",
              '    <span class="status-pill">' +
                escapeHtml(item.status === "demo" ? "Демо" : item.status) +
                "</span>",
              "  </div>",
              "  <p>" + escapeHtml(item.message) + "</p>",
              '  <span class="media-card-path">' +
                escapeHtml(item.phone + " · " + dateLabel) +
                "</span>",
              "</article>",
            ].join("");
          })
          .join("")
      : '<div class="admin-list-card"><p>SMS-лог пока пуст.</p></div>';
  }

  function renderDashboard() {
    data = siteApi.loadSiteData();

    if (!dashboard) {
      return;
    }

    renderSummary();
    renderSettingsForm();
    renderAdmissionList();
    renderGalleryList();
    renderTeachersList();
    renderLeadOptionsForm();
    renderFaqList();
    renderTestimonialsLists();
    renderLeadsList();
    renderDirectorAnalytics();
    renderStudentsList();
    renderSmsTemplatesForm();
    renderSmsLog();
  }

  function bindLogin() {
    if (!loginForm) {
      return;
    }

    loginForm.addEventListener("submit", function (event) {
      event.preventDefault();
      data = siteApi.loadSiteData();

      const username = String(
        new FormData(loginForm).get("username") || "",
      ).trim();
      const password = String(
        new FormData(loginForm).get("password") || "",
      ).trim();

      if (
        username === data.admin.username &&
        password === data.admin.password
      ) {
        setAuthenticated(true);
        if (loginFeedback) {
          loginFeedback.textContent = "";
        }
        loginForm.reset();

        if (isStandaloneLoginPage) {
          redirectToDashboard();
          return;
        }

        toggleDashboard();
        renderDashboard();
        return;
      }

      if (loginFeedback) {
        loginFeedback.textContent = "Неверный логин или пароль.";
      }
    });
  }

  function bindSettingsForm() {
    const form = document.querySelector("#settings-form");
    const feedback = document.querySelector("#settings-feedback");
    if (!form) {
      return;
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      data.hero.title = form.heroTitle.value.trim() || data.hero.title;
      data.hero.subtitle = form.heroSubtitle.value.trim() || data.hero.subtitle;
      data.hero.description =
        form.heroDescription.value.trim() || data.hero.description;
      data.about.text = form.aboutText.value.trim() || data.about.text;
      data.about.founded = form.founded.value.trim() || data.about.founded;
      data.about.studentsCount =
        form.studentsCount.value.trim() || data.about.studentsCount;
      data.about.experienceCount =
        form.experienceCount.value.trim() || data.about.experienceCount;
      data.contacts.phone = form.phone.value.trim() || data.contacts.phone;
      data.contacts.telegramUrl =
        form.telegramUrl.value.trim() || data.contacts.telegramUrl;
      data.contacts.address =
        form.address.value.trim() || data.contacts.address;
      data.contacts.youtubeEmbed = form.youtubeEmbed.value.trim();
      data.contacts.mapEmbed = form.mapEmbed.value.trim();
      data.integrations = data.integrations || {};
      data.integrations.telegramBotToken = form.telegramBotToken.value.trim();
      data.integrations.telegramChatId = form.telegramChatId.value.trim();
      data.integrations.smsApiUrl = form.smsApiUrl.value.trim();
      data.integrations.smsApiToken = form.smsApiToken.value.trim();
      data.integrations.smsSender = form.smsSender.value.trim() || "Quantum";

      saveAndRefresh(data);

      if (feedback) {
        feedback.textContent = "Настройки сохранены.";
        setTimeout(function () {
          feedback.textContent = "";
        }, 2000);
      }
    });
  }

  function readFileAsDataUrl(file) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();

      reader.onload = function () {
        resolve(String(reader.result || ""));
      };

      reader.onerror = function () {
        reject(new Error("Не удалось прочитать файл."));
      };

      reader.readAsDataURL(file);
    });
  }

  function parseLines(value) {
    return String(value || "")
      .split("\n")
      .map(function (item) {
        return item.trim();
      })
      .filter(Boolean);
  }

  function bindAdmissionEditor() {
    const list = document.querySelector("#admission-admin-list");
    const addButton = document.querySelector("#add-admission-step");

    if (addButton) {
      addButton.addEventListener("click", function () {
        data.admissionSteps = data.admissionSteps || [];
        data.admissionSteps.push({
          step: "0" + (data.admissionSteps.length + 1),
          title: "Новый шаг",
          description: "Краткое описание этапа поступления.",
        });
        saveAndRefresh(data);
      });
    }

    if (!list) {
      return;
    }

    list.addEventListener("input", function (event) {
      const card = event.target.closest("[data-admission-index]");
      if (!card) {
        return;
      }

      const index = Number(card.dataset.admissionIndex);
      const field = event.target.dataset.field;

      if (Number.isNaN(index) || !field || !data.admissionSteps[index]) {
        return;
      }

      data.admissionSteps[index][field] = event.target.value;
      siteApi.saveSiteData(data);
    });

    list.addEventListener("click", function (event) {
      const removeButton = event.target.closest("[data-remove-admission]");
      if (!removeButton) {
        return;
      }

      const index = Number(removeButton.dataset.removeAdmission);
      if (Number.isNaN(index)) {
        return;
      }

      data.admissionSteps.splice(index, 1);
      saveAndRefresh(data);
    });
  }

  function bindGalleryEditor() {
    const list = document.querySelector("#gallery-admin-list");
    const addButton = document.querySelector("#add-gallery-item");

    if (addButton) {
      addButton.addEventListener("click", function () {
        data.gallery.push({
          title: "Новое фото",
          caption: "Краткая подпись",
          image: "",
          pathHint: "assets/photos/new-photo.jpg",
        });
        saveAndRefresh(data);
      });
    }

    if (!list) {
      return;
    }

    list.addEventListener("input", function (event) {
      const card = event.target.closest("[data-gallery-index]");
      if (!card) {
        return;
      }

      const index = Number(card.dataset.galleryIndex);
      const field = event.target.dataset.field;

      if (Number.isNaN(index) || !field || !data.gallery[index]) {
        return;
      }

      data.gallery[index][field] =
        field === "image"
          ? sanitizeMediaUrl(event.target.value)
          : event.target.value;
      siteApi.saveSiteData(data);
    });

    list.addEventListener("change", async function (event) {
      const upload = event.target.closest("[data-upload-gallery]");
      if (!upload) {
        return;
      }

      const index = Number(upload.dataset.uploadGallery);
      const file = upload.files && upload.files[0];

      if (Number.isNaN(index) || !file || !data.gallery[index]) {
        return;
      }

      try {
        data.gallery[index].image = await readFileAsDataUrl(file);
        saveAndRefresh(data);
      } catch (error) {
        window.alert("Не удалось загрузить изображение.");
      }
    });

    list.addEventListener("click", function (event) {
      const removeButton = event.target.closest("[data-remove-gallery]");
      const clearImageButton = event.target.closest(
        "[data-clear-gallery-image]",
      );

      if (clearImageButton) {
        const clearIndex = Number(clearImageButton.dataset.clearGalleryImage);
        if (!Number.isNaN(clearIndex) && data.gallery[clearIndex]) {
          data.gallery[clearIndex].image = "";
          saveAndRefresh(data);
        }
        return;
      }

      if (!removeButton) {
        return;
      }

      const index = Number(removeButton.dataset.removeGallery);
      if (Number.isNaN(index)) {
        return;
      }

      data.gallery.splice(index, 1);
      saveAndRefresh(data);
    });
  }

  function bindTeachersEditor() {
    const list = document.querySelector("#teachers-admin-list");
    const addButton = document.querySelector("#add-teacher-item");

    if (addButton) {
      addButton.addEventListener("click", function () {
        data.teachers.push({
          name: "Новый преподаватель",
          subject: "Предмет",
          bio: "Короткое описание преподавателя.",
          image: "",
        });
        saveAndRefresh(data);
      });
    }

    if (!list) {
      return;
    }

    list.addEventListener("input", function (event) {
      const card = event.target.closest("[data-teacher-index]");
      if (!card) {
        return;
      }

      const index = Number(card.dataset.teacherIndex);
      const field = event.target.dataset.field;

      if (Number.isNaN(index) || !field || !data.teachers[index]) {
        return;
      }

      data.teachers[index][field] =
        field === "image"
          ? sanitizeMediaUrl(event.target.value)
          : event.target.value;
      siteApi.saveSiteData(data);
    });

    list.addEventListener("change", async function (event) {
      const upload = event.target.closest("[data-upload-teacher]");
      if (!upload) {
        return;
      }

      const index = Number(upload.dataset.uploadTeacher);
      const file = upload.files && upload.files[0];

      if (Number.isNaN(index) || !file || !data.teachers[index]) {
        return;
      }

      try {
        data.teachers[index].image = await readFileAsDataUrl(file);
        saveAndRefresh(data);
      } catch (error) {
        window.alert("Не удалось загрузить изображение.");
      }
    });

    list.addEventListener("click", function (event) {
      const removeButton = event.target.closest("[data-remove-teacher]");
      const clearImageButton = event.target.closest(
        "[data-clear-teacher-image]",
      );

      if (clearImageButton) {
        const clearIndex = Number(clearImageButton.dataset.clearTeacherImage);
        if (!Number.isNaN(clearIndex) && data.teachers[clearIndex]) {
          data.teachers[clearIndex].image = "";
          saveAndRefresh(data);
        }
        return;
      }

      if (!removeButton) {
        return;
      }

      const index = Number(removeButton.dataset.removeTeacher);
      if (Number.isNaN(index)) {
        return;
      }

      data.teachers.splice(index, 1);
      saveAndRefresh(data);
    });
  }

  function bindLeadOptionsForm() {
    const form = document.querySelector("#lead-options-form");
    const feedback = document.querySelector("#lead-options-feedback");
    if (!form) {
      return;
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      data.leadOptions = data.leadOptions || {};
      data.leadOptions.ageGroups = parseLines(form.ageGroups.value);
      data.leadOptions.interests = parseLines(form.interests.value);
      saveAndRefresh(data);

      if (feedback) {
        feedback.textContent = "Опции формы сохранены.";
        setTimeout(function () {
          feedback.textContent = "";
        }, 2000);
      }
    });
  }

  function bindFaqEditor() {
    const list = document.querySelector("#faq-admin-list");
    const addButton = document.querySelector("#add-faq-item");

    if (addButton) {
      addButton.addEventListener("click", function () {
        data.faq = data.faq || [];
        data.faq.push({
          question: "Новый вопрос",
          answer: "Новый ответ",
        });
        saveAndRefresh(data);
      });
    }

    if (!list) {
      return;
    }

    list.addEventListener("input", function (event) {
      const card = event.target.closest("[data-faq-index]");
      if (!card) {
        return;
      }

      const index = Number(card.dataset.faqIndex);
      const field = event.target.dataset.field;

      if (Number.isNaN(index) || !field || !data.faq[index]) {
        return;
      }

      data.faq[index][field] = event.target.value;
      siteApi.saveSiteData(data);
    });

    list.addEventListener("click", function (event) {
      const removeButton = event.target.closest("[data-remove-faq]");
      if (!removeButton) {
        return;
      }

      const index = Number(removeButton.dataset.removeFaq);
      if (Number.isNaN(index)) {
        return;
      }

      data.faq.splice(index, 1);
      saveAndRefresh(data);
    });
  }

  function bindTestimonialsModeration() {
    const pendingList = document.querySelector("#pending-testimonials-list");
    const approvedList = document.querySelector("#approved-testimonials-list");

    if (pendingList) {
      pendingList.addEventListener("click", function (event) {
        const approveButton = event.target.closest(
          "[data-approve-testimonial]",
        );
        const deleteButton = event.target.closest("[data-delete-pending]");

        if (approveButton) {
          const index = Number(approveButton.dataset.approveTestimonial);
          if (!Number.isNaN(index) && data.testimonialsPending[index]) {
            const item = data.testimonialsPending.splice(index, 1)[0];
            data.testimonialsApproved.unshift(item);
            saveAndRefresh(data);
          }
        }

        if (deleteButton) {
          const index = Number(deleteButton.dataset.deletePending);
          if (!Number.isNaN(index)) {
            data.testimonialsPending.splice(index, 1);
            saveAndRefresh(data);
          }
        }
      });
    }

    if (approvedList) {
      approvedList.addEventListener("click", function (event) {
        const deleteButton = event.target.closest("[data-delete-approved]");
        if (!deleteButton) {
          return;
        }

        const index = Number(deleteButton.dataset.deleteApproved);
        if (!Number.isNaN(index)) {
          data.testimonialsApproved.splice(index, 1);
          saveAndRefresh(data);
        }
      });
    }
  }

  function bindLeadsActions() {
    const clearButton = document.querySelector("#clear-leads");
    const list = document.querySelector("#leads-list");

    if (clearButton) {
      clearButton.addEventListener("click", function () {
        data.leads = [];
        saveAndRefresh(data);
      });
    }

    if (list) {
      list.addEventListener("click", function (event) {
        const statusButton = event.target.closest("[data-update-lead-status]");
        const enrollButton = event.target.closest("[data-enroll-lead]");

        if (statusButton) {
          const index = Number(statusButton.dataset.updateLeadStatus);
          if (!Number.isNaN(index) && data.leads[index]) {
            data.leads[index].status = statusButton.dataset.status || "new";
            saveAndRefresh(data);
          }
          return;
        }

        if (enrollButton) {
          const index = Number(enrollButton.dataset.enrollLead);
          const lead = data.leads[index];
          if (!Number.isNaN(index) && lead) {
            const student = {
              id: makeId("student"),
              name: lead.name,
              parentName: lead.name,
              parentPhone: lead.phone,
              group: lead.ageGroup || "Новая группа",
              program: lead.programInterest || "Консультация",
              status: "active",
              balance: 0,
              note: "Создано из заявки.",
              createdAt: new Date().toISOString(),
            };
            data.students = data.students || [];
            data.students.unshift(student);
            data.leads[index].status = "enrolled";
            saveAndRefresh(data);
          }
        }
      });
    }
  }

  function bindStudentsCrm() {
    const list = document.querySelector("#students-admin-list");
    const addButton = document.querySelector("#add-student-item");
    const filter = document.querySelector("#payment-status-filter");
    const search = document.querySelector("#student-search");

    if (addButton) {
      addButton.addEventListener("click", function () {
        data.students = data.students || [];
        data.students.unshift({
          id: makeId("student"),
          name: "Новый ученик",
          parentName: "Имя родителя",
          parentPhone: "+998 ",
          group: "Группа",
          program: "Направление",
          status: "active",
          balance: 0,
          note: "",
          createdAt: new Date().toISOString(),
        });
        saveAndRefresh(data);
      });
    }

    if (filter) {
      filter.addEventListener("change", renderStudentsList);
    }

    if (search) {
      search.addEventListener("input", renderStudentsList);
    }

    if (!list) {
      return;
    }

    list.addEventListener("input", function (event) {
      const card = event.target.closest("[data-student-index]");
      const field = event.target.dataset.field;
      if (!card || !field) {
        return;
      }

      const index = Number(card.dataset.studentIndex);
      if (Number.isNaN(index) || !data.students[index]) {
        return;
      }

      data.students[index][field] = event.target.value;
      siteApi.saveSiteData(data);
      renderDirectorAnalytics();
    });

    list.addEventListener("change", function (event) {
      const card = event.target.closest("[data-student-index]");
      const field = event.target.dataset.field;
      if (!card || !field) {
        return;
      }

      const index = Number(card.dataset.studentIndex);
      if (!Number.isNaN(index) && data.students[index]) {
        data.students[index][field] = event.target.value;
        siteApi.saveSiteData(data);
        renderDirectorAnalytics();
      }
    });

    list.addEventListener("click", async function (event) {
      const removeButton = event.target.closest("[data-remove-student]");
      const smsButton = event.target.closest("[data-send-student-sms]");
      const addRegistrationButton = event.target.closest(
        "[data-add-registration-payment]",
      );
      const paymentButton = event.target.closest("[data-toggle-payment]");

      if (paymentButton) {
        const paymentId = paymentButton.dataset.togglePayment;
        const payment = (data.payments || []).find(function (item) {
          return item.id === paymentId;
        });
        if (payment) {
          payment.status = payment.status === "paid" ? "unpaid" : "paid";
          payment.paidAt =
            payment.status === "paid"
              ? new Date().toISOString().slice(0, 10)
              : "";
          saveAndRefresh(data);
        }
        return;
      }

      if (addRegistrationButton) {
        const index = Number(
          addRegistrationButton.dataset.addRegistrationPayment,
        );
        const student = data.students[index];
        const registration = (data.services || [])[0];
        if (!Number.isNaN(index) && student && registration) {
          data.payments = data.payments || [];
          data.payments.unshift({
            id: makeId("payment"),
            studentId: student.id,
            serviceId: registration.id,
            amount: registration.price,
            status: "unpaid",
            dueDate: new Date().toISOString().slice(0, 10),
            paidAt: "",
            comment: "Регистрация",
          });
          saveAndRefresh(data);
        }
        return;
      }

      if (smsButton) {
        const index = Number(smsButton.dataset.sendStudentSms);
        const student = data.students[index];
        const type = smsButton.dataset.type || "notice";
        if (!Number.isNaN(index) && student) {
          const template = (data.smsTemplates && data.smsTemplates[type]) || "";
          const message = fillTemplate(template, {
            student: student.name,
            parent: student.parentName,
            phone: student.parentPhone,
            program: student.program,
          });
          smsButton.textContent = "Отправляем...";
          try {
            await sendSms(student.parentPhone, message, {
              studentId: student.id,
              type: type,
            });
            saveAndRefresh(data);
          } catch (error) {
            window.alert(
              "SMS не отправлена. Проверьте SMS API URL или доступ провайдера.",
            );
            renderStudentsList();
          }
        }
        return;
      }

      if (removeButton) {
        const index = Number(removeButton.dataset.removeStudent);
        if (!Number.isNaN(index)) {
          const student = data.students[index];
          data.students.splice(index, 1);
          if (student) {
            data.payments = (data.payments || []).filter(function (payment) {
              return payment.studentId !== student.id;
            });
          }
          saveAndRefresh(data);
        }
      }
    });
  }

  function bindSmsTools() {
    const templatesForm = document.querySelector("#sms-templates-form");
    const templatesFeedback = document.querySelector("#sms-templates-feedback");
    const bulkForm = document.querySelector("#bulk-sms-form");
    const bulkFeedback = document.querySelector("#bulk-sms-feedback");

    if (templatesForm) {
      templatesForm.addEventListener("submit", function (event) {
        event.preventDefault();
        data.smsTemplates = data.smsTemplates || {};
        data.smsTemplates.debt = templatesForm.debt.value.trim();
        data.smsTemplates.notice = templatesForm.notice.value.trim();
        data.smsTemplates.event = templatesForm.event.value.trim();
        saveAndRefresh(data);
        if (templatesFeedback) {
          templatesFeedback.textContent = "SMS-шаблоны сохранены.";
          setTimeout(function () {
            templatesFeedback.textContent = "";
          }, 2000);
        }
      });
    }

    if (bulkForm) {
      bulkForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        const message = bulkForm.message.value.trim();
        const seenPhones = new Set();
        const parents = (data.students || []).filter(function (student) {
          const phone = String(student.parentPhone || "").trim();
          if (
            !phone ||
            student.status === "archived" ||
            seenPhones.has(phone)
          ) {
            return false;
          }
          seenPhones.add(phone);
          return true;
        });

        if (!message || !parents.length) {
          if (bulkFeedback) {
            bulkFeedback.textContent =
              "Введите текст и убедитесь, что в CRM есть родители.";
          }
          return;
        }

        if (bulkFeedback) {
          bulkFeedback.textContent = "Отправляем SMS...";
        }

        try {
          for (const student of parents) {
            await sendSms(student.parentPhone, message, {
              studentId: student.id,
              type: "bulk",
            });
          }
          data = siteApi.loadSiteData();
          renderDashboard();
          if (bulkFeedback) {
            bulkFeedback.textContent =
              "Рассылка отправлена: " + parents.length + " получателей.";
          }
        } catch (error) {
          if (bulkFeedback) {
            bulkFeedback.textContent =
              "Рассылка остановлена: проверьте SMS API.";
          }
          renderDashboard();
        }
      });
    }
  }

  function bindBackupActions() {
    const exportButton = document.querySelector("#export-site-data");
    const importButton = document.querySelector("#import-site-data");
    const importInput = document.querySelector("#import-site-data-input");
    const feedback = document.querySelector("#backup-feedback");

    if (exportButton) {
      exportButton.addEventListener("click", function () {
        const payload = JSON.stringify(siteApi.loadSiteData(), null, 2);
        const blob = new Blob([payload], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "quantum-elite-site-data.json";
        anchor.click();
        URL.revokeObjectURL(url);

        if (feedback) {
          feedback.textContent = "JSON экспортирован.";
          setTimeout(function () {
            feedback.textContent = "";
          }, 2000);
        }
      });
    }

    if (importButton && importInput) {
      importButton.addEventListener("click", function () {
        importInput.click();
      });

      importInput.addEventListener("change", function () {
        const file = importInput.files && importInput.files[0];
        if (!file) {
          return;
        }

        const reader = new FileReader();
        reader.onload = function () {
          try {
            const parsed = JSON.parse(String(reader.result || "{}"));
            data = siteApi.saveSiteData(parsed);
            renderDashboard();

            if (feedback) {
              feedback.textContent = "JSON успешно импортирован.";
              setTimeout(function () {
                feedback.textContent = "";
              }, 2000);
            }
          } catch (error) {
            if (feedback) {
              feedback.textContent = "Не удалось импортировать JSON.";
            }
          }
          importInput.value = "";
        };
        reader.readAsText(file);
      });
    }
  }

  function bindCredentialsForm() {
    const form = document.querySelector("#credentials-form");
    const feedback = document.querySelector("#credentials-feedback");
    const resetButton = document.querySelector("#reset-demo-data");
    const logoutButton = document.querySelector("#admin-logout");

    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();

        const username = form.username.value.trim();
        const password = form.password.value.trim();

        if (!username || !password) {
          if (feedback) {
            feedback.textContent = "Введите новый логин и пароль.";
          }
          return;
        }

        data.admin.username = username;
        data.admin.password = password;
        saveAndRefresh(data);
        form.reset();

        if (feedback) {
          feedback.textContent = "Данные входа обновлены.";
          setTimeout(function () {
            feedback.textContent = "";
          }, 2000);
        }
      });
    }

    if (resetButton) {
      resetButton.addEventListener("click", function () {
        data = siteApi.resetSiteData();
        renderDashboard();
        if (feedback) {
          feedback.textContent = "Демо-данные восстановлены.";
          setTimeout(function () {
            feedback.textContent = "";
          }, 2000);
        }
      });
    }

    if (logoutButton) {
      logoutButton.addEventListener("click", function () {
        setAuthenticated(false);
        redirectToLogin();
      });
    }
  }

  bindLogin();

  if (isStandaloneLoginPage) {
    if (isAuthenticated()) {
      redirectToDashboard();
    }
    return;
  }

  if (dashboard && !isAuthenticated()) {
    redirectToLogin();
    return;
  }

  bindSettingsForm();
  bindAdmissionEditor();
  bindGalleryEditor();
  bindTeachersEditor();
  bindLeadOptionsForm();
  bindFaqEditor();
  bindTestimonialsModeration();
  bindLeadsActions();
  bindStudentsCrm();
  bindSmsTools();
  bindBackupActions();
  bindCredentialsForm();
  toggleDashboard();

  if (isAuthenticated()) {
    renderDashboard();
  }
})();
