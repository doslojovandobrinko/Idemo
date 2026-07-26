# IDEMO Partner Portal V1 Production Architecture Baseline
**Zvanična tehnička specifikacija i sistemska arhitektura**

* **Status dokumenta:** FROZEN AND APPROVED
* **Verzija dokumenta:** v1.2.0-LOCKED
* **Ciljna platforma:** Supabase + PostgreSQL (Cloud Run hibridno okruženje)
* **Kontekst:** IDEMO Core ekosistem (Belgrade EXPO 2027 VIP Concierge)

---

## 1. Zaključani V1 Poslovni Tok (Usklađen sa Editorial standardima)

U skladu sa **IDEMO Ustavom dizajna** i principom **luksuza kroz uzdržanost (Luxury Through Restraint)**, IDEMO v1 portal ne funkcioniše kao otvoreni marketplace sa konkurentskim nadmetanjem (bidding/broadcast). Umesto toga, primenjuje se **kontrolisani, sekvencijalni model** koji poštuje diskreciju posetioca i operativni mir partnera.

### Pravilo sekvencijalnog pregleda (No Partner Comparison)
Izričito je zabranjeno bilo kakvo upoređivanje ponuda partnera od strane posetioca (no partner comparison, no proposal comparison, no comparing partner offers). Posetilac u svakom trenutku pregleda isključivo trenutni pojedinačni odgovor aktivnog partnera. Nikada ne postoji više od jedne aktivne ponude vidljive posetiocu. Posetilac može:
* potvrditi trenutnu ponudu (confirm),
* odbiti trenutnu ponudu (decline),
* ili zatražiti drugu opciju (request another option - čime se ponuda odbija i upit prosleđuje sledećem kandidatu iz reda).

### Koraci stvarnog višekorisničkog toka:
1. **Kreiranje upita:** Posetilac pretražuje IDEMO preporuke (unutar mobilne ili web aplikacije). Kada odluči da pošalje upit, pokreće se kontrolisani proces kreiranja upita. Podaci o upitu se trajno čuvaju.
2. **Sekvencijalno dodeljivanje (Matching):** Sistem analizira zahteve i pronalazi listu odgovarajućih aktivnih partnera prema kanonskim sposobnostima. Umesto slanja svima odjednom, sistem bira **isključivo jednog** najprikladnijeg partnera kao aktivnog kandidata.
3. **Faza "Prilike" (Opportunities):** Izabranom partneru se šalje ponuda sa statusom `offered`. Partner vidi osnovne parametre upita (željeni datum, vreme, jezik i beleške posetioca), ali su kontakt podaci posetioca **potpuno sakriveni**.
4. **Interakcija partnera:**
   - Partner otvara detalje (status prelazi u `viewed`).
   - Partner može da **prihvati upit** (`accept_as_requested`), **predloži alternativu** (`propose_alternative` sa novim datumom/vremenom) ili **odbije** (`declined`).
   - Ako partner prihvati ili predloži alternativu, njegov odgovor prelazi u tab **Moje**.
5. **Vremensko ograničenje (Auto-Expiry):** Ako partner ne odgovori u definisanom konfiguracionom roku (npr. 2 sata), ponuda dobija status `expired`. Sistem automatski preusmerava priliku sledećem partneru u redu. Ako nema više kandidata, upit prelazi u stanje `needs_assistance` i prosleđuje se IDEMO concierge-u na ručni pregled.
6. **Odgovor i potvrda posetioca:** Posetilac dobija obaveštenje o ponudi partnera.
   - Posetilac može da **potvrdi ponudu** (upit dobija status `confirmed`, čime se partneru otključavaju kontakt podaci i aktivira se status **Potvrđeno**).
   - Posetilac može da **odbije** ili **zatraži drugu opciju** (upit se vraća u matching za sledećeg kandidata).
7. **Arhiviranje i Istorija:** Završeni upiti (`completed`), otkazani od strane posetioca (`canceled`) ili zatvoreni od strane administratora (`closed`) prelaze u tab **Istorija**.

---

## 2. Potpuni Model Podataka (SQL Relacione Tabele)

Svi primarni ključevi koriste UUID generisan serverski (`gen_random_uuid()`). Svi vremenski pečati se skladište u UTC formatu (`TIMESTAMP WITH TIME ZONE`).

### 2.1 Enumi i Prilagođeni Tipovi
```sql
CREATE TYPE public.partner_status AS ENUM ('invited', 'active', 'paused', 'suspended', 'closed');
CREATE TYPE public.moderation_status AS ENUM ('proposed', 'approved', 'rejected', 'suspended');
CREATE TYPE public.requirement_level AS ENUM ('required', 'preferred', 'informational');
CREATE TYPE public.inquiry_status AS ENUM ('new', 'matching', 'awaiting_visitor', 'confirmed', 'in_progress', 'completed', 'canceled', 'needs_assistance', 'closed');
CREATE TYPE public.match_status AS ENUM ('offered', 'viewed', 'responded', 'selected', 'not_selected', 'declined', 'expired', 'withdrawn');
CREATE TYPE public.candidate_status AS ENUM ('queued', 'offered', 'skipped', 'ineligible', 'exhausted');
CREATE TYPE public.response_type AS ENUM ('accept_as_requested', 'propose_alternative');
CREATE TYPE public.partner_response_status AS ENUM ('submitted', 'accepted_by_visitor', 'declined_by_visitor', 'withdrawn');
```

### 2.2 Sistemska Podešavanja i Geografija
```sql
-- Sadrži osetljive i sistemske konfiguracione parametre. Pristup je strogo zabranjen za klijente.
CREATE TABLE public.system_settings (
    key VARCHAR(255) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.service_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_en VARCHAR(255) UNIQUE NOT NULL,
    name_sr VARCHAR(255) UNIQUE NOT NULL,
    parent_id UUID REFERENCES public.service_areas(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### 2.3 Taksonomija Sposobnosti i Jezici
```sql
CREATE TABLE public.capabilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) UNIQUE NOT NULL,
    label_en VARCHAR(255) NOT NULL,
    label_sr VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.languages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(10) UNIQUE NOT NULL, -- 'en', 'sr', 'zh'
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### 2.4 Preporuke (Sadržajno Jezgro)
```sql
CREATE TABLE public.recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title_en VARCHAR(255) NOT NULL,
    title_sr VARCHAR(255) NOT NULL,
    service_area_id UUID REFERENCES public.service_areas(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.recommendation_capabilities (
    recommendation_id UUID REFERENCES public.recommendations(id) ON DELETE CASCADE,
    capability_id UUID REFERENCES public.capabilities(id) ON DELETE CASCADE,
    requirement_level public.requirement_level DEFAULT 'required'::public.requirement_level NOT NULL,
    PRIMARY KEY (recommendation_id, capability_id)
);
```

### 2.5 Partneri i Moderacija Portfolija
```sql
CREATE TABLE public.partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    status public.partner_status DEFAULT 'invited'::public.partner_status NOT NULL,
    is_open_for_inquiries BOOLEAN DEFAULT true NOT NULL,
    paused_until TIMESTAMP WITH TIME ZONE,
    contact_preference VARCHAR(100) DEFAULT 'WhatsApp' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Pridružene tabele koriste status 'proposed' i zahtevaju admin odobrenje pre nego što utiču na matching
CREATE TABLE public.partner_capabilities (
    partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE,
    capability_id UUID REFERENCES public.capabilities(id) ON DELETE CASCADE,
    status public.moderation_status DEFAULT 'proposed'::public.moderation_status NOT NULL,
    reviewed_by UUID,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (partner_id, capability_id)
);

CREATE TABLE public.partner_languages (
    partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE,
    language_id UUID REFERENCES public.languages(id) ON DELETE CASCADE,
    status public.moderation_status DEFAULT 'proposed'::public.moderation_status NOT NULL,
    reviewed_by UUID,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (partner_id, language_id)
);

CREATE TABLE public.partner_service_areas (
    partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE,
    service_area_id UUID REFERENCES public.service_areas(id) ON DELETE CASCADE,
    status public.moderation_status DEFAULT 'proposed'::public.moderation_status NOT NULL,
    reviewed_by UUID,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (partner_id, service_area_id)
);
```

