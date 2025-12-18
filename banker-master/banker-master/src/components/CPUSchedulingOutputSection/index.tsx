import { Card, Table, Row, Col, Statistic, Divider } from "antd";
import { CPUSchedulingAlgorithmOutput, GanttChartEntry } from "../../utils/algorithms/cpu_scheduling/base";

export interface CPUSchedulingOutputSectionProps {
    output: CPUSchedulingAlgorithmOutput;
}

export function CPUSchedulingOutputSection({ output }: CPUSchedulingOutputSectionProps) {
    const ganttChartData = output.ganttChart.map((entry, index) => ({
        key: index,
        process: entry.process,
        startTime: entry.startTime,
        endTime: entry.endTime,
        duration: entry.endTime - entry.startTime,
    }));

    const processMetrics = output.processes.map(process => ({
        key: process.id,
        id: process.id,
        arrivalTime: process.arrivalTime,
        burstTime: process.burstTime,
        priority: process.priority ?? 'N/A',
    }));

    const ganttColumns = [
        {
            title: 'Process',
            dataIndex: 'process',
            key: 'process',
            width: 100,
        },
        {
            title: 'Start Time',
            dataIndex: 'startTime',
            key: 'startTime',
            width: 100,
        },
        {
            title: 'End Time',
            dataIndex: 'endTime',
            key: 'endTime',
            width: 100,
        },
        {
            title: 'Duration',
            dataIndex: 'duration',
            key: 'duration',
            width: 100,
        },
    ];

    const processColumns = [
        {
            title: 'Process ID',
            dataIndex: 'id',
            key: 'id',
            width: 100,
        },
        {
            title: 'Arrival Time',
            dataIndex: 'arrivalTime',
            key: 'arrivalTime',
            width: 120,
        },
        {
            title: 'Burst Time',
            dataIndex: 'burstTime',
            key: 'burstTime',
            width: 120,
        },
        {
            title: 'Priority',
            dataIndex: 'priority',
            key: 'priority',
            width: 100,
        },
    ];

    // Calculate completion times for each process
    const completionTimes = new Map<string, number>();
    output.ganttChart.forEach(entry => {
        if (entry.processId && entry.process !== 'Idle') {
            completionTimes.set(entry.processId, entry.endTime);
        }
    });

    return (
        <Card title={`Results - ${output.algorithm.toUpperCase()}`} style={{ marginTop: 20 }}>
            <Row gutter={16} style={{ marginBottom: 30 }}>
                <Col span={6}>
                    <Statistic
                        title="Average Waiting Time"
                        value={output.avgWaitingTime.toFixed(2)}
                    />
                </Col>
                <Col span={6}>
                    <Statistic
                        title="Average Turnaround Time"
                        value={output.avgTurnaroundTime.toFixed(2)}
                    />
                </Col>
                <Col span={6}>
                    <Statistic
                        title="Context Switches"
                        value={output.contextSwitches || 0}
                    />
                </Col>
                {output.avgResponseTime !== undefined && (
                    <Col span={6}>
                        <Statistic
                            title="Average Response Time"
                            value={output.avgResponseTime.toFixed(2)}
                        />
                    </Col>
                )}
            </Row>

            <Divider>Process Information</Divider>
            <Table
                columns={processColumns}
                dataSource={processMetrics}
                pagination={false}
                size="small"
            />

            <Divider>Gantt Chart Timeline</Divider>
            <Table
                columns={ganttColumns}
                dataSource={ganttChartData}
                pagination={false}
                size="small"
            />

            <Divider>Gantt Chart Visualization</Divider>
            <div style={{ 
                overflowX: 'auto', 
                padding: '20px', 
                backgroundColor: '#f5f5f5',
                borderRadius: '4px'
            }}>
                <svg
                    width={Math.max(800, (output.ganttChart[output.ganttChart.length - 1]?.endTime || 100) * 30)}
                    height={output.processes.length * 40 + 60}
                >
                    {/* Timeline axis */}
                    <line x1="50" y1="30" x2={800} y2="30" stroke="black" strokeWidth="2" />
                    
                    {/* Time labels */}
                    {Array.from({ length: Math.ceil((output.ganttChart[output.ganttChart.length - 1]?.endTime || 100) / 10) + 1 }).map((_, i) => {
                        const time = i * 10;
                        return (
                            <g key={i}>
                                <line x1={50 + time * 30} y1="25" x2={50 + time * 30} y2="35" stroke="black" />
                                <text x={50 + time * 30} y="20" textAnchor="middle" fontSize="12">
                                    {time}
                                </text>
                            </g>
                        );
                    })}

                    {/* Gantt chart entries */}
                    {output.ganttChart.map((entry, i) => (
                        <g key={i}>
                            <rect
                                x={50 + entry.startTime * 30}
                                y={40 + i * 20}
                                width={(entry.endTime - entry.startTime) * 30}
                                height="20"
                                fill={entry.process === 'Idle' ? '#e0e0e0' : '#1890ff'}
                                stroke="black"
                                strokeWidth="1"
                            />
                            <text
                                x={50 + entry.startTime * 30 + ((entry.endTime - entry.startTime) * 30) / 2}
                                y={55 + i * 20}
                                textAnchor="middle"
                                fontSize="12"
                                fill="white"
                                fontWeight="bold"
                            >
                                {entry.process}
                            </text>
                            <text
                                x={50 + entry.startTime * 30 - 5}
                                y={55 + i * 20}
                                textAnchor="end"
                                fontSize="10"
                            >
                                {entry.startTime}
                            </text>
                        </g>
                    ))}
                </svg>
            </div>

            <Divider />
            <Card type="inner" title="Waiting Time Calculation">
                <Table
                    columns={[
                        {
                            title: 'Process',
                            dataIndex: 'id',
                            key: 'id',
                        },
                        {
                            title: 'Arrival Time',
                            dataIndex: 'arrival',
                            key: 'arrival',
                        },
                        {
                            title: 'Completion Time',
                            dataIndex: 'completion',
                            key: 'completion',
                        },
                        {
                            title: 'Turnaround Time',
                            dataIndex: 'turnaround',
                            key: 'turnaround',
                        },
                        {
                            title: 'Waiting Time',
                            dataIndex: 'waiting',
                            key: 'waiting',
                        },
                    ]}
                    dataSource={output.processes.map(p => ({
                        key: p.id,
                        id: p.id,
                        arrival: p.arrivalTime,
                        completion: completionTimes.get(p.id) || 'N/A',
                        turnaround: (completionTimes.get(p.id) ?? 0) - p.arrivalTime,
                        waiting: (completionTimes.get(p.id) ?? 0) - p.arrivalTime - p.burstTime,
                    }))}
                    pagination={false}
                    size="small"
                />
            </Card>
        </Card>
    );
}
