import * as THREE from 'three';

import { setupWorld }         from './core/world.js';
import { setupPlayer }        from './core/player.js';
import { createColliders, CONFIG } from './core/collision.js';
import { setupInteraction }   from './core/interaction.js';
import { startLoop }          from './core/loop.js';
import { createPhysics }      from './physics/world.js';

import { setupHelpHUD }       from './ui/help.js';
import { setupPanelToggle }   from './ui/panel.js';
import { renderScreens }      from './ui/screens.js';

import { setupInput }         from './game/input.js';
import { criarEstacoes }      from './game/stations.js';
import { flow }               from './game/flow.js';
import { state }              from './game/state.js';
import { instalarOZ }         from './game/oz/index.js';
import { instalarDebug }      from './debug.js';

// ---------------------------------------------------------------------
// 1. Mundo gráfico, física desacoplada e jogador
// ---------------------------------------------------------------------
const world   = setupWorld();
const physics = createPhysics();
const input   = setupInput(world.renderer.domElement);
const player  = setupPlayer(world, input);

const colliders = createColliders();

// ---------------------------------------------------------------------
// 2. Estações de trabalho
// ---------------------------------------------------------------------
const stations              = criarEstacoes(world.scene, colliders);
const verificarDesbloqueios = stations.verificarDesbloqueios || (() => false);

// ---------------------------------------------------------------------
// 3. Interface de usuário e fluxo de telas
// ---------------------------------------------------------------------
setupHelpHUD();
setupPanelToggle();

state.score = 0;
flow.onChange(() => renderScreens());
renderScreens();

// ---------------------------------------------------------------------
// 4. API global (window.OZ)
// ---------------------------------------------------------------------
instalarOZ({ verificarDesbloqueios, player });

// ---------------------------------------------------------------------
// 5. Interação, Observabilidade (Debug/Métricas) e Loop de Execução
// ---------------------------------------------------------------------
const interaction = setupInteraction({
  player,
  stations,
  interactionDistance: CONFIG.interactionDistance,
});

instalarDebug({
  THREE,
  colliders,
  player,
  stations,
  scene: world.scene,
  camera: world.camera,
  renderer: world.renderer,
  flow,
  interaction,
  physics,
});

// Fix de acessibilidade / foco no overlay de telas
document.addEventListener('focus', (e) => {
  if (e.target?.closest?.('#screens-overlay')) {
    e.target.scrollIntoView({ block: 'nearest', behavior: 'instant' });
  }
}, true);

startLoop({ world, player, colliders, interaction, flow, physics });
