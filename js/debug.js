// ============================================================
// js/debug.js — Módulo de Diagnóstico, Métricas e Observabilidade
// Diagnóstico com logs e métricas reais:
// - renderer.info (calls, triangles, geometries, textures)
// - performance.memory (heap size, used heap)
// - Corpos físicos Cannon-es
// - Contadores de listeners e detecção de leaks
// - FPS em tempo real e HUD de observabilidade (tecla F2)
// ============================================================

let activeListenersCount = 0;
const trackedListeners = new Set();

// Interceptador seguro para contagem de listeners
if (typeof window !== 'undefined' && !window.__LISTENER_TRACKER_INSTALLED__) {
  window.__LISTENER_TRACKER_INSTALLED__ = true;
  const originalDocAdd = EventTarget.prototype.addEventListener;
  const originalDocRemove = EventTarget.prototype.removeEventListener;

  EventTarget.prototype.addEventListener = function(type, listener, options) {
    if (this === window || this === document || (this instanceof Element)) {
      activeListenersCount++;
      trackedListeners.add({ target: this.constructor.name, type, listener });
    }
    return originalDocAdd.call(this, type, listener, options);
  };

  EventTarget.prototype.removeEventListener = function(type, listener, options) {
    if (this === window || this === document || (this instanceof Element)) {
      if (activeListenersCount > 0) activeListenersCount--;
    }
    return originalDocRemove.call(this, type, listener, options);
  };
}

let currentFps = 60;
let frameCount = 0;
let lastFpsTime = performance.now();
let hudVisible = false;
let hudElement = null;

export function updateDebugFps() {
  frameCount++;
  const now = performance.now();
  if (now - lastFpsTime >= 500) {
    currentFps = Math.round((frameCount * 1000) / (now - lastFpsTime));
    frameCount = 0;
    lastFpsTime = now;
    if (hudVisible && hudElement) {
      atualizarHudElement();
    }
  }
}

function getMemoryMetrics() {
  if (typeof performance !== 'undefined' && performance.memory) {
    return {
      usedHeapMB: (performance.memory.usedJSHeapSize / (1024 * 1024)).toFixed(2),
      totalHeapMB: (performance.memory.totalJSHeapSize / (1024 * 1024)).toFixed(2),
      heapLimitMB: (performance.memory.jsHeapSizeLimit / (1024 * 1024)).toFixed(2),
    };
  }
  return {
    usedHeapMB: 'N/A (Ativar no Chromium)',
    totalHeapMB: 'N/A',
    heapLimitMB: 'N/A',
  };
}

let debugContext = {};

function atualizarHudElement() {
  if (!hudElement) return;
  const metrics = obterMetricas();
  hudElement.innerHTML = `
    <div style="font-weight:bold; color:var(--cy-cyan,#00f0ff); border-bottom:1px solid rgba(0,240,255,0.3); padding-bottom:4px; margin-bottom:6px; display:flex; justify-content:space-between;">
      <span>[DIAGNÓSTICO // F2]</span>
      <span style="color:${metrics.fps >= 50 ? '#00ffa3' : '#ffd166'}">${metrics.fps} FPS</span>
    </div>
    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:4px 12px; font-size:11px;">
      <div><span style="color:#71869a;">Draw Calls:</span> <strong>${metrics.three.calls}</strong></div>
      <div><span style="color:#71869a;">Triângulos:</span> <strong>${metrics.three.triangles.toLocaleString()}</strong></div>
      <div><span style="color:#71869a;">Geometrias:</span> <strong>${metrics.three.geometries}</strong></div>
      <div><span style="color:#71869a;">Texturas:</span> <strong>${metrics.three.textures}</strong></div>
      <div><span style="color:#71869a;">Corpos Cannon:</span> <strong>${metrics.physics.cannonBodies}</strong></div>
      <div><span style="color:#71869a;">Colisores Box:</span> <strong>${metrics.physics.boxColliders}</strong></div>
      <div><span style="color:#71869a;">Heap Usado:</span> <strong>${metrics.memory.usedHeapMB} MB</strong></div>
      <div><span style="color:#71869a;">Listeners Ativos:</span> <strong>${metrics.listeners.totalAtivos}</strong></div>
    </div>
  `;
}

