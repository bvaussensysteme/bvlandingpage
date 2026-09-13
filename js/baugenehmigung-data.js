/**
 * BV AussenSysteme – Baugenehmigung Daten-Modul
 * Quelle: Landesbauordnungen der 16 Bundesländer
 * Stand: 2025/2026 | Ohne Gewähr – Angaben dienen nur der Orientierung
 *
 * Am Gesetzestext gegengeprüft (Feld "geprueft", Stand 09/2026):
 *   Rheinland-Pfalz  § 62 Abs. 1 Nr. 1 f und Abs. 2 Nr. 2 LBauO, § 8 Abs. 6 und 9 LBauO
 *   Hessen           Anlage zu § 63 HBO Nr. 1.2, 1.12, 1.13, 1.14 und Abschnitt IV
 *   Nordrhein-Westf. § 62 Abs. 1 Nr. 1 BauO NRW 2018
 *
 * Die übrigen Länder sind Übersichtsangaben ohne Einzelprüfung am Gesetzestext.
 * Sie sind bewusst zurückhaltend formuliert und verweisen auf das Bauamt.
 *
 * Wichtig für Rheinland-Pfalz: Terrassenüberdachungen und Wintergärten werden
 * dort nach umbautem Raum (50 m³) bemessen, nicht nach Grundfläche. Carports
 * dagegen nach Grundfläche (50 m²). Das wurde früher verwechselt.
 */

