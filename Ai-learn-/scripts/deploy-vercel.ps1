#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Quick deployment script for Vercel
.DESCRIPTION
    Runs pre-deployment checks and deploys to Vercel
.EXAMPLE
    .\scripts\deploy-vercel.ps1
#>

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $PSCommandPath
$ProjectRoot = Split-Path -Parent $ScriptDir

Write-Host "🚀 Deploying to Vercel" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan
Write-Host ""

# Change to project directory
Set-Location $ProjectRoot

# Run pre-deployment checks
Write-Host "📋 Running pre-deployment checks..." -ForegroundColor Yellow
& "$ScriptDir\pre-deploy.ps1"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Pre-deployment checks failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🌐 Deploying to Vercel..." -ForegroundColor Yellow
Write-Host ""

# Check if Vercel CLI is installed
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
if (-not $vercelInstalled) {
    Write-Host "⚠️  Vercel CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g vercel
}

# Deploy to Vercel
vercel --prod

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Don't forget to:" -ForegroundColor Yellow
    Write-Host "  • Set environment variables in Vercel dashboard" -ForegroundColor Gray
    Write-Host "  • Test all routes in production" -ForegroundColor Gray
    Write-Host "  • Run Lighthouse audit" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "❌ Deployment failed" -ForegroundColor Red
    exit 1
}