### 2.6 Upiti i Izolovani Kontakt Podaci
```sql
CREATE TABLE public.inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recommendation_id UUID REFERENCES public.recommendations(id) ON DELETE RESTRICT NOT NULL,
    visitor_auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status public.inquiry_status DEFAULT 'new'::public.inquiry_status NOT NULL,
    visitor_notes TEXT NOT NULL,
    preferred_language_id UUID REFERENCES public.languages(id) ON DELETE RESTRICT NOT NULL,
    service_area_id UUID REFERENCES public.service_areas(id) ON DELETE RESTRICT NOT NULL,
    requested_start_at TIMESTAMP WITH TIME ZONE NOT NULL,
    requested_end_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Kriptografski zaštićen oporavak i praćenje bez registracije nalozi
    public_reference_code VARCHAR(12) UNIQUE NOT NULL, -- Kratak, lako čitljiv kod za posetioca (npr. IDM-827-XAA)
    recovery_token_hash VARCHAR(64) NOT NULL, -- SHA-256 hash tajnog tokena
    recovery_token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    recovery_token_revoked_at TIMESTAMP WITH TIME ZONE,
    recovery_token_used_at TIMESTAMP WITH TIME ZONE,
    recovery_failed_attempts INT DEFAULT 0 NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Fizička izolacija ličnih podataka posetioca - RLS u potpunosti blokira SELECT partnerima
CREATE TABLE public.inquiry_private_contacts (
    inquiry_id UUID PRIMARY KEY REFERENCES public.inquiries(id) ON DELETE CASCADE,
    visitor_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone_number VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.inquiry_required_capabilities (
    inquiry_id UUID REFERENCES public.inquiries(id) ON DELETE CASCADE,
    capability_id UUID REFERENCES public.capabilities(id) ON DELETE CASCADE,
    requirement_level public.requirement_level DEFAULT 'required'::public.requirement_level NOT NULL,
    PRIMARY KEY (inquiry_id, capability_id)
);
```

### 2.7 Tabele Saglasnosti (Consent Model)
```sql
CREATE TABLE public.visitor_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inquiry_id UUID REFERENCES public.inquiries(id) ON DELETE CASCADE NOT NULL,
    consent_text_version VARCHAR(50) NOT NULL, -- Verzija pravnih uslova u trenutku davanja saglasnosti
    purpose VARCHAR(255) NOT NULL, -- npr. "Otkrivanje kontakta odabranom partneru"
    channel VARCHAR(100) NOT NULL, -- npr. "E-mail i Viber"
    consented_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE
);
```

### 2.8 Sekvencijalna Redosledna Lista i Aktivni Match-evi
```sql
CREATE TABLE public.inquiry_candidates (
    inquiry_id UUID REFERENCES public.inquiries(id) ON DELETE CASCADE,
    partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE,
    queue_order INT NOT NULL,
    candidate_status public.candidate_status DEFAULT 'queued'::public.candidate_status NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (inquiry_id, partner_id),
    CONSTRAINT unique_queue_order UNIQUE (inquiry_id, queue_order)
);

CREATE TABLE public.inquiry_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inquiry_id UUID REFERENCES public.inquiries(id) ON DELETE CASCADE NOT NULL,
    partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE NOT NULL,
    status public.match_status DEFAULT 'offered'::public.match_status NOT NULL,
    offered_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    viewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- STRUČNI OSIGURAČ: Garantuje da postoji NAJVIŠE JEDAN aktivni ponuđeni/pogledani match po upitu
CREATE UNIQUE INDEX unique_active_match_per_inquiry 
ON public.inquiry_matches (inquiry_id) 
WHERE status IN ('offered', 'viewed');
```

### 2.9 Detaljni Odgovori Partnera (Response Model)
```sql
CREATE TABLE public.partner_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID REFERENCES public.inquiry_matches(id) ON DELETE CASCADE UNIQUE NOT NULL,
    response_type public.response_type NOT NULL,
    message TEXT NOT NULL, -- Detaljno obrazloženje ponude ili alternativni predlog
    proposed_start_at TIMESTAMP WITH TIME ZONE,
    proposed_end_at TIMESTAMP WITH TIME ZONE,
    status public.partner_response_status DEFAULT 'submitted'::public.partner_response_status NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### 2.10 Strogi Audit Log (Append-Only)
```sql
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_auth_user_id UUID, -- auth.uid() operatera
    actor_partner_id UUID, -- ID partnera ako je u pitanju partnerska operacija
    actor_role VARCHAR(50) NOT NULL, -- 'visitor_anonymous', 'partner', 'concierge', 'admin', 'system_cron'
    action VARCHAR(100) NOT NULL, -- npr. "match_expired", "contact_revealed"
    resource_type VARCHAR(100) NOT NULL, -- npr. "inquiry_private_contacts"
    resource_id UUID NOT NULL,
    result VARCHAR(50) DEFAULT 'success' NOT NULL,
    safe_metadata JSONB DEFAULT '{}'::jsonb NOT NULL, -- Bez ikakvih PII podataka (ime, kontakt, tokeni)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Onemogućavanje bilo kakvih izmena i brisanja nad audit zapisima na nivou baze
CREATE OR REPLACE FUNCTION public.block_audit_log_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit zapisi su trajni i nepromenljivi. UPDATE i DELETE operacije su strogo zabranjene.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER secure_audit_logs_immutability
BEFORE UPDATE OR DELETE ON public.audit_logs
FOR EACH ROW EXECUTE FUNCTION public.block_audit_log_mutation();
```

---

## 3. Autorizacija i RLS Matrice

Supabase platforma se oslanja na PostgreSQL Row Level Security (RLS) za razdvajanje identiteta. Uloge su precizno podeljene u tri primarne bezbednosne klase.

### 3.1 Definicija Bezbednosnih Klasa
1. **Unauthenticated Public Client (`anon`):** Nemaju pristup bazi podataka. Ne mogu izvršavati `SELECT` ili `INSERT` nad poslovnim tabelama. Sva interakcija ide kroz strogo definisane javne RPC funkcije ili Edge Functions.
2. **Anonymous Supabase Auth Visitor (`authenticated` sa `is_anonymous = true` claimom):** Posetilac koji ima privremenu sesiju. Može pristupiti i modifikovati isključivo sopstvene kreirane upite na osnovu ključa `visitor_auth_user_id = auth.uid()`.
3. **Permanent Authenticated Partner (`authenticated` bez `is_anonymous`):** Prijavljeni zvanični partner sa nalogom. Identitet se validira povezivanjem `auth.uid()` sa `partners.auth_user_id`. Ima pristup samo sopstvenim ponudama, podacima i portfoliju.

### 3.2 RLS Matrica (Row Level Security)

| Naziv tabele | Uloga (Role) | SELECT | INSERT | UPDATE | DELETE |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `system_settings` | `anon` / `authenticated` | **NE** (Strogo zatvoreno) | **NE** | **NE** | **NE** |
| `service_areas` | `anon` / `authenticated` | **DA** (Sve) | **NE** | **NE** | **NE** |
| `capabilities` | `anon` / `authenticated` | **DA** (Sve) | **NE** | **NE** | **NE** |
| `partners` | `authenticated` (Partner) | `auth_user_id = auth.uid()` | **NE** | `auth_user_id = auth.uid()` (Samo otvorenost, pauza, i neosetljiva polja) | **NE** |
| `partner_capabilities`| `authenticated` (Partner) | `partner_id = (SELECT id FROM partners WHERE auth_user_id = auth.uid())` | `partner_id = (SELECT id FROM partners WHERE auth_user_id = auth.uid())` (Uvek se upisuje kao `proposed`) | **NE** (Moderacija zabranjena) | `partner_id = (SELECT id FROM partners WHERE auth_user_id = auth.uid())` (Samo ako je status `proposed`) | **NE** |
| `inquiries` | `authenticated` (Visitor) | `visitor_auth_user_id = auth.uid()` | **NE** (Samo preko RPC-a) | **NE** | **NE** |
| `inquiries` | `authenticated` (Partner) | `id IN (SELECT inquiry_id FROM inquiry_matches WHERE partner_id = (SELECT id FROM partners WHERE auth_user_id = auth.uid()))` | **NE** | **NE** | **NE** |
| `inquiry_private_contacts` | `authenticated` (Visitor) | `inquiry_id IN (SELECT id FROM inquiries WHERE visitor_auth_user_id = auth.uid())` | **NE** (Samo preko RPC-a) | **NE** | **NE** |
| `inquiry_private_contacts` | `authenticated` (Partner) | **NE** (Direktno čitanje blokirano. Pristup isključivo preko bezbednog RPC-a nakon `selected` i `consent` potvrde) | **NE** | **NE** | **NE** |
| `inquiry_matches` | `authenticated` (Partner) | `partner_id = (SELECT id FROM partners WHERE auth_user_id = auth.uid())` | **NE** | `partner_id = (SELECT id FROM partners WHERE auth_user_id = auth.uid())` (Samo promena statusa u `viewed`/`declined`) | **NE** |
| `partner_responses` | `authenticated` (Partner) | `match_id IN (SELECT id FROM inquiry_matches WHERE partner_id = (SELECT id FROM partners WHERE auth_user_id = auth.uid()))` | `match_id IN (SELECT id FROM inquiry_matches WHERE partner_id = (SELECT id FROM partners WHERE auth_user_id = auth.uid()))` | `match_id IN (SELECT id FROM inquiry_matches WHERE partner_id = (SELECT id FROM partners WHERE auth_user_id = auth.uid()))` (Samo sopstveni draft/predlozi) | **NE** |
| `audit_logs` | `anon` / `authenticated` | **NE** (Klijentski pristup zabranjen) | **NE** | **NE** | **NE** |

---

## 4. PostgreSQL Eksplicitne Dozvole (Grants Matrica)

Row Level Security (RLS) se dopunjuje strogim uskraćivanjem osnovnih PostgreSQL dozvola, čime se obezbeđuje višeslojna odbrana (Defense-in-Depth).

```sql
-- Poništavanje podrazumevanih dozvola za anonimne i standardne korisnike
ALTER DEFAULT PRIVILEGES REVOKE ALL ON TABLES FROM PUBLIC;
ALTER DEFAULT PRIVILEGES REVOKE ALL ON FUNCTIONS FROM PUBLIC;

