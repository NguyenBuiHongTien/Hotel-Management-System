/**
 * OAuth2 — obtain GMAIL_REFRESH_TOKEN (gmail.send scope).
 *
 * Uses localhost redirect and exchanges the code for tokens automatically
 * (no manual readline/paste flow).
 *
 * Run: npm run gmail:token (from backend folder)
 * Requires: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET in backend/.env
 * Google Cloud: Web OAuth client + Authorized redirect URI matching REDIRECT_URI printed below.
 */

const path = require('path');
const http = require('http');
const { URL } = require('url');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { google } = require('googleapis');

const REDIRECT_PORT = Number(process.env.GMAIL_OAUTH_PORT) || 3000;
const REDIRECT_PATH = '/oauth2callback';
const REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI ||
  `http://localhost:${REDIRECT_PORT}${REDIRECT_PATH}`;

const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

function main() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error(
      'Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in backend/.env'
    );
    process.exit(1);
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    REDIRECT_URI
  );

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
  });

  const server = http.createServer(async (req, res) => {
    try {
      const u = new URL(req.url || '/', `http://localhost:${REDIRECT_PORT}`);
      if (u.pathname !== REDIRECT_PATH) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }

      const errParam = u.searchParams.get('error');
      if (errParam) {
        res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`<p>OAuth error: ${errParam}</p>`);
        server.close();
        process.exit(1);
        return;
      }

      const code = u.searchParams.get('code');
      if (!code) {
        res.writeHead(400);
        res.end('Missing ?code=');
        server.close();
        process.exit(1);
        return;
      }

      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(
        '<meta charset="utf-8"><h1>Success</h1><p>You can close this tab. See the refresh token in the terminal.</p>'
      );

      server.close();

      console.log('\n--- Add to backend/.env (or your secret store) ---\n');
      if (tokens.refresh_token) {
        console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}`);
      } else {
        console.warn(
          'No refresh_token returned. Try: revoke app access in Google Account > Security > Third-party access, then run again; or ensure prompt=consent and access_type=offline.'
        );
      }
      console.log(
        '\nGMAIL_SENDER_EMAIL=<Gmail address used when you authorized>\n'
      );
      process.exit(0);
    } catch (e) {
      console.error(e);
      try {
        res.writeHead(500);
        res.end(String(e.message));
      } catch (_) {}
      server.close();
      process.exit(1);
    }
  });

  server.listen(REDIRECT_PORT, () => {
    console.log('Redirect URI must match Google Cloud Console:\n  ', REDIRECT_URI);
    console.log('\nOpen this URL in a browser and sign in with the Gmail sender account:\n');
    console.log(authUrl);
    console.log('');
  });

  server.on('error', (err) => {
    console.error('Could not start localhost server (port in use?):', err.message);
    process.exit(1);
  });
}

main();
