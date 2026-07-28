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

Luo Supabase-projekti ja aja [supabase/schema.sql](supabase/schema.sql) SQL Editorissa. Lisää sen URL ja anon key `.env.local`-tiedostoon. RLS on otettu käyttöön; ennen tuotantokäyttöä lisätään käyttäjä- ja yrityskohtaiset käyttöoikeussäännöt.

## Tarjousvahti

Ensimmäinen versio sisältää pisteytyslogiikan. Lähteiden (esim. Hilma, Cloudia, Mercell ja kuntien kilpailutukset) integraatiot toteutetaan vain niiden virallisten API:en, ilmoituskanavien tai sallittujen käyttöehtojen mukaisesti. Agentti ei lähetä tarjouksia automaattisesti: asiantuntija hyväksyy aina tuloksen.

## Seuraavat vaiheet

1. Supabase Auth ja yrityskohtaiset RLS-säännöt
2. Tarjouslähteiden hyväksytyt integraatiot sekä ilmoitukset (sähköposti/Telegram/WhatsApp)
3. Asiakirjaluku ja tarkistettavat tarjous- sekä raporttiluonnokset
4. n8n-automaatioiden käyttöönotto
