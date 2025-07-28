const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:3000';
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRlc3RlQGFtYWRvci5jb20iLCJpZCI6NTMsInJvbGUiOiJhbWF0ZXVyIiwiaWF0IjoxNzUzNTg2Mjg3LCJleHAiOjE3NTM2NzI2ODd9.7XEsK7KU9DAPLAk7XqDK49pImiF_EvDo8KciYzLd764';

async function testUpload() {
  try {
    console.log('Testando upload de imagem...');
    
    // Criar um arquivo de teste simples
    const testImagePath = path.join(__dirname, 'test-image.txt');
    fs.writeFileSync(testImagePath, 'Test image content');
    
    // Ler o arquivo como buffer
    const fileBuffer = fs.readFileSync(testImagePath);
    
    // Criar FormData manualmente
    const boundary = '----WebKitFormBoundary' + Math.random().toString(16).substr(2);
    const formData = [];
    
    // Adicionar campo folder
    formData.push(`--${boundary}`);
    formData.push('Content-Disposition: form-data; name="folder"');
    formData.push('');
    formData.push('escudos');
    
    // Adicionar campo entityName
    formData.push(`--${boundary}`);
    formData.push('Content-Disposition: form-data; name="entityName"');
    formData.push('');
    formData.push('test-team');
    
    // Adicionar arquivo
    formData.push(`--${boundary}`);
    formData.push('Content-Disposition: form-data; name="file"; filename="test-image.txt"');
    formData.push('Content-Type: text/plain');
    formData.push('');
    formData.push(fileBuffer.toString());
    
    formData.push(`--${boundary}--`);
    
    const body = formData.join('\r\n');
    
    console.log('Enviando requisição de upload...');
    
    const response = await fetch(`${API_URL}/upload/cloud`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': Buffer.byteLength(body)
      },
      body: body
    });
    
    console.log('Status da resposta:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Resposta do upload:', data);
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