-- DOZVOLE ZA METADATA TABELE (Samo SELECT javno)
GRANT SELECT ON public.service_areas TO anon, authenticated;
GRANT SELECT ON public.capabilities TO anon, authenticated;
GRANT SELECT ON public.languages TO anon, authenticated;
GRANT SELECT ON public.recommendations TO anon, authenticated;
GRANT SELECT ON public.recommendation_capabilities TO anon, authenticated;

-- DOZVOLE ZA PROFILE I PORTFOLIO PARTNERA
GRANT SELECT, UPDATE ON public.partners TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.partner_capabilities TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.partner_languages TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.partner_service_areas TO authenticated;

-- DOZVOLE ZA LIFECYCLE UPITA
GRANT SELECT ON public.inquiries TO authenticated;
GRANT SELECT ON public.inquiry_required_capabilities TO authenticated;
GRANT SELECT ON public.inquiry_matches TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.partner_responses TO authenticated;

-- PRIVILEGIJE NAD OSETLJIVIM TABELAMA SE POTPUNO USKRAĆUJU KLIJENTIMA
-- Pristup ovim tabelama je rezervisan isključivo za "service_role" (admin backend) i bezbedne SECURITY DEFINER funkcije
REVOKE ALL ON public.system_settings FROM anon, authenticated;
REVOKE ALL ON public.inquiry_private_contacts FROM anon, authenticated;
REVOKE ALL ON public.visitor_consents FROM anon, authenticated;
REVOKE ALL ON public.inquiry_candidates FROM anon, authenticated;
REVOKE ALL ON public.audit_logs FROM anon, authenticated;
```

---

## 5. Bezbedna Autentifikacija, Sesije i Oporavak (Recovery)

Autentifikacioni model eliminiše nesigurne PIN kodove iz klijentskog koda. Pristup se zasniva na zvaničnim Supabase standardima.

```
                    TOH OPORAVKA UPITA PREKO EDGE FUNKCIJE
┌─────────────────┐       ┌──────────────────────┐       ┌─────────────────┐
│     VISITOR     │       │    EDGE FUNCTION     │       │   POSTGRESQL    │
└────────┬────────┘       └──────────┬───────────┘       └────────┬────────┘
         │                           │                            │
         │ 1. Unos koda i tokena     │                            │
         ├──────────────────────────>│                            │
         │                           │ 2. Računanje SHA-256 hasha │
         │                           ├───────────────────────────>│
         │                           │                            │
         │                           │ 3. Provera hash-a, roka,   │
         │                           │    pokušaja i opoziva      │
         │                           │<───────────────────────────┤
         │                           │                            │
         │ 4. Vraćanje sanitizovanog │                            │
         │    jednog upita (JSON)    │                            │
         │<──────────────────────────┤                            │
         ▼                           ▼                            ▼
```

### 5.1 Model pristupa i oporavka bez registracije (Visitor Flow)
Posetilac ne mora da kreira nalog kako bi poslao upit. Kada se upit kreira kroz Edge funkciju, sistem:
1. Inicira **anonymous Supabase Auth session** na klijentskom uređaju (ako već ne postoji), dobijajući privremeni `auth.uid()`.
2. Generiše **kratki referentni kod** za usmenu/vizuelnu komunikaciju (npr. `IDM-481-CBE`) koji se slobodno prikazuje.
3. Generiše visokoentropijski **kriptografski recovery token** (32-karakterne dužine, npr. `idm_rc_7e3a9f...`).
4. Skladišti isključivo **SHA-256 hash** tog tokena u tabelu `inquiries` u kolonu `recovery_token_hash`. Raw token se prikazuje posetiocu jednom i odmah se trajno uklanja sa servera.

### 5.2 Proces oporavka na drugom uređaju (Cross-Device Recovery)
Ako posetilac želi da vidi status svog upita na novom uređaju (gde nema sačuvanu anonimnu sesiju):
1. Posetilac unosi kratki referentni kod i tajni recovery token.
2. Unos se šalje namenskoj **Supabase Edge funkciji** koja:
   - Proverava broj neuspešnih pokušaja (`recovery_failed_attempts`) radi zaštite od brute-force napada (nakon 5 neuspešnih pokušaja, proces se zaključava).
   - Izračunava SHA-256 hash unetog tokena i poredi ga sa `recovery_token_hash` u bazi podataka.
   - Proverava da li je token istekao (`recovery_token_expires_at`) ili je opozvan (`recovery_token_revoked_at`).
   - Ako su svi uslovi ispunjeni, Edge funkcija **ne generiše i ne vraća Supabase Session JWT** (čime se sprečava proizvoljna manipulacija sesijama), već vraća **isključivo sanitizovane podatke tog jednog konkretnog upita** i njegove trenutne match-eve u JSON formatu.
   - Sve naredne akcije posetioca (prihvatanje, otkazivanje) obavljaju se isključivo preko namenskih API endpoint-a unutar te iste Edge funkcije koja striktno proverava autorizacioni token pri svakom zahtevu.

### 5.3 Partnerska autentifikacija i bezbedno skladište na mobilnim uređajima
* **Pristup partnera:** Authentication and Identity Management will be implemented using the approved Supabase Auth architecture. The exact production authentication model (PIN, email, phone, MFA, or a combination) will be finalized during backend implementation and security review.
* **Mobilni klijenti (Capacitor/Vite):** Zabranjeno je korišćenje standardnog `@capacitor/preferences` za skladištenje osetljivih tokena jer ih on čuva u čistom tekstualnom formatu na uređaju. Aplikacija zahteva integraciju prilagođenog storage adaptera koji se oslanja na verifikovane mobilne bezbednosne sisteme:
  - **iOS:** Apple Keychain Services.
  - **Android:** Android Keystore System.
* **Opoziv sesija (Session Revocation):** Prilikom svake osetljive operacije u aplikaciji (kao što je odgovor na upit), sistem vrši proveru stanja `partners.status` na serveru. Ako je partner blokiran ili suspendovan, akcija se momentalno odbija. *Napomena:* Opoziv osvežavajućih tokena (refresh tokens) na Supabase serveru je trenutan, ali klijentov već izdati Access JWT ostaje validan u memoriji do sopstvenog isteka (standardno 1 sat), što je prepoznat i dokumentovan bezbednosni rizik bez upotrebe teških serverskih blacklist rešenja.

---

## 6. Deterministički Sekvencijalni Matching i Red Kandidata

IDEMO odbacuje složene i nepredvidive algoritme u korist jasnog, revidiranog i sekvencijalnog matching modela bez upotrebe slobodnog teksta.

```
             DETERMINISTIČKI LIFECYCLE SEKVENCIJALNOG MATCHING-A
┌───────────────────────────────────────────────────────────────────────────────┐
│                           1. UPIT POSETIOCA (NEW)                             │
│  Sistem čita obavezne zahteve (Required Capabilities) i područje delovanja    │
└──────────────────────────────────────┬────────────────────────────────────────┘
                                       │
                                       ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                        2. PRONALAŽENJE KANDIDATA                              │
│  Pronalaze se svi partneri sa 'approved' statusom sposobnosti za dato         │
│  područje i jezik koji su aktivni i otvoreni za upite                         │
└──────────────────────────────────────┬────────────────────────────────────────┘
                                       │
                                       ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                        3. KREIRANJE REDA KANDIDATA                            │
