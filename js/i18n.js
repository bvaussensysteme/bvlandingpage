/* ============================================================
   BV AussenSysteme – Vollständige Übersetzung DE / EN / RU
   Strategie: innerHTML-Ersatz für vollständige Übersetzung
   ============================================================ */

var currentLang = localStorage.getItem('bv_lang') || 'de';

// ============================================================
// ÜBERSETZUNGS-PAARE: [selector, de_text, en_text, ru_text]
// ============================================================
var t = [
  // NAV
  ['[data-i18n="nav_leistungen"]', 'Leistungen', 'Services', 'Услуги'],
  ['[data-i18n="nav_galerie"]', 'Galerie', 'Gallery', 'Галерея'],
  ['[data-i18n="nav_ueberuns"]', 'Über uns', 'About us', 'О нас'],
  ['[data-i18n="nav_ablauf"]', 'Ablauf', 'Process', 'Процесс'],
  ['[data-i18n="nav_faq"]', 'FAQ', 'FAQ', 'Вопросы'],
  ['[data-i18n="nav_anfragen"]', 'Jetzt anfragen', 'Get a quote', 'Запросить'],

  // HERO
  ['[data-i18n="hero_eyebrow"]', 'Ihr Spezialist im Westerwald', 'Your specialist in the Westerwald', 'Ваш специалист в регионе Вестервальд'],
  ['[data-i18n="hero_slogan"]', 'Überdacht. Durchdacht. Zuverlässig.', 'Covered. Considered. Reliable.', 'Надёжно. Продуманно. Качественно.'],
  ['[data-i18n="hero_h1"]', 'Ihr Traumplatz draußen – das ganze Jahr.', 'Your dream outdoor space – all year round.', 'Ваше идеальное место на улице – круглый год.'],
  ['[data-i18n="hero_sub"]', 'Terrassenüberdachungen, Carports, Pergolen und Sonnenschutz – maßgefertigt, professionell montiert, 10 Jahre Garantie. Für Privat- und Gewerbekunden im Westerwald und Umgebung.', 'Patio covers, carports, pergolas & sun protection – custom-made, professionally installed, 10-year warranty. For private and commercial customers in the Westerwald region.', 'Навесы для террас, карпорты, перголы и солнцезащита – изготовление на заказ, профессиональный монтаж, 10 лет гарантии. Для частных и коммерческих клиентов в регионе Вестервальд.'],
  ['[data-i18n="hero_btn1"]', 'Kostenlos beraten lassen', 'Free consultation', 'Бесплатная консультация'],
  ['[data-i18n="hero_btn2"]', 'Alle Leistungen →', 'All services →', 'Все услуги →'],

  // USP STRIP
  ['[data-i18n="usp_garantie"]', '10 J. Alu · 5 J. Elektro', '10 / 5 Years', '10 / 5 лет'],
  ['[data-i18n="usp_garantie_sub"]', 'Garantie direkt vom Hersteller', 'Manufacturer warranty', 'Гарантия от производителя'],
  ['[data-i18n="usp_mass"]', '100% Maßanfertigung', '100% Custom-made', '100% Под заказ'],
  ['[data-i18n="usp_mass_sub"]', 'exakt nach Ihren Wünschen', 'exactly to your wishes', 'по вашим пожеланиям'],
  ['[data-i18n="usp_beratung"]', 'Kostenlose Beratung', 'Free consultation', 'Бесплатная консультация'],
  ['[data-i18n="usp_beratung_sub"]', 'wir kommen zu Ihnen', 'we come to you', 'приедем к вам'],
  ['[data-i18n="usp_ce"]', 'CE & Statik', 'CE & Statics', 'CE & Статика'],
  ['[data-i18n="usp_ce_sub"]', 'Wind- & Schneelasten-Nachweis', 'wind & snow load certificate', 'нагрузки ветра и снега'],
  ['[data-i18n="usp_gewerbe"]', 'Privat & Gewerbe', 'Private & Commercial', 'Частным и бизнесу'],
  ['[data-i18n="usp_gewerbe_sub"]', 'für jeden Bedarf', 'for every need', 'для любых нужд'],

  // SECTIONS
  ['[data-i18n="leistungen_tag"]', 'Unsere Leistungen', 'Our Services', 'Наши услуги'],
  ['[data-i18n="leistungen_h2"]', 'Alles für draußen – aus einer Hand', 'Everything for outdoors – from one source', 'Всё для улицы – из одних рук'],
  ['[data-i18n="galerie_tag"]', 'Unsere Referenzen', 'Our References', 'Наши проекты'],
  ['[data-i18n="galerie_h2"]', 'Projekte, die für sich sprechen', 'Projects that speak for themselves', 'Проекты, говорящие сами за себя'],
  ['[data-i18n="faq_tag"]', 'Häufige Fragen', 'Frequently Asked Questions', 'Часто задаваемые вопросы'],
  ['[data-i18n="faq_h2"]', 'Alles Wichtige auf einen Blick', 'Everything you need to know', 'Всё важное на одной странице'],
  ['[data-i18n="kontakt_h2"]', 'Kostenlose Beratung – wir kommen zu Ihnen', 'Free consultation – we come to you', 'Бесплатная консультация – приедем к вам'],
  ['[data-i18n="kontakt_btn"]', 'Kostenlose Beratung anfordern →', 'Request free consultation →', 'Запросить бесплатную консультацию →'],

  // KONTAKT FORM LABELS
  ['[data-i18n="kontakt_vorname"]', 'Vorname', 'First name', 'Имя'],
  ['[data-i18n="kontakt_nachname"]', 'Nachname', 'Last name', 'Фамилия'],
  ['[data-i18n="kontakt_email"]', 'E-Mail-Adresse', 'Email address', 'Электронная почта'],
  ['[data-i18n="kontakt_telefon"]', 'Telefon / WhatsApp', 'Phone / WhatsApp', 'Телефон / WhatsApp'],
  ['[data-i18n="kontakt_nachricht"]', 'Nachricht', 'Message', 'Сообщение'],
  ['[data-i18n="kontakt_produkt"]', 'Ich interessiere mich für', 'I am interested in', 'Меня интересует'],
  ['[data-i18n="kontakt_note"]', '* Pflichtfelder. Ihre Daten werden vertraulich behandelt und nicht weitergegeben.', '* Required fields. Your data will be treated confidentially.', '* Обязательные поля. Ваши данные обрабатываются конфиденциально.'],

  // MEHR ERFAHREN
  ['[data-i18n="mehr_erfahren"]', 'Mehr erfahren →', 'Learn more →', 'Подробнее →'],

  // FOOTER
  ['[data-i18n="footer_cookies"]', 'Cookie-Einstellungen', 'Cookie settings', 'Настройки cookies'],
  ['[data-i18n="footer_impressum"]', 'Impressum', 'Legal notice', 'Об организации'],
  ['[data-i18n="footer_datenschutz"]', 'Datenschutz', 'Privacy policy', 'Конфиденциальность'],
];

