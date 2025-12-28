import { supabase, getVendeurSlug } from "./config.js";

// ==================== VARIABLES GLOBALES ====================
let produits = [];
let panier = [];
let categorieActive = 'tous';
let vendeurInfo = {};

// ==================== CHARGEMENT DES DONNÉES ====================
async function chargerProduits() {
    try {
        const { data: vendeur, error: vendeurError } = await supabase
            .from("vendeurs")
            .select("*")
            .eq("slug", getVendeurSlug())
            .single();

        if (vendeurError) throw vendeurError;
        if (!vendeur) {
            afficherErreur("Boutique introuvable");
            return;
        }

        vendeurInfo = vendeur;

        // Mettre à jour le header
        document.querySelector('.logo').textContent = `🛍️ ${vendeur.nom}`;
        if (vendeur.bio) {
            document.querySelector('.tagline').textContent = vendeur.bio;
        }

        const { data: produitsData, error: produitsError } = await supabase
            .from("produits")
            .select("*")
            .eq("vendeur_id", vendeur.id)
            .eq("stock", true);

        if (produitsError) throw produitsError;

        produits = produitsData || [];

        afficherProduits(categorieActive);
        initialiserEvenements();

    } catch (error) {
        console.error("Erreur:", error);
        afficherErreur(error.message);
    }
}

// ==================== AFFICHAGE PRODUITS ====================
function afficherProduits(categorie) {
    const grid = document.getElementById('productsGrid');
    
    const produitsFiltres = categorie === 'tous' 
        ? produits 
        : produits.filter(p => p.categorie === categorie);

    if (produitsFiltres.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px; color: white;">
                <div style="font-size: 4em; margin-bottom: 20px;">📦</div>
                <h3 style="font-size: 1.5em;">Aucun produit disponible</h3>
                <p style="margin-top: 10px;">Le vendeur n'a pas encore ajouté de produits</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = produitsFiltres.map(produit => `
        <div class="product-card" data-id="${produit.id}">
            <img src="${produit.image_url || 'https://via.placeholder.com/300'}" 
                 alt="${produit.nom}" 
                 class="product-image" 
                 loading="lazy"
                 onerror="this.src='https://via.placeholder.com/300?text=Image'">
            <div class="product-info">
                <span class="product-category">${produit.categorie}</span>
                <h3 class="product-name">${produit.nom}</h3>
                <p class="product-desc">${produit.description || ''}</p>
                <div class="product-footer">
                    <span class="product-price">${formaterPrix(produit.prix)} CFA</span>
                    <button class="add-btn" data-id="${produit.id}">
                        <span class="btn-text">+ Ajouter</span>
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    // Ajouter les événements sur les boutons
    document.querySelectorAll('.add-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.dataset.id;
            ajouterAuPanier(id, this);
        });
    });
}

// ==================== GESTION PANIER ====================
function ajouterAuPanier(idProduit, bouton) {
    const produit = produits.find(p => p.id === idProduit);
    
    if (!produit) return;

    const itemExistant = panier.find(item => item.id === idProduit);

    if (itemExistant) {
        itemExistant.quantite += 1;
    } else {
        panier.push({
            ...produit,
            quantite: 1
        });
    }

    mettreAJourBadgePanier();
    animerBoutonAjout(bouton);
    afficherNotification('✅ Produit ajouté au panier');
}

function animerBoutonAjout(bouton) {
    const contenuOriginal = bouton.innerHTML;
    bouton.disabled = true;
    bouton.innerHTML = '<span class="btn-text">✓ Ajouté !</span>';
    bouton.classList.add('btn-success');
    
    setTimeout(() => {
        bouton.innerHTML = contenuOriginal;
        bouton.classList.remove('btn-success');
        bouton.disabled = false;
    }, 1500);
}

function retirerDuPanier(idProduit) {
    panier = panier.filter(item => item.id !== idProduit);
    mettreAJourBadgePanier();
    afficherPanier();
}

function mettreAJourBadgePanier() {
    const badge = document.getElementById('cartBadge');
    const total = panier.reduce((sum, item) => sum + item.quantite, 0);
    badge.textContent = total;
}

// ==================== AFFICHAGE MODAL PANIER ====================
function afficherPanier() {
    const container = document.getElementById('cartItems');
    const totalEl = document.getElementById('totalAmount');

    if (panier.length === 0) {
        container.innerHTML = `
            <div class="cart-empty">
                <div class="cart-empty-icon">🛒</div>
                <p class="cart-empty-text">Votre panier est vide</p>
            </div>
        `;
        totalEl.textContent = '0 CFA';
        return;
    }

    container.innerHTML = panier.map(item => `
        <div class="cart-item">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.nom} × ${item.quantite}</div>
                <div class="cart-item-price">${formaterPrix(parseFloat(item.prix) * item.quantite)} CFA</div>
            </div>
            <button class="remove-btn" data-id="${item.id}">✕</button>
        </div>
    `).join('');

    // Ajouter événements suppression
    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            retirerDuPanier(this.dataset.id);
        });
    });

    const total = calculerTotal();
    totalEl.textContent = `${formaterPrix(total)} CFA`;
}

