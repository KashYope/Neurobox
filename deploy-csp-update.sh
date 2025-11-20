#!/bin/bash
set -e

echo "=== Deploying CSP Security Headers Update ==="
echo ""

echo "1. Building new Docker image..."
docker build -t neurobox:latest .

echo ""
echo "2. Stopping current container..."
docker-compose -f docker-compose.neurobox.yml down

echo ""
echo "3. Starting updated container..."
docker-compose -f docker-compose.neurobox.yml up -d

echo ""
echo "4. Waiting for container to be healthy..."
sleep 5

echo ""
echo "5. Checking container status..."
docker ps | grep neurobox-api

echo ""
echo "=== Deployment Complete ==="
echo ""
echo "To verify CSP headers are active, run:"
echo "  curl -I http://localhost:4400/ | grep -i 'content-security-policy'"
echo ""
echo "Or check in browser DevTools (F12 -> Network tab -> Response Headers)"
