const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const PROJECT_ID = process.env.GCP_PROJECT_ID || 'novatlantis';

const server = http.createServer((req, res) => {
  if (req.url === '/assets/flag-novatlantis.jpg' || req.url === '/assets/coat-of-arms-novatlantis.jpg') {
    const filePath = path.join(__dirname, 'public', req.url);
    if (fs.existsSync(filePath)) {
      res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=86400' });
      fs.createReadStream(filePath).pipe(res);
      return;
    }
  }

  if (req.url === '/healthz' || req.url === '/api/v1/nid/verify') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      status: 'ONLINE',
      republic: 'República Digital de Novatlantis',
      motto: 'NOVATLANTIS • LIBERTAS IN DIGITALI',
      gcp_project_id: PROJECT_ID,
      service: 'identity-nid',
      ai_agent: 'agent-nist-biometric-verifier-v4',
      supported_locales: ['pt-BR', 'es-419', 'en-US'],
      timestamp: new Date().toISOString()
    }, null, 2));
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Autoridade Soberana de Identidade (NID) & Biometria NIST — Novatlantis</title>
  <link rel="icon" type="image/jpeg" href="/assets/coat-of-arms-novatlantis.jpg" />
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-screen bg-[#041434] text-white font-sans antialiased">
  <header class="bg-gradient-to-r from-[#062356] via-[#082F72] to-[#051C48] border-b border-amber-400/40 p-6">
    <div class="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <img src="/assets/coat-of-arms-novatlantis.jpg" alt="Brasão de Novatlantis" class="w-16 h-16 rounded-xl bg-white p-1 border-2 border-amber-400 object-contain" />
        <div>
          <span class="text-xs font-mono uppercase tracking-widest text-amber-300 font-bold">NOVATLANTIS • LIBERTAS IN DIGITALI • GCP: ${PROJECT_ID}</span>
          <h1 class="text-2xl font-bold mt-0.5">Autoridade Soberana de Identidade (NID) & Biometria NIST</h1>
          <p class="text-sm text-sky-200">Emissão de Credenciais Módulo 11, Templates ISO/IEC 19794-5 & 19794-2 e Assinatura Ed25519</p>
        </div>
      </div>
      <img src="/assets/flag-novatlantis.jpg" alt="Bandeira de Novatlantis" class="w-24 h-16 object-cover rounded-lg border-2 border-amber-400 shadow-md" />
    </div>
  </header>
  <main class="max-w-5xl mx-auto p-6 space-y-6">
    <div class="bg-[#071F4A] border border-sky-400/30 rounded-2xl p-6 shadow-xl space-y-4">
      <div class="flex items-center justify-between">
        <span class="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">● AGENTE ATIVO: agent-nist-biometric-verifier-v4</span>
        <a href="/api/v1/nid/verify" class="text-xs font-mono text-amber-300 underline">Ver Endpoint JSON (/api/v1/nid/verify)</a>
      </div>
      <p class="text-sm text-slate-200">Microsserviço soberano integrado via Single-Click Launchpad OIDC/JWT e protegido por Google Cloud Armor (OWASP Top 10) no projeto <strong>${PROJECT_ID}</strong>.</p>
    </div>
  </main>
</body>
</html>`);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[NOVATLANTIS-IDENTITY-NID] Online on port ${PORT} (Project: ${PROJECT_ID})`);
});
