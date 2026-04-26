/**
 * inbox.js — Dashboard client-side logic
 * Handles: login, conversation list, chat view, send, polling
 */

'use strict';

// ─── Config ───────────────────────────────────────────────────────────────────
const API_BASE    = '/api';
const POLL_MS     = 3000;    // poll for new messages every 3 seconds
const LIST_POLL_MS = 10000;  // refresh conversation list every 10 seconds

// ─── State ────────────────────────────────────────────────────────────────────
let token            = localStorage.getItem('wa_token') || null;
let activePhone      = null;
let pollTimer        = null;
let listPollTimer    = null;
let lastMessageDate  = null;
let allConversations = [];

// ─── DOM refs ─────────────────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);

const loginScreen    = $('login-screen');
const app            = $('app');
const loginForm      = $('login-form');
const loginError     = $('login-error');
const loginBtn       = $('login-btn');
const logoutBtn      = $('logout-btn');
const searchInput    = $('search-input');
const convList       = $('conversation-list');
const sidebar        = $('sidebar');
const emptyState     = $('empty-state');
const activeChat     = $('active-chat');
const chatName       = $('chat-name');
const chatPhone      = $('chat-phone');
const chatAvatar     = $('chat-avatar');
const agentBadge     = $('agent-active-badge');
const messagesEl     = $('messages-container');
const composeInput   = $('compose-input');
const sendBtn        = $('send-btn');
const backBtn        = $('back-btn');
const statsBadge     = $('stats-badge');

// ─── Utilities ────────────────────────────────────────────────────────────────

function showError(el, msg) {
  el.textContent = msg;
  el.hidden = false;
}
function hideError(el) { el.hidden = true; }

function formatTime(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const diff = now - d;
  if (diff < 7 * 86400000) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { day: 'numeric', month: 'short' });
}

function formatBubbleTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return 'Today';
  const yesterday = new Date(now - 86400000);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' });
}

function initials(name) {
  if (!name || name === 'Unknown') return '?';
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

function statusIcon(status) {
  const icons = { sent: '✓', delivered: '✓✓', read: '✓✓', failed: '✗', received: '' };
  const cls   = { sent: 'status-sent', delivered: 'status-delivered', read: 'status-read', failed: 'status-failed' };
  return `<span class="bubble-status ${cls[status] || ''}">${icons[status] || ''}</span>`;
}

// Auto-grow textarea
composeInput.addEventListener('input', () => {
  composeInput.style.height = 'auto';
  composeInput.style.height = Math.min(composeInput.scrollHeight, 120) + 'px';
});

// ─── Auth ─────────────────────────────────────────────────────────────────────

async function apiFetch(path, opts = {}) {
  const res = await fetch(API_BASE + path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });
  if (res.status === 401) {
    logout();
    throw new Error('Session expired');
  }
  return res;
}

function logout() {
  token = null;
  localStorage.removeItem('wa_token');
  clearInterval(pollTimer);
  clearInterval(listPollTimer);
  activePhone = null;
  loginScreen.hidden = false;
  app.hidden = true;
}

logoutBtn.addEventListener('click', logout);

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError(loginError);
  loginBtn.disabled = true;
  loginBtn.textContent = 'Signing in…';

  try {
    const res = await fetch(API_BASE + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: $('username').value.trim(),
        password: $('password').value,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');

    token = data.token;
    localStorage.setItem('wa_token', token);
    showApp();
  } catch (err) {
    showError(loginError, err.message);
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = 'Sign In';
  }
});

// ─── App init ─────────────────────────────────────────────────────────────────

function showApp() {
  loginScreen.hidden = true;
  app.hidden = false;
  loadConversations();
  loadStats();
  listPollTimer = setInterval(() => { loadConversations(true); loadStats(); }, LIST_POLL_MS);
}

// ─── Conversation list ────────────────────────────────────────────────────────

async function loadConversations(silent = false) {
  try {
    const res = await apiFetch('/inbox/conversations?limit=50');
    const { conversations } = await res.json();
    allConversations = conversations || [];
    renderConversations(allConversations);
  } catch (err) {
    if (!silent) convList.innerHTML = `<div class="loading-state">Failed to load — ${err.message}</div>`;
  }
}

