# React Softphone – Next.js Example

A minimal [Next.js](https://nextjs.org) (App Router) app that consumes the
`react-softphone` component from this repository.

The component is **referenced by path** – it is *not* installed from npm:

```jsonc
// package.json
"dependencies": {
  "react-softphone": "file:../.."
}
```

pnpm materialises the package from the local path (and points the component's
`react` / `react-dom` at this app's copies, so there is a single React
instance).

## 1. Build the component

Because the package publishes its built output from `dist/`, build the root
package once (and again after changing the component source):

```bash
# from the repository root (/data/sengsara/react-softphone)
npm install
npm run build
```

## 2. Install & configure this example

```bash
cd examples/nextjs
pnpm install

# create your local env file from the template
cp .env.example .env
```

`.env` (and `.env.example`) contains the SIP settings:

| Variable | Example | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_SIP_DOMAIN` | `your-sip-server.com` | SIP host / domain |
| `NEXT_PUBLIC_SIP_EXTENSION` | `1001` | SIP user / extension |
| `NEXT_PUBLIC_SIP_PASSWORD` | `your-sip-password` | SIP password / secret |
| `NEXT_PUBLIC_SIP_WS_SERVER` | `wss://your-sip-server.com:8089/ws` | JsSIP WebSocket URL |
| `NEXT_PUBLIC_SIP_DISPLAY_NAME` | `1001` | Caller display name |
| `NEXT_PUBLIC_SIP_DEBUG` | `false` | Enable verbose JsSIP logging |

> Only `NEXT_PUBLIC_*` variables are exposed to the browser. WebRTC/SIP runs in
> the browser, so these values must be public. Use a dedicated test extension
> and do not commit real credentials.

## 3. Run

```bash
pnpm dev      # http://localhost:3000
# or
pnpm build && pnpm start
```

## How it works

- `components/softphone-app.tsx` – client component that builds the SIP config
  from `process.env`, keeps the volume/notification/auto-connect preferences in
  `localStorage`, and renders the component via `next/dynamic` with
  `ssr: false` (the softphone is browser-only).
- `app/page.tsx` – renders the example.
- `types/react-softphone.d.ts` – TypeScript types for the path-linked package.
- `public/sound/ringing.ogg` and `public/sound/ringback.ogg` – placeholder
  ringtones generated with `ffmpeg`. Replace them with your own audio.

> Unlike the Vite example (which aliases the component source), Next consumes
> the built `dist/`. After changing the component source, rebuild it
> (`npm run build` at the repo root) and clear the Next cache
> (`rm -rf .next`) so stale compiled output is not served. The path-linked copy
> in `node_modules/react-softphone` is refreshed on `pnpm install`.

### Debug mode

Enable verbose logging from the browser console:

```js
window.__SOFTPHONE_DEBUG__ = true;
```

## Auto-connect behavior

The component opens the SIP WebSocket (`flowRoute.start()` → `JsSIP.UA.start()`)
only when:

- the `connectOnStart` prop is `true` at mount (auto-connect), or
- the user flips the **Connected/Disconnected** switch in Settings.

Note that the **Auto-Connect** switch in Settings only persists the preference –
it connects on the *next* page load, not immediately. The softphone is loaded
client-side (`next/dynamic` with `ssr: false`), so this example defaults
`connectOnStart` to `true` and attempts the socket on load.

## Troubleshooting

### No WebSocket request at all

Check `localStorage['softphone-connect-on-start']`. If it is `false` (or unset
before this example defaulted to `true`), the component will not connect until
you enable auto-connect **and reload**, or toggle the connection switch.

### `ERR_CERT_COMMON_NAME_INVALID` / WebSocket connection failed

Seen when the SIP server's TLS certificate does not match the host in
`NEXT_PUBLIC_SIP_WS_SERVER` (very common with self-signed/lab certificates).
The app *is* attempting the connection, but the browser rejects the TLS
handshake. This cannot be bypassed from application code – the browser owns
TLS.

Fixes:

- Open `https://your-sip-server.com:8089/ws` in the browser once and accept the
  certificate warning, then reload the app. The browser remembers the bypass
  for that host, so the subsequent `wss://` connection succeeds. (There is no
  interstitial for WebSockets, so you must seed the exception with an HTTPS
  navigation first.)
- For local development only, launch the browser with certificate checks
  disabled, e.g. Chrome/Edge:
  ```bash
  google-chrome --ignore-certificate-errors
  # narrower, per-certificate (base64 SHA-256 SPKI):
  google-chrome --ignore-certificate-errors-spki-list=<base64-spki>
  ```
- Use a certificate whose SAN matches the host. Note that trusting a
  wrong-name certificate is **not** enough: hostname/IP verification is a
  separate check from trust, and an IP address requires an **IP SAN**
  (`iPAddress`), not a CN.
- If your server also accepts plain WS, set
  `NEXT_PUBLIC_SIP_WS_SERVER=ws://your-sip-server.com:8089/ws` (works because this dev
  app is served over `http://localhost`; if the app is ever served over HTTPS,
  the browser will block the insecure `ws://` connection as mixed content).

> Never ship `--ignore-certificate-errors` to end users; it disables TLS
> validation for every site in that browser profile.
