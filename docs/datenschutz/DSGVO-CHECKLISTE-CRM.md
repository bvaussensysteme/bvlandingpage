# DSGVO-Checkliste – CRM / Unternehmensplattform BV AussenSysteme

> **Zweck:** Praktische Schritt-für-Schritt-Liste, damit die Verarbeitung von
> Kundendaten im CRM rechtskonform ist.
> **Wichtig:** Dies ist **keine Rechtsberatung**. Für Kundendaten lohnt sich ein
> einmaliger kurzer Check mit einem Datenschutz-Berater (v. a. VVT + AVVs).
> Stand: 2026-07-28.

---

## Kernaussage
Rechtskonformität hängt **nicht** am Serverstandort, sondern an den Schritten unten.
Mit **Neon (Frankfurt) + unterschriebenem AVV** ist der Datenstandort bereits sauber.
Die Compliance steckt in **Papierkram + Sicherheit** – die brauchst du unabhängig vom Anbieter.

---

## 1. Rechtsgrundlage der Verarbeitung (Art. 6 DSGVO)
- [ ] Klar, warum du die Daten verarbeitest:
  - Kundenanfragen / Angebote → **Art. 6 Abs. 1 b** (Vertrag/Vertragsanbahnung)
  - Newsletter/Marketing (falls) → **Art. 6 Abs. 1 a** (Einwilligung)
  - Speicherung zur Organisation → **Art. 6 Abs. 1 f** (berechtigtes Interesse)
- [ ] Im Kontaktformular ist die **Datenschutz-Zustimmung** gesetzt (✅ vorhanden)

## 2. Auftragsverarbeitungsverträge / AVV (Art. 28)
Mit **jedem** Dienstleister abschließen, der Kundendaten berührt. Siehe Liste unten.
- [ ] AVV mit **Neon** (Datenbank) abgeschlossen
- [ ] AVV mit **IONOS** (Server/Domain/E-Mail) abgeschlossen
- [ ] AVV/Terms mit **Web3Forms** und **Formspree** (E-Mail-Weiterleitung Website)
- [ ] AVV mit **Cloudflare** (Hosting/DNS Website)
- [ ] AVVs mit ggf. **Google** (Ads/Business Profile), **Metricool**, **sipgate**
- [ ] AVV-Dokumente **abgespeichert** (Ordner „Datenschutz/AVV")

## 3. Datenschutzerklärung (Website)
- [ ] Nennt alle Verarbeiter (Neon, Web3Forms, Formspree, Cloudflare …) → ✅ ergänzt
- [ ] Nennt Rechtsgrundlagen und Betroffenenrechte

## 4. Verzeichnis von Verarbeitungstätigkeiten / VVT (Art. 30) – **Pflicht**
- [ ] Kurze Liste angelegt: welche Daten, wofür, wie lange, wer hat Zugriff, welche Dienstleister
- [ ] → **Vorlage nutzen:** `VVT-VORLAGE.md` (im selben Ordner)

## 5. Technische & organisatorische Maßnahmen / TOMs (Art. 32)
Sicherheit des CRM – das zählt für den Datenschutz **mehr als der Serverstandort**:
- [ ] **Individuelle Logins** pro Mitarbeiter (keine geteilten Zugänge)
- [ ] **2-Faktor-Authentifizierung** aktiv
- [ ] **Rollen/Rechte**: jeder sieht nur, was er braucht
- [ ] **HTTPS** überall (Transportverschlüsselung) → über Cloudflare/Let's Encrypt gratis
- [ ] **Datenbank verschlüsselt** (Neon verschlüsselt „at rest") + **eigener DB-User** fürs CRM mit minimalen Rechten (wie beim Insert-only-User der Website)
- [ ] **Regelmäßige Backups** der Datenbank – und **einmal testweise zurückspielen**
- [ ] **Server-/Software-Updates** eingespielt
- [ ] **Starke Passwörter** + Passwort-Manager, kein Zettel/Chat
- [ ] Optional: **Cloudflare Access** vor das CRM (nur freigeschaltete Mitarbeiter kommen rein)
- [ ] Keine Kundendaten unverschlüsselt auf privaten Handys/Laptops
- [ ] TOMs **kurz dokumentiert** (1 Seite genügt)

## 6. Speicherdauer & Löschkonzept
- [ ] Festlegen, **wie lange** Daten aufbewahrt werden:
  - Reine Anfragen ohne Auftrag → nach Bearbeitung/Absage **löschen** (z. B. nach 6–12 Monaten)
  - Aufträge/Rechnungen → **steuerliche Aufbewahrungsfristen** beachten (i. d. R. 6–10 Jahre)
- [ ] Prozess zum **Löschen** vorhanden (auf Kundenwunsch + nach Fristablauf)

## 7. Betroffenenrechte (Art. 12–22)
- [ ] Du kannst auf Anfrage: **Auskunft** geben, **berichtigen**, **löschen**
- [ ] Klarer Kontaktweg dafür (info@bv-aussensysteme.de) → ✅ vorhanden

## 8. Datenpannen-Meldeprozess (Art. 33)
- [ ] Dir ist bewusst: Eine Datenpanne muss **binnen 72 Stunden** an die zuständige
      Landes-Aufsichtsbehörde (Rheinland-Pfalz: LfDI) gemeldet werden
- [ ] Wer macht was im Ernstfall (kurz notiert)

## 9. Datenschutzbeauftragter – nötig?
- [ ] Geprüft: Ein **betrieblicher DSB ist i. d. R. erst Pflicht ab ~20 Personen**, die
      ständig personenbezogene Daten automatisiert verarbeiten (§ 38 BDSG), oder bei
      besonders risikoreichen Verarbeitungen. → Für ein kleines Team **meist keine Pflicht**,
      aber im Zweifel kurz prüfen (lassen).

---

## AVV-Liste – mit wem einen Vertrag abschließen?
| Dienstleister | Wofür | Status |
|---|---|---|
| **Neon, Inc.** (Frankfurt/EU) | Datenbank (Website + CRM) | AVV/DPA holen & unterschreiben |
| **IONOS** | Server (VPS), Domain, E-Mail | AVV holen |
| **Web3Forms** | E-Mail-Weiterleitung Formular (primär) | Datenschutz/Terms prüfen |
| **Formspree, Inc.** (US, DPF) | E-Mail-Weiterleitung (Backup) | AVV/DPA holen |
| **Cloudflare, Inc.** (US, DPF) | Hosting/DNS/CDN Website **+ R2 (Kundenfotos, EU)** | AVV/DPA holen (deckt auch R2 ab) |
| **Google** (Kalender/Workspace) | **Termine mit Kundenadressen** ⚠️ | **Google-Workspace-DPA** nötig – privates Konto reicht NICHT |
| **Google** (falls Ads/Business Profile) | Werbung / Profil | AVV vorhanden (im Konto) |
| **Metricool / sipgate** (falls genutzt) | Statistik / Telefonie / **SMS-2FA** | AVV holen |

> Tipp: Bei allen genannten Anbietern gibt es den AVV/DPA als **Download oder Klick-Zustimmung**
> im jeweiligen Konto. Einmal machen, abspeichern, fertig.

---

## Nächste konkrete Schritte
1. AVV bei **Neon** und **IONOS** holen & unterschreiben/bestätigen
2. **VVT** ausfüllen (`VVT-VORLAGE.md`)
3. Bei der CRM-Einrichtung die **TOMs** (Abschnitt 5) direkt mit umsetzen
4. **Speicherdauer** je Datenart festlegen
5. Optional: kurzer Check mit Datenschutz-Berater (VVT + AVVs absegnen)
