# Registers the two daily agent runs in Windows Task Scheduler, no admin
# rights required (runs as the current user, only while logged on).
# Run from anywhere: powershell -File scripts\register-tasks.ps1

$root = Split-Path -Parent $PSScriptRoot

$settingsPath = Join-Path $root "data\settings.json"
$notificationsPath = Join-Path $root "data\notifications.json"

$sendTime = "09:00"
$digestTime = "17:00"

if (Test-Path $settingsPath) {
    $settings = Get-Content $settingsPath -Raw | ConvertFrom-Json
    if ($settings.sendStartTime) { $sendTime = $settings.sendStartTime }
}
if (Test-Path $notificationsPath) {
    $notifications = Get-Content $notificationsPath -Raw | ConvertFrom-Json
    if ($notifications.digestTime) { $digestTime = $notifications.digestTime }
}

$action1 = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c npx tsx scripts\agent1-outbound.ts" -WorkingDirectory $root
$trigger1 = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday,Tuesday,Wednesday,Thursday,Friday -At $sendTime
Register-ScheduledTask -TaskName "SpexsureOutreach-Agent1" -Action $action1 -Trigger $trigger1 `
    -Description "Spexsure Outreach - Agent 1 outbound connection requests" -Force | Out-Null
Write-Output "Registered SpexsureOutreach-Agent1 (weekdays at $sendTime)"

$action2 = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c npx tsx scripts\agent2-digest.ts" -WorkingDirectory $root
$trigger2 = New-ScheduledTaskTrigger -Daily -At $digestTime
Register-ScheduledTask -TaskName "SpexsureOutreach-Agent2" -Action $action2 -Trigger $trigger2 `
    -Description "Spexsure Outreach - Agent 2 response digest" -Force | Out-Null
Write-Output "Registered SpexsureOutreach-Agent2 (daily at $digestTime)"
