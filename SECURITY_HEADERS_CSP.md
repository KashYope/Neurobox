# Security Headers & Content Security Policy Implementation

## Overview
Content Security Policy (CSP) and comprehensive security headers have been implemented using the `helmet` middleware package to protect the NeuroSooth application against XSS, injection attacks, clickjacking, and other web vulnerabilities.

## Implementation Details

### 1. Dependencies
**Package:** `helmet@^8.1.0`  
**Location:** Added to `package.json` dependencies  
**Server:** Express.js (`server/src/index.ts`)

### 2. Server Configuration

The helmet middleware is configured in `server/src/index.ts` with the following setup:

```typescript
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "blob:"],
        fontSrc: ["'self'", "data:"],
        connectSrc: ["'self'", "https://generativelanguage.googleapis.com"],
        manifestSrc: ["'self'"],
        workerSrc: ["'self'", "blob:"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
```

### 3. Security Headers Applied

When the server runs, the following HTTP security headers are automatically set:

#### Content-Security-Policy
```
Content-Security-Policy: 
  default-src 'self'; 
  script-src 'self' 'unsafe-inline'; 
  style-src 'self' 'unsafe-inline'; 
  img-src 'self' data: blob:; 
  font-src 'self' data:; 
  connect-src 'self' https://generativelanguage.googleapis.com; 
  manifest-src 'self'; 
  worker-src 'self' blob:; 
  frame-src 'none'; 
  object-src 'none'; 
  base-uri 'self'; 
  form-action 'self'; 
  upgrade-insecure-requests;
```

#### Additional Headers (via Helmet defaults)
- **X-DNS-Prefetch-Control**: `off`
- **X-Frame-Options**: `SAMEORIGIN`
- **X-Content-Type-Options**: `nosniff`
- **X-Download-Options**: `noopen`
- **X-Permitted-Cross-Domain-Policies**: `none`
- **Referrer-Policy**: `no-referrer`
- **Strict-Transport-Security**: `max-age=15552000; includeSubDomains` (HTTPS only)
- **Cross-Origin-Resource-Policy**: `cross-origin`

## CSP Directives Explained

| Directive | Value | Reason |
|-----------|-------|--------|
| `default-src 'self'` | Only same-origin resources | Default fallback - all resources must come from your domain |
| `script-src 'self' 'unsafe-inline'` | Same-origin + inline scripts | Required for React/Vite bundled inline scripts |
| `style-src 'self' 'unsafe-inline'` | Same-origin + inline styles | Required for React component inline styles |
| `img-src 'self' data: blob:` | Same-origin, data URIs, blobs | Supports SVG icons, base64 images, and dynamic blobs |
| `font-src 'self' data:` | Same-origin + data URIs | Web fonts and embedded font data |
| `connect-src 'self' https://generativelanguage.googleapis.com` | API endpoints | Internal API + Google Gemini API for AI features |
| `manifest-src 'self'` | Same-origin | PWA manifest file |
| `worker-src 'self' blob:` | Same-origin + blob workers | Service worker support (PWA) |
| `frame-src 'none'` | No iframes allowed | Prevents embedding in iframes (clickjacking protection) |
| `object-src 'none'` | No plugins | Blocks Flash, Java applets, and other plugins |
| `base-uri 'self'` | Same-origin only | Prevents `<base>` tag injection |
| `form-action 'self'` | Same-origin form submissions | Prevents form submission to external domains |
| `upgrade-insecure-requests` | Enabled | Automatically upgrades HTTP to HTTPS |

## Tech Stack Context

**Frontend:** React 19 + Vite 6 + TypeScript 5.8  
**Backend:** Express.js + Node.js 20  
**Database:** PostgreSQL  
**PWA:** Workbox service worker (`src/sw.ts`)  
**External APIs:** Google Gemini API (generativelanguage.googleapis.com)

## Deployment

### Docker Setup
The application runs in Docker containers defined in:
- `Dockerfile` - Multi-stage build (Node 20)
- `docker-compose.neurobox.yml` - Production deployment
- Container: `neurobox-api` (port 4400:4000)

### Deploy Security Updates

```bash
# 1. Build new Docker image with helmet dependency
docker build -t neurobox:latest .

# 2. Stop current container
docker-compose -f docker-compose.neurobox.yml down

# 3. Start with new security headers
docker-compose -f docker-compose.neurobox.yml up -d

# 4. Verify deployment
docker ps | grep neurobox-api
docker logs neurobox-api
```

**Or use the deployment script:**
```bash
./deploy-csp-update.sh
```