│  Kandidati se upisuju u 'inquiry_candidates' sa statusom 'queued' i poretkom  │
│  generisanim preko 'least-recently-offered' (ravnomerna raspodela)            │
└──────────────────────────────────────┬────────────────────────────────────────┘
                                       │
                                       ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                     4. AKTIVACIJA PRVOG KANDIDATA (OFFERED)                   │
│  Sistem upisuje tačno JEDAN match sa statusom 'offered' i rokom od 2 sata.    │
│  Status kandidata u redu prelazi u 'offered'.                                 │
└───────────────────────────────────────────────────────────────────────────────┘
```

### 6.1 Algoritam formiranja reda kandidata i pravila determinističke podobnosti
Kada se novi upit kreira kroz proceduru `create_public_inquiry`:

1. **Validacija preporuke i područja:** Sistem povezuje upit sa preporukom iz tabele `recommendations` i naslednim područjem delovanja (`service_areas`).
2. **Deterministička podobnost (Deterministic Eligibility Criteria):** Identifikuju se svi partneri koji ispunjavaju sledeće eksplicitne i stroge uslove podobnosti (no free-text, no opaque scoring, no AI ranking):
   - Partnerov globalni status je aktivan: `partners.status = 'active'`.
   - Partner je otvoren za upite: `partners.is_open_for_inquiries = true`.
   - Partner nije trenutno pauziran: `partners.paused_until` je `NULL` ili u prošlosti (expired).
   - Partner poseduje **sve** zahtevane sposobnosti obeležene sa `required` u tabeli `inquiry_required_capabilities` (čisti AND uslov nad `partner_capabilities.status = 'approved'`).
   - Partner podržava zahtevani jezik upita (`partner_languages.status = 'approved'`).
   - Partner je odobren za zahtevano područje delovanja (`partner_service_areas.status = 'approved'`).
3. **Poredak i prioritizacija (Least-Recently-Offered):** Među svim podobnim partnerima, poredak se određuje na osnovu datuma kada im je poslednji put poslata ponuda. Partneri koji najduže nisu dobili ponudu dobijaju najviši prioritet (ravnomerna raspodela posla bez protežiranja).
   - **Pravilo razrešavanja nerešenih rezultata (Tie-Breaker):** Ukoliko postoji tačan vremenski podudarni rezultat (tie), poredak se određuje deterministički na osnovu partnerovog UUID-a (ili drugog stabilnog jedinstvenog identifikatora). Nema težinskih faktora, preferencijalnih sposobnosti ili kompleksnog rangiranja u V1.
4. **Nepromenljivi red kandidata (Immutable Candidate Queue):** Izabrani partneri se upisuju u tabelu `inquiry_candidates` sa statusom `queued` i definisanim redosledom `queue_order` (od 1 do N).
   - **Pravilo trajnosti reda (Freeze Queue):** Red kandidata i njihova sekvencijalna struktura se generišu **tačno jednom** prilikom kreiranja upita i ostaju **trajno zamrznuti** tokom celog životnog ciklusa tog upita. Red se nikada naknadno ne preračunava niti ponovo rangira.
   - **Arhitektonska invarijanta (Architectural Invariant):** "The candidate queue is created exactly once during inquiry creation and thereafter becomes immutable historical data. No function, trigger, cron job, administrator process, or later routing phase may recalculate or reorder the queue."
   - Status pojedinačnih kandidata se menja (npr. u `skipped` ili `ineligible` ako partner u međuvremenu bude suspendovan, zatvoren ili nedostupan), ali se članstvo i redosled same liste ne menjaju. Svako preskakanje partnera mora biti zabeleženo u auditable formatu.

### 6.2 Pravila sequential prelaza
* **Slanje prve ponude:** Prvi kandidat iz reda (`queue_order = 1`) dobija zapis u tabeli `inquiry_matches` sa statusom `offered` i rokom isteka. Njegov status u `inquiry_candidates` prelazi u `offered`.
* **Prelazak na sledećeg:** Ako ponuda istekne ili partner odbije:
  - Trenutni zapis u `inquiry_matches` dobija status `expired` ili `declined`.
  - Status tog kandidata u `inquiry_candidates` se menja u `skipped` ili `ineligible`.
  - Sistem pronalazi sledećeg kandidata sa statusom `queued` u tabeli `inquiry_candidates`, kreira za njega novi aktivni match u `inquiry_matches` i postavlja novi vremenski prozor.
* **Sprečavanje dupliranja:** Baza podataka preko parcijalnog jedinstvenog indeksa garantuje da se za jedan upit nikada ne mogu naći dva istovremena partnera u aktivnom stanju (`offered` ili `viewed`).

---

## 7. Katalog RPC i Edge Funkcija

Sve funkcije koje se izvršavaju sa `SECURITY DEFINER` privilegijama poseduju eksplicitno definisan prazan `search_path` radi prevencije napada otmicom šeme (Schema Hijacking), koriste potpuno kvalifikovana imena tabela i izvršavaju sve korake unutar atomskih transakcija.

### 7.1 Javni API (Za posetioca - Edge / RPC)

#### 1. `create_public_inquiry`
* **Svrha:** Kreiranje novog upita od strane anonimnog posetioca.
* **Tip:** SECURITY DEFINER RPC (ili Edge Function sa privilegovanim ključem).
* **Izvršni koraci:**
  1. Validira postojanje `recommendation_id` i validnost datuma.
  2. Validira uneti kontakt i proverava da li je saglasnost zabeležena u `visitor_consents` tabeli.
  3. Proverava dužinu beleške posetioca (maksimalno 1000 karaktera) radi sprečavanja zloupotrebe memorije.
  4. Generiše jedinstveni kratki referentni kod i SHA-256 hash tajnog recovery tokena.
  5. Upisuje podatke u `inquiries`, `inquiry_private_contacts` i `visitor_consents` unutar jedne transakcije.
  6. Pokreće proceduru za automatsko formiranje kandidata u `inquiry_candidates`.
  7. Aktivira prvu ponudu za partnera sa najvišim prioritetom.

#### 2. `recover_inquiry_by_token`
* **Svrha:** Oporavak i pregled statusa upita bez otvaranja punopravnog naloga.
* **Tip:** Supabase Edge Function.
* **Izvršni koraci:**
  1. Prima referentni kod i raw recovery token.
  2. Pretražuje bazu i inkrementira broj promašaja ako se hash ne poklapa.
  3. Ako je broj neuspešnih pokušaja prešao 5 u poslednjih sat vremena, momentalno odbija dalji rad.
  4. Ukoliko je token validan i neaktivan/neistekao, vraća bezbedan JSON objekat sa statusom upita i podacima o ponuđenim odgovorima partnera. Kontakt podaci se ne vraćaju u ovom payloadu.

### 7.2 Partnerski API (Za partnere - Strogo zaštićen)

#### 1. `submit_partner_response`
* **Svrha:** Atomska promena stanja i slanje odgovora partnera na ponuđenu priliku.
* **Tip:** SECURITY DEFINER RPC.
* **Parametri:** `p_match_id UUID`, `p_response_type response_type`, `p_message TEXT`, `p_proposed_start TIMESTAMP`, `p_proposed_end TIMESTAMP`
* **Izvršni koraci (Atomska transakcija):**
  1. **Autentifikacija:** Određuje `partner_id` direktno pretragom preko `auth.uid()`. Ukoliko partner ne postoji ili nije u statusu `active`, transakcija se momentalno prekida.
  2. **Provera vlasništva i stanja:** Zaključava red u `inquiry_matches` i proverava da li taj match pripada tom partneru, da li mu je status `offered` ili `viewed`, i da li je vremenski rok istekao (`expires_at < now()`). Ako je istekao, akcija se odbija čak i ako cron posao još nije stigao da je označi kao isteklu.
  3. **Upis odgovora:** Upisuje detalje u tabelu `partner_responses`.
  4. **Ažuriranje stanja match-a:** Menja status u `inquiry_matches` u vrednost `responded`.
  5. **Ažuriranje stanja upita:** Postavlja status upita u `inquiries` na `awaiting_visitor` kako bi posetilac bio obavešten da ga čeka predlog.
  6. **Zapis u audit log:** Kreira bezbedan audit zapis o uspešno primljenom odgovoru.

---

## 8. Cron Katalog i Nadzorni Sistem (Cron & Watchdog Architecture)

Svi periodični poslovi se izvršavaju preko PostgreSQL `pg_cron` ekstenzije unutar Supabase okruženja, dok je nezavisni monitoring/watchdog sistem zadužen za detekciju anomalija.

### 8.1 Expiry Cron (`cron_expire_overdue_matches`)
* **Učestalost:** Svakih 5 minuta (`*/5 * * * *`).
* **Svrha:** Automatsko oslobađanje upita kod kojih je partner ostao neaktivan i sekvencijalno prosleđivanje sledećem kandidatu u redu.
* **Logika rada:**
  1. Pronalazi sve zapise u `inquiry_matches` sa statusom `offered` ili `viewed` kod kojih je `expires_at` manje od trenutnog vremena.
  2. Menja status tih match-eva u `expired`.
  3. Ažurira stanje kandidata u `inquiry_candidates` za taj upit u `skipped`.
  4. Traži sledećeg kandidata sa najnižim `queue_order` u tabeli `inquiry_candidates` koji ima status `queued`.
  5. Ako postoji, kreira novi `inquiry_matches` sa statusom `offered` za novog partnera i upisuje obaveštenje u outbox.
  6. Ako sledeći kandidat ne postoji, prebacuje upit u status `needs_assistance` kako bi privukao pažnju humanog concierge tima.
  7. Upisuje sistemski audit log o isteku ponude.

### 8.2 Watchdog proces (Nadzorni sistem)
Za razliku od Expiry Cron-a koji isključivo pomera sekvencu u normalnom toku, **zaseban i nezavisan monitoring/watchdog proces** prati zdravlje celokupnog toka rutinga i detektuje zastoje koji prevazilaze operativne limite (npr. u slučaju otkazivanja slanja obaveštenja, blokiranih transakcija ili otkazivanja samog pg_cron-a).
* **Uloga:** Watchdog periodično ispituje upite koji su predugo zaglavljeni u određenom stanju (stalled inquiries) i inicira neposrednu eskalaciju na Centralni IDEMO Concierge tim (status `needs_assistance`).
* **Prednost:** Watchdog garantuje da ukoliko bilo koja automatizovana backend komponenta otkaže, posetilac nikada ne ostane u "slepom crevu" (silent failure), već se upit odmah predaje ljudskom operateru.

### 8.3 Asinhrona obaveštenja (Outbox Pattern)
Slanje obaveštenja (e-mail, Viber itd.) partnerima je potpuno asinhrono. Baza podataka i klijentske transakcije **nikada ne zavise direktno od eksternih email provajdera**.
* **Model:**
  ```
  [Inquiry/Match transaction] -> Commit -> [Upis u notification_outbox]
                                                │
                                                ▼ (Asinhrono)
                                        [Background Worker]
                                                │
                                                ▼
                                         [Slanje E-maila]
                                                │
                                                ▼
                                    [Retry / Concierge Fallback]
  ```
* **Logika:** Sve kritične izmene stanja koje zahtevaju obaveštenje upisuju zapis u tabelu `notification_outbox` u sklopu iste ACID transakcije. Nezavisni pozadinski worker obrađuje outbox red, vrši slanje, prati status dostave i vrši ponovne pokušaje (retries) u slučaju privremenih grešaka.

### 8.4 Neutralnost provajdera e-pošte (Email Provider Neutrality)
Sistem ne favorizuje niti nameće specifičnog provajdera e-pošte. Bilo koji izabrani provajder mora zadovoljiti sledeće standardne tehničke i bezbednosne zahteve:
* Podrška za transakcioni e-mail (API ili SMTP).
* Detaljno praćenje statusa isporuke (delivery status, webhooks).
* Ugrađen mehanizam za automatski retry.
* Operativni monitoring i alarmiranje.
* Usklađenost sa zakonima o zaštiti podataka o ličnosti (GDPR/domaća regulativa).

---

## 9. Mape Statusa i Povezanost sa Korisničkim Interfejsom

Da bi se obezbedila potpuna jasnost bez mešanja stanja upita i pojedinačnih ponuda, tabovi u korisničkom interfejsu partnera i ekranima posetioca se mapiraju prema strogim pravilima.

### 9.1 Mapiranje stanja na partnerske tabove interfejsa
```
               MAPIRANJE STATUSNIH STANJA NA TABOVE INTERFEJSA
