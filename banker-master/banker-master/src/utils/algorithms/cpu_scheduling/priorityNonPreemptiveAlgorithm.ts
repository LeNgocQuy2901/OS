import { CPUSchedulingAlgorithmInput, CPUSchedulingAlgorithmOutput, GanttChartEntry, Process } from './base';

export function priorityNonPreemptiveAlgorithm(input: CPUSchedulingAlgorithmInput): CPUSchedulingAlgorithmOutput {
    const { processes } = input;
    
    // Check if all processes have priority
    if (processes.some(p => p.priority === undefined)) {
        throw new Error("All processes must have priority for priority scheduling");
    }
    
    const ganttChart: GanttChartEntry[] = [];
    let currentTime = 0;
    let totalWaitingTime = 0;
    let totalTurnaroundTime = 0;
    const completed: Set<string> = new Set();
    
    while (completed.size < processes.length) {
        // Find available processes
        const available = processes.filter(
            p => p.arrivalTime <= currentTime && !completed.has(p.id)
        );
        
        if (available.length === 0) {
            // Find next arriving process
            const nextProcess = processes.find(p => !completed.has(p.id));
            if (nextProcess && nextProcess.arrivalTime > currentTime) {
                ganttChart.push({
                    process: 'Idle',
                    startTime: currentTime,
                    endTime: nextProcess.arrivalTime,
                });
                currentTime = nextProcess.arrivalTime;
            }
            continue;
        }
        
        // Select process with highest priority (lower number = higher priority)
        const selected = available.reduce((max, p) => {
            const pPriority = p.priority ?? Infinity;
            const maxPriority = max.priority ?? Infinity;
            return pPriority < maxPriority ? p : max;
        });
        
        const startTime = currentTime;
        const endTime = currentTime + selected.burstTime;
        
        ganttChart.push({
            process: selected.id,
            processId: selected.id,
            startTime,
            endTime,
        });
        
        const waitingTime = startTime - selected.arrivalTime;
        const turnaroundTime = endTime - selected.arrivalTime;
        
        totalWaitingTime += waitingTime;
        totalTurnaroundTime += turnaroundTime;
        
        completed.add(selected.id);
        currentTime = endTime;
    }
    
    return {
        algorithm: 'priority_non_preemptive',
        processes,
        ganttChart,
        avgWaitingTime: totalWaitingTime / processes.length,
        avgTurnaroundTime: totalTurnaroundTime / processes.length,
        contextSwitches: Math.max(0, processes.length - 1),
    };
}
