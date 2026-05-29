export default {
  async fetch(request, env) {

    const cookie = request.headers.get("Cookie") || "";
    const existingCode = cookie.match(/user_code=([^;]+)/)?.[1];

    // Si ya tiene código, reutilizarlo
    if (existingCode) {
      return renderPage(existingCode, "ACTIVE");
    }

    const raw = await env.CODES_KV.get("codes");
    let codes = JSON.parse(raw || "[]");

    if (!codes.length) {
      return renderPage("NO_CODES_LEFT", "EMPTY");
    }

    // coger uno nuevo SOLO la primera vez
    const code = codes.shift();

    await env.CODES_KV.put(
      "codes",
      JSON.stringify(codes)
    );

    const response = renderPage(code, "NEW");

    response.headers.append(
      "Set-Cookie",
      `user_code=${code}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=31536000`
    );

    return response;
  }
}

function renderPage(code, status){

return new Response(`
<!DOCTYPE html>
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
}

h1{
font-size:48px;
margin:0 0 20px;
}

.code{
margin-top:20px;
padding:20px;
font-size:32px;
background:black;
border-radius:14px;
word-break:break-all;
}

.info{
margin-top:15px;
opacity:.7;
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

<div class="code" id="code">${code}</div>

<div class="info">
Status: ${status}
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

if(views >= LIMIT){
document.getElementById("code").innerText = "REDACTED";
}else{
views++;
localStorage.setItem(KEY, views);
}

</script>

</body>
</html>
`,{
headers:{
"content-type":"text/html;charset=UTF-8"
}
});

}
