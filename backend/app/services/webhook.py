import os
import json
import urllib.request
import asyncio

class WebhookNotifier:
    async def notify(self, run_id: str, status: str, patch_content: str = None):
        webhook_url = os.environ.get("WEBHOOK_URL")
        if not webhook_url:
            return
            
        payload = {
            "run_id": run_id,
            "status": status,
            "patch": patch_content
        }
        
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            webhook_url, 
            data=data, 
            headers={"Content-Type": "application/json"}
        )
        
        def _send():
            try:
                with urllib.request.urlopen(req, timeout=10) as response:
                    pass
            except Exception as e:
                print(f"Webhook notification failed: {e}")
                
        await asyncio.to_thread(_send)
