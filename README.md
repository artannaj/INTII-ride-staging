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

> The mobile app needs **Node 20+** (Expo SDK 57). On a physical phone, set
> `EXPO_PUBLIC_API_URL=http://<your-computer-LAN-IP>:8080` before `npx expo start`.

## Driver mode, live tracking & chat

- **Become a driver:** Account → *Switch to driver mode*. First-timers add their
  vehicle (model, colour, plate), which passengers see at pickup.
- **Ride lifecycle:** driver posts a ride → passengers request seats (`PENDING`)
  → driver accepts/declines → driver taps *Start trip* (unanswered requests are
  auto-declined) → *End trip* marks confirmed bookings `COMPLETED`. Passengers can
  cancel until the trip starts; seats are released on cancel/decline.
- **Live tracking:** while a trip is in progress the driver's phone sends its GPS
  position every ~4 s (`PUT /api/rides/{id}/location`) and confirmed passengers'
  tracking screen polls `GET /api/rides/{id}/tracking`. Works in Expo Go, but the
  driver must keep the trip screen open (background location needs a dev build).
- **Chat:** one thread per booking, `GET/POST /api/bookings/{id}/messages`,
  inbox at `GET /api/bookings/conversations`. Phone numbers are only shared once a
  booking is confirmed.
- **Biometrics:** Settings → *Biometric login* stores a device-only copy of the
  session that Face ID / fingerprint unlocks from the login screen (expires with
  the 24 h JWT). Wallet → *Biometric payments* requires a biometric check before
  top-ups and wallet-paid seat requests. In Expo Go on iOS, Face ID falls back to the device passcode; it works
  natively in a dev/production build.

## Payments (Campus Wallet)

- **Top-ups are simulated** – no real card or bank is charged. A top-up must come
  from a saved card, e-wallet or bank (not cash), between RM 1 and RM 500, and the
  balance is capped at RM 2,000.
- **Ride fares:** at checkout passengers pick *Campus Wallet* (default) or *Cash
  to driver*. Wallet fares are held when the seat is requested and refunded in full
  if the passenger cancels before the trip, the driver declines/cancels, or the
  trip starts before the request was accepted. When the driver ends the trip the
  fare is credited to the driver's wallet (`DRIVER_EARNING`).
- Every balance change locks the wallet row and writes a signed ledger entry
  (debits negative), so the transaction history always sums to the balance.
- Only the last 4 digits of card/bank/e-wallet numbers are stored.
- Not built yet: real payment gateway (e.g. Billplz/ToyyibPay FPX), withdrawals,
  referral rewards, late-cancellation fees.
