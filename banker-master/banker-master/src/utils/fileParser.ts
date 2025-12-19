import { message } from 'antd';

/**
 * Parse CPU Scheduling input file
 * Format: ProcessID,ArrivalTime,BurstTime,Priority (optional)
 */
export function parseCPUSchedulingFile(content: string): Array<{
    id: string;
    arrivalTime: number;
    burstTime: number;
    priority?: number;
}> {
    const lines = content.trim().split('\n').filter(line => line.trim());
    const processes: Array<{
        id: string;
        arrivalTime: number;
        burstTime: number;
        priority?: number;
    }> = [];

    for (const line of lines) {
        const separators = [',', ':', ' ', '\t'];
        let parts: string[] = [];

        for (const sep of separators) {
            if (line.includes(sep)) {
                parts = line.split(sep).map(p => p.trim()).filter(p => p);
                break;
            }
        }

        if (parts.length >= 3) {
            const process = {
                id: parts[0],
                arrivalTime: parseInt(parts[1], 10),
                burstTime: parseInt(parts[2], 10),
                priority: parts[3] ? parseInt(parts[3], 10) : undefined,
            };

            if (!isNaN(process.arrivalTime) && !isNaN(process.burstTime)) {
                processes.push(process);
            }
        }
    }

    return processes;
}

/**
 * Parse Page Replacement input file
 * Format: number1,number2,number3,... (reference string separated by comma/space/colon)
 */
export function parsePageReplacementFile(content: string): string {
    const line = content.trim().split('\n')[0];
    return line;
}

/**
 * Parse HDD Scheduling input file
 * Format: cylinder1,cylinder2,cylinder3,... (reference string)
 */
export function parseHDDSchedulingFile(content: string): string {
    const line = content.trim().split('\n')[0];
    return line;
}

/**
 * Parse Banker/Deadlock Detection input file
 * Format:
 * Line 1: numProcesses numResources
 * Line 2: Available vector (space or comma separated)
 * Line 3+: Holding/Allocation matrix (numProcesses rows, space or comma separated)
 * Line 3+numProcesses: Max/Request matrix (numProcesses rows, space or comma separated)
 */
export function parseBankerFile(content: string): {
    numProcesses: number;
    numResources: number;
    available: number[];
    holding: number[][];
    max: number[][];
} {
    const lines = content.trim().split('\n').map(l => l.trim()).filter(line => line.length > 0);
    
    if (lines.length < 1) throw new Error("File is empty");
    
    const [numProcesses, numResources] = lines[0].split(/[\s,]+/).map(Number);
    
    if (lines.length < 1 + numResources + 2 * numProcesses) {
        throw new Error(`Expected at least ${1 + numResources + 2 * numProcesses} lines, got ${lines.length}`);
    }
    
    // Parse available vector - next numResources line(s) or 1 line
    let available: number[] = [];
    let currentLine = 1;
    
    // Try to collect numResources values
    while (available.length < numResources && currentLine < lines.length) {
        const nums = lines[currentLine].split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
        available.push(...nums);
        currentLine++;
    }
    
    available = available.slice(0, numResources);
    
    // Parse holding matrix
    const holding: number[][] = [];
    for (let i = 0; i < numProcesses; i++) {
        const nums = lines[currentLine].split(/[\s,]+/).map(Number).filter(n => !isNaN(n)).slice(0, numResources);
        if (nums.length === 0) throw new Error(`Row ${currentLine} for holding matrix is empty`);
        holding.push(nums);
        currentLine++;
    }
    
    // Parse max matrix
    const max: number[][] = [];
    for (let i = 0; i < numProcesses; i++) {
        const nums = lines[currentLine].split(/[\s,]+/).map(Number).filter(n => !isNaN(n)).slice(0, numResources);
        if (nums.length === 0) throw new Error(`Row ${currentLine} for max matrix is empty`);
        max.push(nums);
        currentLine++;
    }
    
    return { numProcesses, numResources, available, holding, max };
}

/**
 * Parse Deadlock Detection input file
 * Format:
 * Line 1: numProcesses numResources
 * Line 2: Available vector
 * Line 3+: Allocation matrix (numProcesses rows)
 * Line 3+numProcesses: Request matrix (numProcesses rows)
 */
export function parseDeadlockDetectionFile(content: string): {
    numProcesses: number;
    numResources: number;
    available: number[];
    allocation: number[][];
    request: number[][];
} {
    const lines = content.trim().split('\n').map(l => l.trim()).filter(line => line.length > 0);
    
    if (lines.length < 1) throw new Error("File is empty");
    
    const [numProcesses, numResources] = lines[0].split(/[\s,]+/).map(Number);
    
    if (lines.length < 1 + numResources + 2 * numProcesses) {
        throw new Error(`Expected at least ${1 + numResources + 2 * numProcesses} lines, got ${lines.length}`);
    }
    
    // Parse available vector
    let available: number[] = [];
    let currentLine = 1;
    
    while (available.length < numResources && currentLine < lines.length) {
        const nums = lines[currentLine].split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
        available.push(...nums);
        currentLine++;
    }
    
    available = available.slice(0, numResources);
    
    // Parse allocation matrix
    const allocation: number[][] = [];
    for (let i = 0; i < numProcesses; i++) {
        const nums = lines[currentLine].split(/[\s,]+/).map(Number).filter(n => !isNaN(n)).slice(0, numResources);
        if (nums.length === 0) throw new Error(`Row ${currentLine} for allocation matrix is empty`);
        allocation.push(nums);
        currentLine++;
    }
    
    // Parse request matrix
    const request: number[][] = [];
    for (let i = 0; i < numProcesses; i++) {
        const nums = lines[currentLine].split(/[\s,]+/).map(Number).filter(n => !isNaN(n)).slice(0, numResources);
        if (nums.length === 0) throw new Error(`Row ${currentLine} for request matrix is empty`);
        request.push(nums);
        currentLine++;
    }
    
    return { numProcesses, numResources, available, allocation, request };
}

/**
 * Parse UFS input file
 * Format: inode_list (space/comma separated numbers)
 */
export function parseUFSFile(content: string): number[] {
    const line = content.trim().split('\n')[0];
    const separators = [',', ':', ' ', '\t'];
    let parts: string[] = [];

    for (const sep of separators) {
        if (line.includes(sep)) {
            parts = line.split(sep).map(p => p.trim()).filter(p => p);
            break;
        }
    }

    return parts.map(p => parseInt(p, 10)).filter(n => !isNaN(n));
}

/**
 * Parse Virtual Memory input file
 * Format:
 * Line 1: memorySize pageSize
 * Line 2+: process_size (one per line or space/comma separated)
 */
export function parseVirtualMemoryFile(content: string): {
    memorySize: number;
    pageSize: number;
    processes: number[];
} {
    const lines = content.trim().split('\n').filter(line => line.trim());
    
    const [memorySize, pageSize] = lines[0].split(/\s+/).map(Number);
    const processes: number[] = [];
    
    for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(/\s+|,/).filter(p => p.trim());
        parts.forEach(p => {
            const num = parseInt(p.trim(), 10);
            if (!isNaN(num)) {
                processes.push(num);
            }
        });
    }
    
    return { memorySize, pageSize, processes };
}
