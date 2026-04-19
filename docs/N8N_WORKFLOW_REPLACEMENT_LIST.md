# n8n Workflow Replacement & Migration List

This document tracks all n8n workflows that require replacement, refactoring, or model upgrades to align with the PrintHub production stack (Listmonk, Postiz, Claude 3.5 Sonnet).

## 🔴 Priority 1: Proprietary Service Replacements
These workflows currently use proprietary services and must be updated to use open-source alternatives.

| Workflow Folder | Workflow File | Status |
| :--- | :--- | :--- |
| `commerce-sales/` | `08-printhub-quote-submitted-lead-capture.json` | **Update**: Replace Klaviyo with Listmonk |
| `commerce-sales/` | `11-printhub-lead-magnet-capture.json` | **Update**: Replace Klaviyo with Listmonk |
| `marketing-content/` | `05-ai-11-extended-platform-posting.json` | **Update**: Use Postiz API for social posting |
| `commerce-sales/` | `07-printhub-abandoned-cart-recovery-3-stage-sequence.json` | **Update**: Replace Klaviyo with Listmonk |
| `commerce-sales/` | `06-printhub-abandoned-cart-recovery-wait-sequence.json` | **Update**: Replace Klaviyo with Listmonk |

## 🟠 Priority 2: AI Model Upgrades
Update the following workflows to use validated production models (**Claude 3.5 Sonnet** and **GPT-4o**).

| Workflow Folder | Workflow File | Current Model | Target Model |
| :--- | :--- | :--- | :--- |
| `commerce-sales/` | `12-ai-5-ai-assisted-quote-responses-claude.json` | Claude Opus 4.6 | **Claude 3.5 Sonnet** |
| `customer-support/` | `01-ai-2-whatsapp-auto-reply-claude.json` | Claude Opus 4.6 | **Claude 3.5 Sonnet** |
| `catalog-inventory/` | `04-ai-4-auto-generate-product-descriptions-claude.json` | Claude Opus 4.6 | **Claude 3.5 Sonnet** |
| `intelligence-reports/`| `02-cron-ai-1-daily-sentiment-report-claude.json` | Claude Opus 4.6 | **Claude 3.5 Sonnet** |
| `marketing-content/`| `06-ai-13-long-form-seo-content-engine.base.json` | GPT-4 / Claude | **Claude 3.5 Sonnet** |
| `intelligence-reports/`| `01-ai-6-sentiment-analysis-gpt-4o.json` | GPT-4 | **GPT-4o (Standardize)** |

## 🟡 Priority 3: Infrastructure Consolidation
The following "monolith" files are located in `n8n/workflows/` and should be deprecated once verified against their individual counterparts in the subdirectories.

| Legacy Monolith File | Individual Target folders |
| :--- | :--- |
| `printhub_ai_workflows.json` | `marketing-content/`, `catalog-inventory/`, `intelligence-reports/` |
| `printhub_base_workflows.json` | `commerce-sales/`, `notifications/`, `auth-security/` |
| `printhub_cron_workflows.json` | Respective `.cron.json` files in categorized folders |

## 🛠️ Tools for Replacement
You can use the following scripts available in the root directory to assist with the replacement process:
- `update_n8n_listmonk.js`: Automatically inserts Listmonk HTTP request nodes into a workflow.
- `split_workflows.js`: Splits the composite JSON files into individual workflow files.
