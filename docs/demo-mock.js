// Modo demo: se activa con ?demo en la URL. Reemplaza fetch por datos de ejemplo en memoria
// (persisten en localStorage del navegador). Nunca toca el backend real.
(function () {
  const KEY = 'appgym-demo-v1';
  const GYM = 'Gimnasio Fuerza Luján';
  const seed = () => {
    const base = [
      ['Agustina Romero', '2323456781', true], ['Bruno Ferreyra', '2323456712', false],
      ['Carla Benítez', '2323478234', true], ['Diego Medina', '2323998812', true],
      ['Florencia Ruiz', '2323482345', false], ['Gonzalo Paz', '2323112233', true],
      ['Lucía Acosta', '2323493456', true], ['Martín Sosa', '2323445566', false],
      ['Romina Giménez', '2323404567', true], ['Santiago Ledesma', '2323415678', true],
      ['Valentina Correa', '2323426789', false], ['Tomás Aguirre', '2323437890', true]
    ];
    const clients = base.map(([nombre, telefono, pagado], i) => ({ id: i + 1, nombre, telefono, pagado }));
    const now = new Date();
    const history = [];
    for (let k = 1; k <= 5; k++) {
      const d = new Date(now.getFullYear(), now.getMonth() - k, 1);
      clients.forEach(c => history.push({ client_id: c.id, nombre: c.nombre, anio: d.getFullYear(), mes: d.getMonth() + 1, pagado: (c.id + k) % 4 !== 0 }));
    }
    return { clients, history, nextId: clients.length + 1 };
  };
  let db;
  try { db = JSON.parse(localStorage.getItem(KEY)) || seed(); } catch (e) { db = seed(); }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {} };
  const res = (body, status = 200) => ({ ok: status < 400, status, json: async () => body });

  localStorage.setItem('token', 'demo');
  localStorage.setItem('gym', GYM);

  window.fetch = async (url, opts = {}) => {
    const method = (opts.method || 'GET').toUpperCase();
    const body = opts.body ? JSON.parse(opts.body) : {};
    const path = String(url).replace(/^.*\/api/, '');
    await new Promise(r => setTimeout(r, 150));
    if (path === '/login') return res({ token: 'demo', gym: GYM });
    if (path === '/clients' && method === 'GET') return res(db.clients);
    if (path === '/clients' && method === 'POST') {
      const c = { id: db.nextId++, nombre: body.nombre, telefono: body.telefono, pagado: !!body.pagado };
      db.clients.push(c); save(); return res(c, 201);
    }
    const m = path.match(/^\/clients\/(\d+)$/);
    if (m) {
      const id = +m[1], c = db.clients.find(x => x.id === id);
      if (!c) return res({ error: 'No encontrado' }, 404);
      if (method === 'PUT') { Object.assign(c, body); save(); return res(c); }
      if (method === 'DELETE') { db.clients = db.clients.filter(x => x.id !== id); save(); return res({ ok: true }); }
    }
    if (path === '/payment-history') return res(db.history);
    if (path === '/send-messages') {
      const deudores = db.clients.filter(c => !c.pagado);
      return res({ sent: deudores.length, total: deudores.length,
        results: deudores.map(c => ({ ok: true, nombre: c.nombre, phone: '549' + c.telefono })) });
    }
    return res({ error: 'Ruta no simulada' }, 404);
  };
  window.resetDemo = () => { localStorage.removeItem(KEY); location.reload(); };
})();
