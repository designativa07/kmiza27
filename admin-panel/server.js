const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = 4000;
const BACKEND_URL = 'http://localhost:3000';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// API Routes
app.get('/api/status', async (req, res) => {
  try {
    const response = await axios.get(`${BACKEND_URL}/chatbot/status`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao conectar com o backend' });
  }
});

app.get('/api/teams', async (req, res) => {
  try {
    const response = await axios.get(`${BACKEND_URL}/teams`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar times' });
  }
});

app.get('/api/matches', async (req, res) => {
  try {
    const response = await axios.get(`${BACKEND_URL}/matches`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar jogos' });
  }
});

app.post('/api/test-message', async (req, res) => {
  try {
    const response = await axios.post(`${BACKEND_URL}/chatbot/test-message`, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao testar mensagem' });
  }
});

// Servir o painel administrativo
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Painel Administrativo rodando em http://localhost:${PORT}`);
  console.log(`📊 Dashboard disponível em: http://localhost:${PORT}`);
}); 