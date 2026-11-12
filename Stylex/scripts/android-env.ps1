$sdkPath = 'C:\Users\Josh Adams\AppData\Local\Android\Sdk'
$platformTools = Join-Path $sdkPath 'platform-tools'
$emulatorTools = Join-Path $sdkPath 'emulator'

if (-not (Test-Path -LiteralPath $sdkPath)) {
  throw "Android SDK was not found at $sdkPath. Update sdkPath in scripts/android-env.ps1."
}

$env:ANDROID_HOME = $sdkPath
$env:ANDROID_SDK_ROOT = $sdkPath
$env:ANDROID_SDK_HOME = $env:USERPROFILE
$env:ANDROID_USER_HOME = Join-Path $env:USERPROFILE '.android'
if ([string]::IsNullOrWhiteSpace($env:HOME)) {
  $env:HOME = $env:USERPROFILE
}

$pathEntries = @($env:Path -split ';' | Where-Object { $_ -and $_.Trim() })
foreach ($entry in @($platformTools, $emulatorTools)) {
  if (-not ($pathEntries | Where-Object { $_.TrimEnd('\\') -ieq $entry.TrimEnd('\\') })) {
    $pathEntries += $entry
  }
}
$env:Path = $pathEntries -join ';'

Write-Output "Android SDK: $env:ANDROID_SDK_ROOT"
Write-Output "adb: $platformTools\adb.exe"
Write-Output "emulator: $emulatorTools\emulator.exe"
