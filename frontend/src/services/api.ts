import axios, { AxiosError } from 'axios';
import {
  ConnectionListResponse,
  ConnectionQueryParams,
  HealthResponse,
  ListeningPort,
  NetworkInterface,
  NetworkStatistics,
  ProcessDetail,
  ProcessListResponse,
  ProcessQueryParams,
  SystemInfo,
  SecurityEvent,
  SecurityEventListResponse,
  DetectionRule,
  SecuritySummary,
  ManualScanResult,
  SecurityQueryParams,
  Alert,
  AlertListResponse,
  AlertSummary,
  IPIntelligence,
  AIThreatAnalysis,
  AIChatResponse,
  AIChatMessage,
  ExecutiveReport,
} from '../types';

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for structured error logging
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      console.error(
        `[CyberWatch API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url} failed with status ${error.response.status}:`,
        error.response.data
      );
    } else if (error.request) {
      console.error(
        `[CyberWatch Network Error] No response received from backend:`,
        error.message
      );
    } else {
      console.error(`[CyberWatch Request Error]`, error.message);
    }
    return Promise.reject(error);
  }
);

/**
 * Fetch health status of the CyberWatch service.
 */
export const getHealth = async (): Promise<HealthResponse> => {
  const response = await api.get<HealthResponse>('/health');
  return response.data;
};

/**
 * Fetch system information (host, platform, CPU, memory).
 */
export const getSystemInfo = async (): Promise<SystemInfo> => {
  const response = await api.get<SystemInfo>('/system');
  return response.data;
};

/**
 * Fetch active network connections with optional filters.
 */
export const getConnections = async (
  params?: ConnectionQueryParams
): Promise<ConnectionListResponse> => {
  const response = await api.get<ConnectionListResponse>('/network/connections', {
    params,
  });
  return response.data;
};

/**
 * Fetch aggregated network statistics.
 */
export const getNetworkStats = async (): Promise<NetworkStatistics> => {
  const response = await api.get<NetworkStatistics>('/network/stats');
  return response.data;
};

/**
 * Fetch list of network interfaces.
 */
export const getInterfaces = async (): Promise<NetworkInterface[]> => {
  const response = await api.get<NetworkInterface[]>('/network/interfaces');
  return response.data;
};

/**
 * Fetch listening network ports.
 */
export const getListeningPorts = async (): Promise<ListeningPort[]> => {
  const response = await api.get<ListeningPort[]>('/network/listening');
  return response.data;
};

/**
 * Fetch list of monitored processes.
 */
export const getProcesses = async (
  params?: ProcessQueryParams
): Promise<ProcessListResponse> => {
  const response = await api.get<ProcessListResponse>('/processes', {
    params,
  });
  return response.data;
};

/**
 * Fetch detailed metrics and connection info for a specific process.
 */
export const getProcessDetail = async (pid: number): Promise<ProcessDetail> => {
  const response = await api.get<ProcessDetail>(`/processes/${pid}`);
  return response.data;
};

// ==========================================
// Phase 3 Threat Detection Engine Endpoints
// ==========================================

/**
 * Fetch detected security events with optional filters.
 */
export const getSecurityEvents = async (
  params?: SecurityQueryParams
): Promise<SecurityEventListResponse> => {
  const response = await api.get<SecurityEventListResponse>('/security/events', {
    params,
  });
  return response.data;
};

/**
 * Fetch a single security event by its ID.
 */
export const getSecurityEventById = async (id: string): Promise<SecurityEvent> => {
  const response = await api.get<SecurityEvent>(`/security/events/${id}`);
  return response.data;
};

/**
 * Fetch high-level security summary posture and metrics.
 */
export const getSecuritySummary = async (): Promise<SecuritySummary> => {
  const response = await api.get<SecuritySummary>('/security/summary');
  return response.data;
};

/**
 * Fetch all registered threat detection rules.
 */
export const getDetectionRules = async (): Promise<DetectionRule[]> => {
  const response = await api.get<DetectionRule[]>('/security/rules');
  return response.data;
};

/**
 * Enable or disable a specific detection rule.
 */
export const toggleDetectionRule = async (
  ruleId: string,
  enabled: boolean
): Promise<DetectionRule> => {
  const response = await api.patch<DetectionRule>(`/security/rules/${ruleId}`, {
    enabled,
  });
  return response.data;
};

