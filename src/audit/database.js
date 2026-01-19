/**
 * Audit Database - SQLite storage for AI agent activity logging
 * 
 * Tracks every prompt, response, tool call, and invariant violation
 * for complete transparency and monitoring.
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { DATA_DIR } from '../config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(DATA_DIR, 'audit.db');

let db = null;

/**
 * Initialize database connection and schema
 */
export function initDatabase() {
    if (db) return db;

    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');

    // Create tables
    db.exec(`
    -- Agent work sessions
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      started_at TEXT NOT NULL,
      ended_at TEXT,
      status TEXT DEFAULT 'running',
      agents_used TEXT,
      tasks_completed INTEGER DEFAULT 0,
      total_requests INTEGER DEFAULT 0
    );
    
    -- Every AI request
    CREATE TABLE IF NOT EXISTS requests (
      id TEXT PRIMARY KEY,
      session_id TEXT,
      agent_id TEXT NOT NULL,
      agent_name TEXT,
      timestamp TEXT NOT NULL,
      prompt TEXT,
      response TEXT,
      tokens_used INTEGER,
      duration_ms INTEGER,
      success INTEGER DEFAULT 1,
      error TEXT,
      FOREIGN KEY (session_id) REFERENCES sessions(id)
    );
    
    -- Every tool call
    CREATE TABLE IF NOT EXISTS tool_calls (
      id TEXT PRIMARY KEY,
      request_id TEXT,
      agent_id TEXT NOT NULL,
      tool_name TEXT NOT NULL,
      arguments TEXT,
      result TEXT,
      success INTEGER DEFAULT 1,
      error TEXT,
      timestamp TEXT NOT NULL,
      duration_ms INTEGER,
      FOREIGN KEY (request_id) REFERENCES requests(id)
    );
    
    -- Invariant violations
    CREATE TABLE IF NOT EXISTS violations (
      id TEXT PRIMARY KEY,
      request_id TEXT,
      agent_id TEXT NOT NULL,
      invariant_type TEXT NOT NULL,
      operation TEXT,
      target TEXT,
      reason TEXT NOT NULL,
      blocked INTEGER DEFAULT 1,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (request_id) REFERENCES requests(id)
    );
    
    -- Create indexes for common queries
    CREATE INDEX IF NOT EXISTS idx_requests_session ON requests(session_id);
    CREATE INDEX IF NOT EXISTS idx_requests_agent ON requests(agent_id);
    CREATE INDEX IF NOT EXISTS idx_requests_timestamp ON requests(timestamp);
    CREATE INDEX IF NOT EXISTS idx_tool_calls_request ON tool_calls(request_id);
    CREATE INDEX IF NOT EXISTS idx_violations_timestamp ON violations(timestamp);
  `);

    return db;
}

/**
 * Close database connection
 */
export function closeDatabase() {
    if (db) {
        db.close();
        db = null;
    }
}

/**
 * Generate unique ID
 */
export function generateId(prefix = '') {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return prefix ? `${prefix}-${timestamp}-${random}` : `${timestamp}-${random}`;
}

// ==========================================
// SESSION OPERATIONS
// ==========================================

export function createSession() {
    const db = initDatabase();
    const id = generateId('sess');

    db.prepare(`
    INSERT INTO sessions (id, started_at, status)
    VALUES (?, datetime('now'), 'running')
  `).run(id);

    return id;
}

export function endSession(sessionId, stats = {}) {
    const db = initDatabase();

    db.prepare(`
    UPDATE sessions 
    SET ended_at = datetime('now'),
        status = 'completed',
        agents_used = ?,
        tasks_completed = ?,
        total_requests = ?
    WHERE id = ?
  `).run(
        stats.agentsUsed || '',
        stats.tasksCompleted || 0,
        stats.totalRequests || 0,
        sessionId
    );
}

export function getSession(sessionId) {
    const db = initDatabase();
    return db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId);
}

export function getRecentSessions(limit = 10) {
    const db = initDatabase();
    return db.prepare(`
    SELECT * FROM sessions 
    ORDER BY started_at DESC 
    LIMIT ?
  `).all(limit);
}

// ==========================================
// REQUEST OPERATIONS
// ==========================================

