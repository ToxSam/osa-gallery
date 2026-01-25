# Finder Layout System - How It Works

## Overview

The Finder page uses a **4-column resizable layout system** that allows users to adjust the width of different sections. The layout consists of:

1. **Left Sidebar** - Projects/Collections accordion (default: 15%)
2. **Center** - Avatar list view (default: 35%)
3. **File List** - File selection panel (default: 25%)
4. **Right Sidebar** - Preview panel with 3D viewer and details (default: 25%)

## Architecture

### Column Width Management

The system uses **percentage-based widths** stored in React state:
- `leftWidth` - Projects sidebar width
- `centerWidth` - Avatar list width
- `fileListWidth` - File list width
- `rightWidth` - Preview panel width

**Key Constraint**: All four columns must always sum to **exactly 100%** to prevent layout breaking.

### Resize Handles

There are **3 resize handles** between the columns:
1. **Left handle** - Between Projects and Avatar List
2. **Middle handle** - Between Avatar List and File List
3. **Right handle** - Between File List and Preview Panel

### Resize Logic

When a user drags a resize handle, the system:

1. **Calculates the delta** - How much the mouse moved (converted to percentage)
2. **Applies changes** - Updates the two columns adjacent to the handle
3. **Maintains 100% total** - Adjusts other columns if needed to keep total at 100%
4. **Enforces constraints** - Each column has min/max width limits

#### Left Handle Resize
- Expands/contracts Projects sidebar
- Adjusts Avatar List in opposite direction
- Distributes remaining space proportionally to File List and Preview Panel

#### Middle Handle Resize (The Problem Area)
- Expands/contracts Avatar List
- Adjusts File List in opposite direction
- **Must adjust Preview Panel** to maintain 100% total
- If Preview Panel hits its min/max limits, adjusts Avatar List and File List proportionally

#### Right Handle Resize
- Expands/contracts Preview Panel
- Adjusts File List in opposite direction
- Avatar List and Projects remain unchanged

### Width Normalization

After any resize operation, a `useEffect` hook ensures:
- Total width = 100% (within 0.1% tolerance for floating-point errors)
- If total ≠ 100%, all columns are scaled proportionally

### CSS Constraints

Each column uses:
- `width: ${X}%` - Percentage-based width
- `flex-shrink-0` - Prevents columns from shrinking below their width
- `minWidth` - Minimum pixel width (prevents columns from becoming too small)
- `maxWidth` - Maximum percentage width (prevents columns from becoming too large)
- `flexBasis` - Explicit flex basis to prevent expansion

### The Problem

When resizing the **middle handle** (between Avatar List and File List):
- Only `centerWidth` and `fileListWidth` were being updated
- The total could exceed 100% or be less than 100%
- Preview Panel (`rightWidth`) wasn't being adjusted
- This caused the Preview Panel to break out of its container or create layout issues

### The Solution

1. **Calculate net change** - After clamping center and fileList, calculate how much space was actually used
2. **Adjust Preview Panel** - Modify `rightWidth` by the net change to maintain 100% total
3. **Handle clamping** - If Preview Panel hits its limits, redistribute the adjustment back to center/fileList proportionally
4. **Normalize on every change** - The `useEffect` ensures total always equals 100%

### Container Structure

```
<div className="flex flex-1 overflow-hidden min-h-0 w-full">
  <div style={{ width: `${leftWidth}%` }}>Projects</div>
  <div className="w-1">Resize Handle</div>
  <div style={{ width: `${centerWidth}%` }}>Avatar List</div>
  <div className="w-1">Resize Handle</div>
  <div style={{ width: `${fileListWidth}%` }}>File List</div>
  <div className="w-1">Resize Handle</div>
  <div style={{ width: `${rightWidth}%` }}>Preview Panel</div>
</div>
```

### State Persistence

Column widths are saved to `localStorage`:
- `finder-left-width`
- `finder-center-width`
- `finder-filelist-width`
- `finder-right-width`

Widths are restored on page load.

## Key Takeaways

1. **Always maintain 100% total** - The sum of all four columns must equal 100%
2. **Resize operations affect multiple columns** - When resizing one handle, other columns may need adjustment
3. **Constraints are enforced** - Min/max widths prevent columns from becoming unusable
4. **Normalization is automatic** - The system automatically corrects any drift from 100%
5. **Preview Panel is anchored** - It's part of the flex container and respects the 100% constraint

## Debugging Tips

If the layout breaks:
1. Check if total width = 100% (add console.log in resize handlers)
2. Verify all columns have `flex-shrink-0` and proper width constraints
3. Ensure resize handles are `flex-shrink-0` (they shouldn't affect calculations)
4. Check if any column is hitting its min/max limits unexpectedly
5. Verify the container has `overflow-hidden` to prevent content from breaking out