## Testing & Verification

### Check Headers with curl
```bash
# Check if container is running
docker ps | grep neurobox-api

# Test CSP header (external access)
curl -I https://your-domain.com/ | grep -i content-security-policy

# Test CSP header (localhost on VPS)
curl -I http://localhost:4400/ | grep -i content-security-policy

# View all security headers
curl -I http://localhost:4400/
```

### Browser DevTools Verification
1. Open your application in browser
2. Open DevTools (F12)
3. Go to **Network** tab
4. Refresh the page
5. Click on the main document request
6. Check **Response Headers** section
7. Verify presence of:
   - `Content-Security-Policy`
   - `X-Frame-Options`
   - `X-Content-Type-Options`
   - `Strict-Transport-Security` (if using HTTPS)

### Expected Output
```
HTTP/1.1 200 OK
X-DNS-Prefetch-Control: off
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-Download-Options: noopen
X-Permitted-Cross-Domain-Policies: none
Referrer-Policy: no-referrer
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; ...
Cross-Origin-Resource-Policy: cross-origin
```

## Security Benefits

This implementation protects against:

✅ **Cross-Site Scripting (XSS)** - CSP restricts script execution  
✅ **Injection Attacks** - CSP blocks unauthorized resource loading  
✅ **Clickjacking** - X-Frame-Options prevents iframe embedding  
✅ **MIME Sniffing** - X-Content-Type-Options enforces declared types  
✅ **Protocol Downgrade** - HSTS forces HTTPS connections  
✅ **Data Exfiltration** - CSP limits external connections  
✅ **Plugin Exploits** - object-src blocks Flash/Java applets

## Important Notes

### 'unsafe-inline' Considerations
- Currently allows inline scripts and styles (`'unsafe-inline'`)
- Required for React/Vite build output with inline JavaScript
- Trade-off: Convenience vs. strict CSP
- **Future improvement:** Implement nonce or hash-based CSP

### Environment Variables
CSP works with existing environment configuration in `server/src/env.ts`:
- `PORT` - Server port (default: 4000)
- `CORS_ORIGINS` - Allowed origins for CORS
- `DATABASE_URL` - PostgreSQL connection
- `JWT_SECRET` - Authentication secret

### CORS Configuration
Helmet works alongside existing CORS middleware:
```typescript
app.use(
  cors({
    origin: env.allowedOrigins.length ? env.allowedOrigins : undefined,
    credentials: true
  })
);
```

Set `CORS_ORIGINS` in `.env` or `.env.server` for production.

## Troubleshooting

### Issue: Resources Blocked by CSP

**Symptoms:** Console errors like:
```
Refused to load the script 'https://example.com/script.js' because it violates 
the Content-Security-Policy directive: "script-src 'self' 'unsafe-inline'"
```

**Solution:** Add the domain to appropriate CSP directive in `server/src/index.ts`:
```typescript
scriptSrc: ["'self'", "'unsafe-inline'", "https://trusted-domain.com"],
```

### Issue: External Images Not Loading

**Solution:** Add domain to `imgSrc`:
```typescript
imgSrc: ["'self'", "data:", "blob:", "https://images.example.com"],
```

### Issue: API Calls Failing

**Solution:** Add API domain to `connectSrc`:
```typescript
connectSrc: ["'self'", "https://api.example.com"],
```

### Issue: Service Worker Not Registering

**Verify:** `worker-src` includes `'self' blob:'`  
**Check:** Browser console for SW registration errors  
**Debug:** `docker logs neurobox-api` for server errors

### Issue: CORS + CSP Conflicts

Ensure CORS is configured before checking CSP violations. CORS failures happen at network layer, CSP at browser policy layer.

## Future Improvements

1. **Nonce-based CSP**: Remove `'unsafe-inline'` with cryptographic nonces
2. **CSP Reporting**: Add `report-uri` or `report-to` directive
3. **Report-Only Mode**: Test stricter policies without breaking app
4. **Subresource Integrity (SRI)**: Add integrity hashes for external scripts
5. **Content-Security-Policy-Report-Only**: Monitor violations before enforcing

## References

- [Helmet.js Documentation](https://helmetjs.github.io/)
- [MDN Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [CSP Evaluator Tool](https://csp-evaluator.withgoogle.com/)
- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)

## Related Documentation

- `README.md` - Project overview and architecture
- `DEPLOYMENT.md` - Deployment procedures
- `.env.example` - Environment configuration
- `server/src/index.ts` - Server implementation
- `Dockerfile` - Container build configuration
