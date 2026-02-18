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