/**
 * Trigger an immediate threat detection scan against active sockets.
 */
export const triggerSecurityScan = async (): Promise<ManualScanResult> => {
  const response = await api.post<ManualScanResult>('/security/scan');
  return response.data;
};

/**
 * Clear the current security event buffer.
 */
export const clearSecurityEvents = async (): Promise<{ message: string; cleared_count: number }> => {
  const response = await api.delete<{ message: string; cleared_count: number }>('/security/events');
  return response.data;
};

// ==========================================
// Phase 4 Alerts & Incident Management
// ==========================================

export const getAlerts = async (params?: {
  status?: string;
  severity?: string;
  limit?: number;
  offset?: number;
}): Promise<AlertListResponse> => {
  const response = await api.get<AlertListResponse>('/alerts', { params });
  return response.data;
};

export const getAlertById = async (alertId: string): Promise<Alert> => {
  const response = await api.get<Alert>(`/alerts/${alertId}`);
  return response.data;
};

export const getAlertsSummary = async (): Promise<AlertSummary> => {
  const response = await api.get<AlertSummary>('/alerts/summary');
  return response.data;
};

export const createAlert = async (payload: {
  title: string;
  description: string;
  severity?: string;
  source_ip?: string;
  dest_ip?: string;
  dest_port?: number;
  process_name?: string;
  pid?: number;
}): Promise<Alert> => {
  const response = await api.post<Alert>('/alerts', payload);
  return response.data;
};

export const updateAlert = async (
  alertId: string,
  payload: {
    status?: string;
    assigned_to?: string;
    note?: string;
  }
): Promise<Alert> => {
  const response = await api.patch<Alert>(`/alerts/${alertId}`, payload);
  return response.data;
};

// ==========================================
// Phase 4 IP Intelligence & Geolocation
// ==========================================

export const getIPIntelligence = async (ip: string): Promise<IPIntelligence> => {
  const response = await api.get<IPIntelligence>(`/intelligence/ip/${encodeURIComponent(ip)}`);
  return response.data;
};

export const batchIPIntelligence = async (
  ips: string[]
): Promise<{ results: Record<string, IPIntelligence>; total_processed: number }> => {
  const response = await api.post<{ results: Record<string, IPIntelligence>; total_processed: number }>(
    '/intelligence/ip/batch',
    { ips }
  );
  return response.data;
};

// ==========================================
// Phase 4 AI Security Analyst
// ==========================================

export const analyzeThreatWithAI = async (payload: {
  event_id?: string;
  title: string;
  description: string;
  source_ip?: string;
  dest_ip?: string;
  dest_port?: number;
  process_name?: string;
  pid?: number;
  evidence?: Record<string, any>;
  api_key?: string;
  model?: string;
}): Promise<AIThreatAnalysis> => {
  const response = await api.post<AIThreatAnalysis>('/ai/analyze', {
    ...payload,
    model: payload.model || localStorage.getItem('cyberwatch_gemini_model') || 'gemini-1.5-flash',
  });
  return response.data;
};

export const chatWithAIAnalyst = async (
  message: string,
  history: AIChatMessage[] = [],
  apiKey?: string,
  model?: string
): Promise<AIChatResponse> => {
  const response = await api.post<AIChatResponse>('/ai/chat', {
    message,
    history,
    api_key: apiKey || localStorage.getItem('cyberwatch_gemini_key') || undefined,
    model: model || localStorage.getItem('cyberwatch_gemini_model') || 'gemini-1.5-flash',
  });
  return response.data;
};

export const getAIQuickPrompts = async (): Promise<Array<{ id: string; title: string; prompt: string }>> => {
  const response = await api.get<Array<{ id: string; title: string; prompt: string }>>('/ai/quick-prompts');
  return response.data;
};

// ==========================================
// Phase 4 Executive Security Reports
// ==========================================

export const getExecutiveReport = async (): Promise<ExecutiveReport> => {
  const response = await api.get<ExecutiveReport>('/reports/executive');
  return response.data;
};

export const getReportCsvDownloadUrl = (): string => '/api/v1/reports/export/csv';

export default api;
