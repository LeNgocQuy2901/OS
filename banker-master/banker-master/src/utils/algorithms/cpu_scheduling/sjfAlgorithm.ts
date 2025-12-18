import { CPUSchedulingAlgorithmInput, CPUSchedulingAlgorithmOutput, GanttChartEntry, Process } from './base';

export function sjfAlgorithm(input: CPUSchedulingAlgorithmInput): CPUSchedulingAlgorithmOutput {
    const { processes } = input;
    
    const ganttChart: GanttChartEntry[] = [];
    let currentTime = 0;
    let totalWaitingTime = 0;
    let totalTurnaroundTime = 0;
    const completed: Set<string> = new Set();
    
    while (completed.size < processes.length) {
        // Find available processes at current time
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
        
        // Select process with shortest burst time
        const selected = available.reduce((min, p) => 
            p.burstTime < min.burstTime ? p : min
        );
        
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
        algorithm: 'sjf',
        processes,
        ganttChart,
        avgWaitingTime: totalWaitingTime / processes.length,
        avgTurnaroundTime: totalTurnaroundTime / processes.length,
        contextSwitches: Math.max(0, processes.length - 1),
    };
}
