# PowerShell script to clean up Git repository - remove sensitive files
Write-Host "🧹 Cleaning up Git repository - removing sensitive files..." -ForegroundColor Yellow

# Remove .env file from Git tracking (but keep local file)
git rm --cached backend/nodejs/.env

# Add the cleaned files  
git add .

# Commit the changes
git commit -m "Remove sensitive data from repository - use .env.example instead"

Write-Host "✅ Cleanup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Push the cleaned repository: git push origin your-branch-name"
Write-Host "2. In Render, set your environment variables manually"
Write-Host "3. Use .env.example as a template for local development"
Write-Host ""
Write-Host "⚠️  Important: Set these environment variables in Render dashboard:" -ForegroundColor Red
Write-Host "- NODE_ENV=production"
Write-Host "- PORT=10000"
Write-Host "- REDIS_URL=your_actual_redis_url"
Write-Host "- REDIS_TLS=true"
Write-Host "- MONGODB_URL=your_actual_mongodb_url"
Write-Host "- JWT_ACCESS_TOKEN_SECRET=your_actual_jwt_secret"
Write-Host "- And all other secrets from your .env file"
