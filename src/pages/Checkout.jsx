import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaLock, FaCheck, FaCreditCard, FaMapMarkerAlt } from 'react-icons/fa';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../utils/helpers';
import { validateShippingAddress, validatePayment } from '../utils/validation';
import API from '../services/api';

const Checkout = () => {
    const { cartItems, cartTotal, clearCart } = useCart();
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Shipping form state
    const [shippingData, setShippingData] = useState({
        fullName: user?.firstName + ' ' + user?.lastName || '',
        email: user?.email || '',
        phone: user?.phone || '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'United States',
    });

    const [shippingErrors, setShippingErrors] = useState({});

    // Payment form state
    const [paymentData, setPaymentData] = useState({
        cardName: '',
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        saveCard: false,
    });

    const [paymentErrors, setPaymentErrors] = useState({});

    // Delivery option
    const [deliveryOption, setDeliveryOption] = useState('standard');

    const deliveryOptions = [
        { id: 'standard', label: 'Standard Delivery (5-7 days)', price: 5.99 },
        { id: 'express', label: 'Express Delivery (2-3 days)', price: 12.99 },
        { id: 'next-day', label: 'Next Day Delivery', price: 19.99 },
    ];

    // Redirect if cart is empty or not authenticated
    React.useEffect(() => {
        if (cartItems.length === 0) {
            navigate('/cart');
        }
        if (!isAuthenticated) {
            navigate('/login?redirect=checkout');
        }
    }, [cartItems, isAuthenticated, navigate]);

    const selectedDelivery = deliveryOptions.find(opt => opt.id === deliveryOption);
    const shippingCost = cartTotal > 50 ? 0 : selectedDelivery?.price || 0;
    const tax = cartTotal * 0.08;
    const finalTotal = cartTotal + shippingCost + tax;

    const handleShippingChange = (e) => {
        const { name, value } = e.target;
        setShippingData(prev => ({ ...prev, [name]: value }));
        // Clear error for this field
        if (shippingErrors[name]) {
            setShippingErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handlePaymentChange = (e) => {
        const { name, value, type, checked } = e.target;
        setPaymentData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
        if (paymentErrors[name]) {
            setPaymentErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleShippingSubmit = (e) => {
        e.preventDefault();
        const errors = validateShippingAddress(shippingData);

        if (Object.keys(errors).length === 0) {
            setCurrentStep(2);
            window.scrollTo(0, 0);
        } else {
            setShippingErrors(errors);
        }
    };

    const handlePaymentSubmit = async (e) => {
        e.preventDefault();
        const errors = validatePayment(paymentData);

        if (Object.keys(errors).length === 0) {
            setCurrentStep(3);
            window.scrollTo(0, 0);
        } else {
            setPaymentErrors(errors);
        }
    };

    const handlePlaceOrder = async () => {
        setLoading(true);

        const orderData = {
            userId: user.id,
            items: cartItems,
            shipping: shippingData,
            payment: {
                method: 'credit-card',
                last4: paymentData.cardNumber.slice(-4),
            },
            delivery: deliveryOption,
            pricing: {
                subtotal: cartTotal,
                shipping: shippingCost,
                tax: tax,
                total: finalTotal,
            },
        };

        try {
            const response = await API.submitOrder(orderData);

            if (response.success) {
                clearCart();
                navigate('/order-confirmation', { state: { order: response.data } });
            }
        } catch (error) {
            console.error('Order failed:', error);
        } finally {
            setLoading(false);
        }
    };

    if (cartItems.length === 0 || !isAuthenticated) {
        return null;
    }

    return (
        <div className="checkout-page bg-light py-4">
            <div className="container">
                {/* Page Header */}
                <div className="row mb-4">
                    <div className="col-12">
                        <h2 className="text-brand-blue fw-bold mb-2">
                            <FaLock className="me-2" />
                            Secure Checkout
                        </h2>
                        <nav aria-label="breadcrumb">
                            <ol className="breadcrumb">
                                <li className="breadcrumb-item">
                                    <Link to="/">Home</Link>
                                </li>
                                <li className="breadcrumb-item">
                                    <Link to="/cart">Cart</Link>
                                </li>
                                <li className="breadcrumb-item active" aria-current="page">
                                    Checkout
                                </li>
                            </ol>
                        </nav>
                    </div>
                </div>

                {/* Progress Steps */}
                <div className="card border-0 shadow-sm mb-4">
                    <div className="card-body">
                        <div className="row text-center">
                            <div className="col-md-4">
                                <div className={`d-flex align-items-center justify-content-center ${currentStep >= 1 ? 'text-brand-green' : 'text-muted'}`}>
                                    <div
                                        className={`rounded-circle d-flex align-items-center justify-content-center me-2 ${currentStep >= 1 ? 'bg-brand-green text-white' : 'bg-light'
                                            }`}
                                        style={{ width: '40px', height: '40px' }}
                                    >
                                        {currentStep > 1 ? <FaCheck /> : '1'}
                                    </div>
                                    <span className="fw-bold d-none d-md-inline">Shipping</span>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className={`d-flex align-items-center justify-content-center ${currentStep >= 2 ? 'text-brand-green' : 'text-muted'}`}>
                                    <div
                                        className={`rounded-circle d-flex align-items-center justify-content-center me-2 ${currentStep >= 2 ? 'bg-brand-green text-white' : 'bg-light'
                                            }`}
                                        style={{ width: '40px', height: '40px' }}
                                    >
                                        {currentStep > 2 ? <FaCheck /> : '2'}
                                    </div>
                                    <span className="fw-bold d-none d-md-inline">Payment</span>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className={`d-flex align-items-center justify-content-center ${currentStep >= 3 ? 'text-brand-green' : 'text-muted'}`}>
                                    <div
                                        className={`rounded-circle d-flex align-items-center justify-content-center me-2 ${currentStep >= 3 ? 'bg-brand-green text-white' : 'bg-light'
                                            }`}
                                        style={{ width: '40px', height: '40px' }}
                                    >
                                        3
                                    </div>
                                    <span className="fw-bold d-none d-md-inline">Review</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row g-4">
                    {/* Main Content */}
                    <div className="col-lg-8">
                        {/* Step 1: Shipping Information */}
                        {currentStep === 1 && (
                            <div className="card border-0 shadow-sm">
                                <div className="card-header bg-brand-blue text-white">
                                    <h5 className="mb-0">
                                        <FaMapMarkerAlt className="me-2" />
                                        Shipping Information
                                    </h5>
                                </div>
                                <div className="card-body">
                                    <form onSubmit={handleShippingSubmit}>
                                        <div className="row g-3">
                                            <div className="col-md-6">
                                                <label className="form-label">Full Name *</label>
                                                <input
                                                    type="text"
                                                    className={`form-control ${shippingErrors.fullName ? 'is-invalid' : ''}`}
                                                    name="fullName"
                                                    value={shippingData.fullName}
                                                    onChange={handleShippingChange}
                                                />
                                                {shippingErrors.fullName && (
                                                    <div className="invalid-feedback">{shippingErrors.fullName}</div>
                                                )}
                                            </div>

                                            <div className="col-md-6">
                                                <label className="form-label">Email *</label>
                                                <input
                                                    type="email"
                                                    className={`form-control ${shippingErrors.email ? 'is-invalid' : ''}`}
                                                    name="email"
                                                    value={shippingData.email}
                                                    onChange={handleShippingChange}
                                                />
                                                {shippingErrors.email && (
                                                    <div className="invalid-feedback">{shippingErrors.email}</div>
                                                )}
                                            </div>

                                            <div className="col-md-6">
                                                <label className="form-label">Phone *</label>
                                                <input
                                                    type="tel"
                                                    className={`form-control ${shippingErrors.phone ? 'is-invalid' : ''}`}
                                                    name="phone"
                                                    value={shippingData.phone}
                                                    onChange={handleShippingChange}
                                                />
                                                {shippingErrors.phone && (
                                                    <div className="invalid-feedback">{shippingErrors.phone}</div>
                                                )}
                                            </div>

                                            <div className="col-md-6">
                                                <label className="form-label">Country *</label>
                                                <select
                                                    className="form-select"
                                                    name="country"
                                                    value={shippingData.country}
                                                    onChange={handleShippingChange}
                                                >
                                                    <option>United States</option>
                                                    <option>Canada</option>
                                                    <option>Mexico</option>
                                                </select>
                                            </div>

                                            <div className="col-12">
                                                <label className="form-label">Address Line 1 *</label>
                                                <input
                                                    type="text"
                                                    className={`form-control ${shippingErrors.addressLine1 ? 'is-invalid' : ''}`}
                                                    name="addressLine1"
                                                    value={shippingData.addressLine1}
                                                    onChange={handleShippingChange}
                                                    placeholder="Street address"
                                                />
                                                {shippingErrors.addressLine1 && (
                                                    <div className="invalid-feedback">{shippingErrors.addressLine1}</div>
                                                )}
                                            </div>

                                            <div className="col-12">
                                                <label className="form-label">Address Line 2</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    name="addressLine2"
                                                    value={shippingData.addressLine2}
                                                    onChange={handleShippingChange}
                                                    placeholder="Apartment, suite, etc. (optional)"
                                                />
                                            </div>

                                            <div className="col-md-4">
                                                <label className="form-label">City *</label>
                                                <input
                                                    type="text"
                                                    className={`form-control ${shippingErrors.city ? 'is-invalid' : ''}`}
                                                    name="city"
                                                    value={shippingData.city}
                                                    onChange={handleShippingChange}
                                                />
                                                {shippingErrors.city && (
                                                    <div className="invalid-feedback">{shippingErrors.city}</div>
                                                )}
                                            </div>

                                            <div className="col-md-4">
                                                <label className="form-label">State *</label>
                                                <input
                                                    type="text"
                                                    className={`form-control ${shippingErrors.state ? 'is-invalid' : ''}`}
                                                    name="state"
                                                    value={shippingData.state}
                                                    onChange={handleShippingChange}
                                                />
                                                {shippingErrors.state && (
                                                    <div className="invalid-feedback">{shippingErrors.state}</div>
                                                )}
                                            </div>

                                            <div className="col-md-4">
                                                <label className="form-label">ZIP Code *</label>
                                                <input
                                                    type="text"
                                                    className={`form-control ${shippingErrors.zipCode ? 'is-invalid' : ''}`}
                                                    name="zipCode"
                                                    value={shippingData.zipCode}
                                                    onChange={handleShippingChange}
                                                />
                                                {shippingErrors.zipCode && (
                                                    <div className="invalid-feedback">{shippingErrors.zipCode}</div>
                                                )}
                                            </div>

                                            <div className="col-12">
                                                <h6 className="text-brand-blue mb-3">Delivery Options</h6>
                                                {deliveryOptions.map((option) => (
                                                    <div key={option.id} className="form-check mb-2">
                                                        <input
                                                            className="form-check-input"
                                                            type="radio"
                                                            name="deliveryOption"
                                                            id={option.id}
                                                            value={option.id}
                                                            checked={deliveryOption === option.id}
                                                            onChange={(e) => setDeliveryOption(e.target.value)}
                                                        />
                                                        <label className="form-check-label w-100" htmlFor={option.id}>
                                                            <div className="d-flex justify-content-between">
                                                                <span>{option.label}</span>
                                                                <span className="text-brand-green fw-bold">
                                                                    {cartTotal > 50 && option.id === 'standard' ? 'FREE' : formatPrice(option.price)}
                                                                </span>
                                                            </div>
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="d-flex justify-content-between mt-4">
                                            <Link to="/cart" className="btn btn-outline-secondary">
                                                Back to Cart
                                            </Link>
                                            <button type="submit" className="btn btn-success">
                                                Continue to Payment
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Payment Information */}
                        {currentStep === 2 && (
                            <div className="card border-0 shadow-sm">
                                <div className="card-header bg-brand-blue text-white">
                                    <h5 className="mb-0">
                                        <FaCreditCard className="me-2" />
                                        Payment Information
                                    </h5>
                                </div>
                                <div className="card-body">
                                    <form onSubmit={handlePaymentSubmit}>
                                        <div className="row g-3">
                                            <div className="col-12">
                                                <label className="form-label">Cardholder Name *</label>
                                                <input
                                                    type="text"
                                                    className={`form-control ${paymentErrors.cardName ? 'is-invalid' : ''}`}
                                                    name="cardName"
                                                    value={paymentData.cardName}
                                                    onChange={handlePaymentChange}
                                                    placeholder="Name on card"
                                                />
                                                {paymentErrors.cardName && (
                                                    <div className="invalid-feedback">{paymentErrors.cardName}</div>
                                                )}
                                            </div>

                                            <div className="col-12">
                                                <label className="form-label">Card Number *</label>
                                                <input
                                                    type="text"
                                                    className={`form-control ${paymentErrors.cardNumber ? 'is-invalid' : ''}`}
                                                    name="cardNumber"
                                                    value={paymentData.cardNumber}
                                                    onChange={handlePaymentChange}
                                                    placeholder="1234 5678 9012 3456"
                                                    maxLength="16"
                                                />
                                                {paymentErrors.cardNumber && (
                                                    <div className="invalid-feedback">{paymentErrors.cardNumber}</div>
                                                )}
                                            </div>

                                            <div className="col-md-6">
                                                <label className="form-label">Expiry Date *</label>
                                                <input
                                                    type="text"
                                                    className={`form-control ${paymentErrors.expiryDate ? 'is-invalid' : ''}`}
                                                    name="expiryDate"
                                                    value={paymentData.expiryDate}
                                                    onChange={handlePaymentChange}
                                                    placeholder="MM/YY"
                                                    maxLength="5"
                                                />
                                                {paymentErrors.expiryDate && (
                                                    <div className="invalid-feedback">{paymentErrors.expiryDate}</div>
                                                )}
                                            </div>

                                            <div className="col-md-6">
                                                <label className="form-label">CVV *</label>
                                                <input
                                                    type="text"
                                                    className={`form-control ${paymentErrors.cvv ? 'is-invalid' : ''}`}
                                                    name="cvv"
                                                    value={paymentData.cvv}
                                                    onChange={handlePaymentChange}
                                                    placeholder="123"
                                                    maxLength="4"
                                                />
                                                {paymentErrors.cvv && (
                                                    <div className="invalid-feedback">{paymentErrors.cvv}</div>
                                                )}
                                            </div>

                                            <div className="col-12">
                                                <div className="form-check">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        name="saveCard"
                                                        id="saveCard"
                                                        checked={paymentData.saveCard}
                                                        onChange={handlePaymentChange}
                                                    />
                                                    <label className="form-check-label" htmlFor="saveCard">
                                                        Save card for future purchases
                                                    </label>
                                                </div>
                                            </div>

                                            <div className="col-12">
                                                <div className="alert alert-info">
                                                    <FaLock className="me-2" />
                                                    Your payment information is secure and encrypted
                                                </div>
                                            </div>
                                        </div>

                                        <div className="d-flex justify-content-between mt-4">
                                            <button
                                                type="button"
                                                className="btn btn-outline-secondary"
                                                onClick={() => setCurrentStep(1)}
                                            >
                                                Back
                                            </button>
                                            <button type="submit" className="btn btn-success">
                                                Review Order
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Review Order */}
                        {currentStep === 3 && (
                            <div>
                                {/* Shipping Details */}
                                <div className="card border-0 shadow-sm mb-3">
                                    <div className="card-header bg-white d-flex justify-content-between align-items-center">
                                        <h6 className="text-brand-blue mb-0">Shipping Address</h6>
                                        <button className="btn btn-sm btn-link" onClick={() => setCurrentStep(1)}>
                                            Edit
                                        </button>
                                    </div>
                                    <div className="card-body">
                                        <p className="mb-1"><strong>{shippingData.fullName}</strong></p>
                                        <p className="mb-1">{shippingData.addressLine1}</p>
                                        {shippingData.addressLine2 && <p className="mb-1">{shippingData.addressLine2}</p>}
                                        <p className="mb-1">
                                            {shippingData.city}, {shippingData.state} {shippingData.zipCode}
                                        </p>
                                        <p className="mb-1">{shippingData.country}</p>
                                        <p className="mb-0">Phone: {shippingData.phone}</p>
                                    </div>
                                </div>

                                {/* Payment Details */}
                                <div className="card border-0 shadow-sm mb-3">
                                    <div className="card-header bg-white d-flex justify-content-between align-items-center">
                                        <h6 className="text-brand-blue mb-0">Payment Method</h6>
                                        <button className="btn btn-sm btn-link" onClick={() => setCurrentStep(2)}>
                                            Edit
                                        </button>
                                    </div>
                                    <div className="card-body">
                                        <p className="mb-1">
                                            <FaCreditCard className="me-2" />
                                            Card ending in ****{paymentData.cardNumber.slice(-4)}
                                        </p>
                                        <p className="mb-0">Cardholder: {paymentData.cardName}</p>
                                    </div>
                                </div>

                                {/* Order Items */}
                                <div className="card border-0 shadow-sm">
                                    <div className="card-header bg-white">
                                        <h6 className="text-brand-blue mb-0">Order Items ({cartItems.length})</h6>
                                    </div>
                                    <div className="card-body">
                                        {cartItems.map((item) => (
                                            <div key={item.id} className="d-flex align-items-center mb-3 pb-3 border-bottom">
                                                <img
                                                    src={item.image}
                                                    alt={item.name}
                                                    className="rounded me-3"
                                                    style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                                                />
                                                <div className="flex-grow-1">
                                                    <h6 className="mb-1 text-brand-blue">{item.name}</h6>
                                                    <small className="text-muted">Qty: {item.quantity}</small>
                                                </div>
                                                <div className="text-end">
                                                    <p className="mb-0 text-brand-green fw-bold">
                                                        {formatPrice(item.price * item.quantity)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="d-flex justify-content-between mt-4">
                                    <button
                                        className="btn btn-outline-secondary"
                                        onClick={() => setCurrentStep(2)}
                                    >
                                        Back
                                    </button>
                                    <button
                                        className="btn btn-success btn-lg px-5"
                                        onClick={handlePlaceOrder}
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" />
                                                Processing...
                                            </>
                                        ) : (
                                            'Place Order'
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Order Summary Sidebar */}
                    <div className="col-lg-4">
                        <div className="card border-0 shadow-sm sticky-top" style={{ top: '100px' }}>
                            <div className="card-header bg-brand-blue text-white">
                                <h5 className="mb-0">Order Summary</h5>
                            </div>
                            <div className="card-body">
                                <div className="d-flex justify-content-between mb-2">
                                    <span>Subtotal:</span>
                                    <span className="fw-bold">{formatPrice(cartTotal)}</span>
                                </div>
                                <div className="d-flex justify-content-between mb-2">
                                    <span>Shipping:</span>
                                    <span className="fw-bold">
                                        {shippingCost === 0 ? (
                                            <span className="text-success">FREE</span>
                                        ) : (
                                            formatPrice(shippingCost)
                                        )}
                                    </span>
                                </div>
                                <div className="d-flex justify-content-between mb-3">
                                    <span>Tax:</span>
                                    <span className="fw-bold">{formatPrice(tax)}</span>
                                </div>
                                <hr />
                                <div className="d-flex justify-content-between">
                                    <h5 className="mb-0">Total:</h5>
                                    <h5 className="text-brand-green fw-bold mb-0">{formatPrice(finalTotal)}</h5>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;