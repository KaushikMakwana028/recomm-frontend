import React, { useState } from "react";
import { FaTimes, FaList, FaPlus, FaCheck, FaStore } from "react-icons/fa";
import { useShoppingList } from "../context/ShoppingListContext";
import { formatPrice, getImageUrl } from "../utils/helpers";

const AddToListModal = () => {
  const {
    isModalOpen,
    modalProduct,
    closeAddToListModal,
    lists,
    createList,
    addProductToList,
  } = useShoppingList();

  const [newListName, setNewListName] = useState("");
  const [creating, setCreating] = useState(false);
  const [addingListId, setAddingListId] = useState(null);
  const [addedListIds, setAddedListIds] = useState([]);

  if (!isModalOpen || !modalProduct) return null;

  const handleAddToList = async (listId) => {
    setAddingListId(listId);
    const success = await addProductToList(listId, modalProduct.id, 1);
    setAddingListId(null);
    if (success) {
      setAddedListIds((prev) => [...prev, listId]);
      setTimeout(() => {
        closeAddToListModal();
        setAddedListIds([]);
      }, 700);
    }
  };

  const handleCreateAndAdd = async (e) => {
    e.preventDefault();
    const trimmed = newListName.trim();
    if (!trimmed) return;

    setCreating(true);
    const newList = await createList(trimmed, modalProduct.id, 1);
    setCreating(false);
    if (newList) {
      setNewListName("");
      setTimeout(() => {
        closeAddToListModal();
        setAddedListIds([]);
      }, 700);
    }
  };

  return (
    <>
      <style>{`
        .atl-overlay {
          --atl-navy: #00204E;
          --atl-green: #34A129;
          --atl-green-dark: #278420;
          --atl-green-soft: #F0FDF4;
          --atl-blue-soft: #E0F2FE;
          --atl-blue: #0369A1;
          --atl-border: #E2E8F0;
          --atl-muted: #64748B;
          --atl-text: #1E293B;
          --atl-radius: 20px;

          position: fixed;
          inset: 0;
          z-index: 1060;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          background-color: rgba(0, 32, 78, 0.55);
          backdrop-filter: blur(4px);
          animation: atl-fade-in 0.15s ease-out;
        }

        .atl-card {
          width: 100%;
          max-width: 460px;
          max-height: 90vh;
          overflow-y: auto;
          background: #fff;
          border-radius: var(--atl-radius);
          box-shadow: 0 20px 50px rgba(0, 32, 78, 0.25);
          padding: clamp(1.1rem, 3vw, 1.5rem);
          animation: atl-scale-in 0.2s ease-out;
          -webkit-overflow-scrolling: touch;
        }

        .atl-card::-webkit-scrollbar {
          width: 6px;
        }
        .atl-card::-webkit-scrollbar-thumb {
          background: #d7dce4;
          border-radius: 999px;
        }

        /* ---------- header ---------- */
        .atl-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          padding-bottom: 0.9rem;
          margin-bottom: 1rem;
          border-bottom: 1px solid var(--atl-border);
        }

        .atl-header-left {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          min-width: 0;
        }

        .atl-header-icon {
          width: 38px;
          height: 38px;
          flex-shrink: 0;
          border-radius: 50%;
          background: var(--atl-blue-soft);
          color: var(--atl-blue);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .atl-header-title {
          margin: 0;
          font-weight: 700;
          color: var(--atl-navy);
          font-size: clamp(0.98rem, 2.3vw, 1.1rem);
          line-height: 1.25;
        }

        .atl-close-btn {
          flex-shrink: 0;
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 50%;
          background: #f1f5f9;
          color: var(--atl-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s ease, color 0.15s ease;
        }
        .atl-close-btn:hover {
          background: #e2e8f0;
          color: var(--atl-text);
        }

        /* ---------- product snippet ---------- */
        .atl-product {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          padding: 0.65rem;
          border-radius: 14px;
          background: #f8fafc;
          border: 1px solid var(--atl-border);
          margin-bottom: 1.1rem;
        }

        .atl-product-img {
          width: 52px;
          height: 52px;
          flex-shrink: 0;
          object-fit: cover;
          border-radius: 10px;
          background: #fff;
          border: 1px solid var(--atl-border);
        }

        .atl-product-info {
          min-width: 0;
          flex: 1;
        }

        .atl-product-name {
          font-weight: 700;
          color: var(--atl-text);
          font-size: clamp(0.85rem, 2.1vw, 0.92rem);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .atl-product-meta {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 2px;
        }

        .atl-product-price {
          font-weight: 700;
          color: var(--atl-green);
          font-size: 0.85rem;
        }

        .atl-product-store {
          color: var(--atl-muted);
          font-size: 0.76rem;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          min-width: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* ---------- section labels ---------- */
        .atl-section {
          margin-bottom: 1.1rem;
        }

        .atl-section-label {
          display: block;
          font-weight: 700;
          color: var(--atl-muted);
          text-transform: uppercase;
          font-size: 0.7rem;
          letter-spacing: 0.06em;
          margin-bottom: 0.55rem;
        }

        /* ---------- lists ---------- */
        .atl-empty {
          text-align: center;
          padding: 1.1rem 0.75rem;
          border-radius: 12px;
          border: 1px dashed var(--atl-border);
          background: #f8fafc;
          color: var(--atl-muted);
          font-size: 0.85rem;
        }

        .atl-list-scroll {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          max-height: 220px;
          overflow-y: auto;
          padding-right: 2px;
        }

        .atl-list-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          padding: 0.65rem 0.8rem;
          border-radius: 12px;
          border: 1.5px solid var(--atl-border);
          background: #fff;
          transition: border-color 0.15s ease, background 0.15s ease;
        }

        .atl-list-item.is-clickable {
          cursor: pointer;
        }
        .atl-list-item.is-clickable:hover {
          border-color: #cbd5e1;
          background: #fafbfc;
        }

        .atl-list-item.is-added {
          background: var(--atl-green-soft);
          border-color: #86efac;
        }

        .atl-list-name {
          font-weight: 600;
          color: var(--atl-text);
          font-size: 0.88rem;
        }

        .atl-list-count {
          color: var(--atl-muted);
          font-size: 0.76rem;
        }

        .atl-add-btn {
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 999px;
          font-size: 0.78rem;
          font-weight: 700;
          border: 1.5px solid var(--atl-navy);
          background: #fff;
          color: var(--atl-navy);
          transition: background 0.15s ease, color 0.15s ease, opacity 0.15s ease;
        }
        .atl-add-btn:hover:not(:disabled) {
          background: var(--atl-navy);
          color: #fff;
        }
        .atl-add-btn:disabled {
          cursor: default;
          opacity: 0.85;
        }
        .atl-add-btn.is-added {
          border-color: var(--atl-green);
          background: var(--atl-green);
          color: #fff;
        }

        /* ---------- create list ---------- */
        .atl-create-section {
          padding-top: 1rem;
          border-top: 1px solid var(--atl-border);
        }

        .atl-create-form {
          display: flex;
          gap: 0.5rem;
        }

        .atl-input {
          flex: 1;
          min-width: 0;
          font-size: 0.88rem;
          border-radius: 10px;
          border: 1.5px solid var(--atl-border);
          padding: 0.5rem 0.75rem;
        }
        .atl-input:focus {
          outline: none;
          border-color: var(--atl-green);
          box-shadow: 0 0 0 3px rgba(52, 161, 41, 0.15);
        }

        .atl-create-btn {
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 0 1rem;
          border: none;
          border-radius: 10px;
          background: var(--atl-navy);
          color: #fff;
          font-weight: 600;
          font-size: 0.82rem;
          transition: opacity 0.15s ease;
        }
        .atl-create-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @keyframes atl-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes atl-scale-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }

        /* ---------- mobile: bottom sheet ---------- */
        @media (max-width: 575.98px) {
          .atl-overlay {
            align-items: flex-end;
            padding: 0;
          }

          .atl-card {
            max-width: 100%;
            max-height: 88vh;
            width: 100%;
            border-radius: 20px 20px 0 0;
            padding: 1.1rem 1.1rem calc(1.1rem + env(safe-area-inset-bottom, 0px));
            animation: atl-slide-up 0.2s ease-out;
          }

          .atl-create-form {
            flex-direction: column;
          }

          .atl-create-btn {
            padding: 0.6rem 1rem;
          }
        }

        @keyframes atl-slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }

        @media (prefers-reduced-motion: reduce) {
          .atl-overlay, .atl-card {
            animation: none !important;
          }
        }
      `}</style>

      <div className="atl-overlay" onClick={closeAddToListModal}>
        <div className="atl-card" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="atl-header">
            <div className="atl-header-left">
              <div className="atl-header-icon">
                <FaList size={16} />
              </div>
              <h5 className="atl-header-title">Save to Shopping List</h5>
            </div>
            <button
              type="button"
              className="atl-close-btn"
              onClick={closeAddToListModal}
              aria-label="Close"
            >
              <FaTimes size={14} />
            </button>
          </div>

          {/* Selected Product Snippet */}
          <div className="atl-product">
            <img
              className="atl-product-img"
              src={getImageUrl(
                modalProduct.image || modalProduct.product_image,
              )}
              alt={modalProduct.name || modalProduct.product_name}
            />
            <div className="atl-product-info">
              <div className="atl-product-name">
                {modalProduct.name || modalProduct.product_name}
              </div>
              <div className="atl-product-meta">
                <span className="atl-product-price">
                  {formatPrice(modalProduct.sale_price ?? modalProduct.price)}
                </span>
                {(modalProduct.store_name || modalProduct.vendor_name) && (
                  <span className="atl-product-store">
                    <FaStore size={10} />
                    {modalProduct.store_name || modalProduct.vendor_name}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Existing Lists Section */}
          <div className="atl-section">
            <label className="atl-section-label">Select a List:</label>

            {lists.length === 0 ? (
              <div className="atl-empty">
                You don't have any shopping lists yet. Create your first list
                below!
              </div>
            ) : (
              <div className="atl-list-scroll">
                {lists.map((list) => {
                  const isAdded = addedListIds.includes(list.id);
                  const isAdding = addingListId === list.id;

                  return (
                    <div
                      key={list.id}
                      onClick={() =>
                        !isAdded && !isAdding && handleAddToList(list.id)
                      }
                      className={`atl-list-item${isAdded ? " is-added" : ""}${
                        !isAdded && !isAdding ? " is-clickable" : ""
                      }`}
                    >
                      <div>
                        <div className="atl-list-name">{list.name}</div>
                        <small className="atl-list-count">
                          {list.items_count || 0} item
                          {list.items_count === 1 ? "" : "s"}
                        </small>
                      </div>

                      <button
                        type="button"
                        disabled={isAdding || isAdded}
                        className={`atl-add-btn${isAdded ? " is-added" : ""}`}
                      >
                        {isAdding ? (
                          <span className="spinner-border spinner-border-sm" />
                        ) : isAdded ? (
                          <>
                            <FaCheck size={11} /> Added
                          </>
                        ) : (
                          "+ Add"
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Create New List Section */}
          <div className="atl-create-section">
            <label className="atl-section-label">Or Create a New List:</label>
            <form onSubmit={handleCreateAndAdd} className="atl-create-form">
              <input
                type="text"
                className="atl-input"
                placeholder="e.g., Weekly Groceries, Party Supplies"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                disabled={creating}
                maxLength={150}
              />
              <button
                type="submit"
                disabled={creating || !newListName.trim()}
                className="atl-create-btn"
              >
                {creating ? (
                  <span className="spinner-border spinner-border-sm" />
                ) : (
                  <>
                    <FaPlus size={11} /> Create &amp; Add
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddToListModal;
