#!/usr/bin/env node

import { program } from "commander";
import doMain from "./core.mjs";

program
  .option("-s, --source <string>", "待压缩的目录或文件路径")
  .option("-o, --output <string>", "压缩后的目录或文件路径，未指定则使用 -s 指定的目录");

program.parse(process.argv);
const options = program.opts();

const cwd = options.source;
let out = options.output;

if (!cwd) {
    console.error("🚨 请指定待压缩的目录或文件路径");
    process.exit(1);
}

if (!out) {
    out = cwd;
}

doMain(cwd, out);
