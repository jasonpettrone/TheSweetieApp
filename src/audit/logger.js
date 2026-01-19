/**
 * Audit Logger - High-level logging API for agent activity
 * 
 * Provides easy-to-use methods for logging all AI agent actions.
 */

import * as db from './database.js';
import logger from '../utils/logger.js';

let currentSessionId = null;
let currentRequestId = null;

/**
 * Start a new audit session (called at start of day)
 */
export function startSession() {
    currentSessionId = db.createSession();
    logger.info(`Audit session started: ${currentSessionId}`);
    return currentSessionId;
}

/**
 * End the current session
 */
export function endSession(stats = {}) {
    if (currentSessionId) {
        db.endSession(currentSessionId, stats);
        logger.info(`Audit session ended: ${currentSessionId}`);
        currentSessionId = null;
    }
}

/**
 * Get current session ID
 */
export function getSessionId() {
    return currentSessionId;
}

/**
 * Log the start of an AI request
 */
export function startRequest(agentId, agentName, prompt) {
    currentRequestId = db.logRequest(currentSessionId, agentId, agentName, prompt);
    return currentRequestId;
}

/**
 * Log the completion of an AI request
 */
export function endRequest(response, tokensUsed = 0, durationMs = 0, success = true, error = null) {
    if (currentRequestId) {
        db.updateRequest(currentRequestId, response, tokensUsed, durationMs, success, error);
        const reqId = currentRequestId;
        currentRequestId = null;
        return reqId;
    }
}

/**
 * Get current request ID
 */
export function getRequestId() {
    return currentRequestId;
}

/**
 * Log a tool call
 */
export function logToolCall(agentId, toolName, args) {
    const toolCallId = db.logToolCall(currentRequestId, agentId, toolName, args);
    return toolCallId;
}

/**
 * Update tool call with result
 */
export function completeToolCall(toolCallId, result, success = true, error = null, durationMs = 0) {
    db.updateToolCall(toolCallId, result, success, error, durationMs);
}

/**
 * Log an invariant violation
 */
export function logViolation(agentId, invariantType, operation, target, reason, blocked = true) {
    const violationId = db.logViolation(
        currentRequestId,
        agentId,
        invariantType,
        operation,
        target,
        reason,
        blocked
    );

    if (blocked) {
        logger.warn(`VIOLATION BLOCKED: ${reason}`, agentId);
    } else {
        logger.warn(`VIOLATION WARNING: ${reason}`, agentId);
    }

    return violationId;
}

/**
 * Get audit summary for display
 */
export function getAuditSummary() {
    const stats = db.getStats();
    const recentSessions = db.getRecentSessions(5);
    const recentViolations = db.getRecentViolations(10);

    return {
        stats,
        recentSessions,
        recentViolations,
    };
}

/**
 * Get detailed session info
 */
export function getSessionDetails(sessionId) {
    const session = db.getSession(sessionId);
    const requests = db.getSessionRequests(sessionId);
    const violations = db.getSessionViolations(sessionId);

    // Get tool calls for each request
    const requestsWithTools = requests.map(req => ({
        ...req,
        toolCalls: db.getRequestToolCalls(req.id),
    }));

    return {
        session,
        requests: requestsWithTools,
        violations,
    };
}

export default {
    startSession,
    endSession,
    getSessionId,
    startRequest,
    endRequest,
    getRequestId,
    logToolCall,
    completeToolCall,
    logViolation,
    getAuditSummary,
    getSessionDetails,
};
