export default {
  async fetch(request, env) {
    const cookieHeader = request.headers.get("Cookie") || "";
    const existingCode = getCookie(cookieHeader, "user_code");

    if (existingCode) {
      return renderPage(decodeURIComponent(existingCode), "ACTIVE");
    }

    const raw = await env.CODES_KV.get("codes");
    let codes = [];

    try {
      codes = JSON.parse(raw || "[]");
      if (!Array.isArray(codes)) codes = [];
    } catch {
      codes = [];
    }

    if (!codes.length) {
      return renderPage("NO_CODES_LEFT", "EMPTY");
    }

    const code = codes.shift();

    await env.CODES_KV.put("codes", JSON.stringify(codes));

    const response = renderPage(code, "NEW");

    const cookieParts = [
      `user_code=${encodeURIComponent(code)}`,
      "Path=/",
      "SameSite=Lax",
      "Max-Age=31536000"
    ];

    if (new URL(request.url).protocol === "https:") {
      cookieParts.push("Secure");
    }

    response.headers.set("Set-Cookie", cookieParts.join("; "));
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    response.headers.set("Pragma", "no-cache");

    return response;
  }
};

function getCookie(cookieHeader, name) {
  const parts = cookieHeader.split(";").map(s => s.trim());
  const found = parts.find(part => part.startsWith(name + "="));
  return found ? found.slice(name.length + 1) : "";
}

function renderPage(code, status) {
  return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Confidential Access</title>
<style>
  body{
    margin:0;
    background:#0b1020;
    color:white;
    font-family:Arial,sans-serif;
    display:flex;
    justify-content:center;
    align-items:center;
    min-height:100vh;
    padding:20px;
  }

  .box{
    width:100%;
    max-width:720px;
    padding:40px;
    border-radius:24px;
    background:rgba(255,255,255,.05);
    border:1px solid rgba(255,255,255,.1);
    box-shadow:0 24px 80px rgba(0,0,0,.35);
  }

  h1{
    font-size:48px;
    margin:0 0 20px;
    line-height:1.05;
  }

  .code{
    margin-top:20px;
    padding:20px;
    font-size:32px;
    background:black;
    border-radius:14px;
    word-break:break-all;
    letter-spacing:.04em;
  }

  .info{
    margin-top:15px;
    opacity:.75;
    line-height:1.6;
  }

  .buttons{
    margin-top:30px;
    display:grid;
    gap:12px;
  }

  a{
    text-decoration:none;
    padding:16px;
    border-radius:12px;
    text-align:center;
    color:white;
    font-weight:bold;
    transition:transform .15s ease, opacity .15s ease;
  }

  a:hover{
    transform:translateY(-1px);
    opacity:.95;
  }

  .ai{
    background:#d4af37;
    color:black;
  }

  .ebook{
    background:#1f3f7a;
  }
</style>
</head>
<body>
  <div class="box">
    <h1>One code. Limited visibility.</h1>

    <div class="code" id="code">${escapeHtml(code)}</div>

    <div class="info">
      Status: ${escapeHtml(status)}
      <br>
      This device keeps the same assigned code.
    </div>

    <div class="buttons">
      <a
        class="ai"
        href="https://gemini.google.com/gem/1GXwkzDXe-HjMtE5K3eq9-8CNh4Q3trBu?usp=sharing"
        target="_blank"
        rel="noopener noreferrer"
      >
        OPEN AI
      </a>

      <a
        class="ebook"
        href="https://1drv.ms/b/c/af8a827fb8c189ff/IQBXA82JtsfGQqwDTaFdXgdPAVqjhkMqEMKqTm_kyWsYti0?e=ySypji"
        target="_blank"
        rel="noopener noreferrer"
      >
        OPEN EBOOK
      </a>
    </div>
  </div>

  <script>
    const LIMIT = 5;
    const KEY = "views";

    let views = Number(localStorage.getItem(KEY) || "0");

    if (views >= LIMIT) {
      document.getElementById("code").innerText = "REDACTED";
    } else {
      views++;
      localStorage.setItem(KEY, String(views));
    }
  </script>
</body>
</html>`, {
    headers: {
      "content-type": "text/html;charset=UTF-8",
      "cache-control": "no-store, no-cache, must-revalidate, max-age=0",
      "pragma": "no-cache"
    }
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
