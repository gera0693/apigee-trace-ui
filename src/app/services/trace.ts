import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TraceService {

  private apiUrl = 'https://apigee-trace-api.onrender.com/analyze-trace';

  constructor(private http: HttpClient) {}

  analyzeTrace(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<any>(this.apiUrl, formData);
  }
}

