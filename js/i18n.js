/* ============================================================
   BV AussenSysteme – Vollständige Übersetzung DE / EN / RU
   Strategie: Direkter Text-Ersatz aller Texte auf der Seite
   ============================================================ */

var currentLang = localStorage.getItem('bv_lang') || 'de';

/* Jedes Paar: [ deutscher_text, englischer_text, russischer_text ]
   Der deutsche Text wird 1:1 im DOM gesucht und ersetzt.          */
var translations = [
  // ── NAVIGATION ──────────────────────────────────────────────
  ['Leistungen','Services','Услуги'],
  ['Galerie','Gallery','Галерея'],
  ['Über uns','About us','О нас'],
  ['Ablauf','Process','Процесс'],
  ['FAQ','FAQ','FAQ'],
  ['Jetzt anfragen','Get a quote','Запросить'],

  // ── HERO ────────────────────────────────────────────────────
  ['Ihr Spezialist im Westerwald','Your specialist in the Westerwald','Ваш специалист в регионе Вестервальд'],
  ['Ihr Traumplatz draußen – das ganze Jahr.','Your dream outdoor space – all year round.','Ваше идеальное место на улице – круглый год.'],
  ['Überdacht. Durchdacht. Zuverlässig.','Covered. Considered. Reliable.','Надёжно. Продуманно. Качественно.'],
  ['Kostenlos beraten lassen','Free consultation','Бесплатная консультация'],
  ['Alle Leistungen →','All services →','Все услуги →'],

  // ── USP STREIFEN ────────────────────────────────────────────
  ['Direkter Herstellerpartner','Direct manufacturer partner','Прямой партнёр производителя'],
  ['Aluminium-Systeme ab Werk – kein Zwischenhändler','Aluminium systems direct from factory','Алюминиевые системы прямо с завода'],
  ['Maßanfertigung nach Wunsch','Custom-made to order','Изготовление на заказ'],
  ['Jede Größe, Farbe und Verglasung möglich','Any size, colour and glazing possible','Любой размер, цвет и остекление'],
  ['Montage aus einer Hand','Installation from one source','Монтаж из одних рук'],
  ['Von der Beratung bis zur Fertigstellung','From consultation to completion','От консультации до завершения'],
  ['Regional vor Ort','Regional on-site','Региональный выезд'],
  ['Westerwald, Montabaur, Neuwied, Limburg & mehr','Westerwald, Montabaur, Neuwied, Limburg & more','Вестервальд, Монтабаур, Нойвид и др.'],
  ['Garantie direkt vom Hersteller','Warranty direct from manufacturer','Гарантия от производителя'],
  ['Kurze Lieferzeiten','Short delivery times','Короткие сроки доставки'],
  ['direkt ab Hersteller','direct from manufacturer','напрямую от производителя'],
  ['Kostenlose Beratung','Free consultation','Бесплатная консультация'],
  ['unverbindlich & vor Ort','non-binding & on-site','без обязательств, на месте'],
  ['Privat & Gewerbe','Private & Commercial','Частным и бизнесу'],
  ['für jeden Bedarf','for every need','для любых нужд'],
  ['CE & Statik','CE & Statics','CE & Статика'],
  ['Wind- & Schneelasten-Nachweis','wind & snow load certificate','расчёт ветровых и снеговых нагрузок'],

  // ── LEISTUNGEN ──────────────────────────────────────────────
  ['Unsere Leistungen','Our Services','Наши услуги'],
  ['Alles für draußen – aus einer Hand','Everything for outdoors – from one source','Всё для улицы – из одних рук'],
  ['Mehr erfahren →','Learn more →','Подробнее →'],
  ['Terrassenüberdachung','Patio cover','Навес для террасы'],
  ['Genießen Sie Ihre Terrasse ganzjährig – bei jedem Wetter. Unsere Aluminium-Terrassendächer kommen direkt vom Hersteller, sind in Glas, Polycarbonat, Lamellen oder Flachdach erhältlich und werden exakt nach Ihren Maßen gefertigt.','Enjoy your terrace all year round – in any weather. Our aluminium patio covers come directly from the manufacturer, are available in glass, polycarbonate, louvres or flat roof and are made to your exact measurements.','Наслаждайтесь своей террасой круглый год – в любую погоду. Наши алюминиевые навесы поставляются прямо от производителя, доступны в стекле, поликарбонате, жалюзи или плоской крыше и изготавливаются по вашим точным размерам.'],
  ['Carport','Carport','Карпорт'],
  ['Stilvoller Schutz für Ihr Fahrzeug – ohne den Aufwand einer Garage. Unsere Aluminium-Carports sind robust, langlebig und individuell mit Glas- oder Polycarbonateinsätzen gestaltbar.','Stylish protection for your vehicle – without the hassle of a garage. Our aluminium carports are robust, durable and individually customisable with glass or polycarbonate inserts.','Стильная защита для вашего автомобиля – без хлопот гаража. Наши алюминиевые карпорты прочны, долговечны и индивидуально настраиваемы.'],
  ['Pergola & Lamellendach','Pergola & Louvre roof','Pergola & Lamellendach'],
  ['Regulierbare Lamellen per Fernbedienung – Sie bestimmen, wie viel Sonne und Luft Sie möchten. Ideal für Terrassen, Gärten und gastronomische Außenbereiche.','Adjustable louvres by remote control – you decide how much sun and air you want. Ideal for terraces, gardens and outdoor hospitality areas.','Регулируемые жалюзи с пульта дистанционного управления – вы решаете, сколько солнца и воздуха вам нужно.'],
  ['Kaltwintergarten','Cold conservatory','Холодная веранда'],
  ['Verlängern Sie die Saison mit einem wettergeschützten Raum ohne Heizung, mit Heizstrahler für kühle Abende oder im Sommer mit Klimaanlage für maximalen Komfort.','Extend the season with a weather-protected room without heating, with a heater for cool evenings or in summer with air conditioning for maximum comfort.','Продлите сезон в защищённом от непогоды пространстве без отопления, с обогревателем для прохладных вечеров или с кондиционером летом.'],
  ['Sonnenschutz & Markisen','Sun protection & Awnings','Солнцезащита и маркизы'],
  ['Geländer & Zubehör','Railings & Accessories','Ограждения и аксессуары'],

  // ── GALERIE ─────────────────────────────────────────────────
  ['Unsere Referenzen','Our References','Наши проекты'],
  ['Projekte, die für sich sprechen','Projects that speak for themselves','Проекты, говорящие сами за себя'],
  ['Terrassenüberdachung Aluminium · Westerwaldkreis','Aluminium patio cover · Westerwald','Алюминиевый навес для террасы · Вестервальд'],
  ['Detailansicht · Aluminium-Profile & Verglasung','Detail view · Aluminium profiles & glazing','Детальный вид · Алюминиевые профили и остекление'],
  ['Gesamtansicht · Terrassenüberdachung','Overview · Patio cover','Общий вид · Навес для террасы'],
  ['Hier könnte Ihr Projekt stehen!','Your project could be here!','Здесь мог бы быть ваш проект!'],
  ['Werden Sie unser nächstes Referenzprojekt','Become our next reference project','Станьте нашим следующим референс-проектом'],
  ['Wir sind fleißig am Bauen','We are busy building','Мы активно строим'],
  ['Mehr Referenzen folgen bald','More references coming soon','Больше проектов скоро'],
  ['Ihr Traumplatz entsteht gerade','Your dream space is being created','Ваше идеальное место создаётся прямо сейчас'],
  ['Weitere Referenzfotos folgen nach unseren nächsten Projekten.','More reference photos will follow after our next projects.','Больше фото появятся после следующих проектов.'],
  ['Schönes Wetter, schöne Projekte','Nice weather, nice projects','Хорошая погода, красивые проекты'],
  ['Dieses Bild ist noch auf dem Weg zu uns','This photo is still on its way to us','Это фото ещё в пути'],

  // ── WARUM WIR ───────────────────────────────────────────────
  ['Warum BV AussenSysteme','Why BV AussenSysteme','Почему BV AussenSysteme'],
  ['Ihr Partner vom ersten Gespräch bis zur Montage','Your partner from the first conversation to installation','Ваш партнёр от первого разговора до монтажа'],
  ['Direkter Herstellerpartner','Direct manufacturer partner','Прямой партнёр производителя'],
  ['Wir arbeiten direkt mit einem führenden Aluminium-Hersteller zusammen. Bessere Qualität, schnellere Lieferung, faire Preise – ohne Umweg über den Handel.','We work directly with a leading aluminium manufacturer. Better quality, faster delivery, fair prices – without going through trade.','Мы работаем напрямую с ведущим производителем алюминия. Лучше качество, быстрее доставка, честные цены – без посредников.'],
  ['Individuelle Maßanfertigung','Individual custom manufacturing','Индивидуальное изготовление на заказ'],
  ['Jede Terrasse ist anders. Deshalb fertigen wir jede Überdachung, jeden Carport und jede Pergola exakt nach Ihren Maßen – keine Standardlösung von der Stange.','Every terrace is different. That\'s why we manufacture every cover, carport and pergola exactly to your measurements – no off-the-shelf solution.','Каждая терраса уникальна. Поэтому мы изготавливаем каждый навес, карпорт и перголу точно по вашим размерам.'],
  ['Alles aus einer Hand','Everything from one source','Всё из одних рук'],
  ['Beratung, Planung, Maßaufnahme, Montage und Nachservice – ein Ansprechpartner von Anfang bis Ende. Kein Koordinationsaufwand für Sie.','Consultation, planning, measurement, installation and after-service – one contact from start to finish. No coordination effort for you.','Консультация, планирование, замер, монтаж и послепродажный сервис – один контакт от начала до конца.'],
  ['Hilfe bei der Baugenehmigung','Help with building permits','Помощь с разрешением на строительство'],
  ['In Rheinland-Pfalz ist für Terrassenüberdachungen oft eine Genehmigung nötig. Wir kennen die lokalen Vorschriften und unterstützen Sie aktiv dabei.','In Rhineland-Palatinate, a permit is often required for patio covers. We know the local regulations and actively support you.','В Рейнланд-Пфальце для навесов часто требуется разрешение. Мы знаем местные нормы и активно помогаем вам.'],
  ['10 Jahre Garantie auf Alu · 5 Jahre auf Elektro','10 years warranty on alu · 5 years on electrics','10 лет гарантии на алюминий · 5 лет на электрику'],
  ['CE-Kennzeichnung & Statiknachweis inklusive','CE marking & static certificate included','Маркировка CE и статический расчёт включены'],
  ['Alle Produkte sind CE-gekennzeichnet und erfüllen die europäischen Sicherheitsnormen. Statikberechnungen mit Nachweis für Wind- und Schneelasten (Lastenklassen) werden direkt vom Hersteller bereitgestellt – kein Extraaufwand für Sie.','All products are CE-marked and meet European safety standards. Static calculations with proof for wind and snow loads are provided directly by the manufacturer – no extra effort for you.','Все изделия имеют маркировку CE и соответствуют европейским стандартам безопасности. Статические расчёты предоставляются производителем.'],

  // ── PROZESS ─────────────────────────────────────────────────
  ['Von der Idee zu Ihrem fertigen Außenbereich','From idea to your finished outdoor area','От идеи до готового уличного пространства'],
  ['Kostenlose Beratung','Free consultation','Бесплатная консультация'],
  ['Anruf oder Nachricht – wir vereinbaren einen unverbindlichen Termin direkt bei Ihnen vor Ort.','Call or message – we arrange a non-binding appointment directly at your place.','Звонок или сообщение – мы назначаем бесплатную встречу у вас на месте.'],
  ['Maßaufnahme & Angebot','Measurement & Quote','Замер и предложение'],
  ['Wir nehmen exakte Maße, besprechen Ihre Wünsche und erstellen ein transparentes Angebot.','We take exact measurements, discuss your wishes and create a transparent quote.','Мы делаем точные замеры, обсуждаем ваши пожелания и составляем прозрачное предложение.'],
  ['Fertigung & Lieferung','Manufacturing & Delivery','Изготовление и доставка'],
  ['Ihr Produkt wird maßgenau vom Hersteller produziert und direkt zu Ihnen geliefert.','Your product is manufactured to exact measurements by the manufacturer and delivered directly to you.','Ваш продукт изготавливается точно по размерам производителем и доставляется прямо к вам.'],
  ['Professionelle Montage','Professional installation','Профессиональный монтаж'],
  ['Unser Team montiert sauber, pünktlich und mit jahrelanger Erfahrung – inklusive Aufräumen nach der Arbeit.','Our team installs cleanly, punctually and with years of experience – including tidying up after the work.','Наша команда монтирует чисто, пунктуально и с многолетним опытом – включая уборку после работы.'],

  // ── BEWERTUNGEN ─────────────────────────────────────────────
  ['Das sagen unsere Kunden','What our customers say','Отзывы наших клиентов'],
  ['Echte Bewertungen – von echten Kunden','Real reviews – from real customers','Настоящие отзывы – от настоящих клиентов'],
  ['Bewertungen auf Google','Reviews on Google','Отзывы в Google'],
  ['Alle Bewertungen geprüft','All reviews verified','Все отзывы проверены'],
  ['Google Bewertungen Widget','Google Reviews Widget','Виджет отзывов Google'],
  ['Hier wird dein Google Reviews Widget eingebettet.','Your Google Reviews Widget will be embedded here.','Здесь будет встроен виджет отзывов Google.'],
  ['Ersetze diesen Block mit dem Code von Trustindex oder Elfsight.','Replace this block with the code from Trustindex or Elfsight.','Замените этот блок кодом от Trustindex или Elfsight.'],
  ['→ Widget bei Trustindex erstellen','→ Create widget at Trustindex','→ Создать виджет на Trustindex'],
  ['⭐ Eigene Bewertung auf Google hinterlassen','⭐ Leave your own review on Google','⭐ Оставить отзыв в Google'],
  ['Google Bewertungen','Google Reviews','Отзывы Google'],
  ['Trustindex','Trustindex','Trustindex'],

  // ── FAQ ─────────────────────────────────────────────────────
  ['Häufige Fragen','Frequently Asked Questions','Часто задаваемые вопросы'],
  ['Alles Wichtige auf einen Blick','Everything you need to know','Всё важное на одной странице'],
  ['Brauche ich eine Baugenehmigung für eine Terrassenüberdachung?','Do I need a building permit for a patio cover?','Нужно ли разрешение на строительство навеса?'],
  ['Wie lange dauert es von der Anfrage bis zur fertigen Montage?','How long does it take from the enquiry to completed installation?','Сколько времени от заявки до готового монтажа?'],
  ['Welche Materialien und Farben sind erhältlich?','What materials and colours are available?','Какие материалы и цвета доступны?'],
  ['Was kostet eine Terrassenüberdachung oder ein Carport ungefähr?','How much does a patio cover or carport cost approximately?','Сколько примерно стоит навес или карпорт?'],
  ['Kommen Sie auch außerhalb des Westerwaldkreises?','Do you also come outside the Westerwald district?','Вы работаете за пределами района Вестервальд?'],
  ['Übernehmen Sie auch Reparaturen oder Wartungen bestehender Anlagen?','Do you also carry out repairs or maintenance of existing installations?','Вы также проводите ремонт и обслуживание существующих конструкций?'],
  ['Warum Aluminium – und nicht Holz oder Stahl?','Why aluminium – and not wood or steel?','Почему алюминий, а не дерево или сталь?'],
  ['Glas oder Polycarbonat – was ist besser für mein Terrassendach?','Glass or polycarbonate – which is better for my patio roof?','Стекло или поликарбонат – что лучше для моей террасы?'],
  ['Muss die Terrassenüberdachung bei meiner Versicherung gemeldet werden?','Does the patio cover need to be reported to my insurance?','Нужно ли уведомлять страховую компанию о навесе?'],
  ['Welche Abstandsregeln gelten zur Grundstücksgrenze?','What distance rules apply to the property boundary?','Какие правила отступа от границы участка действуют?'],
  ['Kann eine Terrassenüberdachung auch freistehend montiert werden?','Can a patio cover also be installed as a freestanding structure?','Можно ли установить навес как отдельностоящую конструкцию?'],
  ['Wie pflege und reinige ich meine Aluminium-Überdachung?','How do I care for and clean my aluminium cover?','Как ухаживать и чистить алюминиевый навес?'],
  ['Kann ich die Terrassenüberdachung später noch erweitern oder umbauen?','Can I extend or modify the patio cover later?','Можно ли позже расширить или переделать навес?'],
  ['Bieten Sie auch Lösungen für Gewerbebetriebe oder Gastronomie an?','Do you also offer solutions for businesses or hospitality?','Есть ли у вас решения для коммерческих объектов и ресторанов?'],
  ['Sind die Produkte CE-zertifiziert und gibt es Statikberechnungen?','Are the products CE-certified and are static calculations available?','Есть ли CE-сертификация и статические расчёты?'],
  ['Wie schnell kann ich nach der Anfrage mit einem Angebot rechnen?','How quickly can I expect a quote after enquiring?','Как быстро я получу предложение после запроса?'],

  // ── KONTAKT ─────────────────────────────────────────────────
  ['Kostenlose Beratung – wir kommen zu Ihnen','Free consultation – we come to you','Бесплатная консультация – приедем к вам'],
  ['Jetzt anfragen – kostenlos & unverbindlich','Get a quote – free & non-binding','Запросить – бесплатно и без обязательств'],
  ['Vorname','First name','Имя'],
  ['Nachname','Last name','Фамилия'],
  ['E-Mail-Adresse','Email address','Электронная почта'],
  ['Telefon / WhatsApp','Phone / WhatsApp','Телефон / WhatsApp'],
  ['Ich interessiere mich für','I am interested in','Меня интересует'],
  ['Bitte wählen …','Please select …','Пожалуйста, выберите …'],
  ['Nachricht','Message','Сообщение'],
  ['Kostenlose Beratung anfordern →','Request free consultation →','Запросить бесплатную консультацию →'],
  ['* Pflichtfelder. Ihre Daten werden vertraulich behandelt und nicht weitergegeben.','* Required fields. Your data will be treated confidentially.','* Обязательные поля. Ваши данные обрабатываются конфиденциально.'],
  ['Telefon / WhatsApp','Phone / WhatsApp','Телефон / WhatsApp'],
  ['E-Mail','Email','Электронная почта'],
  ['Einzugsgebiet','Service area','Зона обслуживания'],
  ['WhatsApp direkt','WhatsApp direct','WhatsApp напрямую'],
  ['Nachricht senden →','Send message →','Отправить сообщение →'],
  ['Hinweis: Anrufe werden live durch KI transkribiert (keine Aufzeichnung).','Note: Calls are transcribed live by AI (no recording).','Примечание: звонки транскрибируются в реальном времени ИИ (без записи).'],
  ['Mehr erfahren','Learn more','Подробнее'],

  // ── KONFIGURATOR TEASER ─────────────────────────────────────
  ['Demnächst verfügbar','Coming soon','Скоро будет доступно'],
  ['Ihr Terrassendach – in 3D konfigurieren','Configure your patio cover in 3D','Настройте ваш навес в 3D'],
  ['Planen Sie Ihre Traumterrasse direkt online: Maße eingeben, Material wählen, Farbe bestimmen – und sofort in 3D sehen wie es aussieht. Mit integrierter Preiskalkulation und direkter Anfragefunktion.','Plan your dream terrace directly online: enter dimensions, choose material, determine colour – and immediately see it in 3D. With integrated price calculation and direct enquiry function.','Планируйте свою террасу прямо онлайн: введите размеры, выберите материал, определите цвет – и сразу увидите в 3D.'],
  ['Eigene Maße','Custom dimensions','Собственные размеры'],
  ['Breite, Tiefe & Höhe frei wählbar','Width, depth & height freely selectable','Ширина, глубина и высота на выбор'],
  ['Farben & Material','Colours & Material','Цвета и материал'],
  ['Alle RAL-Farben, Glas oder Lamellen','All RAL colours, glass or louvres','Все цвета RAL, стекло или жалюзи'],
  ['3D Vorschau','3D preview','3D просмотр'],
  ['Realistische Echtzeit-Darstellung','Realistic real-time display','Реалистичное отображение в реальном времени'],
  ['🛠 Zum Konfigurator →','🛠 To the configurator →','🛠 К конфигуратору →'],
  ['Noch nicht verfügbar – tragen Sie sich ein und wir informieren Sie beim Launch.','Not yet available – register and we will inform you at launch.','Ещё недоступно – зарегистрируйтесь, и мы уведомим вас при запуске.'],

  // ── EINZUGSGEBIET SEKTION ───────────────────────────────────
  ['Wir kommen zu Ihnen – im Westerwald & darüber hinaus','We come to you – in the Westerwald & beyond','Мы приедем к вам – в Вестервальде и за его пределами'],
  ['Wir betreuen Kunden im gesamten Raum Westerwald','We serve customers throughout the Westerwald area','Мы обслуживаем клиентов по всему региону Вестервальд'],

  // ── FOOTER ──────────────────────────────────────────────────
  ['Alle Rechte vorbehalten','All rights reserved','Все права защищены'],
  ['Impressum','Legal notice','Об организации'],
  ['Datenschutz','Privacy policy','Конфиденциальность'],
  ['Cookie-Einstellungen','Cookie settings','Настройки cookies'],
  ['Pflegehinweise','Care instructions','Инструкции по уходу'],
  ['📍 Einzugsgebiet','📍 Service area','📍 Зона обслуживания'],
  ['Leistungen','Services','Услуги'],
  ['Unternehmen','Company','Компания'],
  ['Regionen','Regions','Регионы'],
];

