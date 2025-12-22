// ==================== VARIABLES GLOBALES ====================
let produits = [];
let panier = [];
let categorieActive = 'tous';
let vendeurInfo = {};

// ==================== CHARGEMENT DES DONNÉES ====================
async function chargerProduits() {
    try {
        const response = await fetch('data/products.json');
        const data = await response.json();
        
        produits = data.produits;
        vendeurInfo = data.vendeur;
        
        afficherProduits(categorieActive);
        initialiserEvenements();
    } catch (error) {
        console.error('Erreur chargement produits:', error);
        afficherErreur();
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
                <h3 style="font-size: 1.5em;">Aucun produit dans cette catégorie</h3>
            </div>
        `;
        return;
    }

    grid.innerHTML = produitsFiltres.map(produit => `
        <div class="product-card" data-id="${produit.id}">
            <img src="${produit.image}" alt="${produit.nom}" class="product-image" loading="lazy">
            <div class="product-info">
                <span class="product-category">${produit.categorie}</span>
                <h3 class="product-name">${produit.nom}</h3>
                <p class="product-desc">${produit.description}</p>
                <div class="product-footer">
                    <span class="product-price">${formaterPrix(produit.prix)} CFA</span>
                    <button class="add-btn" onclick="ajouterAuPanier(${produit.id})">
                        + Ajouter
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// ==================== GESTION PANIER ====================
function ajouterAuPanier(idProduit) {
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
    afficherNotification('✅ Produit ajouté au panier');
}

function retirerDuPanier(idProduit) {
    panier = panier.filter(item => item.id !== idProduit);
    mettreAJourBadgePanier();
    afficherPanier();
}

function viderPanier() {
    panier = [];
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
                <div class="cart-item-price">${formaterPrix(item.prix * item.quantite)} CFA</div>
            </div>
            <button class="remove-btn" onclick="retirerDuPanier(${item.id})">✕</button>
        </div>
    `).join('');

    const total = calculerTotal();
    totalEl.textContent = `${formaterPrix(total)} CFA`;
}

function calculerTotal() {
    return panier.reduce((sum, item) => sum + (item.prix * item.quantite), 0);
}

// ==================== ENVOI WHATSAPP ====================
function envoyerVersWhatsApp() {
    if (panier.length === 0) {
        alert('❌ Votre panier est vide !');
        return;
    }

    let message = `🛍️ *NOUVELLE COMMANDE - MAJAY*\n\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;

    panier.forEach((item, index) => {
        message += `${index + 1}. *${item.nom}*\n`;
        message += `   📦 Quantité: ${item.quantite}\n`;
        message += `   💰 Prix unitaire: ${formaterPrix(item.prix)} CFA\n`;
        message += `   ✅ Sous-total: ${formaterPrix(item.prix * item.quantite)} CFA\n\n`;
    });

    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `💵 *TOTAL: ${formaterPrix(calculerTotal())} CFA*\n\n`;
    message += `Merci de confirmer ma commande ! 🙏`;

    const numeroWhatsApp = vendeurInfo.whatsapp.replace(/\s/g, '');
    const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(message)}`;
    
    window.open(url, '_blank');
}

// ==================== FILTRES CATÉGORIES ====================
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

// ==================== GESTION MODAL ====================
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
    // Bouton panier flottant
    document.getElementById('cartBtn').addEventListener('click', ouvrirPanier);
    
    // Bouton fermer modal
    document.getElementById('closeBtn').addEventListener('click', fermerPanier);
    
    // Overlay modal
    document.getElementById('modalOverlay').addEventListener('click', fermerPanier);
    
    // Bouton WhatsApp
    document.getElementById('whatsappBtn').addEventListener('click', envoyerVersWhatsApp);
    
    // Filtres catégories
    initialiserFiltres();
    
    // Fermer modal avec Échap
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            fermerPanier();
        }
    });
}

// ==================== UTILITAIRES ====================
function formaterPrix(prix) {
    return prix.toLocaleString('fr-FR');
}

function afficherNotification(message) {
    // Créer notification temporaire
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

function afficherErreur() {
    const grid = document.getElementById('productsGrid');
    grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px; color: white;">
            <div style="font-size: 4em; margin-bottom: 20px;">⚠️</div>
            <h3 style="font-size: 1.5em; margin-bottom: 15px;">Erreur de chargement</h3>
            <p>Impossible de charger les produits. Veuillez vérifier votre connexion.</p>
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
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ==================== INITIALISATION ====================
document.addEventListener('DOMContentLoaded', chargerProduits);