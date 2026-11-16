'use strict';
/**
 * Phase 3C audio-diagnostic CDP browser E2E harness (publisher -> viewer WebRTC A/V) for Termux/Android.
 * Test-only harness. No application source changes.
 *
 * Key Phase 3B fixes:
 * - Streaming server on fixed port 8504 (as expected by web/publish.js & web/viewer.js)
 * - Pre-flight port 8504 availability check with diagnostics; safe abort if occupied (no foreign kill)
 * - Removed injected JS hook that rewrote WebSocket URLs
 * - Added CDP diagnostics: console, Runtime.exceptionThrown, Network WebSocket events,
 *   Target/page lifecycle, server logs, signaling close codes, last-successful-step tracking
 */
const { spawn, execSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const net = require('node:net');
const http = require('node:http');
const path = require('node:path');
const WebSocket = require('../backend/node_modules/ws');

const CHROME = '/data/data/com.termux/files/usr/bin/chromium-browser';
const PLATFORM_PY = '/data/data/com.termux/files/home/waste-platform/.venv/bin/python';
const PLATFORM_SCRIPT = '/data/data/com.termux/files/home/waste-platform/scripts/cmep_live_inspection_e2e_server.py';
const SECRET = 'http-adapter-test-secret-0123456789abcdef';
const INTERNAL_KEY = 'internal-key-test-0123456789abcdef0123456789';
const STREAMING_PORT = 8504;
const TOKEN_PATH = `/data/data/com.termux/files/usr/tmp/opencode/cmep-phase3b-tokens-${process.pid}-${Date.now()}.json`;
const RESULT_PATH = '/data/data/com.termux/files/usr/tmp/opencode/phase3c-result.json';

const wait = (ms) => new Promise(r => setTimeout(r, ms));
const now = () => new Date().toISOString();
const log = (...a) => console.log(`[${now()}]`, ...a);
const errlog = (...a) => console.error(`[${now()}][ERR]`, ...a);
const clip = (v, n = 2000) => String(typeof v === 'string' ? v : JSON.stringify(v)).slice(0, n);

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, '127.0.0.1', () => { const p = srv.address().port; srv.close(() => resolve(p)); });
    srv.on('error', reject);
  });
}
function httpGet(url) {
  return new Promise((res, rej) => {
    http.get(url, r => { let d=''; r.on('data',c=>d+=c); r.on('end',()=>res({status:r.statusCode, data:d})); }).on('error', rej);
  });
}
async function httpJson(method, url, body, headers={}) {
  const r = await fetch(url, { method, headers: { 'content-type':'application/json', ...headers }, ...(body?{body:JSON.stringify(body)}:{}) });
  const t = await r.text(); let j=null; try{j=JSON.parse(t);}catch{}
  return {status:r.status, json:j, text:t};
}
function sh(cmd) { try { return execSync(cmd, {encoding:'utf8', stdio:['ignore','pipe','pipe'], timeout:5000}); } catch(e){ return (e.stdout||'') + (e.stderr||'') + (e.message||''); } }

function portDiagnostics(port) {
  return {
    port,
    ss: sh(`ss -ltnp 2>/dev/null | grep ':${port}' || true`),
    netstat: sh(`netstat -ltnp 2>/dev/null | grep ':${port}' || true`),
    lsof: sh(`lsof -iTCP:${port} -sTCP:LISTEN -Pn 2>/dev/null || true`),
    procNetTcp: sh(`cat /proc/net/tcp /proc/net/tcp6 2>/dev/null | head -50 || true`),
    ps: sh(`ps -ef 2>/dev/null | head -40 || ps aux 2>/dev/null | head -40 || true`),
  };
}
async function isPortListening(port, host='127.0.0.1') {
  return await new Promise(resolve => {
    const s = net.createConnection({port, host}, () => { s.destroy(); resolve(true); });
    s.on('error', () => resolve(false));
    s.setTimeout(1000, () => { s.destroy(); resolve(false); });
  });
}

async function startStreamingServer(port, platformBase, serverLogs) {
  const runtimeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cmep-phase3b-rt-'));
  const child = spawn(process.execPath, [path.join(__dirname, '..', 'backend', 'src', 'index.js')], {
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, SIGNALING_PORT:String(port), SESSION_SIGNING_SECRET:SECRET, RUNTIME_DIR:runtimeDir, LOG_LEVEL:'info', LOG_FORMAT:'text', CMEP_ADAPTER:'http', CMEP_PLATFORM_URL:platformBase, CMEP_INTERNAL_API_KEY:INTERNAL_KEY, ENABLE_RECORDER:'0' },
    stdio:['ignore','pipe','pipe']
  });
  const push=(kind,d)=>{ const s=d.toString(); serverLogs.streaming.push({t:now(),kind,msg:s}); };
  child.stdout.on('data',d=>push('stdout',d));
  child.stderr.on('data',d=>push('stderr',d));
  child.on('exit',(code,signal)=>serverLogs.streaming.push({t:now(),kind:'exit',msg:`code=${code} signal=${signal}`}));
  for (let i=0;i<120;i++) {
    await wait(500);
    try { const r=await fetch(`http://127.0.0.1:${port}/healthz`); if(r.ok) return {child,runtimeDir}; } catch {}
    if (child.exitCode !== null) throw new Error('streaming exited '+child.exitCode+' '+tailLogs(serverLogs.streaming));
  }
  throw new Error('streaming boot timeout '+tailLogs(serverLogs.streaming));
}

async function startPlatform(streamingPort, platformPort, serverLogs) {
  try{fs.unlinkSync(TOKEN_PATH);}catch{}
  const child = spawn(PLATFORM_PY, [PLATFORM_SCRIPT], {
    cwd: '/data/data/com.termux/files/home/waste-platform',
    env: { ...process.env, E2E_TOKENS_PATH:TOKEN_PATH, E2E_PORT:String(platformPort), CMEP_STREAMING_SIGNING_SECRET:SECRET, CMEP_INTERNAL_API_KEY:INTERNAL_KEY, CMEP_STREAMING_PUBLIC_URL:`http://127.0.0.1:${streamingPort}`, CMEP_STREAMING_INTERNAL_URL:`http://127.0.0.1:${streamingPort}` },
    stdio:['ignore','pipe','pipe']
  });
  const push=(kind,d)=>{ serverLogs.platform.push({t:now(),kind,msg:d.toString()}); };
  child.stdout.on('data',d=>push('stdout',d));
  child.stderr.on('data',d=>push('stderr',d));
  child.on('exit',(code,signal)=>serverLogs.platform.push({t:now(),kind:'exit',msg:`code=${code} signal=${signal}`}));
  const start=Date.now();
  while(Date.now()-start < 180000){
    if(child.exitCode!==null) throw new Error('platform exited '+child.exitCode+' '+tailLogs(serverLogs.platform));
    if(fs.existsSync(TOKEN_PATH)) return {child};
    await wait(500);
  }
  throw new Error('platform token timeout '+tailLogs(serverLogs.platform));
}
async function waitTokens(ms=180000){
  const s=Date.now(); while(Date.now()-s<ms){ try{ if(fs.existsSync(TOKEN_PATH)) return JSON.parse(fs.readFileSync(TOKEN_PATH,'utf8')); }catch{} await wait(400);} throw new Error('no tokens');
}
function tailLogs(arr, n=40){ return clip(arr.slice(-n).map(x=>`[${x.t} ${x.kind}] ${x.msg}`).join(''), 4000); }

