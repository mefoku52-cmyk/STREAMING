'use strict';
class RpcClient {
  constructor(url){this.url=url;this.next=1;this.pending=new Map();this.ws=null;this.onEvent=null;}
  connect(){return new Promise((resolve,reject)=>{const ws=this.ws=new WebSocket(this.url);let settled=false;const done=(fn,arg)=>{if(!settled){settled=true;fn(arg);}};ws.onopen=()=>{const id=this.next++;const to=setTimeout(()=>{try{ws.close()}catch{}done(reject,new Error('connect_timeout'))},5000);this.pending.set(id,{resolve:()=>{clearTimeout(to);done(resolve)},reject:(e)=>{clearTimeout(to);done(reject,e)}});ws.send(JSON.stringify({id,method:'getRouterRtpCapabilities',data:{}}));};ws.onmessage=e=>{let m;try{m=JSON.parse(e.data)}catch{return}if(m.event&&this.onEvent){try{this.onEvent(m.event,m.data)}catch(err){console.error('event handler error',err)}return}const p=this.pending.get(m.id);if(!p)return;this.pending.delete(m.id);m.ok?p.resolve(m.data):p.reject(new Error(m.error||'rpc_failed'));};ws.onclose=(e)=>{const err=new Error(e&&e.code===4401?'auth_failed':'connection_closed');for(const p of this.pending.values())p.reject(err);this.pending.clear();done(reject,err);};ws.onerror=()=>{};});}
  request(method,data={}){if(!this.ws||this.ws.readyState!==WebSocket.OPEN)return Promise.reject(new Error('not_connected'));const id=this.next++;return new Promise((resolve,reject)=>{this.pending.set(id,{resolve,reject});this.ws.send(JSON.stringify({id,method,data}));});}
  close(){this.ws?.close();}
}
window.CmepRpcClient=RpcClient;
