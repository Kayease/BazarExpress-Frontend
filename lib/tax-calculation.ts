/**
 * Tax Calculation Utility
 * 
 * Handles GST calculations for both inclusive and exclusive tax scenarios
 * Supports CGST/SGST for intra-state and IGST for inter-state transactions
 */

export interface TaxInfo {
  id: string;
  name: string;
  percentage: number;
  description?: string;
}

export interface ProductTaxInfo {
  price: number;
  priceIncludesTax: boolean;
  tax: TaxInfo | null;
  quantity: number;
}

export interface TaxCalculationResult {
  basePrice: number;
  taxAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalPrice: number;
  isInterState: boolean;
  taxBreakdown: {
    basePrice: number;
    cgst: { amount: number; percentage: number };
    sgst: { amount: number; percentage: number };
    igst: { amount: number; percentage: number };
    total: number;
  };
}

export interface CartTaxCalculation {
  subtotal: number;
  totalTax: number;
  totalCGST: number;
  totalSGST: number;
  totalIGST: number;
  finalTotal: number;
  isInterState: boolean;
  taxBreakdown: {
    subtotal: number;
    cgst: { amount: number; percentage: number };
    sgst: { amount: number; percentage: number };
    igst: { amount: number; percentage: number };
    total: number;
  };
}

/**
 * Calculate tax for a single product
 */
export function calculateProductTax(
  product: ProductTaxInfo,
  isInterState: boolean = false
): TaxCalculationResult {
  const { price, priceIncludesTax, tax, quantity } = product;
  
  if (!tax || tax.percentage === 0 || tax.percentage === undefined) {
    return {
      basePrice: price * quantity,
      taxAmount: 0,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      totalPrice: price * quantity,
      isInterState,
      taxBreakdown: {
        basePrice: price * quantity,
        cgst: { amount: 0, percentage: 0 },
        sgst: { amount: 0, percentage: 0 },
        igst: { amount: 0, percentage: 0 },
        total: price * quantity
      }
    };
  }

  const totalPrice = price * quantity;
  let basePrice: number;
  let taxAmount: number;

  if (priceIncludesTax) {
    // Scenario 1: Price is inclusive of tax
    // Calculate base price from total price
    basePrice = totalPrice / (1 + tax.percentage / 100);
    taxAmount = totalPrice - basePrice;
  } else {
    // Scenario 2: Price is exclusive of tax
    // Calculate tax amount from base price
    basePrice = totalPrice;
    taxAmount = basePrice * (tax.percentage / 100);
  }

  // Calculate CGST/SGST or IGST
  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;

  if (isInterState) {
    // Inter-state: IGST = full tax amount
    igstAmount = taxAmount;
  } else {
    // Intra-state: CGST = SGST = tax amount / 2
    cgstAmount = taxAmount / 2;
    sgstAmount = taxAmount / 2;
  }

  return {
    basePrice,
    taxAmount,
    cgstAmount,
    sgstAmount,
    igstAmount,
    totalPrice: basePrice + taxAmount,
    isInterState,
    taxBreakdown: {
      basePrice,
      cgst: { amount: cgstAmount, percentage: isInterState ? 0 : tax.percentage / 2 },
      sgst: { amount: sgstAmount, percentage: isInterState ? 0 : tax.percentage / 2 },
      igst: { amount: igstAmount, percentage: isInterState ? tax.percentage : 0 },
      total: basePrice + taxAmount
    }
  };
}

/**
 * Calculate tax for entire cart
 */
export function calculateCartTax(
  cartItems: ProductTaxInfo[],
  isInterState: boolean = false
): CartTaxCalculation {
  let subtotal = 0;
  let totalTax = 0;
  let totalCGST = 0;
  let totalSGST = 0;
  let totalIGST = 0;

  // Calculate tax for each item
  const itemTaxes = cartItems.map(item => calculateProductTax(item, isInterState));

  // Sum up all values
  itemTaxes.forEach(itemTax => {
    subtotal += itemTax.basePrice;
    totalTax += itemTax.taxAmount;
    totalCGST += itemTax.cgstAmount;
    totalSGST += itemTax.sgstAmount;
    totalIGST += itemTax.igstAmount;
  });

  const finalTotal = subtotal + totalTax;

  // Calculate overall percentages for breakdown
  const totalAmount = subtotal > 0 ? subtotal : 1; // Avoid division by zero
  const cgstPercentage = subtotal > 0 ? (totalCGST / totalAmount) * 100 : 0;
  const sgstPercentage = subtotal > 0 ? (totalSGST / totalAmount) * 100 : 0;
  const igstPercentage = subtotal > 0 ? (totalIGST / totalAmount) * 100 : 0;

  return {
    subtotal,
    totalTax,
    totalCGST,
    totalSGST,
    totalIGST,
    finalTotal,
    isInterState,
    taxBreakdown: {
      subtotal,
      cgst: { amount: totalCGST, percentage: cgstPercentage },
      sgst: { amount: totalSGST, percentage: sgstPercentage },
      igst: { amount: totalIGST, percentage: igstPercentage },
      total: finalTotal
    }
  };
}

/**
 * Format tax amount for display
 */
export function formatTaxAmount(amount: number): string {
  return `₹${amount.toFixed(2)}`;
}

/**
 * Get tax display name based on state
 */
export function getTaxDisplayName(isInterState: boolean): string {
  return isInterState ? 'IGST' : 'CGST + SGST';
}

/**
 * Determine if transaction is inter-state based on delivery address
 * This is a simplified check - in production, you'd compare user's state with warehouse state
 */
export function isInterStateTransaction(
  userState: string,
  warehouseState: string
): boolean {
  return userState.toLowerCase() !== warehouseState.toLowerCase();
} 