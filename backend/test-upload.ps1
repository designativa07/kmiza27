# Script para testar upload de arquivo
$uri = "http://localhost:3000/upload/escudo"
$filePath = "C:\Users\PC\Documents\kmizabot30-05\kmiza27\backend\test-stadium.txt"

# Criar boundary para multipart
$boundary = [System.Guid]::NewGuid().ToString()

# Ler conteúdo do arquivo
$fileContent = [System.IO.File]::ReadAllBytes($filePath)
$fileName = [System.IO.Path]::GetFileName($filePath)

# Criar corpo da requisição multipart
$LF = "`r`n"
$bodyLines = (
    "--$boundary",
    "Content-Disposition: form-data; name=`"file`"; filename=`"$fileName`"",
    "Content-Type: text/plain$LF",
    [System.Text.Encoding]::GetEncoding("iso-8859-1").GetString($fileContent),
    "--$boundary--$LF"
) -join $LF

# Converter para bytes
$body = [System.Text.Encoding]::GetEncoding("iso-8859-1").GetBytes($bodyLines)

# Fazer a requisição
try {
    $response = Invoke-WebRequest -Uri $uri -Method POST -Body $body -ContentType "multipart/form-data; boundary=$boundary"
    Write-Host "✅ Upload bem-sucedido!"
    Write-Host "Status: $($response.StatusCode)"
    Write-Host "Response: $($response.Content)"
} catch {
    Write-Host "❌ Erro no upload:"
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody"
    }
} 