/* ══════════════════════════════════════════
   3D PORTFOLIO - MAIN JAVASCRIPT
   Three.js Background + Parallax + Animations
══════════════════════════════════════════ */

'use strict';

// ═══ UTILITIES ═══
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

// ═══════════════════════════════════════════
// 1. THREE.JS BACKGROUND SCENE
// ═══════════════════════════════════════════
(function initThreeBackground() {
  const canvas = $('#bg-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  camera.position.set(0, 0, 50);

  // ─── Particle System ───
  const PARTICLE_COUNT = 1200;
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const sizes = new Float32Array(PARTICLE_COUNT);

  const palette = [
    new THREE.Color('#6366f1'),
    new THREE.Color('#ec4899'),
    new THREE.Color('#06b6d4'),
    new THREE.Color('#8b5cf6'),
    new THREE.Color('#3b82f6'),
  ];

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    // Sphere distribution
    const r = 60 + Math.random() * 80;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);

    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = (r * Math.cos(phi)) - 30;

    const color = palette[Math.floor(Math.random() * palette.length)];
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;

    sizes[i] = Math.random() * 2.5 + 0.5;
  }

  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  pGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  pGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const pMat = new THREE.PointsMaterial({
    size: 0.6,
    vertexColors: true,
    transparent: true,
    opacity: 0.7,
    sizeAttenuation: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);

  // ─── Floating Geometric Meshes ───
  const meshes = [];
  const geoConfigs = [
    { geo: new THREE.IcosahedronGeometry(3, 0), pos: [-30, 15, -20], color: 0x6366f1 },
    { geo: new THREE.OctahedronGeometry(2.5, 0), pos: [25, -10, -30], color: 0xec4899 },
    { geo: new THREE.TetrahedronGeometry(2, 0), pos: [35, 20, -15], color: 0x06b6d4 },
    { geo: new THREE.IcosahedronGeometry(2, 0), pos: [-20, -20, -25], color: 0x8b5cf6 },
    { geo: new THREE.OctahedronGeometry(1.8, 0), pos: [10, 30, -20], color: 0xf59e0b },
  ];

  geoConfigs.forEach(({ geo, pos, color }) => {
    const mat = new THREE.MeshBasicMaterial({
      color,
      wireframe: true,
      transparent: true,
      opacity: 0.15,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(...pos);
    mesh.userData = {
      rotSpeed: { x: (Math.random() - 0.5) * 0.01, y: (Math.random() - 0.5) * 0.01 },
      floatSpeed: Math.random() * 0.5 + 0.3,
      floatAmp: Math.random() * 2 + 1,
      baseY: pos[1],
    };
    scene.add(mesh);
    meshes.push(mesh);
  });

  // ─── Grid Plane ───
  const gridHelper = new THREE.GridHelper(200, 40, 0x6366f1, 0x6366f1);
  gridHelper.position.y = -40;
  gridHelper.material.transparent = true;
  gridHelper.material.opacity = 0.05;
  scene.add(gridHelper);

  // ─── Mouse Interaction ───
  let mouseX = 0, mouseY = 0;
  let targetX = 0, targetY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  // ─── Animation Loop ───
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    // Smooth mouse follow
    targetX += (mouseX - targetX) * 0.05;
    targetY += (mouseY - targetY) * 0.05;

    // Rotate particles slowly
    particles.rotation.y = t * 0.02 + targetX * 0.1;
    particles.rotation.x = targetY * 0.05;

    // Animate meshes
    meshes.forEach((mesh) => {
      mesh.rotation.x += mesh.userData.rotSpeed.x;
      mesh.rotation.y += mesh.userData.rotSpeed.y;
      mesh.position.y =
        mesh.userData.baseY +
        Math.sin(t * mesh.userData.floatSpeed) * mesh.userData.floatAmp;
    });

    // Camera parallax
    camera.position.x += (targetX * 3 - camera.position.x) * 0.02;
    camera.position.y += (-targetY * 2 - camera.position.y) * 0.02;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
  }

  animate();

  // ─── Resize Handler ───
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();

// ═══════════════════════════════════════════
// 2. CUSTOM CURSOR
// ═══════════════════════════════════════════
(function initCursor() {
  const cursor = $('#cursor');
  const trail = $('#cursor-trail');
  if (!cursor || !trail) return;

  let cx = 0, cy = 0;
  let tx = 0, ty = 0;

  document.addEventListener('mousemove', (e) => {
    cx = e.clientX;
    cy = e.clientY;
    cursor.style.left = cx + 'px';
    cursor.style.top = cy + 'px';
  });

  // Trail lags behind
  function animateTrail() {
    tx += (cx - tx) * 0.12;
    ty += (cy - ty) * 0.12;
    trail.style.left = tx + 'px';
    trail.style.top = ty + 'px';
    requestAnimationFrame(animateTrail);
  }
  animateTrail();

  // Hover effects
  const interactables = 'a, button, input, textarea, .project-card, .filter-btn, .social-btn';
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(interactables)) {
      cursor.style.width = '20px';
      cursor.style.height = '20px';
      cursor.style.background = '#ec4899';
      trail.style.width = '55px';
      trail.style.height = '55px';
      trail.style.borderColor = 'rgba(236,72,153,0.4)';
    }
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(interactables)) {
      cursor.style.width = '12px';
      cursor.style.height = '12px';
      cursor.style.background = '#6366f1';
      trail.style.width = '36px';
      trail.style.height = '36px';
      trail.style.borderColor = 'rgba(99,102,241,0.5)';
    }
  });
  document.addEventListener('mousedown', () => {
    cursor.style.transform = 'translate(-50%, -50%) scale(0.7)';
  });
  document.addEventListener('mouseup', () => {
    cursor.style.transform = 'translate(-50%, -50%) scale(1)';
  });
})();

