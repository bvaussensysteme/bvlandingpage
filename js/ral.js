/* RAL-Farben – die einzige Tabelle im Projekt.
 *
 * ANLASS DER AUSLAGERUNG. Bis zum 29.10.2026 stand die Tabelle mitsamt
 * Suche nur in js/konfigurator-3d.js. Der Betreiber wollte die Suche auch
 * im Anfrage-Assistenten haben: „baue hier als sechste kachel so ähnlich
 * wie im 3d konfigurator wo man RAL farbe suchen oder eingeben kann".
 *
 * Eine zweite Kopie wäre der sichere Weg in zwei Wahrheiten gewesen – 217
 * Zeilen, die beim nächsten Nachtrag auseinanderlaufen. Deshalb steht sie
 * jetzt hier, und beide Seiten lesen daraus. Dasselbe Muster wie bei
 * js/markisenstoffe.js.
 *
 * WAS HIER NICHT STEHT: alles, was Bedienung ist. Trefferliste, Eingabe-
 * feld und Knöpfe bleiben dort, wo sie hingehören – im Konfigurator bzw.
 * im Assistenten. Hier liegen nur die Daten und die Suchlogik.
 *
 * HERKUNFT DER WERTE: siehe die Begründung am Tabellenkopf unten. Die
 * Farbwerte sind NÄHERUNGEN für die Bildschirmdarstellung; verbindlich
 * ist der RAL-Fächer. Genau das steht auch in beiden Bedienfeldern.
 */
