(() => {
  'use strict';
  const USER_KEY = 'censorship-enabled-v27';
  const GLOBAL_KEY = 'censorship_enabled';
  let globalEnabled = true;
  let userEnabled = true;
  let observer = null;
  let rt = null;
  let applying = false;

  // Common Russian/English profanity. The original text stays in Supabase;
  // masking is presentation-time so the user can turn the filter off again.
  const patterns = [
    /(^|[^\p{L}\p{N}_])((?:х+[\s._-]*[уy]+[\s._-]*(?:й|и|я|е|ё|ю|ли|ло|ня|йн|ёв|ев)\p{L}*))($|[^\p{L}\p{N}_])/giu,
    /(^|[^\p{L}\p{N}_])((?:б+[\s._-]*л+[\s._-]*(?:я|е|ё|и|ю|а)\p{L}*))($|[^\p{L}\p{N}_])/giu,
    /(^|[^\p{L}\p{N}_])((?:п+[\s._-]*и+[\s._-]*з+[\s._-]*д+\p{L}*))($|[^\p{L}\p{N}_])/giu,
    /(^|[^\p{L}\p{N}_])((?:[еeё]+[\s._-]*б+\p{L}*))($|[^\p{L}\p{N}_])/giu,
    /(^|[^\p{L}\p{N}_])((?:ёб+\p{L}*|ебан\p{L}*|ебат\p{L}*|ебуч\p{L}*))($|[^\p{L}\p{N}_])/giu,
    /(^|[^\p{L}\p{N}_])((?:с+[\s._-]*у+[\s._-]*к+(?:а|и|у|ой|е)?))($|[^\p{L}\p{N}_])/giu,
    /(^|[^\p{L}\p{N}_])((?:м+[\s._-]*у+[\s._-]*д+[\s._-]*(?:а|о|и|е|я|ё)\p{L}*))($|[^\p{L}\p{N}_])/giu,
    /(^|[^\p{L}\p{N}_])((?:долбоеб\p{L}*|долбоёб\p{L}*|гандон\p{L}*|шлюх\p{L}*|мраз\p{L}*|залуп\p{L}*))($|[^\p{L}\p{N}_])/giu,
    /(^|[^\p{L}\p{N}_])((?:f+[\s._-]*u+[\s._-]*c+[\s._-]*k+\p{L}*|shit\p{L}*|bitch\p{L}*|asshole\p{L}*))($|[^\p{L}\p{N}_])/giu
  ];

  const enabled = () => globalEnabled && userEnabled;
  const stars = s => '*'.repeat(Math.max(3, Array.from(String(s)).length));

  function mask(text) {
    let out = String(text ?? '');
    if (!enabled() || !out) return out;
    for (const rx of patterns) {
      rx.lastIndex = 0;
      out = out.replace(rx, (_, a, word, b) => `${a}${stars(word)}${b}`);
    }
    return out;
  }

  function shouldSkip(node) {
    const p = node?.parentElement;
    if (!p) return true;
    return !!p.closest('script,style,textarea,input,select,option,[contenteditable="true"],code,pre,.no-censor,[data-no-censor]');
  }

  function applyNode(node) {
    if (!enabled() || !node || node.nodeType !== Node.TEXT_NODE || shouldSkip(node)) return;
    const old = node.nodeValue || '';
    const next = mask(old);
    if (next !== old) node.nodeValue = next;
  }

  function applyTree(root=document.body) {
    if (!enabled() || !root || applying) return;
    applying = true;
    try {
      if (root.nodeType === Node.TEXT_NODE) applyNode(root);
      else {
        const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        let n; while ((n = w.nextNode())) applyNode(n);
      }
    } finally { applying = false; }
  }

  function startObserver() {
    observer?.disconnect();
    observer = new MutationObserver(muts => {
      if (!enabled() || applying) return;
      for (const m of muts) {
        if (m.type === 'characterData') applyNode(m.target);
        for (const n of m.addedNodes || []) applyTree(n);
      }
    });
    if (document.body) observer.observe(document.body,{subtree:true,childList:true,characterData:true});
  }

  function readLocal() {
    try {
      const v = localStorage.getItem(USER_KEY);
      userEnabled = v === null ? true : v !== 'false';
    } catch {}
  }

  async function hydrate() {
    readLocal();
    const C = window.RNDMCloud;
    const sb = C?.getClient?.();
    const u = await C?.user?.();
    if (sb) {
      const {data} = await sb.from('app_settings').select('value').eq('key',GLOBAL_KEY).maybeSingle();
      if (data && typeof data.value === 'boolean') globalEnabled = data.value;
      else if (data && data.value != null) globalEnabled = String(data.value) !== 'false';
    }
    if (u && C?.stateGet) {
      const row = await C.stateGet(USER_KEY);
      if (row?.value !== undefined && row?.value !== null) {
        userEnabled = row.value !== false && String(row.value) !== 'false';
        try { localStorage.setItem(USER_KEY,String(userEnabled)); } catch {}
      }
    }
    startObserver();
    applyTree();
    if (sb) {
      rt = sb.channel('rndm-censorship-setting-v27')
        .on('postgres_changes',{event:'UPDATE',schema:'public',table:'app_settings',filter:`key=eq.${GLOBAL_KEY}`},payload=>{
          const v=payload.new?.value;
          globalEnabled = v !== false && String(v) !== 'false';
          location.reload();
        }).subscribe();
    }
    window.dispatchEvent(new CustomEvent('rndm-censorship-ready',{detail:status()}));
  }

  function status(){ return {enabled:enabled(),globalEnabled,userEnabled}; }

  async function setUserEnabled(v) {
    userEnabled=!!v;
    try { localStorage.setItem(USER_KEY,String(userEnabled)); } catch {}
    try { await window.RNDMCloud?.stateSet?.(USER_KEY,userEnabled); } catch {}
    location.reload();
  }

  window.RNDMCensor = {mask,status,setUserEnabled,apply:applyTree,USER_KEY};
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',hydrate,{once:true});
  else hydrate();
})();