import { CPUSchedulingAlgorithmInput, CPUSchedulingAlgorithmOutput, GanttChartEntry, Process } from './base';

export function srtfAlgorithm(input: CPUSchedulingAlgorithmInput): CPUSchedulingAlgorithmOutput {
    const { processes } = input;
    
    // Create a copy of processes with remaining time
    const processesCopy = processes.map(p => ({
        ...p,
        remainingTime: p.burstTime,
    }));
    
    const ganttChart: GanttChartEntry[] = [];
    let currentTime = 0;
    let totalWaitingTime = 0;
    let totalTurnaroundTime = 0;
    let lastProcess: string | null = null;
    let lastStartTime = 0;
    
    while (processesCopy.some(p => p.remainingTime > 0)) {
        // Find available processes with shortest remaining time
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
        
        // Select process with shortest remaining time
        const selected = available.reduce((min, p) => 
            p.remainingTime < min.remainingTime ? p : min
        );
        
        // Check if we need to add a new entry
        if (lastProcess !== selected.id) {
            if (lastProcess !== null) {
                ganttChart[ganttChart.length - 1].endTime = currentTime;
            }
            ganttChart.push({
                process: selected.id,
                processId: selected.id,
                startTime: currentTime,
                endTime: currentTime + 1, // Placeholder, will be updated
            });
            lastProcess = selected.id;
            lastStartTime = currentTime;
        }
        
        selected.remainingTime--;
        currentTime++;
        
        // If process is completed
        if (selected.remainingTime === 0) {
            ganttChart[ganttChart.length - 1].endTime = currentTime;
            
            const turnaroundTime = currentTime - selected.arrivalTime;
            const waitingTime = turnaroundTime - selected.burstTime;
            
            totalWaitingTime += waitingTime;
            totalTurnaroundTime += turnaroundTime;
            
            lastProcess = null;
        }
    }
    
    return {
        algorithm: 'srtf',
        processes,
        ganttChart,
        avgWaitingTime: totalWaitingTime / processes.length,
        avgTurnaroundTime: totalTurnaroundTime / processes.length,
        contextSwitches: ganttChart.filter((g, i) => i === 0 || ganttChart[i - 1].process !== g.process).length - 1,
    };
}
