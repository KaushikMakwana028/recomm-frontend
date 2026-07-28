import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Layout from "./layouts/Layout";

// Lazy loaded pages for code splitting
const Home = lazy(() => import("./pages/Home"));
const Products = lazy(() => import("./pages/Products"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Categories = lazy(() => import("./pages/Categories"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderConfirmation = lazy(() => import("./pages/OrderConfirmation"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Profile = lazy(() => import("./pages/Profile"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Search = lazy(() => import("./pages/Search"));

// Full-page Loading Spinner
const PageLoader = () => (
  <div
    className="d-flex justify-content-center align-items-center flex-column"
    style={{ minHeight: "60vh" }}
  >
    <div
      className="spinner-border mb-3"
      role="status"
      style={{ width: "3rem", height: "3rem", color: "#34A129" }}
    >
      <span className="visually-hidden">Loading...</span>
    </div>
    <p className="text-muted">Loading page...</p>
  </div>
);

// Protected Route - requires auth
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return children;
};

// Guest Route - redirects authenticated users away
const GuestRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <PageLoader />;
  if (isAuthenticated) return <Navigate to="/" replace />;

  return children;
};

// 404 Page Component
const NotFoundPage = () => (
  <div
    className="d-flex justify-content-center align-items-center text-center py-5"
    style={{ minHeight: "70vh" }}
  >
    <div>
      <h1
        className="fw-bold mb-2"
        style={{ fontSize: "8rem", color: "#00204E", lineHeight: 1 }}
      >
        404
      </h1>
      <h3 className="mb-3" style={{ color: "#00204E" }}>
        Oops! Page Not Found
      </h3>
      <p className="text-muted mb-4 mx-auto" style={{ maxWidth: "400px" }}>
        The page you're looking for doesn't exist or has been moved. Let's get
        you back on track!
      </p>
      <div className="d-flex gap-3 justify-content-center flex-wrap">
        <a
          href="/"
          className="btn btn-lg text-white px-4"
          style={{ backgroundColor: "#00204E" }}
        >
          🏠 Go Home
        </a>
        <a
          href="/products"
          className="btn btn-lg text-white px-4"
          style={{ backgroundColor: "#34A129" }}
        >
          🛍️ Browse Products
        </a>
      </div>
    </div>
  </div>
);

// Main App Router
const AppRouter = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* ── Public Routes ─────────────────────────────────── */}
        <Route
          path="/"
          element={
            <Layout>
              <Home />
            </Layout>
          }
        />

        <Route
          path="/products"
          element={
            <Layout>
              <Products />
            </Layout>
          }
        />

        <Route
          path="/product/:id"
          element={
            <Layout>
              <ProductDetail />
            </Layout>
          }
        />

        <Route
          path="/cart"
          element={
            <Layout>
              <Cart />
            </Layout>
          }
        />

        <Route
          path="/wishlist"
          element={
            <Layout>
              <Wishlist />
            </Layout>
          }
        />

        <Route
          path="/search"
          element={
            <Layout>
              <Search />
            </Layout>
          }
        />

        <Route
          path="/categories"
          element={
            <Layout>
              <Categories />
            </Layout>
          }
        />

        <Route
          path="/categories/:id"
          element={
            <Layout>
              <Categories />
            </Layout>
          }
        />

        {/* ── Protected Routes (must be logged in) ─────────── */}
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <Layout>
                <Checkout />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/order-confirmation"
          element={
            <ProtectedRoute>
              <Layout>
                <OrderConfirmation />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Layout>
                <Profile />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* ── Guest Only Routes ─────────────────────────────── */}
        <Route
          path="/login"
          element={
            <GuestRoute>
              <Login />
            </GuestRoute>
          }
        />

        <Route
          path="/signup"
          element={
            <GuestRoute>
              <Signup />
            </GuestRoute>
          }
        />

        {/* ── 404 Catch-All ─────────────────────────────────── */}
        <Route
          path="*"
          element={
            <Layout>
              <NotFoundPage />
            </Layout>
          }
        />
      </Routes>
    </Suspense>
  );
};

export default AppRouter;
