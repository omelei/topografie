# Supabase: het gezinsproject

Ouders en kinderen krijgen een account (ADR-155). Dat draait in een **eigen
Supabase-project**, los van het project waar de premiumcodes staan.

Dat is met opzet twee projecten en niet één. ADR-116 zegt over de
premiumdatabase dat er "nothing about a child in it" staat, en dat blijft alleen
waar als er geen kindertabel naast komt te staan. Twee projecten kosten op het
gratis plan niets en houden die zin overeind zonder dat iemand hem hoeft te
bewaken.

Zolang de stappen hieronder niet gedaan zijn, werkt de app precies zoals nu:
inloggen is een aanbod en geen poort (ADR-152), en een kind dat nooit inlogt
merkt hier niets van en verliest niets.

## Eenmalig instellen

### 1. Het project — let op de regio

Maak op [supabase.com](https://supabase.com) een project aan, regio **Central EU
(Frankfurt)** of een andere EU-regio. Het gratis plan is genoeg.

> **De regio is achteraf niet te veranderen.** Staat het project buiten de EU,
> dan is het antwoord een nieuw project en niet een instelling. Dit is de eerste
> stap omdat het de enige onomkeerbare is: hier komen de voornamen en de
> studieresultaten van Nederlandse basisschoolkinderen te staan, en ADR-050 zegt
> waarom die niet in een andere jurisdictie horen. Kijken kan onder **Project
> Settings → General → Region**.

### 2. Het schema

Open **SQL Editor**, plak de inhoud van
[`supabase/migrations/0001_gezin.sql`](../supabase/migrations/0001_gezin.sql) en
klik op **Run**.

Migraties staan genummerd in `supabase/migrations/` en worden niet meer bewerkt
zodra ze ergens gedraaid hebben — een verandering is een volgend genummerd
bestand. Deze is wel zo geschreven dat opnieuw draaien niets kapotmaakt, want
tot het project echt staat draai je hem een paar keer achter elkaar.

Er hoort **Success. No rows returned** te komen. Twee dingen die hier mis
kunnen gaan en waar de foutmelding niet meteen over uitweidt:

- `permission denied for schema auth` bij de trigger. Draai het script dan in
  de **SQL Editor van het dashboard** en niet via een andere verbinding: daar
  draai je als `postgres`, en die mag het.
- `extension "citext" is not available`. Zet hem dan eerst aan onder
  **Database → Extensions**, en draai het script opnieuw.

Controleer daarna dat het er echt staat, met deze query in dezelfde editor:

```sql
select c.relname as tabel,
       c.relrowsecurity as rls_aan,
       count(p.polname) as policies
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_policy p on p.polrelid = c.oid
where n.nspname = 'public' and c.relkind = 'r'
group by c.relname, c.relrowsecurity
order by c.relname;
```

Er horen negen rijen te staan, `rls_aan` overal `true`, en het aantal policies:

| Tabel                                                                         | Policies |
| ----------------------------------------------------------------------------- | -------- |
| `doelstellingen`, `kinderen`                                                  | 2        |
| `instellingen`, `kind_diplomas`, `ouders`, `pogingen`, `sessies`, `voortgang` | 1        |
| `inlog_pogingen`                                                              | 0        |

`inlog_pogingen` hoort er nul te hebben: RLS staat aan en er is met opzet geen
policy, zodat alleen de edge function er via `service_role` bij kan. Een tabel
met `rls_aan = false` is het ene antwoord dat niet mag voorkomen — dan is die
tabel voor iedereen met de publieke sleutel te lezen.

En de zes functies:

```sql
select proname from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and proname like 'gezin\_%' order by 1;
```

`gezin_code_uitgeven`, `gezin_inlog_mag`, `gezin_inlog_mislukt`,
`gezin_kind_voor_code`, `gezin_nieuwe_code`, `gezin_nieuwe_gebruiker`.

### 3. De twee edge functions

Er is geen laptop voor nodig. De functies gaan via GitHub Actions naar Supabase,
en hun geheimen zet je in het dashboard — twee plekken, en allebei met een reden.

#### 3a. De geheimen, in het dashboard

Doe deze eerst. Een functie die draait zonder `GEZIN_PEPER` gooit bij het eerste
verzoek `De omgevingsvariabele GEZIN_PEPER ontbreekt.`

Onder **Project Settings → Edge Functions → Secrets** (`SUPABASE_URL` en
`SUPABASE_SERVICE_ROLE_KEY` zet Supabase zelf al klaar; deze twee niet):

| Naam             | Waarde                                    |
| ---------------- | ----------------------------------------- |
| `GEZIN_PEPER`    | 64 willekeurige hextekens — zie hieronder |
| `GEZIN_HERKOMST` | `https://www.leer.nu`                     |

- **`GEZIN_PEPER`** gaat door de digest van de inlogcode en van het IP-adres in
  de snelheidsbegrenzer. Zonder peper is een IPv4-adres uit een kale hash in
  seconden terug te rekenen — dan bewaar je een persoonsgegeven en doe je alsof
  van niet — en zou de tabel met mislukte pogingen een lijst zijn om codes mee
  te raden. Hij hoeft nergens bewaard te worden: wie hem verzet, zet alleen de
  lopende begrenzing op nul.

  Hij hoort ook nergens anders te belanden, en dat is de reden dat hij hier in
  het dashboard staat en niet in een workflow: dan gaat hij van je browser
  rechtstreeks naar Supabase en komt hij in geen enkele logregel, chat of
  build langs. Maak hem in de console van je browser met
  `crypto.randomUUID().replaceAll('-','') + crypto.randomUUID().replaceAll('-','')`,
  of op een machine die je toch al open hebt met `openssl rand -hex 32`.

- **`GEZIN_HERKOMST`** is het enige adres dat deze functies mag aanroepen.
  Zonder deze regel staat er `*`, en dan mag elke pagina op het internet een
  inlogpoging namens een bezoeker doen.

#### 3b. Twee instellingen in GitHub

`.github/workflows/gezin-functions.yml` doet wat de CLI op een laptop zou doen,
maar dan met wat er in `main` staat in plaats van met wat er op iemands schijf
stond. Dat is hier geen detail: allebei de functies importeren
`../_gezin/code.ts`, en dat gedeelde bestand is precies wat niet mag verlopen —
`inloggen.test.ts` houdt vast dat het alfabet van de inlogcode op alle drie de
plekken hetzelfde is. De CLI bundelt die import mee; de editor in het dashboard
zou hem twee keer laten plakken, en dan bewaakt die toets iets anders dan wat er
draait.

**De project-ref.** Die staat in Supabase onder **Project Settings → General →
Reference ID**, en ook gewoon in het adres van je dashboard: het stuk tussen
`/project/` en de volgende schuine streep. Twintig kleine letters. Zet hem in
GitHub onder **Settings → Secrets and variables → Actions → Variables** als
`GEZIN_PROJECT_REF`.

Bij Variables en niet bij Secrets, want geheim is hij niet: hij staat in
`https://<project-ref>.supabase.co` en dus straks ook in `GEZIN_URL`. Een waarde
als Secret bewaren die toch openbaar is, maakt de logboeken alleen maar
onleesbaar — GitHub vervangt hem dan overal door `***`, ook in de regel waar je
wil kunnen zien wélk project er is aangesproken.

**Het token.** Maak er een aan op
[supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens),
onder **Account → Access Tokens**. Je krijgt hem **één keer** te zien; sla hem
op in je wachtwoordkluis of plak hem meteen. Zet hem in GitHub onder **Settings
→ Secrets and variables → Actions → Secrets** als `SUPABASE_ACCESS_TOKEN`.

Hier wél bij Secrets, en met een waarschuwing erbij: voor zover bekend zijn deze
tokens aan je **account** gekoppeld en niet aan één project. Dit token kan dus
ook bij het premiumproject. Biedt Supabase inmiddels een token per project of
per organisatie, neem dat — dat is strikt beter. En zet hem nooit bij Variables:
die zijn leesbaar voor iedereen die de Actions-logboeken mag zien.

#### 3c. De workflow één keer met de hand draaien

**Actions → Gezin functions → Run workflow → Branch: main → Run workflow.**

Wat je hoort te zien: twee stappen, `Deploy kind-inloggen` en `Deploy
kind-beheer`, allebei met een regel als `Deployed Functions on project
<project-ref>`.

Blijft de job grijs en staat er "skipped"? Dan is `GEZIN_PROJECT_REF` leeg of
verkeerd gespeld. Dat is met opzet zo gebouwd — zonder project hoort deze
workflow groen te zijn en niets te doen, zoals `premium-wakker.yml` dat deed
voordat premium bestond — maar het betekent hier dus dat er niets gebeurd is.

Vanaf nu gaat het vanzelf: een wijziging in `kind-inloggen`, `kind-beheer` of
`_gezin` die `main` bereikt, zet zichzelf opnieuw neer. Dezelfde afspraak als
voor de site — een merge naar `main` is de deploy — en het voorkomt de stand
waarin de code in de repo en de functie op de server uit elkaar gelopen zijn
zonder dat iemand het weet.

#### 3d. Drie vragen, drie antwoorden

Een groene workflow zegt dat de CLI klaar was, niet dat het werkt. Deze drie
vragen zeggen dat wel.

**De makkelijke weg: Actions → Gezin nakijken → Run workflow.** Die stelt ze
alle drie en zet de uitslag als tabel op de pagina van de run, met bij elke
foute uitkomst wat hij betekent. Hij heeft geen sleutel nodig — alle drie de
verzoeken gaan zonder token, want dat is precies wat ze toetsen. Draai hem na
elke deploy, en bij twijfel nog een keer.

Hieronder staat wat die workflow doet, voor wie het met de hand wil zien of wil
weten waar de oordelen vandaan komen. Zet eerst je ref in een variabele:

```bash
ref=<project-ref>
```

**Vraag 1: staat `kind-inloggen` open voor een kind?**

```bash
curl -s -w '\n%{http_code} in %{time_total}s\n' \
  -X POST "https://$ref.supabase.co/functions/v1/kind-inloggen" \
  -H 'content-type: application/json' \
  -d '{"code":"KIND-AAAA-2345","wachtwoord":"konijn"}'
```

Goed antwoord: `{"fout":"onjuist"}`, **status 200**, en **minstens 0,6 seconde**.

Alle drie betekenen iets. Een mislukte inlog is met opzet 200 en geen 401: er
valt niets te herhalen met andere koppen, en een 401 laat een browser om een
wachtwoord vragen op een plek waar dit product zijn eigen scherm heeft. En die
0,6 seconde is `MINIMUM_MS` uit `inloggen.ts` — een code die niet bestaat kost
evenveel tijd als een fout wachtwoord, zodat de klok niet verraadt welke van de
twee het was.

**Vraag 2: staat `kind-beheer` er, en houdt de poort hem dicht?**

```bash
curl -s -i -X POST "https://$ref.supabase.co/functions/v1/kind-beheer" \
  -H 'content-type: application/json' -d '{"actie":"aanmaken"}'
```

Goed antwoord: **401** met een melding van Supabase zelf, iets in de trant van
`Missing authorization header`. Dat is de poort die zijn werk doet.

Krijg je in plaats daarvan `{"fout":"geen-ouder"}`, dan heeft het verzoek de
functie zélf bereikt. Dat is niet onveilig — dat antwoord kómt juist doordat de
functie het token nakijkt en niemand vindt — maar het betekent dat de controle
van de poort uitstaat, en dat is niet wat de workflow neerzet.

**Vraag 3: komt de preflight van een browser erdoor?**

Dit is de open vraag uit ADR-155 en uit de PR, en hij is in tien seconden te
beantwoorden in plaats van bij de eerste ouder die op _Bewaren_ drukt:

```bash
curl -s -o /dev/null -w '%{http_code}\n' \
  -X OPTIONS "https://$ref.supabase.co/functions/v1/kind-beheer" \
  -H 'origin: https://www.leer.nu' \
  -H 'access-control-request-method: POST'
```

**204** betekent dat de functie zelf de preflight beantwoordt en dat er niets
aan de hand is. **401** betekent dat de poort hem tegenhoudt vóórdat de functie
hem ziet, en dan doet geen enkele browser ooit het echte `POST`.

Gebeurt dat laatste, meld het dan en zet de instelling niet stil om: dan hoort
`kind-beheer` ook met `--no-verify-jwt` de deur uit, en hoort erbij opgeschreven
te worden dat de bescherming daarmee volledig bij de functie ligt — die het
token bij Supabase navraagt en bij elk kind kijkt of het van déze ouder is. Dat
is een ADR waard, geen regel die iemand een keer heeft aangepast.

#### Als er iets misgaat

| Wat je ziet                           | Wat er aan de hand is                                                |
| ------------------------------------- | -------------------------------------------------------------------- |
| Job grijs, "skipped"                  | `GEZIN_PROJECT_REF` leeg of verkeerd gespeld — er is niets neergezet |
| `Invalid access token` in de workflow | `SUPABASE_ACCESS_TOKEN` fout, verlopen of ingetrokken                |
| `Project not found` in de workflow    | de ref klopt niet, of het token hoort bij een ander account          |
| **500** op vraag 1                    | `GEZIN_PEPER` ontbreekt — stap 3a, en het kost geen nieuwe deploy    |
| **401** op vraag 1                    | `kind-inloggen` staat met verificatie aan; draai de workflow opnieuw |
| **404** op vraag 1 of 2               | die functie staat er niet; kijk in de logboeken van de workflow      |
| `{"fout":"leeg"}`                     | de JSON in je `curl` kwam niet aan — let op de aanhalingstekens      |

Geheimen worden bij elk verzoek gelezen en niet in de bouw gebakken, dus een
geheim dat je ná de deploy zet, werkt meteen. Een fout in `GEZIN_PROJECT_REF` of
in het token vraagt wél om de workflow opnieuw te draaien.

### 4. Inloggen aanzetten zoals het hoort

> **Deze stap moet áf zijn vóór stap 5, zonder uitzondering.** Sinds ADR-178 is
> het account de poort vóór de pincode, en stap 5 is de stap die die poort op de
> live site aanzet. Staat **Confirm email** dan nog uit, dan geeft Supabase bij
> aanmelden meteen een sessie terug — en dan is de poort "typ een willekeurig
> adres en een wachtwoord". Dat is zwakker dan het geboortejaar dat hij
> vervangt, want een jaartal moest tenminste nog kloppen.
>
> De volgorde is dus geen nettigheid maar de werking zelf: de klik in de mail
> ís de poort.
>
> **Maar testen kan hier nog niet.** Het gaat om de volgorde van de
> _schakelaars_, niet van de proeven. Zolang `GEZIN_URL` leeg is, bestaat er
> nergens in de app een aanmeldformulier — `isIngesteld()` is dan onwaar — dus
> je kunt op dit punt geen account maken en geen wachtwoord resetten. Zet
> `Confirm email` hier aan, doe stap 5, en test daarna (zie **4b** hieronder).

Onder **Authentication → Providers → Email**:

- **Confirm email: aan.** Een ouder die zich aanmeldt met het adres van een
  ander, moet dat adres eerst kunnen openen. Hiervoor is een eigen SMTP nodig
  (**Project Settings → Authentication → SMTP**); de ingebouwde mailer van
  Supabase is bedoeld om mee te proberen en houdt het bij een handvol berichten
  per uur.
- **Minimum password length: 6.** Dezelfde ondergrens als de app zelf aanhoudt,
  en ADR-155 legt uit waarom het er niet meer zijn.

Onder **Authentication → URL Configuration**:

- **Site URL:** `https://www.leer.nu`.
- **Redirect URLs:** voeg `https://www.leer.nu/ouder` toe. Daar komt de link uit
  een herstelmail op uit (ADR-186). Staat hij er niet, dan stuurt Supabase de
  link naar de Site URL. De app vangt hem daar ook op, dus er breekt niets, maar
  de ouder komt dan op de voorpagina uit in plaats van bij de ouderpagina.

Een kind komt hier nooit langs: het heeft geen adres dat post kan ontvangen, en
het wordt aangemaakt door `kind-beheer` met de service-sleutel. Meldt iemand
zich met de hand aan op een `@kind.invalid`-adres, dan maakt de trigger
`gezin_nieuwe_gebruiker` daar géén ouder van, en zo iemand bezit dus geen enkele
rij en kan nergens bij.

#### 4b. De mailtest — na stap 5

Deze hoort hier omdat hij bij stap 4 thuis is, maar hij kán pas na stap 5.

Ga naar de ouderpagina op de live site en maak een account met je eigen adres.
Twee dingen moeten kloppen: je krijgt een bevestigingsmail, en **zonder** op de
link te klikken kom je er niet in.

**Staat er al een pincode op dat apparaat, dan zie je de poort niet.** `Pinslot`
begint dan in de stand "openen" — de poort staat vóór het _zetten_ van een
pincode, niet vóór het openen ervan. Gebruik dan de knop **Pincode vergeten?**,
of een privévenster waar nog geen pincode staat.

Komt de mail niet aan, dan heb je eigen SMTP nodig (**Project Settings →
Authentication → SMTP**). Tot dat werkt: haal de twee variabelen uit stap 5 weg
en bouw opnieuw. Dan staat het geboortejaar er weer en is er niets kapot.

### 5. De variabelen voor de build

Kopieer uit het dashboard:

- de **Project URL** (`https://<project-ref>.supabase.co`), onder **Project
  Settings → Data API**;
- de **publishable key** (`sb_publishable_…`), onder **Project Settings → API
  Keys**.

Gebruik **nooit** de secret key of de service_role key. Die geeft volledige
toegang tot alles wat hierboven met zorg is dichtgezet, en hoort niet in een
app die op het apparaat van een kind draait.

Zet ze in GitHub bij **Settings → Secrets and variables → Actions → Variables**
(bij Variables en niet bij Secrets, want ze komen toch in de app terecht):

| Variabele   | Wat                |
| ----------- | ------------------ |
| `GEZIN_URL` | de Project URL     |
| `GEZIN_KEY` | de publishable key |

**Let op: dit is een schakelaar en geen voorbereiding.** Hier stond tot ADR-178
dat deze twee variabelen pas vanaf F2 gebruikt zouden worden en dat er tot dan
niets verandert. Dat klopt niet meer. `ci.yml` geeft ze mee, en de app leest ze
bij het opstarten: zodra ze gevuld zijn en er een nieuwe bouw live staat, is het
account de poort vóór de pincode en is het geboortejaar van het scherm.

Twee gevolgen die je wil kennen vóór je op _Add variable_ drukt:

- **Stap 4 moet af zijn.** Zonder `Confirm email` is de poort van ADR-178 een
  formulier dat iedereen invult. Zie de waarschuwing daar.
- **Het gaat pas in bij de volgende bouw.** Vite bakt deze waarden in de
  JavaScript; een variabele wijzigen doet niets aan wat er nu live staat. Draai
  daarna de `CI`-workflow op `main` opnieuw, of merge iets kleins — dan pakt de
  `deploy`-job ze mee.

Terug kan altijd: haal je de twee variabelen weg en bouw je opnieuw, dan staat
het geboortejaar er weer. Dat is de terugval van ADR-178 en die blijft bestaan.

## Wat waar staat

| Wat                                | Waar                                 |
| ---------------------------------- | ------------------------------------ |
| De tabellen, de policies, de RPC's | `supabase/migrations/0001_gezin.sql` |
| Inloggen als kind                  | `supabase/functions/kind-inloggen/`  |
| Wat een ouder met een kind doet    | `supabase/functions/kind-beheer/`    |
| De code en het wachtwoord, puur    | `supabase/functions/_gezin/code.ts`  |
| De premiumcodes (ander project)    | `tools/premium/README.md`            |

De beslissingen staan in ADR-155 in [`DECISIONS.md`](DECISIONS.md); de tabellen
staan als deel C in [`DATAMODEL.md`](DATAMODEL.md).

## Uitproberen

De inlog, met een code die niet bestaat. Dit hoort `onjuist` te zeggen en er
ongeveer een halve seconde over te doen — dat wachten is met opzet, zodat de
tijd niet verraadt of een code bestaat:

```bash
curl -s -X POST https://<project-ref>.supabase.co/functions/v1/kind-inloggen \
  -H 'content-type: application/json' \
  -d '{"code":"KIND-AAAA-2345","wachtwoord":"konijn"}'
```

Een kind aanmaken kan pas als er een ouder is. Meld je aan in de app (vanaf F2),
of maak met de hand een gebruiker onder **Authentication → Users**; de trigger
maakt daar dan een rij in `ouders` bij. Met het token van die ouder:

```bash
curl -s -X POST https://<project-ref>.supabase.co/functions/v1/kind-beheer \
  -H 'content-type: application/json' \
  -H "authorization: Bearer <token van de ouder>" \
  -d '{"actie":"aanmaken","voornaam":"Sofie","wachtwoord":"konijn","groep":5}'
```

Dat antwoordt met de inlogcode. Daarmee moet de eerste curl hierboven wél een
sessie geven — en tien keer een fout wachtwoord op dezelfde code hoort
`te-vaak` op te leveren.

## Wat hier niet aan te tonen is

CI heeft geen project en geen sleutels, dus niets van wat tegen Supabase
geschreven is, wordt door een build gecontroleerd. Wat er wél getest wordt, is
alles wat een beslissing is: `inloggen.test.ts` en `beheer.test.ts` spelen elke
uitkomst na zonder netwerk, en houden ook vast dat het alfabet van de code op
alle drie de plekken hetzelfde is. De SQL zelf, de policies en het gedrag van
Supabase Auth zijn pas bewezen als de stappen hierboven één keer echt gedaan
zijn.

Twee dingen die daar het eerst zullen blijken, en die hier ontwerp zijn en geen
feit: dat Supabase een adres op `.invalid` accepteert, en dat het aanmaken van
een gebruiker in twee stappen (eerst een tijdelijk adres, dan het adres uit de
id) werkt zoals bedoeld. Gaat een van die twee niet op, dan is dat een nieuwe
ADR en geen stille reparatie.

## Wat eerst nog te doen stond

Allebei gebouwd in ADR-186.

- **Wachtwoord vergeten, voor de ouder.** `AccountBlok` heeft een derde stand
  met alleen een adres, en de poort voor wie al ingelogd is stuurt de mail naar
  het adres van de sessie. De link komt uit op `/ouder` (zie stap 4, URL
  Configuration), waar de ouder een nieuw wachtwoord kiest. De keten "pincode
  vergeten → account → wachtwoord vergeten" loopt daarmee weer rond.
- **Het project wakker houden.** `Gezin nakijken` draait nu ook op maandag en
  donderdag. De drie vragen die het stelt, zijn de activiteit die een gratis
  project nodig heeft om niet gepauzeerd te worden. Een geplande run zegt dat
  in zijn kop, en wijst bij een fout eerst naar een gepauzeerd project.
