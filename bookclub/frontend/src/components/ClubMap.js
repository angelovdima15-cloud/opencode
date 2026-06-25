import L from 'leaflet';

export class ClubMap {
  constructor(containerId, center) {
    this.map = L.map(containerId).setView([center.lat, center.lng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(this.map);

    this.markers = [];
  }

  addUserMarker(lat, lng) {
    const icon = L.divIcon({
      className: 'user-marker',
      html: `<div style="background:#3b82f6;width:24px;height:24px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 3px rgba(59,130,246,0.4),0 2px 4px rgba(0,0,0,0.3)"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    L.marker([lat, lng], { icon, zIndexOffset: 1000 }).addTo(this.map);
  }

  addMarker(club, onClick) {
    const color = club.free_pcs > 0 ? '#4ade80' : '#f87171';
    const icon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="background:${color};width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:12px;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)">${club.free_pcs ?? '?'}</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const popupLines = [`<b>${club.name}</b>`];
    if (club.free_pcs !== undefined) {
      popupLines.push(`${club.free_pcs}/${club.total_pcs} свободно`);
    }
    if (club.distance_km !== undefined) {
      popupLines.push(`<span style="color:#94a3b8">${club.distance_km} км от вас</span>`);
    }

    const marker = L.marker([club.lat, club.lng], { icon })
      .addTo(this.map)
      .bindPopup(popupLines.join('<br>'));

    marker.on('click', () => onClick?.());
    this.markers.push(marker);
  }

  fitAllMarkers() {
    if (this.markers.length > 0) {
      const group = L.featureGroup(this.markers);
      const bounds = group.getBounds();
      if (bounds.isValid()) {
        this.map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    }
  }

  clearMarkers() {
    for (const marker of this.markers) {
      this.map.removeLayer(marker);
    }
    this.markers = [];
  }

  destroy() {
    this.map.remove();
  }
}
