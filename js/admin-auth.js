import { supabase } from "./config.js";

/* =========================
   DEMANDE OTP EMAIL
========================= */
async function demanderOTP(email) {
  // ✅ Vérifier d'abord si l'admin existe
  const { data: adminData } = await supabase
    .from('admins')
    .select('email, actif')
    .eq('email', email)
    .eq('actif', true)
    .single();

  if (!adminData) {
    return { 
      success: false, 
      error: "Cet email n'est pas autorisé comme admin" 
    };
  }

  // ✅ Envoyer l'OTP
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,  // ⬅️ CHANGÉ : doit être true
      emailRedirectTo: "https://projet-majay.vercel.app/admin/otp.html"

    }
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/* =========================
   VERIFICATION ADMIN
========================= */
async function verifierAdmin() {
  const { data: sessionData } = await supabase.auth.getSession();

  if (!sessionData.session) return null;

  const email = sessionData.session.user.email;

  const { data, error } = await supabase.rpc("admin_is_allowed", {
    p_email: email
  });

  if (error) {
    await supabase.auth.signOut();
    return null;
  }

  localStorage.setItem("majay_admin", JSON.stringify({
    ...data,
    email,
    timestamp: Date.now()
  }));

  return data;
}

/* =========================
   SESSION
========================= */
function getSessionAdmin() {
  const s = localStorage.getItem("majay_admin");
  if (!s) return null;

  const data = JSON.parse(s);
  const age = Date.now() - data.timestamp;

  // Session valide 24h
  if (age > 24 * 60 * 60 * 1000) {
    deconnexionAdmin();
    return null;
  }

  return data;
}

async function deconnexionAdmin() {
  await supabase.auth.signOut();
  localStorage.removeItem("majay_admin");
  window.location.href = "connexion.html";
}

export const adminAuth = {
  demanderOTP,
  verifierAdmin,
  getSessionAdmin,
  deconnexionAdmin
};