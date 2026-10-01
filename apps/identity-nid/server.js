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

  if (req.url === '/api/health' || req.url === '/api/v1/nid/verify') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      status: 'ONLINE',
      republic: 'República Digital de Novatlantis',
      design_system: 'Sovereign Civic (Austere Institutional)',
      gcp_project_id: PROJECT_ID,
      service: 'identity-nid',
      gdf_tables: ['dim_citizens', 'sec_biometrics_nist', 'rel_family_graph', 'iam_identity_360_roles'],
      citizens_indexed: 100000,
      root_admin_nid: 'NID-000-0000-0001-9 (jopoco - Primeiro-Ministro)',
      identity_manager_nid: 'NID-000-0000-0003-5 (Helena Albuquerque)',
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
  <title>Autoridade Soberana de Identidade 360 (NID & Biometria NIST) — Novatlantis</title>
  <link rel="icon" type="image/jpeg" href="/assets/coat-of-arms-novatlantis.jpg" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&family=Public+Sans:wght@600;700;800&display=swap" rel="stylesheet" />
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-screen bg-[#f7f9fc] text-[#191c1e] font-['Inter'] antialiased">
  <div class="bg-[#141a32] text-white py-1.5 px-6 text-xs flex justify-between items-center border-b border-slate-800">
    <span class="font-semibold uppercase tracking-wider">GOVERNO DA REPÚBLICA DIGITAL DE NOVATLANTIS — AUTORIDADE NACIONAL DE IDENTIDADE 360</span>
    <span class="font-mono text-[#57fbdb]">MOD-ID-01 • PROJETO GCP: ${PROJECT_ID}</span>
  </div>
  <header class="bg-white border-b border-[#c6c6ce] px-6 py-4">
    <div class="max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-4">
      <div class="flex items-center space-x-4">
        <img src="/assets/coat-of-arms-novatlantis.jpg" alt="Brasão" class="w-12 h-12 object-contain border border-[#c6c6ce] p-0.5" />
        <div>
          <h1 class="text-xl font-bold text-slate-900 font-['Public_Sans']">Serviço Soberano de Identidade 360 (NID), Biometria NIST & Grafo Familiar</h1>
          <p class="text-xs text-slate-500">Controle Constitucional de Permissões RBAC/ABAC • Base GDF de 100.000 Cidadãos</p>
        </div>
      </div>
      <a href="${PORTAL_URL}" class="bg-[#141a32] text-white px-4 py-2 text-xs font-bold uppercase tracking-wider">Voltar ao Portal & Backstage Unificado</a>
    </div>
  </header>
  <main class="max-w-6xl mx-auto p-6 space-y-6">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-white border border-[#c6c6ce] p-5">
        <span class="text-xs font-mono uppercase text-slate-500">Primeiro-Ministro (Root Admin)</span>
        <p class="text-lg font-bold text-slate-900 mt-1">Jopoco (NID-000-0000-0001-9)</p>
        <p class="text-xs text-slate-600 mt-1">Delega acesso ao Gestor de Identidades 360 com apoio do Secretário-Geral.</p>
      </div>
      <div class="bg-white border border-[#c6c6ce] p-5">
        <span class="text-xs font-mono uppercase text-slate-500">Gestor de Identidades 360</span>
        <p class="text-lg font-bold text-slate-900 mt-1">Helena Albuquerque (NID-000-0000-0003-5)</p>
        <p class="text-xs text-slate-600 mt-1">Concede ou revoga permissões de Backstage conforme credencial profissional.</p>
      </div>
      <div class="bg-white border border-[#c6c6ce] p-5">
        <span class="text-xs font-mono uppercase text-slate-500">Regra de Revogação Imediata</span>
        <p class="text-lg font-bold text-[#006b5b] mt-1">Reversão Automática</p>
        <p class="text-xs text-slate-600 mt-1">Ao remover a permissão na Identidade 360, o usuário volta a ser Cidadão Comum.</p>
      </div>
    </div>
    <div class="bg-white border border-[#c6c6ce] p-6 flex justify-between items-center">
      <div>
        <h2 class="text-base font-bold text-slate-900">API de Verificação Biométrica NIST & Resolução de Escopos 360</h2>
        <p class="text-xs text-slate-600 mt-1">Inspecione o payload técnico JSON de validação ISO/IEC 19794-5, minúcias 19794-2 e chave pública Ed25519.</p>
      </div>
      <a href="/api/v1/nid/verify" class="px-4 py-2 bg-[#0061a5] text-white text-xs font-mono uppercase font-bold">GET /api/v1/nid/verify</a>
    </div>
  </main>
</body>
</html>`);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[NOVATLANTIS-IDENTITY-NID] Online on port ${PORT} (Project: ${PROJECT_ID})`);
});
