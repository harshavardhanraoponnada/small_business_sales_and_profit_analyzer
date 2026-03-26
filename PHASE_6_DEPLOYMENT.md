# Phase 6: Distributed Deployment Implementation Guide

## Overview

Phase 6 consists of three parts implemented progressively:
1. **Phase 6.2: Nginx Reverse Proxy** — Single entry point with health checks & security headers
2. **Phase 6.3: Multi-Instance Orchestration** — Horizontal scaling (2-3 backend instances)
3. **Phase 6.4: Session & Cache Management** — Redis-backed sessions and data caching

---

## Phase 6.2: Nginx Reverse Proxy ✅ IMPLEMENTED

### Architecture

```
Client Requests (Port 80/443)
           ↓
    ┌─────────────┐
    │   Nginx     │  ←  Reverse Proxy + Load Balancer
    └─────────────┘
           ↓
    ┌─────────────────┐
    │     Backend     │  ← Single or Multiple Instances
    │  (Port 5000)    │
    └─────────────────┘
           ↓
    ┌──────────────────┐
    │  PostgreSQL      │
    │  + Redis         │
    └──────────────────┘
```

### Configuration Files

**nginx.conf** (`./nginx.conf`)
- Reverse proxy routing to backend
- Health check endpoint (`/health`)
- API endpoints with rate limiting
- Authentication routes with stricter limits
- ML service proxy (`/api/predict/`)
- Static asset caching
- Security headers (CORS, CSP, X-Frame-Options, etc.)
- Gzip compression
- SSL/TLS termination configuration (ready for production)

**Docker Service** (`docker-compose.yml`)
- Nginx Alpine image (lightweight, ~8MB)
- Volume mounting for `nginx.conf`
- Health checks every 10s
- Depends on backend being ready
- Network bridge for service discovery

### Key Features

| Feature | Implementation | Status |
|---------|---|---|
| **Load Balancing** | Least-connections algorithm | ✅ Ready |
| **Health Checks** | Passive (fails=3, timeout=30s) | ✅ Configured |
| **Rate Limiting** | Zone-based (general + auth) | ✅ Configured |
| **Compression** | Gzip (text, JSON, JS) | ✅ Enabled |
| **Caching** | Browser cache headers | ✅ Configured |
| **Security Headers** | X-Frame, CSP, HSTS | ✅ Added |
| **SSL/TLS** | Certificate ready for production | ⏳ Awaiting cert |

### Running Phase 6.2

**Prerequisites:**
- Docker Desktop running
- `.env` file configured with database URL

**Start Nginx + Backend:**
```bash
# Terminal 1: Start all services
cd v:\harsha vr\Infosys_Intern\app
docker-compose up -d postgres redis nginx backend

# Verify containers running
docker ps
# Should show: postgres, redis, nginx, backend (all healthy)

# View Nginx logs
docker logs infosys_nginx
```

**Test Nginx Reverse Proxy:**
```bash
# Terminal 2: Test endpoints through Nginx (port 80)
cd backend
node test-nginx.js

# Or manual curl tests:
curl http://localhost/health                    # Health check
curl -X POST http://localhost/api/auth/login    # Login endpoint
curl http://localhost/api/categories            # List categories
```

**Expected Output:**
```
✓ Status: 200 | Health check successful
✓ Status: 400 | Login attempted (validation error expected without credentials)
✓ Status: 200 | Categories returned (or 401 if auth required)
```

**Access Logs:**
```bash
docker exec infosys_nginx tail -f /var/log/nginx/access.log
```

---

## Phase 6.3: Multi-Instance Orchestration 🟡 READY

### Scaling Strategy

After Phase 6.2, scale to multiple backend instances:

```yaml
# Updated docker-compose.yml

backend:
  image: node:18-alpine
  deploy:
    replicas: 3  # Or use multiple services

# Or manually:
services:
  backend_1:
    container_name: infosys_backend_1
    # ... backend config
  backend_2:
    container_name: infosys_backend_2
    # ... same config
  backend_3:
    container_name: infosys_backend_3
    # ... same config
```

**Nginx Configuration Update** (in `nginx.conf`):
```nginx
upstream infosys_backend {
    server backend_1:5000 max_fails=3 fail_timeout=30s weight=1;
    server backend_2:5000 max_fails=3 fail_timeout=30s weight=1;
    server backend_3:5000 max_fails=3 fail_timeout=30s weight=1;
    
    least_conn;
    keepalive 32;
}
```

**Benefits:**
- Requests distributed across instances (Nginx least-connections)
- Redis rate limits enforced globally (not per-instance)
- Database connection pooling (PostgreSQL handles concurrent requests)
- Session consistency via PostgreSQL (not memory)

### Load Distribution Example

```
Request 1  ──→  Backend_1 ✓
Request 2  ──→  Backend_2 ✓
Request 3  ──→  Backend_3 ✓
Request 4  ──→  Backend_1 ✓  (distributed evenly)
Request 5  ──→  Backend_2 ✓

Backend_1 fails (max_fails=3)
Request 6  ──→  Backend_2 ✓
Request 7  ──→  Backend_3 ✓  (Backend_1 marked unhealthy, removed temporarily)
```

