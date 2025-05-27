const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// API Routes de Proxy para Autenticação
app.post('/auth/login', async (req, res) => {
  try {
    const response = await axios.post(`${BACKEND_URL}/auth/login`, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ 
      message: error.response?.data?.message || 'Erro no servidor' 
    });
  }
});

app.post('/auth/verify', async (req, res) => {
  try {
    const response = await axios.post(`${BACKEND_URL}/auth/verify`, {}, {
      headers: {
        'Authorization': req.headers.authorization
      }
    });
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ 
      valid: false, 
      message: error.response?.data?.message || 'Token inválido' 
    });
  }
});

app.post('/auth/create-admin', async (req, res) => {
  try {
    const response = await axios.post(`${BACKEND_URL}/auth/create-admin`, req.body, {
      headers: {
        'Authorization': req.headers.authorization
      }
    });
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ 
      success: false,
      message: error.response?.data?.message || 'Erro ao criar usuário administrativo' 
    });
  }
});

// API Routes de Proxy para Usuários
app.get('/users', async (req, res) => {
  try {
    const response = await axios.get(`${BACKEND_URL}/users`, {
      headers: {
        'Authorization': req.headers.authorization
      }
    });
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ 
      error: 'Erro ao buscar usuários' 
    });
  }
});

app.get('/users/admins', async (req, res) => {
  try {
    const response = await axios.get(`${BACKEND_URL}/users/admins`, {
      headers: {
        'Authorization': req.headers.authorization
      }
    });
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ 
      error: 'Erro ao buscar administradores' 
    });
  }
});

app.get('/users/stats', async (req, res) => {
  try {
    const response = await axios.get(`${BACKEND_URL}/users/stats`, {
      headers: {
        'Authorization': req.headers.authorization
      }
    });
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ 
      error: 'Erro ao buscar estatísticas' 
    });
  }
});

app.patch('/users/:id/promote-admin', async (req, res) => {
  try {
    const response = await axios.patch(`${BACKEND_URL}/users/${req.params.id}/promote-admin`, {}, {
      headers: {
        'Authorization': req.headers.authorization
      }
    });
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ 
      success: false,
      message: error.response?.data?.message || 'Erro ao promover usuário' 
    });
  }
});

app.patch('/users/:id/demote-admin', async (req, res) => {
  try {
    const response = await axios.patch(`${BACKEND_URL}/users/${req.params.id}/demote-admin`, {}, {
      headers: {
        'Authorization': req.headers.authorization
      }
    });
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ 
      success: false,
      message: error.response?.data?.message || 'Erro ao remover privilégios de admin' 
    });
  }
});

app.delete('/users/:id', async (req, res) => {
  try {
    const response = await axios.delete(`${BACKEND_URL}/users/${req.params.id}`, {
      headers: {
        'Authorization': req.headers.authorization
      }
    });
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ 
      success: false,
      message: error.response?.data?.message || 'Erro ao excluir usuário' 
    });
  }
});

// API Routes existentes
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

// Servir as páginas do painel administrativo
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Painel Administrativo rodando em http://localhost:${PORT}`);
  console.log(`📊 Dashboard disponível em: http://localhost:${PORT}`);
  console.log(`🔐 Login: admin_kmiza27`);
  console.log(`🔑 Senha: admin@kmiza27`);
}); 