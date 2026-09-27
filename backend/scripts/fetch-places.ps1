# Fetches real places from OpenStreetMap for extra cities and saves them for the backend.
# Place data (c) OpenStreetMap contributors. Visit times and costs are category estimates.
# Run from the backend folder:  powershell -ExecutionPolicy Bypass -File scripts\fetch-places.ps1

$cities = @(
  @{ code = "hfx"; name = "Halifax"; bbox = "44.62,-63.62,44.68,-63.55" },
  @{ code = "mct"; name = "Moncton"; bbox = "46.07,-64.82,46.11,-64.74" }
)

$skip = @("Tim Hortons", "Starbucks", "McDonald's", "Second Cup", "Subway", "Dunkin'", "Dunkin")

# Per category: visit minutes, cost per person, description template, max places per city
$rules = @{
  food     = @{ minutes = 25; cost = 7;  about = "Local cafe in {0}, a good stop for a drink or a snack."; max = 8 }
  park     = @{ minutes = 30; cost = 0;  about = "Park in {0}, good for a relaxed stroll."; max = 6 }
  nature   = @{ minutes = 20; cost = 0;  about = "Scenic viewpoint in {0}, worth a quick stop."; max = 3 }
  art      = @{ minutes = 30; cost = 0;  about = "Art gallery in {0}."; max = 4 }
  culture  = @{ minutes = 45; cost = 10; about = "Museum in {0}."; max = 4 }
  activity = @{ minutes = 45; cost = 15; about = "Local attraction in {0}."; max = 4 }
}

$template = '[out:json][timeout:25];(node["amenity"="cafe"]({0});node["tourism"~"museum|gallery|attraction|viewpoint"]({0});way["tourism"~"museum|gallery|attraction"]({0});way["leisure"="park"]({0}););out center 200;'

$all = @()
foreach ($city in $cities) {
  Write-Host "Fetching $($city.name)..."
  $q = $template -f $city.bbox
  $resp = Invoke-WebRequest -Method Post -Uri "https://overpass-api.de/api/interpreter" -Body @{ data = $q } -UserAgent "SideQuest-Hackathon/1.0 (semiloreoyedepo@gmail.com)" -UseBasicParsing
  $text = [Text.Encoding]::UTF8.GetString($resp.RawContentStream.ToArray())
  $data = $text | ConvertFrom-Json

  $counts = @{}
  $seen = @{}
  $i = 1
  foreach ($e in $data.elements) {
    $name = $e.tags.name
    if (-not $name -or $seen.ContainsKey($name) -or ($skip -contains $name)) { continue }

    $cat = $null
    if ($e.tags.amenity -eq "cafe") { $cat = "food" }
    elseif ($e.tags.tourism -eq "museum") { $cat = "culture" }
    elseif ($e.tags.tourism -eq "gallery") { $cat = "art" }
    elseif ($e.tags.tourism -eq "viewpoint") { $cat = "nature" }
    elseif ($e.tags.tourism -eq "attraction") { $cat = "activity" }
    elseif ($e.tags.leisure -eq "park") { $cat = "park" }
    if (-not $cat) { continue }

    $rule = $rules[$cat]
    if ($counts[$cat] -ge $rule.max) { continue }

    $lat = if ($e.lat) { $e.lat } else { $e.center.lat }
    $lng = if ($e.lon) { $e.lon } else { $e.center.lon }
    if (-not $lat) { continue }

    $seen[$name] = $true
    $counts[$cat] = [int]$counts[$cat] + 1
    $all += [ordered]@{
      placeId = "$($city.code)$i"
      name = $name
      category = $cat
      description = ($rule.about -f $city.name)
      estimatedMinutes = $rule.minutes
      estimatedCost = $rule.cost
      lat = [double]$lat
      lng = [double]$lng
      city = $city.name
    }
    $i++
  }
  Write-Host "  $($i - 1) places"
  Start-Sleep -Seconds 2
}

$json = ConvertTo-Json -InputObject @($all) -Depth 5
$out = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot "..\src\main\resources\places-extra.json"))
[IO.File]::WriteAllText($out, $json, (New-Object Text.UTF8Encoding($false)))
Write-Host "Saved $($all.Count) places to $out"
