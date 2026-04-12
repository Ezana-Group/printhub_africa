const fs = require('fs');

const data = JSON.parse(fs.readFileSync('n8n/workflows/marketing-content/05-ai-11-extended-platform-posting.json', 'utf8'));

// Identify nodes to keep
const keepNodeNames = [
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
];

data.nodes = data.nodes.filter(n => keepNodeNames.includes(n.name));

// Add the Postiz HTTP Node
data.nodes.push({
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
});

// Update connections
const triggerConnections = data.connections['Execute Trigger'].main[0].filter(c => {
    return keepNodeNames.includes(c.node);
});

// also trigger Postiz
triggerConnections.push({
    "node": "Postiz: Publish All",
    "type": "main",
    "index": 0
});

data.connections['Execute Trigger'].main[0] = triggerConnections;

// Remove connections for removed nodes
for (const key of Object.keys(data.connections)) {
    if (!keepNodeNames.includes(key) && key !== 'Execute Trigger') {
        delete data.connections[key];
    }
}

fs.writeFileSync('n8n/workflows/marketing-content/05-ai-11-extended-platform-posting.json', JSON.stringify(data, null, 2));
console.log("Updated 05-ai-11-extended-platform-posting.json");
