/* Arany Régiség Center · tájékoztató árak (a napi világpiaci ár és az MNB-árfolyam alapján).
   Betöltés: <script src="assets/data/arak.js" defer></script>, a böngészőben window.ARC_ARAK.
   Az objektumon belül csak JSON-szintaxis lehet (idézőjeles kulcsok, nincs megjegyzés, nincs záró vessző),
   és ebbe a megjegyzésbe kapcsos zárójel nem kerülhet.
   Mértékegység: arany és ezüst Ft/g, érme Ft/db. A "jeloles" mező szövegét az ár mellé kell kiírni. */
window.ARC_ARAK = {
  "frissitve": "2026. november 12.",
  "minta": false,
  "jeloles": "Tájékoztató ár, a végleges ajánlat bevizsgálás után.",
  "megjegyzes": "Tájékoztató mintaár. A végleges ajánlat a bevizsgálás után születik.",
  "arany": [
    { "karat": "8 karát", "finomsag": "333", "pelda": "régi, olcsóbb ékszer", "tol": 11000, "ig": 13900, "egyseg": "Ft/g", "jeloles": "Tájékoztató ár, a végleges ajánlat bevizsgálás után." },
    { "karat": "9 karát", "finomsag": "375", "pelda": "angol és külföldi ékszer", "tol": 12400, "ig": 15600, "egyseg": "Ft/g", "jeloles": "Tájékoztató ár, a végleges ajánlat bevizsgálás után." },
    { "karat": "14 karát", "finomsag": "585", "pelda": "a leggyakoribb magyar ékszer", "tol": 19400, "ig": 24400, "egyseg": "Ft/g", "jeloles": "Tájékoztató ár, a végleges ajánlat bevizsgálás után." },
    { "karat": "18 karát", "finomsag": "750", "pelda": "nemesebb gyűrű, óratok", "tol": 24900, "ig": 31200, "egyseg": "Ft/g", "jeloles": "Tájékoztató ár, a végleges ajánlat bevizsgálás után." },
    { "karat": "22 karát", "finomsag": "916", "pelda": "aranyérme, keleti ékszer", "tol": 30400, "ig": 38100, "egyseg": "Ft/g", "jeloles": "Tájékoztató ár, a végleges ajánlat bevizsgálás után." },
    { "karat": "24 karát", "finomsag": "999", "pelda": "befektetési rúd és érme", "tol": 33200, "ig": 41600, "egyseg": "Ft/g", "jeloles": "Tájékoztató ár, a végleges ajánlat bevizsgálás után." }
  ],
  "ezust": [
    { "finomsag": "800", "pelda": "régi magyar és osztrák evőeszköz", "tol": 120, "ig": 440, "egyseg": "Ft/g", "jeloles": "Tájékoztató ár, a végleges ajánlat bevizsgálás után." },
    { "finomsag": "835", "pelda": "dísztárgy, tálca, gyertyatartó", "tol": 130, "ig": 460, "egyseg": "Ft/g", "jeloles": "Tájékoztató ár, a végleges ajánlat bevizsgálás után." },
    { "finomsag": "900", "pelda": "régi ezüstpénz", "tol": 140, "ig": 490, "egyseg": "Ft/g", "jeloles": "Tájékoztató ár, a végleges ajánlat bevizsgálás után." },
    { "finomsag": "925", "pelda": "sterling ezüst, ékszer", "tol": 140, "ig": 500, "egyseg": "Ft/g", "jeloles": "Tájékoztató ár, a végleges ajánlat bevizsgálás után." }
  ],
  "ermek_megjegyzes": "Az érmék ára a nemesfém-tartalomból számolt alsó érték. Ritka évjárat, jó állapot vagy verdejel esetén a gyűjtői érték ennél több lehet.",
  "ermek": [
    { "nev": "10 korona, arany", "kor": "Ferenc József, 1892-1915", "suly": "3,39 g, 900", "tol": 117000, "ig": 135000, "egyseg": "Ft/db", "jeloles": "Tájékoztató ár, a végleges ajánlat bevizsgálás után." },
    { "nev": "20 korona, arany", "kor": "Ferenc József, 1892-1916", "suly": "6,78 g, 900", "tol": 234000, "ig": 271000, "egyseg": "Ft/db", "jeloles": "Tájékoztató ár, a végleges ajánlat bevizsgálás után." },
    { "nev": "1 dukát, arany", "kor": "osztrák, Ferenc József", "suly": "3,49 g, 986", "tol": 132000, "ig": 153000, "egyseg": "Ft/db", "jeloles": "Tájékoztató ár, a végleges ajánlat bevizsgálás után." },
    { "nev": "4 dukát, arany", "kor": "osztrák, Ferenc József", "suly": "13,96 g, 986", "tol": 530000, "ig": 612000, "egyseg": "Ft/db", "jeloles": "Tájékoztató ár, a végleges ajánlat bevizsgálás után." },
    { "nev": "5 korona, ezüst", "kor": "Ferenc József, 1900-1909", "suly": "24 g, 900", "tol": 8800, "ig": 11300, "egyseg": "Ft/db", "jeloles": "Tájékoztató ár, a végleges ajánlat bevizsgálás után." },
    { "nev": "1 korona, ezüst", "kor": "Ferenc József, 1892-1916", "suly": "5 g, 835", "tol": 1700, "ig": 2200, "egyseg": "Ft/db", "jeloles": "Tájékoztató ár, a végleges ajánlat bevizsgálás után." },
    { "nev": "5 pengő, ezüst", "kor": "1930-1939", "suly": "25 g, 640", "tol": 6500, "ig": 8400, "egyseg": "Ft/db", "jeloles": "Tájékoztató ár, a végleges ajánlat bevizsgálás után." },
    { "nev": "2 pengő, ezüst", "kor": "1929-1939", "suly": "10 g, 640", "tol": 2600, "ig": 3300, "egyseg": "Ft/db", "jeloles": "Tájékoztató ár, a végleges ajánlat bevizsgálás után." }
  ]
};
