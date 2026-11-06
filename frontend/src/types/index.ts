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

export interface LiveConnectionEvent {
  id: string;
  event_type: 'CONNECTED' | 'DISCONNECTED';
  protocol: string;
  local_address: string;
  remote_address: string | null;
  process_name: string;
  pid: number | null;
  status: string;
  timestamp: string;
}

export interface WebSocketSnapshotMessage {
  type: 'snapshot';
  timestamp: string;
  data: {
    statistics: NetworkStatistics;
    connections: Connection[];
    total_connections: number;
    recent_events: LiveConnectionEvent[];
  };
}

export interface WebSocketUpdateMessage {
  type: 'update';
  timestamp: string;
  data: {
    statistics: NetworkStatistics;
    delta: {
      new_count: number;
      closed_count: number;
      new: Connection[];
      closed: Connection[];
    };
    recent_events: LiveConnectionEvent[];
    connections_sample: Connection[];
  };
}

export interface WebSocketPongMessage {
  type: 'pong';
  client_time?: string;
  server_time: string;
}

export type WebSocketMessage =
  | WebSocketSnapshotMessage
  | WebSocketUpdateMessage
  | WebSocketPongMessage;

export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

// Phase 3 Threat Detection Types
export type SeverityLevel = 'low' | 'medium' | 'high';

export interface SecurityEvent {
  id: string;
  timestamp: string;
  rule_id: string;
  rule_name: string;
  detection_type: string;
  severity: SeverityLevel;
  confidence: number;
  title: string;
  description: string;
  source_ip: string | null;
  source_port: number | null;
  dest_ip: string | null;
  dest_port: number | null;
  protocol: string | null;
  process_name: string | null;
  pid: number | null;
  evidence: Record<string, any>;
  recommendations: string[];
}

export interface SecurityEventListResponse {
  total: number;
  items: SecurityEvent[];
  high_count: number;
  medium_count: number;
  low_count: number;
  limit: number;
  offset: number;
}

export interface DetectionRule {
  id: string;
  name: string;
  description: string;
  category: string;
  severity: SeverityLevel;
  enabled: boolean;
  config: Record<string, any>;
}

export interface SecuritySummary {
  total_events: number;
  high_severity_count: number;
  medium_severity_count: number;
  low_severity_count: number;
  active_rules_count: number;
  total_rules_count: number;
  last_scan_time: string | null;
  threat_level: 'LOW' | 'ELEVATED' | 'HIGH' | 'CRITICAL';
  top_flagged_processes: Array<{ process_name: string; count: number }>;
  top_flagged_ports: Array<{ port: number; count: number }>;
}

export interface ManualScanResult {
  scanned_connections_count: number;
  new_threats_detected: number;
  total_active_threats: number;
  events: SecurityEvent[];
  scan_duration_ms: number;
  timestamp: string;
}

export interface SecurityQueryParams {
  severity?: string;
  rule_id?: string;
  process_name?: string;
  limit?: number;
  offset?: number;
}

// Phase 4 Final Grand Release Types
export type AlertStatus = 'new' | 'acknowledged' | 'resolved';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface AlertNote {
  id: string;
  author: string;
  timestamp: string;
  content: string;
}

export interface Alert {
  id: string;
  event_id: string | null;
  title: string;
  description: string;
  severity: AlertSeverity;
  status: AlertStatus;
  assigned_to: string;
  source_ip: string | null;
  source_port: number | null;
  dest_ip: string | null;
  dest_port: number | null;
  process_name: string | null;
  pid: number | null;
  created_at: string;
  updated_at: string;
  notes: AlertNote[];
  recommendations: string[];
}

export interface AlertListResponse {
  total: number;
  items: Alert[];
  new_count: number;
  acknowledged_count: number;
  resolved_count: number;
  critical_count: number;
  high_count: number;
  limit: number;
  offset: number;
}

export interface AlertSummary {
  total_alerts: number;
  new_alerts: number;
  acknowledged_alerts: number;
  resolved_alerts: number;
  critical_alerts: number;
  high_alerts: number;
  medium_alerts: number;
  low_alerts: number;
  mean_time_to_acknowledge: string;
  mean_time_to_resolve: string;
}

export type IPType = 'loopback' | 'private' | 'public' | 'multicast';
export type ReputationStatus = 'clean' | 'suspicious' | 'malicious' | 'unknown';

export interface IPIntelligence {
  ip: string;
  ip_type: IPType;
  is_private: boolean;
  country_code: string | null;
  country_name: string | null;
  city: string | null;
  asn: string | null;
  organization: string | null;
  threat_score: number;
  reputation: ReputationStatus;
  flags: string[];
  last_analyzed: string;
}

export interface MitreTactic {
  id: string;
  name: string;
  tactic: string;
}

export interface AIThreatAnalysis {
  analysis_id: string;
  incident_summary: string;
  mitre_techniques: MitreTactic[];
  severity_assessment: string;
  root_cause_analysis: string;
  potential_impact: string;
  threat_actor_attribution: string;
  containment_checklist: string[];
  suggested_commands: string[];
  generated_at: string;
}

export interface AIChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

export interface AIChatResponse {
  reply: string;
  suggested_followups: string[];
  timestamp: string;
}

export interface ComplianceScore {
  framework: string;
  score: number;
  status: string;
  details: string;
}

export interface ExecutiveReport {
  report_id: string;
  generated_at: string;
  hostname: string;
  overall_posture_score: number;
  risk_tier: string;
  total_sockets_audited: number;
  threats_detected_count: number;
  open_alerts_count: number;
  resolved_incidents_count: number;
  compliance_evaluations: ComplianceScore[];
  top_flagged_processes: Array<{ process_name: string; count: number }>;
  top_targeted_ports: Array<{ port: number; count: number }>;
  executive_summary: string;
  strategic_recommendations: string[];
}



