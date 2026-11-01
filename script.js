/* =========================================
   さやの自己紹介サイト — 動きの設定
   ========================================= */

// 「JavaScriptが動いてるよ」の目印。これがあるときだけ .reveal を最初に隠す
document.documentElement.classList.add('js');

// スマホの「視差効果を減らす」がONの人には、動きをつけない
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- ① スクロールすると背景の丸がゆっくり動く（パララックス） ---------- */
const layers = document.querySelectorAll('.parallax');

function moveLayers() {
  const y = window.scrollY;
  layers.forEach((layer) => {
    const speed = Number(layer.dataset.speed); // index.html の data-speed の数字
    layer.style.transform = `translate3d(0, ${y * speed}px, 0)`;
  });
}

if (!reduceMotion) {
  let ticking = false;
  window.addEventListener('scroll', () => {
    // 動かしすぎて重くならないように、画面の更新1回につき1回だけ動かす
    if (!ticking) {
      requestAnimationFrame(() => { moveLayers(); ticking = false; });
      ticking = true;
    }
  }, { passive: true });
  moveLayers();
}

/* ---------- ② 画面に入ったら、ふわっと出てくる ---------- */
const reveals = document.querySelectorAll('.reveal');

if (reduceMotion || !('IntersectionObserver' in window)) {
  reveals.forEach((el) => el.classList.add('is-visible'));
} else {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target); // 1回出たら、もう見張らない
      }
    });
  }, { threshold: 0.15 });

  reveals.forEach((el) => observer.observe(el));
}

/* ---------- ③ オープニング ---------- */
const root = document.documentElement;
const opening = document.querySelector('.opening');

// トップの文字がふわっと出終わったら「終わったよ」の目印をつける
const markIntroDone = () => setTimeout(() => root.classList.add('intro-done'), 2400);

if (root.classList.contains('show-opening')) {
  try { sessionStorage.setItem('opened', '1'); } catch (e) {} // 「もう見た」を記録

  let finished = false;
  const finishOpening = () => {
    if (finished) return;
    finished = true;
    root.classList.remove('is-opening');   // トップの動きをスタート
    opening.classList.add('is-leaving');   // カーテンを上に開く
    setTimeout(() => root.classList.remove('show-opening'), 900);
    markIntroDone();
  };

  setTimeout(finishOpening, 1900);              // 1.9秒たったら開く
  opening.addEventListener('click', finishOpening); // タップしたらすぐ開く（スキップ）
} else {
  markIntroDone();
}

/* ---------- ④ 日本語 / English の切り替え ---------- */
const langButtons = document.querySelectorAll('.lang-switch button');

function setLang(lang) {
  root.classList.toggle('lang-en', lang === 'en');
  root.lang = lang;
  langButtons.forEach((btn) => btn.setAttribute('aria-pressed', btn.dataset.lang === lang));
  try { localStorage.setItem('lang', lang); } catch (e) {} // 次に来たときも同じ言語に
}

langButtons.forEach((btn) => btn.addEventListener('click', () => setLang(btn.dataset.lang)));
setLang(root.classList.contains('lang-en') ? 'en' : 'ja');

/* ---------- ⑤ 「好きなように、生きていい。」を1文字ずつに分ける ---------- */
// 文字を1つずつ <span class="char"> で包んで、順番の番号（--i）をつける
document.querySelectorAll('.typewrite').forEach((el) => {
  let i = 0;
  const splitText = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const pieces = document.createDocumentFragment();
        [...child.textContent].forEach((ch) => {
          if (ch.trim() === '') { pieces.append(ch); return; } // スペースはそのまま
          const span = document.createElement('span');
          span.className = 'char';
          span.textContent = ch;
          span.style.setProperty('--i', i++);
          pieces.append(span);
        });
        child.replaceWith(pieces);
      } else {
        splitText(child); // <span class="phrase"> の中も分ける
      }
    });
  };
  splitText(el);
});

/* ---------- ⑥ シャボン玉 ---------- */
const bubbleLayer = document.querySelector('.bubbles');

function makeBubble() {
  if (document.hidden) return;                       // 別のタブを見てる間は作らない
  if (bubbleLayer.childElementCount >= 5) return;    // 多すぎないように、最大5個まで

  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  const size = 14 + Math.random() * 46;              // 大きさ：14〜60px
  bubble.style.left = `${Math.random() * 95}%`;      // 横の位置：ランダム
  bubble.style.setProperty('--size', `${size}px`);
  bubble.style.setProperty('--duration', `${18 + Math.random() * 8}s`); // 浮かぶ速さ：18〜26秒（ゆっくり）
  bubble.append(document.createElement('span'));
  bubble.addEventListener('animationend', (e) => {
    if (e.target === bubble) bubble.remove();        // 上まで行ったら消す
  });
  bubbleLayer.append(bubble);
}

if (!reduceMotion) {
  setTimeout(makeBubble, 800);    // 最初に1つ
  setInterval(makeBubble, 4500);  // そのあと4.5秒ごとに1つ
}

/* ---------- ⑦ ストーリーのスライド ---------- */
const track = document.querySelector('.story-track');
const slides = [...track.querySelectorAll('.story-slide')];
const prevBtn = document.querySelector('.story-prev');
const nextBtn = document.querySelector('.story-next');
const currentNum = document.querySelector('.story-current');
const progress = document.querySelector('.story-progress-fill');
let current = 0;

// 今見えているスライドに「is-active」をつけて、番号と進み具合バーを更新
function showSlide(index) {
  current = index;
  slides.forEach((slide, i) => slide.classList.toggle('is-active', i === index));
  currentNum.textContent = String(index + 1).padStart(2, '0');
  progress.style.setProperty('--progress', (index + 1) / slides.length);
  prevBtn.disabled = index === 0;
  nextBtn.disabled = index === slides.length - 1;
}

// スワイプして、スライドが半分以上見えたら「今のスライド」にする
const slideObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) showSlide(slides.indexOf(entry.target));
  });
}, { root: track, threshold: 0.6 });
slides.forEach((slide) => slideObserver.observe(slide));

// 矢印ボタン・キーボードの ← → で動かす
const goTo = (index) => {
  const i = Math.min(Math.max(index, 0), slides.length - 1);
  track.scrollTo({ left: slides[i].offsetLeft - track.offsetLeft });
};
prevBtn.addEventListener('click', () => goTo(current - 1));
nextBtn.addEventListener('click', () => goTo(current + 1));
track.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') { e.preventDefault(); goTo(current + 1); }
  if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(current - 1); }
});

showSlide(0);
