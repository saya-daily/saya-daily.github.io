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

/* ---------- ⑦ ストーリーのスライド（タップで進む） ---------- */
const stage = document.querySelector('.story-stage');
const storySlides = [...document.querySelectorAll('.story-slide')];
const barsBox = document.querySelector('.story-bars');
const tapHint = document.querySelector('.story-tap-hint');
let activeSlide = 0;

// 上の細いバーを、スライドの枚数ぶん作る
const bars = storySlides.map(() => barsBox.appendChild(document.createElement('span')));

function showSlide(i) {
  activeSlide = (i + storySlides.length) % storySlides.length; // 最後の次は最初にもどる
  storySlides.forEach((slide, n) => slide.classList.toggle('is-active', n === activeSlide));
  bars.forEach((bar, n) => bar.classList.toggle('is-done', n <= activeSlide));
}

// 「タップしてね」は、サイトを開くたびに出して、1回タップしたら消す
// （同じタブでページを開き直したときは、もう出さない）
let hintSeen = false;
try { hintSeen = sessionStorage.getItem('storyTapped') === '1'; } catch (e) {}
if (hintSeen) tapHint.classList.add('is-hidden');
function hideHint() {
  tapHint.classList.add('is-hidden');
  try { sessionStorage.setItem('storyTapped', '1'); } catch (e) {}
}

// 画面の左3割をタップしたら前へ、それ以外は次へ
stage.addEventListener('click', (e) => {
  const rect = stage.getBoundingClientRect();
  const goBack = e.clientX - rect.left < rect.width * 0.3;
  showSlide(activeSlide + (goBack ? -1 : 1));
  hideHint();
});
// キーボードでも動かせるように（← → ／ Enter ／ スペース）
stage.addEventListener('keydown', (e) => {
  if (['ArrowRight', 'Enter', ' '].includes(e.key)) { e.preventDefault(); showSlide(activeSlide + 1); hideHint(); }
  if (e.key === 'ArrowLeft') { e.preventDefault(); showSlide(activeSlide - 1); hideHint(); }
});

showSlide(0);

/* ---------- ⑧ なんのために ---------- */
// 地図の点に順番の番号をつける（順番にポツポツ出すため）
document.querySelectorAll('.city').forEach((dot, i) => dot.style.setProperty('--i', i));

