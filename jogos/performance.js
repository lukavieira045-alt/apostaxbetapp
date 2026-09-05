(function () {
  'use strict';
  var nav=window.navigator||{};
  var connection=nav.connection||nav.mozConnection||nav.webkitConnection||{};
  var mobile=window.matchMedia&&window.matchMedia('(max-width: 700px)').matches;
  var android=/Android|iPhone|iPad|iPod|Mobile/i.test(nav.userAgent||'');
  var slow=!!connection.saveData||/^(slow-2g|2g)$/i.test(connection.effectiveType||'');
  var path=location.pathname||'';
  var isRoleta=/\/roleta\.html$/i.test(path);
  var isRoletaCassino=/\/roleta-cassino\.html$/i.test(path);

  if(isRoleta||isRoletaCassino){
    document.documentElement.classList.add('ax-premium-layer');
    var link=document.createElement('link');
    link.rel='stylesheet';
    link.href=isRoletaCassino?'roleta-cassino-premium.css?v=1':'roleta-premium.css?v=1';
    document.head.appendChild(link);
  }

  var css=document.createElement('style');
  css.id='ax-performance-style';
  css.textContent=''+
    '.ax-low-performance body{animation:none!important;background-attachment:scroll!important}'+
    '.ax-low-performance .luz,.ax-low-performance .particulas,.ax-low-performance .particulas span,[class*="particle"],[class*="partic"],[class*="spark"],[class*="glow"],[class*="shine"],[class*="confetti"],[class*="smoke"]{animation:none!important}'+
    '.ax-low-performance *{animation-iteration-count:1!important}';
  (document.head||document.documentElement).appendChild(css);
  if(!isRoleta&&!isRoletaCassino&&(mobile||android||slow))document.documentElement.classList.add('ax-low-performance');

  if(/tesouro-pirata\.html$/i.test(path)){
    var fix=function(){var g=document.querySelector('.casino');if(g)g.classList.remove('perf-spin');};
    fix();
    new MutationObserver(fix).observe(document.documentElement,{subtree:true,attributes:true,attributeFilter:['class']});
  }

  document.addEventListener('visibilitychange',function(){
    document.querySelectorAll('audio').forEach(function(a){
      if(document.hidden){if(!a.paused){a.dataset.axWasPlaying='1';try{a.pause()}catch(e){}}}
      else if(a.dataset.axWasPlaying==='1'){delete a.dataset.axWasPlaying;try{var p=a.play();if(p&&p.catch)p.catch(function(){});}catch(e){}}
    });
  });

  /* ROULETA 2: o giro agora e controlado diretamente pela Web Animations API.
     Isso evita que estilos inline, cache ou shorthand de animation matem o movimento. */
  if(/\/roleta2\.html$/i.test(path)){
    var ultimoEstado=null;
    var observer=new MutationObserver(function(){
      var roda=document.getElementById('roleta');
      var bola=document.getElementById('bola');
      if(!roda||!bola)return;
      var ativa=roda.classList.contains('girando-premium')||roda.classList.contains('spin-real')||roda.classList.contains('girando')||roda.classList.contains('girando-roleta');
      if(!ativa){ultimoEstado=null;return;}
      if(ultimoEstado===ativa)return;
      ultimoEstado=ativa;

      roda.getAnimations().forEach(function(a){try{a.cancel();}catch(e){}});
      bola.getAnimations().forEach(function(a){try{a.cancel();}catch(e){}});

      var inicioR=parseFloat(getComputedStyle(roda).getPropertyValue('--inicio-roleta'))||0;
      var giroR=parseFloat(getComputedStyle(roda).getPropertyValue('--giro-roleta'))||2160;
      var inicioB=parseFloat(getComputedStyle(bola).getPropertyValue('--inicio-bola'))||0;
      var giroB=parseFloat(getComputedStyle(bola).getPropertyValue('--giro-bola'))||3240;
      var raio=window.innerWidth<=650?125:188;
      var dur=7200;
      var ease='cubic-bezier(.10,.62,.12,1)';

      roda.animate([
        {transform:'rotate('+inicioR+'deg)',offset:0},
        {transform:'rotate('+(inicioR+giroR*.16)+'deg)',offset:.16},
        {transform:'rotate('+(inicioR+giroR*.50)+'deg)',offset:.50},
        {transform:'rotate('+(inicioR+giroR*.78)+'deg)',offset:.78},
        {transform:'rotate('+(inicioR+giroR*.94)+'deg)',offset:.94},
        {transform:'rotate('+(inicioR+giroR)+'deg)',offset:1}
      ],{duration:dur,easing:ease,fill:'forwards'});

      var r0=-raio;
      var r1=-(raio-4);
      var r2=-(raio-12);
      var r3=-(raio-28);
      var r4=-(raio-44);
      var r5=-(raio-52);
      var r6=-(raio-48);
      bola.animate([
        {transform:'translate(-50%,-50%) rotate('+inicioB+'deg) translateY('+r0+'px)',offset:0},
        {transform:'translate(-50%,-50%) rotate('+(inicioB-giroB*.18)+'deg) translateY('+r1+'px)',offset:.18},
        {transform:'translate(-50%,-50%) rotate('+(inicioB-giroB*.50)+'deg) translateY('+r2+'px)',offset:.50},
        {transform:'translate(-50%,-50%) rotate('+(inicioB-giroB*.78)+'deg) translateY('+r3+'px)',offset:.78},
        {transform:'translate(-50%,-50%) rotate('+(inicioB-giroB*.93)+'deg) translateY('+r4+'px)',offset:.93},
        {transform:'translate(-50%,-50%) rotate('+(inicioB-giroB*.985)+'deg) translateY('+r5+'px)',offset:.985},
        {transform:'translate(-50%,-50%) rotate('+(inicioB-giroB)+'deg) translateY('+r6+'px)',offset:1}
      ],{duration:dur,easing:ease,fill:'forwards'});
    });
    observer.observe(document.documentElement,{subtree:true,attributes:true,attributeFilter:['class','style']});
  }
})();
