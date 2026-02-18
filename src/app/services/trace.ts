import { AnalysisResponse } from '../models/apigee-trace';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TraceService {

  private baseUrl = 'https://apigee-trace-api.onrender.com';

  constructor(private http: HttpClient) {}
  
  analyzeTrace(file: File) {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<AnalysisResponse>(`${this.baseUrl}/analyze-trace`, form);
  }

}

