// BV AussenSysteme – DIBT Lastzonen-Datenbank
// Windzonen: Quelle DIBt Berlin, Stand 02.06.2022 (DIN EN 1991-1-4/NA)
// Schneelastzonen: Quelle DIBt Berlin, Stand 07.02.2023 (DIN EN 1991-1-3/NA)
// Lizenz: Die Quelldaten sind öffentliche Technische Baubestimmungen des DIBt
// www.dibt.de – Freie Nutzung für nichtkommerzielle und informatorische Zwecke
// HINWEIS: Verbindlich sind die amtlichen Bekanntmachungen der Länder

const DIBT_WINDZONEN = {
  "schleswig-flensburg": 4,
  "flensburg": 3,
  "nordfriesland": 4,
  "dithmarschen": 4,
  "rendsburg-eckernförde": 3,
  "pinneberg": 3,
  "steinburg": 3,
  "segeberg": 2,
  "plön": 2,
  "stormarn": 2,
  "herzogtum lauenburg": 2,
  "kiel": 2,
  "lübeck": 2,
  "neumünster": 2,
  "ostholstein": 3,
  "hamburg": 2,
  "aurich": 4,
  "wittmund": 4,
  "friesland": 4,
  "cuxhaven": 4,
  "emden": 4,
  "wilhelmshaven": 4,
  "wesermarsch": 4,
  "stade": 4,
  "leer": 3,
  "ammerland": 3,
  "oldenburg": 3,
  "osterholz": 3,
  "oldenburg (oldenburg)": 3,
  "delmenhorst": 3,
  "rotenburg (wümme)": 3,
  "emsland": 2,
  "grafschaft bentheim": 2,
  "cloppenburg": 2,
  "vechta": 2,
  "diepholz": 2,
  "verden": 2,
  "harburg": 2,
  "lüneburg": 2,
  "heidekreis": 2,
  "uelzen": 2,
  "lüchow-dannenberg": 2,
  "celle": 2,
  "nienburg (weser)": 2,
  "region hannover": 2,
  "hannover": 2,
  "gifhorn": 2,
  "peine": 2,
  "helmstedt": 2,
  "wolfenbüttel": 2,
  "goslar": 2,
  "wolfsburg": 2,
  "braunschweig": 2,
  "salzgitter": 2,
  "osnabrück": 2,
  "osnabrück (stadt)": 2,
  "schaumburg": 2,
  "hameln-pyrmont": 2,
  "hildesheim": 2,
  "holzminden": 1,
  "northeim": 1,
  "göttingen": 1,
  "bremen": 3,
  "bremerhaven": 4,
  "recklinghausen": 2,
  "bottrop": 1,
  "gelsenkirchen": 1,
  "steinfurt": 2,
  "borken": 2,
  "coesfeld": 2,
  "warendorf": 2,
  "münster": 2,
  "mettmann": 1,
  "oberhausen": 1,
  "duisburg": 1,
  "essen": 1,
  "mülheim an der ruhr": 1,
  "düsseldorf": 1,
  "solingen": 1,
  "wuppertal": 1,
  "remscheid": 1,
  "kleve": 2,
  "wesel": 2,
  "viersen": 2,
  "rhein-kreis neuss": 2,
  "neuss": 2,
  "krefeld": 2,
  "mönchengladbach": 2,
  "herford": 1,
  "lippe": 1,
  "paderborn": 1,
  "höxter": 1,
  "bielefeld": 1,
  "gütersloh": 2,
  "minden-lübbecke": 2,
  "ennepe-ruhr-kreis": 1,
  "hochsauerlandkreis": 1,
  "märkischer kreis": 1,
  "olpe": 1,
  "siegen-wittgenstein": 1,
  "soest": 1,
  "unna": 1,
  "hamm": 2,
  "dortmund": 1,
  "bochum": 1,
  "hagen": 1,
  "herne": 1,
  "köln": 1,
  "rhein-erft-kreis": 1,
  "rhein-sieg-kreis": 1,
  "oberbergischer kreis": 1,
  "rheinisch-bergischer kreis": 1,
  "leverkusen": 1,
  "bonn": 1,
  "aachen": 1,
  "städteregion aachen": 1,
  "düren": 1,
  "euskirchen": 1,
  "heinsberg": 2,
  "bergstraße": 1,
  "darmstadt-dieburg": 1,
  "darmstadt": 1,
  "frankfurt am main": 1,
  "fulda": 1,
  "gießen": 1,
  "groß-gerau": 1,
  "hersfeld-rotenburg": 1,
  "hochtaunuskreis": 1,
  "kassel": 1,
  "kassel (stadt)": 1,
  "lahn-dill-kreis": 1,
  "limburg-weilburg": 1,
  "main-kinzig-kreis": 1,
  "main-tauber-kreis": 1,
  "main-taunus-kreis": 1,
  "marburg-biedenkopf": 1,
  "odenwaldkreis": 1,
  "offenbach": 1,
  "offenbach am main": 1,
  "rheingau-taunus-kreis": 1,
  "schwalm-eder-kreis": 1,
  "vogelsbergkreis": 1,
  "waldeck-frankenberg": 1,
  "wartburgkreis": 2,
  "werra-meißner-kreis": 1,
  "wetteraukreis": 1,
  "wiesbaden": 1,
  "ahrweiler": 2,
  "vulkaneifel": 2,
  "eifelkreis bitburg-prüm": 2,
  "bitburg-prüm": 2,
  "cochem-zell": 2,
  "bernkastel-wittlich": 2,
  "trier-saarburg": 2,
  "trier": 2,
  "mayen-koblenz": 2,
  "koblenz": 2,
  "altenkirchen (westerwald)": 1,
  "westerwaldkreis": 1,
  "neuwied": 1,
  "rhein-hunsrück-kreis": 1,
  "rhein-lahn-kreis": 1,
  "bad kreuznach": 1,
  "birkenfeld": 1,
  "donnersbergkreis": 1,
  "germersheim": 1,
  "kaiserslautern": 1,
  "kaiserslautern (stadt)": 1,
  "kusel": 1,
  "ludwigshafen am rhein": 1,
  "mainz": 1,
  "mainz-bingen": 1,
  "pirmasens": 1,
  "rhein-pfalz-kreis": 1,
  "südliche weinstraße": 1,
  "südwestpfalz": 1,
  "speyer": 1,
  "frankenthal (pfalz)": 1,
  "landau in der pfalz": 1,
  "neustadt an der weinstraße": 1,
  "worms": 1,
  "zweibrücken": 1,
  "karlsruhe": 1,
  "karlsruhe (stadt)": 1,
  "heidelberg": 1,
  "mannheim": 1,
  "rhein-neckar-kreis": 1,
  "neckar-odenwald-kreis": 1,
  "calw": 1,
  "enzkreis": 1,
  "freudenstadt": 1,
  "pforzheim": 1,
  "rastatt": 1,
  "lörrach": 1,
  "ortenaukreis": 1,
  "schwarzwald-baar-kreis": 1,
  "rottweil": 1,
  "tuttlingen": 1,
  "waldshut": 1,
  "böblingen": 1,
  "esslingen": 1,
  "göppingen": 1,
  "ludwigsburg": 1,
  "ostalbkreis": 1,
  "rems-murr-kreis": 1,
  "schwäbisch hall": 1,
  "hohenlohekreis": 1,
  "stuttgart": 1,
  "zollernalbkreis": 1,
  "reutlingen": 1,
  "tübingen": 1,
  "alb-donau-kreis": 2,
  "ulm": 1,
  "biberach": 2,
  "bodenseekreis": 2,
  "ravensburg": 2,
  "sigmaringen": 2,
  "konstanz": 2,
  "emmendingen": 1,
  "breisgau-hochschwarzwald": 1,
  "freiburg im breisgau": 1,
  "würzburg": 1,
  "würzburg (stadt)": 1,
  "main-spessart": 1,
  "schweinfurt": 1,
  "schweinfurt (stadt)": 1,
  "bad kissingen": 1,
  "rhön-grabfeld": 1,
  "haßberge": 1,
  "kitzingen": 1,
  "miltenberg": 1,
  "aschaffenburg": 1,
  "aschaffenburg (stadt)": 1,
  "bamberg": 1,
  "bamberg (stadt)": 1,
  "bayreuth": 1,
  "bayreuth (stadt)": 1,
  "coburg": 1,
  "coburg (stadt)": 1,
  "forchheim": 1,
  "hof": 1,
  "hof (stadt)": 1,
  "kronach": 1,
  "kulmbach": 1,
  "lichtenfels": 1,
  "wunsiedel im fichtelgebirge": 1,
  "ansbach": 1,
  "ansbach (stadt)": 1,
  "erlangen": 1,
  "erlangen-höchstadt": 1,
  "fürth": 1,
  "fürth (stadt)": 1,
  "nürnberg": 1,
  "nürnberger land": 1,
  "neustadt an der aisch-bad windsheim": 1,
  "roth": 1,
  "weißenburg-gunzenhausen": 1,
  "schwabach": 1,
  "deggendorf": 1,
  "dingolfing-landau": 1,
  "freyung-grafenau": 1,
  "kelheim": 1,
  "landshut": 1,
  "landshut (stadt)": 1,
  "passau": 1,
  "passau (stadt)": 1,
  "regen": 1,
  "rottal-inn": 1,
  "straubing": 1,
  "straubing-bogen": 1,
  "amberg": 1,
  "amberg-sulzbach": 1,
  "cham": 1,
  "neumarkt in der oberpfalz": 1,
  "neustadt an der waldnaab": 1,
  "regensburg": 1,
  "regensburg (stadt)": 1,
  "schwandorf": 1,
  "tirschenreuth": 1,
  "weiden in der oberpfalz": 1,
  "donau-ries": 1,
  "dillingen a.d. donau": 1,
  "günzburg": 2,
  "neu-ulm": 2,
  "augsburg": 2,
  "augsburg (stadt)": 2,
  "aichach-friedberg": 2,
  "unterallgäu": 2,
  "memmingen": 2,
  "kaufbeuren": 2,
  "lindau (bodensee)": 2,
  "kempten (allgäu)": 2,
  "ostallgäu": 2,
  "oberallgäu": 2,
  "eichstätt": 1,
  "freising": 1,
  "neuburg-schrobenhausen": 1,
  "erding": 1,
  "pfaffenhofen a.d. ilm": 1,
  "mühldorf am inn": 1,
  "berchtesgadener land": 1,
  "garmisch-partenkirchen": 1,
  "altötting": 1,
  "ingolstadt": 1,
  "dachau": 2,
  "münchen": 2,
  "münchen (stadt)": 2,
  "fürstenfeldbruck": 2,
  "landsberg am lech": 2,
  "ebersberg": 2,
  "starnberg": 2,
  "rosenheim": 2,
  "rosenheim (stadt)": 2,
  "weilheim-schongau": 2,
  "bad tölz-wolfratshausen": 2,
  "miesbach": 2,
  "traunstein": 2,
  "saarlouis": 1,
  "saarbrücken": 1,
  "regionalverband saarbrücken": 1,
  "merzig-wadern": 1,
  "neunkirchen": 1,
  "saarpfalz-kreis": 1,
  "st. wendel": 1,
  "berlin": 2,
  "barnim": 2,
  "dahme-spreewald": 2,
  "elbe-elster": 2,
  "havelland": 2,
  "märkisch-oderland": 2,
  "oberhavel": 2,
  "oberspreewald-lausitz": 2,
  "oder-spree": 2,
  "ostprignitz-ruppin": 2,
  "potsdam-mittelmark": 2,
  "prignitz": 2,
  "spree-neiße": 2,
  "teltow-fläming": 2,
  "uckermark": 2,
  "cottbus": 2,
  "frankfurt (oder)": 2,
  "potsdam": 2,
  "brandenburg an der havel": 2,
  "nordwestmecklenburg": 3,
  "rostock": 3,
  "rostock (stadt)": 3,
  "wismar": 3,
  "stralsund": 3,
  "vorpommern-rügen": 4,
  "rügen": 4,
  "ludwigslust-parchim": 2,
  "mecklenburgische seenplatte": 2,
  "vorpommern-greifswald": 2,
  "greifswald": 2,
  "schwerin": 2,
  "neubrandenburg": 2,
  "landkreis rostock": 3,
  "bautzen": 2,
  "chemnitz": 2,
  "erzgebirgskreis": 2,
  "görlitz": 2,
  "leipzig": 2,
  "leipzig (stadt)": 2,
  "meißen": 2,
  "mittelsachsen": 2,
  "nordsachsen": 2,
  "sächsische schweiz-osterzgebirge": 2,
  "vogtlandkreis": 2,
  "zwickau": 2,
  "dresden": 2,
  "altmarkkreis salzwedel": 2,
  "anhalt-bitterfeld": 2,
  "börde": 2,
  "burgenlandkreis": 2,
  "dessau-roßlau": 2,
  "halle (saale)": 2,
  "harz": 2,
  "jerichower land": 2,
  "magdeburg": 2,
  "mansfeld-südharz": 2,
  "saalekreis": 2,
  "salzlandkreis": 2,
  "stendal": 2,
  "wittenberg": 2,
  "schmalkalden-meiningen": 1,
  "hildburghausen": 1,
  "sonneberg": 1,
  "suhl": 1,
  "eisenach": 2,
  "eichsfeld": 2,
  "nordhausen": 2,
  "unstrut-hainich-kreis": 2,
  "kyffhäuserkreis": 2,
  "sömmerda": 2,
  "gotha": 2,
  "ilm-kreis": 2,
  "weimarer land": 2,
  "greiz": 2,
  "saale-holzland-kreis": 2,
  "saalfeld-rudolstadt": 2,
  "altenburger land": 2,
  "saale-orla-kreis": 2,
  "erfurt": 2,
  "weimar": 2,
  "jena": 2,
  "gera": 2
};