class CDP {
  constructor(wsUrl){ this.ws=new WebSocket(wsUrl); this.id=0; this.pend=new Map(); this.listeners=[]; }
  static async connect(wsUrl, timeoutMs=15000){
    const c=new CDP(wsUrl);
    await new Promise((res,rej)=>{ const to=setTimeout(()=>rej(new Error('cdp connect timeout')),timeoutMs); c.ws.on('open',()=>{clearTimeout(to);res();}); c.ws.on('error',(e)=>{clearTimeout(to);rej(e);}); });
    c.ws.on('message',d=>{
      let m; try{ m=JSON.parse(d.toString()); }catch{return;}
      if(m.id && c.pend.has(m.id)){
        const p=c.pend.get(m.id); c.pend.delete(m.id); clearTimeout(p.t);
        m.error?p.rej(new Error((p.method||'cdp')+':'+JSON.stringify(m.error))):p.res(m.result);
      } else {
        for(const fn of c.listeners){ try{ fn(m); }catch{} }
      }
    });
    return c;
  }
  on(fn){ this.listeners.push(fn); }
  call(method, params={}, {sessionId=null, timeoutMs=30000}={}){
    const id=++this.id; const msg={id,method,params}; if(sessionId) msg.sessionId=sessionId;
    return new Promise((res,rej)=>{
      const t=setTimeout(()=>{ if(this.pend.has(id)){this.pend.delete(id); rej(new Error('timeout '+method));}},timeoutMs);
      this.pend.set(id,{res,rej,t,method});
      try{this.ws.send(JSON.stringify(msg));}catch(e){clearTimeout(t);this.pend.delete(id);rej(e);}
    });
  }
  async eval(expression, {sessionId=null, awaitPromise=false, timeoutMs=30000}={}){
    const r=await this.call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise},{sessionId,timeoutMs});
    if(r.exceptionDetails) throw new Error('eval exception: '+JSON.stringify(r.exceptionDetails).slice(0,1200));
    return r.result ? r.result.value : undefined;
  }
  close(){ try{this.ws.close();}catch{} }
}

// Minimal hook for stats capture only (NO WebSocket URL rewriting)
const STATS_HOOK = `(()=>{
  try{
    window.__cmep = window.__cmep || {pcs:[], transports:[], trace:[], consumers:[]};
    const push=(ev)=>{ try{ ev.t=Date.now(); window.__cmep.trace.push(ev); }catch(e){} };
    window.__cmepPushTrace = push;
    const reg=(pc,meta)=>{ if(!pc) return; if(!window.__cmep.pcs.some(x=>x.pc===pc)) { window.__cmep.pcs.push({pc,meta,at:Date.now()}); push({type:'pc',meta}); } };
    const Orig=window.RTCPeerConnection;
    if(Orig && !Orig.__cmepHooked){
      window.RTCPeerConnection=function(...a){ const pc=new Orig(...a); reg(pc,{ctor:true}); return pc; };
      window.RTCPeerConnection.prototype=Orig.prototype;
      try{ Object.getOwnPropertyNames(Orig).forEach(k=>{try{ if(!(k in window.RTCPeerConnection)) window.RTCPeerConnection[k]=Orig[k]; }catch{}});}catch{}
      window.RTCPeerConnection.__cmepHooked=true;
    }
    const tryWrap=()=>{
      try{
        const D=window.mediasoupClient && window.mediasoupClient.Device && window.mediasoupClient.Device.prototype;
        if(D && !D.__cmepHooked){
          const wrap=(name,dir)=>{ const o=D[name]; if(typeof o!=='function') return; D[name]=function(...a){ const t=o.apply(this,a); try{ window.__cmep.transports.push({dir,name,t,id:(t&&t.id)||null}); if(t&&t._handler&&t._handler._pc) reg(t._handler._pc,{dir,name,id:(t&&t.id)||null}); push({type:'transport',dir,name,id:(t&&t.id)||null}); }catch{} return t; }; };
          wrap('createSendTransport','send'); wrap('createRecvTransport','recv'); D.__cmepHooked=true;
        }
      }catch(e){}
      try{
        // instrument CmepRpcClient.request and onEvent once instances appear
        if(window.CmepRpcClient && window.CmepRpcClient.prototype && !window.CmepRpcClient.prototype.__cmepHooked){
          const origReq=window.CmepRpcClient.prototype.request;
          window.CmepRpcClient.prototype.request=function(method,data,opts){
            push({type:'rpc_req',method,data});
            const p=origReq.call(this,method,data,opts);
            return p.then(res=>{ push({type:'rpc_res',method,res}); return res; }, err=>{ push({type:'rpc_err',method,error:String(err&&err.message||err)}); throw err; });
          };
          const origConn=window.CmepRpcClient.prototype.connect;
          window.CmepRpcClient.prototype.connect=function(){
            const p=origConn.call(this);
            // wrap onEvent after connect assignment in app
            setTimeout(()=>{
              try{
                if(this.onEvent && !this.__cmepEventWrapped){
                  const oe=this.onEvent; this.onEvent=(ev,d)=>{ push({type:'event',ev,data:d}); return oe(ev,d); }; this.__cmepEventWrapped=true;
                }
              }catch(e){}
            },0);
            return p.then(()=>{ setTimeout(()=>{ try{ if(this.onEvent && !this.__cmepEventWrapped){ const oe=this.onEvent; this.onEvent=(ev,d)=>{ push({type:'event',ev,data:d}); return oe(ev,d); }; this.__cmepEventWrapped=true; } }catch(e){} },50); return; });
          };
          window.CmepRpcClient.prototype.__cmepHooked=true;
        }
      }catch(e){}
    };
    tryWrap(); setInterval(tryWrap,200);
  }catch(e){}
})();`;

// Injected into page to observe WebSocket lifecycle (no URL rewrite)
const WS_OBS_HOOK = `(()=>{
  try{
    window.__cmepWs = window.__cmepWs || {urls:[], events:[]};
    const RealWS = window.WebSocket;
    if(RealWS && !RealWS.__cmepObs){
      const W=function(url,protocols){
        let u=''; try{ u=String(url); }catch{ u=''+url; }
        try{ window.__cmepWs.urls.push({url:u,t:Date.now()}); }catch(e){}
        const ws = protocols!==undefined? new RealWS(url,protocols): new RealWS(url);
        try{ ws.addEventListener('open',()=>{ try{ window.__cmepWs.events.push({type:'open',url:u,t:Date.now()}); }catch(e){} }); }catch(e){}
        try{ ws.addEventListener('close',ev=>{ try{ window.__cmepWs.events.push({type:'close',url:u,code:ev.code,reason:ev.reason,wasClean:ev.wasClean,t:Date.now()}); }catch(e){} }); }catch(e){}
        try{ ws.addEventListener('error',()=>{ try{ window.__cmepWs.events.push({type:'error',url:u,t:Date.now()}); }catch(e){} }); }catch(e){}
        return ws;
      };
      W.prototype=RealWS.prototype;
      try{ ['CONNECTING','OPEN','CLOSING','CLOSED'].forEach(k=>{ if(k in RealWS) W[k]=RealWS[k]; }); }catch(e){}
      try{ Object.getOwnPropertyNames(RealWS).forEach(k=>{ try{ if(!(k in W)) W[k]=RealWS[k]; }catch{} }); }catch(e){}
      W.__cmepObs=true; window.WebSocket=W;
    }
  }catch(e){}
})();`;

function num(v){ return (typeof v==='number' && isFinite(v)) ? v : 0; }

