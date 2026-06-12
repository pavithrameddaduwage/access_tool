#!/usr/bin/env bash
# ============================================================================
# End-to-end ingest test for the engagement tracker pipeline.
#
# Boots the built app, drives the public tracking endpoints exactly as the
# Angular tracker would (start -> flush -> view x2 -> ending flush), then
# verifies the rows landed in tracker_sessions / tracker_usage_events /
# component_view_counts. Tears the server down at the end.
#
# Run from the backend/ dir:  bash test/integration/tracking-flow.sh
# Requires: built dist (npm run build), reachable Postgres, psql, curl.
# Uses PG_DB_HOST=127.0.0.1 (sandbox can't resolve "localhost").
# ============================================================================
set -uo pipefail
cd "$(dirname "$0")/../.."   # -> backend/

PGPW=$(grep -E '^PG_DB_PASSWORD=' .env | cut -d= -f2)
PGDB=$(grep -E '^PG_DB_NAME=' .env | cut -d= -f2)
PGUSER=$(grep -E '^PG_DB_USER=' .env | cut -d= -f2)
psql_q() { PGPASSWORD="$PGPW" psql -h 127.0.0.1 -p 5432 -U "$PGUSER" -d "$PGDB" -tA -c "$1"; }

now() { date -u +"%Y-%m-%dT%H:%M:%S.000Z"; }
SID=$(uuidgen | tr 'A-Z' 'a-z')
UID_="itest-$(date +%s)"
DID="itest-dashboard"
RID="itest-report-1"
PASS=0; FAIL=0
check() { # name expected actual
  if [ "$2" = "$3" ]; then echo "  ✅ $1 ($3)"; PASS=$((PASS+1));
  else echo "  ❌ $1: expected $2, got $3"; FAIL=$((FAIL+1)); fi
}

echo "== Booting backend =="
LOG=/tmp/itest_boot.log; rm -f "$LOG"
PG_DB_HOST=127.0.0.1 POWER_BI_BOOTSTRAP_SYNC=false node dist/main > "$LOG" 2>&1 &
APP_PID=$!
trap 'kill $APP_PID 2>/dev/null' EXIT
for _ in $(seq 1 40); do grep -q "listening on port" "$LOG" && break; sleep 1; done
PORT=$(grep -oE "listening on port [0-9]+" "$LOG" | grep -oE "[0-9]+" | head -1)
if [ -z "${PORT:-}" ]; then echo "❌ backend did not start"; tail -20 "$LOG"; exit 1; fi
BASE="http://127.0.0.1:$PORT/api/tracking"
echo "  backend on :$PORT  session=$SID  user=$UID_"

post() { curl -s -o /dev/null -w "%{http_code}" -X POST "$1" -H 'Content-Type: application/json' -d "$2"; }

echo "== 1. session/start =="
C=$(post "$BASE/session/start" "{\"sessionId\":\"$SID\",\"userId\":\"$UID_\",\"dashboardId\":\"$DID\",\"tabName\":\"Overview\",\"department\":\"Sales\",\"startedAt\":\"$(now)\"}")
check "start HTTP 201" 201 "$C"

echo "== 2. session/flush (counters + raw events) =="
C=$(post "$BASE/session/flush" "{\"sessionId\":\"$SID\",\"userId\":\"$UID_\",\"dashboardId\":\"$DID\",\"tabName\":\"Overview\",\"department\":\"Sales\",\"engagedSeconds\":120,\"clickCount\":5,\"scrollCount\":10,\"copyCount\":2,\"keydownCount\":7,\"selectCount\":1,\"isEnding\":false,\"timestamp\":\"$(now)\",\"events\":[{\"eventType\":\"click\",\"timestamp\":\"$(now)\"},{\"eventType\":\"scroll\",\"timestamp\":\"$(now)\"},{\"eventType\":\"copy\",\"timestamp\":\"$(now)\"}]}")
check "flush HTTP 200" 200 "$C"

echo "== 3. view x2 (same report -> increment) =="
VBODY="{\"userId\":\"$UID_\",\"componentType\":\"report\",\"componentId\":\"$RID\",\"componentName\":\"Sales Report\",\"sessionId\":\"$SID\",\"timestamp\":\"$(now)\"}"
C1=$(post "$BASE/view" "$VBODY"); C2=$(post "$BASE/view" "$VBODY")
check "view#1 HTTP 200" 200 "$C1"; check "view#2 HTTP 200" 200 "$C2"

echo "== 4. ending flush (idle expiry) =="
C=$(post "$BASE/session/flush" "{\"sessionId\":\"$SID\",\"userId\":\"$UID_\",\"dashboardId\":\"$DID\",\"tabName\":\"Overview\",\"department\":\"Sales\",\"engagedSeconds\":135,\"clickCount\":5,\"scrollCount\":10,\"copyCount\":2,\"keydownCount\":7,\"selectCount\":1,\"isEnding\":true,\"idleExpired\":true,\"timestamp\":\"$(now)\"}")
check "ending flush HTTP 200" 200 "$C"

echo "== 5. DB verification =="
check "session engaged_seconds" 135 "$(psql_q "select engaged_seconds from tracker_sessions where id='$SID'")"
check "session click_count"      5   "$(psql_q "select click_count from tracker_sessions where id='$SID'")"
check "session is_active=false"  f   "$(psql_q "select is_active from tracker_sessions where id='$SID'")"
check "session idle_expired=true" t  "$(psql_q "select idle_expired from tracker_sessions where id='$SID'")"
check "raw events inserted"      3   "$(psql_q "select count(*) from tracker_usage_events where session_id='$SID'")"
check "view_count incremented"   2   "$(psql_q "select view_count from component_view_counts where user_id='$UID_' and component_type='report' and component_id='$RID'")"

echo "== 6. Cleanup test data =="
psql_q "delete from tracker_usage_events where session_id='$SID'" >/dev/null
psql_q "delete from tracker_sessions where id='$SID'" >/dev/null
psql_q "delete from component_view_counts where user_id='$UID_'" >/dev/null
echo "  removed test rows"

echo ""
echo "== RESULT: $PASS passed, $FAIL failed =="
[ "$FAIL" -eq 0 ]
