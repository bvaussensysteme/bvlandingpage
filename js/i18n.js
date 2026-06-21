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
  // ── FAQ ANTWORTEN ────────────────────────────────────────────
  ['In Rheinland-Pfalz und den meisten Bundesländern ist ab einer bestimmten Größe eine Baugenehmigung erforderlich. Wir kennen die lokalen Vorschriften im Westerwald genau und unterstützen Sie bei der Beantragung – das klären wir gemeinsam im ersten Gespräch.',
   'In Rhineland-Palatinate and most federal states, a building permit is required above a certain size. We know the local regulations in the Westerwald area and support you with the application – we clarify this together in the first consultation.',
   'В Рейнланд-Пфальце и большинстве федеральных земель при определённом размере требуется разрешение на строительство. Мы хорошо знаем местные нормы в регионе Вестервальд и помогаем с оформлением – разберёмся вместе на первой консультации.'],

  ['Da wir direkt mit dem Hersteller zusammenarbeiten, sind die Lieferzeiten deutlich kürzer als bei klassischen Händlern. Von der Auftragsbestätigung bis zur Montage vergehen in der Regel 2–4 Wochen, je nach Produktart und Auslastung.',
   'Since we work directly with the manufacturer, delivery times are significantly shorter than with traditional dealers. From order confirmation to installation usually takes 2–4 weeks, depending on the product type and workload.',
   'Поскольку мы работаем напрямую с производителем, сроки доставки значительно короче, чем у обычных дилеров. От подтверждения заказа до монтажа обычно проходит 2–4 недели.'],

  ['Unsere Aluminium-Profile sind in zahlreichen RAL-Farben erhältlich – von klassischem Weiß und Anthrazit bis zu individuellen Wunschfarben. Bei der Verglasung wählen Sie zwischen Klarglas, Mattglas, Polycarbonat, Lamellen oder Vollblech.',
   'Our aluminium profiles are available in numerous RAL colours – from classic white and anthracite to individual custom colours. For glazing, choose between clear glass, frosted glass, polycarbonate, louvres or solid panel.',
   'Наши алюминиевые профили доступны во множестве цветов RAL – от классического белого и антрацитового до индивидуальных цветов на заказ. Для остекления выбирайте между прозрачным стеклом, матовым стеклом, поликарбонатом, жалюзи или сплошной панелью.'],

  ['Die Preise hängen von Größe, Material, Verglasung und Montageaufwand ab. Eine einfache Terrassenüberdachung beginnt ab ca. 3.000 €, ein Carport ab ca. 2.500 €. Wir erstellen Ihnen kostenlos und unverbindlich ein Angebot nach Ihren genauen Wünschen.',
   'Prices depend on size, material, glazing and installation effort. A simple patio cover starts from around €3,000, a carport from around €2,500. We will create a free, non-binding quote tailored to your exact wishes.',
   'Цены зависят от размера, материала, остекления и объёма монтажных работ. Простой навес для террасы начинается от около 3 000 €, карпорт – от около 2 500 €. Мы составим для вас бесплатное предложение.'],

  ['Ja! Wir betreuen Kunden im gesamten Raum Westerwald, Montabaur, Neuwied, Altenkirchen, Hachenburg, Limburg und Koblenz. Sprechen Sie uns einfach an – wir finden gemeinsam eine Lösung.',
   'Yes! We serve customers throughout the Westerwald area, Montabaur, Neuwied, Altenkirchen, Hachenburg, Limburg and Koblenz. Simply contact us – we will find a solution together.',
   'Да! Мы обслуживаем клиентов по всему региону Вестервальд, Монтабаур, Нойвид, Альтенкирхен, Хахенбург, Лимбург и Кобленц. Просто свяжитесь с нами – найдём решение вместе.'],

  ['Ja. Wir kümmern uns nicht nur um Neuinstallationen, sondern auch um Wartung und Reparatur bestehender Anlagen – auch von anderen Herstellern. Einfach anfragen.',
   'Yes. We not only handle new installations, but also maintenance and repair of existing structures – including those from other manufacturers. Simply enquire.',
   'Да. Мы занимаемся не только новыми установками, но и техническим обслуживанием и ремонтом существующих конструкций – в том числе от других производителей. Просто обратитесь к нам.'],

  ['Aluminium ist das überlegene Material für Außenanlagen: Es rostet nicht, fault nicht, verzieht sich nicht und ist absolut wartungsfrei. Im Vergleich zu Holz spart man sich jährliches Streichen oder Lasieren. Gegenüber Stahl ist Aluminium leichter, was die Montage erleichtert und die Statik des Hauses weniger belastet. Dazu sind unsere Profile in beliebigen RAL-Farben pulverbeschichtet – die Farbe hält Jahrzehnte.',
   'Aluminium is the superior material for outdoor structures: it does not rust, rot or warp and is completely maintenance-free. Compared to wood, you save the annual painting or staining. Compared to steel, aluminium is lighter, making installation easier and putting less load on the house structure. Our profiles are powder-coated in any RAL colour – the colour lasts for decades.',
   'Алюминий – превосходный материал для уличных конструкций: он не ржавеет, не гниёт, не деформируется и абсолютно не требует обслуживания. По сравнению с деревом не нужно ежегодно красить. По сравнению со сталью алюминий легче. Наши профили порошково окрашены в любой цвет RAL – краска держится десятилетиями.'],

  ['Beide Materialien haben ihre Stärken. Glas (VSG/Einscheibensicherheitsglas) wirkt hochwertiger, lässt mehr Licht durch und ist kratzfest. Polycarbonat ist leichter, günstiger und dämmend – ideal wenn es unter der Überdachung im Sommer nicht zu heiß werden soll. Lamellen bieten maximale Flexibilität: offen für Sonne, geschlossen bei Regen. Wir beraten Sie im persönlichen Gespräch, was für Ihre Situation am besten passt.',
   'Both materials have their strengths. Glass (VSG/toughened safety glass) looks more premium, lets in more light and is scratch-resistant. Polycarbonate is lighter, cheaper and insulating – ideal if you do not want it to get too hot under the cover in summer. Louvres offer maximum flexibility: open for sunshine, closed in rain. We will advise you personally on what suits your situation best.',
   'Оба материала имеют свои преимущества. Стекло выглядит более премиально, пропускает больше света и устойчиво к царапинам. Поликарбонат легче, дешевле и обладает теплоизоляционными свойствами – идеально, если не хочется перегрева летом. Жалюзи дают максимальную гибкость. Мы проконсультируем вас лично.'],

  ['Ja – unbedingt. Eine fest montierte Terrassenüberdachung ist ein Gebäudebestandteil und muss Ihrer Gebäudeversicherung gemeldet werden. Andernfalls riskieren Sie bei Sturm-, Hagel- oder Schneeschäden eine Leistungsablehnung. Der Mehrwert der Versicherungssumme ist in der Regel gering – die Meldung dauert nur wenige Minuten.',
   'Yes – absolutely. A permanently installed patio cover is part of the building and must be reported to your building insurance. Otherwise you risk having claims rejected in the event of storm, hail or snow damage. The increase in the insured sum is usually small – the notification only takes a few minutes.',
   'Да – обязательно. Стационарный навес является частью здания и должен быть сообщён в вашу страховку. Иначе вы рискуете получить отказ при штормовых, градовых или снеговых повреждениях. Уведомление занимает всего несколько минут.'],

  ['In Deutschland gilt häufig eine Mindestabstandsregel von 3 Metern zur Grundstücksgrenze – aber das ist Ländersache. In Rheinland-Pfalz regelt die Landesbauordnung (LBauO RLP) die genauen Abstandsflächen. Bei Grenzabständen unter 3 Metern ist oft eine Zustimmung des Nachbarn oder eine Baugenehmigung nötig. Wir klären das gemeinsam mit Ihnen vor der Planung.',
   'In Germany, a minimum setback of 3 metres from the property boundary is often required – but this is governed by state law. In Rhineland-Palatinate, the State Building Code (LBauO RLP) regulates the exact setback areas. For distances under 3 metres, neighbour consent or a building permit is often required. We will clarify this with you before planning.',
   'В Германии часто действует правило минимального отступа 3 метра от границы участка – но это регулируется земельным законодательством. В Рейнланд-Пфальце Строительный кодекс земли (LBauO RLP) регулирует точные отступы. При расстояниях менее 3 метров часто требуется согласие соседей или разрешение. Мы разберёмся с этим вместе до начала планирования.'],

  ['Ja. Unsere Überdachungen sind sowohl als Wandanbau (an der Hauswand befestigt) als auch freistehend mit vier Pfosten erhältlich. Freistehende Varianten eignen sich besonders für Gartenbereiche, die weiter vom Haus entfernt sind, oder wenn keine geeignete Wand zur Verfügung steht. Auch Kombinationen – z.B. zwei Pfosten + Wandbefestigung – sind möglich.',
   'Yes. Our covers are available both as wall-mounted (attached to the house wall) and freestanding with four posts. Freestanding versions are particularly suitable for garden areas further from the house, or when no suitable wall is available. Combinations – e.g. two posts plus wall attachment – are also possible.',
   'Да. Наши навесы доступны как в настенном исполнении (крепятся к стене дома), так и отдельностоящими на четырёх стойках. Отдельностоящие варианты особенно подходят для садовых зон, расположенных дальше от дома. Также возможны комбинации.'],

  ['Aluminium-Konstruktionen sind nahezu wartungsfrei. Einmal im Jahr empfehlen wir eine Reinigung mit klarem Wasser und einem milden Haushaltsreiniger – kein Hochdruckreiniger direkt auf Dichtungen. Glasscheiben können mit handelsüblichem Glasreiniger gepflegt werden. Die Entwässerungsrinnen sollten im Herbst von Laub befreit werden. Das war's – mehr braucht es nicht.',
   'Aluminium structures are virtually maintenance-free. Once a year we recommend cleaning with clean water and a mild household cleaner – no high-pressure washer directly on seals. Glass panes can be maintained with standard glass cleaner. The drainage channels should be cleared of leaves in autumn. That is all – nothing more is needed.',
   'Алюминиевые конструкции практически не требуют обслуживания. Раз в год рекомендуем чистку чистой водой и мягким бытовым чистящим средством – без мойки высокого давления на уплотнители. Стёкла можно ухаживать обычным стеклоочистителем. Водосточные желоба следует очищать от листьев осенью. Вот и всё.'],

  ['Ja. Unsere Aluminium-Systeme sind modular aufgebaut und können nachträglich erweitert werden – z.B. durch Seitenteile, Glasschiebeelemente, Markisen, LED-Beleuchtung oder Lautsprecher. Auch eine Verlängerung der Tiefe oder Breite ist in vielen Fällen möglich. Das macht Ihre Investition zukunftssicher.',
   'Yes. Our aluminium systems are modularly designed and can be extended later – for example with side panels, glass sliding elements, awnings, LED lighting or speakers. An extension in depth or width is also possible in many cases. This makes your investment future-proof.',
   'Да. Наши алюминиевые системы имеют модульную конструкцию и могут быть расширены позже – например, боковыми панелями, стеклянными раздвижными элементами, маркизами, светодиодным освещением или динамиками. Это делает вашу инвестицию перспективной.'],

  ['Ja. Wir betreuen sowohl Privatkunden als auch Gewerbetreibende, Gastronomen und Unternehmen. Für den gewerblichen Bereich planen wir größere Flächen, Sondergrößen und Systemlösungen – inkl. aller erforderlichen Statik- und CE-Nachweise. Sprechen Sie uns an – wir erstellen Ihnen ein individuelles Angebot.',
   'Yes. We serve both private customers and businesses, restaurateurs and companies. For the commercial sector, we plan larger areas, special sizes and system solutions – including all required static and CE certificates. Contact us – we will create an individual quote for you.',
   'Да. Мы обслуживаем как частных клиентов, так и предпринимателей, рестораторов и компании. Для коммерческого сектора планируем большие площади и специальные решения – включая все необходимые статические расчёты и CE-сертификаты.'],

  ['Ja. Alle unsere Produkte sind CE-gekennzeichnet und erfüllen die europäischen Sicherheitsnormen. Statikberechnungen mit Nachweisen für Wind- und Schneelasten (nach Lastklassen) werden von unserem Hersteller bereitgestellt. Das ist besonders wichtig für die Baugenehmigung sowie für Ihre Gebäudeversicherung – und bei uns selbstverständlich im Lieferumfang enthalten.',
   'Yes. All our products are CE-marked and meet European safety standards. Static calculations with proof for wind and snow loads (by load class) are provided by our manufacturer. This is particularly important for the building permit and for your building insurance – and is of course included in our delivery.',
   'Да. Все наши продукты имеют маркировку CE и соответствуют европейским стандартам безопасности. Статические расчёты с доказательствами ветровых и снеговых нагрузок предоставляются нашим производителем. Это особенно важно для разрешения на строительство и страховки – и у нас входит в стандартную поставку.'],

  ['In der Regel erhalten Sie nach dem Beratungsgespräch und der Maßaufnahme innerhalb von 2–3 Werktagen Ihr schriftliches Angebot. Wir arbeiten zügig – weil wir wissen, dass Sie Ihren Außenbereich so schnell wie möglich genießen möchten.',
   'You will usually receive your written quote within 2–3 working days after the consultation and measurement. We work quickly – because we know you want to enjoy your outdoor area as soon as possible.',
   'Как правило, вы получите письменное предложение в течение 2–3 рабочих дней после консультации и замеров. Мы работаем оперативно – потому что знаем, что вы хотите наслаждаться своим уличным пространством как можно скорее.'],

];

