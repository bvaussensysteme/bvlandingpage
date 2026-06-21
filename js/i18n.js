/* ============================================================
   BV AussenSysteme – Übersetzung DE / EN / RU
   Methode: TreeWalker über Textknoten – kein innerHTML-Reset
   Event-Listener bleiben erhalten!
   ============================================================ */

var currentLang = localStorage.getItem('bv_lang') || 'de';

/* Jedes Array: [ de, en, ru ]
   Nur exakte Treffer werden ersetzt (trimmed comparison)       */
var T = [
  // NAV
  ['Leistungen','Services','Услуги'],
  ['Galerie','Gallery','Галерея'],
  ['Über uns','About us','О нас'],
  ['Ablauf','Process','Процесс'],
  ['FAQ','FAQ','FAQ'],
  ['Jetzt anfragen','Get a quote','Запросить'],
  ['🛠 Konfigurator','🛠 Configurator','🛠 Конфигуратор'],

  // HERO
  ['Ihr Spezialist im Westerwald','Your specialist in the Westerwald','Ваш специалист в регионе Вестервальд'],
  ['Ihr Traumplatz draußen – das ganze Jahr.','Your dream outdoor space – all year round.','Ваше идеальное место на улице – круглый год.'],
  ['Überdacht. Durchdacht. Zuverlässig.','Covered. Considered. Reliable.','Надёжно. Продуманно. Качественно.'],
  ['Kostenlos beraten lassen','Free consultation','Бесплатная консультация'],
  ['Alle Leistungen →','All services →','Все услуги →'],

  // USP
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
  ['Wind- & Schneelasten-Nachweis','wind & snow load certificate','расчёт нагрузок'],

  // LEISTUNGEN SECTION
  ['Unsere Leistungen','Our Services','Наши услуги'],
  ['Alles für draußen – aus einer Hand','Everything for outdoors – from one source','Всё для улицы – из одних рук'],
  ['Mehr erfahren →','Learn more →','Подробнее →'],
  ['Terrassenüberdachung','Patio cover','Навес для террасы'],
  ['Carport','Carport','Карпорт'],
  ['Pergola & Lamellendach','Pergola & Louvre roof','Pergola & Lamellendach'],
  ['Kaltwintergarten','Cold conservatory','Холодная веранда'],
  ['Sonnenschutz & Markisen','Sun protection & Awnings','Солнцезащита и маркизы'],
  ['Geländer & Zubehör','Railings & Accessories','Ограждения и аксессуары'],
  ['Genießen Sie Ihre Terrasse ganzjährig – bei jedem Wetter. Unsere Aluminium-Terrassendächer kommen direkt vom Hersteller, sind in Glas, Polycarbonat, Lamellen oder Flachdach erhältlich und werden exakt nach Ihren Maßen gefertigt.','Enjoy your terrace all year round in any weather. Our aluminium patio covers come directly from the manufacturer, are available in glass, polycarbonate, louvres or flat roof and are made to your exact measurements.','Наслаждайтесь своей террасой круглый год в любую погоду. Наши алюминиевые навесы поставляются прямо от производителя.'],
  ['Stilvoller Schutz für Ihr Fahrzeug – ohne den Aufwand einer Garage. Unsere Aluminium-Carports sind robust, langlebig und individuell mit Glas- oder Polycarbonateinsätzen gestaltbar.','Stylish protection for your vehicle without the hassle of a garage. Our aluminium carports are robust, durable and individually customisable.','Стильная защита для вашего автомобиля без хлопот гаража.'],
  ['Regulierbare Lamellen per Fernbedienung – Sie bestimmen, wie viel Sonne und Luft Sie möchten. Ideal für Terrassen, Gärten und gastronomische Außenbereiche.','Adjustable louvres by remote control – you decide how much sun and air you want. Ideal for terraces, gardens and outdoor hospitality areas.','Регулируемые жалюзи с пульта дистанционного управления.'],
  ['Verlängern Sie die Saison mit einem wettergeschützten Raum ohne Heizung, mit Heizstrahler für kühle Abende oder im Sommer mit Klimaanlage für maximalen Komfort.','Extend the season with a weather-protected room – without heating, with a heater for cool evenings or air conditioning in summer.','Продлите сезон в защищённом от непогоды пространстве.'],
  ['Hochwertige Aluminium-Markisen und Beschattungssysteme für Terrasse und Garten – elektrisch steuerbar, wetterfest, in vielen Stoffen und Farben erhältlich.','High-quality aluminium awnings and shading systems for terrace and garden – electrically controlled, weatherproof, available in many fabrics and colours.','Высококачественные алюминиевые маркизы и системы затенения.'],
  ['Langlebige Aluminium-Geländer für Terrassen, Balkone und Treppen – pflegeleicht, stabil und in verschiedenen Designs erhältlich.','Durable aluminium railings for terraces, balconies and stairs – easy to maintain, stable and available in various designs.','Долговечные алюминиевые ограждения для террас, балконов и лестниц.'],

  // GALERIE
  ['Unsere Referenzen','Our References','Наши проекты'],
  ['Projekte, die für sich sprechen','Projects that speak for themselves','Проекты, говорящие сами за себя'],
  ['Terrassenüberdachung Aluminium · Westerwaldkreis','Aluminium patio cover · Westerwald','Алюминиевый навес · Вестервальд'],
  ['Detailansicht · Aluminium-Profile & Verglasung','Detail view · Aluminium profiles & glazing','Детальный вид · профили и остекление'],
  ['Gesamtansicht · Terrassenüberdachung','Overview · Patio cover','Общий вид · Навес для террасы'],
  ['Hier könnte Ihr Projekt stehen!','Your project could be here!','Здесь мог бы быть ваш проект!'],
  ['Werden Sie unser nächstes Referenzprojekt','Become our next reference project','Станьте нашим следующим проектом'],
  ['Wir sind fleißig am Bauen','We are busy building','Мы активно строим'],
  ['Mehr Referenzen folgen bald','More references coming soon','Больше проектов скоро'],
  ['Ihr Traumplatz entsteht gerade','Your dream space is being created','Ваше идеальное место создаётся'],
  ['Schönes Wetter, schöne Projekte','Nice weather, nice projects','Хорошая погода, красивые проекты'],
  ['Dieses Bild ist noch auf dem Weg zu uns','This photo is still on its way to us','Это фото ещё в пути'],

  // WARUM WIR
  ['Warum BV AussenSysteme','Why BV AussenSysteme','Почему BV AussenSysteme'],
  ['Ihr Partner vom ersten Gespräch bis zur Montage','Your partner from first call to installation','Ваш партнёр от первого звонка до монтажа'],
  ['Wir arbeiten direkt mit einem führenden Aluminium-Hersteller zusammen. Bessere Qualität, schnellere Lieferung, faire Preise – ohne Umweg über den Handel.','We work directly with a leading aluminium manufacturer. Better quality, faster delivery, fair prices – without going through trade.','Мы работаем напрямую с ведущим производителем алюминия.'],
  ['Individuelle Maßanfertigung','Individual custom manufacturing','Индивидуальное изготовление на заказ'],
  ['Jede Terrasse ist anders. Deshalb fertigen wir jede Überdachung, jeden Carport und jede Pergola exakt nach Ihren Maßen – keine Standardlösung von der Stange.','Every terrace is different. That\'s why we manufacture every cover, carport and pergola to your exact measurements.','Каждая терраса уникальна. Поэтому мы изготавливаем всё по вашим точным размерам.'],
  ['Alles aus einer Hand','Everything from one source','Всё из одних рук'],
  ['Beratung, Planung, Maßaufnahme, Montage und Nachservice – ein Ansprechpartner von Anfang bis Ende. Kein Koordinationsaufwand für Sie.','Consultation, planning, measurement, installation and after-service – one contact from start to finish.','Консультация, планирование, замер, монтаж и послепродажный сервис – один контакт.'],
  ['Hilfe bei der Baugenehmigung','Help with building permits','Помощь с разрешением на строительство'],
  ['In Rheinland-Pfalz ist für Terrassenüberdachungen oft eine Genehmigung nötig. Wir kennen die lokalen Vorschriften und unterstützen Sie aktiv dabei.','In Rhineland-Palatinate, a permit is often required. We know the local regulations and actively support you.','В Рейнланд-Пфальце часто требуется разрешение. Мы знаем нормы и помогаем.'],
  ['10 Jahre Garantie auf Alu · 5 Jahre auf Elektro','10 years warranty on alu · 5 years on electrics','10 лет гарантии на алюминий · 5 лет на электрику'],
  ['CE-Kennzeichnung & Statiknachweis inklusive','CE marking & static certificate included','Маркировка CE и статический расчёт включены'],
  ['Alle Produkte sind CE-gekennzeichnet und erfüllen die europäischen Sicherheitsnormen. Statikberechnungen mit Nachweis für Wind- und Schneelasten werden direkt vom Hersteller bereitgestellt – kein Extraaufwand für Sie.','All products are CE-marked and meet European safety standards. Static calculations are provided directly by the manufacturer.','Все изделия имеют маркировку CE. Статические расчёты предоставляются производителем.'],

  // PROZESS
  ['Von der Idee zu Ihrem fertigen Außenbereich','From idea to your finished outdoor area','От идеи до готового уличного пространства'],
  ['Anruf oder Nachricht – wir vereinbaren einen unverbindlichen Termin direkt bei Ihnen vor Ort.','Call or message – we arrange a non-binding appointment at your place.','Звонок или сообщение – назначаем бесплатную встречу у вас.'],
  ['Maßaufnahme & Angebot','Measurement & Quote','Замер и предложение'],
  ['Wir nehmen exakte Maße, besprechen Ihre Wünsche und erstellen ein transparentes Angebot.','We take exact measurements, discuss your wishes and create a transparent quote.','Точные замеры, обсуждение пожеланий и прозрачное предложение.'],
  ['Fertigung & Lieferung','Manufacturing & Delivery','Изготовление и доставка'],
  ['Ihr Produkt wird maßgenau vom Hersteller produziert und direkt zu Ihnen geliefert.','Your product is manufactured to exact measurements and delivered directly to you.','Ваш продукт изготавливается по точным размерам и доставляется прямо к вам.'],
  ['Professionelle Montage','Professional installation','Профессиональный монтаж'],
  ['Unser Team montiert sauber, pünktlich und mit jahrelanger Erfahrung – inklusive Aufräumen nach der Arbeit.','Our team installs cleanly, punctually and with years of experience – including tidying up after.','Наша команда монтирует чисто, пунктуально и с многолетним опытом.'],

  // BEWERTUNGEN
  ['Das sagen unsere Kunden','What our customers say','Отзывы наших клиентов'],
  ['Echte Bewertungen – von echten Kunden','Real reviews – from real customers','Настоящие отзывы – от настоящих клиентов'],
  ['Bewertungen auf Google','Reviews on Google','Отзывы в Google'],
  ['Alle Bewertungen geprüft','All reviews verified','Все отзывы проверены'],
  ['Google Bewertungen Widget','Google Reviews Widget','Виджет отзывов Google'],
  ['Hier wird dein Google Reviews Widget eingebettet.','Your Google Reviews Widget will be embedded here.','Здесь будет встроен виджет отзывов Google.'],
  ['Ersetze diesen Block mit dem Code von Trustindex oder Elfsight.','Replace this block with code from Trustindex or Elfsight.','Замените этот блок кодом от Trustindex или Elfsight.'],
  ['→ Widget bei Trustindex erstellen','→ Create widget at Trustindex','→ Создать виджет на Trustindex'],
  ['⭐ Eigene Bewertung auf Google hinterlassen','⭐ Leave your own review on Google','⭐ Оставить отзыв в Google'],
  ['Google Bewertungen','Google Reviews','Отзывы Google'],

  // FAQ
  ['Häufige Fragen','Frequently Asked Questions','Часто задаваемые вопросы'],
  ['Alles Wichtige auf einen Blick','Everything you need to know','Всё важное на одной странице'],
  ['Brauche ich eine Baugenehmigung für eine Terrassenüberdachung?','Do I need a building permit for a patio cover?','Нужно ли разрешение на строительство навеса?'],
  ['Wie lange dauert es von der Anfrage bis zur fertigen Montage?','How long from enquiry to completed installation?','Сколько времени от заявки до готового монтажа?'],
  ['Welche Materialien und Farben sind erhältlich?','What materials and colours are available?','Какие материалы и цвета доступны?'],
  ['Was kostet eine Terrassenüberdachung oder ein Carport ungefähr?','How much does a patio cover or carport cost approximately?','Сколько примерно стоит навес или карпорт?'],
  ['Kommen Sie auch außerhalb des Westerwaldkreises?','Do you also come outside the Westerwald district?','Вы работаете за пределами района Вестервальд?'],
  ['Übernehmen Sie auch Reparaturen oder Wartungen bestehender Anlagen?','Do you also carry out repairs or maintenance?','Вы проводите ремонт и обслуживание существующих конструкций?'],
  ['Warum Aluminium – und nicht Holz oder Stahl?','Why aluminium – and not wood or steel?','Почему алюминий, а не дерево или сталь?'],
  ['Glas oder Polycarbonat – was ist besser für mein Terrassendach?','Glass or polycarbonate – which is better for my patio roof?','Стекло или поликарбонат – что лучше?'],
  ['Muss die Terrassenüberdachung bei meiner Versicherung gemeldet werden?','Does the patio cover need to be reported to my insurance?','Нужно ли уведомлять страховую компанию?'],
  ['Welche Abstandsregeln gelten zur Grundstücksgrenze?','What distance rules apply to the property boundary?','Какие правила отступа от границы участка?'],
  ['Kann eine Terrassenüberdachung auch freistehend montiert werden?','Can a patio cover be installed as a freestanding structure?','Можно ли установить навес как отдельностоящую конструкцию?'],
  ['Wie pflege und reinige ich meine Aluminium-Überdachung?','How do I care for and clean my aluminium cover?','Как ухаживать и чистить алюминиевый навес?'],
  ['Kann ich die Terrassenüberdachung später noch erweitern oder umbauen?','Can I extend or modify the patio cover later?','Можно ли позже расширить или переделать навес?'],
  ['Bieten Sie auch Lösungen für Gewerbebetriebe oder Gastronomie an?','Do you also offer solutions for businesses or hospitality?','Есть ли у вас решения для коммерческих объектов?'],
  ['Sind die Produkte CE-zertifiziert und gibt es Statikberechnungen?','Are the products CE-certified and are static calculations available?','Есть ли CE-сертификация и статические расчёты?'],
  ['Wie schnell kann ich nach der Anfrage mit einem Angebot rechnen?','How quickly can I expect a quote after enquiring?','Как быстро я получу предложение после запроса?'],

  // KONTAKT
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
  ['E-Mail','Email','Электронная почта'],
  ['Einzugsgebiet','Service area','Зона обслуживания'],
  ['WhatsApp direkt','WhatsApp direct','WhatsApp напрямую'],
  ['Nachricht senden →','Send message →','Отправить сообщение →'],
  ['Mehr erfahren','Learn more','Подробнее'],

  // KONFIGURATOR TEASER
  ['Demnächst verfügbar','Coming soon','Скоро будет доступно'],
  ['Ihr Terrassendach – in 3D konfigurieren','Configure your patio cover in 3D','Настройте ваш навес в 3D'],
  ['🛠 Zum Konfigurator →','🛠 To the configurator →','🛠 К конфигуратору →'],

  // FOOTER
  ['Cookie-Einstellungen','Cookie settings','Настройки cookies'],
  ['Impressum','Legal notice','Об организации'],
  ['Datenschutz','Privacy policy','Конфиденциальность'],
  ['Pflegehinweise','Care instructions','Инструкции по уходу'],
  ['📍 Einzugsgebiet','📍 Service area','📍 Зона обслуживания'],
  ['Unternehmen','Company','Компания'],
  ['Regionen','Regions','Регионы'],
  ['Alle Rechte vorbehalten','All rights reserved','Все права защищены'],
];

