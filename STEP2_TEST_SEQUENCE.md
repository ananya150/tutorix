# Step 2 Test Sequence: Explicit Positioning AI System Validation

## Recent Improvements ✨
- **Reduced horizontal margins**: Changed from windowWidth/12 to windowWidth/16 for more usable canvas space
- **Added text box spacing**: 8px padding between adjacent text boxes to prevent crowding
- **Improved positioning**: Small offsets for middle/right positioned boxes for better visual separation

## Overview
This test sequence validates that our explicit positioning AI system correctly:
- Interprets explicit positioning instructions (row, position, width)
- Places content at specified locations with proper dimensions
- Handles multiple items per row without overlap
- Applies appropriate styling (fontSize, fontWeight, textAlign)
- Creates responsive layouts with flexible width specifications

## Test Instructions
1. **Clear the canvas** before starting (refresh page if needed)
2. **Enter each prompt exactly as written** in the input field
3. **Wait for each response** before entering the next prompt
4. **Check the expected results** after each prompt

---

## Test Sequence

### Test 1: Main Title with Explicit Positioning
**Prompt:** `Create textbox with "Newton's Laws of Motion" in row 1, center position, width 3/4, fontSize xlarge, fontWeight bold, textAlign center`

**Expected Result:**
- Position: Row 1, centered horizontally
- Width: 3/4 of canvas width
- Styling: Extra large font, bold, center-aligned
- Coordinates: Calculated from canvas dimensions

---

### Test 2: Three Law Headings in Same Row
**Prompt:** `Create textbox with "Newton's First Law" in row 3, position 0.0, width 1/3, fontSize large, fontWeight bold, textAlign center`

**Expected Result:**
- Position: Row 3, left third of canvas
- Width: 1/3 of canvas width
- Styling: Large font, bold, center-aligned within box

---

### Test 3: Second Law Heading (Middle Third)
**Prompt:** `Create textbox with "Newton's Second Law" in row 3, position 0.333, width 1/3, fontSize large, fontWeight bold, textAlign center`

**Expected Result:**
- Position: Row 3, middle third of canvas
- Width: 1/3 of canvas width
- Styling: Large font, bold, center-aligned within box
- Layout: Adjacent to first law heading

---

### Test 4: Third Law Heading (Right Third)
**Prompt:** `Create textbox with "Newton's Third Law" in row 3, position 0.667, width 1/3, fontSize large, fontWeight bold, textAlign center`

**Expected Result:**
- Position: Row 3, right third of canvas
- Width: 1/3 of canvas width
- Styling: Large font, bold, center-aligned within box
- Layout: Completes the three-column header row

---

### Test 5: First Law Description
**Prompt:** `Create textbox with "An object at rest stays at rest, and an object in motion stays in motion, unless acted upon by an external force" in row 5, position 0.0, width 1/3, fontSize medium, fontWeight normal, textAlign left`

**Expected Result:**
- Position: Row 5, left third (under First Law heading)
- Width: 1/3 of canvas width
- Styling: Medium font, normal weight, left-aligned
- Content: First law definition

---

### Test 6: Second Law Description
**Prompt:** `Create textbox with "The acceleration of an object is directly proportional to the net force acting on it and inversely proportional to its mass" in row 5, position 0.333, width 1/3, fontSize medium, fontWeight normal, textAlign left`

**Expected Result:**
- Position: Row 5, middle third (under Second Law heading)
- Width: 1/3 of canvas width
- Styling: Medium font, normal weight, left-aligned
- Content: Second law definition

---

### Test 7: Third Law Description
**Prompt:** `Create textbox with "For every action, there is an equal and opposite reaction" in row 5, position 0.667, width 1/3, fontSize medium, fontWeight normal, textAlign left`

**Expected Result:**
- Position: Row 5, right third (under Third Law heading)
- Width: 1/3 of canvas width
- Styling: Medium font, normal weight, left-aligned
- Content: Third law definition

---

### Test 8: First Law Formula
**Prompt:** `Create textbox with "F = 0 → a = 0" in row 8, position 0.0, width 1/3, fontSize medium, fontWeight normal, textAlign center`

**Expected Result:**
- Position: Row 7, left third (under First Law)
- Width: 1/3 of canvas width
- Styling: Medium font, center-aligned
- Content: Mathematical representation

---

### Test 9: Second Law Formula
**Prompt:** `Create textbox with "F = ma" in row 8, position 0.333, width 1/3, fontSize medium, fontWeight normal, textAlign center`

**Expected Result:**
- Position: Row 7, middle third (under Second Law)
- Width: 1/3 of canvas width
- Styling: Medium font, center-aligned
- Content: Famous F=ma equation

---

### Test 10: Third Law Formula
**Prompt:** `Create textbox with "F₁ = -F₂" in row 8, position 0.667, width 1/3, fontSize medium, fontWeight normal, textAlign center`

**Expected Result:**
- Position: Row 7, right third (under Third Law)
- Width: 1/3 of canvas width
- Styling: Medium font, center-aligned
- Content: Action-reaction formula

---

### Test 11: Example Applications Row
**Prompt:** `Create textbox with "Examples: Car braking, objects on table" in row 10, position 0.0, width 1/3, fontSize small, fontWeight normal, textAlign left`

**Expected Result:**
- Position: Row 9, left third
- Width: 1/3 of canvas width
- Styling: Small font, left-aligned
- Content: First law examples

