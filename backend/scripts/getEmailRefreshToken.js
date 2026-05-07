/**
 * OAuth2 — lấy GMAIL_REFRESH_TOKEN (scope gmail.send).
 *
 * So với hướng "readline + dán code thủ công": cách này dùng redirect về localhost
 * và đổi code → token tự động; kết quả giống nhau, UX chuyên nghiệp hơn.
 *
 * Chạy: npm run gmail:token (từ thư mục backend)
 * Cần: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET trong backend/.env
 * Google Cloud: OAuth client (Web) + Authorized redirect URI khớp REDIRECT_URI in ra khi chạy.
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
      'Thiếu GOOGLE_CLIENT_ID hoặc GOOGLE_CLIENT_SECRET trong backend/.env'
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
        res.end(`<p>OAuth lỗi: ${errParam}</p>`);
        server.close();
        process.exit(1);
        return;
      }

      const code = u.searchParams.get('code');
      if (!code) {
        res.writeHead(400);
        res.end('Thiếu ?code=');
        server.close();
        process.exit(1);
        return;
      }

      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(
        '<meta charset="utf-8"><h1>Thành công</h1><p>Bạn có thể đóng tab. Xem refresh token trong terminal.</p>'
      );

      server.close();

      console.log('\n--- Thêm vào backend/.env (hoặc secret manager) ---\n');
      if (tokens.refresh_token) {
        console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}`);
      } else {
        console.warn(
          'Không có refresh_token. Thử: thu hồi quyền app trong Google Account > Bảo mật > Quyền truy cập của bên thứ ba, rồi chạy lại script; hoặc đảm bảo prompt=consent và access_type=offline.'
        );
      }
      console.log(
        '\nGMAIL_SENDER_EMAIL=<email đã đăng nhập khi authorize>\n'
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
    console.log('Redirect URI phải khớp Google Cloud Console:\n  ', REDIRECT_URI);
    console.log('\nMở URL sau trong trình duyệt và đăng nhập tài khoản Gmail gửi mail:\n');
    console.log(authUrl);
    console.log('');
  });

  server.on('error', (err) => {
    console.error('Không mở được server localhost (port đã bị chiếm?):', err.message);
    process.exit(1);
  });
}

main();
