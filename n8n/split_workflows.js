const fs = require('fs');
const path = require('path');

const config = [
  {
    source: 'n8n/workflows/printhub_base_workflows.json',
    destDir: 'n8n/workflows/individual/base'
  },
  {
    source: 'n8n/workflows/printhub_ai_workflows.json',
    destDir: 'n8n/workflows/individual/ai'
  },
  {
    source: 'n8n/workflows/printhub_cron_workflows.json',
    destDir: 'n8n/workflows/individual/cron'
  }
];

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .replace(/[0-9]+\.\s*/, '') // Remove prefixes like "1. "
    .replace(/\s+/g, '-')      // Replace spaces with -
    .replace(/[^\w-]+/g, '')     // Remove all non-word chars
    .replace(/--+/g, '-')      // Replace multiple - with single -
    .replace(/^-+/, '')        // Trim - from start of text
    .replace(/-+$/, '');       // Trim - from end of text
}

config.forEach(item => {
  const sourcePath = path.resolve(process.cwd(), item.source);
  if (!fs.existsSync(sourcePath)) {
    console.error(`Source file not found: ${sourcePath}`);
    return;
  }

  const workflows = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
  console.log(`Processing ${workflows.length} workflows from ${item.source}...`);

  workflows.forEach(wf => {
    const name = wf.name || 'unnamed-workflow';
    const slug = slugify(name);
    const destPath = path.resolve(process.cwd(), item.destDir, `${slug}.json`);
    
    fs.writeFileSync(destPath, JSON.stringify(wf, null, 2));
    console.log(`  - Saved: ${item.destDir}/${slug}.json`);
  });
});

console.log('Workflow splitting complete!');
