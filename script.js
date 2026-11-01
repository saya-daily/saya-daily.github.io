/* =========================================
   さやの自己紹介サイト — 動きの設定
   ========================================= */

// 「JavaScriptが動いてるよ」の目印。これがあるときだけ .reveal を最初に隠す
document.documentElement.classList.add('js');

// スマホの「視差効果を減らす」がONの人には、動きをつけない
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- ① スクロールすると背景の丸がゆっくり動く（パララックス） ---------- */
const layers = [...document.querySelectorAll('.parallax')].map((el) => ({ el, speed: Number(el.dataset.speed) }));

function moveLayers(y) {
  layers.forEach(({ el, speed }) => {
    el.style.transform = `translate3d(0, ${y * speed}px, 0)`;
  });
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
// スクロールした量から「今は何枚目か」を計算して、そのスライドだけ表示する（ふわっと入れ替わる）
const storyEl = document.querySelector('.story');
const storySlides = [...document.querySelectorAll('.story-slide')];
storyEl.style.setProperty('--slides', storySlides.length);
let activeSlide = -1;

function updateStory() {
  const scrolled = -storyEl.getBoundingClientRect().top;             // ストーリーの中を何px進んだか
  const index = Math.floor(scrolled / window.innerHeight + 0.5);    // 1画面ぶん進むごとに次のスライド
  const i = Math.min(Math.max(index, 0), storySlides.length - 1);
  if (i === activeSlide) return;
  activeSlide = i;
  storySlides.forEach((slide, n) => slide.classList.toggle('is-active', n === i));
}

/* ---------- ⑧ なんのために ---------- */
// 地図の点に順番の番号をつける（順番にポツポツ出すため）
document.querySelectorAll('.city').forEach((dot, i) => dot.style.setProperty('--i', i));

/* ---------- スクロールしたときの処理を、まとめて1回だけ ---------- */
// 画面の更新1回につき1回だけ動かす（何回も重なって走ると、カクカクするから）
let ticking = false;
function onScroll() {
  const y = window.scrollY;
  if (!reduceMotion) moveLayers(y);
  root.classList.toggle('hero-out', y > window.innerHeight); // トップが見えてないか
  updateStory();
  ticking = false;
}
window.addEventListener('scroll', () => {
  if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
}, { passive: true });
window.addEventListener('resize', onScroll);
onScroll();
