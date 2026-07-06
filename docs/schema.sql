-- Tabla de clientes para AppGym
-- Ejecutar en Render PostgreSQL

CREATE TABLE clients (
  id BIGSERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  telefono TEXT NOT NULL,
  pagado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para búsqueda rápida
CREATE INDEX idx_clients_pagado ON clients(pagado);
CREATE INDEX idx_clients_nombre ON clients(nombre);

-- Histórico de pagos: snapshot mensual de todos los clientes, generado por
-- el cron de reset mensual (backend/index.js -> runMonthlyReset)
CREATE TABLE payment_history (
  id BIGSERIAL PRIMARY KEY,
  client_id BIGINT REFERENCES clients(id) ON DELETE SET NULL,
  nombre TEXT NOT NULL,
  mes INTEGER NOT NULL,
  anio INTEGER NOT NULL,
  pagado BOOLEAN NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(client_id, mes, anio)
);

CREATE INDEX idx_payment_history_periodo ON payment_history(anio, mes);
