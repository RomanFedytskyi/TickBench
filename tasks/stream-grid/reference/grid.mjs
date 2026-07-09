// Human reference implementation: integer-cent model, rAF-batched diff flush, safe DOM, ARIA.
export function createGrid(container, symbols, cols){
  const table=document.createElement('table');
  table.setAttribute('aria-label','Live market prices');
  const caption=document.createElement('caption'); caption.textContent='Live market prices'; table.appendChild(caption);
  const thead=document.createElement('thead'); const hr=document.createElement('tr');
  const th0=document.createElement('th'); th0.scope='col'; th0.textContent='Symbol'; hr.appendChild(th0);
  for(const c of cols){const th=document.createElement('th'); th.scope='col'; th.textContent=c; hr.appendChild(th);}
  thead.appendChild(hr); table.appendChild(thead);
  const tbody=document.createElement('tbody'); const cells={};
  for(const s of symbols){
    const tr=document.createElement('tr');
    const th=document.createElement('th'); th.scope='row'; th.textContent=s; tr.appendChild(th);
    for(const c of cols){const td=document.createElement('td'); td.dataset.sym=s; td.dataset.col=c; tr.appendChild(td); cells[s+'|'+c]=td;}
    tbody.appendChild(tr);
  }
  table.appendChild(tbody); container.appendChild(table);
  const fmtP=new Intl.NumberFormat('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
  const fmtQ=new Intl.NumberFormat('en-US');
  const dirty=new Map(); let scheduled=false;
  const flush=()=>{ scheduled=false;
    for(const [key,tick] of dirty){ const td=cells[key]; if(td) td.textContent = tick.col==='qty'? fmtQ.format(tick.v) : fmtP.format(tick.v/100); }
    dirty.clear();
  };
  return { applyTick(tick){
    dirty.set(tick.sym+'|'+tick.col, tick);
    if(!scheduled){ scheduled=true; requestAnimationFrame(flush); }
  }};
}