// ═══════════════════════════════════════════
// 3. NAVBAR SCROLL EFFECT + MOBILE MENU
// ═══════════════════════════════════════════
(function initNavbar() {
  const navbar = $('#navbar');
  const hamburger = $('#hamburger');
  const mobileMenu = $('#mobile-menu');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // Set active nav link on page load
  updateActiveNavLink();

  hamburger.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
  });

  $$('.mobile-link').forEach((link) => {
    link.addEventListener('click', () => mobileMenu.classList.remove('open'));
  });

  // Active link tracking — highlight nav link matching the current page filename
  function updateActiveNavLink() {
    const pageName = window.location.pathname.split('/').pop();
    const currentPage = pageName === '' ? 'index.html' : pageName;
    $$('.nav-link').forEach((link) => {
      const linkPage = link.getAttribute('href');
      link.classList.toggle('active', linkPage === currentPage);
    });
  }
})();

// ═══════════════════════════════════════════
// 4. PARALLAX SCROLLING
// ═══════════════════════════════════════════
(function initParallax() {
  const layers = $$('.parallax-layer[data-speed]');

  function onScroll() {
    const scrollY = window.scrollY;
    layers.forEach((layer) => {
      const speed = parseFloat(layer.dataset.speed);
      layer.style.transform = `translateY(${scrollY * speed}px)`;
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
})();

// ═══════════════════════════════════════════
// 5. SCROLL REVEAL ANIMATION
// ═══════════════════════════════════════════
(function initScrollReveal() {
  const elements = $$('[data-reveal]');
  const revealDelays = [0, 0.1, 0.2, 0.3, 0.4, 0.5];

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const el = entry.target;
        // Stagger siblings
        const siblings = Array.from(el.parentElement.querySelectorAll('[data-reveal]'));
        const idx = siblings.indexOf(el);
        el.style.transitionDelay = (revealDelays[idx % revealDelays.length]) + 's';
        el.classList.add('revealed');
        // Animate skill bars if inside skill section
        el.querySelectorAll('.skill-fill').forEach((bar) => {
          bar.style.width = bar.dataset.width + '%';
        });
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

  elements.forEach((el) => observer.observe(el));

  // Also observe skill section separately for bars
  $$('.skill-fill').forEach((bar) => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.width = entry.target.dataset.width + '%';
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    obs.observe(bar);
  });
})();

// ═══════════════════════════════════════════
// 6. COUNTER ANIMATION (HERO STATS)
// ═══════════════════════════════════════════
(function initCounters() {
  const counters = $$('[data-target]');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.target, 10);
      const duration = 1800;
      const start = performance.now();

      function update(now) {
        const progress = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 4);
        el.textContent = Math.floor(ease * target);
        if (progress < 1) requestAnimationFrame(update);
        else el.textContent = target;
      }
      requestAnimationFrame(update);
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });

  counters.forEach((c) => observer.observe(c));
})();

