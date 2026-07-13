/** 
  * ePub printer for InformationPhilosopher.com (browser console widget)
  * @date 2026-07-13, 02:30
  * @link https://gmodebate.github.io/information-philosopher/
  */
(async () => {

  // clear console
  console.clear();

  // ensure valid site context
  if (document.location.hostname !== 'www.informationphilosopher.com') {
    if (confirm(`The widget can only be started on domain www.informationphilosopher.com.\n\nClick OK to navigate.`, true)) {
      document.location.href = 'https://www.informationphilosopher.com';
    }
    return;
  }

  // ============================================================
  // CONFIGURATION
  // ============================================================
  const CONFIG = {
    libs: {
      jszip:         'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js',
      fileSaver:     'https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js',
      dompurify:     'https://cdn.jsdelivr.net/npm/dompurify@3.0.6/dist/purify.min.js',
      mathjax:       'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js',

      // custom source: @epubkit/epub-gen-memory version v1.0.10-aplha.14
      epubGenMemory: 'https://gmodebate.github.io/cosmos/js/epub.js',
    },
    baseUrl:         'https://www.informationphilosopher.com',
    coverImageUrl:   'https://gmodebate.github.io/cosmos/i/b/information-philosopher/cover-de_DE.jpg',
    bannerImageUrl:  'https://gmodebate.github.io/cosmos/images/information-philosopher-banner.jpg',
    corsProxy:       window.corsProxy || 'https://corsproxy.io/?url=',
    epubTitle:       'Informationsphilosoph — Komplettes Nachschlagewerk',
    epubAuthor:      'Bob Doyle',
    epubPublisher:   'InformationPhilosopher.com (epub by gmodebate.github.io)',
    epubDescription: 'Eine vollständige Offline-EPUB-Edition von InformationPhilosopher.com.',
    epubAccessibilitySummary: 'A comprehensive philosophical reference text. Includes detailed table of contents, semantic markup for logical concepts and citations, and full support for reflowable text sizing. No images with missing alt text; all diagrams have text descriptions.',
    epubLanguage:    'en',
    epubDate:        new Date().toISOString().split('T')[0],
    fetchBatchSize:  12,
    fetchTimeout:    25000,
    fetchRetries:    2,
    maxTotalPages:   1000000,
  };

  // ============================================================
  // CONSOLE LOGGER
  // ============================================================
  const LOG = (() => {

    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Light mode: white-bg browser console
    // Primary text near-black (site default), accents from logo palette
    const lightColors = {
      banner:   '#1e2d6b',   // logo title navy — italic Georgia, prominent
      phase:    '#1e2d6b',   // same navy for section headers
      step:     '#1a4aaa',   // logo blue sphere — numbered steps
      ok:       '#2a7a2a',   // logo green sphere — success/ok states
      info:     '#1a1a1a',   // site default black text
      warn:     '#b87800',   // amber — kept, readable on white
      err:      '#cc2222',   // logo red sphere — errors
      progress: '#1a4aaa',   // logo blue sphere — monospace progress
      stat:     '#2e4080',   // mid-navy — monospace stats
      done:     '#2a7a2a',   // logo green sphere — completion
      link:     '#4a6898',   // muted navy — italic URL/link text
    };

    // Dark mode: deep navy console (Chrome dark DevTools ~#1e1e1e)
    // Lighten all logo colors for readability on near-black bg
    const darkColors = {
      banner:   '#c8ddf5',   // logo sky-blue highlight
      phase:    '#c8ddf5',   // sky-blue for section headers
      step:     '#7ab4e8',   // logo blue sphere, lightened
      ok:       '#4aaa4a',   // logo green sphere, lightened
      info:     '#d0d8e8',   // off-white with cool blue tint (site's dark bg feel)
      warn:     '#ffb84d',   // amber — kept
      err:      '#e86060',   // logo red sphere, lightened
      progress: '#7ab4e8',   // logo blue sphere — monospace progress
      stat:     '#8aaad0',   // mid sky-blue — monospace stats
      done:     '#4aaa4a',   // logo green sphere, lightened
      link:     '#5a7a9a',   // muted sky-blue — italic URL/link text
    };

    const colors = isDarkMode ? darkColors : lightColors;

    let S;
    const setup_S = () => {
      S = {
        // Georgia italic — matches logo title/subtitle font exactly
        banner:   `color:${colors.banner};font-size:1.1em;font-weight:bold;font-family:Georgia,serif;font-style:italic;`,

        // Section phase headers — navy underline rule echoes logo divider line
        phase:    `color:${colors.phase};font-size:1em;font-weight:bold;font-family:Georgia,serif;border-bottom:1px solid ${colors.phase};`,

        // Steps — blue sphere accent, bold sans
        step:     `color:${colors.step};font-weight:bold;`,

        // OK / success — green sphere
        ok:       `color:${colors.ok};font-weight:bold;`,

        // Body info — site default text style, Georgia for warmth
        info:     `color:${colors.info};font-family:Georgia,serif;`,

        // Warnings — amber, kept neutral (not in logo palette)
        warn:     `color:${colors.warn};font-weight:bold;`,

        // Errors — red sphere
        err:      `color:${colors.err};font-weight:bold;`,

        // Progress — blue sphere, monospace (matches .code-block style)
        progress: `color:${colors.progress};font-weight:bold;font-family:monospace;`,

        // Stats — navy/sky-blue, monospace
        stat:     `color:${colors.stat};font-family:monospace;`,

        // Done — green sphere, italic Georgia (mirrors banner style)
        done:     `color:${colors.done};font-size:1.1em;font-weight:bold;font-family:Georgia,serif;font-style:italic;`,

        // Links — muted navy italic, understated
        link:     `color:${colors.link};font-style:italic;font-size:0.9em;`,
      };
    }

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      setup_S();
    });
    setup_S();

    const ts = () => {
      const d = new Date();
      return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
    };

    const banner = () => {
      console.log(
        '%c\n' +
        '  ╔══════════════════════════════════════════════════════════╗\n' +
        '  ║                                                  \n' +
        '  ║   📖  INFORMATION PHILOSOPHER · EPUB GENERATOR   \n' +
        '  ║       informationphilosopher.com                 \n' +
        '  ║       A Complete Resource in Philosophy & Science\n' +
        '  ║                                                  \n' +
        '  ╚══════════════════════════════════════════════════════════╝\n',
        S.banner
      );
      console.log('%c  Bob Doyle · Harvard Astronomy · informationphilosopher.com', S.link);
      console.log('%c  EPUB generation started at ' + ts() + '\n', S.info);
    };

    // Phase header — major pipeline stage
    let _phaseNum = 0;
    const phase = (label) => {
      _phaseNum++;
      console.log(
        `%c\n  ── Phase ${_phaseNum}: ${label} ──────────────────────────────────`,
        S.phase
      );
    };

    // Step within a phase
    const step  = (msg) => console.log(`%c    ▸ ${msg}`, S.step);
    const ok    = (msg) => console.log(`%c    ✔  ${msg}`, S.ok);
    const info  = (msg) => console.log(`%c    ${msg}`, S.info);
    const warn  = (msg) => console.warn(`%c    ⚠  ${msg}`, S.warn);
    const err   = (msg, e) => {
      console.error(`%c    ✖  ${msg}`, S.err);
      if (e) console.error(e);
    };

    // Progress bar — only prints on 5% boundaries + first + last
    let _lastPct = -1;
    let _startTime = null;
    const startProgress = () => { _lastPct = -1; _startTime = Date.now(); };
    const progress = (cur, tot, label = '') => {
      const pct     = Math.round((cur / tot) * 100);
      const changed = pct !== _lastPct && (pct % 5 === 0 || cur === 1 || cur === tot);
      if (!changed) return;
      _lastPct = pct;
      const filled  = Math.round(pct / 5);
      const bar     = '█'.repeat(filled) + '░'.repeat(20 - filled);
      const elapsed = _startTime ? ((Date.now() - _startTime) / 1000).toFixed(1) + 's' : '';
      console.log(
        `%c    [${bar}] ${String(pct).padStart(3)}%  ${label}  ${elapsed}`,
        S.progress
      );
    };

    // Fetch result ticker — prints every N pages without flooding
    let _fetchCount = 0;
    const FETCH_TICK = 25; // print a line every 25 pages
    const fetchTick = (fetched, errors, total) => {
      _fetchCount++;
    };
    const resetFetchTick = () => { _fetchCount = 0; };

    // Section fetch summary — called after each section completes
    const sectionSummary = (sectionTitle, icon, ok_, skip_, err_) => {
      const total = ok_ + skip_ + err_;
      const pct   = total > 0 ? Math.round((ok_ / total) * 100) : 0;
      console.log(
        `%c    ${icon || '📂'} ${sectionTitle.padEnd(20)} ` +
        `${ok_} ok · ${skip_} skipped · ${err_} errors  (${pct}%)`,
        S.stat
      );
    };

    // Final summary table
    const summary = (obj) => {
      console.log('%c\n  ┌─────────────────────────────────────────────┐', S.phase);
      console.log('%c  │  📋  Build Summary                         ', S.phase);
      console.log('%c  ├─────────────────────────────────────────────┤', S.phase);
      Object.entries(obj).forEach(([k, v]) => {
        const key = k.padEnd(26);
        const val = String(v).padStart(14);
        console.log(`%c  │  ${key} ${val}  `, S.stat);
      });
      console.log('%c  └─────────────────────────────────────────────┘', S.phase);
    };

    const done = (filename, elapsed) => {
      console.log(
        `%c\n` +
        `  ╔══════════════════════════════════════════════════════════╗\n` +
        `  ║  ✅  EPUB READY                                    \n` +
        `  ║  ${filename.substring(0, 56).padEnd(56)} \n` +
        `  ║  Generated in ${String(elapsed + 's').padEnd(42)} \n` +
        `  ╚══════════════════════════════════════════════════════════╝\n`,
        S.done
      );
      console.log('%c  Your e-reader awaits. Happy reading. 📚\n', S.info);
    };

    return {
      banner, phase, step, ok, info, warn, err,
      startProgress, progress,
      fetchTick, resetFetchTick, sectionSummary,
      summary, done,
    };
  })();

  const _buildStart = Date.now();

  // ============================================================
  // UTILITIES
  // ============================================================
  const loadScript = (src) => new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error(`Failed to load: ${src}`));
    document.head.appendChild(s);
  });

  const slugify = (str) => 
    (str || '').toLowerCase()
      .replace(/[àáâãäå]/g,'a').replace(/[èéêë]/g,'e')
      .replace(/[ìíîï]/g,'i').replace(/[òóôõö]/g,'o')
      .replace(/[ùúûü]/g,'u').replace(/[ýÿ]/g,'y')
      .replace(/[ñ]/g,'n').replace(/[ç]/g,'c')
      .replace(/[^a-z0-9]+/g,'-')
      .replace(/^-+|-+$/g,'')
      .substring(0, 80);

  // ── URL normalisation ─────────────────────────────────────────
  // Strips fragments, and normalises to a
  // canonical form used as the dedup key throughout.

  const normaliseUrlRegex = {
    // Match HTML tags (encoded or literal), including incomplete anchors and closing tags
    htmlContent: /(%3C|<).*|(%22|")?(%3E|>)/gi,
    quotes: /(%E2%80%9C|%E2%80%9D|"|'|"|')/gi,
    quotes_single: /^(%E2%80%9C|%E2%80%9D|"|'|"|')*$/i,
    indexhtml: /\/index\.html.*$/i,
    fileext: /\.\w+$/,
    fileext_corruption: /(\.\w+)\/.*$/,
    trailingslash: /\/+$/g,
    dir_no_trailingslash: /\/[a-z0-9\-_]+$/,
    colonCorruption: /:.*$/,
    quoteCorruption: /".*$/,
    plusCorruption: /\/\+.*$/
  };

  const normaliseUrl = (url) => {
    try {

      const u = new URL(url);
      let path = (u.pathname || '/').split('?')[0];

      // Remove everything after a colon (malformed path corruption)
      if (normaliseUrlRegex.colonCorruption.test(path)) {
        path = path.replace(normaliseUrlRegex.colonCorruption, '');
      }

      // remove quote characters from path segments:
      // This handles: /dir/"/sub-dir/"
      if (normaliseUrlRegex.quotes.test(path)) {
        const pathSegments = path
          .split('/')
          .filter(segment => !normaliseUrlRegex.quotes_single.test(segment))
          .map(segment => segment.replace(normaliseUrlRegex.quotes, ''));
        
        path = '/' + pathSegments.join('/') + (pathSegments.length > 0 ? '/' : '');
      }

      // remove HTML tags and content (both literal and URL-encoded)
      // This handles: <a href=, </a>, <br>, %3Ca%20href=, etc.
      path = path.replace(normaliseUrlRegex.htmlContent, '');

      // remove trailing slashes and path corruption after file extensions
      // This handles: .html/ → .html, .html/introduction/info/ → .html
      if (normaliseUrlRegex.fileext_corruption.test(path)) {
        path = path.replace(normaliseUrlRegex.fileext_corruption, '$1');
      }

      // add trailing slash to directory paths (paths without file extensions)
      if (!normaliseUrlRegex.fileext.test(path) && !path.endsWith('/')) {
        path += '/';
      }

      // remove index.html from directory URLs
      if (normaliseUrlRegex.indexhtml.test(path)) {
        path = path.replace(normaliseUrlRegex.indexhtml, '/');
      }

      // Remove everything after a quote (malformed path corruption)
      if (normaliseUrlRegex.quoteCorruption.test(path)) {
        path = path.replace(normaliseUrlRegex.quoteCorruption, '');
      }

      // Remove everything after a quote (malformed path corruption)
      if (normaliseUrlRegex.plusCorruption.test(path)) {
        path = path.replace(normaliseUrlRegex.plusCorruption, '');
      }

      // add trailing slash for directories
      if (normaliseUrlRegex.dir_no_trailingslash.test(path)) {
        path += '/';
      }

      // clean up multiple consecutive slashes
      path = path.replace(normaliseUrlRegex.trailingslash, '/');

      if (/(https|false)/.test(path)) {
        console.log(url);
        LOG.err(url)
      }

      return u.origin + path + (u.search || '');
    } catch(_) { return url; }
  };

  // ── URL acceptance filter ─────────────────────────────────────
  const isAcceptableInternalUrl = (href, baseOrigin) => {
    if (!href) return false;
    const h = href.trim();
    if (h.startsWith('#'))           return false;
    if (h.startsWith('mailto:'))     return false;
    if (h.startsWith('javascript:')) return false;

    // Only allow .htm, .html, or no extension
    if (/\.[a-z0-9]+(\?.*)?$/i.test(h)) {
      if (!/\.(htm|html)(\?.*)?$/i.test(h)) return false;
    }

    if (h.startsWith('http')) {
      try { return new URL(h).origin === baseOrigin; }
      catch(_) { return false; }
    }
    return true; // relative or starts with /
  };

  const resolveUrl = (href, pageUrl) => {
    try { return new URL(href, pageUrl).href.split('#')[0]; }
    catch(_) { return null; }
  };

  // ── Image URL helpers ─────────────────────────────────────────
  const baseOriginStr = new URL(CONFIG.baseUrl).origin;

  // Returns the URL to embed in the EPUB for an image src.
  // - Same-origin images: absolute URL (epub-gen downloads them directly)
  // - External images: routed through CORS proxy
  // - Broken paths: rewritten to correct locations via IMG_REWRITES mapping
  const resolveImageUrl = (src, pageUrl) => {
    if (!src || src.startsWith('data:')) return src;
    
    // Check if src path needs rewriting
    let rewrittenSrc = src;
    try {
      const srcUrl = new URL(src, pageUrl);
      const srcPath = srcUrl.pathname;
      if (IMG_REWRITES[srcPath]) {
        rewrittenSrc = IMG_REWRITES[srcPath];
      }
    } catch(_) {
      // If not a valid URL, try treating src as a path directly
      if (IMG_REWRITES[src]) {
        rewrittenSrc = IMG_REWRITES[src];
      }
    }
    
    let abs;
    try {
      abs = new URL(rewrittenSrc, pageUrl).href;
    } catch(_) {
      return rewrittenSrc;
    }
    
    const imgOrigin = new URL(abs).origin;
    if (imgOrigin === baseOriginStr) {
      // Same-origin: return as-is (epub-gen fetches directly)
      return abs;
    }
    
    // External: route through CORS proxy
    return CONFIG.corsProxy + encodeURIComponent(abs);
  };


  // ── Name sorting helpers ──────────────────────────────────────
  const lowerParticles = new Set([
    'van','von','de','du','di','del','della','des','den','le','la','les',
    'of','the','af','av','da','do','dos','ter','ten','op','zum','zur',
  ]);
  const accentMap = {
    'À':'A','Á':'A','Â':'A','Ã':'A','Ä':'A','Å':'A',
    'È':'E','É':'E','Ê':'E','Ë':'E',
    'Ì':'I','Í':'I','Î':'I','Ï':'I',
    'Ò':'O','Ó':'O','Ô':'O','Õ':'O','Ö':'O',
    'Ù':'U','Ú':'U','Û':'U','Ü':'U',
    'Ý':'Y','Ÿ':'Y','Ñ':'N','Ç':'C',
  };
  const normaliseChar  = (ch) => accentMap[ch] || ch;
  const extractLastName = (n) => {
    let parts = (n||'').trim().split(/\s+/);
    
    // If no spaces found, try splitting by dots
    if (parts.length === 1) {
      const dotParts = parts[0].split('.');
      if (dotParts.length > 1) {
        parts = dotParts.filter(p => p.length > 0);
      }
    }
    
    if (parts.length === 1) return parts[0];
    
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i].toLowerCase().replace(/[^a-z]/g,'');
      if (!lowerParticles.has(p) && p.length > 0) return parts[i];
    }
    return parts[parts.length - 1];
  };

  const extractFirstName = (n) => {
    let parts = (n||'').trim().split(/\s+/);
    
    // If no spaces found, try splitting by dots
    if (parts.length === 1) {
      const dotParts = parts[0].split('.');
      if (dotParts.length > 1) {
        parts = dotParts.filter(p => p.length > 0);
      }
    }
    
    return (parts[0] || '');
  };

  const getSortLetter   = (lastName) => {
    const ch = (lastName||'').replace(/[^a-zA-ZÀ-ÿ]/g,'').charAt(0).toUpperCase();
    return normaliseChar(ch) || '#';
  };
  const sortByLastName  = (pages) => [...pages].sort((a, b) => {
    const letA = getSortLetter(extractLastName(a.title));
    const letB = getSortLetter(extractLastName(b.title));
    if (letA !== letB) return letA.localeCompare(letB);
    const fa = extractFirstName(a.title).toLowerCase();
    const fb = extractFirstName(b.title).toLowerCase();
    if (fa !== fb) return fa.localeCompare(fb);
    return a.title.localeCompare(b.title);
  });
  const groupByLetter   = (sortedPages) => {
    const map = new Map();
    sortedPages.forEach(page => {
      const letter = getSortLetter(extractLastName(page.title));
      if (!map.has(letter)) map.set(letter, []);
      map.get(letter).push(page);
    });
    map.forEach(arr => arr.sort((a, b) => {
      const fa = extractFirstName(a.title).toLowerCase();
      const fb = extractFirstName(b.title).toLowerCase();
      if (fa !== fb) return fa.localeCompare(fb);
      return a.title.localeCompare(b.title);
    }));
    return new Map([...map.entries()].sort((a, b) => a[0].localeCompare(b[0])));
  };

  // ── Fetch with timeout + retry ────────────────────────────────
  const fetchWithTimeout = async (url, retries = CONFIG.fetchRetries) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      const ctrl  = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), CONFIG.fetchTimeout);
      try {
        const res = await fetch(url, {
          signal: ctrl.signal,
          redirect: 'manual'
        });

        // redirect
        if (res.type === 'opaqueredirect') {
          LOG.err(`[301 → 404] Page not found: ${new URL(url).pathname}`);
          clearTimeout(timer);
          return {
            status: 301
          };
        }

        clearTimeout(timer);
        return res;
      } catch(e) {
        clearTimeout(timer);
        if (attempt === retries) throw e;
        await new Promise(r => setTimeout(r, 600 * attempt));
      }
    }
  };

  // ============================================================
  // HTML EXTRACTION
  // Single parse: caller passes the already-parsed document.
  //
  // Key fixes applied here:
  //   1. <a name="..."> anchors converted to <span id="...">
  //      to prevent the "whole text styled as link" bug.
  //   2. Images resolved with resolveImageUrl() for CORS proxy.
  //   3. Outbound links collected before DOM mutation.
  // ============================================================
  const extractFromDoc = (doc, sourceUrl, baseOrigin) => {
    // ── Title ─────────────────────────────────────────────────
    const title =
      doc.querySelector('.chaptertitle')?.textContent?.trim() ||
      doc.querySelector('title')?.textContent?.trim() ||
      doc.querySelector('h1')?.textContent?.trim() ||
      doc.querySelector('h2')?.textContent?.trim() ||
      doc.querySelector('h3')?.textContent?.trim() ||
      'Untitled';

    const description =
      doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';

    // ── Breadcrumb ────────────────────────────────────────────
    let rawBreadcrumbText = '';
    const bodyArea = doc.querySelector('#column23') || doc.querySelector('.bodycontent');

    // no content
    if (!bodyArea) {
      return false;
    }

    for (const bc of bodyArea.querySelectorAll('div.breadcrumbs')) {

      // html error: content in breadcrumbs
      let chaptertitle = bc.querySelector('.chaptertitle');
      if (chaptertitle) {
        let frag = document.createDocumentFragment();
        let els = [
          chaptertitle
        ];

        let c = chaptertitle;
        while (c.nextSibling) {
          c = c.nextSibling;
          els.push(c);
        }
        for (let el of els) {
          frag.appendChild(el);
        }
        if (bc.nextElementSibling) {
          bc.insertBefore(frag, bc.nextElementSibling);
        } else {
          bc.parentNode.appendChild(frag);
        }
      }

      if (bc.closest('#citation_info')) continue;
      const rawText = bc.textContent.trim().replace(/\s+/g,' ');
      if (!rawText || rawText.length < 8) continue;
      if (/^close$/i.test(rawText))       continue;
      if (/retrieved/i.test(rawText))     continue;
      if (/^\(\d{4}/.test(rawText))       continue;
      rawBreadcrumbText = rawText;
      break;
    }
  
    // ── Collect outbound internal links BEFORE cloning ────────
    const outboundLinks = [];
    bodyArea.querySelectorAll('a[href]').forEach(a => {
      const href = (a.getAttribute('href') || '').trim();
      if (!isAcceptableInternalUrl(href, baseOrigin)) return;

      const abs = resolveUrl(href, sourceUrl);
      const normUrl = normaliseUrl(abs);

      // verify again based on normalized URL
      if (!isAcceptableInternalUrl(normUrl, baseOrigin)) return;

      if (abs) outboundLinks.push(abs);
    });

    // ── Content clone ─────────────────────────────────────────
    let content = bodyArea.cloneNode(true);

    // detect empty page
    let body = (content.querySelector('.bodycontent') || content).cloneNode(true);
    body.querySelectorAll('a[id^=reader_level]').forEach((a) => {
      while (a.nextSibling && a.nextSibling.nodeName === '#text') {
        a.nextSibling.remove();
      }
      a.remove();
    });
    let skyFooter = body.querySelector('.skyFooter');
    if (skyFooter) {
      skyFooter.remove();
    }
    body.childNodes.forEach((n) => {
      if (n.nodeName === '#text' && n.textContent.trim() === '') {
        n.remove();
      }
      if (n.nodeName === '#comment') {
        n.remove();
      }
    });
    if (body.innerHTML.trim() === '') {
      return false;
    }

    // ── FIX: Convert <a name="..."> to <span id="..."> ───────
    // Named anchors without href cause the browser/epub-reader to
    // treat all following text as link content. Replace them with
    // inert <span id="..."> elements that preserve jump targets.
    content.querySelectorAll('a[name]').forEach(a => {
      const nameVal = a.getAttribute('name');
      const hasHref = a.hasAttribute('href') && (a.getAttribute('href') || '').trim() !== '';
      if (!hasHref) {
        // Pure named anchor — replace with span
        const span = doc.createElement('span');
        if (nameVal) span.setAttribute('id', nameVal);
        // Move any child nodes into the span
        while (a.firstChild) span.appendChild(a.firstChild);
        a.parentNode.replaceChild(span, a);
      }
      // If it has both name and href, leave it alone (it's a real link)
    });

    // ── Remove navigation chrome ──────────────────────────────
    [
      '#column1','#header','#header-wrapper','#main-menu',
      '#footer','.footernav','#search_bar','#citation_info',
      '#social_cluster','#social_links','#fb-root',
      'div.menu','script','style','noscript',
      '#reader_level_0_link','#reader_level_1_link','#reader_level_2_link',
      '.skyFooter',
    ].forEach(sel => content.querySelectorAll(sel).forEach(el => el.remove()));

    content.querySelectorAll('div.breadcrumbs').forEach(el => el.remove());

    // ── Clean up orphaned pipe/whitespace text nodes ──────────
    const cleanPipeRemnants = (node) => {
      const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
      const toRemove = [];
      let n;
      while ((n = walker.nextNode())) {
        if (/^[\s|]+$/.test(n.nodeValue)) toRemove.push(n);
      }
      toRemove.forEach(n => n.parentNode && n.parentNode.removeChild(n));
    };
    cleanPipeRemnants(content);

    const firstChapterTitle = content.querySelector('.chaptertitle');
    if (firstChapterTitle) firstChapterTitle.remove();

    // ── Reveal reader levels ──────────────────────────────────
    content.querySelectorAll('.reader_level_1,.div_1,.reader_level_2,.div_2')
      .forEach(el => { el.style.display = 'block'; });
    content.querySelectorAll('.reader_level_1_span,.span_1,.reader_level_2_span,.span_2')
      .forEach(el => { el.style.display = 'inline'; });

    // ── Resolve image src — with CORS proxy for external ──────
    content.querySelectorAll('img').forEach(img => {
      const src = img.getAttribute('src') || '';
      if (!src || src.startsWith('data:')) return;
      img.setAttribute('src', resolveImageUrl(src, sourceUrl));
    });

    content.querySelectorAll('img').forEach(img => {
      const src = img.getAttribute('src') || '';
      if (!src || src.startsWith('data:')) return;

      // Resolve absolute src (already done above for epub embedding)
      const absSrc = img.getAttribute('src'); // already resolved

      // Wrap in <a> if not already inside one
      if (!img.closest('a')) {
        const originalSrc = new URL(src, sourceUrl).href; // original, pre-proxy URL
        const link = document.createElement('a');
        link.setAttribute('href', originalSrc);
        link.setAttribute('class', 'epub-img-link');
        link.setAttribute('title', img.getAttribute('alt') || 'View image');
        img.parentNode.insertBefore(link, img);
        link.appendChild(img);
      }
    });

    // ── Replace iframes ───────────────────────────────────────
    content.querySelectorAll('iframe').forEach(iframe => {
      const src       = iframe.getAttribute('src') || '';
      const titleAttr = iframe.getAttribute('title') || 'External Content';
      const ytMatch   = src.match(/youtube\.com\/embed\/([^?&"]+)/);
      if (ytMatch) {
        const vid   = ytMatch[1];
        const watch = `https://www.youtube.com/watch?v=${vid}`;
        const thumb = CONFIG.corsProxy + encodeURIComponent(
          `https://img.youtube.com/vi/${vid}/hqdefault.jpg`
        );
        const div = document.createElement('div');
        div.className = 'epub-media-banner epub-youtube';
        div.innerHTML =
          `<a href="${watch}" class="epub-media-link">` +
          `<img src="${thumb}" alt="YouTube thumbnail" class="epub-media-thumb"/>` +
          `<span class="epub-media-label">▶ Watch on YouTube</span>` +
          `<span class="epub-media-url">${watch}</span></a>`;
        iframe.parentNode.replaceChild(div, iframe);
        return;
      }
      const resolved = src.startsWith('/')
        ? CONFIG.baseUrl + src
        : src.startsWith('http') ? src : resolveImageUrl(src, sourceUrl);
      const div = document.createElement('div');
      div.className = 'epub-media-banner epub-iframe';
      div.innerHTML =
        `<a href="${resolved}" class="epub-media-link">` +
        `<span class="epub-media-icon">🔗</span>` +
        `<span class="epub-media-label">${titleAttr}</span>` +
        `<span class="epub-media-url">${resolved}</span></a>`;
      iframe.parentNode.replaceChild(div, iframe);
    });

    // ── Replace video elements ────────────────────────────────
    content.querySelectorAll('video').forEach(video => {
      const source = video.querySelector('source');
      let vsrc     = source?.getAttribute('src') || video.getAttribute('src') || '';
      vsrc = resolveImageUrl(vsrc, sourceUrl);
      const div = document.createElement('div');
      div.className = 'epub-media-banner epub-video';
      div.innerHTML =
        `<a href="${vsrc}" class="epub-media-link">` +
        `<span class="epub-media-icon">🎬</span>` +
        `<span class="epub-media-label">Video</span>` +
        `<span class="epub-media-url">${vsrc}</span></a>`;
      video.parentNode.replaceChild(div, video);
    });

    // ── Absolutise remaining links in content area ────────────
    // (Internal links will be rewritten to .xhtml in a later pass)
    content.querySelectorAll('a[href]').forEach(a => {
      if (a.classList.contains('epub-source-url-link')) return;
      if (a.closest('.epub-source-footer'))             return;
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') ||
          href.startsWith('mailto:') || href.startsWith('javascript:')) return;
      if (href.startsWith('/'))
        a.setAttribute('href', CONFIG.baseUrl + href);
      else if (!href.startsWith('http'))
        a.setAttribute('href', new URL(href, sourceUrl).href);
    });

    // ── Source attribution footer ─────────────────────────────
    const footer = document.createElement('div');
    footer.className = 'epub-source-footer';
    footer.innerHTML =
      `<hr class="epub-source-rule"/>` +
      `<p class="epub-source-link">Source: ` +
      `<a href="${sourceUrl}" class="epub-source-url-link">${sourceUrl}</a></p>`;
    content.appendChild(footer);

    return { title, description, rawBreadcrumbText, content: content.innerHTML, outboundLinks };
  };

  // ============================================================
  // DYNAMIC NAV DISCOVERY
  // ============================================================
  const parseGlobalNav = (doc) => {
    const sections = {};
    doc.querySelectorAll('div.menu[id]').forEach(div => {
      const id    = div.getAttribute('id');
      const items = [];
      div.querySelectorAll('a.menuItem[href]').forEach(a => {
        let href  = (a.getAttribute('href') || '').trim();
        if (!/informationphilosopher\.com/i.test(a.hostname)) {
          return;
        }
        const title = a.textContent.trim().replace(/\s+/g,' ');

        if (href && title) items.push({ title, url: a.pathname });
      });
      if (items.length) sections[id] = items;
    });
    return sections;
  };

  const parseLeftColumnLists = (doc) => {
    const col = doc.querySelector('#column1');
    if (!col) return { philosophers: [], scientists: [] };

    const philosophers = [], scientists = [];
    let mode = null;
    const container = col.querySelector('.linksLeftCol') || col;

    const walk = (node) => {
      for (const child of node.childNodes) {
        if (child.nodeType === Node.TEXT_NODE) {
          const t = child.textContent.trim();
          if (/^Philosophers$/i.test(t)) { mode = 'philosophers'; continue; }
          if (/^Scientists$/i.test(t))   { mode = 'scientists';   continue; }
          if (/^Presentations$/i.test(t)){ mode = null;           continue; }
        }
        if (child.nodeType === Node.ELEMENT_NODE) {
          if (child.tagName === 'A' && child.getAttribute('href')) {
            const href  = (child.getAttribute('href') || '').trim();
            if (!/informationphilosopher\.com/i.test(child.hostname)) {
              continue;
            }
            const title = child.textContent.trim().replace(/\s+/g,' ');

            if (href && title) {
              if (mode === 'philosophers') philosophers.push({ title, url: child.pathname });
              if (mode === 'scientists')   scientists.push({ title, url: child.pathname });
            }
          } else {
            walk(child);
          }
        }
      }
    };
    walk(container);
    return { philosophers, scientists };
  };

  const discoverSiteStructure = async (presetSections) => {
    LOG.phase('Discovering Site Structure');
    let liveNav = null, livePhilosophers = [], liveScientists = [];
    try {
      const res = await fetchWithTimeout(CONFIG.baseUrl + '/');
      if (res.ok) {
        const html = await res.text();
        const doc  = new DOMParser().parseFromString(html, 'text/html');
        liveNav    = parseGlobalNav(doc);
        const lists = parseLeftColumnLists(doc);
        livePhilosophers = lists.philosophers;
        liveScientists   = lists.scientists;
        LOG.ok(
          `Live nav parsed — ${Object.keys(liveNav).length} sections · ` +
          `${livePhilosophers.length} philosophers · ${liveScientists.length} scientists`
        );
        if (livePhilosophers.length === 0)
          LOG.warn('No philosophers found in left column — check selector');
      } else {
        throw new Error(`invalid response from InformationPhilosopher.com server`);
      }
    } catch(e) {
      LOG.warn('Dynamic discovery failed — using preset structure only');
    }

    const mergeLists = (presetList, liveList) => {
      if (!liveList?.length) return presetList.filter((p) => {
        return p.url;
      });
      const presetUrls = new Set(presetList.filter((p) => {
        return p.url;
      }).map(p => normaliseUrl(CONFIG.baseUrl + p.url)));
      const merged = [...presetList.filter((p) => {
        return p.url;
      })];
      liveList.forEach(item => {
        let url = item.url.startsWith('/') ? item.url : '/' + item.url;
        let normUrl = normaliseUrl(CONFIG.baseUrl + url);

        let normPath = new URL(normUrl).pathname;
        if (typeof URL_REWRITES[normPath] !== 'undefined') {

            // removed by rewrite
            if (URL_REWRITES[normPath] === false) {
              return;
            }

            url = new URL(normUrl);
            url.pathname = URL_REWRITES[normPath];
            
            normUrl = normaliseUrl(url.href);
            url = url.pathname;
        }

        if (!presetUrls.has(normUrl)) {
          merged.push({ title: item.title, url });
          presetUrls.add(normUrl);
        }
      });
      return merged;
    };

    const navIdMap = {
      introduction:'Introduction', problems:'Problems', freedom:'Freedom',
      value:'Value', knowledge:'Knowledge', life:'Life', mind:'Mind',
      chance:'Chance', quantum:'Quantum', entanglement:'Entanglement',
      scandals:'Scandals',
    };

    return presetSections.map(section => {
      const navId = Object.keys(navIdMap).find(id => navIdMap[id] === section.title);
      if (navId && liveNav?.[navId]) {
        const liveItems  = liveNav[navId];
        const presetUrls = new Set(section.pages.map(p => normaliseUrl(CONFIG.baseUrl + p.url)));
        const merged     = [...section.pages];
        liveItems.forEach(item => {
          let url = item.url.startsWith('/') ? item.url : '/' + item.url;
          let normUrl = normaliseUrl(CONFIG.baseUrl + url);

          let normPath = new URL(normUrl).pathname;
          if (typeof URL_REWRITES[normPath] !== 'undefined') {

              // removed by rewrite
              if (URL_REWRITES[normPath] === false) {
                return;
              }

              url = new URL(normUrl);
              url.pathname = URL_REWRITES[normPath];

              normUrl = normaliseUrl(url.href);
              url = url.pathname;
          }

          if (!presetUrls.has(normUrl)) {
            merged.push({ title: item.title, url });
            presetUrls.add(normUrl);
          }
        });

        return { ...section, pages: merged };
      }
      if (section.title === 'Philosophers' && livePhilosophers.length)
        return { ...section, pages: mergeLists(section.pages, livePhilosophers) };
      if (section.title === 'Scientists' && liveScientists.length)
        return { ...section, pages: mergeLists(section.pages, liveScientists) };
      return section;
    });
  };

  // ============================================================
  // PRESET SECTIONS
  // ============================================================
  const buildPresetSections = () => [
    {
      title: 'Introduction', icon: '🌐',
      description: 'The foundational framework of Information Philosophy.',
      crawlScope: ['/introduction/'],
      pages: [
        { title: 'Introduction Overview',         url: '/introduction/' },
        { title: 'The Information',               url: '/introduction/information/' },
        { title: 'The Creation',                  url: '/introduction/creation/' },
        { title: 'The Physics',                   url: '/introduction/physics/' },
        { title: 'The Biology',                   url: '/introduction/biology/' },
        { title: 'The Philosophy',                url: '/introduction/philosophy/' },
        { title: 'The Problems',                  url: '/problems/' },
        { title: 'The Solutions',                 url: '/solutions/' },
        { title: 'The Experiments',               url: '/solutions/experiments/' },

        // testing
        { title: 'test', url: '/solutions/scientists/dirac/chapter_1.html' }
      ],
    },
    {
      title: 'Problems', icon: '❓',
      description: 'The great unsolved problems of philosophy and science.',
      crawlScope: ['/problems/'],
      pages: [
        { title: 'Problems Overview',             url: '/problems/' },
        { title: 'Arrow of Time',                 url: '/problems/arrow_of_time/' },
        { title: 'Consciousness',                 url: '/problems/consciousness/' },
        { title: 'Dualisms',                      url: '/solutions/dualisms/' },
        { title: 'Ergodicity',                    url: '/problems/ergodicity/' },
        { title: 'Evil',                          url: '/problems/evil/' },
        { title: 'Flat Universe?',                url: '/problems/flatness/' },
        { title: 'God',                           url: '/problems/god/' },
        { title: 'Identity',                      url: '/problems/identity/' },
        { title: 'Immortality',                   url: '/problems/immortality/' },
        { title: 'Induction',                     url: '/problems/induction/' },
        { title: 'Life',                          url: '/problems/life/' },
        { title: 'Measurement',                   url: '/problems/measurement/' },
        { title: 'Mental Causation',              url: '/problems/mental_causation/' },
        { title: 'Metaphysics',                   url: '/problems/metaphysics/' },
        { title: 'Mind-Body',                     url: '/problems/mind_body/' },
        { title: 'Nonlocality',                   url: '/problems/nonlocality/' },
        { title: 'Possibilities',                 url: '/freedom/possibilities.html' },
        { title: 'Recurrence',                    url: '/problems/recurrence/' },
        { title: 'Reversibility',                 url: '/problems/reversibility/' },
      ],
    },
    {
      title: 'Freedom', icon: '🕊️',
      description: 'Free will, determinism, moral responsibility, and the physics of human agency.',
      crawlScope: ['/freedom/'], 
      pages: [
        { title: 'Freedom Overview',              url: '/freedom/' },
        { title: 'The Cogito',                    url: '/freedom/cogito/' },
        { title: 'The Problem of Free Will',      url: '/freedom/problem/' },
        { title: 'The History of Free Will',      url: '/freedom/history/' },
        { title: 'Free Will in Antiquity',        url: '/freedom/free_will_in_antiquity.html' },
        { title: 'Free Will Mechanisms',          url: '/freedom/mechanisms.html' },
        { title: 'The Physics of Freedom',        url: '/freedom/physics/' },
        { title: 'The Biology of Freedom',        url: '/freedom/biology/' },
        { title: 'The Neuroscience of Freedom',   url: '/freedom/neuroscience/' },
        { title: 'Alternative Possibilities',     url: '/freedom/alternative_possibilities.html' },
        { title: 'Adequate Determinism',          url: '/freedom/adequate_determinism.html' },
        { title: 'Moral Responsibility',          url: '/freedom/moral_responsibility.html' },
        { title: 'Self-Determination',            url: '/freedom/self-determination.html' },
        { title: 'Separability of Free and Will', url: '/freedom/separability.html' },
        { title: 'The Standard Argument',         url: '/freedom/standard_argument.html' },
        { title: 'Superdeterminism',              url: '/freedom/superdeterminism.html' },
        { title: 'Two-Stage Models',              url: '/freedom/two-stage_models.html' },
      ],
    },
    {
      title: 'Value', icon: '⚖️',
      description: 'The objective foundation of values, ethics, and the good.',
      crawlScope: ['/value/'],
      pages: [
        { title: 'Value Overview',                url: '/value/' },
        { title: 'The Ergo',                      url: '/value/ergo/' },
        { title: 'Free Energy',                   url: '/value/free_energy/' },
        { title: 'The Problem of Value',          url: '/value/problem/' },
        { title: 'The History of Value',          url: '/value/history/' },
        { title: 'The Good',                      url: '/value/good/' },
        { title: 'Origin of the Good',            url: '/value/origin/' },
        { title: 'Evil (Theodicy)',               url: '/value/evil/' },
        { title: 'The Ergod',                     url: '/value/ergod/' },
      ],
    },
    {
      title: 'Knowledge', icon: '🔍',
      description: 'Epistemology, truth, belief, emergence, and the limits of human knowledge.',
      crawlScope: ['/knowledge/'],
      pages: [
        { title: 'Knowledge Overview',            url: '/knowledge/' },
        { title: 'The Sum of Knowledge',          url: '/knowledge/sum/' },
        { title: 'The Problem of Knowledge',      url: '/knowledge/problem/' },
        { title: 'The History of Knowledge',      url: '/knowledge/history/' },
        { title: 'Belief',                        url: '/knowledge/belief/' },
        { title: 'Complexity',                    url: '/knowledge/complexity/' },
        { title: 'Complex Systems History',       url: '/knowledge/complexity/history' },
        { title: 'Demarcation Problem',           url: '/knowledge/demarcation/' },
        { title: 'Emergence',                     url: '/knowledge/emergence.html' },
        { title: 'Epistemology',                  url: '/problems/epistemology/' },
        { title: 'Infinite Regress',              url: '/knowledge/infinite_regress.html' },
        { title: 'Meaning',                       url: '/knowledge/meaning/' },
        { title: 'Ontology',                      url: '/problems/ontology/' },
        { title: 'One or Many',                   url: '/problems/one_or_many/' },
        { title: 'Providence',                    url: '/knowledge/providence/' },
        { title: 'Universals',                    url: '/knowledge/universals.html' },
        { title: 'Truth',                         url: '/knowledge/truth/' },
      ],
    },
    {
      title: 'Life', icon: '🧬',
      description: 'The origin, nature, and purpose of life — from biology to teleology.',
      crawlScope: ['/life/'],
      pages: [
        { title: 'Life Overview',                 url: '/life/' },
        { title: 'Agency',                        url: '/life/agency/' },
        { title: 'Autopoiesis',                   url: '/life/autopoesis/' },
        { title: 'Beyond Darwinism?',             url: '/life/beyond/' },
        { title: 'Biosemiotics',                  url: '/life/biosemiotics/' },
        { title: 'Biosphere',                     url: '/life/biosphere/' },
        { title: 'Complexity',                    url: '/life/complexity/' },
        { title: 'Emergence',                     url: '/life/emergence/' },
        { title: 'Entelechy',                     url: '/life/entelechy/' },
        { title: 'Entropy',                       url: '/life/entropy/' },
        { title: 'Epigenetics',                   url: '/life/epigenetics/' },
        { title: 'Gaia',                          url: '/life/gaia/' },
        { title: 'Information in Biology',        url: '/life/infobiology/' },
        { title: 'Intelligent Design',            url: '/life/design/' },
        { title: 'Meaning',                       url: '/life/meaning/' },
        { title: 'Origins of Life',               url: '/life/origins/' },
        { title: 'Purpose',                       url: '/life/goal/' },
        { title: 'Reductionism',                  url: '/life/reductionism/' },
        { title: 'Reverence for Life',            url: '/life/reverence/' },
        { title: 'Teleology',                     url: '/life/teleology/' },
        { title: 'Teleonomy',                     url: '/life/teleonomy/' },
        { title: 'Universal Darwinism',           url: '/life/universal_darwinism/' },
        { title: 'Vitalism',                      url: '/life/vitalism/' },
      ],
    },
    {
      title: 'Mind', icon: '🧠',
      description: 'Consciousness, the mind-body problem, neural correlates, and theories of mind.',
      crawlScope: ['/mind/'],
      pages: [
        { title: 'Mind Overview',                 url: '/mind/' },
        { title: 'The History of Mind',           url: '/mind/history/' },
        { title: 'Mind-Body Problem',             url: '/mind/mind_body/' },
        { title: 'Binding Problem',               url: '/mind/binding/' },
        { title: 'Consciousness Problem',         url: '/mind/consciousness/' },
        { title: 'Theories of Consciousness',     url: '/mind/tocs/' },
        { title: 'Neural Correlates',             url: '/mind/NCC/' },
        { title: 'Computational Models',          url: '/mind/cogscience/' },
        { title: 'Is Mind a Large Language Model?', url: '/mind/llm/' },
        { title: 'The Experience Recorder (ERR)', url: '/mind/ERR/' },
        { title: 'Mirror Neurons',                url: '/mind/mirror_neurons/' },
        { title: 'Mental Causation',              url: '/knowledge/mental_causation.html' },
        { title: 'Panpsychism',                   url: '/mind/panpsychism' },
        { title: 'Purpose',                       url: '/mind/purpose/' },
        { title: 'Agency',                        url: '/mind/agency/' },
        { title: 'Reductionism',                  url: '/knowledge/reductionism.html' },
        { title: 'Representation',                url: '/knowledge/representation/' },
      ],
    },
    {
      title: 'Chance', icon: '🎲',
      description: 'Randomness, probability, entropy, and the role of chance in philosophy.',
      crawlScope: ['/chance/'],
      pages: [
        { title: 'Chance Overview',               url: '/chance/' },
        { title: 'The History of Chance',         url: '/chance/history/' },
        { title: 'Entropy and Probability',       url: '/introduction/physics/statistical_mechanics.html' },
        { title: "Peirce's Tyche",                url: '/chance/tyche/' },
        { title: "Through Einstein's Eyes",       url: '/solutions/scientists/einstein/' },
      ],
    },
    {
      title: 'Quantum', icon: '⚛️',
      description: 'Quantum mechanics, measurement, wave functions, and interpretations.',
      crawlScope: ['/quantum/'],
      pages: [
        { title: 'Quantum Overview',              url: '/quantum/' },
        { title: 'Black Holes',                   url: '/quantum/black_holes/' },
        { title: 'Collapse of the Wave Function', url: '/quantum/collapse/' },
        { title: 'Conscious Observer',            url: '/quantum/observer/' },
        { title: 'Copenhagen Interpretation',     url: '/quantum/copenhagen/' },
        { title: 'Decoherence',                   url: '/quantum/decoherence/' },
        { title: 'Determinism',                   url: '/quantum/determinism/' },
        { title: 'Indeterminism',                 url: '/quantum/indeterminism/' },
        { title: "Dirac's Principles",            url: '/quantum/principles/' },
        { title: "Dirac's 3 Polarizers",          url: '/solutions/experiments/dirac_3-polarizers/' },
        { title: 'Foundations',                   url: '/quantum/foundation/' },
        { title: 'Interpretations',               url: '/quantum/interpretations/' },
        { title: 'Measurement Problem',           url: '/problems/measurement/' },
        { title: 'Quantum, Thermo, Info',         url: '/quantum/physics/' },
        { title: 'Quantum to Classical',          url: '/introduction/physics/quantum_to_classical.html' },
        { title: 'Recurrence Problem',            url: '/problems/recurrence/' },
        { title: "Schrödinger's Cat",             url: '/solutions/experiments/schrodingerscat/' },
        { title: 'Schrödinger Equation',          url: '/quantum/equation/' },
        { title: 'SpaceTime',                     url: '/quantum/spacetime/' },
        { title: 'Statistical Interpretation',    url: '/quantum/statistical/' },
        { title: 'Superposition',                 url: '/quantum/superposition/' },
        { title: 'The Only Mystery',              url: '/quantum/mystery/' },
        { title: 'Two-Slit Experiment',           url: '/quantum/two-slit/' },
        { title: 'Uncertainty Principle',         url: '/quantum/uncertainty/' },
        { title: 'Wave-Particle Duality',         url: '/introduction/physics/wave-particle_duality.html' },
      ],
    },
    {
      title: 'Entanglement', icon: '🔗',
      description: "Quantum entanglement, nonlocality, Bell's theorem, and spooky action.",
      crawlScope: ['/entanglement/', '/quantum/'],
      pages: [
        { title: 'Entanglement Overview',         url: '/entanglement/' },
        { title: "Bell's Theorem",                url: '/quantum/bell_theorem/' },
        { title: "Bell's Kinky Polytope",         url: '/entanglement/polytope/' },
        { title: 'Common Cause?',                 url: '/entanglement/common_cause/' },
        { title: 'Disentanglement',               url: '/quantum/disentanglement/' },
        { title: 'EPR Paradox',                   url: '/solutions/experiments/EPR/' },
        { title: 'Fresnel-Arago Effect',          url: '/quantum/fresnel-arago/' },
        { title: 'Hidden Constant of Motion?',    url: '/quantum/hidden_constant/' },
        { title: 'Hidden Variables?',             url: '/entanglement/hidden_variables/' },
        { title: 'Mach-Zender',                   url: '/quantum/mach_zender/' },
        { title: 'Quantum Keys',                  url: '/quantum/keys/' },
        { title: 'Nonlocality',                   url: '/problems/nonlocality/' },
        { title: 'Nonseparability',               url: '/problems/nonseparability/' },
        { title: 'Quantum Weirdness',             url: '/quantum/weirdness/' },
        { title: 'Qubits',                        url: '/quantum/qubits/' },
        { title: 'Spherical Symmetry',            url: '/entanglement/spherical/' },
        { title: 'Spooky Action at a Distance',   url: '/solutions/experiments/spooky/' },
        { title: "Wheeler's Delayed Choice",      url: '/quantum/delayed_choice/' },
      ],
    },
    {
      title: 'Scandals', icon: '⚡',
      description: 'The great intellectual scandals — where philosophy and science have gone wrong.',
      crawlScope: ['/scandals/'],
      pages: [
        { title: 'Scandals Overview',             url: '/scandals/' },
        { title: 'Scandal of Chance',             url: '/scandals/chance/' },
        { title: 'Scandal of Consciousness',      url: '/scandals/consciousness/' },
        { title: 'Scandal of Creation',           url: '/scandals/creation/' },
        { title: 'Scandal of Einstein',           url: '/scandals/einstein/' },
        { title: 'Scandal of Free Will',          url: '/scandals/free_will/' },
        { title: 'Scandal of God',                url: '/scandals/god/' },
        { title: 'Scandal of Knowledge',          url: '/scandals/knowledge/' },
        { title: 'Scandal of Life',               url: '/scandals/life/' },
        { title: 'Scandal of Meaning',            url: '/scandals/meaning/' },
        { title: 'Scandal of Metaphysics',        url: '/scandals/metaphysics/' },
        { title: 'Scandal of Mind',               url: '/scandals/mind/' },
        { title: 'Scandal of Power',              url: '/scandals/power/' },
        { title: 'Scandal of Values',             url: '/scandals/value/' },
        { title: 'Scandal of Wealth',             url: '/scandals/wealth/' },
      ],
    },
    {
      title: 'Philosophers', icon: '🏛️',
      description: 'Critical profiles of hundreds of philosophers — from Aristotle to Wittgenstein.',
      description_extended: 'Critical profiles of hundreds of philosophers — from Aristotle to Wittgenstein. We include those philosophers whose work made the greatest contribution to our three major information philosophy problems, <a href="knowledge-knowledge.xhtml">knowledge</a>, <a href="value-value.xhtml">value</a>, and <a href="freedom-freedom.xhtml">freedom</a> of the will.', 
      isIndex: true, indexType: 'philosophers',
      crawlScope: ['/solutions/philosophers/', '/knowledge/philosophers/'],
      pages: [
        { title: 'Philosophers Overview',         url: '/solutions/philosophers/' },
        { title: 'Mortimer Adler',                url: '/solutions/philosophers/adler/' },
        { title: 'Rogers Albritton',              url: '/solutions/philosophers/albritton/' },
        { title: 'Alexander of Aphrodisias',      url: '/solutions/philosophers/alexander/' },
        { title: 'Samuel Alexander',              url: '/solutions/philosophers/alexanders/' },
        { title: 'William Alston',                url: '/knowledge/philosophers/alston/' },
        { title: 'Anaximander',                   url: '/solutions/philosophers/anaximander/' },
        { title: 'G.E.M. Anscombe',               url: '/solutions/philosophers/anscombe/' },
        { title: 'Anselm',                        url: '/solutions/philosophers/anselm/' },
        { title: 'Louise Antony',                 url: '/solutions/philosophers/antony/' },
        { title: 'Thomas Aquinas',                url: '/solutions/philosophers/aquinas/' },
        { title: 'Aristotle',                     url: '/solutions/philosophers/aristotle/' },
        { title: 'David Armstrong',               url: '/knowledge/philosophers/armstrong/' },
        { title: 'Harald Atmanspacher',           url: '/solutions/philosophers/atmanspacher/' },
        { title: 'Robert Audi',                   url: '/knowledge/philosophers/audi/' },
        { title: 'Augustine',                     url: '/solutions/philosophers/augustine/' },
        { title: 'J.L. Austin',                   url: '/solutions/philosophers/austin/' },
        { title: 'A.J. Ayer',                     url: '/solutions/philosophers/ayer/' },
        { title: 'Alexander Bain',                url: '/solutions/philosophers/bain/' },
        { title: 'Mark Balaguer',                 url: '/solutions/philosophers/balaguer/' },
        { title: 'Jeffrey Barrett',               url: '/solutions/philosophers/barrett/' },
        { title: 'William Barrett',               url: '/solutions/philosophers/barrettw/' },
        { title: 'William Belsham',               url: '/solutions/philosophers/belsham/' },
        { title: 'Henri Bergson',                 url: '/solutions/philosophers/bergson/' },
        { title: 'George Berkeley',               url: '/solutions/philosophers/berkeley/' },
        { title: 'Isaiah Berlin',                 url: '/solutions/philosophers/berlin/' },
        { title: 'Richard J. Bernstein',          url: '/solutions/philosophers/bernstein/' },
        { title: 'Bernard Berofsky',              url: '/solutions/philosophers/berofsky/' },
        { title: 'Robert Bishop',                 url: '/solutions/philosophers/bishop/' },
        { title: 'Max Black',                     url: '/solutions/philosophers/black/' },
        { title: 'Susan Blackmore',               url: '/solutions/philosophers/blackmore/' },
        { title: 'Susanne Bobzien',               url: '/solutions/philosophers/bobzien/' },
        { title: 'Emil du Bois-Reymond',          url: '/solutions/philosophers/bois-reymond/' },
        { title: 'Hilary Bok',                    url: '/solutions/philosophers/bok/' },
        { title: 'Laurence BonJour',              url: '/knowledge/philosophers/bonjour/' },
        { title: 'George Boole',                  url: '/solutions/philosophers/boole/' },
        { title: 'Émile Boutroux',                url: '/solutions/philosophers/boutroux/' },
        { title: 'F.H. Bradley',                  url: '/solutions/philosophers/bradley/' },
        { title: 'C.D. Broad',                    url: '/solutions/philosophers/broad/' },
        { title: 'Michael Burke',                 url: '/solutions/philosophers/burke/' },
        { title: 'Jeremy Butterfield',            url: '/solutions/philosophers/butterfield/' },
        { title: 'Lawrence Cahoone',              url: '/solutions/philosophers/cahoone/' },
        { title: 'C.A. Campbell',                 url: '/solutions/philosophers/campbell/' },
        { title: 'Joseph Keim Campbell',          url: '/solutions/philosophers/campbellj/' },
        { title: 'Rudolf Carnap',                 url: '/solutions/philosophers/carnap/' },
        { title: 'Carneades',                     url: '/solutions/philosophers/carneades/' },
        { title: 'Nancy Cartwright',              url: '/solutions/philosophers/cartwright/' },
        { title: 'Gregg Caruso',                  url: '/solutions/philosophers/caruso/' },
        { title: 'Ernst Cassirer',                url: '/solutions/philosophers/cassirer/' },
        { title: 'David Chalmers',                url: '/solutions/philosophers/chalmers/' },
        { title: 'Roderick Chisholm',             url: '/solutions/philosophers/chisholm/' },
        { title: 'Chrysippus',                    url: '/solutions/philosophers/chrysippus/' },
        { title: 'Cicero',                        url: '/solutions/philosophers/carneades/' },
        { title: 'Tom Clark',                     url: '/solutions/philosophers/clark/' },
        { title: 'Randolph Clarke',               url: '/solutions/philosophers/clarke/' },
        { title: 'Samuel Clarke',                 url: '/solutions/philosophers/clarkes/' },
        { title: 'Anthony Collins',               url: '/solutions/philosophers/collins/' },
        { title: 'August Compte',                 url: '/solutions/philosophers/compte/' },
        { title: 'Antonella Corradini',           url: '/solutions/philosophers/corradini/' },
        { title: 'Diodorus Cronus',               url: '/solutions/philosophers/diodorus/' },
        { title: 'Jonathan Dancy',                url: '/solutions/philosophers/dancy/' },
        { title: 'Donald Davidson',               url: '/solutions/philosophers/davidson/' },
        { title: 'Mario De Caro',                 url: '/solutions/philosophers/decaro/' },
        { title: 'Democritus',                    url: '/solutions/philosophers/democritus/' },
        { title: 'William Dembski',               url: '/solutions/philosophers/dembski' },
        { title: 'Daniel Dennett',                url: '/solutions/philosophers/dennett/' },
        { title: 'Jacques Derrida',               url: '/solutions/philosophers/derrida/' },
        { title: 'René Descartes',                url: '/solutions/philosophers/descartes/' },
        { title: 'Richard Double',                url: '/solutions/philosophers/double/' },
        { title: 'Fred Dretske',                  url: '/knowledge/philosophers/dretske/' },
        { title: 'Curt Ducasse',                  url: '/solutions/philosophers/ducasse/' },
        { title: 'John Earman',                   url: '/solutions/philosophers/earman/' },
        { title: 'Laura Waddell Ekstrom',         url: '/solutions/philosophers/ekstrom/' },
        { title: 'Epictetus',                     url: '/solutions/philosophers/epictetus/' },
        { title: 'Epicurus',                      url: '/solutions/philosophers/epicurus/' },
        { title: 'Austin Farrer',                 url: '/solutions/philosophers/farrer/' },
        { title: 'Herbert Feigl',                 url: '/solutions/philosophers/feigl/' },
        { title: 'Arthur Fine',                   url: '/solutions/philosophers/fine/' },
        { title: 'John Martin Fischer',           url: '/solutions/philosophers/fischer/' },
        { title: 'Owen Flanagan',                 url: '/solutions/philosophers/flanagan/' },
        { title: 'Luciano Floridi',               url: '/solutions/philosophers/floridi/' },
        { title: 'Philippa Foot',                 url: '/solutions/philosophers/foot/' },
        { title: 'Harry Frankfurt',               url: '/solutions/philosophers/frankfurt/' },
        { title: 'Bas van Fraassen',              url: '/solutions/philosophers/frassen/' },
        { title: 'Gottlob Frege',                 url: '/solutions/philosophers/frege/' },
        { title: 'Edmund Gettier',                url: '/solutions/philosophers/gettier/' },
        { title: 'Carl Ginet',                    url: '/solutions/philosophers/ginet/' },
        { title: 'Alvin Goldman',                 url: '/knowledge/philosophers/goldman/' },
        { title: 'Georg W.F. Hegel',              url: '/solutions/philosophers/hegel/' },
        { title: 'Martin Heidegger',              url: '/solutions/philosophers/heidegger/' },
        { title: 'Heraclitus',                    url: '/solutions/philosophers/heraclitus/' },
        { title: 'Thomas Hobbes',                 url: '/solutions/philosophers/hobbes/' },
        { title: 'David Hodgson',                 url: '/solutions/philosophers/hodgson/' },
        { title: 'Ted Honderich',                 url: '/solutions/philosophers/honderich/' },
        { title: 'David Hume',                    url: '/solutions/philosophers/hume/' },
        { title: 'Frank Jackson',                 url: '/solutions/philosophers/jackson/' },
        { title: 'William James',                 url: '/solutions/philosophers/james/' },
        { title: 'Immanuel Kant',                 url: '/solutions/philosophers/kant/' },
        { title: 'Robert Kane',                   url: '/solutions/philosophers/kane/' },
        { title: 'Jaegwon Kim',                   url: '/solutions/philosophers/kim/' },
        { title: 'Christine Korsgaard',           url: '/solutions/philosophers/korsgaard/' },
        { title: 'Saul Kripke',                   url: '/solutions/philosophers/kripke/' },
        { title: 'Thomas Kuhn',                   url: '/solutions/philosophers/kuhn/' },
        { title: 'James Ladyman',                 url: '/solutions/philosophers/ladyman/' },
        { title: 'Keith Lehrer',                  url: '/solutions/philosophers/lehrer/' },
        { title: 'Gottfried Leibniz',             url: '/solutions/philosophers/leibniz/' },
        { title: 'Jules Lequyer',                 url: '/solutions/philosophers/lequyer/' },
        { title: 'David Lewis',                   url: '/solutions/philosophers/lewis/' },
        { title: 'John Locke',                    url: '/solutions/philosophers/locke/' },
        { title: 'Lucretius',                     url: '/solutions/philosophers/lucretius/' },
        { title: 'Alasdair MacIntyre',            url: '/solutions/philosophers/macintyre/' },
        { title: 'Tim Maudlin',                   url: '/solutions/philosophers/maudlin/' },
        { title: 'Alfred Mele',                   url: '/solutions/philosophers/mele/' },
        { title: 'John Stuart Mill',              url: '/solutions/philosophers/mill/' },
        { title: 'G.E. Moore',                    url: '/solutions/philosophers/moore/' },
        { title: 'Thomas Nagel',                  url: '/solutions/philosophers/nagelt/' },
        { title: 'Friedrich Nietzsche',           url: '/solutions/philosophers/nietzsche/' },
        { title: 'Robert Nozick',                 url: '/solutions/philosophers/nozick/' },
        { title: 'William of Ockham',             url: '/solutions/philosophers/ockham/' },
        { title: "Timothy O'Connor",              url: '/solutions/philosophers/oconnor/' },
        { title: 'Parmenides',                    url: '/solutions/philosophers/parmenides/' },
        { title: 'Charles Sanders Peirce',        url: '/solutions/philosophers/peirce/' },
        { title: 'Derk Pereboom',                 url: '/solutions/philosophers/pereboom/' },
        { title: 'Plato',                         url: '/solutions/philosophers/plato/' },
        { title: 'Karl Popper',                   url: '/solutions/philosophers/popper/' },
        { title: 'Hilary Putnam',                 url: '/solutions/philosophers/putnam/' },
        { title: 'W.V.O. Quine',                  url: '/solutions/philosophers/quine/' },
        { title: 'Thomas Reid',                   url: '/solutions/philosophers/reid/' },
        { title: 'Nicholas Rescher',              url: '/solutions/philosophers/rescher/' },
        { title: 'Richard Rorty',                 url: '/solutions/philosophers/rorty/' },
        { title: 'Bertrand Russell',              url: '/solutions/philosophers/russell/' },
        { title: 'Gilbert Ryle',                  url: '/solutions/philosophers/ryle/' },
        { title: 'Jean-Paul Sartre',              url: '/solutions/philosophers/sartre/' },
        { title: 'T.M. Scanlon',                  url: '/solutions/philosophers/scanlon/' },
        { title: 'Moritz Schlick',                url: '/solutions/philosophers/schlick/' },
        { title: 'Arthur Schopenhauer',           url: '/solutions/philosophers/schopenhauer/' },
        { title: 'Albert Schweitzer',             url: '/solutions/philosophers/schweitzer/' },
        { title: 'John Searle',                   url: '/solutions/philosophers/searle/' },
        { title: 'Wilfrid Sellars',               url: '/solutions/philosophers/sellars/' },
        { title: 'Henry Sidgwick',                url: '/solutions/philosophers/sidgwick/' },
        { title: 'J.J.C. Smart',                  url: '/solutions/philosophers/smart/' },
        { title: 'Baruch Spinoza',                url: '/solutions/philosophers/spinoza/' },
        { title: 'Galen Strawson',                url: '/solutions/philosophers/strawsong/' },
        { title: 'Peter Strawson',                url: '/solutions/philosophers/strawson/' },
        { title: 'Richard Taylor',                url: '/solutions/philosophers/taylorr/' },
        { title: 'Peter Unger',                   url: '/solutions/philosophers/unger/' },
        { title: 'Peter van Inwagen',             url: '/solutions/philosophers/vaninwagen/' },
        { title: 'Manuel Vargas',                 url: '/solutions/philosophers/vargas/' },
        { title: 'Kadri Vihvelin',                url: '/solutions/philosophers/vihvelin/' },
        { title: 'Voltaire',                      url: '/solutions/philosophers/voltaire/' },
        { title: 'David Foster Wallace',          url: '/solutions/philosophers/wallacedf/' },
        { title: 'Alfred North Whitehead',        url: '/solutions/philosophers/whitehead/' },
        { title: 'David Wiggins',                 url: '/solutions/philosophers/wiggins/' },
        { title: 'Bernard Williams',              url: '/solutions/philosophers/williams/' },
        { title: 'Ludwig Wittgenstein',           url: '/solutions/philosophers/wittgenstein/' },
        { title: 'Susan Wolf',                    url: '/solutions/philosophers/wolf/' },
        { title: 'Xenophon',                      url: '/solutions/philosophers/xenophon/' },
      ],
    },
    {
      title: 'Scientists', icon: '🔬',
      description: 'Critical profiles of hundreds of scientists — from Darwin to Schrödinger.',
      isIndex: true, indexType: 'scientists',
      crawlScope: ['/solutions/scientists/', '/knowledge/scientists/'],
      pages: [
        { title: 'Scientists Overview',           url: '/solutions/scientists/' },
        { title: 'David Albert',                  url: '/solutions/scientists/albert/' },
        { title: 'Alain Aspect',                  url: '/solutions/scientists/aspect/' },
        { title: 'Andy Clark',                  url: '/solutions/scientists/clark/' },
        { title: 'Anne Sophie Meincke',                  url: '/solutions/scientists/meincke/' },
        { title: 'Brenda Milner',                  url: '/solutions/scientists/milner/' },
        { title: 'Bruce Lindsay',                  url: '/solutions/scientists/lindsay/' },
        { title: 'Carl Friedrich Gauss',                  url: '/solutions/scientists/gauss/' },
        { title: 'David Hilbert',                  url: '/solutions/scientists/hilbert/' },
        { title: 'Dennis Gabor',                  url: '/solutions/scientists/gabor/' },
        { title: 'Donald Norman',                  url: '/solutions/scientists/norman/' },
        { title: 'Edward Thorndike',                  url: '/solutions/scientists/thorndike/' },
        { title: 'Erik Verlinde',                  url: '/solutions/scientists/verlinde/' },
        { title: 'François Jacob',                  url: '/solutions/scientists/jacob/' },
        { title: 'Frederic Bartlett',                  url: '/solutions/scientists/bartlett/' },
        { title: 'Geoffrey Hinton',                  url: '/solutions/scientists/hinton/' },
        { title: 'Hans Reichenbach',                  url: '/solutions/scientists/reichenbach/' },
        { title: 'Ian Hacking',                  url: '/solutions/scientists/hacking/' },
        { title: 'Isaac Newton',                  url: '/solutions/scientists/newton/' },
        { title: 'James Lovelock',                  url: '/solutions/scientists/lovelock/' },
        { title: 'L.E.J. Brouwer',                  url: '/solutions/scientists/brouwer/' },
        { title: 'Léon Rosenfeld',                  url: '/solutions/scientists/rosenfeld/' },
        { title: 'Noam Chomsky',                  url: '/solutions/scientists/chomsky/' },
        { title: 'Roger H. Stuewer',                  url: '/solutions/scientists/stuewer/' },
        { title: 'Stephen Hawking',                  url: '/solutions/scientists/hawking/' },
        { title: 'Tim Maudlin',                  url: '/solutions/scientists/maudlin/' },
        { title: 'Warren Weaver',                  url: '/solutions/scientists/weaver/' },
        { title: 'Yves Decadt',                  url: '/solutions/scientists/decadt/' },
        { title: 'Philip W. Anderson',            url: '/solutions/scientists/anderson/' },
        { title: 'Michael Arbib',                 url: '/solutions/scientists/arbib/' },
        { title: 'Walter Baade',                  url: '/solutions/scientists/baade/' },
        { title: 'Bernard Baars',                 url: '/solutions/scientists/baars/' },
        { title: 'Leslie Ballentine',             url: '/solutions/scientists/ballentine/' },
        { title: 'Julian Barbour',                url: '/solutions/scientists/barbour/' },
        { title: 'Gregory Bateson',               url: '/solutions/scientists/bateson/' },
        { title: 'Jakob Bekenstein',              url: '/solutions/scientists/bekenstein/' },
        { title: 'John S. Bell',                  url: '/solutions/scientists/bell/' },
        { title: 'Charles Bennett',               url: '/solutions/scientists/bennett/' },
        { title: 'Ludwig von Bertalanffy',        url: '/solutions/scientists/bertalanffy/' },
        { title: 'David Bohm',                    url: '/solutions/scientists/bohm/' },
        { title: 'Niels Bohr',                    url: '/solutions/scientists/bohr/' },
        { title: 'Ludwig Boltzmann',              url: '/solutions/scientists/boltzmann/' },
        { title: 'Max Born',                      url: '/solutions/scientists/born/' },
        { title: 'Leon Brillouin',                url: '/solutions/scientists/brillouin/' },
        { title: 'Melvin Calvin',                 url: '/solutions/scientists/calvin/' },
        { title: 'Sadi Carnot',                   url: '/solutions/scientists/carnot/' },
        { title: 'Gregory Chaitin',               url: '/solutions/scientists/chaitin/' },
        { title: 'Rudolf Clausius',               url: '/solutions/scientists/clausius/' },
        { title: 'Arthur Holly Compton',          url: '/solutions/scientists/compton/' },
        { title: 'Francis Crick',                 url: '/solutions/scientists/crick/' },
        { title: 'Antonio Damasio',               url: '/solutions/scientists/damasio/' },
        { title: 'Charles Darwin',                url: '/solutions/scientists/darwin/' },
        { title: 'Paul Davies',                   url: '/solutions/scientists/davies/' },
        { title: 'Richard Dawkins',               url: '/solutions/scientists/dawkins/' },
        { title: 'Terrence Deacon',               url: '/solutions/scientists/deacon/' },
        { title: 'Louis de Broglie',              url: '/solutions/scientists/de_broglie/' },
        { title: 'Stanislas Dehaene',             url: '/solutions/scientists/dehaene/' },
        { title: 'Max Delbrück',                  url: '/solutions/scientists/delbruck/' },
        { title: 'Paul Dirac',                    url: '/solutions/scientists/dirac/' },
        { title: 'Theodosius Dobzhansky',         url: '/solutions/scientists/dobzhansky/' },
        { title: 'John Eccles',                   url: '/solutions/scientists/eccles/' },
        { title: 'Arthur Stanley Eddington',      url: '/solutions/scientists/eddington/' },
        { title: 'Gerald Edelman',                url: '/solutions/scientists/edelman/' },
        { title: 'Paul Ehrenfest',                url: '/solutions/scientists/ehrenfest/' },
        { title: 'Albert Einstein',               url: '/solutions/scientists/einstein/' },
        { title: 'George F.R. Ellis',             url: '/solutions/scientists/ellis/' },
        { title: 'Hugh Everett III',              url: '/solutions/scientists/everett/' },
        { title: 'Richard Feynman',               url: '/solutions/scientists/feynman/' },
        { title: 'R.A. Fisher',                   url: '/solutions/scientists/fisher/' },
        { title: 'Karl Friston',                  url: '/solutions/scientists/friston/' },
        { title: 'Howard Gardner',                url: '/solutions/scientists/gardner/' },
        { title: 'Michael Gazzaniga',             url: '/solutions/scientists/gazzaniga/' },
        { title: 'GianCarlo Ghirardi',            url: '/solutions/scientists/ghirardi/' },
        { title: 'J. Willard Gibbs',              url: '/solutions/scientists/gibbs/' },
        { title: 'Nicolas Gisin',                 url: '/solutions/scientists/gisin/' },
        { title: 'Stuart Hameroff',               url: '/solutions/scientists/hameroff/' },
        { title: 'Patrick Haggard',               url: '/solutions/scientists/haggard/' },
        { title: 'J.B.S. Haldane',                url: '/solutions/scientists/haldane/' },
        { title: 'Werner Heisenberg',             url: '/solutions/scientists/heisenberg/' },
        { title: 'Martin Heisenberg',             url: '/solutions/scientists/heisenbergm/' },
        { title: 'Hermann von Helmholtz',         url: '/solutions/scientists/helmholtz' },
        { title: 'Grete Hermann',                 url: '/solutions/scientists/hermann/' },
        { title: 'Francis Heylighen',             url: '/solutions/scientists/heylighen/' },
        { title: 'Basil Hiley',                   url: '/solutions/scientists/hiley/' },
        { title: 'Jesper Hoffmeyer',              url: '/solutions/scientists/hoffmeyer/' },
        { title: 'E.T. Jaynes',                   url: '/solutions/scientists/jaynes/' },
        { title: 'Pascual Jordan',                url: '/solutions/scientists/jordan/' },
        { title: 'Eric Kandel',                   url: '/solutions/scientists/kandel/' },
        { title: 'Ruth E. Kastner',               url: '/solutions/scientists/kastner/' },
        { title: 'Stuart Kauffman',               url: '/solutions/scientists/kauffman/' },
        { title: 'Christof Koch',                 url: '/solutions/scientists/koch/' },
        { title: 'Simon Kochen',                  url: '/solutions/scientists/kochen/' },
        { title: 'Rolf Landauer',                 url: '/solutions/scientists/landauer/' },
        { title: 'Pierre-Simon Laplace',          url: '/solutions/scientists/laplace/' },
        { title: 'David Layzer',                  url: '/solutions/scientists/layzer/' },
        { title: 'Joseph LeDoux',                 url: '/solutions/scientists/ledoux/' },
        { title: 'Benjamin Libet',                url: '/solutions/scientists/libet/' },
        { title: 'Seth Lloyd',                    url: '/solutions/scientists/lloyd/' },
        { title: 'Hendrik Lorentz',               url: '/solutions/scientists/lorentz/' },
        { title: 'Ernst Mach',                    url: '/solutions/scientists/mach/' },
        { title: 'Lynn Margulis',                 url: '/solutions/scientists/margulis/' },
        { title: 'Humberto Maturana',             url: '/solutions/scientists/maturana/' },
        { title: 'James Clerk Maxwell',           url: '/solutions/scientists/maxwell/' },
        { title: 'Ernst Mayr',                    url: '/solutions/scientists/mayr/' },
        { title: 'N. David Mermin',               url: '/solutions/scientists/mermin/' },
        { title: 'Abraham de Moivre',             url: '/solutions/scientists/de_moivre/' },
        { title: 'Jacques Monod',                 url: '/solutions/scientists/monod/' },
        { title: 'Emmy Noether',                  url: '/solutions/scientists/noether/' },
        { title: 'Denis Noble',                   url: '/solutions/scientists/noble/' },
        { title: 'Alexander Oparin',              url: '/solutions/scientists/oparin/' },
        { title: 'Howard Pattee',                 url: '/solutions/scientists/pattee/' },
        { title: 'Wolfgang Pauli',                url: '/solutions/scientists/pauli/' },
        { title: 'Wilder Penfield',               url: '/solutions/scientists/penfield/' },
        { title: 'Roger Penrose',                 url: '/solutions/scientists/penrose/' },
        { title: 'Max Planck',                    url: '/solutions/scientists/planck/' },
        { title: 'Henri Poincaré',                url: '/solutions/scientists/poincare/' },
        { title: 'Michael Polanyi',               url: '/solutions/scientists/polanyi/' },
        { title: 'Ilya Prigogine',                url: '/solutions/scientists/prigogine/' },
        { title: 'Lord Rayleigh',                 url: '/solutions/scientists/rayleigh/' },
        { title: 'Robert Rosen',                  url: '/solutions/scientists/rosen/' },
        { title: 'Michael Ruse',                  url: '/solutions/scientists/ruse' },
        { title: 'Robert Sapolsky',               url: '/solutions/scientists/sapolsky/' },
        { title: 'Ferdinand de Saussure',         url: '/solutions/scientists/saussure/' },
        { title: 'Erwin Schrödinger',             url: '/solutions/scientists/schrodinger/' },
        { title: 'Claude Shannon',                url: '/solutions/scientists/shannon/' },
        { title: 'Charles Sherrington',           url: '/solutions/scientists/sherrington/' },
        { title: 'Abner Shimony',                 url: '/solutions/scientists/shimony/' },
        { title: 'Herbert Simon',                 url: '/solutions/scientists/simon/' },
        { title: 'B.F. Skinner',                  url: '/solutions/scientists/skinner/' },
        { title: 'Lee Smolin',                    url: '/solutions/scientists/smolin/' },
        { title: 'Roger Sperry',                  url: '/solutions/scientists/sperry/' },
        { title: 'Henry Stapp',                   url: '/solutions/scientists/stapp/' },
        { title: 'Leo Szilard',                   url: '/solutions/scientists/szilard/' },
        { title: 'Max Tegmark',                   url: '/solutions/scientists/tegmark/' },
        { title: 'Teilhard de Chardin',           url: '/solutions/scientists/teilhard/' },
        { title: 'William Thomson (Kelvin)',       url: '/solutions/scientists/thomson/' },
        { title: 'Giulio Tononi',                 url: '/solutions/scientists/tononi/' },
        { title: 'Alan Turing',                   url: '/solutions/scientists/turing/' },
        { title: 'Francisco Varela',              url: '/solutions/scientists/varela/' },
        { title: 'Vlatko Vedral',                 url: '/solutions/scientists/vedral/' },
        { title: 'Heinz von Foerster',            url: '/solutions/scientists/foerster/' },
        { title: 'John von Neumann',              url: '/solutions/scientists/neumann/' },
        { title: 'C.H. Waddington',               url: '/solutions/scientists/waddington/' },
        { title: 'Sara Imari Walker',             url: '/solutions/scientists/walker/' },
        { title: 'James D. Watson',               url: '/solutions/scientists/watsonj/' },
        { title: 'Daniel Wegner',                 url: '/solutions/scientists/wegner/' },
        { title: 'Steven Weinberg',               url: '/solutions/scientists/weinberg/' },
        { title: 'Herman Weyl',                   url: '/solutions/scientists/weyl/' },
        { title: 'John Wheeler',                  url: '/solutions/scientists/wheeler/' },
        { title: 'Norbert Wiener',                url: '/solutions/scientists/wiener/' },
        { title: 'Eugene Wigner',                 url: '/solutions/scientists/wigner/' },
        { title: 'E.O. Wilson',                   url: '/solutions/scientists/wilson/' },
        { title: 'Carl Woese',                    url: '/solutions/scientists/woese/' },
        { title: 'Stephen Wolfram',               url: '/solutions/scientists/wolfram/' },
        { title: 'H. Dieter Zeh',                 url: '/solutions/scientists/zeh/' },
        { title: 'Ernst Zermelo',                 url: '/solutions/scientists/zermelo/' },
        { title: 'Wojciech Zurek',                url: '/solutions/scientists/zurek/' },
        { title: 'Konrad Zuse',                   url: '/solutions/scientists/zuse/' },
      ],
    },
    {
      title: 'Reference', icon: '📚',
      description: 'Glossary, bibliography, name index, subject index.',
      crawlScope: ['/afterwords/'],
      pages: [
        { title: 'Conclusions',                   url: '/afterwords/conclusions/' },
        { title: 'Bibliography',                  url: '/afterwords/bibliography/' },
        { title: 'I-Phi Books',                         url: '/books/' },
        { title: 'Glossary of Terms',             url: '/afterwords/glossary/' },
        { title: 'Name Index',                    url: '/afterwords/author_index/' },
        { title: 'Subject Index',                 url: '/afterwords/subject_index/' },
      ],
    },
  ];



  // manual broken image rewrites
  const IMG_REWRITES = {
    "/mind/ERR/Madeleine.png": "/knowldge/ERR/Madeleine.png",
    "/quantum/two-slit/Single-slit.png": "/solutions/experiments/two-slit_experiment/Single-slit.png",
    "/quantum/two-slit/One-slit-intensity.png": "/solutions/experiments/two-slit_experiment/One-slit-intensity.png",
    "/quantum/two-slit/Double-slit-sum.png": "/solutions/experiments/two-slit_experiment/Double-slit-sum.png",
    "/quantum/two-slit/Double-slit.png": "/quantum/collapse/Double-slit.png",
    "/quantum/two-slit/Young_Two-slit.png": "/solutions/experiments/two-slit_experiment/Young_Two-slit.png",
    "/quantum/two-slit/Anim-1-2-paths.gif": "/solutions/experiments/two-slit_experiment/Anim-1-2-paths.gif",
    "/quantum/two-slit/Anim-1-2-dot2.gif": "/solutions/experiments/two-slit_experiment/Anim-1-2-dot2.gif",
    "/life/biosemiotics/images/two-stage-note.png": "/life/biosemiotics/two-stage-note.png",
    "/quantum/two-slit/Anim-1-2-paths_slow.gif": "/solutions/experiments/two-slit_experiment/Anim-1-2-paths.gif",
    "/problems/H2_MO.jpeg": "/problems/entanglement/H2_MO.jpeg",
    "/quantum/common_cause_constant/Hidden_Constant_Same0.png": "/quantum/hidden_constant/Hidden_Constant_Same0.png",
    "/quantum/common_cause_constant/Hidden_Constant_Same45.png": "/quantum/hidden_constant/Hidden_Constant_Same45.png",
    "/quantum/common_cause_constant/Hidden_Constant_Different45.png": "/quantum/hidden_constant/Hidden_Constant_Different45.png",
    "/knowledge/Madeleine.png": "/knowledge/EPR/Madeleine.png",
    "/institute/Solar_Handbook_Angles.png": "/institute/solar_panel_study/Solar_Handbook_Angles.png",
    "/institute/Shading_Cells.png": "/institute/solar_panel_study/Shading_Cells.png",
    "/institute/Cell_shade_landscape.png": "/institute/solar_panel_study/Cell_shade_landscape.png",
    "/institute/Helioscope_47.png": "/institute/solar_panel_study/Helioscope_47.png",
    "/institute/Aurora_47_3D_S.png": "/institute/solar_panel_study/Aurora_47_3D_S.png",
    "/institute/Aurora_47_3D_W.png": "/institute/solar_panel_study/Aurora_47_3D_W.png",
    "/institute/Irradiance_NoShade.png": "/institute/solar_panel_study/Irradiance_NoShade.png",
    "/institute/Solar_Access_Shade.png": "/institute/solar_panel_study/Solar_Access_Shade.png",
    "/institute/Solar_Handbook_Irradiance.png": "/institute/solar_panel_study/Solar_Handbook_Irradiance.png",
    "/institute/sunpath_45_north.png": "/institute/solar_panel_study/sunpath_45_north.png",
    "/institute/Projection.png": "/institute/solar_panel_study/Projection.png",
    "/institute/Cell_shade_portrait.png": "/institute/solar_panel_study/Cell_shade_portrait.png",
    "/books/front-cover.jpg": "/books/WWaF/front-cover.jpg",
    "/solutions/experiments/Double-slit.png": "/solutions/experiments/two-slit_experiment/Double-slit.png",
    "/solutions/experiments/Geiger_avalanch.png": "/solutions/experimants/geiger_counter/Geiger_avalanch.png",
    "/solutions/experiments/Geiger.png": "/solutions/experimants/geiger_counter/Geiger.png",
    "/knowledge/entropy-expansion.gif": "/introduction/information/entropy-expansion.gif",
    "/images/einstein_signature.png": "/solutions/scientists/einstein/Einstein.png",
    "/solutions/scientists/bell/EL.png": "/solutions/scientists/bell/Epistemological_Letters/EL.png"
  };

  // math rewrites
  const MATH_REWRITES = [
    {
      "match": [
        "< B | { cA > = c< B | A >",
        "< B | { cA > = c< BA >,"
      ],
      "replace": "<B|{c|A>} = c<B|A),"
    },
    {
      "match": "< B | } | A > = < A | } | B >.",
      "replace": "<B|A> = \overline{<A|B>}."
    }
  ];

  const INLINE_MATH_REWRITES = [
    {
      match: "α ≈ λ/<i>D</i>",
      extra_p: "<i>D</i>"
    },
    "<i>x<sub>1</sub></i>",
    "<i>x<sub>2</sub></i>",
    "<i>f(E) ∝ e<sup>-E/kT</sup></i>",
    "α ≈ λ/2<i>d</i>",
    "α ≈ λ/<i>d</i>",
    "<i>ψ (x,y) = <font size=\"+1&quot;\">Σ</font> a<sub>k</sub> g<sub>k</sub>(x) f<sub>k</sub>(y)</i>",
    /hν = E<su(p|b)>[a-z0-9]+<\/su(p|b)> (-|\+) E<su(p|b)>[a-z0-9]+<\/su(p|b)>/g,
    "<i>E<sub>m</sub> - E<sub>n</sub> = hν</i>",
    /<i>[a-z0-9]+<su(p|b)>+<\/su(p|b)>[a-z0-9]+<su(p|b)>-<\/su(p|b)><\/i>/g,
    /<i>t<su(p|b)>[a-z0-9]+<\/su(p|b)><\/i>/g,
    "cos(β-α)<sup>2</sup>",
    "&lt; <i>ψ<sub>n</sub></i> | <i>φ</i> &gt;",
    "Z<sub>m</sub>-&gt;Z<sub>n</sub>",
    "B<sup>m</sup><sub>n</sub> and B<sup>n</sup><sub>m</sub>",
    /<i>[a-zA-Z0-9][^<]*=\s*[a-zA-Z0-9][^<]*<\/i>/g,
    "<i>hν</i> = <i>E<sub>n</sub></i> - <i>E<sub>m</sub></i>",
    /<i>t<su(p|b)>[a-zA-Z0-9]+<\/su(p|b)>\s\*\s*Δt<\/i>/g,
    /<i>t<su(p|b)>[0-9a-zA-Z]+<\/su(p|b)><\/i>/g,
    "|v>",
    "[h>",
    "|0>",
    "|1>",
    "| ↑> |↑>",
    "|↑> |↑>",
    "|←> |→>",
    "|←>",
    "|→>",
    "|↑>",
    "|↓>",
    "|↑↓>",
    "|↓↑>",
    "a<sub>k</sub>",
    /\| <i>(φ|ψ)<\/i> &gt;/g,
    /\| <i>(φ|ψ)<su(p|b)>[a-z0-9]+<\/su(p|b)><\/i> &gt;/g,
    /<i>[A-Z]<su(p|b)>[a-z0-9]+<\/su(p|b)><\/i>/g,
    /\| ψ \|<su(p|b)>[a-z0-9]+<\/su(p|b)>/g,
    /Ψ<su(p|b)>[a-z0-9]+<\/su(p|b)>/g,
    "Ψ",
    "1/√2",
    "| + + >",
    "| - - >"
  ].map(item => {
    if (typeof item === 'string') {
      // Convert string to regex-escaped pattern with flexible whitespace
      const escaped = RegExp.escape(item).replace(/\s+/g, '\\s*');
      
      return {
        match: [new RegExp(escaped, 'g')],
        extra_p: null
      };
    } else if (item instanceof RegExp) {

      return {
        match: [item],
        extra_p: null
      };
    } else {
      // Process object entries
      if (!Array.isArray(item.match)) {
        item.match = [item.match];
      }

      for (let [key,match] of item.match.entries()) {
        if (typeof match === 'string') {
          const escaped = RegExp.escape(match).replace(/\s+/g, '\\s*');
          item.match[key] = new RegExp(escaped, 'g');
        }
      }

      if (item.extra_p) {
        if (!Array.isArray(item.extra_p)) {
          item.extra_p = [item.extra_p];
        }

        for (let [key,match] of item.extra_p.entries()) {
          if (typeof match === 'string') {
            const escaped = RegExp.escape(match).replace(/\s+/g, '\\s*');
            item.extra_p[key] = new RegExp(escaped, 'g');
          }
        }
      }
      
      return item;
    }
  });;

  MATH_REWRITES.forEach((rw) => {
    if (!Array.isArray(rw.match)) {
      rw.match = [rw.match];
    }
    if (!rw.regex) {
      rw.match.forEach((match) => {
        let regex = new RegExp(`^${RegExp.escape(match).replace(/\s+/g, '\\s+')}$`);
        MATH_REWRITES.push(Object.assign({}, rw, {
          match: [regex],
          regex: true
        }));
      });
    }
  });

  const MATH_REWRITE_MATCH = (str) => {
      for (let matches of MATH_REWRITES) {
        for (let match of matches.match) {
          if (matches.regex) {
            if (match.test(str)) {
              return matches.replace
            }
          } else {
            if (str.trim() === match.trim()) {
              return matches.replace;
            }
          }
        }
      }
      return false;
  }

  // manual internal link rewrites
  const INTERNAL_URL_REWRITES = {
    "/solutions/philosophers/": "philosophers-index.xhtml",
    "/knowledge/philosophers/": "philosophers-index.xhtml",
    "/philosophers/": "philosophers-index.xhtml",
    "/solutions/scientists/": "scientists-index.xhtml",
    "/knowledge/scientists/": "scientists-index.xhtml",
    "/scientists/": "scientists-index.xhtml"
  }

  // manual broken url rewrites
  const URL_REWRITES = {
    "/mind/mind_body/": "/mind/mind-body/",
    "/mind/NCC/": "/mind/ncc/",
    "/quantum/foundation/": "/quantum/foundations/",
    "/quantum/mach_zender/": "/quantum/mach-zender/",
    "/solutions/philosophers/compte/": "/solutions/philosophers/comte/",
    "/philosophers/compte/": "/solutions/philosophers/comte/",
    "/solutions/philosophers/dretske/": "/knowledge/philosophers/dretske/",
    "/philosophers/dretske/": "/knowledge/philosophers/dretske/",
    "/solutions/scientists/carroll/": "/solutions/scientists/Carroll/",
    "/solutions/scientists/despagmat/": "/solutions/scientists/despagnat/",
    "/solutions/scientists/gal-or/": "/solutions/scientists/gal_or/",
    "/presentations/biosemiotics/": "/presentations/Biosemiotics/",
    "/presentations/Evo_Devo_CSS/": "/presentations/Evo_Devo_CCS/",
    "/problems/mind-body/": "/problems/mind_body/",
    "/value/Ergo/": "/value/ergo/",
    "/introduction/Information/": "/introduction/information/",
    "/foreword/": "/forewords/",
    "/solutions/scientists/layzer/free_will/strong_cosmological_principle/": false,
    "/value/ergodic.html": "/value/ergodic.parc.html",
    "/solutions/experiments/stern-gerlach/": "/solutions/experiments/stern_gerlach/",
    "/solutions/experiments/stern-gerlach": "/solutions/experiments/stern_gerlach/",
    "/solutions/experiments/bells_theorem/": "/solutions/experiments/Bells_Theorem/",
    "/solutions/experiments/schrodinger_cat/": "/solutions/experiments/schrodingerscat/",
    "/solutions/experiments/schrodinger_cat": "/solutions/experiments/schrodingerscat/",
    "/solutions/philosophers/Cicero/": "/solutions/philosophers/cicero/",
    "/solutions/philosophers/huoranski/": "/solutions/philosophers/huoranszki/",
    "/solutions/scientists/watson/": "/solutions/scientists/watsonj/",
    "/knowlede/reductionism.html": "/knowledge/reductionism.html",
    "/imtroduction/creation/": "/introduction/creation/",
    "/freedom/alternative_possibiities.html": "/freedom/alternative_possibilities.html",
    "/freedom/possibiities.html": "/freedom/possibilities.html",
    "/scandals/gog/": "/scandals/god/",
    "/Problems/": "/problems/",
    "/freeedom/": "/freedom/",
    "/freedom/comprehensive-compatibilism.html": "/freedom/comprehensive_compatibilism.html",
    "/Freedom/responsibility.html": "/freedom/responsibility.html",
    "/Freedom/indeterminism.html": "/freedom/indeterminism.html",
    "/solutions/scientists/debroglie/": "/solutions/scientists/de_broglie/",
    "/scientists/debroglie/": "/solutions/scientists/de_broglie/",
    "/tutorials/Free_Will/": "/tutorials/free_will/",
    "/tutorials/Free_Will": "/tutorials/free_will/",
    "/freedom/hard_determinism.html": "/freedom/hard_incompatibilism.html",
    "/solutions/dualism/": "/solutions/dualisms/",
    "/solutions/philosophers/clarker/": "/solutions/philosophers/clarke/",
    "/freedom/same%20circumstances.html": "/freedom/same_circumstances.html",
    "/solutioms/philosophers/cicero/": "/solutions/philosophers/cicero/",
    "/knowledge/possibile_worlds.html": "/knowledge/possible_worlds.html",
    "/solutions/philosophers/Dennett/": "/solutions/philosophers/dennett/",
    "/freedom/mechanism.html": "/freedom/mechanisms.html",
    "/freedom/same_circumstance.html": "/freedom/same_circumstances.html",
    "/afterword/glossary/": "/afterwords/glossary/",
    "/solutions/philosophers/x/": "/solutions/philosophers/",
    "/solutions/dogma/": "/solutions/dogmas/",
    "/solutions/philosophers/james/the_dilemma_of_determinsm.html": "/solutions/philosophers/james/the_dilemma_of_determinism.html",
    "/solutions/scientists/bohr/fundamental%20principles.html": "/solutions/scientists/bohr/fundamental_principles.html",
    "/values/ergodic.html": "/value/ergodic.parc.html",
    "/freedom/chance_dirct_cause.html": "/freedom/chance_direct_cause.html",
    "/freesom/semicompatibilism.html": "/freedom/semicompatibilism.html",
    "/values/ergo/": "/value/ergo/",
    "/solutions/philosopher/epicurus/": "/solutions/philosophers/epicurus/",
    "/freedom/actualisn.html": "/freedom/actualism.html",
    "/value/free%20_energy/": "/value/free_energy/",
    "/Values/ergodic.html": "/value/ergodic.parc.html",
    "/Values/ergo.html": "/value/ergo/",
    "/solutions/scientists/Everett/": "/solutions/scientists/everett/",
    "/Value/ergodic.html": "/value/ergodic.parc.html",
    "/Values/ergod.html": "/value/ergod/",
    "/knowledge/philosophers/lewes/": "/knowledge/philosophers/lewis/",
    "/solutions/philosopher/kant/": "/solutions/philosophers/kant/",
    "/solutions/philosopher/kant": "/solutions/philosophers/kant/",
    "/solutions/philosopher/plato/": "/solutions/philosophers/plato/",
    "/solutions/scientists/Talk_with_Einstein..html": "/solutions/scientists/heisenberg/talk_with_einstein.html",
    "/solutions/scientists/Copenhagen_Interpretation.html": "/introduction/physics/copenhagen_interpretation.html",
    "/solutions/scientists/what_is_a_law_of_nature.html": false,
    "/scientists/what_is_a_law_of_nature.html": false,
    "/scientists/Copenhagen_Interpretation.html": "/introduction/physics/copenhagen_interpretation.html",
    "/philosopher/plato/": "/solutions/philosophers/plato/",
    "/solutions/philosopher/plato": "/solutions/philosophers/plato/",
    "/solutions/philosopher/frankfurt/": "/solutions/philosophers/frankfurt/",
    "/feedom/chaos.html": "/freedom/chaos.html",
    "/solutions/experiments/wave-funstion_collapse/": "/solutions/experiments/wave-function_collapse/",
    "/value/free%20energy/": "/value/free_energy/",
    "/solutions/scientists/gould/": "/solutions/scientists/gold/",
    "/freedom/iactualism.html": "/freedom/actualism.html",
    "/life/foal/": "/life/goal/",
    "/values/": "/value/",
    "/solutions/philosophers/James/": "/solutions/philosophers/james/",
    "/solutions/scientist/boltzamnn/": "/solutions/scientists/boltzmann/",
    "/solutions/philosopher/chalmers/": "/solutions/philosophers/chalmers/",
    "/philosopher/chalmers/": "/solutions/philosophers/chalmers/",
    "/philosophers/chalmers/": "/solutions/philosophers/chalmers/",
    "/solutions/philosophers/fouilee/": "/solutions/philosophers/fouillee/",
    "/solutions/scientists/demoivre/": "/solutions/scientists/de_moivre/",
    "/solutions/scientists/ludwig/": "/solutions/scientists/de_moivre/",
    "/solutions/scientists/legendre/": "/solutions/scientists/de_moivre/",
    "/solutions/scientists/demoivre": "/solutions/scientists/de_moivre/",
    "/solutions/scientists/neuman/": "/solutions/scientists/neumann/",
    "/solutions/scientists/Quetelet/": "/solutions/scientists/quetelet/",
    "/solutions/scientists/Quetelet": "/solutions/scientists/quetelet/",
    "/afterword/": "/afterwords/",
    "/intorduction/creation/": "/introduction/creation/",
    "/solutions/scientists/jorfan/Pascual%20Jordan/": false,
    "/solutions/scientists/jorfan/%E2%80%9C%3EPascual%20Jordan%3C/a%3E.%20%3Ca%20href=": "/solutions/scientists/jordan/",
    "/quantum/interpretation/": "/quantum/interpretations/",
    "/introduction/physics/Copenhagen_Interpretation.html": "/introduction/physics/copenhagen_interpretation.html",
    "/solutions/scientists/de_Broglie/": "/solutions/scientists/de_broglie/",
    "/freedom/uncertanty.html": "/freedom/uncertainty.html",
    "/solutions/scientists/feynman/probability_and_uncertainty.htm": "/solutions/scientists/feynman/probability_and_uncertainty.html",
    "/quantum/common-cause/": "/quantum/common_cause/",
    "/solutions/experimants/geiger_counter/": "/solutions/experiments/geiger_counter/",
    "/solutions/scientist/schrodinger/": "/solutions/scientists/schrodinger/",
    "/freedom/pre-determinismn.html": "/freedom/pre-determinism.html",
    "/freedom/free-will.html": "/freedom/free_will.html",
    "/solutions/scientist/einstein/": "/solutions/scientists/einstein/",
    "/solutions/scientist/dirac/": "/solutions/scientists/dirac/",
    "/solutions/scientist/bell/": "/solutions/scientists/bell/",
    "/solutions/scientists/Jordan/": "/solutions/scientists/jordan/",
    "/solutions/scientist/bohm/": "/solutions/scientists/bohm/",
    "/solutions/experiment/EPR/": "/solutions/experiments/EPR/",
    "/solutions/scientist/heisenberg/": "/solutions/scientists/heisenberg/",
    "/problems/nonlocaity/": "/problems/nonlocality/",
    "/freedom/acausality.html": "/freedom/causality.html",
    "/solutions/scientists/bphr/": "/solutions/scientists/bohr/",
    "/solutions/scientist/jordan/": "/solutions/scientists/jordan/",
    "/solutions/scientist/mermin/": "/solutions/scientists/mermin/",
    "/freedom/predeterminism.html": "/freedom/pre-determinism.html",
    "/freedom/imdeterminism.html": "/freedom/indeterminism.html",
    "/knowledge/EPR/": "/knowledge/ERR/",
    "/solutions/philosopher/diodorus/": "/solutions/philosophers/diodorus/",
    "/solutions/philosophers/inwagen/": false,
    "/solutions/philosophers/husserl/": false,
    "/solutions/philosophers/watson/": false,
    "/solutions/philosophers/hook/": false,
    "/solutions/philosophers/arminius/": false,
    "/solutions/philosophers/fodor/": false,
    "/freedom/chance.html%22/": "/freedom/chance.html",
    "/freedom/chance.html%22": "/freedom/chance.html",
    "/freedom/agent_causality.html": "/freedom/agent-causality.html",
    "/freedom/determinist.html": "/freedom/determinism.html",
    "/freedom/pre_determinism.html": "/freedom/pre-determinism.html",
    "/solutions/philosophers/mcintyre/": "/solutions/philosophers/macintyre/",
    "/freedom/deliberation.html": "/freedom/de-liberation.html",
    "/freedom/psuedo-problem.html": "/freedom/pseudo-problem.html",
    "/solutions/philosopher/cicero/": "/solutions/philosophers/cicero/",
    "/solutions/philosopher/democritus/": "/solutions/philosophers/democritus/",
    "/solutions/philosopher/alexander/": "/solutions/philosophers/alexander/",
    "/solutions/philosopher/aristotle/": "/solutions/philosophers/aristotle/",
    "/solutions/philosopher/lucretius/": "/solutions/philosophers/lucretius/",
    "/solutions/philosopher/cicero/de_fato_english.html": "/solutions/philosophers/cicero/de_fato_english.html",
    "/freeedom/creativity.html": "/freedom/creativity.html",
    "/freeedom/causa_sui.html": "/freedom/causa_sui.html",
    "/freedom/semi-compatibilism.html": "/freedom/semicompatibilism.html",
    "/solutions/philosophers/wittenstein/": "/solutions/philosophers/wittgenstein/",
    "/freedom/comtrol.html": "/freedom/control.html",
    "/solutions/philosophers/lewid/": "/solutions/philosophers/lewis/",
    "/solutions/philosophers/lewis/Pragmatic_a_priori.html": false,
    "/solutions/philosopher/fischer/": "/solutions/philosophers/fischer/",
    "/solutions/phiolsophers/lucretius/de_rerum_natura.html": "/solutions/philosophers/lucretius/de_rerum_natura.html",
    "/freedom/two-stage-models.html": "/freedom/two-stage_models.html",
    "/solutions/philosphers/aristotle/": "/solutions/philosophers/aristotle/",
    "/solutions/scientist/mach/": "/solutions/scientists/mach/",
    "/solutions/philosphers/plato/": "/solutions/philosophers/plato/",
    "/solutions/scientist/newton/": "/solutions/scientists/newton/",
    "/philosophers/hume/": "/solutions/philosophers/hume/",
    "/solutions/philosophers/Hume/": "/solutions/philosophers/hume/",
    "/solutions/scientists/hume/": "/solutions/philosophers/hume/",
    "/freedom/libertartianism.html": "/freedom/libertarianism.html",
    "/freedom/inderterminism.html": "/freedom/indeterminism.html",
    "/solutions/scientists/schodinger/": "/solutions/scientists/schrodinger/",
    "/solutions/philosophers/james/essays_in_radical_empiricism.html": "/solutions/philosophers/james/Essays_in_Radical_Empiricism.html",
    "/freedom/moralresponsibility.html": "/freedom/moral_responsibility.html",
    "/solutions/philosophers/kant/Preface.html": "/solutions/philosophers/kant/preface.html",
    "/solutions/philosophers/kant/Introduction.html": "/solutions/philosophers/kant/introduction.html",
    "/solutions/philosophers/kant/Freedom.html": "/solutions/philosophers/kant/freedom.html",
    "/solutions/philosophers/kant/Critique_of_Practical_Reason.html": "/solutions/philosophers/kant/critique_of_practical_reason.html",
    "/freedom/tertium%20quid.html": "/freedom/tertium_quid.html",
    "/solutions/philosopher/nietzsche/": "/solutions/philosophers/nietzsche/",
    "/freedom/libertarianism%20.html": "/freedom/libertarianism.html",
    "/freedom/libertarianism .html": "/freedom/libertarianism.html",
    "/freedom/tertium_Quid.html": "/freedom/tertium_quid.html",
    "/solutions/philosophers/frge/": "/solutions/philosophers/frege/",
    "/solutions/philosophers/frge": "/solutions/philosophers/frege/",
    "/solutions/scientists/rasehevsky/": "/solutions/scientists/rashevsky/",
    "/solutions/philosophers/lewis/are_we_free_to_break_laws.pdf%22/": false,
    "/solutions/philosophers/lewis/are_we_free_to_break_laws.pdf%22": false,
    "/knowledge/philosophers/lewis/are_we_free_to_break_laws.pdf%22/": false,
    "/knowledge/philosophers/lewis/are_we_free_to_break_laws.pdf%22": false,
    "/freedom/indeterminism,html/": "/freedom/indeterminism.html",
    "/freedom/indeterminism,html": "/freedom/indeterminism.html",
    "/freedom/change.html": "/freedom/chance.html",
    "/freedom/chance_direct_cause.html%22/": "/freedom/chance_direct_cause.html",
    "/freedom/chance_direct_cause.html%22": "/freedom/chance_direct_cause.html",
    "/freesom/illusionism.html": "/freedom/illusionism.html",
    "/solutions/philosopher/hume/": "/solutions/philosophers/hume/",
    "/solutions/philosophers/sedgwick/": "/solutions/philosophers/sidgwick/",
    "/freedom/standard_argument.html%22/": "/freedom/standard_argument.html",
    "/freedom/standard_argument.html%22": "/freedom/standard_argument.html",
    "/value/ergod/%22/": "/value/ergod/",
    "/value/ergod/%22": "/value/ergod/",
    "/value/ergo/%22/": "/value/ergo/",
    "/value/ergo/%22": "/value/ergo/",
    "/solutions/scientists/layzer/Free_Will_As_A_Scientific_Problem.pdf%22/": "/solutions/scientists/layzer/free_will/",
    "/solutions/scientists/layzer/Free_Will_As_A_Scientific_Problem.pdf%22": "/solutions/scientists/layzer/free_will/",
    "/solutions/scientists/layzer/Naturalizing_Libertarian_Free_Will.doc%22/": "/solutions/scientists/layzer/free_will/",
    "/solutions/scientists/layzer/Naturalizing_Libertarian_Free_Will.doc%22": "/solutions/scientists/layzer/free_will/",
    "/solutions/scientists/layzer/free_will": "/solutions/scientists/layzer/free_will/",
    "/books/scandal/%22/": "/books/scandal/",
    "/books/scandal/%22": "/books/scandal/",
    "/mind/panpsychism/%22%22/": "/mind/panpsychism/",
    "/mind/panpsychism/%22%22": "/mind/panpsychism/",
    "/solutions/scientists/bricmont/+https://www.amazon.com/Fashionable-Nonsense-Postmodern-Intellectuals-Science-ebook/dp/B00GVRE638%22": false,
    "/solutions/experiments/EPR/%22%3EEPR%3C/a%3E%20thought%20experiment%20involved%20particles%20going%20in%20opposite%20directions%20from%20a%20central%20source.%20In%20that%20case%20the%20governing%20conservation%20law%20was%20for%20ordinary%20translational%20momentum.%20%3C!--%3Cdiv%20class=%22sectiontitle%22%3EAre%20Real%20Numbers%20Really%20Real": false,
    "/solutions/philosophers/cassirer/%22/": "/solutions/philosophers/cassirer/",
    "/solutions/philosophers/cassirer/%22": "/solutions/philosophers/cassirer/",
    "/freedom/responsibility.html%22/": "/freedom/responsibility.html",
    "/freedom/responsibility.html%22": "/freedom/responsibility.html",
    "/freedom/two-stage_models.html%22/": "/freedom/two-stage_models.html",
    "/freedom/two-stage_models.html%22": "/freedom/two-stage_models.html",
    "/freedom/control.html%22/": "/freedom/control.html",
    "/freedom/control.html%22": "/freedom/control.html",
    "/freedom/location.html%22/": "/freedom/location.html",
    "/freedom/location.html%22": "/freedom/location.html",
    "/freedom/moral_responsibility.html%22/": "/freedom/moral_responsibility.html",
    "/freedom/moral_responsibility.html%22": "/freedom/moral_responsibility.html",
    "/freedom/luck.html%22/": "/freedom/luck.html",
    "/freedom/luck.html%22": "/freedom/luck.html",
    "/solutions/scientists/pittendrigh/%22/": "/solutions/scientists/pittendrigh/",
    "/solutions/scientists/pittendrigh/%22": "/solutions/scientists/pittendrigh/",
    "/solutions/scientists/driesch/%22/": "/solutions/scientists/driesch/",
    "/solutions/scientists/driesch/%22": "/solutions/scientists/driesch/",
    "/solutions/scientists/haeckel/%22/": "/solutions/scientists/haeckel/",
    "/solutions/scientists/haeckel/%22": "/solutions/scientists/haeckel/",
    "/solutions/scientists/mayr/%22/": "/solutions/scientists/mayr/",
    "/solutions/scientists/mayr/%22": "/solutions/scientists/mayr/",
    "/solutions/scientists/monod/%22/": "/solutions/scientists/monod/",
    "/solutions/scientists/monod/%22": "/solutions/scientists/monod/",
    "/problems/reversibility/%22/": "/problems/reversibility/",
    "/problems/reversibility/%22": "/problems/reversibility/",
    "/quantum/hidden_constant/%22/": "/quantum/hidden_constant/",
    "/quantum/hidden_constant/%22": "/quantum/hidden_constant/",
    "/quantum/common_cause/%22/": "/quantum/common_cause/",
    "/quantum/common_cause/%22": "/quantum/common_cause/",
    "/freedom/adequate_determinism.html%22/": "/freedom/adequate_determinism.html",
    "/freedom/adequate_determinism.html%22": "/freedom/adequate_determinism.html",
    "/solutions/philosophers/james/%22/": "/solutions/philosophers/james/",
    "/solutions/philosophers/james/%22": "/solutions/philosophers/james/",
    "/freedom/pre-determinism.html%22/": "/freedom/pre-determinism.html",
    "/freedom/pre-determinism.html%22": "/freedom/pre-determinism.html",
    "/solutions/scientists/heisenberg/%22/": "/solutions/scientists/heisenberg/",
    "/solutions/scientists/heisenberg/%22": "/solutions/scientists/heisenberg/",
    "/freedom/free_will.html%22/": "/freedom/free_will.html",
    "/freedom/free_will.html%22": "/freedom/free_will.html",
    "/freedom/indetrminism.html": "/freedom/indeterminism.html",
    "/freedom/deteminism.html": "/freedom/determinism.html",
    "/knowledge/reliabiiism.html": "/knowledge/reliabilism.html",
    "/freedom/determinism.html%22/": "/freedom/determinism.html",
    "/freedom/determinism.html%22": "/freedom/determinism.html",
    "/solutions/philosopher/ramsey/": "/knowledge/philosophers/ramsey/",
    "/solution/philosophers/hume/": "/solutions/philosophers/hume/",
    "/freeedom/probability.html": "/freedom/probability.html",
    "/solutions/philosphers/wittgenstein/": "/solutions/philosophers/wittgenstein/",
    "/solutions/philosphers/wittgenstein": "/solutions/philosophers/wittgenstein/",
    "/solutions/philosphers/russell/": "/solutions/philosophers/russell/",
    "/solutions/philosphers/russell": "/solutions/philosophers/russell/",
    "/solutions/philosphers/james/": "/solutions/philosophers/james/",
    "/solutions/philosphers/james": "/solutions/philosophers/james/",
    "/solutions/philosphers/whitehead/": "/solutions/philosophers/whitehead/",
    "/solutions/philosphers/whitehead": "/solutions/philosophers/whitehead/",
    "/solutions/philosphers/peirce/": "/solutions/philosophers/peirce/",
    "/solutions/philosphers/peirce": "/solutions/philosophers/peirce/",
    "/solutions/philosopher/russell/": "/solutions/philosophers/russell/",
    "/solutions/philosophers/vaninawagen/": "/solutions/philosophers/vaninwagen/",
    "/freedom/determinism.htmL": "/freedom/determinism.html",
    "/solutions/philosophrs/frankfurt/": "/solutions/philosophers/frankfurt/",
    "/solutions/philosophers/strawson/freedom_and_resentment.html%22/": "/solutions/philosophers/strawson/freedom_and_resentment.html",
    "/solutions/philosophers/strawson/freedom_and_resentment.html%22": "/solutions/philosophers/strawson/freedom_and_resentment.html",
    "/solutions/philosophers/cargas/": "/solutions/philosophers/vargas/",
    "/solutions/scientist/wiener/": "/solutions/scientists/wiener/",
    "/freedon/otherwise.html": "/freedom/otherwise.html",
    "/freedom/determinsim.html": "/freedom/determinism.html",
    "/freedom/controle.html": "/freedom/control.html",
    "/Tractatus/": "/tractatus/",
    "/solutions/philosopehers/locke/": "/solutions/philosophers/locke/",
    "/solutions/philosopers/smilansky/": "/solutions/philosophers/smilansky/",
    "/life/universal_darwinisn/": "/life/universal_darwinism/",
    "/life/universal_darwinisn%3C/a%3EUniversal%20Darwinism%3C/a%3E,%20but%20well%20beyond%20the%20original%20idea%20of%20%3Ca%20href=": "/life/universal_darwinism/",
    "/problems/schrodinger_cat/": "/solutions/experiments/schrodingerscat/",
    "/solutions/experiements/EPR/": "/solutions/experiments/EPR/",
    "/solutions/scientists/dennett/": "/solutions/scientists/bennett/",
    "/entanglement/common_causet/": "/entanglement/common_cause/",
    "/solutions/scientist/maxwell/": "/solutions/scientists/maxwell/",
    "/freedom/temporal%20equence.html": "/freedom/temporal_sequence.html",
    "/freedom/temporal_sequance.html": "/freedom/temporal_sequence.html",
    "/scientist/maxwell/": "/solutions/scientists/maxwell/",
    "/solutions/philosopher/price/": "/solutions/philosophers/price/",
    "/solutions/scientist/loschmidt/": "/solutions/scientists/loschmidt/",
    "/solutions/scientists/Bennett/": "/solutions/scientists/bennett/",
    "/solutions/philosophers/democritus./": "/solutions/philosophers/democritus/",
    "/solutions/scientists/Chaitin/": "/solutions/scientists/chaitin/",
    "/solutions/scientists/Davies/": "/solutions/scientists/davies/",
    "/solutions/scientists/Stewart/": "/solutions/scientists/stewart/",
    "/solutions/scientists/Loewentein/": "/solutions/scientists/loewenstein/",
    "/introduction/physics/interpretations/%22/": "/introduction/physics/interpretations/",
    "/introduction/physics/interpretations/%22": "/introduction/physics/interpretations/",
    "/solutions/philosopher/merricks/": "/solutions/philosophers/merricks/",
    "/solutions/scientist/darwin/": "/solutions/scientists/darwin/",
    "/solutions/scientist/mayr/": "/solutions/scientists/mayr/",
    "/solutions/scientist/pittendrigh/": "/solutions/scientists/pittendrigh/",
    "/solutions/scientist/monod/": "/solutions/scientists/monod/",
    "/freedom/causa_suit.html": "/freedom/causa_sui.html",
    "/freedom/crativity.html": "/freedom/creativity.html",
    "/solutions/scientists/sherrigton/": "/solutions/scientists/sherrington/",
    "/solutions/scientists/sherrigton/%3E": "/solutions/scientists/sherrington/",
    "/value/ERGO/": "/value/ergo/",
    "/freedom/pre-determimism.html": "/freedom/pre-determinism.html",
    "/freedom/uncertainty.html%22/": "/freedom/uncertainty.html",
    "/freedom/uncertainty.html%22": "/freedom/uncertainty.html",
    "/solution/experiments/EPR/": "/solutions/experiments/EPR/",
    "/soutions/scientists/ghirardi/": "/solutions/scientists/ghirardi/",
    "/freedom/libet_experiment.html": "/freedom/libet_experiments.html",
    "/solutions/pilosophers/Aristotle/": "/solutions/philosophers/aristotle/",
    "/solutions/scientists/heisenberg/Talk_with_Einstein..html": "/solutions/scientists/heisenberg/talk_with_einstein.html",
    "/freedom/Laplace_Demon.html": "/freedom/laplaces_demon.html",
    "/solutions/scientists/layzer/Arrow_of_Time.html": "/solutions/scientists/layzer/arrow_of_time.html",
    "/solution/dualisms/": "/solutions/dualisms/",
    "/solutions/scientists/bolzmann/": "/solutions/scientists/boltzmann/",
    "/solutions/scientists/solomomoff/": "/solutions/scientists/solomonoff/",
    "/solutions/scientists/solomomoff": "/solutions/scientists/solomonoff/",
    "/presentation/biosemiotics/": "/presentations/Biosemiotics/",
    "/knowledge/err/": "/knowledge/ERR/",
    "/solutions/experiments/schodingerscat/": "/solutions/experiments/schrodingerscat/",
    "/solutions/scientists/misesL/": "/solutions/scientists/mises/",
    "/mind/err/": "/mind/ERR/",
    "/life/%22/": "/life/",
    "/life/%22": "/life/",
    "/books/WWaF": "/books/WWaF/",
    "/problems/recurrence/%22/": "/problems/recurrence/",
    "/problems/recurrence/%22": "/problems/recurrence/",
    "/solutions/scientists/mccculloch/": "/solutions/scientists/mcculloch/",
    "/freedom/Libet_experiments.html": "/freedom/libet_experiments.html",
    "/problems/nonseperability/": "/problems/nonseparability/",
    "/solutions/experiments/epr/": "/solutions/experiments/EPR/",
    "/solutions/scientist/exner/": "/solutions/scientists/exner/",
    "/solutions/scientist/boltzmann/": "/solutions/scientists/boltzmann/",
    "/solutions/scientists/bell/epistemological%20letters/": "/solutions/scientists/bell/Epistemological_Letters/",
    "/solutions/scientist/born/": "/solutions/scientists/born/",
    "/solutions/scientist/bohr/": "/solutions/scientists/bohr/",
    "/solutions/scientist/planck/": "/solutions/scientists/planck/",
    "/solutions/scientist/wheeler/": "/solutions/scientists/wheeler/",
    "/solutions/scientist/zeh/": "/solutions/scientists/zeh/",
    "/solutions/scientist/zurek/": "/solutions/scientists/zurek/",
    "/freedom/cogito/%22/": "/freedom/cogito/",
    "/freedom/cogito/%22": "/freedom/cogito/",
    "/freedom/causa_sui.htm;/": "/freedom/causa_sui.html",
    "/freedom/causa_sui.htm;": "/freedom/causa_sui.html",
    "/freedom/chance+direct_cause.html": "/freedom/chance_direct_cause.html",
    "/freedom/chance%2Bdirect_cause.html": "/freedom/chance_direct_cause.html",
    "/solutions/scientist/sperry/": "/solutions/scientists/sperry/",
    "/introduction/physics/interpetation/": "/introduction/physics/interpretation/",
    "/solutions/scientists/wiener/Wiener_Progress_and_Entropy.pdf%22/": false,
    "/solutions/scientists/wiener/Wiener_Progress_and_Entropy.pdf%22": false,
    "/problem/consciousness/": "/problems/consciousness/",
    "/problem/ought_from_is/": "/problems/ought_from_is/",
    "/problem/one_or_many/": "/problems/one_or_many/",
    "/problem/induction/": "/problems/induction/",
    "/problem/evil/": "/problems/evil/",
    "/problem/universals/": "/problems/universals/",
    "/freedom/adequate_determinsim.html": "/freedom/adequate_determinism.html",
    "/freedom/franfkfurt_cases.html": "/freedom/frankfurt_cases.html",
    "/freedom/up+to_us.html": "/freedom/up_to_us.html",
    "/freedom/compatiblilism.html": "/freedom/compatibilism.html",
    "/freesom/same_curcumstances.html": "/freedom/same_circumstances.html",
    "/articles/Jamesian_Free_Will.pdf%22/": false,
    "/articles/Jamesian_Free_Will.pdf%22": false,
    "/solutions/philosophers/lewis/articles/postmodernism.html": false,
    "/presentations/video/%22/": "/presentations/video/",
    "/presentations/video/%22": "/presentations/video/",
    "/entanglement/common_cause/%22/": "/entanglement/common_cause/",
    "/%E2%80%9C/entanglement/common_cause/%22": "/entanglement/common_cause/",
    "/solutons/scientists/schrodinger/": "/solutions/scientists/schrodinger/",
    "/solutons/scientists/einstein/": "/solutions/scientists/einstein/",
    "/freedom/responsibilty.html": "/freedom/responsibility.html",
    "/freedom/moral_%20responsibility.html": "/freedom/moral_responsibility.html",
    "/knowldge/ERR/": "/knowledge/ERR/",
    "/presentations/Free__Will/two-stage_model.html": "/presentations/Free__Will/two-stage.model.html",
    "/presentations/Evo_Devo_CSS/index.4.en.html": "/presentations/Evo_Devo_CCS/index.4.en.html",
    "/solutions/scientists/helmholtx/": "/solutions/scientists/helmholtz/",
    "/freedom/adequate_determinism%20.html": "/freedom/adequate_determinism.html",
    "/freedom/indeterminism%20.html": "/freedom/indeterminism.html",
    "/freedom/determinism%20.html": "/freedom/determinism.html",
    "/periodic_table/marc-doyle.html": "/periodic_table/marc_doyle.html",
    "/books/%22/": "/books/",
    "/books/%22": "/books/",
    "/freedom/adequate_detrerminism.html": "/freedom/adequate_determinism.html",
    "/solutions/scientists/Laplace/": "/solutions/scientists/laplace/",
    "/solutions/scientists/Planck/": "/solutions/scientists/planck/",
    "/introduction/physics/waver-particle_duality.html": "/introduction/physics/wave-particle_duality.html",
    "/solutions/philosophers/searle/%22/": "/solutions/philosophers/searle/",
    "/solutions/philosophers/searle/%22": "/solutions/philosophers/searle/",
    "/freedom/atandard_argument.html": "/freedom/standard_argument.html",
    "/freedom/adequate-determinism.html": "/freedom/adequate_determinism.html",
    "/freedom/indeterminism.html%22/": "/freedom/indeterminism.html",
    "/freedom/indeterminism.html%22": "/freedom/indeterminism.html",
    "/solutions/philosophers/vaninwagen/%22/": "/solutions/philosophers/vaninwagen/",
    "/solutions/philosophers/vaninwagen/%22": "/solutions/philosophers/vaninwagen/",
    "/solutions/philosophers/lockwood/%22/": "/solutions/philosophers/lockwood/",
    "/solutions/philosophers/lockwood/%22": "/solutions/philosophers/lockwood/",
    "/solutions/philosophers/mcginn/%22/": "/solutions/philosophers/mcginn/",
    "/solutions/philosophers/mcginn/%22": "/solutions/philosophers/mcginn/",
    "/solutions/philosophers/chalmers/%22/": "/solutions/philosophers/chalmers/",
    "/solutions/philosophers/chalmers/%22": "/solutions/philosophers/chalmers/",
    "/Value/": "/value/",
    "/knowledge/redutionism.html": "/knowledge/reductionism.html",
    "/Freedom/": "/freedom/",
    "/freedom/temporal%20sequence.html": "/freedom/temporal_sequence.html",
    "/freedom/moral_responsibilty.html": "/freedom/moral_responsibility.html",
    "/values/ergod/": "/value/ergod/",
    "/freedom/incompatiblism.html": "/freedom/incompatibilism.html",
    "/freedom/problems/metaphysics/": "/problems/metaphysics/",
    "/freedom/alternative%20possibilities.html": "/freedom/alternative_possibilities.html",
    "/afterwords/glosary/": "/afterwords/glossary/",
    "/solutions/experiments/heisenbergs_microscope/": "/solutions/experiments/heisenberg_microscope/",
    "/solutions/experiments/bell_theorem/": "/solutions/experiments/Bells_Theorem/",
    "/freedom/alternative-possibilities.html": "/freedom/alternative_possibilities.html",
    "/solutions/determinsms/": "/solutions/determinisms/",
    "/freedom/soft-causality.html": "/freedom/soft_causality.html",
    "/freedom/two-stage_model.html": "/freedom/two-stage_models.html",
    "/solutions/scientists/layzer/%22/": "/solutions/scientists/layzer/",
    "/solutions/scientists/layzer/%22": "/solutions/scientists/layzer/",
    "/solutions/scientists/boltzmann/%22/": "/solutions/scientists/boltzmann/",
    "/solutions/scientists/boltzmann/%22": "/solutions/scientists/boltzmann/",
    "/solutions/philosophers/lewis/%22/": "/solutions/philosophers/lewis/",
    "/solutions/philosophers/lewis/%22": "/solutions/philosophers/lewis/",
    "/solutions/scientists/wheeler/%22/": "/solutions/scientists/wheeler/",
    "/solutions/scientists/wheeler/%22": "/solutions/scientists/wheeler/",
    "/solutions/philosophers/locke/%22/": "/solutions/philosophers/locke/",
    "/solutions/philosophers/locke/%22": "/solutions/philosophers/locke/",
    "/solutions/philosophers/hobart/%22/": "/solutions/philosophers/hobart/",
    "/solutions/philosophers/hobart/%22": "/solutions/philosophers/hobart/",
    "/freedom/ultimate_responsibiliy.html": "/freedom/ultimate_responsibility.html",
    "/freedom/chance%20_direct_cause.html": "/freedom/chance_direct_cause.html",
    "/solutions/philosophers/Epicurus/": "/solutions/philosophers/epicurus/",
    "/solutions/phiosophers/epicurus/": "/solutions/philosophers/epicurus/",
    "/solutions/scientists/Onsager/": "/solutions/scientists/onsager/index.parc.html",
    "/problems/reversibility/solutions/scientists/Onsager/": "/solutions/scientists/onsager/index.parc.html",
    "/solutions/philosophers/epicurus/epistula_ad%20menoeceum.html": "/solutions/philosophers/epicurus/epistula_ad_menoeceum.html",
    "/freedom/cuasal_closure.html": "/freedom/causal_closure.html",
    "/freedom/alternative_possibilites.html": "/freedom/alternative_possibilities.html",
    "/solutions/scientists/Gold/": "/solutions/scientists/gold/",
    "/problem/causality.html": "/freedom/causality.html",
    "/freedom/problem/causality.html": "/freedom/causality.html",
    "/problem/responsibility.html": "/freedom/responsibility.html",
    "/freedom/problem/responsibility.html": "/freedom/responsibility.html",
    "/solutions/philosopher/hobbes/": "/solutions/philosophers/hobbes/",
    "/knowledge/contigency.html": "/knowledge/contingency.html",
    "/fredom/pre-determinism.html": "/freedom/pre-determinism.html",
    "/freedom/freed_will.html": "/freedom/free_will.html",
    "/solutions/philosopher/leibniz/": "/solutions/philosophers/leibniz/",
    "/solutions/philosopher/locke/": "/solutions/philosophers/locke/",
    "/solutions/philosopher/strawson/": "/solutions/philosophers/strawson/",
    "/solutions/philosopher/clarkes/": "/solutions/philosophers/clarkes/",
    "/solutions/philosophers/Lucretius/": "/solutions/philosophers/lucretius/",
    "/freedom/determinism.html./": "/freedom/determinism.html",
    "/freedom/determinism.html.": "/freedom/determinism.html",
    "/solutions/scientists/Howard/": "/solutions/scientists/howard/",
    "/solutions/scientists/Howard": "/solutions/scientists/howard/",
    "/solutions/scientist/pattee/": "/solutions/scientists/pattee/",
    "/solutions/experiments/schrodingercat/": "/solutions/experiments/schrodingerscat/",
    "/solutions/scientists/schroginger/": "/solutions/scientists/schrodinger/",
    "/problems/determinisms/behavioral/": "/solutions/determinisms/behavioral/",
    "/quantum/two_slit/": "/quantum/two-slit/",
    "/solutions/philosophers/Leucippus/": "/solutions/philosophers/leucippus/",
    "/presentations/Free__Will/err-intro.html": "/presentations/Free__Will/err_intro.html",
    "/freedom/two-stage_modes.html": "/freedom/two-stage_models.html",
    "/freedom/emergent_determinsm.html": "/freedom/emergent_determinism.html",
    "/solutions/experiments/dirac_3_polarizers/": "/solutions/experiments/dirac_3-polarizers/",
    "/solutions/philosophers/nagel/": "/solutions/philosophers/nagele/",
    "/solutions/philosophers/taylor/": "/solutions/philosophers/taylorr/",
    "/knowledge/philosophers/bishop/": "/solutions/philosophers/bishop/",
    "/knowledge/philosophers/ducasse/": "/solutions/philosophers/ducasse/",
    "/introduction/creation/value/ergo/": "/value/ergo/",
    "/knowledge/philosophers/martineau/": "/solutions/philosophers/martineau/",
    "/knowledge/philosophers/lockwood/": "/solutions/philosophers/lockwood/",
    "/knowledge/philosophers/meehl/": "/solutions/philosophers/meehl/",
    "/knowledge/philosophers/putnam/": "/solutions/philosophers/putnam/",
    "/knowledge/philosophers/pears/": "/solutions/philosophers/pears/",
    "/knowledge/philosophers/levin/": "/solutions/philosophers/levin/",
    "/knowledge/philosophers/rietdijk/": "/solutions/philosophers/rietdijk/",
    "/knowledge/philosophers/ward/": "/solutions/philosophers/ward/",
    "/knowledge/philosophers/wallacedf/": "/solutions/philosophers/wallacedf/",
    "/knowledge/philosophers/stout/": "/solutions/philosophers/stout/",
    "/knowledge/philosophers/williams/": "/solutions/philosophers/williams/",
    "/problems/god/solutions/dualisms/": "/solutions/dualisms/",
    "/problems/evil/solutions/dualisms/": "/solutions/dualisms/",
    "/problems/measurement/solutions/scientists/heisenberg/": "/solutions/scientists/heisenberg",
    "/problems/measurement/solutions/scientists/heisenberg": "/solutions/scientists/heisenberg",
    "/problems/measurement/solutions/scientists/jordan/": "/solutions/scientists/jordan",
    "/problems/measurement/solutions/scientists/jordan": "/solutions/scientists/jordan",
    "/problems/measurement/solutions/scientists/schrodinger/": "/solutions/scientists/schrodinger",
    "/problems/measurement/solutions/scientists/schrodinger": "/solutions/scientists/schrodinger",
    "/problems/measurement/solutions/scientists/born/": "/solutions/scientists/born",
    "/problems/measurement/solutions/scientists/born": "/solutions/scientists/born",
    "/problems/measurement/solutions/scientists/dirac/": "/solutions/scientists/dirac/",
    "/knowledge/philosophers/dupre/": "/solutions/philosophers/dupre/",
    "/problems/metaphysics/solutions/truth/": "/solutions/truth/",
    "/problems/nonlocality/solutions/experiments/EPR/": "/solutions/experiments/EPR/",
    "/problems/nonlocality/problems/arrow_of_time/": "/problems/arrow_of_time/",
    "/problems/nonlocality/problems/reversibility/": "/problems/reversibility/",
    "/problems/recurrence/freedom/determinism.html": "/freedom/determinism.html",
    "/problems/recurrence/freedom/same_circumstances.html": "/freedom/same_circumstances.html",
    "/freedom/books/problems/": "/books/problems/",
    "/freedom/freedom/libertarianism.html": "/freedom/libertarianism.html",
    "/freedom/freedom/causa_sui.html": "/freedom/causa_sui.html",
    "/freedom/problem/free%20will/": "/freedom/problem/",
    "problem/free%20will/": "/freedom/problem/",
    "/freedom/problem/%3Efree%20will%3C/a%3E.%20I%20am%20an%20%3Ca%20href=": "/freedom/problem/",
    "/scientists/newton/": "/solutions/scientists/newton/",
    "/freedom/history/freedom/libertarianism.html": "/freedom/libertarianism.html",
    "/freedom/freedom/chance_direct_cause.html": "/freedom/chance_direct_cause.html",
    "/freedom/freedom/up_to_us.html": "/freedom/up_to_us.html",
    "/freedom/history/freedom/causa_sui.html": "/freedom/causa_sui.html",
    "/philosophers/poincare/": "/solutions/scientists/poincare/",
    "/freedom/freedom/superdeterminism.html": "/freedom/superdeterminism.html",
    "/value/evil/solutions/dualisms/": "/solutions/dualisms/",
    "/knowledge/philosophers/pollock/": "/solutions/scientists/pollen/",
    "/philosophers/pollock/": "/solutions/scientists/pollen/",
    "/knowledge/philosophers/foley/": false,
    "/knowledge/philosophers/moser/": false,
    "/philosophers/foley": false,
    "/philosophers/moser/": false,
    "/knowledge/philosophers/moser": false,
    "/knowledge/complexity/solutions/scientists/simon/": "/solutions/scientists/simon/",
    "/knowledge/complexity/solutions/scientists/prigogine/": "/solutions/scientists/prigogine/",
    "/knowledge/complexity/solutions/scientists/bennett/": "/solutions/scientists/bennett/",
    "/knowledge/complexity/solutions/scientists/loewenstein/": "/solutions/scientists/loewenstein/",
    "/knowledge/complexity/solutions/scientists/chaitin/": "/solutions/scientists/chaitin/",
    "/knowledge/introduction/creation/": "/introduction/creation/",
    "/philosophers/plato/": "/solutions/philosophers/plato/",
    "/philosophers/platinga/": false,
    "/solutions/philosophers/platinga/": false,
    "/philosophers/kant/": "/solutions/philosophers/kant/",
    "/life/biosemiotics/freedom/pre-determinism.html": "/freedom/pre-determinism.html",
    "/life/biosemiotics/knowledge/downward_causation.html": "/knowledge/downward_causation.html",
    "/life/autopoesis/life/complexity/": "/life/complexity/",
    "/life/goal/problems/consciousness/": "/problems/consciousness/",
    "/life/emergence/introduction/creation/": "/introduction/creation/",
    "/life/meaning/freedom/two-stage_models.html": "/freedom/two-stage_models.html",
    "/mind/problems/consciousness/": "/problems/consciousness/",
    "/solutions/freedom/cogito/": "/freedom/cogito/",
    "/mind/purpose/problems/consciousness/": "/problems/consciousness/",
    "/quantum/problems/nonlocality/": "/problems/nonlocality/",
    "/quantum/introduction/creation/": "/introduction/creation/",
    "/solutions/scientists/einstein/freedom/indeterminism.html": "/freedom/indeterminism.html",
    "/introduction/physics/freedom/uncertainty.html": "/freedom/uncertainty.html",
    "/solutions/scientists/einstein/problems/arrow_of_time/": "/problems/arrow_of_time/",
    "/solutions/scientists/einstein/problems/reversibility/": "/problems/reversibility/",
    "/solutions/scientists/einstein/freedom/uncertainty.html": "/freedom/uncertainty.html",
    "/quantum/determinism/introduction/information/": "/introduction/information/",
    "/quantum/copenhagen/freedom/probability.html": "/freedom/probability.html",
    "/quantum/copenhagen/freedom/chance.html": "/freedom/chance.html",
    "/quantum/decoherence/freedom/indeterminacy.html": "/freedom/indeterminacy.html",
    "/quantum/principles/introduction/creation/": "/introduction/creation/",
    "/quantum/interpretations/introduction/creation/": "/introduction/creation/",
    "/quantum/interpretations/problems/nonlocality/": "/problems/nonlocality/",
    "/quantum/equation/introduction/creation/": "/introduction/creation/",
    "/quantum/superposition/introduction/creation/": "/introduction/creation/",
    "/entanglement/freedom/indeterminism.html": "/freedom/indeterminism.html",
    "/entanglement/'freedom/indeterminism.html": "/freedom/indeterminism.html",
    "/solutions/experiments/schrodingerscat/freedom/determinism.html": "/freedom/determinism.html",
    "/introduction/physics/freedom/chance.html": "/freedom/chance.html",
    "/introduction/physics/problems/reversibility/": "/problems/reversibility/",
    "/introduction/physics/freedom/causa_sui.html": "/freedom/causa_sui.html",
    "/quantum/two-slit/problems/entanglement/": "/problems/entanglement/",
    "/entanglement/common_cause/quantum/mystery/": "/quantum/mystery/",
    "/solutions/experiments/EPR/freedom/determinism.html": "/freedom/determinism.html",
    "/solutions/experiments/EPR/freedom/superdeterminism.html": "/freedom/superdeterminism.html",
    "/solutions/experiments/EPR/freedom/illusionism.html": "/freedom/illusionism.html",
    "/quantum/hidden_constant/freedom/illusionism.html": "/freedom/illusionism.html",
    "/quantum/hidden_constant/freedom/determinism.html": "/freedom/determinism.html",
    "/quantum/hidden_constant/problems/reversibility/": "/problems/reversibility/",
    "/quantum/hidden_constant/problems/arrow_of_time/": "/problems/arrow_of_time/",
    "/entanglement/spooky/problems/arrow_of_time/": "/problems/arrow_of_time/",
    "/entanglement/spooky/problems/reversibility/": "/problems/reversibility/",
    "/entanglement/spooky/quantum/collapse/": "/quantum/collapse/",
    "/knowledge/foundationalism.html.html": "/knowledge/foundationalism.html",
    "/solutions/philosophers/bok/freedom/indeterminism.html": "/freedom/indeterminism.html",
    "/solutions/philosophers/bok/freedom/pre-determinism.html": "/freedom/pre-determinism.html",
    "/solutions/philosophers/bok/freedom/compatibilism.html": "/freedom/compatibilism.html",
    "/solutions/philosophers/balaguer/solutions/philosophers/kane/": "/solutions/philosophers/kane/",
    "/solutions/philosophers/bok/freedom/standard_argument.html": "/freedom/standard_argument.html",
    "/solutions/philosophers/bok/freedom/cogito/": "/freedom/cogito/",
    "/solutions/philosophers/bok/freedom/possibilities.html": "/freedom/possibilities.html",
    "/solutions/philosophers/bok/freedom/adequate_determinism.html": "/freedom/adequate_determinism.html",
    "/knowledge/philosophers/quine/": "/solutions/philosophers/quine/",
    "/knowledge/philosophers/james/": "/solutions/philosophers/james/",
    "/knowledge/philosophers/hegel/": "/solutions/philosophers/hegel/",
    "/knowledge/philosophers/royce/": "/solutions/philosophers/royce/",
    "/knowledge/philosophers/bradley/": "/solutions/philosophers/bradley/",
    "/knowledge/philosophers/peirce/": "/solutions/philosophers/peirce/",
    "/knowledge/philosophers/russell/": "/solutions/philosophers/russell/",
    "/knowledge/philosophers/grice/": "/solutions/philosophers/grice/",
    "/knowledge/philosophers/strawson/": "/solutions/philosophers/strawson/",
    "/knowledge/philosophers/lewis/articles/postmodernism.html": "/articles/postmodernism.html",
    "/solutions/philosophers/chalmers/knowledge/ERR/": "/knowledge/ERR/",
    "/solutions/philosophers/flanagan/solutions/philosophers/sellars/": "/solutions/philosophers/sellars/",
    "/solutions/philosophers/flanagan/solutions/philosophers/kane/": "/solutions/philosophers/kane/",
    "/solutions/philosophers/hodgson/freedom/standard_argument.html": "/freedom/standard_argument.html",
    "/solutions/philosophers/vaninwagen/freedom/responsibility.html": "/freedom/responsibility.html",
    "/solutions/philosophers/vaninwagen/freedom/up_to_us.html": "/freedom/up_to_us.html",
    "/solutions/philosophers/kripke/freedom/otherwise.html": "/freedom/otherwise.html",
    "/solutions/philosophers/kripke/'freedom/otherwise.html": "/freedom/otherwise.html",
    "/solutions/philosophers/kripke/freedom/possibilities.html": "/freedom/possibilities.html",
    "/solutions/philosophers/kripke/'freedom/possibilities.html": "/freedom/possibilities.html",
    "/solutions/philosophers/leibniz/knowledge/ERR/": "/knowledge/ERR/",
    "/solutions/philosophers/maudlin/quantum/hidden_constant/": "/quantum/hidden_constant/",
    "/solutions/philosophers/rand/solutions/scientists/baars/": "/solutions/scientists/baars/",
    "/solutions/philosophers/russell/freedom/two-stage_models.html": "/freedom/two-stage_models.html",
    "/solutions/philosophers/schlick/freedom/responsibility.html": "/freedom/responsibility.html",
    "/solutions/philosophers/schlick/freedom/causality.html": "/freedom/causality.html",
    "/solutions/philosophers/sidgwick/freedom/illusionism.html": "/freedom/illusionism.html",
    "/mind/consciousness%3Econsciousness%3Ca%3E,%20which%20seems%20close%20to%20the%20idea%20of%20the%20%3Ci%3Econscious%20observer%3C/i%3E%20in%20the%20Copenhagen%20%20Interpretation%20of%20quantum%20mechanics.%20He%20writes:%3Cblockquote%3EAs%20we%20conceive%20of%20it,%20movement%20always%20appears%20as%20self-moving,%20form%20as%20forming,%20form%20also%20as%20knowable,%20and%20knowledge%20as%20form.%20Is%20this%20a%20theory%20that%20objectifies%20consciousness,%20or%20are%20our%20formulations%20obtained%20in%20an%20underhand%20way": false,
    "/solutions/philosophers/twain/freedom/adequate_determinism.html": "/freedom/adequate_determinism.html",
    "/solutions/philosophers/whitehead/mind/panpsychism/": "/mind/panpsychism/",
    "/solutions/philosophers/whitehead/introduction/information/": "/introduction/information/",
    "/solutions/scientists/bell/freedom/illusionism.html": "/freedom/illusionism.html",
    "/solutions/scientists/bell/freedom/determinism.html": "/freedom/determinism.html",
    "/solutions/philosophers/greene/": "/solutions/philosophers/green/",
    "/solutions/scientists/bell/quantum/qubits/": "/quantum/qubits/",
    "/solutions/scientists/bell/quantum/computer/": "/quantum/computer/",
    "/solutions/scientists/campbellj/solutions/scientists/dawkins/": "/solutions/scientists/dawkins/",
    "/solutions/scientists/cramer/freedom/nonlocality.html": "/freedom/nonlocality.html",
    "/solutions/scientists/davies/solutions/scientists/simon/": "/solutions/scientists/simon/",
    "/solutions/scientists/davies/freedom/causality.html": "/freedom/causality.html",
    "/solutions/scientists/eddington/problems/arrow_of_time/": "/problems/arrow_of_time/",
    "/solutions/scientists/ghirardi/problems/measurement/": "/problems/measurement/",
    "/solutions/scientists/hameroff/solutions/experiments/wave-function_collapse/": "/solutions/experiments/wave-function_collapse/",
    "/solutions/scientists/lloyd/freedom/determinism.html": "/freedom/determinism.html",
    "/solutions/scientists/lloyd/freedom/laplaces_demon.html": "/freedom/laplaces_demon.html",
    "/solutions/scientists/noether/solutions/experiments/EPR/": "/solutions/experiments/EPR/",
    "/solutions/scientists/mermin/quantum/hidden_constant/": "/quantum/hidden_constant/",
    "/solutions/scientists/mermin/quantum/common_cause/": "/quantum/common_cause/",
    "/solutions/scientists/primas/solutions/scientists/pauli/": "/solutions/scientists/pauli/",
    "/solutions/scientists/neumann/freedom/temporal_sequence.html": "/freedom/temporal_sequence.html",
    "/solutions/scientists/pattee/freedom/possibilities.html": "/freedom/possibilities.html",
    "/solutions/scientists/reif/freedom/determinism.html": "/freedom/determinism.html",
    "/solutions/scientists/stapp/freedom/possibilities.html": "/freedom/possibilities.html",
    "/solutions/scientists/stapp/freedom/chance.html": "/freedom/chance.html",
    "/solutions/scientists/stapp/freedom/adequate_determinism.html": "/freedom/adequate_determinism.html",
    "/solutions/scientists/stapp/freedom/self-determination.html": "/freedom/self-determination.html",
    "/solutions/scientists/maynard-smith/solutions/scientists/haldane/": "/solutions/scientists/haldane/",
    "/philosophers/lewis/": "/solutions/philosophers/lewis/",
    "/scientists/everett/": "/solutions/scientists/everett/",
    "/books/knowledge/ERR/": "/knowledge/ERR",
    "/books/knowledge/ERR": "/knowledge/ERR",
    "/solutions/scientists/zermelo/freedom/same_circumstances.html": "/freedom/same_circumstances.html",
    "/solutions/scientists/zermelo/freedom/determinism.html": "/freedom/determinism.html",
    "/solutions/scientists/wolfram/freedom/determinism.html": "/freedom/determinism.html",
    "/scientists/schrodinger/": "/solutions/scientists/schrodinger/",
    "/introduction/physics/interpretation/quantum/collapse/": "/quantum/collapse/",
    "/problems/entanglement/freedom/indeterminism.html": "/freedom/indeterminism.html",
    "/problems/entanglement/'freedom/indeterminism.html": "/freedom/indeterminism.html",
    "/problems/decoherence/freedom/indeterminacy.html": "/freedom/indeterminacy.html",
    "/freedom/solutions/dogmas/logic.html": "/solutions/dogmas/logic.html",
    "/freedom/introduction/information/": "/introduction/information/",
    "/introduction/physics/freedom/probability.html": "/freedom/probability.html",
    "/solutions/experiments/two-slit_experiment/problems/entanglement/": "/problems/entanglement/",
    "/knowledge/freedom/indeterminacy.html": "/freedom/indeterminacy.html",
    "/introduction/physics/interpretations/problems/nonlocality/": "/problems/nonlocality/",
    "/introduction/physics/interpretations/introduction/creation/": "/introduction/creation/",
    "/solutions/experiments/photoelectric_effect/problems/reversibility/": "/problems/reversibility/",
    "/solutions/experiments/photoelectric_effect/problems/arrow_of_time/": "/problems/arrow_of_time/",
    "/introduction/physics/freedom/indeterminacy.html": "/freedom/indeterminacy.html",
    "/knowledge/solutions/dogmas/logic.html": "/solutions/dogmas/logic.html",
    "/value/philosophers/harman/": "/solutions/philosophers/earman/",
    "/philosophers/harman/": "/solutions/philosophers/earman/",
    "/solutions/philosophers/harman/": "/solutions/philosophers/earman/",
    "/freedom/problem/necessity.html": false,
    "/problem/necessity.html": false,
    "/freedom/problem/adequate_determinism.html": false,
    "/problem/adequate_determinism.html": false,
    "/freedom/problem/de-liberation.html": false,
    "/problem/de-liberation.html": false,
    "/problem/indeterminism.html": "/freedom/indeterminism.html",
    "/freedom/problem/indeterminism.html": "/freedom/indeterminism.html",
    "/freedom/problem/noise.html": false,
    "/problem/noise.html": false,
    "/problems/noise.html": false,
    "/freedom/problem/creativity.html": false,
    "/problem/creativity.html": false,
    "/freedom/freedom/determinism.html": "/freedom/determinism.html",
    "/freedom/afterwords/glossary/": "/afterwords/glossary/",
    "/freedom/freedom/otherwise.html": "/freedom/otherwise.html",
    "/scientists/solutions/lloyd/": "/solutions/scientists/lloyd/",
    "/solutions/scientists/solutions/lloyd/": "/solutions/scientists/lloyd/",  
    "/scientists/solutions/layzer/": "/solutions/scientists/layzer/",
    "/solutions/lloyd/": "/solutions/scientists/lloyd/",  
    "/solutions/layzer/": "/solutions/scientists/layzer/",
    "/freedom/problem/chance.html": false,
    "/problem/chance.html": false,
    "/freedom/freedom/free_will_in_antiquity.html": "/freedom/free_will_in_antiquity.html",
    "/knowledge/philosophers/plantinga/": false,
    "/philosophers/plantinga/": false,
    "/solutions/experiments/problems/reversibility/": false,
    "/experiments/problems/reversibility/": false,
    "/solutions/experiments/problems/arrow_of_time/": false,
    "/experiments/problems/arrow_of_time/": false,
    "/solutions/scientists/indeterminism_in_physics.html": "/freedom/indeterminism.html",
    "/scientists/indeterminism_in_physics.html": "/freedom/indeterminism.html",
    "/solutions/scientists/indeterminism_and_free_will.html": "/freedom/indeterminism.html",
    "/scientists/indeterminism_and_free_will.html": "/freedom/indeterminism.html",
    "/quantum/common_cause/quantum/mystery/": "/quantum/mystery/",
    "/solutions/scientists/jorfan/": "/solutions/scientists/jordan/",
    "/freedom/problem/causa_sui.html": false,
    "/problem/causa_sui.html": false,
    "/solutions/theories/introduction/creation/": "/introduction/creation/",
    "/quantum/common_cause_constant/freedom/determinism.html": "/freedom/determinism.html",
    "/quantum/common_cause_constant/problems/arrow_of_time/": "/problems/arrow_of_time/",
    "/quantum/common_cause_constant/problems/reversibility/": "/problems/reversibility/",
    "/quantum/common_cause_constant/freedom/illusionism.html": "/freedom/illusionism.html",
    "/solutions/philosophers/sellarsrw/freedom/chance.html": "/freedom/chance.html",
    "/mind/panpsychism/problems/consciousness/": "/problems/consciousness/",
    "/solutions/dogmas/solutions/dogmas/logic.html": "/solutions/dogmas/logic.html",
    "/solutions/philosophers/epicurus/letter_to%20menoeceus.html": "/solutions/philosophers/epicurus/letter_to_menoeceus.html",
    "/presentations/Milan/mental_causation/knowledge/downward_causation.html": "/knowledge/downward_causation.html",
    "/institute/institute/plans/": "/institute/plans/",
    "/presentations/Biosemiotics/freedom/pre-determinism.html": "/freedom/pre-determinism.html",
    "/presentations/Biosemiotics/knowledge/downward_causation.html": "/knowledge/downward_causation.html",
    "/forewords/back_story/solutions/dualisms/": "/solutions/dualisms/",
    "/Freedom/Cogito/experiments.html": "/solutions/experiments/",
    "/life/teleology/": "/life/teleonomy/",
    "/solutions/experiments/spooky/": "/entanglement/spooky/",
    "/solutions/philosophers/alston/": "/knowledge/philosophers/alston/",
    "/philosophers/alston/": "/knowledge/philosophers/alston/",
    "/value/good.html": "/value/good/",
    "/solutions/philosophers/teilhard/": "/solutions/scientists/teilhard/",
    "/knowledge/vitalism.html": "/life/vitalism/",
    "/quantum/entanglement/": "/entanglement/",
    "/problems/consciousness.html": "/mind/consciousness/",
    "/problems/irreversibility/": "/problems/reversibility/",
    "/introduction/physics/ergodic_hypothesis/": "/solutions/experiments/ergodic_hypothesis/",
    "/introduction/physics/ergodic_hypothesis": "/solutions/experiments/ergodic_hypothesis/",
    "/problems/heisenberg_cut/": "/introduction/physics/heisenberg_cut.html",
    "/problems/heisenberg_cut": "/introduction/physics/heisenberg_cut.html",
    "/problems/arrow_of_time/growth_of_order/": "/solutions/scientists/layzer/growth_of_order/",
    "/problems/arrow_of_time/growth_of_order": "/solutions/scientists/layzer/growth_of_order/",
    "/solutions/philosophers/armstrong/": "/knowledge/philosophers/armstrong/",
    "/solutions/philosophers/ramsey/": "/knowledge/philosophers/ramsey/",
    "/solutions/scientists/newell/": "/solutions/philosophers/whewell/",
    "/knowledge/complexity.html": "/life/complexity/",
    "/solutions/experiments/schrodingerscat.html": "/solutions/experiments/schrodingerscat/",
    "/knowledge/determinism.html": "/quantum/determinism/",
    "/solutions/philosophers/driesch/": "/solutions/scientists/driesch/",
    "/problems/meaning/": "/life/meaning/",
    "/problems/meaning": "/life/meaning/",
    "/quantum/spooky/": "/entanglement/spooky/",
    "/freedomchance_direct_cause.html": "/freedom/chance_direct_cause.html",
    "/Reason/": "/freedom/reason.html",
    "/Reason": "/freedom/reason.html",
    "/solutions/dogmas/truth.html": "/knowledge/truth/",
    "/problems/dualisms/": "/solutions/dualisms/",
    "/solutions/philosophers/poincare/": "/solutions/scientists/poincare/",
    "/solutions/scientists/broglie/": "/solutions/scientists/de_broglie/",
    "/freedom.up_to_us.html": "/freedom/up_to_us.html",
    "/freedom/freedom/": "/freedom/",
    "/freedom/indetermacy.html": "/freedom/indeterminacy.html",
    "/freedom/choice.html": "/quantum/choice/",
    "/solutions/philosophers/eddington/": "/solutions/scientists/eddington/",
    "/solutions/philosophers/chryssipus/": "/solutions/philosophers/chrysippus/",
    "/determinism.html": "/freedom/determinism.html",
    "/pre-determinism.html": "/freedom/pre-determinism.html",
    "/possibilities.html": "/freedom/possibilities.html",
    "/indeterminism.html": "/freedom/indeterminism.html",
    "/adequate_determinism.html": "/freedom/adequate_determinism.html",
    "/solutions/scientists/stebbing/": "/solutions/philosophers/stebbing/",
    "/freedom/natural_selection_and_the_emergence_of_mind.html": "/solutions/philosophers/popper/natural_selection_and_the_emergence_of_mind.html",
    "/freedom_of_action.html": "/freedom/freedom_of_action.html",
    "/life/purpose/": "/mind/purpose/",
    "/value/origin/freedom/": "/freedom/",
    "/knowledge/cause.html": "/quantum/common_cause/",
    "/knowledge/other_minds.html": "/problems/other_minds/",
    "/mind/goal/": "/life/goal/",
    "/knowledge/entelechy.html": "/life/entelechy/",
    "/freedom/supervenience.html": "/knowledge/supervenience.html",
    "/knowledge/complexity/solutions/scientists/kaufmann/": "/solutions/philosophers/kaufmann/",
    "/freedom/history/natural_selection_and_the_emergence_of_mind.html": "/solutions/philosophers/popper/natural_selection_and_the_emergence_of_mind.html",
    "/solutions/philosophers/barthes/": "/solutions/scientists/bateson/",
    "/knowledge/metaphysics.html": "/problems/metaphysics/",
    "/solutions/philosophers/saussure/": "/solutions/scientists/saussure/",
    "/solutions/scientists/frege/": "/solutions/philosophers/frege/",
    "/life/agency/life/": "/life/",
    "/life/biosemiotics/jakobson.html": "/solutions/scientists/jakobson/",
    "/life/biosemiotics/shannon.html": "/solutions/scientists/shannon/",
    "/life/teleology.html": "/life/teleonomy/",
    "/life/complexity/life/": "/life/",
    "/solutions/scientists/schweitzer/": "/solutions/philosophers/schweitzer/",
    "/value/value/": "/value/",
    "/mind/computer/": "/quantum/computer/",
    "/mind/self/": "/freedom/self-determination.html",
    "/solutions/scientists/atmanspacher/": "/solutions/philosophers/atmanspacher/",
    "/solutions/philosophers/bateson/": "/solutions/scientists/bateson/",
    "/knowledge/representation/to%20%3Ca%20href=": "/knowledge/representation/",
    "/freedom/probabilities.html": "/freedom/probability.html",
    "/solutions/experiments/wave-particle_duality.html": "/introduction/physics/wave-particle_duality.html",
    "/indeterminacy.html": "/freedom/indeterminacy.html",
    "/quantum/measurement/": "/problems/measurement/",
    "/quantum/determinism/soft_causality.html": "/freedom/soft_causality.html",
    "/introduction/physics/interpretations/interpretations/": "/introduction/physics/interpretations/",
    "/introduction/physics/interpretations/'%3Einterpretations%3C/a%3E%20of%20quantum%20mechanics.%20%3Cp/%3ESo%20what%20were%20their%20complaints%20and%20how%20does%20Einstein's%20idea%20of%20an": false,
    "/chance_direct_cause.html": "/freedom/chance_direct_cause.html",
    "/introduction/physics/interpretations.html": "/quantum/interpretations/",
    "/quantum/copenhagen/wave-particle_duality.html": "/introduction/physics/wave-particle_duality.html",
    "/quantum/copenhagen/schrodingerscat/": "/solutions/experiments/schrodingerscat/",
    "/quantum/copenhagen/schrodingerscat": "/solutions/experiments/schrodingerscat/",
    "/solutions/scientists/omnes/": "/solutions/scientists/gomes/",
    "/quantum/physics/ergodic_hypothesis/": "/solutions/experiments/ergodic_hypothesis/",
    "/quantum/physics/ergodic_hypothesis": "/solutions/experiments/ergodic_hypothesis/",
    "/quantum/foundations/probability_and_uncertainty.htm": "/solutions/scientists/feynman/probability_and_uncertainty.html",
    "/entanglement/knowledge/": "/knowledge/",
    "/entanglement/knowledge": "/knowledge/",
    "/quantum/chance/": "/chance/",
    "/solutions/scientists/clauser/": "/solutions/scientists/clausius/",
    "/solutions/scientists/dirac/principles/": "/quantum/principles/",
    "/solutions/scientists/bell/theorem/": "/quantum/bell_theorem/",
    "/problems/nonlocality.html": "/freedom/nonlocality.html",
    "/scandals/information/": "/knowledge/information.html",
    "/books/metaphysics/": "/problems/metaphysics/",
    "/knowledge/panpsychism.html": "/mind/panpsychism/",
    "/freedom/compatibilists.html": "/freedom/compatibilism.html",
    "/knowledge/philosophers/": "/solutions/philosophers/",
    "/solutions/philosophers/laplace/": "/solutions/scientists/laplace/",
    "/solutions/philosophers/wegner/": "/solutions/scientists/wegner/",
    "/solutions/philosophers/james/dilemma_of_determinism.html": "/solutions/philosophers/james/the_dilemma_of_determinism.html",
    "/freedom/libertarian.html": "/freedom/libertarianism.html",
    "/solutions/philosophers/spencer/": "/solutions/scientists/spencer/",
    "/solutions.scientists/newton/": "/solutions/scientists/newton/",
    "/freedom/possible_worlds.html": "/knowledge/possible_worlds.html",
    "/freedom/hard_illusionism.html": "/freedom/illusionism.html",
    "/freedom/responsibilities.html": "/freedom/responsibility.html",
    "/freedom/torn-decison.html": "/freedom/torn_decision.html",
    "/knowledge/metaphysics/": "/problems/metaphysics/",
    "/freedom/pre-determined.html": "/freedom/pre-determinism.html",
    "/freedom/event-causality.html": "/freedom/agent-causality.html",
    "/freedom/contingent.html": "/freedom/contingency.html",
    "/solutions/philosophers/eccles/": "/solutions/scientists/eccles/",
    "/freedom/reductionism.html": "/life/reductionism/",
    "/freedom/compatibism.html": "/freedom/compatibilism.html",
    "/frankfurt_cases.html": "/freedom/frankfurt_cases.html",
    "/knowledge/intension_and_extension.html": "/knowledge/intension_extension.html",
    "/knowledge/positivism.html": "/freedom/possibilism.html",
    "/freedom/possibility.html": "/freedom/possibilities.html",
    "/freedom/pre-chance_direct_cause.html": "/freedom/chance_direct_cause.html",
    "/freedom.soft_causality.html": "/freedom/soft_causality.html",
    "/value/sum/": "/knowledge/sum/",
    "/solutions/philosophers/ryle/solutions/dualism.html": "/solutions/dualisms/",
    "/freedom.superdeterminism.html": "/freedom/superdeterminism.html",
    "/freedom.causality.html": "/freedom/causality.html",
    "/solutions/philosophers/hare/broad.html": "/solutions/philosophers/broad/",
    "/solutions/scientists/hobbes/": "/solutions/philosophers/hobbes/",
    "/solutions/scientists/hume/": "/solutions/philosophers/hume/",
    "/mind/consciousnessconsciousness/": "/mind/consciousness/",
    "/solutions/philosophy/kant/": "/solutions/philosophers/kant/",
    "/solutions/philosophers/bacon/": "/solutions/scientists/deacon/",
    "/solutions/scientists/hubel/": "/solutions/scientists/schmidhuber/",
    "/solutions/scientists/hubel": "/solutions/scientists/schmidhuber/",
    "/quantum/nonseparability/": "/problems/nonseparability/",
    "/quantum/nonlocality/": "/freedom/nonlocality.html",
    "/solutions/scientists/Gregersen/": "/solutions/philosophers/gregersen/",
    "/solutions/scientists/Kaufmann/": "/solutions/philosophers/kaufmann/",
    "/freedom/materialism.html": "/knowledge/materialism.html",
    "/life/evo-devo/": "/presentations/Evo_Devo_Davies/",
    "/solutions/scientists/cartwright/": "/solutions/philosophers/cartwright/",
    "/knowledge/purpose/": "/mind/purpose/",
    "/solutions/scientists/lehner/": "/solutions/philosophers/lehner/",
    "/solutions/scientists/gregersen/": "/solutions/philosophers/gregersen/",
    "/freedom/actuality.html": "/freedom/actualism.html",
    "/freedom/problem.html": "/value/problem/",
    "/solutions/scientists/chalmers/": "/solutions/philosophers/chalmers/",
    "/solutions/scientists/popper/": "/solutions/philosophers/popper/",
    "/quantum/irreversibility/": "/problems/reversibility/",
    "/lecture5.html": "/lectures/",
    "/lecture6.html": "/solutions/scientists/feynman/lecture6.html",
    "/solutions/scientists/gazzinaga/": "/solutions/scientists/gazzaniga/",
    "/solutions/scientists/gazzinaga": "/solutions/scientists/gazzaniga/",
    "/solutions/scientists/gatlin/definition_of_life.html": "/introduction/biology/definition_of_life.html",
    "/entanglement/nonocality/": "/freedom/nonlocality.html",
    "/entanglement/nonlocality/": "/freedom/nonlocality.html",
    "/solutions/scientists/kramers/": "/solutions/philosophers/kames/",
    "/solutions/experiments/EPR/EPR/": "/solutions/experiments/EPR/",
    "/solutions/scientists/hoyle/": "/quantum/black_holes/",
    "/solutions/scientists/leibniz/": "/solutions/philosophers/leibniz/",
    "/solutions/scientists/leibniz": "/solutions/philosophers/leibniz/",
    "/solutions.scientists/de_moivre/": "/solutions/scientists/de_moivre/",
    "/solutions/philosophers/quetelet/": "/solutions/scientists/quetelet/",
    "/solutions/philosophers/buckle/": "/solutions/scientists/buckle/",
    "/solutions/scientists/richards/": "/solutions/philosophers/prichard/",
    "/solutions.scientists/gauss/": "/solutions/scientists/gauss/",
    "/solutions/scientists/pattee/freedom/": "/freedom/",
    "/freedom/illusion.html": "/freedom/illusionism.html",
    "/solutions/reversibility/": "/problems/reversibility/",
    "/solutions/scientists/reif/scientists/wolfram/": "/solutions/scientists/wolfram/",
    "/solutions/scientists/weizsacker/": "/solutions/philosophers/weizsacker/",
    "/solutions/scientists/stone/": "/solutions/scientists/stonier/",
    "/introduction/creation.html": "/scandals/creation/",
    "/solutions/experiments/maxwell/": "/solutions/scientists/maxwell/",
    "/solutions/philosophers/mccarthy/": "/solutions/scientists/mccarthy/",
    "/introduction/information/origin/": "/value/origin/",
    "/about/the_dilemma_of_determinism.html": "/solutions/philosophers/james/the_dilemma_of_determinism.html",
    "/SMPTE/": false,
    "/solutions/philosophers/gazzaniga/": "/solutions/scientists/gazzaniga/",
    "/afterwords/glossary/freedom/moral_responsibility.html": "/freedom/moral_responsibility.html",
    "/freedom.de-liberation.html": "/freedom/de-liberation.html",
    "/afterwords/glossary/Naturalism/": "/freedom/naturalism.html",
    "/afterwords/glossary/Naturalism": "/freedom/naturalism.html",
    "/afterwords/glossary/freedom/otherwise.html": "/freedom/otherwise.html",
    "/information/creation/": "/scandals/creation/",
    "/presentations/CSC25/": "/presentations/CSC25_Talk/",
    "/solutions/determinisms/temporal/": "/freedom/temporal_sequence.html",
    "/Philosophers/Plato.html": "/solutions/philosophers/plato/",
    "/Language/etymology.html": "/problems/epistemology/",
    "/Language/semiotics.html": "/life/biosemiotics/",
    "/Language/ambiguity.html": "/freedom/disambiguation.html",
    "/solutions/demons/schrodingerscat/": "/solutions/experiments/schrodingerscat/",
    "/solutions/demons/schrodingerscat": "/solutions/experiments/schrodingerscat/",
    "/Reason/rationalism.html": "/knowledge/foundationalism.html",
    "/Reason/cause.html": "/quantum/common_cause/",
    "/Language/glossary.html": "/afterwords/glossary/",
    "/Reason/enlightenment.html": "/freedom/enlightenment.html",
    "/Reason/modern.html": "/articles/postmodernism.html",
    "/Reason/irrational.html": "/freedom/rational_fallacy.html",
    "/problems/truth/": "/knowledge/truth/",
    "/freedom/adequately_determined.html": "/freedom/adequate_determinism.html",
    "/freedom_adequate_determinism.html": "/freedom/adequate_determinism.html",
    "/solutions/scientists/valera/": "/solutions/scientists/varela/",
    "/solutions/scientists/dempsey/": "/solutions/philosophers/dempsey/",
    "/problems/soft_causality.html": "/freedom/soft_causality.html",
    "/mind/agent/": "/freedom/agent-causality.html",
    "/problems/entanglement/knowledge/": "/knowledge/",
    "/problems/entanglement/knowledge": "/knowledge/",
    "/introduction/physics/interpretation/ergodic_hypothesis/": "/solutions/experiments/ergodic_hypothesis/",
    "/introduction/physics/interpretation/ergodic_hypothesis": "/solutions/experiments/ergodic_hypothesis/",
    "/articles/illusion_of_determinism.html": "/freedom/illusion_of_determinism.html",
    "/introduction/physics/schrodingerscat/": "/solutions/experiments/schrodingerscat/",
    "/introduction/physics/schrodingerscat": "/solutions/experiments/schrodingerscat/",
    "/knowledge/deduction.html": "/life/reductionism/",
    "/freedom/knowledge/complexity.html": "/life/complexity/",
    "/solutions/scientists/layzer/growth_of_order/growth_of_order/": "/solutions/scientists/layzer/growth_of_order/",
    "/solutions/scientists/layzer/growth_of_order/growth_of_order": "/solutions/scientists/layzer/growth_of_order/",
    "/knowledge/irreversibility.html": "/problems/reversibility/",
    "/freedom/do_otherwise.html": "/freedom/otherwise.html",
    "/determinination_fallacy.html": "/freedom/determination_fallacy.html",
    "/freedom/neuroscience.html": "/mind/neuroscience/",
    "/solutions/philosophers/heisenbergm/": "/solutions/scientists/heisenbergm/",
    "/solutions/philosophers/boltzmann/": "/solutions/scientists/boltzmann/",
    "/scientist/boltzmann/": "/solutions/scientists/boltzmann/",
    "/freedom/de-liberate.html": "/freedom/de-liberation.html",
    "/freedom/hard_compatibilism.html": "/freedom/hard_incompatibilism.html",
    "/solutions/demons/maxwell/": "/solutions/scientists/maxwell/",
    "/freedom/actual.html": "/freedom/actualism.html",
    "/mind/representation/to%20%3Ca%20href=": "/mind/representation/",
    "/problems/separability/": "/freedom/separability.html",
    "/solutions/theories/hidden_variables/Hidden_Variables_I/": "/quantum/hidden_variables/",
    "/solutions/theories/hidden_variables/Hidden_Variables_I": "/quantum/hidden_variables/",
    "/solutions/theories/hidden_variables/Hidden_Variables_II/": "/quantum/hidden_variables/",
    "/solutions/theories/hidden_variables/Hidden_Variables_II": "/quantum/hidden_variables/",
    "/solutions.scientists/laplace/": "/solutions/scientists/laplace/",
    "/presentations/Milan/papers/schrodingerscat/": "/solutions/experiments/schrodingerscat/",
    "/presentations/Milan/papers/schrodingerscat": "/solutions/experiments/schrodingerscat/",
    "/Determinisms/": "/solutions/determinisms/",
    "/presentations/Free__Will/free_will.html": "/freedom/free_will.html",
    "/glossary/freedom/moral_responsibility.html": "/freedom/moral_responsibility.html",
    "/glossary/freedom/otherwise.html": "/freedom/otherwise.html",
    "/solutions/scientists/bell/theorem./": "/quantum/bell_theorem/",
    "/solutions/scientists/bell/theorem.": "/quantum/bell_theorem/",
    "/modest_libertarianism.html": "/freedom/modest_libertarianism.html",
    "/biosemiotics/": "/life/biosemiotics/",
    "/value/Value/": "/value/",
    "/Freedom/Cogito/agenda.html": false,
    "/Freedom/Cogito/micromind.html": false,
    "/Freedom/Cogito/macromind.html": false,
    "/life/infobiology/": false,
    "/mind/binding/": false,
    "/solutions/scientists/ruse/": false,
    "/solutions/scientists/ruse": false,
    "/solutions/scientists/weber/Bruce%20Weber/": false,
    "/solutions/scientists/weber/Bruce%20Weber%3C/a%3E%3Cbr%3E%20%20%20%20%3Ca%20href=": false,
    "/solutions/scientists/hubble/": false,
    "/freedom/liberty_of_indifference.html": false,
    "/introduction/biology/gatlinburg.html": false,
    "/solutions/thermodynamics/": false,
    "/freedom/pre-destination.html": false,
    "/solutions/philosophers/doyle/": false,
    "/solutions/scientists/gamow/": false,
    "/solutions/scientists/gamow": false,
    "/solutions/scientists/morowitz/": false,
    "/solutions/experiments/cloud_chamber/": false,
    "/solutions/scientists/bub/": false,
    "/wiki/International_Standard_Book_Number/": false,
    "/wiki/International_Standard_Book_Number": false,
    "/wiki/Special/": false,
    "/wiki/Special:BookSources/0-907845-47-9": false,
    "/problems/mental_causation/knowledge/functionalism.html": false,
    "/http/": false,
    "/http://metaphysicist.com/": false,
    "/freedom/rationality.html": false,
    "/solutions/scientists/godel/": false,
    "/solutions/philosophers/the_decline_of_determinism.html": false,
    "/freedom/foreknowledge.html": false,
    "/solutions/philosophers/okeefe/": false,
    "/freedom/adequate_possibilities.html": false,
    "/knowledge/complexity/solutions/scientists/morowitz/": false,
    "/knowledge/invention.html": false,
    "/knowledge/discovery.html": false,
    "/knowledge/knowledge/functionalism.html": false,
    "/solutions/scientists/donald/": false,
    "/life/emergence/knowledge/functionalism.html": false,
    "/value/%3Evalue%3C/a%3E,%20for%20example,%20there%20is%20%3Ca%20href=": false,
    "/solutions/scientists/neisser/": false,
    "/mind/soul/": false,
    "/solutions/scientists//Henry_Thomas_Buckle/": false,
    "/solutions/scientists//Henry_Thomas_Buckle": false,
    "/solutions/scientists/schwarzschild/": false,
    "/knowledge/representation/to%20/": false,
    "/solutions/experiments/dirac_three-polarizers/": false,
    "/solutions/scientists/born/Max%20Born/": false,
    "/solutions/scientists/born/%E2%80%9C%3EMax%20Born%3C/a%3E,%20%3Ca%20href=": false,
    "/solutions/scientists/bohr/Niels%20Bohr/": false,
    "/solutions/scientists/bohr/%E2%80%9C%3ENiels%20Bohr%3C/a%3E,%20%3Ca%20href=": false,
    "/solutions/scientists/dirac/P.A.M.%20Dirac/": false,
    "/solutions/scientists/dirac/%E2%80%9C%3EP.A.M.%20Dirac%3C/a%3E,%20%3Ca%20href=": false,
    "/solutions/scientists/pauli/Wolfgang%20Pauii/": false,
    "/solutions/scientists/pauli/%E2%80%9C%3EWolfgang%20Pauii%3C/a%3E,%20%3Ca%20href=": false,
    "/solutions/scientists/heisenberg/Werner%20Heisenberg/": false,
    "/solutions/scientists/heisenberg/%E2%80%9C%3EWerner%20Heisenberg%3C/a%3E,%20%3Ca%20href=": false,
    "/freedom/pre-ordination.html": false,
    "/solutions/scientists/griffiths/": false,
    "/solutions/experiments/two-slit_experiment_cat/": false,
    "/articles/http/": false,
    "/articles/http://www.informationphilosopher.com/articles/ideal_classical_quantum_gas//": false,
    "/solutions/scientists/einstein/Albert%20Einstein/": false,
    "/solutions/scientists/einstein/%E2%80%9C%3EAlbert%20Einstein%3C/a%3E.%20%3Ca%20href=": false,
    "/solutions/scientists/schrodinger/Erwin%20Schr%C3%B6dinger/": false,
    "/solutions/scientists/schrodinger/%E2%80%9C%3EErwin%20Schr%C3%B6dinger%3C/a%3E,%20%3Ca%20href=": false,
    "/quantum/computing/": false,
    "/solutions/philosophers/socrates/": false,
    "/solutions/philosophers/strauss/": false,
    "/solutions/philosophers/kojeve/": false,
    "/solutions/philosophers/atmanspacher/plato.stanford.edu/entries/qt-consciousness/": false,
    "/solutions/philosophers/anscombe/causality_and_determination.html": false,
    "/knowledge/coherentism.html": false,
    "/solutions/philosophers/noonan/": false,
    "/solutions/philosophers/dewey/": false,
    "/freedom/strongest_motive.html": false,
    "/solutions/philosophers/bramhall/": false,
    "/freedom/agent_causation.html": false,
    "/freedom/chance_cause.html": false,
    "/freedom/xxx.html": false,
    "/freedom/chance_direct_action.html": false,
    "/href=/": false,
    "/href=": false,
    "/solutions/philosophers/epicurus/principle_doctrines.html": false,
    "/solutions/philosophers/vaninwagen/quam_dilecta.html": false,
    "/solutions/philosophers/rawls/": false,
    "/freedom/free_action.html": false,
    "/freedom/consequence_argument.html": false,
    "/freedom/same_conditions.html": false,
    "/solutions/philosophers/hare/lm.html": false,
    "/solutions/philosophers/hare/rawls2.html": false,
    "/solutions/philosophers/hare/oxford.html": false,
    "/solutions/philosophers/hare/rawls1.html": false,
    "/solutions/philosophers/hare/1977c.html": false,
    "/solutions/philosophers/hare/gewirth.html": false,
    "/solutions/philosophers/sidgwick/freedom/standard_objection.html": false,
    "/freedom/reactive_attitudes.html": false,
    "/solutions/scientists/bricmont/+https/": false,
    "/solutions/scientists/zeilinger/": false,
    "/solutions/scientists/Dembski/": false,
    "/solutions/scientists/Moskowitz/": false,
    "/solutions/scientists/Peacocke/": false,
    "/life/universal_evolution/": false,
    "/life/universal_evolution": false,
    "/solutions/scientists/suppes/": false,
    "/knowledge/complex_systems/": false,
    "/solutions/scientists/galison/": false,
    "/solutions/scientists/scarani/": false,
    "/solutions/scientists/davies/knowledge/complex_systems/": false,
    "/solutions/scientists/jeans/": false,
    "/solutions/scientists/fraunhofer/": false,
    "/solutions/scientists/edelman/mind/": false,
    "/solutions/scientists/edelman/mind": false,
    "/solutions/scientists/mead/": false,
    "/solutions/scientists/galton/": false,
    "/solutions/scientists/kirchhoff/": false,
    "/solutions/scientists/hartley/Transmission_of_Information.pdfThe%20Transmission%20of%20Information/": false,
    "/solutions/scientists/hartley/Transmission_of_Information.pdf'%3EThe%20Transmission%20of%20Information%3C/a%3E.%20In%20it%20he%20postulates%20a%20law%20that": false,
    "/solutions/scientists/lashley/mind/memory/": false,
    "/solutions/scientists/lashley/mind/learning/": false,
    "/freedom/event_causation.html": false,
    "/freedom/events_have_many_causes.html": false,
    "/presentations/semiotics/": false,
    "/solutions/scientists/urey/": false,
    "/articles/collapse_of_wave_function/": false,
    "/freedom/free-will_mechanisms.html": false,
    "/mind/memory/": false,
    "/solutions/scientists/sommerfeld/": false,
    "/life/noosphere/": false,
    "/solutions/experiments/maxwells_demon/": false,
    "/solutions/scientists/wigner/conservation/": false,
    "/solutions/scientists/wigner/conservation": false,
    "/articles/collapse_of_the_wave_function/": false,
    "/freedom/logical_fallacy.html": false,
    "/freedom/agnostic.html": false,
    "/entanglement/spooky_actions/": false,
    "/entanglement/spooky_action/": false,
    "/en.wikipedia.org/wiki/Ferdinand_de_Saussure/": false,
    "/en.wikipedia.org/wiki/Ferdinand_de_Saussure": false,
    "/knowledge/logical_positivism.html": false,
    "/solutions/dogmas/necessitarianism.html": false,
    "/solutions/dogmas/necessitarianism.html/": false,
    "/solutions/theories/non-equilibrium/": false,
    "/solutions/theories/information_conservation/": false,
    "/solutions/theories/information_conservation": false,
    "/solutions/experiments/interferometry/": false,
    "/solutions/determinisms/social/": false,
    "/solutions/scientists/kelvin/": false,
    "/value/ergodic.20040802153712.html": false,
    "/life/complexity/history/": false,
    "/solutions/scientists/dyson/": false,
    "/knowledge/eliminative_materialism.html": false,
    "/knowledge/epiphenomenon.html": false,
    "/knowledge/self-organization.html": false,
    "/solutions/philosophers/marx/": false,
    "/solutions/philosophers/james/the_decline_of_determinism.html": false,
    "/solutions/scientists/einstein/AJP_1905_photon.pdf.html": false,
    "/knowledge/interactionism.html": false,
    "/knowledge/truth/html/": false,
    "/knowledge/truth/html": false,
    "/freedom/v.html": false,
    "/freedom/romanticism.html": false,
    "/freedom/conservative_libertarianism.html": false,
    "/freedom/proximate_and_remote_cause.html": false,
    "/solutions/philosophers/nichols/": false,
    "/freedom/soft_determinism.html": false,
    "/solutions/scientists/onsager/index.1.en.html": false,
    "/solutions/philosophers/james/Pessimism/": false,
    "/solutions/philosophers/james/Pessimism": false,
    "/mind/representation/to%20/": false,
    "/mind/mental_causation/knowledge/functionalism.html": false,
    "/solutions/philosophers/james/Escape/": false,
    "/solutions/philosophers/james/Escape": false,
    "/solutions/philosophers/dennett/Dennett_Cases.html": false,
    "/solutions/philosophers/james/wj-notes.html": false,
    "/search/executeSearch/": false,
    "/search/executeSearch": false,
    "/doifinder/10.1038/nrn2497/": false,
    "/doifinder/10.1038/nrn2497": false,
    "/doifinder/10.1038/nrn1931/": false,
    "/doifinder/10.1038/nrn1931": false,
    "/srep/2012/120720/srep00522/full/srep00522.html": false,
    "/srep/2012/120720/srep00522/fig_tab/srep00522_F1.html": false,
    "/srep/2012/120720/srep00522/fig_tab/srep00522_ft.html": false,
    "/srep/2012/120720/srep00522/fig_tab/srep00522_F2.html": false,
    "/doifinder/10.1038/459164a/": false,
    "/doifinder/10.1038/459164a": false,
    "/solutions/scientists/goldstein/": false,
    "/solutions/scientists/decadt/eindex_2.htm": false,
    "/solutions/scientists/durr/": false,
    "/presentations/Milan/papers/": false,
    "/presentations/Milan/papers/:/freedom/indeterminacy.html%22": false,
    "/presentations/Milan/creative_machines.html": false,
    "/solutions/philosophers/cicero/de_natura_deorum.html": false,
    "/problems/flatness/flatness%20of%20the%20universe/": false,
    "/problems/flatness/%E2%80%9C%3Eflatness%20of%20the%20universe%3C/a%3E%20%3Ca%20href=": false,
    "/mind/ERR/experience%20recorder%20and%20reproducer%20(ERR)%20model%20of%20the%20mind/": false,
    "/mind/ERR/%E2%80%9C%3Eexperience%20recorder%20and%20reproducer%20(ERR)%20model%20of%20the%20mind%3C/a%3E%20%3Ca%20href=": false,
    "/introduction/creation/cosmic%20creation%20process/": false,
    "/introduction/creation/%E2%80%9C%3Ecosmic%20creation%20process%3C/a%3E%20%3Ca%20href=": false,
    "/solutions/philosophers/erasmus/": false,
    "/solutions/philosophers/luther/": false,
    "/presentations/Biosemiotics/growth_of_info.html": false,
    "/value/%3EValue%3C/a%3E%20Information.%3Cp/%3E%3Cp/%3E%3C/li%3E%3Cli%3EI%20Encourage%20You%20All%20To%20Become%20%3Ca%20href=": false,
    "/solutions/scientists/kauffman/arxiv.html": false,
    "/presentations/Milan/mental_causation/transition_to_classicality.html": false,
    "/institute/TACO_007pdf/": false,
    "/institute/TACO_007pdf": false,
    "/knowledge/philosophers/lewis/are_we_free_to_break_the_laws.html": false,
    "/knowledge/philosophers/harman/": false,

    // these pages show all "Belief" as title without content
    "/knowledge/internalism.html": false,
    "/knowledge/a_priori.html": false,
    "/knowledge/foundationalism.html": false,
    "/knowledge/skepticism.html": false,
    "/knowledge/skepticism.html": false,
    "/knowledge/analytic_synthetic.html": false,
    "/knowledge/verification.html": false,
    "/knowledge/externalism.html": false,
    "/knowledge/reliabilism.html": false,
    "/knowledge/gettier_problem.html": false,
    "/knowledge/circularity.html": false,
    "/knowledge/belief/": "/knowledge/belief.html"
  };

  for (let [key,value] of Object.entries(URL_REWRITES)) {
    let keyDecoded = decodeURIComponent(key);
    if (key !== keyDecoded) {
      URL_REWRITES[keyDecoded] = value;
    }
  }

  // ============================================================
  // FILENAME REGISTRY
  // Single source of truth: normUrl → filename
  // Stores multiple key variants (with/without trailing slash)
  // so lookups always succeed regardless of URL form.
  // ============================================================
  const urlToFilename = new Map();

  const setFilename = (url, filename) => {
    const n = normaliseUrl(url);
    // Store with and without trailing slash for robust lookup
    urlToFilename.set(n, filename);
    urlToFilename.set(n.replace(/\/$/, ''), filename);
    urlToFilename.set(n.endsWith('/') ? n : n + '/', filename);
  };

  // Look up filename for a URL.
  // Tries multiple normalisations to handle trailing-slash variants.
  const getFilename = (url) => {
    if (!url) return null;
    // Strip fragment before lookup
    const bare = url.split('#')[0];
    const n    = normaliseUrl(bare);
    return (
      urlToFilename.get(n) ||
      urlToFilename.get(n.replace(/\/$/, '')) ||
      urlToFilename.get(n.endsWith('/') ? n : n + '/') ||
      null
    );
  };

  const downloadJson = (json) => {
    const dataStr = JSON.stringify(json, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'data.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  // ============================================================
  // PAGE REGISTRY
  // Central store for every page we know about.
  // ============================================================
  const registry = new Map(); // normUrl → entry
  const registryFixed = new Map(); // originalUrl → normUrl

  // ============================================================
  // MAIN EXECUTION
  // ============================================================
  LOG.banner();

  LOG.phase('Loading Libraries');
  try {
    await loadScript(CONFIG.libs.jszip);
    LOG.ok('JSZip loaded');
    await loadScript(CONFIG.libs.fileSaver);
    LOG.ok('FileSaver loaded');
    await loadScript(CONFIG.libs.epubGenMemory);
    LOG.ok('epub-gen-memory loaded');
    await loadScript(CONFIG.libs.dompurify);
    LOG.ok('DOMPurify loaded');
    await loadScript(CONFIG.libs.mathjax);
    LOG.ok('MathJax loaded');
  } catch(e) {
    LOG.err('Library load failed — cannot continue', e);
    return;
  }

  const presetSections = buildPresetSections();
  const sections       = await discoverSiteStructure(presetSections);

  // enhance URL_REWRITES, e.g. common broken philosopher profile url links
  sections.forEach((section) => {
    if (section.title === 'Philosophers' || section.title === 'Scientists') {
      section.pages.forEach((page) => {
        let parts = page.url.split('/');
        let base = parts[1];
        let altbase = (base === 'solutions') ? 'knowledge' : 'solutions';
        parts[1] = altbase;
        URL_REWRITES[parts.join('/')] = page.url;
        URL_REWRITES[`/` + parts.slice(2).join('/')] = page.url;
      });
    }
  });

  // Sort index sections by last name
  const sortedSections = sections.map(section => {
    if (!section.isIndex) return section;
    const overviewPage = section.pages.find(p => p.title.toLowerCase().includes('overview'));
    const namePages    = section.pages.filter(p => !p.title.toLowerCase().includes('overview'));
    const sorted       = sortByLastName(namePages);
    return { ...section, pages: overviewPage ? [overviewPage, ...sorted] : sorted };
  });

  const baseOrigin = new URL(CONFIG.baseUrl).origin;

  // ── Build crawlScope set per section ─────────────────────────
  const sectionCrawlScopes = new Map();
  sortedSections.forEach(s => {
    if (s.crawlScope) sectionCrawlScopes.set(s.title, s.crawlScope);
  });

  const getSectionForUrl = (url) => {
    try {
      const path = new URL(url).pathname;
      for (const [sectionTitle, scopes] of sectionCrawlScopes.entries()) {
        if (scopes.some(prefix => path.startsWith(prefix))) return sectionTitle;
      }
    } catch(_) {}
    return null;
  };

  const isInCrawlScope = (url) => {
    try {
      const u = new URL(url);
      if (u.origin !== baseOrigin) return false;
      // Exclude non-content paths
      const path = u.pathname;
      if (/\.(css|js|png|jpg|jpeg|gif|svg|ico|pdf|zip|xml|rss)$/i.test(path)) return false;
      return true;
    } catch(_) { return false; }
  };

  // ============================================================
  // PHASE 1 — SEED REGISTRY FROM NAV STRUCTURE
  // ============================================================
  LOG.phase('Seeding Page Registry from Navigation');

  sortedSections.forEach(section => {
    const sectionSlug = slugify(section.title);
    section.pages.forEach(page => {

      if (/^https/.test(page.url)) {
          LOG.err(`${page.url} `)
      }

      const absUrl   = CONFIG.baseUrl + page.url;
      const normUrl  = normaliseUrl(absUrl);
      const pathSlug = slugify(
        new URL(absUrl).pathname.replace(/^\/|\/$/g,'').replace(/\//g,'-')
      );
      const filename = `${sectionSlug}-${pathSlug}.xhtml`;

      setFilename(absUrl, filename);

      page.absUrl = absUrl;
      page.normUrl = normUrl;
      page.filename = filename;

      if (!registry.has(normUrl)) {
        registry.set(normUrl, {
          url: absUrl, normUrl, filename,
          sectionTitle:  section.title,
          parentUrl:     null,
          depth:         0,
          isSection:     true,
          title:         page.title,
          status:        'queued',
          extracted:     null,
          outboundLinks: [],
        });
      }
    });
  });

  LOG.ok(`Registry seeded — ${registry.size} articles queued`);

  // ============================================================
  // PHASE 2 — UNIFIED FETCH QUEUE
  // ============================================================
  LOG.phase('Fetching Pages');
  LOG.info(`Batch size: ${CONFIG.fetchBatchSize} · Timeout: ${CONFIG.fetchTimeout / 1000}s · Max pages: ${CONFIG.maxTotalPages}`);

  let queuePointer = 0;
  let fetchQueue = [...registry.values()];

  let fetched = 0, skipped404 = 0, skippedErr = 0;
  LOG.startProgress();
  LOG.resetFetchTick();

  const getPathname = (url) => {
    return new URL(url).pathname;
  }

  const processBatch = async (batch) => {
    await Promise.allSettled(batch.map(async (entry) => {
      if (entry.status !== 'queued') return;
      entry.status = 'fetching';

      /*if (!new RegExp(`/quantum/$`).test(entry.url)) {
        return;
      }*/

      let originalUrl = entry.normUrl;
      let originalUrlRaw = entry.url;
      let originalStatus = 0;

      try {

        const precheck = (normUrl, url) => {
          const precheckPath = getPathname(normUrl);
          const precheckPathOrig = getPathname(url);

          if (typeof URL_REWRITES[precheckPath] !== 'undefined' || typeof URL_REWRITES[precheckPathOrig] !== 'undefined') {
            let rewriteKey = (typeof URL_REWRITES[precheckPath] !== 'undefined') ? precheckPath : precheckPathOrig;
            let rewritePath = URL_REWRITES[rewriteKey];
            if (!rewritePath) {
              entry.status = 'skipped';
              skipped404++;
              return false;
            } else {
              let rewriteUrl = new URL(normUrl);
              rewriteUrl.pathname = rewritePath;
              const origUrl = entry.url;

              registryFixed.set(entry.url, rewriteUrl.href);
              registryFixed.set(entry.normUrl, rewriteUrl.href);
              entry.url = rewriteUrl.href;
              entry.normUrl = normaliseUrl(rewriteUrl.href);
              entry.url_rewrite = {
                url: origUrl,
                normUrl: normUrl,
                new_key: rewriteKey,
                new_path: rewritePath
              };

              // Re-register filename under new URL
              setFilename(rewriteUrl.href, entry.filename);
            }
          }

          return true;
        }

        // url rewrites
        if (!precheck(entry.normUrl, entry.url)) {
          entry.status = 'skipped';
          skipped404++;
          return false; // url removed via url rewrites
        }

        let res = await fetchWithTimeout(entry.normUrl);
        originalStatus = res.status

        if (res.status === 404 || res.status === 301) {

          // fix urls
          let fixedUrl;
          let urlObj = new URL(entry.normUrl);
          const pathSegments = urlObj.pathname
            .split('/')
            .filter(segment => segment.length > 0); // Remove empty strings

          const isPhiSciProfileSectionSlug = (slug) => {
            return slug === 'philosophers' || slug === 'scientists'
          }

          if (
            isPhiSciProfileSectionSlug(pathSegments[0]) || 
            (isPhiSciProfileSectionSlug(pathSegments[1]) && pathSegments[0] !== 'solutions')
          ) {
            if (isPhiSciProfileSectionSlug(pathSegments[0])) {
              // add solutions base
              pathSegments.unshift('solutions');
            } else {
              // replace primary dir with solutions base
              pathSegments[0] = 'solutions';
            }

            const fixedPath = '/' + pathSegments.join('/') + '/';
            urlObj.pathname = fixedPath;
            fixedUrl = urlObj.toString();
            
            res = await fetchWithTimeout(fixedUrl);
            if (res.status !== 404) {
              registryFixed.set(entry.url, fixedUrl);
              entry.url = fixedUrl;
            }
          }

          if (res.status === 404 || res.status === 301) {

            // 3 or more subdirectories, potential relative link within article
            if (pathSegments.length >= 3) {

              let candidates = [];
              let urlObj = new URL(entry.url);

              let has_trailingslash = /\/$/.test(urlObj.pathname) ? '/' : '';

              if (pathSegments.length >= 4) {
                // keep last 3 segments
                urlObj.pathname = '/' + pathSegments.slice(-3).join('/') + has_trailingslash;
                candidates.push(urlObj.toString());
              }

              // keep last 2 segments
              urlObj.pathname = '/' + pathSegments.slice(-2).join('/') + has_trailingslash;
              candidates.push(urlObj.toString());
              
              for (let candidate of candidates) {
                res = await fetchWithTimeout(candidate);
                if (res.status !== 404) {
                  registryFixed.set(entry.url, candidate);
                  entry.url = candidate;
                  fixedUrl = entry.url;
                  break;
                }  
              }
            }
          }

          if (fixedUrl) {
            LOG.info(`404 ${new URL(originalUrl).pathname} → found on ${new URL(fixedUrl).pathname}`);
          }

          if (res.status === 404 || res.status === 301) {
            entry.status = 404;
            skipped404++;
            LOG.fetchTick(fetched, skipped404 + skippedErr, fetchQueue.length);
            return;
          }
        }
        if (!res.ok) throw new Error(`HTTP ${res.status} ${entry.normUrl}`);

        // url rewrites
        if (!precheck(entry.normUrl, entry.url)) {
          return; // url removed via url rewrites
        }

        const html = await res.text();
        const doc  = new DOMParser().parseFromString(html, 'text/html');

        const extracted = extractFromDoc(doc, entry.url, baseOrigin);
        if (!extracted) {
          entry.status        = 404;
          skipped404++;
          LOG.fetchTick(fetched, skipped404 + skippedErr, fetchQueue.length);
          return;
        }
        entry.status        = 200;
        entry.extracted     = extracted;
        entry.outboundLinks = extracted.outboundLinks;
        if (!entry.title && extracted.title) entry.title = extracted.title;
        fetched++;

        LOG.fetchTick(fetched, skipped404 + skippedErr, fetchQueue.length);

        // ── Enqueue newly discovered in-scope sub-pages ───────
        extracted.outboundLinks.forEach(linkUrl => {
          if (!isInCrawlScope(linkUrl)) return;

          if (window.debugIPhi && fetchQueue.length > window.debugIPhi) {
            return;
          };

          let normLink = normaliseUrl(linkUrl);
          if (registryFixed.has(normLink)) {
            normLink = registryFixed.get(normLink);
            normLink = normaliseUrl(normLink);
          }

          let normPath = new URL(normLink).pathname;
          if (typeof URL_REWRITES[normPath] !== 'undefined') {

              // removed by rewrite
              if (URL_REWRITES[normPath] === false) {
                return;
              }

              url = new URL(normLink);
              url.pathname = URL_REWRITES[normPath];
              
              normLink = normaliseUrl(url.href);
          }

          if (registry.has(normLink)) return;

          const resolvedSection = getSectionForUrl(linkUrl) || entry.sectionTitle;
          const sectionSlug = slugify(resolvedSection);

          const pathSlug    = slugify(
            new URL(linkUrl).pathname.replace(/^\/|\/$/g,'').replace(/\//g,'-')
          );
          const filename = `${sectionSlug}-${pathSlug}.xhtml`;
          setFilename(linkUrl, filename);

          const newEntry = {
            url:           linkUrl,
            normUrl:       normLink,
            filename,
            sectionTitle:  resolvedSection,
            parentUrl:     entry.url,
            depth:         entry.depth + 1,
            title:         null,
            status:        'queued',
            extracted:     null,
            outboundLinks: [],
          };
          registry.set(normLink, newEntry);
          fetchQueue.push(newEntry);
        });

      } catch(e) {
        delete entry.content;
        LOG.err(`${e.message} | ${JSON.stringify(entry)}`, e);
        entry.status = 'error';
        skippedErr++;
        LOG.fetchTick(fetched, skipped404 + skippedErr, fetchQueue.length);
      }
    }));

    // Progress bar update after each batch
    const done = fetched + skipped404 + skippedErr;
    LOG.progress(done, Math.max(fetchQueue.length, done), `${done} processed · ${fetchQueue.length} in queue`);
  };

  if (window.debugIPhi) {
    fetchQueue = fetchQueue.slice(0,window.debugIPhi);
  }

  while (queuePointer < fetchQueue.length) {
    if (registry.size >= CONFIG.maxTotalPages) {
      LOG.warn(`Page ceiling (${CONFIG.maxTotalPages}) reached — stopping crawl`);
      break;
    }
    const batch = fetchQueue.slice(queuePointer, queuePointer + CONFIG.fetchBatchSize);
    queuePointer += CONFIG.fetchBatchSize;
    await processBatch(batch);
  }

  LOG.ok(`Fetch complete — ${fetched} ok · ${skipped404} not found · ${skippedErr} errors`);

  // Per-section fetch summary
  LOG.info('');
  LOG.info('Per-section results:');
  sortedSections.forEach(section => {
    const entries = [...registry.values()].filter(e => e.sectionTitle === section.title);
    const ok_     = entries.filter(e => e.status === 200).length;
    const skip_   = entries.filter(e => e.status === 404).length;
    const err_    = entries.filter(e => e.status === 'error').length;
    LOG.sectionSummary(section.title, section.icon, ok_, skip_, err_);
  });

  // ============================================================
  // PHASE 3 — POST-FETCH INTERNAL LINK REWRITING
  //
  // This is a dedicated pass AFTER all pages are fetched and
  // all filenames are registered. It rewrites every internal
  // link in every page's extracted HTML to point to the correct
  // .xhtml filename.
  //
  // Why a separate pass?
  //   During fetching, pages are processed in parallel batches.
  //   A page fetched early may contain links to pages not yet
  //   registered. By deferring rewriting to after the full
  //   fetch queue is drained, we guarantee that all filenames
  //   are known before any link is rewritten.
  //
  // Algorithm:
  //   For each registry entry with status 200:
  //     Parse the stored HTML string.
  //     For each <a href="...">:
  //       If the href resolves to a known internal URL,
  //         replace href with the registered .xhtml filename
  //         (preserving any #fragment).
  //       Otherwise leave the href unchanged (external link).
  //     Serialise back to HTML string.
  // ============================================================
  LOG.phase('Rewriting Internal Links');

  let linksRewritten = 0;
  let linksNotFound  = 0;
  let pagesProcessed = 0;

  // Regex to detect math patterns in text
  const mathPatterns = [
    /\\(?:frac|sqrt|sum|int|partial|nabla|alpha|beta|gamma|sin|cos|tan|log|exp|left|right|cdot|times|div|pm|mp|approx|equiv|leq|geq|neq|infty|pi|theta|lambda|sigma|omega)\b/i,

    // Inline math delimiters
    /\$[^$]+\$|\\[[].*?\\[)]/,
    
    // Dirac notation (more specific)
    /\|[^|⟩]*⟩|⟨[^|⟨]*\|/,
    
    // Fractions and exponents (avoid false positives like "e_mail")
    /\b[a-z]\s*[_^]\s*\{[^}]+\}|\b[a-z]\s*[_^]\s*[0-9]/i,
    
    // Greek letters and math symbols
    /α|β|γ|δ|ε|ζ|η|θ|ι|κ|λ|μ|ν|ξ|π|ρ|σ|τ|υ|φ|χ|ψ|ω|∑|∫|∂|∇|√|∞|±|×|÷|≈|≡|≤|≥|≠/,
    
    // Common math expressions
    /(?:sin|cos|tan|log|exp|ln|det|dim|span|rank)\s*\(/i,
    
    // Matrix/vector notation
    /\[\s*[a-z0-9\s,;]+\s*\]/i,

    /[+-]\s*[\(0-9]/
  ];

  // Function to convert text to MathML
  const convertToMathML = (mathText) => {
    // Handle common HTML to LaTeX conversions

    mathText = convertHTMLtoMathText(mathText);

    let mathml;
    try {
      mathml = window.MathJax.tex2mml(mathText, { display: false });
    } catch(error) {
      throw new Error(`${JSON.stringify(mathText)} -> ${error.message}`);
    }
    // Check if the result contains an error element
    if (mathml.includes('data-mjx-error')) {
      const errorText = new DOMParser().parseFromString(mathml, 'text/html')
        .body.querySelector('mtext').innerHTML;
      throw new Error(`${JSON.stringify(mathText)} -> ${errorText}`);
    }
    
    return mathml;
  }

  const isMathContent = (text) => {
    return mathPatterns.some(pattern => pattern.test(text));
  };

  const convertMathHTMLNode = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      let tag = node.tagName.toLowerCase();
      let childText = '';
      for (let i = 0; i < node.childNodes.length; i++) {
        childText += convertMathHTMLNode(node.childNodes[i]);
      }
      if (tag === 'sup') {
        return '^{' + childText + '}';
      } else if (tag === 'sub') {
        return '_{' + childText + '}';
      } else if (tag === 'i') {
        return childText;
        //return '\\mathit{' + childText + '}';
      } else {
        // For any other element, just return the concatenated children.
        return childText;
      }
    } else {
      // For other node types (like comments) return empty string.
      return '';
    }
  }

  const convertHTMLtoMathText = (html) => {
    const body = new DOMParser().parseFromString(html, 'text/html').body;
    let result = '';
    for (let i = 0; i < body.childNodes.length; i++) {
      result += convertMathHTMLNode(body.childNodes[i]);
    }

    return normalizeMathText(result);
  }

  const normalizeMathText = (htmlText) => {
    return htmlText
      .replace(/[\u0003]/g, '') // Remove U+0003 (End of Text) characters
      .replace(/[\u00A0\u200B-\u200D\uFEFF]/g, ' ')  // Replace non-breaking spaces
      .replace(/\s+/g, ' ')                          // Collapse multiple spaces
      .replace(/[\u2018\u2019]/g, "'")               // Normalize quotes
      .replace(/[\u201C\u201D]/g, '"')               // Normalize double quotes
      .replace(/[‐‑‒–—]/g, '-')                      // Normalize hyphens
      .replace(/α/g, '\\alpha')
      .replace(/λ/g, '\\lambda')
      .replace(/ν/g, '\\nu')
      .replace(/≈/g, '\\approx')
      .replace(/←/g, '\\leftarrow')
      .replace(/→/g, '\\rightarrow')
      .replace(/↑/g, '\\uparrow')
      .trim();
  }

  // Extract equation number and spacing from HTML like "... &nbsp;&nbsp;&nbsp; (4)"
  const extractEquationNumber = (htmlText) => {
    const match = htmlText.match(/(&nbsp;|\s){2,}\s*\((\d+)\)\s*$/);
    const returnText = (str) => {
      return convertHTMLtoMathText(str);
    }
    if (match) {
      return { 
        number: match[2], 
        spacing: htmlText.match(/(&nbsp;){2,}\s*\(\d+\)\s*$/)[0],
        text: returnText(htmlText.replace(/(&nbsp;){2,}\s*\(\d+\)\s*$/, '').trim())
      };
    } else {
      if (isMathContent(htmlText)) {
        return { 
          number: null, 
          spacing: '',
          text: returnText(htmlText.trim())
        };
      }
      return null;
    }
  };

  // Extract plain text from HTML (strips tags but keeps text)
  const extractPlainText = (element) => {
    return element.innerText.trim();
  };

  const rewriteInternalLinks = (htmlString, sourcePageUrl) => {
    if (!htmlString) return htmlString;

    const parser = new DOMParser();
    const doc    = parser.parseFromString(
      `<div id="__rewrite_root__">${htmlString}</div>`,
      'text/html'
    );
    const root = doc.getElementById('__rewrite_root__');
    if (!root) return htmlString;

    root.querySelectorAll('a[href]').forEach(a => {
      // Never rewrite source-footer attribution links
      if (a.classList.contains('epub-source-url-link')) return;
      if (a.closest('.epub-source-footer'))             return;

      const href = a.getAttribute('href') || '';

      // remove empty href links
      if (!href.trim()) {
        const textNode = doc.createTextNode(a.textContent);
        a.parentNode.replaceChild(textNode, a);
        return;
      }

      // Skip pure fragments, mailto, javascript
      if (href.startsWith('#'))           return;
      if (href.startsWith('mailto:'))     return;
      if (href.startsWith('javascript:')) return;

      // Split href into URL part and fragment
      const hashIdx  = href.indexOf('#');
      const urlPart  = hashIdx >= 0 ? href.substring(0, hashIdx) : href;
      const fragment = hashIdx >= 0 ? href.substring(hashIdx) : '';

      // Only rewrite links that are internal to the site
      let absUrl;
      try {
        absUrl = new URL(urlPart, sourcePageUrl || CONFIG.baseUrl).href;
      } catch(_) {
        return;
      }

      // Check if this is an internal URL
      let absOrigin;
      try { absOrigin = new URL(absUrl).origin; } catch(_) { return; }
      if (absOrigin !== baseOrigin) return; // external — leave unchanged

      // rewrites
      let targetFilename;
      if (INTERNAL_URL_REWRITES[absUrl.pathname]) {
        targetFilename = INTERNAL_URL_REWRITES[absUrl.pathname];
      } else {
        targetFilename = getFilename(absUrl);  
      }

      // Look up the registered filename
      if (targetFilename) {
        a.setAttribute('href', targetFilename + fragment);
        linksRewritten++;
      } else {
        // Internal URL with no registered page — leave as external link
        // so the reader can open it in a browser
        linksNotFound++;
      }
    });

    // convert Tex to MathML
    rewriteMath(root, doc, sourcePageUrl);

    // remove empty blockquotes
    root.querySelectorAll('blockquote').forEach((bq) => {
      if (bq.innerHTML.trim() === '') {
        bq.remove();
      }
    });

    // remove empty teacher/scholar entries
    root.querySelectorAll('.reader_level_1,reader_level_2').forEach((rl) => {
      let content = rl.querySelector('.sectiontitle').nextElementSibling;
      if (content && content.nodeName === 'DIV') {
        content.querySelectorAll('p').forEach((p) => {
          if (p.innerHTML.trim() === '') {
            p.remove();
          }
        });
        if (content.innerHTML.trim() === '') {
          rl.remove();
        }
      } else if (!content) {
        rl.remove();
      }
    });

    // convert linksRight to aside for small ereader support
    const linksRights = root.querySelectorAll('.linksRight');
    linksRights.forEach(sidebar => {
      // Find the parent blockquote
      const blockquote = sidebar.parentElement;
      
      if (!blockquote) return;
      
      // Create a new wrapper with semantic structure
      const wrapper = document.createElement('div');
      wrapper.className = 'blockquote-with-sidebar';
      
      // Move blockquote content (excluding sidebar) into main content
      const mainContent = document.createElement('div');
      mainContent.className = 'blockquote-main';
      
      // Clone blockquote and remove sidebar from clone
      const blockquoteClone = blockquote.cloneNode(true);
      const sidebarInClone = blockquoteClone.querySelector('.linksRight');
      if (sidebarInClone) sidebarInClone.remove();
      
      mainContent.appendChild(blockquoteClone);
      
      // Restructure sidebar as figure/aside
      const aside = document.createElement('aside');
      aside.className = 'blockquote-sidebar';
      aside.innerHTML = sidebar.innerHTML;
      
      // Append in order: main content, then sidebar
      wrapper.appendChild(mainContent);
      wrapper.appendChild(aside);
      
      // Replace original blockquote with wrapper
      blockquote.replaceWith(wrapper);
      sidebar.remove();
    });

    return root.innerHTML;
  };

  const rewriteMath = (root, doc, sourcePageUrl) => {
  
    // Process math blocks in centered divs
    root.querySelectorAll('div[align="center"],blockquote[align="center"]').forEach((div) => {

      let pTags = Array.from(div.querySelectorAll('p')).filter(p => 
        p.textContent.trim() !== ''
      );

      // If no <p> tags, wrap div content in a temporary <p>
      if (pTags.length === 0) {
        const tempP = doc.createElement('p');
        tempP.innerHTML = div.innerHTML;
        Array.from(tempP.querySelectorAll('p')).filter(p => {
          if (p.textContent.trim() === '') {
            p.remove();
          }
        });
        div.innerHTML = '';
        div.appendChild(tempP);
        pTags = div.querySelectorAll('p');
      }

      // Process each <p> line in the blockquote
      pTags.forEach((pElement) => {
        const plainText = extractPlainText(pElement);
        const htmlContent = pElement.innerHTML;
        
        if (!plainText || pElement.querySelector('math')) return;

        // Check if this line contains equation number pattern
        const equationMatch = extractEquationNumber(htmlContent);
        
        if (equationMatch) {
          let mathTextReplaced;
          try {

            let mathText = equationMatch.text;
            mathTextReplaced = MATH_REWRITE_MATCH(mathText);
            if (mathTextReplaced) {
              mathText = mathTextReplaced;
            }

            let mathml = window.MathJax.tex2mml(mathText, { display: false });
            // Check if the result contains an error element
            if (mathml.includes('data-mjx-error')) {
              throw new Error(`${new DOMParser().parseFromString(mathml, 'text/html').body.querySelector('mtext').innerHTML}`);
            }

            let wordMatches = htmlContent.match(/<i>[A-Z][a-z]+<\/i>/g);
            if (wordMatches) {
              wordMatches.forEach((m) => {
                // Extract the word from the HTML tag
                const word = m.replace(/<\/?i>/g, '');
                
                // Create a regex pattern for the sequence of <mi> elements with optional whitespace/newlines
                // e.g., "Cats" -> <mi>C</mi>\s*<mi>a</mi>\s*<mi>t</mi>\s*<mi>s</mi>
                const miSequence = word.split('').map(letter => `<mi>${letter}</mi>`).join('\\s*');
                const miRegex = new RegExp(miSequence, 'g');
                
                // Create the replacement: wrap in <mtext>
                const replacement = `<mtext>${word}</mtext>`;
                
                // Replace the sequence in the mathml
                mathml = mathml.replace(miRegex, replacement);
              });
            }
            
            // Replace element content with MathML + equation number spacing
            pElement.innerHTML = mathml + equationMatch.spacing;
          } catch (error) {
            LOG.err(`Math conversion failed: ${JSON.stringify(equationMatch.text)} -> ${error.message}  | ${sourcePageUrl}`);
          }
        }
      });
    });

    // Main processing function
    root.querySelectorAll('p').forEach((pElement) => {
      let pText = pElement.innerHTML;
      let modified = false;
      
      for (let mathConfig of INLINE_MATH_REWRITES) {

        for (let mathRegex of mathConfig.match) {

          if (!mathRegex) {
            console.log(mathConfig)
          }

          // Check if primary math pattern matches
          if (mathRegex.test(pText)) {

            modified = true;
            
            // Reset regex lastIndex since we used test()
            mathRegex.lastIndex = 0;
            
            // Replace primary math matches
            pText = pText.replace(mathRegex, (match) => {
              try {
                // Convert LaTeX-like notation to proper LaTeX for MathJax
                let latexText = match;

                return convertToMathML(latexText);
              } catch (error) {
                LOG.err(`Math conversion failed: ${error.message} | ${sourcePageUrl}`);
                return match; // Return original if conversion fails
              }
            });
            
            // If extra_p is configured, replace those entries too
            if (mathConfig.extra_p) {
              for (let extraRegex of mathConfig.extra_p) {
                pText = pText.replace(extraRegex, (match) => {
                  try {
                    let latexText = match
                      .replace(/<i>(.*?)<\/i>/g, '\\mathit{$1}')
                      .replace(/<sub>(.*?)<\/sub>/g, '_{$1}');
                    
                    return convertToMathML(latexText);
                  } catch (error) {
                    LOG.err(`Extra math conversion failed: ${error.message} | ${sourcePageUrl}`);
                    return match;
                  }
                });
              }
            }
          }
        }
      }
      
      // Only update if modifications were made
      if (modified) {
        pElement.innerHTML = pText;
      }
    });

  }

  // Apply rewriting to all successfully fetched pages
  for (const entry of registry.values()) {
    if (entry.status !== 200 || !entry.extracted?.content) continue;
    entry.extracted.content = rewriteInternalLinks(
      entry.extracted.content,
      entry.url
    );

    pagesProcessed++;
  }

  // ── Build URL-path-based parent index ──────────────────────────
  // Maps normUrl → entry for all registered pages, sorted by
  // path depth descending so the deepest matching ancestor wins.

  const pathIndex = [...registry.values()]
    .filter(e => e.status === 200)
    .map(e => ({
      entry: e,
      path: new URL(e.normUrl).pathname,
      depth: new URL(e.normUrl).pathname.split('/').filter(Boolean).length,
    }))
    .sort((a, b) => b.depth - a.depth); // deepest first

  // For each non-section page, find its canonical parent
  for (const e of registry.values()) {
    if (e.isSection || e.status !== 200) continue;

    const ePath = new URL(e.normUrl).pathname;

    // 1. URL-path parent: longest ancestor path that is a prefix
    let bestParent = null;
    let bestDepth  = 0;
    for (const { entry: candidate, path: cPath, depth: cDepth } of pathIndex) {
      if (candidate.normUrl === e.normUrl) continue;
      if (ePath.startsWith(cPath) && cPath !== '/' && cDepth > bestDepth) {
        bestParent = candidate;
        bestDepth  = cDepth;
      }
    }

    if (bestParent) {
      e.canonicalParent = bestParent.normUrl;
      continue;
    }

    // 2. Link-origin parent: the page on which this URL was first discovered
    if (e.parentUrl) {
      const originEntry = registry.get(normaliseUrl(e.parentUrl));
      if (originEntry && originEntry.status === 200) {
        e.canonicalParent = originEntry.normUrl;
      }
    }
  }

  // ── Build children lists on parent entries ──────────────────────
  for (const e of registry.values()) {
    if (!e.canonicalParent) continue;
    const parent = registry.get(e.canonicalParent);
    if (!parent) continue;
    if (!parent.children) parent.children = [];
    parent.children.push(e);
  }

  // Sort children alphabetically by title
  for (const e of registry.values()) {
    if (e.children) {
      e.children.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    }
  }

  LOG.ok(
    `Link rewriting complete — ${pagesProcessed} articles processed · ` +
    `${linksRewritten} links rewritten · ${linksNotFound} internal links without registered page`
  );

  // ============================================================
  // BREADCRUMB REWRITER
  // ============================================================
  const rewriteBreadcrumbLinks = (breadcrumbText) => {
    if (!breadcrumbText) return '';

    const specialMap = {
      'home':                    '003-visual-toc.xhtml',
      'information philosopher': '001-title-page.xhtml',
      'solutions':               'introduction-solutions.xhtml',
      'problems':                'problems-problems.xhtml',
      'freedom':                 'freedom-freedom.xhtml',
      'value':                   'value-value.xhtml',
      'knowledge':               'knowledge-knowledge.xhtml',
      'life':                    'life-life.xhtml',
      'mind':                    'mind-mind.xhtml',
      'chance':                  'chance-chance.xhtml',
      'quantum':                 'quantum-quantum.xhtml',
      'entanglement':            'entanglement-entanglement.xhtml',
      'scandals':                'scandals-scandals.xhtml',
      'philosophers':            'philosophers-solutions-philosophers.xhtml',
      'scientists':              'scientists-solutions-scientists.xhtml',
      'reference':               'reference-afterwords-conclusions.xhtml',
    };

    let parts  = breadcrumbText.split(/\s*[>›»/]\s*/).map(p => p.trim()).filter(Boolean);
    const sep    = `<span class="epub-bc-sep" aria-hidden="true"> › </span>`;
    let isSciPhi;
    parts.map((part, idx) => {
      const key    = part.toLowerCase().replace(/\s+/g,' ');
      if (['philosophers', 'scientists'].includes(key)) {
        isSciPhi = true;
      }
    });
    if (isSciPhi) {
      parts = parts.filter((part) => {
        return !(part === 'solutions' || part === 'knowledge');
      });
    }

    const linked = parts.map((part, idx) => {
      if (idx === parts.length - 1)
        return `<span class="epub-bc-current">${part}</span>`;
      const key    = part.toLowerCase().replace(/\s+/g,' ');
      const target = specialMap[key];
      return target
        ? `<a href="${target}" class="epub-bc-link">${part}</a>`
        : `<span class="epub-bc-text">${part}</span>`;
    });

    return (
      `<nav class="epub-breadcrumb" aria-label="breadcrumb">` +
      `<p class="epub-breadcrumb-text">${linked.join(sep)}</p>` +
      `</nav>`
    );
  };

  // ============================================================
  // CONTENT GENERATORS
  // ============================================================
  const generateCoverPageHtml = () =>
    `<div class="epub-cover-page">` +
    `<img src="${CONFIG.coverImageUrl}" ` +
    `alt="Information Philosopher — Complete Resource" class="epub-cover-image"/>` +
    `</div>`;

  const generateTitlePageHtml = () =>
    `<div class="epub-title-page">
      <img src="${CONFIG.bannerImageUrl}" class="epub-title-banner" />
      <h1 class="epub-title-main">Information Philosopher</h1>
      <h2 class="epub-title-sub">Complete Resource</h2>
      <div class="epub-title-rule-mid"></div>
      <p class="epub-title-author">Bob Doyle</p>
      <p class="epub-title-affiliation">Associate, Harvard Astronomy Department</p>
      <div class="epub-title-rule-bot"></div>
      <p class="epub-title-url">informationphilosopher.com</p>
    </div>`;

  const generateCopyrightPageHtml = () =>
    `<div class="epub-copyright-page">
      <h2 class="epub-copyright-head">About This Edition</h2>
      <div class="epub-copyright-notice">
        <p>This is an <strong>unofficial EPUB edition</strong> of
        <a href="${CONFIG.baseUrl}">InformationPhilosopher.com</a>,
        generated for offline reading on e-readers and tablets.</p>
        <p>Generated: <strong>${new Date().toLocaleDateString('en-US',
          { year:'numeric', month:'long', day:'numeric' })}</strong></p>
      </div>
      <h3>About Information Philosophy</h3>
      <p>Information Philosophy (I-Phi) is a new philosophical method grounded in
      modern physics, biology, psychology, neuroscience, and the science of information.
      Created by <strong>Bob (Robert O.) Doyle</strong>, <a href="mailto:rodoyle@fas.harvard.edu">rodoyle@fas.harvard.edu</a>, Associate, Astronomy Department, Harvard University. More info at <a href="https://philpeople.org/profiles/bob-doyle">philpeople.org/profiles/bob-doyle</a>.</p>
      <h3>Published by 🔭 CosmicPhilosophy.org</h3>
      <p><strong>Not affiliated with <a href="${CONFIG.baseUrl}">InformationPhilosopher.com</a> or Bob Doyle.</strong> 
      This EPUB is published by <a href="https://gmodebate.github.io/cosmos">🔭 CosmicPhilosophy.org</a> for reading convenience. All philosophical
      content remains © Bob Doyle / InformationPhilosopher.com.</p>
      <h3>Navigation</h3>
      <p>Use your e-reader's <strong>Table of Contents</strong> to navigate by section.
      Internal hyperlinks connect related articles throughout the book.</p>
      <p class="epub-copyright-footer">
        <a href="${CONFIG.baseUrl}">${CONFIG.baseUrl}</a>
      </p>
    </div>`;

  const generateVisualTocPageHtml = () => {
    const thematic = sortedSections.filter(s => !s.isIndex);
    const indices  = sortedSections.filter(s => s.isIndex);

    const pill = (s) => {
      const slug = slugify(s.title);
      const href = s.isIndex ? `${slug}-index.xhtml` : `${slug}-overview.xhtml`;
      return (
        `<a href="${href}" class="epub-vtoc-pill${s.isIndex ? ' epub-vtoc-pill-index' : ''}">` +
        `${s.icon || ''} ${s.title}</a>`
      );
    };

    const sectionCard = (section) => {
      const slug = slugify(section.title);
      // Count all registry entries for this section (including crawled subpages)
      const totalCount = [...registry.values()]
        .filter(e => e.sectionTitle === section.title && e.status === 200).length;

        const links = section.pages.map(p => {
          const fn = getFilename(CONFIG.baseUrl + p.url) || `${slug}-${slugify(p.title)}.xhtml`;
          return `<a href="${fn}" class="epub-vtoc-article-link">${p.title}</a>`;
        }).join('');

      return (
        `<div class="epub-vtoc-card" id="vtoc-${slug}">` +
        `<div class="epub-vtoc-card-head">` +
        `<a href="${slug}-overview.xhtml" class="epub-vtoc-card-title">${section.icon || ''} ${section.title}</a>` +
        `<span class="epub-vtoc-card-count">${totalCount} pages</span>` +
        `</div>` +
        `<p class="epub-vtoc-card-desc">${section.description}</p>` +
        `<div class="epub-vtoc-article-grid">${links}</div>` +
        `</div>`
      );
    };

    const indexCard = (section) => {
      const slug      = slugify(section.title);
      const namePages = section.pages.filter(p => !p.title.toLowerCase().includes('overview'));
      const grouped   = groupByLetter(sortByLastName(namePages));
      const letters   = [...grouped.keys()];
      const alphaLinks = letters.map(l =>
        `<a href="${slug}-index.xhtml#${slug}-letter-${l}" class="epub-vtoc-alpha-link">${l}</a>`
      ).join('');
      return (
        `<div class="epub-vtoc-card epub-vtoc-card-index" id="vtoc-${slug}">` +
        `<div class="epub-vtoc-card-head">` +
        `<a href="${slug}-index.xhtml" class="epub-vtoc-card-title">${section.icon || ''} ${section.title}</a>` +
        `<span class="epub-vtoc-card-count">${namePages.length} entries</span>` +
        `</div>` +
        `<p class="epub-vtoc-card-desc">${section.description}</p>` +
        `<div class="epub-vtoc-alpha-row">${alphaLinks}</div>` +
        `</div>`
      );
    };

    return (
      `<div class="epub-vtoc-page">` +
      `<div class="epub-vtoc-header">` +
      `<h1 class="epub-vtoc-title">Table of Contents</h1>` +
      `<p class="epub-vtoc-subtitle">Information Philosopher — Complete Resource</p>` +
      `</div>` +
      `<p class="epub-vtoc-about-link"><a href="002-about-edition.xhtml">About this edition ›</a></p>` +
      `<nav class="epub-vtoc-nav" aria-label="Jump to section">` +
      `<div class="epub-vtoc-pills">${thematic.map(pill).join('')}</div>` +
      `<div class="epub-vtoc-pills epub-vtoc-pills-index">${indices.map(pill).join('')}</div>` +
      `</nav>` +
      `<h2 class="epub-vtoc-group-head">Thematic Sections</h2>` +
      thematic.map(sectionCard).join('\n') +
      `<h2 class="epub-vtoc-group-head">Biographical Indices</h2>` +
      indices.map(indexCard).join('\n') +
      `</div>`
    );
  };

  const generateIndexPageHtml = (section) => {
    const slug      = slugify(section.title);
    const namePages = section.pages.filter(p => !p.title.toLowerCase().includes('overview'));
    const sorted    = sortByLastName(namePages);
    const grouped   = groupByLetter(sorted);
    const letters   = [...grouped.keys()];

    const alphaBar = letters.map(l =>
      `<a href="#${slug}-letter-${l}" class="epub-alpha-btn">${l}</a>`
    ).join('');

    const letterSections = letters.map(letter => {
      const entries = grouped.get(letter);
      const cells   = entries.map(page => {
        const fn = getFilename(CONFIG.baseUrl + page.url) || `${slug}-${slugify(page.title)}.xhtml`;
        return `<a href="${fn}" class="epub-idx-name">${page.title}</a>`;
      }).join('');
      return (
        `<div class="epub-idx-letter-block" id="${slug}-letter-${letter}">` +
        `<div class="epub-idx-letter-head">${letter}</div>` +
        `<div class="epub-idx-name-grid">${cells}</div>` +
        `</div>`
      );
    }).join('\n');

    return (
      `<div class="epub-index-page">` +
      `<div class="epub-index-header">` +
      `<span class="epub-section-icon" aria-hidden="true">${section.icon || ''}</span>` +
      `<h1 class="epub-index-title">${section.title}</h1>` +
      `<p class="epub-index-desc">${section.description_extended||section.description}</p>` +
      `<p class="epub-index-count">${namePages.length} entries</p>` +
      `</div>` +
      `<div class="epub-alpha-bar" role="navigation" aria-label="Jump to letter">${alphaBar}</div>` +
      letterSections +
      `</div>`
    );
  };

  const generateSectionHeaderHtml = (section) => {
    const slug = slugify(section.title);

    // Recursive <ol> renderer
    const renderOl = (entries, depth = 0) => {
      if (!entries || !entries.length) return '';
      const items = entries.map(entry => {
        if (!entry) return '';
        const fn = entry.filename || `${slug}-missing.xhtml`;
        const childOl = entry.children && entry.children.length
          ? renderOl(entry.children.filter(c => c.status === 200), depth + 1)
          : '';
        const depthClass = depth > 0 ? ` class="epub-stoc-sub depth-${Math.min(depth, 4)}"` : '';
        return `<li${depthClass}><a href="${fn}">${entry.title || 'Untitled'}</a>${childOl}</li>`;
      }).join('\n');
      return `<ol class="epub-stoc-list depth-${depth}">${items}</ol>`;
    };

    // Resolve entries for preset pages
    const rootEntries = section.pages.map(p => {
      const absUrl = CONFIG.baseUrl + p.url;
      return registry.get(normaliseUrl(absUrl));
    }).filter(Boolean);

    return (
      `<div class="epub-section-header">` +
      `<div class="epub-section-icon" aria-hidden="true">${section.icon || ''}</div>` +
      `<h1 class="epub-section-title">${section.title}</h1>` +
      `<p class="epub-section-desc">${section.description}</p>` +
      `<nav class="epub-section-toc" aria-label="Section contents">` +
      `<h2 class="epub-stoc-heading">Contents</h2>` +
      renderOl(rootEntries) +
      `</nav>` +
      `</div>`
    );
  };

  const generate404Html = (url, title) =>
    `<div class="epub-not-found">` +
    `<h1 class="epub-not-found-head">Page Not Available</h1>` +
    `<p class="epub-not-found-title">${title || url}</p>` +
    `<p>This page was not available when this EPUB was generated.</p>` +
    `<p class="epub-not-found-url">View online: <a href="${url}">${url}</a></p>` +
    `</div>`;

  // ── Build a single article chapter from a registry entry ─────
  const buildArticleChapter = (entry) => {
    if (!entry || entry.status !== 200 || !entry.extracted) {
      return {
        title:          entry?.title || 'Page Not Available',
        content:        generate404Html(entry?.url || '', entry?.title || ''),
        filename:       entry?.filename || 'missing.xhtml',
        excludeFromToc: true,
      };
    }

    // Link rewriting already done in Phase 3 — just sanitize
    const sanitized = DOMPurify.sanitize(entry.extracted.content || '', {
      FORCE_BODY:  true,
      ADD_ATTR:    ['style','class','id'],
      FORBID_TAGS: ['iframe','script','style','form','input','button'],
    });

    const breadcrumbHtml = rewriteBreadcrumbLinks(entry.extracted.rawBreadcrumbText || '');

    return {
      title:          entry.title || entry.extracted.title || 'Untitled',
      content:
        breadcrumbHtml +
        `<h1 class="chaptertitle">${entry.title || entry.extracted.title || ''}</h1>` +
        sanitized,
      filename:       entry.filename,
      excludeFromToc: entry.depth > 0,
    };
  };

  // ============================================================
  // NATIVE TOC TEMPLATES
  //
  // FIX: Index sections (Philosophers, Scientists) previously
  // emitted entries at TWO levels:
  //   Level 1: letter heading (A, B, C…)
  //   Level 2: individual names under each letter  ← correct
  //   Level 1 AGAIN: individual names              ← BUG (duplicate)
  //
  // The fix: for index sections, subItems contains letter groups,
  // each with their own subItems (the names). The template only
  // iterates ch.subItems (letters) and sub.subItems (names).
  // Individual name pages are NOT added as top-level ch entries,
  // so they cannot appear twice.
  // ============================================================
  const customTocXHTML =
`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml"
      xmlns:epub="http://www.idpf.org/2007/ops"
      xml:lang="<%= lang %>">
<head>
  <meta charset="UTF-8"/>
  <title><%= tocTitle %></title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
<div class="epub-native-toc-wrapper">
<nav epub:type="toc" id="toc">
  <h1 class="epub-toc-heading"><%= tocTitle %></h1>
  <ol class="epub-toc-root">
    <%
    // Front matter entries (beforeToc flag)
    content.forEach(function(ch) {
      if (!ch.excludeFromToc && ch.beforeToc) {
    %>
        <li class="epub-toc-frontmatter epub-toc-show">
          <a href="<%= ch.filename %>"><%= ch.title %></a>
        </li>
    <% } }); %>
    <%
    // Main entries — sections only (not individual sub-pages)
    content.forEach(function(ch) {
      if (ch.excludeFromToc || ch.beforeToc) return;
    %>
      <li class="epub-toc-section">
        <a href="<%= ch.filename %>" class="epub-toc-section-link"><%= ch.title %></a>
        <% if (ch.subItems && ch.subItems.length) { %>
        <ol class="epub-toc-articles">
          <% ch.subItems.forEach(function(sub) { %>
          <li class="epub-toc-article">
            <a href="<%= sub.filename %>"><%= sub.title %></a>
            <%
            // Third level: only rendered if sub has its own subItems
            // (used for letter → name grouping in index sections)
            %>
            <% if (sub.subItems && sub.subItems.length) { %>
            <ol class="epub-toc-names">
              <% sub.subItems.forEach(function(subsub) { if (subsub) { %>
              <li class="epub-toc-name">
                <a href="<%= subsub.filename %>"><%= subsub.title %></a>
              </li>
              <% } }); %>
            </ol>
            <% } %>
          </li>
          <% }); %>
        </ol>
        <% } %>
      </li>
    <% }); %>
  </ol>
</nav>
</div>
</body>
</html>`;

  const customTocNCX =
`<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="<%= id %>" />
    <meta name="dtb:generator" content="epub-gen"/>
    <meta name="dtb:depth" content="3"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle><text><%= title %></text></docTitle>
  <docAuthor><text><%= author %></text></docAuthor>
  <navMap>
    <% var _i = 1; %>
    <% content.forEach(function(ch) {
      if (!ch.excludeFromToc && ch.beforeToc) { %>
      <navPoint id="np-<%= _i %>" playOrder="<%= _i++ %>">
        <navLabel><text><%= ch.title %></text></navLabel>
        <content src="<%= ch.filename %>"/>
      </navPoint>
    <% } }); %>
    <% content.forEach(function(ch) {
      if (ch.excludeFromToc || ch.beforeToc) return; %>
      <navPoint id="np-<%= _i %>" playOrder="<%= _i++ %>">
        <navLabel><text><%= ch.title %></text></navLabel>
        <content src="<%= ch.filename %>"/>
        <% if (ch.subItems && ch.subItems.length) {
          ch.subItems.forEach(function(sub) { %>
          <navPoint id="np-<%= _i %>" playOrder="<%= _i++ %>">
            <navLabel><text><%= sub.title %></text></navLabel>
            <content src="<%= sub.filename %>"/>
            <% if (sub.subItems && sub.subItems.length) {
              sub.subItems.forEach(function(subsub) { if (subsub) { %>
              <navPoint id="np-<%= _i %>" playOrder="<%= _i++ %>">
                <navLabel><text><%= subsub.title %></text></navLabel>
                <content src="<%= subsub.filename %>"/>
              </navPoint>
            <% } }); } %>
          </navPoint>
        <% }); } %>
      </navPoint>
    <% }); %>
  </navMap>
</ncx>`;

  // ============================================================
  // EPUB CSS
  // ============================================================
  const generateEpubCss = () => `
/* ═══════════════════════════════════════════════════════════
   Information Philosopher — EPUB Stylesheet
   ═══════════════════════════════════════════════════════════ */

/* Noto Sans Regular */
@font-face {
    font-family: "Noto Sans";
    font-weight: 400;
    font-style: normal;
    src: url(fonts/noto-sans-400.ttf) format('truetype');
}

/* Noto Sans Bold */
@font-face {
    font-family: "Noto Sans";
    font-weight: 700;
    font-style: normal;
    src: url(fonts/noto-sans-700.ttf) format('truetype');
}

/* Noto Sans Italic */
@font-face {
    font-family: "Noto Sans";
    font-weight: 400;
    font-style: italic;
    src: url(fonts/noto-sans-400i.ttf) format('truetype');
}

/* Noto Sans Bold Italic */
@font-face {
    font-family: "Noto Sans";
    font-weight: 700;
    font-style: italic;
    src: url(fonts/noto-sans-700i.ttf) format('truetype');
}

@font-face {
    font-family: "Noto Sans Math";
    font-weight: 400;
    font-style: normal;
    src: url(fonts/noto-sans-math.ttf);
}

* { margin:0; padding:0; box-sizing:border-box; }
body {
  font-family: "Noto Sans", sans-serif;
  font-size: 1em; line-height: 1.7; color: #000; background: #fff;
  -webkit-text-size-adjust: 100%; orphans: 3; widows: 3;
}
.epub-native-toc-wrapper { display: none !important; }

/* Cover */
.epub-cover-page { width:100%; height:100%; margin:0; padding:0; text-align:center; page-break-after:always; }
.epub-cover-image { width:100%; height:auto; max-width:100%; display:block; margin:0 auto; }

/* Typography */
h1,h2,h3,h4,h5,h6 { font-family:Arial, Helvetica, sans-serif; font-weight:bold; line-height:1.3; color:#000; margin-top:1.4em; margin-bottom:0.5em; page-break-after:avoid; }
h1 { font-size:1.5em; border-bottom:2px solid #000; padding-bottom:0.25em; margin-top:0.5em; }
h2 { font-size:1.25em; border-bottom:1px solid #555; padding-bottom:0.2em; }
h3 { font-size:1.1em; } h4 { font-size:1em; font-style:italic; }
p { margin-top:0; margin-bottom:0.8em; text-align:left; }
a { color:#000; text-decoration:underline; } a:visited { color:#000; }
em,i { font-style:italic; } strong,b { font-weight:bold; }
sup { font-size:0.75em; vertical-align:super; line-height:0; }
sub { font-size:0.75em; vertical-align:sub; line-height:0; }
blockquote { margin:1em 0 1em 1.5em; padding:0.5em 0.8em; border-left:3px solid #555; font-style:italic; color:#222; }
ul,ol { margin:0.5em 0 0.8em 1.5em; padding:0; } li { margin-bottom:0.3em; }
img { max-width:100%; height:auto; display:block; margin:1em auto; page-break-inside:avoid; }
hr { border:none; border-top:1px solid #555; margin:1.5em 10%; }
table { border-collapse:collapse; width:100%; margin:1em 0; font-size:0.9em; }
td,th { padding:0.35em 0.5em; border:1px solid #888; vertical-align:top; text-align:left; }
th { font-weight:bold; }
pre,code { font-family:"Courier New",Courier,monospace; font-size:0.85em; }
pre { border:1px solid #888; padding:0.8em; white-space:pre-wrap; word-wrap:break-word; }

/* Site classes */
.chaptertitle { font-size:1.5em; font-weight:bold; color:#000; border-bottom:2px solid #000; padding-bottom:0.25em; margin-bottom:0.3em; margin-top:0.5em; display:block; }
.sectiontitle { font-size:1.2em; font-weight:bold; color:#000; border-bottom:1px solid #555; padding-bottom:0.15em; margin-top:1.4em; margin-bottom:0.5em; display:block; }
.subsectiontitle { font-size:1.05em; font-weight:bold; color:#222; margin-top:1.2em; margin-bottom:0.4em; display:block; }
.reader_level_1,.div_1 { display:block; margin-top:1.5em; padding:0.8em; border-left:4px solid #555; }
.reader_level_2,.div_2 { display:block; margin-top:1.5em; padding:0.8em; border-left:4px solid #000; }
.reader_level_1 .sectiontitle, .reader_level_2 .sectiontitle {margin-top:0;}
.linksRight { 
  float:right; clear:right; width:40%; max-width:400px; margin:0 0 0.8em 1em; padding:0.5em 0.6em; border:1px solid #888; font-size:0.82em; font-style:italic; color:#333;
  page-break-inside: avoid;
}
.center-image { text-align:center; margin:1.2em 0; }
.glossRefs { border:1px solid #888; padding:0.7em; font-size:0.85em; margin:1em 0; }
.clearBoth { clear:both; } .display_none { display:none !important; } .bodycontent { padding:0; }

/* Named anchor spans — inert jump targets, no link styling */
span[id] { display:inline; }

/* Breadcrumb */
.epub-breadcrumb { margin-bottom:1.2em; padding:0.5em 0.7em; border:1px solid #888; border-left:4px solid #000; font-size:0.82em; page-break-inside:avoid; }
.epub-breadcrumb-text { margin:0; line-height:1.6; word-wrap:break-word; }
a.epub-bc-link { color:#000; text-decoration:underline; font-weight:bold; }
.epub-bc-sep { color:#555; padding:0 0.15em; }
.epub-bc-current { color:#333; font-style:italic; }
.epub-bc-text { color:#555; }

/* Media banners */
.epub-media-banner { display:block; margin:1.2em 0; border:1px solid #888; page-break-inside:avoid; }
.epub-media-link { display:block; padding:0.8em 1em; text-decoration:none; color:#000; }
.epub-media-thumb { max-width:100%; height:auto; display:block; margin:0 auto 0.5em; border:1px solid #888; }
.epub-media-icon { display:block; font-size:1.8em; text-align:center; margin-bottom:0.3em; }
.epub-media-label { display:block; font-weight:bold; font-size:0.9em; text-align:center; margin-bottom:0.2em; }
.epub-media-url { display:block; font-size:0.75em; color:#555; text-align:center; word-break:break-all; font-style:italic; }

/* Source footer */
.epub-source-footer { margin-top:2.5em; padding-top:0.5em; }
.epub-source-rule { border:none; border-top:1px solid #888; margin:0 0 0.5em; }
.epub-source-link { font-size:0.78em; color:#555; font-style:italic; }
a.epub-source-url-link { color:#555; text-decoration:none; }

/* Not found */
.epub-not-found { text-align:center; padding:2.5em 1.5em; border:2px dashed #888; margin:2em 1em; }
.epub-not-found-head { color:#000; border:none; }
.epub-not-found-title { font-size:1.1em; font-weight:bold; margin-bottom:0.8em; }
.epub-not-found-url { font-size:0.82em; word-break:break-all; color:#555; }

/* Title page */
.epub-title-page { text-align:center; padding:3em 2em; }
.epub-title-banner { margin:0 auto 2em; }
.epub-title-main { font-size:2em; color:#000; border:none; margin-bottom:0.2em; }
.epub-title-sub { font-size:1.2em; color:#333; border:none; font-weight:normal; font-style:italic; margin-bottom:1.5em; }
.epub-title-rule-mid,.epub-title-rule-bot { border-top:1px solid #888; margin:1.5em auto; width:40%; }
.epub-title-author { font-size:1.2em; font-weight:bold; margin-bottom:0.3em; }
.epub-title-affiliation { font-size:0.9em; color:#444; font-style:italic; margin-bottom:1.5em; }
.epub-title-url { font-size:0.9em; margin-bottom:0.3em; }
.epub-title-edition { font-size:0.82em; color:#555; }

/* Copyright page */
.epub-copyright-page { padding:1em; }
.epub-copyright-head { font-size:1.3em; margin-bottom:0.8em; }
.epub-copyright-notice { border:1px solid #888; border-left:4px solid #000; padding:0.8em 1em; margin:0.8em 0 1.5em; font-size:0.9em; }
.epub-copyright-publisher { border:1px solid #888; padding:0.8em 1em; margin:0.8em 0 1.5em; font-size:0.9em; }
.epub-copyright-publisher p { margin-bottom:0.6em; }
.epub-copyright-footer { margin-top:2em; padding-top:0.8em; border-top:1px solid #888; font-size:0.82em; color:#555; }

/* Section header */
.epub-section-header { padding:1em; }
.epub-section-icon { font-size:2.5em; text-align:center; display:block; margin-bottom:0.3em; }
.epub-section-title { text-align:center; font-size:1.6em; }
.epub-section-desc { font-style:italic; color:#333; text-align:center; margin:0.8em 1em 1.2em; font-size:0.95em; }
.epub-section-toc { border:1px solid #888; padding:0.8em 1.2em; margin:1em 0; }
.epub-section-toc h3 { font-size:1em; border:none; margin-top:0; margin-bottom:0.5em; }
.epub-section-toc ol { margin:0; padding-left:1.2em; list-style:decimal; }
.epub-section-toc li { font-size:0.9em; margin-bottom:0.3em; }
.epub-section-toc li.epub-section-toc-sub { font-size:0.82em; color:#444; padding-left:0.5em; }
.epub-section-toc a { color:#000; text-decoration:underline; }

/* ── Section TOC hierarchy ───────────────────────────── */
.epub-stoc-heading { font-size:1.1em; border-bottom:1px solid #888; margin-bottom:0.6em; }
ol.epub-stoc-list { list-style:none; margin:0; padding:0; }
ol.epub-stoc-list.depth-0 > li { border-bottom:1px dotted #ccc; padding:0.3em 0; }
ol.epub-stoc-list.depth-0 > li > a { font-weight:bold; font-size:0.95em; color:#000; text-decoration:none; }
ol.epub-stoc-list.depth-1 { margin:0.3em 0 0.2em 1em; padding-left:0.8em; border-left:2px solid #ddd; }
ol.epub-stoc-list.depth-2 { margin:0.2em 0 0.1em 1em; padding-left:0.6em; border-left:1px solid #eee; }
ol.epub-stoc-list.depth-3,
ol.epub-stoc-list.depth-4 { margin:0.1em 0 0 0.8em; padding-left:0.4em; }
li.epub-stoc-sub > a {  color:#222; text-decoration:none; display:block; padding:0.15em 0; }
li.epub-stoc-sub.depth-2 > a { }
li.epub-stoc-sub.depth-3 > a,
li.epub-stoc-sub.depth-4 > a { }

/* ── Visual TOC improvements ─────────────────────────── */
.epub-vtoc-more-link { font-size:0.85em; font-weight:bold; color:#000; text-decoration:underline; }
.epub-vtoc-card { border-radius:3px; }
.epub-vtoc-card-count { display:inline-block; background:#f0f0f0; border:1px solid #ccc;
  border-radius:2px; padding:0.05em 0.4em; font-size:0.75em; color:#444; margin-left:0.5em; }

/* ── Native TOC depth indicators ─────────────────────── */
li.epub-toc-article > a::before { content:'› '; color:#888; }
li.epub-toc-name > a::before { content:'· '; color:#aaa; }

/* Visual TOC */
.epub-vtoc-page { padding:0.5em; }
.epub-vtoc-header { text-align:center; margin-bottom:1.2em; padding-bottom:0.8em; border-bottom:2px solid #000; }
.epub-vtoc-title { font-size:1.6em; border:none; margin-bottom:0.2em; }
.epub-vtoc-subtitle { font-size:0.9em; color:#444; font-style:italic; }
.epub-vtoc-about-link { text-align:center; font-size:0.88em; margin-bottom:1.2em; }
.epub-vtoc-about-link a { color:#000; text-decoration:underline; font-style:italic; }
.epub-vtoc-nav { margin-bottom:1.5em; }
.epub-vtoc-pills { display:block; margin-bottom:0.5em; line-height:2.2; word-spacing:0.2em; }
.epub-vtoc-pill { display:inline-block; border:1px solid #000; padding:0.2em 0.6em; margin:0.15em 0.2em; font-size:0.82em; text-decoration:none; color:#000; font-weight:bold; border-radius:3px; }
.epub-vtoc-pill-index { border-style:dashed; font-weight:normal; }
.epub-vtoc-group-head { font-size:1.1em; border-bottom:1px solid #555; padding-bottom:0.2em; margin-top:1.8em; margin-bottom:0.8em; }
.epub-vtoc-card { border:1px solid #888; margin-bottom:1.2em; padding:0.7em 0.8em; page-break-inside:avoid; }
.epub-vtoc-card-index { border-style:dashed; }
.epub-vtoc-card-head { display:block; margin-bottom:0.4em; border-bottom:1px solid #ccc; padding-bottom:0.3em; }
.epub-vtoc-card-title { font-size:1.1em; font-weight:bold; text-decoration:none; color:#000; display:inline; }
.epub-vtoc-card-title:after { content:' →'; font-weight:normal; font-size:0.85em; }
.epub-vtoc-card-count { font-size:0.78em; color:#555; margin-left:0.5em; }
.epub-vtoc-card-desc { font-size:0.85em; font-style:italic; color:#333; margin-bottom:0.6em; }
.epub-vtoc-article-grid { display:block; -webkit-column-count:2; column-count:2; -webkit-column-gap:0.8em; column-gap:0.8em; }
.epub-vtoc-article-link { display:block; font-size:0.82em; color:#000; text-decoration:none; padding:0.18em 0; border-bottom:1px dotted #ccc; break-inside:avoid; -webkit-column-break-inside:avoid; line-height:1.4; }
.epub-vtoc-article-link:before { content:'› '; color:#555; }
.epub-vtoc-alpha-row { display:block; line-height:2.4; word-spacing:0.1em; margin-top:0.4em; }
.epub-vtoc-alpha-link { display:inline-block; width:1.8em; height:1.8em; line-height:1.8em; text-align:center; border:1px solid #000; font-size:0.85em; font-weight:bold; text-decoration:none; color:#000; margin:0.1em 0.1em; }

/* Images */
a.epub-img-link { display:block; text-decoration:none; border:none; }
a.epub-img-link img { border:1px solid #ccc; }
a.epub-img-link::after {
  content: '🔗 View source';
  display:block;
  font-size:0.72em;
  color:#555;
  text-align:center;
  font-style:italic;
  margin-top:0.2em;
}

/* Alphabetical index */
.epub-index-page { padding:0.5em; }
.epub-index-header { text-align:center; margin-bottom:1em; padding-bottom:0.8em; border-bottom:2px solid #000; }
.epub-index-title { font-size:1.5em; border:none; margin-bottom:0.2em; }
.epub-index-desc { font-size:0.88em; font-style:italic; color:#333; margin-bottom:0.3em; }
.epub-index-count { font-size:0.8em; color:#555; }
.epub-alpha-bar { display:block; text-align:center; line-height:2.6; word-spacing:0.05em; margin:0.8em 0 1.2em; padding:0.4em 0; border-top:1px solid #888; border-bottom:1px solid #888; }
.epub-alpha-btn { display:inline-block; width:1.9em; height:1.9em; line-height:1.9em; text-align:center; border:1px solid #000; font-size:0.9em; font-weight:bold; text-decoration:none; color:#000; margin:0.1em 0.08em; }
.epub-idx-letter-block { margin-bottom:1.2em; page-break-inside:avoid; }
.epub-idx-letter-head { font-size:1.3em; font-weight:bold; color:#000; border-bottom:2px solid #000; padding-bottom:0.15em; margin-bottom:0.5em; display:inline-block; min-width:1.8em; text-align:center; }
.epub-idx-name-grid { display:block; -webkit-column-count:2; column-count:2; -webkit-column-gap:1em; column-gap:1em; }
a.epub-idx-name { display:block; font-size:0.88em; color:#000; text-decoration:none; padding:0.22em 0.3em; border-bottom:1px dotted #ccc; break-inside:avoid; -webkit-column-break-inside:avoid; line-height:1.45; }

/* Native TOC document */
nav#toc { padding:0.5em 0; }
.epub-toc-heading { font-size:1.4em; border-bottom:2px solid #000; padding-bottom:0.3em; margin-bottom:1em; }
ol.epub-toc-root { list-style:none; margin:0; padding:0; }
li.epub-toc-frontmatter { display:none; }
li.epub-toc-frontmatter.epub-toc-show { display:block; margin-bottom:0.2em; padding:0.1em 0; }
li.epub-toc-frontmatter.epub-toc-show a { font-size:0.82em; color:#555; text-decoration:none; font-style:italic; }
li.epub-toc-section { display:block; margin-top:0.8em; padding-top:0.4em; border-top:1px solid #888; }
a.epub-toc-section-link { display:block; font-size:1.05em; font-weight:bold; color:#000; text-decoration:none; padding:0.1em 0; margin-bottom:0.3em; line-height:1.3; }
ol.epub-toc-articles { display:block; list-style:none; margin:0 0 0.5em 1em; padding:0; }
li.epub-toc-article { display:block; margin-bottom:0.08em; }
li.epub-toc-article > a { display:block; font-size:0.86em; color:#000; text-decoration:none; padding:0.06em 0.2em; line-height:1.4; }
ol.epub-toc-names { display:block; list-style:none; margin:0 0 0.3em 1em; padding:0; }
li.epub-toc-name { display:block; margin-bottom:0.05em; }
li.epub-toc-name > a { display:block; font-size:0.8em; color:#000; text-decoration:none; padding:0.04em 0.2em; line-height:1.35; }

/* Style MathML blocks */
math {
    font-family: "Noto Sans Math", "STIX2 Math", "Cambria Math", "STIX2 Math", "Asana Math", "DejaVu Math", "TeX Gyre Termes Math", sans-serif;
    font-size: 1em;
    color: #000066;
    font-weight: 400;
    font-style:normal!important;
}

/* Style specific MathML elements */
mi, mn, mo {
    font-family: "Noto Sans Math", "STIX2 Math", "Cambria Math", "STIX2 Math", "Asana Math", "DejaVu Math", "TeX Gyre Termes Math", sans-serif;
}
mtext {
    font-family: "Noto Sans", sans-serif;
    color: #000000;
}
mfrac {
    font-family:"Noto Sans Math", "STIX2 Math", "Cambria Math", "Asana Math", "DejaVu Math", "TeX Gyre Termes Math", "Noto Sans", sans-serif;
}

`;

  const generateEpubFonts = () => {
    return [
      {
        "filename": "noto-sans-400.ttf",
        "url": CONFIG.corsProxy + encodeURIComponent("https://gmodebate.github.io/cosmos/fonts/noto-sans-400.ttf")
      },
      {
        "filename": "noto-sans-700.ttf",
        "url": CONFIG.corsProxy + encodeURIComponent("https://gmodebate.github.io/cosmos/fonts/noto-sans-700.ttf")
      },
      {
        "filename": "noto-sans-400i.ttf",
        "url": CONFIG.corsProxy + encodeURIComponent("https://gmodebate.github.io/cosmos/fonts/noto-sans-400i.ttf")
      },
      {
        "filename": "noto-sans-700i.ttf",
        "url": CONFIG.corsProxy + encodeURIComponent("https://gmodebate.github.io/cosmos/fonts/noto-sans-700i.ttf")
      },
      {
        "filename": "noto-sans-math.ttf",
        "url": CONFIG.corsProxy + encodeURIComponent("https://gmodebate.github.io/cosmos/fonts/noto-sans-math.ttf")
      }
    ];
  }

  // ============================================================
  // BUILD EPUB CHAPTERS
  // ============================================================
  LOG.phase('Building EPUB Chapters');

  const chapters = [];
  const chaptersAdded = new Map();
  const phiSciBase = [
    "/solutions/philosophers/",
    "/solutions/scientists/",
    "/knowledge/philosophers/",
    "/knowledge/scientists/"
  ];

  // Front matter
  chapters.push({
    title:'Cover', content:generateCoverPageHtml(),
    filename:'000-cover.xhtml', beforeToc:true, excludeFromToc:false,
  });
  chapters.push({
    title:'Title Page', content:generateTitlePageHtml(),
    filename:'001-title-page.xhtml', beforeToc:true, excludeFromToc:false,
  });
  chapters.push({
    title:'About This Edition', content:generateCopyrightPageHtml(),
    filename:'002-about-edition.xhtml', beforeToc:true, excludeFromToc:false,
  });
  chapters.push({
    title:'Table of Contents', content:generateVisualTocPageHtml(),
    filename:'003-visual-toc.xhtml', beforeToc:false, excludeFromToc:false,
  });

  // Uses e.children (set in the parent-assignment pass above).
  const buildTocSubItems = (entry, addedToChapters, chapterList, maxDepth = 6, depth = 0) => {
    if (!entry.children || depth > maxDepth) return [];

    return entry.children
      .filter(child => child.status === 200 && !child.isSection)
      .map(child => {

        let normUrlObj = new URL(child.normUrl);

        let canonicalParent = child.canonicalParent;

        // philosopher profile or one of its children
        // these are now indexed by letter in a different TOC entry
        if (phiSciBase.includes(canonicalParent)) {
          return;
        }

        // Add to flat chapter spine if not already present
        if (!addedToChapters.has(child.normUrl)) {
          const ch = buildArticleChapter(child);
          ch.excludeFromToc = true;
          chapterList.push(ch);
          addedToChapters.set(child.normUrl, true);
        }

        const item = {
          title:    child.title || 'Untitled',
          filename: child.filename,
          url: child.url
        };

        const grandchildren = buildTocSubItems(child, addedToChapters, chapterList, maxDepth, depth + 1);
        if (grandchildren.length) item.subItems = grandchildren;

        return item;
      });
  };

  // Sections
  sortedSections.forEach(section => {
    const slug = slugify(section.title);

    if (section.isIndex) {
      // ── Index section ────────────────────────────────────────
      // The native TOC for index sections uses a 3-level structure:
      //   Level 1: "🏛️ Philosophers" (the index landing page)
      //   Level 2: Letter groups (A, B, C…)  ← subItems
      //   Level 3: Individual names           ← sub.subItems
      //
      // Individual name pages are NOT added as top-level chapters
      // in the chapters array with their own subItems entry —
      // they only appear as sub.subItems of their letter group.
      // This prevents the duplicate-entry bug.

      const namePages = section.pages.filter(p => !p.title.toLowerCase().includes('overview'));
      const grouped   = groupByLetter(sortByLastName(namePages));

      // Build letter-grouped subItems for the native TOC
      const letterSubItems = [...grouped.entries()].map(([letter, entries]) => ({
        title:    letter || '',
        // Letter heading links to the anchor on the index page
        filename: `${slug}-index.xhtml#${slug}-letter-${letter}`,
        // Names are sub.subItems — only appear at level 3
        subItems: entries.map((p) => {

          const absUrl = CONFIG.baseUrl + p.url;
          const entry  = registry.get(normaliseUrl(absUrl));

          const subItems = buildTocSubItems(entry, chaptersAdded, chapters);

          const item = { title: p.title || 'Untitled', filename: entry.filename, url: entry.url };
          if (subItems.length) item.subItems = subItems;

          return item;
        }),
      }));

      // Index landing page chapter (with letter subItems for TOC)
      chapters.push({
        title:          `${section.icon || ''} ${section.title}`.trim(),
        content:        generateIndexPageHtml(section),
        filename:       `${slug}-index.xhtml`,
        excludeFromToc: false,
        subItems:       letterSubItems,
        // ↑ subItems contains ONLY letter groups.
        //   Individual names are inside sub.subItems.
        //   The TOC template renders them at level 3 only.
      });

      // Individual profile pages — added as flat chapters for
      // spine ordering, but excluded from native TOC (they appear
      // only as sub.subItems of their letter group above).
      section.pages.forEach(page => {
        if (page.title.toLowerCase().includes('overview')) return;
        const absUrl = CONFIG.baseUrl + page.url;
        const entry  = registry.get(normaliseUrl(absUrl));
        const ch     = buildArticleChapter(
          entry || { url: absUrl, title: page.title, status: 404 }
        );
        // Force excludeFromToc = true for individual name pages
        // so they don't appear as a second set of top-level entries
        ch.excludeFromToc = true;

        chapters.push(ch);
      });

    } else {

      // ── Thematic section ─────────────────────────────────────
      const articleSubItems = section.pages.map(p => {
        const absUrl = CONFIG.baseUrl + p.url;
        const entry  = registry.get(normaliseUrl(absUrl));
        if (!entry) return { title: p.title, filename: getFilename(entry.url) || `${slug}-missing.xhtml` };

        const subItems = buildTocSubItems(entry, chaptersAdded, chapters);

        const item = { title: p.title || 'Untitled', filename: entry.filename, url: entry.url };
        if (subItems.length) item.subItems = subItems;
        return item;
      });

      // Section overview page (with article list as subItems)
      chapters.push({
        title:          `${section.icon || ''} ${section.title}`.trim(),
        content:        generateSectionHeaderHtml(section),
        filename:       `${slug}-overview.xhtml`,
        excludeFromToc: false,
        subItems:       articleSubItems,
      });

      // Individual article pages — excluded from native TOC
      // (they appear as subItems of the section overview above)
      section.pages.forEach(page => {
        const absUrl = CONFIG.baseUrl + page.url;
        const entry  = registry.get(normaliseUrl(absUrl));

        // rewrite url of philosophers/scientists index
        if (phiSciBase.includes(entry.normUrl)) {
          let phiSciSlug = slugify(/\/philosophers\//.test(entry.normUrl) ? 'Philosophers' : 'Scientists');
          entry.filename = `${phiSciSlug}-index.xhtml`;
        }

        const ch     = buildArticleChapter(
          entry || { url: absUrl, title: page.title, status: 404 }
        );
        ch.excludeFromToc = true;
        chapters.push(ch);
      });

    }
  });

  LOG.ok(`Chapters assembled — ${chapters.length} total`);
  LOG.info(`  Front matter: 4 · Sections: ${sortedSections.length} · Articles: ${chapters.length - 4 - sortedSections.length}`);

  // remove content
  /*let removeC = (chapters) => {
    chapters.map((chapter,i) => {
      delete chapter.content;
      if (chapter.excludeFromToc) {
        delete chapters[i];
        return;
      }
      delete chapter.excludeFromToc;
      if (chapter.subItems) {
        removeC(chapter.subItems);
        chapter.subItems = chapter.subItems.filter(Boolean);
      }
    });
  }
  removeC(chapters);
  let c = chapters.filter(Boolean);

  console.log('debug', c);

  downloadJson(c);
  return;*/

  // ============================================================
  // FINAL SUMMARY
  // ============================================================
  const totalOk    = [...registry.values()].filter(e => e.status === 200).length;
  const total404   = [...registry.values()].filter(e => e.status === 404).length;
  const totalErr   = [...registry.values()].filter(e => e.status === 'error').length;
  const totalPages = registry.size;

  LOG.summary({
    'EPUB title':             CONFIG.epubTitle,
    'Author':                 CONFIG.epubAuthor,
    'Generated':              CONFIG.epubDate,
    '':                       '',
    'Total articles registered': totalPages,
    'Articles fetched (ok)':     totalOk,
    'Articles not found (404)':  total404,
    'Fetch errors':           totalErr,
    ' ':                      '',
    'EPUB chapters':          chapters.length,
    'Links rewritten':        linksRewritten,
    'Internal links (no page)': linksNotFound,
  });

  // ============================================================
  // GENERATE EPUB
  // ============================================================
  LOG.phase('Generating EPUB File');
  LOG.info('Packaging content, images, and navigation…');

  const epubOptions = {
    title:                CONFIG.epubTitle,
    author:               CONFIG.epubAuthor,
    publisher:            CONFIG.epubPublisher,
    description:          CONFIG.epubDescription,
    accessibilitySummary: CONFIG.epubAccessibilitySummary,
    lang:                 CONFIG.epubLanguage,
    date:                 CONFIG.epubDate,
    cover:                CONFIG.coverImageUrl,
    version:              3,

    // Identifiers (NEW)
    isbn13:               '978-0983580249',
    isbn10:               '0983580243',
    doi:                  false, // e.g., '10.1234/example.5678'
    ean:                  '9780983580249',

    // Author identity (NEW)
    creatorOrcid:         false,
    creatorViaf:          false,

    // Enhanced accessibility (NEW)
    accessibilitySummary: 'Full EPUB 3 accessibility. Includes structured TOC, semantic markup, reflowable text.',
    certifiedBy:          null, // e.g., 'Example Accessibility Services'
    certifierCredential:  null,
    hazards:              [], // ['none'] | ['flashing', 'motionSimulation']

    // Edition/version (NEW)
    edition:              '1st Edition',
    publicationStatus:    'published', // 'draft' | 'revised' | 'published' | 'deprecated'
    issuedDate:           '2026-04-08T00:00:00Z', // Original publication
    
    // Rendering preferences (NEW)
    spreadMode:           'auto', // 'auto' | 'landscape' | 'portrait' | 'both' | 'none'
    direction:            'ltr', // 'default' | 'ltr' | 'rtl'
    paginationRenderMode: 'reflowable',

    // Subjects/Categories
    subjects: [
      { value: 'Philosophy - General', bisac: 'PHI000000' },
      { value: 'Information Science', bisac: 'COM000000' },
      { value: 'History - General', bisac: 'HIS000000' },
    ],

    // Series
    series: {
      name: 'Philosophical Resources',
      position: 1,
    },

    // Contributors
    contributors: [
      { name: 'CosmicPhilosophy.org', role: 'edt', fileAs: 'CosmicPhilosophy.org' },
    ],

    tocTitle:             'Table of Contents',
    tocInTOC:             false,
    numberChaptersInTOC:  false,
    prependChapterTitles: false,
    ignoreFailedDownloads:true,
    css:                  generateEpubCss(),
    fonts:                generateEpubFonts(),
    tocNCX:               customTocNCX,
    tocXHTML:             customTocXHTML,
    verbose:              false,
  };

  try {
    const epubBlob = await epubGen.default(epubOptions, chapters);
    const filename = `information-philosopher-${CONFIG.epubDate}.epub`;
    saveAs(epubBlob, filename);
    const elapsed  = ((Date.now() - _buildStart) / 1000).toFixed(1);
    LOG.done(filename, elapsed);
  } catch(e) {
    LOG.err('EPUB generation failed', e);
    LOG.info('Possible causes: library version mismatch · CORS headers · malformed HTML');
    LOG.info('Check the error above and the network tab for failed requests.');
  }

})();