const DIBT_SCHNEELASTZONEN = {
  "schleswig-flensburg": [
    "1",
    "Nordd.Tiefld."
  ],
  "flensburg": [
    "1",
    "Nordd.Tiefld."
  ],
  "nordfriesland": [
    "1",
    "Nordd.Tiefld."
  ],
  "dithmarschen": [
    "1",
    "Nordd.Tiefld."
  ],
  "rendsburg-eckernförde": [
    "1",
    "Nordd.Tiefld."
  ],
  "pinneberg": [
    "1",
    "Nordd.Tiefld."
  ],
  "steinburg": [
    "1",
    "Nordd.Tiefld."
  ],
  "segeberg": [
    "1",
    "Nordd.Tiefld."
  ],
  "plön": [
    "1",
    "Nordd.Tiefld."
  ],
  "stormarn": [
    "1",
    "Nordd.Tiefld."
  ],
  "herzogtum lauenburg": [
    "1",
    "Nordd.Tiefld."
  ],
  "kiel": [
    "1",
    "Nordd.Tiefld."
  ],
  "lübeck": [
    "1",
    "Nordd.Tiefld."
  ],
  "neumünster": [
    "1",
    "Nordd.Tiefld."
  ],
  "ostholstein": [
    "1",
    "Nordd.Tiefld."
  ],
  "hamburg": [
    "1",
    "Nordd.Tiefld."
  ],
  "aurich": [
    "1",
    "Nordd.Tiefld."
  ],
  "wittmund": [
    "1",
    "Nordd.Tiefld."
  ],
  "friesland": [
    "1",
    "Nordd.Tiefld."
  ],
  "cuxhaven": [
    "1",
    "Nordd.Tiefld."
  ],
  "emden": [
    "1",
    "Nordd.Tiefld."
  ],
  "wilhelmshaven": [
    "1",
    "Nordd.Tiefld."
  ],
  "wesermarsch": [
    "1",
    "Nordd.Tiefld."
  ],
  "stade": [
    "1",
    "Nordd.Tiefld."
  ],
  "leer": [
    "1",
    "Nordd.Tiefld."
  ],
  "ammerland": [
    "1",
    "Nordd.Tiefld."
  ],
  "oldenburg": [
    "1",
    "Nordd.Tiefld."
  ],
  "osterholz": [
    "1",
    "Nordd.Tiefld."
  ],
  "oldenburg (oldenburg)": [
    "1",
    "Nordd.Tiefld."
  ],
  "delmenhorst": [
    "1",
    "Nordd.Tiefld."
  ],
  "rotenburg (wümme)": [
    "1",
    "Nordd.Tiefld."
  ],
  "emsland": [
    "1",
    "Nordd.Tiefld."
  ],
  "grafschaft bentheim": [
    "1",
    ""
  ],
  "cloppenburg": [
    "1",
    "Nordd.Tiefld."
  ],
  "vechta": [
    "1",
    ""
  ],
  "diepholz": [
    "1",
    "Nordd.Tiefld."
  ],
  "verden": [
    "1",
    "Nordd.Tiefld."
  ],
  "harburg": [
    "1",
    "Nordd.Tiefld."
  ],
  "lüneburg": [
    "1",
    "Nordd.Tiefld."
  ],
  "heidekreis": [
    "1",
    "Nordd.Tiefld."
  ],
  "uelzen": [
    "1",
    "Nordd.Tiefld."
  ],
  "lüchow-dannenberg": [
    "1",
    "Nordd.Tiefld."
  ],
  "celle": [
    "1",
    "Nordd.Tiefld."
  ],
  "nienburg (weser)": [
    "1",
    "Nordd.Tiefld."
  ],
  "region hannover": [
    "1",
    "Nordd.Tiefld."
  ],
  "hannover": [
    "1",
    "Nordd.Tiefld."
  ],
  "gifhorn": [
    "1",
    "Nordd.Tiefld."
  ],
  "peine": [
    "1",
    "Nordd.Tiefld."
  ],
  "helmstedt": [
    "1",
    "Nordd.Tiefld."
  ],
  "wolfenbüttel": [
    "2",
    ""
  ],
  "goslar": [
    "3",
    "Harzinsel"
  ],
  "wolfsburg": [
    "1",
    "Nordd.Tiefld."
  ],
  "braunschweig": [
    "1",
    "Nordd.Tiefld."
  ],
  "salzgitter": [
    "2",
    ""
  ],
  "osnabrück": [
    "1",
    ""
  ],
  "osnabrück (stadt)": [
    "1",
    ""
  ],
  "schaumburg": [
    "1",
    ""
  ],
  "hameln-pyrmont": [
    "1",
    ""
  ],
  "hildesheim": [
    "2",
    ""
  ],
  "holzminden": [
    "2",
    ""
  ],
  "northeim": [
    "2",
    ""
  ],
  "göttingen": [
    "2",
    ""
  ],
  "osterode am harz": [
    "3",
    "Harzinsel"
  ],
  "bremen": [
    "1",
    "Nordd.Tiefld."
  ],
  "bremerhaven": [
    "1",
    "Nordd.Tiefld."
  ],
  "recklinghausen": [
    "1",
    "Nordd.Tiefld."
  ],
  "bottrop": [
    "1",
    "Nordd.Tiefld."
  ],
  "gelsenkirchen": [
    "1",
    "Nordd.Tiefld."
  ],
  "steinfurt": [
    "1",
    "Nordd.Tiefld."
  ],
  "borken": [
    "1",
    "Nordd.Tiefld."
  ],
  "coesfeld": [
    "1",
    "Nordd.Tiefld."
  ],
  "warendorf": [
    "1",
    "Nordd.Tiefld."
  ],
  "münster": [
    "1",
    "Nordd.Tiefld."
  ],
  "mettmann": [
    "1",
    ""
  ],
  "oberhausen": [
    "1",
    ""
  ],
  "duisburg": [
    "1",
    ""
  ],
  "essen": [
    "1",
    ""
  ],
  "mülheim an der ruhr": [
    "1",
    ""
  ],
  "düsseldorf": [
    "1",
    ""
  ],
  "solingen": [
    "1",
    ""
  ],
  "wuppertal": [
    "2",
    ""
  ],
  "remscheid": [
    "2",
    ""
  ],
  "kleve": [
    "1",
    "Nordd.Tiefld."
  ],
  "wesel": [
    "1",
    "Nordd.Tiefld."
  ],
  "viersen": [
    "1",
    ""
  ],
  "rhein-kreis neuss": [
    "1",
    ""
  ],
  "neuss": [
    "1",
    ""
  ],
  "krefeld": [
    "1",
    ""
  ],
  "mönchengladbach": [
    "1",
    ""
  ],
  "herford": [
    "2",
    ""
  ],
  "lippe": [
    "2",
    ""
  ],
  "paderborn": [
    "2",
    ""
  ],
  "höxter": [
    "2",
    ""
  ],
  "bielefeld": [
    "2",
    ""
  ],
  "gütersloh": [
    "1",
    "Nordd.Tiefld."
  ],
  "minden-lübbecke": [
    "1",
    "Nordd.Tiefld."
  ],
  "ennepe-ruhr-kreis": [
    "2",
    ""
  ],
  "hochsauerlandkreis": [
    "2",
    ""
  ],
  "märkischer kreis": [
    "2",
    ""
  ],
  "olpe": [
    "2",
    ""
  ],
  "siegen-wittgenstein": [
    "2",
    ""
  ],
  "soest": [
    "2",
    ""
  ],
  "unna": [
    "1",
    ""
  ],
  "hamm": [
    "1",
    "Nordd.Tiefld."
  ],
  "dortmund": [
    "1",
    ""
  ],
  "bochum": [
    "1",
    ""
  ],
  "hagen": [
    "2",
    ""
  ],
  "herne": [
    "1",
    ""
  ],
  "köln": [
    "1",
    ""
  ],
  "rhein-erft-kreis": [
    "1",
    ""
  ],
  "rhein-sieg-kreis": [
    "2",
    ""
  ],
  "oberbergischer kreis": [
    "2",
    ""
  ],
  "rheinisch-bergischer kreis": [
    "2",
    ""
  ],
  "leverkusen": [
    "1",
    ""
  ],
  "bonn": [
    "1",
    ""
  ],
  "aachen": [
    "2",
    ""
  ],
  "städteregion aachen": [
    "2",
    ""
  ],
  "düren": [
    "2",
    ""
  ],
  "euskirchen": [
    "2",
    ""
  ],
  "heinsberg": [
    "1",
    ""
  ],
  "bergstraße": [
    "1",
    ""
  ],
  "darmstadt-dieburg": [
    "1",
    ""
  ],
  "darmstadt": [
    "1",
    ""
  ],
  "frankfurt am main": [
    "1",
    ""
  ],
  "fulda": [
    "2",
    ""
  ],
  "gießen": [
    "1",
    ""
  ],
  "groß-gerau": [
    "1",
    ""
  ],
  "hersfeld-rotenburg": [
    "2",
    ""
  ],
  "hochtaunuskreis": [
    "2",
    ""
  ],
  "kassel": [
    "2",
    ""
  ],
  "kassel (stadt)": [
    "1",
    ""
  ],
  "lahn-dill-kreis": [
    "2",
    ""
  ],
  "limburg-weilburg": [
    "1",
    ""
  ],
  "main-kinzig-kreis": [
    "2",
    ""
  ],
  "main-taunus-kreis": [
    "1",
    ""
  ],
  "marburg-biedenkopf": [
    "2",
    ""
  ],
  "odenwaldkreis": [
    "2",
    ""
  ],
  "offenbach": [
    "1",
    ""
  ],
  "offenbach am main": [
    "1",
    ""
  ],
  "rheingau-taunus-kreis": [
    "2",
    ""
  ],
  "schwalm-eder-kreis": [
    "2",
    ""
  ],
  "vogelsbergkreis": [
    "2",
    ""
  ],
  "waldeck-frankenberg": [
    "2",
    ""
  ],
  "werra-meißner-kreis": [
    "2",
    ""
  ],
  "wetteraukreis": [
    "2",
    ""
  ],
  "wiesbaden": [
    "1",
    ""
  ],
  "ahrweiler": [
    "2",
    ""
  ],
  "vulkaneifel": [
    "2",
    ""
  ],
  "eifelkreis bitburg-prüm": [
    "2",
    ""
  ],
  "bitburg-prüm": [
    "2",
    ""
  ],
  "cochem-zell": [
    "2",
    ""
  ],
  "bernkastel-wittlich": [
    "2",
    ""
  ],
  "trier-saarburg": [
    "1",
    ""
  ],
  "trier": [
    "1",
    ""
  ],
  "mayen-koblenz": [
    "2",
    ""
  ],
  "koblenz": [
    "1",
    ""
  ],
  "altenkirchen (westerwald)": [
    "2",
    ""
  ],
  "westerwaldkreis": [
    "2",
    ""
  ],
  "neuwied": [
    "2",
    ""
  ],
  "rhein-hunsrück-kreis": [
    "2",
    ""
  ],
  "rhein-lahn-kreis": [
    "1",
    ""
  ],
  "bad kreuznach": [
    "2",
    ""
  ],
  "birkenfeld": [
    "2",
    ""
  ],
  "donnersbergkreis": [
    "1",
    ""
  ],
  "germersheim": [
    "1",
    ""
  ],
  "kaiserslautern": [
    "2",
    ""
  ],
  "kaiserslautern (stadt)": [
    "2",
    ""
  ],
  "kusel": [
    "2",
    ""
  ],
  "ludwigshafen am rhein": [
    "1",
    ""
  ],
  "mainz": [
    "1",
    ""
  ],
  "mainz-bingen": [
    "1",
    ""
  ],
  "pirmasens": [
    "2",
    ""
  ],
  "rhein-pfalz-kreis": [
    "1",
    ""
  ],
  "südliche weinstraße": [
    "1",
    ""
  ],
  "südwestpfalz": [
    "2",
    ""
  ],
  "speyer": [
    "1",
    ""
  ],
  "frankenthal (pfalz)": [
    "1",
    ""
  ],
  "landau in der pfalz": [
    "1",
    ""
  ],
  "neustadt an der weinstraße": [
    "1",
    ""
  ],
  "worms": [
    "1",
    ""
  ],
  "zweibrücken": [
    "2",
    ""
  ],
  "karlsruhe": [
    "1",
    ""
  ],
  "karlsruhe (stadt)": [
    "1",
    ""
  ],
  "heidelberg": [
    "1",
    ""
  ],
  "mannheim": [
    "1",
    ""
  ],
  "rhein-neckar-kreis": [
    "1",
    ""
  ],
  "neckar-odenwald-kreis": [
    "2",
    ""
  ],
  "calw": [
    "2",
    ""
  ],
  "enzkreis": [
    "2",
    ""
  ],
  "freudenstadt": [
    "2a",
    ""
  ],
  "pforzheim": [
    "1",
    ""
  ],
  "rastatt": [
    "1",
    ""
  ],
  "lörrach": [
    "2",
    ""
  ],
  "ortenaukreis": [
    "2",
    ""
  ],
  "schwarzwald-baar-kreis": [
    "2",
    ""
  ],
  "rottweil": [
    "2",
    ""
  ],
  "tuttlingen": [
    "2",
    ""
  ],
  "waldshut": [
    "2",
    ""
  ],
  "böblingen": [
    "2",
    ""
  ],
  "esslingen": [
    "2",
    ""
  ],
  "göppingen": [
    "2",
    ""
  ],
  "ludwigsburg": [
    "1",
    ""
  ],
  "ostalbkreis": [
    "2",
    ""
  ],
  "rems-murr-kreis": [
    "2",
    ""
  ],
  "schwäbisch hall": [
    "2",
    ""
  ],
  "hohenlohekreis": [
    "2",
    ""
  ],
  "main-tauber-kreis": [
    "2",
    ""
  ],
  "stuttgart": [
    "2",
    ""
  ],
  "zollernalbkreis": [
    "2",
    ""
  ],
  "reutlingen": [
    "2",
    ""
  ],
  "tübingen": [
    "2",
    ""
  ],
  "alb-donau-kreis": [
    "2",
    ""
  ],
  "ulm": [
    "2",
    ""
  ],
  "biberach": [
    "2",
    ""
  ],
  "bodenseekreis": [
    "2",
    ""
  ],
  "ravensburg": [
    "2",
    ""
  ],
  "sigmaringen": [
    "2",
    ""
  ],
  "konstanz": [
    "2",
    ""
  ],
  "emmendingen": [
    "2",
    ""
  ],
  "breisgau-hochschwarzwald": [
    "2",
    ""
  ],
  "freiburg im breisgau": [
    "1",
    ""
  ],
  "würzburg": [
    "1",
    ""
  ],
  "würzburg (stadt)": [
    "1",
    ""
  ],
  "main-spessart": [
    "1",
    ""
  ],
  "schweinfurt": [
    "1",
    ""
  ],
  "schweinfurt (stadt)": [
    "1",
    ""
  ],
  "bad kissingen": [
    "1",
    ""
  ],
  "rhön-grabfeld": [
    "2",
    ""
  ],
  "haßberge": [
    "1",
    ""
  ],
  "kitzingen": [
    "1",
    ""
  ],
  "miltenberg": [
    "1",
    ""
  ],
  "aschaffenburg": [
    "1",
    ""
  ],
  "aschaffenburg (stadt)": [
    "1",
    ""
  ],
  "bamberg": [
    "2",
    ""
  ],
  "bamberg (stadt)": [
    "2",
    ""
  ],
  "bayreuth": [
    "2",
    ""
  ],
  "bayreuth (stadt)": [
    "2",
    ""
  ],
  "coburg": [
    "2",
    ""
  ],
  "coburg (stadt)": [
    "2",
    ""
  ],
  "forchheim": [
    "2",
    ""
  ],
  "hof": [
    "2",
    ""
  ],
  "hof (stadt)": [
    "2",
    ""
  ],
  "kronach": [
    "2",
    ""
  ],
  "kulmbach": [
    "2",
    ""
  ],
  "lichtenfels": [
    "2",
    ""
  ],
  "wunsiedel im fichtelgebirge": [
    "3",
    ""
  ],
  "ansbach": [
    "1",
    ""
  ],
  "ansbach (stadt)": [
    "1",
    ""
  ],
  "erlangen": [
    "2",
    ""
  ],
  "erlangen-höchstadt": [
    "2",
    ""
  ],
  "fürth": [
    "2",
    ""
  ],
  "fürth (stadt)": [
    "2",
    ""
  ],
  "nürnberg": [
    "2",
    ""
  ],
  "nürnberger land": [
    "2",
    ""
  ],
  "neustadt an der aisch-bad windsheim": [
    "1",
    ""
  ],
  "roth": [
    "2",
    ""
  ],
  "weißenburg-gunzenhausen": [
    "2",
    ""
  ],
  "schwabach": [
    "2",
    ""
  ],
  "deggendorf": [
    "2",
    ""
  ],
  "dingolfing-landau": [
    "2",
    ""
  ],
  "freyung-grafenau": [
    "3",
    ""
  ],
  "kelheim": [
    "2",
    ""
  ],
  "landshut": [
    "2",
    ""
  ],
  "landshut (stadt)": [
    "1",
    ""
  ],
  "passau": [
    "2",
    ""
  ],
  "passau (stadt)": [
    "2",
    ""
  ],
  "regen": [
    "3",
    ""
  ],
  "rottal-inn": [
    "2",
    ""
  ],
  "straubing": [
    "1",
    ""
  ],
  "straubing-bogen": [
    "2",
    ""
  ],
  "amberg": [
    "2",
    ""
  ],
  "amberg-sulzbach": [
    "2",
    ""
  ],
  "cham": [
    "2",
    ""
  ],
  "neumarkt in der oberpfalz": [
    "2",
    ""
  ],
  "neustadt an der waldnaab": [
    "2",
    ""
  ],
  "regensburg": [
    "1",
    ""
  ],
  "regensburg (stadt)": [
    "1",
    ""
  ],
  "schwandorf": [
    "2",
    ""
  ],
  "tirschenreuth": [
    "2",
    ""
  ],
  "weiden in der oberpfalz": [
    "2",
    ""
  ],
  "donau-ries": [
    "2",
    ""
  ],
  "dillingen a.d. donau": [
    "2",
    ""
  ],
  "günzburg": [
    "2",
    ""
  ],
  "neu-ulm": [
    "2",
    ""
  ],
  "augsburg": [
    "2",
    ""
  ],
  "augsburg (stadt)": [
    "2",
    ""
  ],
  "aichach-friedberg": [
    "2",
    ""
  ],
  "unterallgäu": [
    "2",
    ""
  ],
  "memmingen": [
    "2",
    ""
  ],
  "kaufbeuren": [
    "2",
    ""
  ],
  "lindau (bodensee)": [
    "2",
    ""
  ],
  "kempten (allgäu)": [
    "2",
    ""
  ],
  "ostallgäu": [
    "3",
    ""
  ],
  "oberallgäu": [
    "3",
    ""
  ],
  "eichstätt": [
    "2",
    ""
  ],
  "freising": [
    "2",
    ""
  ],
  "neuburg-schrobenhausen": [
    "2",
    ""
  ],
  "erding": [
    "2",
    ""
  ],
  "pfaffenhofen a.d. ilm": [
    "2",
    ""
  ],
  "mühldorf am inn": [
    "2",
    ""
  ],
  "berchtesgadener land": [
    "3",
    ""
  ],
  "garmisch-partenkirchen": [
    "3",
    ""
  ],
  "altötting": [
    "2",
    ""
  ],
  "ingolstadt": [
    "2",
    ""
  ],
  "dachau": [
    "2",
    ""
  ],
  "münchen": [
    "2",
    ""
  ],
  "münchen (stadt)": [
    "2",
    ""
  ],
  "fürstenfeldbruck": [
    "2",
    ""
  ],
  "landsberg am lech": [
    "2",
    ""
  ],
  "ebersberg": [
    "2",
    ""
  ],
  "starnberg": [
    "2",
    ""
  ],
  "rosenheim": [
    "3",
    ""
  ],
  "rosenheim (stadt)": [
    "3",
    ""
  ],
  "weilheim-schongau": [
    "3",
    ""
  ],
  "bad tölz-wolfratshausen": [
    "3",
    ""
  ],
  "miesbach": [
    "3",
    ""
  ],
  "traunstein": [
    "3",
    ""
  ],
  "saarlouis": [
    "2",
    ""
  ],
  "saarbrücken": [
    "2",
    ""
  ],
  "regionalverband saarbrücken": [
    "2",
    ""
  ],
  "merzig-wadern": [
    "2",
    ""
  ],
  "neunkirchen": [
    "2",
    ""
  ],
  "saarpfalz-kreis": [
    "2",
    ""
  ],
  "st. wendel": [
    "2",
    ""
  ],
  "berlin": [
    "2",
    ""
  ],
  "barnim": [
    "2",
    ""
  ],
  "dahme-spreewald": [
    "2",
    ""
  ],
  "elbe-elster": [
    "2",
    ""
  ],
  "havelland": [
    "2",
    ""
  ],
  "märkisch-oderland": [
    "2",
    ""
  ],
  "oberhavel": [
    "2",
    ""
  ],
  "oberspreewald-lausitz": [
    "2",
    ""
  ],
  "oder-spree": [
    "2",
    ""
  ],
  "ostprignitz-ruppin": [
    "2",
    ""
  ],
  "potsdam-mittelmark": [
    "2",
    ""
  ],
  "prignitz": [
    "2",
    ""
  ],
  "spree-neiße": [
    "2",
    ""
  ],
  "teltow-fläming": [
    "2",
    ""
  ],
  "uckermark": [
    "2",
    ""
  ],
  "cottbus": [
    "2",
    ""
  ],
  "frankfurt (oder)": [
    "2",
    ""
  ],
  "potsdam": [
    "2",
    ""
  ],
  "brandenburg an der havel": [
    "2",
    ""
  ],
  "nordwestmecklenburg": [
    "1",
    "Nordd.Tiefld."
  ],
  "rostock": [
    "1",
    "Nordd.Tiefld."
  ],
  "rostock (stadt)": [
    "1",
    "Nordd.Tiefld."
  ],
  "wismar": [
    "1",
    "Nordd.Tiefld."
  ],
  "stralsund": [
    "1",
    "Nordd.Tiefld."
  ],
  "vorpommern-rügen": [
    "1",
    "Nordd.Tiefld."
  ],
  "rügen": [
    "1",
    "Nordd.Tiefld."
  ],
  "ludwigslust-parchim": [
    "1",
    "Nordd.Tiefld."
  ],
  "mecklenburgische seenplatte": [
    "1",
    "Nordd.Tiefld."
  ],
  "vorpommern-greifswald": [
    "1",
    "Nordd.Tiefld."
  ],
  "greifswald": [
    "1",
    "Nordd.Tiefld."
  ],
  "schwerin": [
    "1",
    "Nordd.Tiefld."
  ],
  "neubrandenburg": [
    "1",
    "Nordd.Tiefld."
  ],
  "landkreis rostock": [
    "1",
    "Nordd.Tiefld."
  ],
  "bautzen": [
    "2",
    ""
  ],
  "chemnitz": [
    "2",
    ""
  ],
  "erzgebirgskreis": [
    "3",
    ""
  ],
  "görlitz": [
    "2",
    ""
  ],
  "leipzig": [
    "1",
    ""
  ],
  "leipzig (stadt)": [
    "1",
    ""
  ],
  "meißen": [
    "2",
    ""
  ],
  "mittelsachsen": [
    "2",
    ""
  ],
  "nordsachsen": [
    "1",
    ""
  ],
  "sächsische schweiz-osterzgebirge": [
    "3",
    ""
  ],
  "vogtlandkreis": [
    "3",
    ""
  ],
  "zwickau": [
    "2",
    ""
  ],
  "dresden": [
    "2",
    ""
  ],
  "altmarkkreis salzwedel": [
    "1",
    "Nordd.Tiefld."
  ],
  "anhalt-bitterfeld": [
    "2",
    ""
  ],
  "börde": [
    "2",
    ""
  ],
  "burgenlandkreis": [
    "2",
    ""
  ],
  "dessau-roßlau": [
    "2",
    ""
  ],
  "halle (saale)": [
    "2",
    ""
  ],
  "harz": [
    "3",
    "Harzinsel"
  ],
  "jerichower land": [
    "1",
    "Nordd.Tiefld."
  ],
  "magdeburg": [
    "2",
    ""
  ],
  "mansfeld-südharz": [
    "2",
    ""
  ],
  "saalekreis": [
    "2",
    ""
  ],
  "salzlandkreis": [
    "2",
    ""
  ],
  "stendal": [
    "1",
    "Nordd.Tiefld."
  ],
  "wittenberg": [
    "2",
    ""
  ],
  "schmalkalden-meiningen": [
    "2",
    ""
  ],
  "hildburghausen": [
    "2",
    ""
  ],
  "sonneberg": [
    "3",
    ""
  ],
  "suhl": [
    "3",
    ""
  ],
  "wartburgkreis": [
    "2",
    ""
  ],
  "eisenach": [
    "2",
    ""
  ],
  "eichsfeld": [
    "2",
    ""
  ],
  "nordhausen": [
    "2",
    ""
  ],
  "unstrut-hainich-kreis": [
    "2",
    ""
  ],
  "kyffhäuserkreis": [
    "2",
    ""
  ],
  "sömmerda": [
    "2",
    ""
  ],
  "gotha": [
    "2",
    ""
  ],
  "ilm-kreis": [
    "2",
    ""
  ],
  "weimarer land": [
    "2",
    ""
  ],
  "greiz": [
    "2",
    ""
  ],
  "saale-holzland-kreis": [
    "2",
    ""
  ],
  "saalfeld-rudolstadt": [
    "2",
    ""
  ],
  "altenburger land": [
    "2",
    ""
  ],
  "saale-orla-kreis": [
    "2",
    ""
  ],
  "erfurt": [
    "2",
    ""
  ],
  "weimar": [
    "2",
    ""
  ],
  "jena": [
    "2",
    ""
  ],
  "gera": [
    "2",
    ""
  ]
};

