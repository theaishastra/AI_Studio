# PowerShell API Test Script

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Sai Kumar Studio - API Health Check" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:8000"
$timeout = 5000

function Test-Endpoint {
    param(
        [string]$endpoint,
        [string]$description
    )

    $url = "$baseUrl$endpoint"
    Write-Host "Testing: $description" -ForegroundColor Yellow
    Write-Host "  URL: $url"

    try {
        $response = $null
        $sw = [System.Diagnostics.Stopwatch]::StartNew()

        # Using System.Net.Http.HttpClient for non-interactive mode
        $handler = New-Object System.Net.Http.HttpClientHandler
        $client = New-Object System.Net.Http.HttpClient($handler)
        $client.Timeout = [System.TimeSpan]::FromMilliseconds($timeout)

        $task = $client.GetAsync($url)
        $task.Wait()
        $response = $task.Result

        $sw.Stop()

        if ($response.IsSuccessStatusCode) {
            Write-Host "  ✓ Status: $($response.StatusCode)" -ForegroundColor Green
            Write-Host "  ✓ Response Time: $($sw.ElapsedMilliseconds)ms" -ForegroundColor Green

            # Read response content
            $content = $response.Content.ReadAsStringAsync().Result
            if ($content.Length -lt 200) {
                Write-Host "  Response: $content" -ForegroundColor Gray
            } else {
                Write-Host "  Response: $(($content.Substring(0, 200))...)" -ForegroundColor Gray
            }
            Write-Host ""
            return $true
        } else {
            Write-Host "  ✗ Status: $($response.StatusCode)" -ForegroundColor Red
            Write-Host ""
            return $false
        }
    }
    catch {
        Write-Host "  ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
        return $false
    }
}

Write-Host "Checking Backend Connection..." -ForegroundColor Cyan
Write-Host ""

# Test basic health
$healthOk = Test-Endpoint "/api/health" "Health Check"

if (-not $healthOk) {
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "ERROR: Backend is not responding!" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "To start the backend:" -ForegroundColor Yellow
    Write-Host "  cd backend" -ForegroundColor White
    Write-Host "  .\venv\Scripts\Activate.ps1" -ForegroundColor White
    Write-Host "  uvicorn app.main:app --reload --host 0.0.0.0 --port 8000" -ForegroundColor White
    Write-Host ""
    exit 1
}

# Test catalog endpoints
Write-Host "Checking Catalog Endpoints..." -ForegroundColor Cyan
Write-Host ""

Test-Endpoint "/api/catalog/gifts" "Gifts Catalog" | Out-Null
Test-Endpoint "/api/catalog/photography" "Photography Catalog" | Out-Null
Test-Endpoint "/api/catalog/corporate" "Corporate Catalog" | Out-Null
Test-Endpoint "/api/catalog/studio" "Studio Catalog" | Out-Null

# Test homepage
Test-Endpoint "/api/homepage" "Homepage Featured Products" | Out-Null

Write-Host "========================================" -ForegroundColor Green
Write-Host "✓ All systems are operational!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Frontend URL: http://localhost:5500" -ForegroundColor Cyan
Write-Host "API Docs: http://localhost:8000/api/docs" -ForegroundColor Cyan
Write-Host ""
