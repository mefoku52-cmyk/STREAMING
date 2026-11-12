'use strict';
const { spawn } = require('node:child_process');
class ProcessManager {
  #children = new Set();
  spawn(command,args,opts={}) {
    const child=spawn(command,args,{stdio:['ignore','pipe','pipe'],...opts});
    this.#children.add(child);
    child.once('exit',()=>this.#children.delete(child));
    child.once('error',()=>this.#children.delete(child));
    return child;
  }
  async stop(child, graceMs=4000) {
    if(!child||child.exitCode!==null||child.signalCode!==null)return;
    child.kill('SIGINT');
    await Promise.race([new Promise(r=>child.once('exit',r)),new Promise(r=>setTimeout(r,graceMs))]);
    if(child.exitCode===null&&child.signalCode===null)child.kill('SIGKILL');
  }
  async closeAll(){await Promise.all([...this.#children].map(c=>this.stop(c)));}
  get size(){return this.#children.size;}
}
module.exports={ProcessManager};
