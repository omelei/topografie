# De ouder en het kind, opnieuw — voorstel

**Status:** goedgekeurd op alle vijf de vragen uit §16. Stap 1 van §14 is gebouwd als ADR-173,
stap 2 als ADR-174 en het eerste deel van stap 3 als ADR-175 (2026-09-21); de overname zelf en
stap 4 staan nog open. Wat bij het bouwen anders uitviel, staat in §17. **Datum:** 2026-09-21. **Codebasis:** `origin/main` 38cace9 (na #101).

**Opdracht van de eigenaar:** de verhouding tussen kind en ouder steekt niet goed in elkaar; er moet
weer een ouderpagina komen, met een wachtwoord, profielwissel tussen maximaal drie kinderen en één
ouder, premium dat de ouder koopt en voor alle kinderen geldt, en een weg voor het kind dat al
oefent voor er ooit een ouder bij was. **Alle eerdere besluiten mogen los.**

Elke bewering draagt een label:

- **[feit]** met codeplek of bron;
- **[aanname]** niet gemeten, wel beredeneerd;
- **[hypothese]** te toetsen door het aan echte gezinnen voor te leggen.

Dit voorstel draait vier eerdere besluiten geheel of gedeeltelijk om. Ze staan met naam en toenaam
in §12, zodat de volgende lezer ziet dat het weloverwogen gebeurde.

---

## 1. De maatstaf

Er zijn in dit product drie lezers, en ze hebben elk één vraag. Die drie zinnen zijn de toets voor
elk blok en elk scherm hieronder.

> **Kind (6–12):** wat doe ik nu, en wat heb ik bereikt? · **Ouder:** gaat het goed, en wat kost
> het? · **Gezin:** van wie is dit, en waar staat het?

De fout van vandaag is dat het product twee lezers heeft en één soort profiel. Alles wat van de
ouder is, is de afgelopen drie ADR's heen en weer geschoven — naar Voor ouders (ADR-136), terug naar
Jij (ADR-171), en daarna onderaan Premium (ADR-172) — omdat er geen plek was waar het thuishoort.
Niet de indeling was fout; de aanname eronder was fout. Die aanname stond letterlijk in ADR-171:

> **Ouders loggen niet in, kinderen wel.** Voor ouders was een pagina voor een lezer die in deze app
> niet bestaat.

Die zin is de wortel. Alles hieronder volgt uit het omdraaien ervan.

## 2. De diagnose: zeven dingen die nu niet kloppen

1. **Meerdere kinderen zit áchter premium.** Het blok "Wie oefent er?" tekent niets zonder code
   [feit] `ProfileScreen.tsx:405` (`if (!actief) return null`). De eigenaar vraagt nu: drie
   kinderen per apparaat, en de ouder koopt één code die voor alle drie geldt. Dat is frontaal in
   strijd: het gezin moet betalen om te kunnen zien wat er te betalen valt. Dit is de scherpste van
   de zeven en hij is op zichzelf al een reden om te herzien.
2. **Er is geen ouder om iets aan te hangen.** `AccountBlok` is het enige stukje ouder in de app, het
   staat onderaan Premium, en zonder gezinsproject tekent het niets [feit] `AccountBlok.tsx:50`
   (`if (!ingesteld) return null`). Inloggen levert vandaag dus niets op waar je daarna iets mee
   kunt: geen pagina, geen extra rechten, geen kinderen.
3. **Het slot in het kinderscherm is de enige plek waar premium binnenkomt.** `OuderVraag` en het
   codeveld staan voor het kind, met de bedoeling dat er een ouder over de schouder meekijkt
   (ADR-163) [feit] `OuderVraag.tsx`. De eigenaar zegt nu: kinderen kunnen dat niet. Dan moet het
   veld ergens ánders óók staan, en dat is er niet.
4. **Premium hangt aan een apparaat, niet aan een gezin.** De code plus een verzonnen apparaatnummer
   gaan naar de server, het antwoord staat in `localStorage`, en drie apparaten is de grens [feit]
   `store/premium.ts:1-30`, ADR-116. Een ouder die op zijn telefoon koopt, heeft daarmee niets op de
   iPad van het kind gedaan. Precies het geval uit de brief.
5. **Het kind logt in en de ouder niet.** ADR-155 gaf het kind een inlogcode van acht tekens én een
   eigen wachtwoord, elke keer als het wil oefenen. Op het gedeelde gezinsapparaat is dat de
   zwaarste poort van het hele product voor de gebruiker die er het minst mee kan [aanname], en
   Squla, Netflix en Khan Academy Kids doen het geen van drieën zo (§3).
6. **Er is geen weg van "kind oefent al" naar "ouder doet mee".** ADR-155 schreef met zoveel
   woorden: "Er komt geen migratie, en dat is een keuze" — omdat er toen nog geen kinderen waren.
   De brief maakt van dat geval juist de hoofdweg. Zonder overname raakt een kind bij het aanmaken
   van het account alles kwijt wat het al gehaald had, en dat is het ergste wat dit product kan doen
   [aanname, maar met de diploma's sinds ADR-167 als het hele beloningsprogramma is er weinig aan
   te twijfelen].
7. **Het kind kan zichzelf uitloggen uit zijn eigen instellingen.** Alles staat op Jij: de naam, de
   groep, de eigen woorden, de weekdoelen, én "Alles van dit apparaat halen" [feit]
   `ProfileScreen.tsx`, ADR-172 punt 10. Een kind van zeven dat rondtikt, kan de voortgang van zijn
   broer wissen. Er is geen slot voor.

## 3. Wat vergelijkbare producten doen

**Squla (NL, de directe concurrent) doet precies wat de eigenaar vraagt** [feit]. Een ouderaccount
op e-mailadres, een knop "Wissel van profiel", en — letterlijk — "Wil je vanuit het inlogscherm naar
het ouderaccount? Klik hiervoor op de gele knop 'Naar ouderaccount' en gebruik opnieuw je
wachtwoord." Lidmaatschap, een extra kind aanmelden en opzeggen zitten allemaal in het ouderaccount.
Het kindaccount heeft een eigen, lichtere inlog.

**Khan Academy scheidt de twee net zo** [feit]: een Parent Dashboard is de hub van de ouder, en
"Add a Child" kan een nieuw kind maken **of koppelen aan een bestaand account van het kind**. Khan
Academy Kids (de jongste doelgroep, 2–8) heeft geen kinderinlog maar een ouderdeel in de app met de
instellingen erin.

**Apple maakt het een eis, geen smaak** [feit]. Apps in de Kids Category mogen geen aankoop, geen
link naar buiten en geen andere afleiding tonen "unless reserved for a designated area behind a
parental gate". Google Play stelt in Designed for Families dezelfde eis. Dat betekent: **het slot
dat een kind indrukt, mág geen verkooppagina zijn** — precies wat ADR-163 op eigen kracht al
concludeerde — en de weg naar de kassa hoort achter iets wat een kind niet passeert.

**Duolingo laat de bon en het account los van elkaar staan** [feit]: een code wissel je in op
`duolingo.com/redeem`, en je logt daarbij in op een bestaand account of maakt er een. Het Family
Plan werkt met een uitnodigingslink die een bestaand account opneemt. De code is dus een **bon**,
geen sleutel: je wisselt hem één keer in voor een recht dat daarna aan het account hangt.

**Netflix is het model voor de wisselaar** [feit, algemeen bekend]: profielen op het toestel, een
slotje op het profiel dat beschermd is, en een pincode van vier cijfers in plaats van het
wachtwoord van het account.

Vier lessen, en alle vier gaan ze rechtstreeks het voorstel in:

1. De ouder is een **profiel met een eigen pagina**, niet een instelling in het kinderscherm.
2. De dagelijkse poort naar de ouder is een **korte code**, niet het accountwachtwoord.
3. De aankoopcode is een **bon voor een gezin**, niet een sleutel voor een apparaat.
4. Het kind hoeft op het eigen apparaat **niet in te loggen**.

## 4. Het voorstel in één plaat

**Drie soorten profielen op een apparaat.**

| Profiel    | Hoeveel        | Poort                       | Wat het ziet                                 |
| ---------- | -------------- | --------------------------- | -------------------------------------------- |
| Kind       | 0–3            | geen: tik op je naam        | Vandaag, Jij, en zijn oefeningen             |
| Ouder      | 0 of 1         | ouderpin, anders wachtwoord | Ouderpagina: kinderen, premium, cijfers      |
| (bezoeker) | de eerste keer | geen                        | het naamscherm, of meteen "Ik ben een ouder" |

**Drie standen van een apparaat.** Dit is de kern: het gezin hoeft nergens te beginnen en kan op elk
moment een stap opschuiven, zonder iets kwijt te raken.

| Stand                 | Wat er is                                       | Premium                   | Server    |
| --------------------- | ----------------------------------------------- | ------------------------- | --------- |
| **A. Los**            | 1–3 kinderen, lokaal. Geen ouder, geen account. | Code op dít apparaat (nu) | niets     |
| **B. Gekoppeld**      | Dezelfde kinderen, plus een ouderprofiel        | Van het gezin, overal     | voortgang |
| **C. Tweede toestel** | Ouder logt in, of kind komt met zijn code       | Van het gezin, overal     | voortgang |

**Stand A is wat er vandaag is**, en hij blijft volledig werken: een gezin dat nooit een account
maakt, merkt van dit hele voorstel alleen de wisselaar en het ouderslot. De belofte "wat je oefent
blijft op dit apparaat" blijft in stand A letterlijk waar. **De overgang A → B is het hart van dit
voorstel** en heet hieronder de **overname** (§9).

## 5. Het ouderslot: het wachtwoord is de waarheid, de pincode is de deur

De eigenaar vraagt: elke keer dat de ouder wil inloggen, vraag je een wachtwoord, en dat wachtwoord
sla je op in de database. Ik neem dat over met twee nuanceringen, en beide zijn het opschrijven
waard.

**Nuancering 1: wij bewaren het wachtwoord niet zelf, Supabase Auth doet dat.** Een eigen
wachtwoordkolom betekent dat wij hashen, verversen, intrekken en begrenzen — vier dingen die met de
hand stukgaan, en waar stukgaan hier geen bug is maar een lek. Het staat dus in `auth.users`, en
`public.ouders` heeft met opzet geen `wachtwoord_hash` [feit] `0001_gezin.sql`, ADR-155/156. Dat is
hetzelfde als wat de eigenaar vraagt — het wachtwoord staat in de database — alleen in de kolom die
er al voor bestaat.

**Nuancering 2: "elke keer een wachtwoord" moet je op een iPad kunnen volhouden.** Dit is de enige
plek waar ik het voorstel bewust anders maak dan de brief, en de reden is meetbaar: een ouder die
tien keer per week een wachtwoord van veertien tekens op een schermtoetsenbord tikt, kiest binnen
een maand een kort wachtwoord of schrijft het op de iPad [aanname, maar het is de reden waarom
Netflix, elke bank en Squla-in-de-app alle drie een korte code náást het wachtwoord hebben].

Daarom: **twee sloten met twee taken.**

- **Het wachtwoord is het account.** E-mailadres plus wachtwoord, Supabase Auth. Nodig bij: de
  eerste keer op een apparaat, een nieuw apparaat, herstel, en het opzeggen van een abonnement.
  Minstens acht tekens, en verder geen eisen over hoofdletters of leestekens — dezelfde redenering
  als ADR-155 voor het kind maakte: een eis die wordt omzeild, is geen eis.
- **De ouderpin is de deur op dít apparaat.** Vier cijfers, gekozen bij de eerste inlog, **lokaal**
  bewaard als een PBKDF2-afleiding met een salt per apparaat — nooit als de cijfers zelf, en nooit
  op de server. Elke wissel naar het ouderprofiel vraagt hem. Drie keer mis, en de pin vervalt: dan
  moet het wachtwoord erbij, en dat kan niet zonder verbinding.

De pincode is dus **een snelkoppeling naar het wachtwoord en nooit een vervanging ervan**. Hij kan
in zijn eentje niets kopen, niets opzeggen en niets van de server halen; hij opent alleen het
profiel op dit apparaat. Vier cijfers zijn ruim genoeg voor wat hij tegenhoudt: een kind van acht
dat nieuwsgierig is, niet een aanvaller [aanname].

**Waarom lokaal en niet op de server:** een gezin in een vakantiehuis zonder wifi moet bij de
instellingen van zijn kinderen kunnen. Dezelfde overweging die `ZONDER_VERBINDING_DAGEN` in
`store/premium.ts` al maakt [feit] `premium.ts:44-49`.

**De pin is optioneel.** Wie hem overslaat, krijgt bij elke wissel het wachtwoordscherm — precies de
brief, en precies wat Squla in de webversie doet. Wat níét kan: geen van beide.

**Het ouderprofiel valt vanzelf terug.** Na **vijf minuten** zonder aanraking, en altijd bij het
opnieuw openen van de app, staat het apparaat weer op het kind dat er het laatst was. Een iPad die
op de ouderpagina blijft staan, is een iPad zonder slot, en dan is het hele slot theater [aanname].

## 6. De profielwisselaar

**Waar.** Rechtsboven in de `TopBar`, op elke pagina, als het teken van wie er oefent. Indrukken
opent een venster — een echte `<dialog>` met `showModal`, om dezelfde reden als ADR-163: de browser
doet de toplaag, de focusval en Escape, en met de hand nagebouwd blijft daar altijd de helft van
staan.

**Wat erin staat**, in deze volgorde:

1. De kinderen op dit apparaat, met hun naam. Wie nu oefent, staat bovenaan en is niet aan te
   tikken.
2. **"Nog een kind"**, tot er drie zijn. Daarna staat er waarom er geen vierde bij kan, met de weg
   ernaartoe (§7).
3. Een haarlijn.
4. **"Ouder"**, met een slotje. Is er een ouderaccount op dit apparaat, dan vraagt hij de pin. Is
   dat er niet, dan opent hij het accountscherm — inloggen of aanmelden.

**Geen wachtwoord voor een kind, en dat is een besluit.** Op het gezinsapparaat tikt een kind op
zijn naam en oefent. Dat is wat Netflix, Squla-in-de-app en Khan Academy Kids doen, en het is wat de
eigenaar met "makkelijk wisselen" bedoelt. De inlogcode van ADR-155 verdwijnt niet, maar krijgt een
andere taak: hij is het **verhuisdocument** waarmee een kind zijn eigen voortgang op een ánder
apparaat opent (stand C) — bij oma, op de laptop, op een schoolchromebook. Niet de dagelijkse
poort.

De prijs is echt: een broertje kan in het profiel van zijn zus oefenen en haar Leitner-dozen
beïnvloeden. Dat is dezelfde prijs die ADR-155 al aanvaardde voor "Inloggen als kind", en hij is op
een gedeeld gezinsapparaat de goedkope kant: een verkeerd profiel kost één ronde, een wachtwoord bij
elke start kost het oefenen zelf [aanname].

**Midden in een ronde wisselt er niets.** De wisselaar is er dan niet; de balk is tijdens een ronde
toch al leeg. Een ronde die halverwege van kind verandert, schrijft antwoorden in de verkeerde
dozen.

## 7. Premium wordt van het gezin

**Vandaag is de code de licentie.** Hij gaat met een verzonnen apparaatnummer naar de server, drie
apparaten is de grens, en het antwoord staat in `localStorage` [feit] `premium.ts`, ADR-116.

**Voorstel: de code wordt een bon.** Je koopt hem, en je wisselt hem één keer in. Wat je ervoor
terugkrijgt hangt af van waar je staat:

- **Zonder account (stand A):** precies wat er nu gebeurt. De code staat op dit apparaat, maximaal
  drie apparaten, een jaar lang. Niets verandert, en een gezin dat geen account wil, wordt er niet
  toe gedwongen. Dit is ook het pad dat blijft werken als het gezinsproject er nog niet is.
- **Met een ouderaccount (stand B/C):** de ouder wisselt de code in op de ouderpagina, en het recht
  gaat naar het **gezin**. Daarna heeft elk apparaat waar de ouder of een van zijn kinderen op
  ingelogd is premium, zonder apparaten te tellen en zonder "vol". Dat lost het geval uit de brief
  op: de ouder koopt op zijn telefoon, de iPad van het kind heeft het bij de eerstvolgende opening.

**Eén code, alle kinderen.** Dat is wat de eigenaar vraagt en het is ook de enige samenhangende
vorm: premium is een gezinsabonnement, dus het telt geen kinderen. Concreet: **het blok "Wie oefent
er?" gaat uit premium** (§12, ADR-116). Drie kinderen aanmaken is gratis; wat premium doet, staat
in de vergelijking op de premiumpagina en gaat over wat je ziet en kunt oefenen, niet over hoeveel
je er bent.

**Waar de grens van drie thuishoort: bij het gezin, niet bij het apparaat.** De brief zegt "max. 3
per apparaat", en dat werkt in stand A ook zo. Maar zodra er een account is, geeft "per apparaat"
op twee apparaten zes kinderen, en dan betekent de grens niets meer. Dus: **drie kinderen per
gezin**, en een apparaat toont wie erop staat. Voor stand A is dat hetzelfde getal; voor stand B is
het het enige getal dat standhoudt.

**Alleen de ouder wisselt een code in.** Het codeveld staat op twee plekken en allebei zijn ze van
de ouder: op de ouderpagina, en in het venster van §8 dat het kind opent maar de ouder invult.
Nergens anders — dus ook niet meer los op de premiumpagina die een kind kan openen. Dat is de eis
uit de brief, en het is ook de regel van Apple: commercie achter een parental gate.

## 8. Het slot dat een kind indrukt

`OuderVraag` (ADR-163) is het ene stuk van de huidige opzet dat deze herziening zonder kleerscheuren
doorkomt, en dat is geen toeval: het is een parental gate, en het is precies wat Apple en Google
voorschrijven. Het blijft, met drie wijzigingen.

**De kop spreekt het kind aan, de inhoud de ouder.** "Vraag het even aan je ouders" blijft. Wat
eronder staat, verandert van één ding in drie uitwegen, en de derde is nieuw en de belangrijkste:

1. **"Mijn ouder is erbij"** → het codeveld, of "Inloggen als ouder". Dit is het geval waarin er
   iemand over de schouder meekijkt, en dan is het één handeling.
2. **"Laat het zien wat het is"** → de premiumpagina, zonder codeveld. Uitleg, geen aankoop.
3. **"Stuur het naar mijn ouder"** → **dit ontbreekt vandaag en het is de oplossing voor punt 7 uit
   de brief.** Het kind tikt om 16:00 op een slot op de iPad. Er is geen ouder in de kamer. Het kind
   kiest deze knop, tikt het e-mailadres of het telefoonnummer van zijn ouder in — of beter: het
   opent de deelknop van het toestel (`navigator.share`) — en er gaat een link de deur uit naar de
   kassa. De ouder opent hem om 19:00 op zijn eigen telefoon, koopt daar, en de code komt in het
   gezin terecht. Het kind hoeft niets meer te doen.

**De prijs staat er nog steeds niet**, om de reden die ADR-163 al gaf: een bedrag in een venster dat
een kind van acht opende, maakt van de vraag een prijskaartje.

**Wat het kind intussen ziet.** Het venster gaat dicht, het kind staat weer waar het stond, en de
geblokkeerde oefening blijft geblokkeerd. Dat is eerlijk. Wat er niet gebeurt: geen tweede venster,
geen herinnering, geen telling. Eén keer vragen per pagina blijft de regel (ADR-124).

## 9. Het late pad: het kind eerst, de ouder later

Dit is het geval dat de eigenaar expliciet noemt en dat vandaag geen antwoord heeft. Het is ook het
geval waar dit soort producten op stukloopt [aanname], dus het krijgt hier de meeste ruimte.

**Het uitgangspunt: een lokaal profiel is nooit weggegooid werk.** Als een ouder er later bij komt,
wordt het lokale kind **overgenomen** door het gezin — met naam, groep, Leitner-dozen, diploma's,
weekzegels, doel en al. Er wordt niets opnieuw aangemaakt en er gaat niets verloren.

**Dat kan zonder kunstgrepen, omdat het datamodel er al op gebouwd is.** Deel A (IndexedDB) en deel
C (Postgres) hebben dezelfde rijvormen, en de enige vertaling is camelCase → snake_case [feit]
`docs/DATAMODEL.md` deel A en C. De overname is dus een upload van rijen die al de goede vorm
hebben, plus één hernoeming: de lokale `kindId` wordt de uuid van de auth-gebruiker.

**De overname, stap voor stap:**

1. De ouder maakt een account (e-mail, wachtwoord) of logt in — vanuit de wisselaar, vanuit het
   venster van §8, of vanuit "Ik ben een ouder" op het eerste scherm (ADR-161 blijft).
2. Het apparaat ziet lokale kinderen en vraagt er één ding over: **"Noor en Sem oefenen al op dit
   apparaat. Zijn dit jouw kinderen?"** Per kind een vinkje. Dit is meteen het moment van
   **toestemming** (artikel 8 AVG), en de zin die eronder staat zegt in gewone taal wat er gaat
   gebeuren: vanaf nu staat de voortgang ook op onze server in Frankfurt, en waarom dat helpt
   (Safari gooit lokale opslag na zeven dagen weg, en de langste tussenpoos in dit product is
   eenentwintig dagen — de reden van ADR-046).
3. Per aangevinkt kind: een auth-gebruiker op `<uuid>@kind.invalid`, een rij in `kinderen`, een
   inlogcode, en de lokale rijen gaan mee. Dat gebeurt in één edge function, met de servicesleutel,
   en dus niet vanaf de client.
4. Lokaal wordt de oude `kindId` **omgezet**, niet gekopieerd. Eén kind, één set dozen; twee zou de
   bug van ADR-046 opnieuw zijn.
5. Klaar. Het kind merkt er één ding van: de volgende keer dat het de app opent, staat zijn naam er
   nog steeds en is er niets veranderd.

**Wat als er al een gezin is met dezelfde kinderen?** Dan logt de ouder in en zijn er twee lijsten:
wat lokaal staat en wat de server heeft. Dan **niet automatisch samenvoegen** — twee "Noor" is niet
per se één Noor. De ouder kiest per lokaal kind: overnemen als nieuw kind, samenvoegen met een
bestaand kind (met de samenvoegregels van ADR-155, die per winkel al uitgeschreven zijn en die
kloppen), of laten staan. Drie knoppen, één keer in het leven van een gezin.

**Wat als er drie kinderen op de server staan en er lokaal een vierde is?** Dan zegt het dat, met de
naam erbij, en gebeurt er niets. Een grens die stilletjes iemand weggooit, is erger dan een grens.

**De andere kant op moet ook kunnen.** Een ouder die zijn account opzegt of verwijdert, houdt op
dit apparaat wat erop staat. Het gezin verdwijnt van de server, de lokale profielen blijven, en het
apparaat valt terug naar stand A. Dat is wat "een account verwijderen en de gegevens meenemen"
betekent als je het niet alleen opschrijft (ADR-155 noemt het als eis).

## 10. De ouderpagina

**Een eigen bestemming, `/ouder`.** Dat adres bestaat en wijst sinds ADR-171 naar Premium [feit]
`routes.ts` `OUDER_SLUG`; het wijst weer naar zichzelf. De pagina is alleen te bereiken vanuit het
ouderprofiel: wie er zonder komt, krijgt het pinscherm. **Premium wordt een blok op deze pagina** in
plaats van een bestemming naast Jij — want de premiumpagina is een verkooppagina, en die hoort bij
de lezer die koopt. Wat er voor het kind van premium te zien moet zijn (de etalage, één keer per
pagina), blijft op Jij en op Vandaag staan zoals ADR-124 het regelt.

**In deze volgorde**, en de volgorde is die van wat een ouder komt halen:

1. **Je kinderen.** Per kind een rij: naam, groep, en hoe het deze week ging in één zin. Openklappen
   geeft: naam en groep wijzigen, de inlogcode voor een ander apparaat (met "Nieuwe code"), het
   wachtwoord van het kind zetten, en het kind verwijderen. Onderaan "Nog een kind", tot drie.
2. **Hoe gaat het?** De uitgebreide cijfers. Hier hoort wat op Jij niet past omdat het vergelijkend
   of langlopend is: de kinderen naast elkaar, acht weken in plaats van één, per vak en per
   onderwerp, wat er vastzit, en de tabel. Het kind houdt op Jij alles wat het nu heeft — dit is
   erbij, niet in plaats van.
3. **Premium.** Wat het is, wat het kost, het codeveld, tot wanneer het aanstaat, en de weg naar de
   kassa. Plus, met een account: op welke apparaten het aanstaat en hoe je er een afhaalt.
4. **Instellingen voor het gezin.** De schakelaars die nu op Jij staan en die eigenlijk van de ouder
   zijn: de weekdoelen aan of uit, het geluid, de eigen woordenlijsten. Wat van het kind zelf is —
   zijn naam, zijn groep, zijn doel — blijft ook op Jij: een kind mag zichzelf instellen.
5. **Je account.** E-mailadres, wachtwoord wijzigen, de ouderpin op dit apparaat, uitloggen.
6. **Privacy en gegevens.** Wat er van wie op de server staat, de gegevens van een kind meenemen,
   een kind verwijderen, het hele account verwijderen. Geen bijlage bij een privacyverklaring maar
   knoppen, want dat is wat de AVG bedoelt met "uitoefenbaar".

**Wat er níét op staat:** geen dagelijks gebruiksrapport, geen schermtijd, geen vergelijking met
andere gezinnen, geen ranglijst. ADR-164 weigerde al namen in de statistieken. Een ouderpagina die
een bewakingsdashboard wordt, verandert het product van "oefenen" in "gecontroleerd worden", en dan
is het kind de verliezer [aanname].

**Het kind kan hier niet komen, en het kind mag hier niet meer uitgezet worden.** "Alles van dit
apparaat halen" verhuist naar de ouderpagina (punt 6). Dat is diagnose 7 opgelost.

## 11. Wat het kind houdt

Deze herziening geeft de ouder een pagina. De valkuil is dat het kind er blokken bij inschiet, en
dat is precies wat ADR-171 en ADR-172 net hebben rechtgezet. Dus expliciet:

- **Jij verandert bijna niet.** De tien blokken van ADR-172 blijven staan, in dezelfde volgorde. Wat
  eraf gaat: "Alles van dit apparaat halen" (naar de ouder), de weekdoelenschakelaar (naar de
  ouder), en het account onderaan Premium (dat blok bestaat niet meer, want de ouder heeft een
  pagina).
- **"Wie oefent er?" verdwijnt van Jij** en wordt de wisselaar in de balk. Dat is één blok minder
  op een pagina die volgens ADR-172 zelf te lang was, en een wisselaar hoort in de balk omdat hij
  overal moet kunnen.
- **De diploma's, de ringen, de cijfers en de weekkaart blijven van het kind**, ook als de ouder
  dezelfde getallen uitgebreider ziet. Twee lezers mogen naar hetzelfde kijken.
- **Vandaag verandert niet.**

## 12. Wat dit met eerdere besluiten doet

| Besluit     | Wat er nu staat                                   | Wat dit voorstel doet                                                                   |
| ----------- | ------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **ADR-116** | Meer dan één kind is premium                      | **Draait om.** Drie kinderen gratis; premium gaat over wat je ziet en oefent            |
| **ADR-116** | De code is de licentie, per apparaat, max. drie   | **Verruimd.** Zonder account onveranderd; met account is de code een bon voor het gezin |
| **ADR-155** | Het kind logt elke keer in met code én wachtwoord | **Versmald.** Op het eigen apparaat geen inlog; de code wordt het verhuisdocument       |
| **ADR-155** | "Er komt geen migratie, en dat is een keuze"      | **Draait om.** De overname (§9) wordt de hoofdweg, niet het randgeval                   |
| **ADR-171** | "Ouders loggen niet in" — Voor ouders verdwijnt   | **Draait om.** De ouder logt wél in en krijgt `/ouder` terug                            |
| **ADR-172** | Het account staat onderaan Premium                | **Vervalt.** Het account staat op de ouderpagina                                        |
| **ADR-163** | Een slot opent "Vraag het even aan je ouders"     | **Blijft**, met een derde uitweg: stuur het naar je ouder                               |
| **ADR-124** | Eén keer per pagina om premium vragen             | **Blijft**, ongewijzigd                                                                 |
| **ADR-161** | "Ik ben een ouder" op het eerste scherm           | **Blijft**, maar opent de ouderweg in plaats van Premium                                |
| **ADR-156** | Het gezinsschema, de policy van één regel         | **Blijft**, met twee kolommen erbij (§13)                                               |

## 13. Wat het datamodel erbij krijgt

Het schema van `0001_gezin.sql` klopt en blijft staan. Erbij komt, in een **volgende** migratie —
`0002_*.sql`, want een migratie die ergens gedraaid heeft, wordt niet bewerkt (`SUPABASE.md` §2):

```sql
-- Het abonnement hangt aan het gezin, niet aan een apparaat (§7).
create table if not exists public.gezin_premium (
  ouder_id    uuid primary key references public.ouders (id) on delete cascade,
  code_hash   text not null,          -- dezelfde SHA-256 als ADR-116
  geldig_tot  date not null,
  ingewisseld timestamptz not null default now()
);

alter table public.ouders add column if not exists max_kinderen smallint not null default 3;
```

Waarom `code_hash` en niet de code: hij is één keer afgedrukt en hoeft nooit teruggelezen te worden
— dezelfde redenering die ADR-155 maakt om de inlogcode juist wél leesbaar te bewaren. En waarom
`max_kinderen` een kolom en geen constante: drie is een productkeuze, en een gezin met vier kinderen
is een echt gezin. De kolom laat dat een gesprek zijn in plaats van een migratie.

**Eén regel policy, onveranderd**: `using (ouder_id = auth.uid())` op `gezin_premium`, alleen lezen.
Inwisselen gaat langs een edge function met de servicesleutel, zoals de kassa en `kind-inloggen` dat
al doen — dus de client kan een abonnement niet zelf schrijven.

**Wat lokaal bijkomt:** één sleutel in `settings` voor de ouderpin (de afleiding en de salt), en één
voor welk profiel het laatst actief was. Geen van beide gaat ooit naar de server — net zoals
`dagstand:` en `actiefKind` dat al niet doen (ADR-155).

## 14. Bouwvolgorde

Vier stappen, elk met een eigen PR, en elk op zichzelf af. Stap 1 en 2 hebben **geen server nodig**
en leveren al het grootste deel van wat de brief vraagt.

1. **De wisselaar en het ouderslot, lokaal** (geen server). De wisselaar in de balk, drie kinderen
   zonder premium, een ouderprofiel met een pin, `/ouder` als pagina met de blokken die lokaal
   kunnen: je kinderen, de instellingen, wissen, en premium met het codeveld. Dit is stand A, en
   voor een gezin dat nooit een account maakt is het het hele product. **Dit is de grootste stap en
   het meeste waard.**
2. **Het slot met drie uitwegen** (§8), inclusief "stuur het naar mijn ouder". Alleen de kassa en
   `navigator.share` zijn nodig; het gezinsproject niet.
3. **Het account en de overname** (§9). Aanmelden, inloggen, kinderen overnemen, syncen. Hier komt
   het gezinsproject in beeld, plus de lokale migratie die ADR-155 al eiste (`attempts` naar uuid,
   instellingen met een tijdstip).
4. **Premium van het gezin** (§7) en de uitgebreide cijfers op de ouderpagina.

## 15. De prijzen, expliciet

1. **De belofte verandert zodra er een account is.** "Wat je oefent blijft op dit apparaat" blijft
   waar in stand A en is niet meer waar in stand B. Dat moet op het toestemmingsscherm staan, in één
   zin, niet in een verklaring. ADR-155 wees hier al op; hier wordt het een scherm.
2. **Wij houden een inloggegeven van een achtjarige vast.** Alleen in stand B/C, en alleen met
   toestemming van de ouder. Dat is de prijs die ADR-155 al benoemde en die overeind blijft.
3. **Een kind kan in het profiel van zijn broer oefenen.** Geen wachtwoord op een gedeeld apparaat
   betekent dat. Aanvaard, met de redenering van §6.
4. **Vier cijfers houden geen vastberaden twaalfjarige tegen.** Dat hoeft ook niet: de pin opent
   alleen instellingen op dit apparaat. Kopen, opzeggen en gegevens ophalen vragen altijd het
   wachtwoord.
5. **Dit is meer werk dan de vorige drie ADR's samen** [aanname]. Stap 1 en 2 zijn een paar dagen;
   stap 3 is een project, en het is het project waar `0001_gezin.sql` al op wacht.

## 16. Wat ik aan jou vraag

1. **Ga je mee in de pincode náást het wachtwoord** (§5), of wil je letterlijk elke keer het
   wachtwoord? Mijn aanbeveling is de pincode, en hij is optioneel, dus de brief blijft haalbaar
   voor wie hem niet instelt.
2. **Is "drie kinderen" van het gezin of van het apparaat** (§7)? Ik beveel het gezin aan; per
   apparaat betekent de grens niets zodra er twee apparaten zijn.
3. **Gaat meerdere kinderen uit premium** (§12, ADR-116)? Ik denk dat het moet, en dat de
   vergelijkingstabel het zonder die regel prima volhoudt — maar het haalt wel een argument weg uit
   de verkoop, dus het is jouw keuze.
4. **Mag het kind zonder wachtwoord op het eigen apparaat** (§6)? Dit draait een stuk van ADR-155
   om. Ik beveel het sterk aan.
5. **Bouwen we stap 1 en 2 vooruit op het gezinsproject** (§14)? Dat levert het meeste op het
   snelst, en het houdt de server buiten de eerste twee PR's.

Zeg welke van de vijf je anders wilt, dan schrijf ik de ADR's en begin ik aan stap 1.

**Beantwoord op 2026-09-21:** alle vijf akkoord met de aanbeveling.

## 17. Wat bij het bouwen anders uitviel

### Stap 1 (ADR-173)

- **De pincode is in deze fase het enige slot, niet een snelkoppeling naar het wachtwoord.** §5
  beschrijft ze als een paar, maar er is nog geen account om het wachtwoord aan te hangen — dat is
  stap 3. Tot die tijd is de pincode de hele deur.
- **"Drie keer mis en de pin vervalt" (§5) kon niet.** Zonder account is er niets om op terug te
  vallen, dus zou dat het apparaat onbruikbaar maken voor instellingen. Het is een **pauze van een
  minuut** geworden. De echte grens blijft dat er achter dit slot niets van een server te halen is.
- **Geluid, voorlezen en minder beweging blijven op Jij.** §10 zette alle schakelaars bij de ouder.
  Die drie gaan over de kamer en over het kind dat de iPad vasthoudt; ze achter een pincode zetten
  stuurt een kind dat het geluid uit wil naar zijn ouder. Alleen de doelenschakelaar is verhuisd.
- **Een kind verwijderen zit er nog niet in.** Dat gooit elk diploma en elke doos eronder weg, en
  verdient hetzelfde soort scherm als het wissen. Het hoort bij de gegevensknoppen van stap 3.
- **De premiumpagina houdt "tot wanneer het aanstaat".** §7 en §10 zetten de hele premiumstand bij
  de ouder; de datum is geen commercie en een kind mag hem zien. Alleen het codeveld en het
  afmelden zijn verhuisd.

- **Wie de pincode mocht zetten, stond er niet bij — en dat was een gat** (hersteld in ADR-176).
  ADR-173 nam aan dat de ouder de eerste zou zijn die bij de wisselaar komt. Dat is systematisch
  fout: het kind opent de app als eerste, en dat is juist het geval waar dit hele voorstel over
  gaat. Er staat nu een volwassenencheck vóór het zetten en het resetten van de pincode.

### Stap 2 (ADR-174)

- **Het codeveld staat niet meer meteen in het venster.** §8 liet het staan waar ADR-163 het zette.
  Met drie uitwegen eronder werd dat een muur op een telefoon, en voor een kind dat alleen zit is
  een veld dat het niet kan invullen de vraag nog een keer stellen. Het komt nu achter de eerste
  uitweg vandaan.
- **De link wijst naar de premiumpagina en niet naar de kassa.** §8 zei "een link naar de kassa".
  Wie een link koud binnenkrijgt, heeft eerst de uitleg nodig en niet een betaalformulier; de
  kassaknop staat daar één druk verder.
- **Er is een vierde weg bijgekomen die §8 niet noemde:** een gewone mailknop, altijd zichtbaar.
  `navigator.share` bestaat niet op een laptop, en daar is de mail de kortste route.

### Stap 3, eerste deel (ADR-175)

- **Stap 3 valt uiteen in twee stukken.** §14 noemde "het account en de overname" als één stap.
  Bij het bouwen bleek de helft ervan geen netwerk nodig te hebben en er wel aan vooraf te moeten
  gaan: de uuid-sleutels, het moment op een instelling, en de vertaling tussen het apparaat en de
  server. Dat is ADR-175. De overname zelf — aanmelden, kinderen opnemen, versturen — is het
  tweede stuk.
- **De lokale sleutel van een kind wordt niet omgezet.** §9 stap 4 zei van wel: "Lokaal wordt de
  oude `kindId` omgezet, niet gekopieerd." Dat raakt elke winkel tegelijk, en een migratie die
  halverwege breekt laat de dozen van een kind achter onder twee sleutels — de fout van ADR-046,
  opnieuw. Een kind heeft nu twee identiteiten, en `Eigenaar` draagt ze allebei.

### Stap 3, tweede deel (ADR-187)

- **Stap 3 valt nog een keer uiteen: 3a, 3b en 3c.** 3a neemt een kind mee en verstuurt wat er op
  dat moment staat. 3b houdt het daarna bij, na elke ronde. 3c haalt het op een ander apparaat op
  en voegt samen. Zet het gezinsproject pas aan voor gezinnen als alle drie er zijn.
- **De rijen gaan niet door een edge function.** §9 stap 3 zei "één edge function, met de
  servicesleutel". Het kind aanmaken wel (`kind-beheer`, actie `opnemen`), maar de rijen gaan
  rechtstreeks naar de tabellen met het token van de ouder, onder de policy die er al voor is.
- **Samenvoegen met een kind dat al in het account staat, komt in 3c.** Tot dan is meenemen altijd
  een nieuw kind, en staat een kind dat alleen in het account staat er als één regel onder.
- **De toestemming heeft een schakelaar en een kolom.** De ouder zet hem zelf om, en de database
  legt het moment vast (`kinderen.toestemming_op`).

### Stap 3b (ADR-188)

- **Bijhouden gebeurt na elke ronde en bij het openen van de app**, alleen voor een gekoppeld kind en
  een ingelogde ouder, en nooit tijdens een ronde. Wat er meegaat is wat er sinds de vorige keer bij
  kwam.
- **De samenvoegregels van ADR-155 zijn triggers in de database geworden** en geen afspraak voor de
  client. Dat was in §9 nog niet uitgewerkt; het is de enige plek waar ze voor elke schrijver gelden.
