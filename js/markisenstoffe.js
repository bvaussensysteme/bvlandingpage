/* Markisenstoffe – die einzige Liste im Projekt.
 *
 * Quelle: Stoffkarte „Markisen Stoffe" (Stand 11.06.2025), vom Betreiber am
 * 11.10.2026 geschickt. 97 Stoffe, aufgeteilt in ZWEI Welten, die sich NICHT
 * überschneiden – kein Code kommt in beiden vor:
 *
 *   dach  53 Stoffe für VD LINEA, SOLARA, PERGOLA, LUNA, LUXORA
 *         → Aufdachmarkise (Linea A/AZ), Unterdachmarkise (Linea U/UZ)
 *           und die Pergolamarkise
 *   zip   44 Stoffe für VD EZIP 105 und EZIP 125
 *         → die Senkrechtmarkisen links, rechts und an der Stirnseite
 *
 * Warum das zählt: Wer im Konfigurator einen Sergé-Stoff zu einer
 * Aufdachmarkise wählt, schickt eine Anfrage los, die so nicht bestellbar
 * ist. Das fällt erst beim Angebot auf – nach Rückruf und Aufmaß.
 *
 * Jeder zip-Stoff gibt es in zwei Mustern, Konfektion A und B. Der Kunde
 * wählt eines davon (Angabe des Betreibers, 11.10.2026).
 *
 * Felder: c = Code, f = Farbfamilie, w = Wassersäule in mm, n = Name.
 *
 * fb = FARBE, UNSERE EIGENE BESCHREIBUNG, kein Herstellername.
 * Ergänzt am 23.11.2026. Ansage des Betreibers: "ich meine wirklich den
 * stofffarbnamen". Gesucht wurde an vier Stellen: in dieser Liste, auf
 * unserer Stoffseite, auf vd-alusysteme.de/stoffe und im
 * Herstellerkatalog 2026 (PDF, 21 MB, ausgelesen). Für die 53
 * Dachstoffe vergibt der Hersteller KEINE Farbnamen, dort heißt es
 * "CANYON AC320", also Gruppe plus Code. Bestätigt vom Betreiber:
 * "ne bei ac gibts nicht".
 * Deshalb ist fb aus dem Musterbild GEMESSEN: häufigste Farbe auf
 * 64 x 64 Punkten, dann ein deutsches Farbwort dazu
 * (scripts/miss-stofffarben.mjs im Arbeitsverzeichnis). Es ist eine
 * Beschreibung, keine Bestellbezeichnung. Bestellt wird über c.
 * n bleibt dem Hersteller vorbehalten und steht nur bei den
 * 44 ZIP-Stoffen.
 * Lichtechtheit ist bei allen dach-Stoffen 4/5 und steht deshalb nicht
 * je Zeile. Die Bilder liegen unter images/stoffe/mini/ (Auswahl) und
 * images/stoffe/tex/ (Tuch im 3D-Modell).
 */
