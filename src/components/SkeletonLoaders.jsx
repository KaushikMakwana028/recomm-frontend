import React from "react";
import "./SkeletonLoaders.css";

/**
 * Single Product Card Skeleton
 */
export const ProductCardSkeleton = () => (
  <div className="sk-prod-card">
    <div className="sk-prod-img rc-shimmer" />
    <div className="sk-prod-body">
      <div className="sk-prod-tag rc-shimmer" />
      <div className="sk-prod-title-1 rc-shimmer" />
      <div className="sk-prod-title-2 rc-shimmer" />
      <div className="sk-prod-footer">
        <div className="sk-prod-price rc-shimmer" />
        <div className="sk-prod-btn rc-shimmer" />
      </div>
    </div>
  </div>
);

/**
 * Grid of Product Card Skeletons
 */
export const ProductGridSkeleton = ({ count = 8, colClass = "col-6 col-md-4 col-lg-3" }) => (
  <div className="row g-3 g-md-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className={colClass}>
        <ProductCardSkeleton />
      </div>
    ))}
  </div>
);

/**
 * Single Category Tile Skeleton
 */
export const CategoryTileSkeleton = () => (
  <div className="sk-cat-tile rc-shimmer">
    <div className="sk-cat-label-pill rc-shimmer" />
  </div>
);

/**
 * Grid of Category Tile Skeletons
 */
export const CategoryGridSkeleton = ({ count = 8, colClass = "col-6 col-md-4 col-lg-3" }) => (
  <div className="row g-3 g-md-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className={colClass}>
        <CategoryTileSkeleton />
      </div>
    ))}
  </div>
);

/**
 * Full Product Detail Page Skeleton
 */
export const ProductDetailSkeleton = () => (
  <div className="sk-pd-wrap">
    {/* Breadcrumb Skeleton */}
    <div className="sk-pd-crumb rc-shimmer" />

    <div className="sk-pd-grid">
      {/* Gallery Skeleton */}
      <div className="sk-pd-gallery-card">
        <div className="sk-pd-main-img rc-shimmer" />
        <div className="sk-pd-thumb-row">
          <div className="sk-pd-thumb rc-shimmer" />
          <div className="sk-pd-thumb rc-shimmer" />
          <div className="sk-pd-thumb rc-shimmer" />
          <div className="sk-pd-thumb rc-shimmer" />
        </div>
      </div>

      {/* Info Card Skeleton */}
      <div className="sk-pd-info-card">
        <div className="sk-pd-badge rc-shimmer" />
        <div className="sk-pd-name-1 rc-shimmer" />
        <div className="sk-pd-name-2 rc-shimmer" />
        <div className="sk-pd-price-line rc-shimmer" />
        <div className="sk-pd-desc-box rc-shimmer" />
        <div className="sk-pd-vendor-box rc-shimmer" />
        <div className="sk-pd-actions-row">
          <div className="sk-pd-btn-lg rc-shimmer" />
          <div className="sk-pd-btn-lg rc-shimmer" />
          <div className="sk-pd-btn-icon rc-shimmer" />
        </div>
      </div>
    </div>

    {/* Related Products Skeleton */}
    <div className="mt-5">
      <div
        className="rc-shimmer mb-4"
        style={{ height: "24px", width: "220px", borderRadius: "6px" }}
      />
      <ProductGridSkeleton count={4} colClass="col-6 col-md-3" />
    </div>
  </div>
);

/**
 * Order Card Skeleton (Profile > My Orders)
 */
export const OrderCardSkeleton = () => (
  <div className="sk-order-card">
    <div className="sk-order-top">
      <div className="d-flex align-items-center gap-2">
        <div className="rc-shimmer" style={{ width: "90px", height: "18px", borderRadius: "4px" }} />
        <div className="rc-shimmer" style={{ width: "80px", height: "14px", borderRadius: "4px" }} />
      </div>
      <div className="rc-shimmer" style={{ width: "100px", height: "24px", borderRadius: "999px" }} />
    </div>

    <div className="sk-order-mid">
      <div className="d-flex align-items-center gap-3">
        <div className="sk-order-thumb rc-shimmer" />
        <div>
          <div className="rc-shimmer mb-2" style={{ width: "160px", height: "16px", borderRadius: "4px" }} />
          <div className="rc-shimmer" style={{ width: "120px", height: "12px", borderRadius: "4px" }} />
        </div>
      </div>
      <div className="text-end">
        <div className="rc-shimmer mb-1" style={{ width: "60px", height: "10px", borderRadius: "4px", marginLeft: "auto" }} />
        <div className="rc-shimmer" style={{ width: "80px", height: "22px", borderRadius: "4px", marginLeft: "auto" }} />
      </div>
    </div>

    <div className="sk-order-bottom">
      <div className="rc-shimmer" style={{ width: "70px", height: "28px", borderRadius: "6px" }} />
      <div className="d-flex gap-2">
        <div className="rc-shimmer" style={{ width: "65px", height: "28px", borderRadius: "6px" }} />
        <div className="rc-shimmer" style={{ width: "65px", height: "28px", borderRadius: "6px" }} />
      </div>
    </div>
  </div>
);

/**
 * Address Card Skeleton (Profile > Addresses)
 */
export const AddressCardSkeleton = () => (
  <div className="sk-address-card">
    <div className="rc-shimmer" style={{ width: "130px", height: "18px", borderRadius: "4px" }} />
    <div className="rc-shimmer" style={{ width: "100px", height: "14px", borderRadius: "4px" }} />
    <div className="rc-shimmer" style={{ width: "90%", height: "14px", borderRadius: "4px" }} />
    <div className="rc-shimmer" style={{ width: "70%", height: "14px", borderRadius: "4px" }} />
    <div className="d-flex gap-2 mt-2">
      <div className="rc-shimmer" style={{ width: "70px", height: "30px", borderRadius: "6px" }} />
      <div className="rc-shimmer" style={{ width: "70px", height: "30px", borderRadius: "6px" }} />
    </div>
  </div>
);

/**
 * Profile Form Skeleton (Profile > My Profile)
 */
export const ProfileFormSkeleton = () => (
  <div className="sk-profile-wrap">
    <div className="sk-profile-avatar rc-shimmer" />
    <div className="sk-profile-fields">
      {[1, 2, 3, 4].map((n) => (
        <div key={n} className="p-3 bg-white rounded-3 border">
          <div className="rc-shimmer mb-2" style={{ width: "60px", height: "12px", borderRadius: "4px" }} />
          <div className="rc-shimmer" style={{ width: "100%", height: "20px", borderRadius: "4px" }} />
        </div>
      ))}
    </div>
  </div>
);
