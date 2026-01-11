import path from "node:path";

type ModuleCalls = Record<string, string[]>; // directory where uses modules => modules which are used

export type ModuleToCallers = Record<string, string[]>; // module => directories where use the module

export function resolveRelativeCallTree(
  rawModuleCalls: ModuleCalls,
): ModuleCalls {
  const moduleCalls: ModuleCalls = {};
  for (const [module, thisChildren] of Object.entries(rawModuleCalls)) {
    const absModulePath = path.resolve("/", module);
    const resolvedChildModules = [];
    for (const child of thisChildren) {
      const absChildPath = path.resolve(absModulePath, child);
      const resolved = path.relative("/", absChildPath);
      resolvedChildModules.push(resolved);
    }
    moduleCalls[module] = resolvedChildModules;
  }
  return moduleCalls;
}

export function buildModuleToCallers(
  modulesCalls: ModuleCalls,
): ModuleToCallers {
  function findCallers(module: string): string[] {
    const callers = [];
    for (const [directCaller, modules] of Object.entries(modulesCalls)) {
      if (modules.includes(module)) {
        const parentCallers = findCallers(directCaller);
        callers.push(directCaller, ...parentCallers);
      }
    }
    return callers;
  }

  const moduleToCallers: ModuleToCallers = {};
  const modules = [...new Set(Object.values(modulesCalls).flat())];
  for (const module of modules) {
    if (!moduleToCallers[module]) {
      moduleToCallers[module] = [];
    }
    moduleToCallers[module].push(...findCallers(module));
  }
  return moduleToCallers;
}
