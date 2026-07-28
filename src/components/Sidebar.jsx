import React from 'react';
import { Link } from 'react-router-dom';
import {
    FaTimes,
    FaTrash,
    FaMinus,
    FaPlus,
    FaShoppingCart,
} from 'react-icons/fa';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../utils/helpers';

const Sidebar = () => {
    const {
        cartItems,
        cartTotal,
        isCartOpen,
        toggleCart,
        removeFromCart,
        updateQuantity,
    } = useCart();

    return (
        <>
            {/* Overlay */}
            {isCartOpen && (
                <div
                    className="offcanvas-backdrop fade show"
                    onClick={toggleCart}
                    style={{ zIndex: 1040 }}
                ></div>
            )}

            {/* Cart Sidebar */}
            <div
                className={`offcanvas offcanvas-end ${isCartOpen ? 'show' : ''}`}
                tabIndex="-1"
                style={{
                    visibility: isCartOpen ? 'visible' : 'hidden',
                    zIndex: 1045,
                }}
                aria-labelledby="cartSidebarLabel"
            >
                {/* Header */}
                <div className="offcanvas-header bg-brand-blue text-white">
                    <h5 className="offcanvas-title" id="cartSidebarLabel">
                        <FaShoppingCart className="me-2" />
                        Shopping Cart ({cartItems.length})
                    </h5>
                    <button
                        type="button"
                        className="btn-close btn-close-white"
                        onClick={toggleCart}
                        aria-label="Close cart"
                    ></button>
                </div>

                {/* Body */}
                <div className="offcanvas-body p-0 d-flex flex-column">
                    {cartItems.length === 0 ? (
                        /* Empty Cart State */
                        <div className="flex-grow-1 d-flex flex-column justify-content-center align-items-center p-4 text-center">
                            <FaShoppingCart
                                size={64}
                                className="text-muted mb-3"
                                aria-hidden="true"
                            />
                            <h6 className="text-muted mb-2">Your cart is empty</h6>
                            <p className="text-muted small mb-4">
                                Add some delicious items to get started!
                            </p>
                            <Link
                                to="/products"
                                className="btn btn-success px-4"
                                onClick={toggleCart}
                            >
                                Browse Products
                            </Link>
                        </div>
                    ) : (
                        <>
                            {/* Cart Items List */}
                            <div className="flex-grow-1 overflow-auto p-3">
                                {cartItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className="card mb-3 border-0 shadow-sm"
                                    >
                                        <div className="card-body p-2">
                                            <div className="row g-2 align-items-center">
                                                {/* Product Image */}
                                                <div className="col-4">
                                                    <img
                                                        src={item.image}
                                                        alt={item.name}
                                                        className="img-fluid rounded"
                                                        style={{
                                                            height: '80px',
                                                            objectFit: 'cover',
                                                            width: '100%',
                                                        }}
                                                    />
                                                </div>

                                                {/* Product Info */}
                                                <div className="col-8">
                                                    <h6
                                                        className="mb-1 text-brand-blue"
                                                        style={{ fontSize: '0.85rem' }}
                                                    >
                                                        {item.name}
                                                    </h6>
                                                    <p className="mb-2 text-brand-green fw-bold small">
                                                        {formatPrice(item.price)}
                                                    </p>

                                                    {/* Quantity + Remove */}
                                                    <div className="d-flex align-items-center justify-content-between">
                                                        <div
                                                            className="btn-group btn-group-sm"
                                                            role="group"
                                                            aria-label="Quantity controls"
                                                        >
                                                            <button
                                                                className="btn btn-outline-secondary"
                                                                onClick={() =>
                                                                    updateQuantity(item.id, item.quantity - 1)
                                                                }
                                                                aria-label="Decrease quantity"
                                                                disabled={item.quantity <= 1}
                                                            >
                                                                <FaMinus size={10} />
                                                            </button>
                                                            <button
                                                                className="btn btn-outline-secondary"
                                                                disabled
                                                                aria-label={`Quantity: ${item.quantity}`}
                                                            >
                                                                {item.quantity}
                                                            </button>
                                                            <button
                                                                className="btn btn-outline-secondary"
                                                                onClick={() =>
                                                                    updateQuantity(item.id, item.quantity + 1)
                                                                }
                                                                aria-label="Increase quantity"
                                                            >
                                                                <FaPlus size={10} />
                                                            </button>
                                                        </div>

                                                        <button
                                                            className="btn btn-sm btn-link text-danger p-0"
                                                            onClick={() => removeFromCart(item.id)}
                                                            aria-label={`Remove ${item.name} from cart`}
                                                        >
                                                            <FaTrash size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Cart Footer */}
                            <div className="border-top p-3 bg-light">
                                <div className="d-flex justify-content-between mb-3">
                                    <h6 className="text-brand-blue mb-0">Subtotal:</h6>
                                    <h6 className="text-brand-green fw-bold mb-0">
                                        {formatPrice(cartTotal)}
                                    </h6>
                                </div>

                                <Link
                                    to="/cart"
                                    className="btn btn-outline-primary w-100 mb-2"
                                    onClick={toggleCart}
                                >
                                    View Cart
                                </Link>

                                <Link
                                    to="/checkout"
                                    className="btn btn-success w-100"
                                    onClick={toggleCart}
                                >
                                    Checkout
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export default Sidebar;