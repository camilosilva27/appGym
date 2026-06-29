-- Tabla de clientes para AppGym
-- Ejecutar en Supabase SQL Editor

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

-- RLS (Row Level Security) - Permitir acceso público para desarrollo
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for development" ON clients
  FOR ALL USING (true) WITH CHECK (true);