async function main(){
  const result={
    startedAt:now(), env:{node:process.version, chrome:CHROME}, steps:[], errors:[],
    diagnostics:{browser:{console:[],exceptions:[],wsNetwork:[],pageEvents:[],targets:[]}, serverLogs:{streaming:[],platform:[]}},
    lastSuccessfulStep:null, verdict:'NOT TESTED'
  };
  const serverLogs = result.diagnostics.serverLogs;
  let platformProc, streamSrv, chrome, browser;
  const setStep=(name,data)=>{ result.lastSuccessfulStep=name; result.steps.push({t:now(),step:name,...(data||{})}); log('STEP',name, data?clip(data,500):''); };

  const cleanup=async()=>{
    try{ if(browser) browser.close(); }catch{}
    try{ if(chrome) chrome.kill('SIGKILL'); }catch{}
    try{ if(streamSrv&&streamSrv.child) streamSrv.child.kill('SIGTERM'); }catch{}
    try{ if(platformProc) platformProc.kill('SIGTERM'); }catch{}
    await wait(1200);
    try{ if(streamSrv&&streamSrv.child) streamSrv.child.kill('SIGKILL'); }catch{}
    try{ if(platformProc) platformProc.kill('SIGKILL'); }catch{}
  };
  const fail=(stage,msg,extra)=>{ errlog(stage,msg, extra?clip(extra,600):''); result.errors.push({t:now(),stage,msg,extra: extra===undefined?undefined: clip(extra,2000)}); };

  try{
    if(!fs.existsSync(CHROME)) throw new Error('chromium not found: '+CHROME);

    // 1) Port 8504 pre-flight
    setStep('preflight_port_8504_check_start');
    const listening = await isPortListening(STREAMING_PORT);
    if(listening){
      const diag = portDiagnostics(STREAMING_PORT);
      result.port8504 = {occupied:true, diagnostics:diag};
      setStep('preflight_port_8504_occupied', {occupied:true});
      fail('preflight_port_8504', 'Port 8504 is occupied. Safe abort (no foreign process killed).', diag);
      result.verdict = 'NOT TESTED';
      result.abortReason = 'port_8504_occupied';
      return result;
    }
    setStep('preflight_port_8504_free', {port:STREAMING_PORT});

    const platformPort = await freePort();
    setStep('ports_allocated', {streamingPort:STREAMING_PORT, platformPort});

    // 2) Platform (dynamic port)
    setStep('platform_start');
    const plat = await startPlatform(STREAMING_PORT, platformPort, serverLogs); platformProc=plat.child;
    const tokens = await waitTokens();
    const base = tokens.baseUrl;
    setStep('platform_ready', {base, tokenKeys:Object.keys(tokens)});

    // 3) Create inspection via platform API (real auth flow)
    setStep('inspection_create_request');
    const create = await httpJson('POST', `${base}/api/v1/inspections`, {listingId: tokens.listingId}, {authorization:`Bearer ${tokens.ownerToken}`});
    if(create.status!==201) throw new Error('create inspection failed '+create.status+' '+clip(create.text,800));
    const inspectionId = create.json.inspection.id;
    const pubUrl = new URL(create.json.publishUrl);
    const pubToken = pubUrl.searchParams.get('token');
    const offer = pubUrl.searchParams.get('offer');
    if(!pubToken||!offer) throw new Error('missing publish token/offer in '+create.json.publishUrl);
    setStep('inspection_created', {inspectionId, publishOrigin:pubUrl.origin, hasToken:!!pubToken, offer});

    // 4) Streaming on fixed 8504
    setStep('streaming_start');
    streamSrv = await startStreamingServer(STREAMING_PORT, base, serverLogs);
    setStep('streaming_booted');

    // verify HTTP 8504
    let healthResp=null;
    try{ healthResp = await httpGet(`http://127.0.0.1:${STREAMING_PORT}/healthz`); }catch(e){ healthResp={error:e.message}; }
    setStep('streaming_http_health_check', healthResp && {status:healthResp.status, body:clip(healthResp.data,400)});
    if(!healthResp || healthResp.status!==200) throw new Error('streaming /healthz not OK on 8504: '+clip(healthResp));

    // verify WS /ws on 8504 (unauth should close 4401 unauthorized, proving endpoint reachable)
    let wsProbe={};
    try{
      wsProbe = await new Promise((resolve)=>{
        const ws = new WebSocket(`ws://127.0.0.1:${STREAMING_PORT}/ws`);
        const to=setTimeout(()=>{ try{ws.terminate();}catch{} resolve({timeout:true}); }, 6000);
        ws.on('open',()=>{ clearTimeout(to); try{ws.close();}catch{} resolve({opened:true}); });
        ws.on('close',(code,reason)=>{ clearTimeout(to); resolve({closed:true, code, reason: reason?reason.toString():''}); });
        ws.on('error',(e)=>{ clearTimeout(to); resolve({error:e.message}); });
      });
    }catch(e){ wsProbe={exception:e.message}; }
    setStep('streaming_ws_probe', wsProbe);

    // 5) Chromium CDP (dynamic port)
    const cdpPort = await freePort();
    setStep('chrome_launch', {cdpPort});
    chrome = spawn(CHROME, [
      '--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
      '--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream',
      '--autoplay-policy=no-user-gesture-required',
      `--remote-debugging-port=${cdpPort}`,'--remote-allow-origins=*','about:blank'
    ], {stdio:['ignore','pipe','pipe']});
    chrome.stdout.on('data',d=>serverLogs.streaming.push({t:now(),kind:'chrome-stdout',msg:d.toString()}));
    chrome.stderr.on('data',d=>serverLogs.streaming.push({t:now(),kind:'chrome-stderr',msg:d.toString()}));
    chrome.on('exit',(code,signal)=>serverLogs.streaming.push({t:now(),kind:'chrome-exit',msg:`code=${code} signal=${signal}`}));

    let browserWs=null;
    for(let i=0;i<100;i++){
      await wait(400);
      try{ const v=JSON.parse((await httpGet(`http://127.0.0.1:${cdpPort}/json/version`)).data); if(v.webSocketDebuggerUrl){ browserWs=v.webSocketDebuggerUrl; break; } }catch{}
      if(chrome.exitCode!==null) throw new Error('chrome exited '+chrome.exitCode);
    }
    if(!browserWs) throw new Error('no browser ws endpoint from /json/version');
    browser = await CDP.connect(browserWs);
    setStep('chrome_cdp_connected', {browserWs});

    // Global target/page diagnostics
    browser.on((m)=>{
      if(!m.method) return;
      const ev={t:now(), method:m.method, params:m.params};
      if(m.method.startsWith('Target.')) result.diagnostics.browser.targets.push(ev);
    });

    async function createPage(label){
      const ctx = await browser.call('Target.createBrowserContext', {disposeOnDetach:true});
      const browserContextId = ctx.browserContextId;
      const target = await browser.call('Target.createTarget', {url:'about:blank', browserContextId});
      const att = await browser.call('Target.attachToTarget', {targetId: target.targetId, flatten:true});
      const sessionId = att.sessionId;
      const pageDiag={label, sessionId, targetId:target.targetId, console:[], exceptions:[], wsNetwork:[], pageEvents:[], logs:[]};
      result.diagnostics.browser.pageEvents.push({t:now(),label,event:'created', browserContextId, targetId:target.targetId, sessionId});

      browser.on((m)=>{
        if(!m.method || m.sessionId!==sessionId) return;
        const e={t:now(),label,method:m.method,params:m.params};
        if(m.method==='Runtime.consoleAPICalled') pageDiag.console.push(e);
        else if(m.method==='Runtime.exceptionThrown') pageDiag.exceptions.push(e);
        else if(m.method==='Network.webSocketCreated'||m.method==='Network.webSocketWillSendHandshakeRequest'||m.method==='Network.webSocketHandshakeResponseReceived'||m.method==='Network.webSocketFrameSent'||m.method==='Network.webSocketFrameReceived'||m.method==='Network.webSocketClosed'||m.method==='Network.webSocketFrameError') pageDiag.wsNetwork.push(e);
        else if(m.method.startsWith('Page.')||m.method.startsWith('Target.')||m.method==='Runtime.executionContextCreated') pageDiag.pageEvents.push(e);
      });

      await browser.call('Runtime.enable', {}, {sessionId}).catch(()=>{});
      await browser.call('Page.enable', {}, {sessionId}).catch(()=>{});
      await browser.call('Network.enable', {}, {sessionId}).catch(()=>{});
      await browser.call('Log.enable', {}, {sessionId}).catch(()=>{});
      // Inject hooks (NO WS URL rewrite). Stats + WS observation.
      await browser.call('Page.addScriptToEvaluateOnNewDocument', {source: STATS_HOOK + '\n' + WS_OBS_HOOK}, {sessionId}).catch(()=>{});
      // Also evaluate now for current blank page
      await browser.call('Runtime.evaluate', {expression: STATS_HOOK + '\n' + WS_OBS_HOOK}, {sessionId}).catch(()=>{});

      return {label,browserContextId,targetId:target.targetId,sessionId,diag:pageDiag};
    }

    const navEval=(p,expr,opts={})=>browser.eval(expr,{sessionId:p.sessionId,...opts});
    const diagCollectExpr = `(async()=>{
      const out={role:(location.pathname||''),url:location.href.split('?')[0],time:Date.now(),state:null,transports:{},consumed:new Set(),errors:[],trace:(window.__cmep&&window.__cmep.trace||[]).slice(-200),ws:(window.__cmepWs||null),audioEls:[],allMediaEls:[],remoteVideo:null,remoteAudio:null,pcDetails:[],msConsumers:null,pcCount:0};
      try{ out.state={status:document.querySelector('#state')?.textContent,conn:document.querySelector('#connState')?.textContent,call:document.querySelector('#callState')?.textContent,cam:document.querySelector('#camState')?.textContent}; }catch(e){}
      try{ out.globals={roomId:(typeof roomId!=='undefined'?roomId:null),joined:(typeof joined!=='undefined'?joined:null),producers:(typeof producers!=='undefined'&&Array.isArray(producers)?producers.map(p=>({id:p.id,kind:p.kind,closed:!!p.closed,paused:!!p.paused,track:!!p.track})):null),recvTransport:!!(typeof recvTransport!=='undefined'&&recvTransport),sendTransport:!!(typeof sendTransport!=='undefined'&&sendTransport),consumedIds:(typeof consumedProducerIds!=='undefined'&&consumedProducerIds&&typeof consumedProducerIds.values==='function')?[...consumedProducerIds]:null,knownConsumers:(typeof knownConsumers!=='undefined'&&knownConsumers&&typeof knownConsumers.entries==='function')?[...knownConsumers.entries()]:null}; }catch(e){out.errors.push('globals:'+e.message)}
      const collectTracks=(s)=>s?s.getTracks().map(t=>({kind:t.kind,id:t.id,label:t.label,readyState:t.readyState,enabled:t.enabled,muted:t.muted})):null;
      try{ const v=document.querySelector('#remote'); if(v) out.remoteVideo={id:v.id,srcObject:!!v.srcObject,paused:v.paused,muted:v.muted,readyState:v.readyState,videoWidth:v.videoWidth,videoHeight:v.videoHeight,currentTime:v.currentTime,tracks:v.srcObject?collectTracks(v.srcObject):null}; }catch(e){out.errors.push('rv:'+e.message)}
      try{ const a=document.querySelector('#remoteAudio'); if(a) out.remoteAudio={id:a.id,srcObject:!!a.srcObject,paused:a.paused,muted:a.muted,readyState:a.readyState,currentTime:a.currentTime,volume:a.volume,tracks:a.srcObject?collectTracks(a.srcObject):null,playState:{autoplay:a.autoplay}}; }catch(e){out.errors.push('ra:'+e.message)}
      try{ const els=[...document.querySelectorAll('audio,video')]; out.allMediaEls=els.map(el=>({tag:el.tagName.toLowerCase(),id:el.id,srcObject:!!el.srcObject,paused:el.paused,muted:el.muted,readyState:el.readyState,currentTime:el.currentTime,videoWidth:el.videoWidth||0,videoHeight:el.videoHeight||0,tracks:el.srcObject?collectTracks(el.srcObject):null})); }catch(e){out.errors.push('els:'+e.message)}
      try{
        if(typeof recvTransport!=='undefined'&&recvTransport){
          let cons=null; try{ if(recvTransport._consumers && typeof recvTransport._consumers.values==='function') cons=[...recvTransport._consumers.values()]; else if(recvTransport.consumers && typeof recvTransport.consumers.values==='function') cons=[...recvTransport.consumers.values()]; }catch(e){}
          out.transports.recv={id:recvTransport.id,closed:!!recvTransport.closed,connectionState:recvTransport.connectionState,appData:recvTransport.appData||null,consumers: cons?cons.map(c=>({id:c.id,kind:c.kind,producerId:c.producerId,paused:!!c.paused,closed:!!c.closed,track: c.track?{id:c.track.id,kind:c.track.kind,readyState:c.track.readyState,enabled:c.track.enabled,muted:c.track.muted,label:c.track.label}:null})):null,consumerKeys: cons?null:(recvTransport._consumers?Object.keys(recvTransport._consumers):null)};
        }
      }catch(e){out.errors.push('rt:'+e.message)}
      try{ if(typeof sendTransport!=='undefined'&&sendTransport){ out.transports.send={id:sendTransport.id,closed:!!sendTransport.closed,connectionState:sendTransport.connectionState}; } }catch(e){}
      const pcs=[]; const seen=new Set(); const add=(pc,src)=>{ if(!pc||seen.has(pc))return; seen.add(pc); pcs.push({pc,src}); };
      try{ if(typeof sendTransport!=='undefined'&&sendTransport&&sendTransport._handler&&sendTransport._handler._pc) add(sendTransport._handler._pc,'send._handler'); }catch(e){}
      try{ if(typeof recvTransport!=='undefined'&&recvTransport&&recvTransport._handler&&recvTransport._handler._pc) add(recvTransport._handler._pc,'recv._handler'); }catch(e){}
      try{ if(window.__cmep&&Array.isArray(window.__cmep.pcs)) for(const x of window.__cmep.pcs) add(x.pc,'hook'); }catch(e){}
      out.pcCount=pcs.length;
      for(const {pc,src} of pcs){
        try{
          const st=await pc.getStats(); const arr=[]; st.forEach(v=>arr.push(v));
          const inbound=arr.filter(e=>e.type==='inbound-rtp'&&!e.isRemote).map(e=>({kind:e.kind||e.mediaType,ssrc:e.ssrc,bytesReceived:e.bytesReceived,packetsReceived:e.packetsReceived,framesDecoded:e.framesDecoded,packetsLost:e.packetsLost,jitter:e.jitter,audioLevel:e.audioLevel,totalAudioEnergy:e.totalAudioEnergy,trackIdentifier:e.trackIdentifier}));
          const outbound=arr.filter(e=>e.type==='outbound-rtp'&&!e.isRemote).map(e=>({kind:e.kind||e.mediaType,ssrc:e.ssrc,bytesSent:e.bytesSent,packetsSent:e.packetsSent,framesEncoded:e.framesEncoded}));
          const tracks=arr.filter(e=>e.type==='track').map(e=>({kind:e.kind,remoteSource:e.remoteSource,detached:e.detached,ended:e.ended}));
          const pairs=arr.filter(e=>e.type==='candidate-pair'&&(e.selected||e.nominated||e.state==='succeeded')).map(e=>({state:e.state,nominated:e.nominated,selected:e.selected,bytesSent:e.bytesSent,bytesReceived:e.bytesReceived,currentRoundTripTime:e.currentRoundTripTime}));
          const receivers=arr.filter(e=>e.type==='receiver').map(e=>({kind:e.kind,trackIdentifier:e.trackIdentifier}));
          out.pcDetails.push({src,ice:pc.iceConnectionState,dtls:pc.connectionState,signaling:pc.signalingState,inbound,outbound,tracks,pairs,receivers});
        }catch(e){out.errors.push('pc:'+src+':'+e.message)}
      }
      return out;
    })()`;
    async function navigate(p,url,timeoutMs=45000){
      await browser.call('Page.navigate',{url},{sessionId:p.sessionId,timeoutMs:25000});
      const start=Date.now();
      while(Date.now()-start<timeoutMs){
        await wait(300);
        try{ const rs=await navEval(p,'document.readyState'); if(rs==='complete'||rs==='interactive') return rs; }catch{}
      }
      return 'timeout';
    }

    const pubPage = await createPage('publisher');
    const viewPage = await createPage('viewer');
    // mirror page diags into result
    result.diagnostics.browser.publisher = pubPage.diag;
    result.diagnostics.browser.viewer = viewPage.diag;
    setStep('contexts_created', {publisher:{context:pubPage.browserContextId,target:pubPage.targetId}, viewer:{context:viewPage.browserContextId,target:viewPage.targetId}});

    // 6) Publisher page
    const publishPageUrl = `http://127.0.0.1:${STREAMING_PORT}/publish.html?token=${encodeURIComponent(pubToken)}&offer=${encodeURIComponent(offer)}&auto=1`;
    setStep('publisher_navigate', {url:publishPageUrl.replace(pubToken,'<redacted>')});
    await navigate(pubPage, publishPageUrl);
    await wait(2000);

    // Observe publisher WS creation/open/close from page + CDP network
    let pubRoomId=null;
    for(let i=0;i<120;i++){
      await wait(500);
      const st = await navEval(pubPage, `(()=>{try{return {state:document.querySelector('#state')?.textContent,conn:document.querySelector('#connState')?.textContent,acceptDis:document.querySelector('#accept')?.disabled,viewer:document.querySelector('#accept')?.dataset?.viewer||'',room:(typeof roomId!=='undefined'?roomId:null),producers:(typeof producers!=='undefined'?producers.length:null),stream:!!(typeof stream!=='undefined'&&stream&&stream.getTracks&&stream.getTracks().length),send:!!(typeof sendTransport!=='undefined'&&sendTransport),wsObs:(window.__cmepWs||null),wsUrlGlobal:(typeof wsUrl!=='undefined'?wsUrl:null)};}catch(e){return {err:e.message};}})()`).catch(e=>({evalErr:e.message}));
      if(i%8===0) log('pub', {state:st.state,conn:st.conn,room:st.room,producers:st.producers,wsUrls:st.wsObs&&st.wsObs.urls,wsEv:st.wsObs&&st.wsObs.events,wsUrlGlobal:st.wsUrlGlobal});
      if(st && st.wsObs && Array.isArray(st.wsObs.urls) && st.wsObs.urls.length>0) setStep('publisher_ws_created', {urls:st.wsObs.urls, events:st.wsObs.events});
      if(st && st.wsObs && Array.isArray(st.wsObs.events) && st.wsObs.events.some(e=>e.type==='open')) setStep('publisher_ws_open', {events:st.wsObs.events});
      if(st && st.wsObs && Array.isArray(st.wsObs.events) && st.wsObs.events.some(e=>e.type==='close')) setStep('publisher_ws_closed', {events:st.wsObs.events});
      if(st && st.room) pubRoomId=st.room;
      if(st && st.room) setStep('publisher_createRoom_ok', {roomId:st.room, state:st.state, producers:st.producers, conn:st.conn});
      if(st && st.room && st.producers>=1 && /aktívna|Čakám/i.test(st.state||'')) { setStep('publisher_active_producing', st); break; }
      if(st && /Chyba:|zlyhal|odmietnut|expirovala|nie je možné/i.test(st.state||'')) { fail('publisher', st.state, st); break; }
    }
    if(!pubRoomId) pubRoomId = await navEval(pubPage,'(typeof roomId!=="undefined"?roomId:null)').catch(()=>null);

    // Collect publisher early detail
    const pubEarly = await navEval(pubPage, `(()=>{try{
      const s=(typeof stream!=='undefined')?stream:null;
      return {state:document.querySelector('#state')?.textContent,conn:document.querySelector('#connState')?.textContent,call:document.querySelector('#callState')?.textContent,room:(typeof roomId!=='undefined'?roomId:null),joined:(typeof joined!=='undefined'?joined:null),creating:(typeof creating!=='undefined'?creating:null),reconnecting:(typeof reconnecting!=='undefined'?reconnecting:null),attempts:(typeof reconnectAttempts!=='undefined'?reconnectAttempts:null),producers:(typeof producers!=='undefined'&&producers)?producers.map(p=>({id:p.id,kind:p.kind,closed:!!p.closed,paused:!!p.paused})):null,send:!!(typeof sendTransport!=='undefined'&&sendTransport),recv:!!(typeof recvTransport!=='undefined'&&recvTransport),localTracks:s?s.getTracks().map(t=>({kind:t.kind,readyState:t.readyState,enabled:t.enabled,muted:t.muted,label:t.label})):null,wsObs:(window.__cmepWs||null),wsUrlGlobal:(typeof wsUrl!=='undefined'?wsUrl:null)};
    }catch(e){return {err:e.message};}})()`).catch(e=>({evalErr:e.message}));
    result.publisherEarly = pubEarly;

    if(!pubRoomId){
      fail('publisher_createRoom', 'publisher did not create room', pubEarly);
      result.abortReason = result.abortReason || 'publisher_no_room';
      // still collect cleanup info below
    } else {
      // wait platform room_id propagation
      for(let i=0;i<40;i++){
        const g = await httpJson('GET', `${base}/api/v1/inspections/${inspectionId}`, null, {authorization:`Bearer ${tokens.ownerToken}`});
        if(g.status===200 && g.json && g.json.data && g.json.data.roomId){ pubRoomId=g.json.data.roomId; setStep('room_bound_on_platform', {roomId:pubRoomId, state:g.json.data.state}); break; }
        await wait(300);
      }

      // 7) Viewer platform join to get token/room
      setStep('viewer_platform_join_request');
      let join=null;
      for(let i=0;i<50;i++){
        join = await httpJson('POST', `${base}/api/v1/inspections/join`, {inspectionId, waitRoomSeconds:8}, {authorization:`Bearer ${tokens.viewerToken}`});
        if(join.status===200) break; await wait(500);
      }
      if(!join || join.status!==200){ fail('viewer_platform_join','join failed '+(join&&join.status), join&&join.text); }
      else {
        const viewerUrl = join.json.viewerUrl;
        const vParsed = new URL(viewerUrl);
        const viewToken = vParsed.searchParams.get('token');
        const viewRoom = vParsed.searchParams.get('room') || join.json.roomId || pubRoomId;
        if(!viewToken||!viewRoom){ fail('viewer_platform_join','missing viewer token/room', viewerUrl); }
        else {
          setStep('viewer_platform_join_ok', {roomId:viewRoom, viewerOrigin:vParsed.origin});

          const viewerPageUrl = `http://127.0.0.1:${STREAMING_PORT}/viewer.html?token=${encodeURIComponent(viewToken)}&room=${encodeURIComponent(viewRoom)}&auto=1`;
          setStep('viewer_navigate', {url:viewerPageUrl.replace(viewToken,'<redacted>')});
          await navigate(viewPage, viewerPageUrl);
          await wait(1500);

          // wait for publisher accept prompt (inspectionRequested) -> click accept
          let acceptReady=false;
          for(let i=0;i<100;i++){
            await wait(500);
            const st = await navEval(pubPage, `(()=>({state:document.querySelector('#state')?.textContent, acceptDis:document.querySelector('#accept')?.disabled, viewer:document.querySelector('#accept')?.dataset?.viewer||'', call:document.querySelector('#callState')?.textContent}))()`).catch(()=>null);
            if(i%10===0) log('accept wait', st);
            if(st && st.acceptDis===false && st.viewer){ acceptReady=true; setStep('publisher_accept_ready',{viewer:st.viewer, call:st.call}); break; }
          }
          if(acceptReady){
            await navEval(pubPage, `document.querySelector('#accept').click()`);
            setStep('publisher_accept_clicked');
          } else {
            fail('publisher_accept','accept button not ready (no inspectionRequested observed)', await navEval(pubPage, `document.querySelector('#state')?.textContent`).catch(()=>null));
          }

          // wait viewer live/remote stream
          let viewerLive=false;
          for(let i=0;i<140;i++){
            await wait(500);
            const vst = await navEval(viewPage, `(()=>{try{return {state:document.querySelector('#state')?.textContent,conn:document.querySelector('#connState')?.textContent,call:document.querySelector('#callState')?.textContent,cam:document.querySelector('#camState')?.textContent,remote:!!document.querySelector('#remote')?.srcObject,audio:!!document.querySelector('#remoteAudio')?.srcObject,wsObs:(window.__cmepWs||null),wsUrlGlobal:(typeof wsUrl!=='undefined'?wsUrl:null)};}catch(e){return {err:e.message};}})()`).catch(e=>({evalErr:e.message}));
            if(i%10===0) log('viewer', {state:vst.state,call:vst.call,remote:vst.remote,audio:vst.audio,ws:vst.wsObs&&vst.wsObs.events});
            if(vst && vst.wsObs && Array.isArray(vst.wsObs.events) && vst.wsObs.events.some(e=>e.type==='open')) setStep('viewer_ws_open',{events:vst.wsObs.events});
            if(vst && vst.wsObs && Array.isArray(vst.wsObs.events) && vst.wsObs.events.some(e=>e.type==='close')) setStep('viewer_ws_closed',{events:vst.wsObs.events});
            if(vst && vst.remote && /v hovore|obnoven/i.test((vst.call||'')+' '+(vst.state||''))) { viewerLive=true; setStep('viewer_live', vst); break; }
            if(vst && /Chyba:|zamietol|expirovala|nie je možné/i.test(vst.state||'')) { fail('viewer', vst.state, vst); break; }
          }
          if(!viewerLive) fail('viewer_live','viewer not live with remote stream');

          // Let media flow and collect deep audio diagnostics + samples
          await wait(2500);
          setStep('viewer_diag_t1_start');
          let viewDiag1=null, viewDiag2=null, pubDiag1=null;
          try{ viewDiag1 = await browser.call('Runtime.evaluate',{expression:diagCollectExpr,returnByValue:true,awaitPromise:true},{sessionId:viewPage.sessionId,timeoutMs:45000}).then(r=>{if(r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0,1000)); return r.result.value;}); }catch(e){ fail('viewer_diag_t1', e.message); viewDiag1={error:e.message}; }
          try{ pubDiag1 = await browser.call('Runtime.evaluate',{expression:diagCollectExpr,returnByValue:true,awaitPromise:true},{sessionId:pubPage.sessionId,timeoutMs:45000}).then(r=>{if(r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0,1000)); return r.result.value;}); }catch(e){ fail('pub_diag_t1', e.message); pubDiag1={error:e.message}; }
          setStep('viewer_diag_t1_done', {viewer: summarizeDiag(viewDiag1), publisher: summarizeDiag(pubDiag1)});
          await wait(5000);
          setStep('viewer_diag_t2_start');
          try{ viewDiag2 = await browser.call('Runtime.evaluate',{expression:diagCollectExpr,returnByValue:true,awaitPromise:true},{sessionId:viewPage.sessionId,timeoutMs:45000}).then(r=>{if(r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0,1000)); return r.result.value;}); }catch(e){ fail('viewer_diag_t2', e.message); viewDiag2={error:e.message}; }
          setStep('viewer_diag_t2_done', {viewer: summarizeDiag(viewDiag2)});
          result.audioDiagnostics = {publisher_t1: pubDiag1, viewer_t1: viewDiag1, viewer_t2: viewDiag2};
          await wait(1500);
          setStep('media_sample_1_start');
          const pubCollect = `(async()=>{
            const out={localTracks:null,producers:[],transportStates:{},outbound:{audio:null,video:null},pcCount:0,iceDtls:null,selectedPair:null,errors:[],statsDigest:[]};
            try{ const s=(typeof stream!=='undefined')?stream:null; out.localTracks=s?s.getTracks().map(t=>({kind:t.kind,readyState:t.readyState,enabled:t.enabled,muted:t.muted,label:t.label,id:t.id})):null; }catch(e){out.errors.push('lt:'+e.message)}
            try{ if(typeof producers!=='undefined'&&Array.isArray(producers)) out.producers=producers.map(p=>({id:p&&p.id,kind:p&&p.kind,closed:!!(p&&p.closed),paused:!!(p&&p.paused)})); }catch(e){out.errors.push('pr:'+e.message)}
            try{ if(typeof sendTransport!=='undefined'&&sendTransport) out.transportStates.send=sendTransport.connectionState; if(typeof recvTransport!=='undefined'&&recvTransport) out.transportStates.recv=recvTransport.connectionState; }catch(e){}
            const pcs=[]; const seen=new Set(); const add=(pc,src)=>{ if(!pc||seen.has(pc))return; seen.add(pc); pcs.push({pc,src}); };
            try{ if(typeof sendTransport!=='undefined'&&sendTransport&&sendTransport._handler&&sendTransport._handler._pc) add(sendTransport._handler._pc,'send._handler'); }catch(e){}
            try{ if(typeof recvTransport!=='undefined'&&recvTransport&&recvTransport._handler&&recvTransport._handler._pc) add(recvTransport._handler._pc,'recv._handler'); }catch(e){}
            try{ if(window.__cmep&&Array.isArray(window.__cmep.pcs)) for(const x of window.__cmep.pcs) add(x.pc,'hook'); }catch(e){}
            out.pcCount=pcs.length;
            for(const {pc,src} of pcs){
              try{
                const st=await pc.getStats(); const arr=[]; st.forEach(v=>arr.push(v));
                if(!out.iceDtls) out.iceDtls={ice:pc.iceConnectionState, dtls:pc.connectionState, signaling:pc.signalingState, src};
                let oa=null,ov=null; const pairs=[];
                for(const e of arr){
                  if(e.type==='outbound-rtp' && !e.isRemote){ const k=e.kind||e.mediaType; const cur={kind:k,bytesSent:e.bytesSent,packetsSent:e.packetsSent,framesEncoded:e.framesEncoded,framesSent:e.framesSent,active:e.active,ssrc:e.ssrc}; if(k==='audio') oa=cur; if(k==='video') ov=cur; }
                  if(e.type==='candidate-pair' && (e.selected||e.nominated||e.state==='succeeded')){ pairs.push({state:e.state,nominated:e.nominated,selected:e.selected,bytesSent:e.bytesSent,bytesReceived:e.bytesReceived,currentRoundTripTime:e.currentRoundTripTime,localCandidateId:e.localCandidateId,remoteCandidateId:e.remoteCandidateId}); if(!out.selectedPair) out.selectedPair=pairs[pairs.length-1]; }
                }
                out.statsDigest.push({src,ice:pc.iceConnectionState,dtls:pc.connectionState,outAudio:oa,outVideo:ov,selectedPairs:pairs});
                if(oa) out.outbound.audio=oa; if(ov) out.outbound.video=ov;
              }catch(e){out.errors.push('stat:'+src+':'+e.message)}
            }
            return out;
          })()`;
          const viewCollect = `(async()=>{
            const out={remoteVideo:null,remoteAudio:null,inbound:{audio:null,video:null},pcCount:0,iceDtls:null,selectedPair:null,errors:[],statsDigest:[]};
            try{ const v=document.querySelector('#remote'); out.remoteVideo=v?{srcObject:!!v.srcObject,readyState:v.readyState,videoWidth:v.videoWidth,videoHeight:v.videoHeight,currentTime:v.currentTime,paused:v.paused,tracks:v.srcObject?v.srcObject.getTracks().map(t=>({kind:t.kind,readyState:t.readyState,enabled:t.enabled,muted:t.muted,label:t.label,id:t.id})):null}:null; }catch(e){out.errors.push('rv:'+e.message)}
            try{ const a=document.querySelector('#remoteAudio'); out.remoteAudio=a?{srcObject:!!a.srcObject,paused:a.paused,currentTime:a.currentTime,tracks:a.srcObject?a.srcObject.getTracks().map(t=>({kind:t.kind,readyState:t.readyState,enabled:t.enabled,muted:t.muted,label:t.label,id:t.id})):null}:null; }catch(e){out.errors.push('ra:'+e.message)}
            const pcs=[]; const seen=new Set(); const add=(pc,src)=>{ if(!pc||seen.has(pc))return; seen.add(pc); pcs.push({pc,src}); };
            try{ if(typeof sendTransport!=='undefined'&&sendTransport&&sendTransport._handler&&sendTransport._handler._pc) add(sendTransport._handler._pc,'send._handler'); }catch(e){}
            try{ if(typeof recvTransport!=='undefined'&&recvTransport&&recvTransport._handler&&recvTransport._handler._pc) add(recvTransport._handler._pc,'recv._handler'); }catch(e){}
            try{ if(window.__cmep&&Array.isArray(window.__cmep.pcs)) for(const x of window.__cmep.pcs) add(x.pc,'hook'); }catch(e){}
            out.pcCount=pcs.length;
            for(const {pc,src} of pcs){
              try{
                const st=await pc.getStats(); const arr=[]; st.forEach(v=>arr.push(v));
                if(!out.iceDtls) out.iceDtls={ice:pc.iceConnectionState, dtls:pc.connectionState, signaling:pc.signalingState, src};
                let ia=null,iv=null; const pairs=[];
                for(const e of arr){
                  if(e.type==='inbound-rtp' && !e.isRemote){ const k=e.kind||e.mediaType; const cur={kind:k,bytesReceived:e.bytesReceived,packetsReceived:e.packetsReceived,packetsLost:e.packetsLost,framesDecoded:e.framesDecoded,framesReceived:e.framesReceived,jitter:e.jitter,totalAudioEnergy:e.totalAudioEnergy,concealedSamples:e.concealedSamples,ssrc:e.ssrc}; if(k==='audio') ia=cur; if(k==='video') iv=cur; }
                  if(e.type==='candidate-pair' && (e.selected||e.nominated||e.state==='succeeded')){ pairs.push({state:e.state,nominated:e.nominated,selected:e.selected,bytesSent:e.bytesSent,bytesReceived:e.bytesReceived,currentRoundTripTime:e.currentRoundTripTime}); if(!out.selectedPair) out.selectedPair=pairs[pairs.length-1]; }
                }
                out.statsDigest.push({src,ice:pc.iceConnectionState,dtls:pc.connectionState,inAudio:ia,inVideo:iv,selectedPairs:pairs});
                if(ia) out.inbound.audio=ia; if(iv) out.inbound.video=iv;
              }catch(e){out.errors.push('stat:'+src+':'+e.message)}
            }
            return out;
          })()`;
          const getPub=()=>browser.call('Runtime.evaluate',{expression:pubCollect,returnByValue:true,awaitPromise:true},{sessionId:pubPage.sessionId,timeoutMs:35000}).then(r=>{if(r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0,800)); return r.result.value;});
          const getView=()=>browser.call('Runtime.evaluate',{expression:viewCollect,returnByValue:true,awaitPromise:true},{sessionId:viewPage.sessionId,timeoutMs:35000}).then(r=>{if(r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0,800)); return r.result.value;});

          let pub1,view1,pub2,view2;
          try{ pub1=await getPub(); }catch(e){ fail('pub_sample1',e.message); pub1={error:e.message}; }
          try{ view1=await getView(); }catch(e){ fail('view_sample1',e.message); view1={error:e.message}; }
          setStep('media_sample_1_done', {pubOut:pub1&&pub1.outbound, viewIn:view1&&view1.inbound, viewVid:view1&&view1.remoteVideo&&{w:view1.remoteVideo.videoWidth,h:view1.remoteVideo.videoHeight,ct:view1.remoteVideo.currentTime}});
          await wait(5000);
          try{ pub2=await getPub(); }catch(e){ fail('pub_sample2',e.message); pub2={error:e.message}; }
          try{ view2=await getView(); }catch(e){ fail('view_sample2',e.message); view2={error:e.message}; }
          setStep('media_sample_2_done', {pubOut:pub2&&pub2.outbound, viewIn:view2&&view2.inbound, viewVid:view2&&view2.remoteVideo&&{w:view2.remoteVideo.videoWidth,h:view2.remoteVideo.videoHeight,ct:view2.remoteVideo.currentTime}});

          result.publisher={sample1:pub1,sample2:pub2};
          result.viewer={sample1:view1,sample2:view2};

          // cleanup UI
          setStep('cleanup_ui_start');
          const cleanupInfo={};
          try{ cleanupInfo.pubStop = await navEval(pubPage, `(async()=>{try{document.querySelector('#stop')?.click()}catch(e){} await new Promise(r=>setTimeout(r,700)); return {state:document.querySelector('#state')?.textContent,conn:document.querySelector('#connState')?.textContent};})()`, {awaitPromise:true, timeoutMs:15000}); }catch(e){cleanupInfo.pubStopErr=e.message;}
          try{ cleanupInfo.viewStop = await navEval(viewPage, `(async()=>{try{document.querySelector('#stop')?.click()}catch(e){} await new Promise(r=>setTimeout(r,700)); return {state:document.querySelector('#state')?.textContent,conn:document.querySelector('#connState')?.textContent};})()`, {awaitPromise:true, timeoutMs:15000}); }catch(e){cleanupInfo.viewStopErr=e.message;}
          await wait(1500);
          try{ cleanupInfo.health = (await httpGet(`http://127.0.0.1:${STREAMING_PORT}/healthz`)).data; }catch(e){ cleanupInfo.healthErr=e.message; }
          setStep('cleanup_ui_done', cleanupInfo);
          result.cleanup = cleanupInfo;
        }
      }
    }

    // dispose contexts
    try{ await browser.call('Target.disposeBrowserContext',{browserContextId:pubPage.browserContextId}); setStep('publisher_context_disposed'); }catch(e){fail('cleanup_context_pub',e.message)}
    try{ await browser.call('Target.disposeBrowserContext',{browserContextId:viewPage.browserContextId}); setStep('viewer_context_disposed'); }catch(e){fail('cleanup_context_view',e.message)}

    // verdict
    result.verdictDetail = evaluateVerdict(result.publisher, result.viewer, result.publisherEarly);
    result.verdict = result.verdictDetail.verdict;
    setStep('verdict_computed', {verdict:result.verdict});

  }catch(e){
    fail('fatal', e.message, e.stack);
    if(!result.abortReason) result.abortReason = 'fatal_exception';
    if(result.verdict==='NOT TESTED') result.verdict='FAIL';
  }finally{
    // capture final server log tails
    result.diagnostics.serverLogTails = {
      streaming: tailLogs(serverLogs.streaming, 80),
      platform: tailLogs(serverLogs.platform, 60),
    };
    await cleanup();
    result.finishedAt=now();
  }
  try{ fs.mkdirSync(path.dirname(RESULT_PATH),{recursive:true}); fs.writeFileSync(RESULT_PATH, JSON.stringify(result,null,2)); }catch(e){}
  console.log('RESULT_JSON_PATH='+RESULT_PATH);
  console.log('LAST_STEP='+result.lastSuccessfulStep);
  console.log('VERDICT='+result.verdict);
  if(result.abortReason) console.log('ABORT_REASON='+result.abortReason);
  return result;
}

