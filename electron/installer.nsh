!macro customCheckAppRunning
  # Forcefully kill any running instances of the app to avoid file lock errors
  nsExec::Exec `taskkill /F /T /IM "براكه.exe"`
  nsExec::Exec `taskkill /F /T /IM "KhodarPOS.exe"`
  nsExec::Exec `taskkill /F /T /IM "electron.exe"`
  Sleep 1000
!macroend

!macro customUnInstallCheck
  # Ignore uninstaller exit code 2 or any non-zero errors.
  # This guarantees the installer NEVER displays the "uninstall failed: 2" blocking modal.
  ClearErrors
!macroend

!macro customUnInstallCheckCurrentUser
  ClearErrors
!macroend

!macro customInstall
  # Ensure clean slate before overwriting files
  nsExec::Exec `taskkill /F /T /IM "براكه.exe"`
  nsExec::Exec `taskkill /F /T /IM "KhodarPOS.exe"`
  Sleep 500
!macroend
