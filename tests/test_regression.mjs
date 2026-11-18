// tests/test_regression.mjs — Testes Automatizados de Regressão das Regras de Negócio
import assert from 'node:assert';
import { avaliar, avaliarTabela, rodarTestes } from '../js/game/evaluator.js';
import { getMissao } from '../js/game/missoes/index.js';
import { listarPersonagens, listarItensLoja, buscarItemLoja } from '../js/game/shop.js';

console.log('='.repeat(60));
console.log('EXECUTANDO TESTES DE REGRESSÃO DE REGRAS DE NEGÓCIO');
console.log('='.repeat(60));

let passed = 0;
let total = 0;

function test(name, fn) {
  total++;
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
  }
}

// 1. Integridade da Missão 01
test('Missão 01 existe e possui metadados corretos', () => {
  const m = getMissao('missao01');
  assert.ok(m, 'Missão 01 deve existir');
  assert.strictEqual(m.id, 'missao01');
  assert.strictEqual(m.titulo, 'Operação Sentinel');
  assert.strictEqual(m.hipoteseCorreta, 'logica');
  assert.ok(Array.isArray(m.tabela) && m.tabela.length === 8, 'Matriz deve conter 8 casos de teste');
  assert.ok(m.expressaoReferencia, 'Deve conter expressão de referência');
});

// 2. Avaliador Lógico da Missão 01
test('Avaliador resolve expressão lógica correta', () => {
  const expr = 'autenticado && estoque && pagamento && !bloqueado';
  const resultado1 = avaliar(expr, { autenticado: true, estoque: true, pagamento: true, bloqueado: false });
  assert.strictEqual(resultado1, true, 'Todas condições satisfeitas deve resultar em TRUE');

  const resultado2 = avaliar(expr, { autenticado: true, estoque: true, pagamento: true, bloqueado: true });
  assert.strictEqual(resultado2, false, 'Bloqueado deve resultar em FALSE');

  const resultado3 = avaliar(expr, { autenticado: false, estoque: true, pagamento: true, bloqueado: false });
  assert.strictEqual(resultado3, false, 'Não autenticado deve resultar em FALSE');
});

// 3. Matriz da Tabela Verdade (8 casos)
test('Avaliador passa 100% dos testes da matriz oficial da Missão 01', () => {
  const m = getMissao('missao01');
  const res = rodarTestes(m.expressaoReferencia, m.tabela);
  assert.ok(res.aprovado, 'Expressão oficial deve passar em todos os testes');
  assert.strictEqual(res.pass, 8, '8 de 8 testes devem passar');
  assert.strictEqual(res.total, 8, 'Total de cenários testados deve ser 8');
});

// 4. Catálogo da Loja e Itens 3D
test('Catálogo da loja contém itens e personagens válidos', () => {
  const chars = listarPersonagens();
  assert.ok(chars.length > 0, 'Deve listar personagens disponíveis');
  assert.ok(chars.some(c => c.id === 'default' && c.nome === 'YBot'), 'YBot padrão deve existir');

  const itens = listarItensLoja();
  assert.ok(itens.length >= 8, 'Catálogo de itens 3D deve conter peças automotivas e mobilidade');

  const motor = buscarItemLoja('motor');
  assert.ok(motor, 'Item motor deve existir');
  assert.strictEqual(motor.categoria, 'automotivo');
});

console.log('-'.repeat(60));
console.log(`RESULTADO: ${passed}/${total} testes de regressão passaram com sucesso.`);
assert.strictEqual(passed, total, 'Todos os testes de regressão devem passar!');
console.log('='.repeat(60));
