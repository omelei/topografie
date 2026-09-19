/**
 * Dutch copy. Every user-visible string in the product lives here.
 *
 * Wording follows docs/leer.nu oefenkaart.html and the app design where they
 * specify it; the rest is written for readers of roughly AVI-M6: short
 * sentences, common words, active voice, second person. Two habits that matter
 * more than they look: we say what happens rather than what the system does
 * ("je naam blijft op dit apparaat", not "gegevens worden lokaal opgeslagen"),
 * and we never use a word a ten-year-old would have to guess at.
 */
export const nl = {
  // Home
  // K1, de landingspagina. De begroeting zet het kind bovenaan het scherm; de
  // zin eronder zegt wat je hier doet, in de volgorde waarin je het doet: een
  // vak kiezen, een ronde doen, en wat dat oplevert (herontwerp 2026-09).
  //
  // Hij noemt nog steeds geen aantal. "Vandaag oefen je 10 vragen" las als een
  // opdracht met een plafond: tien, en dan ben je klaar. Niets in het product
  // stopt na tien.
  'home.welcome': 'Welkom {naam}!',
  'home.todayOpen': 'Kies een vak, doe een ronde en kijk wat je al onthoudt.',
  // De rondes die je begon en niet afmaakte (ADR-115), in de plaats van de
  // moduletegels van "Verder oefenen". Tikken vraagt wat die ronde nog niet
  // had gevraagd, op dezelfde manier.
  'home.openTitle': 'Maak af',
  'home.openNone': 'Stop je halverwege een ronde? Dan kun je hem hier afmaken.',
  'home.openRest': 'Nog {aantal} van de {totaal} vragen',
  'home.openRestOne': 'Nog 1 van de {totaal} vragen',
  // De tegels tussen het toetsblok en het logboek: waar je zelf het vaakst
  // naar teruggaat, met het aantal keer erbij. Dat getal komt van dit apparaat
  // en van niets anders - er is geen server die meekijkt, dus er is ook geen
  // "3.412 keer gespeeld" te tonen dat waar zou zijn.
  'home.popularTitle': 'Meest geoefend',
  // Dezelfde rij, voor wie nog niets deed. "Meest geoefend" is dan een kop over
  // een geschiedenis die niet bestaat (ADR-131).
  'home.popularStart': 'Hier begin je mee',
  'home.popularTimes': '{aantal} keer gespeeld',
  'home.popularOnce': '1 keer gespeeld',
  'home.popularNone': 'nog niet geoefend',
  // De voorspelling stond hier en staat nu alleen nog op K9. Weg in plaats van
  // ongebruikt blijven staan: copy die nergens meer verschijnt is copy die
  // niemand nog leest en die bij de volgende ronde toch wordt meegewogen.
  // Wat je net gedaan hebt, met het cijfer erbij. Een logboek, geen ranglijst:
  // het staat er in de volgorde waarin het gebeurde en telt niets bij elkaar op.
  // "Vandaag": het dagplan (ADR-126). Het getal is van het kind zelf en staat
  // er dus ook zonder code; het plan eronder is waar premium voor is.
  'vandaag.titel': 'Vandaag herhalen',
  'vandaag.eenKlaar': 'Er staat 1 vraag klaar die je bijna vergeet.',
  'vandaag.klaar': 'Er staan {aantal} vragen klaar die je bijna vergeet.',
  'vandaag.eenVraag': 'Er is 1 vraag die je bijna vergeet.',
  'vandaag.vragen': 'Er zijn {aantal} vragen die je bijna vergeet.',
  'vandaag.ronde': '{aantal} vragen',
  // Het slinken en de bodem (ADR-139). "Klaar voor vandaag" en niet "je bent
  // bij": het plan is hoogstens vier rondes, dus verderop kan nog werk liggen.
  'vandaag.gedaan': '{gedaan} van de {totaal} gedaan.',
  'vandaag.klaarVoorVandaag': 'Klaar voor vandaag.',
  'vandaag.klaarUitleg': 'Je hebt alles herhaald wat vandaag aan de beurt was.',
  'vandaag.over': 'Nog {aantal} van vandaag.',
  'vandaag.overEen': 'Nog 1 van vandaag.',
  'vandaag.verder': 'Volgende ronde',
  // Waar dit kind zelf voor gaat (ADR-141). Een diploma, want dat is de enige
  // mijlpaal in dit product die een kind van acht zelf zou noemen — en de
  // voortgang eronder is hoeveel het van die set onthoudt, wat toevallig ook
  // precies zegt wat er nog te doen is.
  'doel.titel': 'Waar je voor gaat',
  'doel.vraag': 'Kies een diploma om voor te gaan.',
  'doel.nu': 'Waar ga je nu voor?',
  'doel.rij': 'Diploma \u00b7 je onthoudt er {onthouden} van de {totaal}',
  'doel.diplomaVan': 'Diploma {naam}',
  'doel.onthouden': 'Je onthoudt er {onthouden} van de {totaal}.',
  'doel.balk': '{onthouden} van de {totaal} onthouden',
  'doel.rijp': 'Je kent ze allemaal. Nu de toets.',
  'doel.oefenen': 'Oefenen',
  'doel.toets': 'Doe de toets',
  'doel.ander': 'Ander doel kiezen',
  'doel.gehaald': 'Gehaald! Je hebt het diploma {naam}.',
  'doel.later': 'Even geen doel',
  'doel.alles': 'Je hebt alle diploma\u2019s die je kunt halen.',
  // Onder de voorstellen: naar de prijzenkast op Jij, met ook wat nog te halen
  // is open (ADR-153).
  'doel.alleDiplomas': 'Bekijk alle diploma’s',
  'doel.gehaaldRonde': 'Dit was waar je voor ging.',
  // Het einde van een ronde, aangekondigd (ADR-140).
  'practice.laatsteVraag': 'Laatste vraag',
  // Het begin van een ronde (ADR-140): de zin waarmee dit product zijn eigen
  // methode uitlegt, op het moment dat die methode op een fout lijkt.
  'start.eerderGehad': '{eerder} van de {totaal} heb je eerder gehad. Dat is de bedoeling.',

  'home.recentTitle': 'Recent geoefend',
  'home.recentNone': 'Nog niets geoefend. Na je eerste ronde staat het hier.',
  'home.recentOutOf': '{goed} van de {totaal} goed',
  'home.recentLine': 'Cijfer {cijfer} · {goed} van de {totaal} goed',
  // De twee knoppen boven een rij, die hem een kaart opschuiven. Ze noemen de
  // rij, want er staan er drie onder elkaar en "verder" alleen zegt niet welke.
  'home.rowBack': 'Terug in {rij}',
  'home.rowOn': 'Verder in {rij}',

  // Waar je zelf steeds naar teruggaat, in één tik. Geen aanbeveling en geen
  // algoritme: het is wat je het vaakst gekozen hebt.
  'home.favouritesTitle': 'Jouw favorieten',
  'home.favouritesNone': 'Nog geen favorieten. Wat je vaak oefent, komt hier te staan.',

  // De weekkaart (ADR-149), waar de reeks stond. Dagen tellen, reeksen niet:
  // er staat nergens "op rij" of "gemist", en een lege dag haalt niets weg.
  // Het doel kiest een kind samen met een ouder, twee tot vijf dagen.
  // Terugkomen na weken (ADR-149): geen gemiste dagen, wel wat er nog staat.
  'terug.titel': 'Welkom terug',
  'terug.zin': 'Je toren staat er nog.',
  'terug.klaar': '{aantal} stenen liggen klaar.',
  'terug.klaarEen': '1 steen ligt klaar.',
  'terug.minuutEen': 'De eerste ronde duurt ongeveer 1 minuut.',
  'terug.minuten': 'De eerste ronde duurt ongeveer {minuten} minuten.',
  'terug.knop': 'Opfrissen',
  // Het jaaroverzicht op Jij, om te laten zien of te printen.
  'jaar.titel': 'Jouw schooljaar',
  'jaar.kop': 'De toren van {naam}, schooljaar {van}–{tot}',
  'jaar.stenen': '{aantal} stenen in totaal',
  'jaar.steenEen': '1 steen in totaal',
  'jaar.verdiepingen': '{aantal} verdiepingen dit schooljaar, {totaal} in totaal',
  'jaar.hoogte': '{meter} meter hoog',
  'jaar.reeks': 'Je langste reeks: {aantal} dagen',
  'jaar.diplomas': 'Diploma’s',
  'jaar.print': 'Print je schooljaar',
  // Afzwemmen (ADR-149): vooraf wat er gevraagd wordt, of de pagina rijp is, en
  // of er iemand meekijkt. Een diploma komt alleen op een rijpe pagina.
  'afzwemmen.titel': 'Afzwemmen: {naam}',
  'afzwemmen.eisenTitel': 'Wat je moet doen',
  'afzwemmen.eisAlles': '{vragen} sommen, en ze moeten allemaal goed.',
  'afzwemmen.eisEenFout': 'Eén fout, en deze poging is voorbij.',
  'afzwemmen.eisVragen': '{vragen} vragen, en je hebt er {drempel} goed nodig.',
  'afzwemmen.eisStil': 'Je hoort pas aan het eind hoe het ging.',
  'afzwemmen.eisOpnieuw': 'Lukt het nog niet? Dan doe je het een andere dag opnieuw.',
  'afzwemmen.rijpZin':
    'Je onthoudt er {onthouden} van de {totaal}. Dat is genoeg voor het diploma.',
  'afzwemmen.nietRijpTitel': 'Nog niet klaar om af te zwemmen',
  'afzwemmen.nietRijpZin':
    'Je onthoudt er nu {onthouden} van de {totaal}. Voor het diploma moet je er {nodig} onthouden.',
  'afzwemmen.nietRijpUitleg':
    'Een plaatje krijgt kleur als je het op verschillende dagen goed weet. Proefzwemmen kan al, maar het diploma krijg je dan nog niet.',
  'afzwemmen.alGehaald': 'Dit diploma heb je al. De datum op je diploma blijft staan.',
  'afzwemmen.meekijkenVraag': 'Wil je dat iemand meekijkt?',
  'afzwemmen.meekijkenUitleg':
    'Haal je vader, moeder of wie voor je zorgt erbij. Dan zien jullie samen hoe het gaat.',
  'afzwemmen.samen': 'Is er iemand bij je? Begin dan samen.',
  'afzwemmen.metIemand': 'Ja, ik haal iemand',
  'afzwemmen.zonder': 'Nee, ik begin',
  'afzwemmen.begin': 'Begin',
  'afzwemmen.terug': 'Terug',
  'afzwemmen.oefen': 'Eerst oefenen',
  'afzwemmen.proef': 'Proefzwemmen',
  'afzwemmen.proefGehaald': 'Proefzwemmen gelukt.',
  // Niet nog een keer "dit was proefzwemmen": dat staat er met
  // `afzwemmen.proefGehaald` al boven. Wel wat het voor vandaag betekent, want
  // de regel erboven kan "met 5 goed is hij van jou" zijn en dat gaat over een
  // andere dag dan deze.
  'afzwemmen.proefUitleg':
    'Bij proefzwemmen krijg je nog geen diploma. Dat komt als je albumpagina klaar is om af te zwemmen.',
  'afzwemmen.print': 'Print je diploma',
  'afzwemmen.printNaam': 'Gehaald door {naam}',
  'afzwemmen.printZonderNaam': 'Gehaald',
  'afzwemmen.printDatum': 'op {datum}',
  // De seizoenen op een diploma, voor de bijhoudstempels.
  // De prijzenkast, sinds ADR-158 op Voor ouders: eerst wat gehaald is, en de
  // gaten pas als je erom vraagt. Op een modulepagina blijft elk gat een
  // uitnodiging, want daar is hij aan te raken; hier is hij dat niet. De
  // knoppen spreken de ouder aan, want dit is zijn pagina.
  'prijzenkast.meer': 'Laat zien wat er nog te halen is',
  'prijzenkast.minder': 'Laat alleen zien wat gehaald is',
  // Wat er wel is maar niet vooraan hoeft (ADR-143).
  'uitklap.tabel': 'Laat de tabel zien',
  'uitklap.tabelDicht': 'Verberg de tabel',
  'uitklap.uitlegDicht': 'Verberg de uitleg',
  'home.modules': 'Wat je kunt oefenen',
  'home.continueTitle': 'Verder waar je was',
  'home.retention': 'weet je hier over drie weken nog van',
  'home.setMastered': '{goed} van de {totaal} onthoud je',
  'home.setNew': 'nog niet geoefend',

  // The frame. Module order is ADR-029; only the ones with content are shown,
  // so six of these seven are written down before they are needed rather than
  // guessed at when they are.
  'nav.modules': 'Modules',
  // Het logo linksboven, dat naar de voordeur gaat. De naam van de knop noemt
  // het merk en wat de knop doet: een merkteken alleen zegt niet waar je
  // uitkomt, en "Naar Vandaag" alleen laat de naam van het product uit het
  // scherm verdwijnen voor wie het niet ziet. De merknaam komt uit brand.ts.
  'nav.home': '{merk}, naar Vandaag',
  'nav.destinations': 'Waar je heen kunt',
  // Het vakmenu onder de balk op een tablet en een telefoon, waar de rail niet
  // staat. De knop zegt welk vak je open hebt; waar je in geen vak bent noemt
  // hij wat hij doet, want daar is hij de weg naar een ronde (ADR-121). De naam
  // voor een schermlezer zet het woord "vak" voor het vak, omdat "Topo" alleen
  // niet zegt waarvan het er een is.
  'nav.vakKies': 'Oefenen',
  'nav.vakHuidig': 'vak {vak}',
  'nav.vandaag': 'Vandaag',
  'nav.onthouden': 'Onthouden',
  'nav.vrienden': 'Vrienden',
  'nav.jij': 'Jij',
  // De rail draagt korte woorden, zoals K1 ze tekent: "topo", niet
  // "Topografie". Een rail van 88 breed leest als een lijst en niet als proza.
  'module.topo': 'Topo',
  'module.tafels': 'Rekenen',
  'module.klok': 'Klok',
  'module.woorden': 'Taal',
  'module.tijdvakken': 'Tijdvakken',
  'module.vlaggen': 'Vlaggen',

  // K9, wat je onthoudt. De tabel is het detail, de punten erboven zijn alles
  // in één blik — dezelfde vorm, kleiner, geen tweede diagram om te leren.
  'retention.title': 'Wat je onthoudt',
  // Elk vak, niet alleen topografie (ADR-112). De zin eronder zegt wat
  // onthouden hier betekent (ADR-114): na een week nog goed.
  'retention.intro':
    'Hoeveel je onthoudt en hoe je oefent. Iets onthoud je als je het nog weet nadat er een week tussen zat.',
  // De bovenkant van de pagina (ADR-148): alles bij elkaar, over elk vak.
  'retention.geheugenTitel': 'Je geheugen',
  'retention.geheugenEen': 'onderdeel onthoud je',
  'retention.geheugenVeel': 'onderdelen onthoud je',
  'retention.geheugenVan': 'van de {aantal} die je geoefend hebt',
  'retention.geheugenLeeg':
    'Je hebt nog niets geoefend. Na je eerste ronde zie je hier wat je onthoudt.',
  // In de ring staat het getal met deze twee woorden eronder; de zin ernaast
  // zegt het voluit, en dat is ook wat een schermlezer hoort.
  'retention.ringLabel': 'over 3 weken',
  'retention.ringZin': 'Over drie weken weet je van alles wat je geoefend hebt nog {procent}%.',
  'retention.vakTitel': 'Per vak',
  'retention.vakRegel': '{onthouden} onthoud je, {geoefend} geoefend, {totaal} in totaal',
  'retention.vakLeeg': 'Nog niet geoefend, {totaal} in totaal',
  // Alles wat er ooit geoefend is, en de laatste acht weken. "Goed beantwoord"
  // en "Foutloos op rij" stonden in de kolom naast elke pagina; hier staan ze
  // bij de rest van hoe het oefenen gaat. Nadrukkelijk niet hetzelfde als wat
  // je onthoudt: dit gaat over antwoorden die je gaf, dat over wat blijft.
  'retention.verloopTitel': 'Week na week',
  'retention.cijferGoed': 'Goed beantwoord',
  'retention.cijferRondes': 'Rondes in totaal',
  'retention.cijferVragen': 'Vragen in totaal',
  'retention.grafiek': 'Vragen per week',
  'retention.grafiekWk': 'wk {nummer}',
  'retention.grafiekNu': 'nu',
  'retention.grafiekZin': 'Week {nummer}: {goed} van de {totaal} vragen goed.',
  'retention.grafiekDezeZin': 'Deze week: {goed} van de {totaal} vragen goed.',
  'retention.grafiekGoed': 'goed',
  'retention.grafiekFout': 'niet goed',
  'retention.onderwerpTitel': 'Per onderwerp',
  'retention.welkVak': 'Welk vak?',
  'retention.welkOnderwerp': 'Welk onderwerp?',
  'retention.welkeSom': 'Welke sommen?',
  // De vier statussen als tegels; samen zijn ze het hele onderwerp. "Vandaag op
  // de rol" is weg: dat ging over het schema, niet over wat je onthoudt.
  'retention.tegelOnthouden': 'Onthoud je',
  'retention.tegelOpfrissen': 'Even opfrissen',
  'retention.tegelOefenen': 'Nog aan het oefenen',
  'retention.tegelNieuw': 'Nog niet geoefend',
  'retention.detail': 'Per onderdeel',
  'retention.glance': 'Alles in één blik',
  // De tabel: hoe vaak, hoeveel procent goed, en wanneer het laatst. "Weer op"
  // is weg; wanneer iets terugkomt is de zaak van de volgende ronde.
  'retention.item': 'Onderdeel',
  'retention.status': 'Hoe het gaat',
  'retention.aantal': 'Aantal',
  'retention.procentGoed': '% goed',
  'retention.procent': '{procent}%',
  'retention.overDrieWeken': 'Over 3 weken',
  'retention.laatst': 'Laatst geoefend',
  'retention.vandaag': 'vandaag',
  'retention.dagGeleden': '1 dag geleden',
  'retention.dagenGeleden': '{aantal} dagen geleden',
  'retention.nooit': '–',
  // Wat onthouden is, uitgeschreven zoals de regels van de reeks (ADR-114).
  // De gratis voorproef (ADR-124): de pagina zegt welk onderwerp ze laat zien,
  // want zonder de chips kan een kind niet zien dat er meer is.
  'retention.voorproef':
    'Je ziet hier {onderwerp}. Met premium kies je elk vak en elk onderwerp, en zie je het per onderdeel.',
  'retention.regelsTitel': 'Wanneer onthoud je iets?',
  'retention.regel1':
    'Een goed antwoord telt pas als het weer aan de beurt was. Nog een keer goed op dezelfde middag is oefenen, nog geen onthouden.',
  'retention.regel2':
    'Onthouden is drie keer goed op verschillende dagen, met minstens een week tussen de eerste en de laatste keer.',
  'retention.regel3':
    'Heb je iets heel lang niet gezien, dan staat er even opfrissen. Eén goed antwoord en je onthoudt het weer.',
  'retention.regel4': 'Eén fout antwoord en je begint bij dat onderdeel weer bij het begin.',

  // Het toetsenblok, bovenaan de eigen kolom van het kind. Het is de reden dat
  // het kind deze week oefent, en het zegt alleen dat: wanneer, en waarover.
  'home.testLabel': 'toets',
  'home.testNone': 'Nog geen toetsdatum',
  // Meer dan één, want een periode is nooit één toets: topografie op dinsdag en
  // de tafels de vrijdag erna. Het blok toont ze allemaal en verder niets.
  'home.testTitle': 'Jouw toetsen',
  'home.testToday': 'De toets is vandaag',
  'home.testTomorrow': 'De toets is morgen',
  'home.testInDays': 'Toets over {aantal} dagen',
  'home.testPick': 'Wanneer is de toets?',
  // Het vooruitzicht per toets (ADR-127): de enige plek waar de voorspelling
  // naar een dátum rekent in plaats van naar drie weken vooruit.
  'home.testNothingYet': 'Hier heb je nog niets van geoefend.',
  'home.testForecast': 'Op de dag van de toets weet je hier naar verwachting {procent}% van.',
  'home.testForecastRound': 'Doe vandaag een ronde: dan is het {procent}%.',
  'home.testAdd': 'Toets toevoegen',
  'home.testSave': 'Toevoegen',
  'home.testRemove': 'Verwijder',
  // Begint met het woord op de knop, zodat wie de knop bij naam aanspreekt
  // hem ook zo vindt (WCAG 2.5.3), en zegt daarna welke toets.
  'home.testRemoveOne': 'Verwijder: {wanneer}',
  // Kort, zoals het blok ze toont: het woord "toets" staat al in de kop.
  'home.testSoonToday': 'Vandaag',
  'home.testSoonTomorrow': 'Morgen',
  'home.testSoonDays': 'Over {aantal} dagen',
  // Op een tablet en een telefoon is het blok eerst alleen de datums. Erop
  // tikken klapt het open tot wat een laptop meteen laat zien.
  'home.testsChange': 'Toetsen wijzigen',
  'home.testsDone': 'Klaar',
  // Het vak erbij, want een datum zonder vak plant niets. Alleen vakken die
  // bestaan: een toets voor woordjes instellen belooft oefenstof die er niet
  // is. Het gekozen vak bepaalt waarmee "Ga verder" verdergaat.
  'home.testSubjectPick': 'Voor welk vak?',
  'home.testSubjectNone': 'Nog geen vak',

  // Een module die het plan wel heeft en het product nog niet. Geen datum,
  // want een datum die we missen is erger dan geen datum — en geen enkele
  // module wordt bij naam genoemd als de plek om heen te gaan: die lijst staat
  // eronder en groeit vanzelf mee.
  'soon.subtitle': 'Bestaat nog niet',
  'soon.body': 'Deze module bestaat nog niet. We zijn hem aan het maken.',
  'soon.instead': 'Dit kun je nu wel oefenen',
  'soon.insteadLine': 'Klaar om te oefenen',

  // Eén categorie, en de vorm ervan is het punt: tafels hoort onder rekenen,
  // klokkijken niet. Klokkijken is geen rekenen maar een instrument aflezen.
  'category.rekenen': 'Rekenen',
  'category.holds': 'Hieronder valt:',

  // Item status, K9. Four states, each with a shape as well as a word — and
  // none of them green, because green is an answer state and would tell a
  // child they had just got something right. "In de vriezer" is gone
  // (ADR-114): onthouden begins at box four now, and box five is the same fact.
  'status.refresh': 'even opfrissen',
  'status.remembered': 'dit onthoud je nu',
  'status.practising': 'nog niet onthouden',
  'status.new': 'nog niet geoefend',

  // Set names
  'set.nl-provincies': 'Provincies van Nederland',
  'set.nl-hoofdsteden': 'Hoofdsteden van de provincies',
  'set.nl-waddeneilanden': 'De Waddeneilanden',
  'set.nl-wateren': 'Zeeën en meren',
  'set.nl-steden': 'Steden van Nederland',
  // De landen. De naam draagt de kaart mee, want "Landen" alleen zegt niet
  // welke - en deze naam staat op de startknop en in het logboek, waar de
  // regiorij van de kieslijst niet meekomt.
  'set.europa-landen': 'Landen van Europa',
  'set.afrika-landen': 'Landen van Afrika',
  'set.azie-landen': 'Landen van Azië',
  'set.noord-amerika-landen': 'Landen van Noord-Amerika',
  'set.zuid-amerika-landen': 'Landen van Zuid-Amerika',
  'set.oceanie-landen': 'Landen van Oceanië',
  'set.wereld-landen': 'Landen van de wereld',
  // De mix. Geen zesde set maar dezelfde items onder één naam, zodat een
  // provincie die je hier goed hebt hetzelfde doosje opschuift als altijd.
  'set.nl-mix': 'Topomix',
  // Kort, want deze regel staat op een tegel naast vijf andere: de vijf sets
  // opnoemen maakte die tegel twee keer zo hoog als de rest van de rij.
  'set.nl-mix.uitleg': 'Alles van de kaart door elkaar',

  // Klokkijken, in de vier stappen waarin een groep 4 en 5 het leert. De namen
  // zijn de woorden die de juf gebruikt, niet de id's uit het bestand.
  'set.klok-heel': 'Hele uren',
  'set.klok-half': 'Halve uren',
  'set.klok-kwart': 'Kwartieren',
  'set.klok-vijf': 'Vijf minuten',
  // Ook hier geen vijfde bestand maar dezelfde standen onder één naam, zodat
  // half acht dat je hier goed hebt hetzelfde doosje opschuift als altijd.
  'set.klok-mix': 'Klokmix',
  'set.klok-mix.uitleg': 'Alle standen van de klok door elkaar',

  // Topografie in drie stappen: eerst waar op de wereld, dan wat, dan hoe.
  // De regio staat vooraan omdat het de grofste keuze is die er te maken valt
  // — en omdat een kind dat de provincies zoekt niet langs de landen van
  // Europa hoeft. Wereld en Europa staan er wel en zijn nog niet te openen,
  // dezelfde afspraak die de linkerbalk maakt over modules die nog komen.
  'regio.title': 'Waar op de kaart?',
  'regio.wereld': 'Wereld',
  'regio.afrika': 'Afrika',
  'regio.azie': 'Azië',
  'regio.europa': 'Europa',
  'regio.noord-amerika': 'Noord-Amerika',
  'regio.zuid-amerika': 'Zuid-Amerika',
  'regio.oceanie': 'Oceanië',
  'regio.nederland': 'Nederland',
  'regio.soon': 'binnenkort',

  // Eén woord per onderwerp. "Provincies van Nederland" zei twee keer waar je
  // bent — de regio erboven zegt het al — en las op een tegel als een zin in
  // plaats van als een knop.
  'onderwerp.provincies': 'Provincies',
  'onderwerp.steden': 'Steden',
  'onderwerp.steden.uitleg': 'De hoofdsteden, of alle tachtig',
  'onderwerp.steden.keuze': 'Welke steden?',
  'onderwerp.steden.kortHoofd': 'Hoofdsteden',
  'onderwerp.steden.kortAlle': 'Alle',
  'onderwerp.wateren': 'Wateren',
  'onderwerp.eilanden': 'Waddeneilanden',
  'onderwerp.topomix': 'Topo-mix',
  'onderwerp.landen': 'Landen',
  // Het aantal staat erbij, want dat is wat een kind wil weten voordat het
  // begint: zestien landen is een middag, honderdzevenenzestig is een jaar.
  'onderwerp.landen.europa': 'Alle 46 landen van Europa',
  'onderwerp.landen.afrika': 'Alle 52 landen van Afrika',
  'onderwerp.landen.azie': 'Alle 47 landen van Azië',
  'onderwerp.landen.noord-amerika': 'Alle 23 landen van Noord-Amerika',
  'onderwerp.landen.zuid-amerika': 'Alle 12 landen van Zuid-Amerika',
  'onderwerp.landen.oceanie': 'Alle 9 landen van Oceanië',
  'onderwerp.landen.wereld': 'Alle 167 landen bij elkaar',

  // De klok, in vier stappen en een mix. Eén woord per tegel, net als bij
  // topografie — en het merk ernaast is de wijzerstand zelf, zodat een kind
  // dat "kwartieren" nog niet leest toch ziet welke tegel dat is.
  'onderwerp.heleUren': 'Hele uren',
  'onderwerp.heleUren.uitleg': 'Eén uur, twee uur, tot en met twaalf uur',
  'onderwerp.halveUren': 'Halve uren',
  // De regel waar het hele vak om draait, en hij staat er voluit: half acht is
  // half acht en niet half zeven.
  'onderwerp.halveUren.uitleg': 'Half één tot half twaalf — half acht is 7:30',
  'onderwerp.kwartieren': 'Kwartieren',
  'onderwerp.kwartieren.uitleg': 'Kwart over en kwart voor',
  'onderwerp.vijfMinuten': 'Vijf minuten',
  'onderwerp.vijfMinuten.uitleg': 'Vijf over, tien voor half, en alles ertussen',
  'onderwerp.klokmix': 'Klokmix',

  // Modes
  'mode.wijs-aan': 'Aanwijzen',
  'mode.hoe-heet-dit': 'Zelf typen',
  'mode.ontdekken': 'Ontdekken',
  'mode.bliksemronde': 'Bliksemronde',
  'mode.overleven': 'Overleven',
  'mode.meerkeuze': 'Meerkeuze',

  // K2. De volgorde van de zes manieren is het argument, dus staat de reden
  // erbij: meerkeuze is de instap naar typen, geen alternatief ervoor. De klok
  // en de levens staan achteraan en zeggen zelf waarvoor ze zijn — ze staan in
  // de lijst, want alles wat een ronde start hoort langs dezelfde startknop.
  'way.wijs-aan': 'Tik het gebied aan — voor de eerste keer',
  'way.meerkeuze': 'Kies uit vier namen — de instap naar typen',
  'way.hoe-heet-dit': 'Schrijf het zelf op — voor de toets',
  'way.ontdekken': 'Rondkijken, geen vragen',
  'way.bliksemronde': 'Zo veel mogelijk in een minuut — voor als het al zit',
  'way.overleven': 'Doorgaan tot je levens op zijn — voor als het al zit',
  // Het topodiploma (ADR-117): twintig plekken van één kaart, of de hele kaart
  // als die kleiner is, de naam zelf typen, negen van de tien goed.
  'mode.topo-diploma': 'Topodiploma',
  'way.topo-diploma':
    'Twintig namen zelf typen, negen van de tien goed — pas aan het eind zie je hoe het ging',
  'topo.diplomasTitle': 'Jouw topodiploma’s',
  'topo.diplomasCount': '{aantal} van de {totaal} gehaald',
  'topo.diplomaHave': '{kaart}: topodiploma gehaald',
  'topo.diplomaWant': '{kaart}: nog geen topodiploma',
  'topo.diplomaEarned': 'Topodiploma gehaald: {kaart}',
  'topo.diplomaMissed':
    'Nog geen diploma: {goed} van de {totaal} goed. Met {nodig} goed is hij van jou.',
  // Bij naam, net als de begroeting op de voordeur. "Wat wil je oefenen?" aan
  // niemand in het bijzonder is een formulier; aan Fem gevraagd is het een
  // vraag, en zij is degene die hem beantwoordt.
  'choose.title': 'Wat wil je oefenen, {naam}?',
  // "Waarover" was een woord dat niemand van tien hardop zegt. Deze zegt wat
  // de stap van je vraagt in plaats van waar hij over gaat.
  // De nummers staan niet meer in de tekst: de pagina telt zelf, want
  // topografie heeft een stap meer dan rekenen en één vaste "1 ·" in de copy
  // zou op één van de twee pagina's het verkeerde getal zijn.
  'choose.stepWhat': 'Kies een onderwerp',
  // "Van makkelijk naar moeilijk" stond in de kop en is eruit. Het was een
  // toelichting op de volgorde, niet de vraag zelf, en het maakte van een kop
  // van vier woorden een zin van acht — op een telefoon twee regels lang.
  // De volgorde blijft; wat weg is, is het bijschrift erop.
  'choose.stepHow': 'Hoe wil je oefenen?',
  'choose.testSubject': 'Hier gaat je toets over.',

  // De startknop draagt de gekozen combinatie in woorden, en zijn maat komt
  // uit de ronde zelf: vragen, seconden of levens. Daarnaast hoe lang het
  // ongeveer duurt — de enige regel op deze pagina die net zo goed voor de
  // ouder in de kamer is als voor het kind.
  'choose.start': '{set} {hoe} · {aantal} vragen',
  'choose.startTime': '{set} {hoe} · {seconden} seconden',
  'choose.startLives': '{set} {hoe} · {aantal} levens',
  'choose.startOpen': '{set} {hoe}',
  'choose.minutes': 'Ongeveer {aantal} minuten',
  'choose.minuteOne': 'Ongeveer 1 minuut',
  // De knop zegt wat hij doet en niets meer; de zin ernaast zegt wat er gaat
  // gebeuren. Dat was eerst één ding — de knop dróég de zin — en dat leest een
  // kind niet als de weg vooruit. Wat een schermlezer hoort is nog steeds het
  // hele ding, want dat staat in het label.
  'choose.go': 'Start',
  'choose.goLabel': 'Start: {wat}',
  // Hoe lang de ronde duurt, waar er meer dan één eerlijk antwoord is. Tien is
  // wat een ronde altijd was en blijft de standaard; de rest bestaat omdat de
  // Rekenmix vijfhonderd sommen heeft.
  // De oefentoets, als eigen manier van oefenen (ADR-100): je typt, zoals op
  // een toets, en pas aan het eind zie je wat goed was. Eerst was het een
  // schakelaar op een manier die je al koos, en dan moest je een manier kiezen
  // die een toets niet heeft. "Zelf typen" staat er bewust niet in: dat is de
  // naam van de tegel ernaast, en twee tegels die zo heten zijn er één te veel.
  'choose.testMode': 'Oefentoets',
  'choose.testModeWhy':
    'Je typt zonder hulp. Aan het eind zie je wat goed was en krijg je een cijfer.',
  'choose.startTest': '{wat} · oefentoets',
  'choose.likeTheTest': 'Oefen zoals de toets',
  'choose.howMany': 'Hoeveel vragen?',
  'choose.howManyOne': '{aantal} vragen',
  // De hele set, als die in één ronde past: twaalf provincies zijn "Alle 12".
  'choose.howManyAll': 'Alle {aantal}',
  'choose.howManyAllLabel': 'Alle {aantal} vragen',
  // De startbalk (herontwerp 2026-09): wat er gekozen is, als een rij kleine
  // labels, en daarna de knop. Het woordje voor elke waarde zegt welke vraag die
  // beantwoordt. De knop zelf zegt voor een schermlezer nog steeds de hele zin.
  'start.klaar': 'Klaar om te starten',
  'start.kaart': 'kaart',
  'start.onderwerp': 'onderwerp',
  'start.som': 'som',
  'start.welke': 'welke',
  'start.manier': 'manier',
  'start.ronde': 'ronde',
  'start.stand': 'stand',
  'start.vragen': '{aantal} vragen',
  'start.vragenTijd': '{aantal} vragen · ±{minuten} min',
  'start.seconden': '{aantal} seconden',
  'start.levens': '{aantal} levens',
  'start.vrij': 'rondkijken',
  // Zolang niet elke stap een antwoord heeft, staat de balk er wel maar is hij
  // leeg, en zegt hij welke stappen nog wachten. De stappen zijn genummerd op
  // de pagina, dus het nummer is de kortste weg terug.
  'start.nogKiezen': 'Nog even kiezen',
  'start.kiesNogStap': 'Kies nog bij stap {stap}',
  'start.kiesNogStappen': 'Kies nog bij stap {stappen} en {laatste}',
  // Premium (ADR-111, ADR-116, ADR-122): een code die een ouder één keer
  // invult. Geen e-mail en geen wachtwoord; er is geen account om in te loggen.
  //
  // De knip staat sinds ADR-122 tussen oefenen en onthouden, en de intro zegt
  // hem in die volgorde: eerst wat gratis is en blijft, dan waar premium over
  // gaat. Andersom leest elke zin als een muur.
  'premium.label': 'Premium',
  'premium.titel': 'Premium',
  // De knip van ADR-122, in de woorden van een ouder: oefenen kost niets, en
  // premium zorgt dat het blijft hangen. Geen "vóór je" meer: met dat accent
  // staat er "eerder dan jij", en bedoeld was "in jouw plaats" (ADR-145).
  'premium.intro':
    'Je kind oefent alle vakken en onderwerpen gratis, voor altijd. Premium plant het herhalen, laat zien wat er blijft hangen en laat je kind zichzelf overhoren. Voor het hele gezin, een schooljaar lang.',
  'premium.introAan': 'Alles staat open op dit apparaat.',
  'premium.etalageLabel': 'Voor ouders',
  'premium.etalageKop': 'Oefenen is gratis. Met premium blijft het hangen.',
  'premium.perSchooljaar': 'per schooljaar',
  'premium.codeTitel': 'Heb je al een code?',
  'premium.codeLabel': 'Typ de code',
  'premium.codePlaceholder': 'LEER-XXXX-XXXX',
  'premium.codeGebruiken': 'Code gebruiken',
  'premium.bezig': 'Even kijken…',
  'premium.aan': 'Premium staat aan op dit apparaat, tot en met {datum}.',
  // Het einde van een jaar, aangekondigd in plaats van afgewacht (ADR-129).
  'premium.bijnaAf':
    'Je code loopt af op {datum}. Verleng hem vóór die dag, dan merkt niemand thuis er iets van.',
  'premium.verlopen':
    'Je code is verlopen op {datum}. Alles wat je kinderen hebben geoefend, staat nog gewoon op dit apparaat en komt terug zodra je verlengt.',
  'premium.verlengen': 'Premium verlengen',
  'premium.afmelden': 'Code van dit apparaat halen',
  'premium.afmeldenUitleg':
    'Dan komt er een plek vrij om de code op een ander apparaat te gebruiken.',
  // Wat premium dóét, in vier klussen (ADR-124), sinds ADR-145 als kaarten met
  // een teken. De kop is wat het oplevert, de regel eronder hoe.
  'premium.watTitel': 'Wat premium voor je doet',
  'premium.usp.plan': 'Het herhalen wordt voor je gepland',
  'premium.usp.planUit':
    'Je kind hoeft niet te bedenken waar het moet beginnen. Leer.nu zet elke dag klaar wat aan de beurt is, net voordat het vergeten wordt.',
  'premium.usp.zicht': 'Je ziet wat blijft hangen',
  'premium.usp.zichtUit':
    'Per onderwerp zie je wat je kind al kent, wat opgefrist moet worden en hoeveel het er over drie weken nog van weet.',
  'premium.usp.zelf': 'Je kind overhoort zichzelf',
  'premium.usp.zelfUit':
    'Met de oefentoets test je kind zelf of het de stof kent: zonder hulp, met een cijfer aan het eind. Jij hoeft niet meer te overhoren.',
  'premium.usp.gezin': 'Voor het hele gezin',
  'premium.usp.gezinUit':
    'Eén code voor al je kinderen, op maximaal drie apparaten, een heel schooljaar lang.',

  // Basis tegen premium (ADR-145). De uitleg boven de tabel lost op wat de
  // oude intro openliet: "oefenen is gratis" en toch "Premium" bij drie
  // manieren op elke modulepagina. Die drie toetsen, en dat staat er nu.
  'premium.vergelijkTitel': 'Basis en premium naast elkaar',
  'premium.vergelijkUitleg':
    'Oefenen kost niets. De bliksemronde, overleven en de oefentoets zijn premium: daarmee test je kind of het de stof al kent, en dat hoort bij onthouden.',
  'premium.basisNaam': 'Basis',
  'premium.basisPrijs': 'Gratis',
  'premium.basisVoor': 'Alles om te oefenen, in elk vak. Voor altijd, zonder code.',
  'premium.premiumVoor':
    'Alles uit Basis, en daarbovenop het onthouden: plannen, bijhouden en zelf overhoren.',
  'premium.aanrader': 'Aanrader',
  'premium.tabelWat': 'Onderdeel',
  'premium.tabelJa': 'Zit erin',
  'premium.tabelNee': 'Zit er niet in',
  'premium.groep.oefenen': 'Oefenen',
  'premium.groep.belonen': 'Belonen',
  'premium.groep.onthouden': 'Onthouden',
  'premium.groep.uitdagen': 'Uitdagen',
  'premium.groep.ouders': 'Voor ouders',
  'premium.regel.vakken': 'Alle vakken en alle onderwerpen',
  'premium.regel.toren': 'Je toren en je reeks: zien wat er blijft hangen',
  'premium.regel.vormen': 'Ontdekken, zoeken, meerkeuze en zelf typen',
  'premium.regel.herhaal': 'Na een ronde je fouten meteen overdoen',
  'premium.regel.voorspelling': 'Na elke ronde zien hoeveel je er over drie weken nog van weet',
  'premium.regel.tafeldiploma': 'De twaalf tafeldiploma’s',
  'premium.regel.diplomas': 'Diploma’s voor vlaggen, klok en topografie',
  'premium.regel.plan': 'Elke dag klaargezet wat herhaald moet worden',
  'premium.regel.onthouden': 'Per vak en per onderwerp zien wat je kind onthoudt, week na week',
  'premium.regel.fouten': 'Alle fouten verzameld, om later te oefenen',
  'premium.regel.toets': 'Zien wat je kind op de dag van de toets nog weet',
  'premium.regel.oefentoets': 'De oefentoets, met een cijfer',
  'premium.regel.bliksem': 'De bliksemronde en overleven',
  'premium.regel.bericht': 'Het weekbericht: hoe de week ging',
  'premium.regel.lijsten': 'Oefenstof van school intypen of importeren',
  'premium.regel.gezin': 'Meer kinderen, op maximaal drie apparaten',

  // Waarom dit en geen ander. Geen functies maar redenen om te vertrouwen, en
  // alle vier controleerbaar, want dat is het punt. Sinds ADR-145 een kop en
  // een regel, zodat de reden in één oogopslag te lezen is.
  'premium.waaromTitel': 'Waarom leer.nu',
  'premium.waarom.reclame': 'Geen advertenties, geen trackers',
  'premium.waarom.reclameUit':
    'Dat hoef je niet op ons woord te geloven: de broncode is openbaar, dus je kunt het zelf controleren.',
  'premium.waarom.apparaat': 'Alles blijft op je eigen apparaat',
  'premium.waarom.apparaatUit':
    'Wat je kind oefent, gaat nergens heen. Alleen de code gaat naar onze server, om te controleren of hij klopt.',
  'premium.waarom.abonnement': 'Geen abonnement',
  'premium.waarom.abonnementUit':
    'Je betaalt één keer. De code verloopt na een schooljaar vanzelf, en er wordt nooit iets afgeschreven.',
  'premium.waarom.gok': 'Belonen zonder gokken',
  'premium.waarom.gokUit':
    'Een plaatje krijgt kleur doordat je kind het op verschillende dagen goed weet. Niets hangt van geluk af, en er valt niets te kopen.',

  // De kassa (ADR-123, ADR-124). Het bedrag staat hier omdat een knop naar een
  // winkel zonder prijs als een val voelt; kassa.test.ts houdt het gelijk aan
  // PRIJS_CENTEN, zodat er één bedrag is en geen twee.
  'premium.prijs': '€ 24,95',
  'premium.kopenUitleg':
    'Eenmalig, voor een heel schooljaar en al je kinderen. Je betaalt met iDEAL en krijgt je code meteen.',
  'premium.kopenKnop': 'Een code kopen',

  'premium.fout.leeg': 'Typ eerst de code.',
  'premium.fout.onbekend': 'Deze code kennen we niet. Kijk of je hem goed hebt overgetypt.',
  'premium.fout.verlopen': 'Deze code is verlopen.',
  'premium.fout.vol':
    'Deze code staat al op drie apparaten. Haal hem eerst van een ander apparaat af.',
  'premium.fout.te-vaak': 'Te vaak geprobeerd. Probeer het over een uur opnieuw.',
  'premium.fout.geen-verbinding': 'Er is nu geen verbinding. Probeer het zo nog eens.',
  'premium.fout.niet-ingesteld': 'Premium is nog niet beschikbaar.',
  // Wat er staat waar een premiumblok zou staan, zonder code (ADR-124). Elk
  // slot zegt wat dát ding doet: "dit hoort bij premium" meldt een deur en niet
  // wat erachter zit, en daar koopt niemand iets van. De knop gaat naar de
  // uitleg, niet naar een codeveld — wie hier staat heeft meestal geen code.
  'premium.slotKnop': 'Bekijk premium',
  // Wat er in de naam van een tegel staat die naar de premiumpagina gaat
  // (ADR-125). Een tegel die de hele kiezer vervangt hoort dat te zeggen
  // voordat hij wordt ingedrukt; op het scherm zie je de pagina veranderen,
  // in een naam die eindigt op het kale woord "Premium" stond het nergens.
  'premium.tegelSlot': 'Premium. Je gaat naar de premiumpagina.',
  'premium.wat.onthouden':
    'Zie per vak en per onderdeel wat je kind onthoudt, hoe het oefenen week na week gaat, en wat er over drie weken nog van over is.',
  'premium.wat.lijsten':
    'De oefenstof van school zelf intypen of importeren, en je kind oefent deze als flitsdictee.',
  'premium.wat.bericht':
    'Hoe de week ging: of er geoefend is, wat er blijft hangen, en wat er wacht.',
  'premium.wat.vandaag':
    'Leer.nu zet elke dag klaar wat aan de beurt is, zodat je kind niet hoeft te bedenken waar het moet beginnen.',
  'premium.wat.toets':
    'Zie wat je kind op de dag van de toets naar verwachting nog weet, en wat één ronde vandaag daaraan verandert.',
  'premium.wat.jij':
    'Premium plant het herhalen, laat zien wat je kind onthoudt en werkt voor al je kinderen.',

  // De onderwerpen van rekenen. Acht soorten sommen en een mix ervan; de tafels
  // hebben er twaalf, die als knopjes onder de kaart staan in plaats van als
  // twaalf kaarten ernaast, en elke andere soort drie bereiken (ADR-120).
  'onderwerp.tafels': 'Tafels',
  'onderwerp.tafels.uitleg': 'De tafel van 1 tot en met 12',
  'onderwerp.tafels.keuze': 'Welke tafel?',
  'onderwerp.keer': 'Keersommen',
  'onderwerp.keer.uitleg': 'Keer tot 10, 100 of 1000: 6 × 14',
  'onderwerp.delen': 'Deelsommen',
  'onderwerp.delen.uitleg': 'Delen tot 10, 100 of 1000: 56 : 7',
  'onderwerp.plus': 'Plussommen',
  'onderwerp.plus.uitleg': 'Optellen tot 20, 100 of 1000',
  'onderwerp.min': 'Minsommen',
  'onderwerp.min.uitleg': 'Aftrekken tot 20, 100 of 1000',
  'onderwerp.splitsen': 'Splitsen',
  'onderwerp.splitsen.uitleg': 'Wat hoort erbij? 10 = 7 + ?',
  'onderwerp.halveren': 'Halveren',
  'onderwerp.halveren.uitleg': 'De helft, tot 20, 100 of 1000',
  'onderwerp.verdubbelen': 'Verdubbelen',
  'onderwerp.verdubbelen.uitleg': 'Het dubbele, tot 20, 100 of 1000',
  'onderwerp.bereik.keuze': 'Tot welk getal?',
  // De mix heet naar wat erin zit en niet naar hoe spannend hij is: een kind
  // dat op deze kaart drukt hoort te weten wat het krijgt.
  'onderwerp.rekenmix': 'Rekenmix',
  'onderwerp.rekenmix.uitleg': 'Alle soorten sommen door elkaar',
  'onderwerp.rekenmix.keuze': 'Hoe moeilijk?',
  // Het enige onderwerp dat voor elk kind anders is. Hij staat er alleen als er
  // iets in zit: een kaart met nul sommen is een kaart over niets.
  'onderwerp.fouten': 'Oefen je fouten',
  'onderwerp.fouten.uitleg': 'De sommen die je eerder fout had',

  // Explore
  'explore.kind': 'Ontdek de kaart',
  'explore.hint': 'Kies een naam. Je ziet meteen waar het ligt.',
  'explore.listLabel': 'Alles wat je kunt ontdekken',
  'explore.nothingChosen': 'Kies iets uit de lijst of tik op de kaart.',
  'explore.done': 'Klaar',

  // Practice
  'practice.kind': 'Wijs aan op de kaart',
  'practice.question': 'Waar ligt {naam}?',
  'practice.questionOf': 'vraag {nu} van {totaal}',
  'practice.counterTime': 'tijd',
  'practice.counterLives': 'levens',
  'practice.counterCorrect': 'goed',
  'practice.speak': 'Lees de vraag voor',
  'practice.correct': '{naam} — goed.',
  'practice.wrong': '{naam} ligt hier.',
  'practice.wrongSub': 'Je wees {gekozen} aan.',
  'practice.wrongTyped': 'Je schreef {gekozen}.',
  // The near miss from ADR-017: naming another real place is not a typo, and
  // saying so is the whole reason that decision exists.
  'practice.almost': 'Bijna!',
  'practice.almostSub':
    'Je schreef {gekozen}. Dat bestaat ook, maar het ligt ergens anders. Wij zochten {naam}.',
  'practice.next': 'Volgende vraag',
  'practice.stop': 'Stoppen',
  'practice.kindCity': 'Wijs de stad aan',
  'practice.kindIsland': 'Wijs het eiland aan',
  'practice.kindWater': 'Wijs het water aan',
  'practice.kindTypeWater': 'Hoe heet dit water?',
  'practice.kindTypeIsland': 'Hoe heet dit eiland?',
  'practice.kindTypeArea': 'Hoe heet dit gebied?',
  'practice.kindTypeCity': 'Hoe heet deze stad?',
  'practice.kindCountry': 'Wijs het land aan',
  'practice.kindTypeCountry': 'Hoe heet dit land?',
  'practice.typeQuestion': 'Typ de naam',
  'practice.chooseQuestion': 'Kies de naam',
  'practice.dontKnow': 'Ik weet het niet',
  // Inzoomen op de wereldkaart (ADR-146). Werelddelen zoals het regio-rijtje ze
  // noemt, en de delen zoals een Nederlandse atlas ze zou noemen.
  'zoom.label': 'Inzoomen op de kaart',
  'zoom.wereld': 'Hele wereld',
  'zoom.heel': 'Heel {naam}',
  'zoom.europa': 'Europa',
  'zoom.europa-west': 'West-Europa',
  'zoom.europa-noord': 'Noord-Europa',
  'zoom.europa-balkan': 'De Balkan',
  'zoom.europa-oost': 'Oost-Europa',
  'zoom.afrika': 'Afrika',
  'zoom.afrika-noord': 'Noord-Afrika',
  'zoom.afrika-west': 'West-Afrika',
  'zoom.afrika-midden-oost': 'Midden- en Oost-Afrika',
  'zoom.afrika-zuid': 'Zuidelijk Afrika',
  'zoom.azie': 'Azië',
  'zoom.azie-midden-oosten': 'Midden-Oosten',
  'zoom.azie-zuid-centraal': 'Zuid- en Centraal-Azië',
  'zoom.azie-oost': 'Oost-Azië',
  'zoom.azie-zuidoost': 'Zuidoost-Azië',
  'zoom.noord-amerika': 'Noord-Amerika',
  'zoom.noord-amerika-midden': 'Midden-Amerika en Caraïben',
  'zoom.zuid-amerika': 'Zuid-Amerika',
  'zoom.oceanie': 'Oceanië',
  'practice.typePlaceholder': 'Naam',
  'practice.check': 'Kijk na',
  'practice.emptyAnswer': 'Typ eerst een naam.',
  'practice.loading': 'Kaart wordt geladen…',
  'practice.mapFailed': 'De kaart kon niet geladen worden.',

  // Result
  // "Ronde klaar" and not "Klaar!" (K8). The exclamation mark congratulated the
  // child for stopping, which is the one thing on this screen that is not an
  // achievement — and the register rule is that we talk about the work, never
  // about the child.
  // Rekenen. De tafels van 1 tot 12 en tien sommen per tafel, allebei uit het
  // app-ontwerp v2. Het oefenscherm zelf is daar niet getekend (ADR-049).
  'sums.table': 'Tafel van {tafel}',
  'sums.plusUpTo': 'Plussommen tot {grens}',
  'sums.minusUpTo': 'Minsommen tot {grens}',
  'sums.timesUpTo': 'Keersommen tot {grens}',
  'sums.divideUpTo': 'Deelsommen tot {grens}',
  'sums.splitUpTo': 'Splitsen tot {grens}',
  'sums.halveUpTo': 'Halveren tot {grens}',
  'sums.doubleUpTo': 'Verdubbelen tot {grens}',
  'sums.upTo': 'tot {grens}',
  'sums.allTables': 'Alle tafels door elkaar',
  'sums.allDivides': 'Alle deelsommen door elkaar',
  // Het knopje naast de twaalf getallen. 'Door elkaar' en niet 'Alles', zodat
  // wat je ziet ook in de naam staat die een schermlezer voorleest — WCAG 2.5.3,
  // en de reden dat spraakbediening 'druk op door elkaar' begrijpt.
  'sums.allShort': 'Door elkaar',
  'sums.mix': 'Rekenmix',
  'sums.mistakes': 'Jouw fouten',
  // De drie moeilijkheden van de Rekenmix. Het niveau stond al op elke set en
  // bepaalde alleen de volgorde; nu bepaalt het ook wat er in de mix zit.
  'sums.mixLevel1': 'Rekenmix makkelijk',
  'sums.mixLevel1.kort': 'Makkelijk',
  'sums.mixLevel2': 'Rekenmix gemiddeld',
  'sums.mixLevel2.kort': 'Gemiddeld',
  'sums.mixLevel3': 'Rekenmix pittig',
  'sums.mixLevel3.kort': 'Pittig',
  'sums.prompt': 'Hoeveel is het?',
  'sums.typeQuestion': 'Typ het antwoord',
  'sums.chooseQuestion': 'Kies het antwoord',
  'sums.typePlaceholder': 'Antwoord',
  // De som met het antwoord erin: "7 × 8 = 56", "10 = 7 + 3" (ADR-120).
  'sums.correct': '{uitgewerkt} — goed.',
  'sums.wrong': '{uitgewerkt}.',
  'sums.wrongSub': 'Jij zei {gegeven}.',
  'sums.dontKnowSub': 'Deze komt zo weer langs.',
  'sums.practiceMore': 'Deze sommen moet je nog oefenen',
  'mode.som-typen': 'Zelf typen',
  'mode.som-meerkeuze': 'Meerkeuze',
  // De tafeltoets die een kind van school kent, zonder de stopwatch: op de
  // instellingenpagina staat dat haast het onthouden niet helpt, en dat zetten
  // we niet uit voor de ene oefening waar een kind het het meest zou voelen.
  'mode.tafeldiploma': 'Tafeldiploma',
  'sums.diplomaStop': 'Bekijk je poging',
  'sums.diplomaEarned': 'Diploma gehaald: tafel van {tafel}',
  'sums.diplomaMissed': 'Nog geen diploma. Alle tien goed, dan is hij van jou.',
  'rekenen.diplomasTitle': 'Jouw tafeldiploma’s',
  'rekenen.diplomasCount': '{aantal} van de {totaal} gehaald',
  'rekenen.diplomaHave': 'Tafel van {tafel}: diploma gehaald',
  'rekenen.diplomaWant': 'Tafel van {tafel}: nog geen diploma',
  'way.som-typen': 'Zeg het antwoord zelf — zo weet je of je de tafel kent',
  'way.som-meerkeuze': 'Kies uit vier getallen — de instap naar typen',
  'way.tafeldiploma': 'De hele tafel foutloos — één fout en je begint opnieuw',

  // Klokkijken. De klok zelf staat op het toneel waar bij topografie de kaart
  // staat en bij rekenen de som: het ding waar de vraag over gaat.
  //
  // De namen van de vier standen worden hier voluit geschreven en niet in
  // cijfers. Het verschil tussen "7:30" en "half acht" ís de oefening; een
  // antwoordknop met "half 8" erop zou het kind het lezen uit handen nemen.
  'klok.uur.1': 'een',
  'klok.uur.2': 'twee',
  'klok.uur.3': 'drie',
  'klok.uur.4': 'vier',
  'klok.uur.5': 'vijf',
  'klok.uur.6': 'zes',
  'klok.uur.7': 'zeven',
  'klok.uur.8': 'acht',
  'klok.uur.9': 'negen',
  'klok.uur.10': 'tien',
  'klok.uur.11': 'elf',
  'klok.uur.12': 'twaalf',
  // Vijf en tien, en verder niets: de inhoud gaat met stappen van vijf, dus de
  // afstand tot een kwartier, een half of een heel uur is er een van die twee.
  'klok.getal.5': 'vijf',
  'klok.getal.10': 'tien',
  // De acht vormen waarin het Nederlands een klok uitspreekt. Welke vorm en
  // welk uur wordt in game-core uitgerekend; hier staan alleen de woorden.
  'klok.zeg.uur': '{uur} uur',
  'klok.zeg.over': '{aantal} over {uur}',
  'klok.zeg.kwartOver': 'kwart over {uur}',
  'klok.zeg.voorHalf': '{aantal} voor half {uur}',
  'klok.zeg.half': 'half {uur}',
  'klok.zeg.overHalf': '{aantal} over half {uur}',
  'klok.zeg.kwartVoor': 'kwart voor {uur}',
  'klok.zeg.voor': '{aantal} voor {uur}',
  // Allebei de notaties, in de volgorde waarin een kind ze leert. Wie er één
  // van de twee kent, kent het half — daarom staan ze samen op het
  // resultaatscherm en niet los.
  'klok.beide': '{woorden} ({cijfers})',

  'klok.prompt': 'Hoe laat is het?',
  // Wat de voorleesknop zegt op de twee vormen waar een klok op het toneel
  // staat. Niet de tijd zelf: dat zou het antwoord voorlezen.
  'klok.lookPrompt': 'Kijk naar de klok. Hoe laat is het?',
  'klok.typeQuestion': 'Typ hoe laat het is',
  'klok.chooseQuestion': 'Kies hoe laat het is',
  'klok.whichQuestion': 'Welke klok is dit?',
  'klok.typePlaceholder': '7:30',
  'klok.correct': 'Het is {tijd} — goed.',
  'klok.wrong': 'Het was {tijd}.',
  'klok.wrongSub': 'Jij zei {gegeven}.',
  'klok.dontKnowSub': 'Deze komt zo weer langs.',
  'klok.practiceMore': 'Deze tijden moet je nog oefenen',
  'mode.klok-meerkeuze': 'Meerkeuze',
  // "Klok zoeken" en niet "Welke klok?": de naam van een oefenvorm komt in de
  // startzin terecht — "Hele uren klok zoeken · 10 vragen" — en een vraagteken
  // midden in die zin leest als een fout. De vraag zelf staat boven de vier
  // klokken, waar hij hoort.
  'mode.klok-welke-klok': 'Klok zoeken',
  'mode.klok-typen': 'Zelf typen',
  // De volgorde is op elke pagina dezelfde (ADR-112): zoeken, meerkeuze, zelf
  // typen. Bij de klok is zoeken de klok die bij een tijd hoort.
  'way.klok-meerkeuze': 'Kies uit vier tijden — de instap naar typen',
  'way.klok-welke-klok': 'Zoek de klok die bij de tijd hoort — voor de eerste keer',
  'way.klok-typen': 'Schrijf de tijd zelf op — voor de toets',
  // Het klokdiploma (ADR-117): tien klokken van één stap, zelf opschrijven,
  // negen goed, en pas aan het eind hoor je hoe het ging.
  'mode.klok-diploma': 'Klokdiploma',
  'way.klok-diploma':
    'Tien klokken zelf opschrijven, negen goed — pas aan het eind zie je hoe het ging',
  'klok.diplomasTitle': 'Jouw klokdiploma’s',
  'klok.diplomasCount': '{aantal} van de {totaal} gehaald',
  'klok.diplomaHave': '{stap}: klokdiploma gehaald',
  'klok.diplomaWant': '{stap}: nog geen klokdiploma',
  'klok.diplomaEarned': 'Klokdiploma gehaald: {stap}',
  'klok.diplomaMissed':
    'Nog geen diploma: {goed} van de {totaal} goed. Met {nodig} goed is hij van jou.',

  // Vlaggen (ADR-102). Een onderwerp is één of twee woorden, zoals bij
  // topografie; de rij erboven zegt al waar.
  'onderwerp.vlaggen.bekend': 'Bekende vlaggen',
  'onderwerp.vlaggen.bekend.uitleg': 'De vlaggen die de meeste kinderen kennen',
  'onderwerp.vlaggen.alle': 'Alle vlaggen',
  'onderwerp.vlaggen.alle.uitleg': 'Elke vlag van dit deel van de wereld',
  'onderwerp.vlaggen.lijkt': 'Lijkt op elkaar',
  'onderwerp.vlaggen.lijkt.uitleg': 'Vlaggen die je makkelijk door elkaar haalt',
  'onderwerp.vlaggen.mix': 'Vlaggenmix',
  'onderwerp.vlaggen.mix.uitleg': 'Alle landen en provincies door elkaar',
  'onderwerp.vlaggen.provincies': 'Provincievlaggen',
  'onderwerp.vlaggen.provincies.uitleg': 'De vlaggen van de twaalf provincies',
  'onderwerp.vlaggen.fouten.uitleg': 'De vlaggen die je eerder fout had',
  // "Oefen je fouten" bij topografie en klok (ADR-103). Per kaart, want een
  // ronde blijft op één kaart.
  'onderwerp.topo.fouten.uitleg': 'De plekken die je eerder fout had',
  'onderwerp.klok.fouten.uitleg': 'De tijden die je eerder fout had',
  'set.nl-fouten': 'Jouw fouten in Nederland',
  'set.europa-fouten': 'Jouw fouten in Europa',
  'set.afrika-fouten': 'Jouw fouten in Afrika',
  'set.azie-fouten': 'Jouw fouten in Azië',
  'set.noord-amerika-fouten': 'Jouw fouten in Noord-Amerika',
  'set.zuid-amerika-fouten': 'Jouw fouten in Zuid-Amerika',
  'set.oceanie-fouten': 'Jouw fouten in Oceanië',
  'set.wereld-fouten': 'Jouw fouten op de wereldkaart',
  'set.klok-fouten': 'Jouw fouten met de klok',
  // De naam van een set: wat de startbalk, de kaarten en de favorieten tonen.
  'vlag.regio.wereld': 'de wereld',
  'vlag.set.bekend': 'Bekende vlaggen van {regio}',
  'vlag.set.alle': 'Alle vlaggen van {regio}',
  'vlag.set.lijkt': 'Vlaggen van {regio} die op elkaar lijken',
  'vlag.set.mix': 'Vlaggenmix',
  'vlag.set.provincies': 'Provincievlaggen',
  'vlag.set.fouten': 'Jouw fouten met vlaggen van {regio}',
  'vlag.set.foutenWereld': 'Al jouw fouten met vlaggen',
  'vlag.set.foutenNederland': 'Jouw fouten met provincievlaggen',
  'vlag.en': 'en',
  // "Vlag zoeken" en niet "Welke vlag?": de naam van een oefenvorm komt in de
  // startzin terecht, net als "Klok zoeken".
  'mode.vlag-zoeken': 'Vlag zoeken',
  'mode.vlag-meerkeuze': 'Meerkeuze',
  // Alleen de oefentoets vraagt zo, en zo heet hij dan ook in de lijst van
  // wat je laatst hebt geoefend.
  'mode.vlag-gemengd': 'Oefentoets',
  'way.vlag-zoeken': 'Kies de vlag die bij de naam hoort — voor de eerste keer',
  'way.vlag-meerkeuze': 'Kies de naam die bij de vlag hoort',
  'way.vlag-gemengd':
    'Je kiest zonder hulp, vlaggen en namen door elkaar. Aan het eind zie je wat goed was en krijg je een cijfer.',
  'vlag.zoekLabel': 'Welke vlag hoort hierbij?',
  'vlag.meerkeuzeLabelLand': 'Van welk land is deze vlag?',
  'vlag.meerkeuzeLabelProvincie': 'Van welke provincie is deze vlag?',
  'vlag.prompt': 'Kijk goed naar de vlag.',
  'vlag.optiesLabel': 'Kies een vlag',
  'vlag.namenLabel': 'Kies een naam',
  'vlag.alt': 'De vlag van {naam}',
  'vlag.correct': 'Goed! Dit is de vlag van {naam}.',
  'vlag.wrong': 'Dit is de vlag van {naam}.',
  'vlag.wrongSubVlag': 'Jij koos de vlag van {gekozen}.',
  'vlag.wrongSubNaam': 'Jij koos {gekozen}.',
  'vlag.dontKnowSub': 'Nu weet je hem.',
  'vlag.practiceMore': 'Deze vlaggen moet je nog oefenen',
  'vlag.loading': 'Vlaggen worden geladen…',
  'vlag.failed': 'De vlaggen konden niet geladen worden.',
  'vlag.explore.kind': 'Ontdek de vlaggen',
  'vlag.explore.hint': 'Kies een naam. Je ziet meteen de vlag.',
  'vlag.explore.nothingChosen': 'Kies een vlag uit de lijst.',
  'vlag.explore.werelddeel': 'Werelddeel',
  'vlag.explore.land': 'Land',
  'vlag.explore.hoofdstad': 'Hoofdstad',
  // Het vlaggendiploma (ADR-104): twintig vlaggen van een werelddeel, negen van
  // de tien goed, en pas aan het eind hoor je hoe het ging.
  'mode.vlag-diploma': 'Vlaggendiploma',
  'way.vlag-diploma': 'Negen van de tien goed, en pas aan het eind zie je hoe het ging',
  'vlag.diplomasTitle': 'Jouw vlaggendiploma’s',
  'vlag.diplomasCount': '{aantal} van de {totaal} gehaald',
  'vlag.diplomaHave': '{deel}: vlaggendiploma gehaald',
  'vlag.diplomaWant': '{deel}: nog geen vlaggendiploma',
  'vlag.diplomaEarned': 'Vlaggendiploma gehaald: {deel}',
  'vlag.diplomaMissed':
    'Nog geen diploma: {goed} van de {totaal} goed. Met {nodig} goed is hij van jou.',

  // Taal (ADR-118). Eén pagina met twee delen. De rij die bij topografie
  // vraagt waar op de kaart, vraagt hier welk deel.
  'deel.title': 'Welk deel?',
  'regio.spelling': 'Spelling',
  'regio.werkwoorden': 'Werkwoorden',
  'start.deel': 'deel',
  // Spelling: zes tegels. De vier soorten onthoudwoorden en de drie
  // woordeinden zijn elk één tegel, met knopjes eronder.
  'onderwerp.taal.onthoud': 'Onthoudwoorden',
  'onderwerp.taal.onthoud.uitleg': 'Ei of ij, au of ou, g of ch, c of k',
  'onderwerp.taal.onthoud.keuze': 'Welke letters?',
  'onderwerp.taal.dt': 'D of t',
  'onderwerp.taal.dt.uitleg': 'Maak het woord langer: hond, honden',
  'onderwerp.taal.eenTwee': 'Eén of twee',
  'onderwerp.taal.eenTwee.uitleg': 'Eén letter of twee: manen, katten',
  'onderwerp.taal.eenTwee.keuze': 'Klinkers of medeklinkers?',
  'onderwerp.taal.achter': 'Achter aan het woord',
  'onderwerp.taal.achter.uitleg': 'Verkleinwoorden, -ig en -lijk',
  'onderwerp.taal.achter.keuze': 'Welk woordeinde?',
  'onderwerp.taal.spellingmix': 'Spellingmix',
  'onderwerp.taal.spellingmix.uitleg': 'Alle spelling door elkaar',
  'onderwerp.taal.fouten.uitleg': 'De woorden die je eerder fout had',
  // Werkwoorden: drie tijden, een mix en je fouten.
  'onderwerp.taal.tt': 'Tegenwoordige tijd',
  'onderwerp.taal.tt.uitleg': 'Ik word, hij wordt, word jij?',
  'onderwerp.taal.vt': 'Verleden tijd',
  'onderwerp.taal.vt.uitleg': '-te of -de, met ’t kofschip',
  'onderwerp.taal.vd': 'Voltooid deelwoord',
  'onderwerp.taal.vd.uitleg': 'Ge- en een t of een d: gefietst, geleefd',
  'onderwerp.taal.werkwoordmix': 'Werkwoordmix',
  'onderwerp.taal.werkwoordmix.uitleg': 'Alle werkwoorden door elkaar',
  'onderwerp.taal.werkwoorden.fouten.uitleg': 'De werkwoorden die je eerder fout had',
  // De naam van een set: wat de startbalk, de kaarten en de favorieten tonen.
  // Het korte woord staat op het knopje als de set een van meer is.
  'set.taal-sp-eiij': 'Ei of ij',
  'set.taal-sp-eiij.kort': 'ei / ij',
  'set.taal-sp-auou': 'Au of ou',
  'set.taal-sp-auou.kort': 'au / ou',
  'set.taal-sp-gch': 'G of ch',
  'set.taal-sp-gch.kort': 'g / ch',
  'set.taal-sp-ck': 'C of k',
  'set.taal-sp-ck.kort': 'c / k',
  'set.taal-sp-dt': 'D of t',
  'set.taal-sp-klinkers': 'Eén of twee klinkers',
  'set.taal-sp-klinkers.kort': 'klinkers',
  'set.taal-sp-medeklinkers': 'Eén of twee medeklinkers',
  'set.taal-sp-medeklinkers.kort': 'medeklinkers',
  'set.taal-sp-verkleinwoorden': 'Verkleinwoorden',
  'set.taal-sp-verkleinwoorden.kort': 'verkleinwoorden',
  'set.taal-sp-ig': 'Woorden op -ig',
  'set.taal-sp-ig.kort': '-ig',
  'set.taal-sp-lijk': 'Woorden op -lijk',
  'set.taal-sp-lijk.kort': '-lijk',
  'set.taal-sp-mix': 'Spellingmix',
  'set.taal-sp-fouten': 'Jouw fouten met spelling',
  'set.taal-ww-tt': 'Tegenwoordige tijd',
  'set.taal-ww-vt': 'Verleden tijd',
  'set.taal-ww-vd': 'Voltooid deelwoord',
  'set.taal-ww-mix': 'Werkwoordmix',
  'set.taal-ww-fouten': 'Jouw fouten met werkwoorden',
  // De manieren. Geen bliksemronde: spelling is nadenken, en een klok leert
  // gokken. Het flitsdictee heeft kijktijd, geen antwoordtijd.
  'mode.taal-letters': 'Kies de letters',
  'mode.taal-flitsdictee': 'Flitsdictee',
  'mode.taal-vorm-kiezen': 'Kies de vorm',
  'mode.taal-vorm-typen': 'Typ de vorm',
  'way.taal-letters': 'Kies de letters die in het woord horen — de instap naar schrijven',
  'way.taal-flitsdictee': 'Kijk drie tellen, en schrijf het woord dan zelf — zoals een dictee',
  'way.taal-vorm-kiezen': 'Kies uit drie vormen — de instap naar typen',
  'way.taal-vorm-typen': 'Schrijf de vorm zelf op — voor de toets',
  // De ronde. Geen voorleesknop: die zou het woord zeggen dat je moet spellen.
  'taal.loading': 'Woorden worden geladen…',
  'taal.failed': 'De woorden konden niet geladen worden.',
  'taal.gat': 'open plek',
  'taal.lettersVraag': 'Welke letters horen erin?',
  'taal.lettersLabel': 'Kies de letters',
  'taal.lettersPrompt': 'Maak het woord af.',
  'taal.flitsKijk': 'Kijk goed',
  'taal.flitsKijkPrompt': 'Onthoud hoe het woord eruitziet.',
  'taal.flitsTyp': 'Typ het woord',
  'taal.flitsTypPrompt': 'Schrijf het woord in de zin.',
  'taal.flitsVeld': 'Het woord dat er stond',
  'taal.vormVraag': 'Welke vorm hoort erin?',
  'taal.vormLabel': 'Kies de vorm',
  'taal.vormPrompt': 'Zet het werkwoord in de zin.',
  'taal.vormTyp': 'Typ de vorm',
  'taal.vormVeld': 'De vorm van {infinitief}',
  'taal.infinitief': 'Het werkwoord is {infinitief}.',
  // Na een antwoord. Het goede woord staat erbij, en na een fout de regel,
  // toegepast op dit woord.
  'taal.goed': 'Goed! {woord}.',
  'taal.fout': 'Het is {woord}, met {letters}.',
  'taal.foutVorm': 'Het is {woord}.',
  'taal.jijKoos': 'Jij koos {gegeven}.',
  'taal.jeSchreef': 'Je schreef {getypt}.',
  'taal.weetNiet': 'Nu weet je hem.',
  'taal.practiceMore': 'Deze woorden moet je nog oefenen',
  'taal.practiceMoreVormen': 'Deze werkwoorden moet je nog oefenen',
  // De regel van een spellingset, toegepast op één woord.
  'taal.regel.onthoud': 'Hier helpt geen regel: je hoort het niet. Onthoud {woord}, met {letters}.',
  'taal.regel.dt':
    'Maak het woord langer: {hulp}. Je hoort een {letter}, dus je schrijft een {letter}.',
  'taal.regel.klinkerEen':
    'Hak het woord in stukjes: {hulp}. De lange klank staat aan het eind van een stukje, dus één letter: {letters}.',
  'taal.regel.klinkerTwee':
    'Na de lange klank komt nog een medeklinker: {hulp}. Dan schrijf je twee letters: {letters}.',
  'taal.regel.medeEen':
    'Hak het woord in stukjes: {hulp}. Na een lange klank schrijf je de medeklinker één keer: {letters}.',
  'taal.regel.medeTwee':
    'Hak het woord in stukjes: {hulp}. Na een korte klank schrijf je de medeklinker twee keer: {letters}.',
  'taal.regel.vk.je': 'Na de meeste medeklinkers komt -je: {woord}.',
  'taal.regel.vk.tje': 'Na een klinker, of na een l, n, r of w, komt -tje: {woord}.',
  'taal.regel.vk.pje': 'Na een m komt -pje: {woord}.',
  'taal.regel.vk.etje': 'Na een korte klank met een l, m, n, r of ng komt -etje: {woord}.',
  'taal.regel.ig': 'Hoor je aan het eind „ug”? Je schrijft altijd -ig: {woord}.',
  'taal.regel.lijk': 'Hoor je aan het eind „luk”? Je schrijft altijd -lijk: {woord}.',
  // De regel van een werkwoord, toegepast op dit werkwoord (ADR-118). Wat de
  // regel is, rekent game-core uit; hier staan alleen de woorden.
  'taal.regel.ttIk': 'Ik, dus alleen de stam: {stam}.',
  'taal.regel.ttAchter': 'Jij staat achter het werkwoord, dus alleen de stam: {stam}.',
  'taal.regel.ttTJij': 'Jij, dus stam + t: {stam} + t = {vorm}.',
  'taal.regel.ttTHij': 'Hij, zij of het, dus stam + t: {stam} + t = {vorm}.',
  'taal.regel.ttAlTJij': 'Jij, dus stam + t. Maar de stam {stam} eindigt al op een t: {vorm}.',
  'taal.regel.ttAlTHij':
    'Hij, zij of het, dus stam + t. Maar de stam {stam} eindigt al op een t: {vorm}.',
  'taal.regel.ttMeervoud': 'Meer dan één persoon, dus het hele werkwoord: {vorm}.',
  'taal.regel.vtTe':
    '’t Kofschip: in {infinitief} staat een {letter} vóór -en, dus {stam} + {uitgang} = {vorm}.',
  'taal.regel.vtDe':
    'In {infinitief} staat een {letter} vóór -en. Die zit niet in ’t kofschip, dus {stam} + {uitgang} = {vorm}.',
  'taal.regel.vdT': 'Ge- + stam + t, want de {letter} van {infinitief} zit in ’t kofschip: {vorm}.',
  'taal.regel.vdD':
    'Ge- + stam + d, want de {letter} van {infinitief} zit niet in ’t kofschip: {vorm}.',
  'taal.regel.vdAl':
    'Ge- + stam + {eind}. De stam {stam} eindigt al op een {eind}, dus er komt niets bij: {vorm}.',
  'taal.regel.vdZonderGe':
    'Met {voorvoegsel}- ervoor komt er geen ge- bij. Wel een {eind}: {vorm}.',
  'taal.regel.vdZonderGeAl':
    'Met {voorvoegsel}- ervoor komt er geen ge- bij, en de stam eindigt al op een {eind}: {vorm}.',
  'taal.regel.sterk':
    'Dit is een sterk werkwoord: {infinitief}, {vorm}. Die vorm maak je niet met een regel, die onthoud je.',
  // Ontdekken voor werkwoorden: een kaart per regel, met voorbeelden uit de set.
  'taal.explore.kindVormen': 'Ontdek de regels',
  'taal.kaart.ik': 'Ik: alleen de stam',
  'taal.kaart.ik.uitleg':
    'De stam is het werkwoord zonder -en, zoals je hem hoort: worden, ik word.',
  'taal.kaart.jijhij': 'Jij en hij: stam + t',
  'taal.kaart.jijhij.uitleg':
    'Bij jij, hij, zij en het komt er een t achter de stam, ook als je die niet hoort: hij wordt.',
  'taal.kaart.alT': 'Stam op een t: geen t erbij',
  'taal.kaart.alT.uitleg': 'Eindigt de stam al op een t, dan komt er geen tweede t bij: hij zet.',
  'taal.kaart.achter': 'Jij achter het werkwoord: alleen de stam',
  'taal.kaart.achter.uitleg': 'Staat jij achter het werkwoord, dan valt de t weg: word jij?',
  'taal.kaart.meervoud': 'Meer personen: het hele werkwoord',
  'taal.kaart.meervoud.uitleg': 'Bij wij, jullie en zij is het het hele werkwoord: wij worden.',
  'taal.kaart.te': '’t Kofschip: -te en -ten',
  'taal.kaart.te.uitleg':
    'Kijk naar de letter vóór -en. Is dat een t, k, f, s, ch of p? Dan schrijf je -te, en -ten bij meer personen.',
  'taal.kaart.de': 'Niet in ’t kofschip: -de en -den',
  'taal.kaart.de.uitleg':
    'Zit de letter vóór -en niet in ’t kofschip, dan schrijf je -de, en -den bij meer personen. Leven heeft een v, dus leefde.',
  'taal.kaart.vdT': 'Ge- + stam + t',
  'taal.kaart.vdT.uitleg':
    'Zit de letter vóór -en in ’t kofschip, dan komt er een t achter: gefietst.',
  'taal.kaart.vdD': 'Ge- + stam + d',
  'taal.kaart.vdD.uitleg': 'Zit die letter niet in ’t kofschip, dan komt er een d achter: geleefd.',
  'taal.kaart.zonderGe': 'Be-, ver-, ont-, her-, ge- en er-: geen ge-',
  'taal.kaart.zonderGe.uitleg':
    'Begint het werkwoord met be-, ver-, ont-, her-, ge- of er-, dan komt er geen ge- voor: verhuisd.',
  'taal.kaart.sterk': 'Sterke werkwoorden',
  'taal.kaart.sterk.uitleg': 'Deze vormen maak je niet met een regel. Die moet je onthouden.',
  // Ontdekken: de regel in het algemeen, en dan de woorden.
  'taal.explore.kind': 'Ontdek de woorden',
  'taal.explore.regel': 'De regel',
  'taal.explore.woorden': 'De woorden',
  'taal.uitleg.eiij':
    'Ei en ij klinken hetzelfde. Hier helpt geen regel: kijk goed hoe het woord eruitziet, en onthoud het.',
  'taal.uitleg.auou':
    'Au en ou klinken hetzelfde. Hier helpt geen regel: kijk goed hoe het woord eruitziet, en onthoud het.',
  'taal.uitleg.gch':
    'Een g en een ch klinken bijna hetzelfde. Kijk goed hoe het woord eruitziet, en onthoud het.',
  'taal.uitleg.ck':
    'Een c klinkt hier als een k. Veel van deze woorden komen uit een andere taal. Kijk goed, en onthoud het.',
  'taal.uitleg.dt':
    'Maak het woord langer: honden. Hoor je een d? Dan schrijf je een d. Hoor je een t? Dan schrijf je een t.',
  'taal.uitleg.klinkers':
    'Hak het woord in stukjes: bo-men. Staat de lange klank aan het eind van een stukje? Dan schrijf je één letter. Komt er nog een medeklinker achter, zoals in boom? Dan twee.',
  'taal.uitleg.medeklinkers':
    'Hak het woord in stukjes: kat-ten. Na een korte klank schrijf je de medeklinker twee keer. Na een lange klank, zoals in ma-ken, één keer.',
  'taal.uitleg.verkleinwoorden':
    'Meestal komt er -je achter: boekje. Na een klinker of na l, n, r of w: -tje. Na een m: -pje. Na een korte klank met l, m, n, r of ng: -etje.',
  'taal.uitleg.ig': 'Hoor je aan het eind „ug”? Je schrijft altijd -ig, zoals in gelukkig.',
  'taal.uitleg.lijk': 'Hoor je aan het eind „luk”? Je schrijft altijd -lijk, zoals in vrolijk.',

  'result.title': 'Ronde klaar',
  'result.practiceMore': 'Deze moet je nog oefenen',
  'result.home': 'Terug naar start',
  'result.stoppedEarly': 'Je stopte na {gedaan} van de {totaal} vragen.',
  'result.mapLabel': 'Kaart met wat je nog moet oefenen',
  'result.mapHelp': 'De blauwe plekken moet je nog oefenen.',
  // De ronde in getallen, als tegels bovenaan "Ronde klaar" (ADR-112).
  'result.samenvatting': 'Hoe de ronde ging',
  // Wat de ronde met het album deed (ADR-149): eerst de pagina, dan drie regels.
  // Wat je deed, wat er veranderde, en wat terugkomen oplevert.
  'result.gedaan': '{beantwoord} vragen, {goed} goed',
  'result.gedaanEen': '1 vraag, {goed} goed',
  'result.stenen': '{aantal} stenen erbij.',
  'result.stenenEen': '1 steen erbij.',
  'result.stenenGeen': 'Nog geen stenen — deze zag je voor het eerst.',
  'result.morgenNiets': 'Morgen komt er niets terug. Over {dagen} dagen weer.',
  'result.morgenTerugEen': 'Morgen komt er 1 terug.',
  'result.morgenTerug': 'Morgen komen er {aantal} terug.',
  // Zonder "weer": deze regel staat nu ook onder een allereerste ronde, en dan
  // is er nog niets teruggekomen om weer te komen.
  // Stoppen is ook af: als er vandaag niets meer terug moet komen, is "Klaar" de
  // eerste knop en brengt een extra ronde nieuwe plaatjes.
  'result.vandaagKlaar': 'Klaar voor vandaag',
  // Waar geldt voor een eerste ronde ooit én voor een kind dat vandaag alles
  // afwerkte wat terugkwam: in het eerste geval hoefde er nog niets terug te
  // komen, en "alles is gedaan" zou dan over niets gaan.
  'result.vandaagKlaarUitleg':
    'Er hoeft vandaag niets meer terug te komen. Stoppen is nu ook goed.',
  'result.klaar': 'Klaar',
  'result.nieuwePlaatjes': 'Iets nieuws leren',
  'result.nieuwePlaatjesUitleg':
    'Dit levert vandaag nog geen stenen op. Ze tellen als ze terugkomen.',

  // Het cijfer, en alleen na een toetsstand. Elke ronde wordt geteld en elke
  // ronde komt met een cijfer in het logboek, maar een cijfer voor een ronde
  // waarin de app je na elke vraag het antwoord gaf zegt niets over jou.
  'result.markLabel': 'Cijfer',
  'result.markWhy': 'Zonder hulp onderweg, net als op school.',

  // Wat een ronde opleverde: een diploma (ADR-112). Alleen te zien als er echt
  // iets bij kwam. Geen "goed gedaan": het product zegt wat er gebeurd is, niet
  // wat je ervan moet vinden.
  'result.beloningTitle': 'Wat je verdiende',
  // De voorspelling, gratis en zonder code (ADR-122). Dezelfde woorden als op
  // de voordeur, want het is dezelfde som: wat er over is als je niets doet.
  // Geen knop ernaast naar premium — een kind een slot voorhouden op de pagina
  // waar het net iets goed deed, is precies wat PremiumSlot niet doet.
  'result.onthoud': '{procent}% weet je hier over drie weken nog van.',
  'result.again': 'Nog een ronde',
  // Alleen wat er in deze ronde fout ging, meteen nog een keer (ADR-111).
  'result.herhaalFouten': 'Herhaal je fouten',

  // K10. Twee schakelaars in plaats van drie: de leesmodus verviel (ADR-025).
  // School en woonplaats staan er niet en komen er niet — dat zijn de twee
  // velden die een naam op een apparaat veranderen in een vindbaar kind.
  'you.title': 'Jij',
  // Onder de titel, in de kop die de etalage van premium is (ADR-150).
  'you.intro': 'Wie je bent, en wat je gemaakt hebt: je album en je diploma’s.',
  'you.nameIs': 'Je oefent als {naam}.',
  // De persoon bovenaan Jij (ADR-126), met de naam die tot nu toe nergens te
  // veranderen was.
  'you.who': 'Jouw naam',
  'you.nameChange': 'Naam wijzigen',
  'you.nameSave': 'Bewaren',
  'you.nameCancel': 'Laat maar',

  'you.children': 'Wie oefent er?',
  'you.practisingNow': 'oefent nu',
  'you.switchTo': 'Geef {naam} de beurt',
  'you.addChild': 'Nog een kind erbij',
  'you.childName': 'Naam van het kind',
  'you.add': 'Toevoegen',
  'you.childExplain':
    'Ieder kind heeft een eigen voortgang. Wat de een oefent, telt niet mee voor de ander.',
  // Het blok voor de volwassene. Nadrukkelijk geen rapport over het kind: geen
  // voorspelling, geen percentage, geen vergelijking. Wat er staat is wat er
  // gebeurd is — rondes, en waar ze op uitkwamen.
  'you.week': 'Deze week',
  'you.weekNone': 'Deze week nog niet geoefend.',
  // Vier tegels (ADR-112). Een streepje waar
  // nog geen cijfer is: nul zou een cijfer zijn.
  'you.tegelRondes': 'Rondes',
  'you.tegelDagen': 'Dagen geoefend',
  'you.tegelVragen': 'Vragen beantwoord',
  'you.tegelCijfer': 'Gemiddeld cijfer',
  'you.geenCijfer': '–',
  'you.weekMost': 'Het meest geoefend: {set}.',
  'you.settings': 'Instellingen',
  'you.settingsBijOuder': 'Voorlezen, geluid en minder beweging stel je in bij Voor ouders.',
  'you.readAloud': 'Vragen voorlezen',
  'you.readAloudWhy': 'Je kunt elke vraag laten voorlezen.',
  'you.on': 'aan',
  'you.off': 'uit',
  'you.stays': 'Wat je oefent blijft op dit apparaat.',
  // Premium op dit apparaat, voor de volwassene die de code heeft (ADR-116).
  'you.premium': 'Premium',
  'you.premiumAan': 'Premium staat aan tot en met {datum}.',
  'you.premiumVandaag': 'Vandaag is de laatste dag van premium.',
  // Het weekbericht: de week gelezen in plaats van geteld (ADR-133).
  'regio.eigen': 'Eigen woorden',
  'onderwerp.taal.eigen': 'Eigen woorden',
  'onderwerp.taal.eigen.uitleg': 'De lijst die je zelf hebt ingevoerd.',
  'onderwerp.taal.eigen.keuze': 'Welke lijst?',
  // Eigen woordenlijsten (ADR-135).
  'you.lijstenTitel': 'Eigen woorden',
  'you.lijstenUitleg':
    'Typ de oefenstof van school zelf in of importeer een bestand, en je kind oefent deze als flitsdictee.',
  // Importeren (ADR-145): een CSV of een tekstbestand, met de uitleg zo kort
  // dat een ouder hem leest voordat hij iets kiest.
  'you.lijstenImport': 'Bestand importeren',
  'you.lijstenImportTitel': 'Importeren uit een bestand',
  'you.lijstenImportUitleg':
    'Kies een CSV- of tekstbestand, bijvoorbeeld opgeslagen vanuit Excel. Zet één woord per regel. Wil je meer lijsten tegelijk? Zet dan in de eerste kolom de naam van de lijst en in de tweede kolom het woord.',
  'you.lijstenImportVoorbeeld': 'Voorbeeld: Blok 2;fiets',
  'you.lijstenImportKlaar': '{woorden} woorden toegevoegd aan {lijsten} lijsten.',
  'you.lijstenImportKlaarEen': '{woorden} woorden toegevoegd aan 1 lijst.',
  'you.lijstenImportOver': '{aantal} overgeslagen: dubbel, te lang of er was geen plek meer.',
  'you.lijstenImportLeeg': 'In dit bestand stonden geen woorden die we konden gebruiken.',
  'you.lijstenImportFout': 'Dit bestand konden we niet lezen. Kies een CSV- of tekstbestand.',
  'you.lijstenGeen': 'Je hebt nog geen lijst.',
  'you.lijstenNieuw': 'Nieuwe lijst',
  'you.lijstenNaam': 'Naam van de lijst',
  'you.lijstenNaamHint': 'Bijvoorbeeld: Week 12',
  'you.lijstenMaak': 'Lijst maken',
  'you.lijstenWoord': 'Woord',
  'you.lijstenWoordToe': 'Woord toevoegen',
  'you.lijstenWoordWeg': '{woord} weghalen',
  'you.lijstenWeg': 'Lijst weghalen',
  'you.lijstenAantal': '{aantal} woorden',
  'you.lijstenAantalEen': '1 woord',
  'you.lijstenVol': 'Deze lijst is vol.',
  'you.lijstenGenoeg': 'Meer lijsten passen er niet bij.',
  // De ouderpagina, losgetrokken van "Jij" (ADR-136).
  // Het album (ADR-149). Elk item is een plaatje dat lagen krijgt: een schets,
  // kleur, een lijstje, stempels. De laag staat in vorm én in woorden, en het
  // woord voor doos vier is overal hetzelfde: onthoud je (ADR-030).
  // Na een antwoord: wat het met het plaatje deed. Eén zin, en geen als er
  // niets veranderde.
  // Goed, maar niet aan de beurt. Zo leert een kind spreiden zonder het woord.
  // De achterkant van een plaatje.

  // De toren (ADR-158). Een steen is een goed antwoord op iets dat aan de beurt
  // was en dat je eerder al eens had. Tien stenen is een verdieping, en er gaat
  // nooit iets af — dus er staat nergens wat iets kost.
  'toren.naam': 'Je toren',
  'toren.uitleg':
    'Alles wat je oefent komt een keer terug. Weet je het dan nog, dan krijg je een steen. Tien stenen is een verdieping, en die blijft staan.',
  'toren.totaal': '{aantal} stenen',
  'toren.totaalEen': '1 steen',
  'toren.verdiepingen': '{aantal} verdiepingen',
  'toren.verdiepingEen': '1 verdieping',
  'toren.verdieping': 'Verdieping {n}',
  'toren.verdiepingVol': 'Verdieping {n} is af.',
  'toren.verdiepingDatum': 'Verdieping {n}, {datum}',
  'toren.rest': 'Nog {aantal} tot verdieping {n} af is.',
  'toren.restEen': 'Nog 1 tot verdieping {n} af is.',
  'toren.hoogte': '{meter} meter hoog',
  'toren.hoger': 'Hoger dan {ding}.',
  'toren.naarHoger': 'Nog {aantal} verdiepingen tot {ding}.',
  'toren.leeg': 'Je toren begint morgen. Dan liggen er {aantal} stenen klaar.',
  'toren.leegNul':
    'Je toren begint zodra iets terugkomt. Wat je vandaag leert, telt als het terugkomt.',
  'toren.fundament': 'Wat je al had',
  'toren.fundamentUitleg': 'Je toren begint met alles wat je tot nu toe goed had.',
  'toren.samenvatting':
    'De toren: {stenen} stenen, {verdiepingen} verdiepingen, {meter} meter hoog.',
  // Voor de ouder (ADR-158). De derde zin is de belangrijkste: zonder die zin
  // lijkt een kind dat het goed doet te verslappen, terwijl het tegendeel
  // gebeurt.
  'toren.ouderTitel': 'Hoe de toren werkt',
  'toren.ouderUitleg':
    'Een steen is één keer dat je kind iets nog wist toen het terugkwam. Nieuwe woorden en sommen tellen nog niet mee; die tellen de dag dat ze terugkomen. Er gaat nooit iets af, ook niet na een fout antwoord of een week zonder oefenen.',
  'toren.ouderTempo':
    'Hoe beter je kind iets kent, hoe minder vaak het terugkomt. Dan komen er langzamer stenen bij — dat is geen verslapping maar het bewijs dat het blijft hangen. Een nieuw onderwerp opent nieuwe stenen.',
  // De vier dingen die in een ronde gezegd worden. Bij een fout staat er niets:
  // het foutteken heeft dat al gezegd.
  'toren.steenGoed': 'Je wist hem nog. Eén steen.',
  'toren.steenAl': 'Die ken je al. Over {dagen} dagen telt hij weer.',
  'toren.steenMorgen': 'Die ken je al. Morgen telt hij.',
  'toren.steenNieuw': 'Nieuw. Over {dagen} dagen komt hij terug.',

  // De ijkpunten (ADR-158): inhoud, geen regel.
  // De reeks (ADR-158). Alle dagen tellen mee, ook het weekend, en één gemiste
  // dag breekt hem. De app noemt bij een lopende reeks wat er op het spel staat;
  // wat er niet is: een aftelklok, een alarmkleur, of herstel te koop. Breken
  // kost nooit een steen, en daar gaat de zin bij een nieuwe start dan ook over.
  // Welk gezicht de toren laat zien (ADR-158).
  'retention.kaartLabel': 'De kaart van {wat}, met per plek hoe het ervoor staat.',

  'register.titel': 'Hoe de toren eruitziet',
  'register.uitleg':
    'Jongere kinderen zien het beeld met een zin erbij, oudere de getallen en de datums. Standaard kiest de groep.',
  'register.auto': 'Volg de groep',
  'register.beeld': 'Het beeld',
  'register.getal': 'De getallen',

  'reeks.naam': 'Je reeks',
  'reeks.dagen': '{aantal} dagen op rij',
  'reeks.dagenEen': '1 dag',
  'reeks.vandaag': 'Vandaag telt al mee.',
  'reeks.record': 'Je langste: {aantal} dagen.',
  'reeks.recordEen': 'Je langste: 1 dag.',
  'reeks.uitleg': 'Alle dagen tellen mee, ook het weekend.',
  'reeks.ouderUitleg':
    'De reeks telt dagen met een afgemaakte ronde. Het weekend telt mee, en één dag overslaan breekt hem. Breken kost nooit stenen, en het record blijft staan.',
  'reeks.opnieuw': 'Je reeks begint opnieuw. Je toren staat er nog.',
  'reeks.leeg': 'Je reeks begint op de dag dat je een ronde afmaakt.',
  'reeks.opHetSpel': 'Je reeks staat op {aantal} dagen. Nog vandaag, anders begint hij opnieuw.',
  'reeks.opHetSpelEen': 'Je reeks staat op 1 dag. Nog vandaag, anders begint hij opnieuw.',
  'reeks.ouderRegel': '{aantal} dagen op rij; het langst {record} dagen.',
  'reeks.ouderGeen': 'Geen reeks op dit moment; het langst was {record} dagen.',

  'ijkpunt.giraf': 'een giraf',
  'ijkpunt.huis': 'een huis',
  'ijkpunt.boom': 'de hoogste boom',
  'ijkpunt.windmolen': 'een windmolen',
  'ijkpunt.kerktoren': 'een kerktoren',
  'ijkpunt.reuzenrad': 'een reuzenrad',
  'ijkpunt.domtoren': 'de Domtoren',
  'ijkpunt.euromast': 'de Euromast',
  'ijkpunt.eiffeltoren': 'de Eiffeltoren',
  'ijkpunt.wolken': 'de wolken',
  'ijkpunt.burjkhalifa': 'de Burj Khalifa',
  'ijkpunt.kilometer': 'een kilometer',
  'ijkpunt.tienkilometer': 'tien kilometer, waar vliegtuigen vliegen',
  'module.terugVandaag': '{aantal} komen hier vandaag terug.',
  'module.terugVandaagEen': '1 komt hier vandaag terug.',
  'module.terugMorgen': 'Hier komt vandaag niets terug. Morgen {aantal}.',
  'module.terugNiets': 'Hier komt voorlopig niets terug.',
  'ouder.title': 'Voor ouders',
  'ouder.uitleg':
    'Wat je geregeld hebt, hoe de app werkt, de oefenstof van school en hoe het gaat.',
  'ouder.naar': 'Voor ouders',
  'ouder.naarOnthouden': 'Bekijk wat je kind onthoudt en hoe het oefent',
  'ouder.diplomasTitel': 'Alle diploma’s',
  'ouder.diplomasUitleg':
    'Wat je kind gehaald heeft, en wat er nog te halen valt. Een diploma is een toets: je kind doet hem als de stof ver genoeg is, en kan hem printen.',
  'ouder.terug': 'Naar Jij',

  // Het account van de ouder (ADR-155). Alleen van de ouder: een kind heeft geen
  // e-mailadres en krijgt er nooit een, en logt vanaf F3 in met een eigen code.
  //
  // De toon is die van een ouder onder elkaar, niet die van een bank. Wat er
  // gebeurt als je niets doet, staat er ook bij: zonder account werkt alles
  // zoals het werkte.
  'account.titel': 'Account',
  'account.uitleg':
    'Met een account staat de voortgang van je kinderen niet alleen op dit apparaat, maar ook op de iPad en de laptop. Zonder account werkt alles gewoon zoals je gewend bent.',
  'account.email': 'E-mailadres',
  'account.wachtwoord': 'Wachtwoord',
  'account.wachtwoordHint': 'Minstens acht tekens.',
  'account.inloggen': 'Inloggen',
  'account.aanmelden': 'Account maken',
  'account.naarAanmelden': 'Ik heb nog geen account',
  'account.naarInloggen': 'Ik heb al een account',
  'account.bezig': 'Even kijken…',
  'account.ingelogd': 'Je bent ingelogd als {email}.',
  'account.uitloggen': 'Uitloggen',
  'account.uitloggenUitleg':
    'Wat je kinderen op dit apparaat hebben geoefend, blijft gewoon staan.',
  'account.gemaild': 'Er staat een mail voor je klaar. Klik op de link erin, dan kun je inloggen.',
  'account.fout.leeg': 'Vul allebei de velden in.',
  'account.fout.geen-email': 'Dit lijkt geen e-mailadres. Kijk of er een typefout in zit.',
  'account.fout.te-kort': 'Kies een wachtwoord van minstens acht tekens.',
  'account.fout.onjuist': 'Dit e-mailadres en dit wachtwoord horen niet bij elkaar.',
  'account.fout.bestaat-al': 'Er is al een account met dit e-mailadres. Log in.',
  'account.fout.bevestig-email': 'Klik eerst op de link in de mail die we je gestuurd hebben.',
  'account.fout.te-vaak': 'Te vaak geprobeerd. Probeer het over een uur opnieuw.',
  'account.fout.geen-verbinding': 'Er is nu geen verbinding. Probeer het zo nog eens.',
  'account.fout.niet-ingesteld': 'Inloggen is nog niet beschikbaar.',
  'you.geluid': 'Geluid bij een antwoord',
  'you.geluidWhy': 'Een korte toon als het goed is, en een zachte als het mis is.',
  // Twee schakelaars erbij (ADR-145), allebei voor een kind dat snel afgeleid is.
  'you.rustig': 'Minder beweging',
  'you.rustigWhy':
    'Knoppen, kaarten en beloningen bewegen niet meer. Rustiger voor wie snel afgeleid is.',
  'you.berichtTitel': 'Hoe gaat het?',
  'you.berichtNiets': 'Er is deze week niet geoefend.',
  'you.berichtGeoefend': 'Er is geoefend op {dagen} van de {schooldagen} schooldagen.',
  'you.berichtGeoefendEen': 'Er is geoefend op 1 van de {schooldagen} schooldagen.',
  'you.berichtOnthouden': 'Van alles wat er geoefend is, blijft nu {procent}% hangen.',
  'you.berichtWankelt': '{set} wacht het langst: {aantal} onderdelen, {dagen} dagen over tijd.',
  'you.berichtWankeltEen': '{set} wacht het langst: 1 onderdeel, {dagen} dagen over tijd.',
  'you.berichtWankeltVandaag': '{set} is vandaag aan de beurt: {aantal} onderdelen.',
  'you.berichtNiksWacht': 'Er wacht niets. Alles is op tijd herhaald.',
  'you.premiumMorgen': 'Premium loopt morgen af.',
  'you.premiumBijna': 'Premium loopt af op {datum}, over {dagen} dagen.',
  'you.premiumVerlopen':
    'Premium is afgelopen op {datum}. De voortgang van je kinderen staat er nog.',
  'you.premiumVerleng': 'Premium verlengen',
  'you.premiumUit': 'Premium staat nog niet aan op dit apparaat.',
  'you.premiumBekijk': 'Naar premium',

  // Onder een diploma, in woorden: "nog niet" is nooit alleen een tint.
  'diploma.gehaald': 'Gehaald',
  'diploma.nogNiet': 'Nog niet',
  // Rijp: de pagina is ver genoeg om af te zwemmen (ADR-141, ADR-149).
  'diploma.rijp': 'Klaar om af te zwemmen',

  // Reisstempels. Elk criterium staat erbij, want een stempel die je niet kunt
  // uitleggen is een raadsel in plaats van een beloning — en een kind dat niet
  // weet waarvoor het er een kreeg, kan er ook niet nog een verdienen.
  //
  // "Op weg", voor je eerste ronde, bestaat niet meer: een stempel is er voor
  // wat je onthoudt, nooit voor meedoen alleen (ADR-040).
  // Profile
  'profile.title': 'Wie ben jij?',
  'profile.help': 'Typ je naam. Je naam blijft op dit apparaat.',
  'profile.placeholder': 'Je naam',
  'profile.submit': 'Beginnen',
  'profile.nameTooShort': 'Typ eerst je naam.',

  // De groep (ADR-151). Na de naam, en altijd over te slaan. Het zegt wat de
  // groep doet — wat bovenaan staat — en wat hij niet doet: niets gaat op slot.
  // Zelfde belofte als bij de naam: hij blijft op dit apparaat.
  'groep.vraag': 'In welke groep zit je?',
  'groep.uitleg':
    'Dan zetten we de oefeningen voor jouw groep bovenaan. Je kunt altijd alles kiezen. Je groep blijft op dit apparaat.',
  'groep.knop': 'Groep {groep}',
  'groep.weetNiet': 'Weet ik niet',
  'groep.terug': 'Terug naar je naam',
  // Eén keer op de voordeur, voor een kind dat er al was vóór deze vraag.
  'groep.nietNu': 'Niet nu',
  // Op Voor ouders. De ouder hoort ook wat er op 1 augustus gebeurt, want dat
  // doet de app zonder te vragen.
  'groep.ouderTitel': 'Groep van {naam}',
  'groep.ouderUitleg':
    'Wat bij deze groep past, staat bovenaan in Vandaag en op elke vakpagina. {naam} kan altijd alles kiezen. Op 1 augustus gaat de groep vanzelf één verder.',
  'groep.geen': 'Geen groep',
  'groep.gekozen': '{naam} zit in groep {groep}.',
  'groep.nietGekozen': 'Er is geen groep gekozen. Dan staat alles in de gewone volgorde.',
  // Op een tegel die niet bij de groep past. Hij blijft kiesbaar; dit zegt
  // alleen waarom hij onderaan staat.
  'groep.herhaling': 'Nog eens herhalen',
  'groep.later': 'Voor later',

  // Accessible names for things that have no visible label of their own
  'a11y.progress': 'Voortgang in deze ronde',
} as const;
