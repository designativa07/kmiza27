// Teste simples da API de configurações
fetch('http://localhost:3000/system-settings/futepedia-images')
  .then(response => {
    console.log('Status:', response.status);
    console.log('Headers:', response.headers);
    return response.json();
  })
  .then(data => {
    console.log('✅ Dados recebidos:', data);
    console.log('Logo URL:', data.headerLogoUrl);
  })
  .catch(error => {
    console.error('❌ Erro:', error);
  }); 