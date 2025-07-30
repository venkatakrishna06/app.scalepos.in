# ScalePOS Print Samples

This directory contains sample text representations of the various printed documents used in the ScalePOS system. These
samples show how the documents would appear when printed on thermal receipt printers.

## Sample Files

### Invoice/Bill Samples

1. **Dine-in Invoice** - `sample_invoice_receipt.txt`
    - Shows a standard dine-in bill with table and server information
    - Includes restaurant details, itemized list, tax calculations, and payment method

2. **Takeaway Invoice** - `sample_invoice_takeaway.txt`
    - Shows a takeaway bill with token number
    - Includes cash payment details with change calculation

3. **Quick Bill Invoice** - `sample_invoice_quickbill.txt`
    - Shows a quick bill with token number
    - Uses UPI as payment method example

### Kitchen Order Ticket (KOT) Samples

1. **Dine-in KOT** - `sample_kot_slip_dinein.txt`
    - Shows a kitchen order for a dine-in table
    - Includes table number and server information

2. **Takeaway KOT** - `sample_kot_slip_takeaway.txt`
    - Shows a kitchen order for a takeaway order
    - Includes token number with "T" prefix

3. **Quick Bill KOT** - `sample_kot_slip_quickbill.txt`
    - Shows a kitchen order for a quick bill order
    - Includes token number with "Q" prefix

### Documentation

1. **Print Samples Summary** - `print_samples_summary.txt`
    - Provides detailed explanation of all document types
    - Explains differences between order types
    - Describes printing workflow and error handling

## How to Use These Samples

These text files represent how the printed documents would appear on thermal receipt printers. They can be used as
references for:

1. Understanding the format and content of each document type
2. Training staff on how to interpret printed receipts and KOT slips
3. Verifying that the printing functionality is working correctly

The actual printed documents will use ESC/POS commands for formatting (bold text, different font sizes, etc.), but the
content and layout will match these samples.

## Printing Implementation

The printing functionality is implemented in:

- `payment-dialog.tsx` - For invoice/bill printing
- `create-order-dialog.tsx` - For KOT printing in dine-in orders
- `DashboardTakeaway.tsx` - For KOT and invoice printing in takeaway and quick bill orders

The system is designed to continue processing orders even if printing fails, ensuring business operations can continue
uninterrupted.