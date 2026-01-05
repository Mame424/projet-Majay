import { supabase } from "./config.js";

// ================= CONNEXION ADMIN =================
async function connexionAdmin(telephone) {
  try {
    const { data: result, error } = await supabase.rpc(
      "connexion_admin",
      { p_telephone: telephone }
    );

    if (error) throw error;

    sauvegarderSessionAdmin(result);
    return { success: true, data: result };

  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ================= SESSION ADMIN =================
function sauvegarderSessionAdmin(admin) {
  localStorage.setItem("majay_admin", JSON.stringify({
    ...admin,
    timestamp: Date.now()
  }));
}

function getSessionAdmin() {
  const s = localStorage.getItem("majay_admin");
  if (!s) return null;
  
  try {
    const data = JSON.parse(s);
    // Vérifier expiration (7 jours)
    const age = Date.now() - data.timestamp;
    if (age > 7 * 24 * 60 * 60 * 1000) {
      deconnexionAdmin();
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function deconnexionAdmin() {
  localStorage.removeItem("majay_admin");
  window.location.href = "connexion.html";
}

// ================= VÉRIFICATION AUTH =================
function verifierAuthAdmin() {
  const session = getSessionAdmin();
  
  const pagesProtegees = [
    'dashboard.html',
    'vendeurs.html',
    'stats.html'
  ];
  
  const currentPage = window.location.pathname.split('/').pop();
  
  if (pagesProtegees.includes(currentPage) && !session) {
    window.location.href = 'connexion.html';
    return false;
  }
  
  if (currentPage === 'connexion.html' && session) {
    window.location.href = 'dashboard.html';
    return false;
  }
  
  return session;
}

// ================= ACTIONS ADMIN =================
async function toggleVendeur(vendeurId, actif) {
  const { data, error } = await supabase.rpc('admin_toggle_vendeur', {
    p_vendeur_id: vendeurId,
    p_actif: actif
  });
  
  if (error) throw error;
  return data;
}

async function changerPlan(vendeurId, plan) {
  const { data, error } = await supabase.rpc('admin_set_plan', {
    p_vendeur_id: vendeurId,
    p_plan: plan
  });
  
  if (error) throw error;
  return data;
}

async function supprimerVendeur(vendeurId) {
  const { data, error } = await supabase.rpc('admin_delete_vendeur', {
    p_vendeur_id: vendeurId
  });
  
  if (error) throw error;
  return data;
}

async function getStatsAdmin() {
  const { data, error } = await supabase
    .from('vue_stats_admin')
    .select('*')
    .single();
  
  if (error) throw error;
  return data;
}

// ================= EXPORT =================
export const adminAuth = {
  connexionAdmin,
  getSessionAdmin,
  deconnexionAdmin,
  verifierAuthAdmin,
  toggleVendeur,
  changerPlan,
  supprimerVendeur,
  getStatsAdmin
};