(function () {
  'use strict';

  var RAL = {
    '1000': [0xcdba88, 'Grünbeige'],
    '1001': [0xd0b084, 'Beige'],
    '1002': [0xd2aa6d, 'Sandgelb'],
    '1003': [0xf9a800, 'Signalgelb'],
    '1004': [0xe49e00, 'Goldgelb'],
    '1005': [0xcb8e00, 'Honiggelb'],
    '1006': [0xe29000, 'Maisgelb'],
    '1007': [0xe88c00, 'Narzissengelb'],
    '1011': [0xaf804f, 'Braunbeige'],
    '1012': [0xddaf27, 'Zitronengelb'],
    '1013': [0xe3d9c6, 'Perlweiß'],
    '1014': [0xddc49a, 'Elfenbein'],
    '1015': [0xe6d2b5, 'Hellelfenbein'],
    '1016': [0xf1dd38, 'Schwefelgelb'],
    '1017': [0xf6a950, 'Safrangelb'],
    '1018': [0xfaca30, 'Zinkgelb'],
    '1019': [0xa48f7a, 'Graubeige'],
    '1020': [0xa08f65, 'Olivgelb'],
    '1021': [0xf0ca00, 'Rapsgelb'],
    '1023': [0xf7b500, 'Verkehrsgelb'],
    '1024': [0xba8f4c, 'Ockergelb'],
    '1026': [0xffff00, 'Leuchtgelb'],
    '1027': [0xa77f0e, 'Currygelb'],
    '1028': [0xff9b00, 'Melonengelb'],
    '1032': [0xe2a300, 'Ginstergelb'],
    '1033': [0xf99a1c, 'Dahliengelb'],
    '1034': [0xeb9c52, 'Pastellgelb'],
    '1035': [0x908370, 'Perlbeige'],
    '1036': [0x80643f, 'Perlgold'],
    '1037': [0xf09200, 'Sonnengelb'],
    '2000': [0xdd7907, 'Gelborange'],
    '2001': [0xbe4e20, 'Rotorange'],
    '2002': [0xc63927, 'Blutorange'],
    '2003': [0xfa842b, 'Pastellorange'],
    '2004': [0xe25303, 'Reinorange'],
    '2005': [0xff2300, 'Leuchtorange'],
    '2007': [0xffa421, 'Leuchthellorange'],
    '2008': [0xf3752c, 'Hellrotorange'],
    '2009': [0xe15501, 'Verkehrsorange'],
    '2010': [0xd4652f, 'Signalorange'],
    '2011': [0xec7c25, 'Tieforange'],
    '2012': [0xdb6a50, 'Lachsorange'],
    '2013': [0x954527, 'Perlorange'],
    '2017': [0xfa4402, 'RAL Orange'],
    '3000': [0xa72920, 'Feuerrot'],
    '3001': [0xa02128, 'Signalrot'],
    '3002': [0xa1232b, 'Karminrot'],
    '3003': [0x8d1d2c, 'Rubinrot'],
    '3004': [0x6b1c23, 'Purpurrot'],
    '3005': [0x59191f, 'Weinrot'],
    '3007': [0x402225, 'Schwarzrot'],
    '3009': [0x703731, 'Oxidrot'],
    '3011': [0x7e292c, 'Braunrot'],
    '3012': [0xcb8d73, 'Beigerot'],
    '3013': [0x9c322e, 'Tomatenrot'],
    '3014': [0xd47479, 'Altrosa'],
    '3015': [0xe1a6ad, 'Hellrosa'],
    '3016': [0xac4034, 'Korallenrot'],
    '3017': [0xd3545f, 'Rosé'],
    '3018': [0xd14152, 'Erdbeerrot'],
    '3020': [0xc1121c, 'Verkehrsrot'],
    '3022': [0xd56d56, 'Lachsrot'],
    '3024': [0xf70000, 'Leuchtrot'],
    '3026': [0xff0000, 'Leuchthellrot'],
    '3027': [0xb42041, 'Himbeerrot'],
    '3028': [0xe72512, 'Reinrot'],
    '3031': [0xac323b, 'Orientrot'],
    '3032': [0x711521, 'Perlrubinrot'],
    '3033': [0xb24c43, 'Perlrosa'],
    '4001': [0x8a5a83, 'Rotlila'],
    '4002': [0x933d50, 'Rotviolett'],
    '4003': [0xd15b8f, 'Erikaviolett'],
    '4004': [0x691639, 'Bordeauxviolett'],
    '4005': [0x83639d, 'Blaulila'],
    '4006': [0x992572, 'Verkehrspurpur'],
    '4007': [0x4a203b, 'Purpurviolett'],
    '4008': [0x904684, 'Signalviolett'],
    '4009': [0xa38995, 'Pastellviolett'],
    '4010': [0xc63678, 'Telemagenta'],
    '4011': [0x8773a1, 'Perlviolett'],
    '4012': [0x6b6880, 'Perlbrombeer'],
    '5000': [0x384c70, 'Violettblau'],
    '5001': [0x1f4764, 'Grünblau'],
    '5002': [0x2b2c7c, 'Ultramarinblau'],
    '5003': [0x2a3756, 'Saphirblau'],
    '5004': [0x1d1f2a, 'Schwarzblau'],
    '5005': [0x154889, 'Signalblau'],
    '5007': [0x41678d, 'Brillantblau'],
    '5008': [0x313c48, 'Graublau'],
    '5009': [0x2e5978, 'Azurblau'],
    '5010': [0x0e294b, 'Enzianblau'],
    '5011': [0x232c3f, 'Stahlblau'],
    '5012': [0x3481b8, 'Lichtblau'],
    '5013': [0x232d53, 'Kobaltblau'],
    '5014': [0x606e8c, 'Taubenblau'],
    '5015': [0x2874b2, 'Himmelblau'],
    '5017': [0x0e518d, 'Verkehrsblau'],
    '5018': [0x21888f, 'Türkisblau'],
    '5019': [0x1a5784, 'Capriblau'],
    '5020': [0x0b4151, 'Ozeanblau'],
    '5021': [0x07737a, 'Wasserblau'],
    '5022': [0x2f2a5a, 'Nachtblau'],
    '5023': [0x4d668e, 'Fernblau'],
    '5024': [0x5d9b9b, 'Pastellblau'],
    '5025': [0x296478, 'Perlenzian'],
    '5026': [0x102c54, 'Perlnachtblau'],
    '6000': [0x327662, 'Patinagrün'],
    '6001': [0x28713e, 'Smaragdgrün'],
    '6002': [0x276235, 'Laubgrün'],
    '6003': [0x4b573e, 'Olivgrün'],
    '6004': [0x0e4243, 'Blaugrün'],
    '6005': [0x0f4336, 'Moosgrün'],
    '6006': [0x40433b, 'Grauoliv'],
    '6007': [0x283424, 'Flaschengrün'],
    '6008': [0x35382e, 'Braungrün'],
    '6009': [0x27352a, 'Tannengrün'],
    '6010': [0x3e753b, 'Grasgrün'],
    '6011': [0x587246, 'Resedagrün'],
    '6012': [0x31403d, 'Schwarzgrün'],
    '6013': [0x797c5a, 'Schilfgrün'],
    '6014': [0x444337, 'Gelboliv'],
    '6015': [0x3d403a, 'Schwarzoliv'],
    '6016': [0x026a52, 'Türkisgrün'],
    '6017': [0x468641, 'Maigrün'],
    '6018': [0x48a43f, 'Gelbgrün'],
    '6019': [0xb7d9b1, 'Weißgrün'],
    '6020': [0x354733, 'Chromoxidgrün'],
    '6021': [0x89ac76, 'Blassgrün'],
    '6022': [0x3e3c32, 'Braunoliv'],
    '6024': [0x008754, 'Verkehrsgrün'],
    '6025': [0x53753c, 'Farngrün'],
    '6026': [0x005d52, 'Opalgrün'],
    '6027': [0x81c0bb, 'Lichtgrün'],
    '6028': [0x2d5546, 'Kieferngrün'],
    '6029': [0x007243, 'Minzgrün'],
    '6031': [0x495746, 'Bronzegrün'],
    '6032': [0x0f8558, 'Signalgrün'],
    '6033': [0x478a84, 'Minttürkis'],
    '6034': [0x7fb0b2, 'Pastelltürkis'],
    '6035': [0x1b542c, 'Perlgrün'],
    '6036': [0x005d4c, 'Perlopalgrün'],
    '6037': [0x25e712, 'Reingrün'],
    '6038': [0x00f700, 'Leuchtgrün'],
    '6039': [0xb3c43e, 'Fasergrün'],
    '7000': [0x7e8b92, 'Fehgrau'],
    '7001': [0x8f999f, 'Silbergrau'],
    '7002': [0x817f68, 'Olivgrau'],
    '7003': [0x7a7b6d, 'Moosgrau'],
    '7004': [0x969992, 'Signalgrau'],
    '7005': [0x6b716f, 'Mausgrau'],
    '7006': [0x756f61, 'Beigegrau'],
    '7008': [0x746643, 'Khakigrau'],
    '7009': [0x5b6259, 'Grüngrau'],
    '7010': [0x575d57, 'Zeltgrau'],
    '7011': [0x555d61, 'Eisengrau'],
    '7012': [0x4e5452, 'Basaltgrau'],
    '7013': [0x555548, 'Braungrau'],
    '7015': [0x434b4d, 'Schiefergrau'],
    '7016': [0x383e42, 'Anthrazitgrau'],
    '7021': [0x2f3234, 'Schwarzgrau'],
    '7022': [0x4c4a44, 'Umbragrau'],
    '7023': [0x818479, 'Betongrau'],
    '7024': [0x45494e, 'Graphitgrau'],
    '7026': [0x374447, 'Granitgrau'],
    '7030': [0x939388, 'Steingrau'],
    '7031': [0x5d6970, 'Blaugrau'],
    '7032': [0xb9b9a8, 'Kieselgrau'],
    '7033': [0x818979, 'Zementgrau'],
    '7034': [0x939176, 'Gelbgrau'],
    '7035': [0xd7d7d7, 'Lichtgrau'],
    '7036': [0x9c9c9c, 'Platingrau'],
    '7037': [0x7d7f7d, 'Staubgrau'],
    '7038': [0xb5b8b1, 'Achatgrau'],
    '7039': [0x6c6960, 'Quarzgrau'],
    '7040': [0x9da3a6, 'Fenstergrau'],
    '7042': [0x8d948d, 'Verkehrsgrau A'],
    '7043': [0x4e5452, 'Verkehrsgrau B'],
    '7044': [0xc5c7c4, 'Seidengrau'],
    '7045': [0x91969a, 'Telegrau 1'],
    '7046': [0x82898f, 'Telegrau 2'],
    '7047': [0xcfd0cf, 'Telegrau 4'],
    '7048': [0x888175, 'Perlmausgrau'],
    '8000': [0x887142, 'Grünbraun'],
    '8001': [0x9c6b30, 'Ockerbraun'],
    '8002': [0x7b5141, 'Signalbraun'],
    '8003': [0x80542f, 'Lehmbraun'],
    '8004': [0x8f4e35, 'Kupferbraun'],
    '8007': [0x6f4a2f, 'Rehbraun'],
    '8008': [0x6f4f28, 'Olivbraun'],
    '8011': [0x5a3a29, 'Nussbraun'],
    '8012': [0x673831, 'Rotbraun'],
    '8014': [0x4a3526, 'Sepiabraun'],
    '8015': [0x633a34, 'Kastanienbraun'],
    '8016': [0x4c2f26, 'Mahagonibraun'],
    '8017': [0x442f29, 'Schokoladenbraun'],
    '8019': [0x3d3635, 'Graubraun'],
    '8022': [0x1a1718, 'Schwarzbraun'],
    '8023': [0xa65e2f, 'Orangebraun'],
    '8024': [0x79553c, 'Beigebraun'],
    '8025': [0x755c49, 'Blassbraun'],
    '8028': [0x4e3b2b, 'Terrabraun'],
    '8029': [0x773c27, 'Perlkupfer'],
    '9001': [0xe9e0d2, 'Cremeweiß'],
    '9002': [0xd7d5c9, 'Grauweiß'],
    '9003': [0xf4f4f4, 'Signalweiß'],
    '9004': [0x282828, 'Signalschwarz'],
    '9005': [0x0a0a0a, 'Tiefschwarz'],
    '9006': [0xa5a5a5, 'Weißaluminium'],
    '9007': [0x8f8f8c, 'Graualuminium'],
    '9010': [0xf1f0ea, 'Reinweiß'],
    '9011': [0x1c1c1c, 'Graphitschwarz'],
    '9012': [0xfffde6, 'Reinraumweiß'],
    '9016': [0xf1f1f1, 'Verkehrsweiß'],
    '9017': [0x1e1e1e, 'Verkehrsschwarz'],
    '9018': [0xcfd3cd, 'Papyrusweiß'],
    '9022': [0x858583, 'Perlhellgrau'],
    '9023': [0x787b7a, 'Perldunkelgrau']
  };

  var RAL_FAMILIE = {
    '1': ['gelb', 'beige', 'elfenbein', 'creme', 'sand', 'ocker', 'curry', 'honig'],
    '2': ['orange', 'lachs'],
    '3': ['rot', 'rose', 'rosa', 'purpur', 'erdbeer', 'pink', 'bordeaux', 'wein'],
    '4': ['violett', 'lila', 'flieder', 'purpur', 'bordeaux', 'magenta'],
    '5': ['blau', 'tuerkis', 'turkis', 'azur', 'ultramarin'],
    '6': ['gruen', 'grun', 'oliv', 'moos', 'tanne', 'smaragd', 'minze'],
    '7': ['grau', 'silber', 'anthrazit', 'basalt', 'schiefer', 'beton'],
    '8': ['braun', 'beige', 'ocker', 'kupfer', 'terrakotta', 'schokolade', 'mahagoni'],
    '9': ['weiss', 'weis', 'schwarz', 'perl', 'alu', 'aluminium', 'creme', 'elfenbein']
  };

  function ralFlach(t) {
    return String(t || '').toLowerCase()
      .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss').replace(/é/g, 'e').replace(/[^a-z0-9]/g, '');
  }

  function ralSuchen(frage) {
    var f = ralFlach(frage);
    if (!f) return [];
    var zahl = /^\d+$/.test(f);
    var treffer = [];
    Object.keys(RAL).forEach(function (n) {
      var name = ralFlach(RAL[n][1]);
      var rang = -1;
      if (zahl) {
        if (n.indexOf(f) === 0) rang = 0;            // Nummer von vorne
        else if (n.indexOf(f) > -1) rang = 5;
      } else {
        var fam = RAL_FAMILIE[n.charAt(0)] || [];
        var inFam = fam.some(function (w) {
          return w.indexOf(f) === 0 || f.indexOf(w) === 0;
        });
        var drin = name.indexOf(f) > -1;
        var endet = drin && name.lastIndexOf(f) === name.length - f.length;
        if (endet && inFam) rang = 1;        // Sepiabraun bei „Braun"
        else if (inFam && drin) rang = 2;    // Moosgrün bei „Moos"
        else if (inFam) rang = 3;            // der Rest der Familie
        else if (endet) rang = 3;
        else if (drin) rang = 4;             // Braunbeige bei „Braun"
      }
      if (rang > -1) treffer.push({ nr: n, rang: rang });
    });
    treffer.sort(function (a, b) { return a.rang - b.rang || (a.nr < b.nr ? -1 : 1); });
    return treffer;
  }

  window.BV_RAL = {
    TABELLE: RAL,
    FAMILIE: RAL_FAMILIE,
    flach: ralFlach,
    suchen: ralSuchen
  };
})();