/**
 * Normalisiert einen Kreisbezeichner für den Lookup.
 * Entfernt "Landkreis", "Kreis", "Stadt", "kreisfreie Stadt" Präfixe,
 * wandelt in Kleinbuchstaben, entfernt Klammern-Suffixe wie (Oldenburg).
 */
function normalizeKreisName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/^(landkreis|kreis|kreisfreie stadt|stadt|lk\.|sk\.) /i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Sucht die Windzone für einen gegebenen Kreis/Landkreis-Namen.
 * Gibt null zurück wenn nicht gefunden.
 */
function getWindzone(kreisName) {
  const norm = normalizeKreisName(kreisName);
  // Direkter Treffer
  if (DIBT_WINDZONEN[norm] !== undefined) return DIBT_WINDZONEN[norm];
  // Partielle Suche (Fallback)
  for (const [key, val] of Object.entries(DIBT_WINDZONEN)) {
    if (norm.includes(key) || key.includes(norm)) return val;
  }
  return null;
}

/**
 * Sucht die Schneelastzone für einen gegebenen Kreis/Landkreis-Namen.
 * Gibt {slz: null, fn: ''} zurück wenn nicht gefunden.
 */
function getSchneelastzone(kreisName) {
  const norm = normalizeKreisName(kreisName);
  if (DIBT_SCHNEELASTZONEN[norm] !== undefined) {
    const [slz, fn] = DIBT_SCHNEELASTZONEN[norm];
    return { slz, fn };
  }
  for (const [key, val] of Object.entries(DIBT_SCHNEELASTZONEN)) {
    if (norm.includes(key) || key.includes(norm)) {
      return { slz: val[0], fn: val[1] };
    }
  }
  return { slz: null, fn: '' };
}
