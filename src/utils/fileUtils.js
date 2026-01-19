import fs from 'fs/promises';
import path from 'path';
import { PROJECT_ROOT, CEO_TASKS_FILE, WORKING_DIR } from '../config/index.js';

/**
 * Check if a path is within the allowed working directory
 */
export function isPathSafe(targetPath, agentId = null) {
    const resolved = path.resolve(targetPath);

    // Block modification of CEO tasks file by agents
    if (agentId && resolved === path.resolve(CEO_TASKS_FILE)) {
        return { safe: false, reason: 'Agents cannot modify the CEO tasks file' };
    }

    // Must be within the working directory or data directory
    const allowedPaths = [
        path.resolve(WORKING_DIR),
        path.resolve(PROJECT_ROOT, 'data'),
    ];

    const isAllowed = allowedPaths.some(allowed => resolved.startsWith(allowed));

    if (!isAllowed) {
        return { safe: false, reason: `Path outside allowed directories: ${resolved}` };
    }

    return { safe: true };
}

/**
 * Safely read a file
 */
export async function safeReadFile(filePath) {
    const check = isPathSafe(filePath);
    if (!check.safe) {
        throw new Error(check.reason);
    }

    return fs.readFile(filePath, 'utf-8');
}

/**
 * Safely write a file (for agents - enforces restrictions)
 */
export async function safeWriteFile(filePath, content, agentId) {
    const check = isPathSafe(filePath, agentId);
    if (!check.safe) {
        throw new Error(check.reason);
    }

    // Ensure directory exists
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });

    return fs.writeFile(filePath, content, 'utf-8');
}

/**
 * Safely delete a file (for agents - enforces restrictions)
 */
export async function safeDeleteFile(filePath, agentId) {
    const check = isPathSafe(filePath, agentId);
    if (!check.safe) {
        throw new Error(check.reason);
    }

    return fs.unlink(filePath);
}

/**
 * Check if file exists
 */
export async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

/**
 * Read JSON file with default value
 */
export async function readJsonFile(filePath, defaultValue = null) {
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(content);
    } catch {
        return defaultValue;
    }
}

/**
 * Write JSON file
 */
export async function writeJsonFile(filePath, data) {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    return fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * List files in a directory
 */
export async function listFiles(dirPath, extension = null) {
    try {
        const files = await fs.readdir(dirPath);
        if (extension) {
            return files.filter(f => f.endsWith(extension));
        }
        return files;
    } catch {
        return [];
    }
}

/**
 * Get today's date as YYYY-MM-DD
 */
export function getTodayDate() {
    return new Date().toISOString().slice(0, 10);
}

export default {
    isPathSafe,
    safeReadFile,
    safeWriteFile,
    safeDeleteFile,
    fileExists,
    readJsonFile,
    writeJsonFile,
    listFiles,
    getTodayDate,
};
