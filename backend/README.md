# Senate POS — Backend (Activation / MobilePoss)

PHP backend imported from `github.com/nortaip/Activation`. It powers device
activation, blocking, venues, owners and activation codes for Senate POS, and
is the live data source for the admin console at `/admin`.

## 🔐 SECURITY — read first

The original files contained **hardcoded production secrets** that are public
in the source repo. They have been moved to environment variables here, but the
leaked values must be **rotated immediately**:

- **MySQL** user/password (`asif` / the old password) → change the DB password.
- **API bearer tokens** (`api/config.php`) → generate new tokens.
- **Telegram bot token** (`send_otp_telegram.php`) → revoke via @BotFather.
- Consider making the `nortaip/Activation` repo **private**.

Configure secrets via the environment — see `.env.example`.

## Layout

```
api/
  index.php                  router
  bootstrap.php              config + cors + bearer auth wiring
  config.php                 PDO connection + tokens (env-based)
  devices.php                CRUD on devices
  device_activations_view.php devices ⨝ venues ⨝ codes  ← richest read view
  device_activation_codes.php / regenerate_code.php
  device_block_logs.php
  venues.php / venue_summary.php / venue_codes.php / venue_device_limits.php
  owners.php
  helpers/                   auth, cors, response, validation, audit, logger, migrations
admin/index.html             standalone back-office UI (token + base URL)
*.php (root)                 legacy mobile endpoints (ActivateDevice, BindVenue, …)
```

## Auth

Endpoints under `api/` require `Authorization: Bearer <API_TOKEN>` (see
`bootstrap.php`). For quick read-only testing you can append `?no_auth=1`.

## Data shape (devices)

`GET api/device_activations_view.php?status=all&limit=200` →

```json
{
  "ok": true, "page": 1, "limit": 200, "total": 42,
  "data": [
    {
      "id": 12, "device_name": "Kassa-1", "stable_id": "…", "imei": "…",
      "app_version": "4.5.5", "status": "active",        // inactive | active | blocked
      "venue_id": 2, "venue_code": "…", "venue_domain": "…",
      "created_at": "…", "activated_at": "…", "blocked_at": null,
      "activation_code": "…", "code_expires_at": "…"
    }
  ]
}
```

> Note: the schema has **no latency/health/CPU/usage** columns. The admin
> console maps `status → online/offline`, `updated_at|activated_at → last seen`,
> `venue → location`, `app_version → version`. Live `ms`/`health`/`usage` will
> only appear once devices send heartbeats to the backend (not stored today).

## Connecting the `/admin` console

In the console (⚙ DATA ENDPOINT) set, e.g.:

```
https://appmobile.svurguns.cyou/Data/MobilePoss/api/device_activations_view.php?status=all&limit=200&no_auth=1
```

For production, keep auth on and proxy through the Next route with a token, and
add your site's origin to `CORS_ORIGINS`.
