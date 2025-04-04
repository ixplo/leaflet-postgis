import { Component, AfterViewInit } from '@angular/core';
import * as L from 'leaflet';
import { HttpClient } from '@angular/common/http';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit {
  private map: L.Map | undefined;
  private currentLayer: L.GeoJSON<any> | null = null;
  public layers: any[] = [];
  public selectedLayerName: string = '';

    constructor(private http: HttpClient) { }

    ngAfterViewInit(): void {
        this.map = L.map('map').setView([27.95, -82.45], 11);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        // Load GeoJSON multi-line data from assets
        this.http.get('http://localhost:3000/api/multilines').subscribe((geoData: any) => {
            this.layers = geoData.features;
            if (this.layers.length > 0) {
                this.selectedLayerName = this.layers[0].properties.id;
                this.updateLayer();
            }
        }, error => {
            console.error('Error loading GeoJSON data:', error);
        });
    }

    updateLayer(): void {
        if (!this.map) return;
        if (this.currentLayer) {
            this.map.removeLayer(this.currentLayer);
        }
        const feature = this.layers.find(f => f.properties.id === this.selectedLayerName);
        if (feature) {
            this.currentLayer = L.geoJSON(feature, {
                style: { color: 'blue', weight: 4 }
            }).addTo(this.map);
            this.map.fitBounds(this.currentLayer.getBounds());
        }
    }

    onLayerChange(event: any): void {
        this.selectedLayerName = event.target.value;
        this.updateLayer();
    }
}