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

#### 3b. De functies, via GitHub Actions

`.github/workflows/gezin-functions.yml` doet wat de CLI op een laptop zou doen,
maar dan met wat er in `main` staat in plaats van met wat er op iemands schijf
stond. Dat is hier geen detail: allebei de functies importeren
`../_gezin/code.ts`, en dat gedeelde bestand is precies wat niet mag verlopen —
`inloggen.test.ts` houdt vast dat het alfabet van de inlogcode op alle drie de
plekken hetzelfde is. De CLI bundelt die import mee; de editor in het dashboard
zou hem twee keer laten plakken, en dan bewaakt die toets iets anders dan wat er
draait.

Twee dingen instellen in GitHub, en let op welke van de twee waar hoort:

| Waar                                                       | Naam                    | Wat                                     |
| ---------------------------------------------------------- | ----------------------- | --------------------------------------- |
| Settings → Secrets and variables → Actions → **Variables** | `GEZIN_PROJECT_REF`     | de project-ref (staat ook in de URL)    |
| Settings → Secrets and variables → Actions → **Secrets**   | `SUPABASE_ACCESS_TOKEN` | een token uit je Supabase-accountpagina |

De ref is geen geheim — hij staat in `https://<project-ref>.supabase.co`, en dus
straks in `GEZIN_URL`. Het token is dat wél, en meer dan dat: voor zover bekend
zijn de tokens van Supabase aan je **account** gekoppeld en niet aan één project,
dus dit token kan ook bij het premiumproject. Bied Supabase je een nauwer token
aan, neem dat dan. Zet hem hoe dan ook bij Secrets en nooit bij Variables:
variabelen zijn leesbaar voor iedereen die de Actions-logboeken mag zien.

Daarna: **Actions → Gezin functions → Run workflow**. Zonder
`GEZIN_PROJECT_REF` slaat hij zichzelf over en is hij groen — net als
`premium-wakker.yml` voordat premium bestond.

Vanaf dan gaat het vanzelf: een wijziging in `kind-inloggen`, `kind-beheer` of
`_gezin` die `main` bereikt, zet zichzelf opnieuw neer. Dat is dezelfde afspraak
als voor de site — een merge naar `main` is de deploy — en het voorkomt de stand
waarin de code in de repo en de functie op de server uit elkaar gelopen zijn
zonder dat iemand het weet.

> **`kind-inloggen` gaat met `--no-verify-jwt` de deur uit, en dat hoort zo.**
> Een kind dat inlogt heeft nog geen token; er valt niets te verifiëren. Met de
> standaardinstelling wijst de poort van Supabase het verzoek met 401 af vóórdat
> de functie het ziet, en dan is de enige deur waarlangs een kind binnenkomt
> dicht. Wat die functie beschermt, beschermt ze zelf: `gezin_inlog_mag`
> begrenst per code en per gepeperd IP-adres, en een fout antwoord kost met
> opzet een halve seconde.
>
> `kind-beheer` houdt de controle wél, want daar hoort een token van een ouder
> in. Strandt de CORS-preflight van de browser daarop — een `OPTIONS` zonder
> token, afgewezen met 401 — dan is dat geen instelling om stil om te zetten
> maar een ADR waard.

### 4. Inloggen aanzetten zoals het hoort

Onder **Authentication → Providers → Email**:

- **Confirm email: aan.** Een ouder die zich aanmeldt met het adres van een
  ander, moet dat adres eerst kunnen openen. Hiervoor is een eigen SMTP nodig
  (**Project Settings → Authentication → SMTP**); de ingebouwde mailer van
  Supabase is bedoeld om mee te proberen en houdt het bij een handvol berichten
  per uur.
- **Minimum password length: 6.** Dezelfde ondergrens als de app zelf aanhoudt,
  en ADR-155 legt uit waarom het er niet meer zijn.

Een kind komt hier nooit langs: het heeft geen adres dat post kan ontvangen, en
het wordt aangemaakt door `kind-beheer` met de service-sleutel. Meldt iemand
zich met de hand aan op een `@kind.invalid`-adres, dan maakt de trigger
`gezin_nieuwe_gebruiker` daar géén ouder van, en zo iemand bezit dus geen enkele
rij en kan nergens bij.

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

De build gebruikt ze pas vanaf F2, wanneer de app zelf kan inloggen; tot dan
staan ze klaar en verandert er niets. `ci.yml` geeft ze mee zodra die code er
is — een variabele doorgeven die nog nergens gelezen wordt, is dode
configuratie.

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
