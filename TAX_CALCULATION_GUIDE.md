# Tax Calculation Guide

This document explains how GST (Goods and Services Tax) is calculated in the BazarXpress payment system.

## Overview

The system supports both inclusive and exclusive tax scenarios for GST calculations, handling both intra-state (CGST + SGST) and inter-state (IGST) transactions.

## Tax Calculation Scenarios

### Scenario 1: Price Inclusive of Tax
When a product's price includes GST (e.g., ₹100 includes 18% GST):

**Calculation:**
- Let base price = X
- Total price = X + 18% of X = X × 1.18
- ₹100 = X × 1.18 ⇒ X = ₹100 / 1.18 = ₹84.75
- Tax amount = ₹100 - ₹84.75 = ₹15.25

**Intra-State (CGST + SGST):**
- CGST = ₹15.25 ÷ 2 = ₹7.63 (9%)
- SGST = ₹15.25 ÷ 2 = ₹7.63 (9%)

**Inter-State (IGST):**
- IGST = ₹15.25 (18%)

### Scenario 2: Price Exclusive of Tax
When a product's price does not include GST (e.g., ₹100 + 18% GST):

**Calculation:**
- Base Price = ₹100
- GST = 18% of ₹100 = ₹18
- Total Price = ₹100 + ₹18 = ₹118

**Intra-State (CGST + SGST):**
- CGST = ₹9 (9%)
- SGST = ₹9 (9%)

**Inter-State (IGST):**
- IGST = ₹18 (18%)

## Implementation Details

### Product Configuration
Each product should have:
- `price`: The selling price
- `priceIncludesTax`: Boolean indicating if price includes tax
- `tax`: Reference to tax object with percentage

### Tax Object Structure
```javascript
{
  _id: "tax_id",
  name: "GST 18%",
  percentage: 18,
  description: "Goods and Services Tax"
}
```

### State Determination
- **Intra-State**: User's delivery state = Warehouse state → CGST + SGST
- **Inter-State**: User's delivery state ≠ Warehouse state → IGST

### Cart Calculation
The system calculates tax for each cart item and aggregates:
- Subtotal (base prices)
- Total tax amount
- CGST/SGST or IGST breakdown
- Final total including tax

## Usage in Payment Page

The payment page automatically:
1. Determines if transaction is inter-state based on delivery address
2. Calculates tax for each cart item
3. Displays tax breakdown in order summary
4. Shows tax information panel with rates and amounts
5. Includes tax in final payment amount

## Example Output

**Intra-State Order:**
```
Subtotal: ₹100.00
CGST @ 9.0%: ₹9.00
SGST @ 9.0%: ₹9.00
Total Tax: ₹18.00
Delivery Fee: ₹20.00
Total: ₹138.00
```

**Inter-State Order:**
```
Subtotal: ₹100.00
IGST @ 18.0%: ₹18.00
Total Tax: ₹18.00
Delivery Fee: ₹20.00
Total: ₹138.00
```

## Configuration

To configure tax calculation:
1. Set up tax rates in admin panel
2. Assign taxes to products
3. Set `priceIncludesTax` flag appropriately
4. Configure warehouse state for inter-state determination

## Testing

To test tax calculations:
1. Add products with different tax configurations to cart
2. Select delivery addresses in different states
3. Verify tax breakdown in payment page
4. Check console logs for calculation details 