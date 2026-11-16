'use strict';
/**
 * Phase 3D - isolated reproduction tests for "audio producer missing from viewer joinRoom"
 * Diagnostic-only, no application source/config/existing tests modified.
 * Uses backend/src modules with mocked mediasoup to inspect room.producers and responses.
 */
const http = require('node:http');
const path = require('node:path');
const WebSocket = require(path.resolve(__dirname, '..', 'backend/node_modules/ws'));
const { createSignaling } = require(path.resolve(__dirname, '..', 'backend/src/signaling'));

const wait = (ms) => new Promise(r => setTimeout(r, ms));
const now = () => Date.now();

function makeMediasoup() {
  const allProducers = [];
  const mkObserver = () => { const handlers={}; return { on:(ev,fn)=>{ (handlers[ev]=handlers[ev]||[]).push(fn); }, emit:(ev,...a)=>{ (handlers[ev]||[]).forEach(fn=>{try{fn(...a);}catch{}}); } }; };
  const mkProducer = (kind, appData={}) => {
    const obs = mkObserver();
    const p = { id: `prod-${kind}-${allProducers.length+1}-${Math.random().toString(16).slice(2,6)}`, kind, closed:false, paused:false, appData, observer: obs, close(){ if(this.closed) return; this.closed=true; obs.emit('close'); }, pause:async()=>{p.paused=true;}, resume:async()=>{p.paused=false;} };
    allProducers.push(p); return p;
  };
  const mkTransport = (direction) => {
    const obs = mkObserver();
    return {
      id: `tr-${direction}-${Math.random().toString(16).slice(2,6)}`,
      closed:false,
      iceParameters:{usernameFragment:'u',password:'p',iceLite:true},
      iceCandidates:[], dtlsParameters:{role:'auto',fingerprints:[{algorithm:'sha-256',value:'AA'}]},
      observer: obs,
      on(){}, close(){ if(this.closed) return; this.closed=true; obs.emit('close'); },
      connect: async ()=>({}),
      restartIce: async ()=>({usernameFragment:'u2',password:'p2',iceLite:true}),
      produce: async ({kind, appData}) => mkProducer(kind, appData),
      consume: async ({producerId}) => {
        const cobs=mkObserver();
        const src=allProducers.find(x=>x.id===producerId);
        const c={ id:`cons-${producerId}-${Math.random().toString(16).slice(2,6)}`, producerId, kind:(src&&src.kind)||'unknown', closed:false, type:'simple', rtpParameters:{}, observer:cobs, close(){ if(this.closed)return; this.closed=true; cobs.emit('close'); }, resume:async()=>{} };
        return c;
      },
    };
  };
  const router = {
    rtpCapabilities: { codecs:[{kind:'audio',mimeType:'audio/opus',preferredPayloadType:111,clockRate:48000,channels:2,parameters:{}},{kind:'video',mimeType:'video/H264',preferredPayloadType:96,clockRate:90000,parameters:{'packetization-mode':1,'profile-level-id':'42e01f','level-asymmetry-allowed':1}}], headerExtensions:[] },
    canConsume: () => true,
    createWebRtcTransport: async () => mkTransport('any'),
  };
  const worker = { closed:false, on(){}, createRouter: async ()=>router, close(){ this.closed=true; } };
  const mediasoup = { createWorker: async ()=>worker };
  return { mediasoup, mediaCodecs:[], listenIps:[{ip:'127.0.0.1'}] };
}

function makeAdapter() {
  return {
    async canCreateInspection(){ return true; },
    async canJoinInspection(){ return true; },
    async canRecord(){ return true; },
  };
}

async function withServer(run) {
  const server = http.createServer((_,res)=>{res.writeHead(404);res.end();});
  await new Promise((res,rej)=>server.listen(0,'127.0.0.1',()=>{server.removeListener('error',rej);res();}));
  const port = server.address().port;
  const { mediasoup, mediaCodecs, listenIps } = makeMediasoup();
  const sig = await createSignaling({
    server, mediasoup, mediaCodecs, listenIps,
    adapter: makeAdapter(),
    events: { emit: async ()=>{} },
    authenticate: async (token) => JSON.parse(Buffer.from(token, 'base64url').toString('utf8')),
    turnService: null,
  });
  try { await run({ port, sig }); }
  finally {
    try { await sig.close(); } catch {}
    await new Promise(r=>server.close(()=>r()));
  }
}

