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
