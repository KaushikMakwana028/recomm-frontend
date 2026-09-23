import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  FaShoppingCart,
  FaHeart,
  FaMinus,
  FaPlus,
  FaUser,
  FaMapMarkerAlt,
  FaPhone,
  FaClock,
  FaChevronRight,
  FaStore,
  FaShieldAlt,
  FaTruck,
  FaBolt,
  FaCheck,
  FaList,
  FaTags,
} from "react-icons/fa";
import ProductService from "../services/productService";
import CategoryService from "../services/categoryService";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useShoppingList } from "../context/ShoppingListContext";
import { formatPrice } from "../utils/helpers";
import { getStockInfo } from "../utils/stockUtils";
import {
  ProductDetailSkeleton,
  ProductGridSkeleton,
} from "../components/SkeletonLoaders";

const NAVY = "#00204E";
const NAVY_DEEP = "#00152F";
const GREEN = "#34A129";
const GREEN_DEEP = "#278A1E";
const GREEN_SOFT = "#EAF7E8";
const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600";

const DEFAULT_DESCRIPTION =
  "No description available for this product yet. Check back soon, or contact us if you'd like more details before you buy.";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cartItems, addToCart, updateQuantity, removeFromCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { openAddToListModal } = useShoppingList();

  const [product, setProduct] = useState(null);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(false);

  useEffect(() => {
    loadProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadProduct = async () => {
    setLoading(true);
    const result = await ProductService.getProductDetail(id);
    if (result.success) {
      const prod = result.data;
      setProduct(prod);

      // Initialize selected edition/variant
      const currentVar =
        prod.variants?.find((v) => Number(v.id) === Number(prod.id)) ||
        prod.variants?.[0] ||
        null;
      setSelectedVariant(currentVar);

      const initialOffer =
        prod.offers && prod.offers.length > 0
          ? prod.offers.find((o) => Number(o.vendor_product_id) === Number(prod.id)) ||
            prod.offers[0]
          : null;
      setSelectedOffer(initialOffer);
      setSelectedImage(0);
      setQuantity(1);
      loadRelatedProducts(prod);
    } else {
      navigate("/products");
    }
    setLoading(false);
  };

  const loadRelatedProducts = async (currentProduct) => {
    if (!currentProduct?.category_id) {
      setRelatedProducts([]);
      return;
    }
    setRelatedLoading(true);
    const result = await CategoryService.getProductsByCategory(
      currentProduct.category_id,
    );
    if (result.success) {
      const filtered = (result.data || []).filter(
        (p) => String(p.id) !== String(currentProduct.id),
      );
      setRelatedProducts(filtered);
    } else {
      setRelatedProducts([]);
    }
    setRelatedLoading(false);
  };

  const handleSelectVariant = (variant) => {
    if (!variant || Number(variant.stock) <= 0) return;
    setSelectedVariant(variant);
    setQuantity(1);
    // Update browser URL without page reload so sharing/bookmarking works
    window.history.replaceState(null, "", `/product/${variant.id}`);
  };

  const activeProductId = selectedVariant
    ? selectedVariant.id
    : (selectedOffer ? selectedOffer.vendor_product_id : product?.id);

  const activePrice = selectedVariant
    ? (selectedVariant.sale_price ?? selectedVariant.price)
    : (selectedOffer
        ? (selectedOffer.sale_price ?? selectedOffer.price)
        : (product?.sale_price ?? product?.price));

  const activeMrp = selectedVariant
    ? (selectedVariant.price ?? selectedVariant.sale_price)
    : (selectedOffer ? selectedOffer.price : product?.price);

  const activeItem = selectedVariant || selectedOffer || product;
  const activeStockInfo = getStockInfo(activeItem);
  const activeStock = activeStockInfo.stock;
  const isStoreClosed = selectedOffer
    ? (selectedOffer.store_status === 'closed' || Number(selectedOffer.is_holiday) === 1)
    : (product?.store_status === 'closed' || Number(product?.is_holiday) === 1);

  const activeIsAvailable = activeStockInfo.canAddToCart && !isStoreClosed;

  const activeUnit = selectedVariant?.variant_name || selectedVariant?.unit || product?.unit;
  const activeSku = selectedVariant?.sku || product?.sku;

  const activeStoreName = selectedOffer ? selectedOffer.store_name : product?.store_name;
  const activeVendorName = selectedOffer ? selectedOffer.vendor_name : product?.vendor_name;
  const activeStoreContact = selectedOffer ? selectedOffer.store_contact : product?.store_contact;
  const activeStoreAddress = selectedOffer ? selectedOffer.store_address : product?.store_address;
  const activeStorePhoto = selectedOffer
    ? selectedOffer.store_photo_url || product?.store_photo_url
    : product?.store_photo_url;
  const activeDistanceKm = selectedOffer ? selectedOffer.distance_km : product?.distance_km;
  const activeVendorId = selectedOffer ? selectedOffer.vendor_id : product?.vendor_id;
  const activeOpeningTime = selectedOffer
    ? selectedOffer.store_opening_time
    : product?.store_opening_time;
  const activeClosingTime = selectedOffer
    ? selectedOffer.store_closing_time
    : product?.store_closing_time;

  const inCartItem = cartItems?.find((i) => String(i.id) === String(activeProductId));

  const getProductDisplayName = () => {
    if (activeUnit && activeUnit !== "Standard" && !product.name.toLowerCase().includes(activeUnit.toLowerCase())) {
      return `${product.name} (${activeUnit})`;
    }
    return product.name;
  };

  const handleAddToCart = () => {
    if (!activeIsAvailable) return;
    addToCart(
      {
        id: activeProductId,
        name: getProductDisplayName(),
        price: activePrice,
        sale_price: activePrice,
        unit: activeUnit,
        image_url: selectedVariant?.image_url || product.image_url,
        category_name: product.category_name,
        vendor_id: activeVendorId,
        store_name: activeStoreName,
      },
      quantity,
    );
  };

  const handleBuyNow = async () => {
    if (!activeIsAvailable) return;
    if (!inCartItem) {
      await addToCart(
        {
          id: activeProductId,
          name: getProductDisplayName(),
          price: activePrice,
          sale_price: activePrice,
          unit: activeUnit,
          image_url: selectedVariant?.image_url || product.image_url,
          category_name: product.category_name,
          vendor_id: activeVendorId,
          store_name: activeStoreName,
        },
        quantity,
        true,
      );
    }
    navigate("/cart");
  };

  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;
    const maxStock = activeStock > 0 ? activeStock : 1;
    if (newQuantity >= 1 && newQuantity <= Math.min(99, maxStock)) {
      setQuantity(newQuantity);
    }
  };

  const handleSelectOffer = (offer) => {
    if (!offer.is_available || Number(offer.stock) <= 0) return;
    setSelectedOffer(offer);
    setQuantity(1);
  };

  const handleOpenAddToList = () => {
    if (!product) return;
    openAddToListModal({
      id: activeProductId,
      name: getProductDisplayName(),
      price: activePrice,
      sale_price: activePrice,
      unit: activeUnit,
      image_url: selectedVariant?.image_url || product.image_url,
      category_name: product.category_name,
      vendor_id: activeVendorId,
      store_name: activeStoreName,
    });
  };

  if (loading) {
    return <ProductDetailSkeleton />;
  }

  if (!product) return null;

  const images = [
    product.image_url || FALLBACK_IMG,
    ...(product.gallery_urls || []),
  ];
  const inWishlist = isInWishlist(product.id);

  return (
    <div className="product-detail-page">
      <style>{`
        * { box-sizing: border-box; }
        .product-detail-page { background: #f3f6fa; font-family: 'Poppins', sans-serif; min-height: 100vh; }

        .pd-loading-screen { min-height: 70vh; display: flex; align-items: center; justify-content: center; }
        .pd-loading-spinner {
          width: 42px; height: 42px; border-radius: 50%;
          border: 4px solid ${GREEN_SOFT}; border-top-color: ${GREEN};
          animation: pdSpin 0.8s linear infinite;
        }
        @keyframes pdSpin { to { transform: rotate(360deg); } }

        .pd-wrap { max-width: 1180px; margin: 0 auto; padding: 1.5rem 1rem 3rem; }

        /* ---------- Breadcrumb ---------- */
        .pd-breadcrumb {
          display: flex; align-items: center; flex-wrap: wrap; gap: 0.35rem;
          font-size: 0.82rem; margin-bottom: 1.25rem; color: #94a3b8;
        }
        .pd-breadcrumb a { color: #64748b; text-decoration: none; font-weight: 500; }
        .pd-breadcrumb a:hover { color: ${GREEN_DEEP}; }
        .pd-breadcrumb .pd-crumb-active { color: ${GREEN_DEEP}; font-weight: 700; }
        .pd-breadcrumb svg { opacity: 0.5; }

        /* ---------- Top grid ---------- */
        .pd-top-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.25rem;
          margin-bottom: 2.5rem;
        }
        @media (min-width: 992px) {
          .pd-top-grid { grid-template-columns: 1fr 1fr; align-items: start; }
        }

        /* ---------- Gallery ---------- */
        .pd-gallery-card {
          background: #fff; border-radius: 18px;
          box-shadow: 0 4px 20px rgba(0,32,78,0.06);
          padding: 1.1rem;
        }
        @media (min-width: 992px) { .pd-gallery-card { position: sticky; top: 1rem; } }

        .pd-main-img-wrap {
          aspect-ratio: 1 / 1; background: #f6f8fb; border-radius: 14px;
          display: flex; align-items: center; justify-content: center; overflow: hidden;
          margin-bottom: 0.85rem; position: relative;
        }
        .pd-main-img-wrap img { width: 100%; height: 100%; object-fit: contain; padding: 1.5rem; }

        .pd-thumb-row { display: flex; gap: 0.6rem; overflow-x: auto; padding-bottom: 2px; scrollbar-width: none; }
        .pd-thumb-row::-webkit-scrollbar { display: none; }
        .pd-thumb {
          flex: 0 0 64px; width: 64px; height: 64px; background: #f6f8fb; border-radius: 10px; overflow: hidden;
          display: flex; align-items: center; justify-content: center; cursor: pointer;
          border: 2px solid transparent; transition: border-color .15s ease, opacity .15s ease;
          opacity: 0.65;
        }
        .pd-thumb img { width: 100%; height: 100%; object-fit: contain; padding: 0.35rem; }
        .pd-thumb.active { border-color: ${GREEN}; opacity: 1; }

        /* ---------- Info panel ---------- */
        .pd-info-card { background: #fff; border-radius: 18px; box-shadow: 0 4px 20px rgba(0,32,78,0.06); padding: 1.5rem; }

        .pd-category-badge {
          background: ${GREEN_SOFT}; color: ${GREEN_DEEP};
          font-weight: 700; font-size: 0.72rem; letter-spacing: 0.02em;
          padding: 0.38rem 0.85rem; border-radius: 999px;
          display: inline-block; text-decoration: none; text-transform: uppercase;
          margin-bottom: 0.85rem; transition: background 0.15s ease;
        }
        .pd-category-badge:hover { background: ${GREEN}; color: #fff; }

        .pd-name { color: ${NAVY}; font-weight: 800; font-size: 1.5rem; line-height: 1.3; margin: 0 0 0.65rem; }

        .pd-price-row { display: flex; align-items: baseline; gap: 0.6rem; margin-bottom: 0.35rem; }
        .pd-price { color: ${GREEN_DEEP}; font-weight: 800; font-size: 1.85rem; margin: 0; }
        .pd-sku { color: #94a3b8; font-size: 0.78rem; margin-bottom: 1.1rem; }

        .pd-description {
          color: #64748b; font-size: 0.9rem; line-height: 1.65;
          padding: 0.9rem 1rem; background: #f8fafc; border-radius: 12px;
          border-left: 3px solid ${GREEN}; margin-bottom: 1.35rem;
        }

        .pd-trust-row { display: flex; gap: 0.6rem; flex-wrap: wrap; margin-bottom: 1.35rem; }
        .pd-trust-chip {
          display: flex; align-items: center; gap: 0.4rem;
          background: #f8fafc; color: ${NAVY}; font-size: 0.72rem; font-weight: 600;
          padding: 0.4rem 0.7rem; border-radius: 8px;
        }
        .pd-trust-chip svg { color: ${GREEN}; }

        /* ---------- Seller card ---------- */
        .pd-vendor-card {
          border-radius: 14px; padding: 1.1rem;
          background: linear-gradient(135deg, #fbfcfe 0%, #f2f6fb 100%);
          border: 1px solid #e7ecf3;
          margin-bottom: 1.5rem;
        }
        .pd-vendor-title {
          display: flex; align-items: center; gap: 0.4rem;
          font-weight: 700; color: ${NAVY}; font-size: 0.72rem;
          margin-bottom: 0.9rem; text-transform: uppercase; letter-spacing: 0.06em;
        }
        .pd-vendor-body { display: flex; align-items: flex-start; gap: 0.9rem; }
        .pd-vendor-photo-wrap {
          width: 56px; height: 56px; border-radius: 12px; overflow: hidden;
          background: #f4f6f9; border: 1px solid #e7ecf3;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .pd-vendor-photo-wrap img { width: 100%; height: 100%; object-fit: cover; }
        .pd-vendor-name { font-weight: 700; color: ${NAVY}; font-size: 1rem; margin-bottom: 0.5rem; }
        .pd-vendor-detail {
          font-size: 0.8rem; color: #64748b; margin-bottom: 0.3rem;
          display: flex; align-items: center; gap: 0.45rem;
        }
        .pd-vendor-detail svg { color: #9aa5b5; flex-shrink: 0; }
        .pd-vendor-detail strong { color: ${NAVY}; font-weight: 600; }

        /* ---------- Quantity stepper ---------- */
        .pd-qty-label { font-weight: 700; color: ${NAVY}; font-size: 0.85rem; margin-bottom: 0.55rem; display: block; }
        .pd-qty-stepper {
          display: inline-flex; align-items: center; border: 1.5px solid #e2e8f0;
          border-radius: 10px; overflow: hidden; margin-bottom: 1.4rem;
        }
        .pd-qty-btn {
          width: 42px; height: 42px; border: none; background: #fff; color: ${NAVY};
          display: flex; align-items: center; justify-content: center; cursor: pointer;
          transition: background 0.15s ease;
        }
        .pd-qty-btn:hover:not(:disabled) { background: ${GREEN_SOFT}; color: ${GREEN_DEEP}; }
        .pd-qty-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .pd-qty-value {
          width: 46px; text-align: center; font-weight: 700; color: ${NAVY};
          font-size: 0.95rem; border-left: 1.5px solid #e2e8f0; border-right: 1.5px solid #e2e8f0;
          height: 42px; display: flex; align-items: center; justify-content: center;
        }

        /* ---------- CTAs ---------- */
        .pd-desktop-actions { display: flex; align-items: center; gap: 0.75rem; margin-top: 0.5rem; }
        .pd-btn-cta {
          flex: 1; height: 48px; background: ${GREEN}; color: #fff; border: none; font-weight: 700;
          border-radius: 12px; padding: 0 1.25rem; font-size: 0.95rem;
          display: flex; align-items: center; justify-content: center; gap: 0.55rem;
          cursor: pointer; transition: background 0.18s ease, transform 0.15s ease;
        }
        .pd-btn-cta:hover { background: ${GREEN_DEEP}; transform: translateY(-1px); }
        .pd-btn-buy {
          flex: 1; height: 48px; background: linear-gradient(135deg, ${NAVY} 0%, ${NAVY_DEEP} 100%);
          color: #fff; border: none; font-weight: 700;
          border-radius: 12px; padding: 0 1.25rem; font-size: 0.95rem;
          display: flex; align-items: center; justify-content: center; gap: 0.55rem;
          cursor: pointer; transition: all 0.18s ease;
          box-shadow: 0 4px 14px rgba(0, 32, 78, 0.18);
        }
        .pd-btn-buy:hover { background: linear-gradient(135deg, #002d6e 0%, #001f44 100%); transform: translateY(-1px); }
        .pd-btn-heart-icon {
          width: 48px; height: 48px; border-radius: 12px; border: 1.5px solid #e2e8f0;
          background: #fff; display: flex; align-items: center; justify-content: center;
          cursor: pointer; flex-shrink: 0; transition: all 0.18s ease;
        }
        .pd-btn-heart-icon:hover { background: #fef2f2; border-color: #fecaca; transform: scale(1.05); }
        .pd-btn-heart-icon.active { background: #fef2f2; border-color: #fca5a5; }
        .pd-btn-list-icon {
          width: 48px; height: 48px; border-radius: 12px; border: 1.5px solid #e2e8f0;
          background: #fff; display: flex; align-items: center; justify-content: center;
          cursor: pointer; flex-shrink: 0; transition: all 0.18s ease;
        }
        .pd-btn-list-icon:hover { background: #f0f9ff; border-color: #bae6fd; transform: scale(1.05); }

        /* In-cart Stepper Toggle */
        .pd-incart-toggle {
          flex: 1; height: 48px; display: flex; align-items: center; justify-content: space-between;
          background: #f0fdf4; border: 2px solid ${GREEN}; border-radius: 12px; padding: 0 0.4rem;
        }
        .pd-incart-btn {
          width: 38px; height: 38px; border-radius: 8px; border: none;
          background: #fff; color: ${GREEN_DEEP}; display: flex; align-items: center; justify-content: center;
          cursor: pointer; box-shadow: 0 1px 4px rgba(0,0,0,0.08); transition: background 0.15s ease;
        }
        .pd-incart-btn:hover:not(:disabled) { background: ${GREEN}; color: #fff; }
        .pd-incart-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .pd-incart-value { display: flex; flex-direction: column; align-items: center; line-height: 1.1; }
        .pd-incart-num { font-size: 1.05rem; font-weight: 800; color: ${GREEN_DEEP}; }
        .pd-incart-sub { font-size: 0.65rem; font-weight: 600; color: #166534; text-transform: uppercase; letter-spacing: 0.04em; }

        /* Image floating heart & list button */
        .pd-img-heart-btn {
          position: absolute; top: 12px; right: 12px; width: 40px; height: 40px; border-radius: 50%;
          background: rgba(255, 255, 255, 0.92); border: 1px solid #edf2f7;
          display: flex; align-items: center; justify-content: center; cursor: pointer;
          box-shadow: 0 3px 10px rgba(0, 32, 78, 0.12); transition: all 0.18s ease; z-index: 5;
        }
        .pd-img-heart-btn:hover { transform: scale(1.08); }
        .pd-img-heart-btn.active { background: #fff; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.2); }
        .pd-img-list-btn {
          position: absolute; top: 58px; right: 12px; width: 40px; height: 40px; border-radius: 50%;
          background: rgba(255, 255, 255, 0.92); border: 1px solid #edf2f7;
          display: flex; align-items: center; justify-content: center; cursor: pointer;
          box-shadow: 0 3px 10px rgba(0, 32, 78, 0.12); transition: all 0.18s ease; z-index: 5;
        }
        .pd-img-list-btn:hover { transform: scale(1.08); background: #fff; }

        /* ---------- Mobile sticky bar ---------- */
        .pd-mobile-bar {
          position: fixed; left: 0; right: 0; bottom: 0; z-index: 1030;
          background: #fff; border-top: 1px solid #e7eaf0;
          box-shadow: 0 -6px 20px rgba(0,32,78,0.1);
          padding: 0.65rem 0.9rem; padding-bottom: max(0.65rem, env(safe-area-inset-bottom));
          display: flex; align-items: center; gap: 0.55rem;
        }
        .pd-mobile-price { color: ${GREEN_DEEP}; font-weight: 800; font-size: 1rem; white-space: nowrap; }
        .pd-mobile-wish {
          width: 42px; height: 42px; border-radius: 12px; flex-shrink: 0;
          border: 1.5px solid #e2e8f0; background: #fff;
          display: flex; align-items: center; justify-content: center; cursor: pointer;
        }
        .pd-mobile-wish.active { border-color: #dc3545; background: #fff5f5; }
        .pd-mobile-list {
          width: 42px; height: 42px; border-radius: 12px; flex-shrink: 0;
          border: 1.5px solid #e2e8f0; background: #fff;
          display: flex; align-items: center; justify-content: center; cursor: pointer;
          transition: all 0.18s ease;
        }
        .pd-mobile-list:hover { background: #f0f9ff; border-color: #bae6fd; }

        /* ---------- Related products ---------- */
        .pd-related-section { margin-top: 1rem; }
        .pd-related-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 1.15rem; flex-wrap: wrap; gap: 0.6rem;
        }
        .pd-related-heading { color: ${NAVY}; font-weight: 800; font-size: 1.15rem; margin: 0; display: flex; align-items: center; gap: 0.5rem; }
        .pd-related-heading .dot { width: 7px; height: 7px; border-radius: 50%; background: ${GREEN}; }
        .pd-viewall-link {
          display: flex; align-items: center; gap: 0.35rem;
          color: ${GREEN_DEEP}; font-weight: 700; font-size: 0.82rem;
          text-decoration: none; border: 1.5px solid ${GREEN}; border-radius: 999px;
          padding: 0.4rem 0.9rem; transition: background 0.15s ease;
        }
        .pd-viewall-link:hover { background: ${GREEN_SOFT}; }

        .pd-related-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.85rem;
          justify-content: start;
        }
        @media (min-width: 640px) { .pd-related-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
        @media (min-width: 992px) { .pd-related-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }

        .pd-related-card {
          background: #fff; border-radius: 14px; overflow: hidden;
          box-shadow: 0 3px 12px rgba(0,32,78,0.06);
          transition: transform .18s ease, box-shadow .18s ease;
          display: flex; flex-direction: column;
        }
        .pd-related-card:hover { transform: translateY(-3px); box-shadow: 0 10px 22px rgba(0,32,78,0.14); }
        .pd-related-img-wrap {
          aspect-ratio: 1 / 1; background: #f6f8fb;
          display: flex; align-items: center; justify-content: center; overflow: hidden;
        }
        .pd-related-img-wrap img { width: 100%; height: 100%; object-fit: contain; padding: 0.9rem; }
        .pd-related-body { padding: 0.75rem 0.85rem 0.9rem; display: flex; flex-direction: column; flex: 1; }
        .pd-related-title {
          color: ${NAVY}; font-weight: 600; font-size: 0.85rem; text-decoration: none;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
          min-height: 2.3em; margin-bottom: 0.5rem;
        }
        .pd-related-title:hover { color: ${GREEN_DEEP}; }
        .pd-related-price { color: ${GREEN_DEEP}; font-weight: 800; font-size: 0.95rem; margin-bottom: 0.65rem; }
        .pd-related-btn {
          background: ${GREEN}; color: #fff; border: none; font-weight: 700;
          border-radius: 9px; padding: 0.5rem; font-size: 0.78rem; margin-top: auto;
          display: flex; align-items: center; justify-content: center; gap: 0.4rem; cursor: pointer;
          transition: background 0.15s ease;
        }
        .pd-related-btn:hover { background: ${GREEN_DEEP}; }

        .pd-related-empty {
          background: #fff; border-radius: 14px; padding: 2rem; text-align: center;
          color: #94a3b8; font-size: 0.88rem; box-shadow: 0 3px 12px rgba(0,32,78,0.05);
        }
        .pd-related-loading { display: flex; justify-content: center; padding: 2rem; }

        .pd-mobile-bar { display: flex; }
        @media (min-width: 768px) {
          .pd-mobile-bar { display: none; }
        }
        @media (max-width: 767.98px) {
          .pd-desktop-actions { display: none; }
          .pd-page-bottom-pad { padding-bottom: 84px; }
        }
      `}</style>

      <div className="pd-wrap pd-page-bottom-pad">
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="pd-breadcrumb">
          <Link to="/">Home</Link>
          <FaChevronRight size={9} />
          <Link to="/products">Products</Link>
          <FaChevronRight size={9} />
          <span className="pd-crumb-active">{product.name}</span>
        </nav>

        <div className="pd-top-grid">
          {/* Gallery */}
          <div className="pd-gallery-card">
            <div className="pd-main-img-wrap">
              <img src={images[selectedImage]} alt={product.name} />
              <button
                type="button"
                className={`pd-img-heart-btn ${inWishlist ? "active" : ""}`}
                onClick={() => toggleWishlist(product)}
                title={inWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
                aria-label="Wishlist"
              >
                <FaHeart size={18} color={inWishlist ? "#dc2626" : "#64748b"} />
              </button>
              <button
                type="button"
                className="pd-img-list-btn"
                onClick={handleOpenAddToList}
                title="Add to Shopping List"
                aria-label="Add to shopping list"
              >
                <FaList size={16} color="#0369a1" />
              </button>
            </div>

            {images.length > 1 && (
              <div className="pd-thumb-row">
                {images.map((img, index) => (
                  <div
                    key={index}
                    className={`pd-thumb ${selectedImage === index ? "active" : ""}`}
                    onClick={() => setSelectedImage(index)}
                  >
                    <img src={img} alt={`${product.name} ${index + 1}`} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="pd-info-card">
            {product.category_name && (
              <Link
                to={`/categories/${product.category_id}`}
                className="pd-category-badge"
              >
                {product.category_name}
              </Link>
            )}

            <h1 className="pd-name">{product.name}</h1>

            <div className="pd-price-row">
              <p className="pd-price">{formatPrice(activePrice)}</p>
              {Number(activeMrp) > Number(activePrice) && (
                <span className="text-decoration-line-through text-muted ms-2" style={{ fontSize: "1.1rem" }}>
                  {formatPrice(activeMrp)}
                </span>
              )}
              {activeUnit && activeUnit !== "Standard" && (
                <span className="badge bg-success-subtle text-success border border-success-subtle ms-2 px-2 py-1" style={{ fontSize: "0.82rem", fontWeight: 600 }}>
                  {activeUnit}
                </span>
              )}
              {selectedOffer?.discount_percent > 0 && (
                <span className="badge bg-danger-subtle text-danger ms-2" style={{ fontSize: "0.78rem" }}>
                  {selectedOffer.discount_percent}% OFF
                </span>
              )}
              <span
                className="badge ms-2"
                style={{
                  backgroundColor: activeStockInfo.badgeBg,
                  color: activeStockInfo.badgeColor,
                  border: `1px solid ${activeStockInfo.badgeBorder}`,
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  padding: "4px 8px",
                  borderRadius: "8px",
                }}
              >
                {activeStockInfo.badgeLabel}
              </span>
            </div>
            {activeSku && <p className="pd-sku">SKU: {activeSku}</p>}

            {!activeStockInfo.canAddToCart && (
              <div
                className="py-2 px-3 mt-2 mb-3 d-flex align-items-center gap-2"
                style={{
                  fontSize: "0.85rem",
                  borderRadius: "10px",
                  backgroundColor: activeStockInfo.badgeBg,
                  color: activeStockInfo.badgeColor,
                  border: `1px solid ${activeStockInfo.badgeBorder}`,
                  fontWeight: 500,
                }}
              >
                <FaShieldAlt size={14} className="flex-shrink-0" />
                <span>{activeStockInfo.cartDisabledReason}</span>
              </div>
            )}

            {/* Edition / Version Selector: allows customer to pick between editions */}
            {product.variants && product.variants.length > 1 && (
              <div
                className="pd-variants-box mb-3 p-3 rounded"
                style={{
                  background: "#ffffff",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: "14px",
                  boxShadow: "0 2px 10px rgba(0,32,78,0.04)",
                }}
              >
                <div className="d-flex align-items-center justify-content-between mb-2 flex-wrap gap-1">
                  <div
                    className="fw-bold d-flex align-items-center gap-2"
                    style={{ color: NAVY, fontSize: "0.9rem" }}
                  >
                    <FaTags style={{ color: GREEN }} />
                    Available Editions / Versions ({product.variants.length})
                  </div>
                  <span className="text-muted small" style={{ fontSize: "0.76rem" }}>
                    Select version to switch
                  </span>
                </div>
                <div className="d-flex flex-wrap gap-2">
                  {product.variants.map((v) => {
                    const isSelected = Number(activeProductId) === Number(v.id);
                    const vStockInfo = getStockInfo(v);
                    const isOutOfStock = !vStockInfo.canAddToCart;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => handleSelectVariant(v)}
                        disabled={isOutOfStock}
                        className={`btn btn-sm d-inline-flex align-items-center gap-2 px-3 py-2 ${
                          isSelected
                            ? "btn-success text-white shadow-sm"
                            : "btn-outline-secondary bg-white text-dark"
                        }`}
                        style={{
                          borderRadius: "10px",
                          fontWeight: isSelected ? 700 : 500,
                          borderColor: isSelected ? GREEN : "#cbd5e1",
                          borderWidth: "1.5px",
                          opacity: isOutOfStock ? 0.55 : 1,
                          cursor: isOutOfStock ? "not-allowed" : "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <span>{v.variant_name || v.unit}</span>
                        <span
                          className={`badge ${
                            isSelected ? "bg-white text-success" : "bg-light text-dark border"
                          }`}
                          style={{ fontSize: "0.76rem", fontWeight: 700 }}
                        >
                          {formatPrice(v.sale_price ?? v.price)}
                        </span>
                        {!vStockInfo.canAddToCart ? (
                          <span
                            className="badge py-0 px-1"
                            style={{
                              backgroundColor: vStockInfo.badgeBg,
                              color: vStockInfo.badgeColor,
                              border: `1px solid ${vStockInfo.badgeBorder}`,
                              fontSize: "0.65rem",
                            }}
                          >
                            {vStockInfo.badgeLabel}
                          </span>
                        ) : isSelected ? (
                          <FaCheck size={10} className="ms-1" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <p className="pd-description">
              {product.description || DEFAULT_DESCRIPTION}
            </p>

            <div className="pd-trust-row">
              <div className="pd-trust-chip">
                <FaTruck size={12} /> Fast delivery
              </div>
              <div className="pd-trust-chip">
                <FaShieldAlt size={12} /> Quality checked
              </div>
            </div>

            {activeStoreName && (
              <div className="pd-vendor-card">
                <div className="pd-vendor-title">
                  <FaStore size={12} /> Seller information
                </div>
                <div className="pd-vendor-body">
                  <div className="pd-vendor-photo-wrap">
                    <img
                      src={activeStorePhoto || FALLBACK_IMG}
                      alt={activeStoreName}
                    />
                  </div>
                  <div className="flex-grow-1">
                    <div className="pd-vendor-name d-flex align-items-center gap-2">
                      <Link
                        to={`/store/${activeVendorId}`}
                        className="text-decoration-none fw-bold"
                        style={{ color: NAVY }}
                        title={`Visit ${activeStoreName}`}
                      >
                        {activeStoreName}
                      </Link>
                      {selectedOffer?.ranking_badge && (
                        <span className="badge bg-success-subtle text-success py-0 px-2" style={{ fontSize: "0.68rem" }}>
                          {selectedOffer.ranking_badge}
                        </span>
                      )}
                    </div>
                    {activeVendorName && (
                      <div className="pd-vendor-detail">
                        <FaUser size={11} />
                        <span>
                          <strong>Merchant:</strong> {activeVendorName}
                        </span>
                      </div>
                    )}
                    {activeStoreContact && (
                      <div className="pd-vendor-detail">
                        <FaPhone size={11} />
                        <span>
                          <strong>Contact:</strong> {activeStoreContact}
                        </span>
                      </div>
                    )}
                    {activeStoreAddress && (
                      <div className="pd-vendor-detail">
                        <FaMapMarkerAlt size={11} />
                        <span>
                          <strong>Location:</strong> {activeStoreAddress}
                        </span>
                      </div>
                    )}
                    {activeDistanceKm !== null && activeDistanceKm !== undefined && (
                      <div className="pd-vendor-detail">
                        <FaMapMarkerAlt size={11} style={{ color: GREEN }} />
                        <span>
                          <strong>Distance:</strong> {activeDistanceKm} km away
                          {product.in_delivery_radius ? (
                            <span className="badge bg-success-subtle text-success ms-2 py-0 px-1" style={{ fontSize: '0.68rem' }}>Within Delivery Range</span>
                          ) : (
                            <span className="badge bg-danger-subtle text-danger ms-2 py-0 px-1" style={{ fontSize: '0.68rem' }}>Outside Delivery Radius</span>
                          )}
                        </span>
                      </div>
                    )}
                    {activeOpeningTime && activeClosingTime && (
                      <div className="pd-vendor-detail">
                        <FaClock size={11} />
                        <span>
                          <strong>Hours:</strong>{" "}
                          {activeOpeningTime.substring(0, 5)} - {activeClosingTime.substring(0, 5)}
                        </span>
                      </div>
                    )}
                    {activeVendorId && (
                      <div className="mt-2 pt-2 border-top">
                        <Link
                          to={`/store/${activeVendorId}`}
                          className="btn btn-sm btn-outline-success d-inline-flex align-items-center gap-1 py-1 px-3"
                          style={{ fontSize: "0.82rem", fontWeight: 600 }}
                        >
                          <FaStore size={12} /> View Store & Catalogue
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Store comparison table: only displayed when more than 1 store carries the product */}
            {product.offers && product.offers.length > 1 && (
              <div
                className="pd-comparison-box mb-4 p-3 rounded"
                style={{
                  background: "#ffffff",
                  border: "1.5px solid #e2e8f0",
                  boxShadow: "0 2px 10px rgba(0,32,78,0.04)",
                }}
              >
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div
                    className="fw-bold d-flex align-items-center gap-2"
                    style={{ color: NAVY, fontSize: "0.92rem" }}
                  >
                    <FaStore style={{ color: GREEN }} />
                    Store Comparison ({product.offers.length} nearby sellers)
                  </div>
                </div>
                <p className="text-muted small mb-2" style={{ fontSize: "0.78rem" }}>
                  Select an offer below to buy from that store:
                </p>
                <div className="table-responsive rounded border" style={{ overflowX: "auto" }}>
                  <table className="table align-middle mb-0" style={{ fontSize: "0.82rem" }}>
                    <thead
                      style={{
                        background: "#f8fafc",
                        color: "#64748b",
                        fontSize: "0.74rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.03em",
                      }}
                    >
                      <tr>
                        <th className="py-2 px-3">Store</th>
                        <th className="py-2 px-3">Price</th>
                        <th className="py-2 px-3">Availability</th>
                        <th className="py-2 px-3">Fulfilment</th>
                        <th className="py-2 px-3 text-end">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {product.offers.map((offer) => {
                        const isSelected =
                          selectedOffer &&
                          Number(selectedOffer.vendor_product_id) ===
                            Number(offer.vendor_product_id);
                        const offerStockInfo = getStockInfo(offer);
                        const isUnavailable = !offer.is_available || !offerStockInfo.canAddToCart;

                        return (
                          <tr
                            key={offer.vendor_product_id}
                            style={{
                              backgroundColor: isSelected ? "#f0fdf4" : undefined,
                              borderLeft: isSelected
                                ? `4px solid ${GREEN}`
                                : "4px solid transparent",
                            }}
                          >
                            <td className="py-2 px-3">
                              <div className="d-flex align-items-center gap-2">
                                <div
                                  className="rounded"
                                  style={{
                                    width: "32px",
                                    height: "32px",
                                    background: "#f1f5f9",
                                    overflow: "hidden",
                                    flexShrink: 0,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <img
                                    src={offer.store_photo_url || FALLBACK_IMG}
                                    alt={offer.store_name}
                                    style={{
                                      width: "100%",
                                      height: "100%",
                                      objectFit: "cover",
                                    }}
                                  />
                                </div>
                                <div>
                                  <Link
                                    to={`/store/${offer.vendor_id}`}
                                    className="fw-bold d-flex align-items-center gap-1 text-decoration-none"
                                    style={{ color: NAVY, fontSize: "0.85rem" }}
                                    title={`Visit ${offer.store_name}`}
                                  >
                                    {offer.store_name}
                                    {offer.ranking_badge && (
                                      <span
                                        className="badge bg-success-subtle text-success py-0 px-1"
                                        style={{ fontSize: "0.65rem", fontWeight: 600 }}
                                      >
                                        {offer.ranking_badge}
                                      </span>
                                    )}
                                  </Link>
                                  <div
                                    className="text-muted d-flex align-items-center gap-1"
                                    style={{ fontSize: "0.72rem" }}
                                  >
                                    <FaMapMarkerAlt size={9} style={{ color: GREEN }} />
                                    <span>
                                      {offer.distance_text ||
                                        (offer.distance_km !== null
                                          ? `${offer.distance_km} km away`
                                          : "Nearby")}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-2 px-3 text-nowrap">
                              <span
                                className="fw-bold"
                                style={{ color: GREEN_DEEP, fontSize: "0.92rem" }}
                              >
                                {formatPrice(offer.sale_price ?? offer.price)}
                              </span>
                              {Number(offer.price) > Number(offer.sale_price) && (
                                <div
                                  className="text-muted text-decoration-line-through"
                                  style={{ fontSize: "0.72rem" }}
                                >
                                  {formatPrice(offer.price)}
                                </div>
                              )}
                            </td>
                            <td className="py-2 px-3 text-nowrap">
                              {!offer.is_available && offerStockInfo.canAddToCart ? (
                                <span
                                  className="badge bg-warning-subtle text-warning-emphasis fw-semibold"
                                  style={{ fontSize: "0.72rem" }}
                                >
                                  {offer.availability || "Store Closed"}
                                </span>
                              ) : (
                                <span
                                  className="badge"
                                  style={{
                                    backgroundColor: offerStockInfo.badgeBg,
                                    color: offerStockInfo.badgeColor,
                                    border: `1px solid ${offerStockInfo.badgeBorder}`,
                                    fontSize: "0.72rem",
                                    fontWeight: 600,
                                  }}
                                >
                                  {offerStockInfo.badgeLabel}
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3">
                              <div
                                className="d-flex align-items-center gap-1 text-truncate"
                                style={{
                                  fontSize: "0.75rem",
                                  color: isUnavailable ? "#94a3b8" : "#475569",
                                  maxWidth: "180px",
                                }}
                                title={offer.fulfilment_option}
                              >
                                <FaTruck
                                  size={10}
                                  style={{
                                    color: isUnavailable ? "#94a3b8" : GREEN,
                                    flexShrink: 0,
                                  }}
                                />
                                <span className="text-truncate">
                                  {offer.fulfilment_option || "Standard Delivery"}
                                </span>
                              </div>
                            </td>
                            <td className="py-2 px-3 text-end text-nowrap">
                              {isSelected ? (
                                <span
                                  className="badge bg-success d-inline-flex align-items-center gap-1 py-1 px-2"
                                  style={{
                                    fontSize: "0.75rem",
                                    fontWeight: 600,
                                    borderRadius: "6px",
                                  }}
                                >
                                  <FaCheck size={9} /> Selected
                                </span>
                              ) : isUnavailable ? (
                                <span
                                  className="text-muted small"
                                  style={{ fontSize: "0.75rem" }}
                                >
                                  {offerStockInfo.buttonLabel}
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-success py-1 px-3"
                                  style={{
                                    fontSize: "0.75rem",
                                    fontWeight: 600,
                                    borderRadius: "6px",
                                  }}
                                  onClick={() => handleSelectOffer(offer)}
                                >
                                  Select
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {!inCartItem && (
              <>
                <label className="pd-qty-label">Quantity</label>
                <div className="pd-qty-stepper">
                  <button
                    className="pd-qty-btn"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                    aria-label="Decrease quantity"
                  >
                    <FaMinus size={11} />
                  </button>
                  <div className="pd-qty-value">{quantity}</div>
                  <button
                    className="pd-qty-btn"
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= Math.min(99, activeStock > 0 ? activeStock : 1)}
                    aria-label="Increase quantity"
                  >
                    <FaPlus size={11} />
                  </button>
                </div>
              </>
            )}

            {/* Desktop / tablet actions */}
            <div className="pd-desktop-actions">
              {inCartItem ? (
                <div className="pd-incart-toggle">
                  <button
                    className="pd-incart-btn"
                    onClick={() => {
                      if (inCartItem.quantity > 1) {
                        updateQuantity(activeProductId, inCartItem.quantity - 1);
                      } else {
                        removeFromCart(activeProductId);
                      }
                    }}
                    aria-label="Decrease quantity"
                  >
                    <FaMinus size={12} />
                  </button>
                  <div className="pd-incart-value">
                    <span className="pd-incart-num">{inCartItem.quantity}</span>
                    <span className="pd-incart-sub">in cart</span>
                  </div>
                  <button
                    className="pd-incart-btn"
                    onClick={() =>
                      updateQuantity(activeProductId, inCartItem.quantity + 1)
                    }
                    disabled={
                      inCartItem.quantity >= Math.min(99, activeStock > 0 ? activeStock : 1)
                    }
                    aria-label="Increase quantity"
                  >
                    <FaPlus size={12} />
                  </button>
                </div>
              ) : (
                <button
                  className="pd-btn-cta"
                  onClick={handleAddToCart}
                  disabled={!activeIsAvailable}
                  title={!activeIsAvailable ? (isStoreClosed ? "This store is currently closed" : activeStockInfo.cartDisabledReason) : ""}
                  style={{
                    opacity: !activeIsAvailable ? 0.6 : 1,
                    cursor: !activeIsAvailable ? "not-allowed" : "pointer",
                  }}
                >
                  <FaShoppingCart size={15} />
                  {isStoreClosed ? "Store Closed" : (activeIsAvailable ? "Add to Cart" : activeStockInfo.buttonLabel)}
                </button>
              )}

              <button
                className="pd-btn-buy"
                onClick={handleBuyNow}
                disabled={!activeIsAvailable}
                title={!activeIsAvailable ? (isStoreClosed ? "This store is currently closed" : activeStockInfo.cartDisabledReason) : ""}
                style={{
                  opacity: !activeIsAvailable ? 0.6 : 1,
                  cursor: !activeIsAvailable ? "not-allowed" : "pointer",
                }}
              >
                <FaBolt size={14} />
                {isStoreClosed ? "Store Closed" : (activeIsAvailable ? "Buy Now" : activeStockInfo.buttonLabel)}
              </button>

              <button
                type="button"
                className={`pd-btn-heart-icon ${inWishlist ? "active" : ""}`}
                onClick={() => toggleWishlist(product)}
                title={inWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
                aria-label="Wishlist"
              >
                <FaHeart size={19} color={inWishlist ? "#dc2626" : "#94a3b8"} />
              </button>

              <button
                type="button"
                className="pd-btn-list-icon"
                onClick={handleOpenAddToList}
                title="Add to Shopping List"
                aria-label="Add to Shopping List"
              >
                <FaList size={17} color="#0369a1" />
              </button>
            </div>
          </div>
        </div>

        {/* More Products from this Category */}
        {product.category_id && (
          <div className="pd-related-section">
            <div className="pd-related-header">
              <h4 className="pd-related-heading">
                <span className="dot" />
                {product.category_name
                  ? `More from ${product.category_name}`
                  : "More Products"}
              </h4>
              <Link
                to={`/categories/${product.category_id}`}
                className="pd-viewall-link"
              >
                View all <FaChevronRight size={10} />
              </Link>
            </div>

            {relatedLoading ? (
              <ProductGridSkeleton count={4} colClass="col-6 col-md-4 col-lg-3" />
            ) : relatedProducts.length === 0 ? (
              <div className="pd-related-empty">
                No other products found in this category yet.
              </div>
            ) : (
              <div className="pd-related-grid">
                {relatedProducts.map((relatedProduct) => (
                  <div key={relatedProduct.id} className="pd-related-card">
                    <div className="pd-related-img-wrap">
                      <Link to={`/product/${relatedProduct.id}`}>
                        <img
                          src={relatedProduct.image_url || FALLBACK_IMG}
                          alt={relatedProduct.name}
                          loading="lazy"
                        />
                      </Link>
                    </div>
                    <div className="pd-related-body">
                      <Link
                        to={`/product/${relatedProduct.id}`}
                        className="pd-related-title"
                      >
                        {relatedProduct.name}
                      </Link>
                      <span className="pd-related-price">
                        {formatPrice(relatedProduct.price)}
                      </span>
                      <button
                        className="pd-related-btn"
                        onClick={() => addToCart(relatedProduct)}
                      >
                        <FaShoppingCart size={12} /> Add to Cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile sticky action bar */}
      <div className="pd-mobile-bar">
        <button
          type="button"
          className={`pd-mobile-wish ${inWishlist ? "active" : ""}`}
          onClick={() => toggleWishlist(product)}
          aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
        >
          <FaHeart size={18} color={inWishlist ? "#dc2626" : "#94a3b8"} />
        </button>
        <button
          type="button"
          className="pd-mobile-list"
          onClick={handleOpenAddToList}
          aria-label="Add to shopping list"
          title="Add to shopping list"
        >
          <FaList size={16} color="#0369a1" />
        </button>
        <span className="pd-mobile-price">{formatPrice(activePrice)}</span>
        {inCartItem ? (
          <div className="pd-incart-toggle" style={{ height: "42px", minWidth: "115px" }}>
            <button
              className="pd-incart-btn"
              style={{ width: "32px", height: "32px" }}
              onClick={() => {
                if (inCartItem.quantity > 1) {
                  updateQuantity(activeProductId, inCartItem.quantity - 1);
                } else {
                  removeFromCart(activeProductId);
                }
              }}
              aria-label="Decrease quantity"
            >
              <FaMinus size={10} />
            </button>
            <div className="pd-incart-value">
              <span className="pd-incart-num" style={{ fontSize: "0.95rem" }}>{inCartItem.quantity}</span>
              <span className="pd-incart-sub" style={{ fontSize: "0.58rem" }}>in cart</span>
            </div>
            <button
              className="pd-incart-btn"
              style={{ width: "32px", height: "32px" }}
              onClick={() => updateQuantity(activeProductId, inCartItem.quantity + 1)}
              disabled={inCartItem.quantity >= Math.min(99, activeStock > 0 ? activeStock : 1)}
              aria-label="Increase quantity"
            >
              <FaPlus size={10} />
            </button>
          </div>
        ) : (
          <button
            className="pd-btn-cta"
            style={{
              height: "42px",
              padding: "0 0.85rem",
              fontSize: "0.85rem",
              opacity: !activeIsAvailable ? 0.6 : 1,
              cursor: !activeIsAvailable ? "not-allowed" : "pointer",
            }}
            onClick={handleAddToCart}
            disabled={!activeIsAvailable}
            title={!activeIsAvailable ? (isStoreClosed ? "This store is currently closed" : activeStockInfo.cartDisabledReason) : ""}
          >
            <FaShoppingCart size={13} />
            {isStoreClosed ? "Closed" : (activeIsAvailable ? "Add" : activeStockInfo.buttonLabel)}
          </button>
        )}
        <button
          className="pd-btn-buy"
          style={{
            height: "42px",
            padding: "0 0.85rem",
            fontSize: "0.85rem",
            opacity: !activeIsAvailable ? 0.6 : 1,
            cursor: !activeIsAvailable ? "not-allowed" : "pointer",
          }}
          onClick={handleBuyNow}
          disabled={!activeIsAvailable}
          title={!activeIsAvailable ? (isStoreClosed ? "This store is currently closed" : activeStockInfo.cartDisabledReason) : ""}
        >
          <FaBolt size={12} />
          {isStoreClosed ? "Closed" : (activeIsAvailable ? "Buy Now" : activeStockInfo.buttonLabel)}
        </button>
      </div>
    </div>
  );
};

export default ProductDetail;
