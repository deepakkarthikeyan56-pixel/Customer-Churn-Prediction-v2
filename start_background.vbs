Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
currentDir = fso.GetParentFolderName(WScript.ScriptFullName)

' Run uvicorn server silently in background (0 = hidden window)
cmd = "cmd.exe /c cd /d """ & currentDir & "\backend"" && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000"
WshShell.Run cmd, 0, False
