import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    FaCheckCircle,
    FaTruck,
    FaBox,
    FaEnvelope,
    FaHome,
    FaShoppingBag,
    FaPrint,
} from 'react-icons/fa';
import { formatPrice, formatDate } from '../utils/helpers';

const OrderConfirmation = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const order = location.state?.order;

    useEffect(() => {
        if (!order) {
            navigate('/');
        }
        window.scrollTo(0, 0);
    }, [order, navigate]);

    if (!order) return null;

    return (
        <div className="order-confirmation-page bg-light py-5">
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-lg-8">
                        {/* Success Header Card */}
                        <div className="card border-0 shadow-sm mb-4 text-center fade-in">
                            <div className="card-body py-5">
                                <div
                                    className="rounded-circle bg-brand-green d-inline-flex align-items-center justify-content-center mb-4"
                                    style={{ width: '100px', height: '100px' }}
                                >
                                    <FaCheckCircle size={60} className="text-white" />
                                </div>

                                <h1 className="text-brand-blue fw-bold mb-2">Order Confirmed!</h1>
                                <p className="text-muted fs-5 mb-3">
                                    Thank you for your purchase. Your order has been received.
                                </p>

                                <div className="badge bg-brand-green fs-6 px-4 py-2 mb-3">
                                    Order #{order.id}
                                </div>

                                <div className="alert alert-info mt-3 mx-auto" style={{ maxWidth: '400px' }}>
                                    <FaEnvelope className="me-2" />
                                    A confirmation email has been sent to{' '}
                                    <strong>{order.shipping?.email}</strong>
                                </div>
                            </div>
                        </div>

                        {/* Order Status Timeline */}
                        <div className="card border-0 shadow-sm mb-4">
                            <div className="card-header bg-brand-blue text-white">
                                <h5 className="mb-0">Order Status</h5>
                            </div>
                            <div className="card-body py-4">
                                <div className="row text-center">
                                    <div className="col-3">
                                        <div
                                            className="rounded-circle bg-brand-green d-inline-flex align-items-center justify-content-center mb-2"
                                            style={{ width: '50px', height: '50px' }}
                                        >
                                            <FaCheckCircle className="text-white" size={20} />
                                        </div>
                                        <p className="mb-0 small fw-bold text-brand-green">Order Placed</p>
                                        <small className="text-muted">{formatDate(order.createdAt)}</small>
                                    </div>

                                    <div className="col-3">
                                        <div
                                            className="rounded-circle bg-light border d-inline-flex align-items-center justify-content-center mb-2"
                                            style={{ width: '50px', height: '50px' }}
                                        >
                                            <FaBox className="text-muted" size={20} />
                                        </div>
                                        <p className="mb-0 small fw-bold text-muted">Processing</p>
                                        <small className="text-muted">Pending</small>
                                    </div>

                                    <div className="col-3">
                                        <div
                                            className="rounded-circle bg-light border d-inline-flex align-items-center justify-content-center mb-2"
                                            style={{ width: '50px', height: '50px' }}
                                        >
                                            <FaTruck className="text-muted" size={20} />
                                        </div>
                                        <p className="mb-0 small fw-bold text-muted">Shipped</p>
                                        <small className="text-muted">Pending</small>
                                    </div>

                                    <div className="col-3">
                                        <div
                                            className="rounded-circle bg-light border d-inline-flex align-items-center justify-content-center mb-2"
                                            style={{ width: '50px', height: '50px' }}
                                        >
                                            <FaHome className="text-muted" size={20} />
                                        </div>
                                        <p className="mb-0 small fw-bold text-muted">Delivered</p>
                                        <small className="text-muted">Pending</small>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="progress mt-3" style={{ height: '4px' }}>
                                    <div
                                        className="progress-bar bg-brand-green"
                                        role="progressbar"
                                        style={{ width: '12%' }}
                                        aria-valuenow="12"
                                        aria-valuemin="0"
                                        aria-valuemax="100"
                                    ></div>
                                </div>
                            </div>
                        </div>

                        {/* Order Details */}
                        <div className="card border-0 shadow-sm mb-4">
                            <div className="card-header bg-white">
                                <h5 className="text-brand-blue mb-0">Order Details</h5>
                            </div>
                            <div className="card-body">
                                <div className="row g-4">
                                    {/* Shipping Info */}
                                    <div className="col-md-6">
                                        <h6 className="text-brand-green mb-3">Shipping Address</h6>
                                        <div className="bg-light rounded p-3">
                                            <p className="mb-1 fw-bold">{order.shipping?.fullName}</p>
                                            <p className="mb-1">{order.shipping?.addressLine1}</p>
                                            {order.shipping?.addressLine2 && (
                                                <p className="mb-1">{order.shipping.addressLine2}</p>
                                            )}
                                            <p className="mb-1">
                                                {order.shipping?.city}, {order.shipping?.state}{' '}
                                                {order.shipping?.zipCode}
                                            </p>
                                            <p className="mb-1">{order.shipping?.country}</p>
                                            <p className="mb-0 text-muted">📞 {order.shipping?.phone}</p>
                                        </div>
                                    </div>

                                    {/* Payment & Delivery Info */}
                                    <div className="col-md-6">
                                        <h6 className="text-brand-green mb-3">Payment & Delivery</h6>
                                        <div className="bg-light rounded p-3">
                                            <p className="mb-2">
                                                <strong>Payment:</strong>{' '}
                                                Card ending in ****{order.payment?.last4}
                                            </p>
                                            <p className="mb-2">
                                                <strong>Delivery:</strong>{' '}
                                                {order.delivery === 'standard'
                                                    ? 'Standard (5-7 days)'
                                                    : order.delivery === 'express'
                                                        ? 'Express (2-3 days)'
                                                        : 'Next Day'}
                                            </p>
                                            <p className="mb-2">
                                                <strong>Status:</strong>{' '}
                                                <span className="badge bg-brand-green">{order.status}</span>
                                            </p>
                                            <p className="mb-0">
                                                <strong>Date:</strong> {formatDate(order.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Order Items */}
                        <div className="card border-0 shadow-sm mb-4">
                            <div className="card-header bg-white">
                                <h5 className="text-brand-blue mb-0">
                                    Items Ordered ({order.items?.length})
                                </h5>
                            </div>
                            <div className="card-body p-0">
                                <div className="table-responsive">
                                    <table className="table mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Product</th>
                                                <th className="text-center">Qty</th>
                                                <th className="text-end">Price</th>
                                                <th className="text-end">Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {order.items?.map((item) => (
                                                <tr key={item.id}>
                                                    <td>
                                                        <div className="d-flex align-items-center">
                                                            <img
                                                                src={item.image}
                                                                alt={item.name}
                                                                className="rounded me-3"
                                                                style={{
                                                                    width: '50px',
                                                                    height: '50px',
                                                                    objectFit: 'cover',
                                                                }}
                                                            />
                                                            <div>
                                                                <p className="mb-0 fw-bold text-brand-blue">{item.name}</p>
                                                                <small className="text-muted">{item.category}</small>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="text-center align-middle">{item.quantity}</td>
                                                    <td className="text-end align-middle">
                                                        {formatPrice(item.price)}
                                                    </td>
                                                    <td className="text-end align-middle fw-bold text-brand-green">
                                                        {formatPrice(item.price * item.quantity)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Price Summary */}
                                <div className="border-top p-4">
                                    <div className="row justify-content-end">
                                        <div className="col-md-6">
                                            <div className="d-flex justify-content-between mb-2">
                                                <span className="text-muted">Subtotal:</span>
                                                <span className="fw-bold">
                                                    {formatPrice(order.pricing?.subtotal)}
                                                </span>
                                            </div>
                                            <div className="d-flex justify-content-between mb-2">
                                                <span className="text-muted">Shipping:</span>
                                                <span className="fw-bold">
                                                    {order.pricing?.shipping === 0 ? (
                                                        <span className="text-success">FREE</span>
                                                    ) : (
                                                        formatPrice(order.pricing?.shipping)
                                                    )}
                                                </span>
                                            </div>
                                            <div className="d-flex justify-content-between mb-3">
                                                <span className="text-muted">Tax:</span>
                                                <span className="fw-bold">{formatPrice(order.pricing?.tax)}</span>
                                            </div>
                                            <hr />
                                            <div className="d-flex justify-content-between">
                                                <h5 className="mb-0 text-brand-blue">Total:</h5>
                                                <h5 className="mb-0 text-brand-green fw-bold">
                                                    {formatPrice(order.pricing?.total)}
                                                </h5>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="row g-3">
                            <div className="col-sm-4">
                                <button
                                    className="btn btn-outline-secondary w-100"
                                    onClick={() => window.print()}
                                >
                                    <FaPrint className="me-2" /> Print Receipt
                                </button>
                            </div>
                            <div className="col-sm-4">
                                <Link to="/profile?tab=orders" className="btn btn-outline-primary w-100">
                                    <FaShoppingBag className="me-2" /> Track Order
                                </Link>
                            </div>
                            <div className="col-sm-4">
                                <Link to="/" className="btn btn-success w-100">
                                    <FaHome className="me-2" /> Back to Home
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderConfirmation;