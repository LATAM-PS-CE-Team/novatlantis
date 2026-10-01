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

  if (req.url === '/api/health' || req.url === '/api/v1/education/curriculum') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      status: 'ONLINE',
      republic: 'República Digital de Novatlantis',
      design_system: 'Sovereign Civic (Austere Institutional)',
      gcp_project_id: PROJECT_ID,
      service: 'education-learn',
      gdf_tables: ['edu_institutions', 'edu_enrollments', 'rel_family_graph', 'ops_school_exams'],
      enrolled_students: 17993,
      schools_total: 6,
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
  <title>Ministério da Educação, Escolas & Diário Docente — Novatlantis</title>
  <link rel="icon" type="image/jpeg" href="/assets/coat-of-arms-novatlantis.jpg" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&family=Public+Sans:wght@600;700;800&display=swap" rel="stylesheet" />
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-screen bg-[#f7f9fc] text-[#191c1e] font-['Inter'] antialiased">
  <div class="bg-[#141a32] text-white py-1.5 px-6 text-xs flex justify-between items-center border-b border-slate-800">
    <span class="font-semibold uppercase tracking-wider">GOVERNO DA REPÚBLICA DIGITAL DE NOVATLANTIS — MINISTÉRIO DA EDUCAÇÃO & AVALIAÇÃO</span>
    <span class="font-mono text-[#57fbdb]">MOD-EDU-06 • PROJETO GCP: ${PROJECT_ID}</span>
  </div>
  <header class="bg-white border-b border-[#c6c6ce] px-6 py-4">
    <div class="max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-4">
      <div class="flex items-center space-x-4">
        <img src="/assets/coat-of-arms-novatlantis.jpg" alt="Brasão" class="w-12 h-12 object-contain border border-[#c6c6ce] p-0.5" />
        <div>
          <h1 class="text-xl font-bold text-slate-900 font-['Public_Sans']">Gestão de Escolas, Alunos, Provas e Desempenho por Matéria</h1>
          <p class="text-xs text-slate-500">17.993 Matrículas Ativas (4 a 22 anos) • Alerta Precoce de Evasão aos Pais via Grafo Familiar</p>
        </div>
      </div>
      <a href="${PORTAL_URL}" class="bg-[#141a32] text-white px-4 py-2 text-xs font-bold uppercase tracking-wider">Abrir Backstage Educação & Diário do Professor</a>
    </div>
  </header>
  <main class="max-w-6xl mx-auto p-6 space-y-6">
    <div class="bg-white border border-[#c6c6ce] p-6 space-y-3">
      <h2 class="text-base font-bold text-slate-900">Portal Docente & Cruzamento GDF de Evasão Escolar</h2>
      <p class="text-xs text-slate-600 leading-relaxed">Professores e gestores educacionais habilitados na Identidade 360 aplicam provas, lançam notas por disciplina (Matemática, Ciências, IA & Robótica, Linguagens) e acompanham o alerta automático enviado aos pais (<code>rel_family_graph</code>) quando a frequência cai abaixo de 75%.</p>
      <a href="/api/v1/education/curriculum" class="inline-block px-4 py-2 bg-[#0061a5] text-white text-xs font-mono uppercase font-bold">GET /api/v1/education/curriculum</a>
    </div>
  </main>
</body>
</html>`);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[NOVATLANTIS-EDUCATION-LEARN] Online on port ${PORT} (Project: ${PROJECT_ID})`);
});
