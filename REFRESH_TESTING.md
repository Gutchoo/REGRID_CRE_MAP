# Property Refresh Feature Testing Guide

## Overview
The refresh functionality allows users to update existing property data with fresh information from the Regrid API without creating duplicates.

## Testing Steps

### Prerequisites
1. Have at least one property in your dashboard (upload using test-data.csv if needed)
2. Start development server: `npm run dev`
3. Navigate to: `http://localhost:3000/dashboard`

### Test Case 1: Successful Refresh
**Setup**: Property with valid APN (from test data)

**Steps**:
1. Go to Dashboard
2. Find a property card 
3. Click the 3-dot menu (⋮)
4. Click "Refresh Data"
5. Watch for loading spinner
6. Verify property data updates

**Expected Results**:
✅ Menu item shows "Refreshing..." with spinning icon  
✅ Console shows: "🔄 Refreshing property: [address]"  
✅ Console shows: "🧪 Using cached test data for APN: [apn]"  
✅ Console shows: "✅ Property refreshed successfully"  
✅ Property data updates in UI  
✅ User notes/tags preserved (if any)  

### Test Case 2: Property Without APN
**Setup**: Property without APN (shouldn't happen with current system, but good to test)

**Steps**:
1. Try to refresh a property without APN
2. Check error handling

**Expected Results**:
✅ Menu item is disabled  
✅ Shows appropriate error message  

### Test Case 3: Network Error Simulation
**Setup**: Stop development server while refreshing

**Steps**:
1. Click refresh
2. Quickly stop server
3. Check error handling

**Expected Results**:
✅ Shows error message  
✅ Spinner stops  
✅ UI doesn't crash  

### Test Case 4: Multiple Properties Refresh
**Steps**:
1. Try refreshing multiple properties rapidly
2. Verify each handles correctly

**Expected Results**:
✅ Only one property shows loading at a time  
✅ Each refresh completes independently  

## API Endpoint Testing

### Direct API Test
```bash
# Test the refresh endpoint directly
curl -X POST "http://localhost:3000/api/user-properties/[PROPERTY_ID]/refresh" \
  -H "Content-Type: application/json"
```

**Expected Response**:
```json
{
  "property": { /* updated property data */ },
  "message": "Property data refreshed successfully"
}
```

## Verification Checklist

### UI/UX
- [ ] Refresh icon appears in dropdown menu
- [ ] Loading state shows spinning icon
- [ ] Menu item disabled when no APN
- [ ] Error messages display clearly
- [ ] Success updates property immediately

### Backend
- [ ] API endpoint exists at `/api/user-properties/[id]/refresh`
- [ ] Fetches fresh Regrid data
- [ ] Preserves user-entered data (notes, tags, etc.)
- [ ] Updates all Regrid fields correctly
- [ ] Returns updated property data

### Data Integrity
- [ ] `regrid_id` gets updated from fresh API data
- [ ] All property values refresh (owner, year_built, etc.)
- [ ] User notes and tags remain unchanged
- [ ] `updated_at` timestamp changes
- [ ] No duplicate entries created
- [ ] APN field cleaned (dashes removed) before saving

### Error Handling
- [ ] Handles missing APN gracefully
- [ ] Shows network error messages
- [ ] Handles Regrid API failures
- [ ] Unauthorized requests rejected

## Console Commands for Debugging

### Check Property Data Before/After
```javascript
// In browser console after refresh
console.log('Properties:', properties)
```

### Monitor Network Requests
1. Open DevTools → Network tab
2. Refresh property
3. Look for POST to `/api/user-properties/[id]/refresh`
4. Check request/response data

## Success Criteria

**All tests pass** = Refresh functionality working correctly

The refresh feature should:
- Update properties with fresh Regrid data
- Preserve user-entered information
- Provide clear feedback during operation
- Handle errors gracefully
- Not create duplicate entries