const LBO_DATA = {

  /* ─────────────────────────────────────────────────────────
     RHEINLAND-PFALZ  (Heimat-Bundesland von BV AussenSysteme)
     LBO RLP §62 Abs.1 Nr.1  ─────────────────────────────── */
  "Rheinland-Pfalz": {
    kuerzel: "RLP",
    gesetz: "LBauO RLP § 62",
    gesetzLink: "https://landesrecht.rlp.de/bsrp/document/jlr-BauORPrahmen",
    geprueft: "09/2026",
    produkte: {
      terrassenueberdachung: {
        label: "Terrassenüberdachung",
        status: "meistens genehmigungsfrei",
        statusClass: "green",
        bedingung: "zu ebener Erde, unbeheizt, bis 50 m³ umbauter Raum – an Wohngebäuden der Gebäudeklassen 1 bis 3, nicht im Außenbereich (§ 62 Abs. 2 Nr. 2 LBauO)",
        hinweis: "Rheinland-Pfalz rechnet in Kubikmetern, nicht in Quadratmetern: 50 m³ sind grob gerechnet rund 20 m² bei 2,50 m mittlerer Höhe. Wird es größer oder beheizt, ist ein Bauantrag nötig. Ein Bebauungsplan kann zusätzlich Festsetzungen enthalten.",
        abstand: "Abstandsfläche 0,4 H, mindestens 3 m zur Grundstücksgrenze (§ 8 Abs. 6 LBauO)."
      },
      carport: {
        label: "Carport",
        status: "meistens genehmigungsfrei",
        statusClass: "green",
        bedingung: "bis 50 m² Grundfläche und mittlere Wandhöhe bis 3,20 m (Giebel bis 4 m Firsthöhe), nicht im Außenbereich (§ 62 Abs. 1 Nr. 1 f LBauO)",
        hinweis: "Gilt ebenso für überdachte Stellplätze und Fahrradunterstände. Ausgenommen sind außerdem Grundstücke in der Umgebung von Kultur- und Naturdenkmälern.",
        abstand: "An der Grenze zulässig bis 3,20 m mittlere Wandhöhe und 12 m Länge je Grenze (zusammen höchstens 18 m an allen Grenzen), Dach zur Grenze höchstens 45° geneigt (§ 8 Abs. 9 LBauO)."
      },
      kaltwintergarten: {
        label: "Kaltwintergarten / Glasanbau",
        status: "kommt auf die Ausführung an",
        statusClass: "yellow",
        bedingung: "unbeheizt und zu ebener Erde bis 50 m³ umbauter Raum genehmigungsfrei – beheizt immer genehmigungspflichtig",
        hinweis: "Es ist dieselbe Vorschrift wie bei der Terrassenüberdachung (§ 62 Abs. 2 Nr. 2 LBauO): Entscheidend sind Volumen und Beheizung. Ein beheizter Wintergarten ist ein Aufenthaltsraum und braucht eine Baugenehmigung.",
        abstand: "Wie Terrassenüberdachung: 0,4 H, mindestens 3 m."
      },
      glasschiebeanlage: {
        label: "Glasschiebewand / -anlage",
        status: "kommt auf die Ausführung an",
        statusClass: "yellow",
        bedingung: "als Zubehör zu einer bestehenden Überdachung meist unkritisch – entsteht dadurch ein geschlossener Anbau, gilt die 50-m³-Grenze",
        hinweis: "Solange der Raum unbeheizt bleibt und 50 m³ umbauten Raum nicht überschreitet, bleibt es genehmigungsfrei. Im Zweifel vorab beim Bauamt nachfragen.",
        abstand: "Abstandsflächen der Hauptkonstruktion gelten."
      },
      aussenanlage: {
        label: "Aluminium-Außensysteme (Pergola, Lamellendach, Markisen)",
        status: "meistens genehmigungsfrei",
        statusClass: "green",
        bedingung: "Markisen und Sonnenschutz sind genehmigungsfrei, offene Pergolen ohne festes Dach ebenfalls",
        hinweis: "Sobald ein festes Dach dazukommt (Glas, Polycarbonat, geschlossene Lamellen), gilt die Regel für Terrassenüberdachungen: unbeheizt bis 50 m³ umbauter Raum.",
        abstand: "Je nach Ausführung wie Terrassenüberdachung."
      }
    }
  },

  /* ─────────────────── NORDRHEIN-WESTFALEN ──────────────── */
  "Nordrhein-Westfalen": {
    kuerzel: "NRW",
    gesetz: "BauO NRW § 62 Abs. 1 Nr. 1",
    gesetzLink: "https://recht.nrw.de/lmi/owa/br_text_anzeigen?v_id=10000000000000000735",
    geprueft: "09/2026",
    produkte: {
      terrassenueberdachung: {
        label: "Terrassenüberdachung",
        status: "meistens genehmigungsfrei",
        statusClass: "green",
        bedingung: "bis 30 m² Grundfläche und bis 4,50 m Tiefe, nicht im Außenbereich",
        hinweis: "Maßgeblich ist neben der Fläche die Tiefe: Beides muss eingehalten sein. Darüber ist ein Bauantrag nötig, im B-Plan-Gebiet ggf. eine Befreiung.",
        abstand: "Abstandsfläche nach § 6 BauO NRW, mindestens 3 m zur Grundstücksgrenze."
      },
      carport: {
        label: "Carport",
        status: "meistens genehmigungsfrei",
        statusClass: "green",
        bedingung: "Garagen und überdachte Stellplätze bis 30 m² Brutto-Grundfläche und mittlerer Wandhöhe bis 3 m, nicht im Außenbereich",
        hinweis: "Größere Carports sind genehmigungspflichtig. Den Stellplatznachweis der Gemeinde beachten.",
        abstand: "Grenzbebauung nach § 6 BauO NRW möglich – die zulässige Länge beim Bauamt bestätigen lassen."
      },
      kaltwintergarten: {
        label: "Kaltwintergarten / Glasanbau",
        status: "kommt auf die Ausführung an",
        statusClass: "yellow",
        bedingung: "unbeheizt kann er verfahrensfrei sein, beheizt ist er ein Aufenthaltsraum und damit genehmigungspflichtig",
        hinweis: "Die Einstufung hängt stark von der Ausführung ab. Vor der Planung beim Bauamt klären lassen.",
        abstand: "mindestens 3 m zur Grundstücksgrenze."
      },
      glasschiebeanlage: {
        label: "Glasschiebewand / -anlage",
        status: "kommt auf die Ausführung an",
        statusClass: "yellow",
        bedingung: "bewegliche Verglasung einer bestehenden Überdachung ist meist unkritisch",
        hinweis: "Eine dauerhafte Vollverglasung kann als Wintergarten gewertet werden – dann genehmigungspflichtig.",
        abstand: "Wie Hauptkonstruktion."
      },
      aussenanlage: {
        label: "Aluminium-Außensysteme (Pergola, Lamellendach, Markisen)",
        status: "meistens genehmigungsfrei",
        statusClass: "green",
        bedingung: "Markisen, Sonnenschutz und offene Pergolen ohne festes Dach in der Regel genehmigungsfrei",
        hinweis: "Feste Überdachungen zählen als Terrassenüberdachung – dann gelten 30 m² und 4,50 m Tiefe.",
        abstand: "Wie Terrassenüberdachung."
      }
    }
  },

  /* ──────────────────────── HESSEN ──────────────────────── */
  "Hessen": {
    kuerzel: "HE",
    gesetz: "Anlage zu § 63 HBO",
    gesetzLink: "https://www.rv.hessenrecht.hessen.de/bshe/document/jlr-BauOHE2018pAnlage",
    geprueft: "09/2026",
    produkte: {
      terrassenueberdachung: {
        label: "Terrassenüberdachung",
        status: "meistens genehmigungsfrei",
        statusClass: "green",
        bedingung: "Überdachungen und Teilverglasungen erdgeschossiger Terrassen bei Gebäuden der Gebäudeklassen 1 bis 3 – ohne Flächenbegrenzung (Anlage Nr. 1.13)",
        hinweis: "Hessen nennt hier bewusst keine Quadratmetergrenze. Vor Baubeginn muss aber eine nachweisberechtigte Person die statisch-konstruktive Unbedenklichkeit bescheinigen (Abschnitt IV Nr. 3).",
        abstand: "Abstandsflächen nach § 6 HBO, in der Regel mindestens 3 m zur Grundstücksgrenze."
      },
      carport: {
        label: "Carport",
        status: "meistens genehmigungsfrei",
        statusClass: "green",
        bedingung: "Garagen und überdachte Stellplätze bis 50 m² Grundfläche, Zufahrten bis 200 m² (Anlage Nr. 1.2)",
        hinweis: "Das Vorhaben ist der Gemeinde vorab anzuzeigen. Gebaut werden darf frühestens 14 Tage nach Eingang der Unterlagen (Abschnitt IV Nr. 1).",
        abstand: "Grenzbebauung nach § 6 HBO möglich – die zulässigen Maße beim Bauamt bestätigen lassen."
      },
      kaltwintergarten: {
        label: "Kaltwintergarten / Glasanbau",
        status: "kommt auf die Ausführung an",
        statusClass: "yellow",
        bedingung: "Wintergärten bis 30 m² Grundfläche bei Gebäuden der Gebäudeklassen 1 bis 3 sind verfahrensfrei (Anlage Nr. 1.12)",
        hinweis: "Größer als 30 m² oder als beheizter Aufenthaltsraum ausgeführt: Bauantrag. Zusätzlich sind Anzeige bei der Gemeinde und Standsicherheitsnachweis nötig (Abschnitt IV Nr. 1 und 3).",
        abstand: "Wie Terrassenüberdachung."
      },
      glasschiebeanlage: {
        label: "Glasschiebewand / -anlage",
        status: "meistens genehmigungsfrei",
        statusClass: "green",
        bedingung: "Teilverglasung einer erdgeschossigen Terrasse ist ausdrücklich mit erfasst (Anlage Nr. 1.13)",
        hinweis: "Wird daraus ein rundum geschlossener Wintergarten, gilt die 30-m²-Grenze aus Nr. 1.12.",
        abstand: "Abstandsflächen der Hauptkonstruktion gelten."
      },
      aussenanlage: {
        label: "Aluminium-Außensysteme (Pergola, Lamellendach, Markisen)",
        status: "meistens genehmigungsfrei",
        statusClass: "green",
        bedingung: "Markisen, Sonnenschutz und offene Pergolen sind verfahrensfrei",
        hinweis: "Feste Dächer über einer erdgeschossigen Terrasse fallen unter Nr. 1.13, Balkonüberdachungen bis 30 m² unter Nr. 1.14.",
        abstand: "Wie Terrassenüberdachung."
      }
    }
  },

  /* ──────────────────── BADEN-WÜRTTEMBERG ───────────────── */
  "Baden-Württemberg": {
    kuerzel: "BW",
    gesetz: "LBO BW §50 i. V. m. Anhang",
    gesetzLink: "https://www.landesrecht-bw.de/jportal/?quelle=jlink&query=BauO+BW",
    produkte: {
      terrassenueberdachung: {
        label: "Terrassenüberdachung",
        status: "meistens genehmigungsfrei",
        statusClass: "green",
        bedingung: "bis 40 m² Grundfläche (Anhang Nr. 1 LBO BW), angebaut an Wohngebäude",
        hinweis: "Die 40-m²-Grenze gilt für Anbauten an bestehende Gebäude. Freistehend gelten andere Regelungen.",
        abstand: "mind. 2,5 m (LBO BW §5)."
      },
      carport: {
        label: "Carport",
        status: "meistens genehmigungsfrei",
        statusClass: "green",
        bedingung: "bis 40 m², Nutzung als Stellplatz, keine Aufenthaltsräume",
        hinweis: "Grenzbau bis 9 m Länge und 3 m Wandhöhe zulässig.",
        abstand: "Grenzbau bis 9 m an einer Seite möglich."
      },
      kaltwintergarten: {
        label: "Kaltwintergarten",
        status: "kommt auf die Ausführung an",
        statusClass: "yellow",
        bedingung: "Wintergärten bis 40 m² ggf. genehmigungsfrei, wenn unbeheizt und ohne Aufenthaltsraum-Qualität",
        hinweis: "In der Praxis erfordern die meisten Wintergärten in BW eine Baugenehmigung. Frühzeitig anfragen.",
        abstand: "mind. 2,5 m."
      },
      glasschiebeanlage: {
        label: "Glasschiebewand / -anlage",
        status: "meistens genehmigungsfrei",
        statusClass: "green",
        bedingung: "Als nicht tragende Verglasung zu bestehender Konstruktion genehmigungsfrei",
        hinweis: "Wenn aus dem überdachten Bereich dauerhaft ein Wintergarten wird, entsteht Genehmigungspflicht.",
        abstand: "Wie Hauptkonstruktion."
      },
      aussenanlage: {
        label: "Aluminium-Außensysteme",
        status: "meistens genehmigungsfrei",
        statusClass: "green",
        bedingung: "Markisen, offene Lamellenpergolen bis 40 m² i. d. R. genehmigungsfrei",
        hinweis: "Geschlossene feste Konstruktionen werden wie Überdachungen behandelt.",
        abstand: "Wie Terrassenüberdachung."
      }
    }
  },

  /* ─────────────────────── BAYERN ───────────────────────── */
  "Bayern": {
    kuerzel: "BY",
    gesetz: "BayBO Art. 57 Abs. 1 Nr. 1",
    gesetzLink: "https://www.gesetze-bayern.de/Content/Document/BayBO/true",
    produkte: {
      terrassenueberdachung: {
        label: "Terrassenüberdachung",
        status: "meistens genehmigungsfrei",
        statusClass: "green",
        bedingung: "Gebäude bis 75 m³ Brutto-Rauminhalt (BRI) im Innenbereich genehmigungsfrei (Art.57 BayBO)",
        hinweis: "75 m³ BRI entspricht ca. 25 m² bei 3 m Höhe. Darüber Vereinfachtes Genehmigungsverfahren (Art.59). Im Außenbereich immer Genehmigung.",
        abstand: "mind. 3 m zur Grundstücksgrenze (Art.6 BayBO)."
      },
      carport: {
        label: "Carport",
        status: "meistens genehmigungsfrei",
        statusClass: "green",
        bedingung: "Bis zu 2 Stellplätze, Carports als Anlagen ohne Aufenthaltsräume oft verfahrensfrei",
        hinweis: "Die 75-m³-BRI-Regelung gilt. Carports ohne Wände fallen häufig nicht darunter.",
        abstand: "Grenzbau bis 9 m Länge und 3 m Wandhöhe nach Art. 6 BayBO zulässig."
      },
      kaltwintergarten: {
        label: "Kaltwintergarten",
        status: "kommt auf die Ausführung an",
        statusClass: "yellow",
        bedingung: "Unbeheizte bis 75 m³ BRI ggf. genehmigungsfrei, beheizte immer Genehmigung",
        hinweis: "Wintergärten gelten als Aufenthaltsräume und erfordern in Bayern meist eine Baugenehmigung.",
        abstand: "mind. 3 m."
      },
      glasschiebeanlage: {
        label: "Glasschiebewand / -anlage",
        status: "kommt auf die Ausführung an",
        statusClass: "yellow",
        bedingung: "Bewegliche Verglasung zu bestehender Überdachung meist genehmigungsfrei",
        hinweis: "Feste Verglasung kann als Erweiterung des Gebäudevolumens gewertet werden.",
        abstand: "Wie Hauptkonstruktion."
      },
      aussenanlage: {
        label: "Aluminium-Außensysteme",
        status: "meistens genehmigungsfrei",
        statusClass: "green",
        bedingung: "Markisen, Sonnenschutz, offene Pergolen i. d. R. genehmigungsfrei",
        hinweis: "Lamellendächer mit geschlossenen Platten werden wie Überdachungen behandelt.",
        abstand: "Wie Terrassenüberdachung."
      }
    }
  },

  /* ─────────────────── NIEDERSACHSEN ────────────────────── */
  "Niedersachsen": {
    kuerzel: "NI",
    gesetz: "NBauO §60 Abs. 1",
    gesetzLink: "https://www.nds-voris.de/jportal/?quelle=jlink&query=BauO+ND",
    produkte: {
      terrassenueberdachung: {
        label: "Terrassenüberdachung",
        status: "meistens genehmigungsfrei",
        statusClass: "green",
        bedingung: "bis 40 m² Grundfläche und 5 m Höhe im Innenbereich",
        hinweis: "Abstandsregelungen müssen eingehalten werden. Im Außenbereich genehmigungspflichtig.",
        abstand: "mind. 3 m (NBauO §5)."
      },
      carport: { label: "Carport", status: "meistens genehmigungsfrei", statusClass: "green",
        bedingung: "bis 40 m², Nutzung als Stellplatz", hinweis: "Grenzgaragen bis 9 m Länge zulässig.", abstand: "Grenzbau bis 9 m möglich." },
      kaltwintergarten: { label: "Kaltwintergarten", status: "kommt auf die Ausführung an", statusClass: "yellow",
        bedingung: "unbeheizt kann verfahrensfrei sein, beheizt immer genehmigungspflichtig", hinweis: "Die Grenzwerte stehen in der Landesbauordnung und unterscheiden sich – vor der Planung beim Bauamt klären.", abstand: "mind. 3 m." },
      glasschiebeanlage: { label: "Glasschiebewand", status: "meistens genehmigungsfrei", statusClass: "green",
        bedingung: "Als bewegliche Verglasung zu bestehender Überdachung", hinweis: "Vollverglasung prüfen.", abstand: "Wie Hauptkonstruktion." },
      aussenanlage: { label: "Aluminium-Außensysteme", status: "meistens genehmigungsfrei", statusClass: "green",
        bedingung: "bis 40 m² genehmigungsfrei", hinweis: "Feste Konstruktionen wie Überdachungen behandeln.", abstand: "mind. 3 m." }
    }
  },

  /* ─────────────────── SACHSEN ───────────────────────────── */
  "Sachsen": {
    kuerzel: "SN",
    gesetz: "SächsBO §61",
    gesetzLink: "https://www.revosax.sachsen.de/vorschrift/10236-SaechsBO",
    produkte: {
      terrassenueberdachung: { label: "Terrassenüberdachung", status: "meistens genehmigungsfrei", statusClass: "green",
        bedingung: "bis 40 m² GF und 5 m Höhe im Innenbereich", hinweis: "Im Außenbereich genehmigungspflichtig.", abstand: "mind. 3 m." },
      carport: { label: "Carport", status: "meistens genehmigungsfrei", statusClass: "green",
        bedingung: "bis zu 2 Stellplätze, bis 40 m²", hinweis: "Grenzbebauung bis 9 m möglich.", abstand: "Grenzbau bis 9 m möglich." },
      kaltwintergarten: { label: "Kaltwintergarten", status: "kommt auf die Ausführung an", statusClass: "yellow",
        bedingung: "unbeheizt kann verfahrensfrei sein, beheizt immer genehmigungspflichtig", hinweis: "Die Grenzwerte stehen in der Landesbauordnung und unterscheiden sich – vor der Planung beim Bauamt klären.", abstand: "mind. 3 m." },
      glasschiebeanlage: { label: "Glasschiebewand", status: "kommt auf die Ausführung an", statusClass: "yellow",
        bedingung: "Bewegliche Verglasung zu Überdachung oft genehmigungsfrei", hinweis: "Feste Verglasung prüfen.", abstand: "Wie Hauptkonstruktion." },
      aussenanlage: { label: "Aluminium-Außensysteme", status: "meistens genehmigungsfrei", statusClass: "green",
        bedingung: "Offene Pergolen, Markisen i. d. R. genehmigungsfrei", hinweis: "Feste Dächer wie Überdachungen.", abstand: "mind. 3 m." }
    }
  },

  /* ─────────────── WEITERE BUNDESLÄNDER (Kompakt) ─────────── */
  "Brandenburg": {
    kuerzel: "BB", gesetz: "BbgBO §61", gesetzLink: "https://bravors.brandenburg.de/gesetze/bbgbo",
    produkte: {
      terrassenueberdachung: { label: "Terrassenüberdachung", status: "meistens genehmigungsfrei", statusClass: "green",
        bedingung: "bis 30 m² GF, Innenbereich", hinweis: "Im Außenbereich genehmigungspflichtig.", abstand: "mind. 3 m." },
      carport: { label: "Carport", status: "meistens genehmigungsfrei", statusClass: "green",
        bedingung: "bis 30 m²", hinweis: "Grenzbau bis 9 m.", abstand: "Grenzbau möglich." },
      kaltwintergarten: { label: "Kaltwintergarten", status: "kommt auf die Ausführung an", statusClass: "yellow",
        bedingung: "unbeheizt kann verfahrensfrei sein, beheizt immer genehmigungspflichtig", hinweis: "Grenzwerte beim Bauamt erfragen.", abstand: "mind. 3 m." },
      glasschiebeanlage: { label: "Glasschiebewand", status: "kommt auf die Ausführung an", statusClass: "yellow",
        bedingung: "Prüfung erforderlich", hinweis: "Bauamt anfragen.", abstand: "Wie Hauptkonstruktion." },
      aussenanlage: { label: "Aluminium-Außensysteme", status: "meistens genehmigungsfrei", statusClass: "green",
        bedingung: "Offene Systeme bis 30 m²", hinweis: "Feste Dächer wie Überdachungen.", abstand: "mind. 3 m." }
    }
  },

  "Thüringen": {
    kuerzel: "TH", gesetz: "ThürBO §60", gesetzLink: "https://landesrecht.thueringen.de/bsth/document/jlr-BauOTHrahmen",
    produkte: {
      terrassenueberdachung: { label: "Terrassenüberdachung", status: "meistens genehmigungsfrei", statusClass: "green",
        bedingung: "bis 50 m² GF, Innenbereich", hinweis: "Abstandsflächen und B-Plan beachten.", abstand: "mind. 3 m." },
      carport: { label: "Carport", status: "meistens genehmigungsfrei", statusClass: "green",
        bedingung: "bis 50 m²", hinweis: "Grenzbau bis 9 m.", abstand: "Grenzbau möglich." },
      kaltwintergarten: { label: "Kaltwintergarten", status: "kommt auf die Ausführung an", statusClass: "yellow",
        bedingung: "unbeheizt bis 50 m² ggf. verfahrensfrei, beheizt immer genehmigungspflichtig", hinweis: "Grenzwerte beim Bauamt bestätigen lassen.", abstand: "mind. 3 m." },
      glasschiebeanlage: { label: "Glasschiebewand", status: "meistens genehmigungsfrei", statusClass: "green",
        bedingung: "Als Zubehör genehmigungsfrei", hinweis: "Vollverglasung prüfen.", abstand: "Wie Hauptkonstruktion." },
      aussenanlage: { label: "Aluminium-Außensysteme", status: "meistens genehmigungsfrei", statusClass: "green",
        bedingung: "bis 50 m² genehmigungsfrei", hinweis: "Wie Überdachungen behandeln.", abstand: "mind. 3 m." }
    }
  },

  "Sachsen-Anhalt": {
    kuerzel: "ST", gesetz: "BauO LSA §61", gesetzLink: "https://www.landesrecht.sachsen-anhalt.de/bssah/document/jlr-BauOSTrahmen",
    produkte: {
      terrassenueberdachung: { label: "Terrassenüberdachung", status: "meistens genehmigungsfrei", statusClass: "green",
        bedingung: "bis 30 m²", hinweis: "Abstandsflächen beachten.", abstand: "mind. 3 m." },
      carport: { label: "Carport", status: "meistens genehmigungsfrei", statusClass: "green",
        bedingung: "bis 30 m²", hinweis: "", abstand: "Grenzbau möglich." },
      kaltwintergarten: { label: "Kaltwintergarten", status: "kommt auf die Ausführung an", statusClass: "yellow",
        bedingung: "unbeheizt kann verfahrensfrei sein, beheizt immer genehmigungspflichtig", hinweis: "Grenzwerte beim Bauamt erfragen.", abstand: "mind. 3 m." },
      glasschiebeanlage: { label: "Glasschiebewand", status: "kommt auf die Ausführung an", statusClass: "yellow",
        bedingung: "Prüfung erforderlich", hinweis: "Bauamt anfragen.", abstand: "Wie Hauptkonstruktion." },
      aussenanlage: { label: "Aluminium-Außensysteme", status: "meistens genehmigungsfrei", statusClass: "green",
        bedingung: "Offene Systeme i. d. R. frei", hinweis: "", abstand: "mind. 3 m." }
    }
  },

  "Mecklenburg-Vorpommern": {
    kuerzel: "MV", gesetz: "LBauO M-V §61", gesetzLink: "https://www.landesrecht-mv.de",
    produkte: {
      terrassenueberdachung: { label: "Terrassenüberdachung", status: "meistens genehmigungsfrei", statusClass: "green",
        bedingung: "bis 30 m²", hinweis: "Im Außenbereich genehmigungspflichtig.", abstand: "mind. 3 m." },
      carport: { label: "Carport", status: "meistens genehmigungsfrei", statusClass: "green",
        bedingung: "bis 30 m²", hinweis: "", abstand: "Grenzbau möglich." },
      kaltwintergarten: { label: "Kaltwintergarten", status: "kommt auf die Ausführung an", statusClass: "yellow",
        bedingung: "unbeheizt kann verfahrensfrei sein, beheizt immer genehmigungspflichtig", hinweis: "Grenzwerte beim Bauamt erfragen.", abstand: "mind. 3 m." },
      glasschiebeanlage: { label: "Glasschiebewand", status: "kommt auf die Ausführung an", statusClass: "yellow",
        bedingung: "Prüfung erforderlich", hinweis: "", abstand: "Wie Hauptkonstruktion." },
      aussenanlage: { label: "Aluminium-Außensysteme", status: "meistens genehmigungsfrei", statusClass: "green",
        bedingung: "bis 30 m²", hinweis: "", abstand: "mind. 3 m." }
    }
  },

  "Schleswig-Holstein": {
    kuerzel: "SH", gesetz: "LBO SH §63", gesetzLink: "https://www.gesetze-rechtsprechung.sh.juris.de",
    produkte: {
      terrassenueberdachung: { label: "Terrassenüberdachung", status: "meistens genehmigungsfrei", statusClass: "green",
        bedingung: "bis 30 m², angebaut an Wohngebäude", hinweis: "Abstandsflächen beachten.", abstand: "mind. 3 m." },
      carport: { label: "Carport", status: "meistens genehmigungsfrei", statusClass: "green",
        bedingung: "bis 30 m²", hinweis: "", abstand: "Grenzbau bis 9 m möglich." },
      kaltwintergarten: { label: "Kaltwintergarten", status: "kommt auf die Ausführung an", statusClass: "yellow",
        bedingung: "unbeheizt kann verfahrensfrei sein, beheizt immer genehmigungspflichtig", hinweis: "Grenzwerte beim Bauamt erfragen.", abstand: "mind. 3 m." },
      glasschiebeanlage: { label: "Glasschiebewand", status: "kommt auf die Ausführung an", statusClass: "yellow",
        bedingung: "Prüfung erforderlich", hinweis: "", abstand: "Wie Hauptkonstruktion." },
      aussenanlage: { label: "Aluminium-Außensysteme", status: "meistens genehmigungsfrei", statusClass: "green",
        bedingung: "Offene Systeme i. d. R. frei", hinweis: "", abstand: "mind. 3 m." }
    }
  },

  "Saarland": {
    kuerzel: "SL", gesetz: "LBO Saarland §61", gesetzLink: "https://recht.saarland.de",
    produkte: {
      terrassenueberdachung: { label: "Terrassenüberdachung", status: "meistens genehmigungsfrei", statusClass: "green",
        bedingung: "bis 50 m² GF und 4,50 m Höhe", hinweis: "Abstandsflächen beachten.", abstand: "mind. 3 m." },
      carport: { label: "Carport", status: "meistens genehmigungsfrei", statusClass: "green",
        bedingung: "bis 50 m²", hinweis: "Grenzbau bis 9 m.", abstand: "Grenzbau möglich." },
      kaltwintergarten: { label: "Kaltwintergarten", status: "kommt auf die Ausführung an", statusClass: "yellow",
        bedingung: "unbeheizt bis 50 m² ggf. verfahrensfrei, beheizt immer genehmigungspflichtig", hinweis: "Grenzwerte beim Bauamt bestätigen lassen.", abstand: "mind. 3 m." },
      glasschiebeanlage: { label: "Glasschiebewand", status: "meistens genehmigungsfrei", statusClass: "green",
        bedingung: "Als Zubehör genehmigungsfrei", hinweis: "Vollverglasung prüfen.", abstand: "Wie Hauptkonstruktion." },
      aussenanlage: { label: "Aluminium-Außensysteme", status: "meistens genehmigungsfrei", statusClass: "green",
        bedingung: "bis 50 m² genehmigungsfrei", hinweis: "", abstand: "mind. 3 m." }
    }
  },

  "Hamburg": {
    kuerzel: "HH", gesetz: "HBauO §60", gesetzLink: "https://www.landesrecht-hamburg.de",
    produkte: {
      terrassenueberdachung: { label: "Terrassenüberdachung", status: "kommt auf die Ausführung an", statusClass: "yellow",
        bedingung: "Einstufung im Einzelfall – in Hamburg gelten wegen der dichten Bebauung oft Bebauungspläne und Erhaltungssatzungen", hinweis: "Vor der Planung beim zuständigen Bezirksamt klären, ob das Vorhaben verfahrensfrei ist.", abstand: "mind. 3 m." },
      carport: { label: "Carport", status: "kommt auf die Ausführung an", statusClass: "yellow",
        bedingung: "Einstufung im Einzelfall – beim Bezirksamt klären", hinweis: "Auch verfahrensfreie Vorhaben müssen Bebauungsplan und Abstandsflächen einhalten.", abstand: "mind. 3 m." },
      kaltwintergarten: { label: "Kaltwintergarten", status: "kommt auf die Ausführung an", statusClass: "yellow",
        bedingung: "beheizt immer genehmigungspflichtig, unbeheizt im Einzelfall klären", hinweis: "Vor der Planung beim Bezirksamt nachfragen.", abstand: "mind. 3 m." },
      glasschiebeanlage: { label: "Glasschiebewand", status: "kommt auf die Ausführung an", statusClass: "yellow",
        bedingung: "Einstufung im Einzelfall – beim Bezirksamt klären", hinweis: "Vollverglasung kann als Wintergarten gewertet werden.", abstand: "mind. 3 m." },
      aussenanlage: { label: "Aluminium-Außensysteme", status: "kommt auf die Ausführung an", statusClass: "yellow",
        bedingung: "Markisen genehmigungsfrei, Überdachungen genehmigungspflichtig", hinweis: "Im Zweifel Bauamt anfragen.", abstand: "mind. 3 m." }
    }
  },

  "Berlin": {
    kuerzel: "BE", gesetz: "BauO Berlin §62", gesetzLink: "https://gesetze.berlin.de/bsbe/document/jlr-BauOBErahmen",
    produkte: {
      terrassenueberdachung: { label: "Terrassenüberdachung", status: "kommt auf die Ausführung an", statusClass: "yellow",
        bedingung: "Einstufung im Einzelfall – in Berlin gelten wegen der dichten Bebauung oft Bebauungspläne und Erhaltungssatzungen", hinweis: "Vor der Planung beim zuständigen Bezirksamt klären, ob das Vorhaben verfahrensfrei ist.", abstand: "mind. 3 m." },
      carport: { label: "Carport", status: "kommt auf die Ausführung an", statusClass: "yellow",
        bedingung: "Einstufung im Einzelfall – beim Bezirksamt klären", hinweis: "Auch verfahrensfreie Vorhaben müssen Bebauungsplan und Abstandsflächen einhalten.", abstand: "mind. 3 m." },
      kaltwintergarten: { label: "Kaltwintergarten", status: "kommt auf die Ausführung an", statusClass: "yellow",
        bedingung: "beheizt immer genehmigungspflichtig, unbeheizt im Einzelfall klären", hinweis: "Vor der Planung beim Bezirksamt nachfragen.", abstand: "mind. 3 m." },
      glasschiebeanlage: { label: "Glasschiebewand", status: "kommt auf die Ausführung an", statusClass: "yellow",
        bedingung: "Einstufung im Einzelfall – beim Bezirksamt klären", hinweis: "Vollverglasung kann als Wintergarten gewertet werden.", abstand: "mind. 3 m." },
      aussenanlage: { label: "Aluminium-Außensysteme", status: "kommt auf die Ausführung an", statusClass: "yellow",
        bedingung: "Markisen genehmigungsfrei, feste Konstruktionen meist genehmigungspflichtig", hinweis: "Bauamt anfragen.", abstand: "mind. 3 m." }
    }
  },

  "Bremen": {
    kuerzel: "HB", gesetz: "BremLBO §61", gesetzLink: "https://www.transparenz.bremen.de",
    produkte: {
      terrassenueberdachung: { label: "Terrassenüberdachung", status: "meistens genehmigungsfrei", statusClass: "green",
        bedingung: "bis 40 m² im Innenbereich", hinweis: "Abstandsflächen beachten.", abstand: "mind. 3 m." },
      carport: { label: "Carport", status: "meistens genehmigungsfrei", statusClass: "green",
        bedingung: "bis 40 m²", hinweis: "", abstand: "Grenzbau bis 9 m möglich." },
      kaltwintergarten: { label: "Kaltwintergarten", status: "kommt auf die Ausführung an", statusClass: "yellow",
        bedingung: "unbeheizt kann verfahrensfrei sein, beheizt immer genehmigungspflichtig", hinweis: "Grenzwerte beim Bauamt erfragen.", abstand: "mind. 3 m." },
      glasschiebeanlage: { label: "Glasschiebewand", status: "kommt auf die Ausführung an", statusClass: "yellow",
        bedingung: "Prüfung erforderlich", hinweis: "", abstand: "Wie Hauptkonstruktion." },
      aussenanlage: { label: "Aluminium-Außensysteme", status: "meistens genehmigungsfrei", statusClass: "green",
        bedingung: "bis 40 m²", hinweis: "", abstand: "mind. 3 m." }
    }
  }
};

