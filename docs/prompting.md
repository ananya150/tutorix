We have a whiteboard which you can control via prompts. YOU CAN ONLY WRITE TEXTS OVER THE BOARD. This prompting.md file contains the best practices to prompting. Don't hesitate to leave 1-2 row gaps as texts might wrap and take multiple rows.

**🚨 CRITICAL: ALWAYS use fractional widths like `width 1/2`, `width 3/4`, `width 1/1`. NEVER use `width 1` (becomes 1px!) or decimal numbers like `width 0.5`.**

# AI Whiteboard Prompting Guide: Explicit Positioning System

## Table of Contents
1. [System Overview](#system-overview)
2. [Canvas Layout & Coordinate System](#canvas-layout--coordinate-system)
3. [Prompt Structure & Parameters](#prompt-structure--parameters)
4. [Positioning System](#positioning-system)
5. [Text Styling Options](#text-styling-options)
6. [Educational Content Patterns](#educational-content-patterns)
7. [Best Practices](#best-practices)
8. [Common Examples](#common-examples)
9. [Troubleshooting](#troubleshooting)

---

## System Overview

This AI whiteboard uses an **explicit positioning system** where you specify exactly where content should appear using semantic parameters instead of pixel coordinates. The system automatically handles:

- **Responsive layout** - Adapts to different screen sizes
- **Smart camera management** - Automatically positions viewport to show new content
- **Consistent styling** - Applies appropriate fonts, sizes, and spacing
- **Educational layout patterns** - Optimized for teaching scenarios

### Key Principles
- **Row-based positioning** - Content is placed in numbered rows (1, 2, 3, ...)
- **Fractional widths** - Text boxes use fractions of canvas width (1/4, 1/2, 3/4, etc.)
- **Named positions** - Use semantic positions (left, center, right) or precise fractions (0.0-1.0)
- **Automatic spacing** - System handles margins, padding, and text flow

---

## Canvas Layout & Coordinate System

### Canvas Dimensions
- **Total width**: Responsive (typically ~1461px)
- **Content area**: 5/6 of total width (~1278px)
- **Horizontal margins**: 1/16 of total width on each side (~91px)
- **Row height**: Responsive (typically ~66px, minimum 60px)
- **Top margin**: 1/24 of screen height (~33px)

### Visual Layout
```
┌─────────────────────────────────────────────────────────────┐
│ [margin]                                         [margin]   │
│ [margin]  ┌─────────────────────────────────┐   [margin]   │
│ [margin]  │                                 │   [margin]   │
│ [margin]  │        CONTENT AREA             │   [margin]   │
│ [margin]  │     (Canvas Width 5/6)          │   [margin]   │
│ [margin]  │                                 │   [margin]   │
│ [margin]  │  Row 1: [Text content here]    │   [margin]   │
│ [margin]  │  Row 2: [Text content here]    │   [margin]   │
│ [margin]  │  Row 3: [Text content here]    │   [margin]   │
│ [margin]  │  ...                            │   [margin]   │
│ [margin]  └─────────────────────────────────┘   [margin]   │
│ [margin]                                         [margin]   │
└─────────────────────────────────────────────────────────────┘
```

### Row System
- **Row 1**: Top of content area (y ≈ 33px)
- **Row 2**: Second row (y ≈ 99px)  
- **Row 3**: Third row (y ≈ 165px)
- **Row N**: Nth row (y ≈ 33 + (N-1) × 66px)
- **Infinite rows**: Canvas extends downward as needed

---

## Prompt Structure & Parameters

### Basic Prompt Format
```
Create textbox with "[CONTENT]" in row [ROW], [POSITION], width [WIDTH], [STYLING_OPTIONS]
```

### Required Parameters

#### 1. Content Text
- **Format**: Quoted string
- **Example**: `"Newton's Laws of Motion"`
- **Notes**: Use quotes to clearly define text boundaries

#### 2. Row Number
- **Format**: `row [NUMBER]`
- **Range**: 1 to ∞ (positive integers)
- **Examples**: `row 1`, `row 15`, `row 100`
- **Notes**: Rows are numbered sequentially from top

#### 3. Horizontal Position
- **Named positions**:
  - `left` - Aligns to left edge of content area
  - `center` - Centers within content area  
  - `right` - Aligns to right edge of content area
- **Fractional positions** (0.0 to 1.0):
  - `0.0` - Far left edge
  - `0.25` - Quarter from left
  - `0.5` - Exact center
  - `0.75` - Three-quarters from left
  - `1.0` - Far right edge
- **Examples**: `center position`, `left position`, `position 0.33`

#### 4. Width Specification
- **ALWAYS use fractional widths** (NEVER use decimal numbers):
  - `width 1/4` - Quarter of canvas width
  - `width 1/3` - Third of canvas width
  - `width 1/2` - Half of canvas width  
  - `width 2/3` - Two-thirds of canvas width
  - `width 3/4` - Three-quarters of canvas width
  - `width 1/1` - Full canvas width (NOT `width 1`)
- **NEVER use**:
  - `width 1` (this becomes 1px!)
  - `width 0.5` (use `width 1/2` instead)
  - `width 300px` (pixel widths not recommended)

### Optional Styling Parameters

#### Text Alignment
- `textAlign left` - Left-aligned text (default)
- `textAlign center` - Center-aligned text
- `textAlign right` - Right-aligned text

#### Font Size
- `fontSize small` - Small text (~12px)
- `fontSize normal` - Normal text (~16px, default)
- `fontSize large` - Large text (~20px)
- `fontSize xlarge` - Extra large text (~24px)

#### Font Weight
- `fontWeight normal` - Normal weight (default)
- `fontWeight bold` - Bold text
- `fontWeight light` - Light weight

#### Text Color
- `color black` - Black text (default)
- `color blue` - Blue text
- `color red` - Red text
- `color green` - Green text
- `color grey` - Grey text

#### Bullet Points
- `bullet true` - Adds bullet point (•) prefix
- `bullet false` - No bullet point (default)

---

## Positioning System

### Understanding Position + Width Combinations

The positioning system works by:
1. **Width** determines how wide the text box is
2. **Position** determines where the text box starts horizontally
3. **Text alignment** determines how text flows within the box

### Common Position + Width Patterns

#### Centered Content
```
# Large centered title
Create textbox with "Main Title" in row 1, center position, width 3/4, textAlign center

# Medium centered heading  
Create textbox with "Section Heading" in row 3, center position, width 1/2, textAlign center
```

#### Left-Aligned Content
```
# Full-width paragraph
Create textbox with "This is a paragraph..." in row 5, left position, width 1

# Indented bullet point
Create textbox with "Key point here" in row 7, position 0.1, width 4/5, bullet true
```

#### Multi-Column Layout
```
# Left column (first third)
Create textbox with "Left content" in row 10, position 0.0, width 1/3

# Right column (last third)  
Create textbox with "Right content" in row 10, position 0.67, width 1/3
```

### Position Calculation Examples

For a canvas width of 1278px:

#### Width 1/2 (639px), Center Position
- Text box width: 639px
- Position calculation: (1278 - 639) / 2 = 319px from left
- Result: Text box spans from 319px to 958px

#### Width 1/3 (426px), Position 0.33
- Text box width: 426px  
- Position calculation: 0.33 × 1278 = 422px from left
- Result: Text box spans from 422px to 848px

#### Width 3/4 (958px), Left Position
- Text box width: 958px
- Position calculation: 0px from left (left edge)
- Result: Text box spans from 0px to 958px

---

## Text Styling Options

### Font Size Guidelines

#### Educational Content Hierarchy
- **xlarge** (24px): Main lesson titles, chapter headings
- **large** (20px): Section headings, major topics
- **normal** (16px): Body text, definitions, explanations
- **small** (12px): Notes, citations, supplementary info

#### Visual Impact
```
fontSize xlarge  → VERY PROMINENT
fontSize large   → Prominent  
fontSize normal  → Standard
fontSize small   → Subtle
```

### Font Weight Usage

#### Content Types
- **bold**: Titles, headings, key terms, important concepts
- **normal**: Regular text, explanations, descriptions
- **light**: Subtle notes, metadata, less important info

### Color Coding System

#### Semantic Colors
- **black**: Default text, main content
- **blue**: Links, references, technical terms
- **red**: Warnings, errors, critical information
- **green**: Success, positive examples, correct answers
- **grey**: Notes, metadata, less important text

### Text Alignment Patterns

#### Center Alignment
- Titles and headings
- Formulas and equations
- Important announcements
- Section dividers

#### Left Alignment  
- Body paragraphs
- Bullet points and lists
- Definitions
- Most regular content

#### Right Alignment
- Rarely used
- Page numbers or metadata
- Special formatting needs

---

## Educational Content Patterns

### Lesson Structure Template

#### 1. Lesson Title (Row 1)
```
Create textbox with "Newton's Laws of Motion" in row 1, center position, width 3/4, fontSize xlarge, fontWeight bold, textAlign center
```

#### 2. Section Heading (Row 3)
```
Create textbox with "First Law of Motion" in row 3, left position, width 2/3, fontSize large, fontWeight bold
```

#### 3. Definition (Row 4)
```
Create textbox with "An object at rest stays at rest, and an object in motion stays in motion, unless acted upon by an external force." in row 4, left position, width 1/1, fontSize normal
```

#### 4. Key Points (Rows 6-8)
```
Create textbox with "Objects resist changes in motion" in row 6, position 0.1, width 5/6, fontSize normal, bullet true

Create textbox with "Inertia depends on mass" in row 7, position 0.1, width 5/6, fontSize normal, bullet true

Create textbox with "External force is required to change motion" in row 8, position 0.1, width 5/6, fontSize normal, bullet true
```

#### 5. Formula (Row 10)
```
Create textbox with "F = ma (when F = 0, a = 0)" in row 10, center position, width 1/2, fontSize large, textAlign center, fontWeight bold
```

### Content Type Patterns

#### Titles and Headers
```
# Main title - very prominent
row 1, center position, width 3/4, fontSize xlarge, fontWeight bold, textAlign center

# Section header - prominent, left-aligned
row N, left position, width 2/3, fontSize large, fontWeight bold

# Subsection header - medium prominence
row N, position 0.05, width 9/10, fontSize normal, fontWeight bold
```

#### Body Content
```
# Full paragraph - spans full width
row N, left position, width 1/1, fontSize normal

# Indented paragraph - slightly inset
row N, position 0.05, width 9/10, fontSize normal

# Definition box - centered, medium width
row N, center position, width 2/3, fontSize normal
```

#### Lists and Bullets
```
# Bullet point - indented with bullet
row N, position 0.1, width 5/6, bullet true

# Numbered item - indented, manual numbering
row N, position 0.1, width 5/6, text starts with "1. "

# Sub-bullet - more indented
row N, position 0.15, width 4/5, bullet true
```

#### Special Content
```
# Formula - centered, prominent
row N, center position, width 1/2, fontSize large, textAlign center, fontWeight bold

# Note - right-aligned, smaller
row N, position 0.6, width 1/3, fontSize small, color grey

# Warning - full width, red
row N, left position, width 1/1, color red, fontWeight bold
```

### Multi-Column Layouts

#### Two-Column Layout
```
# Left column header
Create textbox with "Advantages" in row 10, position 0.0, width 2/5, fontSize large, fontWeight bold

# Right column header  
Create textbox with "Disadvantages" in row 10, position 0.55, width 2/5, fontSize large, fontWeight bold

# Left column content
Create textbox with "• Easy to understand" in row 11, position 0.0, width 2/5, bullet true

# Right column content
Create textbox with "• Limited applications" in row 11, position 0.55, width 2/5, bullet true
```

#### Three-Column Layout
```
# Column headers
Create textbox with "Theory" in row 5, position 0.0, width 3/10, fontSize normal, fontWeight bold, textAlign center

Create textbox with "Application" in row 5, position 0.35, width 3/10, fontSize normal, fontWeight bold, textAlign center

Create textbox with "Example" in row 5, position 0.7, width 3/10, fontSize normal, fontWeight bold, textAlign center
```

---

## Best Practices

### Content Organization

#### 1. Use Consistent Row Spacing
```
✅ Good - Consistent spacing
Row 1: Title
Row 3: Heading (2 rows gap)
Row 4: Content (1 row gap)
Row 6: Next heading (2 rows gap)

❌ Bad - Inconsistent spacing  
Row 1: Title
Row 2: Heading (1 row gap)
Row 3: Content (1 row gap)
Row 8: Next heading (5 rows gap)
```

#### 2. Maintain Visual Hierarchy
```
✅ Good - Clear hierarchy
fontSize xlarge + bold → Main title
fontSize large + bold → Section headers  
fontSize normal → Body text
fontSize small → Notes

❌ Bad - Confusing hierarchy
fontSize normal → Title
fontSize xlarge → Body text
```

#### 3. Use Appropriate Widths
```
✅ Good - Width matches content
Titles: width 3/4 (prominent but not overwhelming)
Paragraphs: width 1/1 (full readability)
Bullets: width 5/6 (indented appropriately)

❌ Bad - Width doesn't match content
Titles: width 1/4 (too narrow, hard to read)
Paragraphs: width 1/8 (extremely narrow)
```

### Positioning Guidelines

#### 1. Center Important Content
- Titles, formulas, key concepts
- Use `center position` with appropriate width
- Combine with `textAlign center` for full centering

#### 2. Left-Align Reading Content
- Paragraphs, definitions, explanations
- Use `left position` or small offset like `position 0.05`
- Maintain consistent left margin

#### 3. Use Indentation for Hierarchy
```
Main point: position 0.0
  Sub-point: position 0.1  
    Detail: position 0.15
```

#### 4. Create Visual Breathing Room
- Don't fill every row
- Leave empty rows between sections
- Use appropriate widths (not always full width)

### Styling Consistency

#### 1. Establish Style Patterns
```
# Define your patterns and stick to them
Main titles: fontSize xlarge, fontWeight bold, center position, width 3/4
Section headers: fontSize large, fontWeight bold, left position, width 2/3  
Body text: fontSize normal, left position, width 1/1
Bullets: fontSize normal, position 0.1, width 5/6, bullet true
```

#### 2. Use Color Purposefully
- Don't overuse colors
- Establish meaning (red = warning, blue = link, etc.)
- Keep most content black for readability

#### 3. Be Consistent with Alignment
- Don't mix `textAlign center` and `center position` randomly
- Use center alignment for titles and formulas
- Use left alignment for reading content

---

## Common Examples

### Example 1: Physics Lesson
```
Create textbox with "Newton's Laws of Motion" in row 1, center position, width 3/4, fontSize xlarge, fontWeight bold, textAlign center

Create textbox with "First Law of Motion (Law of Inertia)" in row 3, left position, width 2/3, fontSize large, fontWeight bold

Create textbox with "An object at rest stays at rest, and an object in motion stays in motion, unless acted upon by an external force." in row 4, left position, width 1/1, fontSize normal

Create textbox with "Objects resist changes in motion" in row 6, position 0.1, width 5/6, fontSize normal, bullet true

Create textbox with "Inertia depends on mass" in row 7, position 0.1, width 5/6, fontSize normal, bullet true

Create textbox with "F = ma (when F = 0, a = 0)" in row 9, center position, width 1/2, fontSize large, fontWeight bold, textAlign center
```

### Example 2: Math Problem
```
Create textbox with "Quadratic Equations" in row 1, center position, width 1/2, fontSize xlarge, fontWeight bold, textAlign center

Create textbox with "Standard Form:" in row 3, left position, width 1/4, fontSize normal, fontWeight bold

Create textbox with "ax² + bx + c = 0" in row 3, position 0.3, width 1/2, fontSize large, fontWeight bold

Create textbox with "Quadratic Formula:" in row 5, left position, width 1/4, fontSize normal, fontWeight bold

Create textbox with "x = (-b ± √(b² - 4ac)) / 2a" in row 5, position 0.3, width 1/2, fontSize large, fontWeight bold
```

### Example 3: Comparison Table
```
Create textbox with "Comparison: Classical vs Quantum Physics" in row 1, center position, width 3/4, fontSize large, fontWeight bold, textAlign center

Create textbox with "Classical Physics" in row 3, position 0.0, width 2/5, fontSize normal, fontWeight bold, textAlign center

Create textbox with "Quantum Physics" in row 3, position 0.55, width 2/5, fontSize normal, fontWeight bold, textAlign center

Create textbox with "• Deterministic behavior" in row 4, position 0.0, width 2/5, fontSize normal, bullet true

Create textbox with "• Probabilistic behavior" in row 4, position 0.55, width 2/5, fontSize normal, bullet true

Create textbox with "• Continuous values" in row 5, position 0.0, width 2/5, fontSize normal, bullet true

Create textbox with "• Discrete energy levels" in row 5, position 0.55, width 2/5, fontSize normal, bullet true
```

### Example 4: Step-by-Step Process
```
Create textbox with "How to Solve Linear Equations" in row 1, center position, width 2/3, fontSize xlarge, fontWeight bold, textAlign center

Create textbox with "Step 1: Isolate the variable term" in row 3, left position, width 3/4, fontSize normal, fontWeight bold

Create textbox with "Move all terms with the variable to one side of the equation" in row 4, position 0.1, width 5/6, fontSize normal

Create textbox with "Step 2: Isolate the variable" in row 6, left position, width 3/4, fontSize normal, fontWeight bold

Create textbox with "Divide both sides by the coefficient of the variable" in row 7, position 0.1, width 5/6, fontSize normal

Create textbox with "Step 3: Check your answer" in row 9, left position, width 3/4, fontSize normal, fontWeight bold

Create textbox with "Substitute your solution back into the original equation" in row 10, position 0.1, width 5/6, fontSize normal
```

---

## Troubleshooting

### Common Issues and Solutions

#### Issue: Text appears off-center
**Problem**: Using `center position` but text looks shifted
**Solution**: Make sure to also use `textAlign center` for full centering
```
❌ Create textbox with "Title" in row 1, center position, width 1/2
✅ Create textbox with "Title" in row 1, center position, width 1/2, textAlign center
```

#### Issue: Text is too wide/narrow
**Problem**: Width doesn't match content type
**Solution**: Choose appropriate width for content
```
❌ Create textbox with "Very long paragraph..." in row 5, center position, width 1/4
✅ Create textbox with "Very long paragraph..." in row 5, left position, width 1
```

#### Issue: Poor visual hierarchy
**Problem**: All text looks the same importance
**Solution**: Use different font sizes and weights
```
❌ All content: fontSize normal
✅ Title: fontSize xlarge, fontWeight bold
✅ Headers: fontSize large, fontWeight bold  
✅ Body: fontSize normal
```

#### Issue: Content overlaps
**Problem**: Multiple items in same row with overlapping positions
**Solution**: Use different rows or ensure positions don't overlap
```
❌ Both in row 5:
    position 0.0, width 3/5
    position 0.4, width 3/5  (overlaps!)
    
✅ Fix option 1 - Different rows:
    Row 5: position 0.0, width 3/5
    Row 6: position 0.0, width 3/5
    
✅ Fix option 2 - Non-overlapping positions:
    Row 5: position 0.0, width 2/5
    Row 5: position 0.55, width 2/5
```

#### Issue: Inconsistent spacing
**Problem**: Irregular gaps between content
**Solution**: Plan row usage consistently
```
❌ Irregular: rows 1, 2, 5, 6, 12
✅ Consistent: rows 1, 3, 4, 6, 7, 9
```

### Parameter Validation

#### Valid Row Numbers
- ✅ `row 1`, `row 15`, `row 100`
- ❌ `row 0`, `row -5`, `row 1.5`

#### Valid Positions
- ✅ `left position`, `center position`, `right position`
- ✅ `position 0.0`, `position 0.5`, `position 1.0`
- ❌ `position -0.1`, `position 1.5`, `middle position`

#### Valid Widths
- ✅ `width 1/4`, `width 1/3`, `width 1/2`, `width 2/3`, `width 3/4`, `width 1/1`
- ❌ `width 1` (becomes 1px!), `width 0.5` (use `width 1/2`), `width 0`, `width 2`, `width -0.5`

#### Valid Font Sizes
- ✅ `fontSize small`, `fontSize normal`, `fontSize large`, `fontSize xlarge`
- ❌ `fontSize tiny`, `fontSize huge`, `fontSize 16px`

#### Valid Colors
- ✅ `color black`, `color blue`, `color red`, `color green`, `color grey`
- ❌ `color purple`, `color yellow`, `color #FF0000`

---

## Advanced Techniques

### Creating Complex Layouts

#### Nested Indentation
```
Create textbox with "Main Topic" in row 1, left position, width 1/1, fontSize large, fontWeight bold

Create textbox with "Subtopic A" in row 2, position 0.05, width 9/10, fontSize normal, fontWeight bold

Create textbox with "Detail 1" in row 3, position 0.1, width 5/6, fontSize normal, bullet true

Create textbox with "Detail 2" in row 4, position 0.1, width 5/6, fontSize normal, bullet true

Create textbox with "Sub-detail" in row 5, position 0.15, width 4/5, fontSize normal, bullet true
```

#### Mixed Column Layouts
```
# Full width header
Create textbox with "Comparison Analysis" in row 1, center position, width 3/4, fontSize xlarge, fontWeight bold, textAlign center

# Two-column section
Create textbox with "Pros" in row 3, position 0.0, width 2/5, fontSize large, fontWeight bold, textAlign center

Create textbox with "Cons" in row 3, position 0.55, width 2/5, fontSize large, fontWeight bold, textAlign center

# Back to full width
Create textbox with "Conclusion: Based on the analysis above..." in row 8, left position, width 1/1, fontSize normal
```

#### Callout Boxes
```
# Main content
Create textbox with "Regular paragraph content here..." in row 5, left position, width 1/1, fontSize normal

# Callout box - indented and styled differently
Create textbox with "Important Note: This is a key concept to remember" in row 7, position 0.1, width 4/5, fontSize normal, fontWeight bold, color blue

# Back to main content
Create textbox with "Continuing with regular content..." in row 9, left position, width 1/1, fontSize normal
```

### Responsive Design Considerations

The system automatically handles different screen sizes, but you can optimize for better responsive behavior:

#### Use Relative Widths
```
✅ Good - Scales with screen size
width 1/2, width 3/4, width 1

❌ Less ideal - Fixed regardless of screen
width 300px, width 500px
```

#### Consider Mobile-Friendly Patterns
```
# Desktop-friendly: narrow centered content
Create textbox with "Title" in row 1, center position, width 1/2, textAlign center

# Mobile-friendly: wider content for readability  
Create textbox with "Title" in row 1, center position, width 3/4, textAlign center
```

---

This comprehensive guide should enable any LLM to create well-structured, visually appealing educational content using the explicit positioning system. The key is to think semantically about content hierarchy and use the positioning parameters to create clear, readable layouts that enhance learning. 