export interface Process {
    id: string;
    arrivalTime: number;
    burstTime: number;
    priority?: number;
    quantumTime?: number;
}

export interface CPUSchedulingAlgorithmOutput {
    algorithm: CPUSchedulingAlgorithmId;
    processes: Process[];
    ganttChart: GanttChartEntry[];
    avgWaitingTime: number;
    avgTurnaroundTime: number;
    avgResponseTime?: number;
    contextSwitches?: number;
    details?: string;
}

export interface GanttChartEntry {
    process: string | 'Idle';
    startTime: number;
    endTime: number;
    processId?: string;
}

export type CPUSchedulingAlgorithmId = 
    | 'fcfs' 
    | 'sjf' 
    | 'srtf' 
    | 'rr' 
    | 'priority_non_preemptive' 
    | 'priority_preemptive';

export const ALL_CPU_SCHEDULING_ALGORITHMS: Array<{
    value: CPUSchedulingAlgorithmId;
    label: string;
}> = [
    { value: 'fcfs', label: 'First Come First Serve (FCFS)' },
    { value: 'sjf', label: 'Shortest Job First (SJF)' },
    { value: 'srtf', label: 'Shortest Remaining Time First (SRTF)' },
    { value: 'rr', label: 'Round Robin (RR)' },
    { value: 'priority_non_preemptive', label: 'Priority (Non-Preemptive)' },
    { value: 'priority_preemptive', label: 'Priority (Preemptive)' },
];

export interface CPUSchedulingAlgorithmInput {
    algorithm: CPUSchedulingAlgorithmId;
    processes: Process[];
    quantumTime?: number;
}