function renderConversations(convs) {
  const query = searchInput.value.toLowerCase().trim();
  const filtered = query
    ? convs.filter((c) =>
        c.customerName?.toLowerCase().includes(query) ||
        c.customerPhone?.includes(query) ||
        c.lastMessage?.toLowerCase().includes(query)
      )
    : convs;

  if (!filtered.length) {
    convList.innerHTML = `<div class="loading-state">${query ? 'No results' : 'No conversations yet'}</div>`;
    return;
  }

  convList.innerHTML = filtered
    .map(
      (c) => `
      <div class="conv-item${c.customerPhone === activePhone ? ' active' : ''}"
           data-phone="${c.customerPhone}" role="button" tabindex="0">
        <div class="conv-avatar">${initials(c.customerName)}</div>
        <div class="conv-body">
          <div class="conv-top">
            <span class="conv-name">${escHtml(c.customerName || c.customerPhone)}</span>
            <span class="conv-time">${formatTime(c.lastMessageAt)}</span>
          </div>
          <div class="conv-bottom">
            <span class="conv-preview">${c.lastDirection === 'outbound' ? '→ ' : ''}${escHtml(c.lastMessage || '')}</span>
            ${c.unreadCount > 0 ? `<span class="conv-unread">${c.unreadCount}</span>` : ''}
          </div>
        </div>
      </div>`
    )
    .join('');

  convList.querySelectorAll('.conv-item').forEach((el) => {
    el.addEventListener('click', () => openConversation(el.dataset.phone));
    el.addEventListener('keydown', (e) => e.key === 'Enter' && openConversation(el.dataset.phone));
  });
}

searchInput.addEventListener('input', () => renderConversations(allConversations));

async function loadStats() {
  try {
    const res = await apiFetch('/inbox/stats');
    const { totalUnread } = await res.json();
    statsBadge.textContent = totalUnread > 0 ? totalUnread : '';
    statsBadge.hidden = totalUnread === 0;
  } catch { /* non-fatal */ }
}

// ─── Open conversation ────────────────────────────────────────────────────────

async function openConversation(phone) {
  if (activePhone === phone) return;

  clearInterval(pollTimer);
  activePhone = phone;
  lastMessageDate = null;

  // UI
  emptyState.hidden = true;
  activeChat.hidden = false;
  sidebar.classList.add('hidden'); // mobile: hide sidebar

  chatPhone.textContent = '+' + phone;
  chatName.textContent  = 'Loading…';
  chatAvatar.textContent = '?';
  messagesEl.innerHTML  = `<div class="loading-state">Loading messages…</div>`;
  agentBadge.hidden = true;

  // Highlight active in list
  convList.querySelectorAll('.conv-item').forEach((el) => {
    el.classList.toggle('active', el.dataset.phone === phone);
  });

  await fetchMessages(phone);
  await markRead(phone);

  // Start polling
  pollTimer = setInterval(() => pollNewMessages(phone), POLL_MS);
}

async function fetchMessages(phone) {
  try {
    const res = await apiFetch(`/inbox/conversations/${phone}?limit=60`);
    const { conversation, messages } = await res.json();

    chatName.textContent   = conversation.customerName || phone;
    chatPhone.textContent  = '+' + phone;
    chatAvatar.textContent = initials(conversation.customerName);

    if (conversation.agentActive) agentBadge.hidden = false;

    renderMessages(messages);

    if (messages.length) {
      lastMessageDate = new Date(messages[messages.length - 1].createdAt);
    }
  } catch (err) {
    messagesEl.innerHTML = `<div class="loading-state">Error: ${err.message}</div>`;
  }
}

