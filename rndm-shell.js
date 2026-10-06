(()=>{
  const ready=(fn)=>document.readyState==='loading'?document.addEventListener('DOMContentLoaded',fn,{once:true}):fn();
  ready(()=>{
    if(!document.querySelector('.rndm-unified-header')) return;
    const current=(location.pathname.split('/').pop()||'index.html').toLowerCase();
    if(!document.querySelector('.rndm-mobile-bottom-nav')){
      const nav=document.createElement('nav');
      nav.className='rndm-mobile-bottom-nav';
      nav.setAttribute('aria-label','Мобильная навигация');
      const items=[
        ['index.html','⌂','Главная'],
        ['chat.html','💬','Чаты'],
        ['random.html','🎲','Рандом'],
        ['channels.html','📣','Каналы'],
        ['clips.html','▶','Clips']
      ];
      nav.innerHTML=items.map(([href,icon,label])=>
        `<a href="${href}" class="${current===href?'active':''}"><span class="mi">${icon}</span><span>${label}</span></a>`
      ).join('');
      document.body.appendChild(nav);
    }

    const menu=document.getElementById('rndmBurgerMenu');
    const backdrop=document.getElementById('rndmNavBackdrop');
    if(menu && backdrop){
      const sync=()=>{
        const open=menu.classList.contains('open');
        document.documentElement.style.overflow=open&&innerWidth<=820?'hidden':'';
      };
      new MutationObserver(sync).observe(menu,{attributes:true,attributeFilter:['class']});
      sync();
    }
  });
})();
