# Real-Time System Testing Guide

**Purpose:** Step-by-step guide to verify the real-time transaction update system works correctly

**Estimated Time:** 15-20 minutes

---

## Prerequisites

- [ ] Two browser windows/tabs open
- [ ] Admin account credentials
- [ ] Test user account credentials
- [ ] Developer tools open (F12) for console logs

---

## Test Scenario 1: Admin Adds Transaction → User Sees Update

**Expected Result:** User sees new transaction and updated balance within 200ms

### Steps:

1. **Setup**
   ```
   Browser 1: Login as TEST USER
             Navigate to Dashboard
             Note current ETH balance: ______

   Browser 2: Login as ADMIN
             Navigate to Admin → Transactions
   ```

2. **Execute**
   ```
   Browser 2 (Admin):
   - Click "Add Transaction" button
   - Fill form:
     * User: [Select TEST USER]
     * Type: Deposit
     * Currency: ETH
     * Amount: 0.5
     * Status: Completed
   - Click "Submit"
   - Start timer ⏱️
   ```

3. **Verify**
   ```
   Browser 1 (User Dashboard):
   ✅ ETH wallet balance increases by 0.5 ETH
   ✅ Portfolio total increases (0.5 × ETH price)
   ✅ Transaction appears in Dashboard (if recent activity shown)
   ✅ No page refresh needed
   ✅ Update appears in < 200ms ⏱️

   Browser 2 (Admin):
   ✅ New transaction appears in table immediately
   ✅ Portfolio column updates for user
   ```

4. **Console Verification**
   ```javascript
   // Browser 1 Console should show:
   "💰 Wallet update received: {eventType: 'INSERT', ...}"
   "Fetching wallet data..."

   // Browser 2 Console should show:
   "Admin: Transaction change detected: {eventType: 'INSERT', ...}"
   ```

**Result:** ☐ PASS ☐ FAIL
**Actual Latency:** _______ ms

---

## Test Scenario 2: Admin Updates Transaction Status

**Expected Result:** User sees status change in real-time

### Steps:

1. **Setup**
   ```
   Browser 1: Login as TEST USER
             Navigate to Dashboard → Transaction History
             Find a "Pending" transaction

   Browser 2: Login as ADMIN
             Navigate to Admin → Transactions
             Find the same pending transaction
   ```

2. **Execute**
   ```
   Browser 2 (Admin):
   - Click "Edit" button on pending transaction
   - Change status from "Pending" to "Completed"
   - Click "Save"
   - Start timer ⏱️
   ```

3. **Verify**
   ```
   Browser 1 (Transaction History):
   ✅ Status badge changes from yellow to green
   ✅ Status text changes to "Completed"
   ✅ No page refresh needed
   ✅ Update appears in < 200ms ⏱️

   Browser 2 (Admin):
   ✅ Transaction table updates immediately
   ```

4. **Console Verification**
   ```javascript
   // Browser 1 Console should show:
   "Transaction change detected: {eventType: 'UPDATE', ...}"
   ```

**Result:** ☐ PASS ☐ FAIL
**Actual Latency:** _______ ms

---

## Test Scenario 3: Admin Modifies Wallet Balance

**Expected Result:** User dashboard updates instantly

### Steps:

1. **Setup**
   ```
   Browser 1: Login as TEST USER
             Navigate to Dashboard
             Note current BTC balance: ______

   Browser 2: Login as ADMIN
             Navigate to Admin → Wallet Management
             Select TEST USER from dropdown
   ```

2. **Execute**
   ```
   Browser 2 (Admin):
   - Find BTC wallet in list
   - Click "Edit" button on balance
   - Change balance to 1.5 BTC
   - Click "Save"
   - Start timer ⏱️
   ```

3. **Verify**
   ```
   Browser 1 (Dashboard):
   ✅ BTC balance changes to 1.5 BTC
   ✅ Portfolio total recalculates
   ✅ No loading spinner appears
   ✅ Update appears in < 200ms ⏱️

   Browser 2 (Admin):
   ✅ Balance updates in wallet list
   ✅ Assets Summary recalculates
   ```

4. **Console Verification**
   ```javascript
   // Browser 1 Console should show:
   "💰 Wallet update received: {eventType: 'UPDATE', ...}"

   // Browser 2 Console should show:
   "Admin: Wallet balance change detected: {eventType: 'UPDATE', ...}"
   ```

**Result:** ☐ PASS ☐ FAIL
**Actual Latency:** _______ ms

---

## Test Scenario 4: Multiple Concurrent Users

**Expected Result:** Each user only sees their own updates

### Steps:

1. **Setup**
   ```
   Browser 1: Login as USER A
             Navigate to Dashboard

   Browser 2: Login as USER B
             Navigate to Dashboard

   Browser 3: Login as ADMIN
             Navigate to Admin → Transactions
   ```

2. **Execute**
   ```
   Browser 3 (Admin):
   - Add deposit for USER A (1.0 ETH)
   - Wait 2 seconds
   - Add deposit for USER B (2.0 ETH)
   ```