// ── ENGINE ───────────────────────────────────────────────────
function setLanguage(lang) {
  if (!['de','en','ru'].includes(lang)) return;
  currentLang = lang;
  localStorage.setItem('bv_lang', lang);
  var idx = lang === 'de' ? 0 : lang === 'en' ? 1 : 2;

  // Walk all text nodes in body and replace
  function walkNodes(node) {
    if (node.nodeType === 3) { // TEXT_NODE
      var orig = node.textContent;
      var newText = orig;
      translations.forEach(function(row) {
        // Always search using German as base
        // We store original DE text alongside current
        if (newText.includes(row[0])) {
          newText = newText.replace(row[0], row[idx]);
        }
      });
      if (newText !== orig) node.textContent = newText;
    } else if (node.nodeType === 1 && 
               !['SCRIPT','STYLE','NOSCRIPT','TEXTAREA'].includes(node.tagName)) {
      // Also handle placeholders
      if (node.tagName === 'INPUT' || node.tagName === 'TEXTAREA') {
        var ph = node.placeholder;
        translations.forEach(function(row) {
          if (ph && ph.includes(row[0])) ph = ph.replace(row[0], row[idx]);
        });
        node.placeholder = ph;
      }
      node.childNodes.forEach(walkNodes);
    }
  }

  // Save DE snapshot on first load
  if (!window._deSnapshot) {
    window._deSnapshot = document.body.innerHTML;
  }

  // Reset to DE first, then apply target language
  if (lang !== 'de') {
    document.body.innerHTML = window._deSnapshot;
    // Re-attach event listeners (hamburger etc.) after innerHTML reset
    initEventListeners();
  }

  if (lang !== 'de') {
    walkNodes(document.body);
  }

  // Update active button
  document.querySelectorAll('.lang-btn[data-lang]').forEach(function(btn) {
    btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
  });

  document.documentElement.lang = lang;
}

