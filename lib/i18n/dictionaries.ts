// Dictionnaire i18n de la surface marketing publique (FR/EN).
// Le Cameroun est officiellement bilingue — l'anglais couvre les régions
// du Nord-Ouest et du Sud-Ouest. L'app authentifiée reste en FR (phase 2).

export type Lang = "fr" | "en"

export const dictionaries: Record<Lang, Record<string, string>> = {
  fr: {
    // Navbar
    "nav.home": "Accueil",
    "nav.explore": "Explorer",
    "nav.shops": "Magasins",
    "nav.offers": "Offres",
    "nav.delivery": "Livraison Express",
    "nav.pay": "QuickGo Pay",
    "nav.vendor": "Devenir Vendeur",
    "nav.ai": "AI Assistant",
    "nav.help": "Aide & Support",
    "nav.search": "Rechercher un produit, magasin, restaurant...",
    "nav.signin": "Se connecter",
    "nav.signup": "Créer un compte",
    "nav.dashboard": "Mon tableau de bord",
    "nav.vendorSpace": "Espace vendeur",
    "nav.profile": "Mon profil",
    "nav.signout": "Se déconnecter",
    "nav.badge.new": "Nouveau",

    // Hero
    "hero.badge": "LIVRAISON RAPIDE & SÉCURISÉE",
    "hero.title1": "Tout ce dont",
    "hero.title2": "vous avez besoin.",
    "hero.title3": "Livré intelligemment.",
    "hero.subtitle": "Marketplace locale, livraison express, paiements sécurisés, et bien plus encore dans une seule super app.",
    "hero.searchPlaceholder": "Rechercher un produit, un restaurant, une pharmacie…",
    "hero.searchBtn": "Rechercher",
    "hero.cta1": "Commander maintenant",
    "hero.cta2": "Explorer les services",
    "hero.trust1": "Paiement sécurisé CinetPay",
    "hero.trust2": "Cash à la livraison",
    "hero.trust3": "Avis vérifiés après livraison",

    // Categories section
    "cat.title": "Que recherchez-vous ?",
    "cat.subtitle": "Explorez nos catégories et services",
    "cat.market": "Market",
    "cat.market.sub": "Des milliers de produits",
    "cat.restaurants": "Restaurants",
    "cat.restaurants.sub": "Vos plats préférés",
    "cat.pharmacie": "Pharmacie",
    "cat.pharmacie.sub": "Santé & bien-être",
    "cat.mode": "Mode",
    "cat.mode.sub": "Tendances & styles",
    "cat.supermarche": "Supermarché",
    "cat.supermarche.sub": "Tout le quotidien",
    "cat.ai": "AI Assistant",
    "cat.ai.sub": "Votre assistant intelligent",
    "cat.delivery": "Transport & Livraison",
    "cat.delivery.sub": "Suivre ma livraison",

    // Cities section
    "cities.title": "Choisissez votre ville",
    "cities.subtitle": "QuickGo est disponible dans les principales villes du Cameroun",
    "cities.seeAll": "Voir toutes les villes",
    "cities.fastDelivery": "Livraison rapide",
    "cities.others": "Autres villes",
    "cities.soon": "Bientôt disponible",

    // Features section
    "feat.title.pre": "Pourquoi choisir",
    "feat.title.post": "?",
    "feat.fast.title": "Livraison ultra rapide",
    "feat.fast.desc": "En moins de 30 minutes dans toute la ville",
    "feat.fast.cta": "Commander maintenant",
    "feat.secure.title": "Paiement 100% sécurisé",
    "feat.secure.desc": "Vos transactions sont protégées et cryptées",
    "feat.secure.cta": "En savoir plus",
    "feat.support.title": "Support 24/7",
    "feat.support.desc": "Notre équipe est disponible à tout moment",
    "feat.support.cta": "Contacter le support",
    "feat.vendor.title": "Devenez vendeur",
    "feat.vendor.desc": "Développez votre business avec QuickGo",
    "feat.vendor.cta": "Commencer maintenant",

    // Testimonials
    "testi.badge": "AVIS CLIENTS",
    "testi.title.pre": "Ce que nos clients",
    "testi.title.post": "disent de nous",
    "testi.subtitle": "Des avis authentiques, déposés après des commandes réellement livrées.",

    // Footer
    "footer.tagline": "La super application de livraison au Cameroun. Courses, restaurants, pharmacies, et bien plus encore.",
    "footer.newsletter.title": "Restez informé",
    "footer.newsletter.desc": "Offres, nouveautés et bons plans — directement dans votre boîte mail.",
    "footer.newsletter.placeholder": "Votre email",
    "footer.newsletter.btn": "S'inscrire",
    "footer.newsletter.done": "Merci ! Vous recevrez nos offres et nouveautés.",
    "footer.app.title": "QuickGo sur votre écran d'accueil",
    "footer.app.desc": "Installez l'application web — légère, rapide, avec notifications.",
    "footer.rights": "Tous droits réservés.",

    // Language switcher
    "lang.fr": "Français",
    "lang.en": "English",
  },

  en: {
    // Navbar
    "nav.home": "Home",
    "nav.explore": "Explore",
    "nav.shops": "Shops",
    "nav.offers": "Deals",
    "nav.delivery": "Express Delivery",
    "nav.pay": "QuickGo Pay",
    "nav.vendor": "Become a Seller",
    "nav.ai": "AI Assistant",
    "nav.help": "Help & Support",
    "nav.search": "Search for a product, shop, restaurant...",
    "nav.signin": "Sign in",
    "nav.signup": "Create account",
    "nav.dashboard": "My dashboard",
    "nav.vendorSpace": "Seller space",
    "nav.profile": "My profile",
    "nav.signout": "Sign out",
    "nav.badge.new": "New",

    // Hero
    "hero.badge": "FAST & SECURE DELIVERY",
    "hero.title1": "Everything you",
    "hero.title2": "need.",
    "hero.title3": "Delivered smart.",
    "hero.subtitle": "Local marketplace, express delivery, secure payments, and much more in a single super app.",
    "hero.searchPlaceholder": "Search for a product, restaurant, pharmacy…",
    "hero.searchBtn": "Search",
    "hero.cta1": "Order now",
    "hero.cta2": "Explore services",
    "hero.trust1": "Secure CinetPay payment",
    "hero.trust2": "Cash on delivery",
    "hero.trust3": "Reviews verified after delivery",

    // Categories section
    "cat.title": "What are you looking for?",
    "cat.subtitle": "Browse our categories and services",
    "cat.market": "Market",
    "cat.market.sub": "Thousands of products",
    "cat.restaurants": "Restaurants",
    "cat.restaurants.sub": "Your favourite meals",
    "cat.pharmacie": "Pharmacy",
    "cat.pharmacie.sub": "Health & wellness",
    "cat.mode": "Fashion",
    "cat.mode.sub": "Trends & styles",
    "cat.supermarche": "Supermarket",
    "cat.supermarche.sub": "Everyday essentials",
    "cat.ai": "AI Assistant",
    "cat.ai.sub": "Your smart assistant",
    "cat.delivery": "Transport & Delivery",
    "cat.delivery.sub": "Track my delivery",

    // Cities section
    "cities.title": "Choose your city",
    "cities.subtitle": "QuickGo is available in Cameroon's main cities",
    "cities.seeAll": "See all cities",
    "cities.fastDelivery": "Fast delivery",
    "cities.others": "Other cities",
    "cities.soon": "Coming soon",

    // Features section
    "feat.title.pre": "Why choose",
    "feat.title.post": "?",
    "feat.fast.title": "Ultra-fast delivery",
    "feat.fast.desc": "In under 30 minutes across the city",
    "feat.fast.cta": "Order now",
    "feat.secure.title": "100% secure payment",
    "feat.secure.desc": "Your transactions are protected and encrypted",
    "feat.secure.cta": "Learn more",
    "feat.support.title": "24/7 Support",
    "feat.support.desc": "Our team is available at any time",
    "feat.support.cta": "Contact support",
    "feat.vendor.title": "Become a seller",
    "feat.vendor.desc": "Grow your business with QuickGo",
    "feat.vendor.cta": "Get started",

    // Testimonials
    "testi.badge": "CUSTOMER REVIEWS",
    "testi.title.pre": "What our customers",
    "testi.title.post": "say about us",
    "testi.subtitle": "Authentic reviews, left after orders that were actually delivered.",

    // Footer
    "footer.tagline": "Cameroon's super delivery app. Groceries, restaurants, pharmacies, and much more.",
    "footer.newsletter.title": "Stay informed",
    "footer.newsletter.desc": "Deals, news and offers — straight to your inbox.",
    "footer.newsletter.placeholder": "Your email",
    "footer.newsletter.btn": "Subscribe",
    "footer.newsletter.done": "Thank you! You'll receive our deals and news.",
    "footer.app.title": "QuickGo on your home screen",
    "footer.app.desc": "Install the web app — light, fast, with notifications.",
    "footer.rights": "All rights reserved.",

    // Language switcher
    "lang.fr": "Français",
    "lang.en": "English",
  },
}