---

## Phase 6.4: Session & Cache Management 📋 NEXT

### Redis Session Store

Move from JWT-only to JWT + Redis for multi-instance consistency:

```typescript
// backend/src/services/session.service.js (pseudocode)

redisClient.set(
  `session:${userId}:${sessionId}`,
  JSON.stringify({ userId, role, lastActive: Date.now() }),
  'EX', 3600  // 1-hour expiry
);
```

### Caching Strategy

**Frequently Cached Data:**
1. **Categories** — Read-heavy, written rarely
2. **Brands** — Tied to categories
3. **Models** — Tied to brands
4. **User roles/permissions** — Static per login session

**Cache Invalidation:**
```typescript
// When category created/updated
redisClient.del('categories:all');
redisClient.del('brands:all');  // Cascade invalidation
```

---

## Testing Checklist

### Phase 6.2 (Nginx) ✅
- [ ] Docker containers all healthy (5/5 retries passed)
- [ ] Nginx health check: `curl http://localhost/health` → 200 OK
- [ ] API through Nginx: `curl http://localhost/api/categories` → 200 or 401
- [ ] Rate limiting active: >10 requests to `/api/auth/login` → 429
- [ ] Response times logged: `docker logs infosys_nginx` shows entry via backend
- [ ] Security headers present: `curl -I http://localhost/health | grep X-Frame`

### Phase 6.3 (Multi-Instance) 🟡
- [ ] 3 backend containers running
- [ ] Nginx distributes requests (check logs for different `upstream_addr`)
- [ ] Rate limits work across instances (Redis shared)
- [ ] One instance goes down → requests still succeed (others handle them)
- [ ] Load balancing is even (similar latencies per instance)

### Phase 6.4 (Sessions) 📋
- [ ] Redis session keys: `docker exec redis redis-cli KEYS "session:*"`
- [ ] Session persists across instance failures
- [ ] Cache hit ratio tracking implemented
- [ ] Cache invalidation works (update category → cache cleared)

---

## Troubleshooting

### Nginx container fails to start
```bash
# Check nginx configuration syntax
docker exec infosys_nginx nginx -t

# View full logs
docker logs infosys_nginx

# Common issues:
# 1. nginx.conf not mounted properly → check volume path
# 2. Backend service not running → start backend first
# 3. Port 80 already in use → run `netstat -ano | findstr :80`
```

### Backend requests timeout through Nginx
```bash
# Check backend logs
docker logs infosys_backend

# Check Nginx upstream
docker exec infosys_nginx curl http://backend:5000/health

# Increase proxy timeouts in nginx.conf:
# proxy_connect_timeout 120s;
# proxy_send_timeout 120s;
# proxy_read_timeout 120s;
```

### Rate limiting not working
```bash
# Verify Redis connection
docker exec infosys_redis redis-cli PING

# Check rate limit keys
docker exec infosys_redis redis-cli KEYS "rateLimit:*"

# Check backend logs for Redis errors
docker logs infosys_backend | grep -i redis
```

### High latency through Nginx
```bash
# Monitor Nginx connection pool
docker stats infosys_nginx

# Check for connection saturation
docker exec infosys_nginx netstat -an | grep ESTABLISHED | wc -l

# Solutions:
# 1. Increase worker_connections in nginx.conf
# 2. Add more backend instances (Phase 6.3)
# 3. Enable caching for frequently accessed endpoints (Phase 6.4)
```

---

## Production Considerations

### SSL/TLS Setup

**Generate self-signed certificate (testing):**
```bash
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
mkdir -p certs
cp key.pem cert.pem certs/
```

**Uncomment in nginx.conf:**
```nginx
listen 443 ssl http2;
ssl_certificate /etc/nginx/certs/cert.pem;
ssl_certificate_key /etc/nginx/certs/key.pem;
```

**Add to docker-compose.yml:**
```yaml
nginx:
  volumes:
    - ./certs:/etc/nginx/certs:ro
```

### Monitoring

**Prometheus metrics (optional upgrade):**
```bash
# Install nginx_exporter
docker pull nginx/nginx-prometheus-exporter

# Add to docker-compose.yml
prometheus_exporter:
  image: nginx/nginx-prometheus-exporter
  command: -nginx.scrape_uri=http://nginx:80/nginx_status
```

### Auto-scaling

**Docker Swarm or Kubernetes:**
```yaml
# For Kubernetes, define HPA (Horizontal Pod Autoscaler)
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

---

## Next Steps

1. **Start Docker Desktop** if not running
2. **Run:** `docker-compose up -d postgres redis nginx backend`
3. **Test:** `node backend/test-nginx.js`
4. **Verify:** `docker ps` — all 4 containers healthy
5. **Proceed to Phase 6.3:** Add backend_2 and backend_3 services
6. **Then Phase 6.4:** Configure Redis sessions and caching

---

**Status:** Phase 6.2 files ready. Awaiting Docker to test. Phase 6.3 & 6.4 follow same pattern.
