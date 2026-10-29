$ErrorActionPreference = "SilentlyContinue"
New-Item -ItemType Directory -Force -Path "assets\img" | Out-Null
$base = "https://www.mega.tc/wp-content/uploads/"
$files = @(
  "2019/01/450-x-505pxl-11.jpg",
  "2020/06/Evaporation-and-Dryer.jpg",
  "2020/06/logo.png",
  "2020/10/Bio-CNG.jpg",
  "2020/10/Craft-Brewery.jpg",
  "2020/10/Critical-Process-Equipment.jpg",
  "2020/10/Distillery-Fuel-Ethanol.jpg",
  "2020/10/Zero-Liquid-plants.jpg",
  "2020/10/video-thumbnail-.jpg",
  "2022/07/IMG202207141703251-3.jpg",
  "2022/07/IMG2022071417091710-1.jpg",
  "2022/07/IMG20220714171128-1.jpg",
  "2025/03/cropped-swirl-1-270x270.png",
  "2025/03/process-technologies-img-home-v2.jpg",
  "2026/01/IMG-20260120-WA0012-1.jpg",
  "2026/01/LOGOS-03.png",
  "2026/01/LOGOS-04.png",
  "2026/01/LOGOS-05.png",
  "2026/01/LOGOS-06.png",
  "2026/01/LOGOS-07.png",
  "2026/01/LOGOS-08.png",
  "2026/01/LOGOS-10.png",
  "2026/01/LOGOS-11.png",
  "2026/01/LOGOS-12.png",
  "2026/01/LOGOS-13.png",
  "2026/01/LOGOS-14.png",
  "2026/01/LOGOS-16.png",
  "2026/01/LOGOS-17.png",
  "2026/01/LOGOS-18.png",
  "2026/01/LOGOS-19.png",
  "2026/01/LOGOS-20.png",
  "2026/01/LOGOS-21.png",
  "2026/01/LOGOS-22.png",
  "2026/01/LOGOS-23.png",
  "2026/01/LOGOS-24.png",
  "2026/01/LOGOS-25.png",
  "2026/01/LOGOS-26.png",
  "2026/01/LOGOS-27.png"
)
$ok = 0
foreach ($f in $files) {
  $name = Split-Path $f -Leaf
  Invoke-WebRequest -UseBasicParsing -Uri ($base + $f) -OutFile ("assets\img\" + $name)
  if (Test-Path ("assets\img\" + $name)) { $ok++ } else { Write-Host "FAILED: $f" -ForegroundColor Red }
}
Write-Host "Downloaded $ok of $($files.Count) images" -ForegroundColor Green