window.BV_STOFFE = {
  dach: [
    { c: 'AC420', f: 'Sunset', w: 350, fb: 'Gelb' },
    { c: 'AC421', f: 'Sunset', w: 350, fb: 'Goldgelb' },
    { c: 'AC423', f: 'Sunset', w: 350, fb: 'Orange' },
    { c: 'PA425', f: 'Sunset', w: 350, fb: 'Rot' },
    { c: 'AC512', f: 'Beach', w: 350, fb: 'Grau' },
    { c: 'AC517', f: 'Beach', w: 350, fb: 'Rosé' },
    { c: 'AC518', f: 'Beach', w: 350, fb: 'Hellgrau' },
    { c: 'AC519', f: 'Beach', w: 350, fb: 'Sand' },
    { c: 'AC521', f: 'Beach', w: 350, fb: 'Sand' },
    { c: 'AC522', f: 'Beach', w: 350, fb: 'Beige' },
    { c: 'AC523', f: 'Beach', w: 350, fb: 'Taupe' },
    { c: 'AC524', f: 'Beach', w: 350, fb: 'Taupe' },
    { c: 'PA522', f: 'Beach', w: 370, fb: 'Creme' },
    { c: 'PA524', f: 'Beach', w: 350, fb: 'Beige' },
    { c: 'PA528', f: 'Beach', w: 350, fb: 'Taupe' },
    { c: 'PA532', f: 'Beach', w: 350, fb: 'Goldgelb' },
    { c: 'AC112', f: 'Ocean', w: 350, fb: 'Graublau' },
    { c: 'AC117', f: 'Ocean', w: 350, fb: 'Graublau' },
    { c: 'AC118', f: 'Ocean', w: 350, fb: 'Dunkelblau' },
    { c: 'AC119', f: 'Ocean', w: 350, fb: 'Dunkelblau' },
    { c: 'AC121', f: 'Ocean', w: 350, fb: 'Graublau' },
    { c: 'AC318', f: 'Canyon', w: 350, fb: 'Rot' },
    { c: 'AC320', f: 'Canyon', w: 350, fb: 'Terracotta' },
    { c: 'AC321', f: 'Canyon', w: 350, fb: 'Rot' },
    { c: 'AC322', f: 'Canyon', w: 350, fb: 'Rot' },
    { c: 'AC323', f: 'Canyon', w: 350, fb: 'Rot' },
    { c: 'AC324', f: 'Canyon', w: 350, fb: 'Rot' },
    { c: 'AC212', f: 'Greenery', w: 350, fb: 'Olivgrün' },
    { c: 'AC218', f: 'Greenery', w: 350, fb: 'Olivgrün' },
    { c: 'AC219', f: 'Greenery', w: 350, fb: 'Olivgrün' },
    { c: 'AC220', f: 'Greenery', w: 350, fb: 'Grau' },
    { c: 'AC221', f: 'Greenery', w: 350, fb: 'Graugrün' },
    { c: 'AC223', f: 'Greenery', w: 350, fb: 'Dunkelgrün' },
    { c: 'AC626', f: 'Mountain', w: 350, fb: 'Hellgrau' },
    { c: 'AC627', f: 'Mountain', w: 350, fb: 'Hellgrau' },
    { c: 'AC630', f: 'Mountain', w: 350, fb: 'Grau' },
    { c: 'AC631', f: 'Mountain', w: 350, fb: 'Anthrazit' },
    { c: 'AC632', f: 'Mountain', w: 350, fb: 'Grau' },
    { c: 'PA612', f: 'Mountain', w: 380, fb: 'Grau' },
    { c: 'PA614', f: 'Mountain', w: 380, fb: 'Grau' },
    { c: 'PA616', f: 'Mountain', w: 380, fb: 'Grau' },
    { c: 'PA617', f: 'Mountain', w: 380, fb: 'Grau' },
    { c: 'PA626', f: 'Mountain', w: 350, fb: 'Hellgrau' },
    { c: 'PA627', f: 'Mountain', w: 370, fb: 'Beige' },
    { c: 'PA630', f: 'Mountain', w: 350, fb: 'Hellgrau' },
    { c: 'PA632', f: 'Mountain', w: 380, fb: 'Hellgrau' },
    { c: 'PA633', f: 'Mountain', w: 450, fb: 'Grau' },
    { c: 'PA636', f: 'Mountain', w: 350, fb: 'Grau' },
    { c: 'PA637', f: 'Mountain', w: 350, fb: 'Grau' },
    { c: 'PA639', f: 'Mountain', w: 370, fb: 'Anthrazit' },
    { c: 'PA642', f: 'Mountain', w: 350, fb: 'Grau' },
    { c: 'PA643', f: 'Mountain', w: 350, fb: 'Anthrazit' },
    { c: 'PA645', f: 'Mountain', w: 450, fb: 'Anthrazit' }
  ],
  zip: [
    { c: 'T31818', f: 'Ecole 1%', n: 'UNI SCHWARZ' },
    { c: 'T31808', f: 'Ecole 1%', n: 'SCHWARZ GRAU' },
    { c: 'T30818', f: 'Ecole 1%', n: 'GRAU SCHWARZ' },
    { c: 'T30808', f: 'Ecole 1%', n: 'UNI GRAU' },
    { c: 'T30812', f: 'Ecole 1%', n: 'GRAU SAND' },
    { c: 'T31708', f: 'Ecole 1%', n: 'GRAU PERLWEISS' },
    { c: 'T30801', f: 'Ecole 1%', n: 'GRAU WEISS' },
    { c: 'T31701', f: 'Ecole 1%', n: 'WEISS PERLWEISS' },
    { c: 'T71818', f: 'Sergé', n: 'UNI SCHWARZ' },
    { c: 'T70808', f: 'Sergé', n: 'UNI GRAU' },
    { c: 'T70818', f: 'Sergé', n: 'GRAU SCHWARZ' },
    { c: 'T71708', f: 'Sergé', n: 'PERLE GRAU' },
    { c: 'T71848', f: 'Sergé', n: 'SCHWARZ GRAU LEINEN' },
    { c: 'T71717', f: 'Sergé', n: 'UNI PERLE' },
    { c: 'T71308', f: 'Sergé', n: 'BRONZE GRAU' },
    { c: 'T71608', f: 'Sergé', n: 'LEINEN GRAU' },
    { c: 'T70841', f: 'Sergé', n: 'GRAU WEISS PERLE' },
    { c: 'T70101', f: 'Sergé', n: 'UNI WEISS' },
    { c: 'T70801', f: 'Sergé', n: 'GRAU WEISS' },
    { c: 'T71813', f: 'Sergé', n: 'SCHWARZ BRONZE' },
    { c: 'T71701', f: 'Sergé', n: 'PERLE WEISS' },
    { c: 'T71313', f: 'Sergé', n: 'UNI BRONZE' },
    { c: 'T70141', f: 'Sergé', n: 'WEISS WEISS PERLE' },
    { c: 'T71213', f: 'Sergé', n: 'SAND BRONZE' },
    { c: 'T71812', f: 'Sergé', n: 'SCHWARZ SAND' },
    { c: 'T71716', f: 'Sergé', n: 'PERLE LEINEN' },
    { c: 'T70812', f: 'Sergé', n: 'GRAU SAND' },
    { c: 'T71745', f: 'Sergé', n: 'PERLE WEISS SAND' },
    { c: 'T70826', f: 'Sergé', n: 'GRAU KARAMELL' },
    { c: 'T71212', f: 'Sergé', n: 'UNI SAND' },
    { c: 'T71816', f: 'Sergé', n: 'SCHWARZ LEINEN' },
    { c: 'T71616', f: 'Sergé', n: 'UNI LEINEN' },
    { c: 'T71201', f: 'Sergé', n: 'SAND WEISS' },
    { c: 'T71711', f: 'Sergé', n: 'PERLE MARINE' },
    { c: 'T71601', f: 'Sergé', n: 'LEINEN WEISS' },
    { c: 'T70867', f: 'Sergé', n: 'PAZIFIK' },
    { c: 'T71111', f: 'Sergé', n: 'UNI BLAU' },
    { c: 'T70806', f: 'Sergé', n: 'GRAU TÜRKIS' },
    { c: 'T70811', f: 'Sergé', n: 'GRAU BLAU' },
    { c: 'T71622', f: 'Sergé', n: 'LEINEN GRÜN' },
    { c: 'T71203', f: 'Sergé', n: 'SAND GELB' },
    { c: 'T70809', f: 'Sergé', n: 'GRAU ORANGE' },
    { c: 'T71305', f: 'Sergé', n: 'BRONZE MANDARINE' },
    { c: 'T70805', f: 'Sergé', n: 'GRAU MANDARINE' }
  ]
};