function criarHud() {
  if (hudElement) return;
  hudElement = document.createElement('div');
  hudElement.id = 'debug-hud-overlay';
  hudElement.style.cssText = `
    position: fixed;
    top: 12px;
    left: 12px;
    z-index: 99999;
    background: rgba(5, 8, 16, 0.90);
    border: 1px solid rgba(0, 240, 255, 0.45);
    border-radius: 4px;
    padding: 10px 14px;
    font-family: 'JetBrains Mono', Consolas, monospace;
    font-size: 11px;
    color: #dce8f5;
    pointer-events: none;
    box-shadow: 0 4px 20px rgba(0,0,0,0.6);
    backdrop-filter: blur(8px);
    display: none;
    min-width: 280px;
  `;
  document.body.appendChild(hudElement);

  window.addEventListener('keydown', (e) => {
    if (e.key === 'F2') {
      e.preventDefault();
      toggleHud();
    }
  });
}

function toggleHud(forceState) {
  if (!hudElement) criarHud();
  hudVisible = typeof forceState === 'boolean' ? forceState : !hudVisible;
  hudElement.style.display = hudVisible ? 'block' : 'none';
  if (hudVisible) atualizarHudElement();
}

function obterMetricas() {
  const { renderer, colliders, physics } = debugContext;
  const rInfo = renderer?.info;
  const mem = getMemoryMetrics();

  return {
    timestamp: new Date().toISOString(),
    fps: currentFps,
    three: {
      calls: rInfo?.render?.calls ?? 0,
      triangles: rInfo?.render?.triangles ?? 0,
      lines: rInfo?.render?.lines ?? 0,
      points: rInfo?.render?.points ?? 0,
      geometries: rInfo?.memory?.geometries ?? 0,
      textures: rInfo?.memory?.textures ?? 0,
    },
    physics: {
      cannonBodies: physics?.world?.bodies?.length ?? 0,
      boxColliders: colliders?.length ?? 0,
    },
    memory: mem,
    listeners: {
      totalAtivos: activeListenersCount,
    },
  };
}

export function instalarDebug(ctx) {
  debugContext = ctx;
  const { THREE, colliders, player, stations, scene, camera, renderer, flow, interaction, physics } = ctx;

  criarHud();

  window.__debug = {
    get THREE()         { return THREE; },
    get colliders()     { return colliders; },
    get player()        { return player; },
    get stations()      { return stations; },
    get scene()         { return scene; },
    get controls()      { return player.controls; },
    get camera()        { return camera; },
    get renderer()      { return renderer; },
    get flow()          { return flow; },
    get physics()       { return physics; },
    get stationFocada()  { return interaction?.getStationFocada?.(); },
    get fps()           { return currentFps; },

    // Diagnóstico e métricas reais
    getMetrics:         obterMetricas,
    logMetrics() {
      const m = obterMetricas();
      console.group('%c[DIAGNÓSTICO // TELEMETRIA]', 'color:#00f0ff; font-weight:bold;');
      console.log(`FPS: %c${m.fps}`, m.fps >= 50 ? 'color:#00ffa3' : 'color:#ffd166');
      console.table({
        'Three.js Calls': m.three.calls,
        'Three.js Triangles': m.three.triangles,
        'Three.js Geometries': m.three.geometries,
        'Three.js Textures': m.three.textures,
        'Cannon-es Bodies': m.physics.cannonBodies,
        'Three.js Colliders': m.physics.boxColliders,
        'Heap Usado (MB)': m.memory.usedHeapMB,
        'Heap Total (MB)': m.memory.totalHeapMB,
        'Listeners Ativos': m.listeners.totalAtivos,
      });
      console.groupEnd();
      return m;
    },
    toggleHUD:          toggleHud,
  };

  console.log('%c[debug] window.__debug ativo! Pressione [F2] para alternar o HUD de métricas.', 'color:#00ffa3; font-weight:bold;');
}
