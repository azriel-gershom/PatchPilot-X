import urllib.request, json
data = json.dumps({
    'github_url': 'https://github.com/azriel-gershom/PatchPilot-X.git',
    'task': 'In backend/app/main.py, add a new GET endpoint /api/version that returns {"version": "1.0.0", "service": "PatchPilot X"} as JSON. Do not modify any existing endpoints.'
}).encode('utf-8')
req = urllib.request.Request('http://127.0.0.1:8000/api/agent/run', data=data, headers={'Content-Type': 'application/json'})
res = urllib.request.urlopen(req)
print(res.read().decode())
