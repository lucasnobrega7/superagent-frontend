// Adicione este script à página HTML para debug
console.log('Testando conexão com a API...')

fetch('http://localhost:8000/health')
  .then(response => {
    console.log('Status da resposta:', response.status)
    return response.json()
  })
  .then(data => {
    console.log('Dados recebidos:', data)
  })
  .catch(error => {
    console.error('Erro de conexão:', error.message)
  })

// Verifique os headers de CORS
fetch('http://localhost:8000/health', { method: 'OPTIONS' })
  .then(response => {
    console.log('CORS check status:', response.status)
    console.log('Access-Control-Allow-Origin:', response.headers.get('Access-Control-Allow-Origin'))
    console.log('Access-Control-Allow-Credentials:', response.headers.get('Access-Control-Allow-Credentials'))
  })
  .catch(error => {
    console.error('CORS check error:', error.message)
  })