function calculerTotal() {
    return panier.reduce((sum, item) => sum + (parseFloat(item.prix) * item.quantite), 0);
}

// ==================== ENVOI WHATSAPP ====================
async function envoyerVersWhatsApp() {
    if (panier.length === 0) {
        alert('❌ Votre panier est vide !');
        return;
    }

    let message = `🛍️ *NOUVELLE COMMANDE - ${vendeurInfo.nom.toUpperCase()}*\n\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;

    const items = [];
    
    panier.forEach((item, index) => {
        message += `${index + 1}. *${item.nom}*\n`;
        message += `   📦 Quantité: ${item.quantite}\n`;
        message += `   💰 Prix unitaire: ${formaterPrix(item.prix)} CFA\n`;
        message += `   ✅ Sous-total: ${formaterPrix(parseFloat(item.prix) * item.quantite)} CFA\n\n`;
        
        items.push({
            nom: item.nom,
            prix: parseFloat(item.prix),
            quantite: item.quantite
        });
    });

    const total = calculerTotal();
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `💵 *TOTAL: ${formaterPrix(total)} CFA*\n\n`;
    message += `Merci de confirmer ma commande ! 🙏`;

    // Enregistrer la commande
    try {
        await supabase.from('commandes').insert({
            vendeur_id: vendeurInfo.id,
            items: items,
            total: total
        });
    } catch (error) {
        console.error('Erreur enregistrement commande:', error);
    }

    const numeroWhatsApp = vendeurInfo.whatsapp.replace(/\s/g, '').replace(/\+/g, '');
    const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(message)}`;
    
    window.open(url, '_blank');
}

// ==================== FILTRES ====================
function initialiserFiltres() {
    const boutons = document.querySelectorAll('.category-btn');
    
    boutons.forEach(btn => {
        btn.addEventListener('click', function() {
            boutons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            categorieActive = this.dataset.category;
            afficherProduits(categorieActive);
        });
    });
}

// ==================== MODAL ====================
function ouvrirPanier() {
    afficherPanier();
    document.getElementById('cartModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function fermerPanier() {
    document.getElementById('cartModal').classList.remove('active');
    document.body.style.overflow = 'auto';
}

// ==================== ÉVÉNEMENTS ====================
function initialiserEvenements() {
    document.getElementById('cartBtn').addEventListener('click', ouvrirPanier);
    document.getElementById('closeBtn').addEventListener('click', fermerPanier);
    document.getElementById('modalOverlay').addEventListener('click', fermerPanier);
    document.getElementById('whatsappBtn').addEventListener('click', envoyerVersWhatsApp);
    
    initialiserFiltres();
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            fermerPanier();
        }
    });
}

// ==================== UTILITAIRES ====================
function formaterPrix(prix) {
    return parseFloat(prix).toLocaleString('fr-FR');
}

function afficherNotification(message) {
    const notif = document.createElement('div');
    notif.style.cssText = `
        position: fixed;
        top: 100px;
        right: 30px;
        background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        font-weight: 600;
        box-shadow: 0 8px 20px rgba(37, 211, 102, 0.4);
        z-index: 9999;
        animation: slideIn 0.3s ease;
    `;
    notif.textContent = message;
    
    document.body.appendChild(notif);
    
    setTimeout(() => {
        notif.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notif.remove(), 300);
    }, 2000);
}

function afficherErreur(msg) {
    const grid = document.getElementById('productsGrid');
    grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px; color: white;">
            <div style="font-size: 4em; margin-bottom: 20px;">⚠️</div>
            <h3 style="font-size: 1.5em; margin-bottom: 15px;">Erreur</h3>
            <p>${msg}</p>
            <button onclick="location.reload()" style="
                margin-top: 20px;
                padding: 12px 24px;
                background: white;
                color: #667eea;
                border: none;
                border-radius: 8px;
                font-weight: 700;
                cursor: pointer;
            ">Réessayer</button>
        </div>
    `;
}

// ==================== ANIMATIONS CSS ====================
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
    .btn-success {
        background: linear-gradient(135deg, #25D366 0%, #128C7E 100%) !important;
    }
    .cart-empty {
        text-align: center;
        padding: 60px 20px;
        color: #718096;
    }
    .cart-empty-icon {
        font-size: 4em;
        margin-bottom: 15px;
    }
    .cart-empty-text {
        font-size: 1.2em;
    }
`;
document.head.appendChild(style);

// ==================== INITIALISATION ====================
document.addEventListener('DOMContentLoaded', chargerProduits);