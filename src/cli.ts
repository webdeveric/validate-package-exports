#!/usr/bin/env -S node --experimental-import-meta-resolve
/**
 * DO NOT EDIT
 *
 * `enableCompileCache()` must run before any other module is loaded.
 */
import { enableCompileCache } from 'node:module';

enableCompileCache();

await import('./main.js');
