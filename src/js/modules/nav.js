(function () {
  'use strict';

  var nav = document.querySelector('.nav-bar-section');
  if (!nav) return;

  // Scroll-hide: hide nav when scrolling down, reveal when scrolling up
  var lastScrollY = window.scrollY;
  var ticking = false;

  window.addEventListener('scroll', function () {
    if (!ticking) {
      window.requestAnimationFrame(function () {
        var currentScrollY = window.scrollY;
        if (currentScrollY > lastScrollY && currentScrollY > 80) {
          nav.classList.add('nav-hidden');
        } else {
          nav.classList.remove('nav-hidden');
        }
        lastScrollY = currentScrollY;
        ticking = false;
      });
      ticking = true;
    }
  });

  // Hamburger menu toggle
  var hamburger = document.querySelector('.nav-hamburger');
  if (hamburger) {
    hamburger.addEventListener('click', function () {
      var isOpen = nav.classList.toggle('nav-open');
      hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      if (isOpen) {
        nav.classList.remove('nav-hidden');
      }
    });
  }
})();
