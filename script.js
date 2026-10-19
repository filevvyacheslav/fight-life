(() => {
  'use strict';

  const page = document.querySelector('.page-blocks');
  const scene = page.querySelector('.page-scene');
  const content = page.querySelector('.page-scene__content');
  const offerStage = page.querySelector('.offer__stage');
  const products = [...page.querySelectorAll('.product')];
  const aboutStage = page.querySelector('.about__stage');
  const intro = page.querySelector('.about__intro');
  const paragraphs = [...page.querySelectorAll('.about__paragraph')];
  const paragraphWindow = page.querySelector('.about__paragraphs');
  const gallery = page.querySelector('.about__gallery');
  const track = page.querySelector('.about__track');
  const video = page.querySelector('.project-video');
  const videoTitle = video.querySelector('.project-video__title');
  const videoButton = video.querySelector('.project-video__play');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = value => Math.min(1, Math.max(0, value));
  const smooth = value => value * value * (3 - 2 * value);
  const smoother = value => value * value * value * (value * (value * 6 - 15) + 10);

  const firstChange = 200;
  const textTransition = 360;
  const secondChange = 760;
  const galleryStart = 1360;
  const fadeDuration = 1100;
  const galleryBottomGap = 40;
  let offerTravel = 0;
  let transferTravel = 0;
  let transferDirection = 1;
  let videoLift = 0;
  let galleryTravel = 0;
  let fadeStart = 0;
  let totalTravel = 0;
  let endStart = 0;
  let endTravel = 0;
  let frame = 0;

  function render() {
    frame = 0;
    // Все этапы читают одну позицию и обновляются в одном кадре.
    // Во время скролла размеры и отступы документа не изменяются.
    const scroll = Math.min(totalTravel, Math.max(0, -page.getBoundingClientRect().top));
    const heroScroll = Math.min(offerTravel, scroll);
    const transfer = transferDirection * Math.min(transferTravel, Math.max(0, scroll - offerTravel));
    products.forEach(product => {
      product.style.transform = `translate3d(0, ${-heroScroll * Number(product.dataset.speed)}px, 0)`;
    });

    const aboutScroll = Math.max(0, scroll - offerTravel - transferTravel);
    const first = smooth(clamp((aboutScroll - firstChange) / textTransition));
    const second = smooth(clamp((aboutScroll - secondChange) / textTransition));
    const paragraphProgress = first + second;
    const activeParagraph = Math.round(paragraphProgress);
    paragraphs.forEach((paragraph, index) => {
      const offset = index - paragraphProgress;
      paragraph.style.transform = `translate3d(0, ${reducedMotion.matches ? 0 : offset * paragraphWindow.offsetHeight}px, 0)`;
      paragraph.style.opacity = reducedMotion.matches ? Number(index === activeParagraph) : clamp(1 - Math.abs(offset));
      paragraph.setAttribute('aria-hidden', String(index !== activeParagraph));
    });

    const horizontal = Math.min(galleryTravel, Math.max(0, aboutScroll - galleryStart));
    track.style.transform = `translate3d(${-horizontal}px, 0, 0)`;
    const reveal = smoother(clamp((aboutScroll - fadeStart) / fadeDuration));
    // Галерея останавливается с небольшим отступом от нижнего края окна.
    // Большая высота видео учитывается только при его проявлении.
    const finalScroll = Math.min(endTravel, Math.max(0, scroll - endStart));
    content.style.transform = `translate3d(0, ${-(transfer + videoLift * reveal + finalScroll)}px, 0)`;
    // Сначала гаснет галерея, затем проявляются кадр, заголовок и кнопка.
    // Небольшое перекрытие даёт мягкий переход без двойного яркого изображения.
    const introFade = smoother(clamp((aboutScroll - fadeStart) / (fadeDuration * 0.65)));
    intro.style.opacity = 1 - introFade;
    video.style.opacity = reveal;
    video.style.visibility = reveal > 0 ? 'visible' : 'hidden';
    videoTitle.style.opacity = smoother(clamp((aboutScroll - fadeStart - 240) / 860));
    videoButton.style.opacity = smoother(clamp((aboutScroll - fadeStart - 160) / 940));
    intro.inert = reveal >= 0.5;
    intro.setAttribute('aria-hidden', String(reveal >= 0.5));
    video.inert = reveal < 0.5;
    video.setAttribute('aria-hidden', String(reveal < 0.5));
  }

  function scheduleRender() {
    if (!frame) frame = requestAnimationFrame(render);
  }

  function measure() {
    const heroHeight = offerStage.offsetHeight;
    const blockGap = parseFloat(getComputedStyle(content).gap) || 120;
    offerTravel = Math.max(0, ...products.map(product =>
      (Number(product.dataset.bottom) - heroHeight) / Number(product.dataset.speed)
    ));
    const galleryHeight = gallery.offsetTop + gallery.offsetHeight;
    const galleryTop = Math.max(0, scene.offsetHeight - galleryHeight - galleryBottomGap);
    const videoTop = Math.max(0, scene.offsetHeight - aboutStage.offsetHeight);
    const transferDistance = heroHeight + blockGap - galleryTop;
    transferTravel = Math.abs(transferDistance);
    transferDirection = Math.sign(transferDistance);
    videoLift = galleryTop - videoTop;
    galleryTravel = Math.max(0, track.scrollWidth - gallery.clientWidth);
    fadeStart = galleryStart + galleryTravel + 180;
    // На небольшом окне после проявления можно доскроллить до низа видео.
    endTravel = Math.max(0, aboutStage.offsetHeight - scene.offsetHeight);
    endStart = offerTravel + transferTravel + fadeStart + fadeDuration;
    totalTravel = endStart + endTravel;
    page.style.height = `${scene.offsetHeight + totalTravel}px`;
    render();
  }

  window.addEventListener('scroll', scheduleRender, { passive: true });
  window.addEventListener('resize', measure);
  const observer = new ResizeObserver(measure);
  observer.observe(offerStage);
  observer.observe(scene);
  observer.observe(gallery);
  document.fonts.ready.then(measure);
  reducedMotion.addEventListener('change', scheduleRender);
  measure();

  const benefitCards = [...document.querySelectorAll('.benefit-card')];
  const runningIconAnimations = new Map();

  function animateIcon(card) {
    (runningIconAnimations.get(card) || []).forEach(animation => animation.cancel());
    runningIconAnimations.delete(card);
    if (reducedMotion.matches) return;
    const animations = [...card.querySelectorAll('[data-icon-part]')].map(part => {
      const { x, y, delay, scale } = part.dataset;
      part.style.transformBox = 'view-box';
      part.style.transformOrigin = '32px 32px';
      return part.animate([
        { transform: `translate(${x}px, ${y}px) scale(${scale})`, opacity: 0 },
        { transform: 'translate(0px, 0px) scale(1)', opacity: 1 }
      ], {
        duration: 620,
        delay: Number(delay),
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        fill: 'both'
      });
    });
    runningIconAnimations.set(card, animations);
  }

  benefitCards.forEach(card => {
    card.addEventListener('pointerenter', () => animateIcon(card));
    card.addEventListener('focus', () => animateIcon(card));
  });
  const benefits = document.querySelector('.benefits');
  const benefitObserver = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) {
      benefitCards.forEach(animateIcon);
      benefitObserver.disconnect();
    }
  }, { threshold: 0.25 });
  benefitObserver.observe(benefits);
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) {
      runningIconAnimations.forEach(animations => animations.forEach(animation => animation.cancel()));
      runningIconAnimations.clear();
    }
  });

  const enquiry = document.querySelector('.enquiry');
  document.querySelector('[data-open-enquiry]').addEventListener('click', () => enquiry.showModal());
  enquiry.querySelectorAll('[data-close-enquiry], .enquiry__close').forEach(button => {
    button.addEventListener('click', () => enquiry.close());
  });
  enquiry.addEventListener('click', event => {
    if (event.target !== enquiry) return;
    const rect = enquiry.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) enquiry.close();
  });
})();
