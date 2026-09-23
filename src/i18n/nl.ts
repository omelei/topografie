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
  'home.popularStart': 'Hier begin je mee vandaag',
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
  // De doelen van deze week (ADR-162). "Waar je voor gaat" stond hier: één
  // diploma, gekozen uit drie voorstellen, dat maanden kon duren. Dit heeft een
  // einde en noemt het ook — de datums van maandag tot en met zondag — en het
  // kind maakt het zelf.
  'weekdoel.titel': 'Je doelen voor deze week',
  'weekdoel.leeg': 'Nog geen doel. Wat wil je deze week halen?',
  'weekdoel.vraag': 'Wat voor doel wil je?',
  'weekdoel.soort.rondes': 'Een aantal rondes',
  'weekdoel.soort.dagen': 'Op een aantal dagen oefenen',
  'weekdoel.soort.diploma': 'Een diploma halen',
  'weekdoel.hoeveel': 'Hoeveel?',
  'weekdoel.rondesDoel': '{aantal} rondes doen',
  'weekdoel.dagenDoel': 'Op {aantal} dagen oefenen',
  'weekdoel.diplomaDoel': 'Het diploma {naam} halen',
  // Een diploma dat er niet meer is — een set die weg is, of een premiumvorm
  // zonder code. De rij blijft staan met een eerlijke zin in plaats van een
  // lege naam, zodat hij weggehaald kan worden.
  'weekdoel.diplomaWeg': 'Dit diploma bestaat niet meer',
  'weekdoel.balk': '{gedaan} van de {nodig}',
  'weekdoel.gehaald': 'Gehaald!',
  'weekdoel.toevoegen': 'Doel toevoegen',
  'weekdoel.annuleer': 'Laat maar',
  'weekdoel.vol': 'Drie doelen is genoeg voor één week.',
  'weekdoel.wegVan': 'Weghalen: {doel}',
  'weekdoel.geenDiplomas': 'Er is nu geen diploma om deze week voor te gaan.',
  'weekdoel.diplomaDichtbij': 'Dichtbij',
  // Onder het blok: naar het hele raster op Jij, ook wat nog te halen is
  // (ADR-153).
  'weekdoel.alleDiplomas': 'Bekijk alle diploma’s',
  // Geen doelen hoeven is ook een antwoord, en dan wordt het niet elke maandag
  // opnieuw gevraagd. Aanzetten kan bij de instellingen op Jij (ADR-171).
  'weekdoel.uitZetten': 'Ik wil geen doelen',
  // Op het uitslagscherm, onder het diploma dat net binnen is.
  'weekdoel.gehaaldRonde': 'Dit was een doel van deze week.',
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

  // Terugkomen na weken (ADR-149): geen gemiste dagen, wel wat er nog staat.
  // Het aantal is wat er vandaag aan de beurt is, dus het klopt letterlijk.
  'terug.titel': 'Welkom terug',
  'terug.zin': 'Je diploma’s staan er nog.',
  'terug.klaar': '{aantal} onderdelen staan klaar.',
  'terug.klaarEen': '1 onderdeel staat klaar.',
  'terug.minuutEen': 'De eerste ronde duurt ongeveer 1 minuut.',
  'terug.minuten': 'De eerste ronde duurt ongeveer {minuten} minuten.',
  'terug.knop': 'Opfrissen',
  // Het schooljaar, als blad voor de printer: welke diploma's dit kind haalde
  // en wanneer. Op het scherm is het één knop onder de kast (ADR-172); de kast
  // laat dezelfde diploma's al zien.
  'jaar.kop': 'Het schooljaar van {naam}, {van}–{tot}',
  'jaar.diploma': '{naam} — {datum}',
  'jaar.eerder': 'Eerder gehaald',
  'jaar.geenDiplomas': 'Dit schooljaar nog geen diploma gehaald.',
  'jaar.print': 'Print je diploma’s van dit schooljaar',
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
  // Nooit een telling die nul is (ADR-167). De eerste twee dagen kan er niets
  // staan — een onderdeel telt pas na drie goede antwoorden op drie dagen — en
  // "0 van de 10" leest als een cijfer voor het kind in plaats van als de stand.
  'afzwemmen.nietRijpNiets':
    'Je hebt hier nog niets onthouden. Voor het diploma moet je er {nodig} onthouden.',
  'afzwemmen.nietRijpUitleg':
    'Een onderdeel telt mee als je het drie keer goed weet, op drie verschillende dagen. Oefen nog even, dan mag je afzwemmen.',
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
  'afzwemmen.print': 'Print je diploma',
  'afzwemmen.printNaam': 'Gehaald door {naam}',
  'afzwemmen.printZonderNaam': 'Gehaald',
  'afzwemmen.printDatum': 'op {datum}',
  // Wat er wel is maar niet vooraan hoeft (ADR-143).
  'uitklap.tabel': 'Laat de tabel zien',
  'uitklap.tabelDicht': 'Verberg de tabel',
  'uitklap.uitlegDicht': 'Verberg de uitleg',
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
  // De overslaan-link (ADR-166). Onzichtbaar tot hij focus krijgt, en dan het
  // eerste wat er staat. "Naar de inhoud" en niet "Skip to content": de app is
  // Nederlands, ook waar alleen een schermlezer meeleest.
  'nav.overslaan': 'Naar de inhoud',
  // Het vakmenu onder de balk op een tablet en een telefoon, waar de rail niet
  // staat. De knop zegt welk vak je open hebt; waar je in geen vak bent noemt
  // hij wat hij doet, want daar is hij de weg naar een ronde (ADR-121). De naam
  // voor een schermlezer zet het woord "vak" voor het vak, omdat "Topo" alleen
  // niet zegt waarvan het er een is.
  'nav.vakKies': 'Oefenen',
  'nav.vakHuidig': 'vak {vak}',
  'nav.vandaag': 'Vandaag',
  'nav.vrienden': 'Vrienden',
  'nav.jij': 'Jij',
  'nav.premium': 'Premium',
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
  // Sinds ADR-171 een deel van Jij, dus zonder eigen titel en eigen zin: die
  // van Jij zegt wat er op de pagina staat.
  // De bovenkant van de pagina (ADR-148): alles bij elkaar, over elk vak.
  'retention.geheugenTitel': 'Je geheugen',
  // Zonder het woord "onderdeel" (ADR-177). Dat woord wordt nergens in dit
  // product uitgelegd, en de eigenaar las het — terecht — als "goede
  // antwoorden", wat iets heel anders is: dat telt `Hoe vaak oefen je`. Hier
  // staat nu helemaal geen zelfstandig naamwoord, want de bijzin draagt het
  // al: "8 — weet je goed — van de 30 die je geoefend hebt".
  'retention.geheugenGoed': 'weet je goed',
  'retention.geheugenVan': 'van de {aantal} die je geoefend hebt',
  'retention.geheugenLeeg':
    'Je hebt nog niets geoefend. Na je eerste ronde zie je hier wat je onthoudt.',
  'retention.vakRegel': '{onthouden} onthoud je, {geoefend} geoefend, {totaal} in totaal',
  'retention.vakLeeg': 'Nog niet geoefend, {totaal} in totaal',
  // Alles wat er ooit geoefend is, en de laatste acht weken, onder de tegels van
  // deze week (ADR-172). De totalen zijn één zin en geen tweede rij tegels: twee
  // rijen met "Rondes" en "Rondes in totaal" boven elkaar lazen als één rij die
  // zichzelf tegensprak. Nadrukkelijk niet hetzelfde als wat je onthoudt: dit
  // gaat over antwoorden die je gaf, dat over wat blijft.
  'retention.totaal':
    'Alles bij elkaar: {rondes} keer geoefend en {vragen} vragen beantwoord, waarvan {procent}% goed.',
  'retention.grafiek': 'Vragen per week',
  'retention.grafiekWk': 'wk {nummer}',
  'retention.grafiekNu': 'nu',
  'retention.grafiekZin': 'Week {nummer}: {goed} van de {totaal} vragen goed.',
  'retention.grafiekDezeZin': 'Deze week: {goed} van de {totaal} vragen goed.',
  'retention.grafiekGoed': 'goed',
  'retention.grafiekFout': 'niet goed',
  // "Per onderwerp" was een eigen kop met een eigen blok en is weg (ADR-177):
  // het onderwerp is de zoom binnen Je geheugen geworden, en drie koppen voor
  // ver, middel en dichtbij lazen als drie onderwerpen. Wat overblijft zijn de
  // vragen die een kind beantwoordt door te drukken, en die staan er zichtbaar
  // boven in plaats van alleen als naam voor een schermlezer.
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
  // De gratis voorproef (ADR-124): de pagina zegt welk onderwerp ze laat zien.
  // Dat er meer is, zegt de etalage onder het voorbeeld: één keer vragen per
  // pagina (ADR-172).
  // Het voorbeeldkind (ADR-165). Het woord "voorbeeld" staat er twee keer — in
  // de pil en in de zin — omdat dit het enige op deze pagina is wat niet over
  // dit kind gaat, en één merkje is er dan één te weinig.
  // De muur en de kaart van het voorbeeld heten anders dan die van het kind
  // zelf. Twee dingen met dezelfde naam op één pagina zijn voor een schermlezer
  // één ding dat twee keer staat.
  //
  // En geen naam waar de echte naam ín zit: wie "Alles in één blik" zoekt,
  // vindt "Alles in één blik, als voorbeeld" er gewoon bij — dat is hoe een
  // toegankelijke naam gezocht wordt, op een stuk van het geheel.
  // De vraag zelf, de enige op Jij (ADR-172), in woorden die zeggen wat je
  // erbij krijgt in plaats van dat er iets op slot zit — en in de stem van het
  // kind, met de ouder als wie de code heeft (ADR-163).
  'retention.verkoopKop': 'Wil je dit over jezelf zien?',
  'retention.verkoopTekst':
    'Met premium zie je hier elk vak, elk onderwerp en elk onderdeel, en hoe vaak je oefent, week na week. leer.nu zet elke dag voor je klaar wat je bijna vergeet, en je kunt de woorden van school zelf invoeren. Daar hebben je ouders een code voor nodig.',
  'retention.verkoopKnop': 'Bekijk premium',
  // Wat onthouden is, uitgeschreven zoals de regels van de reeks (ADR-114).
  // Sinds ADR-172 staat regel 1 open boven de ring die het woord telt, en de
  // andere drie — wat meetelt, opfrissen, een fout — in een uitklap eronder.
  //
  // Herschreven in ADR-171, in de volgorde waarin een kind het tegenkomt: eerst
  // wat onthouden is, dan wat meetelt, dan wat er later kan gebeuren. Elke zin
  // is nagelopen tegen `leitner.ts`. Drie dagen, want het snelste wat het
  // schema toelaat is goed op dag 0, dag 1 en dag 2 (INTERVAL_DAYS). Alleen
  // wat aan de beurt was telt (`review`). Opfrissen is een onderdeel in doos 4
  // of 5 dat langer niet gezien is dan zijn eigen tussenpoos nog een keer
  // (`isStale`), en één goed antwoord haalt het terug. Eén fout zet het in
  // doos 1.
  'retention.regelsTitel': 'Hoe werkt onthouden?',
  'retention.regel1':
    'Je onthoudt iets als je het drie keer goed hebt, op drie verschillende dagen.',
  // Zonder "onderdeel" en zonder "aan de beurt" (ADR-177). Dat laatste is het
  // woord van het schema en niet van het kind: wat het betekent is dat één dag
  // één keer telt, en dát is wat hier nu staat.
  'retention.regel2':
    'Op één dag telt één goed antwoord. Heb je het diezelfde dag nog een keer goed, dan telt dat niet extra. Daarom zijn het drie verschillende dagen.',
  'retention.regel3':
    'Heb je iets dat je onthoudt lang niet gezien? Dan moet je het even opfrissen. Eén goed antwoord is genoeg, en je onthoudt het weer.',
  'retention.regel4': 'Heb je iets fout? Dan begin je daarmee weer opnieuw.',

  // Het toetsblok is weg (ADR-162). Het vroeg een datum en een vak, en gaf
  // daar een voorspelling voor terug; wat het niet gaf was een reden om een
  // van beide in te typen. Zijn woorden staan hier niet meer: copy die
  // nergens meer verschijnt, is copy die bij de volgende ronde toch wordt
  // meegewogen.

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
  'choose.fouten': 'Je fouten',
  'choose.foutenWhy': 'Alleen de {aantal} die je eerder fout had',
  'choose.testModeWhy':
    'Je typt zonder hulp. Aan het eind zie je wat goed was en krijg je een cijfer.',
  'choose.startTest': '{wat} · oefentoets',
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
  'premium.afmelden': 'Code van dit apparaat halen',
  'premium.afmeldenUitleg':
    'Dan komt er een plek vrij om de code op een ander apparaat te gebruiken.',
  // Wat premium dóét, in vier klussen (ADR-124), sinds ADR-145 als kaarten met
  // een teken. De kop is wat het oplevert, de regel eronder hoe.
  'premium.watTitel': 'Wat premium voor je doet',
  'premium.usp.plan': 'Het herhalen wordt voor je gepland',
  'premium.usp.planUit':
    'Je kind hoeft niet te bedenken waar het moet beginnen. Leer.nu zet elke dag klaar wat aan de beurt is, net voordat het vergeten wordt.',
  // De statistieken als eigen belofte (ADR-164). "Je ziet wat blijft hangen"
  // stond hier, en dat is waar maar bescheiden: wat premium werkelijk geeft is
  // de hele boekhouding van het oefenen, tot per som. Elke regel hieronder is
  // een ding dat op de Onthouden-pagina echt staat, want een belofte die
  // nergens uitkomt is de snelste manier om een ouder kwijt te raken die net
  // betaald heeft.
  'premium.usp.zicht': 'Uitgebreide statistieken over je kind',
  // Zonder de voorspelling over drie weken (ADR-177). Die stond hier als
  // premiumbelofte en klopte op twee manieren niet meer: hij staat niet meer
  // bij de statistieken, en waar hij wél staat — na een ronde — is hij gratis
  // (`premium.regel.voorspelling`). Een belofte die nergens uitkomt is de
  // snelste manier om een ouder kwijt te raken die net betaald heeft, en dat
  // staat al sinds ADR-164 boven deze sleutel.
  'premium.usp.zichtUit':
    'Tot op de som en het woord: hoe vaak je kind het goed had, wanneer het er voor het laatst naar keek, en hoe het oefenen week na week gaat.',
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
  // Sinds ADR-177 is dit waar. Het stond hier als "Basis" terwijl een kind
  // zonder code één onderwerp van één vak zag — de provincies van Nederland,
  // niet als keuze maar als lot. Nu kan het elk van zijn eigen vakken en
  // onderwerpen aanwijzen.
  'premium.regel.blijfthangen': 'Per vak en per onderwerp zien wat blijft hangen',
  'premium.regel.vormen': 'Ontdekken, zoeken, meerkeuze en zelf typen',
  'premium.regel.herhaal': 'Na een ronde je fouten meteen overdoen',
  // "Een schatting" en niet "zien" (ADR-177): het is een vergeetcurve met een
  // gekozen constante, en `retention.ts` verbiedt tekst die anders suggereert.
  'premium.regel.voorspelling':
    'Na elke ronde een schatting van hoeveel je er over drie weken nog van weet',
  'premium.regel.tafeldiploma': 'De twaalf tafeldiploma’s',
  // Alle vijf de vakken, en het getal erbij (ADR-177). Er stond "vlaggen, klok
  // en topografie": Taal ontbrak, en de twintig rekendiploma's naast de tafels
  // ook. Dat is zesenvijftig van de achtenzestig, en de regel noemde er drie
  // soorten van. Een tabel die minder belooft dan het product geeft, is net zo
  // fout als een die meer belooft — `kast.test.ts` bewaakt de aantallen.
  'premium.regel.diplomas': 'De andere 56 diploma’s: rekenen, topografie, taal, klok en vlaggen',
  'premium.regel.plan': 'Elke dag klaargezet wat herhaald moet worden',
  // Wat premium hier écht toevoegt sinds ADR-177: de diepte en de tijd. Per
  // vak en per onderwerp kijken is gratis geworden, en deze regel zei nog dat
  // je dat kocht.
  'premium.regel.onthouden': 'Per som en per woord zien hoe het gaat, en het verloop week na week',
  'premium.regel.fouten': 'Alle fouten verzameld, om later te oefenen',
  'premium.regel.oefentoets': 'De oefentoets, met een cijfer',
  'premium.regel.bliksem': 'De bliksemronde en overleven',
  'premium.regel.lijsten': 'Oefenstof van school intypen of importeren',
  'premium.regel.kinderen': 'Tot drie kinderen op dit apparaat',
  'premium.regel.gezin': 'Eén code voor al je kinderen, op maximaal drie apparaten',

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
  // Hier stond "Geen abonnement". Dat kan niet blijven staan naast een knop
  // waar "€ 5 per maand" op staat (ADR-164), en de plek gaat naar de belofte
  // die dit product wél onderscheidt en die nergens anders stond.
  'premium.waarom.geenNamen': 'We slaan geen namen van kinderen op',
  'premium.waarom.geenNamenUit':
    'De voornaam die je kind invult, staat op je eigen apparaat en gaat nergens heen. Geen achternaam, geen school, geen woonplaats en geen geboortedatum: we vragen ze niet.',
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
  // De tweede manier (ADR-164). Een schooljaar vooruit betalen is voor wie
  // zeker weet dat dit past, en dat weet je pas nadat je het gebruikt hebt.
  // Daarom ook per maand, en dan zonder een jaar eraan vast te zitten.
  'premium.maandPrijs': '€ 5',
  'premium.perMaand': 'per maand',
  'premium.perSchooljaarKort': 'per schooljaar',
  'premium.maandKnop': 'Per maand',
  'premium.maandUitleg': 'Maandelijks opzegbaar. Je zegt op wanneer je wilt.',
  'premium.jaarVoordeel': 'Een heel schooljaar kost minder dan vijf maanden.',
  'premium.ofPerMaand': 'Of {prijs} per maand, maandelijks opzegbaar.',

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
  // Wat er in de naam van een tegel staat die een slot is (ADR-125, ADR-163).
  // Een tegel die iets anders doet dan kiezen, hoort dat te zeggen voordat hij
  // wordt ingedrukt; op het scherm zie je het venster opengaan, maar in een
  // naam die eindigt op het kale woord "Premium" stond het nergens.
  'premium.tegelSlot': 'Premium. Je krijgt eerst een vraag voor je ouders.',

  // "Vraag het even aan je ouders" (ADR-163): het venster dat een kind krijgt
  // als het op een slot drukt, in plaats van de hele premiumpagina. Kort, en
  // het spreekt het kind aan als het kind: haal er iemand bij, want jij koopt
  // niets. De prijs staat er niet — die staat op de knop die ernaartoe gaat en
  // op de pagina erachter, en een bedrag in een venster voor een kind van acht
  // is een getal zonder betekenis.
  'ouderVraag.titel': 'Vraag het even aan je ouders',
  'ouderVraag.uitleg': 'Dit onderdeel hoort bij premium. Daar is een code voor nodig.',

  // Drie uitwegen, en de eerste vraag is niet "heb je een code" maar "is er
  // iemand bij je" (ADR-174). Dat is het enige wat het kind op dit moment weet,
  // en het bepaalt alle drie de antwoorden.
  'ouderVraag.erbij': 'Mijn vader of moeder is erbij',
  'ouderVraag.erbijRegel': 'Dan kan de code er nu in',
  'ouderVraag.sturen': 'Stuur het naar mijn vader of moeder',
  'ouderVraag.sturenRegel': 'Dan kunnen ze er later naar kijken',
  'ouderVraag.bekijken': 'Wat is premium?',
  'ouderVraag.bekijkenRegel': 'Lees eerst wat je ermee kunt',
  'ouderVraag.codeTitel': 'De code',
  'ouderVraag.codeUitleg': 'Geef het apparaat even aan je vader of moeder.',
  'ouderVraag.terugVraag': 'Terug',
  'ouderVraag.terug': 'Nee, ik doe iets anders',
  'ouderVraag.sluit': 'Sluiten',

  // Doorsturen (ADR-174). Het bericht is in de stem van het kind, want het kind
  // drukt op de knop — en het vraagt om te kijken en niet om te kopen. Er gaat
  // niets mee dan het adres: geen naam, geen voortgang, en ook niet welke
  // oefening het wilde doen. Zo'n bericht reist via de telefoon van iemand
  // anders.
  'doorsturen.titel': 'Stuur het naar je ouders',
  'doorsturen.uitleg': 'Ze krijgen een link. Daar staat wat premium is en wat het kost.',
  'doorsturen.onderwerp': 'Iets van leer.nu',
  'doorsturen.bericht': 'Ik wil dit graag op leer.nu. Kijk je even?',
  'doorsturen.knop': 'Versturen',
  'doorsturen.bezig': 'Even wachten…',
  'doorsturen.verstuurd': 'Verstuurd. Je ouders kunnen er nu naar kijken.',
  'doorsturen.gekopieerd': 'De link staat klaar om te plakken. Zet hem in een bericht aan ze.',
  'doorsturen.zelf': 'Versturen lukt niet op dit apparaat. Dit is de link:',
  'doorsturen.mail': 'Of mail het ze',
  'premium.wat.vandaag':
    'Leer.nu zet elke dag klaar wat aan de beurt is, zodat je kind niet hoeft te bedenken waar het moet beginnen.',

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
  'practice.loading': 'Kaart wordt geladen…',
  'practice.mapFailed': 'De kaart kon niet geladen worden.',

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
  // Het diploma van elke andere soort som (ADR-168). "Rekendiploma" en niet
  // "Plusdiploma": de naam van de soort staat al in de startbalk en op de
  // tegel ernaast, en één woord voor zeven soorten houdt de pagina's gelijk.
  'mode.reken-diploma': 'Rekendiploma',
  'sums.diplomaStop': 'Bekijk je poging',
  'sums.diplomaEarned': 'Diploma gehaald: tafel van {tafel}',
  'sums.diplomaMissed': 'Nog geen diploma. Alle tien goed, dan is hij van jou.',
  'sums.rekendiplomaEarned': 'Diploma gehaald: {naam}',
  'sums.rekendiplomaMissed': 'Nog geen diploma. Negen van de tien goed is genoeg.',
  'rekenen.somdiplomasTitle': 'Jouw rekendiploma’s',
  // De wand die zijn namen uit de sets zelf haalt (ADR-168): rekenen buiten de
  // tafels, en Taal. "Plussommen tot 20: diploma gehaald" — het woord van de
  // set, en er niets omheen verzonnen.
  'diploma.muurCount': '{aantal} van de {totaal} gehaald',
  'diploma.muurHave': '{naam}: diploma gehaald',
  'diploma.muurWant': '{naam}: nog geen diploma',
  'rekenen.diplomasTitle': 'Jouw tafeldiploma’s',
  'rekenen.diplomasCount': '{aantal} van de {totaal} gehaald',
  'rekenen.diplomaHave': 'Tafel van {tafel}: diploma gehaald',
  'rekenen.diplomaWant': 'Tafel van {tafel}: nog geen diploma',
  'way.som-typen': 'Zeg het antwoord zelf — zo weet je of je de tafel kent',
  'way.som-meerkeuze': 'Kies uit vier getallen — de instap naar typen',
  'way.tafeldiploma': 'De hele tafel foutloos — één fout en je begint opnieuw',
  'way.reken-diploma': 'De toets: twintig sommen typen, negen van de tien goed',

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
  'set.nl-fouten': 'Jouw fouten in Nederland',
  'set.europa-fouten': 'Jouw fouten in Europa',
  'set.afrika-fouten': 'Jouw fouten in Afrika',
  'set.azie-fouten': 'Jouw fouten in Azië',
  'set.noord-amerika-fouten': 'Jouw fouten in Noord-Amerika',
  'set.zuid-amerika-fouten': 'Jouw fouten in Zuid-Amerika',
  'set.oceanie-fouten': 'Jouw fouten in Oceanië',
  'set.wereld-fouten': 'Jouw fouten op de wereldkaart',
  'set.klok-fouten': 'Jouw fouten met de klok',
  // De naam van een set: wat de startbalk en de kaarten tonen.
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
  // Werkwoorden: drie tijden, een mix en je fouten.
  'onderwerp.taal.tt': 'Tegenwoordige tijd',
  'onderwerp.taal.tt.uitleg': 'Ik word, hij wordt, word jij?',
  'onderwerp.taal.vt': 'Verleden tijd',
  'onderwerp.taal.vt.uitleg': '-te of -de, met ’t kofschip',
  'onderwerp.taal.vd': 'Voltooid deelwoord',
  'onderwerp.taal.vd.uitleg': 'Ge- en een t of een d: gefietst, geleefd',
  'onderwerp.taal.werkwoordmix': 'Werkwoordmix',
  'onderwerp.taal.werkwoordmix.uitleg': 'Alle werkwoorden door elkaar',
  // De naam van een set: wat de startbalk en de kaarten tonen.
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
  // En het diploma (ADR-168): één woord voor allebei de delen, want het is op
  // allebei dezelfde toets — twintig keer zelf schrijven, negen op de tien goed.
  'mode.taal-diploma': 'Taaldiploma',
  'way.taal-letters': 'Kies de letters die in het woord horen — de instap naar schrijven',
  'way.taal-flitsdictee': 'Kijk drie tellen, en schrijf het woord dan zelf — zoals een dictee',
  'way.taal-vorm-kiezen': 'Kies uit drie vormen — de instap naar typen',
  'way.taal-vorm-typen': 'Schrijf de vorm zelf op — voor de toets',
  'way.taal-diploma': 'De toets: twintig keer zelf schrijven, negen van de tien goed',
  'taal.diplomaEarned': 'Diploma gehaald: {naam}',
  'taal.diplomaMissed': 'Nog geen diploma. Negen van de tien goed is genoeg.',
  'taal.diplomasTitle': 'Jouw taaldiploma’s',
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

  // "Ronde klaar" and not "Klaar!" (K8). The exclamation mark congratulated the
  // child for stopping, which is the one thing on this screen that is not an
  // achievement — and the register rule is that we talk about the work, never
  // about the child.
  'result.title': 'Ronde klaar',
  'result.practiceMore': 'Deze moet je nog oefenen',
  'result.home': 'Terug naar start',
  'result.stoppedEarly': 'Je stopte na {gedaan} van de {totaal} vragen.',
  'result.mapLabel': 'Kaart met wat je nog moet oefenen',
  'result.mapHelp': 'De blauwe plekken moet je nog oefenen.',
  // De ronde in getallen, als tegels bovenaan "Ronde klaar" (ADR-112).
  'result.samenvatting': 'Hoe de ronde ging',
  // Wat je deed, en wat terugkomen oplevert.
  'result.gedaan': '{beantwoord} vragen, {goed} goed',
  'result.gedaanEen': '1 vraag, {goed} goed',
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
  // De regel van de diploma's (ADR-167): iets nieuws telt pas mee als je het op
  // een volgende dag weer goed weet.
  'result.nieuwePlaatjesUitleg':
    'Iets nieuws telt nog niet mee voor je diploma. Dat gebeurt als het terugkomt.',

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
  // Een schatting, en de zin zegt dat nu ook (ADR-177). `retention.ts` schrijft
  // over zichzelf: "It is a forecast, not a measurement, and the copy around it
  // must never imply otherwise" — en de oude zin deed precies dat. De ring op
  // Jij die hetzelfde getal als kop droeg, is weg; hier blijft het staan, want
  // hier is het één regel na een ronde en heeft het iets om voor te pleiten.
  'result.onthoud': 'Doe je niets, dan weet je hier over drie weken nog ongeveer {procent}% van.',
  'result.again': 'Nog een ronde',
  // Alleen wat er in deze ronde fout ging, meteen nog een keer (ADR-111).
  'result.herhaalFouten': 'Herhaal je fouten',

  // K10. Twee schakelaars in plaats van drie: de leesmodus verviel (ADR-025).
  // School en woonplaats staan er niet en komen er niet — dat zijn de twee
  // velden die een naam op een apparaat veranderen in een vindbaar kind.
  'you.title': 'Jij',
  // Onder de titel, in de kop die de etalage van premium is (ADR-150). Met de
  // naam erin, want wie je bent is het eerste wat Jij zegt (ADR-126), en in de
  // volgorde van de pagina eronder (ADR-172).
  'you.intro':
    'Je oefent als {naam}. Hier stel je jezelf in. En hier staan je diploma’s, wat je onthoudt en hoe vaak je oefent.',
  // De naam wijzigen is een rij bij de instellingen (ADR-172): iets wat je bijna
  // nooit doet, en de naam zelf staat al in de kop.
  // De avatar (ADR-177). Acht vormen, want de kleuren van dit product zijn
  // bezet: groen is "goed", gearceerd rood is "fout", koraal is het merk en de
  // zes vakkleuren zeggen welk vak je voor je hebt. De echte tekeningen komen
  // later; de namen hieronder blijven dan staan.
  'you.avatar': 'Je avatar',
  'you.avatarGeen': 'Nog niet gekozen',
  'you.avatarKies': 'Kies je avatar',
  'avatar.zon': 'Zon',
  'avatar.wolk': 'Wolk',
  'avatar.bloem': 'Bloem',
  'avatar.vis': 'Vis',
  'avatar.raket': 'Raket',
  'avatar.kat': 'Kat',
  'avatar.robot': 'Robot',
  'avatar.boot': 'Boot',

  'you.naam': 'Je naam',
  'you.naamLabel': 'Je naam',
  'you.nameChange': 'wijzigen',
  'you.nameSave': 'Bewaren',
  'you.nameCancel': 'Laat maar',

  // De profielwisselaar in de balk (ADR-173). "Wie oefent er?" stond als blok op
  // Jij en achter premium; het is nu de knop rechtsboven, op elke pagina, met
  // de ouder in dezelfde lijst. De vraag in de kop is de vraag die je stelt als
  // je hem opent, en hij gaat over iedereen in huis — niet alleen over de
  // kinderen.
  'wisselaar.knop': 'Wissel van profiel. Nu oefent {naam}',
  'wisselaar.titel': 'Wie gebruikt de app?',
  'wisselaar.oefentNu': 'oefent nu',
  'wisselaar.geefBeurt': 'Geef {naam} de beurt',
  'wisselaar.nogEenKind': 'Nog een kind erbij',
  'wisselaar.kindNaam': 'Naam van het kind',
  'wisselaar.voegToe': 'Toevoegen',
  'wisselaar.vol':
    'Er kunnen {aantal} kinderen op dit apparaat. Haal er eerst een weg bij Ouder als er iemand bij moet.',
  'wisselaar.ouder': 'Ouder',
  'wisselaar.ouderRegel': 'Instellingen, premium en hoe het gaat',
  'wisselaar.terugLijst': 'Terug naar de lijst',
  'wisselaar.sluit': 'Sluiten',

  // Hoe vaak je oefent: deze week in vier tegels, en met premium de weken
  // ervoor (ADR-172). Geen voorspelling en geen vergelijking: wat er staat is
  // wat er gebeurd is — rondes, en waar ze op uitkwamen.
  'you.week': 'Hoe vaak oefen je?',
  // De strook van zeven dagen (ADR-177). "Deze week" stond boven een venster
  // dat op woensdag bij vorige week donderdag begint — het zijn de laatste
  // zeven dagen, en dat staat er nu ook.
  'you.weekStrook': 'De laatste 7 dagen',
  'you.weekDagLeeg': 'Op {dag} niet geoefend.',
  'you.weekDagRondes': 'Op {dag} {rondes} keer geoefend.',
  'you.weekDagVandaag': 'Dat is vandaag.',
  'you.weekNone': 'De laatste zeven dagen nog niet geoefend.',
  'you.weekDagen': 'Je hebt op {dagen} schooldagen geoefend.',
  // Wie op méér dagen oefende dan er schooldagen waren, krijgt geen breuk:
  // "6 van 5" is er geen (`dagenTekst`), en dan klopt "schooldagen" ook niet.
  'you.weekDagenLos': 'Je hebt op {dagen} dagen geoefend.',
  // Drie tegels (ADR-112, ADR-177). "Dagen geoefend" stond er als vierde en is
  // de strook erboven geworden: een breuk is geen beeld. Een streepje waar nog
  // geen cijfer is: nul zou een cijfer zijn.
  'you.tegelRondes': 'Rondes',
  // Tegen schooldagen afgezet, zoals het weekbericht deed (ADR-133, ADR-172).
  'you.dagenVan': '{dagen} van {schooldagen}',
  'you.tegelVragen': 'Vragen beantwoord',
  'you.tegelCijfer': 'Gemiddeld cijfer',
  'you.geenCijfer': '–',
  'you.weekMost': 'Het meest geoefend: {set}.',
  'you.settings': 'Instellingen',
  'you.readAloud': 'Vragen voorlezen',
  // De weg terug na "Ik wil geen doelen" op Vandaag (ADR-171).
  'you.doelen': 'Doelen voor deze week',
  'you.doelenWhy': 'Op Vandaag kies je wat je deze week wilt halen.',
  'you.readAloudWhy': 'Je kunt elke vraag laten voorlezen.',
  'you.on': 'aan',
  'you.off': 'uit',
  'regio.eigen': 'Eigen woorden',
  'onderwerp.taal.eigen': 'Eigen woorden',
  'onderwerp.taal.eigen.uitleg': 'De lijst die je zelf hebt ingevoerd.',
  'onderwerp.taal.eigen.keuze': 'Welke lijst?',
  // Eigen woordenlijsten (ADR-135).
  'you.lijstenTitel': 'Eigen woorden',
  'you.lijstenUitleg':
    'Typ de woorden van school zelf in of importeer een bestand, en oefen ze als flitsdictee.',
  // Importeren (ADR-145): een CSV of een tekstbestand, met de uitleg zo kort
  // dat je hem leest voordat je iets kiest.
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
  'retention.kaartLabel': 'De kaart van {wat}, met per plek hoe het ervoor staat.',

  'module.terugVandaag': '{aantal} komen hier vandaag terug.',
  'module.terugVandaagEen': '1 komt hier vandaag terug.',
  'module.terugMorgen': 'Hier komt vandaag niets terug. Morgen {aantal}.',
  'module.terugNiets': 'Hier komt voorlopig niets terug.',

  // De premiumpagina heeft het codeveld niet meer (ADR-173): een kind mag deze
  // pagina zien en een kind koopt niets. Wat ervoor in de plaats staat is de
  // weg naar de ouder, en die is één knop lang.
  'premium.codeBijOuder': 'Heb je een code? Die vult je vader of moeder in, op de ouderpagina.',
  'premium.ikBenOuder': 'Ik ben de ouder',
  'premium.afmeldenBijOuder': 'De code van dit apparaat halen doe je op de ouderpagina.',

  // De ouderpagina (ADR-173). De toon is die van een volwassene tegen een
  // volwassene: geen uitroeptekens, geen "leuk", en geen woord over het kind
  // dat het kind zelf niet zou mogen horen.
  //
  // De pincode wordt nergens een wachtwoord genoemd. Dat woord is van het
  // account dat in F3 komt, en twee woorden voor twee verschillende sloten is
  // precies wat er nodig is zodra ze allebei bestaan.
  'ouder.titel': 'Voor de ouder',
  'ouder.intro':
    'Hier regel je wat er voor je kinderen aanstaat, en hier vul je de code in. Na vijf minuten zonder iets te doen staat de app weer op het kind.',
  'ouder.terugNaarKind': 'Terug naar {naam}',

  'ouder.kinderen': 'Je kinderen',
  'ouder.kindNaam': 'Naam',
  'ouder.kindToevoegen': 'Toevoegen',
  'ouder.nogEenKind': 'Nog een kind erbij',
  'ouder.naamBewaren': 'Naam bewaren',
  'ouder.groepVan': 'De groep van {naam}',
  'ouder.inGroep': 'groep {groep}',
  'ouder.geenGroep': 'geen groep gekozen',
  'ouder.kinderenUitleg':
    'Ieder kind heeft een eigen voortgang. Wat de een oefent, telt niet mee voor de ander.',
  'ouder.kinderenVol': 'Er kunnen {aantal} kinderen op dit apparaat.',

  // Hoe het met je kinderen gaat (ADR-177). Dit stond op vier plekken beloofd
  // — in de poort, in de volwassenencheck, bij het zetten van de pincode en in
  // de rij van de wisselaar — en was er nergens. Per kind, want twee kinderen
  // optellen geeft een getal dat over niemand gaat.
  'ouder.hoeGaatHet': 'Hoe gaat het?',
  'ouder.hoeGaatHetUitleg':
    'Per kind, over alle vakken bij elkaar. Wat je kind zelf ziet, staat op Jij; per som en per woord kijken zit in premium.',
  'ouder.kindNogNiets': '{naam} heeft nog niets geoefend.',
  'ouder.kindDagEen': 'Op 1 van de laatste 7 dagen geoefend.',
  'ouder.kindDagen': 'Op {dagen} van de laatste 7 dagen geoefend.',
  // "Naar schatting", en de voorwaarde erbij. Het is een vergeetcurve met een
  // gekozen constante, en `retention.ts` verbiedt tekst die anders suggereert.
  // Op Jij is dit getal weg omdat een percentage groep 7-stof is; hier is de
  // lezer volwassen, en dit is de plek die ADR-177 ervoor aanwees.
  'ouder.kindSchatting':
    'Zonder oefenen is daar over drie weken naar schatting nog {procent}% van over.',

  'ouder.premium': 'Premium',
  'ouder.premiumUit':
    'Premium staat uit. Heb je een code gekocht, vul hem dan hier in — hij geldt meteen voor al je kinderen.',
  'ouder.premiumAlleKinderen': 'De code geldt voor alle kinderen op dit apparaat.',
  'ouder.bekijkPremium': 'Wat zit er in premium?',

  'ouder.instellingen': 'Instellingen',
  'ouder.instellingenUitleg':
    'Geluid, voorlezen en minder beweging staan bij het kind zelf, op Jij.',

  // Het slot. De zin over vergeten staat er meteen bij, want hem pas noemen op
  // het moment dat iemand hem kwijt is, is hem te laat noemen.
  'ouder.maakTitel': 'Maak een ouderpagina',
  'ouder.maakUitleg':
    'Kies een pincode van vier cijfers. Daarmee kom je bij de instellingen, bij premium en bij hoe het met je kinderen gaat.',
  'ouder.maakHulp':
    'De pincode staat alleen op dit apparaat en gaat nergens heen. Raak je hem kwijt, dan kun je hier een nieuwe zetten.',
  'ouder.slotTitel': 'Even je pincode',
  'ouder.slotUitleg': 'Vier cijfers, en je bent er.',
  'ouder.pin': 'Pincode',
  'ouder.pinNieuw': 'Nieuwe pincode',
  'ouder.pinHerhaal': 'Nog een keer',
  'ouder.open': 'Verder',
  'ouder.bewaarPin': 'Bewaren',
  'ouder.vergetenKnop': 'Pincode vergeten?',

  // De poort vóór de pincode, op een bouw mét gezinsproject (ADR-178). Het
  // geboortejaar hieronder blijft staan voor een bouw zonder — een ouder met
  // een tablet zonder verbinding moet bij de instellingen van zijn eigen kind
  // kunnen.
  //
  // De zin zegt eerlijk wat de mail doet: hij stelt geen leeftijd vast, maar
  // zet er een ronde buiten dit apparaat tussen. Wat hij daarnaast oplevert —
  // een vergeten pincode van overal herstellen — staat erbij, want dat is voor
  // een gezin waarschijnlijk het echte argument.
  'ouder.accountTitel': 'Maak een ouderaccount',
  'ouder.accountUitleg':
    'Hierachter staan de instellingen, premium en hoe het met je kinderen gaat. Daarvoor maak je een account met je e-mailadres. We sturen je een mail met een link; pas als je daarop klikt, kun je verder.',
  'ouder.accountHulp':
    'Zo weten we dat er een volwassene meekijkt. En raak je later je pincode kwijt, dan kom je er met dit account overal weer in — niet alleen op dit apparaat.',

  // Opnieuw om het wachtwoord vragen, ook als er al iemand ingelogd is
  // (ADR-178). Een sessie blijft maanden staan op een apparaat dat het hele
  // gezin gebruikt, en dan zegt hij niets meer over wie er nu voor staat.
  'ouder.bevestigTitel': 'Ben jij het?',
  'ouder.bevestigUitleg':
    'Je bent ingelogd als {email}. Typ je wachtwoord nog een keer, dan weten we zeker dat jij het bent en niet iemand anders die deze tablet gebruikt.',
  'ouder.bevestigVeld': 'Je wachtwoord',
  'ouder.bevestigKnop': 'Verder',
  'ouder.bevestigHulp': 'Dit vragen we alleen als je een pincode instelt of vervangt. Verder niet.',

  // De volwassenencheck vóór het zetten of resetten van de pincode (ADR-176).
  // Geen rekensom: dit product leert kinderen tafels, dus dat zou de poort zijn
  // die de app zelf traint om te openen. Het jaartal wordt gecontroleerd en
  // weggegooid, en de hulpregel zegt dat — een ouder die dit product om zijn
  // privacy koos, hoort niet te moeten raden.
  'ouder.checkTitel': 'Ben je een volwassene?',
  'ouder.checkUitleg':
    'Hierachter staan de instellingen, premium en hoe het met je kinderen gaat. Dat is niet voor kinderen.',
  'ouder.checkVraag': 'In welk jaar ben je geboren?',
  'ouder.checkKnop': 'Verder',
  'ouder.checkFout': 'Dat klopt niet. Haal er even je vader of moeder bij.',
  'ouder.checkHulp':
    'We kijken er alleen naar. Je jaartal wordt nergens bewaard en gaat nergens heen.',
  'ouder.fout.geenCijfers': 'Een pincode is vier cijfers.',
  'ouder.fout.ongelijk': 'De twee keer waren niet hetzelfde. Probeer het nog eens.',
  'ouder.fout.onjuist': 'Dat is niet de pincode van dit apparaat.',
  'ouder.fout.teVaak': 'Drie keer mis. Probeer het over {seconden} seconden nog eens.',
  'ouder.fout.geenKluis': 'Deze browser kan geen pincode bewaren.',

  'ouder.poortTitel': 'Dit is de ouderpagina',
  'ouder.poortUitleg':
    'Hierachter staan de instellingen, premium en hoe het met je kinderen gaat. Er hoort een pincode bij.',
  'ouder.poortKnop': 'Ik ben de ouder',

  // Het account (ADR-155), sinds ADR-172 op Premium: een e-mailadres en een
  // wachtwoord zijn van de ouder, en de ouder komt op Premium uit (ADR-171).
  //
  // De toon is gewoon, niet die van een bank. Wat er gebeurt als je niets
  // doet, staat er ook bij: zonder account werkt alles zoals het werkte.
  'account.titel': 'Account',
  'account.uitleg':
    'Met een account staat wat je oefent niet alleen op dit apparaat, maar ook op de iPad en de laptop. Zonder account werkt alles gewoon zoals je gewend bent.',
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
  'account.uitloggenUitleg': 'Wat je op dit apparaat hebt geoefend, blijft gewoon staan.',
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
  'account.fout.leegAdres': 'Vul je e-mailadres in.',
  'account.fout.verlopen': 'Deze link werkt niet meer. Vraag een nieuwe mail aan.',
  'account.fout.zelfde': 'Dit is je oude wachtwoord. Kies een ander.',

  // Wachtwoord vergeten (ADR-186). Het antwoord zegt niet óf er een account is
  // met dit adres: dat zou iedereen laten navragen wie hier een account heeft.
  'account.wachtwoordVergeten': 'Wachtwoord vergeten?',
  'account.herstelUitleg':
    'Vul het e-mailadres van je account in. We sturen je een mail met een link om een nieuw wachtwoord te kiezen.',
  'account.herstelKnop': 'Stuur de mail',
  'account.herstelGemaild':
    'Als er een account is met dit adres, staat er nu een mail voor je klaar. Klik op de link erin om een nieuw wachtwoord te kiezen.',
  'account.terugNaarInloggen': 'Terug naar inloggen',
  'ouder.herstelGemaild':
    'We hebben een mail gestuurd naar {email}. Klik op de link erin om een nieuw wachtwoord te kiezen.',

  // Waar de link uit die mail op uitkomt (ADR-186).
  'herstel.titel': 'Kies een nieuw wachtwoord',
  'herstel.uitleg': 'Voor het account van {email}.',
  'herstel.veld': 'Nieuw wachtwoord',
  'herstel.knop': 'Wachtwoord bewaren',
  'herstel.klaar': 'Je wachtwoord is veranderd, en je bent ingelogd.',
  'herstel.naarOuder': 'Naar de ouderpagina',
  'herstel.verlopenTitel': 'Deze link werkt niet meer',
  'herstel.verlopenUitleg':
    'Een link uit onze mail werkt één keer, en niet lang. Vraag een nieuwe aan op de ouderpagina, met Wachtwoord vergeten?',

  // De kinderen van dit apparaat, meegenomen naar het account (ADR-187). Dit is
  // het moment van toestemming (artikel 8 AVG): wat er op de server komt, staat
  // erbij, en ook dat het er weer af kan.
  'overname.titel': 'Kinderen in je account',
  'overname.uitleg':
    'Staat een kind in je account, dan staat wat het oefent ook veilig op onze server, en niet alleen op dit apparaat. Na elke ronde gaat mee wat er bij kwam.',
  'overname.en': 'en',
  'overname.hierEen': '{namen} oefent op dit apparaat, maar staat nog niet in je account.',
  'overname.hierMeer': '{namen} oefenen op dit apparaat, maar staan nog niet in je account.',
  'overname.wie': 'Wie neem je mee?',
  'overname.toestemmingUitleg':
    'Dan komt op onze server te staan, binnen de EU: de voornaam, de groep, de antwoorden, de diploma’s en de doelen. Niets anders, en nooit voor iemand anders. Je kunt een kind er altijd weer uit halen: dan verdwijnt alles van dat kind van de server, en blijft het op dit apparaat staan.',
  'overname.toestemming': 'Ik ben hun ouder of voogd, en ik geef toestemming.',
  'overname.knop': 'Neem mee naar mijn account',
  'overname.bezig': 'Bezig met {naam}…',
  'overname.nietVerstuurd': 'In je account, maar nog niet alles is verstuurd.',
  'overname.verstuurd': 'In je account, bijgewerkt op {datum}.',
  'overname.opnieuw': 'Verstuur opnieuw',
  'overname.haalWeg': 'Haal uit mijn account',
  'overname.haalWegVraag':
    'Alles van {naam} verdwijnt dan van onze server. Op dit apparaat blijft het gewoon staan.',
  'overname.haalWegJa': 'Ja, haal weg',
  'overname.haalWegNee': 'Toch niet',
  'overname.alleenDaarTitel': 'In je account, maar niet op dit apparaat',
  'overname.nietHier': 'In je account, maar niet op dit apparaat.',
  'overname.zetHier': 'Zet {naam} op dit apparaat',
  'overname.ofKoppel':
    'Oefent {naam} hier al, onder deze of een andere naam? Kies wie het is, dan worden de twee één.',
  'overname.koppel': '{hier} is {daar}',
  'overname.opnieuwLaden': 'Probeer opnieuw',
  'overname.fout.geen-verbinding': 'Er is nu geen verbinding. Probeer het zo nog eens.',
  'overname.fout.geweigerd': 'Dat lukte niet. Log uit en weer in, en probeer het opnieuw.',
  'overname.fout.niet-ingesteld': 'Dit kan hier nog niet.',
  'overname.fout.niet-ingelogd': 'Log eerst in met je account.',
  'overname.fout.vol': 'Op dit apparaat staan al drie kinderen. Er kan er geen meer bij.',

  // Een kind logt zelf in, met code en wachtwoord (ADR-190). De meldingen zijn
  // die van ADR-155: één zin voor een onbekende code en een fout wachtwoord.
  'inlog.knop': 'Ik heb een inlogcode',
  'inlog.titel': 'Inloggen met je code',
  'inlog.uitleg':
    'Je vader of moeder heeft een code en een wachtwoord voor je. Daarmee oefen je hier verder waar je gebleven was.',
  'inlog.code': 'Inlogcode',
  'inlog.codeVoorbeeld': 'KIND-XXXX-XXXX',
  'inlog.wachtwoord': 'Wachtwoord',
  'inlog.verder': 'Inloggen',
  'inlog.fout.onjuist': 'Deze code en dit wachtwoord horen niet bij elkaar.',
  'inlog.fout.te-vaak': 'Probeer het over een uur nog eens, of vraag je vader of moeder.',
  'inlog.fout.leeg': 'Vul allebei de velden in.',
  'inlog.fout.storing': 'Er ging iets mis. Probeer het zo nog eens.',
  'inlog.fout.geen-verbinding':
    'Er is nu geen verbinding. Probeer het zo nog eens, of oefen zonder in te loggen.',
  'inlog.fout.vol': 'Op dit apparaat staan al drie kinderen. Er kan er geen meer bij.',

  // De code en het wachtwoord waarmee een kind zelf inlogt, op de ouderpagina
  // (ADR-190). Over het kind in de derde persoon: de ouder leest dit.
  'overname.code': 'Inlogcode: {code}',
  'overname.wachtwoordVeld': 'Wachtwoord waarmee {naam} zelf inlogt',
  'overname.wachtwoordUitleg':
    'Met de code en dit wachtwoord logt {naam} zelf in op een ander apparaat. Minstens zes tekens. Zet je een nieuw wachtwoord, dan wordt {naam} overal uitgelogd.',
  'overname.wachtwoordKnop': 'Zet het wachtwoord',
  'overname.wachtwoordKlaar': '{naam} kan nu zelf inloggen met deze code en dit wachtwoord.',
  'overname.wachtwoordFout.te-kort': 'Kies minstens zes tekens.',
  'overname.wachtwoordFout.te-simpel': 'Dit wachtwoord is te makkelijk te raden.',
  'overname.wachtwoordFout.eigen-naam': 'Kies iets anders dan de naam {naam}.',

  // Bewaren op dit apparaat (ADR-186). Voor de ouder: het kind kan hier niets
  // aan doen, en een waarschuwing over weggooien hoort niet op zijn scherm.
  'bewaren.titel': 'Bewaren op dit apparaat',
  'bewaren.safari':
    'Safari gooit weg wat een website bewaart als je die een week niet opent. Dan zijn de voortgang en de diploma’s van je kinderen weg.',
  'bewaren.beginscherm':
    'Zet de app op je beginscherm: tik in Safari op de deelknop en kies Zet op beginscherm (op een Mac: Voeg toe aan Dock). Daar geldt die regel niet.',
  'bewaren.beginschermLet':
    'Wat in Safari geoefend is, gaat niet mee: op het beginscherm begint de app leeg. Hoe eerder je het doet, hoe minder er achterblijft.',
  'bewaren.staatErop': 'De app staat op het beginscherm. Daar ruimt Safari niets op.',
  'bewaren.blijvend': 'De browser bewaart wat je kinderen oefenen, ook als het apparaat vol raakt.',
  'bewaren.magOpruimen':
    'De browser mag wat je kinderen oefenen opruimen als het apparaat vol raakt. Dat gebeurt zelden, maar dan is het weg.',
  'bewaren.vraag': 'Vraag de browser het te bewaren',
  'bewaren.nee':
    'De browser zegt nog nee. Dat beslist hij zelf, vaak pas als de app vaker gebruikt wordt of op het beginscherm staat.',
  'you.geluid': 'Geluid bij een antwoord',
  'you.geluidWhy': 'Een korte toon als het goed is, en een zachte als het mis is.',
  // Twee schakelaars erbij (ADR-145), allebei voor een kind dat snel afgeleid is.
  'you.rustig': 'Minder beweging',
  'you.rustigWhy':
    'Knoppen, kaarten en beloningen bewegen niet meer. Rustiger voor wie snel afgeleid is.',

  // Onder een diploma, in woorden: "nog niet" is nooit alleen een tint.
  'diploma.gehaald': 'Gehaald',
  'diploma.nogNiet': 'Nog niet',
  // Rijp: de pagina is ver genoeg om af te zwemmen (ADR-141, ADR-149).
  'diploma.rijp': 'Klaar om af te zwemmen',

  // Wat er onder een diplomakaart staat, per stand. Vijf zinnen, en nooit een
  // telling die nul is: een kop die de afwezigheid uitrekent, is wat "je hebt
  // niets" letterlijk op het scherm zet.
  'diploma.gehaaldOp': 'Gehaald op {datum}',
  'diploma.onthoudt': 'Je onthoudt er {bewezen} van de {totaal}.',
  // De eerste twee dagen kan er niets in de ring staan: een onderdeel telt pas
  // mee na drie goede antwoorden op drie dagen. In het grote diploma staat de
  // regel dan voluit — daar gaat het over één diploma. Op een kaart staat
  // alleen `diploma.nogNiet`: twaalf keer dezelfde zin onder elkaar is geen
  // uitleg maar een muur, en de kaarten verdwijnen erin.
  'diploma.nogNiets': 'Nog niets onthouden. Je moet het drie keer goed weten, op drie dagen.',
  // De ring telt wat ooit bewezen is, de lat telt wat vers is. Na ruim twee
  // weken weg lopen die uiteen, en dan staat dit er.
  'diploma.opfrissen': 'Je diploma is vol. Fris het even op, dan mag je de toets doen.',

  // Het grote diploma, geopend vanuit de kast. Eén knop die van woord verandert
  // en niet van plek — de regel van ADR-141, hier op een tweede scherm.
  'diploma.openLabel': 'Bekijk je diploma: {naam}',
  'diploma.oefen': 'Ga oefenen',
  'diploma.toets': 'Doe de toets',
  'diploma.terug': 'Terug',
  'diploma.gehaaldKop': 'Gehaald!',
  'diploma.verder': 'Verder',
  'diploma.soortTafel': 'Tafeldiploma',
  'diploma.soortReken': 'Rekendiploma',
  'diploma.soortTaal': 'Taaldiploma',
  'diploma.soortVlag': 'Vlaggendiploma',
  'diploma.soortKlok': 'Klokdiploma',
  'diploma.soortTopo': 'Topodiploma',

  // Hoe een diploma verdiend wordt, in een uitklap onder de kast (ADR-177).
  //
  // Vijf stappen, en dat is de hele verandering. Er stonden twee lopende
  // alinea's die begonnen bij de uitzondering ("een goed antwoord telt alleen
  // als het onderdeel aan de beurt was") en het woord "onderdeel" gebruikten
  // dat nergens in dit product wordt uitgelegd. Wie de vraag stelt — hoe haal
  // ik er een — krijgt nu de volgorde waarin het gebeurt, van kiezen tot
  // printen, met per stap één zin.
  //
  // Elke zin is nagelopen tegen `leitner.ts` en `voortgang.ts`: drie keer goed
  // op drie verschillende dagen (INTERVAL_DAYS), de ring leest `isBewezen` en
  // kan dus niet teruglopen, en de toets staat open zodra `rijp` waar is.
  'you.diplomaTitel': 'Hoe haal je een diploma?',
  'you.diplomaStap1': 'Kies een diploma. Bijvoorbeeld de tafel van 6.',
  'you.diplomaStap2':
    'Ga oefenen. Je weet iets pas goed als je het drie keer goed had, op drie verschillende dagen.',
  'you.diplomaStap3':
    'De ring om het diploma laat zien hoe ver je bent. Die ring loopt nooit terug, ook niet als je een keer iets fout hebt.',
  'you.diplomaStap4': 'Is de ring helemaal vol? Dan mag je de toets doen.',
  'you.diplomaStap5':
    'Haal je de toets? Dan is het diploma van jou. Het blijft altijd van jou, en je kunt het uitprinten.',

  // De diplomakast op Jij: alle diploma's, één vak open en de rest als regel.
  'kast.titel': 'Jouw diploma’s',
  'kast.stand': '{aantal} van de {totaal} gehaald.',
  'kast.leeg': 'Hier komen je diploma’s te hangen. Druk op een diploma om eraan te beginnen.',
  'kast.vakAantal': '{aantal} diploma’s',
  // Een vak waar dit apparaat geen code voor heeft (ADR-177). Het vak staat er
  // wél, want anders bestaat het niet voor een kind zonder code; de diploma's
  // erachter worden niet getekend, want dat verbiedt ADR-116.
  'kast.vakOpSlot': 'Hier zijn ook diploma’s',
  'kast.vakOpSlotUitleg':
    'Voor de diploma’s van {vak} hebben je ouders een code nodig. Druk hier om te kijken wat dat is.',

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
  // De uitweg zegt nu wat hij doet in plaats van wat het kind tekortkomt.
  // "Weet ik niet" was een bekentenis over een feit dat elk kind kent; dit is
  // een keuze, en daarmee hetzelfde antwoord zonder de kleine vernedering.
  'groep.zegIkNiet': 'Zeg ik niet',
  // En de volwassene die het apparaat als eerste in handen heeft, hoeft niet
  // te doen alsof hij in groep 6 zit. Hij gaat naar Premium (ADR-171).
  'groep.ouder': 'Ik ben een ouder',
  'groep.terug': 'Terug naar je naam',
  // Eén keer op de voordeur, voor een kind dat er al was vóór deze vraag.
  'groep.nietNu': 'Niet nu',
  // Op Jij, in de woorden van het kind (ADR-171), als rij bij de instellingen
  // die de knoppen opent (ADR-172). Met wat er op 1 augustus gebeurt, want dat
  // doet de app zonder te vragen.
  'groep.jijTitel': 'Je groep',
  'groep.rijGeen': 'Geen groep gekozen',
  'groep.jijUitleg':
    'Wat bij je groep past, staat bovenaan in Vandaag en op elke vakpagina. Je kunt altijd alles kiezen. Op 1 augustus ga je vanzelf een groep verder.',
  'groep.geen': 'Geen groep',
  'groep.gekozen': 'Je zit in groep {groep}.',
  'groep.nietGekozen': 'Er is geen groep gekozen. Dan staat alles in de gewone volgorde.',
  // Op een tegel met stof die dit kind nog niet gehad heeft. Hij blijft
  // kiesbaar; dit zegt alleen waarom hij onderaan staat.
  //
  // "Nog eens herhalen" stond hier ook, onder alles wat onder de groep viel, en
  // is eruit (ADR-162): de tegel stond toch al onderaan, en dat is wat de
  // volgorde moet zeggen — het woord erbij maakte er een oordeel van over de
  // keuze van een kind.
  'groep.later': 'Voor later',

  // Alles van dit apparaat halen (ADR-166). Onderaan Jij, in twee
  // stappen, en de tweede stap vertelt wat er weggaat in plaats van "weet je
  // het zeker?" te vragen — die vraag leert iemand alleen om twee keer te
  // drukken.
  'wissen.titel': 'Alles van dit apparaat halen',
  'wissen.uitleg':
    'Alles wat hier geoefend is, staat op dit apparaat en nergens anders. Hier haal je het er weer af.',
  'wissen.knop': 'Alles wissen',
  'wissen.zeker': 'Dit haalt leer.nu helemaal leeg op dit apparaat:',
  'wissen.watVoortgang':
    'Van elk kind op dit apparaat: de naam, wat het geoefend heeft en de diploma’s.',
  'wissen.watCode':
    'De premiumcode. Die kun je daarna opnieuw invullen. Dit apparaat telt dan niet meer mee bij de drie apparaten van de code.',
  'wissen.onomkeerbaar': 'Dit kan niet ongedaan gemaakt worden.',
  'wissen.doe': 'Ja, haal alles weg',
  'wissen.laatMaar': 'Laat maar staan',
  'wissen.bezig': 'Bezig met wissen…',

  // Als er iets kapotgaat (ADR-166). Een zin en twee knoppen, geen
  // foutmelding: de tekst van een uitzondering zegt een kind niets en een
  // ouder bijna niets. En meteen de geruststelling die het eerst nodig is.
  'fout.titel': 'Er ging iets mis',
  'fout.uitleg':
    'Dit scherm deed het even niet. Probeer het nog een keer, of ga terug naar het begin.',
  'fout.bewaard': 'Alles wat je geoefend hebt, staat er nog. Er gaat hierdoor niets verloren.',
  'fout.opnieuw': 'Probeer opnieuw',
  'fout.naarBegin': 'Terug naar het begin',

  // Accessible names for things that have no visible label of their own
  'a11y.progress': 'Voortgang in deze ronde',
} as const;
