import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AnalysisResponse, LegacyViewModel, PcapPanelData } from '../../models/apigee-trace';
import { Component, ElementRef, signal, ViewChild } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { TraceService } from '../../services/trace';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-trace-analyzer',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatCardModule,
    MatButtonModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatTooltipModule,  
    MatExpansionModule
  ],
  templateUrl: './trace-analyzer.html',
  styleUrls: ['./trace-analyzer.scss']
})
export class TraceAnalyzerComponent {
  loading = signal(false);
  errorMsg = signal<string | null>(null);

  // Resultado mapeado a la forma “legacy” (la que usaba tu template)
  result = signal<LegacyViewModel | null>(null);
  // (Opcional) Reporte crudo de analyzer.py para debug
  rawReport = signal<string | null>(null);
  fileName = signal<string | null>(null);
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  // Estados de expansión (por defecto true)
  metaOpen   = signal(true);
  reqOpen    = signal(true);
  hdrsOpen   = signal(true);
  statesOpen = signal(true);
  rawOpen    = signal(false); // raw report puede empezar cerrado

  isPcap = signal(false);
  
  pcapOpen = signal(true);
  pcapPanel = signal<PcapPanelData | null>(null);
  tlsOpen = signal(true);


  expandAll() {
    this.metaOpen.set(true);
    this.reqOpen.set(true);
    this.hdrsOpen.set(true);
    this.statesOpen.set(true);
    this.rawOpen.set(true);
    this.pcapOpen.set(true);
    this.tlsOpen.set(true);
  }

  collapseAll() {
    this.metaOpen.set(false);
    this.reqOpen.set(false);
    this.hdrsOpen.set(false);
    this.statesOpen.set(false);
    this.rawOpen.set(false);
    this.pcapOpen.set(false);
    this.tlsOpen.set(false);
  }

  displayedHeaderColumns = ['name', 'value'];
  displayedStateColumns = ['timestamp', 'from', 'to'];

  constructor(private svc: TraceService) {}

  onFileSelected(evt: Event) {
    const input = evt.target as HTMLInputElement;
    if (!input.files || !input.files.length) return;

    const file = input.files[0];
    const isPcapFile = file.name.toLowerCase().endsWith('.pcap');
    this.isPcap.set(isPcapFile);

    this.fileName.set(file.name);
    this.loading.set(true);
    this.errorMsg.set(null);
    this.result.set(null);
    this.rawReport.set(null);
    this.pcapPanel.set(null);

    this.svc.analyze(file).subscribe({
      next: (data) => {
        if (data.status === 'error') {
          this.errorMsg.set(data.message || 'No se pudo analizar el archivo.');
          return;
        }

        const legacy = this.mapToLegacyShape(data);
        this.result.set(legacy);
        this.rawReport.set(data.report_text || null);

        if (isPcapFile) {
          this.pcapPanel.set(this.mapToPcapPanel(data));
          this.collapseAll();
          
          this.pcapOpen.set(true);
          this.rawOpen.set(true);

        } else {
          this.expandAll();
        }
      },
      error: (err) => {
        this.errorMsg.set(err?.message || 'Error inesperado');
      },
      complete: () => this.loading.set(false)
    });
  }
  
  clearFile() {
    this.fileName.set(null);
    this.isPcap.set(false);

    if (this.fileInputRef?.nativeElement) {
      this.fileInputRef.nativeElement.value = '';
    }

    this.result.set(null);
    this.rawReport.set(null);
    this.pcapPanel.set(null);
    this.errorMsg.set(null);

    this.expandAll(); // restaurar comportamiento normal
  }

