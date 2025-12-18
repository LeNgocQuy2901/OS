import { Button, Form, Input, InputNumber, Select, Spin, message } from "antd";
import { CPUSchedulingInputSection } from "../../components/CPUSchedulingInputSection";
import { CPUSchedulingOutputSection } from "../../components/CPUSchedulingOutputSection";
import { useSavedState } from "../../hooks/useSavedState";
import { useState } from "react";
import { Process, CPUSchedulingAlgorithmId, CPUSchedulingAlgorithmOutput } from "../../utils/algorithms/cpu_scheduling/base";
import { fcfsAlgorithm } from "../../utils/algorithms/cpu_scheduling/fcfsAlgorithm";
import { sjfAlgorithm } from "../../utils/algorithms/cpu_scheduling/sjfAlgorithm";
import { srtfAlgorithm } from "../../utils/algorithms/cpu_scheduling/srtfAlgorithm";
import { rrAlgorithm } from "../../utils/algorithms/cpu_scheduling/rrAlgorithm";
import { priorityNonPreemptiveAlgorithm } from "../../utils/algorithms/cpu_scheduling/priorityNonPreemptiveAlgorithm";
import { priorityPreemptiveAlgorithm } from "../../utils/algorithms/cpu_scheduling/priorityPreemptiveAlgorithm";

async function executeOneAlgorithm({
    algorithm,
    processes,
    quantumTime,
}: {
    algorithm: CPUSchedulingAlgorithmId;
    processes: Process[];
    quantumTime: number;
}): Promise<CPUSchedulingAlgorithmOutput> {
    if (processes.length === 0) {
        throw new Error("Please add at least one process");
    }

    const input = {
        algorithm,
        processes,
        quantumTime,
    };

    switch (algorithm) {
        case 'fcfs':
            return fcfsAlgorithm(input);
        case 'sjf':
            return sjfAlgorithm(input);
        case 'srtf':
            return srtfAlgorithm(input);
        case 'rr':
            return rrAlgorithm(input);
        case 'priority_non_preemptive':
            return priorityNonPreemptiveAlgorithm(input);
        case 'priority_preemptive':
            return priorityPreemptiveAlgorithm(input);
        default:
            throw new Error("Algorithm not implemented");
    }
}

export default function CPUScheduling() {
    const [processes, setProcesses] = useSavedState<Process[]>(
        [],
        "CPUScheduling_processes",
    );

    const [algorithm, setAlgorithm] = useSavedState<CPUSchedulingAlgorithmId>(
        "fcfs",
        "CPUScheduling_algorithm",
    );

    const [quantumTime, setQuantumTime] = useSavedState<number>(
        2,
        "CPUScheduling_quantumTime",
    );

    const [output, setOutput] = useSavedState<CPUSchedulingAlgorithmOutput | null>(
        null,
        "CPUScheduling_output",
    );

    const [isLoading, setIsLoading] = useState(false);

    const handleExecute = async () => {
        try {
            setIsLoading(true);
            const result = await executeOneAlgorithm({
                algorithm,
                processes,
                quantumTime,
            });
            setOutput(result);
            message.success("Algorithm executed successfully");
        } catch (error) {
            message.error(
                "Error: " + (error instanceof Error ? error.message : "Unknown error")
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ padding: "20px", maxWidth: "1400px", margin: "0 auto" }}>
            <h1>CPU Scheduling Algorithms</h1>
            
            <CPUSchedulingInputSection
                processes={processes}
                setProcesses={setProcesses}
                algorithm={algorithm}
                setAlgorithm={setAlgorithm}
                quantumTime={quantumTime}
                setQuantumTime={setQuantumTime}
                onExecute={handleExecute}
                isLoading={isLoading}
            />

            {isLoading && (
                <div style={{ textAlign: "center", padding: "40px" }}>
                    <Spin size="large" />
                </div>
            )}

            {output && !isLoading && <CPUSchedulingOutputSection output={output} />}
        </div>
    );
}
