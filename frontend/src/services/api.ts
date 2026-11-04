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

export default api;
