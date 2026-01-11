import { supabase } from "./config.js";

/* ======================
   INSCRIPTION
====================== */
async function inscrireVendeur(data) {
  try {
    const { nom, slug, telephone } = data;

    const { data: result, error } = await supabase.rpc(
      "inscrire_vendeur",
      {
        p_nom: nom,
        p_slug: slug,
        p_telephone: telephone
      }
    );

    if (error) throw error;

    sauvegarderSession(result);
    return { success: true, data: result };

  } catch (error) {
    return { success: false, error: error.message };
  }
}

/* ======================
   CONNEXION
====================== */
async function connexionVendeur(telephone, code) {
  try {
    const { data: result, error } = await supabase.rpc(
      "connexion_vendeur",
      {
        p_telephone: telephone,
        p_code: code
      }
    );

    if (error) throw error;

    sauvegarderSession(result);
    return { success: true, data: result };

  } catch (error) {
    return { success: false, error: error.message };
  }
}

/* ======================
   SESSION
====================== */
function sauvegarderSession(vendeur) {
  localStorage.setItem(
    "majay_vendeur",
    JSON.stringify({
      ...vendeur,
      timestamp: Date.now()
    })
  );
}

function getSession() {
  const s = localStorage.getItem("majay_vendeur");
  return s ? JSON.parse(s) : null;
}

function deconnexion() {
  localStorage.removeItem("majay_vendeur");
  window.location.href = "connexion.html";
}

export const authMajay = {
  inscrireVendeur,
  connexionVendeur,
  getSession,
  deconnexion
};
