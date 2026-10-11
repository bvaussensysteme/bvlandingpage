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
 * Lichtechtheit ist bei allen dach-Stoffen 4/5 und steht deshalb nicht
 * je Zeile. Die Bilder liegen unter images/stoffe/mini/ (Auswahl) und
 * images/stoffe/tex/ (Tuch im 3D-Modell).
 */
window.BV_STOFFE = {
  dach: [
    { c: 'AC420', f: 'Sunset', w: 350 },
    { c: 'AC421', f: 'Sunset', w: 350 },
    { c: 'AC423', f: 'Sunset', w: 350 },
    { c: 'PA425', f: 'Sunset', w: 350 },
    { c: 'AC512', f: 'Beach', w: 350 },
    { c: 'AC517', f: 'Beach', w: 350 },
    { c: 'AC518', f: 'Beach', w: 350 },
    { c: 'AC519', f: 'Beach', w: 350 },
    { c: 'AC521', f: 'Beach', w: 350 },
    { c: 'AC522', f: 'Beach', w: 350 },
    { c: 'AC523', f: 'Beach', w: 350 },
    { c: 'AC524', f: 'Beach', w: 350 },
    { c: 'PA522', f: 'Beach', w: 370 },
    { c: 'PA524', f: 'Beach', w: 350 },
    { c: 'PA528', f: 'Beach', w: 350 },
    { c: 'PA532', f: 'Beach', w: 350 },
    { c: 'AC112', f: 'Ocean', w: 350 },
    { c: 'AC117', f: 'Ocean', w: 350 },
    { c: 'AC118', f: 'Ocean', w: 350 },
    { c: 'AC119', f: 'Ocean', w: 350 },
    { c: 'AC121', f: 'Ocean', w: 350 },
    { c: 'AC318', f: 'Canyon', w: 350 },
    { c: 'AC320', f: 'Canyon', w: 350 },
    { c: 'AC321', f: 'Canyon', w: 350 },
    { c: 'AC322', f: 'Canyon', w: 350 },
    { c: 'AC323', f: 'Canyon', w: 350 },
    { c: 'AC324', f: 'Canyon', w: 350 },
    { c: 'AC212', f: 'Greenery', w: 350 },
    { c: 'AC218', f: 'Greenery', w: 350 },
    { c: 'AC219', f: 'Greenery', w: 350 },
    { c: 'AC220', f: 'Greenery', w: 350 },
    { c: 'AC221', f: 'Greenery', w: 350 },
    { c: 'AC223', f: 'Greenery', w: 350 },
    { c: 'AC626', f: 'Mountain', w: 350 },
    { c: 'AC627', f: 'Mountain', w: 350 },
    { c: 'AC630', f: 'Mountain', w: 350 },
    { c: 'AC631', f: 'Mountain', w: 350 },
    { c: 'AC632', f: 'Mountain', w: 350 },
    { c: 'PA612', f: 'Mountain', w: 380 },
    { c: 'PA614', f: 'Mountain', w: 380 },
    { c: 'PA616', f: 'Mountain', w: 380 },
    { c: 'PA617', f: 'Mountain', w: 380 },
    { c: 'PA626', f: 'Mountain', w: 350 },
    { c: 'PA627', f: 'Mountain', w: 370 },
    { c: 'PA630', f: 'Mountain', w: 350 },
    { c: 'PA632', f: 'Mountain', w: 380 },
    { c: 'PA633', f: 'Mountain', w: 450 },
    { c: 'PA636', f: 'Mountain', w: 350 },
    { c: 'PA637', f: 'Mountain', w: 350 },
    { c: 'PA639', f: 'Mountain', w: 370 },
    { c: 'PA642', f: 'Mountain', w: 350 },
    { c: 'PA643', f: 'Mountain', w: 350 },
    { c: 'PA645', f: 'Mountain', w: 450 }
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
