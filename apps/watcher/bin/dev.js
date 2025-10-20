#!/usr/bin/env -S node --loader ts-node/esm --no-warnings=ExperimentalWarning

import { execute, settings } from "@oclif/core";

settings.performanceEnabled = true;

await execute({ development: true, dir: import.meta.url });
