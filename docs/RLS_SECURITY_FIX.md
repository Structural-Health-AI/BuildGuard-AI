# Database Security Remediation Plan

## Critical Issues Found (Supabase Security Audit)

### 🚨 RLS Disabled on 7 Tables
- `public.users` ❌
- `public.login_attempts` ❌
- `public.password_reset_tokens` ❌
- `public.email_verification_tokens` ❌
- `public.sensor_predictions` ❌
- `public.reports` ❌
- `public.image_analyses` ❌

### 🔓 Sensitive Data Exposed
- `session_id` in `image_analyses` - exposed without RLS
- `session_id` in `reports` - exposed without RLS
- `session_id` in `sensor_predictions` - exposed without RLS

---

## Implementation Steps

### Phase 1: Enable RLS on All Tables

#### 1. Users Table
```sql
-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own record
CREATE POLICY "Users can view their own data"
  ON public.users FOR SELECT
  USING (auth.uid()::text = id::text);

-- Policy: Users can update their own record
CREATE POLICY "Users can update their own data"
  ON public.users FOR UPDATE
  USING (auth.uid()::text = id::text);

-- Policy: Admins can view all users
CREATE POLICY "Admins can view all users"
  ON public.users FOR SELECT
  USING (is_admin = true AND auth.uid()::text = id::text);
```

#### 2. Login Attempts Table
```sql
-- Enable RLS
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own login attempts
CREATE POLICY "Users can view own login attempts"
  ON public.login_attempts FOR SELECT
  USING (email = auth.jwt()->>'email');

-- Policy: Admins can view all login attempts
CREATE POLICY "Admins can view all login attempts"
  ON public.login_attempts FOR SELECT
  USING ((SELECT is_admin FROM public.users WHERE id::text = auth.uid()::text) = true);
```

#### 3. Password Reset Tokens Table
```sql
-- Enable RLS
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: System can create tokens (no SELECT needed)
CREATE POLICY "System can create password reset tokens"
  ON public.password_reset_tokens FOR INSERT
  WITH CHECK (true);

-- RESTRICT SELECT: Tokens should never be returned via API
CREATE POLICY "Deny all SELECT on password tokens"
  ON public.password_reset_tokens FOR SELECT
  USING (false);
```

#### 4. Email Verification Tokens Table
```sql
-- Enable RLS
ALTER TABLE public.email_verification_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: System can create tokens (no SELECT needed)
CREATE POLICY "System can create email verification tokens"
  ON public.email_verification_tokens FOR INSERT
  WITH CHECK (true);

-- RESTRICT SELECT: Tokens should never be returned via API
CREATE POLICY "Deny all SELECT on email tokens"
  ON public.email_verification_tokens FOR SELECT
  USING (false);
```

#### 5. Sensor Predictions Table
```sql
-- Enable RLS
ALTER TABLE public.sensor_predictions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view sensor data for their buildings
CREATE POLICY "Users can view sensor data"
  ON public.sensor_predictions FOR SELECT
  USING (
    user_id::text = auth.uid()::text
    OR user_id IN (
      SELECT user_id FROM public.building_access WHERE user_id::text = auth.uid()::text
    )
  );

-- Hide session_id from API responses
-- Note: Configure in your API layer to exclude session_id column
```

#### 6. Image Analyses Table
```sql
-- Enable RLS
ALTER TABLE public.image_analyses ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view image analyses for their buildings
CREATE POLICY "Users can view image analyses"
  ON public.image_analyses FOR SELECT
  USING (
    user_id::text = auth.uid()::text
    OR user_id IN (
      SELECT user_id FROM public.building_access WHERE user_id::text = auth.uid()::text
    )
  );

-- Hide session_id from API responses
-- Note: Configure in your API layer to exclude session_id column
```

#### 7. Reports Table
```sql
-- Enable RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own reports
CREATE POLICY "Users can view their own reports"
  ON public.reports FOR SELECT
  USING (user_id::text = auth.uid()::text);

-- Policy: Users can update their own reports
CREATE POLICY "Users can update their own reports"
  ON public.reports FOR UPDATE
  USING (user_id::text = auth.uid()::text);

-- Hide session_id from API responses
-- Note: Configure in your API layer to exclude session_id column
```

---

### Phase 2: Backend API Changes

#### Update FastAPI Routes to Exclude Sensitive Columns

**File: `backend/api/sensor_routes.py`**
```python
# When returning sensor predictions, exclude session_id
@router.get("/api/sensor/predictions")
def get_predictions(user_id: int, db: Session = Depends(get_db)):
    predictions = db.query(SensorPrediction).filter(
        SensorPrediction.user_id == user_id
    ).all()
    
    # Exclude session_id from response
    return [{
        "id": p.id,
        "sensor_data": p.sensor_data,
        "damage_level": p.damage_level,
        "confidence": p.confidence,
        "created_at": p.created_at
        # session_id is NOT included
    } for p in predictions]
```

**File: `backend/api/image_routes.py`**
```python
# When returning image analyses, exclude session_id
@router.get("/api/images/analyses")
def get_image_analyses(user_id: int, db: Session = Depends(get_db)):
    analyses = db.query(ImageAnalysis).filter(
        ImageAnalysis.user_id == user_id
    ).all()
    
    # Exclude session_id from response
    return [{
        "id": a.id,
        "image_path": a.image_path,
        "damage_detected": a.damage_detected,
        "confidence": a.confidence,
        "created_at": a.created_at
        # session_id is NOT included
    } for a in analyses]
```

**File: `backend/api/report_routes.py`**
```python
# When returning reports, exclude session_id
@router.get("/api/reports")
def get_reports(user_id: int, db: Session = Depends(get_db)):
    reports = db.query(Report).filter(
        Report.user_id == user_id
    ).all()
    
    # Exclude session_id from response
    return [{
        "id": r.id,
        "title": r.title,
        "description": r.description,
        "severity": r.severity,
        "created_at": r.created_at
        # session_id is NOT included
    } for r in reports]
```

---

### Phase 3: Verify Implementation

```bash
# 1. Check RLS is enabled
SELECT schemaname, tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public';

# 2. List all RLS policies
SELECT * FROM pg_policies WHERE tablename IN (
  'users', 'login_attempts', 'password_reset_tokens', 
  'email_verification_tokens', 'sensor_predictions', 'image_analyses', 'reports'
);

# 3. Test policy enforcement (as unauthenticated user)
# Should return no rows:
SELECT * FROM public.users;

# 4. Test policy as authenticated user
# Should return only own data:
SELECT * FROM public.sensor_predictions WHERE user_id::text = auth.uid()::text;
```

---

## Timeline

| Phase | Duration | Priority |
|-------|----------|----------|
| Phase 1: Enable RLS & Create Policies | 1 hour | CRITICAL |
| Phase 2: Update Backend API | 2 hours | HIGH |
| Phase 3: Test & Verify | 1 hour | CRITICAL |
| Phase 4: Production Deployment | 30 mins | CRITICAL |

**Total: ~4.5 hours**

---

## Risk Assessment

### Without Implementation
- ❌ All database data is publicly accessible
- ❌ Sensitive session IDs exposed
- ❌ User privacy violation
- ❌ Compliance violation (GDPR, etc.)

### With Implementation
- ✅ Data is row-level protected
- ✅ Sensitive columns hidden from API
- ✅ Users can only access their own data
- ✅ Secure and compliant

---

## Next Steps

1. Run Phase 1 SQL scripts in Supabase SQL Editor
2. Update backend API code (Phase 2)
3. Test all endpoints (Phase 3)
4. Deploy to production (Phase 4)
5. Re-run Supabase security audit to verify fixes

