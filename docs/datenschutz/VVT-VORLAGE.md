# Verzeichnis von Verarbeitungstätigkeiten (VVT) – BV AussenSysteme

> Pflicht nach **Art. 30 DSGVO**. Muss nicht kompliziert sein – diese Vorlage ausfüllen
> und aktuell halten reicht für einen kleinen Betrieb. **Keine Rechtsberatung.**
> Bei Bedarf einem Datenschutz-Berater zum Gegenlesen geben.

## Verantwortlicher (Kopfdaten – einmal ausfüllen)
- **Firma:** Alexander Becker & Josef Voronin GbR (BV AussenSysteme)
- **Anschrift:** _[eintragen]_
- **Kontakt Datenschutz:** info@bv-aussensysteme.de
- **Datenschutzbeauftragter:** _[falls vorhanden – sonst „nicht bestellt (nicht erforderlich)"]_

---

## Verarbeitungstätigkeit 1: Kundenanfragen / Angebote (Website-Formular & CRM)

| Feld | Eintrag |
|---|---|
| **Zweck** | Bearbeitung von Anfragen, Erstellung von Angeboten, Kundenkommunikation |
| **Betroffene** | Interessenten und Kunden |
| **Datenkategorien** | Name, E-Mail, Telefon, PLZ/Ort, Produktwunsch, Nachricht/Konfiguration |
| **Rechtsgrundlage** | Art. 6 Abs. 1 b (Vertrag/Vertragsanbahnung); Einwilligung fürs Formular |
| **Empfänger / Verarbeiter** | Neon (Datenbank, Frankfurt), Web3Forms + Formspree (E-Mail), IONOS (Server/Mail), Cloudflare (Website) |
| **Speicherdauer** | Anfragen ohne Auftrag: _[z. B. 6–12 Monate]_; Aufträge/Rechnungen: 6–10 Jahre (steuerlich) |
| **Drittlandübermittlung** | Neon/Cloudflare/Formspree = US-Firmen; abgesichert über AVV + Standardvertragsklauseln / DPF |
| **TOMs (Sicherheit)** | Logins pro Mitarbeiter, 2-Faktor, Rollen/Rechte, HTTPS, DB-Verschlüsselung, Backups |

---

## Verarbeitungstätigkeit 2: Kundenfotos (CRM → Cloudflare R2)
| Feld | Eintrag |
|---|---|
| **Zweck** | Speicherung von Kundenfotos (z. B. Fotos der Terrasse/Baustelle) zur Planung & Angebotserstellung |
| **Betroffene** | Interessenten und Kunden |
| **Datenkategorien** | Bilddateien (ggf. mit erkennbarem Grundstück/Haus), der Anfrage zugeordnet |
| **Rechtsgrundlage** | Art. 6 Abs. 1 b (Vertrag/Vertragsanbahnung) |
| **Empfänger / Verarbeiter** | **Cloudflare R2** (Objektspeicher, EU-Region) |
| **Speicherdauer** | _[z. B. bis Projektabschluss + X Monate, dann löschen]_ |
| **Drittlandübermittlung** | Cloudflare = US-Firma; Speicherung in EU, abgesichert über AVV + Standardvertragsklauseln / DPF |
| **TOMs (Sicherheit)** | Zugriff nur für Mitarbeiter (Login/Rollen), verschlüsselte Übertragung (HTTPS), Zugriffsrechte |

---

## Verarbeitungstätigkeit 3: Terminverwaltung (Google Kalender)
| Feld | Eintrag |
|---|---|
| **Zweck** | Terminplanung (Aufmaß, Montage) mit Kunden |
| **Betroffene** | Kunden |
| **Datenkategorien** | Name, **Adresse**, Termindaten, ggf. Telefon |
| **Rechtsgrundlage** | Art. 6 Abs. 1 b (Vertrag/Vertragsanbahnung) |
| **Empfänger / Verarbeiter** | **Google** (Google Kalender / Google Workspace) |
| **Speicherdauer** | _[z. B. nach Terminabschluss + X löschen/archivieren]_ |
| **Drittlandübermittlung** | Google = US-Firma (DPF-zertifiziert); AVV erforderlich |
| **TOMs (Sicherheit)** | Zugriff nur berechtigte Personen, **2-Faktor auf dem Google-Konto**, kein Teilen nach außen |

> ⚠️ **WICHTIG – Google-Kalender mit Kundendaten:** Für die Verarbeitung **fremder**
> personenbezogener Daten (Kundenadressen) brauchst du ein **Google-**
> **Workspace-Konto (Business) mit abgeschlossenem AVV/DPA**. Ein **privates/kostenloses**
> Google-Konto bietet **keinen AVV** und ist dafür **nicht** geeignet. Falls die Termine
> aktuell in einem privaten Google-Konto liegen → auf Workspace umstellen **oder** die
> Termine im CRM selbst verwalten (dann bleibt alles bei Neon/Cloudflare-R2).

---

## Verarbeitungstätigkeit 4: _[z. B. Buchhaltung / Rechnungen]_
| Feld | Eintrag |
|---|---|
| **Zweck** | _[eintragen]_ |
| **Betroffene** | _[eintragen]_ |
| **Datenkategorien** | _[eintragen]_ |
| **Rechtsgrundlage** | _[eintragen]_ |
| **Empfänger / Verarbeiter** | _[eintragen]_ |
| **Speicherdauer** | _[eintragen]_ |
| **Drittlandübermittlung** | _[eintragen]_ |
| **TOMs (Sicherheit)** | _[eintragen]_ |

---

_Bei neuen Datenverarbeitungen (z. B. neues Tool) einfach einen weiteren Block ergänzen._
