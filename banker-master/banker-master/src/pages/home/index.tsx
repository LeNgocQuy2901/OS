import { Col, Row } from "antd";
import { ButtonLink } from "../../components/ButtonLink";

export default function Home() {
  return (
    <Row gutter={24}>
      <Col span={12}>
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}>
          <ButtonLink to="/cpu_scheduling" type="primary">{"CPU Scheduling Algorithms Visualization"}</ButtonLink>
          <ButtonLink to="https://cpu-scheduling-two.vercel.app/" type="default" target="_blank">
            {"CPU scheduling (by Nguyễn Văn Nhất)"}
          </ButtonLink>
          <ButtonLink to="/banker" type="primary">{"Banker"}</ButtonLink>
          <ButtonLink to="/deadlock_detection" type="primary">{"Phát hiện Deadlock"}</ButtonLink>
          <ButtonLink to="/page_replacement" type="primary">{"Thuật toán thay thế trang"}</ButtonLink>
          <ButtonLink to="/hdd_scheduling" type="primary">{"Lập lịch đĩa HDD"}</ButtonLink>
          <ButtonLink to="/virtual_memory_mapping" type="primary">{'Giải dạng bài "Ánh xạ bộ nhớ ảo..."'}</ButtonLink>
          <ButtonLink to="/ufs" type="primary">{"Tính toán Unix File System (UFS)"}</ButtonLink>
        </div>
      </Col>
    </Row>
  );
}
