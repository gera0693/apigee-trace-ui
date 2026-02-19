import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AnalysisResponse, LegacyViewModel } from '../../models/apigee-trace';
import { Component, ElementRef, signal, ViewChild } from '@angular/core';
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
    MatTooltipModule
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

  displayedHeaderColumns = ['name', 'value'];
  displayedStateColumns = ['timestamp', 'from', 'to'];

  constructor(private svc: TraceService) {}

  onFileSelected(evt: Event) {
    const input = evt.target as HTMLInputElement;
    if (!input.files || !input.files.length) return;

    const file = input.files[0];
    this.fileName.set(file.name);
    this.loading.set(true);
    this.errorMsg.set(null);
    this.result.set(null);
    this.rawReport.set(null);

    this.svc.analyzeTrace(file).subscribe({
      next: (data) => {
        if (data.status === 'error') {
          this.errorMsg.set(data.message || 'No se pudo analizar el XML.');
          return;
        }
        const legacy = this.mapToLegacyShape(data);
        this.result.set(legacy);
        this.rawReport.set(data.report_text || null);
      },
      error: (err) => {
        this.errorMsg.set(err?.message || 'Error inesperado');
      },
      complete: () => this.loading.set(false)
    });
  }
  
  clearFile() {
      this.fileName.set(null);
      if (this.fileInputRef?.nativeElement) {
        this.fileInputRef.nativeElement.value = '';
      }
      this.result.set(null);
      this.rawReport.set(null);
      this.errorMsg.set(null);
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
      stateChanges: []
    };

    return legacy;
  }
}