# Step 2 Test Sequence: Grid-Based AI System Validation

## Overview
This test sequence validates that our grid-based AI system correctly:
- Detects content types from instructions
- Positions content using semantic grid layout
- Applies appropriate styling for each content type
- Maintains educational flow and proper spacing

## Test Instructions
1. **Clear the canvas** before starting (refresh page if needed)
2. **Enter each prompt exactly as written** in the input field
3. **Wait for each response** before entering the next prompt
4. **Check the expected results** after each prompt

---

## Test Sequence

### Test 1: Title Detection and Positioning
**Prompt:** `Write the main title "Newton's Laws of Motion"`

**Expected Result:**
- Content Type: `title`
- Position: Row 1, Columns 3-10 (centered)
- Styling: Extra large font, bold, centered alignment
- Grid Position: `{"row":1,"columnStart":3,"columnEnd":10}`

---

### Test 2: Heading After Title
**Prompt:** `next paragraph. Write heading "First Law of Motion"`

**Expected Result:**
- Content Type: `heading`
- Position: Row 3, Columns 2-11 (with spacing after title)
- Styling: Large font, bold, left-aligned
- Educational Flow: Title → Heading (proper sequence)

---

### Test 3: Definition Content
**Prompt:** `Explain the definition: An object at rest stays at rest unless acted upon by an external force`

**Expected Result:**
- Content Type: `definition`
- Position: Row 4, Columns 1-12 (full width)
- Styling: Normal font, left-aligned
- Educational Flow: Heading → Definition

---

### Test 4: Bullet Points
**Prompt:** `next paragraph. List the key points about inertia`

**Expected Result:**
- Content Type: `bullet`
- Position: Row 5, Columns 2-12 (indented)
- Styling: Normal font with bullet prefix
- Educational Flow: Definition → Bullet points

---

### Test 5: Numbered Steps
**Prompt:** `next paragraph. Write the steps to calculate force`

**Expected Result:**
- Content Type: `numbered`
- Position: Row 6, Columns 2-12 (indented)
- Styling: Normal font with number prefix
- Educational Flow: Continuing list format

---

### Test 6: Mathematical Formula
**Prompt:** `Write the formula F = ma`

**Expected Result:**
- Content Type: `formula`
- Position: Row 7, Columns 4-9 (centered, narrower)
- Styling: Monospace font, centered alignment
- Mathematical Content: Properly detected

---

### Test 7: Example Content
**Prompt:** `Give an example of the first law in action`

**Expected Result:**
- Content Type: `example`
- Position: Row 8, Columns 2-11 (slightly indented)
- Styling: Normal font with background highlight
- Educational Flow: Formula → Example

---

### Test 8: Side Note
**Prompt:** `Add a note about historical context`

**Expected Result:**
- Content Type: `note`
- Position: Row 9, Columns 8-12 (right-aligned)
- Styling: Small font, italic, right side
- Layout: Side note positioning

---

### Test 9: Subheading
**Prompt:** `Write subheading "Applications in Daily Life"`

**Expected Result:**
- Content Type: `subheading`
- Position: Row 10, Columns 3-11 (more indented than heading)
- Styling: Medium font, semi-bold
- Hierarchy: Proper subsection formatting

---

### Test 10: Summary Content
**Prompt:** `Write a summary of Newton's first law`

**Expected Result:**
- Content Type: `summary`
- Position: Row 11, Columns 1-12 (full width)
- Styling: Medium weight font with top border
- Educational Flow: Concluding content

---

## Validation Checklist

After completing all tests, verify:

### ✅ Content Type Detection
- [ ] Title: Detected from "main title" instruction
- [ ] Heading: Detected from "heading" instruction  
- [ ] Definition: Detected from "explain the definition" instruction
- [ ] Bullet: Detected from "list the key points" instruction
- [ ] Numbered: Detected from "write the steps" instruction
- [ ] Formula: Detected from mathematical content "F = ma"
- [ ] Example: Detected from "give an example" instruction
- [ ] Note: Detected from "add a note" instruction
- [ ] Subheading: Detected from "subheading" instruction
- [ ] Summary: Detected from "summary" instruction

### ✅ Grid Positioning
- [ ] Title: Centered (columns 3-10)
- [ ] Heading: Left-aligned with slight indent (columns 2-11)
- [ ] Definition: Full width (columns 1-12)
- [ ] Bullet: Indented (columns 2-12)
- [ ] Numbered: Indented (columns 2-12)
- [ ] Formula: Centered narrow (columns 4-9)
- [ ] Example: Slightly indented (columns 2-11)
- [ ] Note: Right-aligned (columns 8-12)
- [ ] Subheading: More indented (columns 3-11)
- [ ] Summary: Full width (columns 1-12)

### ✅ Styling Application
- [ ] Title: Extra large, bold, centered
- [ ] Heading: Large, bold, left-aligned
- [ ] Definition: Normal, left-aligned
- [ ] Bullet: Normal with bullet marker
- [ ] Numbered: Normal with number marker
- [ ] Formula: Monospace, centered
- [ ] Example: Normal with highlight
- [ ] Note: Small, italic
- [ ] Subheading: Medium, semi-bold
- [ ] Summary: Medium weight with border

### ✅ Educational Flow
- [ ] Logical sequence: Title → Heading → Definition → Details
- [ ] Proper spacing between content types
- [ ] Consistent row progression (no overlaps)
- [ ] Appropriate content hierarchy

### ✅ Technical Validation
- [ ] All coordinates are numbers (not undefined)
- [ ] Grid positions stored in metadata
- [ ] Content type metadata present
- [ ] No console errors during creation
- [ ] Proper canvas coordinate conversion

---

## Expected Canvas Layout

After all tests, your canvas should look like this:

```
Row 1:  [      Newton's Laws of Motion        ] ← Title (centered)
Row 2:  [                                     ] ← Spacing
Row 3:  [First Law of Motion                  ] ← Heading (left)
Row 4:  [An object at rest stays at rest...   ] ← Definition (full width)
Row 5:  [• Key points about inertia           ] ← Bullet (indented)
Row 6:  [1. Steps to calculate force          ] ← Numbered (indented)
Row 7:  [         F = ma                      ] ← Formula (centered)
Row 8:  [Example of first law in action       ] ← Example (highlighted)
Row 9:  [                    Historical note  ] ← Note (right-aligned)
Row 10: [   Applications in Daily Life        ] ← Subheading (indented)
Row 11: [Summary of Newton's first law...     ] ← Summary (full width)
```

---

## Troubleshooting

If any test fails:

1. **Check Console Output**: Look for the shape object in browser/server console
2. **Verify Content Type**: Check `meta.contentType` in the shape
3. **Check Grid Position**: Look for `meta.gridPosition` JSON string
4. **Validate Coordinates**: Ensure x,y are numbers, not undefined
5. **Review Detection Logic**: Check if instruction keywords triggered correct detection

---

## Performance Notes

- Each request should be faster than the old coordinate-based system
- AI context is much smaller (only current row + recent content)
- No complex spatial calculations needed
- Grid positioning is deterministic and consistent

---

## Next Steps

Once all tests pass:
- ✅ Step 2 is fully validated and working
- 🚀 Ready to proceed with Step 3: Camera Management System
- 📊 Performance improvements confirmed
- 🎯 Educational content flow established 