// 地図の点をタップしたら、下のカードに街の紹介を出す
// 行ったら visited: true にして、photo（写真のファイル名）と note（感想）を入れる
const cityInfo = {
  'Paris':             { ja: 'パリ', jaText: 'フランスの首都。エッフェル塔、ルーブル美術館、カフェ文化。パリ・サンジェルマンの本拠地。', enText: 'The capital. The Eiffel Tower, the Louvre, and café culture. Home of Paris Saint-Germain.' },
  'Lille':             { ja: 'リール', jaText: 'ベルギーのすぐ近く。フランドル風のかわいい建物と、9月のヨーロッパ最大級の蚤の市。', enText: 'Right by Belgium. Flemish-style houses and one of Europe\'s biggest flea markets in September.' },
  'Reims':             { ja: 'ランス', jaText: 'シャンパンの都。昔の王様が戴冠式をした大聖堂がある。', enText: 'The capital of Champagne, with the cathedral where French kings were crowned.' },
  'Rouen':             { ja: 'ルーアン', jaText: 'ジャンヌ・ダルクゆかりの街。モネが何度も描いた大聖堂がある。', enText: 'The city of Joan of Arc, and the cathedral Monet painted again and again.' },
  'Mont-Saint-Michel': { ja: 'モンサンミッシェル', jaText: '海に浮かぶ修道院。2025年の卒業旅行で行った、思い出の場所。', enText: 'An abbey rising from the sea. I visited on my graduation trip in 2025.' },
  'Saint-Malo':        { ja: 'サン・マロ', jaText: '城壁に囲まれた海の街。昔は海賊の拠点でした。', enText: 'A walled city by the sea, once a base for corsairs.' },
  'Rennes':            { ja: 'レンヌ', jaText: 'ブルターニュ地方の中心。木組みの家と、本場のガレット・クレープ。', enText: 'The heart of Brittany. Half-timbered houses and real galettes and crêpes.' },
  'Nantes':            { ja: 'ナント', jaText: '巨大な機械仕掛けのゾウに乗れる街。ジュール・ヴェルヌの生まれ故郷。', enText: 'Ride a giant mechanical elephant. Birthplace of Jules Verne.' },
  'Strasbourg':        { ja: 'ストラスブール', jaText: '運河沿いの「プティット・フランス」がかわいい。フランス最古級のクリスマスマーケット。', enText: 'Canals of "Petite France" and one of France\'s oldest Christmas markets.' },
  'Colmar':            { ja: 'コルマール', jaText: 'パステルカラーの木組みの家が並ぶ、絵本みたいな街。', enText: 'Pastel half-timbered houses, like a picture book.' },
  'Dijon':             { ja: 'ディジョン', jaText: 'ブルゴーニュワインとマスタードで有名なグルメの街。', enText: 'A foodie city famous for Burgundy wine and mustard.' },
  'Lyon':              { ja: 'リヨン', jaText: '「美食の都」。女子サッカーの超強豪クラブ OLリヨネスがある。', enText: 'France\'s food capital—and home of the legendary women\'s club OL Lyonnes.' },
  'Annecy':            { ja: 'アヌシー', jaText: '透き通った湖と運河の街。「アルプスのベニス」。', enText: 'Clear lake and canals—the "Venice of the Alps".' },
  'Chamonix':          { ja: 'シャモニー', jaText: 'ヨーロッパ最高峰モンブランのふもと。ロープウェイで雪山の絶景。', enText: 'At the foot of Mont Blanc. Snowy views by cable car.' },
  'Marseille':         { ja: 'マルセイユ', jaText: 'フランス最古の港町。ブイヤベースが名物。熱狂的なサッカーサポーターの街。', enText: 'France\'s oldest port city. Bouillabaisse and passionate football fans.' },
  'Aix-en-Provence':   { ja: 'エクス・アン・プロヴァンス', jaText: '噴水だらけのおしゃれな街。画家セザンヌのふるさと。', enText: 'An elegant city of fountains, and Cézanne\'s hometown.' },
  'Avignon':           { ja: 'アヴィニヨン', jaText: '昔ローマ教皇が住んでた巨大な宮殿と、「アヴィニョンの橋」。', enText: 'The vast Palace of the Popes and the famous Pont d\'Avignon.' },
  'Nice':              { ja: 'ニース', jaText: '青い海と海沿いの遊歩道。マティス美術館・シャガール美術館がある。', enText: 'Blue sea and the seaside promenade, with Matisse and Chagall museums.' },
  'Cannes':            { ja: 'カンヌ', jaText: '世界的な映画祭の街。レッドカーペットの階段で写真が撮れる。', enText: 'Home of the film festival—take a photo on the red-carpet steps.' },
  'Montpellier':       { ja: 'モンペリエ', jaText: '学生がとても多い、若くて明るい街。', enText: 'A young, sunny city full of students.' },
  'Bordeaux':          { ja: 'ボルドー', jaText: '世界的なワインの街。建物が地面に映る「水の鏡」が映える。', enText: 'World-famous wine, and the "Water Mirror" reflecting the old city.' },
  'Toulouse':          { ja: 'トゥールーズ', jaText: 'レンガの建物が多くて「バラ色の街」。飛行機の街でもある。', enText: '"La Ville Rose"—the pink city of brick, and of aircraft.' },
  'Carcassonne':       { ja: 'カルカソンヌ', jaText: '城壁が二重に囲む、中世のお城の街。', enText: 'A medieval city wrapped in double walls.' },
  'Biarritz':          { ja: 'ビアリッツ', jaText: 'サーフィンとビーチのリゾート。バスク地方の雰囲気も。', enText: 'Surf and beach resort with a Basque feel.' },
  'Ajaccio':           { ja: 'アジャクシオ', jaText: '地中海のコルシカ島。ナポレオンの生まれ故郷で、海がとてもきれい。', enText: 'On Corsica in the Mediterranean. Napoleon\'s birthplace, with stunning sea.' },
};
const cityCard = document.querySelector('.city-card');
const cardBody = cityCard.querySelector('.city-card-body');
const cityStatus = cityCard.querySelector('.city-card-status');
const cityName = cityCard.querySelector('.city-card-name');
const cityText = cityCard.querySelector('.city-card-text');
const citySpots = document.querySelectorAll('.city-spot');
let selectedCity = null;
const mapCol = document.querySelector('.map-col');
const linkSvg = document.querySelector('.city-link');
const linkPath = linkSvg.querySelector('path');

