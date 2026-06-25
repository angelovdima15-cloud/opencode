export class SeatMap {
  constructor(container, workstations, onSeatClick) {
    this.container = container;
    this.workstations = workstations;
    this.onSeatClick = onSeatClick;

    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.setAttribute('viewBox', '0 0 400 300');
    this.svg.setAttribute('class', 'seatmap-svg');

    this.render();
    container.appendChild(this.svg);
  }

  render() {
    this.workstations.forEach((ws) => {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('transform', `translate(${ws.position?.x || 50}, ${ws.position?.y || 50})`);
      g.setAttribute('cursor', ws.status === 'free' ? 'pointer' : 'default');
      g.dataset.wsid = ws.id;

      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', '-15');
      rect.setAttribute('y', '-10');
      rect.setAttribute('width', '30');
      rect.setAttribute('height', '20');
      rect.setAttribute('rx', '4');

      const statusClass = ws.status === 'free' ? '#4ade80' : ws.status === 'busy' ? '#f87171' : '#9ca3af';
      rect.setAttribute('fill', statusClass);
      rect.setAttribute('stroke', '#374151');
      rect.setAttribute('stroke-width', '1');

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', '0');
      text.setAttribute('y', '5');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', 'white');
      text.setAttribute('font-size', '8');
      text.setAttribute('font-weight', 'bold');
      text.textContent = ws.name.replace('ПК-', '');

      g.appendChild(rect);
      g.appendChild(text);
      this.svg.appendChild(g);

      if (ws.status === 'free') {
        g.addEventListener('click', () => this.onSeatClick?.(ws));
        g.addEventListener('mouseenter', () => rect.setAttribute('stroke', '#60a5fa'));
        g.addEventListener('mouseleave', () => rect.setAttribute('stroke', '#374151'));
      }

      // Tooltip on hover
      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = `${ws.name} — ${ws.zone}\n${ws.specs?.cpu || ''}\n${ws.specs?.gpu || ''}`;
      g.appendChild(title);
    });
  }
}
