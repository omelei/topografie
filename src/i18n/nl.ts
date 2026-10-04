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
  'home.welcome': 'Hoi {naam}!',
  // Voor een kind dat nog geen naam typte (ADR-229).
  'home.welcomeZonderNaam': 'Hoi!',
  'home.todayOpen': 'Kies een onderwerp en begin met leren.',
  // Onder de begroeting, met premium en vragen die vandaag terug moeten (ADR-238).
  'home.welkomKlaarEen': 'Er staat 1 vraag voor je klaar.',
  'home.welkomKlaar': 'Er staan {aantal} vragen voor je klaar.',
  // De zin onder de begroeting, bij wat Nu doen is (ADR-250).
  'home.status.groep': 'Kies je groep, dan weet je waar je begint.',
  'home.status.begin': 'Kies waar je mee begint.',
  'home.status.kleuter': 'Kijk gerust rond in de vakken.',
  'home.status.maakAf': 'Je ronde wacht op je.',
  'home.status.verder': 'Een ronde duurt maar een paar minuten.',
  'home.status.klaar': 'Zin in nog een ronde?',
  'home.status.terug': 'Fijn dat je er weer bent.',
  // Nu doen (ADR-250): de ene kaart bovenaan, met één knop.
  'home.nu.maakAf.kop': 'Maak je ronde af',
  'home.nu.maakAf.regel': '{onderwerp}: nog {aantal} van de {totaal} vragen.',
  'home.nu.maakAf.regelEen': '{onderwerp}: nog 1 van de {totaal} vragen.',
  'home.nu.maakAf.knop': 'Maak af',
  'home.nu.verder.kop': 'Ga verder met {onderwerp}',
  'home.nu.verder.knop': 'Start',
  // Op Welkom terug: dan wordt de volgende kaart Nu doen, tot je een ronde deed.
  'home.nu.later': 'Later',
  // De geheugencheck (ADR-228): één keer, zonder hulp. Geen woord over premium (R-11).
  'home.check.kop': 'Weet je het nog?',
  'home.check.zin':
    '{aantal} vragen uit {onderwerp} die je een paar weken geleden oefende. Zonder hulp, één keer.',
  'home.check.knop': 'Start',
  // Voor een kind dat nog niets deed (ADR-204), bovenaan (ADR-243): eerst de
  // groep, dan de onderwerpen van die groep. De vraag is 'groep.vraag', zonder
  // zin eronder (ADR-247).
  'home.begin.andereGroep': 'Andere groep',
  'home.begin.kiesGroep': 'Kies je groep',
  // Voor groep 1 en 2, op de plek van de onderwerpen (ADR-244). Er is nog geen
  // stof voor kinderen die niet lezen; meestal leest een ouder dit.
  'home.kleuters.kop': 'Voor groep 1 en 2 komt er iets aan',
  'home.kleuters.zin':
    'We maken rondes met tellen, rijmen en klappen. Een stem leest alles voor. Tot dan kun je onder Oefenen elk vak kiezen.',
  'home.vakken.titel': 'Kies een vak',
  'home.vak.topo': 'Provincies, steden en landen',
  'home.vak.tafels': 'Tafels en sommen',
  'home.vak.klok': 'Klokkijken, van hele uren tot minuten',
  'home.vak.woorden': 'Spelling, werkwoorden en Engels',
  'home.vak.vlaggen': 'Vlaggen van Nederland en de wereld',
  // Wat Google leest (ADR-207): de titel in het tabblad en in de zoekresultaten,
  // de regel eronder, en de korte pagina per vak en onderwerp. Voor een ouder
  // die zoekt, dus het woord dat die intikt: "Topografie", niet "Topo".
  'seo.standaard': 'leer.nu',
  'seo.titel': '{wat} · leer.nu',
  'seo.oefenen': '{wat} oefenen',
  'seo.home.titel': 'Topografie, rekenen, klokkijken en taal oefenen · leer.nu',
  'seo.home.kop': 'Oefenen voor groep 3 tot en met 8',
  'seo.home.beschrijving':
    'Topografie, tafels, klokkijken, vlaggen en taal. Gratis, in korte rondes, zonder account.',
  'seo.vak.topo': 'Topografie',
  'seo.vak.tafels': 'Rekenen',
  'seo.vak.klok': 'Klokkijken',
  'seo.vak.woorden': 'Spelling, werkwoorden en Engels',
  'seo.vak.vlaggen': 'Vlaggen',
  'seo.vak.beschrijving': '{uitleg}, voor {groepen}. Gratis, in korte rondes, zonder account.',
  'seo.vak.beschrijvingZonderGroep': '{uitleg}. Gratis, in korte rondes, zonder account.',
  'seo.onderwerp.beschrijving':
    '{aantal} vragen, voor {groepen}. Gratis, in korte rondes, zonder account.',
  'seo.onderwerp.beschrijvingZonderGroep':
    '{aantal} vragen. Gratis, in korte rondes, zonder account.',
  'seo.groep.een': 'groep {groep}',
  'seo.groep.twee': 'groep {van} en {tot}',
  'seo.groep.reeks': 'groep {van} tot en met {tot}',
  'seo.vakken': 'Vakken',
  'seo.onderwerpen': 'Onderwerpen',
  'seo.meer': 'Meer {vak}',
  'seo.alles': 'Alles van {vak}',
  // Voor ouders (ADR-214): de schrijfwijzer voor ouders. "Je" tegen de ouder,
  // over het kind in de derde persoon, rustig en precies.
  'ouders.titel': 'leer.nu voor ouders',
  'ouders.intro':
    'Je kind oefent topografie, rekenen, klokkijken, vlaggen, taal en Engels. In korte rondes, op een telefoon, tablet of laptop. Zonder account.',
  'ouders.proberen': 'Laat je kind een ronde proberen',
  'ouders.premium': 'Wat premium is',
  'ouders.oefenen.kop': 'Oefenen in korte rondes',
  'ouders.oefenen.tekst':
    'Je kind kiest een vak, een onderwerp en een spelvorm. Een ronde duurt een paar minuten. Na de ronde ziet je kind wat het goed en fout had.',
  'ouders.herhalen.kop': 'Herhalen op het goede moment',
  'ouders.herhalen.tekst':
    'Wat je kind beheerst, komt pas later terug. Wat het bijna vergeten is, komt vandaag terug. Zo blijft het in het hoofd.',
  'ouders.papier.kop': 'Ook op papier',
  'ouders.papier.tekst':
    'Elk onderwerp heeft een werkblad om te printen, met de antwoorden erbij. Voor de klas is er een set van 30 verschillende bladen.',
  'ouders.privacy.kop': 'Wat er met de gegevens gebeurt',
  'ouders.privacy.tekst':
    'Wat je kind oefent, blijft op dit apparaat. Een naam is niet nodig om te oefenen. Typt je kind een voornaam, dan gaat die nergens heen. Onze server telt alleen hoe vaak iets gebeurt, zonder naam.',
  // Met een gezinsaccount (ADR-249): dan gaat er met toestemming wél iets naar
  // de server, en zegt deze belofte dat.
  'ouders.privacy.tekstAccount':
    'Zonder account blijft wat je kind oefent op dit apparaat, en is een naam niet nodig. Maak je een gezinsaccount, dan gaan de voornaam en de voortgang met jouw toestemming naar onze server in de EU. Onze server telt verder alleen hoe vaak iets gebeurt, zonder naam.',
  'ouders.kosten.kop': 'Wat het kost',
  'ouders.kosten.gratis': 'Oefenen is gratis, in elk vak en elk onderwerp.',
  'ouders.kosten.premium':
    'Premium kost {prijs} per jaar, voor 3 kinderen op 3 apparaten. Dan plant leer.nu wat je kind vandaag moet herhalen, en staan de bliksemronde, overleven, de oefentoets en de diploma’s open.',
  'profile.voorOuders': 'Voor ouders: zo werkt het',
  'ouders.scholen': 'Voor de klas',
  // Voor de klas (ADR-216): tegen de leerkracht, net zo rustig als tegen een
  // ouder. Een klassencode is een gezinscode met 40 plekken (ADR-200).
  'scholen.titel': 'leer.nu voor de klas',
  'scholen.intro':
    'Laat je hele klas oefenen met premium. Met één klassencode voor 40 apparaten, een jaar geldig.',
  'scholen.aanvragen': 'Vraag een klassencode aan',
  // De etalage, in de vorm van de premiumpagina (op verzoek van de eigenaar).
  'scholen.etalageLabel': 'Klassencode',
  'scholen.etalageKop': 'Eén code voor je hele klas',
  'scholen.watTitel': 'Wat je krijgt',
  'scholen.werkt.kop': 'Zo werkt het',
  'scholen.werkt.tekst':
    'Je krijgt één code. Die deel je met de ouders. Zij vullen hem thuis in, en hun kind oefent met premium.',
  'scholen.privacy.kop': 'Je ziet niets van de kinderen',
  'scholen.privacy.tekst':
    // Waar zolang het gezinsaccount niet live staat (roadmap): daarmee gaan de
    // voornaam en de voortgang wél naar de server.
    'Leer.nu slaat geen persoonlijke gegevens op van kinderen. Daarom is er geen verwerkersovereenkomst nodig.',
  'scholen.privacy.tekstAccount':
    'Leer.nu slaat voor de klas geen persoonlijke gegevens op van kinderen. Alleen als een ouder thuis een gezinsaccount maakt, staan de voornaam en de voortgang op onze server, met toestemming van die ouder.',
  'scholen.papier.kop': 'Werkbladen voor de klas',
  'scholen.papier.tekst':
    'Elk onderwerp heeft een werkblad om te printen. In één keer print je 30 verschillende bladen, met de antwoorden achteraan.',
  'scholen.plekken.kop': 'Een plek is een apparaat',
  'scholen.plekken.tekst':
    'Een kind dat op een tablet en een laptop oefent, gebruikt twee plekken. Met 40 plekken past een klas van 30 ruim.',
  'scholen.kosten.kop': 'Wat het kost',
  'scholen.kosten.tekst':
    'Een klassencode kost {prijs} per jaar, exclusief btw. Je betaalt op factuur.',
  'scholen.exclBtw': 'excl. btw',
  'scholen.kosten.gratis': 'Oefenen zonder code is gratis, ook voor de klas.',
  'scholen.mail': 'Of mail naar {adres}.',
  'scholen.mail.onderwerp': 'Klassencode aanvragen',
  'scholen.mail.bericht': 'Naam van de school:\nPlaats:\nGroep:\nJouw naam:\nFactuuradres:\n',
  'scholen.prijs': '€ 300',
  // De privacyverklaring (ADR-249). Tegen de ouder, in "je" en in gewone
  // woorden: wat er waar staat, waarom, en wat je ermee kunt. Het deel over het
  // gezinsaccount staat er alleen als deze bouw accounts heeft.
  'privacy.titel': 'Privacy',
  'privacy.bijgewerkt': 'Bijgewerkt op 30 september 2026.',
  'privacy.intro':
    'Hier lees je welke gegevens leer.nu gebruikt, waar ze staan en hoe lang, en wat je ermee kunt.',
  'privacy.kort.kop': 'In het kort',
  'privacy.kort.apparaat':
    'Oefenen kan zonder account. Wat je kind oefent, blijft dan op dit apparaat.',
  'privacy.kort.geen': 'Geen advertenties, geen volgcookies, en we verkopen niets door.',
  'privacy.kort.account':
    'Maak je een gezinsaccount, dan gaat de voortgang van je kinderen met jouw toestemming naar onze server in de EU.',
  'privacy.wie.kop': 'Wie we zijn',
  'privacy.wie.naam': 'leer.nu is van {naam}.',
  'privacy.wie.naamPlaats': 'leer.nu is van {naam} in {plaats}.',
  'privacy.wie.kvk': 'Ingeschreven bij de KvK onder nummer {kvk}.',
  'privacy.wie.contact':
    'Vragen over privacy, of wil je gegevens inzien, verbeteren of laten wissen? Mail naar {adres}. We antwoorden binnen een maand.',
  'privacy.apparaat.kop': 'Op dit apparaat',
  'privacy.apparaat.tekst':
    'De app bewaart in de browser wat nodig is om te oefenen: de voornamen die kinderen intikken, wat ze oefenden en hoe het ging, diploma’s, instellingen en een premiumcode. Zonder account gaat dat nergens heen.',
  'privacy.apparaat.wissen':
    'Je haalt het weg met "Alles wissen" in de app, of door de websitegegevens van leer.nu in je browser te wissen.',
  'privacy.teller.kop': 'De teller',
  'privacy.teller.tekst':
    'Om te zien of leer.nu gebruikt wordt, telt onze server per dag hoe vaak iets gebeurt: iemand kwam binnen op een pagina, begon een ronde, printte een werkblad of koos een groep. Alleen het aantal, zonder naam, zonder apparaatnummer en zonder cookie.',
  'privacy.teller.nietVolgen':
    'Staat in je browser "Niet volgen" of "Global Privacy Control" aan, dan telt hij niets.',
  'privacy.premium.kop': 'Premium',
  'privacy.premium.tekst':
    'Vul je een code in, dan vraagt de app aan onze server of hij klopt. Daarvoor gaan de code, een willekeurig nummer voor dit apparaat en het soort apparaat (bijvoorbeeld "iPad") naar de server. Die bewaart de code versleuteld, met dat nummer, het soort apparaat en de dagen waarop het apparaat de code het eerst en het laatst gebruikte.',
  'privacy.premium.pogingen': 'Foute codes tellen we per apparaatnummer, om raden tegen te gaan.',
  'privacy.betalen.kop': 'Betalen',
  'privacy.betalen.tekst':
    'Je betaalt via Mollie. Je e-mailadres gaat naar Mollie, en naar Resend om je de code te mailen. Wij bewaren het niet en sturen geen nieuwsbrief.',
  'privacy.betalen.bestelling':
    'Bij een betaling bewaren we het nummer van de betaling bij Mollie en de code. De leesbare code halen we weg zodra hij gemaild is en de bestelling 30 dagen oud is.',
  'privacy.account.kop': 'Met een gezinsaccount',
  'privacy.account.intro':
    'Een gezinsaccount is een keuze van de ouder. Een kind heeft geen e-mailadres en maakt zelf geen account. Met jouw toestemming staat dan op onze server:',
  'privacy.account.ouder': 'jouw e-mailadres, zonder naam;',
  'privacy.account.kind':
    'per kind de voornaam, een inlogcode, het niveau, de groep en de dag waarop je toestemming gaf;',
  'privacy.account.voortgang':
    'wat je kind oefende: elke ronde met het aantal goed en de tijd, en elk antwoord met goed of fout, de reactietijd, het gegeven antwoord en het tijdstip;',
  'privacy.account.rest': 'diploma’s, instellingen en de doelen die jij instelt;',
  'privacy.account.inlog':
    'mislukte inlogpogingen, als versleutelde code en versleuteld IP-adres, een dag lang.',
  'privacy.account.bewaren':
    'Dit blijft bewaard zolang het account bestaat. Een kind verwijder je zelf op de ouderpagina; wil je het hele account weg, mail ons dan. Gebruikt niemand het account 24 maanden, dan halen we alles weg.',
  'privacy.wie2.kop': 'Wie ons helpt',
  'privacy.wie2.intro':
    'Deze bedrijven verwerken gegevens voor ons, en alleen voor wat hieronder staat:',
  'privacy.wie2.github':
    'GitHub (Microsoft) laat de website zien. Zoals elke webserver ziet het je IP-adres. GitHub zit in de VS en valt onder het EU-VS-gegevenskader.',
  'privacy.wie2.supabase': 'Supabase host onze server, in Frankfurt.',
  'privacy.wie2.mollie': 'Mollie verwerkt de betaling, in Nederland.',
  'privacy.wie2.resend': 'Resend verstuurt de mail met de code, vanuit de EU.',
  'privacy.wie2.google': 'Google Workspace ontvangt de mail die je ons stuurt.',
  'privacy.waarom.kop': 'Waarom dat mag',
  'privacy.waarom.overeenkomst':
    'Voor premium en de betaling: omdat je iets bij ons koopt (uitvoering van een overeenkomst).',
  'privacy.waarom.belang':
    'Voor de teller en het tegengaan van raden: om leer.nu te laten werken en te verbeteren, zonder te weten wie je bent (gerechtvaardigd belang).',
  'privacy.waarom.toestemming':
    'Voor de gegevens van een kind in een gezinsaccount: omdat jij als ouder toestemming geeft. Die trek je in door het kind te verwijderen, of door ons te vragen het account weg te halen.',
  'privacy.rechten.kop': 'Wat je kunt doen',
  'privacy.rechten.tekst':
    'Je mag vragen welke gegevens we van jou of je kind hebben, en ze laten verbeteren, meenemen of wissen. Mail daarvoor naar {adres}. Ben je het niet met ons eens, dan kun je een klacht indienen bij de Autoriteit Persoonsgegevens.',
  'privacy.wijzigen.kop': 'Als dit verandert',
  'privacy.wijzigen.tekst':
    'Verandert er iets aan wat we bewaren, dan passen we deze pagina aan en staat de nieuwe datum bovenaan.',
  'privacy.link': 'Lees de privacyverklaring',
  'seo.privacy.titel': 'Privacy · leer.nu',
  'seo.privacy.beschrijving':
    'Welke gegevens leer.nu gebruikt, waar ze staan en hoe lang. Oefenen kan zonder account, en dan blijft alles op je apparaat.',
  'seo.scholen.titel': 'Voor de klas: een klassencode voor 40 apparaten · leer.nu',
  // "Over dit onderwerp" (ADR-213): onderaan de pagina van een onderwerp en op
  // de pagina voor Google. De vragen zijn die van een ouder.
  'over.kop': 'Over {onderwerp}',
  'over.lijst': 'Wat je oefent ({aantal})',
  'over.meer': 'En nog {aantal}.',
  'over.vragen': 'Vragen van ouders',
  'over.vraag.hoe': 'Hoe oefen je {onderwerp}?',
  'over.antwoord.hoe':
    'Kies een spelvorm en start een ronde. Een ronde duurt een paar minuten, en je ziet meteen wat goed is.',
  'over.vraag.groep': 'Voor welke groep is dit?',
  'over.antwoord.groep': 'Voor {groepen} van de basisschool.',
  'over.vraag.werkblad': 'Kan mijn kind dit ook op papier oefenen?',
  'over.antwoord.werkblad': 'Ja. Er is een werkblad om te printen, met de antwoorden erbij.',
  'over.vraag.gratis': 'Is het gratis?',
  'over.antwoord.gratis':
    'Ja. Oefenen is gratis en zonder account. Met premium plant leer.nu ook wat je kind moet herhalen.',
  'seo.ouders.titel': 'Voor ouders: zo werkt leer.nu, en wat het kost · leer.nu',
  'seo.werkblad.titel': '{onderwerp}: werkblad om te printen · leer.nu',
  'seo.werkblad.kop': '{onderwerp}: werkblad om te printen',
  'seo.werkblad.beschrijving':
    'Gratis werkblad om te printen, met de antwoorden erbij. Voor {groepen}.',
  'seo.werkblad.beschrijvingZonderGroep': 'Gratis werkblad om te printen, met de antwoorden erbij.',
  'seo.werkblad.oefenen': '{onderwerp} oefenen op leer.nu',
  // Een werkblad om te printen (ADR-211). Voor een kind en voor wie het uitdeelt:
  // een ouder of een juf. Kort, en de opdracht vóór de vragen.
  'werkblad.knop': 'Werkblad om te printen',
  'werkblad.kop': '{onderwerp}',
  'werkblad.soort': 'Werkblad',
  'werkblad.naam': 'Naam',
  'werkblad.datum': 'Datum',
  'werkblad.antwoorden': 'Antwoorden',
  'werkblad.print': 'Printen',
  'werkblad.anders': 'Andere vragen',
  'werkblad.terug': 'Terug naar oefenen',
  'werkblad.laden': 'Even laden…',
  'werkblad.voet': 'Scan de code en oefen verder op {adres}',
  'werkblad.soortNummer': 'Werkblad {nummer}',
  'werkblad.klassenset': 'Klassenset van {aantal}',
  'werkblad.opdracht.kaart': 'Schrijf bij elk nummer de naam.',
  'werkblad.opdracht.sommen': 'Reken uit. Schrijf het antwoord op de lijn.',
  'werkblad.opdracht.klok': 'Schrijf op hoe laat het is.',
  'werkblad.opdracht.klokDigitaal': 'Schrijf de tijd in cijfers.',
  'werkblad.opdracht.vlaggen': 'Schrijf onder elke vlag de naam.',
  'werkblad.opdracht.spelling': 'Vul de letters in.',
  'werkblad.opdracht.werkwoorden': 'Vul het werkwoord in, in de goede vorm.',
  'werkblad.opdracht.engels': 'Schrijf het Engelse woord op de lijn.',
  'home.zo.titel': 'Zo werkt leer.nu',
  'home.zo.stap': 'Stap {nummer}',
  // Zo werkt leer.nu, in vier stappen (ADR-231), aan een bureau (ADR-251).
  'home.zo.oefen.kop': 'Begin met oefenen',
  'home.zo.oefen.uitleg':
    'Kies een vak, een onderwerp en een spelvorm. Je begint direct met spelen.',
  'home.zo.fouten.kop': 'Leer van je fouten',
  'home.zo.fouten.uitleg':
    'Je ziet direct wat je goed en fout hebt gedaan. Foute antwoorden kun je direct opnieuw oefenen.',
  'home.zo.moeilijk.kop': 'Oefenen wat je moeilijk vindt',
  'home.zo.moeilijk.uitleg':
    'Wij zetten automatisch de vragen voor je klaar die je moeilijk vindt.',
  'home.zo.diploma.kop': 'Haal je diploma',
  'home.zo.diploma.uitleg':
    'Als je voldoende hebt geoefend, kun jij je officiële leer.nu-diploma halen.',
  // Wat er van een ronde over is (ADR-115), op Nu doen en in Verder oefenen.
  'home.openRest': 'Nog {aantal} van de {totaal} vragen',
  'home.openRestOne': 'Nog 1 van de {totaal} vragen',
  // Meest geoefend, Recent geoefend en Maak af in één rij (ADR-250).
  'home.verderTitel': 'Verder oefenen',
  // De rij voor wie nog niets deed (ADR-131).
  'home.popularStart': 'Hier begin je mee vandaag',
  // Met een groep zegt de kop dat ook: de rij is voor groep 6 een andere dan
  // voor groep 8 (ADR-206).
  'home.popularStartGroep': 'Hier begin je mee in groep {groep}',
  // Voor wie al geoefend heeft: wat bij de groep past en nog niet gedaan is.
  'home.pastBijGroep': 'Past bij groep {groep}',
  // Op een telefoon een lijst van drie rijen, en de rest één druk verder
  // (ADR-252).
  'home.nogTonen': 'Nog {aantal} tonen',
  'home.nogTonenEen': 'Nog 1 tonen',
  // Vandaag herhalen als Nu doen op een telefoon (ADR-252): de eerste ronde
  // van het plan, en de rest eronder als lijst.
  'home.nu.herhalen.regel': '{onderwerp} · {aantal} vragen',
  'home.nu.herhalen.regelEen': '{onderwerp} · 1 vraag',
  // De rest van het plan onder die kaart: een andere kop, want "Vandaag
  // herhalen" is de kaart zelf al.
  'vandaag.daarna': 'Daarna herhalen',
  // De voorspelling stond hier en staat nu alleen nog op K9. Weg in plaats van
  // ongebruikt blijven staan: copy die nergens meer verschijnt is copy die
  // niemand nog leest en die bij de volgende ronde toch wordt meegewogen.
  // Wat je net gedaan hebt, met het cijfer erbij. Een logboek, geen ranglijst:
  // het staat er in de volgorde waarin het gebeurde en telt niets bij elkaar op.
  // "Vandaag": het dagplan (ADR-126), met premium. Zonder code staat er niets
  // (ADR-253).
  'vandaag.titel': 'Vandaag herhalen',
  'vandaag.ronde': '{aantal} vragen',
  'vandaag.rondeEen': '1 vraag',
  // Het slinken en de bodem (ADR-139). "Klaar voor vandaag" en niet "je bent
  // bij": het plan is hoogstens vier rondes, dus verderop kan nog werk liggen.
  'vandaag.klaarVoorVandaag': 'Klaar voor vandaag. Lekker bezig!',
  'vandaag.klaarUitleg': 'Je hebt alles herhaald wat vandaag aan de beurt was.',
  'vandaag.over': 'Nog {aantal} rondes voor vandaag.',
  'vandaag.overEen': 'Nog 1 ronde voor vandaag.',
  'vandaag.verder': 'Volgende ronde',
  // De doelen van deze week (ADR-162). "Waar je voor gaat" stond hier: één
  // diploma, gekozen uit drie voorstellen, dat maanden kon duren. Dit heeft een
  // einde en noemt het ook — de datums van maandag tot en met zondag — en het
  // kind maakt het zelf.
  'weekdoel.titel': 'Je doelen voor deze week',
  'weekdoel.leeg': 'Nog geen doel. Waar ga jij deze week voor?',
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
  'weekdoel.gehaaldRonde': 'Daarmee is ook je weekdoel gehaald.',
  // Het einde van een ronde, aangekondigd (ADR-140).
  'practice.laatsteVraag': 'Laatste vraag',
  // Het begin van een ronde (ADR-140): de zin waarmee dit product zijn eigen
  // methode uitlegt, op het moment dat die methode op een fout lijkt.
  'start.eerderGehad':
    'Van de {totaal} heb je er {eerder} al eerder gehad. Zo blijft het in je hoofd.',

  // De uitslag van de laatste ronde op een kaart in Verder oefenen, met premium.
  'home.recentOutOf': '{goed} van de {totaal} goed',
  'home.recentLine': 'Cijfer {cijfer} · {goed} van de {totaal} goed',

  // Terugkomen na weken (ADR-149): geen gemiste dagen, wel wat er nog staat.
  // Het aantal is wat er vandaag aan de beurt is, dus het klopt letterlijk.
  'terug.zin': 'Alles wat je geoefend hebt, staat er nog.',
  'terug.klaar': 'Vandaag komen er {aantal} vragen terug.',
  'terug.klaarEen': 'Vandaag komt er 1 vraag terug.',
  'terug.minuutEen': 'De eerste ronde duurt ongeveer 1 minuut.',
  'terug.minuten': 'De eerste ronde duurt ongeveer {minuten} minuten.',
  'terug.knop': 'Herhalen',
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
  'afzwemmen.titel': 'Toets: {naam}',
  'afzwemmen.eisenTitel': 'Wat je moet doen',
  'afzwemmen.eisAlles': '{vragen} sommen, en ze moeten allemaal goed.',
  'afzwemmen.eisEenFout': 'Eén fout, en de toets stopt.',
  'afzwemmen.eisVragen': '{vragen} vragen, en je hebt er {drempel} goed nodig.',
  'afzwemmen.eisStil': 'Je hoort pas aan het eind hoe het ging.',
  'afzwemmen.eisOpnieuw': 'Lukt het nog niet? Dan probeer je het een andere dag opnieuw.',
  'afzwemmen.rijpZin':
    'Je beheerst er {onthouden} van de {totaal}. Dat is genoeg om de toets te doen.',
  'afzwemmen.nietRijpTitel': 'Nog niet klaar voor de toets',
  'afzwemmen.nietRijpZin':
    'Je beheerst er nu {onthouden} van de {totaal}. Beheers je er {nodig}, dan mag je de toets doen.',
  // Nooit een telling die nul is (ADR-167). De eerste twee dagen kan er niets
  // staan — een onderdeel telt pas na drie goede antwoorden op drie dagen — en
  // "0 van de 10" leest als een cijfer voor het kind in plaats van als de stand.
  'afzwemmen.nietRijpNiets':
    'Je beheerst hier nog niets. Beheers je er {nodig}, dan mag je de toets doen.',
  'afzwemmen.nietRijpUitleg':
    'Oefen nog even door. Je beheerst iets als je het drie keer goed hebt, op drie verschillende dagen.',
  'afzwemmen.alGehaald': 'Dit diploma heb je al. De datum op je diploma blijft staan.',
  'afzwemmen.meekijkenVraag': 'Wil je dat iemand meekijkt?',
  'afzwemmen.meekijkenUitleg': 'Haal je ouders erbij. Dan zien jullie samen hoe het gaat.',
  'afzwemmen.samen': 'Is er iemand bij je? Begin dan samen.',
  'afzwemmen.metIemand': 'Ja, ik haal iemand',
  'afzwemmen.zonder': 'Nee, ik begin',
  'afzwemmen.begin': 'Begin',
  'afzwemmen.terug': 'Terug',
  'afzwemmen.oefen': 'Eerst oefenen',
  'afzwemmen.print': 'Print je diploma',
  // Wat er wel is maar niet vooraan hoeft (ADR-143).
  'uitklap.tabel': 'Laat de tabel zien',
  'uitklap.tabelDicht': 'Verberg de tabel',
  'uitklap.uitlegDicht': 'Verberg de uitleg',
  'home.retention': 'weet je hier over drie weken nog van',
  'home.setMastered': '{goed} van de {totaal} beheers je',
  'home.setNew': 'nog niet geoefend',

  // The frame. Module order is ADR-029; only the ones with content are shown,
  // so six of these seven are written down before they are needed rather than
  // guessed at when they are.
  'nav.modules': 'Vakken',
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
  'nav.vandaag': 'Vandaag',
  // De vakken bij elkaar (ADR-241): een rij in de zijbalk die open- en
  // dichtklapt, een tab op een telefoon en een eigen pagina, /oefenen.
  'nav.oefenen': 'Oefenen',
  'nav.vakkenInklappen': 'Vakken inklappen',
  'nav.vakkenUitklappen': 'Vakken uitklappen',
  'oefenen.titel': 'Oefenen',
  // Denker in de kop van Oefenen (ADR-259): eerst een vraag, en dan wat hij
  // vindt van het vak waar je op staat.
  'oefenen.vraag': 'Waar heb je vandaag zin in?',
  'oefenen.vakZin': '{vak}! {regel}.',
  // Wie op Denker tikt, kietelt hem (ADR-259).
  'denker.kietel': 'Hihi, dat kietelt!',
  'denker.kietelKnop': 'Kietel Denker',
  // Denker bij de startknop (ADR-259): de vraag die nog open staat, en als
  // alles gekozen is iets over de spelvorm.
  'denker.stapEerst': '{vraag}',
  'denker.stapOoh': 'Ooh. {vraag}',
  'denker.stapTop': 'Top! {vraag}',
  'denker.vorm.aanwijzen': 'Tik de plek aan. Ik kijk mee!',
  'denker.vorm.meerkeuze': 'Vier antwoorden, één is goed.',
  'denker.vorm.typen': 'Typ het antwoord zelf, net als op de toets.',
  'denker.vorm.ontdekken': 'Kijk maar rond. Ik stel geen vragen.',
  'denker.vorm.bliksem': 'Eén minuut, zo veel als je kunt!',
  'denker.vorm.overleven': 'Ga door tot je levens op zijn. Jij kunt dat.',
  'denker.vorm.diploma': 'Pas aan het eind zie je hoe het ging. Zet hem op!',
  'denker.vorm.anders': 'Alles gekozen. Druk op Start!',
  // De terugknop boven een vakpagina op een telefoon. Zichtbaar staat er
  // "Oefenen" met een pijl; de naam zegt waar hij heen gaat.
  'module.terugOefenen': 'Terug naar Oefenen',
  'nav.vrienden': 'Vrienden',
  'nav.jij': 'Jij',
  'nav.premium': 'Premium',
  'nav.ouders': 'Ouders',
  // De dagen achter elkaar, bovenin op elke maat (ADR-259). Een lege dag
  // breekt hem pas vannacht, dus vandaag zegt wat er nog kan.
  'reeks.knop': 'Dagen achter elkaar: {aantal}',
  'reeks.titel': 'dagen achter elkaar',
  'reeks.titelEen': 'dag achter elkaar',
  'reeks.sinds': 'Elke dag geoefend sinds {dag}.',
  'reeks.alleenVandaag': 'Vandaag geoefend. Morgen weer?',
  'reeks.vandaagNog': 'Oefen vandaag ook, dan worden het er {aantal}.',
  'reeks.geen': 'Oefen vandaag een ronde, dan begin je.',
  'reeks.week': 'Deze week',
  'reeks.dagGeoefend': '{dag}: geoefend',
  'reeks.dagNiet': '{dag}: niet geoefend',
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
  // al: "8 — ken je inmiddels — van de 30 die je geoefend hebt". "Ken je" en
  // niet "weet je goed" (op verzoek van de eigenaar): kennen is wat blijft, en
  // "inmiddels" zegt dat het gegroeid is.
  'retention.geheugenGoed': 'beheers je inmiddels',
  'retention.geheugenVan': 'van de {aantal} die je geoefend hebt',
  'retention.geheugenLeeg':
    'Je hebt nog niets geoefend. Na je eerste ronde zie je hier hoe het gaat.',
  'retention.vakRegel': '{onthouden} beheers je, {geoefend} geoefend, {totaal} in totaal',
  'retention.vakLeeg': 'Nog niet geoefend, {totaal} in totaal',
  // Alles wat er ooit geoefend is, en de laatste acht weken, onder de tegels van
  // deze week (ADR-172). De totalen zijn één zin en geen tweede rij tegels: twee
  // rijen met "Rondes" en "Rondes in totaal" boven elkaar lazen als één rij die
  // zichzelf tegensprak. Nadrukkelijk niet hetzelfde als wat je onthoudt: dit
  // gaat over antwoorden die je gaf, dat over wat blijft.
  'retention.totaal':
    'Alles bij elkaar: {rondes} keer geoefend en {vragen} vragen beantwoord, waarvan {procent}% goed.',
  'retention.totaalEenVraag':
    'Alles bij elkaar: {rondes} keer geoefend en 1 vraag beantwoord, waarvan {procent}% goed.',
  'retention.grafiek': 'Vragen per week',
  'retention.grafiekWk': 'wk {nummer}',
  'retention.grafiekNu': 'nu',
  'retention.grafiekZin': 'Week {nummer}: {goed} van de {totaal} goed.',
  'retention.grafiekDezeZin': 'Deze week: {goed} van de {totaal} goed.',
  'retention.grafiekGoed': 'goed',
  'retention.grafiekFout': 'fout',
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
  'retention.tegelOnthouden': 'Beheers je',
  'retention.tegelOpfrissen': 'Bijna vergeten',
  'retention.tegelOefenen': 'Nog aan het oefenen',
  'retention.tegelNieuw': 'Nog niet geoefend',
  'retention.detail': 'Per onderdeel',
  'retention.glance': 'Alles in één blik',
  // De tabel: hoe vaak, hoeveel procent goed, en wanneer het laatst. "Weer op"
  // is weg; wanneer iets terugkomt is de zaak van de volgende ronde.
  'retention.item': 'Onderdeel',
  'retention.status': 'Hoe het gaat',
  'retention.aantal': 'Keer gevraagd',
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
  'retention.verkoopKop': 'Wil je zien wat je inmiddels beheerst?',
  'retention.verkoopTekst':
    'Met premium zie je hier wat je al beheerst, per vak en per onderwerp. En hoe vaak je oefent, week na week. Alles wat je nu oefent, houden we al bij: met premium staat het er meteen. Je ouders hebben daar een code voor nodig.',
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
  'retention.regelsTitel': 'Hoe werkt herhalen?',
  'retention.regel1':
    'Je beheerst iets als je het drie keer goed hebt, op drie verschillende dagen.',
  // Zonder "onderdeel" en zonder "aan de beurt" (ADR-177). Dat laatste is het
  // woord van het schema en niet van het kind: wat het betekent is dat één dag
  // één keer telt, en dát is wat hier nu staat.
  'retention.regel2':
    'Op één dag telt één goed antwoord. Heb je het diezelfde dag nog een keer goed, dan telt dat niet extra. Daarom zijn het drie verschillende dagen.',
  'retention.regel3':
    'Heb je iets wat je beheerst lang niet gezien? Dan ben je het bijna vergeten. Herhaal het: één goed antwoord is genoeg, en je beheerst het weer.',
  'retention.regel4': 'Heb je iets fout? Dan begin je daar opnieuw mee.',

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
  'soon.body': 'We zijn dit vak nog aan het maken.',
  'soon.instead': 'Dit kun je nu wel oefenen',
  'soon.insteadLine': 'Klaar om te oefenen',

  // Eén categorie, en de vorm ervan is het punt: tafels hoort onder rekenen,
  // klokkijken niet. Klokkijken is geen rekenen maar een instrument aflezen.
  'category.rekenen': 'Rekenen',
  'category.holds': 'Dit hoort erbij:',

  // Item status, K9. Four states, each with a shape as well as a word — and
  // none of them green, because green is an answer state and would tell a
  // child they had just got something right. "In de vriezer" is gone
  // (ADR-114): onthouden begins at box four now, and box five is the same fact.
  'status.refresh': 'bijna vergeten',
  'status.remembered': 'beheers je',
  'status.practising': 'nog aan het oefenen',
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
  // De digitale klok (ADR-257): dezelfde vier stappen in cijfers. De naam
  // zegt het erbij, want hij staat ook op Vandaag en Jij, zonder de rij
  // "Welke klok?" erboven.
  'set.klok-dig-heel': 'Hele uren, digitaal',
  'set.klok-dig-half': 'Halve uren, digitaal',
  'set.klok-dig-kwart': 'Kwartieren, digitaal',
  'set.klok-dig-vijf': 'Vijf minuten, digitaal',
  'set.klok-dig-mix': 'Klokmix, digitaal',
  'set.klok-dig-mix.uitleg': 'Alle tijden in cijfers door elkaar',

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
  'onderwerp.steden.uitleg': 'De hoofdsteden, of alle 80',
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
  // Op de digitale klok (ADR-257) zegt de regel hoe cijfers klinken, ook na
  // twaalf uur.
  'onderwerp.heleUren.digitaal': '7:00 en 19:00 zijn allebei zeven uur',
  'onderwerp.halveUren.digitaal': '7:30 en 19:30 zijn allebei half acht',
  'onderwerp.kwartieren.digitaal': '7:15 is kwart over zeven, 18:45 kwart voor zeven',
  'onderwerp.vijfMinuten.digitaal': '7:25 is vijf voor half acht',
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
  'way.wijs-aan': 'Tik de plek aan op de kaart',
  'way.meerkeuze': 'Kies uit 4 namen — de eerste stap naar typen',
  'way.hoe-heet-dit': 'Typ de naam zelf — zoals op de toets',
  'way.ontdekken': 'Kijk rond, zonder vragen',
  'way.bliksemronde': 'Zo veel mogelijk in 1 minuut — voor als je het al beheerst',
  'way.overleven': 'Ga door tot je levens op zijn — voor als je het al beheerst',
  // Het topodiploma (ADR-117): twintig plekken van één kaart, of de hele kaart
  // als die kleiner is, de naam zelf typen, negen van de tien goed.
  'mode.topo-diploma': 'Topodiploma',
  'way.topo-diploma': 'Typ 20 namen zelf, 9 van de 10 goed — pas aan het eind zie je hoe het ging',
  'topo.diplomasTitle': 'Jouw topodiploma’s',
  'topo.diplomasCount': '{aantal} van de {totaal} gehaald',
  'topo.diplomaHave': '{kaart}: topodiploma gehaald',
  'topo.diplomaWant': '{kaart}: nog geen topodiploma',
  'topo.diplomaEarned': 'Topodiploma gehaald: {kaart}',
  'topo.diplomaMissed':
    'Nog geen diploma: {goed} van de {totaal} goed. Met {nodig} goed is hij van jou.',
  // De kop van een vakpagina is die van het vak, "Topografie oefenen"
  // (ADR-247). Dit is alleen wat er staat als die pagina er niet is.
  'choose.titleZonderNaam': 'Wat wil je oefenen?',
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
  'choose.fouten': 'Jouw fouten',
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
  'start.manier': 'spelvorm',
  'start.ronde': 'ronde',
  'start.vragen': '{aantal} vragen',
  'start.vragenTijd': '{aantal} vragen · ±{minuten} min',
  'start.seconden': '{aantal} seconden',
  'start.levens': '{aantal} levens',
  'start.vrij': 'rondkijken',
  // De vakpagina op een telefoon (ADR-252): één stap open, wat gekozen is
  // samen bovenaan, en onderaan een balk die zegt waar je bent.
  'kies.wijzig': 'Wijzig',
  'kies.wijzigLabel': 'Wijzig stap {stap}, {vraag}: {waarde}',
  'kies.nogKiezen': 'Nog kiezen',
  'kies.stapVan': 'Stap {stap} van {totaal}',
  'kies.allesGekozen': 'Alles gekozen',
  'kies.metPremium': 'Met premium',
  'kies.diplomasStand': '{aantal} van de {totaal} gehaald',
  'kies.overRegel': 'Wat je oefent, werkblad en vragen van ouders',
  'kies.overRegelZonderWerkblad': 'Wat je oefent en vragen van ouders',
  'kies.sluit': 'Sluiten',
  // Zolang niet elke stap een antwoord heeft, staat de balk er wel maar is hij
  // leeg, en zegt hij welke stappen nog wachten. De stappen zijn genummerd op
  // de pagina, dus het nummer is de kortste weg terug.
  'start.nogKiezen': 'Nog even kiezen',
  // De startkaart (ADR-259): een stap zonder antwoord, en de regel onder de
  // stappen zolang er nog iets te kiezen is.
  'start.nogKiezenRij': 'Nog kiezen',
  'start.kiesElkeStap': 'Kies bij elke stap iets, dan kun je starten.',
  'start.kiesNogStap': 'Kies nog bij stap {stap}',
  'start.kiesNogStappen': 'Kies nog bij stap {stappen} en {laatste}',
  // Een stap die nog wacht, als knop in de startbalk (ADR-247).
  'start.naarStap': 'Naar stap {stap}: {vraag}',
  // Premium (ADR-111, ADR-116, ADR-122): een code die een ouder één keer
  // invult. Geen e-mail en geen wachtwoord; er is geen account om in te loggen.
  //
  // Sinds ADR-256 staat de knip van ADR-192 niet meer in een intro maar in de
  // tabel: regel voor regel, met een vinkje of een streep.
  'premium.label': 'Premium',
  'premium.titel': 'Premium',
  'premium.introAan': 'Alles staat open op dit apparaat.',
  'premium.perSchooljaar': 'per jaar',
  'premium.codeTitel': 'Heb je al een code?',
  // Met een code is dat geen vraag meer (ADR-236).
  'premium.codeTitelAan': 'Je code',
  'premium.codeLabel': 'Typ de code',
  'premium.codePlaceholder': 'LEER-XXXX-XXXX',
  'premium.codeGebruiken': 'Code gebruiken',
  'premium.bezig': 'Even kijken…',
  'premium.aan': 'Premium staat aan op dit apparaat, tot en met {datum}.',
  // Het einde van een jaar, aangekondigd in plaats van afgewacht (ADR-129).
  'premium.bijnaAf':
    'Je code loopt af op {datum}. Verleng hem vóór die dag, dan merkt niemand thuis er iets van.',
  'premium.verlopen':
    'Je code is verlopen op {datum}. Alles wat je kinderen hebben geoefend, staat nog op dit apparaat. Verleng je, dan komt alles terug.',
  'premium.afmelden': 'Code van dit apparaat halen',
  'premium.afmeldenUitleg': 'Had dit apparaat een plek, dan komt die vrij voor een ander apparaat.',

  // Basis tegen premium (ADR-145, ADR-256): acht korte regels uit het ontwerp,
  // en twee die het ontwerp niet had maar die premium wel opent. Elke regel is
  // nagelopen tegen wat de app echt afschermt (`isPremiumVorm`).
  'premium.vergelijkTitel': 'Basis en premium naast elkaar',
  'premium.tabelKop': 'Wat je krijgt',
  'premium.basisNaam': 'Basis',
  // Op de kolom van Basis: dat is wat dit apparaat nu heeft.
  'premium.actief': 'Actief',
  'premium.tabelJa': 'Zit erin',
  'premium.tabelNee': 'Zit er niet in',
  'premium.regel.vakken': 'Alle vakken',
  'premium.regel.onbeperkt': 'Onbeperkt leren',
  'premium.regel.reclame': 'Geen advertenties',
  // In het ontwerp "Alle spelvormen". Maar elke spelvorm die leert is gratis
  // sinds ADR-224; premium zijn de drie die toetsen (ADR-256).
  'premium.regel.bliksem': 'Bliksemronde, overleven en de oefentoets',
  // In het ontwerp "Meer dan 80". Het zijn er precies 84 sinds de digitale
  // klok (ADR-257), en `kast.test.ts` bindt het getal aan de lijst.
  'premium.regel.diplomas': 'Alle 84 diploma’s',
  'premium.regel.plan': 'Automatisch plannen en herhalen',
  'premium.regel.weekdoelen': 'Persoonlijke doelen per kind',
  'premium.regel.voortgang': 'Uitgebreid inzicht in voortgang per kind',
  'premium.regel.lijsten': 'Eigen oefenlijsten',
  // Drie kinderen kunnen ook zonder code (ADR-173); wat premium erbij geeft,
  // is dat één code op drie apparaten werkt.
  'premium.regel.gezin': 'Eén code voor 3 apparaten',

  // Kopen (ADR-123, ADR-164, ADR-256). Het bedrag staat hier omdat een knop
  // naar een winkel zonder prijs als een val voelt; kassa.test.ts houdt het
  // jaarbedrag gelijk aan PRIJS_CENTEN, zodat er één bedrag is en geen twee.
  'premium.betalen': 'Betalen',
  'premium.maandelijks': 'Maandelijks',
  'premium.jaarlijks': 'Jaarlijks',
  'premium.jaarKorting': '−50%',
  'premium.prijs': '€ 59,95',
  'premium.maandPrijs': '€ 9,95',
  'premium.perMaand': 'per maand',
  'premium.gezinJaar': 'Voor het hele gezin: 3 kinderen, één jaar lang',
  'premium.gezinMaand': 'Voor het hele gezin: 3 kinderen',
  'premium.activeren': 'Premium activeren',
  'premium.jaarUitleg': 'Minder dan € 5 per maand. Eén keer betalen.',
  'premium.maandUitleg': 'Maandelijks opzegbaar.',
  'premium.privacy': 'Privacyverklaring',
  // De knop op de ouderpagina, die naar dezelfde kassa gaat.
  'premium.kopenKnop': 'Een code kopen',

  // Waarom dit en geen ander (ADR-256): vier redenen om te vertrouwen.
  'premium.waaromTitel': 'Waarom leer.nu',
  'premium.waarom.anoniem': 'Je kind blijft anoniem',
  'premium.waarom.anoniemUit':
    'We slaan geen persoonlijke gegevens van je kind op. Geen account, geen e-mailadres. De voortgang blijft op je eigen apparaat.',
  // Met een gezinsaccount gaat de voornaam wél naar de server, met
  // toestemming (ADR-249). Dan zegt de uitleg dat.
  'premium.waarom.anoniemUitAccount':
    'Zonder account blijft alles op je eigen apparaat. Met een gezinsaccount gaat alleen de voornaam, met jouw toestemming, naar onze server in de EU. Geen achternaam, geen school en geen e-mailadres van je kind.',
  'premium.waarom.herhalen': 'Slim herhalen',
  'premium.waarom.herhalenUit':
    'Wat nog lastig is, komt vaker terug. Wat goed gaat, komt minder vaak terug. Zo blijft de stof beter hangen.',
  'premium.waarom.kort': 'Een paar minuten per dag',
  'premium.waarom.kortUit':
    'Korte oefensessies die makkelijk in de dag passen. Regelmatig oefenen werkt beter dan lang oefenen.',
  'premium.waarom.reclame': 'Geen reclame, geen afleiding',
  'premium.waarom.reclameUit':
    'Alleen oefenen. Er zijn geen advertenties, pop-ups of links naar andere websites.',

  'premium.fout.leeg': 'Typ eerst de code.',
  'premium.fout.onbekend': 'Deze code kennen we niet. Kijk of je hem goed hebt overgetypt.',
  'premium.fout.verlopen': 'Deze code is verlopen.',
  // Een klaspas voor volgend schooljaar, al in juni uitgedeeld (ADR-225).
  'premium.fout.nog-niet': 'Deze code geldt vanaf {datum}. Vul hem vanaf die dag in.',
  'premium.fout.vol':
    'Alle plekken van deze code zijn in gebruik. Vervang er een onder Apparaten op de ouderpagina.',
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
  // Met wat het kind wilde (ADR-193).
  'ouderVraag.uitlegWat': '{wat} hoort bij premium. Daar is een code voor nodig.',
  'ouderVraag.uitlegKlaar':
    'Je bent klaar voor de toets van {wat}! Die toets hoort bij premium. Daar is een code voor nodig.',
  // Hoe een wens heet, in het venster en op de ouderpagina (ADR-193).
  'wens.vorm': '{vorm} bij {naam}',
  'wens.diploma': 'Het diploma {naam}',
  'wens.oefentoets': 'De oefentoets bij {naam}',
  'premium.vraagKnop': 'Ik wil dit diploma halen',
  'result.klaarVoorToets': 'Je bent klaar voor de toets!',
  'result.klaarVoorToetsUitleg':
    'Je beheerst {naam} goed genoeg voor het diploma. De toets hoort bij premium: vraag het even aan je ouders.',

  // Drie uitwegen, en de eerste vraag is niet "heb je een code" maar "is er
  // iemand bij je" (ADR-174). Dat is het enige wat het kind op dit moment weet,
  // en het bepaalt alle drie de antwoorden.
  'ouderVraag.erbij': 'Mijn ouders zijn erbij',
  'ouderVraag.erbijRegel': 'Vul dan hier de code in',
  'ouderVraag.sturen': 'Vraag mijn ouders om een code',
  'ouderVraag.sturenRegel': 'Dan kunnen ze er later naar kijken',
  'ouderVraag.bekijken': 'Wat is premium?',
  'ouderVraag.bekijkenRegel': 'Lees eerst wat je ermee kunt',
  'ouderVraag.codeTitel': 'De code',
  'ouderVraag.codeUitleg': 'Geef het apparaat even aan je ouders.',
  'ouderVraag.terugVraag': 'Terug',
  'ouderVraag.terug': 'Nee, ik doe iets anders',
  'ouderVraag.sluit': 'Sluiten',
  // De code is vol (ADR-226). Voor het kind: wat er is, en wie het regelt.
  // Geen prijs en geen knop om te kopen (R-11).
  'ouderVraag.plekUitleg':
    'De code van je ouders staat al op genoeg apparaten. Je ouders kunnen dit regelen.',
  'ouderVraag.plekTerug': 'Oké, terug',

  // Doorsturen (ADR-174). Het bericht is in de stem van het kind, want het kind
  // drukt op de knop — en het vraagt om te kijken en niet om te kopen. Er gaat
  // niets mee dan het adres: geen naam, geen voortgang, en ook niet welke
  // oefening het wilde doen. Zo'n bericht reist via de telefoon van iemand
  // anders.
  'doorsturen.titel': 'Vraag je ouders om een code',
  'doorsturen.uitleg': 'Ze krijgen een link. Daar staat wat premium is en wat het kost.',
  'doorsturen.onderwerp': 'Iets van leer.nu',
  'doorsturen.bericht': 'Ik wil dit graag op leer.nu. Kijk je even?',
  'doorsturen.knop': 'Versturen',
  'doorsturen.bezig': 'Even wachten…',
  'doorsturen.verstuurd': 'Verstuurd. Je ouders kunnen er nu naar kijken.',
  'doorsturen.gekopieerd':
    'De link staat klaar om te plakken. Zet hem in een bericht aan je ouders.',
  'doorsturen.zelf': 'Versturen lukt niet op dit apparaat. Dit is de link:',
  'doorsturen.mail': 'Of mail het ze',
  // Deel je uitslag, na een ronde (ADR-209). Zonder naam: het bericht reist
  // via de telefoon van een ouder of WhatsApp.
  'delen.knop': 'Deel je uitslag',
  'delen.titel': '{onderwerp} op leer.nu',
  'delen.bericht': 'Ik had {goed} van de {totaal} goed bij {onderwerp}. Kun jij dat ook?',
  'delen.gedeeld': 'Gedeeld.',
  'delen.gekopieerd': 'Gekopieerd. Plak het in een bericht.',
  'delen.zelf': 'Delen lukt niet op dit apparaat. Dit is de link:',
  // Wat premium laat zien, sinds ADR-192. Steeds met de zin dat het al bewaard
  // wordt: wie premium neemt, begint niet op nul.
  'premium.wat.voortgang':
    'Met premium zie je per kind wat het inmiddels beheerst en hoe vaak het oefent. Leer.nu bewaart het nu al, dus het staat er meteen.',
  'premium.wat.weekdoelen':
    'Met premium kies je elke week je eigen doelen, en zie je hoe ver je ermee bent.',

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
  'practice.correct': 'Goed! Dit is {naam}.',
  'practice.wrong': '{naam} ligt hier.',
  'practice.wrongSub': 'Jouw antwoord: {gekozen}.',
  // The near miss from ADR-017: naming another real place is not a typo, and
  // saying so is the whole reason that decision exists.
  'practice.almost': 'Bijna!',
  'practice.almostSub': 'Dit is {naam}. {gekozen} bestaat ook, maar ligt ergens anders.',
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
  'practice.dontKnowSub': 'Geen probleem. Deze komt later nog terug.',
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
  'practice.loading': 'Even laden…',
  'practice.mapFailed': 'De kaart laadt niet. Is er internet? Probeer het zo nog eens.',

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
  'sums.correct': 'Goed! {uitgewerkt}.',
  'sums.wrong': '{uitgewerkt}.',
  'sums.wrongSub': 'Jouw antwoord: {gegeven}.',
  'sums.dontKnowSub': 'Geen probleem. Deze komt later nog terug.',
  'sums.practiceMore': 'Deze sommen komen nog terug',
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
  'sums.diplomaMissed': 'Nog geen diploma. Alle 10 goed, dan is hij van jou.',
  'sums.rekendiplomaEarned': 'Diploma gehaald: {naam}',
  'sums.rekendiplomaMissed': 'Nog geen diploma. Met 9 van de 10 goed is hij van jou.',
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
  'way.som-typen': 'Typ het antwoord zelf — zo weet je of je het beheerst',
  'way.som-meerkeuze': 'Kies uit 4 getallen — de eerste stap naar typen',
  'way.tafeldiploma': 'De hele tafel foutloos — één fout en je begint opnieuw',
  'way.reken-diploma': 'De toets: 20 sommen typen, 9 van de 10 goed',

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
  'klok.whichQuestion': 'Welke klok hoort hierbij?',
  // De digitale klok (ADR-247, ADR-257): bij meerkeuze staan de cijfers op het
  // scherm en kies je de tijd in woorden uit vier.
  'klok.digitaalQuestion': 'Hoe zeg je deze tijd?',
  'klok.digitaalPrompt': 'Kijk naar de cijfers. Hoe zeg je deze tijd?',
  // Bij typen andersom: de tijd in woorden, en jij schrijft hem in cijfers.
  // Cijfers overtypen die al op het scherm staan, zou niets toetsen.
  'klok.digitaalTypeQuestion': 'Typ deze tijd in cijfers',
  'klok.typePlaceholder': '7:30',
  'klok.correct': 'Goed! Het is {tijd}.',
  'klok.wrong': 'Het is {tijd}.',
  'klok.wrongSub': 'Jouw antwoord: {gegeven}.',
  'klok.dontKnowSub': 'Geen probleem. Deze komt later nog terug.',
  'klok.practiceMore': 'Deze tijden komen nog terug',
  'mode.klok-meerkeuze': 'Meerkeuze',
  // "Klok zoeken" en niet "Welke klok?": de naam van een oefenvorm komt in de
  // startzin terecht — "Hele uren klok zoeken · 10 vragen" — en een vraagteken
  // midden in die zin leest als een fout. De vraag zelf staat boven de vier
  // klokken, waar hij hoort.
  'mode.klok-welke-klok': 'Klok zoeken',
  // Vervallen als spelvorm (ADR-257); de naam blijft voor oude rondes.
  'mode.klok-digitaal': 'Digitale klok',
  'mode.klok-typen': 'Zelf typen',
  // De volgorde is op elke pagina dezelfde (ADR-112): zoeken, meerkeuze, zelf
  // typen. Bij de klok is zoeken de klok die bij een tijd hoort.
  'way.klok-meerkeuze': 'Kies uit 4 tijden — de eerste stap naar typen',
  'way.klok-welke-klok': 'Zoek de klok die bij de tijd hoort',
  'way.klok-typen': 'Typ de tijd zelf — zoals op de toets',
  // Het klokdiploma (ADR-117): tien klokken van één stap, zelf opschrijven,
  // negen goed, en pas aan het eind hoor je hoe het ging.
  'mode.klok-diploma': 'Klokdiploma',
  'way.klok-diploma': 'Typ 10 tijden zelf, 9 goed — pas aan het eind zie je hoe het ging',
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
  'onderwerp.vlaggen.provincies.uitleg': 'De vlaggen van de 12 provincies',
  'set.nl-fouten': 'Jouw fouten in Nederland',
  'set.europa-fouten': 'Jouw fouten in Europa',
  'set.afrika-fouten': 'Jouw fouten in Afrika',
  'set.azie-fouten': 'Jouw fouten in Azië',
  'set.noord-amerika-fouten': 'Jouw fouten in Noord-Amerika',
  'set.zuid-amerika-fouten': 'Jouw fouten in Zuid-Amerika',
  'set.oceanie-fouten': 'Jouw fouten in Oceanië',
  'set.wereld-fouten': 'Jouw fouten op de wereldkaart',
  'set.klok-fouten': 'Jouw fouten met de klok',
  'set.klok-dig-fouten': 'Jouw fouten met de digitale klok',
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
  'way.vlag-zoeken': 'Zoek de vlag die bij de naam hoort',
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
  'vlag.wrongSubVlag': 'Jouw antwoord: de vlag van {gekozen}.',
  'vlag.wrongSubNaam': 'Jouw antwoord: {gekozen}.',
  'vlag.dontKnowSub': 'Geen probleem. Deze komt later nog terug.',
  'vlag.practiceMore': 'Deze vlaggen komen nog terug',
  'vlag.loading': 'Vlaggen laden…',
  'vlag.failed': 'De vlaggen laden even niet.',
  'vlag.explore.kind': 'Ontdek de vlaggen',
  'vlag.explore.hint': 'Kies een naam. Je ziet meteen de vlag.',
  'vlag.explore.nothingChosen': 'Kies een vlag uit de lijst.',
  'vlag.explore.werelddeel': 'Werelddeel',
  'vlag.explore.land': 'Land',
  'vlag.explore.hoofdstad': 'Hoofdstad',
  // Het vlaggendiploma (ADR-104): twintig vlaggen van een werelddeel, negen van
  // de tien goed, en pas aan het eind hoor je hoe het ging.
  'mode.vlag-diploma': 'Vlaggendiploma',
  'way.vlag-diploma': '9 van de 10 goed — pas aan het eind zie je hoe het ging',
  // Bij bekende vlaggen en vlaggen die op elkaar lijken: het diploma van het
  // hele werelddeel (ADR-247).
  'way.vlag-diploma-deel': 'Over alle vlaggen van {deel}, 9 van de 10 goed',
  'vlag.heleWereld': 'de hele wereld',
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
  'regio.engels': 'Engels',
  'start.deel': 'deel',
  // Klok (ADR-257): eerst welke klok, dan het onderwerp, dan hoe.
  'klokdeel.title': 'Welke klok?',
  'regio.analoog': 'Analoge klok',
  'regio.digitaal': 'Digitale klok',
  'start.klok': 'klok',
  // Rekenen (ADR-258): eerst welke sommen, dan het onderwerp, dan hoe.
  'rekendeel.title': 'Welke sommen?',
  'regio.plusEnMin': 'Plus en min',
  'regio.keerEnDelen': 'Keer en delen',
  'regio.rekenmix': 'Rekenmix',
  'start.sommen': 'sommen',
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
  // Engels (ADR-217): woordjes voor groep 7 en 8.
  'onderwerp.taal.enTellen': 'Tellen en de kalender',
  'onderwerp.taal.enTellen.uitleg': 'One, two, three, Monday, May',
  'onderwerp.taal.enTellen.keuze': 'Welke woorden?',
  'onderwerp.taal.enKleuren': 'Kleuren en kleding',
  'onderwerp.taal.enKleuren.uitleg': 'Red, blue, a coat, a dress',
  'onderwerp.taal.enKleuren.keuze': 'Welke woorden?',
  'onderwerp.taal.enMensen': 'Mensen en dieren',
  'onderwerp.taal.enMensen.uitleg': 'Mother, head, dog, horse',
  'onderwerp.taal.enMensen.keuze': 'Welke woorden?',
  'onderwerp.taal.enThuis': 'Eten, thuis en school',
  'onderwerp.taal.enThuis.uitleg': 'Bread, kitchen, pencil',
  'onderwerp.taal.enThuis.keuze': 'Welke woorden?',
  'onderwerp.taal.enWerkwoorden': 'Werkwoorden in het Engels',
  'onderwerp.taal.enWerkwoorden.uitleg': 'Walk, run, eat, sleep',
  'onderwerp.taal.engelsmix': 'Engelse mix',
  'onderwerp.taal.engelsmix.uitleg': 'Alle Engelse woorden door elkaar',
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
  'set.taal-en-getallen': 'Getallen in het Engels',
  'set.taal-en-getallen.kort': 'getallen',
  'set.taal-en-dagen': 'Dagen en maanden in het Engels',
  'set.taal-en-dagen.kort': 'dagen en maanden',
  'set.taal-en-kleuren': 'Kleuren in het Engels',
  'set.taal-en-kleuren.kort': 'kleuren',
  'set.taal-en-kleding': 'Kleding in het Engels',
  'set.taal-en-kleding.kort': 'kleding',
  'set.taal-en-familie': 'Familie in het Engels',
  'set.taal-en-familie.kort': 'familie',
  'set.taal-en-lichaam': 'Je lichaam in het Engels',
  'set.taal-en-lichaam.kort': 'lichaam',
  'set.taal-en-dieren': 'Dieren in het Engels',
  'set.taal-en-dieren.kort': 'dieren',
  'set.taal-en-eten': 'Eten en drinken in het Engels',
  'set.taal-en-eten.kort': 'eten en drinken',
  'set.taal-en-huis': 'In huis, in het Engels',
  'set.taal-en-huis.kort': 'in huis',
  'set.taal-en-school': 'Op school, in het Engels',
  'set.taal-en-school.kort': 'op school',
  'set.taal-en-werkwoorden': 'Werkwoorden in het Engels',
  'set.taal-en-mix': 'Engelse mix',
  'set.taal-en-fouten': 'Jouw fouten met Engels',
  // De manieren. Geen bliksemronde: spelling is nadenken, en een klok leert
  // gokken. Het flitsdictee heeft kijktijd, geen antwoordtijd.
  'mode.taal-letters': 'Kies de letters',
  'mode.taal-flitsdictee': 'Flitsdictee',
  'mode.taal-vorm-kiezen': 'Kies de vorm',
  'mode.taal-vorm-typen': 'Typ de vorm',
  'mode.taal-engels-kiezen': 'Kies het woord',
  'mode.taal-engels-typen': 'Typ het woord',
  // En het diploma (ADR-168): één woord voor allebei de delen, want het is op
  // allebei dezelfde toets — twintig keer zelf schrijven, negen op de tien goed.
  'mode.taal-diploma': 'Taaldiploma',
  'way.taal-letters': 'Kies de letters die in het woord horen — de eerste stap naar schrijven',
  'way.taal-flitsdictee': 'Kijk 3 tellen en schrijf het woord dan zelf — net als bij een dictee',
  'way.taal-vorm-kiezen': 'Kies uit 3 vormen — de eerste stap naar typen',
  'way.taal-vorm-typen': 'Typ de vorm zelf — zoals op de toets',
  'way.taal-engels-kiezen': 'Kies uit 4 Engelse woorden — de eerste stap naar typen',
  'way.taal-engels-typen': 'Typ het Engelse woord zelf — zoals op de toets',
  'way.taal-diploma': 'De toets: 20 keer zelf schrijven, 9 van de 10 goed',
  'taal.diplomaEarned': 'Diploma gehaald: {naam}',
  'taal.diplomaMissed': 'Nog geen diploma. Met 9 van de 10 goed is hij van jou.',
  'taal.diplomasTitle': 'Jouw taaldiploma’s',
  // De ronde. Geen voorleesknop: die zou het woord zeggen dat je moet spellen.
  'taal.loading': 'Woorden laden…',
  'taal.failed': 'De woorden laden even niet.',
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
  'taal.engelsVraag': 'Welk Engels woord hoort erin?',
  'taal.engelsTyp': 'Typ het Engelse woord',
  'taal.engelsPrompt': 'Wat is {nl} in het Engels?',
  'taal.engelsLabel': 'Kies het Engelse woord',
  'taal.engelsVeld': 'Het Engelse woord voor {nl}',
  'taal.engelsNl': 'In het Nederlands: {nl}.',
  // Na een antwoord. Het goede woord staat erbij, en na een fout de regel,
  // toegepast op dit woord.
  'taal.goed': 'Goed! {woord}.',
  'taal.fout': 'Het is {woord}, met {letters}.',
  'taal.foutVorm': 'Het is {woord}.',
  'taal.jijKoos': 'Jouw antwoord: {gegeven}.',
  'taal.jeSchreef': 'Jouw antwoord: {getypt}.',
  'taal.weetNiet': 'Geen probleem. Deze komt later nog terug.',
  'taal.practiceMore': 'Deze woorden komen nog terug',
  'taal.practiceMoreVormen': 'Deze werkwoorden komen nog terug',
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
  // Gestopt voor de eerste vraag (ADR-236): geen uitslag, want er was geen ronde.
  'result.gestoptTitel': 'Gestopt',
  'result.gestoptLeeg': 'Je hebt nog niets beantwoord. Stoppen mag.',
  'result.practiceMore': 'Deze komen nog terug',
  'result.home': 'Terug naar Vandaag',
  'result.stoppedEarly': 'Je stopte na {gedaan} van de {totaal} vragen.',
  'result.mapLabel': 'Kaart met wat nog terugkomt',
  // Geen kleur in de zin: de plekken dragen de kleur van het vak (ADR-238).
  'result.mapHelp': 'Deze komen nog terug.',
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
  'result.vandaagKlaarUitleg': 'Er komt vandaag niets meer terug. Stoppen mag.',
  'result.klaar': 'Klaar',
  'result.nieuwePlaatjes': 'Iets nieuws leren',
  // De regel van de diploma's (ADR-167): iets nieuws telt pas mee als je het op
  // een volgende dag weer goed weet.
  'result.nieuwePlaatjesUitleg':
    'Iets nieuws telt pas mee als je het op een andere dag weer goed hebt.',

  // Het cijfer, en alleen na een toetsstand. Elke ronde wordt geteld en elke
  // ronde komt met een cijfer in het logboek, maar een cijfer voor een ronde
  // waarin de app je na elke vraag het antwoord gaf zegt niets over jou.
  'result.markLabel': 'Cijfer',
  'result.markWhy': 'Zonder hulp onderweg, net als op school.',

  // Wat een ronde opleverde: een diploma (ADR-112). Alleen te zien als er echt
  // iets bij kwam. Geen "goed gedaan": het product zegt wat er gebeurd is, niet
  // wat je ervan moet vinden.
  'result.beloningTitle': 'Dit heb je gehaald',
  // De voorspelling (ADR-122), sinds ADR-192 alleen met een code. Dezelfde woorden als op
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
  'result.herhaalFouten': 'Oefen jouw fouten',

  // K10. Twee schakelaars in plaats van drie: de leesmodus verviel (ADR-025).
  // School en woonplaats staan er niet en komen er niet — dat zijn de twee
  // velden die een naam op een apparaat veranderen in een vindbaar kind.
  'you.title': 'Jij',
  // Onder de titel, in de kop die de etalage van premium is (ADR-150). Met de
  // naam erin, want wie je bent is het eerste wat Jij zegt (ADR-126), en in de
  // volgorde van de pagina eronder (ADR-172).
  'you.intro': 'Je oefent als {naam}. Hier staan je instellingen, je diploma’s en wat je beheerst.',
  // Zonder code (ADR-192): de cijfers staan er dan niet, en de zin belooft ze niet.
  'you.introZonderCode':
    'Je oefent als {naam}. Hieronder vind je je instellingen en jouw diploma’s.',
  // Zonder naam (ADR-229): dezelfde zinnen, zonder "Je oefent als".
  'you.introZonderNaam':
    'Hieronder vind je je instellingen, jouw diploma’s, welke stof je beheerst en hoe vaak je oefent.',
  'you.introZonderNaamZonderCode': 'Hieronder vind je je instellingen en jouw diploma’s.',
  // De naam wijzigen is een rij bij de instellingen (ADR-172): iets wat je bijna
  // nooit doet, en de naam zelf staat al in de kop.
  // De avatar (ADR-177). Acht vormen, want de kleuren van dit product zijn
  // bezet: groen is "goed", gearceerd rood is "fout", koraal is het merk en de
  // zes vakkleuren zeggen welk vak je voor je hebt. De echte tekeningen komen
  // later; de namen hieronder blijven dan staan.
  'you.avatar': 'Je avatar',
  'you.avatarGeen': 'Nog niet gekozen',
  'you.avatarKies': 'Kies je avatar',
  'avatar.groep.dieren': 'Dieren en dingen',
  'avatar.groep.helden': 'Monsters en helden',
  'avatar.zon': 'Zon',
  'avatar.wolk': 'Wolk',
  'avatar.bloem': 'Bloem',
  'avatar.vis': 'Vis',
  'avatar.raket': 'Raket',
  'avatar.kat': 'Kat',
  'avatar.robot': 'Robot',
  'avatar.boot': 'Boot',
  'avatar.beer': 'Beer',
  'avatar.bij': 'Bij',
  'avatar.draak': 'Draak',
  'avatar.ijsje': 'IJsje',
  'avatar.inktvis': 'Inktvis',
  'avatar.kikker': 'Kikker',
  'avatar.konijn': 'Konijn',
  'avatar.maan': 'Maan',
  'avatar.monster': 'Monster',
  'avatar.panda': 'Panda',
  'avatar.pinguin': 'Pinguïn',
  'avatar.planeet': 'Planeet',
  'avatar.ster': 'Ster',
  'avatar.ufo': 'Ufo',
  'avatar.uil': 'Uil',
  'avatar.vos': 'Vos',
  'avatar.brom': 'Brom',
  'avatar.drieoog': 'Drieoog',
  'avatar.fladder': 'Fladder',
  'avatar.flits': 'Flits',
  'avatar.hoorntje': 'Hoorntje',
  'avatar.ijzel': 'IJzel',
  'avatar.klauw': 'Klauw',
  'avatar.knobbel': 'Knobbel',
  'avatar.komeet': 'Komeet',
  'avatar.kracht': 'Kracht',
  'avatar.magneet': 'Magneet',
  'avatar.nova': 'Nova',
  'avatar.pluis': 'Pluis',
  'avatar.schaduw': 'Schaduw',
  'avatar.slijm': 'Slijm',
  'avatar.spook': 'Spook',
  'avatar.sprietje': 'Sprietje',
  'avatar.storm': 'Storm',
  'avatar.tandje': 'Tandje',
  'avatar.tornado': 'Tornado',
  'avatar.turbo': 'Turbo',
  'avatar.vampie': 'Vampie',
  'avatar.vonk': 'Vonk',
  'avatar.yeti': 'Yeti',

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
  // Zonder naam (ADR-229): de knop, met het poppetje, en wie er oefent in de lijst.
  'wisselaar.knopZonderNaam': 'Wissel van profiel',
  'wisselaar.zonderNaam': 'Nog zonder naam',
  // Bij een tweede kind krijgt het kind zonder naam er eerst een.
  'wisselaar.naamNu': 'Naam van wie hier al oefent',
  'wisselaar.titel': 'Wie gebruikt de app?',
  'wisselaar.oefentNu': 'oefent nu',
  'wisselaar.geefBeurt': 'Geef {naam} de beurt',
  'wisselaar.nogEenKind': 'Nog een kind erbij',
  'wisselaar.kindNaam': 'Naam van het kind',
  'wisselaar.voegToe': 'Toevoegen',
  'wisselaar.vol':
    'Er passen {aantal} kinderen op dit apparaat. Wil je er een kind bij? Haal dan eerst een kind weg op de ouderpagina.',
  'wisselaar.ouder': 'Ouderpagina',
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
  'you.weekNone': 'De laatste 7 dagen nog niet geoefend.',
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
  // Op de ouderpagina (ADR-173), dus over het kind en niet tegen het kind.
  'you.doelenWhy': 'Met premium kiest elk kind op Vandaag zelf wat het deze week wil halen.',
  'you.readAloudWhy': 'Je kunt elke vraag laten voorlezen.',
  'you.on': 'aan',
  'you.off': 'uit',
  'regio.eigen': 'Eigen woorden',
  'onderwerp.taal.eigen': 'Eigen woorden',
  'onderwerp.taal.eigen.uitleg': 'Woorden die je zelf hebt ingetypt',
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

  'module.terugVandaag': 'Hier komen vandaag {aantal} vragen terug.',
  'module.terugVandaagEen': 'Hier komt vandaag 1 vraag terug.',
  'module.terugMorgen': 'Hier komt vandaag niets terug. Morgen {aantal}.',
  'module.terugNiets': 'Hier komt voorlopig niets terug.',

  // De premiumpagina heeft het codeveld niet meer (ADR-173): een kind mag deze
  // pagina zien en een kind koopt niets. Wat ervoor in de plaats staat is de
  // weg naar de ouder, en die is één knop lang.
  'premium.codeBijOuder': 'Heb je een code? Die vullen je ouders in, op de ouderpagina.',
  'premium.ikBenOuder': 'Ik ben de ouder',
  'premium.afmeldenBijOuder': 'De code van dit apparaat halen doe je op de ouderpagina.',

  // De ouderpagina (ADR-173). De toon is die van een volwassene tegen een
  // volwassene: geen uitroeptekens, geen "leuk", en geen woord over het kind
  // dat het kind zelf niet zou mogen horen.
  //
  // De pincode wordt nergens een wachtwoord genoemd. Dat woord is van het
  // account dat in F3 komt, en twee woorden voor twee verschillende sloten is
  // precies wat er nodig is zodra ze allebei bestaan.
  'ouder.titel': 'Ouderpagina',
  'ouder.intro': 'Hoe het met je kinderen gaat, en wat je regelt.',
  // De ankers bovenaan (ADR-262).
  'ouder.opDezePagina': 'Op deze pagina',
  'ouder.terugNaarKind': 'Terug naar {naam}',

  'ouder.kinderen': 'Jouw kinderen',
  // Per kind achter een knop: naam, groep en weghalen (ADR-262).
  'ouder.wijzig': 'Wijzig',
  'ouder.wijzigKlaar': 'Klaar',
  'ouder.kindWijzig': '{naam} wijzigen',
  'ouder.naarPremiumcode': 'Naar de premiumcode',
  'ouder.kindNaam': 'Naam',
  'ouder.kindToevoegen': 'Toevoegen',
  'ouder.nogEenKind': 'Nog een kind erbij',
  'ouder.naamBewaren': 'Naam bewaren',
  'ouder.groepVan': 'De groep van {naam}',
  'ouder.inGroep': 'groep {groep}',
  'ouder.geenGroep': 'geen groep gekozen',
  'ouder.kinderenUitleg':
    'Ieder kind heeft een eigen voortgang. Wat de een oefent, telt niet mee voor de ander.',
  'ouder.kinderenVol':
    'Op dit apparaat staan al {aantal} kinderen. Wil je er een kind bij? Haal er dan eerst een weg.',
  'ouder.kindWeg': 'Haal {naam} van dit apparaat',
  'ouder.kindWegZeker':
    'Alles wat {naam} hier heeft geoefend, gaat weg: diploma’s, rondes en voortgang. Staat {naam} in je account, dan blijft het daar staan.',
  'ouder.kindWegDoe': 'Ja, haal {naam} weg',

  // Hoe het met je kinderen gaat (ADR-177). Dit stond op vier plekken beloofd
  // — in de poort, in de volwassenencheck, bij het zetten van de pincode en in
  // de rij van de wisselaar — en was er nergens. Per kind, want twee kinderen
  // optellen geeft een getal dat over niemand gaat.
  'ouder.hoeGaatHet': 'Hoe gaat het?',
  // Wat een kind wilde en waar het klaar voor was, zonder code (ADR-193).
  'ouder.wensKlaar': '{naam} is klaar voor de toets van {wat}. Die toets hoort bij premium.',
  'ouder.wensWil': '{naam} wilde dit graag doen, en daar is premium voor nodig:',
  'ouder.hoeGaatHetUitleg':
    'Per kind, over alle vakken bij elkaar. Per som en per woord kijk je op Jij, bij je kind zelf.',
  'ouder.kindNogNiets': '{naam} heeft nog niets geoefend.',
  // Een voorbeeld van wat premium hier laat zien (ADR-232), met een verzonnen
  // kind: nooit verzonnen cijfers bij het eigen kind.
  'ouder.voorbeeldLabel': 'Voorbeeld',
  'ouder.voorbeeldNaam': 'Sanne',
  // Over het kind in de derde persoon: de ouder leest dit, en "je" op deze
  // pagina is de ouder. Dezelfde vorm als op Jij, met de naam erin: "90 — kent
  // Fem inmiddels — van de 120 die Fem geoefend heeft".
  'ouder.kindKent': 'beheerst {naam} inmiddels',
  'ouder.kindKentVan': 'van de {aantal} die {naam} geoefend heeft',
  'ouder.kindDagEen': '{naam} oefende op 1 van de laatste 7 dagen.',
  'ouder.kindDagen': '{naam} oefende op {dagen} van de laatste 7 dagen.',
  // "Naar schatting", en de voorwaarde erbij. Het is een vergeetcurve met een
  // gekozen constante, en `retention.ts` verbiedt tekst die anders suggereert.
  // Op Jij is dit getal weg omdat een percentage groep 7-stof is; hier is de
  // lezer volwassen, en dit is de plek die ADR-177 ervoor aanwees.
  'ouder.kindSchatting':
    'Zonder oefenen is daar over drie weken naar schatting nog {procent}% van over.',

  'ouder.premium': 'Premiumcode',
  'ouder.premiumUit': 'Premium staat uit. Heb je een code gekocht? Vul hem dan hier in.',
  // Instellingen van de ouder (ADR-232).
  'ouder.sessie': 'De ouderpagina sluit na',
  'ouder.sessieRegel': 'Doe je zo lang niets, dan gaat de app terug naar je kind.',
  'ouder.sessieMinuten': '{aantal} minuten',
  'ouder.pinWijzigen': 'Pincode wijzigen',
  'ouder.pinWijzigenRegel': 'Kies een nieuwe pincode van vier cijfers.',
  'ouder.pinGewijzigd': 'Je nieuwe pincode is bewaard.',
  // De code op dit apparaat (ADR-232), om hem op een ander apparaat in te vullen.
  'ouder.jouwCode': 'Je code: {code}',
  'ouder.jouwCodeUitleg':
    'Vul deze code in op een ander apparaat om daar ook premium te gebruiken.',
  'ouder.premiumAlleKinderen': 'De code geldt voor 3 kinderen, op 3 apparaten.',
  // Een extra kind (ADR-230). Alleen hier, achter de pincode (R-11), en als
  // "binnenkort": de kassa verkoopt het nog niet, en er passen nu 3 kinderen op
  // een apparaat.
  'ouder.extraKind':
    'Meer dan 3 kinderen? Een extra kind kost {jaar} per jaar of {maand} per maand. Dat kan binnenkort.',
  'ouder.extraKindJaar': '€ 15',
  'ouder.extraKindMaand': '€ 2,50',
  'ouder.bekijkPremium': 'Wat zit er in premium?',
  // Deze week (ADR-227): wat het dagplan stil deed, per kind, vanaf 5 onderdelen.
  'ouder.week': 'Deze week',
  'ouder.weekGeoefend': '{naam} oefende deze week {aantal} verschillende vragen.',
  'ouder.weekPlan': 'Het plan zet ze {dagen} weer klaar om te herhalen.',
  'ouder.weekPlanPremium': 'Met premium zet het plan ze voor {naam} {dagen} klaar om te herhalen.',
  'ouder.weekAanbod':
    'Premium laat elke vraag terugkomen vlak voordat je kind hem vergeet. Zo blijft het in het hoofd.',
  'ouder.weekVandaag': 'vandaag',
  'ouder.weekMorgen': 'morgen',
  'ouder.weekEn': ' en ',
  // De geheugencheck (ADR-228): de uitslag, en zonder code het aanbod.
  'ouder.geheugencheck': 'Geheugencheck',
  'ouder.geheugencheckVan': 'goed, van de {gevraagd} vragen',
  'ouder.geheugencheckUitleg':
    'Op {datum} deed {naam} een ronde zonder hulp, met vragen die {naam} 3 tot 8 weken geleden voor het eerst oefende.',
  'ouder.geheugencheckUitlegOnderwerp':
    'Op {datum} deed {naam} een ronde zonder hulp, met vragen uit {onderwerp} die {naam} 3 tot 8 weken geleden voor het eerst oefende.',
  'ouder.geheugencheckAanbod':
    'Wat na een paar weken wegzakt, laat premium op tijd terugkomen. Zo blijft het in het hoofd.',
  'ouder.geheugencheckMetPremium':
    'Wat nog niet zit, zet het plan vanzelf weer klaar om te herhalen.',
  // Apparaten (ADR-226): welke apparaten de code gebruiken, en zelf vervangen.
  'ouder.apparaten': 'Apparaten',
  'ouder.apparatenDitMet': 'Dit apparaat heeft een plek op de code.',
  'ouder.apparatenDitZonder': 'Dit apparaat heeft nog geen plek op de code.',
  'ouder.apparatenUitleg':
    'Een apparaat krijgt pas een plek als een kind er premium op start. Een plek die 90 dagen niet gebruikt is, komt vanzelf vrij.',
  'ouder.apparatenBekijk': 'Bekijk de apparaten',
  'ouder.apparatenBezet': 'Er zijn {bezet} van de {plekken} plekken in gebruik.',
  'ouder.apparatenGeenPlek':
    'Er zijn {bezet} van de {plekken} plekken in gebruik. Welke apparaten dat zijn, zie je op een apparaat dat al een plek heeft. Daar kun je ook een plek vervangen.',
  'ouder.apparaatDit': '{naam} (dit apparaat)',
  'ouder.apparaatDatums': 'Sinds {sinds}, laatst gebruikt op {gezien}',
  'ouder.apparaatVervang': 'Vervangen',
  'ouder.apparaatVervangNaam': '{naam} vervangen',
  'ouder.apparaatVervangZeker':
    '{naam} gaat van de code af. Het volgende apparaat waarop een kind premium start, krijgt de plek.',
  'ouder.apparaatVervangJa': 'Ja, vervangen',
  'ouder.apparaatVervangNee': 'Annuleren',
  'ouder.apparaatVervangen':
    'De plek is vrij. Het volgende apparaat waarop een kind premium start, krijgt hem.',
  'ouder.apparatenOver': 'Je kunt nog {aantal} keer een plek vervangen in 12 maanden.',
  'ouder.apparatenGrens':
    'Je hebt in 12 maanden al 3 keer een plek vervangen. Mail naar {adres}, dan helpen we je verder.',
  'ouder.apparatenFout.anders': 'Dat lukte niet. Bekijk de apparaten nog een keer.',
  'apparaat.ipad': 'iPad',
  'apparaat.iphone': 'iPhone',
  'apparaat.android-tablet': 'Android-tablet',
  'apparaat.android-telefoon': 'Android-telefoon',
  'apparaat.chromebook': 'Chromebook',
  'apparaat.windows': 'Windows-computer',
  'apparaat.mac': 'Mac',
  'apparaat.linux': 'Linux-computer',
  'apparaat.onbekend': 'Apparaat',

  'ouder.instellingen': 'Pincode en instellingen',
  'ouder.instellingenUitleg':
    'Geluid, voorlezen en minder beweging staan bij het kind zelf, op Jij.',

  // Het slot. De zin over vergeten staat er meteen bij, want hem pas noemen op
  // het moment dat iemand hem kwijt is, is hem te laat noemen.
  'ouder.maakTitel': 'Maak een ouderpagina',
  'ouder.maakUitleg':
    'Maak je ouderpagina aan om de voortgang van je kind(eren) te zien. Kies een pincode zodat alleen jij hierbij kunt. Jouw kinderen hebben geen toegang tot je ouderpagina zonder jouw pincode.',
  'ouder.maakHulp':
    'Je pincode wordt alleen op dit apparaat opgeslagen. Raak je hem kwijt, dan kun je hier een nieuwe instellen.',
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
  // De kop boven het accountformulier, per deel (ADR-232).
  'ouder.inlogTitel': 'Log in met je ouderaccount',
  'ouder.inlogUitleg':
    'Heb je al een ouderaccount? Log dan in met je e-mailadres en wachtwoord. Daarna kies je een pincode voor dit apparaat.',
  'ouder.accountTitel': 'Maak een ouderaccount',
  'ouder.accountUitleg':
    'Maak een account met je e-mailadres. We sturen je een mail met een link. Klik op die link, dan kun je verder.',
  'ouder.herstelTitel': 'Wachtwoord vergeten',
  'ouder.herstelKopUitleg':
    'Vul je e-mailadres in. We sturen je een mail om een nieuw wachtwoord te kiezen.',
  'ouder.accountHulp':
    'Zo weten we dat er een volwassene meekijkt. En raak je later je pincode kwijt, dan kom je er met dit account overal weer in — niet alleen op dit apparaat.',

  // Opnieuw om het wachtwoord vragen, ook als er al iemand ingelogd is
  // (ADR-178). Een sessie blijft maanden staan op een apparaat dat het hele
  // gezin gebruikt, en dan zegt hij niets meer over wie er nu voor staat.
  'ouder.bevestigTitel': 'Ben jij het?',
  'ouder.bevestigUitleg':
    'Je bent ingelogd als {email}. Typ je wachtwoord nog een keer, dan weten we zeker dat jij het bent en niet iemand anders op dit apparaat.',
  'ouder.bevestigVeld': 'Je wachtwoord',
  'ouder.bevestigKnop': 'Verder',
  'ouder.bevestigHulp': 'Dit vragen we alleen als je een pincode instelt of vervangt. Verder niet.',

  // De volwassenencheck vóór het zetten of resetten van de pincode (ADR-176).
  // Geen rekensom: dit product leert kinderen tafels, dus dat zou de poort zijn
  // die de app zelf traint om te openen. Het jaartal wordt gecontroleerd en
  // weggegooid, en de hulpregel zegt dat — een ouder die dit product om zijn
  // privacy koos, hoort niet te moeten raden.
  'ouder.checkTitel': 'Ben je een volwassene?',
  // De deur voor de premiumpagina (ADR-232): alleen voor een ouder.
  'premium.poortTitel': 'Deze pagina is voor ouders',
  'premium.poortUitleg':
    'Hier staat wat premium is en wat het kost. Ben je een ouder? Vul dan je geboortejaar in.',
  'premium.poortTerug': 'Terug naar Vandaag',
  'ouder.checkUitleg':
    'Hierachter staan de instellingen, premium en hoe het met je kinderen gaat. Dat is niet voor kinderen.',
  'ouder.checkVraag': 'In welk jaar ben je geboren?',
  'ouder.checkKnop': 'Verder',
  'ouder.checkFout': 'Dat klopt niet. Haal er even je ouders bij.',
  'ouder.checkHulp':
    'We controleren het alleen. Je geboortejaar wordt nergens bewaard en gaat nergens heen.',
  'ouder.fout.geenCijfers': 'Een pincode is vier cijfers.',
  'ouder.fout.ongelijk': 'De twee pincodes zijn niet hetzelfde. Probeer het nog eens.',
  'ouder.fout.onjuist': 'Dat is niet de pincode van dit apparaat.',
  'ouder.fout.teVaak':
    'Drie keer een foute pincode. Probeer het over {seconden} seconden nog eens.',
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
    'Met een account staat wat je kinderen oefenen niet alleen op dit apparaat, maar ook op je andere apparaten. Zonder account werkt alles gewoon zoals je gewend bent.',
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
  // Herschreven (ADR-232): eerst wat het oplevert, dan wat het doet.
  'overname.titel': 'Voortgang bewaren in je account',
  'overname.uitleg':
    'Zet een kind in je account. Dan wordt wat het oefent ook op onze server bewaard. Zo raak je niets kwijt als dit apparaat stuk of leeg raakt, en kan je kind op een ander apparaat verder. Na elke ronde wordt het bijgewerkt.',
  'overname.en': 'en',
  'overname.hierEen': '{namen} oefent op dit apparaat, maar staat nog niet in je account.',
  'overname.hierMeer': '{namen} oefenen op dit apparaat, maar staan nog niet in je account.',
  'overname.wie': 'Welke kinderen zet je in je account?',
  'overname.toestemmingUitleg':
    'Op onze server, binnen de EU, komt dan te staan: de voornaam, de groep, de antwoorden, de diploma’s en de doelen. Niets anders, en we delen het met niemand. Je kunt een kind altijd weer uit je account halen. Dan verdwijnt alles van dat kind van de server, en blijft het op dit apparaat staan.',
  'overname.toestemming': 'Ik ben de ouder of voogd, en ik geef toestemming.',
  'overname.knop': 'Zet in mijn account',
  'overname.bezig': 'Bezig met {naam}…',
  'overname.nietVerstuurd': 'Staat in je account, maar nog niet alles is verstuurd.',
  'overname.verstuurd': 'Staat in je account. Bijgewerkt op {datum}.',
  'overname.opnieuw': 'Verstuur opnieuw',
  'overname.haalWeg': 'Uit mijn account halen',
  'overname.haalWegVraag':
    'Alles van {naam} verdwijnt dan van onze server. Op dit apparaat blijft het gewoon staan.',
  'overname.haalWegJa': 'Ja, haal weg',
  'overname.haalWegNee': 'Toch niet',
  'overname.alleenDaarTitel': 'In je account, maar niet op dit apparaat',
  'overname.nietHier': 'In je account, maar niet op dit apparaat.',
  'overname.zetHier': 'Zet {naam} op dit apparaat',
  'overname.ofKoppel':
    'Oefent {naam} op dit apparaat al, misschien onder een andere naam? Kies dan die naam. Dan voegen we alles samen tot één kind.',
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
  'inlog.terug': 'Laat maar',
  'inlog.uitleg':
    'Je ouders hebben een code en een wachtwoord voor je. Daarmee oefen je hier verder waar je gebleven was.',
  'inlog.code': 'Inlogcode',
  'inlog.codeVoorbeeld': 'KIND-XXXX-XXXX',
  'inlog.wachtwoord': 'Wachtwoord',
  'inlog.verder': 'Inloggen',
  'inlog.fout.onjuist': 'Deze code en dit wachtwoord horen niet bij elkaar.',
  'inlog.fout.te-vaak': 'Probeer het over een uur nog eens, of vraag het je ouders.',
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
  'you.geluidWhy': 'Een korte toon als het goed is, een zachte als het niet klopt.',
  // Vijf geluiden om uit te kiezen (ADR-247). Een druk laat hem horen.
  'you.klank': 'Welk geluid?',
  'you.klankUitleg': 'Druk op een geluid, dan hoor je het.',
  'klank.belletje': 'Belletje',
  'klank.xylofoon': 'Xylofoon',
  'klank.fluitje': 'Fluitje',
  'klank.robot': 'Robot',
  'klank.druppel': 'Druppel',
  // Twee schakelaars erbij (ADR-145), allebei voor een kind dat snel afgeleid is.
  'you.rustig': 'Minder beweging',
  'you.rustigWhy':
    'Knoppen, kaarten en beloningen bewegen niet meer. Rustiger voor wie snel afgeleid is.',

  // Onder een diploma, in woorden: "nog niet" is nooit alleen een tint.
  'diploma.gehaald': 'Gehaald',
  'diploma.nogNiet': 'Nog niet',
  // Rijp: de pagina is ver genoeg om af te zwemmen (ADR-141, ADR-149).
  // Zonder code: klaar voor de toets, en die hoort bij premium (ADR-192).
  // Zonder het woord premium (ADR-232): een ring ziet het kind.
  'diploma.rijpMetPremium': 'Klaar voor de toets',
  'diploma.rijp': 'Klaar voor de toets',

  // Wat er onder een diplomakaart staat, per stand. Vijf zinnen, en nooit een
  // telling die nul is: een kop die de afwezigheid uitrekent, is wat "je hebt
  // niets" letterlijk op het scherm zet.
  'diploma.gehaaldOp': 'Gehaald op {datum}',
  'diploma.onthoudt': 'Je beheerst er {bewezen} van de {totaal}.',
  // De eerste twee dagen kan er niets in de ring staan: een onderdeel telt pas
  // mee na drie goede antwoorden op drie dagen. In het grote diploma staat de
  // regel dan voluit — daar gaat het over één diploma. Op een kaart staat
  // alleen `diploma.nogNiet`: twaalf keer dezelfde zin onder elkaar is geen
  // uitleg maar een muur, en de kaarten verdwijnen erin.
  'diploma.nogNiets': 'Je beheerst hier nog niets. Dat lukt na drie keer goed, op drie dagen.',
  // De ring telt wat ooit bewezen is, de lat telt wat vers is. Na ruim twee
  // weken weg lopen die uiteen, en dan staat dit er.
  'diploma.opfrissen': 'Herhaal even wat je bijna vergeten bent. Dan mag je de toets doen.',

  // Het grote diploma, geopend vanuit de kast. Eén knop die van woord verandert
  // en niet van plek — de regel van ADR-141, hier op een tweede scherm.
  'diploma.openLabel': 'Bekijk je diploma: {naam}',
  'diploma.oefen': 'Ga oefenen',
  'diploma.toets': 'Doe de toets',
  'diploma.bekijk': 'Bekijk',
  'diploma.terug': 'Terug',
  'diploma.gehaaldKop': 'Gehaald!',
  // Het diploma, groot (ADR-218): liggend, met van wie, waarvoor en wat je kunt.
  'diploma.bijna': 'Bijna!',
  'diploma.isVan': 'Dit diploma is van',
  'diploma.wordtVan': 'Dit wordt het diploma van',
  'diploma.vanTotaal': 'van {totaal}',
  'diploma.score': '{goed} van {totaal} goed',
  'diploma.beheers': '{bewezen} van {totaal} beheers je',
  'diploma.nogTeGaan': 'Nog {aantal} te gaan. Dan mag je de toets doen, en kleurt dit diploma in.',
  'diploma.datum': 'Datum',
  'diploma.handtekening': 'Handtekening van papa, mama, juf of meester',
  'diploma.uitleg.topo': 'Je vindt ze allemaal zonder hulp op de kaart.',
  'diploma.uitleg.tafels': 'Je rekent ze allemaal uit je hoofd.',
  'diploma.uitleg.klok': 'Je leest de klok zonder hulp.',
  'diploma.uitleg.vlaggen': 'Je herkent de vlaggen, ook de lastige.',
  'diploma.uitleg.spelling': 'Je schrijft de woorden zonder hulp goed.',
  'diploma.uitleg.werkwoorden': 'Je schrijft elk werkwoord in de goede vorm.',
  'diploma.uitleg.engels': 'Je schrijft de woorden zonder hulp in het Engels.',
  'diploma.uitleg.tijdvakken': 'Je zet de tijdvakken zonder hulp op volgorde.',
  // Per diploma wat je kunt als je hem haalt (ADR-219), zoals het herontwerp het vroeg.
  'diploma.zin.nl-provincies': 'Je wijst alle twaalf provincies van Nederland zo aan op de kaart.',
  'diploma.zin.nl-hoofdsteden': 'Je wijst bij elke provincie de hoofdstad aan op de kaart.',
  'diploma.zin.nl-waddeneilanden':
    'Je wijst de vijf Waddeneilanden aan, van Texel tot Schiermonnikoog.',
  'diploma.zin.nl-wateren': 'Je vindt de zeeën en meren van Nederland zo op de kaart.',
  'diploma.zin.nl-steden': 'Je wijst tachtig steden van Nederland aan op de kaart.',
  'diploma.zin.europa-landen': 'Je wijst alle landen van Europa aan, ook de kleine.',
  'diploma.zin.afrika-landen': 'Je vindt alle landen van Afrika op de kaart.',
  'diploma.zin.azie-landen': 'Je vindt alle landen van Azië op de kaart.',
  'diploma.zin.noord-amerika-landen': 'Je vindt de landen van Noord-Amerika, ook de eilanden.',
  'diploma.zin.zuid-amerika-landen': 'Je wijst alle landen van Zuid-Amerika aan op de kaart.',
  'diploma.zin.oceanie-landen': 'Je vindt de landen van Oceanië, van Australië tot Fiji.',
  'diploma.zin.wereld-landen': 'Je vindt de landen van de hele wereld op de kaart.',
  'diploma.zin.tafel-1': 'Je rekent de hele tafel van 1 uit je hoofd.',
  'diploma.zin.tafel-2': 'Je rekent de hele tafel van 2 uit je hoofd. Ook 7 × 2.',
  'diploma.zin.tafel-3': 'Je rekent de hele tafel van 3 uit je hoofd. Ook 7 × 3.',
  'diploma.zin.tafel-4': 'Je rekent de hele tafel van 4 uit je hoofd. Ook 8 × 4.',
  'diploma.zin.tafel-5': 'Je rekent de hele tafel van 5 uit je hoofd. Ook 9 × 5.',
  'diploma.zin.tafel-6': 'Je rekent de hele tafel van 6 uit je hoofd. Ook 7 × 6.',
  'diploma.zin.tafel-7': 'Je rekent de hele tafel van 7 uit je hoofd. Ook 7 × 8.',
  'diploma.zin.tafel-8': 'Je rekent de hele tafel van 8 uit je hoofd. Ook 6 × 8.',
  'diploma.zin.tafel-9': 'Je rekent de hele tafel van 9 uit je hoofd. Ook 7 × 9.',
  'diploma.zin.tafel-10': 'Je rekent de hele tafel van 10 uit je hoofd.',
  'diploma.zin.tafel-11': 'Je rekent de hele tafel van 11 uit je hoofd. Ook 12 × 11.',
  'diploma.zin.tafel-12': 'Je rekent de hele tafel van 12 uit je hoofd. Ook 7 × 12.',
  'diploma.zin.keer-100': 'Je rekent keersommen tot 100 uit je hoofd.',
  'diploma.zin.keer-1000': 'Je rekent keersommen tot 1000 uit je hoofd.',
  'diploma.zin.delen-10': 'Je rekent deelsommen tot 10 uit je hoofd.',
  'diploma.zin.delen-100': 'Je rekent deelsommen tot 100, zoals 56 : 7.',
  'diploma.zin.delen-1000': 'Je rekent deelsommen tot 1000 uit je hoofd.',
  'diploma.zin.plus-20': 'Je rekent plussommen tot 20 uit je hoofd.',
  'diploma.zin.plus-100': 'Je rekent plussommen tot 100, ook over het tiental heen.',
  'diploma.zin.plus-1000': 'Je rekent plussommen tot 1000 uit je hoofd.',
  'diploma.zin.min-20': 'Je rekent minsommen tot 20 uit je hoofd.',
  'diploma.zin.min-100': 'Je rekent minsommen tot 100, ook over het tiental heen.',
  'diploma.zin.min-1000': 'Je rekent minsommen tot 1000 uit je hoofd.',
  'diploma.zin.splitsen-10': 'Je splitst elk getal tot 10 zo in twee.',
  'diploma.zin.splitsen-20': 'Je splitst elk getal tot 20 zo in twee.',
  'diploma.zin.splitsen-100': 'Je splitst elk getal tot 100 zo in twee.',
  'diploma.zin.halveren-20': 'Je halveert elk even getal tot 20 uit je hoofd.',
  'diploma.zin.halveren-100': 'Je halveert getallen tot 100 uit je hoofd.',
  'diploma.zin.halveren-1000': 'Je halveert getallen tot 1000, zoals de helft van 136.',
  'diploma.zin.verdubbelen-20': 'Je verdubbelt getallen tot 10 uit je hoofd.',
  'diploma.zin.verdubbelen-100': 'Je verdubbelt getallen tot 50 uit je hoofd.',
  'diploma.zin.verdubbelen-1000': 'Je verdubbelt getallen tot 500, zoals het dubbele van 68.',
  'diploma.zin.klok-heel': 'Je leest elke hele klok, van één uur tot twaalf uur.',
  'diploma.zin.klok-half': 'Je leest elke halve klok. En je weet: half acht is half vóór acht.',
  'diploma.zin.klok-kwart': 'Je leest kwart over en kwart voor, op elke klok.',
  'diploma.zin.klok-vijf': 'Je leest de klok op vijf minuten, zoals vijf voor half drie.',
  // De digitale klok (ADR-257): je schrijft de tijd in cijfers.
  'diploma.zin.klok-dig-heel': 'Je schrijft elk heel uur in cijfers, zoals 7:00.',
  'diploma.zin.klok-dig-half': 'Je schrijft elk half uur in cijfers. Half acht is 7:30.',
  'diploma.zin.klok-dig-kwart': 'Je schrijft kwart over en kwart voor in cijfers, zoals 6:45.',
  'diploma.zin.klok-dig-vijf':
    'Je schrijft elke tijd in cijfers, zoals 2:25 voor vijf voor half drie.',
  'diploma.zin.vlag-nederland-provincies': 'Je herkent de vlaggen van alle twaalf provincies.',
  'diploma.zin.vlag-afrika-alle': 'Je herkent alle vlaggen van Afrika, ook de lastige.',
  'diploma.zin.vlag-azie-alle': 'Je herkent alle vlaggen van Azië, ook de lastige.',
  'diploma.zin.vlag-europa-alle': 'Je herkent alle vlaggen van Europa, ook de lastige.',
  'diploma.zin.vlag-noord-amerika-alle':
    'Je herkent alle vlaggen van Noord-Amerika, ook van de eilanden.',
  'diploma.zin.vlag-zuid-amerika-alle': 'Je herkent alle vlaggen van Zuid-Amerika.',
  'diploma.zin.vlag-oceanie-alle': 'Je herkent alle vlaggen van Oceanië, ook van de eilanden.',
  'diploma.zin.vlag-wereld-alle': 'Je herkent de vlaggen van de hele wereld.',
  'diploma.zin.taal-sp-eiij': 'Je weet wanneer je ei schrijft en wanneer ij.',
  'diploma.zin.taal-sp-auou': 'Je weet wanneer je au schrijft en wanneer ou.',
  'diploma.zin.taal-sp-gch': 'Je weet wanneer je g schrijft en wanneer ch.',
  'diploma.zin.taal-sp-ck': 'Je weet wanneer je c schrijft en wanneer k.',
  'diploma.zin.taal-sp-dt': 'Je hoort of het d of t is: maak het woord langer.',
  'diploma.zin.taal-sp-klinkers': 'Je schrijft één of twee klinkers, zoals bomen en straten.',
  'diploma.zin.taal-sp-medeklinkers':
    'Je schrijft één of twee medeklinkers, zoals katten en kippen.',
  'diploma.zin.taal-sp-verkleinwoorden': 'Je schrijft elk verkleinwoord goed: -je, -tje of -pje.',
  'diploma.zin.taal-sp-ig': 'Je schrijft woorden op -ig goed, zoals gelukkig.',
  'diploma.zin.taal-sp-lijk': 'Je schrijft woorden op -lijk goed, zoals vrolijk.',
  'diploma.zin.taal-ww-tt': 'Je schrijft de tegenwoordige tijd goed: ik word, hij wordt.',
  'diploma.zin.taal-ww-vt': 'Je schrijft de verleden tijd goed, met ’t kofschip.',
  'diploma.zin.taal-ww-vd': 'Je schrijft het voltooid deelwoord goed: gefietst, geleefd.',
  'diploma.zin.taal-en-getallen': 'Je schrijft de getallen in het Engels, van one tot hundred.',
  'diploma.zin.taal-en-dagen': 'Je schrijft de dagen en maanden in het Engels.',
  'diploma.zin.taal-en-kleuren': 'Je schrijft de kleuren in het Engels, van red tot purple.',
  'diploma.zin.taal-en-kleding': 'Je schrijft kleren in het Engels, van coat tot scarf.',
  'diploma.zin.taal-en-familie': 'Je schrijft je familie in het Engels: mother, father, sister.',
  'diploma.zin.taal-en-lichaam': 'Je schrijft je lichaam in het Engels, van head tot toe.',
  'diploma.zin.taal-en-dieren': 'Je schrijft de dieren in het Engels, van dog tot frog.',
  'diploma.zin.taal-en-eten': 'Je schrijft eten en drinken in het Engels.',
  'diploma.zin.taal-en-huis': 'Je schrijft wat er in huis is in het Engels.',
  'diploma.zin.taal-en-school': 'Je schrijft wat je op school ziet in het Engels.',
  'diploma.zin.taal-en-werkwoorden': 'Je schrijft werkwoorden in het Engels: walk, run, swim.',
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
    'Ga oefenen. Je beheerst iets pas als je het drie keer goed hebt, op drie verschillende dagen.',
  'you.diplomaStap3':
    'De ring om het diploma laat zien hoe ver je bent. Die ring loopt nooit terug, ook niet als je een keer iets fout hebt.',
  'you.diplomaStap4':
    'Is de ring helemaal vol? Dan mag je de toets doen. De toets hoort bij premium.',
  'you.diplomaStap5':
    'Haal je de toets? Dan is het diploma van jou. Het blijft altijd van jou, en je kunt het uitprinten.',

  // De diplomakast op Jij: alle diploma's, één vak open en de rest als regel.
  'kast.titel': 'Jouw diploma’s',
  // In het venster van een diploma dat je nog niet kunt halen (ADR-232). Voor
  // het kind, dus zonder het woord premium (R-11).
  'diploma.opSlot': 'Een diploma haal je met een toets. Die kunnen je ouders voor je openzetten.',
  'diploma.opSlotKlaar': 'Je bent klaar voor de toets! Je ouders kunnen hem voor je openzetten.',
  'kast.stand': '{aantal} van de {totaal} gehaald.',
  'kast.leeg': 'Hier staan jouw diploma’s. Klik op een diploma om te zien hoe je het kunt halen.',
  'kast.vakAantal': '{aantal} diploma’s',

  // Reisstempels. Elk criterium staat erbij, want een stempel die je niet kunt
  // uitleggen is een raadsel in plaats van een beloning — en een kind dat niet
  // weet waarvoor het er een kreeg, kan er ook niet nog een verdienen.
  //
  // "Op weg", voor je eerste ronde, bestaat niet meer: een stempel is er voor
  // wat je onthoudt, nooit voor meedoen alleen (ADR-040).
  // De naam, gevraagd waar hij iets doet (ADR-229): na de eerste ronde op
  // Vandaag, op Jij, vóór de toets en op de ouderpagina. Nooit meer vooraf.
  // Zonder uitleg eronder (ADR-247): de vraag is duidelijk genoeg, en "niet
  // naar onze server" klopt niet meer voor een kind in een gezinsaccount.
  'naam.titel': 'Hoe heet je?',
  'naam.toets.titel': 'Welke naam komt op je diploma?',
  'naam.veld': 'Je naam',
  'naam.bewaar': 'Bewaren',
  'naam.teKort': 'Typ eerst je naam.',
  'naam.nietNu': 'Niet nu',
  // Op de ouderpagina: tegen de ouder, over het kind (ADR-198).
  'naam.ouder.titel': 'Hoe heet je kind?',
  'naam.ouder.uitleg':
    'Deze pagina gaat over je kind. De naam blijft op dit apparaat en gaat niet naar onze server.',
  'naam.ouder.veld': 'Naam van je kind',
  'naam.ouder.bewaar': 'Verder',
  'naam.ouder.teKort': 'Typ eerst de naam van je kind.',
  // Op Vandaag, zolang er geen naam is: naar de pagina voor ouders (ADR-214).
  'naam.ikBenOuder': 'Ik ben een ouder',

  // De groep (ADR-151). Op Jij, bij de instellingen, bij de ouder, en sinds
  // ADR-243 weer op Vandaag, bovenaan voor een kind dat nog niets deed. De
  // vraag is ook de naam van de rij knoppen voor een schermlezer.
  'groep.vraag': 'In welke groep zit je?',
  'groep.knop': 'Groep {groep}',
  // Op Jij, in de woorden van het kind (ADR-171), als rij bij de instellingen
  // die de knoppen opent (ADR-172). Met wat er op 1 augustus gebeurt, want dat
  // doet de app zonder te vragen.
  'groep.jijTitel': 'Je groep',
  'groep.rijGeen': 'Geen groep gekozen',
  'groep.jijUitleg':
    'Wat bij je groep past, staat bovenaan op Vandaag en op elke vakpagina. Wat bij een andere groep hoort, kun je ook kiezen. Op 1 augustus ga je vanzelf een groep verder.',
  'groep.geen': 'Geen groep',
  // Op Vandaag, bij de vraag naar de groep (ADR-243).
  'groep.weetNiet': 'Weet ik niet',
  'groep.gekozen': 'Je zit in groep {groep}.',
  'groep.nietGekozen': 'Je hebt geen groep gekozen. Dan staat alles in de gewone volgorde.',
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
  'wissen.titel': 'Alles wissen',
  'wissen.uitleg':
    'Wat je kinderen hier oefenen, staat op dit apparaat en nergens anders. Hier haal je het er weer af.',
  'wissen.knop': 'Alles wissen',
  'wissen.zeker': 'Dit verdwijnt dan van dit apparaat:',
  'wissen.watVoortgang':
    'Van elk kind op dit apparaat: de naam, wat het geoefend heeft en de diploma’s.',
  'wissen.watCode':
    'De premiumcode. Die kun je daarna opnieuw invullen. Dit apparaat telt dan niet meer mee bij de drie apparaten van de code.',
  'wissen.onomkeerbaar': 'Je kunt dit niet terugdraaien.',
  'wissen.typLabel': 'Typ {woord} om te bevestigen',
  'wissen.typWoord': 'WISSEN',
  'wissen.laatMaar': 'Laat maar staan',
  'wissen.bezig': 'Bezig met wissen…',

  // Als er iets kapotgaat (ADR-166). Een zin en twee knoppen, geen
  // foutmelding: de tekst van een uitzondering zegt een kind niets en een
  // ouder bijna niets. En meteen de geruststelling die het eerst nodig is.
  'fout.titel': 'Er ging iets mis',
  'fout.uitleg':
    'Dit scherm deed het even niet. Probeer het nog een keer, of ga terug naar Vandaag.',
  'fout.bewaard': 'Alles wat je geoefend hebt, staat er nog. Je bent niets kwijt.',
  'fout.opnieuw': 'Probeer opnieuw',
  'fout.naarBegin': 'Terug naar Vandaag',

  // Accessible names for things that have no visible label of their own
  'a11y.progress': 'Voortgang in deze ronde',
} as const;
