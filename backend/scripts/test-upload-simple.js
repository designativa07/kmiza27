const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:3000';
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRlc3RlQGFtYWRvci5jb20iLCJpZCI6NTMsInJvbGUiOiJhbWF0ZXVyIiwiaWF0IjoxNzUzNTg2Mjg3LCJleHAiOjE3NTM2NzI2ODd9.7XEsK7KU9DAPLAk7XqDK49pImiF_EvDo8KciYzLd764';

async function testUpload() {
  try {
    console.log('Testando upload simples...');
    
    // Criar um arquivo de teste
    const testImagePath = path.join(__dirname, 'test-image.txt');
    fs.writeFileSync(testImagePath, 'Test image content');
    
    // Ler o arquivo como buffer
    const fileBuffer = fs.readFileSync(testImagePath);
    
    // Criar FormData
    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('file', fileBuffer, 'test-image.txt');
    formData.append('folder', 'escudos');
    formData.append('entityName', 'test-team');
    
    console.log('Enviando requisição...');
    
    const response = await fetch(`${API_URL}/upload/cloud`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        ...formData.getHeaders()
      },
      body: formData
    });
    
    console.log('Status da resposta:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Resposta do upload:', data);
      console.log('URL gerada:', data.url || data.cloudUrl);
    } else {
      const error = await response.text();
      console.error('Erro no upload:', error);
    }
    
    // Limpar arquivo de teste
    fs.unlinkSync(testImagePath);
    
  } catch (error) {
    console.error('Erro no teste:', error);
  }
}

testUpload(); 