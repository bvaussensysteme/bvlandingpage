import { Link } from "react-router-dom";

export default function Impressum() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 bg-stone-50 py-12 sm:py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm p-8 sm:p-12">
            <h1 className="text-4xl font-bold text-slate-900 mb-8">Impressum</h1>

            <div className="prose prose-sm sm:prose max-w-none space-y-6">
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">
                  Angaben gemäß § 5 DDG
                </h2>
                <p className="text-slate-700 mb-4">
                  <strong>B&V Aussensysteme</strong>
                </p>
                <p className="text-slate-700">
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
                  Kontakt
                </h2>
                <p className="text-slate-700">
                  Kontaktformular:{" "}
                  <a
                    href="bv-aussensysteme.de/kontakt"
                    className="text-brand-forest-green hover:text-brand-soft-leaf"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    http://www.bv-aussensysteme.de/kontakt
                  </a>
                  <br />
                  E-Mail:{" "}
                  <a
                    href="mailto:info@bv-aussensysteme.de"
                    className="text-brand-forest-green hover:text-brand-soft-leaf"
                  >
                    info@bv-aussensysteme.de
                  </a>
                </p>
              </section>


              <section className="mb-8">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">
                  Verbraucherstreitbeilegung (§ 36 VSBG)
                </h2>
                <p className="text-slate-700 text-sm leading-relaxed">
                  Wir sind nicht bereit und nicht verpflichtet, an
                  Streitbeilegungsverfahren vor einer
                  Verbraucherschlichtungsstelle teilzunehmen.
                </p>
              </section>

              <section>
                <p className="text-slate-700 text-xs text-gray-500">
                  Erstellt mit dem Impressum-Generator von für-gründer.de
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