var flags = {de:'🇩🇪', en:'🇬🇧', ru:'🇷🇺'};
var codes  = {de:'DE',  en:'EN',  ru:'RU'};
var idx    = {de:0,     en:1,     ru:2};

/* ── Build fast lookup maps ─────────────────────────────── */
var lookupByLang = {de:{}, en:{}, ru:{}};
T.forEach(function(row) {
  ['de','en','ru'].forEach(function(lang) {
    var key = row[idx[lang]];
    lookupByLang[lang][key] = row;
    // Also store normalized version (collapse whitespace)
    var normalized = key.replace(/\s+/g, ' ').trim();
    if (normalized !== key) lookupByLang[lang][normalized] = row;
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
    // Also normalize internal whitespace for matching long texts
    var normalized = trimmed.replace(/\s+/g, ' ');
    if (!normalized) return;

    var found = null;
    // Try exact match first
    ['de','en','ru'].forEach(function(srcLang) {
      if (!found && lookupByLang[srcLang][normalized]) {
        found = lookupByLang[srcLang][normalized];
      }
    });
    // Also try trimmed (for short strings)
    if (!found) {
      ['de','en','ru'].forEach(function(srcLang) {
        if (!found && lookupByLang[srcLang][trimmed]) {
          found = lookupByLang[srcLang][trimmed];
        }
      });
    }

    if (found) {
      var leading  = text.match(/^\s*/)[0];
      var trailing = text.match(/\s*$/)[0];
      node.textContent = leading + found[toIdx] + trailing;
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