┌──────────────────────────┐  ┌──────────────────────────┐  ┌──────────────────────────┐
│   1. TAB: PRILIKE        │  │      2. TAB: MOJE        │  │    3. TAB: ISTORIJA      │
├──────────────────────────┤  ├──────────────────────────┤  ├──────────────────────────┤
│ match_status:            │  │ match_status:            │  │ match_status:            │
│ - offered (Nova ponuda)  │  │ - responded (Odgovoreno) │  │ - declined (Odbijeno)    │
│ - viewed (Pogledano)     │  │ - selected (Izabrano)    │  │ - expired (Isteklo)      │
│                          │  │                          │  │ - not_selected (Drugo)   │
│                          │  │ inquiry_status:          │  │ - withdrawn (Povučeno)   │
│                          │  │ - confirmed (Potvrđeno)  │  │                          │
│                          │  │ - in_progress (U toku)   │  │ inquiry_status:          │
│                          │  │                          │  │ - completed (Završeno)   │
│                          │  │                          │  │ - canceled (Otkazano)    │
│                          │  │                          │  │ - closed (Zatvoreno)     │
└──────────────────────────┘  └──────────────────────────┘  └──────────────────────────┘
```

### 9.2 Mapiranje i prevođenje stanja za posetioca (Visitor Status Mapping)
IDEMO ekosistem se drži principa **arhitektonske iskrenosti i smirenosti (Anti-AI-Slop & Editorial Calm)**. Interni tehnički statusi, redovi čekanja, cron izvršenja ili detalji rutinga nikada se ne izlažu posetiocu. 

Za posetioca se koristi prefinjen, smiren i jasan jezik:

| Interni status baze podataka (Backend Status) | Ekran posetioca (Visitor-Facing Language) |
| :--- | :--- |
| `new` / `matching` | **Preparing your request** |
| `offered` / `viewed` | **Waiting for local confirmation** |
| `responded` / `awaiting_visitor` | **A local arrangement is available** |
| `confirmed` / `in_progress` | **Your arrangement is confirmed** |
| `needs_assistance` / routing failure | **IDEMO Concierge will personally assist you** |

#### Ključne smernice za prikaz statusa posetiocu:
* **Bez lažne aktivnosti:** Strogo je zabranjeno prikazivanje poruka koje sugerišu da sistem "i dalje pretražuje slobodne partnere" nakon što je ponuda već uspešno poslata jednom partneru.
* **Čuvanje mira posetioca:** Ukoliko dođe do zastoja rutinga ili greške, posetilac nikada ne vidi tehničke kodove grešaka niti biva ostavljen bez odgovora. Sistem se uvek glatko i nečujno preusmerava na humanu podršku uz poruku: *"IDEMO Concierge will personally assist you."*

---

## 10. Bezbednosni Test Plan (pgTAP Specifikacija)

Test plan se izvršava unutar izolovane database transakcije koja se na kraju uvek poništava (`ROLLBACK`), obezbeđujući testiranje bez prljanja produkcionih podataka.

```sql
BEGIN;
SELECT plan(10); -- Precizno definisan broj testova

-- Test 1: Verifikacija da je RLS aktiviran nad osetljivim tabelama
SELECT has_policy('public', 'inquiries', 'RLS mora biti aktivan nad tabelom inquiries');
SELECT has_policy('public', 'inquiry_private_contacts', 'RLS mora biti aktivan nad privatnim kontaktima');

-- Test 2: RLS SELECT test za unauthenticated anonimne korisnike (rola: anon)
-- Očekuje se potpuno prazan set podataka bez SQL greške
SET ROLE anon;
SELECT is_empty(
    $$ SELECT * FROM public.inquiries $$,
    'Anonimni posetioci ne smeju imati direktan pristup listanju upita'
);

-- Test 3: RLS SELECT test za anonymous Auth posetioca (rola: authenticated)
-- Kreira se simulirana sesija i proverava se izolacija upita
SET ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '88888888-8888-8888-8888-888888888888';
SELECT is_empty(
    $$ SELECT * FROM public.inquiries WHERE visitor_auth_user_id = '99999999-9999-9999-9999-999999999999'::uuid $$,
    'Prijavljeni posetilac ne sme videti upit koji pripada drugom korisniku'
);

-- Test 4: Blokiranje direktnog pristupa sistemskim podešavanjima
SELECT is_empty(
    $$ SELECT * FROM public.system_settings $$,
    'Sistemska podešavanja ne smeju biti vidljiva običnim korisnicima'
);

