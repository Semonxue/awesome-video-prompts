// 移动端标题截取 - 只显示 "-" 前的部分
function truncateMobileTitle() {
  const titleEl = document.querySelector('.site-title-text');
  if (!titleEl) return;
  
  const fullTitle = titleEl.getAttribute('data-full-title') || titleEl.textContent;
  const isMobile = window.innerWidth <= 640;
  
  if (isMobile) {
    // 截取 "-" 前的部分
    const dashIndex = fullTitle.indexOf(' - ');
    if (dashIndex > 0) {
      titleEl.textContent = fullTitle.substring(0, dashIndex);
    } else {
      // 也尝试中文破折号
      const zhDashIndex = fullTitle.indexOf('——');
      if (zhDashIndex > 0) {
        titleEl.textContent = fullTitle.substring(0, zhDashIndex);
      }
    }
  } else {
    // 桌面端显示完整标题
    titleEl.textContent = fullTitle;
  }
}

// 初始化和窗口大小变化时执行
truncateMobileTitle();
window.addEventListener('resize', truncateMobileTitle);

// Close language menus when clicking outside
document.addEventListener('click', () => {
  document.querySelectorAll('.lang-menu.show, .mobile-lang-menu.show').forEach(menu => {
    menu.classList.remove('show');
  });
});

// Video hover functionality
const wrappers = document.querySelectorAll('.prompt-image-wrapper');

wrappers.forEach(wrapper => {
  const video = wrapper.querySelector('video.prompt-hover-video');
  const loader = wrapper.querySelector('.video-loader');
  if (!video) return;
  
  let playPromise;
  let fadeOutTimeout;
  
  wrapper.addEventListener('mouseenter', () => {
    clearTimeout(fadeOutTimeout);
    
    if (!video.src && video.dataset.src) {
      video.src = video.dataset.src;
      video.load();
    }

    if (loader) loader.style.display = 'flex';
    video.style.display = 'block';
    // Ensure opacity starts at 0 if we are just starting, but if we are interrupting a fade out, it might be mid-way.
    // Since we want to ensure no black flash, keeping it 0 is safe.
    if (video.style.display === 'none') {
       video.style.opacity = '0';
    }
    
    video.currentTime = 0;
    video.volume = 0.05; // 10% volume
    
    // Try to play with sound first
    video.muted = false; 
    
    const onPlaying = () => {
      if (loader) loader.style.display = 'none';
      video.style.opacity = '1';
      video.removeEventListener('playing', onPlaying);
    };
    video.addEventListener('playing', onPlaying);

    playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        video.muted = true;
        video.play().catch(e => {
            console.log("Autoplay failed:", e);
            if (loader) loader.style.display = 'none';
            video.style.display = 'none'; // Give up
        });
      });
    }
  });
  
  wrapper.addEventListener('mouseleave', () => {
    // Immediately hide loader if visible
    if (loader) loader.style.display = 'none';
    
    // Start fade out
    video.style.opacity = '0';
    
    if (playPromise !== undefined) {
     
      playPromise.then(() => {
        // Wait for transition to finish before hiding/pausing
        fadeOutTimeout = setTimeout(() => {
          video.pause();
          video.style.display = 'none';
        }, 300);
      }).catch(() => {
        video.style.display = 'none';
      });
    } else {
       fadeOutTimeout = setTimeout(() => {
          video.style.display = 'none';
       }, 300);
    }
  });
});

// Copy Prompt functionality (event delegation for dynamic cards)
document.addEventListener('click', async (event) => {
  const desc = event.target.closest('.prompt-description');
  if (!desc) return;

  // Prevent double handling if element has inline onclick (static cards)
  if (desc.hasAttribute('onclick')) return;

  // Track Matomo copy event
  const card = desc.closest('.prompt-card');
  const promptName = card ? card.getAttribute('data-prompt-name') : '';
  if (typeof _paq !== 'undefined' && promptName) {
    _paq.push(['trackEvent', 'prompts', 'copy', promptName]);
  }

  const text = desc.textContent;
  try {
    await navigator.clipboard.writeText(text);

    // Initial flash state
    desc.style.transition = 'none';
    desc.style.opacity = '0.5';

    // Trigger reflow
    void desc.offsetWidth;

    // Transition back to 100% over 0.5s
    desc.style.transition = 'color 0.2s, opacity 0.5s ease-in-out';
    desc.style.opacity = '1';
  } catch (err) {
    console.error('Failed to copy text: ', err);
  }
});
