import type { GenerateTypeOptions, TeeKoa } from './types';
import fs from 'node:fs';
import KoaRouter from '@koa/router';
import Koa from 'koa';
import { resolve } from 'pathe';
import { getStorage, setStorage } from './storage';
import { loadModule, parseOptions, runSourceMain } from './utils';

export async function bootstrap(_options?: GenerateTypeOptions) {
  const options = await parseOptions(_options);

  const app = new Koa() as TeeKoa.Application;
  const router = new KoaRouter();

  setStorage('app', app);
  setStorage('router', router);

  const { typeDeclarations, sourcePath } = await loadModule(app, router, options);

  app.middlewares ||= {};

  const devOptions = getStorage('devOptions');
  if (devOptions?.isCli) {
    await runSourceMain(devOptions);
  }

  app.use(router.routes()).use(router.allowedMethods());

  if (!getStorage('isProd', false)) {
    fs.writeFileSync(resolve(sourcePath, 'module.d.ts'), typeDeclarations, 'utf-8');
  }

  return { app, router };
}
