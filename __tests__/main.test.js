"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const wait_1 = require("../src/wait");
/*
import * as process from 'process'
import * as cp from 'child_process'
import * as path from 'path'
*/
const globals_1 = require("@jest/globals");
(0, globals_1.test)('throws invalid number', () => __awaiter(void 0, void 0, void 0, function* () {
    const input = parseInt('foo', 10);
    yield (0, globals_1.expect)((0, wait_1.wait)(input)).rejects.toThrow('milliseconds not a number');
}));
(0, globals_1.test)('wait 500 ms', () => __awaiter(void 0, void 0, void 0, function* () {
    const start = new Date();
    yield (0, wait_1.wait)(500);
    const end = new Date();
    var delta = Math.abs(end.getTime() - start.getTime());
    (0, globals_1.expect)(delta).toBeGreaterThan(450);
}));
/*
// shows how the runner will run a javascript action with env / stdout protocol
test('test runs', () => {
  process.env['INPUT_MILLISECONDS'] = '500'
  const np = process.execPath
  const ip = path.join(__dirname, '..', 'lib', 'main.js')
  const options: cp.ExecFileSyncOptions = {
    env: process.env
  }
  console.log(cp.execFileSync(np, [ip], options).toString())
})
*/
