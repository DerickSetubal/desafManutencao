# Documento de Autoria e Responsabilidade Técnica

**Unidade Curricular:** Manutenção de Sistemas 2026.2 — Level 01  
**Projeto:** LOGIC / Sentinel 3D (WebGL + Three.js + Cannon-es)  
**Aluno Responsável:** Derick Sales Setubal  
**Data:** 17/11/2026  
**Repositório:** `op` (Branch: `refactor/modular-architecture-and-stability`)  

---

## 1. Matriz de Contribuições ("Quem Resolveu o Quê")

Todas as intervenções técnicas realizadas no código são rastreáveis a commits semânticos individuais e evidenciadas por testes automatizados e logs do `dev.py`.

| ID | Área / Dívida Técnica | Problema Diagnosticado | Solução Implementada | Arquivos Modificados | Commit / Tag Semântica |
|---|---|---|---|---|---|
| **AUT-01** | **Dívida Acidental** | Arquivos temporários, swap do vim, backups soltos (`.swp`, `*.bak`, `.zip`) no repositório. | Limpeza completa dos artefatos mortos e criação de `.gitignore` profissional. | `.gitignore`, remoção de arquivos mortos | `373bbde` (`chore(infra)`) |
| **AUT-02** | **CSS Monolítico** | Arquivo `style.css` monolítico de 3.424 linhas (63KB) e injeção de CSS via DOM no JS. | Decomposição em 9 módulos (`01-tokens.css` a `09-loja.css`), criação do orquestrador `styles/main.css` e remoção de injeção em tempo de execução. | `styles/*.css`, `js/ui/screens/loja.js`, `index.html` | `e4741d8` (`refactor(styles)`) |
| **AUT-03** | **Física e Desacoplamento** | `Cannon-es` desconectado do loop de simulação e arquivo morto `car.js` com assets quebrados. | Integração desacoplada de `createPhysics` e `stepPhysics` no loop principal e remoção de `car.js`. | `js/physics/world.js`, `js/core/loop.js`, `js/main.js` | `854b8c8` (`refactor(core)`) |
| **AUT-04** | **Carregamento e FPS (Performance)** | Carregamento síncrono de 19 animações FBX gigantes (~30MB cada, totalizando ~430MB no boot), travando a thread principal. | Divisão em `CORE_ANIMATIONS` (6 animações essenciais ~2.7MB) e lazy loading assíncrono sob demanda (`carregarAnimacaoSobDemanda`) para one-shots e poses. | `js/game/player.js` | `854b8c8` (`refactor(core)`) |
| **AUT-05** | **Acoplamento e Bugs de Interface** | Chamadas `window.OZ.fecharViewerLoja` quebravam com `TypeError` caso o usuário clicasse antes do render da loja. | Registro preventivo e exportação de `abrirViewerLoja` e `fecharViewerLoja` no ciclo `instalarOZ`. | `js/game/oz/loja.js`, `js/game/oz/index.js` | `854b8c8` (`refactor(core)`) |
| **AUT-06** | **Observabilidade e Métricas Reais** | Ausência de monitoramento de performance em tempo real (FPS, draw calls, geometrias, heap, corpos Cannon e listeners). | Criação de HUD de diagnóstico ativado via `F2`, interceptador de listeners para auditoria de memory leaks e método `window.__debug.getMetrics()`. | `js/debug.js`, `js/core/loop.js` | `854b8c8` (`refactor(core)`) |
| **AUT-07** | **Segurança no dev.py** | Mini-desafio de segurança: tentativas de path traversal e acesso a arquivos restritos. | Implementação e validação de `is_inside_root`, `is_blocked_path`, bloqueio de extensões (`.py`, `.env`, `.log`), checagem de Origin e rate limit. | `dev.py`, `tests/test_security.py` | `3813fa1` (`test(qa)`) |
| **AUT-08** | **Garantia de Qualidade e Regressão** | Risco de quebra de regras de negócio durante o refactor da Missão 01. | Criação de suíte automatizada de testes de regressão (100% de aprovação na matriz de 8 casos). | `tests/test_regression.mjs` | `3813fa1` (`test(qa)`) |

---

## 2. Rastreabilidade das Evidências

1. **Evidência de Performance (Carga de Rede & Boot):**
   - Antes: ~430 MB baixados no boot através de múltiplos arquivos FBX de ~30MB.
   - Depois: ~31 MB baixados no boot (queda de **>92%** no tráfego inicial).
   - Verificável via: `logs/access.log`.

2. **Evidência de Segurança:**
   - 9 testes automatizados passando em `tests/test_security.py` cobrindo path traversal, dot-dot encoding, extensões bloqueadas e cabeçalhos HTTP.
   - Logs de violação registrados com `403 Forbidden` em `logs/security.log`.

3. **Evidência de Estabilidade e Não-Regressão:**
   - 4 testes automatizados em `tests/test_regression.mjs` cobrindo a matriz da Operação Sentinel (Missão 01) com 8/8 casos validados.
   - Zero erros no console do navegador registrados em `logs/errors.log` após o carregamento.

---

## 3. Declaração de Integridade

Declaro que todas as correções de código, otimizações de arquitetura e documentos de engenharia apresentados neste projeto foram desenvolvidos em conformidade com as diretrizes da Unidade Curricular de Manutenção de Sistemas.

**Assinatura:** Derick Sales Setubal  
**Data:** 17 de Novembro de 2026
