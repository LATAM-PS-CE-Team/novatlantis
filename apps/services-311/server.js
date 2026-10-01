const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const PROJECT_ID = process.env.GCP_PROJECT_ID || 'novatlantis';
const PORTAL_URL = 'https://novatlantis-landing-portal-wpahcxvhuq-uc.a.run.app';

const server = http.createServer((req, res) => {
  if (req.url === '/assets/flag-novatlantis.jpg' || req.url === '/assets/coat-of-arms-novatlantis.jpg') {
    const filePath = path.join(__dirname, 'public', req.url);
    if (fs.existsSync(filePath)) {
      res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=86400' });
      fs.createReadStream(filePath).pipe(res);
      return;
    }
  }

  if (req.url === '/api/health' || req.url === '/api/v1/311/status') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      status: 'ONLINE',
      republic: 'República Digital de Novatlantis',
      design_system: 'Sovereign Civic (Austere Institutional)',
      gcp_project_id: PROJECT_ID,
      service: 'services-311',
      gdf_tables: ['dim_addresses', 'rel_citizen_residence', 'ops_311_tickets'],
      addresses_georeferenced: 50000,
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
  <title>Zeladoria Urbana 311 & Backstage de Serviços Públicos — Novatlantis</title>
  <link rel="icon" type="image/jpeg" href="/assets/coat-of-arms-novatlantis.jpg" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&family=Public+Sans:wght@600;700;800&display=swap" rel="stylesheet" />
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-screen bg-[#f7f9fc] text-[#191c1e] font-['Inter'] antialiased">
  <div class="bg-[#141a32] text-white py-1.5 px-6 text-xs flex justify-between items-center border-b border-slate-800">
    <span class="font-semibold uppercase tracking-wider">GOVERNO DA REPÚBLICA DIGITAL DE NOVATLANTIS — ZELADORIA URBANA 311</span>
    <span class="font-mono text-[#57fbdb]">MOD-URB-311 • PROJETO GCP: ${PROJECT_ID}</span>
  </div>
  <header class="bg-white border-b border-[#c6c6ce] px-6 py-4">
    <div class="max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-4">
      <div class="flex items-center space-x-4">
        <img src="/assets/coat-of-arms-novatlantis.jpg" alt="Brasão" class="w-12 h-12 object-contain border border-[#c6c6ce] p-0.5" />
        <div>
          <h1 class="text-xl font-bold text-slate-900 font-['Public_Sans']">Central 311 — Atendimento ao Cidadão & Backstage de Servidores Públicos</h1>
          <p class="text-xs text-slate-500">50.000 Endereços Georreferenciados (dim_addresses) • Triagem Agêntica de Infraestrutura Urbana</p>
        </div>
      </div>
      <a href="${PORTAL_URL}" class="bg-[#141a32] text-white px-4 py-2 text-xs font-bold uppercase tracking-wider">Abrir Portal & Fila Backstage 311</a>
    </div>
  </header>
  <main class="max-w-6xl mx-auto p-6 space-y-6">
    <div class="bg-white border border-[#c6c6ce] p-6 space-y-3">
      <h2 class="text-base font-bold text-slate-900">Fluxo Integrado Cidadão → Servidor Público (Backstage 311)</h2>
      <p class="text-xs text-slate-600 leading-relaxed">As demandas registradas pelos cidadãos são automaticamente triadas pelo Agente LLM 311, geolocalizadas contra os 50.000 imóveis da tabela <code>dim_addresses</code> e despachadas para a fila de execução dos servidores públicos habilitados com <code>OPERATIONS_311_911_MANAGER</code> na Identidade 360.</p>
      <a href="/api/v1/311/status" class="inline-block px-4 py-2 bg-[#0061a5] text-white text-xs font-mono uppercase font-bold">GET /api/v1/311/status</a>
    </div>
  </main>
</body>
</html>`);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[NOVATLANTIS-SERVICES-311] Online on port ${PORT} (Project: ${PROJECT_ID})`);
});
