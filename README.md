# TB AI Office

TB AI Office on LVI-Valvonta T.B:n AI-tuettu työtila tarjouksille, asiakkaille, dokumenteille ja työmaiden hallinnalle.

## Sisältö

- Dashboard ja TB AI Assistant -chat
- Tarjousvahti: avainsana-, alue- ja sopivuuspisteytyksen perusta
- TB Command Center agenttien tilannekuvaa varten
- Asiakas- ja dokumenttipankkinäkymät
- Supabase-tietokantaskeema ja OpenAI-palvelurajapinta

## Paikallinen käyttö

1. Asenna Node.js 20+ ja pnpm.
2. Kopioi `.env.example` tiedostoksi `.env.local`.
3. Aseta Supabase-arvot ja `OPENAI_API_KEY` vain `.env.local`-tiedostoon.
4. Suorita `pnpm install` ja `pnpm dev`.
5. Avaa `http://localhost:3000`.

## Supabase

Luo Supabase-projekti ja aja [supabase/schema.sql](supabase/schema.sql) SQL Editorissa. Lisää sen URL ja publishable key `.env.local`-tiedostoon:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

Ota Supabase Authissa käyttöön sähköpostikirjautuminen ja lisää redirect URL `http://localhost:3000/auth/callback`. Skeema luo jokaiselle uudelle käyttäjälle oman työtilan ja suojaa tiedot yrityskohtaisilla RLS-säännöillä.

## Tarjousvahti

Ensimmäinen versio sisältää pisteytyslogiikan. Lähteiden (esim. Hilma, Cloudia, Mercell ja kuntien kilpailutukset) integraatiot toteutetaan vain niiden virallisten API:en, ilmoituskanavien tai sallittujen käyttöehtojen mukaisesti. Agentti ei lähetä tarjouksia automaattisesti: asiantuntija hyväksyy aina tuloksen.

## Seuraavat vaiheet

1. Supabase Auth ja yrityskohtaiset RLS-säännöt
2. Tarjouslähteiden hyväksytyt integraatiot sekä ilmoitukset (sähköposti/Telegram/WhatsApp)
3. Asiakirjaluku ja tarkistettavat tarjous- sekä raporttiluonnokset
4. n8n-automaatioiden käyttöönotto
