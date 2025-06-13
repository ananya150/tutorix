# Camera Management Test

## Purpose
Test the smart camera positioning system that automatically moves the camera to show new content with proper context.

## Camera Management Features ✨
- **Automatic Positioning**: Camera moves to show new content being added
- **Context Awareness**: Always shows 5 empty rows below new content for context
- **Early Content Handling**: For rows < 12, shows from row 1
- **Late Content Handling**: For rows ≥ 12, positions optimally with context
- **LLM-Driven**: AI decides camera positioning based on content location

## Test Sequence

### Test 1: Early Content (Row < 12)
1. **Clear the canvas** (refresh if needed)
2. **Scroll away** from the top (scroll down significantly)
3. **Enter prompt**: `Add a title "Introduction to Physics" in row 1`
4. **Expected**: 
   - Camera moves to show from row 1
   - Title appears at the top
   - User can see the new content immediately

### Test 2: Mid-Range Content (Row ≥ 12)
1. **Scroll away** from the content area
2. **Enter prompt**: `Add a heading "Advanced Topics" in row 15`
3. **Expected**:
   - Camera moves to show row 15 with context
   - At least 5 empty rows visible below row 15
   - Heading appears and is immediately visible

### Test 3: Late Content (High Row Number)
1. **Scroll to a different area**
2. **Enter prompt**: `Add content "Deep Learning Concepts" in row 25`
3. **Expected**:
   - Camera moves to show row 25 with proper context
   - 5 empty rows visible below row 25
   - Content appears and is immediately visible

### Test 4: Multiple Content Additions
1. **Enter prompt**: `Add "Section A" in row 30`
2. **Wait for camera movement**
3. **Enter prompt**: `Add "Section B" in row 32`
4. **Expected**:
   - First camera movement to show row 30
   - Second camera movement to show row 32
   - Both pieces of content visible with context

### Test 5: User Scroll Away Test
1. **Add content**: `Add "Test Content" in row 40`
2. **Manually scroll away** from row 40
3. **Add more content**: `Add "New Content" in row 42`
4. **Expected**:
   - Camera automatically moves back to show row 42
   - User doesn't miss the new content being added

## Success Criteria

✅ **Automatic Camera Movement**:
- Camera moves automatically when new content is added
- No manual scrolling needed to see new content

✅ **Proper Context Display**:
- Early content (row < 12): Shows from row 1
- Late content (row ≥ 12): Shows target row with 5 empty rows below

✅ **Smooth User Experience**:
- Users never miss new content being added
- Camera positioning feels natural and intuitive

✅ **LLM Integration**:
- AI sends camera events before content creation
- Camera positioning reasoning is logged

## Debug Information

Check browser console for debug logs:
- `📹 Processing camera event`
- `📹 Camera calculation inputs`
- `📹 Camera calculation result`
- `📹 Camera change created`

## Expected Camera Behavior

### For Row 1-11:
```
Camera Position: Show from row 1
Visible Rows: 1-12 (approximately)
Reasoning: "Early content, showing from beginning for full context"
```

### For Row 15:
```
Camera Position: Show rows 4-15 (with 5 empty rows below)
Visible Rows: 4-15
Reasoning: "Target row 15 positioned with 5 empty rows below"
```

### For Row 25:
```
Camera Position: Show rows 18-29 (with 4 empty rows below)
Visible Rows: 18-29  
Reasoning: "Target row 25 positioned with 5 empty rows below"
```

## Implementation Notes

The camera management system works by:
1. **LLM Analysis**: AI determines optimal camera position based on target row
2. **Camera Event**: AI sends camera positioning event first
3. **Content Creation**: AI then creates the actual content
4. **Automatic Application**: System applies camera position automatically

This ensures users always see new content being added, creating a smooth and intuitive whiteboard experience similar to watching a teacher write on a physical whiteboard. 