#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Pre-deployment verification script
.DESCRIPTION
    Runs all necessary checks before deploying to production
.EXAMPLE
    .\scripts\pre-deploy.ps1
#>

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $PSCommandPath
$ProjectRoot = Split-Path -Parent $ScriptDir

Write-Host "🚀 Pre-Deployment Verification" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Change to project directory
Set-Location $ProjectRoot

# Step 1: Check environment variables
Write-Host "📋 Step 1: Checking environment variables..." -ForegroundColor Yellow
if (Test-Path ".env.local") {
    Write-Host "✅ .env.local exists" -ForegroundColor Green
    
    $envContent = Get-Content ".env.local" -Raw
    $requiredVars = @("GEMINI_API_KEY", "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY")
    $allFound = $true
    
    foreach ($var in $requiredVars) {
        if ($envContent -match $var) {
            Write-Host "  ✅ $var is set" -ForegroundColor Green
        } else {
            Write-Host "  ❌ $var is missing" -ForegroundColor Red
            $allFound = $false
        }
    }
    
    if (-not $allFound) {
        Write-Host "⚠️  Some environment variables are missing" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ .env.local not found" -ForegroundColor Red
    Write-Host "   Create it from .env.example" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Step 2: Install dependencies
Write-Host "📦 Step 2: Checking dependencies..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "✅ node_modules exists" -ForegroundColor Green
} else {
    Write-Host "⚠️  Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ npm install failed" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""

# Step 3: TypeScript check
Write-Host "🔍 Step 3: Running TypeScript check..." -ForegroundColor Yellow
npm run typecheck
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ TypeScript check failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ TypeScript check passed" -ForegroundColor Green

Write-Host ""

# Step 4: Build
Write-Host "🏗️  Step 4: Building production bundle..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build successful" -ForegroundColor Green

Write-Host ""

# Step 5: Test start
Write-Host "🚦 Step 5: Testing production server..." -ForegroundColor Yellow
Write-Host "   Starting server (will timeout after 10 seconds)..." -ForegroundColor Gray

$job = Start-Job -ScriptBlock {
    param($path)
    Set-Location $path
    npm run start
} -ArgumentList $ProjectRoot

Start-Sleep -Seconds 10

if ($job.State -eq "Running") {
    Write-Host "✅ Server started successfully" -ForegroundColor Green
    Stop-Job $job
    Remove-Job $job
} else {
    Write-Host "❌ Server failed to start" -ForegroundColor Red
    Receive-Job $job
    Remove-Job $job
    exit 1
}

Write-Host ""

# Summary
Write-Host "================================" -ForegroundColor Cyan
Write-Host "✅ All checks passed!" -ForegroundColor Green
Write-Host "" 
Write-Host "🚀 Ready for deployment!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  • Deploy to Vercel: npx vercel --prod" -ForegroundColor Gray
Write-Host "  • Deploy to Netlify: npx netlify deploy --prod" -ForegroundColor Gray
Write-Host "  • Deploy to Firebase: firebase deploy --only hosting" -ForegroundColor Gray
Write-Host ""
