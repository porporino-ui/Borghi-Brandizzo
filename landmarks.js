/* Eight symbolic places from the approved Blender map.
   WGS84 [longitude, latitude]; provenance and placement notes: LUOGHI.md. */
(() => {
  'use strict';
  const places = [
    {id:'san-grato',borgo:"Burg D'Le Ca Nove",name:'Cappella di San Grato',icon:'chapel',coordinates:[7.836455,45.176887],address:'Via Torino · Cappella di San Grato',description:'Piccola cappella settecentesca lungo la strada storica di accesso a Brandizzo. La facciata è rivestita in travertino.'},
    {id:'municipio',borgo:"Burg D'Al Centro",name:'Palazzo Municipale',icon:'civic',coordinates:[7.8415278,45.1776111],address:'Via Torino 121',description:'Sede del Comune e luogo simbolo del borgo Centro, affacciato sul cuore della vita cittadina.'},
    {id:'san-giacomo',borgo:"Burg D'An Giù",name:'San Giacomo Apostolo e Ex Oratorio',icon:'baroque',coordinates:[7.8433889,45.1775278],address:'Piazza Vittorio Veneto · complesso parrocchiale',description:'La chiesa parrocchiale barocca, consacrata nel 1752, e il vicino ex Oratorio Gesù Maestro sono i riferimenti del borgo D’an Giù. Il pin indica la chiesa.'},
    {id:'san-giovanni',borgo:'Burg Di Ciapej',name:'San Giovanni Evangelista e Oratorio',icon:'church',coordinates:[7.8328456,45.1796263],address:'Via Papa Giovanni XXIII 4',description:'La chiesa e il suo oratorio sono un punto di ritrovo del borgo Ciapej, nella parte di Brandizzo a nord della ferrovia.'},
    {id:'san-gervasio',borgo:'Burg S. Gervasio',name:'Via San Gervasio',icon:'street',coordinates:[7.8331864,45.1816626],address:'Via San Gervasio · tratto centrale',description:'La strada che dà il nome al borgo è il suo luogo simbolo. Il pin segnala un punto del percorso, non un edificio specifico.'},
    {id:'costigliola',borgo:'Burg Orchidea',name:'Campo sportivo Alex Costigliola',icon:'sport',coordinates:[7.8373447,45.1840559],address:'Via Dante di Nanni 14/20',description:'Campo sportivo comunale dedicato ad Alex Costigliola, luogo simbolo del borgo Orchidea e spazio per il calcio e la vita sportiva locale.'},
    {id:'murales-stazione',borgo:"Burg D'La Frutera",name:'Murales della stazione',icon:'mural',coordinates:[7.840681,45.178896],address:'Inizio di via Volpiano · presso la stazione',description:'Il muro dipinto lungo il tratto iniziale di via Volpiano, subito dopo la stazione, è il luogo simbolo della Frutera. Il pin indica questo tratto della strada.'},
    {id:'palazzo-apache',borgo:'Burg di Prà Neiva',name:'Palazzo Apache',icon:'palace',coordinates:[7.8443678,45.1800074],address:'Via Montesanto 47',description:'Il palazzo residenziale di via Montesanto, oltre il sottopasso, è il riferimento scelto per il borgo Prà Neiva. Si riconosce per i balconi e le tende della facciata.'}
  ];
  // Small line icons echo the ivory medallions of the Blender map.
  const icons = {
    chapel:'<path d="M5 20V10l7-5 7 5v10H5m5 0v-6h4v6M12 5V1M10 3h4"/>',
    civic:'<path d="M3 8l9-5 9 5H3m2 3v8m7-8v8m7-8v8M3 20h18M5 23h14"/>',
    baroque:'<path d="M3 21V7h5v14M2 7l3.5-4L9 7M5.5 3V1M9 21V12l6-4 6 4v9H3m10 0v-6h4v6"/>',
    church:'<path d="M3 21V11l5-4 4-1 5 2 4 3v10H3m7 0v-7h4v7M12 6V1M9 3h6"/>',
    street:'<path d="M5 2v20M19 2v20M12 3v3m0 4v4m0 4v3"/>',
    sport:'<rect x="2" y="5" width="20" height="14" rx="1"/><path d="M12 5v14M2 9h4v6H2m20-6h-4v6h4"/><circle cx="12" cy="12" r="3"/>',
    mural:'<rect x="2" y="4" width="18" height="14" rx="1"/><path d="M4 15l5-5 4 4 5-6M17 22l5-9"/><circle cx="7" cy="8" r="1"/>',
    palace:'<path d="M4 21V4h16v17H4M3 2h18M4 12h16m-12-5v2m4-2v2m4-2v2M8 16v2m4-2v2m4-2v2"/>'
  };
  function pinSVG(kind){
    return `<svg viewBox="0 0 44 62" width="44" height="62" aria-hidden="true" focusable="false"><path d="M22 42v16" fill="none" stroke="#193a37" stroke-width="1.5"/><circle cx="22" cy="59" r="2" fill="#193a37"/><path d="M22 3C11.5 3 4 10.5 4 20c0 10 12 19 18 26 6-7 18-16 18-26C40 10.5 32.5 3 22 3Z" fill="#193a37" stroke="#fffdf5" stroke-width="1.2"/><circle cx="22" cy="20" r="14.6" fill="#f5f0df"/><g transform="translate(11 9) scale(.92)" fill="none" stroke="#193a37" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${icons[kind]}</g></svg>`;
  }
  function mount(map,{popupHTML,preparePopup}){
    let focus=null,currentPopup=null,currentPlace=null;
    const entries=places.map(place=>{
      const element=document.createElement('div');element.className='landmark-marker';
      const button=document.createElement('button');button.type='button';button.className='landmark-pin';
      button.dataset.landmark=place.id;button.title=place.name;
      button.setAttribute('aria-label',`${place.name} — ${place.borgo}`);
      button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-expanded','false');
      button.innerHTML=pinSVG(place.icon);element.append(button);
      const marker=new maplibregl.Marker({element,anchor:'bottom',pitchAlignment:'viewport',rotationAlignment:'viewport'}).setLngLat(place.coordinates).addTo(map);
      button.addEventListener('click',event=>{
        event.stopPropagation();
        if(currentPopup)currentPopup.remove();
        // Avoid stacking a civic card and a place card on mobile.
        map.getContainer().querySelectorAll('.maplibregl-popup-close-button').forEach(b=>b.click());
        const popup=new maplibregl.Popup({offset:62,maxWidth:'340px',className:'landmark-popup',focusAfterOpen:true})
          .setLngLat(place.coordinates).setHTML(popupHTML(place));
        popup.on('close',()=>{
          button.setAttribute('aria-expanded','false');
          if(currentPopup===popup){currentPopup=null;currentPlace=null;}
        });
        currentPopup=popup;currentPlace=place;
        button.setAttribute('aria-expanded','true');
        preparePopup(popup).addTo(map);
      });
      return {place,element,button,marker};
    });
    function updateVisibility(){
      for(const {place,element} of entries)element.hidden=map.getZoom()<11.5||!!(focus&&focus!==place.borgo);
    }
    map.on('zoomend',updateVisibility);updateVisibility();
    return {
      setFocus(borgo){
        focus=borgo||null;
        if(currentPopup&&focus&&currentPlace.borgo!==focus)currentPopup.remove();
        updateVisibility();
      },
      remove(){if(currentPopup)currentPopup.remove();map.off('zoomend',updateVisibility);entries.forEach(e=>e.marker.remove());}
    };
  }
  window.BrandizzoLandmarks={places,mount};
})();