function connectClient(port, claims) {
  const token = Buffer.from(JSON.stringify(claims)).toString('base64url');
  const ws = new WebSocket(`ws://127.0.0.1:${port}/ws?token=${encodeURIComponent(token)}`);
  let idc=0; const pending=new Map(); const events=[];
  ws.on('message', d => {
    const m=JSON.parse(d.toString());
    if(m.event){ events.push({t:now(), event:m.event, data:m.data}); return; }
    if(m.id!==undefined && pending.has(m.id)){
      const p=pending.get(m.id); pending.delete(m.id); clearTimeout(p.to);
      m.ok ? p.resolve({t:now(), data:m.data}) : p.reject(Object.assign(new Error(m.error||'rpc_failed'),{resp:m}));
    }
  });
  const open = new Promise((resolve,reject)=>{
    const to=setTimeout(()=>reject(new Error('ws open timeout')),8000);
    ws.on('open',()=>{clearTimeout(to); resolve();});
    ws.on('error',(e)=>{clearTimeout(to); reject(e);});
  });
  function rpc(method,data,timeoutMs=12000){
    return new Promise((resolve,reject)=>{
      const id=++idc; const to=setTimeout(()=>{pending.delete(id);reject(new Error('rpc timeout '+method));},timeoutMs);
      pending.set(id,{resolve,reject,to});
      ws.send(JSON.stringify({id,method,data}));
    });
  }
  async function close(){ try{ws.close(1000,'test');}catch{} await wait(50); }
  return { ws, open, rpc, events, close, claims };
}

function snapRoom(sig, roomId){
  const room = sig.rooms.get(roomId);
  if(!room) return null;
  return {
    roomId: room.id, ownerId: room.ownerId, state: room.state, acceptedViewer: room.acceptedViewer,
    participants: [...room.participants.keys()],
    producers: [...room.producers.values()].map(m=>({producerId:m.producer.id, kind:m.kind, from:m.ownerSub, closed:!!m.producer.closed})),
  };
}
function recStep(steps, name, extra){ steps.push({t:now(), step:name, ...extra}); }

async function setupRoomWithPub(port, sig, pubSub='pub1', offer='insp1'){
  const pub = connectClient(port,{sub:pubSub,role:'publisher',insp:offer});
  await pub.open;
  let r = await pub.rpc('createRoom',{offerId:offer});
  const roomId = r.data.roomId;
  return {pub, roomId, createResp:r};
}

async function runScenario(name, fn){
  const steps=[]; const result={name};
  await withServer(async ({port,sig})=>{ await fn({port,sig,steps,result}); });
  result.steps=steps; return result;
}

