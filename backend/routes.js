import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase, sendMessagesManual } from './index.js';
import { verifyToken } from './auth.js';

export function setupRoutes(app) {
  // POST login (no auth required)
  app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: 'Usuario y contraseña requeridos' });

    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Credenciales inválidas' });

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, gym: user.gym_nombre });
  });

  // All routes below require a valid JWT
  app.use('/api', verifyToken);

  // GET all clients
  app.get('/api/clients', async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) throw error;
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // POST create client
  app.post('/api/clients', async (req, res) => {
    const { nombre, telefono, pagado } = req.body;

    try {
      const { data, error } = await supabase
        .from('clients')
        .insert([{ nombre, telefono, pagado: pagado || false }])
        .select();

      if (error) throw error;
      res.status(201).json(data[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // PUT update client
  app.put('/api/clients/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, telefono, pagado } = req.body;

    try {
      const { data, error } = await supabase
        .from('clients')
        .update({ nombre, telefono, pagado, updated_at: new Date() })
        .eq('id', id)
        .select();

      if (error) throw error;
      res.json(data[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // DELETE client
  app.delete('/api/clients/:id', async (req, res) => {
    const { id } = req.params;

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) throw error;
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // POST send messages manually
  app.post('/api/send-messages', async (req, res) => {
    const { messageType } = req.body;

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
