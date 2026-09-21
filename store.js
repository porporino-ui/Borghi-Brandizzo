/* Shared public reader / admin API. No credentials are persisted in the browser. */
(() => {
  'use strict';
  const config=window.BRANDIZZO_CONFIG||{};
  function configured(){return /^https:\/\/[^/]+$/.test(config.url||'')&&!!config.publishableKey}
  async function request(path,body,token){
    if(!configured())throw Error('Configura prima il collegamento a Supabase in config.js.');
    const control=new AbortController(), timer=setTimeout(()=>control.abort(),12000);
    try{
      const headers={'Content-Type':'application/json',apikey:config.publishableKey};
      if(token)headers.Authorization='Bearer '+token;
      const response=await fetch(config.url+path,{method:'POST',headers,body:JSON.stringify(body),signal:control.signal,cache:'no-store',credentials:'omit'});
      const data=await response.json();
      if(!response.ok){const error=Error(data.message||data.error_description||data.msg||'Richiesta non riuscita');error.code=data.code;error.status=response.status;throw error}
      return data;
    }finally{clearTimeout(timer)}
  }
  const snapshot=()=>request('/rest/v1/rpc/brandizzo_snapshot',{});
  async function applyPublic(state,themes,records,key){
    if(!configured())return;
    try{
      const s=await snapshot();
      if(!Number.isSafeInteger(s.revision)||!s.colors||!s.assignments)throw Error('Risposta non valida');
      for(const [b,t] of Object.entries(s.colors)){
        if(Object.hasOwn(themes,b)&&/^#[0-9a-f]{6}$/i.test(t.primary)&&/^#[0-9a-f]{6}$/i.test(t.secondary)){
          themes[b]={primary:t.primary,secondary:t.secondary};state.colors[b]=t.primary;
        }
      }
      for(const r of records){const b=s.assignments[key(r.via??r.Via,r.civico??r.Civico??r.civ)];if(typeof b==='string'&&Object.hasOwn(themes,b))r.borgo=b}
    }catch(error){
      console.warn('Aggiornamenti mappa non disponibili',error);
      // The embedded v3.28 remains usable, but do not silently claim current data.
      if(typeof toast==='function')toast('Aggiornamenti non disponibili: stai vedendo i dati della versione originale.');
    }
  }
  window.BrandizzoStore={configured,request,snapshot,applyPublic};
})();