function renderMessages(messages) {
  if (!messages.length) {
    messagesEl.innerHTML = `<div class="loading-state">No messages yet</div>`;
    return;
  }

  let lastDate = null;
  const html = messages.map((msg) => {
    const msgDate = new Date(msg.createdAt);
    const dateStr = msgDate.toDateString();
    let divider = '';
    if (dateStr !== lastDate) {
      lastDate = dateStr;
      divider = `<div class="bubble-date-divider"><span>${formatDate(msg.createdAt)}</span></div>`;
    }

    const dir = msg.direction;
    return `
      ${divider}
      <div class="bubble-wrap ${dir}">
        <div class="bubble">${escHtml(msg.content) || typeLabel(msg.type)}</div>
        <div class="bubble-meta">
          <span>${formatBubbleTime(msg.createdAt)}</span>
          ${dir === 'outbound' ? statusIcon(msg.status) : ''}
        </div>
      </div>`;
  }).join('');

  messagesEl.innerHTML = html;
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function typeLabel(type) {
  const labels = { image: '🖼 Image', document: '📄 Document', audio: '🎵 Audio', video: '🎬 Video', location: '📍 Location', sticker: '😊 Sticker' };
  return labels[type] || `[${type}]`;
}

// ─── Poll new messages ────────────────────────────────────────────────────────

async function pollNewMessages(phone) {
  if (phone !== activePhone) return;
  try {
    const since = lastMessageDate ? lastMessageDate.toISOString() : new Date(Date.now() - 5000).toISOString();
    const res   = await apiFetch(`/inbox/conversations/${phone}/poll?since=${encodeURIComponent(since)}`);
    const { messages, unreadCount } = await res.json();

    if (messages.length) {
      messages.forEach((msg) => appendMessage(msg));
      lastMessageDate = new Date(messages[messages.length - 1].createdAt);
      await markRead(phone);

      // Refresh conversation list silently
      loadConversations(true);
      loadStats();
    }
  } catch { /* non-fatal */ }
}

function appendMessage(msg) {
  const div = document.createElement('div');
  div.className = `bubble-wrap ${msg.direction}`;
  div.innerHTML = `
    <div class="bubble">${escHtml(msg.content) || typeLabel(msg.type)}</div>
    <div class="bubble-meta">
      <span>${formatBubbleTime(msg.createdAt)}</span>
      ${msg.direction === 'outbound' ? statusIcon(msg.status) : ''}
    </div>`;

  // Remove "no messages" placeholder if present
  const placeholder = messagesEl.querySelector('.loading-state');
  if (placeholder) placeholder.remove();

  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

async function markRead(phone) {
  try {
    await apiFetch(`/inbox/conversations/${phone}/read`, { method: 'POST' });
    // Update unread badge in list
    const convItem = convList.querySelector(`[data-phone="${phone}"]`);
    if (convItem) {
      const badge = convItem.querySelector('.conv-unread');
      if (badge) badge.remove();
    }
  } catch { /* non-fatal */ }
}

// ─── Send message ─────────────────────────────────────────────────────────────

async function sendMessage() {
  const text = composeInput.value.trim();
  if (!text || !activePhone) return;

  sendBtn.disabled = true;
  composeInput.value = '';
  composeInput.style.height = 'auto';

  // Optimistic UI
  const tempMsg = {
    direction: 'outbound',
    content: text,
    status: 'pending',
    createdAt: new Date().toISOString(),
    type: 'text',
  };
  appendMessage(tempMsg);

  try {
    const res = await apiFetch('/inbox/send', {
      method: 'POST',
      body: JSON.stringify({ to: activePhone, message: text }),
    });
    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error || 'Send failed');
    }
    // Real message will appear on next poll
    agentBadge.hidden = false;
    loadConversations(true);
  } catch (err) {
    // Show inline error
    const errEl = document.createElement('div');
    errEl.className = 'bubble-wrap outbound';
    errEl.innerHTML = `<div class="bubble" style="background:#fee2e2;color:#dc2626;">❌ ${escHtml(err.message)}</div>`;
    messagesEl.appendChild(errEl);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  } finally {
    sendBtn.disabled = false;
  }
}

sendBtn.addEventListener('click', sendMessage);
composeInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
});

// ─── Mobile back button ───────────────────────────────────────────────────────

backBtn.addEventListener('click', () => {
  sidebar.classList.remove('hidden');
  activePhone = null;
  clearInterval(pollTimer);
  emptyState.hidden = false;
  activeChat.hidden = true;
  convList.querySelectorAll('.conv-item').forEach((el) => el.classList.remove('active'));
});

// ─── Security: escape HTML ────────────────────────────────────────────────────

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ─── Boot ─────────────────────────────────────────────────────────────────────

if (token) {
  // Verify stored token is still valid
  fetch(API_BASE + '/auth/me', { headers: { Authorization: `Bearer ${token}` } })
    .then((r) => (r.ok ? showApp() : logout()))
    .catch(logout);
} else {
  loginScreen.hidden = false;
  app.hidden = true;
}
