# Absolute Positioning Test

## Purpose
Test that row and column positioning works consistently regardless of camera position, zoom level, or viewport changes.

## Recent Fix ✨
- **Consistent Coordinate System**: Always use the same reference dimensions (1461×793) regardless of zoom level
- **True Zoom Independence**: All content uses identical coordinate calculations for perfect positioning consistency
- **Scroll Independence**: Fixed viewport offset handling for proper scroll behavior
- **Debug Logging**: Enhanced logging to track coordinate system consistency

## Test Sequence

### Step 1: Initial Position Test
1. **Clear the canvas** (refresh if needed)
2. **Enter prompt**: `Create textbox with "Row 5 Test" in row 5, center position, width 1/2, fontSize large, fontWeight bold`
3. **Note the position** of the created text box
4. **Expected**: Text appears at row 5 (approximately 5 * rowHeight from top)

### Step 2: Scroll Down Test
1. **Scroll down** significantly (move viewport down)
2. **Enter prompt**: `Create textbox with "Row 3 Test" in row 3, center position, width 1/2, fontSize large, fontWeight bold`
3. **Expected**: Text appears ABOVE the "Row 5 Test" text, at row 3 position
4. **Critical**: Row 3 should be above Row 5, regardless of current viewport

### Step 3: Zoom Out Test (FIXED)
1. **Zoom out** (make canvas smaller)
2. **Check console** for "🔍 Zoom detected - using standard dimensions"
3. **Enter prompt**: `Create textbox with "Row 7 Test" in row 7, center position, width 1/2, fontSize large, fontWeight bold`
4. **Expected**: Text appears BELOW both previous texts, at row 7 position
5. **Critical**: Row 7 should be below Row 5, with consistent spacing

### Step 4: Scroll Up and Test
1. **Scroll up** to see row 1 area
2. **Enter prompt**: `Create textbox with "Row 1 Test" in row 1, center position, width 3/4, fontSize xlarge, fontWeight bold`
3. **Expected**: Text appears at the very top (row 1), above all other texts
4. **Critical**: Row 1 should be at the absolute top, regardless of viewport

### Step 5: Multi-Column Consistency Test
1. **Scroll to see row 10 area**
2. **Enter prompt**: `Create textbox with "Left Column" in row 10, position 0.0, width 1/3, fontSize medium`
3. **Enter prompt**: `Create textbox with "Middle Column" in row 10, position 0.333, width 1/3, fontSize medium`
4. **Enter prompt**: `Create textbox with "Right Column" in row 10, position 0.667, width 1/3, fontSize medium`
5. **Expected**: All three texts appear in the same row (row 10), properly spaced horizontally

## Success Criteria

✅ **Absolute Row Positioning**: 
- Row 1 is always at the top
- Row 3 is always above Row 5
- Row 5 is always above Row 7
- Row positions are consistent regardless of viewport

✅ **Absolute Column Positioning**:
- Position 0.0 is always at the left
- Position 0.333 is always at 1/3 point
- Position 0.667 is always at 2/3 point
- Column positions are consistent regardless of zoom

✅ **Viewport Independence**:
- Scrolling doesn't affect where new content appears
- Zooming doesn't affect positioning calculations
- Camera position has no impact on row/column meaning

✅ **Zoom Independence (NEW)**:
- Large viewport dimensions (>2000px) trigger standard reference frame
- Small viewport dimensions (<800px) trigger standard reference frame
- Consistent row heights and spacing regardless of zoom level

## Debug Information

Check browser console for debug logs:
- `📐 Canvas dimensions calculated (consistent coordinate system)`
- `🎯 calculateTextBoxPosition called with`
- `📐 Y position calculation (ABSOLUTE)`
- `📐 X position calculation (ABSOLUTE)`
- `🎯 Using absolute x/y coordinate from worker` (client-side)

**Key Fix**: You should now see "consistent coordinate system" with the same reference dimensions (1461×793) used for all content, regardless of zoom level.

## Expected Final Layout

After all tests, you should see:
```
Row 1:  [           Row 1 Test              ] ← Top of canvas
Row 3:  [           Row 3 Test              ] ← Above Row 5 (Y ≈ 165px)
Row 5:  [           Row 5 Test              ] ← Center (Y ≈ 297px)
Row 7:  [           Row 7 Test              ] ← Below Row 5 (Y ≈ 429px) - FIXED: Same coordinate system
Row 10: [Left Column] [Middle Column] [Right Column] ← Three columns
```

**Critical**: All Y coordinates should now be consistent:
- Row 3: Y ≈ 165px (always)
- Row 5: Y ≈ 297px (always) 
- Row 7: Y ≈ 429px (always)
- Spacing: ~66px between rows (always)

The key test is that this layout is consistent regardless of where your viewport was when you created each item.

## Troubleshooting

If zoom test still fails:
1. Check console for zoom detection messages
2. Verify Y coordinates maintain consistent spacing (should be ~66px apart for standard viewport)
3. Ensure Row 7 Y position is greater than Row 5 Y position
4. Look for "normalized" dimensions in debug logs 