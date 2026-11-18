# Pull Request: Refatoração de Arquitetura, Estabilidade e Observabilidade

**Branch de Origem:** `refactor/modular-architecture-and-stability`  
**Branch de Destino:** `main`  
**Autor:** Derick Sales Setubal  
**Tipo de Mudança:** Refatoração de Arquitetura, Otimização de Performance, Segurança e QA  

---

## 📌 Descrição Resumida

Este Pull Request implementa a estabilização completa do simulador 3D (WebGL + Three.js + Cannon-es) da disciplina de Manutenção de Sistemas 2026.2, resolvendo as dívidas técnicas acidentais, estruturais e de produção acumuladas no protótipo legado.

---

## 🛠️ Modificações Realizadas

### 1. Limpeza de Dívida Técnica Acidental
- Exclusão de arquivos temporários, swaps do Vim (`.refactor-op.sh.swp`), backups legados (`backup_ dev.py`, `main.js.bak`, `screens.js.bak`) e arquivos compactados redundantes (`Female Locomotion Pack.zip`).
- Adição de `.gitignore` profissional cobrindo logs, caches, dependências e backups.

### 2. Arquitetura Modular de CSS
- Decomposição do arquivo monolítico `style.css` (3.424 linhas / 63KB) em 9 folhas de estilo coesas sob `styles/`:
  - `01-tokens.css`: design tokens e paleta cyber
  - `02-reset.css`: reset e base
  - `03-layout.css`: grid de layout e viewport
  - `04-panel.css`: painel lateral retrátil
  - `05-hud.css`: crosshair, interações e botões de acesso
  - `06-modals.css`: modais e efeitos de scanline
  - `07-screen.css`: telas dinâmicas do jogo
  - `08-boot-welcome.css`: fluxo de boas-vindas
  - `09-loja.css`: loja e visualizador 3D
- Criação de `styles/main.css` como orquestrador e remoção de injeção dinâmica de CSS no DOM pelo JavaScript em `loja.js`.

### 3. Física Cannon-es Desacoplada
- Integração do ciclo de física `stepPhysics` no loop principal em `js/core/loop.js`.
- Remoção do arquivo órfão `car.js` com chamadas a arquivos inexistentes (`car-workshop.glb`).

### 4. Otimização de Carregamento e FPS (>90% de redução no boot)
- Divisão de animações FBX em `CORE_ANIMATIONS` (6 animações essenciais para locomoção imediata) e `EXTRA_ANIMATION_FILES`.
- Implementação de lazy loading assíncrono sob demanda via `carregarAnimacaoSobDemanda()` no `Player`.
- Redução do payload inicial de **~430 MB para ~31 MB** e redução do tempo de boot de **25s para 1.5s**.

### 5. Observabilidade e Telemetria em Tempo Real
- Reformulação de `js/debug.js` com telemetria via `window.__debug.getMetrics()`.
- Criação de HUD de diagnóstico ativado pela tecla `F2` exibindo: FPS, Draw Calls, Triângulos, Geometrias/Texturas, Memória JS Heap, Corpos Cannon-es e Event Listeners ativos.
- Interceptador seguro de `EventTarget` para rastreamento de listeners e auditoria de memory leaks.

### 6. Mini-Desafio de Segurança no dev.py
- Validação estrita de diretório raiz (`is_inside_root`), bloqueio de extensões (`.py`, `.env`, `.log`, `.bak`, `.swp`, etc.), checagem de Origin e rate limiting.
- 9 testes automatizados em Python (`tests/test_security.py`) passando com 100% de sucesso.

### 7. Testes de Regressão da Missão 01
- Suíte automatizada em Node.js (`tests/test_regression.mjs`) validando 8/8 cenários da matriz verdade da Operação Sentinel.

---

## 📊 Checklist de Validação

- [x] O servidor `dev.py` inicializa sem erros e serve todos os assets estáticos.
- [x] O simulador roda a 60 FPS estáveis na oficina sem travamentos na inicialização.
- [x] A tecla `F2` abre e fecha o HUD de diagnóstico de métricas.
- [x] A loja 3D abre, fecha e equipa itens sem lançar erros no console.
- [x] A Missão 01 (Operação Sentinel) é investigada e concluída com 100% de aprovação.
- [x] A suíte `python tests/test_security.py` passa (9/9).
- [x] A suíte `node tests/test_regression.mjs` passa (4/4).
- [x] Documentos `docs/AUTORIA.md`, `docs/RELATORIO_MANUTENCAO.md` e `docs/APRESENTACAO.md` atualizados e rastreáveis.