  /** Mapea el JSON de analyzer.py a la forma que usaba tu plantilla Angular Material */
  private mapToLegacyShape(apiData: AnalysisResponse): LegacyViewModel {
    const req = apiData.request || {};
    const headersObj = req.headers || {};
    const headers = Object.keys(headersObj).map((k) => ({ name: k, value: String(headersObj[k]) }));

    const m = apiData.metadata || {};
    // Si luego extendemos analyzer.py para incluir state changes/metadata,
    // solo actualizamos aquí la asignación real.
    const legacy: LegacyViewModel = {
      summary: {
        totalStateChanges: 0,
        totalFlowInfoPoints: 0,
        totalHeaders: headers.length,
        hasStateTransitions: false
      },
      
      metadata: {
        organization: m.organization ?? '-',
        environment:  m.environment ?? '-',
        api:          m.api ?? '-',
        revision:     m.revision ?? '-',
        sessionId:    m.sessionId ?? '-',
        retrieved:    m.retrieved ?? '-',
        // NUEVO:
        virtualhost:  m.virtualhost ?? '-',
        proxyUrl:     m.proxyUrl ?? '-',
      },
      request: {
        uri: req.uri || 'Unknown',
        verb: req.method || 'Unknown',
        headers
      },
      stateChanges: [],   
      tls: apiData.tls || {
        inbound: { virtualhost: null, sslEnabled: null },
        outbound: { handshakeStatus: null, handshakeTimeMs: null, tlsEnabled: null },
        clientCert: { hasRawCert: false },
        serviceConfig: {}
      }
    };

    return legacy;
  }

  
downloadClientPem() {
  const pem = this.result()?.tls?.clientCert?.pem;
  if (!pem) return;
  const blob = new Blob([pem], { type: 'application/x-pem-file' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'client-certificate.pem';
  a.click();
  URL.revokeObjectURL(a.href);
}
  
private mapToPcapPanel(apiData: AnalysisResponse): PcapPanelData {
    const issues = (apiData.issues ?? []) as any[];
    // 1) Conteos por severidad y por tipo
    const sevMap = new Map<string, number>();
    const typeMap = new Map<string, number>();
    const streamMap = new Map<string, number>();
    const tlsFatalAlerts: { timestamp?: string; description: string }[] = [];

    for (const it of issues) {
      if (it?.severity) sevMap.set(it.severity, (sevMap.get(it.severity) || 0) + 1);
      if (it?.type) typeMap.set(it.type, (typeMap.get(it.type) || 0) + 1);
      if (it?.stream) streamMap.set(it.stream, (streamMap.get(it.stream) || 0) + 1);

      // Captura alertas TLS con timestamp si viene en la descripción
      if (it?.type === 'TLS_FATAL_ALERT' && typeof it?.description === 'string') {
        const m = it.description.match(/\[(.*?)\]\s*Fatal TLS alert:\s*([^ ]+)/i);
        tlsFatalAlerts.push({
          timestamp: m?.[1],
          description: it.description
        });
      }
    }

    const issuesBySeverity = Array.from(sevMap.entries()).map(([severity, count]) => ({ severity, count }))
      .sort((a, b) => b.count - a.count);
    const issuesByType = Array.from(typeMap.entries()).map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
    const topStreams = Array.from(streamMap.entries()).map(([stream, count]) => ({ stream, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 2) Extrae métricas y filtros desde report_text (si existen)
    const rpt = apiData.report_text || '';
    const getNum = (re: RegExp) => {
      const m = rpt.match(re);
      return m ? Number(m[1]) : null;
    };

    const packets = getNum(/Total Packets Analyzed:\s*(\d+)/i);
    const tcpStreams = getNum(/TCP Streams:\s*(\d+)/i);
    const handshakesComplete = getNum(/Complete Handshakes:\s*(\d+)/i);
    const handshakesFailed = getNum(/Failed Handshakes:\s*(\d+)/i);
    const tlsConnections = getNum(/TLS Connections Found:\s*(\d+)/i);

    // TLS versions y cipher suites (listas débiles pero suficientes)
    const versions: string[] = [];
    const versBlock = rpt.match(/TLS Versions Detected:\s*([\s\S]*?)\n\n/);
    if (versBlock) {
      versBlock[1].split('\n').forEach(line => {
        const m = line.match(/-\s*(.+)\s*$/);
        if (m) versions.push(m[1].trim());
      });
    }

    const cipherSuites: string[] = [];
    const csBlock = rpt.match(/Negotiated Cipher Suites:\s*([\s\S]*?)\n(?:Handshake Summary:|\n\n)/);
    if (csBlock) {
      csBlock[1].split('\n').forEach(line => {
        const m = line.match(/-\s*(\S+)/);
        if (m) cipherSuites.push(m[1].trim());
      });
    }

    // Filtros recomendados (título: línea con ":", filtro: siguientes líneas no vacías hasta un separador)
    const filters: { title: string; filter: string }[] = [];
    const filtSection = rpt.match(/RECOMMENDED WIRESHARK FILTERS:[\s\S]*?(?=ISSUES DETECTED|$)/i);
    if (filtSection) {
      const lines = filtSection[0].split('\n').map(s => s.trim()).filter(s => s.length);
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].endsWith(':') && !/^RECOMMENDED WIRESHARK FILTERS/i.test(lines[i])) {
          const title = lines[i].replace(/:$/, '');
          let j = i + 1;
          const collected: string[] = [];
          while (j < lines.length && !lines[j].endsWith(':')) {
            // Evita duplicar encabezados; recoge líneas que parezcan filtros
            collected.push(lines[j].replace(/\\+$/g, '').trim());
            j++;
          }
          if (collected.length) {
            filters.push({ title, filter: collected.join('\n') });
          }
        }
      }
    }

    return {
      packets, tcpStreams, handshakesComplete, handshakesFailed, tlsConnections,
      tlsVersions: versions,
      cipherSuites,
      issuesTotal: issues.length,
      issuesBySeverity,
      issuesByType,
      topStreams,
      tlsFatalAlerts,
      filters,
      raw: apiData.report_text || null
    };
  }
}