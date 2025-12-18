/**
 * Deadlock Detection Algorithm Utility
 * Implements the deadlock detection using resource allocation graphs
 */

export interface DeadlockResult {
  status: 'IMPOSSIBLE' | 'POSSIBLE' | 'CERTAIN';
  executionSequence: number[];
  deadlockedProcesses: number[];
  details: string;
}

export interface DeadlockInput {
  nProcesses: number;
  nResources: number;
  available: number[];
  allocation: number[][];
  request: number[][];
  resourceNames?: string[];
}

/**
 * Detect deadlock using banker's algorithm approach
 */
export function detectDeadlock(input: DeadlockInput): DeadlockResult {
  const { nProcesses, nResources, available, allocation, request, resourceNames = [] } = input;

  // Initialize resource names if not provided
  const resNames = resourceNames.length > 0 
    ? resourceNames 
    : Array.from({ length: nResources }, (_, i) => String.fromCharCode(65 + i));

  const work = available.slice();
  const finish = Array(nProcesses).fill(false);
  const executionSequence: number[] = [];

  // Keep trying to find unfinished processes that can complete
  let change = true;
  while (change) {
    change = false;
    for (let i = 0; i < nProcesses; i++) {
      if (!finish[i]) {
        // Check if request can be satisfied with available resources
        let canFinish = true;
        for (let j = 0; j < nResources; j++) {
          if (request[i][j] > work[j]) {
            canFinish = false;
            break;
          }
        }

        if (canFinish) {
          // Process can finish, update work and mark as finished
          for (let j = 0; j < nResources; j++) {
            work[j] += allocation[i][j];
          }
          finish[i] = true;
          executionSequence.push(i);
          change = true;
        }
      }
    }
  }

  // Check for deadlock
  const deadlockedProcesses: number[] = [];
  for (let i = 0; i < nProcesses; i++) {
    if (!finish[i]) {
      deadlockedProcesses.push(i);
    }
  }

  // Check if any process has to wait
  let hasWaitingProcess = false;
  for (let i = 0; i < nProcesses; i++) {
    for (let j = 0; j < nResources; j++) {
      if (request[i][j] > available[j]) {
        hasWaitingProcess = true;
        break;
      }
    }
    if (hasWaitingProcess) break;
  }

  // Determine status
  let status: 'IMPOSSIBLE' | 'POSSIBLE' | 'CERTAIN';
  let details: string;

  if (finish.every(f => f) && !hasWaitingProcess) {
    // No one has to wait - IMPOSSIBLE to have deadlock
    status = 'IMPOSSIBLE';
    const sequence = executionSequence.map(i => `P${i}`).join(' → ');
    details = `⭕ KHÔNG THỂ - Không có tiến trình nào phải chờ\n\nChuỗi thực thi: ${sequence}`;
  } else if (finish.every(f => f) && hasWaitingProcess) {
    // Some processes have to wait but eventually all can finish - POSSIBLE deadlock
    status = 'POSSIBLE';
    const sequence = executionSequence.map(i => `P${i}`).join(' → ');
    details = `🟡 CÓ THỂ - Có chờ nhưng có lối thoát\n\nChuỗi thực thi an toàn: ${sequence}`;
  } else {
    // Deadlock - CERTAIN
    status = 'CERTAIN';
    const deadlockedStr = deadlockedProcesses.map(i => `P${i}`).join(', ');
    details = `🔴 CHẮC CHẮN - Bế tắc không thể thoát\n\nTiến trình bị bế tắc: ${deadlockedStr}`;
  }

  return {
    status,
    executionSequence,
    deadlockedProcesses,
    details,
  };
}

/**
 * Get detailed process information
 */
export function getProcessDetails(
  processId: number,
  allocation: number[],
  request: number[],
  available: number[],
  resourceNames: string[]
): string {
  let details = `Process P${processId}:\n`;
  details += `Allocation: [${allocation.join(', ')}]\n`;
  details += `Request: [${request.join(', ')}]\n`;

  // Check which resources are needed
  const needsWait = request.some((req, i) => req > available[i]);
  if (needsWait) {
    details += `Status: Phải chờ\n`;
    const waitingFor: string[] = [];
    for (let i = 0; i < request.length; i++) {
      if (request[i] > available[i]) {
        waitingFor.push(`${resourceNames[i]} (yêu cầu ${request[i]}, có ${available[i]})`);
      }
    }
    details += `Phải chờ: ${waitingFor.join(', ')}\n`;
  } else {
    details += `Status: Có thể tiếp tục\n`;
  }

  return details;
}

/**
 * Validate input data
 */
export function validateInput(input: DeadlockInput): { valid: boolean; error?: string } {
  const { nProcesses, nResources, available, allocation, request } = input;

  if (nProcesses <= 0) {
    return { valid: false, error: 'Số tiến trình phải > 0' };
  }

  if (nResources <= 0) {
    return { valid: false, error: 'Số tài nguyên phải > 0' };
  }

  if (!Array.isArray(available) || available.length !== nResources) {
    return { valid: false, error: 'Mảng available không hợp lệ' };
  }

  if (!Array.isArray(allocation) || allocation.length !== nProcesses) {
    return { valid: false, error: 'Ma trận allocation không hợp lệ' };
  }

  if (!Array.isArray(request) || request.length !== nProcesses) {
    return { valid: false, error: 'Ma trận request không hợp lệ' };
  }

  // Validate each row
  for (let i = 0; i < nProcesses; i++) {
    if (allocation[i].length !== nResources || request[i].length !== nResources) {
      return { valid: false, error: `Hàng P${i} không có đủ cột` };
    }
  }

  return { valid: true };
}
