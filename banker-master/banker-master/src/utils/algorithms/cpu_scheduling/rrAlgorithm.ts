import { CPUSchedulingAlgorithmInput, CPUSchedulingAlgorithmOutput, GanttChartEntry, Process } from './base';

export function rrAlgorithm(input: CPUSchedulingAlgorithmInput): CPUSchedulingAlgorithmOutput {
    const { processes, quantumTime = 2 } = input;
    
    // Create a copy of processes with remaining time
    const processQueue = processes
        .map(p => ({
            ...p,
            remainingTime: p.burstTime,
        }))
        .filter(p => p.remainingTime > 0)
        .sort((a, b) => a.arrivalTime - b.arrivalTime);
    
    const ganttChart: GanttChartEntry[] = [];
    const processFirstRunTime: Map<string, number> = new Map();
    let currentTime = 0;
    let totalWaitingTime = 0;
    let totalTurnaroundTime = 0;
    let totalResponseTime = 0;
    let queueIndex = 0;
    
    while (processQueue.some(p => p.remainingTime > 0)) {
        // Find next available process
        let nextIndex = -1;
        for (let i = 0; i < processQueue.length; i++) {
            if (processQueue[i].remainingTime > 0 && processQueue[i].arrivalTime <= currentTime) {
                nextIndex = i;
                break;
            }
        }
        
        // If no process available, move time to next arrival
        if (nextIndex === -1) {
            const nextArrival = Math.min(
                ...processQueue.filter(p => p.remainingTime > 0 && p.arrivalTime > currentTime)
                    .map(p => p.arrivalTime)
            );
            if (isFinite(nextArrival)) {
                ganttChart.push({
                    process: 'Idle',
                    startTime: currentTime,
                    endTime: nextArrival,
                });
                currentTime = nextArrival;
                continue;
            }
        }
        
        if (nextIndex === -1) break;
        
        const process = processQueue[nextIndex];
        
        // Record first run time for response time
        if (!processFirstRunTime.has(process.id)) {
            processFirstRunTime.set(process.id, currentTime);
            totalResponseTime += currentTime - process.arrivalTime;
        }
        
        // Execute for quantum time or remaining time
        const executionTime = Math.min(quantumTime, process.remainingTime);
        
        ganttChart.push({
            process: process.id,
            processId: process.id,
            startTime: currentTime,
            endTime: currentTime + executionTime,
        });
        
        process.remainingTime -= executionTime;
        currentTime += executionTime;
        
        // If process is not finished, move it to end of queue
        if (process.remainingTime > 0) {
            processQueue.splice(nextIndex, 1);
            processQueue.push(process);
        } else {
            // Process completed
            const turnaroundTime = currentTime - process.arrivalTime;
            const waitingTime = turnaroundTime - process.burstTime;
            
            totalWaitingTime += waitingTime;
            totalTurnaroundTime += turnaroundTime;
        }
    }
    
    return {
        algorithm: 'rr',
        processes,
        ganttChart,
        avgWaitingTime: totalWaitingTime / processes.length,
        avgTurnaroundTime: totalTurnaroundTime / processes.length,
        avgResponseTime: totalResponseTime / processes.length,
        contextSwitches: Math.max(0, ganttChart.length - 1),
    };
}