var flags = {de:'🇩🇪', en:'🇬🇧', ru:'🇷🇺'};
var codes  = {de:'DE',  en:'EN',  ru:'RU'};
var idx    = {de:0,     en:1,     ru:2};

/* ── Build fast lookup maps ─────────────────────────────── */
var lookupByLang = {de:{}, en:{}, ru:{}};
T.forEach(function(row) {
  ['de','en','ru'].forEach(function(lang) {
    lookupByLang[lang][row[idx[lang]]] = row; // key = text in that lang
  });
});

/* ── Walk text nodes and replace ────────────────────────── */
function applyLang(lang) {
  var toIdx = idx[lang];

  var walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        var el = node.parentElement;
        if (!el) return NodeFilter.FILTER_REJECT;
        // Skip script/style/textarea
        if (['SCRIPT','STYLE','NOSCRIPT','TEXTAREA'].indexOf(el.tagName) >= 0)
          return NodeFilter.FILTER_REJECT;
        // Skip elements marked as no-translate
        if (el.getAttribute('data-notranslate') || el.closest('[data-notranslate]'))
          return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  var nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  nodes.forEach(function(node) {
    var text = node.textContent;
    var trimmed = text.trim();
    if (!trimmed) return;

    // Try exact trimmed match in any source language
    var found = null;
    ['de','en','ru'].forEach(function(srcLang) {
      if (!found && lookupByLang[srcLang][trimmed]) {
        found = lookupByLang[srcLang][trimmed];
      }
    });

    if (found) {
      var newText = found[toIdx];
      // Preserve surrounding whitespace
      node.textContent = text.replace(trimmed, newText);
    }
  });

  /* Also handle placeholder attributes */
  document.querySelectorAll('[placeholder]').forEach(function(el) {
    var ph = el.placeholder.trim();
    ['de','en','ru'].forEach(function(srcLang) {
      if (lookupByLang[srcLang][ph]) {
        el.placeholder = lookupByLang[srcLang][ph][toIdx];
      }
    });
  });
}

