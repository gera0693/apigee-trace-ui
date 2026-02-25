/** Estructura que devuelve analyzer.py */
export interface AnalysisResponse {
  status?: 'ok' | 'error';
  message?: string;

  request?: {
    method?: string;
    uri?: string;
    url?: string;
    status_code?: string;
    reason?: string;
    message?: string;
    headers?: Record<string, string>;
  };

  policies?: Array<{
    name?: string;
    type?: string;
    status?: string;
    execution_time_ms?: string | number;
    error_message?: string;
  }>;

  performance?: {
    slow_policies?: Array<{ name?: string; time_ms?: number }>;
  };

  issues?: Array<{
    severity?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO';
    type?: string;
    description?: string;
    code?: string;
    policy?: string;
  }>;

  causes?: string[];
  remediations?: string[];
  playbooks?: Array<{ title?: string; url?: string }>;

  
    metadata?: {
        organization?: string;
        environment?: string;
        api?: string;
        revision?: string;
        sessionId?: string;
        retrieved?: string;
        // extras:
        virtualhost?: string;
        proxyUrl?: string;
    };


  report_text?: string;
}

/** Forma que esperaba tu template original */
export interface LegacyViewModel {
  summary: {
    totalStateChanges: number;
    totalFlowInfoPoints: number;
    totalHeaders: number;
    hasStateTransitions: boolean;
  };
  metadata: {
    organization: string;
    environment: string;
    api: string;
    revision: string;
    sessionId: string;
    retrieved: string; 
    virtualhost?: string;
    proxyUrl?: string;
  };
  request: {
    uri: string;
    verb: string;
    headers: Array<{ name: string; value: string }>;
  };
  stateChanges: Array<{ timestamp: string; from: string; to: string }>;
}


export interface PcapPanelData {
  // Métricas extraídas del report_text (si están presentes)
  packets?: number | null;
  tcpStreams?: number | null;
  handshakesComplete?: number | null;
  handshakesFailed?: number | null;
  tlsConnections?: number | null;
  tlsVersions?: string[];
  cipherSuites?: string[];

  // Issues
  issuesTotal: number;
  issuesBySeverity: { severity: string; count: number }[];
  issuesByType: { type: string; count: number }[];
  topStreams: { stream: string; count: number }[];

  // TLS alertas (tomadas de issues TLS_FATAL_ALERT con timestamp cuando exista)
  tlsFatalAlerts: { timestamp?: string; description: string }[];

  // Filtros sugeridos (extraídos del bloque de report_text)
  filters: { title: string; filter: string }[];

  // Crudo por si se quiere mostrar o depurar
  raw: string | null;
}
