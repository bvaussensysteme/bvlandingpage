import { Link } from "react-router-dom";
import { Mail, MapPin, Phone } from "lucide-react";

export default function Kontakt() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 bg-stone-50 py-12 sm:py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm p-8 sm:p-12">
            <h1 className="text-4xl font-bold text-slate-900 mb-8">Kontakt</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
              {/* Contact Info */}
              <div>
                <h2 className="text-2xl font-semibold text-slate-900 mb-8">
                  Kontaktinformationen
                </h2>

                <div className="space-y-8">
                  <div className="flex gap-4">
                    <Mail className="w-6 h-6 text-brand-forest-green flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-2">
                        E-Mail
                      </h3>
                      <a
                      href="mailto:info@bv-aussensysteme.de"
                      className="text-brand-forest-green hover:text-brand-soft-leaf transition-colors font-medium"
                    >
                      info@bv-aussensysteme.de
                    </a>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <MapPin className="w-6 h-6 text-brand-forest-green flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-2">
                        Standort
                      </h3>
                      <p className="text-slate-700">Westerwaldkreis, Deutschland</p>
                    </div>
                  </div>

                </div>
              </div>

              {/* Message */}
              <div>
                <h2 className="text-2xl font-semibold text-slate-900 mb-8">
                  Direkter Kontakt
                </h2>

                <div className="bg-brand-soft-leaf/10 border-l-4 border-brand-soft-leaf p-6 rounded-r">
                  <p className="text-brand-anthracite text-sm leading-relaxed mb-4">
                    <strong>Wir bauen unsere Website auf.</strong> Für Ihre
                    Anfragen und Projekte kontaktieren Sie uns bitte direkt
                    per E-Mail.
                  </p>
                  <a
                    href="mailto:info@bv-aussensysteme.de"
                    className="inline-block bg-brand-forest-green text-white px-6 py-2 rounded font-semibold hover:bg-brand-soft-leaf hover:text-brand-anthracite transition-colors text-sm"
                  >
                    E-Mail schreiben
                  </a>
                </div>
              </div>
            </div>

            {/* Info Section */}
            <div className="mt-12 pt-12 border-t border-slate-200">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">
                Über B&V Aussensysteme
              </h2>
              <p className="text-slate-700 mb-4 leading-relaxed">
                Wir sind spezialisiert auf hochwertige Außensysteme wie
                Terrassenüberdachungen, Carports und weitere Lösungen für Ihren
                Außenbereich. Unser Team berät Sie gerne zu Ihren individuellen
                Wünschen und realisiert gemeinsam mit Ihnen Ihren persönlichen
                Liebingsplatz im Freien.
              </p>
              <p className="text-slate-700 leading-relaxed">
                <strong>Unsere Leistungen:</strong>
              </p>
              <ul className="list-disc list-inside text-slate-700 mt-2 space-y-1">
                <li>Verkauf & Montage</li>
                <li>Beratung & Planung</li>
                <li>Service & Wartung</li>
                <li>Reinigung</li>
              </ul>
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
              bv-aussensysteme.de/kontakt
            </Link>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-700 text-center text-xs text-gray-400">
            <p>© 2024 B&V Aussensysteme UG. Alle Rechte vorbehalten.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
