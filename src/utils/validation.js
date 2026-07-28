// Form Validation Schemas and Functions for Recomm-Frontend

import { REGEX_PATTERNS } from './constants';

/**
 * Validate login form
 * @param {Object} values - Form values
 * @returns {Object} Validation errors
 */
export const validateLogin = (values) => {
    const errors = {};

    if (!values.email) {
        errors.email = 'Email is required';
    } else if (!REGEX_PATTERNS.EMAIL.test(values.email)) {
        errors.email = 'Invalid email address';
    }

    if (!values.password) {
        errors.password = 'Password is required';
    } else if (values.password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
    }

    return errors;
};

/**
 * Validate signup form
 * @param {Object} values - Form values
 * @returns {Object} Validation errors
 */
export const validateSignup = (values) => {
    const errors = {};

    if (!values.firstName) {
        errors.firstName = 'First name is required';
    } else if (values.firstName.length < 2) {
        errors.firstName = 'First name must be at least 2 characters';
    }

    if (!values.lastName) {
        errors.lastName = 'Last name is required';
    } else if (values.lastName.length < 2) {
        errors.lastName = 'Last name must be at least 2 characters';
    }

    if (!values.email) {
        errors.email = 'Email is required';
    } else if (!REGEX_PATTERNS.EMAIL.test(values.email)) {
        errors.email = 'Invalid email address';
    }

    if (!values.phone) {
        errors.phone = 'Phone number is required';
    } else if (!REGEX_PATTERNS.PHONE.test(values.phone)) {
        errors.phone = 'Invalid phone number';
    }

    if (!values.password) {
        errors.password = 'Password is required';
    } else if (values.password.length < 8) {
        errors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(values.password)) {
        errors.password = 'Password must contain uppercase, lowercase, and number';
    }

    if (!values.confirmPassword) {
        errors.confirmPassword = 'Please confirm your password';
    } else if (values.password !== values.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
    }

    if (!values.terms) {
        errors.terms = 'You must accept the terms and conditions';
    }

    return errors;
};

/**
 * Validate shipping address form
 * @param {Object} values - Form values
 * @returns {Object} Validation errors
 */
export const validateShippingAddress = (values) => {
    const errors = {};

    if (!values.fullName) {
        errors.fullName = 'Full name is required';
    }

    if (!values.addressLine1) {
        errors.addressLine1 = 'Address is required';
    }

    if (!values.city) {
        errors.city = 'City is required';
    }

    if (!values.state) {
        errors.state = 'State is required';
    }


    if (!values.phone) {
        errors.phone = 'Phone number is required';
    } else if (!REGEX_PATTERNS.PHONE.test(values.phone)) {
        errors.phone = 'Invalid phone number';
    }

    return errors;
};

/**
 * Validate payment form
 * @param {Object} values - Form values
 * @returns {Object} Validation errors
 */
export const validatePayment = (values) => {
    const errors = {};

    if (!values.cardName) {
        errors.cardName = 'Cardholder name is required';
    }

    if (!values.cardNumber) {
        errors.cardNumber = 'Card number is required';
    } else if (!REGEX_PATTERNS.CREDIT_CARD.test(values.cardNumber.replace(/\s/g, ''))) {
        errors.cardNumber = 'Invalid card number';
    }

    if (!values.expiryDate) {
        errors.expiryDate = 'Expiry date is required';
    } else if (!/^\d{2}\/\d{2}$/.test(values.expiryDate)) {
        errors.expiryDate = 'Invalid expiry date (MM/YY)';
    }

    if (!values.cvv) {
        errors.cvv = 'CVV is required';
    } else if (!REGEX_PATTERNS.CVV.test(values.cvv)) {
        errors.cvv = 'Invalid CVV';
    }

    return errors;
};

/**
 * Validate review form
 * @param {Object} values - Form values
 * @returns {Object} Validation errors
 */
export const validateReview = (values) => {
    const errors = {};

    if (!values.rating) {
        errors.rating = 'Please select a rating';
    } else if (values.rating < 1 || values.rating > 5) {
        errors.rating = 'Rating must be between 1 and 5';
    }

    if (!values.comment) {
        errors.comment = 'Review comment is required';
    } else if (values.comment.length < 10) {
        errors.comment = 'Review must be at least 10 characters';
    } else if (values.comment.length > 500) {
        errors.comment = 'Review must not exceed 500 characters';
    }

    return errors;
};

/**
 * Validate contact form
 * @param {Object} values - Form values
 * @returns {Object} Validation errors
 */
export const validateContact = (values) => {
    const errors = {};

    if (!values.name) {
        errors.name = 'Name is required';
    }

    if (!values.email) {
        errors.email = 'Email is required';
    } else if (!REGEX_PATTERNS.EMAIL.test(values.email)) {
        errors.email = 'Invalid email address';
    }

    if (!values.subject) {
        errors.subject = 'Subject is required';
    }

    if (!values.message) {
        errors.message = 'Message is required';
    } else if (values.message.length < 20) {
        errors.message = 'Message must be at least 20 characters';
    }

    return errors;
};

/**
 * Validate promo code
 * @param {string} code - Promo code
 * @returns {Object} Validation result
 */
export const validatePromoCode = (code) => {
    if (!code) {
        return { valid: false, error: 'Promo code is required' };
    }

    if (code.length < 3 || code.length > 20) {
        return { valid: false, error: 'Invalid promo code length' };
    }

    // Mock validation - in real app, this would call an API
    const validCodes = ['SAVE10', 'SAVE20', 'FREESHIP', 'WELCOME'];
    if (validCodes.includes(code.toUpperCase())) {
        return { valid: true, discount: code === 'SAVE20' ? 20 : 10 };
    }

    return { valid: false, error: 'Invalid promo code' };
};

export default {
    validateLogin,
    validateSignup,
    validateShippingAddress,
    validatePayment,
    validateReview,
    validateContact,
    validatePromoCode,
};