---

### Test 12: Second Law Examples
**Prompt:** `Create textbox with "Examples: Pushing cart, rocket propulsion" in row 10, position 0.333, width 1/3, fontSize small, fontWeight normal, textAlign left`

**Expected Result:**
- Position: Row 9, middle third
- Width: 1/3 of canvas width
- Styling: Small font, left-aligned
- Content: Second law examples

---

### Test 13: Third Law Examples
**Prompt:** `Create textbox with "Examples: Walking, swimming, rocket thrust" in row 10, position 0.667, width 1/3, fontSize small, fontWeight normal, textAlign left`

**Expected Result:**
- Position: Row 9, right third
- Width: 1/3 of canvas width
- Styling: Small font, left-aligned
- Content: Third law examples

---

### Test 14: Summary Section
**Prompt:** `Create textbox with "Summary: These three laws form the foundation of classical mechanics and explain the motion of objects in our everyday world" in row 12, center position, width 3/4, fontSize medium, fontWeight bold, textAlign center`

**Expected Result:**
- Position: Row 11, centered
- Width: 3/4 of canvas width
- Styling: Medium font, bold, center-aligned
- Content: Concluding summary

---

### Test 15: Bullet Point Test
**Prompt:** `Create textbox with "Key takeaway: Forces cause acceleration" in row 14, left position, width 1/2, fontSize medium, fontWeight normal, textAlign left, bullet true`

**Expected Result:**
- Position: Row 13, left side
- Width: 1/2 of canvas width
- Styling: Medium font with bullet point prefix
- Content: Bullet point automatically added

---

## Validation Checklist

After completing all tests, verify:

### ✅ Explicit Positioning
- [ ] Row 1: Title centered with 3/4 width
- [ ] Row 3: Three headings in equal thirds (0.0, 0.333, 0.667 positions)
- [ ] Row 5: Three descriptions aligned under headings
- [ ] Row 7: Three formulas aligned under descriptions
- [ ] Row 9: Three example sets aligned under formulas
- [ ] Row 11: Summary centered with 3/4 width
- [ ] Row 13: Bullet point on left side

### ✅ Width Specifications
- [ ] 1/3 widths: All three-column items properly sized
- [ ] 3/4 widths: Title and summary appropriately wide
- [ ] 1/2 width: Bullet point properly sized
- [ ] No overlapping content horizontally

### ✅ Positioning Accuracy
- [ ] 0.0 position: Items at left edge of canvas area
- [ ] 0.333 position: Items at 1/3 point of canvas
- [ ] 0.667 position: Items at 2/3 point of canvas
- [ ] Center position: Items properly centered
- [ ] Left position: Items at left edge

### ✅ Styling Application
- [ ] xlarge font: Title prominently displayed
- [ ] large font: Law headings clearly visible
- [ ] medium font: Descriptions and formulas readable
- [ ] small font: Examples appropriately sized
- [ ] bold weight: Title, headings, and summary emphasized
- [ ] normal weight: Descriptions and examples standard

### ✅ Text Alignment
- [ ] center align: Title, headings, formulas, summary centered in boxes
- [ ] left align: Descriptions and examples left-aligned in boxes
- [ ] Bullet point: Automatically prefixed with "•"

### ✅ Technical Validation
- [ ] All coordinates are calculated numbers
- [ ] Canvas dimensions properly used for calculations
- [ ] Responsive positioning (adapts to window size)
- [ ] No console errors during creation
- [ ] Position specs stored in metadata

---

## Expected Canvas Layout

After all tests, your canvas should look like this:

```
Row 1:  [           Newton's Laws of Motion              ] ← Title (center, 3/4 width)

Row 3:  [Newton's First Law] [Newton's Second Law] [Newton's Third Law] ← Headings (1/3 each)

Row 5:  [An object at rest  ] [Acceleration is    ] [For every action  ] ← Descriptions
        [stays at rest...   ] [proportional to... ] [equal & opposite  ]

Row 7:  [    F = 0 → a = 0  ] [      F = ma       ] [    F₁ = -F₂      ] ← Formulas

Row 9:  [Car braking,       ] [Pushing cart,      ] [Walking, swimming ] ← Examples
        [objects on table   ] [rocket propulsion  ] [rocket thrust     ]

Row 11: [        Summary: These three laws form the foundation...        ] ← Summary

Row 13: [• Key takeaway: Forces cause acceleration                       ] ← Bullet
```

---

## Troubleshooting

If any test fails:

1. **Check Position Calculation**: Verify x,y coordinates match expected row/position
2. **Verify Width Calculation**: Check that width matches fraction of canvas width
3. **Validate Canvas Dimensions**: Ensure canvas dimensions are sent to AI
4. **Review Styling**: Check fontSize, fontWeight, textAlign properties
5. **Check Overlap**: Ensure items in same row don't overlap horizontally

---

## Performance Notes

- Each request processes explicit positioning directly
- No semantic interpretation needed - direct coordinate calculation
- Canvas dimensions sent once and reused for all calculations
- Predictable, deterministic positioning
- Support for complex multi-column layouts

---

## Next Steps

Once all tests pass:
- ✅ Step 2 is fully validated with explicit positioning
- 🚀 Ready for advanced layout scenarios
- 📊 Multi-column educational content confirmed
- 🎯 Flexible positioning system established 