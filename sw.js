/* Retro DV offline cache (service worker) */
const C='retrodv-v1';
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(['./','./index.html'])).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
const put=(r,res)=>{if(res&&(res.ok||res.type==='opaque')){const cp=res.clone();caches.open(C).then(c=>c.put(r,cp))}return res};
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);
  /* the app page: try network first (so updates show up), fall back to the saved copy after 3s or when offline */
  if(r.mode==='navigate'||u.origin===location.origin){
    e.respondWith(new Promise(done=>{let over=false;
      const cached=()=>caches.match(r,{ignoreSearch:true}).then(m=>m||caches.match('./index.html')||caches.match('./'));
      const t=setTimeout(()=>cached().then(m=>{if(m&&!over){over=true;done(m)}}),3000);
      fetch(r).then(res=>{clearTimeout(t);put(r,res);if(!over){over=true;done(res)}})
        .catch(()=>{clearTimeout(t);cached().then(m=>{if(!over){over=true;done(m||Response.error())}})})}));
    return}
  /* fonts and libraries: cache first */
  if(/fonts\.googleapis\.com|fonts\.gstatic\.com|unpkg\.com/.test(u.host)){
    e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>put(r,res))))}
});

