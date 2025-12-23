# Toner Inventory Workflow

## Complete Logical Flow

### 1. Stock Registration (No Quantity)
- **Action**: Add toner stock entry in "Toner Stock" page
- **Details Required**:
  - Toner Model (e.g., "106A")
  - Toner Type (Black & White or Color)
  - Toner Color (if Color type)
  - Assigned Printer (Optional)
  - Low Stock Threshold
- **Quantity**: Always starts at **0**
- **Purpose**: Register all toner models that will be used in the system

### 2. Receiving Items (Auto-Update Stock)
- **Action**: Receive items in "Receive Items" page
- **Process**:
  1. Select toner model from dropdown (shows only registered toners)
  2. Enter quantity received
  3. Enter supplier, date, received by, etc.
  4. **System automatically adds quantity to stock**
- **Stock Update**: 
  - Finds the stock entry by model
  - Adds received quantity to existing stock
  - Updates stock automatically
- **Note**: Printer assignment is optional at receiving stage

### 3. Issuing Items (Auto-Subtract Stock)
- **Action**: Issue items in "Issue Items" page
- **Process**:
  1. Select toner model
  2. Select user and printer
  3. Enter quantity to issue
  4. **System automatically subtracts from stock**
- **Stock Update**:
  - Finds stock entry by model
  - Subtracts issued quantity from stock
  - Updates stock automatically
- **Multiple Assignments**: 
  - Same toner model can be issued to multiple users/printers
  - Each issue creates a separate record
  - All issues deduct from the same stock entry

### 4. Real-Time Stock Display
- **Stock Page**: Shows current stock levels for all toner models
- **Low Stock Alerts**: Automatically highlights toners below threshold
- **Accurate Data**: Stock is always up-to-date based on receive/issue transactions

## Key Rules

1. **One Stock Entry Per Model**: Each toner model has only ONE stock entry
2. **Stock Starts at Zero**: New stock entries start with 0 quantity
3. **Receiving Adds to Stock**: Automatically increases stock quantity
4. **Issuing Subtracts from Stock**: Automatically decreases stock quantity
5. **Multiple Assignments Allowed**: One toner model can be issued to multiple users/printers
6. **Real-Time Updates**: Stock is updated immediately after receive/issue operations

## Example Flow

### Step 1: Register Stock
- Add "106A" toner to stock (quantity: 0)

### Step 2: Receive Items
- Receive 50 units of "106A"
- Stock automatically updates to 50

### Step 3: Issue Items
- Issue 10 units of "106A" to User A (Printer 1)
- Stock automatically updates to 40
- Issue 5 units of "106A" to User B (Printer 2)
- Stock automatically updates to 35
- Issue 15 units of "106A" to User C (Printer 3)
- Stock automatically updates to 20

### Result
- Stock shows: "106A" - 20 units remaining
- Three separate issue records exist
- All operations automatically updated stock

## Database Structure

- **toner_stock**: One entry per model (unique by model)
- **received_items**: Records all received items (can have multiple entries per model)
- **issued_items**: Records all issued items (can have multiple entries per model to different users/printers)

## Benefits

✅ Accurate stock tracking
✅ Automatic quantity updates
✅ Multiple assignment support
✅ Real-time data display
✅ No manual stock adjustments needed
✅ Complete audit trail

