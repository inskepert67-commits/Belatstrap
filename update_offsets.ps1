param(
  [string]$DumpPath = "dump.h",
  [string]$DumpedPath = "dumped.html",
  [string]$FflagsPath = "fflags.html"
)

if (-not (Test-Path -LiteralPath $DumpPath)) {
  throw "Missing dump file: $DumpPath"
}
if (-not (Test-Path -LiteralPath $DumpedPath)) {
  throw "Missing dumped.html file: $DumpedPath"
}
if (-not (Test-Path -LiteralPath $FflagsPath)) {
  Write-Warning "Warning: fflags.html not found at $FflagsPath - only updating dumped.html"
  $UpdateFflags = $false
} else {
  $UpdateFflags = $true
}

function Escape-Html([string]$s) {
  if ($null -eq $s) { return "" }
  return ($s -replace "&", "&amp;" -replace "<", "&lt;" -replace ">", "&gt;")
}

# Read dump as lines (keep order)
$lines = Get-Content -LiteralPath $DumpPath

# Parse the dump file into a list of offset objects
$offsets = @()
$version = "unknown"
$offsetCount = 0

# First pass: extract version and count
foreach ($line in $lines) {
    if ($line -match '//\s*roblox version\s*-\s*([^\s<]+)') {
        $version = $matches[1].Trim()
    }
    elseif ($line -match '//\s*total offsets\s*-\s*(\d+)') {
        $offsetCount = [int]$matches[1]
    }
    elseif ($line -match '\s*inline\s+uintptr_t\s+([A-Za-z0-9_]+)\s*=\s*(0x[0-9a-fA-F]+)') {
        $offsets += [PSCustomObject]@{
            Name = $matches[1]
            Value = $matches[2]
        }
    }
}

# Build HTML for dumped.html (code block format)
$codeLines = @()
$codeLines += "<span class=`"comment`">// roblox version - $version</span>"
$codeLines += "<span class=`"comment`">// dumped at      - $(Get-Date -Format 'HH:mm dd/MM/yy')</span>"
$codeLines += "<span class=`"comment`">// total offsets  - $offsetCount</span>"
$codeLines += "<span class=`"comment`">// join my server - https://discord.gg/z6GmVJx8ZA</span>"
$codeLines += ""
$codeLines += "<span class=`"keyword`">namespace</span> offsets {"
$codeLines += "    <span class=`"keyword`">namespace</span> fflags {"

foreach ($offset in $offsets) {
    $codeLines += "        <span class=`"keyword`">inline</span> <span class=`"type`">uintptr_t</span> <span class=`"offset-name`">$($offset.Name)</span> <span class=`"offset-value`">= $($offset.Value)</span>;"
}

$codeLines += "    }"
$codeLines += "}"

# Build HTML for fflags.html (list format) - Only show first 10 offsets
$fflagsItems = @()
$displayCount = [Math]::Min(10, $offsets.Count)

# Add first 10 offsets
for ($i = 0; $i -lt $displayCount; $i++) {
    $offset = $offsets[$i]
    $fflagsItems += @"
          <div class="offset-item p-4 rounded-lg">
            <div class="flex justify-between items-center">
              <span class="text-sm">$($offset.Name)</span>
              <span class="offset-value">$($offset.Value)</span>
            </div>
          </div>
"@
}

$fflagsContent = $fflagsItems -join ""

# Update dumped.html
$html = Get-Content -LiteralPath $DumpedPath -Raw

# Update the code block
$pattern = '(?s)(<pre><code>).*?(</code></pre>)'
if ($html -notmatch $pattern) {
  throw "Could not locate <pre><code> ... </code></pre> block in $DumpedPath"
}

$updated = [regex]::Replace(
  $html,
  $pattern,
  { param($m) $m.Groups[1].Value + ($codeLines -join "`r`n") + $m.Groups[2].Value }
)

# Update the header section with version and offset count
$headerPattern = '(?s)(<p class="text-sm text-gray-400">Total Offsets: <span class="text-red-500 font-bold">)([\d,]+)(</span></p>\s*<p class="text-sm text-gray-400">Version: )([^<]+)(</p>\s*<p class="text-sm text-gray-400">Dumped: )(\d{1,2}:\d{2} \d{1,2}\/\d{1,2}\/\d{2})(</p>)'

$updated = [regex]::Replace(
  $updated,
  $headerPattern,
  {
    param($m)
    $m.Groups[1].Value + 
    ($offsetCount -replace '\B(?=(\d{3})+(?!\d))', ',') + 
    $m.Groups[3].Value + 
    $version + 
    $m.Groups[5].Value + 
    (Get-Date -Format "HH:mm dd/MM/yy") + 
    $m.Groups[7].Value
  }
)

Set-Content -LiteralPath $DumpedPath -Value $updated -Encoding UTF8
Write-Host "Updated offsets in $DumpedPath from $DumpPath"

# Update fflags.html if it exists
if ($UpdateFflags) {
    $fflagsHtml = Get-Content -LiteralPath $FflagsPath -Raw
    
    # Update the offsets container in fflags.html
    $fflagsPattern = '(?s)(<div class="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">\s*).*?(\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/section>)'
    
    $fflagsUpdated = [regex]::Replace(
        $fflagsHtml,
        $fflagsPattern,
        { param($m) $m.Groups[1].Value + $fflagsContent + $m.Groups[2].Value }
    )
    
    # Update the version in the header
    $fflagsHeaderPattern = '(?s)(<h2 class="font-serif text-3xl font-bold text-center text-brandRed">FFLAGS OFFSETS<\/h2>\s*<p class="text-center text-white/70 mt-2">Roblox Fast Flags Memory Offsets Database<\/p>\s*<p class="text-center text-sm text-gray-400 mt-2">Version: )([^<]+)(</p>)'
    
    $fflagsUpdated = [regex]::Replace(
        $fflagsUpdated,
        $fflagsHeaderPattern,
        "`$1$version`$3"
    )
    
    # Update the total count in the header if it exists
    $fflagsCountPattern = '(?s)(<p class="text-center text-sm text-gray-400">Total Offsets: )([^<]+)(</p>)'
    $fflagsUpdated = [regex]::Replace(
        $fflagsUpdated,
        $fflagsCountPattern,
        "`$1$($offsetCount -replace '\B(?=(\d{3})+(?!\d))', ',')`$3"
    )
    
    Set-Content -LiteralPath $FflagsPath -Value $fflagsUpdated -Encoding UTF8
    Write-Host "Updated offsets in $FflagsPath"
}

Write-Host "Version: $version"
Write-Host "Total Offsets: $($offsetCount -replace '\B(?=(\d{3})+(?!\d))', ',')"
