/**
 * Live eval: runs every case in the eval set through the real model, applies
 * the code checks, and saves each report to eval-output/ for a human to read.
 *
 *   ANTHROPIC_API_KEY=... npm run eval:reports
 *
 * Not part of CI, so it never spends API credit on a push.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { config } from "dotenv";
import { checkReport } from "../src/reports/evals/check";
import { evalCases } from "../src/reports/evals/cases";
import { groundOutput } from "../src/reports/grounding";
import { AnthropicReportModel } from "../src/reports/model-anthropic";
import { buildUserMessage, PROMPT_VERSION, SYSTEM_PROMPT } from "../src/reports/prompt";

config({ path: ".env.local", quiet: true });

async function main() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is not set");
  const model = new AnthropicReportModel(key, process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5");
  const only = process.argv[2];

  await mkdir("eval-output", { recursive: true });
  let passed = 0;
  const cases = evalCases.filter((c) => !only || c.name === only);

  for (const evalCase of cases) {
    const ids = evalCase.replies.map((_, i) => `case-${i + 1}`);
    const idMap = new Map(ids.map((id, i) => [`r${i + 1}`, id]));
    const user = buildUserMessage(
      evalCase.sermon,
      evalCase.replies.map((r, i) => ({
        id: `r${i + 1}`,
        takeaway: r.takeaway,
        question: r.question ?? null,
      })),
    );

    const started = Date.now();
    const result = await model.run(SYSTEM_PROMPT, user, 4000);
    const seconds = ((Date.now() - started) / 1000).toFixed(1);

    if (!result.output) {
      console.log(
        `FAIL ${evalCase.name} (${seconds}s): no output, stop_reason=${result.stopReason}`,
      );
      continue;
    }

    const { body } = groundOutput(result.output, idMap, []);
    const failures = checkReport(evalCase, body, (i) => `case-${i}`);
    await writeFile(
      `eval-output/${evalCase.name}.json`,
      JSON.stringify({ promptVersion: PROMPT_VERSION, model: model.name, failures, body }, null, 2),
    );

    if (failures.length === 0) passed++;
    console.log(`${failures.length ? "FAIL" : "PASS"} ${evalCase.name} (${seconds}s)`);
    for (const f of failures) console.log(`     - ${f}`);
  }

  console.log(
    `\n${passed}/${cases.length} passed. Read the reports in eval-output/ before trusting the score.`,
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
