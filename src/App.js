import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';

// Context Providers
import { AuthProvider } from './context/AuthContext';
import { ProductProvider } from './context/ProductContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';

// Router
import AppRouter from './router';

// ─── All brand styles injected via JS to bypass PostCSS pipeline ───────────
const GLOBAL_STYLES = `
  /* ── Poppins Font ─────────────────────────────────────────── */
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');

  /* ── CSS Custom Properties ────────────────────────────────── */
  :root {
    --brand-dark-blue:  #00204E;
    --brand-light-green:#34A129;
    --brand-dark-green: #189031;
    --brand-white:      #FFFFFF;
    --brand-light-gray: #F8F9FA;

    --bs-primary:        #00204E;
    --bs-primary-rgb:    0,32,78;
    --bs-success:        #34A129;
    --bs-success-rgb:    52,161,41;
    --bs-body-bg:        #F8F9FA;
    --bs-body-color:     #00204E;
    --bs-link-color:     #34A129;
    --bs-link-hover-color:#189031;
    --bs-font-sans-serif:'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

    --card-shadow:       0 2px 8px  rgba(0,32,78,0.10);
    --card-hover-shadow: 0 8px 24px rgba(0,32,78,0.15);

    --transition-fast:   0.15s ease;
    --transition-normal: 0.30s ease;
    --transition-slow:   0.50s ease;
  }

  /* ── Base Reset ───────────────────────────────────────────── */
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  html { scroll-behavior: smooth; }

  body {
    font-family: 'Poppins', -apple-system, BlinkMacSystemFont,
                 'Segoe UI', 'Roboto', sans-serif;
    color:            #00204E;
    background-color: #F8F9FA;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  a  { text-decoration: none; color: inherit; transition: color 0.3s ease; }
  a:hover { color: #34A129; }
  img { max-width: 100%; height: auto; display: block; }
  button { font-family: 'Poppins', sans-serif; }

  /* ── Scrollbar ────────────────────────────────────────────── */
  ::-webkit-scrollbar       { width: 8px; }
  ::-webkit-scrollbar-track { background: #F8F9FA; }
  ::-webkit-scrollbar-thumb { background: #00204E; border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: #34A129; }

  /* ── Selection ────────────────────────────────────────────── */
  ::selection      { background-color: #34A129; color: #fff; }
  ::-moz-selection { background-color: #34A129; color: #fff; }

  /* ── Focus ────────────────────────────────────────────────── */
  :focus-visible { outline: 2px solid #34A129; outline-offset: 2px; }

  /* ── Animations ───────────────────────────────────────────── */
  @keyframes fadeIn {
    from { opacity:0; transform:translateY(20px); }
    to   { opacity:1; transform:translateY(0);    }
  }
  @keyframes slideInLeft {
    from { opacity:0; transform:translateX(-30px); }
    to   { opacity:1; transform:translateX(0);     }
  }
  @keyframes slideInRight {
    from { opacity:0; transform:translateX(30px); }
    to   { opacity:1; transform:translateX(0);    }
  }
  @keyframes pulse {
    0%,100% { transform:scale(1);    }
    50%      { transform:scale(1.05); }
  }
  @keyframes spin {
    from { transform:rotate(0deg);   }
    to   { transform:rotate(360deg); }
  }

  .fade-in        { animation: fadeIn       0.6s ease-out forwards; }
  .slide-in-left  { animation: slideInLeft  0.6s ease-out forwards; }
  .slide-in-right { animation: slideInRight 0.6s ease-out forwards; }
  .pulse          { animation: pulse 2s infinite; }

  /* ── Brand Text / BG Utilities ────────────────────────────── */
  .text-brand-blue       { color: #00204E !important; }
  .text-brand-green      { color: #34A129 !important; }
  .text-brand-dark-green { color: #189031 !important; }
  .bg-brand-blue         { background-color: #00204E !important; }
  .bg-brand-green        { background-color: #34A129 !important; }
  .bg-brand-dark-green   { background-color: #189031 !important; }

  /* ── Button Overrides ─────────────────────────────────────── */
  .btn-success {
    background-color: #34A129 !important;
    border-color:     #34A129 !important;
    color:            #ffffff !important;
  }
  .btn-success:hover,
  .btn-success:focus,
  .btn-success:active {
    background-color: #189031 !important;
    border-color:     #189031 !important;
    color:            #ffffff !important;
  }
  .btn-primary {
    background-color: #00204E !important;
    border-color:     #00204E !important;
    color:            #ffffff !important;
  }
  .btn-primary:hover,
  .btn-primary:focus,
  .btn-primary:active {
    background-color: #189031 !important;
    border-color:     #189031 !important;
    color:            #ffffff !important;
  }
  .btn-outline-primary {
    color:        #00204E !important;
    border-color: #00204E !important;
  }
  .btn-outline-primary:hover {
    background-color: #00204E !important;
    color:            #ffffff  !important;
  }

  /* ── Card Hover ───────────────────────────────────────────── */
  .card-custom {
    transition: box-shadow var(--transition-normal),
                transform  var(--transition-normal);
  }
  .card-custom:hover {
    box-shadow: var(--card-hover-shadow) !important;
    transform: translateY(-2px);
  }

  /* ── Dropdown active item ─────────────────────────────────── */
  .list-group-item.active {
    background-color: #34A129 !important;
    border-color:     #34A129 !important;
  }

  /* ── Bootstrap badge override ─────────────────────────────── */
  .badge-sale {
    background-color: #34A129 !important;
    color:            #ffffff  !important;
  }

  /* ── Nav link hover ───────────────────────────────────────── */
  .nav-link:hover { color: #34A129 !important; }

  /* ── Misc utilities ───────────────────────────────────────── */
  .cursor-pointer   { cursor: pointer; }
  .transition-all   { transition: all 0.3s ease; }
  .object-fit-cover { object-fit: cover; }
  .min-vh-70        { min-height: 70vh; }
`;

// ─── Inject <style> into <head> once ───────────────────────────────────────
const StyleInjector = () => {
  useEffect(() => {
    const styleId = 'recomm-global-styles';

    // Avoid duplicate injection
    if (document.getElementById(styleId)) return;

    const styleEl = document.createElement('style');
    styleEl.id = styleId;
    styleEl.textContent = GLOBAL_STYLES;
    document.head.appendChild(styleEl);

    return () => {
      const el = document.getElementById(styleId);
      if (el) el.remove();
    };
  }, []);

  return null;
};

// ─── Root App ──────────────────────────────────────────────────────────────
const App = () => {
  return (
    <BrowserRouter>
      <StyleInjector />
      <AuthProvider>
        <ProductProvider>
          <CartProvider>
            <WishlistProvider>
              <AppRouter />
            </WishlistProvider>
          </CartProvider>
        </ProductProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;