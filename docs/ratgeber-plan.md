# Ratgeber als Leadmagnet: Plan

Stand 26.11.2026. Entscheidungen mit Wortlaut in `docs/entscheidungen.md`.
Hausregeln, Gestaltung und Bauablauf: `.claude/skills/ratgeber-pdf/SKILL.md`.

## Ziel

Besucher der Ortsseiten und der Ratgeber-Übersicht bekommen einen
ausführlichen PDF-Ratgeber gegen E-Mail-Adresse und Einwilligung. BV
erhält die Anfrage mit dem gewählten Ratgeber und fasst nach 1 bis 2
Tagen nach (E-Mail; Anruf nur mit eigener Einwilligung).

## Die drei Ratgeber

| Nr. | Thema | Stand |
|---|---|---|
| 1 | Terrassendach & Kaltwintergarten (mit Sonnenschutz, Markisen, Seitenwänden) | Text in Arbeit |
| 2 | Carport & Vordach | offen |
| 3 | Pergola & Lamellendach | offen |

Reihenfolge nach Seitenaufrufen 03. bis 26.11.2026 (Terrassendach 59,
Carport/Vordach 24, Pergola/Lamellen 6; alle unter 100, also nur ein
Hinweis). Geländer, Fassade, Balkon, Garten: je eine Seite „Rund ums Haus".

## Ablauf für den Besucher

1. Kasten mit den drei Titelblättern auf den 14 Ortsseiten und in
   `/ratgeber/`; der passende Ratgeber steht vorn.
2. Formular: Ratgeber wählen (einer, mehrere, alle), Name, E-Mail, PLZ
   freiwillig, Telefon freiwillig, Einwilligung (Pflicht), Rückruf
   (freiwillig, eigene Checkbox).
3. Kunde erhält eine E-Mail mit persönlichem Download-Link (bestätigt
   zugleich die Adresse). BV erhält sofort eine E-Mail mit allen Angaben
   und der Herkunftsseite; Speicherung in der Anfragen-Datenbank.
4. Optional: Erinnerung an BV am zweiten Tag.

## Technik (geplant, nichts davon gebaut)

- PDFs in einem **privaten** Speicher (Cloudflare R2), Auslieferung nur
  über den persönlichen Link aus dem Worker. Nicht ins öffentliche Repo.
- Versand an den Kunden braucht einen Mail-Dienst (Web3Forms kostenlos
  sendet nur an BV). DNS-Einträge dafür nur nach Ja des Betreibers.
- Links im PDF tragen `utm_source=ratgeber`; die vorhandene Messung liest
  das bereits aus.

## Freigabe-Hindernisse (vor dem Start zu klären)

- Anwalt: Kopplung von Download und Nachfass-Einwilligung; Einwilligung
  für Anrufe; Ergänzung der Datenschutzerklärung (neuer Zweck, neuer
  Mail-Dienst, Auftragsverarbeitung). Rechtstexte ändert Claude nicht.
- Hinweistext auf der Rückseite der Ratgeber.

## Werkzeuge

Skills: `ratgeber-pdf`, `copywriting`, `copy-editing`, `lead-magnets`,
`humanizer`, `document-design`, `fact-check-workflow`. Agenten:
`ratgeber-redakteur`, `ratgeber-lektor`, `ratgeber-faktenpruefer`,
`ratgeber-gestaltungspruefer`, dazu `conversion-psychology-auditor`.
Neue Agenten erscheinen erst nach einem Neustart der Sitzung als eigener
Typ; bis dahin als allgemeiner Agent mit Verweis auf die Agentendatei.