const scenarios = {
  async audio_video_before_viewer({port,sig,steps,result}){
    const pub = connectClient(port,{sub:'pub1',role:'publisher',insp:'insp1'});
    const view = connectClient(port,{sub:'view1',role:'viewer',insp:'insp1'});
    await Promise.all([pub.open, view.open]);
    let r = await pub.rpc('createRoom',{offerId:'insp1'}); const roomId=r.data.roomId; result.roomId=roomId;
    recStep(steps,'after_createRoom',{peerId:'pub1',roomId,resp:r.data,room:snapRoom(sig,roomId)});
    r = await pub.rpc('createWebRtcTransport',{roomId,direction:'send'}); const sendTr=r.data.id;
    recStep(steps,'pub_send_transport',{peerId:'pub1',roomId,transportId:sendTr});
    r = await pub.rpc('produce',{transportId:sendTr, kind:'audio', rtpParameters:{}}); const audioPid=r.data.producerId;
    recStep(steps,'after_produce_audio',{peerId:'pub1',roomId,producerId:audioPid,kind:'audio',resp:r.data,room:snapRoom(sig,roomId)});
    r = await pub.rpc('produce',{transportId:sendTr, kind:'video', rtpParameters:{}}); const videoPid=r.data.producerId;
    recStep(steps,'after_produce_video',{peerId:'pub1',roomId,producerId:videoPid,kind:'video',resp:r.data,room:snapRoom(sig,roomId)});
    r = await view.rpc('requestInspection',{roomId});
    recStep(steps,'after_requestInspection',{peerId:'view1',roomId,resp:r.data,room:snapRoom(sig,roomId)});
    r = await pub.rpc('acceptInspection',{roomId, viewer:'view1'});
    recStep(steps,'after_acceptInspection',{peerId:'pub1',roomId,resp:r.data,room:snapRoom(sig,roomId)});
    r = await view.rpc('joinRoom',{roomId});
    recStep(steps,'viewer_joinRoom_response',{peerId:'view1',roomId,resp:r.data,room:snapRoom(sig,roomId)});
    result.viewerEvents=view.events; result.publisherEvents=pub.events;
    await view.close(); await pub.close();
  },
  async audio_then_video_before_viewer({port,sig,steps,result}){
    const pub = connectClient(port,{sub:'pub1',role:'publisher',insp:'insp1'});
    const view = connectClient(port,{sub:'view1',role:'viewer',insp:'insp1'});
    await Promise.all([pub.open, view.open]);
    let r = await pub.rpc('createRoom',{offerId:'insp1'}); const roomId=r.data.roomId; result.roomId=roomId;
    r = await pub.rpc('createWebRtcTransport',{roomId,direction:'send'}); const sendTr=r.data.id;
    r = await pub.rpc('produce',{transportId:sendTr, kind:'audio', rtpParameters:{}});
    recStep(steps,'after_produce_audio',{peerId:'pub1',roomId,producerId:r.data.producerId,kind:'audio',resp:r.data,room:snapRoom(sig,roomId)});
    r = await pub.rpc('produce',{transportId:sendTr, kind:'video', rtpParameters:{}});
    recStep(steps,'after_produce_video',{peerId:'pub1',roomId,producerId:r.data.producerId,kind:'video',resp:r.data,room:snapRoom(sig,roomId)});
    await view.rpc('requestInspection',{roomId});
    await pub.rpc('acceptInspection',{roomId, viewer:'view1'});
    recStep(steps,'before_viewer_join',{peerId:'view1',roomId,room:snapRoom(sig,roomId)});
    r = await view.rpc('joinRoom',{roomId});
    recStep(steps,'viewer_joinRoom_response',{peerId:'view1',roomId,resp:r.data,room:snapRoom(sig,roomId)});
    result.viewerEvents=view.events;
    await view.close(); await pub.close();
  },
  async video_then_audio_before_viewer({port,sig,steps,result}){
    const pub = connectClient(port,{sub:'pub1',role:'publisher',insp:'insp1'});
    const view = connectClient(port,{sub:'view1',role:'viewer',insp:'insp1'});
    await Promise.all([pub.open, view.open]);
    let r = await pub.rpc('createRoom',{offerId:'insp1'}); const roomId=r.data.roomId; result.roomId=roomId;
    r = await pub.rpc('createWebRtcTransport',{roomId,direction:'send'}); const sendTr=r.data.id;
    r = await pub.rpc('produce',{transportId:sendTr, kind:'video', rtpParameters:{}});
    recStep(steps,'after_produce_video',{peerId:'pub1',roomId,producerId:r.data.producerId,kind:'video',resp:r.data,room:snapRoom(sig,roomId)});
    r = await pub.rpc('produce',{transportId:sendTr, kind:'audio', rtpParameters:{}});
    recStep(steps,'after_produce_audio',{peerId:'pub1',roomId,producerId:r.data.producerId,kind:'audio',resp:r.data,room:snapRoom(sig,roomId)});
    await view.rpc('requestInspection',{roomId});
    await pub.rpc('acceptInspection',{roomId, viewer:'view1'});
    recStep(steps,'before_viewer_join',{peerId:'view1',roomId,room:snapRoom(sig,roomId)});
    r = await view.rpc('joinRoom',{roomId});
    recStep(steps,'viewer_joinRoom_response',{peerId:'view1',roomId,resp:r.data,room:snapRoom(sig,roomId)});
    result.viewerEvents=view.events;
    await view.close(); await pub.close();
  },
  async viewer_connected_before_producers({port,sig,steps,result}){
    const pub = connectClient(port,{sub:'pub1',role:'publisher',insp:'insp1'});
    const view = connectClient(port,{sub:'view1',role:'viewer',insp:'insp1'});
    await Promise.all([pub.open, view.open]);
    let r = await pub.rpc('createRoom',{offerId:'insp1'}); const roomId=r.data.roomId; result.roomId=roomId;
    recStep(steps,'after_createRoom',{peerId:'pub1',roomId,room:snapRoom(sig,roomId)});
    await view.rpc('requestInspection',{roomId});
    await pub.rpc('acceptInspection',{roomId, viewer:'view1'});
    recStep(steps,'after_accept',{peerId:'pub1',roomId,room:snapRoom(sig,roomId)});
    r = await view.rpc('joinRoom',{roomId});
    recStep(steps,'viewer_joinRoom_before_produce',{peerId:'view1',roomId,resp:r.data,room:snapRoom(sig,roomId)});
    r = await pub.rpc('createWebRtcTransport',{roomId,direction:'send'}); const sendTr=r.data.id;
    r = await pub.rpc('produce',{transportId:sendTr, kind:'audio', rtpParameters:{}});
    recStep(steps,'after_produce_audio',{peerId:'pub1',roomId,producerId:r.data.producerId,kind:'audio',resp:r.data,room:snapRoom(sig,roomId)});
    await wait(50);
    r = await pub.rpc('produce',{transportId:sendTr, kind:'video', rtpParameters:{}});
    recStep(steps,'after_produce_video',{peerId:'pub1',roomId,producerId:r.data.producerId,kind:'video',resp:r.data,room:snapRoom(sig,roomId)});
    await wait(120);
    recStep(steps,'final_room_state',{room:snapRoom(sig,roomId)});
    result.viewerEvents=view.events; result.publisherEvents=pub.events;
    await view.close(); await pub.close();
  },
};

(async()=>{
  const fs=require('node:fs');
  const out={startedAt:new Date().toISOString(), scenarios:{}, errors:[], env:{node:process.version}};
  for(const [name, fn] of Object.entries(scenarios)){
    try{ const r=await runScenario(name, fn); out.scenarios[name]=r; console.log('SCENARIO_OK', name); }
    catch(e){ out.errors.push({scenario:name, message:e.message, stack:e.stack}); console.error('SCENARIO_FAIL', name, e.message); console.error(e.stack); }
  }
  out.finishedAt=new Date().toISOString();
  const p='/data/data/com.termux/files/usr/tmp/opencode/phase3d-isolation-result.json';
  fs.writeFileSync(p, JSON.stringify(out,null,2));
  console.log('RESULT_JSON_PATH='+p);
  console.log('ERRORS='+out.errors.length);
  process.exit(out.errors.length?2:0);
})().catch(e=>{ console.error('FATAL', e.stack||e.message); process.exit(2); });
