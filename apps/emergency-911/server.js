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

  if (req.url === '/api/health' || req.url === '/api/v1/911/dispatch') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      status: 'ONLINE',
      republic: 'República Digital de Novatlantis',
      design_system: 'Sovereign Civic (Austere Institutional)',
      gcp_project_id: PROJECT_ID,
      service: 'emergency-911',
      gdf_crossing: 'vw_emergency_911_medical_dispatch (health_records x rel_family_graph)',
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
  <title>Comando Nacional de Emergência 911 & Cruzamento GDF HL7 — Novatlantis</title>
  <link rel="icon" type="image/jpeg" href="/assets/coat-of-arms-novatlantis.jpg" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&family=Public+Sans:wght@600;700;800&display=swap" rel="stylesheet" />
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-screen bg-[#f7f9fc] text-[#191c1e] font-['Inter'] antialiased">
  <div class="bg-[#ba1a1a] text-white py-1.5 px-6 text-xs flex justify-between items-center">
    <span class="font-bold uppercase tracking-wider">COMANDO NACIONAL DE EMERGÊNCIA 911 — PRIORIDADE DE VIDA NÍVEL 1</span>
    <span class="font-mono">CRUZAMENTO GDF GOLD #3 ATIVO • PROJETO GCP: ${PROJECT_ID}</span>
  </div>
  <header class="bg-white border-b border-[#c6c6ce] px-6 py-4">
    <div class="max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-4">
      <div class="flex items-center space-x-4">
        <img src="/assets/coat-of-arms-novatlantis.jpg" alt="Brasão" class="w-12 h-12 object-contain border border-[#c6c6ce] p-0.5" />
        <div>
          <h1 class="text-xl font-bold text-slate-900 font-['Public_Sans']">Despacho de Emergência 911 Integrado ao Prontuário HL7 & Grafo Familiar</h1>
          <p class="text-xs text-slate-500">Consulta instantânea de Tipo Sanguíneo, Alergias e Notificação Automática de Familiares</p>
        </div>
      </div>
      <a href="${PORTAL_URL}" class="bg-[#141a32] text-white px-4 py-2 text-xs font-bold uppercase tracking-wider">Abrir Console de Comando 911</a>
    </div>
  </header>
  <main class="max-w-6xl mx-auto p-6 space-y-6">
    <div class="bg-white border-2 border-[#ba1a1a] p-6 space-y-3">
      <h2 class="text-base font-bold text-[#ba1a1a]">Cruzamento GDF de Emergência Médica (health_records × rel_family_graph)</h2>
      <p class="text-xs text-slate-700 leading-relaxed">Ao acionar um chamado 911 para qualquer um dos 100.000 cidadãos, a central recupera em milissegundos o <code>blood_type</code>, <code>allergies</code> e <code>chronic_conditions</code> na tabela <code>health_records</code>, reserva leito no hospital de referência (<code>HOSP-NV-01</code> a <code>05</code>) e dispara alerta automático ao familiar cadastrado em <code>rel_family_graph</code>.</p>
      <a href="/api/v1/911/dispatch" class="inline-block px-4 py-2 bg-[#ba1a1a] text-white text-xs font-mono uppercase font-bold">GET /api/v1/911/dispatch</a>
    </div>
  </main>
</body>
</html>`);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[NOVATLANTIS-EMERGENCY-911] Online on port ${PORT} (Project: ${PROJECT_ID})`);
});
