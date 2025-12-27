// ==================== AUTHENTIFICATION MAJAY ====================
import { supabase } from "./config.js";

async function inscrireVendeur(data) {
    try {
        const { nom, slug, telephone, whatsapp } = data;

        // Appel RPC inscription
        const { data: result, error } = await supabase
            .rpc('inscrire_vendeur', {
                p_nom: nom,
                p_slug: slug,
                p_telephone: telephone
            });

        if (error) throw error;

        // Mettre à jour le WhatsApp si différent
        if (whatsapp && whatsapp !== telephone) {
            await supabase
                .from('vendeurs')
                .update({ whatsapp })
                .eq('id', result.id);
        }

        sauvegarderSession(result);
        return { success: true, data: result };

    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function connexionVendeur(telephone) {
    try {
        const { data: result, error } = await supabase
            .rpc('connexion_vendeur', {
                p_telephone: telephone
            });

        if (error) throw error;

        sauvegarderSession(result);
        return { success: true, data: result };

    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ==================== SESSION ====================
function sauvegarderSession(vendeur) {
    const session = {
        ...vendeur,
        timestamp: Date.now()
    };
    localStorage.setItem('majay_vendeur', JSON.stringify(session));
}

function getSession() {
    const session = localStorage.getItem('majay_vendeur');
    if (!session) return null;

    try {
        return JSON.parse(session);
    } catch {
        return null;
    }
}

function deconnexion() {
    localStorage.removeItem('majay_vendeur');
    window.location.href = 'connexion.html';
}

// ==================== EXPORT ====================
export const authMajay = {
    inscrireVendeur,
    connexionVendeur,
    sauvegarderSession,
    getSession,
    deconnexion
};
