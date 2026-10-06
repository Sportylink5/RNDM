(()=>{
  const ready=(fn)=>document.readyState==='loading'?document.addEventListener('DOMContentLoaded',fn,{once:true}):fn();
  ready(()=>{
    const header=document.querySelector('.rndm-unified-header');
    if(!header) return;

    const current=(location.pathname.split('/').pop()||'index.html').toLowerCase();
    const core=new Set(['index.html','chat.html','random.html','channels.html','clips.html']);
    const q=s=>document.querySelector(s);
    const qa=s=>[...document.querySelectorAll(s)];

    // v26.2: one UI only. Retired page-level headers/navs are physically removed.
    // MutationObserver also catches old inline scripts that try to recreate them later.
    const legacySelectors=[
      'header.topbar','.shell > header.top','body > header.top','nav.bottom',
      'nav.mobile-bottom-nav','nav.mobile-nav','nav.mobile',
      '.mobile-more-sheet','.mobile-more-backdrop'
    ];
    const purgeLegacyShell=(scope=document)=>{
      legacySelectors.forEach(sel=>{
        try{scope.querySelectorAll?.(sel).forEach(el=>{
          if(el.closest?.('.rndm-unified-header'))return;
          el.remove();
        })}catch{}
      });
    };
    purgeLegacyShell();
    const legacyObserver=new MutationObserver(records=>{
      for(const rec of records){
        for(const node of rec.addedNodes){
          if(node?.nodeType!==1)continue;
          purgeLegacyShell(node);
          try{
            for(const sel of legacySelectors){
              if(node.matches?.(sel)&&!node.closest?.('.rndm-unified-header')){node.remove();break}
            }
          }catch{}
        }
      }
    });
    legacyObserver.observe(document.body,{childList:true,subtree:true});

    qa('[data-rndm-page]').forEach(a=>{
      a.classList.toggle('active',(a.getAttribute('data-rndm-page')||'').toLowerCase()===current);
    });

    const menu=q('#rndmBurgerMenu'),backdrop=q('#rndmNavBackdrop'),burger=q('#rndmBurgerButton'),close=q('#rndmBurgerClose');
    if(!core.has(current)) burger?.classList.add('active');
    const lock=()=>{document.documentElement.style.overflow=menu?.classList.contains('open')&&innerWidth<=820?'hidden':''};
    const shut=()=>{menu?.classList.remove('open');backdrop?.classList.remove('open');burger?.setAttribute('aria-expanded','false');lock()};
    const toggle=()=>{const open=!menu?.classList.contains('open');menu?.classList.toggle('open',open);backdrop?.classList.toggle('open',open);burger?.setAttribute('aria-expanded',open?'true':'false');lock()};
    burger?.addEventListener('click',toggle);close?.addEventListener('click',shut);backdrop?.addEventListener('click',shut);
    document.addEventListener('keydown',e=>{if(e.key==='Escape')shut()});
    addEventListener('resize',lock,{passive:true});

    const theme=q('#rndmUnifiedTheme');
    try{if(localStorage.getItem('rndm-theme')==='light')document.body.classList.add('light')}catch{}
    const syncTheme=()=>{if(theme)theme.textContent=document.body.classList.contains('light')?'☀️':'🌙'};
    syncTheme();
    theme?.addEventListener('click',()=>{
      document.body.classList.toggle('light');
      try{localStorage.setItem('rndm-theme',document.body.classList.contains('light')?'light':'dark')}catch{}
      syncTheme();
    });

    if(!q('.rndm-mobile-bottom-nav')){
      const nav=document.createElement('nav');
      nav.className='rndm-mobile-bottom-nav';nav.setAttribute('aria-label','Мобильная навигация');
      const items=[['index.html','⌂','Главная'],['chat.html','💬','Чаты'],['random.html','🎲','Рандом'],['channels.html','📣','Каналы'],['clips.html','▶','Clips']];
      nav.innerHTML=items.map(([href,icon,label])=>`<a href="${href}" class="${current===href?'active':''}"><span class="mi">${icon}</span><span>${label}</span></a>`).join('');
      document.body.appendChild(nav);
    }

    // Keep Clips upload accessible even though legacy topbars are hidden.
    const clipAction=q('#rndmClipAction');
    if(current==='clips.html'&&clipAction){
      clipAction.classList.add('rndm-show-action');
      clipAction.style.setProperty('display','inline-flex','important');
      clipAction.addEventListener('click',()=>{
        const legacy=q('#uploadClip'),file=q('#clipFile');
        if(legacy) legacy.click(); else file?.click();
      });
    }

    const syncAccount=async()=>{
      const link=q('#rndmUnifiedAccount');if(!link)return;
      try{
        if(!window.RNDMCloud?.configured?.()) return;
        const u=await window.RNDMCloud.user();if(!u)return;
        const p=await window.RNDMCloud.profile(u.id);if(!p)return;
        if(p.is_banned&&(!p.banned_until||new Date(p.banned_until)>new Date())&&!location.pathname.endsWith('/banned.html')){
          location.href='banned.html';return;
        }
        const icon=p.app_role==='owner'?'👑':p.app_role==='admin'?'🛡️':p.app_role==='moderator'?'🔧':'👤';
        const safe=window.RNDMCloud.esc?window.RNDMCloud.esc(p.username||'я'):String(p.username||'я').replace(/[<>&]/g,'');
        link.innerHTML=`<span>@${safe} ${icon}</span> 👤`;
        const staff=['owner','admin','moderator'].includes(p.app_role);
        qa('.v24-admin-link').forEach(x=>{x.hidden=!staff;x.setAttribute('aria-hidden',staff?'false':'true');x.classList.toggle('show',staff)});
      }catch(e){}
    };
    setTimeout(syncAccount,80);
  });
})();
