(function () {
  const STORAGE_KEY = "quantum-elite-site-data";
  const SESSION_KEY = "quantum-elite-admin-session";

  const DEFAULT_SITE_DATA = {
    hero: {
      title: "Quantum Elite School",
      subtitle: "Современное образование для будущего",
      description:
        "Сильная академическая база, английский язык, кружки и бережная среда, где ребёнок учится мыслить, развиваться и уверенно смотреть в будущее.",
      panelPoints: [
        "Маленькие классы и личное внимание",
        "Английский, кружки и школьная среда в одном месте",
        "Технологичный подход к обучению и развитию",
      ],
    },
    about: {
      text: "Quantum Elite School — это школа для родителей, которые хотят сочетание качества, интеллекта, тёплой атмосферы и современного подхода. Мы создаём пространство, где детям интересно учиться, раскрывать таланты и чувствовать поддержку каждый день.",
      founded: "2020",
      studentsCount: "100+",
      experienceCount: "5+",
      highlights: [
        "Небольшие классы и спокойная учебная атмосфера",
        "Сильная академическая база и развитие мышления",
        "Английский язык как часть ежедневной практики",
        "Кружки и дополнительные активности для раскрытия интересов",
      ],
    },
    programs: [
      {
        title: "Начальная школа",
        description:
          "Фундаментальные знания, развитие речи, логики и уверенности ребёнка в комфортной и поддерживающей среде.",
        badge: "Foundation",
      },
      {
        title: "Английский",
        description:
          "Регулярная практика языка, современная подача и уверенное погружение в английский с раннего возраста.",
        badge: "Language",
      },
      {
        title: "Кружки",
        description:
          "Творческие и развивающие направления, которые помогают ребёнку находить интересы и раскрывать способности.",
        badge: "Growth",
      },
    ],
    reasons: [
      {
        icon: "group",
        title: "Маленькие классы",
        description:
          "Больше внимания, спокойный темп урока и реальная вовлечённость каждого ученика.",
      },
      {
        icon: "focus",
        title: "Внимание к каждому",
        description:
          "Учителя видят прогресс ребёнка, поддерживают и помогают раскрывать сильные стороны.",
      },
      {
        icon: "spark",
        title: "Современное обучение",
        description:
          "Мы соединяем дисциплину, технологии и живую подачу материала, чтобы учёба была интересной.",
      },
    ],
    admissionSteps: [
      {
        step: "01",
        title: "Оставьте заявку",
        description:
          "Родитель оставляет контакты на сайте, а школа получает быстрый и понятный лид.",
      },
      {
        step: "02",
        title: "Получите звонок",
        description:
          "Администратор связывается, отвечает на вопросы и уточняет возраст ребёнка и интересы.",
      },
      {
        step: "03",
        title: "Приходите на экскурсию",
        description:
          "Семья знакомится с пространством, программой и атмосферой школы вживую.",
      },
      {
        step: "04",
        title: "Пробный день",
        description:
          "Ребёнок мягко погружается в среду и родители видят, насколько ему комфортно.",
      },
      {
        step: "05",
        title: "Зачисление",
        description:
          "Финальное оформление и старт обучения в понятном и спокойном процессе.",
      },
    ],
    faq: [
      {
        question: "Сколько детей в одном классе?",
        answer:
          "Школа делает акцент на небольших классах, чтобы учитель мог уделять внимание каждому ребёнку.",
      },
      {
        question: "Есть ли английский язык в программе?",
        answer:
          "Да, английский встроен в образовательную среду и поддерживается отдельными занятиями и практикой.",
      },
      {
        question: "Можно ли прийти на экскурсию перед поступлением?",
        answer:
          "Да, это один из самых важных этапов доверия: семья может познакомиться со школой до принятия решения.",
      },
      {
        question: "Есть ли кружки и дополнительные активности?",
        answer:
          "Да, на сайте уже выделен отдельный блок под кружки, чтобы показать развитие интересов ребёнка.",
      },
      {
        question: "Как быстро школа связывается после заявки?",
        answer:
          "Сайт спроектирован под быстрый контакт: заявка сразу попадает в список лидов и может дополнительно уходить в Telegram.",
      },
      {
        question: "Можно ли оставить отзыв родителя и опубликовать его позже?",
        answer:
          "Да, отзыв проходит модерацию через админку, и только после одобрения появляется на сайте.",
      },
    ],
    leadOptions: {
      ageGroups: [
        "4-5 лет",
        "6-7 лет",
        "8-9 лет",
        "10-12 лет",
        "Нужна консультация",
      ],
      interests: [
        "Начальная школа",
        "Английский",
        "Кружки",
        "Полная консультация",
      ],
    },
    gallery: [
      {
        title: "Дети в классе",
        caption: "Светлая фотография детей за занятием",
        image: "",
        pathHint: "assets/photos/classroom-kids.jpg",
      },
      {
        title: "Учитель объясняет",
        caption: "Живой момент объяснения у доски",
        image: "",
        pathHint: "assets/photos/teacher-explains.jpg",
      },
      {
        title: "Школа внутри",
        caption: "Интерьер, чистые коридоры, современная атмосфера",
        image: "",
        pathHint: "assets/photos/school-interior.jpg",
      },
      {
        title: "Школа снаружи",
        caption: "Фасад или вход в школу",
        image: "",
        pathHint: "assets/photos/school-exterior.jpg",
      },
      {
        title: "Дети улыбаются",
        caption: "Эмоциональное тёплое фото детей",
        image: "",
        pathHint: "assets/photos/happy-students.jpg",
      },
      {
        title: "Английский урок",
        caption: "Яркий учебный процесс",
        image: "",
        pathHint: "assets/photos/english-class.jpg",
      },
      {
        title: "Кружки",
        caption: "Активности и развитие интересов",
        image: "",
        pathHint: "assets/photos/clubs.jpg",
      },
      {
        title: "Школьная атмосфера",
        caption: "Счастливые дети и уютная среда",
        image: "",
        pathHint: "assets/photos/school-life.jpg",
      },
    ],
    teachers: [
      {
        name: "Алина Рустамовна",
        subject: "Английский язык",
        bio: "Фокус на разговорной практике, уверенности ребёнка и понятной подаче материала.",
        image: "",
      },
      {
        name: "Сабина Шухратовна",
        subject: "Начальная школа",
        bio: "Помогает детям полюбить учёбу, выстраивает сильную базу и спокойную адаптацию.",
        image: "",
      },
      {
        name: "Дилноза Бахтиёровна",
        subject: "Развивающие кружки",
        bio: "Создаёт среду, где дети открывают свои интересы и учатся выражать себя свободно.",
        image: "",
      },
    ],
    testimonialsApproved: [
      {
        name: "Мадина Каримова",
        text: "Ребёнок с радостью ходит в школу, стал увереннее и заметно вырос в английском. Очень нравится атмосфера и забота учителей.",
        image: "",
      },
      {
        name: "Азиза Нурматова",
        text: "Для нас важно было найти школу с сильной базой и вниманием к каждому ребёнку. Здесь мы это действительно увидели.",
        image: "",
      },
    ],
    testimonialsPending: [],
    leads: [],
    students: [
      {
        id: "student-001",
        name: "Амира Каримова",
        parentName: "Мадина Каримова",
        parentPhone: "+998 90 123 45 67",
        group: "1-A",
        program: "Начальная школа",
        status: "active",
        balance: -1200000,
        note: "Нужно напомнить об оплате регистрации.",
        createdAt: "2026-05-01T09:00:00.000Z",
      },
      {
        id: "student-002",
        name: "Тимур Нурматов",
        parentName: "Азиза Нурматова",
        parentPhone: "+998 91 555 44 33",
        group: "English Kids",
        program: "Английский",
        status: "active",
        balance: 0,
        note: "Оплата регистрации закрыта.",
        createdAt: "2026-05-03T10:30:00.000Z",
      },
      {
        id: "student-003",
        name: "Самира Абдуллаева",
        parentName: "Нодира Абдуллаева",
        parentPhone: "+998 93 777 66 55",
        group: "Подготовка",
        program: "Полная консультация",
        status: "lead",
        balance: -600000,
        note: "Ожидает оформления после пробного дня.",
        createdAt: "2026-05-05T12:00:00.000Z",
      },
    ],
    services: [
      {
        id: "service-registration",
        title: "Регистрация",
        price: 1200000,
        required: true,
      },
      {
        id: "service-monthly",
        title: "Ежемесячная оплата",
        price: 3500000,
        required: false,
      },
      {
        id: "service-clubs",
        title: "Кружки",
        price: 600000,
        required: false,
      },
    ],
    payments: [
      {
        id: "payment-001",
        studentId: "student-001",
        serviceId: "service-registration",
        amount: 1200000,
        status: "unpaid",
        dueDate: "2026-05-25",
        paidAt: "",
        comment: "Регистрационный взнос",
      },
      {
        id: "payment-002",
        studentId: "student-002",
        serviceId: "service-registration",
        amount: 1200000,
        status: "paid",
        dueDate: "2026-05-12",
        paidAt: "2026-05-10",
        comment: "Оплачено наличными",
      },
      {
        id: "payment-003",
        studentId: "student-003",
        serviceId: "service-clubs",
        amount: 600000,
        status: "unpaid",
        dueDate: "2026-05-28",
        paidAt: "",
        comment: "Пробный месяц кружка",
      },
    ],
    smsTemplates: {
      debt: "Здравствуйте! Напоминаем об оплате задолженности за обучение в Quantum Elite School. Спасибо.",
      notice:
        "Здравствуйте! В Quantum Elite School есть важное уведомление для родителей. Пожалуйста, свяжитесь с администрацией.",
      event:
        "Здравствуйте! Напоминаем о важном мероприятии в Quantum Elite School. Ждём вас.",
    },
    smsLog: [],
    contacts: {
      phone: "+998 90 000 00 00",
      telegramUrl: "https://t.me/quantum_school",
      address: "Ташкент, точный адрес школы",
      mapEmbed: "https://maps.google.com/maps?q=Tashkent&z=13&output=embed",
      youtubeEmbed: "",
    },
    integrations: {
      telegramBotToken: "",
      telegramChatId: "",
      smsApiUrl: "",
      smsApiToken: "",
      smsSender: "Quantum",
    },
    admin: {
      username: "quantumadmin",
      password: "securepassword",
    },
    updatedAt: "",
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function mergeDefaults(defaultValue, savedValue) {
    if (Array.isArray(defaultValue)) {
      return Array.isArray(savedValue) ? savedValue : clone(defaultValue);
    }

    if (defaultValue && typeof defaultValue === "object") {
      const result = {};
      const source =
        savedValue && typeof savedValue === "object" ? savedValue : {};

      Object.keys(defaultValue).forEach(function (key) {
        result[key] = mergeDefaults(defaultValue[key], source[key]);
      });

      Object.keys(source).forEach(function (key) {
        if (!(key in result)) {
          result[key] = source[key];
        }
      });

      return result;
    }

    return savedValue === undefined ? defaultValue : savedValue;
  }

  function loadSiteData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const seeded = clone(DEFAULT_SITE_DATA);
        saveSiteData(seeded);
        return seeded;
      }

      const parsed = JSON.parse(raw);
      return mergeDefaults(DEFAULT_SITE_DATA, parsed);
    } catch (error) {
      console.warn(
        "Failed to load saved site data, resetting to defaults.",
        error,
      );
      const fallback = clone(DEFAULT_SITE_DATA);
      saveSiteData(fallback);
      return fallback;
    }
  }

  function saveSiteData(data) {
    const nextData = mergeDefaults(DEFAULT_SITE_DATA, data);
    nextData.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextData));
    return nextData;
  }

  function resetSiteData() {
    const reset = clone(DEFAULT_SITE_DATA);
    saveSiteData(reset);
    return reset;
  }

  window.QuantumSiteData = {
    STORAGE_KEY: STORAGE_KEY,
    SESSION_KEY: SESSION_KEY,
    DEFAULT_SITE_DATA: clone(DEFAULT_SITE_DATA),
    loadSiteData: loadSiteData,
    saveSiteData: saveSiteData,
    resetSiteData: resetSiteData,
  };
})();
