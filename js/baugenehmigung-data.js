/**
 * BV AussenSysteme – Baugenehmigung Daten-Modul
 * Quelle: Landesbauordnungen (LBO) der 16 Bundesländer
 * Stand: 2025/2026 | Ohne Gewähr – Angaben dienen nur der Orientierung
 */

const LBO_DATA = {

  /* ─────────────────────────────────────────────────────────
     RHEINLAND-PFALZ  (Heimat-Bundesland von BV AussenSysteme)
     LBO RLP §62 Abs.1 Nr.1  ─────────────────────────────── */
  "Rheinland-Pfalz": {
    kuerzel: "RLP",
    gesetz: "LBO RLP §62 Abs. 1 Nr. 1",
    gesetzLink: "https://landesrecht.rlp.de/bsrp/document/jlr-BauORPrahmen",
    produkte: {
      terrassenueberdachung: {
        label: "Terrassenüberdachung",
        status: "meistens genehmigungsfrei",
        statusClass: "green",
        bedingung: "bis 50 m² Grundfläche und bis 4,50 m Wandhöhe, eingeschossig, an bestehendem Wohngebäude",
        hinweis: "Im Außenbereich (§35 BauGB) immer genehmigungspflichtig. Im Geltungsbereich eines B-Plans können abweichende Festsetzungen gelten.",
        abstand: "Abstandsflächen nach §8 LBO RLP: mind. 3 m zur Nachbargrenze, außer bei Grenzbebauung mit Zustimmung."
      },
      carport: {
        label: "Carport",
        status: "meistens genehmigungsfrei",
        statusClass: "green",
        bedingung: "bis 50 m² Grundfläche, eingeschossig, keine Aufenthaltsräume",
        hinweis: "Grenzgaragen bis 9 m Länge und 3 m Wandhöhe zulässig. Stellplatznachweis prüfen.",
        abstand: "Grenzbau möglich bis 9 m Länge an einer Seite. Sonst mind. 3 m."
      },
      kaltwintergarten: {
        label: "Kaltwintergarten / Glasanbau",
        status: "genehmigungspflichtig",
        statusClass: "yellow",
        bedingung: "Kaltwintergärten bis 50 m² oft genehmigungsfrei, sobald beheizt = immer genehmigungspflichtig",
        hinweis: "Unbeheizte Kaltwintergärten können unter §62 fallen. Beheizte Wintergärten = eigenständiges Gebäude, immer Baugenehmigung erforderlich.",
        abstand: "Mind. 3 m zur Nachbargrenze, Ausnahmen bei zulässiger Grenzbebauung."
      },
      glasschiebeanlage: {
        label: "Glasschiebewand / -anlage",
        status: "meistens genehmigungsfrei",
        statusClass: "green",
        bedingung: "Als Zubehör zu bestehender Überdachung i. d. R. genehmigungsfrei, wenn Grundriss unverändert",
        hinweis: "Werden Schiebewände dauerhaft verbaut und verändern sie den Grundriss, kann Genehmigungspflicht entstehen. Im Zweifel Bauamt anfragen.",
        abstand: "Abstandsflächen der Hauptkonstruktion gelten."
      },
      aussenanlage: {
        label: "Aluminium-Außensysteme (Pergola, Lamellendach, Markisen)",
        status: "meistens genehmigungsfrei",
        statusClass: "green",
        bedingung: "Markisen, Terrassenmarkisen und Sonnenschutz bis 50 m² i. d. R. genehmigungsfrei; offene Pergolen oft genehmigungsfrei",
        hinweis: "Pergolen mit massivem Dach (Polycarbonat/Glas) werden wie Überdachungen behandelt. Offene Lamellenpergolen (ohne festes Dach) meist verfahrensfrei.",
        abstand: "Je nach Ausführung wie Terrassenüberdachung."
      }
    }
  },

  /* ─────────────────── NORDRHEIN-WESTFALEN ──────────────── */
  "Nordrhein-Westfalen": {
    kuerzel: "NRW",
    gesetz: "BauO NRW §62 Abs. 1",
    gesetzLink: "https://recht.nrw.de/lmi/owa/br_text_anzeigen?v_id=10000000000000000735",
    produkte: {
      terrassenueberdachung: {
        label: "Terrassenüberdachung",
        status: "meistens genehmigungsfrei",
        statusClass: "green",
        bedingung: "bis 30 m² Grundfläche und 5 m Höhe, angebaut an Wohngebäude, Innenbereich",
        hinweis: "Ab 30 m² Genehmigung erforderlich. Im B-Plan-Gebiet ggf. Befreiung notwendig.",
        abstand: "mind. 3 m zur Grundstücksgrenze."
      },
      carport: {
        label: "Carport",
        status: "meistens genehmigungsfrei",
        statusClass: "green",
        bedingung: "bis 30 m² Grundfläche, Nutzung als Stellplatz, keine Aufenthaltsräume",
        hinweis: "Grenzgaragen bis 9 m Länge und 3 m Wandhöhe zulässig.",
        abstand: "Grenzbau bis 9 m möglich."
      },
      kaltwintergarten: {
        label: "Kaltwintergarten / Glasanbau",
        status: "genehmigungspflichtig",
        statusClass: "red",
        bedingung: "Wintergärten (auch unbeheizt) in NRW grundsätzlich genehmigungspflichtig",
        hinweis: "Auch kleine unbeheizte Anbauten gelten als Wintergarten und sind genehmigungspflichtig. Frühzeitig Bauamt kontaktieren.",
        abstand: "mind. 3 m zur Grundstücksgrenze."
      },
      glasschiebeanlage: {
        label: "Glasschiebewand / -anlage",
        status: "abhängig von Ausführung",
        statusClass: "yellow",
        bedingung: "Als bewegliche Verglasung zu bestehender Überdachung oft genehmigungsfrei",
        hinweis: "Vollverglasung einer Terrasse kann als Wintergarten gewertet werden → genehmigungspflichtig.",
        abstand: "Wie Hauptkonstruktion."
      },
      aussenanlage: {
        label: "Aluminium-Außensysteme",
        status: "meistens genehmigungsfrei",
        statusClass: "green",
        bedingung: "Markisen, Beschattungen und offene Pergolen bis 30 m² i. d. R. genehmigungsfrei",
        hinweis: "Feste Überdachungen über 30 m² benötigen Genehmigung.",
        abstand: "Wie Terrassenüberdachung."
      }
    }
  },

  /* ──────────────────────── HESSEN ──────────────────────── */
  "Hessen": {
    kuerzel: "HE",
    gesetz: "HBO §63 Abs. 1 Nr. 1",
    gesetzLink: "https://www.rv.hessenrecht.hessen.de/bshe/document/jlr-BauOHE2018rahmen",
    produkte: {
      terrassenueberdachung: {
        label: "Terrassenüberdachung",
        status: "meistens genehmigungsfrei",
        statusClass: "green",
        bedingung: "bis 50 m² Grundfläche, bis 5 m Höhe, angebaut oder freistehend im Innenbereich",
        hinweis: "Im Außenbereich grundsätzlich genehmigungspflichtig. B-Plan-Festsetzungen beachten.",
        abstand: "mind. 3 m zur Grundstücksgrenze (HBO §6)."
      },
      carport: {
        label: "Carport",
        status: "meistens genehmigungsfrei",
        statusClass: "green",
        bedingung: "bis 50 m², max. 2 Stellplätze, keine Aufenthaltsräume",
        hinweis: "Grenzgaragen bis 9 m Länge zulässig.",
        abstand: "Grenzbau bis 9 m möglich."
      },
      kaltwintergarten: {
        label: "Kaltwintergarten",
        status: "genehmigungspflichtig",
        statusClass: "yellow",
        bedingung: "Unbeheizte Wintergärten bis 50 m² ggf. genehmigungsfrei, beheizte immer genehmigungspflichtig",
        hinweis: "Klärung mit Bauamt empfohlen, da Definition 'Kaltwintergarten' unterschiedlich ausgelegt wird.",
        abstand: "mind. 3 m."
      },
      glasschiebeanlage: {
        label: "Glasschiebewand / -anlage",
        status: "meistens genehmigungsfrei",
        statusClass: "green",
        bedingung: "Als Zubehör zur Überdachung genehmigungsfrei, wenn keine neuen Aufenthaltsräume entstehen",
        hinweis: "Vollverglasung kann als Wintergarten eingestuft werden.",
        abstand: "Wie Hauptkonstruktion."
      },
      aussenanlage: {
        label: "Aluminium-Außensysteme",
        status: "meistens genehmigungsfrei",
        statusClass: "green",
        bedingung: "Markisen, offene Pergolen, Terrassenüberdachungen bis 50 m² i. d. R. genehmigungsfrei",
        hinweis: "Feste Konstruktionen wie Glasdächer ab 50 m² genehmigungspflichtig.",
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
        status: "genehmigungspflichtig",
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
        status: "genehmigungspflichtig",
        statusClass: "yellow",
        bedingung: "Unbeheizte bis 75 m³ BRI ggf. genehmigungsfrei, beheizte immer Genehmigung",
        hinweis: "Wintergärten gelten als Aufenthaltsräume und erfordern in Bayern meist eine Baugenehmigung.",
        abstand: "mind. 3 m."
      },
      glasschiebeanlage: {
        label: "Glasschiebewand / -anlage",
        status: "abhängig von Ausführung",
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
      kaltwintergarten: { label: "Kaltwintergarten", status: "genehmigungspflichtig", statusClass: "yellow",
        bedingung: "Wintergärten grundsätzlich genehmigungspflichtig", hinweis: "Frühzeitig Bauamt kontaktieren.", abstand: "mind. 3 m." },
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
      kaltwintergarten: { label: "Kaltwintergarten", status: "genehmigungspflichtig", statusClass: "yellow",
        bedingung: "Wintergärten grundsätzlich genehmigungspflichtig", hinweis: "Frühzeitig Bauamt anfragen.", abstand: "mind. 3 m." },
      glasschiebeanlage: { label: "Glasschiebewand", status: "abhängig von Ausführung", statusClass: "yellow",
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
      kaltwintergarten: { label: "Kaltwintergarten", status: "genehmigungspflichtig", statusClass: "red",
        bedingung: "Wintergärten genehmigungspflichtig", hinweis: "Bauamt anfragen.", abstand: "mind. 3 m." },
      glasschiebeanlage: { label: "Glasschiebewand", status: "abhängig von Ausführung", statusClass: "yellow",
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
      kaltwintergarten: { label: "Kaltwintergarten", status: "genehmigungspflichtig", statusClass: "yellow",
        bedingung: "Meist genehmigungspflichtig, unbeheizt bis 50 m² ggf. frei", hinweis: "Bauamt anfragen.", abstand: "mind. 3 m." },
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
      kaltwintergarten: { label: "Kaltwintergarten", status: "genehmigungspflichtig", statusClass: "yellow",
        bedingung: "Meist genehmigungspflichtig", hinweis: "Bauamt anfragen.", abstand: "mind. 3 m." },
      glasschiebeanlage: { label: "Glasschiebewand", status: "abhängig von Ausführung", statusClass: "yellow",
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
      kaltwintergarten: { label: "Kaltwintergarten", status: "genehmigungspflichtig", statusClass: "red",
        bedingung: "Wintergärten genehmigungspflichtig", hinweis: "Bauamt anfragen.", abstand: "mind. 3 m." },
      glasschiebeanlage: { label: "Glasschiebewand", status: "abhängig von Ausführung", statusClass: "yellow",
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
      kaltwintergarten: { label: "Kaltwintergarten", status: "genehmigungspflichtig", statusClass: "yellow",
        bedingung: "Meist genehmigungspflichtig", hinweis: "Bauamt anfragen.", abstand: "mind. 3 m." },
      glasschiebeanlage: { label: "Glasschiebewand", status: "abhängig von Ausführung", statusClass: "yellow",
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
      kaltwintergarten: { label: "Kaltwintergarten", status: "genehmigungspflichtig", statusClass: "yellow",
        bedingung: "Unbeheizte bis 50 m² ggf. frei", hinweis: "Bauamt anfragen.", abstand: "mind. 3 m." },
      glasschiebeanlage: { label: "Glasschiebewand", status: "meistens genehmigungsfrei", statusClass: "green",
        bedingung: "Als Zubehör genehmigungsfrei", hinweis: "Vollverglasung prüfen.", abstand: "Wie Hauptkonstruktion." },
      aussenanlage: { label: "Aluminium-Außensysteme", status: "meistens genehmigungsfrei", statusClass: "green",
        bedingung: "bis 50 m² genehmigungsfrei", hinweis: "", abstand: "mind. 3 m." }
    }
  },

  "Hamburg": {
    kuerzel: "HH", gesetz: "HBauO §60", gesetzLink: "https://www.landesrecht-hamburg.de",
    produkte: {
      terrassenueberdachung: { label: "Terrassenüberdachung", status: "genehmigungspflichtig", statusClass: "red",
        bedingung: "In Hamburg grundsätzlich genehmigungspflichtig", hinweis: "Durch die hohe Bebauungsdichte gelten strenge Regeln. Bauamt immer kontaktieren.", abstand: "mind. 3 m." },
      carport: { label: "Carport", status: "genehmigungspflichtig", statusClass: "red",
        bedingung: "In Hamburg grundsätzlich genehmigungspflichtig", hinweis: "Bauamt kontaktieren.", abstand: "mind. 3 m." },
      kaltwintergarten: { label: "Kaltwintergarten", status: "genehmigungspflichtig", statusClass: "red",
        bedingung: "Immer genehmigungspflichtig", hinweis: "Bauamt kontaktieren.", abstand: "mind. 3 m." },
      glasschiebeanlage: { label: "Glasschiebewand", status: "genehmigungspflichtig", statusClass: "red",
        bedingung: "Prüfung erforderlich", hinweis: "Bauamt kontaktieren.", abstand: "mind. 3 m." },
      aussenanlage: { label: "Aluminium-Außensysteme", status: "abhängig von Ausführung", statusClass: "yellow",
        bedingung: "Markisen genehmigungsfrei, Überdachungen genehmigungspflichtig", hinweis: "Im Zweifel Bauamt anfragen.", abstand: "mind. 3 m." }
    }
  },

  "Berlin": {
    kuerzel: "BE", gesetz: "BauO Berlin §62", gesetzLink: "https://gesetze.berlin.de/bsbe/document/jlr-BauOBErahmen",
    produkte: {
      terrassenueberdachung: { label: "Terrassenüberdachung", status: "genehmigungspflichtig", statusClass: "red",
        bedingung: "In Berlin grundsätzlich genehmigungspflichtig", hinweis: "Ausnahmen möglich im Innenbereich. Bauamt anfragen.", abstand: "mind. 3 m." },
      carport: { label: "Carport", status: "genehmigungspflichtig", statusClass: "red",
        bedingung: "Grundsätzlich genehmigungspflichtig", hinweis: "Bauamt kontaktieren.", abstand: "mind. 3 m." },
      kaltwintergarten: { label: "Kaltwintergarten", status: "genehmigungspflichtig", statusClass: "red",
        bedingung: "Immer genehmigungspflichtig", hinweis: "Bauamt kontaktieren.", abstand: "mind. 3 m." },
      glasschiebeanlage: { label: "Glasschiebewand", status: "genehmigungspflichtig", statusClass: "red",
        bedingung: "Prüfung erforderlich", hinweis: "Bauamt kontaktieren.", abstand: "mind. 3 m." },
      aussenanlage: { label: "Aluminium-Außensysteme", status: "abhängig von Ausführung", statusClass: "yellow",
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
      kaltwintergarten: { label: "Kaltwintergarten", status: "genehmigungspflichtig", statusClass: "yellow",
        bedingung: "Meist genehmigungspflichtig", hinweis: "Bauamt anfragen.", abstand: "mind. 3 m." },
      glasschiebeanlage: { label: "Glasschiebewand", status: "abhängig von Ausführung", statusClass: "yellow",
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