export function logRequest(sessionId, agentId, agentName, prompt) {
    const db = initDatabase();
    const id = generateId('req');

    db.prepare(`
    INSERT INTO requests (id, session_id, agent_id, agent_name, timestamp, prompt)
    VALUES (?, ?, ?, ?, datetime('now'), ?)
  `).run(id, sessionId, agentId, agentName, prompt);

    return id;
}

export function updateRequest(requestId, response, tokensUsed, durationMs, success = true, error = null) {
    const db = initDatabase();

    db.prepare(`
    UPDATE requests 
    SET response = ?,
        tokens_used = ?,
        duration_ms = ?,
        success = ?,
        error = ?
    WHERE id = ?
  `).run(response, tokensUsed, durationMs, success ? 1 : 0, error, requestId);
}

export function getRequest(requestId) {
    const db = initDatabase();
    return db.prepare('SELECT * FROM requests WHERE id = ?').get(requestId);
}

export function getSessionRequests(sessionId) {
    const db = initDatabase();
    return db.prepare(`
    SELECT * FROM requests 
    WHERE session_id = ? 
    ORDER BY timestamp ASC
  `).all(sessionId);
}

// ==========================================
// TOOL CALL OPERATIONS
// ==========================================

export function logToolCall(requestId, agentId, toolName, args) {
    const db = initDatabase();
    const id = generateId('tool');

    db.prepare(`
    INSERT INTO tool_calls (id, request_id, agent_id, tool_name, arguments, timestamp)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `).run(id, requestId, agentId, toolName, JSON.stringify(args));

    return id;
}

export function updateToolCall(toolCallId, result, success = true, error = null, durationMs = 0) {
    const db = initDatabase();

    db.prepare(`
    UPDATE tool_calls 
    SET result = ?,
        success = ?,
        error = ?,
        duration_ms = ?
    WHERE id = ?
  `).run(
        typeof result === 'string' ? result : JSON.stringify(result),
        success ? 1 : 0,
        error,
        durationMs,
        toolCallId
    );
}

export function getRequestToolCalls(requestId) {
    const db = initDatabase();
    return db.prepare(`
    SELECT * FROM tool_calls 
    WHERE request_id = ? 
    ORDER BY timestamp ASC
  `).all(requestId);
}

// ==========================================
// VIOLATION OPERATIONS
// ==========================================

export function logViolation(requestId, agentId, invariantType, operation, target, reason, blocked = true) {
    const db = initDatabase();
    const id = generateId('viol');

    db.prepare(`
    INSERT INTO violations (id, request_id, agent_id, invariant_type, operation, target, reason, blocked, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).run(id, requestId, agentId, invariantType, operation, target, reason, blocked ? 1 : 0);

    return id;
}

export function getRecentViolations(limit = 20) {
    const db = initDatabase();
    return db.prepare(`
    SELECT * FROM violations 
    ORDER BY timestamp DESC 
    LIMIT ?
  `).all(limit);
}

export function getSessionViolations(sessionId) {
    const db = initDatabase();
    return db.prepare(`
    SELECT v.* FROM violations v
    JOIN requests r ON v.request_id = r.id
    WHERE r.session_id = ?
    ORDER BY v.timestamp ASC
  `).all(sessionId);
}

// ==========================================
// STATISTICS
// ==========================================

export function getStats() {
    const db = initDatabase();

    const sessions = db.prepare('SELECT COUNT(*) as count FROM sessions').get();
    const requests = db.prepare('SELECT COUNT(*) as count FROM requests').get();
    const toolCalls = db.prepare('SELECT COUNT(*) as count FROM tool_calls').get();
    const violations = db.prepare('SELECT COUNT(*) as count FROM violations').get();
    const blockedViolations = db.prepare('SELECT COUNT(*) as count FROM violations WHERE blocked = 1').get();

    return {
        totalSessions: sessions.count,
        totalRequests: requests.count,
        totalToolCalls: toolCalls.count,
        totalViolations: violations.count,
        blockedViolations: blockedViolations.count,
    };
}

export default {
    initDatabase,
    closeDatabase,
    generateId,
    createSession,
    endSession,
    getSession,
    getRecentSessions,
    logRequest,
    updateRequest,
    getRequest,
    getSessionRequests,
    logToolCall,
    updateToolCall,
    getRequestToolCalls,
    logViolation,
    getRecentViolations,
    getSessionViolations,
    getStats,
};
