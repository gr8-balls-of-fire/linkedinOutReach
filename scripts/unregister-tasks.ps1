# Removes the two scheduled tasks. Run at uninstall, or manually to disable
# the automated cron-style runs without deleting the app.

Unregister-ScheduledTask -TaskName "SpexsureOutreach-Agent1" -Confirm:$false -ErrorAction SilentlyContinue
Unregister-ScheduledTask -TaskName "SpexsureOutreach-Agent2" -Confirm:$false -ErrorAction SilentlyContinue
Write-Output "Removed SpexsureOutreach-Agent1 and SpexsureOutreach-Agent2 scheduled tasks (if they existed)."
