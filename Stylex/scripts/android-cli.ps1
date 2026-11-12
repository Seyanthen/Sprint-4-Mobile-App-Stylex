param(
  [ValidateSet('devices', 'avds', 'start', 'run')]
  [string]$Command = 'devices',
  [string]$Avd = 'Medium_Phone'
)

$sdkPath = 'C:\Users\Josh Adams\AppData\Local\Android\Sdk'
$platformTools = Join-Path $sdkPath 'platform-tools'
$emulatorTools = Join-Path $sdkPath 'emulator'
$userHome = 'C:\Users\Josh Adams'

if (-not (Test-Path -LiteralPath $sdkPath)) {
  throw "Android SDK was not found at $sdkPath. Update sdkPath in scripts/android-cli.ps1."
}

$env:ANDROID_HOME = $sdkPath
$env:ANDROID_SDK_ROOT = $sdkPath
$env:ANDROID_SDK_HOME = $userHome
$env:ANDROID_USER_HOME = Join-Path $userHome '.android'
$env:HOME = $userHome
$env:Path = "$platformTools;$emulatorTools;$env:Path"

switch ($Command) {
  'devices' { & (Join-Path $platformTools 'adb.exe') devices; exit $LASTEXITCODE }
  'avds' { & (Join-Path $emulatorTools 'emulator.exe') -list-avds; exit $LASTEXITCODE }
  'start' { Start-Process -FilePath (Join-Path $emulatorTools 'emulator.exe') -ArgumentList '-avd', $Avd; exit 0 }
  'run' { & npx.cmd expo run:android --device; exit $LASTEXITCODE }
}