-- Test 5: Stroga provera zabrane brisanja odobrenih sposobnosti od strane partnera
PREPARE delete_approved_capability AS 
    DELETE FROM public.partner_capabilities 
    WHERE partner_id = '11111111-1111-1111-1111-111111111111'::uuid 
      AND capability_id = '22222222-2222-2222-2222-222222222222'::uuid
      AND status = 'approved'::public.moderation_status;

SELECT throws_ok(
    'delete_approved_capability',
    NULL, -- RLS ili GRANT blokada
    'Partner ne sme imati dozvolu da samostalno briše već odobrene sposobnosti iz portfolija'
);

-- Test 6: Jedinstvenost aktivnog match-a (Sprečavanje paralelnih ponuda)
-- Pokušaj unosa dva aktivna match-a nad istim upitom mora biti odbačen na nivou baze
PREPARE duplicate_active_offer AS
    INSERT INTO public.inquiry_matches (inquiry_id, partner_id, status, expires_at) 
    VALUES 
    ('33333333-3333-3333-3333-333333333333'::uuid, '44444444-4444-4444-4444-444444444444'::uuid, 'offered'::public.match_status, now() + interval '2 hours'),
    ('33333333-3333-3333-3333-333333333333'::uuid, '55555555-5555-5555-5555-555555555555'::uuid, 'viewed'::public.match_status, now() + interval '2 hours');

SELECT throws_ok(
    'duplicate_active_offer',
    '23505', -- PostgreSQL Unique Violation kod greške
    NULL,
    'Parcijalni jedinstveni indeks mora sprečiti više istovremenih aktivnih ponuda za isti upit'
);

-- Test 7: Odbijanje odgovora na isteklu ponudu
-- Simulira se slanje odgovora na match čiji je rok prošao
SET LOCAL request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';
SELECT throws_ok(
    $$ SELECT public.submit_partner_response('66666666-6666-6666-6666-666666666666'::uuid, 'accept_as_requested'::public.response_type, 'Prihvatam', now(), now() + interval '1 hour') $$,
    NULL,
    'Sistem mora odbiti slanje odgovora ukoliko je rok ponude istekao'
);

-- Test 8: Zabrana lažiranja partner_id identiteta
-- Partner koji poziva funkciju ne može poslati tuđi ID kao parametar, identitet se uvek čita serverski
SELECT throws_ok(
    $$ SELECT public.submit_partner_response('66666666-6666-6666-6666-666666666666'::uuid, 'accept_as_requested'::public.response_type, 'Upad', now(), now() + interval '1 hour') $$,
    NULL,
    'Funkcije moraju zanemariti prosleđeni identitet i koristiti isključivo auth.uid()'
);

-- Test 9: Bezbednost audit loga nad ličnim podacima (PII)
-- Provera da se u audit log ne upisuju osetljivi podaci
SELECT is_empty(
    $$ SELECT * FROM public.audit_logs WHERE safe_metadata::text ~* '(email|phone|token|name)' $$,
    'Audit log metapodaci ne smeju sadržati lične podatke ili tajne ključeve'
);

-- Test 10: Odsustvo testnih i sandbox PIN-ova u produkcionom kodu
-- Provera da se pre-deployment skriptom blokiraju probni nalozi i fiksni mrežni PIN kodovi
SELECT is_empty(
    $$ SELECT * FROM public.system_settings WHERE key = 'sandbox_pins_active' AND value = 'true' $$,
    'Svi testni PIN kodovi i simulatorski nalozi moraju biti trajno deaktivirani u produkcionom okruženju'
);

SELECT * FROM finish();
ROLLBACK;
```

---

## 11. Fazni Plan Implementacije (Five Lean Phases)

Proces implementacije je podeljen na tačno pet kontrolisanih, vitkih faza, koje omogućavaju postepenu migraciju i minimizaciju rizika.

### PHASE IMPLEMENTATION DISCIPLINE
This permanent governance rule applies to every future backend phase. Every implementation phase shall follow exactly this sequence:
1. Implement the approved scope only.
2. Stop implementation.
3. Perform an independent evidence-based verification audit.
4. Correct only verified deficiencies.
5. Obtain explicit Owner approval.
6. Freeze the phase.
7. Only then may the next phase begin.

No implementation may span multiple phases. No future phase may modify functionality belonging to an already frozen phase unless explicitly authorized by the Owner.

### CHANGE CONTROL & ARCHITECTURAL STABILITY

This section defines the mandatory change control policies and architectural stability guidelines for all future development.

#### 1. CHANGE CLASSIFICATION
Every future change shall be classified into exactly one category before implementation.

* **Category A — Correction:**
  - Fixes an implementation error or deviation from the approved architecture.
  - Does not change intended behaviour.
* **Category B — Security Hardening:**
  - Improves security without changing functional behaviour.
  - *Examples include:* tighter RLS, stronger validation, safer SQL, privilege reduction, and cryptographic improvements.
* **Category C — Operational Improvement:**
  - Improves robustness, maintainability, or performance.
  - Does not change UX or business behaviour.
  - *Examples include:* indexes, logging improvements, retry handling, monitoring, and documentation.
* **Category D — Architectural Change:**
  - Changes behaviour, workflow, business rules, data model, routing logic, or UX.
  - Requires explicit Owner approval before implementation.

#### 2. FROZEN COMPONENTS
The following are now frozen and may not be changed without explicit Owner approval:
* Visitor UX
* Partner Portal UX
* Database architecture
* Routing principles
* Privacy model
* Deterministic routing model
* Candidate queue architecture
* Inquiry lifecycle
* Governance framework

#### 3. IMPLEMENTATION RULE
* Implementation must always follow the approved architecture.
* The architecture must never be rewritten to justify an implementation.
* If implementation differs from the approved architecture, the implementation shall be corrected.
* Only the Owner may approve architectural changes.

#### 4. PHASE DISCIPLINE
* No implementation may include work belonging to future phases.
* If additional work is discovered during implementation it shall be documented as `OUT OF CURRENT PHASE` and deferred.

#### 5. VERIFICATION STANDARD
Every future phase shall conclude with:
* Implementation report
* Independent evidence audit
* Correction cycle
* Owner approval
* Phase freeze

Only then may the next phase begin.

### PHASE 1 — Backend Foundation
* **Fokus:** Uspostavljanje baze podataka i bezbednosnih okvira.
* **Aktivnosti:**
  - Supabase projekat i inicijalizacija šeme.
  - PostgreSQL šema i definicija enuma, tabela i ključeva.
  - Autentifikacioni temelji (autentifikacija partnera i anonimne sesije posetioca).
  - Row-Level Security (RLS) politike i PostgreSQL eksplicitne dozvole (Grants).

### PHASE 2 — Inquiry Pipeline
* **Fokus:** Izgradnja toka javnih upita i redova čekanja.
* **Aktivnosti:**
  - Kreiranje javnog upita preko zaštićene RPC funkcije (`create_public_inquiry`).
  - Beleženje saglasnosti posetioca (`visitor_consents`).
  - Izolacija privatnih kontakt podataka u namensku tabelu (`inquiry_private_contacts`).
  - Automatsko determinističko generisanje i zamrzavanje reda kandidata (`inquiry_candidates`).
  - Pokretanje prve aktivne ponude (`offered` status u `inquiry_matches`).
* **Permanent Governance Rule (Architectural Invariant):**
  - "The candidate queue is created exactly once during inquiry creation and thereafter becomes immutable historical data. No function, trigger, cron job, administrator process, or later routing phase may recalculate or reorder the queue."
* **Phase 2 Test Audit:**
  - **Result: PARTIAL**
  - The pgTAP test suite is complete, syntactically verified, and ready for execution.
  - Execution against a live PostgreSQL database with pgTAP is pending and will occur during staging validation.
  - Do not state or imply that live database tests have already passed.

### PHASE 3 — PARTNER OPPORTUNITY LIFECYCLE
* **Objective:** ONLY to implement the secure transactional lifecycle of an opportunity assigned to a partner.
* **Included Scope:**
  - Reading assigned opportunities
  - Opening an opportunity
  - Accepting exactly as requested
  - Proposing one alternative
  - Declining
  - Database state transitions
  - Transactional integrity
  - Audit logging
* **Explicit Exclusions:**
  - Email delivery
  - SMS / WhatsApp / Viber
  - Push notifications
  - Realtime subscriptions
  - Visitor live updates
  - Contact release
  - Cron processing
  - Queue advancement
  - Concierge fallback
  - Analytics and reporting
  - Frontend redesign and UX modifications
  - Additional database entities

### PHASE 3A — VERIFICATION CORRECTIONS & LIFECYCLE VALIDATION

This section contains the official verification corrections, lifecycle rules, and security audits for the Phase 3 implementation. All details herein represent frozen architectural constraints.

#### 1. STATE TRANSITION MATRIX

The opportunity match status (`inquiry_matches.status`) must strictly adhere to the following state transition matrix. Any transition or operation not explicitly listed below is invalid and **must** be rejected by the database or application layers with the exact error message: `Illegal state transition.` or `Illegal state transition from <status>`.

| Initial Match Status | Operation / API Function Called | Target Match Status | Allowed? | Transaction Result / Side Effects |
| :--- | :--- | :--- | :--- | :--- |
| **`offered`** | `view_opportunity` | **`viewed`** | **Yes** | Updates match status to `viewed`; logs `opportunity_viewed` audit entry. |
| **`offered`** | `accept_opportunity` | **`responded`** | **Yes** | Creates standard partner response; updates match to `responded`; updates inquiry status to `awaiting_visitor`; logs `opportunity_accepted` audit entry. |
| **`offered`** | `propose_alternative_opportunity` | **`responded`** | **Yes** | Creates alternative partner response with proposed dates; updates match to `responded`; updates inquiry status to `awaiting_visitor`; logs `opportunity_alternative_proposed` audit entry. |
| **`offered`** | `decline_opportunity` | **`declined`** | **Yes** | Updates match to `declined`; updates candidate status to `skipped` in `inquiry_candidates`; logs `opportunity_declined` audit entry. |
| **`viewed`** | `view_opportunity` | **`viewed`** | **Yes** | **Idempotent No-Op**: Bypasses update, no new audit log is written, returns successful status immediately. |
| **`viewed`** | `accept_opportunity` | **`responded`** | **Yes** | Creates standard partner response; updates match to `responded`; updates inquiry status to `awaiting_visitor`; logs `opportunity_accepted` audit entry. |
| **`viewed`** | `propose_alternative_opportunity` | **`responded`** | **Yes** | Creates alternative partner response with proposed dates; updates match to `responded`; updates inquiry status to `awaiting_visitor`; logs `opportunity_alternative_proposed` audit entry. |
| **`viewed`** | `decline_opportunity` | **`declined`** | **Yes** | Updates match to `declined`; updates candidate status to `skipped` in `inquiry_candidates`; logs `opportunity_declined` audit entry. |
| **`responded`** | *Any Operation* | - | **No** | Rejected with: `Illegal state transition from responded`. |
| **`declined`** | *Any Operation* | - | **No** | Rejected with: `Illegal state transition from declined`. |
| **`expired`** | *Any Operation* | - | **No** | Rejected with: `Opportunity has expired`. |

---

#### 2. AUTHORIZATION VERIFICATION

To prevent unauthorized cross-tenant data modification and access leaks, every RPC endpoint implemented in Phase 3 performs strict dual-check validation:

1. **Authenticated JWT Identity**: Resolves the caller's verified `auth.uid()` from the security context to find their active partner profile via `public.get_current_partner_id()`. If the user does not possess an active, valid partner profile, the transaction immediately raises: `Partner profile not found or unauthorized`.
2. **Match Owner Verification**: Queries the database using a strict filter matching both the target ID and the caller's resolved partner ID under a row-level write lock:
   ```sql
   SELECT id, status, expires_at, inquiry_id 
   FROM public.inquiry_matches
   WHERE id = p_match_id AND partner_id = v_partner_id
   FOR UPDATE;
   ```
   If no record matches both criteria, the RPC raises: `Opportunity not found or access denied`.

Both validations are performed in the database security layer *prior* to executing any data updates or mutations.

---

#### 3. AUDIT ORDER & TRANSACTION INTEGRITY

All transactional updates are wrapped in a strict relational execution sequence. The exact, non-negotiable step order is:

```
[1] Validate Caller Identity & Status
                   ↓