/** Bundesland aus Nominatim-State ermitteln */
function getBundesland(stateStr) {
  if (!stateStr) return null;
  const s = stateStr.trim();
  const map = {
    "Rheinland-Pfalz": "Rheinland-Pfalz",
    "Nordrhein-Westfalen": "Nordrhein-Westfalen",
    "North Rhine-Westphalia": "Nordrhein-Westfalen",
    "Hessen": "Hessen",
    "Hesse": "Hessen",
    "Baden-Württemberg": "Baden-Württemberg",
    "Bayern": "Bayern",
    "Bavaria": "Bayern",
    "Niedersachsen": "Niedersachsen",
    "Lower Saxony": "Niedersachsen",
    "Sachsen": "Sachsen",
    "Saxony": "Sachsen",
    "Brandenburg": "Brandenburg",
    "Thüringen": "Thüringen",
    "Thuringia": "Thüringen",
    "Sachsen-Anhalt": "Sachsen-Anhalt",
    "Saxony-Anhalt": "Sachsen-Anhalt",
    "Mecklenburg-Vorpommern": "Mecklenburg-Vorpommern",
    "Schleswig-Holstein": "Schleswig-Holstein",
    "Saarland": "Saarland",
    "Hamburg": "Hamburg",
    "Berlin": "Berlin",
    "Bremen": "Bremen"
  };
  return map[s] || null;
}
