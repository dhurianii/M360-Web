// assets/partials.js
// Shared header & footer partials. Injects common chrome into every page
// so we have a single source of truth. The active nav link is computed
// from the current URL — no per-page hardcoding required.

(function () {
  // Map filename -> page key used by data-page attributes in the header
  const pageMap = {
    'about.html': 'about',
    'rnd.html': 'rnd',
    'blogs.html': 'blogs',
    'faqs.html': 'faqs',
    'privacy.html': 'privacy',
    'terms.html': 'terms',
    'index.html': 'home',
    '': 'home'
  };

  const path = window.location.pathname.split('/').pop().toLowerCase();
  const currentPage = pageMap[path] || 'home';

  const HEADER_HTML = `
<header class="site-nav">
  <div class="max-w-[1200px] mx-auto px-5 sm:px-8 h-[68px] flex items-center justify-between gap-4">
    <a href="index.html" class="flex items-center gap-2.5 shrink-0 min-w-0">
      <span class="logo-mark shrink-0">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1e3a8a" stroke-width="1.8">
          <path d="M12 2 21 7v10l-9 5-9-5V7l9-5Z" />
          <circle cx="12" cy="12" r="2.4" fill="#1e3a8a" />
        </svg>
      </span>
      <span class="flex flex-col leading-tight min-w-0">
        <span class="display-title text-[19px] font-[600] tracking-[-0.02em] money-grad">
          M360
        </span>
        <span class="hidden md:block text-[11px] text-slate-900 whitespace-nowrap">
          Money in 360°: Synthesis → Analyse → Visualize
        </span>
        <span class="block md:hidden text-[10px] text-slate-900">
          Synthesis → Analyse → Visualize
        </span>
      </span>
    </a>
    <div class="hidden md:flex items-center gap-8 shrink-0">
      <nav class="flex items-center gap-8" id="primaryNav">
        <a href="about.html" data-page="about" class="nav-link">About</a>
        <a href="rnd.html" data-page="rnd" class="nav-link">R&amp;D</a>
        <a href="blogs.html" data-page="blogs" class="nav-link">Blogs</a>
        <a href="faqs.html" data-page="faqs" class="nav-link">FAQs</a>
      </nav>
      <a href="https://megagraphs.com/try-m360/" class="try-demo-btn">TRY M360</a>
    </div>
    <button id="mobileNavBtn" class="md:hidden w-9 h-9 flex items-center justify-center text-slate-700 shrink-0" aria-label="Menu">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <path d="M3 6h18M3 12h18M3 18h18" />
      </svg>
    </button>
  </div>
  <div id="mobileNavMenu" class="hidden md:hidden px-5 pb-4 border-t border-slate-100">
    <a href="about.html" data-page="about" class="mobile-nav-link block py-2.5 text-[15px] font-medium text-slate-600">About</a>
    <a href="rnd.html" data-page="rnd" class="mobile-nav-link block py-2.5 text-[15px] font-medium text-slate-600">R&amp;D</a>
    <a href="blogs.html" data-page="blogs" class="mobile-nav-link block py-2.5 text-[15px] font-medium text-slate-600">Blogs</a>
    <a href="faqs.html" data-page="faqs" class="mobile-nav-link block py-2.5 text-[15px] font-medium text-slate-600">FAQs</a>
    <a href="https://megagraphs.com/try-m360/" class="try-demo-btn inline-block mt-2">TRY M360 </a>
  </div>
</header>`;

  const FOOTER_HTML = `
<footer class="site-footer mt-24">
  <div class="hairline"></div>
  <div class="max-w-[1200px] mx-auto px-5 sm:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[12.5px]">
    <div class="text-slate-500 font-[475] tracking-[-0.006em] text-center sm:text-left">
      <span class="text-slate-800 font-[600]">&copy; 2026 Moneylizer</span>
      <span class="text-slate-400">(MegaGraphs Tech Pvt Ltd)</span>
    </div>
    <div class="flex items-center gap-5 text-slate-500">
      <a href="privacy.html" class="footer-link">Privacy Policy</a>
      <span class="text-slate-300">&bull;</span>
      <a href="terms.html" class="footer-link">T&amp;C</a>
    </div>
  </div>
</footer>`;

  // Inject header
  const headerSlot = document.getElementById('site-header');
  if (headerSlot) {
    headerSlot.outerHTML = HEADER_HTML;
    // Apply active state for the current page
    if (currentPage !== 'home' && currentPage !== 'privacy' && currentPage !== 'terms') {
      const link = document.querySelector(`#primaryNav [data-page="${currentPage}"]`);
      if (link) link.classList.add('active');
      const mobileLink = document.querySelector(`#mobileNavMenu [data-page="${currentPage}"]`);
      if (mobileLink) {
        mobileLink.classList.remove('text-slate-600');
        mobileLink.classList.add('text-slate-900');
      }
    }
  }

  // Inject footer
  const footerSlot = document.getElementById('site-footer');
  if (footerSlot) {
    footerSlot.outerHTML = FOOTER_HTML;
  }
})();