// タップした点から、カードの上のふちまで、ゆるやかなカーブの線を引く
function drawLink(spot, animate) {
  const base = mapCol.getBoundingClientRect();
  const dot = spot.querySelector('.city').getBoundingClientRect();
  const card = cityCard.getBoundingClientRect();
  const x1 = dot.left + dot.width / 2 - base.left;
  const y1 = dot.top + dot.height / 2 - base.top;
  const x2 = Math.min(Math.max(x1, card.left - base.left + 32), card.right - base.left - 32);
  const y2 = card.top - base.top;
  const mid = (y1 + y2) / 2;
  linkPath.setAttribute('d', `M${x1},${y1} C${x1},${mid} ${x2},${mid} ${x2},${y2}`);
  const len = linkPath.getTotalLength();
  linkSvg.style.setProperty('--len', len);
  linkSvg.classList.remove('is-drawing');
  if (animate) { void linkSvg.getBoundingClientRect(); linkSvg.classList.add('is-drawing'); }
  else linkSvg.classList.add('is-drawing');
}

function showCity(spot) {
  selectedCity = spot;
  const name = spot.dataset.city;
  const info = cityInfo[name];
  const en = root.classList.contains('lang-en');
  citySpots.forEach((s) => s.classList.toggle('is-selected', s === spot));
  cityStatus.textContent = info.visited ? 'Visité ✓' : (en ? 'Not yet' : 'Pas encore — まだ行っていません');
  cityName.textContent = name;
  if (!en) { const small = document.createElement('small'); small.textContent = info.ja; cityName.append(small); }
  cityText.textContent = info.visited && info.note ? info.note : (en ? info.enText : info.jaText);
  cardBody.hidden = false;
  cardBody.style.animation = 'none'; void cardBody.offsetWidth; cardBody.style.animation = ''; // ふわっとをもう一回
  cityCard.classList.add('has-city');
  drawLink(spot, true);
}
citySpots.forEach((spot) => {
  spot.addEventListener('click', () => showCity(spot));
  spot.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showCity(spot); } });
});
// 名前をタップしても、その街を選べるように（点が小さくて押しにくいとき用）
document.querySelectorAll('.city-name').forEach((label) => {
  label.addEventListener('click', () => showCity(document.querySelector(`.city-spot[data-city="${label.dataset.city}"]`)));
});
// 画面の大きさが変わったら、線を引き直す
window.addEventListener('resize', () => { if (selectedCity) drawLink(selectedCity, false); });
// 言語を切り替えたら、カードの中身も切り替える
langButtons.forEach((btn) => btn.addEventListener('click', () => { if (selectedCity) showCity(selectedCity); }));

/* ---------- スクロールしたときの処理を、まとめて1回だけ ---------- */
// 画面の更新1回につき1回だけ動かす（何回も重なって走ると、カクカクするから）
const readProgress = document.querySelector('.read-progress');
let ticking = false;
function onScroll() {
  const y = window.scrollY;
  if (!reduceMotion) moveLayers(y);
  root.classList.toggle('hero-out', y > window.innerHeight); // トップが見えてないか
  // どこまで読んだか（0〜1）を、いちばん上の細い線の長さにする
  const max = document.documentElement.scrollHeight - window.innerHeight;
  readProgress.style.setProperty('--read', max > 0 ? Math.min(y / max, 1) : 0);
  ticking = false;
}
window.addEventListener('scroll', () => {
  if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
}, { passive: true });
onScroll();
