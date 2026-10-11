# Carpooling Backend

Spring Boot 3 API for INTI carpooling — JWT auth, email OTP signup, role change.

## Requirements

- Java 21
- Maven 3.9+
- MySQL 8+
- Gmail (or other SMTP) for OTP emails

## MySQL setup

1. Start MySQL locally.
2. Create the database (optional — the app can also create it via JDBC URL):

```sql
CREATE DATABASE carpooling;
```

3. Update credentials in `src/main/resources/application.properties` if needed.

If you previously ran the app **without** a `phone` column, drop old tables once so Hibernate can recreate them:

```sql
DROP TABLE IF EXISTS pending_signups;
DROP TABLE IF EXISTS users;
```

## Email OTP (Gmail)

1. Enable 2-Step Verification on your Google account.
2. Create an [App Password](https://myaccount.google.com/apppasswords).
3. In `application.properties`:

```properties
spring.mail.username=YOUR_GMAIL@gmail.com
spring.mail.password=YOUR_16_CHAR_APP_PASSWORD
```

The sender address is the same as `spring.mail.username`.

## Run

```bash
cd carpooling-backend
mvn spring-boot:run
```

API base URL: `http://localhost:8080`

## Auth rules

- Email must end with `.newinti.edu.my`
- Phone must be Malaysian mobile: `+601XXXXXXXX` or `+601XXXXXXXXX` (`+60` fixed)
- Signup sends a **6-digit email OTP** (expires in 10 minutes)
- Account is created only after OTP verification
- Login uses **email + password** (no OTP)
- Role at signup: `DRIVER` or `PASSENGER` (can change later)

## Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/auth/signup` | Public | Start signup + send OTP |
| POST | `/api/auth/verify-otp` | Public | Verify OTP → create user + JWT |
| POST | `/api/auth/resend-otp` | Public | Resend OTP (60s cooldown) |
| POST | `/api/auth/login` | Public | Login → JWT |
| GET | `/api/auth/me` | JWT | Current user |
| PATCH | `/api/users/role` | JWT | Change role |

## Test with curl

### 1. Signup (sends OTP email)

```bash
curl -s -X POST http://localhost:8080/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@student.newinti.edu.my",
    "username": "alice",
    "password": "secret123",
    "phone": "+60123456789",
    "role": "PASSENGER"
  }'
```

### 2. Verify OTP

```bash
curl -s -X POST http://localhost:8080/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@student.newinti.edu.my",
    "otp": "123456"
  }'
```

### 3. Login

```bash
curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@student.newinti.edu.my",
    "password": "secret123"
  }'
```