3. **Verify**
   ```
   Browser 1 (User A):
   ✅ Sees 1.0 ETH deposit
   ✅ Does NOT see User B's 2.0 ETH deposit

   Browser 2 (User B):
   ✅ Sees 2.0 ETH deposit
   ✅ Does NOT see User A's 1.0 ETH deposit

   Browser 3 (Admin):
   ✅ Sees both transactions
   ```

**Result:** ☐ PASS ☐ FAIL

---

## Test Scenario 5: Network Disconnection & Reconnection

**Expected Result:** System reconnects automatically and syncs data

### Steps:

1. **Setup**
   ```
   Browser 1: Login as TEST USER
             Navigate to Dashboard
             Open Network tab in DevTools
   ```

2. **Execute**
   ```
   Browser 1:
   - In DevTools, set network to "Offline"
   - Wait 5 seconds

   Browser 2 (Admin):
   - Add new transaction for TEST USER

   Browser 1:
   - In DevTools, set network back to "Online"
   - Start timer ⏱️
   ```

3. **Verify**
   ```
   Browser 1 (Dashboard):
   ✅ Shows "connecting" or similar indicator during offline
   ✅ Reconnects automatically (no manual refresh)
   ✅ New transaction appears after reconnection
   ✅ Wallet balance updates
   ✅ Reconnection time < 5 seconds ⏱️
   ✅ No errors in console
   ```

4. **Console Verification**
   ```javascript
   // Should show reconnection attempts:
   "System event: {event: 'system', status: 'reconnecting'}"
   "System event: {event: 'system', status: 'connected'}"
   ```

**Result:** ☐ PASS ☐ FAIL
**Reconnection Time:** _______ seconds

---

## Test Scenario 6: Subscription Cleanup (Memory Leak Test)

**Expected Result:** No memory leaks when navigating between pages

### Steps:

1. **Setup**
   ```
   Browser: Login as TEST USER
           Open DevTools → Memory tab
           Take heap snapshot #1
   ```

2. **Execute**
   ```
   - Navigate: Dashboard → Transaction History → Dashboard
   - Repeat 10 times
   - Wait 30 seconds for garbage collection
   - Take heap snapshot #2
   ```

3. **Verify**
   ```
   DevTools → Memory:
   ✅ Compare snapshots
   ✅ No significant memory increase (< 5MB)
   ✅ No detached DOM nodes
   ✅ No "Can't perform state update on unmounted component" warnings
   ```

4. **Console Verification**
   ```javascript
   // Should show cleanup logs:
   "🔌 Cleaning up wallet subscription"
   "🔌 Cleaning up transaction subscription"
   // Repeated for each navigation
   ```

**Result:** ☐ PASS ☐ FAIL
**Memory Increase:** _______ MB

---

## Test Scenario 7: High-Frequency Updates

**Expected Result:** System handles rapid updates without errors

### Steps:

1. **Setup**
   ```
   Browser 1: Login as TEST USER
             Navigate to Transaction History

   Browser 2: Login as ADMIN
             Navigate to Admin → Transactions
   ```

2. **Execute**
   ```
   Browser 2 (Admin):
   - Rapidly add 10 transactions for TEST USER
   - Wait only 1 second between each
   - Types: Mix of deposits and withdrawals
   ```

3. **Verify**
   ```
   Browser 1 (Transaction History):
   ✅ All 10 transactions appear
   ✅ No duplicate entries
   ✅ Correct order (newest first)
   ✅ No UI freezing or lag
   ✅ No console errors

   Browser 2 (Admin):
   ✅ Transaction table shows all 10
   ✅ No duplicate entries
   ✅ Portfolio column updates correctly
   ```

**Result:** ☐ PASS ☐ FAIL

---

## Test Scenario 8: Database Migration Verification

**Expected Result:** New indexes improve query performance

### Steps:

1. **Check Indexes Exist**
   ```sql
   -- Run in Supabase SQL Editor
   SELECT
     schemaname,
     tablename,
     indexname,
     indexdef
   FROM pg_indexes
   WHERE tablename IN ('user_transactions', 'user_wallets')
   ORDER BY tablename, indexname;
   ```

2. **Verify Expected Indexes**
   ```
   user_transactions:
   ✅ idx_user_transactions_user_id
   ✅ idx_user_transactions_user_created
   ✅ idx_user_transactions_status
   ✅ idx_user_transactions_currency
   ✅ idx_user_transactions_admin_filter

   user_wallets:
   ✅ idx_user_wallets_user_id
   ✅ idx_user_wallets_user_asset
   ✅ idx_user_wallets_active
   ✅ idx_user_wallets_address
   ✅ idx_user_wallets_balance
   ```

3. **Test Query Performance**
   ```sql
   -- Should use index (check EXPLAIN ANALYZE output)
   EXPLAIN ANALYZE
   SELECT * FROM user_transactions
   WHERE user_id = 'your-user-id'
   ORDER BY created_at DESC
   LIMIT 50;

   -- Look for "Index Scan" in output (NOT "Seq Scan")
   ```

**Result:** ☐ PASS ☐ FAIL
**Query Time:** _______ ms (should be < 10ms)

---

## Test Scenario 9: React Query Cache Behavior

