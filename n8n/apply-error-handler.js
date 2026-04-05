const fs = require('fs');
const path = require('path');

// Assuming the script is run from the project root
const WORKFLOWS_DIR = path.join(process.cwd(), 'n8n/workflows');
const EXCLUDE_FILE = 'printhub-global-error-handler.json';
const PLACEHOLDER_ID = '{{GLOBAL_ERROR_HANDLER_ID}}';

function getAllJsonFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllJsonFiles(filePath, fileList);
    } else if (file.endsWith('.json') && file !== EXCLUDE_FILE) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

function updateWorkflow(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const workflow = JSON.parse(content);

    if (Array.isArray(workflow)) {
        workflow.forEach(wf => {
            if (!wf.settings) wf.settings = {};
            wf.settings.errorWorkflow = PLACEHOLDER_ID;
        });
    } else {
        if (!workflow.settings) workflow.settings = {};
        workflow.settings.errorWorkflow = PLACEHOLDER_ID;
    }

    fs.writeFileSync(filePath, JSON.stringify(workflow, null, 2));
    console.log(`Updated: ${path.relative(process.cwd(), filePath)}`);
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error.message);
  }
}

console.log('Starting bulk update of n8n workflows...');
const files = getAllJsonFiles(WORKFLOWS_DIR);

// Explicitly handle these files if they exist in the root of the workflows dir
// (They might have already been picked up by getAllJsonFiles, but this ensures coverage)
const rootCollections = [
    'n8n/workflows/printhub_ai_workflows.json',
    'n8n/workflows/printhub_base_workflows.json',
    'n8n/workflows/printhub_cron_workflows.json'
].map(f => path.join(process.cwd(), f));

rootCollections.forEach(f => {
    if (fs.existsSync(f) && !files.includes(f)) {
        updateWorkflow(f);
    }
});

files.forEach(updateWorkflow);
console.log('Bulk update complete!');
