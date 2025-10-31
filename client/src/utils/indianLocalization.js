/**
 * 🇮🇳 INDIAN LOCALIZATION UTILITIES
 * 
 * Helper functions for formatting currency, numbers, and text
 * according to Indian standards and preferences.
 */

/**
 * Format currency in Indian Rupees
 * @param {number} amount - The amount to format
 * @param {boolean} showDecimals - Whether to show decimal places
 * @returns {string} Formatted currency string
 * 
 * Examples:
 * formatIndianCurrency(1000) => "₹1,000"
 * formatIndianCurrency(150000) => "₹1,50,000"
 * formatIndianCurrency(10000000) => "₹1,00,00,000"
 */
export const formatIndianCurrency = (amount, showDecimals = false) => {
    if (amount === null || amount === undefined) return '₹0';
    
    const absAmount = Math.abs(amount);
    const isNegative = amount < 0;
    
    // Handle decimals
    const decimalPart = showDecimals ? (absAmount % 1).toFixed(2).substring(1) : '';
    const integerPart = Math.floor(absAmount);
    
    // Convert to string and reverse for easier formatting
    let numStr = integerPart.toString();
    let result = '';
    
    // Indian numbering system: X,XX,XXX
    // First 3 digits from right
    if (numStr.length > 3) {
        result = ',' + numStr.slice(-3);
        numStr = numStr.slice(0, -3);
        
        // Then groups of 2
        while (numStr.length > 2) {
            result = ',' + numStr.slice(-2) + result;
            numStr = numStr.slice(0, -2);
        }
        
        // Remaining digits
        if (numStr.length > 0) {
            result = numStr + result;
        }
    } else {
        result = numStr;
    }
    
    return `${isNegative ? '-' : ''}₹${result}${decimalPart}`;
};

/**
 * Format numbers in Indian style (Lakhs, Crores)
 * @param {number} num - The number to format
 * @param {boolean} useWords - Whether to use words (Lakh, Crore)
 * @returns {string} Formatted number string
 * 
 * Examples:
 * formatIndianNumber(100000, true) => "1 Lakh"
 * formatIndianNumber(10000000, true) => "1 Crore"
 * formatIndianNumber(12500000, true) => "1.25 Crore"
 */
export const formatIndianNumber = (num, useWords = false) => {
    if (num === null || num === undefined) return '0';
    
    const absNum = Math.abs(num);
    const isNegative = num < 0;
    
    if (!useWords) {
        return formatIndianCurrency(num, false).replace('₹', '');
    }
    
    let result;
    
    if (absNum >= 10000000) {
        // Crores (1,00,00,000)
        result = (absNum / 10000000).toFixed(2).replace(/\.00$/, '') + ' Crore';
    } else if (absNum >= 100000) {
        // Lakhs (1,00,000)
        result = (absNum / 100000).toFixed(2).replace(/\.00$/, '') + ' Lakh';
    } else if (absNum >= 1000) {
        // Thousands
        result = (absNum / 1000).toFixed(2).replace(/\.00$/, '') + ' Thousand';
    } else {
        result = absNum.toString();
    }
    
    return `${isNegative ? '-' : ''}${result}`;
};

/**
 * Convert price range to Indian format
 * @param {number} min - Minimum price
 * @param {number} max - Maximum price
 * @returns {string} Formatted price range
 */
export const formatPriceRange = (min, max) => {
    return `${formatIndianCurrency(min)} - ${formatIndianCurrency(max)}`;
};

/**
 * Indian travel-related terms
 */
export const indianTerms = {
    // Common travel terms
    journey: 'Yatra',
    travel: 'Safar',
    traveler: 'Yatri',
    destination: 'Gantavya',
    adventure: 'Sahasik',
    nature: 'Prakriti',
    eco: 'Paryavaran',
    
    // Booking related
    booking: 'Aarakshan',
    payment: 'Bhugtaan',
    confirm: 'Nishchit',
    cancel: 'Radd',
    
    // Places
    mountain: 'Pahad',
    river: 'Nadi',
    forest: 'Jungle',
    beach: 'Samudra Tat',
    temple: 'Mandir',
    fort: 'Qila',
    
    // Common phrases
    welcome: 'Swagat',
    namaste: 'Namaste',
    thankYou: 'Dhanyavaad',
    enjoy: 'Aanand Len',
};

