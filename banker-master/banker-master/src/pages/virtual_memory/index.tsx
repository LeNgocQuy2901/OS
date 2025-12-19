import { Button, Form, InputNumber, Upload, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { ButtonLink } from "../../components/ButtonLink";
import { MemorySizeInput } from "../../components/MemorySizeInput";
import { useSavedState } from "../../hooks/useSavedState";
import { deserializeMemorySize, MemorySize, serializeMemorySize, validateSavedMemorySize } from "../../utils/memorySize";
import Decimal from "decimal.js";
import { vmemMappingSolver, VmemMappingSolverOutput } from "../../utils/algorithms/virtual_memory/vmemMappingSolver";
import { useState } from "react";
import { VirtualMemorySolversOutputSection } from "../../components/VirtualMemorySolversOutputSection";
import { parseVirtualMemoryFile } from "../../utils/fileParser";

export default function VirtualMemorySolvers() {
    const [virtualMemorySize, setVirtualMemorySize] = useSavedState<MemorySize>(
        {
            amount: new Decimal(1),
            unit: "GB",
        },
        "VMEM_virtualMemorySize",
        validateSavedMemorySize,
        serializeMemorySize,
        deserializeMemorySize,
    );

    const [frameSize, setFrameSize] = useSavedState<MemorySize>(
        {
            amount: new Decimal(4),
            unit: "KB",
        },
        "VMEM_frameSize",
        validateSavedMemorySize,
        serializeMemorySize,
        deserializeMemorySize,
    );

    const [numPhysicalMemoryFrames, setNumPhysicalMemoryFrames] = useSavedState<number>(
        256,
        "VMEM_numPhysicalMemoryFrames",
        value => typeof value === "number" && value > 0,
    );

    const [output, setOutput] = useState<VmemMappingSolverOutput | null>(null);

    const handleFileUpload = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const parsed = parseVirtualMemoryFile(content);
                
                // Set memory size (in bytes)
                const vmemBytes = parsed.memorySize;
                let vmemUnit: "B" | "KB" | "MB" | "GB" | "TB" = "B";
                let vmemAmount = new Decimal(vmemBytes);
                
                if (vmemBytes % (1024 ** 3) === 0) {
                    vmemUnit = "GB";
                    vmemAmount = new Decimal(vmemBytes / (1024 ** 3));
                } else if (vmemBytes % (1024 ** 2) === 0) {
                    vmemUnit = "MB";
                    vmemAmount = new Decimal(vmemBytes / (1024 ** 2));
                } else if (vmemBytes % 1024 === 0) {
                    vmemUnit = "KB";
                    vmemAmount = new Decimal(vmemBytes / 1024);
                }
                
                setVirtualMemorySize({ amount: vmemAmount, unit: vmemUnit });
                
                // Set page size
                const pageBytes = parsed.pageSize;
                let pageUnit: "B" | "KB" | "MB" | "GB" | "TB" = "B";
                let pageAmount = new Decimal(pageBytes);
                
                if (pageBytes % (1024 ** 3) === 0) {
                    pageUnit = "GB";
                    pageAmount = new Decimal(pageBytes / (1024 ** 3));
                } else if (pageBytes % (1024 ** 2) === 0) {
                    pageUnit = "MB";
                    pageAmount = new Decimal(pageBytes / (1024 ** 2));
                } else if (pageBytes % 1024 === 0) {
                    pageUnit = "KB";
                    pageAmount = new Decimal(pageBytes / 1024);
                }
                
                setFrameSize({ amount: pageAmount, unit: pageUnit });
                
                // Set processes if provided
                if (parsed.processes.length > 0) {
                    setNumPhysicalMemoryFrames(parsed.processes[0]);
                }
                
                message.success('Tải file thành công!');
            } catch (err) {
                message.error('Lỗi khi parse file: ' + (err instanceof Error ? err.message : 'Unknown error'));
            }
        };
        reader.readAsText(file);
        return false;
    };

    const calculate = () => {
        const output = vmemMappingSolver({
            frameSize,
            numPhysicalMemoryFrames,
            virtualMemorySize,
        });
        setOutput(output);
    };

    return (
        <div style={{ width: "100%", height: "100%", display: "flex", justifyContent: "center", flexDirection: "column", alignItems: "center" }}>
            <ButtonLink to="/">Back</ButtonLink>
            <Form layout="vertical" style={{ display: "flex", flexDirection: "column", alignItems: "stretch", justifyContent: "stretch" }}>
                <MemorySizeInput
                    label="Ánh xạ bộ nhớ ảo"
                    memorySize={virtualMemorySize}
                    setMemorySize={setVirtualMemorySize}
                />

                <Form.Item label="lên bộ nhớ vật lý có số frame là:">
                    <InputNumber
                        value={numPhysicalMemoryFrames}
                        onChange={value => setNumPhysicalMemoryFrames(value ?? 0)}
                    />
                </Form.Item>

                <MemorySizeInput
                    label="mỗi frame có kích thước:"
                    memorySize={frameSize}
                    setMemorySize={setFrameSize}
                />

                <div>
                    Kích thước mỗi đơn vị bộ nhớ là 1 byte.
                </div>

                <Form.Item style={{ marginTop: 10 }}>
                    <Upload
                        beforeUpload={handleFileUpload}
                        maxCount={1}
                        accept=".txt"
                    >
                        <Button icon={<UploadOutlined />}>Upload Virtual Memory Configuration File</Button>
                    </Upload>
                </Form.Item>
            </Form>
            <Button type="primary" onClick={calculate}>Calculate</Button>

            <VirtualMemorySolversOutputSection output={output} />
        </div>
    );
}
