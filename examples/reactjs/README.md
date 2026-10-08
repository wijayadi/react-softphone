# React Softphone – Vite + React Example

A minimal [Vite](https://vite.dev) + React (SPA) app that consumes the
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
cd examples/reactjs
pnpm install

# create your local env file from the template
cp .env.example .env
```

Vite only exposes variables prefixed with `VITE_` to the client. `.env` (and
`.env.example`) contains the SIP settings:

| Variable | Example | Description |
| --- | --- | --- |
| `VITE_SIP_DOMAIN` | `your-sip-server.com` | SIP host / domain |
| `VITE_SIP_EXTENSION` | `1001` | SIP user / extension |
| `VITE_SIP_PASSWORD` | `your-sip-password` | SIP password / secret |
| `VITE_SIP_WS_SERVER` | `wss://your-sip-server.com:8089/ws` | JsSIP WebSocket URL |
| `VITE_SIP_DISPLAY_NAME` | `1001` | Caller display name |
| `VITE_SIP_DEBUG` | `false` | Enable verbose JsSIP logging |

> Use a dedicated test extension and do not commit real credentials.

## 3. Run

```bash
pnpm dev      # http://localhost:5173
# or
pnpm build && pnpm preview
```

## How it works

- `src/App.jsx` – builds the SIP config from `import.meta.env`, keeps the
  volume/notification/auto-connect preferences in `localStorage`, and renders
  the imported `react-softphone` component via the built-in launcher and an
  "Open Softphone" button.
- `public/sound/ringing.ogg` and `public/sound/ringback.ogg` – placeholder
  ringtones generated with `ffmpeg`. Replace them with your own audio.

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
it connects on the *next* page load, not immediately. This example defaults
`connectOnStart` to `true` so the socket is attempted on load.

## Troubleshooting

### No WebSocket request at all

Check `localStorage['softphone-connect-on-start']`. If it is `false` (or unset
before this example defaulted to `true`), the component will not connect until
you enable auto-connect **and reload**, or toggle the connection switch.

### `ERR_CERT_COMMON_NAME_INVALID` / WebSocket connection failed

Seen when the SIP server's TLS certificate does not match the host in
`VITE_SIP_WS_SERVER` (very common with self-signed/lab certificates). The app
*is* attempting the connection, but the browser rejects the TLS handshake.

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
  This cannot be done from application code – the browser owns TLS.
- Use a certificate whose SAN matches the host. Note that trusting a
  wrong-name certificate is **not** enough: hostname/IP verification is a
  separate check from trust, and an IP address requires an **IP SAN**
  (`iPAddress`), not a CN.
- If your server also accepts plain WS, set
  `VITE_SIP_WS_SERVER=ws://your-sip-server.com:8089/ws` (works because this dev app is
  served over `http://localhost`; if the app is ever served over HTTPS, the
  browser will block the insecure `ws://` connection as mixed content).

> Never ship `--ignore-certificate-errors` to end users; it disables TLS
> validation for every site in that browser profile.