/**
 * Get localized term
 * @param {string} key - The term key
 * @param {boolean} bilingual - Whether to show both English and Hindi
 * @returns {string} Localized term
 */
export const getLocalizedTerm = (key, bilingual = false) => {
    const term = indianTerms[key] || key;
    
    if (bilingual && indianTerms[key]) {
        return `${key.charAt(0).toUpperCase() + key.slice(1)} (${term})`;
    }
    
    return term;
};

/**
 * Format date in Indian style
 * @param {Date|string} date - The date to format
 * @param {boolean} includeTime - Whether to include time
 * @returns {string} Formatted date string
 */
export const formatIndianDate = (date, includeTime = false) => {
    const d = new Date(date);
    
    if (isNaN(d.getTime())) return 'Invalid Date';
    
    const day = d.getDate();
    const month = d.toLocaleString('en-IN', { month: 'short' });
    const year = d.getFullYear();
    
    let formatted = `${day} ${month} ${year}`;
    
    if (includeTime) {
        const time = d.toLocaleString('en-IN', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
        formatted += ` at ${time}`;
    }
    
    return formatted;
};

/**
 * Calculate GST (Indian tax)
 * @param {number} amount - Base amount
 * @param {number} gstPercent - GST percentage (default 18%)
 * @returns {object} Object with base, gst, and total
 */
export const calculateGST = (amount, gstPercent = 18) => {
    const gstAmount = (amount * gstPercent) / 100;
    const total = amount + gstAmount;
    
    return {
        base: amount,
        gst: gstAmount,
        gstPercent,
        total,
        formatted: {
            base: formatIndianCurrency(amount),
            gst: formatIndianCurrency(gstAmount),
            total: formatIndianCurrency(total),
        }
    };
};

/**
 * Distance formatter (km)
 * @param {number} km - Distance in kilometers
 * @returns {string} Formatted distance
 */
export const formatDistance = (km) => {
    if (km < 1) {
        return `${Math.round(km * 1000)} meters`;
    }
    return `${km.toFixed(1)} km`;
};

/**
 * Duration formatter
 * @param {number} minutes - Duration in minutes
 * @returns {string} Formatted duration
 */
export const formatDuration = (minutes) => {
    if (minutes < 60) {
        return `${minutes} minutes`;
    }
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (mins === 0) {
        return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    }
    
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ${mins} min`;
};

/**
 * Discount calculator
 * @param {number} originalPrice - Original price
 * @param {number} discountPercent - Discount percentage
 * @returns {object} Discount details
 */
export const calculateDiscount = (originalPrice, discountPercent) => {
    const discountAmount = (originalPrice * discountPercent) / 100;
    const finalPrice = originalPrice - discountAmount;
    
    return {
        original: originalPrice,
        discount: discountAmount,
        final: finalPrice,
        percent: discountPercent,
        savings: discountAmount,
        formatted: {
            original: formatIndianCurrency(originalPrice),
            discount: formatIndianCurrency(discountAmount),
            final: formatIndianCurrency(finalPrice),
            savings: formatIndianCurrency(discountAmount),
        }
    };
};

/**
 * Phone number formatter (Indian)
 * @param {string} phone - Phone number
 * @returns {string} Formatted phone number
 */
export const formatIndianPhone = (phone) => {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Check if it's a valid Indian number (10 digits)
    if (cleaned.length === 10) {
        return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    }
    
    // If already has country code
    if (cleaned.length === 12 && cleaned.startsWith('91')) {
        return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
    }
    
    return phone; // Return as-is if format is unclear
};

export default {
    formatIndianCurrency,
    formatIndianNumber,
    formatPriceRange,
    indianTerms,
    getLocalizedTerm,
    formatIndianDate,
    calculateGST,
    formatDistance,
    formatDuration,
    calculateDiscount,
    formatIndianPhone,
};
