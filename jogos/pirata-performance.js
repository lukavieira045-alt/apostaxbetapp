(function(){
'use strict';
// Otimização isolada do giro: mantém resultado, aposta e saldo fora deste arquivo.
// Reaproveita o pool de células extras para evitar criar/destruir dezenas de nós a cada giro.
const originalSetTimeout=window.setTimeout;
window.__AXPirataPerf={
  fastMobile: /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent||'') && window.innerWidth<=760,
  audioIntervals: new Set(),
  track(id){this.audioIntervals.add(id);return id},
  clear(id){try{window.clearInterval(id)}catch(e){}this.audioIntervals.delete(id)}
};
})();
