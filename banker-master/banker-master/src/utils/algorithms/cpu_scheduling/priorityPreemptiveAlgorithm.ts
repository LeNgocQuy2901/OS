import { CPUSchedulingAlgorithmInput, CPUSchedulingAlgorithmOutput, GanttChartEntry, Process } from './base';

export function priorityPreemptiveAlgorithm(input: CPUSchedulingAlgorithmInput): CPUSchedulingAlgorithmOutput {
    const { processes } = input;
    
    // Check if all processes have priority
    if (processes.some(p => p.priority === undefined)) {
        throw new Error("All processes must have priority for priority scheduling");
    }
    
    // Create a copy of processes with remaining time
    const processesCopy = processes.map(p => ({
        ...p,
        remainingTime: p.burstTime,
    }));
    
    const ganttChart: GanttChartEntry[] = [];
    let currentTime = 0;
    let totalWaitingTime = 0;
    let totalTurnaroundTime = 0;
    
    while (processesCopy.some(p => p.remainingTime > 0)) {
        // Find available processes with highest priority
        const available = processesCopy.filter(p => 
            p.arrivalTime <= currentTime && p.remainingTime > 0
        );
        
        if (available.length === 0) {
            // Add idle time
            const nextProcess = processesCopy.find(p => p.remainingTime > 0);
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
        
        // Select process with highest priority
        const selected = available.reduce((max, p) => {
            const pPriority = p.priority ?? Infinity;
            const maxPriority = max.priority ?? Infinity;
            return pPriority < maxPriority ? p : max;
        });
        
        const startTime = currentTime;
        
        // Execute until next arrival or 1 unit time
        const nextArrival = processesCopy
            .filter(p => p.arrivalTime > currentTime && p.remainingTime > 0)
            .map(p => p.arrivalTime);
        
        const timeSlice = Math.min(
            selected.remainingTime,
            nextArrival.length > 0 ? Math.min(...nextArrival) - currentTime : selected.remainingTime,
            1
        );
        
        ganttChart.push({
            process: selected.id,
            processId: selected.id,
            startTime,
            endTime: startTime + timeSlice,
        });
        
        selected.remainingTime -= timeSlice;
        currentTime += timeSlice;
        
        // If process is completed
        if (selected.remainingTime === 0) {
            const turnaroundTime = currentTime - selected.arrivalTime;
            const waitingTime = turnaroundTime - selected.burstTime;
            
            totalWaitingTime += waitingTime;
            totalTurnaroundTime += turnaroundTime;
        }
    }
    
    return {
        algorithm: 'priority_preemptive',
        processes,
        ganttChart,
        avgWaitingTime: totalWaitingTime / processes.length,
        avgTurnaroundTime: totalTurnaroundTime / processes.length,
        contextSwitches: ganttChart.filter((g, i) => i === 0 || ganttChart[i - 1].process !== g.process).length - 1,
    };
}