function updateDropdownLabel(lang) {
  var f = document.getElementById('langFlag');
  var c = document.getElementById('langCode');
  if (f) f.textContent = flags[lang];
  if (c) c.textContent = codes[lang];
  document.querySelectorAll('.lang-dropdown-menu button').forEach(function(btn) {
    var isActive = (lang==='de' && btn.textContent.includes('Deutsch')) ||
                   (lang==='en' && btn.textContent.includes('English')) ||
                   (lang==='ru' && btn.textContent.includes('Русский'));
    btn.classList.toggle('active', isActive);
  });
  document.querySelectorAll('.mobile-lang-switcher button').forEach(function(btn) {
    var isActive = (lang==='de' && btn.textContent.includes('Deutsch')) ||
                   (lang==='en' && btn.textContent.includes('English')) ||
                   (lang==='ru' && btn.textContent.includes('Русский'));
    btn.classList.toggle('active', isActive);
  });
}

function setLanguage(lang) {
  if (!idx.hasOwnProperty(lang)) return;
  currentLang = lang;
  localStorage.setItem('bv_lang', lang);
  applyLang(lang);
  updateDropdownLabel(lang);
  document.documentElement.lang = lang;
}

/* ── Dropdown toggle ────────────────────────────────────── */
function toggleLangMenu(e) {
  e.stopPropagation();
  var dd = document.querySelector('.lang-dropdown');
  if (dd) dd.classList.toggle('open');
}

function chooseLang(lang) {
  var dd = document.querySelector('.lang-dropdown');
  if (dd) dd.classList.remove('open');
  setLanguage(lang);
}

document.addEventListener('click', function() {
  var dd = document.querySelector('.lang-dropdown');
  if (dd) dd.classList.remove('open');
});

/* ── Init on load ───────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function() {
  updateDropdownLabel(currentLang);
  if (currentLang !== 'de') applyLang(currentLang);
});