// Placeholder translations
var placeholders = [
  ['[data-i18n-placeholder="kontakt_vorname"]', 'Max', 'John', 'Иван'],
  ['[data-i18n-placeholder="kontakt_nachname"]', 'Mustermann', 'Smith', 'Иванов'],
  ['[data-i18n-placeholder="kontakt_email"]', 'max@beispiel.de', 'john@example.com', 'ivan@beispiel.de'],
  ['[data-i18n-placeholder="kontakt_telefon"]', '0156 …', '0156 …', '+7 / 0156 …'],
];

var langIndex = { de: 1, en: 2, ru: 3 };

function setLanguage(lang) {
  if (!langIndex[lang]) return;
  currentLang = lang;
  localStorage.setItem('bv_lang', lang);
  var idx = langIndex[lang];

  // Apply all text translations
  t.forEach(function(row) {
    document.querySelectorAll(row[0]).forEach(function(el) {
      el.innerHTML = row[idx];
    });
  });

  // Apply placeholder translations
  placeholders.forEach(function(row) {
    document.querySelectorAll(row[0]).forEach(function(el) {
      el.placeholder = row[idx];
    });
  });

  // Update active button state
  document.querySelectorAll('.lang-btn[data-lang]').forEach(function(btn) {
    btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
  });

  // Update html lang
  document.documentElement.lang = lang;
}

// Apply on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() { setLanguage(currentLang); });
} else {
  setLanguage(currentLang);
}
