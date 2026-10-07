import subprocess
import time
import datetime
import shlex
import os
from app.models.domain import TestExecution

ALLOWED_PREFIXES = [
    "pytest", "python -m pytest", "npm test", "npm run test",
    "npm run build", "npm run lint", "npm run typecheck",
    "npx jest", "npx vitest", "mvn test", "./gradlew test",
    "gradle test", "go test", "cargo test", "python", "node"
]

DANGEROUS_TOKENS = [
    "rm -rf", "shutdown", "curl", "wget", "git push", 
    "| sh", "| bash", ">", ">>", ";", "&&", "||"
]

class CommandExecutor:
    def __init__(self, timeout_seconds: int = 60):
        self.timeout = timeout_seconds

    def is_safe_command(self, command: str) -> bool:
        cmd_lower = command.lower()
        
        if any(token in cmd_lower for token in DANGEROUS_TOKENS):
            return False
            
        if not any(command.startswith(prefix) for prefix in ALLOWED_PREFIXES):
            return False
            
        return True

    def execute(self, command: str, cwd: str) -> TestExecution:
        if not self.is_safe_command(command):
            raise ValueError(f"Command '{command}' is not in the allowed list or contains dangerous tokens.")
            
        started_at_str = datetime.datetime.now(datetime.timezone.utc).isoformat()
        start_time = time.time()
        
        timed_out = False
        exit_code = -1
        stdout = ""
        stderr = ""
        
        try:
            args = shlex.split(command, posix=(os.name != 'nt'))
            # On Windows, commands like 'npm' need shell=True or '.cmd'. 
            # For safety, we enforce shell=False, but allow execution.
            proc = subprocess.run(
                args,
                cwd=cwd,
                capture_output=True,
                text=True,
                timeout=self.timeout
            )
            stdout = proc.stdout
            stderr = proc.stderr
            exit_code = proc.returncode
        except subprocess.TimeoutExpired as e:
            timed_out = True
            stdout = e.stdout.decode('utf-8', errors='ignore') if isinstance(e.stdout, bytes) else (e.stdout or "")
            stderr = e.stderr.decode('utf-8', errors='ignore') if isinstance(e.stderr, bytes) else (e.stderr or "")
        except FileNotFoundError as e:
            # Try with shell=True ONLY for allowed commands if FileNotFoundError occurs (like npm.cmd on Windows)
            # We already validated it's safe and doesn't contain dangerous tokens.
            if os.name == 'nt':
                try:
                    proc = subprocess.run(
                        command,
                        cwd=cwd,
                        capture_output=True,
                        text=True,
                        timeout=self.timeout,
                        shell=True
                    )
                    stdout = proc.stdout
                    stderr = proc.stderr
                    exit_code = proc.returncode
                except subprocess.TimeoutExpired as e2:
                    timed_out = True
                    stdout = e2.stdout.decode('utf-8', errors='ignore') if isinstance(e2.stdout, bytes) else (e2.stdout or "")
                    stderr = e2.stderr.decode('utf-8', errors='ignore') if isinstance(e2.stderr, bytes) else (e2.stderr or "")
                except Exception as e2:
                    stderr = str(e2)
            else:
                stderr = str(e)
        except Exception as e:
            stderr = str(e)
            
        duration = time.time() - start_time
        
        return TestExecution(
            command=command,
            cwd=cwd,
            started_at=started_at_str,
            duration=duration,
            exit_code=exit_code,
            stdout=stdout,
            stderr=stderr,
            timed_out=timed_out
        )
