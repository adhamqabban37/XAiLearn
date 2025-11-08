#!/usr/bin/env pwsh
# Firestore Security Rules Deployment Script
# This script automates the testing and deployment of Firestore security rules

Write-Host "🔒 FIRESTORE SECURITY RULES DEPLOYMENT" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# Check if Firebase CLI is installed
Write-Host "1️⃣  Checking Firebase CLI..." -ForegroundColor Yellow
try {
    $firebaseVersion = firebase --version 2>&1
    Write-Host "✅ Firebase CLI installed: $firebaseVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Firebase CLI not found. Installing..." -ForegroundColor Red
    npm install -g firebase-tools
    Write-Host "✅ Firebase CLI installed successfully" -ForegroundColor Green
}

Write-Host ""

# Check if user is logged in
Write-Host "2️⃣  Checking Firebase authentication..." -ForegroundColor Yellow
try {
    $projects = firebase projects:list 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Not logged in to Firebase" -ForegroundColor Red
        Write-Host "Please run: firebase login" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "✅ Authenticated with Firebase" -ForegroundColor Green
} catch {
    Write-Host "❌ Firebase authentication error" -ForegroundColor Red
    Write-Host "Please run: firebase login" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Check if dependencies are installed
Write-Host "3️⃣  Installing test dependencies..." -ForegroundColor Yellow
npm install --silent
Write-Host "✅ Dependencies installed" -ForegroundColor Green

Write-Host ""

# Prompt user for testing
Write-Host "4️⃣  Security Rules Testing" -ForegroundColor Yellow
$testChoice = Read-Host "Do you want to test the security rules before deploying? (Y/n)"

if ($testChoice -ne "n" -and $testChoice -ne "N") {
    Write-Host ""
    Write-Host "Starting Firestore emulator..." -ForegroundColor Cyan
    Write-Host "This will run in the background. Press Ctrl+C if you need to stop." -ForegroundColor Gray
    
    # Start emulator in background
    $emulatorJob = Start-Job -ScriptBlock {
        Set-Location $using:PWD
        firebase emulators:start --only firestore 2>&1
    }
    
    # Wait for emulator to start
    Write-Host "Waiting for emulator to initialize..." -ForegroundColor Gray
    Start-Sleep -Seconds 5
    
    # Run tests
    Write-Host ""
    Write-Host "Running security tests..." -ForegroundColor Cyan
    npm run test:security
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "❌ TESTS FAILED!" -ForegroundColor Red
        Write-Host "Security rules have issues. Please review the errors above." -ForegroundColor Yellow
        Write-Host "Stopping emulator..." -ForegroundColor Gray
        Stop-Job -Job $emulatorJob
        Remove-Job -Job $emulatorJob
        exit 1
    }
    
    Write-Host ""
    Write-Host "✅ ALL TESTS PASSED!" -ForegroundColor Green
    
    # Stop emulator
    Write-Host "Stopping emulator..." -ForegroundColor Gray
    Stop-Job -Job $emulatorJob
    Remove-Job -Job $emulatorJob
} else {
    Write-Host "⚠️  Skipping tests (not recommended)" -ForegroundColor Yellow
}

Write-Host ""

# Deployment confirmation
Write-Host "5️⃣  Ready to Deploy" -ForegroundColor Yellow
Write-Host "This will deploy security rules to PRODUCTION." -ForegroundColor Red
$deployChoice = Read-Host "Deploy security rules now? (y/N)"

if ($deployChoice -eq "y" -or $deployChoice -eq "Y") {
    Write-Host ""
    Write-Host "Deploying security rules..." -ForegroundColor Cyan
    firebase deploy --only firestore:rules
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
        Write-Host ""
        Write-Host "🎉 Your Firestore database is now secured!" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "  1. Verify rules in Firebase Console" -ForegroundColor White
        Write-Host "  2. Test with your application" -ForegroundColor White
        Write-Host "  3. Monitor for permission denied errors" -ForegroundColor White
        Write-Host ""
        Write-Host "Firebase Console: https://console.firebase.google.com" -ForegroundColor Blue
    } else {
        Write-Host ""
        Write-Host "❌ DEPLOYMENT FAILED!" -ForegroundColor Red
        Write-Host "Check the errors above and try again." -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host ""
    Write-Host "⚠️  Deployment cancelled" -ForegroundColor Yellow
    Write-Host "To deploy manually, run: npm run deploy:rules" -ForegroundColor Gray
}

Write-Host ""
Write-Host "📚 For more information, see FIRESTORE_SECURITY.md" -ForegroundColor Cyan
