# MiniShop Glass – Mini E-Commerce con Next.js & Supabase

Mini e-commerce full-stack pensato come progetto da portfolio, con:

- **Next.js 14+ (App Router)**
- **React (Server + Client Components)**
- **Supabase (PostgreSQL + Storage)**
- **TailwindCSS**
- **Tema visivo Glassmorphism**
- **Deploy su Vercel**

Il sito permette di:

- visualizzare prodotti da un database PostgreSQL
- aggiungere prodotti al carrello (persistenza su `localStorage`)
- completare un checkout simulato (creazione ordine e order_items nel DB)
- gestire prodotti, categorie, immagini e stock da un pannello admin protetto

---

## ✨ Funzionalità principali

### Frontend (utente)

- **Homepage prodotti**
  - lista prodotti con card in stile glassmorphism
  - immagine, nome, prezzo, descrizione breve
  - pill di categorie visuali

- **Pagina prodotto**
  - dettagli completi del prodotto
  - immagine grande
  - stato stock:
    - `Esaurito` → bottone disabilitato
    - `Ultimo disponibile` se stock = 1
    - stock residuo visibile
  - pulsante **“Aggiungi al carrello”** con controllo stock lato client

- **Carrello**
  - gestito via `CartContext` + `localStorage`
  - aggiungi / rimuovi / modifica quantità
  - totale calcolato automaticamente
  - impossibile superare lo stock disponibile (anche modificando la quantità)

- **Checkout simulato**
  - form con nome, email, indirizzo
  - validazione lato client + lato server (Zod)
  - creazione record in:
    - tabella `orders`
    - tabella `order_items`
  - decremento stock prodotti dopo ogni ordine
  - pagina di conferma “Ordine completato”

- **Ricerca prodotti**
  - search bar nella navbar (desktop)
  - query full-text su nome + descrizione via Supabase
  - dropdown dei risultati in stile glass
  - click → vai alla pagina prodotto

---

### Admin

Pannello admin con sidebar in stile dashboard:

- `/admin/products`
  - gestione prodotti (crea, modifica, elimina)
  - stock, prezzo, descrizione, categoria
  - upload immagini via Supabase Storage:
    - drag & drop o file picker
    - validazione formato (JPG/PNG/WEBP)
    - URL pubblica salvata nel DB
    - anteprima immagine
  - gestione categorie:
    - crea/elimina categorie
    - assegna categoria al prodotto
    - pill grafiche per le categorie

- `/admin/orders`
  - lista ordini con:
    - nome cliente
    - email
    - indirizzo
    - data e ora
    - totale ordine
    - lista articoli (nome prodotto, quantità, prezzo unitario)

- `/admin/analytics`
  - metriche aggregate:
    - numero prodotti
    - stock totale
    - numero ordini
    - “fatturato” simulato
  - best seller:
    - top prodotti per quantità venduta
    - ricavi simulati per prodotto

- **Sicurezza admin**
  - accesso protetto da **password** lato server (`ADMIN_PASSWORD`)
  - login via `/admin/login`
  - cookie **HttpOnly** per la sessione admin
  - controllo lato server in tutte le route `/admin/*` e nelle API admin

---

### Sicurezza & Best practice

- **Nessuna chiave privata nel client**  
  Il client Supabase utilizza la **Service Role Key** solo lato server (API routes e server components).

- **Validazione dati con Zod**
  - su `/api/checkout`
  - su `/api/admin/products`
  - su `/api/admin/categories`

- **Controllo stock lato server**
  - durante il checkout il backend verifica:
    - esistenza dei prodotti
    - stock > 0
    - quantità richiesta ≤ stock
  - se qualcosa non torna → errore 400, ordine non creato

- **Rate limiting semplice**
  - su `/api/checkout`
  - su `/api/admin/*`
  - implementato in memoria (demo), sufficiente per protezione base

- **Cookie admin HttpOnly**
  - mitigazione accesso via JavaScript
  - controllo in tutte le API admin con `isAdminRequest()`

---

## 🗄️ Struttura database (Supabase)

Tabelle principali:

```sql
create table public.products (
  id serial primary key,
  name text not null,
  description text not null,
  price numeric not null,
  image_url text,
  stock integer not null default 0,
  category_id integer references public.categories(id),
  created_at timestamp with time zone default now()
);

create table public.orders (
  id serial primary key,
  customer_name text not null,
  customer_email text not null,
  address text not null,
  created_at timestamp with time zone default now()
);

create table public.order_items (
  id serial primary key,
  order_id integer not null references public.orders(id) on delete cascade,
  product_id integer not null references public.products(id),
  quantity integer not null,
  unit_price numeric not null
);

create table public.categories (
  id serial primary key,
  name text not null unique,
  created_at timestamp with time zone default now()
);

-- disabilita RLS per demo (solo perché accedi sempre da backend con service role)
alter table public.products disable row level security;
alter table public.orders disable row level security;
alter table public.order_items disable row level security;
alter table public.categories disable row level security;
