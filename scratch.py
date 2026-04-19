import json

with open('n8n/workflows/marketing-content/05-ai-11-extended-platform-posting.json', 'r') as f:
    data = json.load(f)

keep_node_names = [
    'Execute Trigger',
    'If Google Maps?',
    'Google Maps: Post',
    'If Bing?',
    'Bing Places: Post',
    'If Apple Maps?',
    'Sign Apple JWT',
    'Apple Maps: Post',
    'If PigiaMe?',
    'PigiaMe: Auth',
    'PigiaMe: Post',
    'If OLX?',
    'OLX: Auth',
    'OLX: Post',
    'If LinkedIn newsletter?',
    'Claude: LinkedIn Article',
    'LinkedIn: Article'
]

data['nodes'] = [n for n in data['nodes'] if n['name'] in keep_node_names]

data['nodes'].append({
    "parameters": {
        "url": "{{$env.POSTIZ_BASE_URL}}/api/posts",
        "method": "POST",
        "authentication": "none",
        "headerParameters": {
            "parameters": [
                {
                    "name": "Authorization",
                    "value": "Bearer {{$env.POSTIZ_API_KEY}}"
                }
            ]
        },
        "bodyParametersJson": "={ \"post\": {{ JSON.stringify($node['Execute Trigger'].json.postizDraft) }} }"
    },
    "name": "Postiz: Publish All",
    "type": "n8n-nodes-base.httpRequest",
    "typeVersion": 4.1,
    "position": [ 200, 1300 ]
})

trigger_connections = []
for c in data['connections']['Execute Trigger']['main'][0]:
    if c['node'] in keep_node_names:
        trigger_connections.append(c)

trigger_connections.append({
    "node": "Postiz: Publish All",
    "type": "main",
    "index": 0
})

data['connections']['Execute Trigger']['main'][0] = trigger_connections

keys_to_delete = []
for k in data['connections'].keys():
    if k not in keep_node_names and k != 'Execute Trigger':
        keys_to_delete.append(k)

for k in keys_to_delete:
    del data['connections'][k]

with open('n8n/workflows/marketing-content/05-ai-11-extended-platform-posting.json', 'w') as f:
    json.dump(data, f, indent=2)

print("success")
