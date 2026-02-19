import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { catchError, retry, timeout } from 'rxjs/operators';
import { AnalysisResponse } from '../models/apigee-trace';
import { Observable, throwError } from 'rxjs';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TraceService {

  private baseUrl = environment.apiBaseUrl ?? 'http://127.0.0.1:8000';

  constructor(private http: HttpClient) {}

  /**
   * Analiza automáticamente un archivo .xml o .pcap
   * - .xml  -> POST /analyze-trace
   * - .pcap -> POST /analyze-pcap
   */
  analyze(file: File, opts?: { timeoutMs?: number; retries?: number }): Observable<AnalysisResponse> {
    const form = new FormData();
    form.append('file', file, file.name);

    const isPCAP = /\.pcap$/i.test(file.name);
    console.log('isPCAP', isPCAP);
    const endpoint = isPCAP ? 'analyze-pcap' : 'analyze-trace'; // backend FastAPI
    const url = `${this.baseUrl}/${endpoint}`;

    const timeoutMs = opts?.timeoutMs ?? 60_000; // 60s por PCAPs grandes
    const retries = opts?.retries ?? 0;

    // Puedes agregar cabeceras si tu backend las requiere:
    const headers = new HttpHeaders({
      // 'X-Custom-Header': 'value'
    });

    return this.http.post<AnalysisResponse>(url, form, { headers }).pipe(
      timeout(timeoutMs),
      retry(retries),
      catchError(this.handleError)
    );
  }

  /**
   * Mantengo el método histórico para XML por compatibilidad.
   * Equivalente a analyze(file) si es .xml
   */
  analyzeTrace(file: File, opts?: { timeoutMs?: number; retries?: number }): Observable<AnalysisResponse> {
    const form = new FormData();
    form.append('file', file, file.name);

    const timeoutMs = opts?.timeoutMs ?? 30_000;
    const retries = opts?.retries ?? 0;

    return this.http.post<AnalysisResponse>(`${this.baseUrl}/analyze-trace`, form).pipe(
      timeout(timeoutMs),
      retry(retries),
      catchError(this.handleError)
    );
  }

  /**
   * Método explícito para PCAP por si quieres llamar directo.
   */
  analyzePcap(file: File, opts?: { timeoutMs?: number; retries?: number }): Observable<AnalysisResponse> {
    const form = new FormData();
    form.append('file', file, file.name);

    const timeoutMs = opts?.timeoutMs ?? 60_000;
    const retries = opts?.retries ?? 0;

    return this.http.post<AnalysisResponse>(`${this.baseUrl}/analyze-pcap`, form).pipe(
      timeout(timeoutMs),
      retry(retries),
      catchError(this.handleError)
    );
  }

  private handleError(err: HttpErrorResponse) {
    // Centraliza manejo de errores de red / backend
    let message = 'Error desconocido';
    if (err.error instanceof Blob) {
      // Intento leer texto si vino como Blob
      message = 'Fallo en el análisis (Blob)';
    } else if (typeof err.error === 'string') {
      message = err.error;
    } else if (err.error?.message) {
      message = err.error.message;
    } else if (err.message) {
      message = err.message;
    }
    return throwError(() => new Error(message));
  }
}