function summarizeDiag(d){
  if(!d||d.error) return {error:d&&d.error};
  return {
    state:d.state, globals:d.globals, remoteVideo:d.remoteVideo, remoteAudio:d.remoteAudio,
    allMediaEls:d.allMediaEls, transports:d.transports, ws:d.ws,
    pcCount:d.pcCount, pcDetails:(d.pcDetails||[]).map(p=>({src:p.src,ice:p.ice,dtls:p.dtls,signaling:p.signaling,inbound:p.inbound,outbound:p.outbound,pairs:p.pairs,tracks:(p.tracks||[])})),
    traceTail:(d.trace||[]).slice(-60), errors:d.errors
  };
}
function evaluateVerdict(pub, view, pubEarly){
  const p1=pub&&pub.sample1, p2=pub&&pub.sample2, v1=view&&view.sample1, v2=view&&view.sample2;
  const d={checks:{}, notes:[]};
  const pTracksOk = !!(p2&&Array.isArray(p2.localTracks)&&p2.localTracks.some(t=>t.kind==='audio'&&t.readyState==='live')&&p2.localTracks.some(t=>t.kind==='video'&&t.readyState==='live'));
  const producedOk = !!(p2&&Array.isArray(p2.producers)&&p2.producers.some(x=>x.kind==='audio'&&!x.closed)&&p2.producers.some(x=>x.kind==='video'&&!x.closed));
  const rv=v2&&v2.remoteVideo; const ra=v2&&v2.remoteAudio;
  const vVideoTrackOk = !!(rv&&rv.srcObject&&Array.isArray(rv.tracks)&&rv.tracks.some(t=>t.kind==='video'&&t.readyState==='live'));
  const vAudioTrackOk = !!((ra&&ra.srcObject&&Array.isArray(ra.tracks)&&ra.tracks.some(t=>t.kind==='audio'&&t.readyState==='live')) || (rv&&Array.isArray(rv.tracks)&&rv.tracks.some(t=>t.kind==='audio'&&t.readyState==='live')));
  const vSizeOk = !!(rv && num(rv.videoWidth)>0 && num(rv.videoHeight)>0);
  const ct1=num(v1&&v1.remoteVideo&&v1.remoteVideo.currentTime), ct2=num(v2&&v2.remoteVideo&&v2.remoteVideo.currentTime);
  const vTimeOk = (ct2>ct1) || (rv && rv.paused===false && ct2>0);
  const inV1=v1&&v1.inbound&&v1.inbound.video||{}, inV2=v2&&v2.inbound&&v2.inbound.video||{};
  const inA1=v1&&v1.inbound&&v1.inbound.audio||{}, inA2=v2&&v2.inbound&&v2.inbound.audio||{};
  const inVideoFlow = (num(inV2.bytesReceived)>num(inV1.bytesReceived) && num(inV2.bytesReceived)>0) || (num(inV2.framesDecoded)>num(inV1.framesDecoded) && num(inV2.framesDecoded)>0);
  const inAudioFlow = (num(inA2.bytesReceived)>num(inA1.bytesReceived) && num(inA2.bytesReceived)>0) || (num(inA2.packetsReceived)>num(inA1.packetsReceived) && num(inA2.packetsReceived)>0);
  const outV1=p1&&p1.outbound&&p1.outbound.video||{}, outV2=p2&&p2.outbound&&p2.outbound.video||{};
  const outA1=p1&&p1.outbound&&p1.outbound.audio||{}, outA2=p2&&p2.outbound&&p2.outbound.audio||{};
  const outVideoOk = num(outV2.bytesSent)>0 && (num(outV2.bytesSent)>=num(outV1.bytesSent));
  const outAudioOk = num(outA2.bytesSent)>0 && (num(outA2.bytesSent)>=num(outA1.bytesSent));
  const iceDtlsPresent = !!((v2&&v2.iceDtls)||(p2&&p2.iceDtls));
  Object.assign(d.checks,{pTracksOk,producedOk,vVideoTrackOk,vAudioTrackOk,vSizeOk,vTimeOk,inVideoFlow,inAudioFlow,outVideoOk,outAudioOk,iceDtlsPresent});
  // handle no-sample cases
  if(!p1 && !p2 && !v1 && !v2){
    if(pubEarly && pubEarly.room && producedOk) d.verdict='PARTIAL';
    else if(pubEarly && pubEarly.room) d.verdict='PARTIAL';
    else d.verdict='FAIL';
    d.notes.push('no media samples collected');
    return d;
  }
  if(pTracksOk && producedOk && vVideoTrackOk && vAudioTrackOk && vSizeOk && vTimeOk && inVideoFlow && inAudioFlow && outVideoOk && outAudioOk) d.verdict='PASS';
  else if(pTracksOk && producedOk && (vVideoTrackOk||vAudioTrackOk||vSizeOk||inVideoFlow||inAudioFlow||outVideoOk||outAudioOk)) d.verdict='PARTIAL';
  else if(!pTracksOk && !producedOk && !vVideoTrackOk && !vAudioTrackOk) d.verdict='FAIL';
  else d.verdict='PARTIAL';
  return d;
}

main().then(r=>{
  const code = r && r.verdict==='PASS' ? 0 : (r && r.verdict==='NOT TESTED' ? 3 : (r && r.verdict==='FAIL' ? 2 : 1));
  process.exit(code);
}).catch(e=>{ errlog('unhandled',e.stack||e.message); process.exit(2); });
