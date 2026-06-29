import { pool, sendMessagesManual } from './index.js';

export function setupRoutes(app) {
  // GET all clients
  app.get('/api/clients', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM clients ORDER BY nombre ASC');
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // POST create client
  app.post('/api/clients', async (req, res) => {
    const { nombre, telefono, pagado } = req.body;

    try {
      const result = await pool.query(
        'INSERT INTO clients (nombre, telefono, pagado) VALUES ($1, $2, $3) RETURNING *',
        [nombre, telefono, pagado || false]
      );
      res.status(201).json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // PUT update client
  app.put('/api/clients/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, telefono, pagado } = req.body;

    try {
      const result = await pool.query(
        'UPDATE clients SET nombre = $1, telefono = $2, pagado = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
        [nombre, telefono, pagado, id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Cliente no encontrado' });
      }
      res.json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // DELETE client
  app.delete('/api/clients/:id', async (req, res) => {
    const { id } = req.params;

    try {
      const result = await pool.query('DELETE FROM clients WHERE id = $1', [id]);
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Cliente no encontrado' });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // POST send messages manually (Day 8 or Day 10)
  app.post('/api/send-messages', async (req, res) => {
    const { messageType } = req.body; // 'day8' or 'day10'

    if (!messageType || !['day8', 'day10'].includes(messageType)) {
      return res.status(400).json({ error: 'messageType debe ser day8 o day10' });
    }

    try {
      const result = await sendMessagesManual(messageType);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}
