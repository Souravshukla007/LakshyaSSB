$appDir = ".\app"

Get-ChildItem -Path $appDir -Recurse -Filter *.tsx | ForEach-Object {
    if ($_.FullName -match 'layout\.tsx') { return }
    
    $content = Get-Content -Raw -Path $_.FullName
    $original = $content

    # Remove Imports
    $content = $content -replace 'import\s+Navbar\s+from\s+[`''"][^`''"]+[`''"];?\r?\n?', ''
    $content = $content -replace 'import\s+Footer\s+from\s+[`''"][^`''"]+[`''"];?\r?\n?', ''
    $content = $content -replace 'import\s+\{\s*Navbar\s*\}\s+from\s+[`''"][^`''"]+[`''"];?\r?\n?', ''
    $content = $content -replace 'import\s+\{\s*Footer\s*\}\s+from\s+[`''"][^`''"]+[`''"];?\r?\n?', ''

    # Remove Tags
    $content = $content -replace '<Navbar\s*/>\r?\n?', ''
    $content = $content -replace '<Footer\s*/>\r?\n?', ''
    $content = $content -replace '<\s*Navbar\s*/?>[\s\S]*?</\s*Navbar\s*>\r?\n?', ''
    $content = $content -replace '<\s*Footer\s*/?>[\s\S]*?</\s*Footer\s*>\r?\n?', ''

    # Clean up excess whitespace
    $content = $content -replace '\r?\n\s*\r?\n\s*\r?\n', "`r`n`r`n"

    if ($content -cne $original) {
        Set-Content -Path $_.FullName -Value $content -NoNewline
        Write-Host "Cleaned: $($_.FullName)"
    }
}
Write-Host "Cleanup Complete."