// ═══════════════════════════════════════════
// 7. 3D TILT EFFECT ON PROJECT CARDS
// ═══════════════════════════════════════════
(function initTiltCards() {
  const cards = $$('.tilt-card');

  cards.forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / (rect.width / 2);
      const dy = (e.clientY - cy) / (rect.height / 2);
      const rotX = -dy * 8;
      const rotY = dx * 8;
      card.style.transform =
        `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-8px) scale(1.02)`;
      card.style.boxShadow = `${-dx * 10}px ${dy * 10}px 40px rgba(0,0,0,0.4), 0 0 60px rgba(99,102,241,0.2)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.boxShadow = '';
    });
  });
})();

// ═══════════════════════════════════════════
// 8. PROJECT FILTER
// ═══════════════════════════════════════════
(function initProjectFilter() {
  const filterBtns = $$('.filter-btn');
  const cards = $$('.project-card');

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;
      cards.forEach((card) => {
        const show = filter === 'all' || card.dataset.category === filter;
        if (show) {
          card.classList.remove('hidden');
          card.style.animation = 'fade-up 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards';
        } else {
          card.classList.add('hidden');
        }
      });
    });
  });
})();

// ═══════════════════════════════════════════
// 9. HERO MOUSE PARALLAX (3D Object)
// ═══════════════════════════════════════════
(function initHeroMouseParallax() {
  const hero3d = $('#hero-3d');
  if (!hero3d) return;

  document.addEventListener('mousemove', (e) => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const dx = (e.clientX - cx) / cx;
    const dy = (e.clientY - cy) / cy;

    hero3d.style.transform =
      `rotateY(${dx * 15}deg) rotateX(${-dy * 10}deg)`;
  });
})();

// ═══════════════════════════════════════════
// 10. THREE.JS - ABOUT SECTION ANIMATED SHAPE
// ═══════════════════════════════════════════
(function initAbout3D() {
  const container = $('#about-3d');
  if (!container || typeof THREE === 'undefined') return;

  const w = container.offsetWidth || 380;
  const h = container.offsetHeight || 380;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
  camera.position.z = 8;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  // Icosahedron with gradient-like material
  const geo = new THREE.IcosahedronGeometry(2.5, 1);
  const mat = new THREE.MeshPhongMaterial({
    color: 0x6366f1,
    emissive: 0x2a2a6e,
    specular: 0xec4899,
    shininess: 80,
    wireframe: false,
    transparent: true,
    opacity: 0.85,
  });
  const mesh = new THREE.Mesh(geo, mat);
  scene.add(mesh);

  // Wireframe overlay
  const wireMat = new THREE.MeshBasicMaterial({
    color: 0x8b5cf6,
    wireframe: true,
    transparent: true,
    opacity: 0.25,
  });
  const wireMesh = new THREE.Mesh(geo, wireMat);
  scene.add(wireMesh);

  // Lights
  const ambientLight = new THREE.AmbientLight(0x6366f1, 0.5);
  scene.add(ambientLight);
  const pointLight1 = new THREE.PointLight(0xec4899, 2, 20);
  pointLight1.position.set(5, 5, 5);
  scene.add(pointLight1);
  const pointLight2 = new THREE.PointLight(0x06b6d4, 1.5, 20);
  pointLight2.position.set(-5, -5, 5);
  scene.add(pointLight2);

  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    mesh.rotation.x = t * 0.3;
    mesh.rotation.y = t * 0.4;
    wireMesh.rotation.x = t * 0.3;
    wireMesh.rotation.y = t * 0.4;

    // Morph-like pulse
    const scale = 1 + Math.sin(t * 0.8) * 0.06;
    mesh.scale.setScalar(scale);

    // Orbit lights
    pointLight1.position.x = Math.cos(t) * 6;
    pointLight1.position.z = Math.sin(t) * 6;
    pointLight2.position.x = Math.cos(t + Math.PI) * 5;
    pointLight2.position.z = Math.sin(t + Math.PI) * 5;

    renderer.render(scene, camera);
  }
  animate();
})();

// ═══════════════════════════════════════════
// 11. CONTACT FORM (Web3Forms)
// ═══════════════════════════════════════════
(function initContactForm() {
  const form = $('#contact-form');
  const btn = $('#submit-btn');
  if (!form || !btn) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    btn.classList.add('sending');
    btn.querySelector('span').textContent = 'Sending...';
    btn.disabled = true;

    try {
      const formData = new FormData(form);
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(Object.fromEntries(formData)),
      });

      const result = await response.json();

      if (result.success) {
        btn.classList.remove('sending');
        btn.classList.add('success');
        btn.querySelector('span').textContent = '✓ Message Sent!';
        form.reset();

        setTimeout(() => {
          btn.classList.remove('success');
          btn.querySelector('span').textContent = 'Send Message';
        }, 4000);
      } else {
        throw new Error(result.message || 'Something went wrong');
      }
    } catch (error) {
      btn.classList.remove('sending');
      btn.querySelector('span').textContent = '✕ Failed to send';

      setTimeout(() => {
        btn.querySelector('span').textContent = 'Send Message';
      }, 3000);

      console.error('Form submission error:', error);
    } finally {
      btn.disabled = false;
    }
  });
})();

// ═══════════════════════════════════════════
// 12. SMOOTH ANCHOR SCROLLING
// ═══════════════════════════════════════════
(function initSmoothScroll() {
  $$('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;
      const target = $(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
})();

// ═══════════════════════════════════════════
// 13. PAGE LOAD - FADE IN BODY
// ═══════════════════════════════════════════
(function initPageLoad() {
  document.body.style.opacity = '0';
  window.addEventListener('load', () => {
    document.body.style.transition = 'opacity 0.6s ease';
    document.body.style.opacity = '1';
  });
})();
