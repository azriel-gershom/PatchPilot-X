import argparse
import time
import json
import urllib.request
import urllib.error
import sys

API_BASE = "http://localhost:8000/api/agent"

def run_agent(github_url: str, task: str):
    data = json.dumps({"github_url": github_url, "task": task}).encode("utf-8")
    req = urllib.request.Request(f"{API_BASE}/run", data=data, headers={"Content-Type": "application/json"})
    
    try:
        with urllib.request.urlopen(req) as response:
            res_data = json.loads(response.read().decode())
            run_id = res_data["run_id"]
            print(f"Run started. ID: {run_id}")
            return run_id
    except Exception as e:
        print(f"Failed to start run: {e}")
        sys.exit(1)

def poll_status(run_id: str):
    while True:
        req = urllib.request.Request(f"{API_BASE}/runs/{run_id}")
        try:
            with urllib.request.urlopen(req) as response:
                res_data = json.loads(response.read().decode())
                status = res_data.get("status", {}).get("status", "UNKNOWN")
                print(f"Current status: {status}")
                if status in ["COMPLETED_SUCCESS", "COMPLETED_FAILED_VALIDATION", "FAILED"]:
                    return status
        except urllib.error.HTTPError as e:
            if e.code == 404:
                print("Run not found. Still starting or invalid ID.")
            else:
                print(f"HTTP error: {e}")
                sys.exit(1)
        except Exception as e:
            print(f"Error polling status: {e}")
        
        time.sleep(2)

def download_patch(run_id: str):
    req = urllib.request.Request(f"{API_BASE}/runs/{run_id}/patch")
    try:
        with urllib.request.urlopen(req) as response:
            patch_data = response.read().decode()
            with open("patch.diff", "w", encoding="utf-8") as f:
                f.write(patch_data)
            print("Patch downloaded to patch.diff")
    except Exception as e:
        print(f"Failed to download patch: {e}")

def main():
    parser = argparse.ArgumentParser(description="PatchPilot X CLI")
    subparsers = parser.add_subparsers(dest="command")
    
    run_parser = subparsers.add_parser("run", help="Run the patch generation agent")
    run_parser.add_argument("github_url", help="GitHub URL of the repository")
    run_parser.add_argument("task", help="Natural language task description")
    
    args = parser.parse_args()
    
    if args.command == "run":
        run_id = run_agent(args.github_url, args.task)
        status = poll_status(run_id)
        if status in ["COMPLETED_SUCCESS", "COMPLETED_FAILED_VALIDATION"]:
            download_patch(run_id)
        else:
            print("Run failed, no patch generated.")
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