function initEventListeners() {
  // Re-attach hamburger menu
  var hamburger = document.getElementById('hamburgerBtn');
  var mobileMenu = document.getElementById('mobileMenu');
  var mobileClose = document.getElementById('mobileClose');
  if (hamburger) hamburger.onclick = function() { mobileMenu && mobileMenu.classList.add('open'); };
  if (mobileClose) mobileClose.onclick = function() { mobileMenu && mobileMenu.classList.remove('open'); };

  // Re-attach FAQ accordion
  document.querySelectorAll('.faq-q').forEach(function(btn) {
    btn.onclick = function() {
      var expanded = this.getAttribute('aria-expanded') === 'true';
      document.querySelectorAll('.faq-q').forEach(function(b) {
        b.setAttribute('aria-expanded','false');
        var a = b.nextElementSibling;
        if (a) a.style.maxHeight = '0';
      });
      if (!expanded) {
        this.setAttribute('aria-expanded','true');
        var ans = this.nextElementSibling;
        if (ans) ans.style.maxHeight = ans.scrollHeight + 'px';
      }
    };
  });
}

// Apply on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    window._deSnapshot = document.body.innerHTML;
    setLanguage(currentLang);
  });
} else {
  window._deSnapshot = document.body.innerHTML;
  setLanguage(currentLang);
}

