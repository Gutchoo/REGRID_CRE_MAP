# CSV Upload Testing Guide

This guide walks through testing each checkpoint of the CSV upload flow for APN-based property imports.

## Test Data Setup

### Available Test Files
- **CSV File**: `test-data.csv` (contains 5 test APNs)
- **Cached Regrid Data**: 6 test APNs with cached responses in `src/lib/test-data/`

### Test APNs (with cached data)
```
0254282260000  - Original test APN
50183176       - New test APN #1
505090290      - New test APN #2  
505210810      - New test APN #3
0253204080000  - New test APN #4
628081041      - New test APN #5
```

**Note**: All APNs are automatically cleaned (dashes removed) before saving to Supabase. For example:
- Input: `0254-282-260000` → Stored: `0254282260000`
- Input: `50-18-31-76` → Stored: `50183176`

## Testing Checkpoints

### Checkpoint 1: CSV File Upload & Validation
**Location**: `/upload` page → CSV Upload tab  
**Test**: Upload `test-data.csv`

**Expected Results**:
✅ File uploads successfully  
✅ Validation passes with "APN" format detected  
✅ Shows preview of 5 APNs  
✅ Upload button becomes enabled  

**Error Cases to Test**:
- Upload file without APN column → Should show validation error
- Upload file with empty APN values → Should show validation error

### Checkpoint 2: CSV Parsing
**Location**: After clicking "Upload Properties"  
**Test**: Monitor browser console logs

**Expected Results**:
✅ Console shows: "Checking for duplicate APNs before upload..."  
✅ Console shows: "Duplicate check results: X duplicates, Y unique"  
✅ All 5 APNs parsed correctly from CSV  

### Checkpoint 3: Duplicate Detection
**Test Cases**:

**3A: First-time upload (no duplicates)**
✅ All 5 APNs should be marked as unique  
✅ No duplicate errors in results  

**3B: Re-upload same CSV (duplicates exist)**
✅ All 5 APNs should be detected as duplicates  
✅ Upload should complete but show 5 duplicate errors  
✅ No new properties created  

### Checkpoint 4: Regrid API Integration
**Location**: Monitor console logs during upload  
**Test**: Watch for cached data usage

**Expected Results**:
✅ Console shows: "🧪 Using cached test data for APN: [APN]"  
✅ Console shows: "✅ Loaded cached test data for APN: [APN]"  
✅ No actual API calls made to Regrid (saves costs)  

### Checkpoint 5: Database Storage
**Location**: Dashboard page after upload  
**Test**: Verify properties saved with rich data

**Expected Results**:
✅ All 5 properties appear in dashboard  
✅ Properties show rich data (owner, address, coordinates, etc.)  
✅ Each property has complete Regrid data populated  

### Checkpoint 6: Progress Tracking
**Location**: Upload progress bar during processing  

**Expected Results**:
✅ Progress bar shows accurate progress  
✅ Progress updates smoothly from 0% to 100%  
✅ Upload completes with success message  

### Checkpoint 7: Error Handling
**Test Cases**:

**7A: Network Error Simulation**
- Disconnect internet during upload
✅ Should show appropriate error messages  
✅ Should not crash the application  

**7B: Invalid APN Format**
- Create CSV with invalid APNs (empty, non-numeric, etc.)
✅ Should validate and show specific errors  

## Complete End-to-End Test

### Step 1: Clean State
1. Go to Dashboard
2. Delete any existing properties (if any)
3. Verify dashboard shows "No properties found"

### Step 2: First Upload
1. Go to Upload → CSV tab
2. Upload `test-data.csv`
3. Verify validation passes
4. Click "Upload Properties"
5. Watch progress bar complete
6. Verify success message shows "5 of 5 properties"

### Step 3: Verify Data
1. Click "View Properties" 
2. Verify all 5 properties appear
3. Check each property has:
   - Correct APN
   - Rich address data 
   - Owner information
   - Property values
   - Coordinates (lat/lng)

### Step 4: Test Duplicates
1. Go back to Upload → CSV tab
2. Upload same `test-data.csv` again
3. Verify duplicate detection works
4. Verify no new properties created
5. Check error report shows 5 duplicates

## Console Commands for Testing

### Check Cached Data Files
```bash
ls src/lib/test-data/
# Should show 6 regrid-*.json files
```

### View Test CSV Content
```bash
cat test-data.csv
# Should show:
# apn
# 50183176
# 505090290
# 505210810  
# 0253204080000
# 628081041
```

### Manual API Test (Individual APN)
Navigate to `/upload` → APN tab, enter test APN `50183176`:
✅ Should load cached data (check console)  
✅ Should show duplicate warning if already exists  
✅ Should populate with rich property data  

## Success Criteria

**All checkpoints pass** = CSV upload system working correctly  
**Any checkpoint fails** = Investigate specific issue  

The system should:
- Only accept APN-format CSV files
- Use cached test data to avoid API costs
- Detect and prevent duplicates
- Store rich property data in database
- Provide clear progress feedback
- Handle errors gracefully