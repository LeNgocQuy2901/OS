import { CPUSchedulingAlgorithmInput, CPUSchedulingAlgorithmOutput, GanttChartEntry, Process } from './base';

export function fcfsAlgorithm(input: CPUSchedulingAlgorithmInput): CPUSchedulingAlgorithmOutput {
    const { processes } = input;
    
    // Sort by arrival time
    const sortedProcesses = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime);
    
    const ganttChart: GanttChartEntry[] = [];
    let currentTime = 0;
    let totalWaitingTime = 0;
    let totalTurnaroundTime = 0;
    
    for (const process of sortedProcesses) {
        // If current time is less than arrival time, add idle time
        if (currentTime < process.arrivalTime) {
            ganttChart.push({
                process: 'Idle',
                startTime: currentTime,
                endTime: process.arrivalTime,
            });
            currentTime = process.arrivalTime;
        }
        
        // Add process to Gantt chart
        const startTime = currentTime;
        const endTime = currentTime + process.burstTime;
        ganttChart.push({
            process: process.id,
            processId: process.id,
            startTime,
            endTime,
        });
        
        // Calculate waiting and turnaround time
        const waitingTime = startTime - process.arrivalTime;
        const turnaroundTime = endTime - process.arrivalTime;
        
        totalWaitingTime += waitingTime;
        totalTurnaroundTime += turnaroundTime;
        
        currentTime = endTime;
    }
    
    return {
        algorithm: 'fcfs',
        processes: sortedProcesses,
        ganttChart,
        avgWaitingTime: totalWaitingTime / processes.length,
        avgTurnaroundTime: totalTurnaroundTime / processes.length,
        contextSwitches: Math.max(0, processes.length - 1),
    };
}
