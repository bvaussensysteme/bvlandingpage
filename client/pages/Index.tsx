import { Link } from "react-router-dom";
import { Mail, MapPin, Home, MessageSquare, Wrench, Sparkles } from "lucide-react";

export default function Index() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <div className="relative min-h-screen bg-gradient-to-b from-white to-gray-50 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 lg:h-screen lg:flex lg:items-center relative z-10 py-12 lg:py-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 w-full lg:items-center">
              {/* Left Content */}
              <div className="flex flex-col justify-center z-10 lg:justify-center">
                {/* Logo - Centered on mobile */}
                <div className="mb-12 flex justify-center lg:justify-start">
                  <img
                    src="https://cdn.builder.io/api/v1/image/assets%2Fee891c57f6124c7d94154ac561d52a3c%2Fdcdf733c238243258ff4d318296f2632?format=webp&width=400"
                    alt="B&V Aussensysteme Logo"
                    className="h-20 sm:h-24 object-contain"
                  />
                </div>

                {/* Headline - Centered on mobile */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-brand-anthracite mb-8 leading-tight text-center lg:text-left">
                  Hier entsteht <br />
                  etwas für <br />
                  <span className="text-[#6db830]">draußen</span>.
                </h1>

                {/* Description - Centered on mobile */}
                <div className="space-y-4 mb-10 text-gray-700 text-center lg:text-left lg:max-w-md">
                  <p className="text-sm sm:text-base leading-relaxed">
                    Unsere Website ist noch im Aufbau – genau wie manch zukünftiger
                    Lieblingsplatz unserer Kunden.
                  </p>
                  <p className="text-sm sm:text-base leading-relaxed">
                    Schon bald finden Sie hier alles rund um Terrassenüberdachungen,
                    Carports und hochwertige Außensysteme.
                  </p>
                </div>

                {/* Contact Info - Centered on mobile */}
                <div className="space-y-4 flex flex-col items-center lg:items-start">
                  <div className="flex items-center gap-3 text-gray-700">
                    <Mail className="w-5 h-5 text-brand-forest-green flex-shrink-0" />
                    <a href="mailto:info@bv-aussensysteme.de" className="hover:text-brand-forest-green transition-colors font-medium text-sm sm:text-base">
                      info@bv-aussensysteme.de
                    </a>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <MapPin className="w-5 h-5 text-brand-forest-green flex-shrink-0" />
                    <span className="font-medium text-sm sm:text-base">Westerwaldkreis, Deutschland</span>
                  </div>
                </div>
              </div>

              {/* Right Image */}
              <div className="relative h-96 lg:h-full lg:absolute lg:-right-8 lg:top-0 lg:w-7/12">
                <img
                  src="https://cdn.builder.io/api/v1/image/assets%2Fee891c57f6124c7d94154ac561d52a3c%2F5373413a2ae549578eab405fd9fe361d?format=webp&width=1000"
                  alt="Moderne Dachterrasse mit Pergola bei Sonnenuntergang"
                  className="w-full h-full object-cover object-right rounded-lg lg:rounded-none shadow-xl lg:shadow-none"
                />
                <div className="absolute inset-0 bg-gradient-to-l from-transparent to-white/5 rounded-lg lg:rounded-none" />
              </div>
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-brand-anthracite text-white py-10 border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 lg:w-1/2">
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
