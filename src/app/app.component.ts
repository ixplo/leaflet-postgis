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
        this.baseZoom = this.map.getZoom();

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        const svgLayer = L.svg();
        svgLayer.addTo(this.map);
        const svg = d3.select(this.map.getPanes().overlayPane).select('svg');
        const centerPoint = this.map.latLngToLayerPoint([this.latitude, this.longitude]);
        this.d3Group = svg.append('g')
            .attr('class', 'leaflet-zoom-hide')
            .attr('transform', `translate(${-centerPoint.x}, ${-centerPoint.y})`);
        this.map.on('zoom viewreset move', () => this.resetTransform());
        this.drawD3Grid();

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
        const point = this.map.latLngToLayerPoint([this.latitude, this.longitude]);
        if (this.d3Circle) {
            this.d3Circle.remove();
        }
        this.d3Circle = this.d3Group.append('circle')
          .attr('cx', point.x)
          .attr('cy', point.y)
          .attr('r', 10)
          .attr('fill', 'red');

        this.d3Group.append("line")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", 0)
            .attr("y2", 1000)
            .attr("stroke", "red")
            .attr("stroke-width", 2);
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

    resetTransform(): void {
      if (!this.map) return;
      const centerPoint = this.map.latLngToLayerPoint([this.latitude, this.longitude]);
      this.d3Group.attr('transform', `translate(${-centerPoint.x}, ${-centerPoint.y})`).raise();
      
      this.drawD3Grid();
    }

    private drawD3Grid(): void {
      if (!this.map) return;
      const gridSpacing = 1; // degrees
      const extent = 10; // degrees around center
      const linesGroup = this.d3Group.selectAll(".d3-grid").data([null]);
      linesGroup.exit().remove();
      const g = linesGroup.enter().append("g").attr("class", "d3-grid").merge(linesGroup);
      g.selectAll("*").remove();

      for (let lon = this.longitude - extent; lon <= this.longitude + extent; lon += gridSpacing) {
        const p1 = this.map.latLngToLayerPoint([this.latitude - extent, lon]);
        const p2 = this.map.latLngToLayerPoint([this.latitude + extent, lon]);
        g.append("line")
          .attr("x1", p1.x)
          .attr("y1", p1.y)
          .attr("x2", p2.x)
          .attr("y2", p2.y)
          .attr("stroke", "gray")
          .attr("stroke-width", 1);
        g.append("text")
          .attr("x", p1.x)
          .attr("y", p1.y - 5)
          .attr("text-anchor", "middle")
          .attr("font-size", "10px")
          .attr("fill", "gray")
          .text(lon.toFixed(1));
      }

      for (let lat = this.latitude - extent; lat <= this.latitude + extent; lat += gridSpacing) {
        const p1 = this.map.latLngToLayerPoint([lat, this.longitude - extent]);
        const p2 = this.map.latLngToLayerPoint([lat, this.longitude + extent]);
        g.append("line")
          .attr("x1", p1.x)
          .attr("y1", p1.y)
          .attr("x2", p2.x)
          .attr("y2", p2.y)
          .attr("stroke", "gray")
          .attr("stroke-width", 1);
      }

      const center = this.map.latLngToLayerPoint([this.latitude, this.longitude]);
      this.d3Group.append("line")
        .attr("x1", center.x - 20)
        .attr("y1", center.y)
        .attr("x2", center.x + 20)
        .attr("y2", center.y)
        .attr("stroke", "black")
        .attr("stroke-width", 2);
      this.d3Group.append("line")
        .attr("x1", center.x)
        .attr("y1", center.y - 20)
        .attr("x2", center.x)
        .attr("y2", center.y + 20)
        .attr("stroke", "black")
        .attr("stroke-width", 2);
    }
}