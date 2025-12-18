import { Button, Form, Input, InputNumber, Select, Table, Card, Row, Col, Divider, Upload, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useSavedState } from "../../hooks/useSavedState";
import { useState } from "react";
import { Process, CPUSchedulingAlgorithmId, ALL_CPU_SCHEDULING_ALGORITHMS } from "../../utils/algorithms/cpu_scheduling/base";
import type { UploadFile } from "antd";

interface ProcessInput {
    id: string;
    arrivalTime: string;
    burstTime: string;
    priority?: string;
}

export interface CPUSchedulingInputSectionProps {
    processes: Process[];
    setProcesses: (processes: Process[]) => void;
    algorithm: CPUSchedulingAlgorithmId;
    setAlgorithm: (algorithm: CPUSchedulingAlgorithmId) => void;
    quantumTime: number;
    setQuantumTime: (time: number) => void;
    onExecute: () => Promise<void>;
    isLoading: boolean;
}

export function CPUSchedulingInputSection({
    processes,
    setProcesses,
    algorithm,
    setAlgorithm,
    quantumTime,
    setQuantumTime,
    onExecute,
    isLoading,
}: CPUSchedulingInputSectionProps) {
    const [processInputs, setProcessInputs] = useState<ProcessInput[]>(
        processes.map(p => ({
            id: p.id,
            arrivalTime: p.arrivalTime.toString(),
            burstTime: p.burstTime.toString(),
            priority: p.priority?.toString(),
        }))
    );

    const addProcess = () => {
        setProcessInputs([...processInputs, {
            id: `P${processInputs.length + 1}`,
            arrivalTime: '0',
            burstTime: '0',
        }]);
    };

    const updateProcess = (index: number, field: keyof ProcessInput, value: string) => {
        const newInputs = [...processInputs];
        newInputs[index] = { ...newInputs[index], [field]: value };
        setProcessInputs(newInputs);
    };

    const removeProcess = (index: number) => {
        setProcessInputs(processInputs.filter((_, i) => i !== index));
    };

    const handleFileUpload = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const lines = content.trim().split('\n').filter(line => line.trim());
                
                const newInputs: ProcessInput[] = [];
                
                for (const line of lines) {
                    // Support formats: P1,0,8 or P1:0:8 or P1 0 8
                    const separators = [',', ':', ' ', '\t'];
                    let parts: string[] = [];
                    
                    for (const sep of separators) {
                        if (line.includes(sep)) {
                            parts = line.split(sep).map(p => p.trim()).filter(p => p);
                            break;
                        }
                    }
                    
                    if (parts.length >= 3) {
                        const input: ProcessInput = {
                            id: parts[0],
                            arrivalTime: parts[1],
                            burstTime: parts[2],
                            priority: parts[3] ? parts[3] : undefined,
                        };
                        newInputs.push(input);
                    }
                }
                
                if (newInputs.length > 0) {
                    setProcessInputs(newInputs);
                    message.success(`Đã tải ${newInputs.length} process từ file`);
                } else {
                    message.error('Không thể parse file. Định dạng: P1,0,8 hoặc P1:0:8 hoặc P1 0 8');
                }
            } catch (err) {
                message.error('Lỗi khi đọc file: ' + (err instanceof Error ? err.message : 'Unknown error'));
            }
        };
        reader.readAsText(file);
        return false; // Prevent default upload
    };

    const applyChanges = () => {
        const newProcesses = processInputs.map(input => ({
            id: input.id,
            arrivalTime: parseInt(input.arrivalTime, 10),
            burstTime: parseInt(input.burstTime, 10),
            priority: input.priority ? parseInt(input.priority, 10) : undefined,
        }));
        
        if (newProcesses.some(p => isNaN(p.arrivalTime) || isNaN(p.burstTime) || p.arrivalTime < 0 || p.burstTime <= 0)) {
            message.error('Arrival Time phải >= 0, Burst Time phải > 0');
            return;
        }
        
        setProcesses(newProcesses);
        message.success('Cập nhật process thành công');
    };

    const columns = [
        {
            title: 'Process ID',
            dataIndex: 'id',
            key: 'id',
            width: 100,
            render: (_: string, _record: ProcessInput, index: number) => (
                <Input
                    value={processInputs[index].id}
                    onChange={(e) => updateProcess(index, 'id', e.target.value)}
                />
            ),
        },
        {
            title: 'Arrival Time',
            dataIndex: 'arrivalTime',
            key: 'arrivalTime',
            width: 120,
            render: (_: string, _record: ProcessInput, index: number) => (
                <InputNumber
                    value={parseInt(processInputs[index].arrivalTime, 10)}
                    onChange={(val) => updateProcess(index, 'arrivalTime', val?.toString() || '0')}
                    min={0}
                />
            ),
        },
        {
            title: 'Burst Time',
            dataIndex: 'burstTime',
            key: 'burstTime',
            width: 120,
            render: (_: string, _record: ProcessInput, index: number) => (
                <InputNumber
                    value={parseInt(processInputs[index].burstTime, 10)}
                    onChange={(val) => updateProcess(index, 'burstTime', val?.toString() || '1')}
                    min={1}
                />
            ),
        },
        {
            title: 'Priority',
            dataIndex: 'priority',
            key: 'priority',
            width: 100,
            render: (_: string, _record: ProcessInput, index: number) => (
                <InputNumber
                    value={processInputs[index].priority ? parseInt(processInputs[index].priority, 10) : undefined}
                    onChange={(val) => updateProcess(index, 'priority', val?.toString() || '')}
                    min={0}
                    placeholder="Optional"
                />
            ),
        },
        {
            title: 'Action',
            key: 'action',
            width: 100,
            render: (_: string, _record: ProcessInput, index: number) => (
                <Button danger onClick={() => removeProcess(index)}>Delete</Button>
            ),
        },
    ];

    return (
        <Card title="CPU Scheduling Input" style={{ marginBottom: 20 }}>
            <Row gutter={16} style={{ marginBottom: 20 }}>
                <Col span={12}>
                    <Form layout="vertical">
                        <Form.Item label="Algorithm">
                            <Select
                                value={algorithm}
                                onChange={setAlgorithm}
                                options={ALL_CPU_SCHEDULING_ALGORITHMS}
                            />
                        </Form.Item>
                    </Form>
                </Col>
                <Col span={12}>
                    <Form layout="vertical">
                        <Form.Item label="Quantum Time (for Round Robin)">
                            <InputNumber
                                value={quantumTime}
                                onChange={(val) => setQuantumTime(val || 2)}
                                min={1}
                            />
                        </Form.Item>
                    </Form>
                </Col>
            </Row>

            <Divider>Processes</Divider>

            <Row gutter={16} style={{ marginBottom: 15 }}>
                <Col>
                    <Upload
                        beforeUpload={handleFileUpload}
                        maxCount={1}
                        accept=".txt,.csv"
                    >
                        <Button icon={<UploadOutlined />}>Upload File</Button>
                    </Upload>
                </Col>
                <Col>
                    <Button onClick={addProcess}>Add Process</Button>
                </Col>
                <Col>
                    <Button type="primary" onClick={applyChanges}>Apply Changes</Button>
                </Col>
            </Row>

            <Table
                columns={columns}
                dataSource={processInputs.map((_, index) => ({ key: index }))}
                pagination={false}
                size="small"
            />

            <Divider />

            <Button
                type="primary"
                size="large"
                onClick={onExecute}
                loading={isLoading}
                block
                style={{ marginTop: 20 }}
            >
                Execute Algorithm
            </Button>
        </Card>
    );
}
