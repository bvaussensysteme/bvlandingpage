import { Link } from "react-router-dom";

export default function Datenschutz() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 bg-stone-50 py-12 sm:py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm p-8 sm:p-12">
            <h1 className="text-4xl font-bold text-slate-900 mb-8">
              Datenschutzerklärung
            </h1>

            <div className="prose prose-sm sm:prose max-w-none">
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">
                  Allgemeines
                </h2>
                <p className="text-slate-700 text-sm leading-relaxed">
                  Wir nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Diese
                  Datenschutzerklärung klärt Sie auf, wie wir mit Ihren Daten
                  umgehen, wenn Sie unsere Website besuchen.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">
                  Verantwortliche Stelle
                </h2>
                <p className="text-slate-700 text-sm">
                  <strong>B&V Aussensysteme</strong>
                  <br />
                  Alexander Becker
                  <br />
                  Am Driesch 1
                  <br />
                  56428 Dernbach
                  <br />
                  Rheinland-Pfalz
                  <br />
                  Deutschland
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">
                  Erfassung personenbezogener Daten
                </h2>
                <p className="text-slate-700 text-sm leading-relaxed">
                  Wenn Sie unsere Website besuchen, können wir automatisch
                  Informationen über Ihren Browser erfassen, wie z.B. Ihr
                  Betriebssystem, Ihren Internetprovider und Ihre IP-Adresse.
                  Diese Informationen werden verwendet, um unsere Website zu
                  verbessern und zu analysieren.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">
                  Verwendung von Cookies
                </h2>
                <p className="text-slate-700 text-sm leading-relaxed">
                  Unsere Website verwendet Cookies, um das Benutzererlebnis zu
                  verbessern. Sie können Ihren Browser so einstellen, dass Sie
                  benachrichtigt werden, wenn ein Cookie gesendet wird, oder um
                  Cookies abzulehnen.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">
                  Ihre Rechte
                </h2>
                <p className="text-slate-700 text-sm leading-relaxed">
                  Sie haben das Recht, Auskunft über die von uns gespeicherten
                  Daten zu erhalten, diese zu berichtigen, zu löschen oder deren
                  Verarbeitung einzuschränken. Für Anfragen wenden Sie sich bitte
                  an uns über unsere Kontaktinformationen.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-slate-900 mb-4">
                  Kontakt
                </h2>
                <p className="text-slate-700 text-sm">
                  Bei Fragen zur Datenschutzerklärung kontaktieren Sie uns unter:{" "}
                  <a
                    href="mailto:info@bv-aussensysteme.de"
                    className="text-green-700 hover:text-green-800"
                  >
                    info@bv-aussensysteme.de
                  </a>
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-brand-anthracite text-white py-10 border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-center items-center gap-8 text-sm">
            <Link
              to="/impressum"
              className="hover:text-brand-soft-leaf transition-colors"
            >
              Impressum
            </Link>
            <div className="w-px h-5 bg-gray-600 hidden sm:block" />
            <Link
              to="/datenschutz"
              className="hover:text-brand-soft-leaf transition-colors"
            >
              Datenschutz
            </Link>
            <div className="w-px h-5 bg-gray-600 hidden sm:block" />
            <Link
              to="/kontakt"
              className="hover:text-brand-soft-leaf transition-colors"
            >
              Kontakt
            </Link>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-700 text-center text-xs text-gray-400">
            <p>© 2026 B&V Aussensysteme. Alle Rechte vorbehalten.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