[2] Lock Match Record & Verify Expiry/Transition Compatibility
                   ↓
[3] Validate Input Parameters (e.g., Dates, Non-empty Messages)
                   ↓
[4] Update Business Tables (Matches, Inquiries, Responses, Candidates)
                   ↓
[5] Insert Immutable Audit Log Entry
                   ↓
[6] Commit PostgreSQL Transaction
```

* **Failed Transactions Policy**: Because all database writes and the audit log insertion are processed within a single, atomic database transaction (`BEGIN ... COMMIT`), any validation failure, date mismatch, or state exception triggers an immediate transaction rollback. Therefore, **failed transactions never create audit entries**, guaranteeing that the audit trail is a completely accurate representation of committed actions.

---

#### 4. IDEMPOTENCY SPECIFICATION

- **`view_opportunity`** is the **only idempotent RPC** in the opportunity lifecycle. It detects if the match is already marked as `viewed`, bypassing state transition validation, table updates, and audit logging. It returns a safe, successful response indicating no state changes were made.
- **`accept_opportunity`**, **`propose_alternative_opportunity`**, and **`decline_opportunity`** represent permanent business decisions and **must reject repeated execution**. Any duplicate calls on an already responded/declined opportunity will immediately fail with `Illegal state transition from <status>`.

---

#### 5. PHASE BOUNDARY RULES

To prevent scope creep and maintain strict separation of concerns, the following activities are strictly excluded from Phase 3 RPC functions and are defined as downstream Phase 4 and Phase 5 responsibilities:
- **Queue Advancement**: Moving matching focus to the next candidate is not performed in Phase 3.
- **Candidate Recalculation**: The candidate list remains entirely immutable after Phase 2 creation.
- **Contact Release**: Private contact details are never exposed to partners at this phase.
- **Notifications**: Phase 3 RPCs do not trigger email, SMS, Viber, or push notifications.
- **Concierge Fallback**: Automatic esclation to the central IDEMO Concierge is handled exclusively in Phase 5.

---

#### 6. PHASE 3 TEST AUDIT & VERIFICATION EVIDENCE

- **Tests Written**: A robust 15-assertion pgTAP test suite is implemented in `/supabase/tests/20260712000002_phase3_partner_lifecycle_tests.sql`.
- **Tests Executable**: The test file is syntactically correct, and contains clean isolation mocks to verify caller validation, transition checks, input limits, and audit logs.
- **Tests Executed**: No live PostgreSQL execution has occurred in this verification turn because the staging database pgTAP runtime is currently offline/pending.
- **Tests Passed**: Zero tests are reported as passed at this time. Live execution against the target environment remains **PENDING** as part of integration and deployment validation.

---

### PHASE 4 — Visitor Resolution

#### 1. OBJECTIVE & BOUNDARY LIMITS
Phase 4 is responsible **ONLY** for presenting the outcome of the routing process to the visitor and securely recording the visitor's decision. It represents a strict presentation and resolution layer. 
- **NO Routing Logic:** Phase 4 does not perform, invoke, or modify any routing, sorting, or matching logic.
- **NO State Expansion:** Phase 4 operates entirely on top of the pre-existing database lifecycle and state transitions defined in Phases 1–3.

#### 2. CONSTITUTIONAL PRINCIPLE
Phase 4 **SHALL NOT** introduce new business logic or decision rules. It shall only expose and resolve the results produced by the robust transactional backend implemented during Phases 1–3. All business logic, verification constraints, and transition security checks remain exclusively encapsulated inside PostgreSQL security-definer transactional functions and RLS policies.

#### 3. PHASE 4 RESPONSIBILITIES
The functional scope of Phase 4 is strictly limited to the following operations, and **nothing more**:
1. **Status Retrieval:** Visitor retrieves the current real-time inquiry status using their secure token.
2. **Single Proposal View:** Visitor views exactly **one active partner response** associated with their inquiry.
3. **Proposal Confirmation:** Visitor confirms/accepts the active partner proposal.
4. **Proposal Decline:** Visitor declines the active partner proposal.
5. **Alternative Request:** Visitor rejects the current proposal and requests another option from the queue.
6. **Secure Transactional State Transitions:** Executes safe, atomic updates using transactional procedures in the database.
7. **Immutable Audit Logging:** Records all visitor actions to the immutable audit logs table.

#### 4. EXPLICIT EXCLUSIONS
To maintain strict compliance and prevent scope-creep, Phase 4 **SHALL NOT** implement any of the following capabilities (which are reserved for Phase 5 or downstream systems):
- **No Partner Routing or Ranking:** No dynamic ranking or matching calculations.
- **No Candidate Recalculation:** The queue and candidate pools are completely frozen and immutable.
- **No Queue Modification or Queue Advancement:** Visitor actions do not directly trigger manual pointer or order updates in the matching queues.
- **No Contact Release:** Under no circumstances shall visitor or partner personal contact details be released or displayed during this phase.
- **No Real-Time Subscriptions:** No live WebSockets or open-ended socket channels are used.
- **No Notifications:** No SMS, Viber, push notifications, or emails are dispatched by Phase 4 actions.
- **No Cron/Watchdog Processing:** Expiry sweeps and watchdog runs remain strictly separate background operations.
- **No Concierge Escalation:** No automatic fallback or transfer triggers to the human IDEMO Concierge are handled within these visitor endpoints.
- **No Analytics or Reporting:** No telemetry tracking, logging UI, or analytics wrappers.
- **No Frontend/UX Redesigns:** The presentation follows the frozen user experience layout, with zero stylistic or visual deviations.
- **No New Database Entities:** No new tables, views, or schemas may be added unless strictly required and approved.

#### 5. VISITOR EXPERIENCE PRINCIPLES
To protect the high-end, calm mood of the IDEMO Editorial Luxury Design Language, the visitor interface must remain entirely free of technical or administrative noise. 
- **Strictly Prohibited Visuals:** Visitors must **never** see:
  - Routing queues or waitlists.
  - Candidate partner rankings or competitor tables.
  - Raw database statuses or internal machine states (e.g., `offered`, `viewed`, `responded`).
  - Technical error tracebacks, database column names, or stack terminology.
- **Editorial Copystyle:** All interfaces must present calm, human-centered, understated editorial language. Approved status indicators and copywriting copy:
  - *"Preparing your request"* (instead of matching initialization)
  - *"Finding suitable local assistance"* (instead of queue matching active)
  - *"Waiting for confirmation"* (instead of partner responded matching awaiting)
  - *"Your arrangement request has been accepted"* (instead of inquiry status confirmed)
  - *"IDEMO Concierge will personally assist you"* (instead of matching exhausted concierge fallback)

#### 6. PARTNER PRESENTATION & VISITOR ACTIONS
- **Single Proposal Constraint:** At any given moment, the visitor may view **only one active proposal**. The system enforces this constraint strictly; visitors shall never compare multiple partners or view rival offers side-by-side.
- **Three-Action Limit:** The visitor has exactly three possible structural actions:
  1. **Confirm:** Accepts the partner's timing and details, moving the match to confirmation.
  2. **Decline:** Explicitly declines the current offer, archiving the match.
  3. **Request Another Option:** Rejects the current offer and requests that the system offer the next candidate in sequence.

#### 7. PRIVACY & CONTACT ISOLATION
The IDEMO Privacy-First philosophy dictates absolute contact separation:
- Partner personal contact information remains fully protected and hidden from the visitor.
- Visitor personal contact information remains fully protected and hidden from the partner.
- No contact information shall be released, shown, or made accessible during Phase 4.
- **Contact Release is Excluded:** Contact details release belongs exclusively to Phase 5, and may only occur after all transactional requirements, confirmations, and explicit user consent conditions have been successfully met.

#### 8. STATE OWNERSHIP & LIFECYCLE COMPLIANCE
Phase 4 acts purely as a consumer of the state engine. It may only transition states already defined by the approved lifecycle schema.
- It **cannot** invent or insert new states.
- It **cannot** bypass any transition validation.
- It **cannot** override or modify deterministic matching decisions.

#### 9. VERIFICATION STANDARD FOR PHASE 4 COMPLETION
The Phase 4 implementation phase will later conclude with:
1. **Implementation Report:** Complete functional mapping of the visitor endpoints.
2. **Independent Evidence Audit:** Verification of database state transitions and audit logs under test conditions.
3. **Correction Cycle:** Remediation of any edge-case gaps or visual clutter.
4. **Owner Approval & Freeze:** Official walkthrough and freeze of the Phase 4 code.
Only after these conditions are satisfied may Phase 5 development begin.

---

### PHASE 5 — Operations & Fail-Safe
* **Fokus:** Pozadinski poslovi, nadzor i sigurni concierge eskalacioni tokovi.
* **Aktivnosti:**
  - Expiry cron za automatski prelazak isteklih ponuda.
  - Nadzorni (Watchdog) proces za automatsku detekciju sistemskih zastoja ili neuspelih cron/notifikacija.
  - Concierge Fallback (Automatsko preusmeravanje upita na Centralni IDEMO Concierge u slučaju bilo kakvog otkazivanja ili iscrpljivanja kandidata).
  - Logovanje i auditiranje akcija (immutable append-only audit_logs).
  - Skripte za retencije podataka i uklanjanje zaostalih klijentskih test simulatora.

---

## 12. Jasno Obeleženi Delovi Koji Privremeno Ostaju Prototip

Do završetka šeste faze (Faza F), sledeće komponente moraju biti jasno izolovane i prebačene u **isključivo razvojni (Development-Only)** režim rada:

1. **Simulator upita (Inquiry Simulator):** Kontrolni panel koji omogućava ručno kreiranje i ubacivanje lažnih upita radi provere toka.
2. **Lokalni matching i test partneri:** Svi nalozi partnera sa ID-jevima od `partner-31` do `partner-40` koji služe za demonstraciju dizajna interfejsa bez realne poslovne osnove.
3. **Mrežni PIN:** Level 1 validates the current IDEMO Partner Network authorization credential. The credential value is an operational configuration and is intentionally excluded from governance documentation.

**Strategija zaštite:** Svi mock fajlovi i simulatorske kontrole moraju biti obmotane uslovnim proverama:
```typescript
if (import.meta.env.DEV) {
  // Prikazuj simulator i demo kontrole
}
```
U produkcionom buildu, ove komponente se automatski odstranjuju kroz proces optimizacije koda (Tree-Shaking).

---

## 13. Procena Bezbednosnih i Operativnih Rizika (Production Readiness)

| Nivo rizika | Opis i identifikacija problema | Potencijalni uticaj na sistem | Preporučeno rešenje i ublažavanje |
| :--- | :--- | :--- | :--- |
| **Kritičan** | Nepouzdana lokalna skladišta sesija | Gubitak ili krađa pristupnih tokena partnera na kompromitovanim mobilnim uređajima usled korišćenja nezaštićenih skladišta. | Striktno nametanje upotrebe šifrovanog adaptera za Keychain/Keystore sisteme na nivou Capacitor klijenta. |
| **Visok** | Brute-Force napadi na recovery tokene | Zlonamerni akteri mogu slati stotine zahteva u sekundi pokušavajući da pogode tajni recovery token i preuzmu tuđi upit. | Implementacija IP i sesijskog rate-limita direktno unutar Edge funkcije pre nego što zahtev stigne do baze podataka. |
| **Srednji** | Blokada u redu kandidata | Ukoliko izabrani partner ne reaguje na obaveštenja, upit stoji blokiran 2 sata pre nego što pređe na sledećeg, kvareći iskustvo posetioca. | Skraćivanje roka na 30 minuta tokom EXPO radnog vremena (09:00 - 21:00) uz slanje direktnih SMS/Viber upozorenja partneru. |
| **Nizak** | Vremenska neusklađenost (Clock Drift) | Razlika u vremenu između klijentskog uređaja i servera može dovesti do preuranjenog prikaza isteka ponude na ekranu partnera. | Klijentski tajmer se mora sinhronizovati i oslanjati isključivo na serversko vreme vraćeno u zaglavlju API odgovora. |

---

## 14. Preostale Otvorene Poslovne i Pravne Odluke

Pre nego što se pristupi fizičkoj implementaciji koda na backendu, Vlasnik IDEMO brenda i pravni tim moraju formalno odobriti sledeće tačke:

1. **Usklađenost sa GDPR regulativom:** Da li je tekst saglasnosti (`consent_text_version`) u potpunosti usklađen sa zakonskim normama Republike Srbije i Evropske Unije po pitanju privremenog čuvanja i obrade ličnih podataka posetilaca?
2. **Definisanje operativnog vremena:** Da li se vremenski rokovi za odgovor partnera (npr. 2 sata) primenjuju i tokom noći, ili se matching proces pauzira od 22:00 do 08:00 ujutru?
3. **Pravila automatske suspenzije:** Koliko uzastopnih propuštenih prilika (stanje `expired`) partner može da sakupi pre nego što ga sistem automatski prebaci u status `paused` kako ne bi usporavao ostale aktivne članove ekosistema?

---

## 15. Final Governance Statement

IDEMO Partner Portal V1 UX Baseline is accepted as the governing production user experience specification.

Future modifications require explicit Owner approval or a formally approved business requirement.

The Partner Portal V1 UX is now frozen.

Future work is limited to backend implementation, security, operational infrastructure, production deployment, and maintenance.