**Expected Result:** Optimized cache reduces unnecessary refetches

### Steps:

1. **Setup**
   ```
   Browser: Login as TEST USER
           Open DevTools → Network tab
           Filter by "supabase"
   ```

2. **Execute**
   ```
   - Navigate to Dashboard
   - Wait 3 seconds
   - Navigate to Transaction History
   - Navigate back to Dashboard
   - Wait 3 seconds
   ```

3. **Verify**
   ```
   Network Tab:
   ✅ Initial Dashboard load: 2-3 requests
   ✅ Navigation to Transaction History: 1-2 requests
   ✅ Return to Dashboard: 0-1 requests (cache hit!)
   ✅ After 5 seconds: 1 background refetch

   Console:
   ✅ No "refetching" logs during rapid navigation
   ✅ Background refetch after staleTime (5 seconds)
   ```

**Result:** ☐ PASS ☐ FAIL
**Cache Hit Rate:** ______%

---

## Performance Benchmarks

### Expected Latency Targets

| Operation | Target | Your Result | Status |
|-----------|--------|-------------|--------|
| Admin adds transaction → User sees | < 200ms | _____ ms | ☐ PASS ☐ FAIL |
| Admin updates status → User sees | < 200ms | _____ ms | ☐ PASS ☐ FAIL |
| Admin modifies balance → User sees | < 200ms | _____ ms | ☐ PASS ☐ FAIL |
| Network reconnection | < 5s | _____ s | ☐ PASS ☐ FAIL |
| Initial page load | < 1s | _____ s | ☐ PASS ☐ FAIL |
| Query with indexes | < 10ms | _____ ms | ☐ PASS ☐ FAIL |

### Overall System Grade

**Total Tests:** 9
**Passed:** ______ / 9
**Failed:** ______ / 9

**System Status:**
- [ ] ✅ Production Ready (8-9 passed)
- [ ] ⚠️ Needs Minor Fixes (6-7 passed)
- [ ] ❌ Needs Major Work (< 6 passed)

---

## Troubleshooting Common Issues

### Issue: Updates not appearing

**Check:**
```javascript
// Console should show subscription setup
"🔄 Setting up real-time subscription for wallet updates..."

// If not, check:
1. User is logged in (user.id exists)
2. Supabase connection (check Network tab for WebSocket)
3. RLS policies allow user to read data
```

**Solution:**
- Refresh page
- Check browser console for errors
- Verify Supabase project is online

---

### Issue: Slow updates (> 500ms)

**Check:**
```sql
-- Verify indexes exist
SELECT indexname FROM pg_indexes
WHERE tablename = 'user_transactions';
```

**Solution:**
- Run database migration: `20251110114343_add_realtime_performance_indexes.sql`
- Check Supabase project location (closer = faster)
- Verify network speed

---

### Issue: Memory leaks

**Check:**
```javascript
// Console should show cleanup on navigation
"🔌 Cleaning up wallet subscription"

// If not, check component useEffect cleanup
```

**Solution:**
- Verify all useEffect have return cleanup
- Check dependencies array for missing values
- Use React DevTools Profiler

---

## Test Report Template

```
==============================================
REAL-TIME SYSTEM TEST REPORT
==============================================

Date: __________________
Tester: __________________
Environment: ☐ Development ☐ Staging ☐ Production

Test Results:
1. Admin Adds Transaction:     ☐ PASS ☐ FAIL
2. Admin Updates Status:        ☐ PASS ☐ FAIL
3. Admin Modifies Balance:      ☐ PASS ☐ FAIL
4. Multiple Concurrent Users:   ☐ PASS ☐ FAIL
5. Network Reconnection:        ☐ PASS ☐ FAIL
6. Memory Leak Test:            ☐ PASS ☐ FAIL
7. High-Frequency Updates:      ☐ PASS ☐ FAIL
8. Database Indexes:            ☐ PASS ☐ FAIL
9. React Query Cache:           ☐ PASS ☐ FAIL

Performance Metrics:
- Average Update Latency: _______ ms
- Cache Hit Rate: _______%
- Memory Usage: _______ MB
- Network Reconnection: _______ seconds

Issues Found:
1. _________________________________
2. _________________________________
3. _________________________________

Overall Status: ☐ APPROVED ☐ NEEDS WORK

Tester Signature: __________________
Date: __________________
==============================================
```

---

## Next Steps After Testing

### If All Tests Pass ✅

1. **Production Deployment**
   ```bash
   # Deploy database migration
   supabase db push

   # Deploy frontend
   npm run build
   npm run deploy
   ```

2. **Monitor for 24-48 hours**
   - Watch error logs
   - Monitor real-time metrics
   - Track user feedback

3. **Success!** System is production-ready

### If Tests Fail ❌

1. **Review REALTIME_AUDIT_REPORT.md**
   - Check troubleshooting section
   - Verify all files modified correctly

2. **Check Console Logs**
   - Look for error messages
   - Verify subscriptions setup

3. **Contact Development Team**
   - Provide test report
   - Share console logs
   - Describe specific failures

---

**Testing Guide Version:** 1.0
**Last Updated:** 2025-11-10
**Maintained By:** Development Team
