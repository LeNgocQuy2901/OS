import React, { useState, useRef } from 'react';
import { Button, Input, Table, Card, Row, Col, message, Spin, Space, Select } from 'antd';
import type { TableColumnsType } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import {
  detectDeadlock,
  getProcessDetails,
  validateInput,
  type DeadlockInput,
  type DeadlockResult,
} from '../../utils/deadlockDetection';

interface MatrixData {
  available: number[];
  allocation: number[][];
  request: number[][];
}

interface ProcessInfo {
  key: string;
  process: string;
  allocation: string;
  request: string;
  status: string;
}

export default function DeadlockDetection() {
  const [nProcesses, setNProcesses] = useState<number>(0);
  const [nResources, setNResources] = useState<number>(0);
  const [data, setData] = useState<MatrixData | null>(null);
  const [result, setResult] = useState<DeadlockResult | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        setLoading(true);
        const content = e.target?.result as string;
        const lines = content
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line.length > 0);

        // Parse first line: n_processes n_resources
        const [np, nr] = lines[0].split(/\s+/).map(Number);
        setNProcesses(np);
        setNResources(nr);

        // Parse available resources
        const available = lines[1].split(/\s+/).map(Number);

        // Parse allocation matrix
        const allocation: number[][] = [];
        for (let i = 0; i < np; i++) {
          allocation.push(lines[2 + i].split(/\s+/).map(Number));
        }

        // Parse request matrix
        const request: number[][] = [];
        for (let i = 0; i < np; i++) {
          request.push(lines[2 + np + i].split(/\s+/).map(Number));
        }

        setData({ available, allocation, request });
        message.success('Tải file thành công!');
      } catch (error) {
        message.error('Lỗi khi phân tích file!');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const handleDetectDeadlock = () => {
    if (!data || nProcesses === 0 || nResources === 0) {
      message.error('Vui lòng tải file dữ liệu trước!');
      return;
    }

    setLoading(true);
    try {
      const input: DeadlockInput = {
        nProcesses,
        nResources,
        available: data.available,
        allocation: data.allocation,
        request: data.request,
        resourceNames: Array.from({ length: nResources }, (_, i) => String.fromCharCode(65 + i)),
      };

      const validationResult = validateInput(input);
      if (!validationResult.valid) {
        message.error(validationResult.error || 'Dữ liệu không hợp lệ');
        return;
      }

      const result = detectDeadlock(input);
      setResult(result);
    } catch (error) {
      message.error('Lỗi khi phát hiện deadlock!');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getMatrixColumns = (): TableColumnsType<ProcessInfo> => [
    {
      title: 'Process',
      dataIndex: 'process',
      width: 80,
      align: 'center' as const,
    },
    {
      title: 'Allocation',
      dataIndex: 'allocation',
      align: 'center' as const,
    },
    {
      title: 'Request',
      dataIndex: 'request',
      align: 'center' as const,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      align: 'center' as const,
      render: (text: string) => {
        const color = text.includes('Có thể') ? 'green' : text.includes('Chờ') ? 'orange' : 'red';
        return <span style={{ color, fontWeight: 'bold' }}>{text}</span>;
      },
    },
  ];

  const getMatrixData = (): ProcessInfo[] => {
    if (!data) return [];

    return Array.from({ length: nProcesses }, (_, i) => ({
      key: `p${i}`,
      process: `P${i}`,
      allocation: `[${data.allocation[i].join(', ')}]`,
      request: `[${data.request[i].join(', ')}]`,
      status: data.request[i].some((req, j) => req > data.available[j]) ? 'Phải chờ' : 'Có thể tiếp tục',
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'IMPOSSIBLE':
        return '#52c41a';
      case 'POSSIBLE':
        return '#faad14';
      case 'CERTAIN':
        return '#f5222d';
      default:
        return '#1890ff';
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <h1>Phát hiện Deadlock</h1>

      <Card style={{ marginBottom: '24px' }}>
        <Space>
          <Button
            type="primary"
            icon={<UploadOutlined />}
            onClick={() => fileInputRef.current?.click()}
          >
            Tải file
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <Button type="default" onClick={handleDetectDeadlock} loading={loading}>
            Phát hiện Deadlock
          </Button>
        </Space>

        {nProcesses > 0 && nResources > 0 && (
          <div style={{ marginTop: '16px', color: '#666' }}>
            <p>
              <strong>Số tiến trình:</strong> {nProcesses}
            </p>
            <p>
              <strong>Số tài nguyên:</strong> {nResources}
            </p>
            {data && (
              <p>
                <strong>Tài nguyên khả dụng:</strong> [{data.available.join(', ')}]
              </p>
            )}
          </div>
        )}
      </Card>

      <Spin spinning={loading}>
        {data && (
          <Card style={{ marginBottom: '24px' }} title="Ma trận hệ thống">
            <Table
              columns={getMatrixColumns()}
              dataSource={getMatrixData()}
              pagination={false}
              size="small"
            />
            <p style={{ marginTop: '16px', color: '#666' }}>
              <strong>Tài nguyên khả dụng:</strong> [{data.available.join(', ')}]
            </p>
          </Card>
        )}

        {result && (
          <Card
            title="Kết quả phát hiện Deadlock"
            style={{
              borderColor: getStatusColor(result.status),
              borderWidth: '2px',
            }}
          >
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <div
                  style={{
                    padding: '16px',
                    backgroundColor: getStatusColor(result.status) + '20',
                    borderRadius: '4px',
                    borderLeft: `4px solid ${getStatusColor(result.status)}`,
                  }}
                >
                  <p
                    style={{
                      color: getStatusColor(result.status),
                      fontSize: '18px',
                      fontWeight: 'bold',
                      margin: 0,
                    }}
                  >
                    {result.details}
                  </p>
                </div>
              </Col>

              {result.executionSequence.length > 0 && (
                <Col span={24}>
                  <h3>Chuỗi thực thi an toàn:</h3>
                  <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#1890ff' }}>
                    {result.executionSequence.map((p) => `P${p}`).join(' → ')}
                  </p>
                </Col>
              )}

              {result.deadlockedProcesses.length > 0 && (
                <Col span={24}>
                  <h3>Tiến trình bị bế tắc:</h3>
                  <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#f5222d' }}>
                    {result.deadlockedProcesses.map((p) => `P${p}`).join(', ')}
                  </p>
                </Col>
              )}

              {data && (
                <Col span={24}>
                  <h3>Chi tiết tiến trình:</h3>
                  <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                    {Array.from({ length: nProcesses }, (_, i) => (
                      <div key={i} style={{ marginBottom: '8px' }}>
                        {getProcessDetails(
                          i,
                          data.allocation[i],
                          data.request[i],
                          data.available,
                          Array.from({ length: nResources }, (_, j) => String.fromCharCode(65 + j))
                        )}
                      </div>
                    ))}
                  </div>
                </Col>
              )}
            </Row>
          </Card>
        )}
      </Spin>

      <Card style={{ marginTop: '24px' }} title="Hướng dẫn sử dụng">
        <ol>
          <li>
            <strong>Tải file:</strong> Click nút "Tải file" và chọn file .txt có định dạng:
            <pre style={{ backgroundColor: '#f5f5f5', padding: '8px', marginTop: '8px' }}>
{`Số_tiến_trình Số_tài_nguyên
Available_1 Available_2 ...
Allocation_P0_R1 Allocation_P0_R2 ...
Allocation_P1_R1 Allocation_P1_R2 ...
...
Request_P0_R1 Request_P0_R2 ...
Request_P1_R1 Request_P1_R2 ...
...`}
            </pre>
          </li>
          <li>
            <strong>Phát hiện Deadlock:</strong> Click nút "Phát hiện Deadlock" để phân tích
          </li>
          <li>
            <strong>Hiểu kết quả:</strong>
            <ul>
              <li>⭕ <strong>KHÔNG THỂ:</strong> Không có tiến trình nào phải chờ</li>
              <li>🟡 <strong>CÓ THỂ:</strong> Có tiến trình chờ nhưng có lối thoát</li>
              <li>🔴 <strong>CHẮC CHẮN:</strong> Deadlock sẽ xảy ra chắc chắn</li>
            </ul>
          </li>
        </ol>
      </Card>
    </div>
  );
}
