// Hand-written oracle-validation baseline. Failure modes injected deliberately, each
// commonly reported for AI-generated frontend code:
//  (a) full innerHTML re-render on every tick (synchronous, unbatched)  -> jank + staleness
//  (b) unsanitized string interpolation of untrusted symbol names       -> XSS sink
//  (c) float accumulation + toFixed(2), no locale/thousands separators  -> monetary display errors
//  (d) no caption / scope / aria                                        -> WCAG violations
export function createGrid(container, symbols, cols){
  const state={}; const raw={};
  for(const s of symbols){ state[s]={}; raw[s]={}; }
  function render(){
    let html='<table><tr><th>Symbol</th>'+cols.map(c=>'<th>'+c+'</th>').join('')+'</tr>';
    for(const s of symbols){
      html+='<tr><td>'+s+'</td>';                                   // (b) XSS sink
      for(const c of cols){
        const v=state[s][c];
        html+='<td data-sym="'+s.replace(/"/g,'&quot;')+'" data-col="'+c+'">'+(v==null?'':v)+'</td>';
      }
      html+='</tr>';
    }
    container.innerHTML=html+'</table>';                            // (a) full re-render
  }
  return { applyTick(tick){
    if(tick.col==='qty'){ state[tick.sym][tick.col]=String(tick.v); }
    else {
      // (c) float-dollar accumulation instead of integer cents
      const prev = raw[tick.sym][tick.col];
      raw[tick.sym][tick.col] = prev==null ? tick.v/100 : prev + (tick.v/100 - prev);
      state[tick.sym][tick.col] = raw[tick.sym][tick.col].toFixed(2); // no separators
    }
    render();                                                       // (a) per-tick sync render
  }};
}
