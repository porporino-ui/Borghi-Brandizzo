(() => {
  'use strict';
  const $=id=>document.getElementById(id), api=window.BrandizzoStore;
  let token=null,expiresAt=0,expiryTimer=null,catalog=null,base=null,draft=null,limit=40,busy=false;
  const clone=x=>JSON.parse(JSON.stringify(x));
  const normalize=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('it').replace(/[’']/g,' ').replace(/\s+/g,' ').trim();
  function status(text,kind=''){$('status').textContent=text;$('status').className=kind}
  function effective(s){return {buildings:{...Object.fromEntries(Object.entries(catalog.themes).map(([b,t])=>[b,t.primary])),...(s.building_colors||{})},colors:{...clone(catalog.themes),...clone(s.colors)},assignments:Object.fromEntries(catalog.records.map(r=>[r.id,s.assignments[r.id]||r.borgo]))}}
  function patches(){
    const old=effective(base),colors={},assignments={},buildings={};
    for(const [k,v] of Object.entries(draft.colors))if(v.primary!==old.colors[k].primary||v.secondary!==old.colors[k].secondary)colors[k]=v;
    for(const [k,v] of Object.entries(draft.assignments))if(v!==old.assignments[k])assignments[k]=v;
    for(const [k,v] of Object.entries(draft.buildings))if(v!==old.buildings[k])buildings[k]=v;
    return {colors,assignments,buildings};
  }
  function dirty(){if(!base||!draft)return false;const p=patches();return !!(Object.keys(p.colors).length+Object.keys(p.assignments).length+Object.keys(p.buildings).length)}
  function pending(){
    const p=patches(),n=Object.keys(p.colors).length+Object.keys(p.assignments).length+Object.keys(p.buildings).length;
    $('pending').textContent=n?`${n} modifiche da pubblicare.`:'Nessuna modifica.';
    $('save').disabled=!n||busy;$('discard').disabled=!n||busy;
    $('changes').replaceChildren();
    const old=effective(base);
    for(const [b,c] of Object.entries(p.buildings)){const li=document.createElement('li');li.textContent=`Casette ${b}: ${old.buildings[b]} → ${c}`;$('changes').append(li)}
    for(const [b,t] of Object.entries(p.colors)){const li=document.createElement('li');li.textContent=`Identità ${b}: ${old.colors[b].primary} / ${old.colors[b].secondary} → ${t.primary} / ${t.secondary}`;$('changes').append(li)}
    for(const [id,b] of Object.entries(p.assignments)){const r=catalog.records.find(r=>r.id===id),li=document.createElement('li');li.textContent=`${r.via} ${r.civico}: ${old.assignments[id]} → ${b}`;$('changes').append(li)}
  }
  function setBusy(value){busy=value;$('editor').inert=value;$('login').querySelector('button').disabled=value;if(base&&draft)pending()}
  function renderColors(){
    $('colors').replaceChildren();
    for(const [b,t] of Object.entries(draft.colors)){
      const card=document.createElement('div');card.className='color-card';card.style.background=`linear-gradient(140deg,${t.primary}18,${t.secondary}35)`;
      const title=document.createElement('h3');title.textContent=b;card.append(title);
      const swatches=document.createElement('div');swatches.className='swatches';
      for(const [field,label] of [['primary','Principale'],['secondary','Secondo']]){
        const wrap=document.createElement('label');wrap.textContent=label;const input=document.createElement('input');input.type='color';input.value=t[field];input.setAttribute('aria-label',`${b}, colore ${label.toLowerCase()}`);
        input.oninput=()=>{draft.colors[b][field]=input.value;card.style.background=`linear-gradient(140deg,${t.primary}18,${t.secondary}35)`;pending()};wrap.append(input);swatches.append(wrap);
      }
      card.append(swatches);$('colors').append(card);
    }
  }
  function renderBuildings(){
    $('buildings').replaceChildren();
    for(const [b,c] of Object.entries(draft.buildings)){
      const card=document.createElement('label');card.className='color-card';card.textContent=b;
      const input=document.createElement('input');input.type='color';input.value=c;input.setAttribute('aria-label','Colore casette '+b);
      input.oninput=()=>{draft.buildings[b]=input.value;pending()};card.append(input);$('buildings').append(card);
    }
  }
  function renderRecords(){
    const terms=normalize($('search').value).split(' ').filter(Boolean);
    const found=catalog.records.filter(r=>terms.every(t=>normalize(`${r.via} ${r.civico} ${draft.assignments[r.id]}`).includes(t)));
    $('count').textContent=`${found.length} civici trovati · ${Math.min(limit,found.length)} mostrati`;$('results').replaceChildren();$('more').hidden=found.length<=limit;
    for(const r of found.slice(0,limit)){
      const row=document.createElement('div');row.className='result';const text=document.createElement('div');text.textContent=`${r.via} ${r.civico}`;
      const note=document.createElement('small');note.textContent=`Attuale: ${effectiveAssignment(r)}`;text.append(note);
      const select=document.createElement('select');select.setAttribute('aria-label',`Borgo di ${r.via} ${r.civico}`);
      for(const b of Object.keys(catalog.themes)){const opt=document.createElement('option');opt.value=b;opt.textContent=b;select.append(opt)}select.value=draft.assignments[r.id];
      select.onchange=()=>{draft.assignments[r.id]=select.value;pending()};row.append(text,select);$('results').append(row);
    }
  }
  const effectiveAssignment=r=>base.assignments[r.id]||r.borgo;
  function accept(s){if(s.palette_version!==2)throw Error('Prima esegui 04-colori-separati.sql in Supabase, poi ricarica.');base=s;draft=effective(s);$('revision').textContent=`Versione salvata: ${s.revision}`;renderColors();renderBuildings();renderRecords();pending()}
  function forget(){clearTimeout(expiryTimer);token=null;expiresAt=0;base=null;draft=null;$('editor').hidden=true;$('login').hidden=false;$('password').value='';$('colors').replaceChildren();$('buildings').replaceChildren();$('results').replaceChildren();$('changes').replaceChildren()}
  function authToken(){if(!token||Date.now()>=expiresAt){forget();throw Error('Sessione scaduta. Accedi di nuovo.')}return token}
  $('login').onsubmit=async event=>{
    event.preventDefault();setBusy(true);status('Accesso in corso…');
    try{
      const email=String(window.BRANDIZZO_CONFIG?.adminEmail||'').trim();
      if(!email)throw Error('Configura prima l’account condiviso in config.js.');
      const session=await api.request('/auth/v1/token?grant_type=password',{email,password:$('password').value});
      token=session.access_token;expiresAt=Date.now()+session.expires_in*1000;
      $('password').value='';
      if(!await api.request('/rest/v1/rpc/brandizzo_is_admin',{},authToken()))throw Error('Questo account non è autorizzato ad amministrare la mappa.');
      const response=await fetch('catalog.json',{cache:'no-store'});if(!response.ok)throw Error('Catalogo non disponibile');catalog=await response.json();
      const s=await api.snapshot();accept(s);$('login').hidden=true;$('editor').hidden=false;
      expiryTimer=setTimeout(()=>{forget();status('Sessione scaduta. Accedi di nuovo. Le modifiche non salvate sono state eliminate.','error')},Math.max(0,expiresAt-Date.now()));
      status('Accesso riuscito. Le modifiche diventano pubbliche solo quando salvi.','success');
    }catch(error){forget();status(error.message,'error')}finally{setBusy(false)}
  };
  $('save').onclick=async()=>{
    if(!dirty())return;setBusy(true);status('Salvataggio in corso…');
    try{const p=patches();const s=await api.request('/rest/v1/rpc/brandizzo_save_v2',{expected_revision:base.revision,color_patch:p.colors,assignment_patch:p.assignments,building_patch:p.buildings},authToken());accept(s);status('Modifiche salvate e pubblicate. Ricarica la mappa per visualizzarle.','success')}
    catch(error){status(error.code==='40001'?'Un altro salvataggio ha aggiornato la mappa. Le tue modifiche sono ancora visibili qui: annotale e premi Ricarica prima di ripeterle.':`Salvataggio non confermato: ${error.message}. In caso di errore di rete, ricarica per verificare lo stato sul server.`, 'error')}
    finally{setBusy(false)}
  };
  $('reload').onclick=async()=>{if(dirty()&&!confirm('Ricaricare ed eliminare le modifiche non salvate?'))return;setBusy(true);try{accept(await api.snapshot());status('Dati ricaricati.')}catch(e){status(e.message,'error')}finally{setBusy(false)}};
  $('discard').onclick=()=>{if(confirm('Annullare tutte le modifiche non salvate?'))accept(base)};
  $('logout').onclick=async()=>{if(dirty()&&!confirm('Uscire ed eliminare le modifiche non salvate?'))return;const currentToken=token;forget();status('Sessione chiusa su questo browser.');try{await api.request('/auth/v1/logout',{},currentToken)}catch{status('Uscita locale completata. La revoca sul server non è stata confermata; il token scadrà automaticamente.')}};
  $('illustratedPalette').onclick=()=>{
    const palette={"Burg D'Al Centro":"#B29ACB","Burg D'An Giù":"#EAAA83","Burg D'La Frutera":"#E78D86","Burg D'Le Ca Nove":"#E5CA86","Burg Di Ciapej":"#88ADD1","Burg di Prà Neiva":"#7ABEBE","Burg Orchidea":"#8FBC8B","Burg S. Gervasio":"#C69AAC"};
    for(const [borgo,color] of Object.entries(palette)){
      if(Object.hasOwn(draft.buildings,borgo))draft.buildings[borgo]=color;
    }
    renderBuildings();pending();
    status('Colori della mappa illustrata applicati solo alle casette. Premi Salva e pubblica per renderli visibili sulla mappa.');
  };
  $('search').oninput=()=>{limit=40;renderRecords()};$('more').onclick=()=>{limit+=40;renderRecords()};
  window.addEventListener('beforeunload',e=>{if(dirty()){e.preventDefault();e.returnValue=''}});
  if(!api.configured()||!window.BRANDIZZO_CONFIG?.adminEmail)status('Prima configurazione necessaria: segui LEGGIMI.md e compila config.js.','error');
})();
