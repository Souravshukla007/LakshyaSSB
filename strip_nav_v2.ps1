$appDir = "C:\Users\Hello\OneDrive\Documents\LakshyaSSB\app"

Get-ChildItem -Path $appDir -Recurse -Filter *.tsx | ForEach-Object {
    if ($_.FullName -match 'layout\.tsx') { return }
    
    $content = Get-Content -Raw -Path $_.FullName
    $original = $content

    # Remove Imports
    $content = $content -replace '(?m)^import\s+Navbar\s+from\s+.*?$', ''
    $content = $content -replace '(?m)^import\s+Footer\s+from\s+.*?$', ''
    $content = $content -replace '(?m)^import\s+\{\s*Navbar\s*\}\s+from\s+.*?$', ''
    $content = $content -replace '(?m)^import\s+\{\s*Footer\s*\}\s+from\s+.*?$', ''

    # Remove Tags
    $content = $content -replace '(?i)<Navbar\s*/>', ''
    $content = $content -replace '(?i)<Footer\s*/>', ''

    if ($content -cne $original) {
        Set-Content -Path $_.FullName -Value $content
        Write-Host "Cleaned: $($_.FullName)"
    }
}
Write-Host "Cleanup Complete."
