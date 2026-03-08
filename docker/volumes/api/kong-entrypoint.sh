#!/bin/bash
# Custom entrypoint for Kong that builds Lua expressions for request-transformer
# and performs environment variable substitution in the declarative config.

# Build Lua expression for translating opaque API keys to asymmetric JWTs.
# When asymmetric JWTs are not configured (empty env vars), the expression
# falls through to headers.apikey — preserving legacy behavior.
#
# Logic:
#   1. If Authorization header exists and is NOT an sb_ key → pass through (user session JWT)
#   2. If apikey matches secret key -> set service_role asymmetric JWT "API key"
#   3. If apikey matches publishable key -> set anon asymmetric JWT "API key"
#   4. Fallback: pass apikey as-is (legacy API key - HS256-signed JWTs)

export LUA_AUTH_EXPR="\$((headers.authorization ~= nil and headers.authorization:sub(1, 10) ~= 'Bearer sb_' and headers.authorization) or (headers.apikey == '$SUPABASE_SECRET_KEY' and 'Bearer $SERVICE_ROLE_KEY_ASYMMETRIC') or (headers.apikey == '$SUPABASE_PUBLISHABLE_KEY' and 'Bearer $ANON_KEY_ASYMMETRIC') or headers.apikey)"

# Realtime WebSocket: translates apikey to JWT "API key" and sets x-api-key header (matching platform).
# Reads from query_params.apikey (supabase-js sends apikey via query string), outputs to
# x-api-key header which Realtime checks first. Legacy API keys pass through unchanged.
export LUA_RT_WS_EXPR="\$((query_params.apikey == '$SUPABASE_SECRET_KEY' and '$SERVICE_ROLE_KEY_ASYMMETRIC') or (query_params.apikey == '$SUPABASE_PUBLISHABLE_KEY' and '$ANON_KEY_ASYMMETRIC') or query_params.apikey)"

# Substitute environment variables in the Kong declarative config.
# Uses awk instead of eval/echo to preserve YAML quoting (eval strips double
# quotes, breaking "Header: value" patterns that YAML parses as mappings).
awk '{
  result = ""
  rest = $0
  while (match(rest, /\$[A-Za-z_][A-Za-z_0-9]*/)) {
    varname = substr(rest, RSTART + 1, RLENGTH - 1)
    if (varname in ENVIRON) {
      result = result substr(rest, 1, RSTART - 1) ENVIRON[varname]
    } else {
      result = result substr(rest, 1, RSTART + RLENGTH - 1)
    }
    rest = substr(rest, RSTART + RLENGTH)
  }
  print result rest
}' /home/kong/temp.yml > /home/kong/kong.yml

exec /docker-entrypoint.sh kong docker-start
