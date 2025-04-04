import { Component, AfterViewInit } from '@angular/core';
import * as L from 'leaflet';
import { HttpClient } from '@angular/common/http';
import * as d3 from 'd3';

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
  public latitude: number = 54;
  public longitude: number = 2;
  private d3Circle: any;
  private d3Group: any;

    constructor(private http: HttpClient) { }

    ngAfterViewInit(): void {
        this.map = L.map('map').setView([this.latitude, this.longitude], 11);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        const svgLayer = L.svg();
        svgLayer.addTo(this.map);
        const svg = d3.select(this.map.getPanes().overlayPane).select('svg');
        this.d3Group = svg.append('g').attr('class', 'leaflet-zoom-hide');

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

        // this.map.on('zoomend moveend', () => {
        //     this.updateCirclePosition();
        // });
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
        const point = this.map.latLngToLayerPoint([this.latitude, this.longitude]);
        this.d3Circle = this.d3Group.append('circle')
          .attr('cx', point.x)
          .attr('cy', point.y)
          .attr('r', 10)
          .attr('fill', 'red');
    }

    onLayerChange(event: any): void {
        this.selectedLayerName = event.target.value;
        this.updateLayer();
    }

    updateCirclePosition(): void {
      if (!this.map) return;
      const updatedPoint = this.map.latLngToLayerPoint([this.latitude, this.longitude]);
      this.d3Circle.attr('cx', updatedPoint.x)
                   .attr('cy', updatedPoint.y);
    }

    updateLocation(): void {
      if (!this.map) return;
      this.map.setView([this.latitude, this.longitude], this.map.getZoom());
      this.updateCirclePosition();
    }
}