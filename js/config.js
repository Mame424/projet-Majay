import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

/**
 * CONFIG SUPABASE
 * (clé anon → OK car RLS actif)
 */
export const supabase = createClient(
  "https://hhyxccvwtqgzxsxcqecw.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoeXhjY3Z3dHFnenhzeGNxZWN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4MzU4NjcsImV4cCI6MjA4MjQxMTg2N30.Y344RpYWSWLosfCAtqVNE26CesBH0j2cBpJCfUP_TsM"
);

/**
 * Slug vendeur depuis l’URL
 * ex: catalogue.html?shop=demo-shop
 */
export function getVendeurSlug() {
  const params = new URLSearchParams(window.location.search);
  return params.get("shop") || "demo-shop";
}

/**
 * Numéro WhatsApp ADMIN
 * (pour upgrade plan)
 */
export const ADMIN_PHONE = "+221771234567";
