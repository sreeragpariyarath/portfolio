import {fileURLToPath} from 'node:url';
const cli=new URL('../node_modules/next/dist/bin/next',import.meta.url);
process.argv=[process.execPath,fileURLToPath(cli),'dev','--hostname','0.0.0.0','--port','4173'];
await import(cli.href);