// ── DROPDOWN LOGIC ───────────────────────────────────────────
var flags = { de: '🇩🇪', en: '🇬🇧', ru: '🇷🇺' };
var codes = { de: 'DE', en: 'EN', ru: 'RU' };

function updateDropdownLabel(lang) {
  var f = document.getElementById('langFlag');
  var c = document.getElementById('langCode');
  if (f) f.textContent = flags[lang] || '🇩🇪';
  if (c) c.textContent = codes[lang] || 'DE';
  document.querySelectorAll('.lang-dropdown-menu button').forEach(function(btn) {
    btn.classList.toggle('active', btn.textContent.includes(codes[lang]));
  });
  document.querySelectorAll('.mobile-lang-switcher button').forEach(function(btn) {
    btn.classList.toggle('active',
      (lang === 'de' && btn.textContent.includes('Deutsch')) ||
      (lang === 'en' && btn.textContent.includes('English')) ||
      (lang === 'ru' && btn.textContent.includes('Русский'))
    );
  });
}

function toggleLangMenu(e) {
  e.stopPropagation();
  var dd = document.querySelector('.lang-dropdown');
  if (dd) dd.classList.toggle('open');
}

function chooseLang(lang) {
  var dd = document.querySelector('.lang-dropdown');
  if (dd) dd.classList.remove('open');
  setLanguage(lang);
  updateDropdownLabel(lang);
}

// Close dropdown on outside click
document.addEventListener('click', function() {
  var dd = document.querySelector('.lang-dropdown');
  if (dd) dd.classList.remove('open');
});

// Init dropdown label on load
document.addEventListener('DOMContentLoaded', function() {
  updateDropdownLabel(currentLang);
});
