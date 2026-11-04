export interface Connection {
  local_ip: string | null;
  local_port: number | null;
  remote_ip: string | null;
  remote_port: number | null;
  protocol: string;
  ip_version: string;
  status: string;
  pid: number | null;
  process_name: string | null;
  timestamp: string;
}

export interface ConnectionListResponse {
  total: number;
  connections: Connection[];
  timestamp: string;
}

export interface NetworkStatistics {
  total_connections: number;
  tcp_connections: number;
  udp_connections: number;
  ipv4_connections: number;
  ipv6_connections: number;
  listening_ports: number;
  established: number;
  states: Record<string, number>;
  timestamp: string;
}

export interface NetworkInterface {
  name: string;
  addresses: InterfaceAddress[];
  is_up: boolean;
  speed: number;
  mtu: number;
}

export interface InterfaceAddress {
  family: string;
  address: string;
  netmask: string | null;
  broadcast: string | null;
}

export interface ListeningPort {
  port: number;
  protocol: string;
  ip_version: string;
  local_ip: string;
  pid: number | null;
  process_name: string | null;
}

export interface ProcessInfo {
  pid: number;
  name: string;
  status: string;
  connections_count: number;
  connections: ProcessConnection[];
}

export interface ProcessListResponse {
  total: number;
  processes: ProcessInfo[];
}

export interface ProcessConnection {
  local_ip: string | null;
  local_port: number | null;
  remote_ip: string | null;
  remote_port: number | null;
  protocol: string;
  status: string;
}

export interface ProcessDetail extends ProcessInfo {
  cpu_percent: number;
  memory_percent: number;
  memory_rss_mb: number;
  create_time: string;
  exe: string | null;
  cmdline: string | null;
}

export interface HealthResponse {
  status: string;
  app: string;
  version: string;
  uptime_seconds: number;
  monitoring_active: boolean;
}

export interface SystemInfo {
  hostname: string;
  platform: string;
  cpu_count: number;
  memory_total_gb: number;
  memory_available_gb: number;
  memory_percent: number;
  boot_time: string;
  python_version: string;
}

export interface ConnectionQueryParams {
  protocol?: string;
  status?: string;
  process_name?: string;
  limit?: number;
  offset?: number;
}

export interface ProcessQueryParams {
  search?: string;
  with_connections?: boolean;
  limit?: number;
  offset?: number;
}
