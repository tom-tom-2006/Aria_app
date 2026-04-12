# Auth Testing Playbook for ARIA

## Step 1: MongoDB Verification
```bash
mongosh
use aria_db
db.users.find({role: "admin"}).pretty()
db.users.findOne({role: "admin"}, {password_hash: 1})
```

## Step 2: API Testing

### Register
```bash
curl -X POST http://localhost:8001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@aria.com","password":"test123456","name":"Marie","city":"Paris"}'
```

### Login
```bash
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@aria.com","password":"test123456"}'
```

### Get Current User (use token from login response)
```bash
curl -H "Authorization: Bearer <token>" http://localhost:8001/api/auth/me
```

## Step 3: Weather API
```bash
curl "http://localhost:8001/api/weather?city=Paris"
```

## Step 4: Chat API (requires auth token)
```bash
curl -X POST http://localhost:8001/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"message":"Bonjour, quels soins pour une peau sèche ?"}'
```

## Step 5: Tutorials
```bash
curl http://localhost:8001/api/tutorials
```
