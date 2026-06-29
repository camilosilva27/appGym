import { supabase } from './index.js';

export function setupRoutes(app) {
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
}
