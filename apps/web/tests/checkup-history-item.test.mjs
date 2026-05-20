import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// ── T021: CheckupHistoryItem — link condicional e textos pt-BR ────────────────
//
// Valida requisitos do componente via inspeção de código-fonte:
// - Link "Ver relatório" existe SOMENTE para status "completed" com reportId
// - Para status "running" e "failed" não há link clicável
// - Textos de status em pt-BR estão presentes
// - Sem chamadas ao provedor de IA

const src = readFileSync(
  "src/app/checkup/history/components/CheckupHistoryItem.tsx",
  "utf8"
);

// ── Link condicional ──────────────────────────────────────────────────────────

test("CheckupHistoryItem — link 'Ver relatório' existe no componente", () => {
  assert.ok(
    src.includes("Ver relatório"),
    "deve conter o texto 'Ver relatório'"
  );
});

test("CheckupHistoryItem — link para /checkup/{aiRunId} usa item.aiRunId", () => {
  assert.ok(
    src.includes("/checkup/${item.aiRunId}"),
    "deve construir o href como /checkup/${item.aiRunId}"
  );
});

test("CheckupHistoryItem — link só é renderizado quando canOpenReport é true", () => {
  assert.ok(
    src.includes("canOpenReport"),
    "deve usar a variável canOpenReport para controlar o link"
  );
  // canOpenReport deve checar status === "completed" E reportId não-nulo
  assert.ok(
    src.includes('item.status === "completed"'),
    "canOpenReport deve exigir status === 'completed'"
  );
  assert.ok(
    src.includes("item.reportId != null"),
    "canOpenReport deve exigir reportId != null"
  );
});

test("CheckupHistoryItem — para status != completed, elemento de ação não é um link clicável", () => {
  // Quando canOpenReport é false, deve renderizar um <span> não-clicável, não um <Link>
  // O código usa um <span> com cursor-not-allowed quando canOpenReport é false
  assert.ok(
    src.includes("cursor-not-allowed"),
    "deve renderizar elemento não clicável (cursor-not-allowed) para runs sem relatório"
  );
});

test("CheckupHistoryItem — usa o componente Link do Next.js para o link de relatório", () => {
  assert.ok(
    src.includes('import Link from "next/link"'),
    "deve importar Link do next/link para navegação client-side"
  );
});

// ── Textos pt-BR ─────────────────────────────────────────────────────────────

test("CheckupHistoryItem — status 'Concluído' em pt-BR", () => {
  assert.ok(
    src.includes("Concluído"),
    "deve exibir 'Concluído' para status completed"
  );
});

test("CheckupHistoryItem — status 'Em andamento' em pt-BR", () => {
  assert.ok(
    src.includes("Em andamento"),
    "deve exibir 'Em andamento' para status running"
  );
});

test("CheckupHistoryItem — status 'Falhou' em pt-BR", () => {
  assert.ok(
    src.includes("Falhou"),
    "deve exibir 'Falhou' para status failed"
  );
});

test("CheckupHistoryItem — contagem de artefatos em pt-BR", () => {
  assert.ok(
    src.includes("artefato criado") || src.includes("artefatos criados"),
    "deve exibir texto de contagem de artefatos em pt-BR"
  );
});

test("CheckupHistoryItem — estado 'Nenhum artefato' em pt-BR para count === 0", () => {
  assert.ok(
    src.includes("Nenhum artefato"),
    "deve exibir 'Nenhum artefato' quando artifactCount === 0 e status === completed"
  );
});

// ── Segurança ─────────────────────────────────────────────────────────────────

test("CheckupHistoryItem — não contém chamada ao provedor de IA", () => {
  assert.ok(!src.includes("anthropic"), "não deve chamar Anthropic diretamente");
  assert.ok(!src.includes("openai"), "não deve chamar OpenAI diretamente");
});

// ── STATUS_LABEL map cobre os três status esperados ──────────────────────────

test("CheckupHistoryItem — STATUS_LABEL mapeia completed, running e failed", () => {
  assert.ok(
    src.includes("completed:") || src.includes('"completed"'),
    "STATUS_LABEL deve conter chave completed"
  );
  assert.ok(
    src.includes("running:") || src.includes('"running"'),
    "STATUS_LABEL deve conter chave running"
  );
  assert.ok(
    src.includes("failed:") || src.includes('"failed"'),
    "STATUS_LABEL deve conter chave failed"
  );
});
