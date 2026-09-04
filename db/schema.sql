-- AgriLink360 core schema
-- Run: psql -d agrilink360 -f schema.sql

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────────
-- USERS  (farmers, FPO coordinators, buyers, admins — one table,
-- role-differentiated, so auth/session logic stays in one place)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role            TEXT NOT NULL CHECK (role IN ('farmer', 'fpo_coordinator', 'buyer', 'admin')),
    name            TEXT NOT NULL,
    phone           TEXT UNIQUE NOT NULL,
    password_hash   TEXT NOT NULL,
    village         TEXT,
    district        TEXT,
    state           TEXT,
    location        GEOGRAPHY(POINT, 4326),   -- lon/lat, used for distance matching
    language_pref   TEXT DEFAULT 'en',
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────
-- BUYERS  (extends users where role = 'buyer' — separate table
-- for buyer-only fields: verification, credentials, reliability)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE buyers (
    user_id             UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    business_name       TEXT NOT NULL,
    buyer_type          TEXT CHECK (buyer_type IN ('mandi_trader', 'processor', 'institutional', 'exporter')),
    verified            BOOLEAN DEFAULT FALSE,
    verified_at         TIMESTAMPTZ,
    last_reverified_at  TIMESTAMPTZ,
    payment_reliability_score  NUMERIC(4,2) DEFAULT 0,   -- 0-100, computed from transaction history
    quality_preferences JSONB DEFAULT '{}'::jsonb         -- e.g. {"grade": ["A","B"], "min_qty_kg": 500}
);

-- ─────────────────────────────────────────────────────────────
-- PRICE HISTORY  (ingested from data.gov.in mandi API — every
-- row carries source + confidence, per your "trust the signal" design)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE price_history (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    commodity       TEXT NOT NULL,
    state           TEXT NOT NULL,
    district        TEXT NOT NULL,
    market_name     TEXT NOT NULL,             -- e.g. 'Lasalgaon APMC'
    price_date      DATE NOT NULL,
    min_price       NUMERIC(10,2),
    max_price       NUMERIC(10,2),
    modal_price     NUMERIC(10,2),
    arrival_qty_kg  NUMERIC(12,2),
    source          TEXT NOT NULL DEFAULT 'data.gov.in',
    confidence      NUMERIC(3,2) DEFAULT 1.0,   -- 0-1, lower for stale/estimated rows
    ingested_at     TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_price_history_lookup ON price_history (commodity, district, price_date);

-- ─────────────────────────────────────────────────────────────
-- LOTS  (a farmer/FPO's produce batch — the core object the whole
-- workflow revolves around: create → grade → offers → sale)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE lots (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id           UUID NOT NULL REFERENCES users(id),
    commodity           TEXT NOT NULL,
    quantity_kg         NUMERIC(10,2) NOT NULL,
    quality_grade        TEXT CHECK (quality_grade IN ('A', 'B', 'C', 'ungraded')) DEFAULT 'ungraded',
    location            GEOGRAPHY(POINT, 4326) NOT NULL,
    district            TEXT NOT NULL,
    status              TEXT NOT NULL DEFAULT 'created'
                         CHECK (status IN ('created', 'graded', 'offers_open', 'offer_accepted',
                                            'in_transit', 'delivered', 'paid', 'closed', 'cancelled')),
    predicted_price_band_low   NUMERIC(10,2),   -- from ai-service /predict-price
    predicted_price_band_high  NUMERIC(10,2),
    forecast_confidence        NUMERIC(3,2),
    recommended_sale_window    DATERANGE,
    created_at          TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_lots_farmer ON lots (farmer_id);
CREATE INDEX idx_lots_status ON lots (status);

-- ─────────────────────────────────────────────────────────────
-- OFFERS  (a buyer's bid on a lot — ranked by the matching engine)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE offers (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lot_id              UUID NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
    buyer_id            UUID NOT NULL REFERENCES buyers(user_id),
    offered_price        NUMERIC(10,2) NOT NULL,
    net_realisation_score NUMERIC(6,2),          -- computed: price - est. transport/handling cost
    match_rank            INT,                    -- position in ranked list shown to farmer
    status               TEXT NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
    created_at           TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_offers_lot ON offers (lot_id);

-- ─────────────────────────────────────────────────────────────
-- LOGISTICS PARTNERS  (transport + storage, matched by distance
-- via PostGIS once an offer is accepted)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE logistics_partners (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_type    TEXT CHECK (partner_type IN ('transport', 'storage')),
    name            TEXT NOT NULL,
    location        GEOGRAPHY(POINT, 4326) NOT NULL,
    capacity_kg     NUMERIC(10,2),
    rate_per_km     NUMERIC(8,2),
    available       BOOLEAN DEFAULT TRUE
);

-- ─────────────────────────────────────────────────────────────
-- TRANSACTIONS  (lot + accepted offer → logistics → payment,
-- one row = one completed or in-progress sale)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE transactions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lot_id              UUID NOT NULL REFERENCES lots(id),
    offer_id            UUID NOT NULL REFERENCES offers(id),
    logistics_partner_id UUID REFERENCES logistics_partners(id),
    payment_status      TEXT NOT NULL DEFAULT 'pending'
                         CHECK (payment_status IN ('pending', 'confirmed', 'failed')),
    payment_confirmed_at TIMESTAMPTZ,
    offer_accepted_at    TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────
-- GRIEVANCES  (trail for disputes — required by the problem
-- statement's "grievance support" requirement)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE grievances (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id  UUID NOT NULL REFERENCES transactions(id),
    raised_by       UUID NOT NULL REFERENCES users(id),
    category        TEXT CHECK (category IN ('payment', 'quality_dispute', 'logistics', 'other')),
    description     TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'resolved')),
    created_at      TIMESTAMPTZ DEFAULT now(),
    resolved_at     TIMESTAMPTZ
);
