# BuildGuard-AI Frontend Testing Guide

## Quick Start

**Frontend URL**: http://localhost:5173
**Dev Server**: `cd frontend && npm run dev`

---

## 1. **AUTHENTICATION FLOW TESTING**

### 1.1 User Registration
**Scenario**: New user registration with email verification

**Test Steps**:
1. Go to http://localhost:5173
2. Click "Get Started" or navigate to landing page
3. Click "Sign Up" → Go to `/register`
4. Enter details:
   - Email: `test@example.com`
   - Password: `TestPassword123!`
   - Confirm Password: `TestPassword123!`
   - Name: `Test User`
5. Click "Sign Up"
6. Verify success message: "Registration successful. Check your email for verification."
7. Should redirect to Email Verification page

**Expected**: Form validation, password strength check, success notification

---

### 1.2 Email Verification
**Scenario**: Complete email verification

**Test Steps**:
1. After registration, should see Email Verification page
2. Check backend logs for verification token (since email isn't fully configured in dev)
3. Alternatively, use API to verify manually (described below)
4. Page should display message: "Verification email sent to your-email@example.com"

**For Testing Without SMTP**:
```bash
# Use API directly to verify email
curl -X POST http://localhost:8001/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","token":"<token-from-backend-logs>"}'
```

**Expected**: After verification, redirect to login page

---

### 1.3 User Login
**Scenario**: Authenticated user login

**Test Steps**:
1. Go to http://localhost:5173/login
2. Enter credentials:
   - Email: `test@example.com`
   - Password: `TestPassword123!`
3. Click "Login"
4. Should display loading state
5. After successful login, redirect to `/dashboard`

**Expected**:
- JWT tokens stored in localStorage
- User info displayed in context
- Sidebar visible with navigation

**Check in Browser DevTools**:
```javascript
// Console: Check stored tokens
localStorage.getItem('access_token') // Should exist
localStorage.getItem('refresh_token') // Should exist
```

---

### 1.4 Forgot Password
**Scenario**: Password reset flow

**Test Steps**:
1. Go to http://localhost:5173/login
2. Click "Forgot Password?"
3. Go to `/forgot-password`
4. Enter email: `test@example.com`
5. Click "Send Reset Link"
6. Should display: "Reset link sent to your-email@example.com"

**For Testing Without SMTP**:
```bash
# Check backend logs for reset token
# Use API to generate token
curl -X POST http://localhost:8001/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

**Expected**: Email sent notification, token valid for 24 hours

---

### 1.5 Reset Password
**Scenario**: Complete password reset

**Test Steps**:
1. From forgot-password, receive reset token (check backend logs)
2. Navigate to: `http://localhost:5173/reset-password?token=<reset-token>`
3. Enter new password: `NewPassword456!`
4. Confirm: `NewPassword456!`
5. Click "Reset Password"
6. Should redirect to login page
7. Login with new password to verify

**Expected**: Password updated, old password no longer works

---

### 1.6 Protected Routes
**Scenario**: Verify unauthenticated users cannot access protected pages

**Test Steps**:
1. Clear localStorage: `localStorage.clear()` in console
2. Try to navigate to http://localhost:5173/dashboard
3. Should redirect to login page

**Expected**: Redirect to `/login`, cannot access protected routes without auth

---

## 2. **NAVIGATION & LAYOUT TESTING**

### 2.1 Desktop Sidebar Navigation
**Test Steps**:
1. Login to application
2. Sidebar should show:
   - BuildGuardAI logo
   - Dashboard
   - Sensor Analysis
   - Image Analysis
   - Reports
   - New Report button
   - Collapse button
3. Click each nav item and verify page loads
4. Click collapse button → sidebar width changes
5. Hover over collapsed items → tooltips/icons only

**Expected**: Smooth transitions, active state highlighting (terra color)

---

### 2.2 Mobile Navigation
**Test Steps** (use DevTools responsive mode or actual mobile):
1. Resize browser to mobile width (< 1024px)
2. Should see:
   - Mobile header with menu button
   - Hamburger menu icon (top-right)
   - Bottom tab navigation
3. Click hamburger → sidebar overlay
4. Click each nav item → closes overlay, navigates
5. Click bottom nav items → navigate pages

**Expected**: Mobile-first responsive design, no horizontal scroll

---

### 2.3 Page Transitions
**Test Steps**:
1. Navigate between pages
2. Verify smooth fade animations
3. Page should fade out → new page fades in
4. Loading states during data fetch

---

## 3. **IMAGE ANALYSIS TESTING**

### 3.1 Image Upload & Damage Detection
**Scenario**: Upload image for crack/damage detection

**Prerequisites**:
- Model training completed: `backend/saved_models/damage_detector.h5` exists
- Backend running: `python -m uvicorn backend.main:app --reload --port 8001`

**Test Steps**:
1. Login to dashboard
2. Navigate to "Image Analysis" (camera icon in sidebar)
3. Should see file upload area
4. Select image file with crack/damage (test with images from training dataset)
5. Click "Analyze" or upload automatically triggers
6. Loading spinner displays
7. Results shown:
   - Damage classification (e.g., "Damage Detected" or "No Damage")
   - Confidence percentage
   - Recommendations

**Expected Results**:
```
Input: Image with visible cracks
Output: "Damage Detected - Confidence: 92%"
        Recommendation: "Schedule immediate structural inspection"

Input: Image without damage
Output: "No Damage - Confidence: 88%"
        Recommendation: "Monitor structure. Conduct routine inspection annually."
```

---

### 3.2 Multiple Image Analysis
**Test Steps**:
1. Upload multiple images in succession
2. Each should be analyzed independently
3. History should show all analyzed images
4. Can download results

**Expected**: Previous analyses remain visible, no state pollution

---

### 3.3 Error Handling - Invalid File
**Test Steps**:
1. Try to upload non-image file (.txt, .pdf, etc.)
2. Or image with incorrect format
3. Should display error: "Invalid file type. Please upload an image."

**Expected**: User-friendly error message, form remains intact

---

### 3.4 Error Handling - Model Not Loaded
**Scenario**: Model file missing or not trained

**Test Steps**:
1. If model not trained, analyze image
2. Or simulate error by renaming model file

**Expected**: Error message displays, suggests training model

---

## 4. **SENSOR INPUT TESTING**

### 4.1 Sensor Data Entry
**Scenario**: Input sensor readings

**Test Steps**:
1. Navigate to "Sensor Analysis"
2. Should see form with input fields:
   - Temperature (°C)
   - Humidity (%RH)
   - Vibration (m/s²)
   - Pressure (kPa)
3. Enter sample values:
   - Temperature: 25
   - Humidity: 65
   - Vibration: 0.5
   - Pressure: 101.3
4. Click "Analyze" or "Submit"

**Expected**:
- Form validates input ranges
- Analysis results displayed
- Sensor data stored in backend

---

### 4.2 Sensor Data Validation
**Test Steps**:
1. Try entering invalid values:
   - Negative temperature
   - Humidity > 100%
   - Empty fields
2. Should show validation errors

**Expected**: Clear error messages, form prevents submission of invalid data

---

### 4.3 Sensor History
**Test Steps**:
1. Submit multiple sensor readings
2. View history/previous readings
3. Compare trends over time

**Expected**: Historical data displayed, accessible for audit

---

## 5. **REPORT MANAGEMENT TESTING**

### 5.1 Create New Report
**Scenario**: Create comprehensive inspection report

**Test Steps**:
1. Click "New Report" button (sidebar or bottom nav)
2. Go to `/new-report`
3. Form should include:
   - Report Title
   - Location
   - Date
   - Description
   - Severity Level (Normal/Minor/Major/Critical)
   - Upload images
   - Add sensor data
4. Fill out form:
   - Title: "Foundation Crack Assessment"
   - Location: "Building A, Floor 2"
   - Description: "Horizontal cracks visible on exterior wall"
   - Severity: "Major"
5. Click "Create Report"
6. Should redirect to reports list

**Expected**: Report created successfully, stored in backend, visible in list

---

### 5.2 View Reports List
**Scenario**: List all reports with details

**Test Steps**:
1. Navigate to "Reports"
2. Should display:
   - Report title
   - Location
   - Date created
   - Severity indicator (color-coded)
   - Status
3. Each report clickable for details

**Expected**: All reports visible, filterable/sortable if applicable

---

### 5.3 Report Details
**Scenario**: View full report information

**Test Steps**:
1. Click any report from list
2. Should display:
   - Full report content
   - Attached images
   - Analysis results
   - Timestamps
   - Severity badge
3. Option to:
   - Download as PDF (if implemented)
   - Edit report
   - Delete report

**Expected**: Complete report information accessible

---

### 5.4 Edit Report
**Test Steps** (if edit functionality exists):
1. Open report details
2. Click "Edit"
3. Modify fields (title, description, severity)
4. Click "Save"
5. Changes reflected in list and details

**Expected**: Report updated with new info, timestamps reflect change

---

### 5.5 Delete Report
**Test Steps**:
1. Open report
2. Click "Delete" or trash icon
3. Confirmation modal appears: "Are you sure?"
4. Click "Confirm Delete"
5. Redirect to reports list
6. Report no longer visible

**Expected**: Report deleted, confirmation message shown

---

## 6. **DASHBOARD TESTING**

### 6.1 Dashboard Overview
**Scenario**: View dashboard summary

**Test Steps**:
1. Login and go to `/dashboard`
2. Should display:
   - Quick stats (total reports, recent analyses)
   - Recent activity/submissions
   - Key metrics
   - Quick action buttons

**Expected**: Dashboard loads quickly, displays relevant data

---

### 6.2 Dashboard Responsiveness
**Test Steps**:
1. View on desktop (wide screen)
2. View on tablet (medium screen)
3. View on mobile (narrow screen)
4. All cards/stats should reorganize properly

**Expected**: No overflow, readable on all sizes

---

## 7. **ERROR HANDLING & EDGE CASES**

### 7.1 Network Error - Backend Offline
**Test Steps**:
1. Stop backend: `Ctrl+C` in backend terminal
2. Try to perform action (upload image, submit sensor data)
3. Should display error: "Cannot connect to server"

**Expected**: User-friendly error message, retry option

---

### 7.2 Session Expiration
**Test Steps**:
1. Login to dashboard
2. Wait for access token to expire (30 minutes, or manually set to 1 minute for testing)
3. Perform action that requires API call
4. App should:
   - Attempt to refresh token (using refresh_token)
   - If successful, retry operation silently
   - If refresh fails, redirect to login

**Expected**: Graceful handling, minimal user disruption

---

### 7.3 Invalid Token
**Test Steps**:
1. Manually edit localStorage and corrupt access_token
2. Try to navigate or perform action
3. Should detect invalid token and redirect to login

**Expected**: Automatic redirect to login, clear error handling

---

### 7.4 Toast Notifications
**Test Steps**:
1. Perform successful action (upload, login, create report)
2. Toast notification should appear (bottom-right or configured position)
3. Auto-dismiss after 3-5 seconds
4. Can dismiss manually

**Expected**: Clear success/error messages, no overlap

---

## 8. **FORM VALIDATION TESTING**

### 8.1 Login Form
**Test Steps**:
1. Leave email empty → Submit → Error: "Email is required"
2. Enter invalid email → Submit → Error: "Invalid email format"
3. Leave password empty → Submit → Error: "Password is required"
4. Enter correct credentials → Success

**Expected**: All validations working, clear error messages

---

### 8.2 Registration Form
**Test Steps**:
1. Passwords don't match → Error: "Passwords do not match"
2. Password too weak → Error: "Password must contain..."
3. Email already exists → Error: "Email already registered"
4. All fields valid → Success

**Expected**: Comprehensive validation, helpful messages

---

### 8.3 Report Form
**Test Steps**:
1. Leave required fields empty
2. Try to submit
3. Validation errors shown above each field

**Expected**: No submission without required data

---

## 9. **PERFORMANCE TESTING**

### 9.1 Image Upload Performance
**Test Steps**:
1. Upload large image (5MB+)
2. Monitor upload progress
3. Analyze time to process
4. Should complete < 30 seconds

**Expected**: Smooth progress indicator, no freezing

---

### 9.2 Page Load Times
**Test Procedure**:
1. Use DevTools Network tab
2. Load each page (Dashboard, Reports, etc.)
3. Check load times

**Expected**:
- Page ready: < 2 seconds
- Data loaded: < 3 seconds
- Smooth animations throughout

---

### 9.3 Memory Leaks
**Test Procedure**:
1. Open DevTools Performance tab
2. Navigate between pages 10+ times
3. Monitor memory usage (should not continuously increase)

**Expected**: Stable memory, no significant growth

---

## 10. **ACCESSIBILITY TESTING** (Optional)

### 10.1 Keyboard Navigation
**Test Steps**:
1. Use Tab key to navigate form fields
2. Use Enter to submit forms
3. Use Escape to close modals
4. All interactive elements reachable via keyboard

**Expected**: Full keyboard support, visible focus states

---

### 10.2 Color Contrast
**Test Steps**:
1. Use online tool: https://www.tpgi.com/color-contrast-checker/
2. Check all text against background
3. Verify >= 4.5:1 contrast ratio for readability

**Expected**: WCAG AA compliance

---

### 10.3 Screen Reader (Optional)
**Test Steps** (with screen reader like NVDA or JAWS):
1. Read through page content
2. Form labels properly associated
3. Image alt text present

---

## 11. **MANUAL TESTING CHECKLIST**

### Pre-Testing
- [ ] Backend running on `http://localhost:8001`
- [ ] Frontend running on `http://localhost:5173`
- [ ] Model trained: `backend/saved_models/damage_detector.h5` exists
- [ ] Browser: Chrome, Firefox, Safari (latest versions)
- [ ] DevTools open for debugging

### Authentication
- [ ] Register new user
- [ ] Verify email (via API if needed)
- [ ] Login successfully
- [ ] Logout works
- [ ] Forgot password flow works
- [ ] Protected routes redirect unauthenticated users

### Navigation
- [ ] Desktop sidebar works
- [ ] Mobile menu works
- [ ] All nav links navigate correctly
- [ ] Active page highlighted
- [ ] Page transitions smooth

### Image Analysis
- [ ] Upload crack image → Shows "Damage Detected"
- [ ] Upload normal image → Shows "No Damage"
- [ ] Multiple uploads work
- [ ] Invalid files rejected
- [ ] Results displayed with confidence

### Reports
- [ ] Create new report
- [ ] View all reports
- [ ] View report details
- [ ] Edit report (if available)
- [ ] Delete report

### Sensor Analysis
- [ ] Enter sensor data
- [ ] Validation works
- [ ] Submit sensor data
- [ ] History displays

### Responsive Design
- [ ] Desktop (1920px): Full layout
- [ ] Tablet (768px): Responsive stack
- [ ] Mobile (375px): Touch-friendly, no scroll
- [ ] All text readable
- [ ] All buttons clickable

### Error Handling
- [ ] Network errors handled
- [ ] Invalid data rejected
- [ ] Validation error messages clear
- [ ] Session expiration handled

---

## 12. **API TESTING (via cURL or Postman)**

### Test Image Analysis Endpoint
```bash
# Upload image and analyze
curl -X POST http://localhost:8001/api/image/analyze \
  -H "Authorization: Bearer <access_token>" \
  -F "file=@path/to/image.jpg"

# Expected Response:
{
  "confidence": 0.92,
  "damage_class": "crack",
  "recommendation": "Schedule immediate structural inspection"
}
```

---

### Test Sensor Endpoint
```bash
# Submit sensor data
curl -X POST http://localhost:8001/api/sensor/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "temperature": 25,
    "humidity": 65,
    "vibration": 0.5,
    "pressure": 101.3
  }'
```

---

## 13. **COMMON ISSUES & TROUBLESHOOTING**

| Issue | Solution |
|-------|----------|
| 404 on page load | Ensure frontend dev server running (`npm run dev`) |
| API 401 errors | Check access_token in localStorage, login again |
| CORS errors | Verify FRONTEND_URL in backend config matches frontend URL |
| Image upload fails | Check backend model file exists, backend running |
| Email not sending | SMTP credentials not configured in .env (expected for dev) |
| Page not responding | Check network tab in DevTools, backend connection |
| Animations not smooth | Check browser CPU/performance, try Chrome DevTools performance profiler |

---

## 14. **TESTING SCENARIOS WITH REAL DATA**

### Scenario 1: Complete User Journey
1. Register new account → test@example.com
2. Verify email (via API)
3. Login
4. Upload crack image → analyze
5. Create report from result
6. View reports list
7. Logout
8. Login with new credentials
9. View previous report

**Expected**: All operations successful, data persists

---

### Scenario 2: Damage Detection Workflow
1. Login
2. Go to Image Analysis
3. Upload 5 representative images
4. Document results (confidence scores)
5. Create comprehensive report
6. Export/download results

---

### Scenario 3: Sensor Monitoring
1. Login
2. Go to Sensor Analysis
3. Input 10 different sensor readings over time
4. View historical data
5. Identify trends

---

## 15. **NOTES FOR QA/TESTING TEAM**

- **Test Environment**: Local dev only (not production)
- **Database**: SQLite initially, use PostgreSQL for production testing
- **Model Support**: Binary classification (damage/no-damage) only
- **File Size Limit**: Check backend config for max upload size
- **Browser Compatibility**: Chrome (primary), Firefox, Safari (secondary)
- **Regression Testing**: Re-test all flows after any code changes

---

## 16. **KNOWN LIMITATIONS**

- Email verification requires SMTP setup (skip in dev by using API)
- Model training required before image analysis works
- No image edit/crop functionality in UI
- Report PDF export not yet implemented

---

## Sign-Off

- [ ] All tests passed
- [ ] No critical bugs found
- [ ] Performance acceptable
- [ ] Documentation complete
- [ ] Ready for production deployment

**Tester**: ________________
**Date**: ________________
**Version**: v1.0.0
