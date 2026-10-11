# INTI Ride — Carpooling App

Campus carpooling application for INTI International University students.

## Structure

- `carpooling-app/` — React Native mobile app (Expo SDK 57)
- `carpooling-backend/` — Spring Boot API (Java 21, MySQL)

## Modules

- **Member 1** — Driver Experience & Communication
- **Member 2** — Account & Money (auth, profile, wallet, payment)
- **Member 3** — Passenger Journey (search, booking, tracking)

## Running locally

### Backend

    cd carpooling-backend
    mvn spring-boot:run

### Mobile app

    cd carpooling-app
    npx expo start
