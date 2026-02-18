import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { TraceService } from '../../services/trace';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';


@Component({
  selector: 'app-trace-analyzer',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatCardModule,
    MatButtonModule,
    MatTableModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './trace-analyzer.html',
  styleUrls: ['./trace-analyzer.scss']
})
export class TraceAnalyzerComponent {

  result: any;
  loading = false;

  displayedColumns: string[] = ['name', 'type', 'status', 'executionTime'];

  constructor(private traceService: TraceService) {}

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.loading = true;

    this.traceService.analyzeTrace(file).subscribe({
      next: (res) => {
        this.result = res;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }
}

