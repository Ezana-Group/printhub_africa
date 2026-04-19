const fs = require('fs');
const path = './n8n/workflows/commerce-sales/08-printhub-quote-submitted-lead-capture.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

const newNode = {
  "parameters": {
    "url": "={{$env['LISTMONK_URL']}}/api/subscribers",
    "method": "POST",
    "authentication": "genericCredentialType",
    "genericAuthType": "httpBasicAuth",
    "sendBody": true,
    "specifyBody": "json",
    "jsonParameters": true,
    "bodyParameters": {
      "parameters": [
        {
          "name": "email",
          "value": "={{$json.customerEmail}}"
        },
        {
          "name": "name",
          "value": "={{$json.customerName}}"
        },
        {
          "name": "lists",
          "value": ["={{$env['LISTMONK_DEFAULT_LIST_ID'] || 1}}"]
        },
        {
          "name": "status",
          "value": "enabled"
        }
      ]
    }
  },
  "id": "listmonk-lead-capture",
  "name": "Listmonk: Add Lead",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.1,
  "position": [
    760,
    300
  ]
};

data.nodes.push(newNode);

// Add connection from 'Email: Draft Quote' to 'Listmonk: Add Lead'
data.connections["Email: Draft Quote"] = {
  "main": [
    [
      {
        "node": "Listmonk: Add Lead",
        "type": "main",
        "index": 0
      }
    ]
  ]
};

fs.writeFileSync(path, JSON.stringify(data, null, 2));
console.log('Successfully updated workflow JSON.');
