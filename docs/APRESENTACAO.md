# Roteiro de Apresentação e Demonstração Técnica

**Tempo Total:** 5 a 7 minutos de apresentação + 3 minutos de perguntas da banca  
**Projeto:** Refatoração, Estabilidade e Observabilidade do Sistema Sentinel 3D  
**Apresentador:** Derick Sales Setubal  
**Unidade Curricular:** Manutenção de Sistemas 2026.2 — Level 01  

---

## 1. Roteiro Cronometrado (Slide a Slide / Demo)

### [Minuto 0:00 – 1:00] Slide 1: O Cenário Inicial e o Desafio de Manutenção
- **Fala:** *"Boa noite a todos. Recebemos este simulador 3D em WebGL, Three.js e Cannon-es. Visualmente a experiência parecia boa, mas sob o capô tínhamos um cenário clássico de dívida técnica extrema: arquivos temporários espalhados, CSS monolítico de mais de 3.400 linhas, carregamento síncrono bloqueante que baixava mais de 400 MB na inicialização, e a física Cannon-es desvinculada do loop. A nossa missão não foi reescrever o sistema do zero, mas aplicar engenharia de manutenção: diagnosticar com métricas reais, refatorar e comprovar com evidências que nada foi quebrado."*
- **Slide:** Print do código legado (tamanho do `style.css` e o log de download de 400MB de FBX).

### [Minuto 1:00 – 2:30] Slide 2: Auditoria de Dívidas e Diagnóstico
- **Fala:** *"Dividimos nossa auditoria em três frentes:*
  *1. Dívida Acidental: Limpeza de arquivos swap de editores (`.swp`), backups obsoletos (`.bak`), zips redundantes e criação de um `.gitignore` rigoroso.*
  *2. Dívida Estrutural: Decomposição do CSS monolítico em 9 módulos focados dentro de `styles/`, eliminando completamente a injeção dinâmica de CSS no DOM pelo JavaScript.*
  *3. Dívida de Produção: Identificamos que o `player.js` carregava 19 animações FBX gigantes de uma só vez. Cada animação trazia a malha 3D embutida. Isolamos apenas 6 animações essenciais para a locomoção (~2.7MB) e implementamos lazy loading assíncrono sob demanda para poses e one-shots."*
- **Slide:** Tabela comparativa da auditoria e arquitetura de módulos antes vs depois.

### [Minuto 2:30 – 4:00] Slide 3: Observabilidade com `dev.py` e HUD em Tempo Real (Demo)
- **Fala:** *"Um dos pontos centrais da nossa estratégia foi a observabilidade. O servidor `dev.py` atua como centro de comando com SSE Hot Reload e coleta de erros do navegador. Para dar visibilidade instantânea a métricas de produção, criamos no `js/debug.js` um módulo de telemetria acessível pela tecla F2.*
  *(Demonstração ao vivo)*:
  *Ao pressionar F2 na tela, temos em tempo real: FPS estabilizado em 60, Draw Calls reduzidas, contagem de triângulos, geometrias e texturas em VRAM, heap de memória em MB, corpos físicos do Cannon-es e um contador ativo de Event Listeners para garantir que não temos memory leaks ao navegar entre telas."*
- **Ação prática na Demo:** Pressionar `F2` na janela do simulador e abrir o console com `window.__debug.logMetrics()`.

### [Minuto 4:00 – 5:15] Slide 4: O Mini-Desafio de Segurança no `dev.py`
- **Fala:** *"Como parte da resiliência em produção, auditamos a segurança do `dev.py`. O servidor original sofria de vulnerabilidade a path traversal e não restringia arquivos sensíveis. Implementamos validação estrita de fronteira de diretório (`is_inside_root`), lista negra de extensões perigosas (`.py`, `.env`, `.log`, `.key`) e cabeçalhos defensivos como `X-Content-Type-Options: nosniff` e `X-Frame-Options: SAMEORIGIN`.*
  *Comprovamos a eficácia com 9 testes automatizados em Python (`tests/test_security.py`) passando com 100% de sucesso, gerando alertas imediatos no `logs/security.log`."*
- **Slide:** Terminal exibindo `Ran 9 tests in 0.349s ... OK` e log de segurança com `403 Forbidden`.

### [Minuto 5:15 – 6:30] Slide 5: Evidências de Não-Regressão e Conclusão
- **Fala:** *"O maior teste de um engenheiro de manutenção é: 'O refactor quebrou alguma regra de negócio?'. Para provar que não, desenvolvemos a suíte de testes de regressão automatizada `tests/test_regression.mjs`. Todos os 8 cenários da matriz verdade da Missão 01 (Operação Sentinel) foram executados e aprovados.*
  *Em resumo:*
  *- Reduzimos o tráfego inicial de rede de 430 MB para 31 MB (>92% de economia);*
  *- Reduzimos o tempo de boot de 25s para 1.5s;*
  *- Zero erros no console do navegador;*
  *- 100% de cobertura nos testes de segurança e regressão.*
  *Agradeço a atenção e estou à disposição para as perguntas da banca."*

---

## 2. Preparação para os 3 Minutos de Perguntas da Banca (Q&A)

### Pergunta 1: *"Por que vocês escolheram lazy loading para as animações em vez de comprimir os FBX?"*
- **Resposta Técnica:** *"Comprimir os arquivos FBX com gzip/brotli ajudaria no trânsito de rede, mas não resolveria o custo de descompressão e parsing na thread principal do JavaScript do navegador. Cada FBX continha uma malha esquelética duplicada de 30MB. O carregamento sob demanda eliminou o download desnecessário de 13 arquivos no boot, reduzindo a contenção de I/O em mais de 90% sem necessitar de ferramentas externas de reexportação 3D."*

### Pergunta 2: *"Como vocês garantiram que o CSS modular não alterou a identidade visual?"*
- **Resposta Técnica:** *"Criamos `styles/01-tokens.css` como fonte única de verdade (Single Source of Truth) para variáveis e mantivemos os aliases legados que as telas dinâmicas já utilizavam. Escrevemos um script de auditoria que varreu todos os seletores de classe e ID utilizados no HTML e nos scripts JS, comprovando 100% de equivalência entre o antigo `style.css` e a nova arquitetura em 9 arquivos."*

### Pergunta 3: *"Como foi comprovada a ausência de Memory Leaks?"*
- **Resposta Técnica:** *"Auditamos dois eixos: recursos WebGL (geometrias e texturas) e Event Listeners. No `js/debug.js`, interceptamos o protótipo de `EventTarget` para rastrear a contagem de listeners adicionados e removidos. Ao abrir e fechar a loja e as telas da oficina repetidamente, a contagem de listeners retorna ao estado basal estável e o `renderer.info.memory` não apresenta acumulação de texturas ou geometrias órfãs."*

### Pergunta 4: *"O que acontecia no dev.py em caso de Path Traversal?"*
- **Resposta Técnica:** *"Qualquer requisição que tentasse escapar do diretório raiz utilizando `../` ou sua representação codificada `%2e%2e` é resolvida via `Path.resolve()` e verificada contra `is_inside_root()`. Caso esteja fora da raiz pública ou contenha extensões proibidas como `.py` ou `.log`, o servidor imediatamente rejeita a conexão com status HTTP 403 Forbidden e registra o IP e o vetor de ataque em `logs/security.log`."*
