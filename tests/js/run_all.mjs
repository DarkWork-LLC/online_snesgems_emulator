import { run as runController } from './controller.test.mjs';
import { run as runOptions } from './options.test.mjs';
import { run as runConfig } from './config.test.mjs';

let totalPassed = 0, totalFailed = 0;

for (const [name, run] of [
    ['controller', runController],
    ['options', runOptions],
    ['config', runConfig],
]) {
    const { passed, failed } = await run();
    totalPassed += passed;
    totalFailed += failed;
}

console.log(`\n=== JS Tests: ${totalPassed} passed, ${totalFailed} failed ===`);
process.exit(totalFailed > 0 ? 1 : 0);