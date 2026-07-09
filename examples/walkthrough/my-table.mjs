// YOUR EXISTING COMPONENT (stand-in). Note: it knows nothing about TickBench —
// it has its own ordinary API: mount(el), setCell(row, col, text), getCell(row, col).
export class SimpleTable {
  constructor({ rows, columns, title = 'Prices' }) {
    this.rows = rows;
    this.columns = columns;
    this.title = title;
    this.cells = new Map();
  }

  mount(el) {
    const table = document.createElement('table');
    const caption = document.createElement('caption');
    caption.textContent = this.title;
    table.appendChild(caption);

    const thead = document.createElement('thead');
    const hr = document.createElement('tr');
    const h0 = document.createElement('th');
    h0.scope = 'col'; h0.textContent = 'Symbol';
    hr.appendChild(h0);
    for (const c of this.columns) {
      const th = document.createElement('th');
      th.scope = 'col'; th.textContent = c;
      hr.appendChild(th);
    }
    thead.appendChild(hr);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    for (const r of this.rows) {
      const tr = document.createElement('tr');
      const th = document.createElement('th');
      th.scope = 'row'; th.textContent = r;
      tr.appendChild(th);
      for (const c of this.columns) {
        const td = document.createElement('td');
        tr.appendChild(td);
        this.cells.set(r + ' ' + c, td);
      }
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    el.appendChild(table);
  }

  getCell(row, col) { return this.cells.get(row + ' ' + col); }
  setCell(row, col, text) { this.getCell(row, col).textContent = text; }
}
