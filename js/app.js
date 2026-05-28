// ── Config ──
// 1) https://formspree.io 에서 무료 계정 생성 → New Form 클릭
// 2) 아래에 발급받은 엔드포인트를 붙여넣으세요 (예: 'https://formspree.io/f/xabc1234')
const FORMSPREE_ENDPOINT = '';

// ── Progress bar ──
window.addEventListener('scroll', () => {
  const pct = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
  document.getElementById('prog').style.width = pct + '%';
  document.getElementById('nav').classList.toggle('scrolled', window.scrollY > 40);
});

// ── Reveal on scroll ──
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { if(e.isIntersecting) e.target.classList.add('in'); });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// ── Nav ──
function toggleNav() { document.getElementById('navMobile').classList.toggle('open'); }
function closeNav() { document.getElementById('navMobile').classList.remove('open'); }

// ── Scroll to form ──
function scrollToForm() { document.getElementById('register').scrollIntoView({ behavior: 'smooth' }); }

// ── Suggestion chip toggle ──
function toggleChip(el, text) {
  el.classList.toggle('sel');
  const sugEl = document.getElementById('suggestion');
  if (!sugEl) return;
  const chips = Array.from(document.querySelectorAll('.suggest-chip.sel')).map(c => c.textContent);
  sugEl.value = chips.join(', ');
}

// ── Email registration (Formspree + localStorage) ──
const registered = new Set();
async function register(inputId, successId) {
  const inp = document.getElementById(inputId);
  const email = inp.value.trim();
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email)) {
    inp.style.borderColor = 'var(--red)';
    inp.focus();
    setTimeout(() => inp.style.borderColor = '', 1500);
    return;
  }

  const btn = document.getElementById(inputId === 'ctaEmail' ? 'ctaBtn' : 'heroBtn');
  const btnOrig = btn ? btn.textContent : '';
  if (btn) { btn.disabled = true; btn.textContent = '처리 중...'; }

  const suggestion = (document.getElementById('suggestion') || {}).value || '';

  if (FORMSPREE_ENDPOINT) {
    try {
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          email,
          suggestion,
          _subject: 'InvestMaster Pro 사전 등록',
          _replyto: email
        })
      });
      if (!res.ok) throw new Error('submit_failed');
    } catch {
      if (btn) { btn.disabled = false; btn.textContent = btnOrig; }
      inp.style.borderColor = 'var(--red)';
      inp.placeholder = '잠시 후 다시 시도해주세요';
      setTimeout(() => { inp.style.borderColor = ''; inp.placeholder = '이메일 주소를 입력하세요'; }, 2500);
      return;
    }
  }

  if (btn) { btn.disabled = false; btn.textContent = btnOrig; }

  if (!registered.has(email)) {
    registered.add(email);
    const list = JSON.parse(localStorage.getItem('imp_leads') || '[]');
    list.push({ email, suggestion, ts: new Date().toISOString() });
    localStorage.setItem('imp_leads', JSON.stringify(list));
    document.querySelectorAll('.h-stat-num em').forEach(el => {
      if (el.parentElement.nextElementSibling?.textContent.includes('사전'))
        el.textContent = (3241 + list.length).toLocaleString();
    });
  }

  inp.value = '';
  const sugEl = document.getElementById('suggestion');
  if (sugEl) sugEl.value = '';
  document.querySelectorAll('.suggest-chip').forEach(c => c.classList.remove('sel'));
  document.getElementById(successId).className = 'success-box show';
}

// ── Counter animation ──
function animateCounter(el, target, duration) {
  const start = performance.now();
  const update = (now) => {
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.innerHTML = Math.floor(eased * target).toLocaleString();
    if (p < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

const trustObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      const nums = e.target.querySelectorAll('.tstat-num');
      nums[0] && animateCounter(nums[0].querySelector('span') || nums[0], 15847, 2000);
      nums[1] && animateCounter(nums[1].querySelector('span') || nums[1], 3241, 1500);
      trustObs.unobserve(e.target);
    }
  });
}, { threshold: 0.3 });
const trustSection = document.querySelector('.trust');
if (trustSection) trustObs.observe(trustSection);

// ── Masters tab ──
document.querySelectorAll('.mm-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.mm-tab').forEach(t => t.classList.remove('act'));
    tab.classList.add('act');
  });
});

// ── Enter key submit ──
document.querySelectorAll('.inp').forEach(inp => {
  inp.addEventListener('keydown', e => {
    if (e.key === 'Enter' && inp.tagName !== 'TEXTAREA') {
      if (inp.id === 'heroEmail') register('heroEmail', 'heroSuccess');
      if (inp.id === 'ctaEmail') register('ctaEmail', 'ctaSuccess');
    }
  });
});

// ── Canvas particle system ──
const canvas = document.getElementById('heroCanvas');
const ctx = canvas.getContext('2d');
function resizeCanvas(){canvas.width=canvas.offsetWidth;canvas.height=canvas.offsetHeight}
resizeCanvas();
window.addEventListener('resize',resizeCanvas);
const particles=[];
for(let i=0;i<80;i++){particles.push({x:Math.random()*canvas.width,y:Math.random()*canvas.height,r:Math.random()*2+0.5,dx:(Math.random()-.5)*.4,dy:(Math.random()-.5)*.4,o:Math.random()*.5+.1,color:Math.random()>.5?'59,130,246':'245,158,11'});}
function drawParticles(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  particles.forEach(p=>{
    ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
    ctx.fillStyle=`rgba(${p.color},${p.o})`;ctx.fill();
    p.x+=p.dx;p.y+=p.dy;
    if(p.x<0||p.x>canvas.width)p.dx*=-1;
    if(p.y<0||p.y>canvas.height)p.dy*=-1;
  });
  for(let i=0;i<particles.length;i++){for(let j=i+1;j<particles.length;j++){const dx=particles[i].x-particles[j].x,dy=particles[i].y-particles[j].y,dist=Math.sqrt(dx*dx+dy*dy);if(dist<120){ctx.beginPath();ctx.strokeStyle=`rgba(59,130,246,${0.06*(1-dist/120)})`;ctx.lineWidth=1;ctx.moveTo(particles[i].x,particles[i].y);ctx.lineTo(particles[j].x,particles[j].y);ctx.stroke();}}}
  requestAnimationFrame(drawParticles);
}
drawParticles();

// ── Typewriter ──
const typeTexts=['선택한 전략,','믿었던 종목,','설계한 미래,'];
let tIdx=0,cIdx=0,deleting=false;
function typeWriter(){
  const el=document.getElementById('typeTarget');
  if(!el)return;
  const current=typeTexts[tIdx];
  if(!deleting){el.textContent=current.slice(0,++cIdx);if(cIdx===current.length){deleting=true;setTimeout(typeWriter,1800);return;}}
  else{el.textContent=current.slice(0,--cIdx);if(cIdx===0){deleting=false;tIdx=(tIdx+1)%typeTexts.length;}}
  setTimeout(typeWriter,deleting?60:100);
}
typeWriter();

// ── Terminal clock ──
function updateClock(){const now=new Date(),t=`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')} KST`;const el=document.getElementById('termClock');if(el)el.textContent=t;}
setInterval(updateClock,1000);updateClock();

// ── Terminal live data ──
const stocks=[{sym:'AAPL',base:213.4},{sym:'NVDA',base:892.5},{sym:'MSFT',base:418.2},{sym:'TSLA',base:248.7},{sym:'BA',base:224.3},{sym:'GOOGL',base:178.9},{sym:'META',base:542.1},{sym:'AMZN',base:194.3}];
const signals=[{text:'AAPL 기술적 돌파 — 매수 신호 포착',type:'buy'},{text:'TSLA RSI 과매도 진입 — 반등 대기',type:'hold'},{text:'NVDA 실적 서프라이즈 +18% 예상',type:'buy'},{text:'BA 목표가 상향 $270 (Goldman)',type:'buy'},{text:'META CMF 자금 유입 가속',type:'buy'},{text:'AMZN 단기 과열 — 신규 매수 주의',type:'sell'}];
const picks=[{sym:'BRK.B',name:'Berkshire Hathaway',master:'버핏 전략',ret:'+18.4%',av:'WB',color:'#d97706'},{sym:'AMGN',name:'Amgen Inc.',master:'린치 전략',ret:'+31.2%',av:'PL',color:'#1d4ed8'},{sym:'HCA',name:'HCA Healthcare',master:'막스 전략',ret:'+22.7%',av:'HM',color:'#7c3aed'},{sym:'COST',name:'Costco Wholesale',master:'버핏 전략',ret:'+14.8%',av:'WB',color:'#d97706'}];
function rand(b){return(b+(Math.random()-.5)*b*.02).toFixed(2)}
function pct(){return((Math.random()-.45)*4).toFixed(2)}
function renderTerminal(){
  const feed=document.getElementById('termFeed'),sigs=document.getElementById('termSignals'),pks=document.getElementById('termPicks');
  if(!feed)return;
  const sh=[...stocks].sort(()=>Math.random()-.5).slice(0,5);
  feed.innerHTML=sh.map(s=>{const p=pct(),pos=parseFloat(p)>=0;return `<div class="term-line"><span class="sym">${s.sym}</span><span class="val">$${rand(s.base)}</span><span class="chg ${pos?'pos':'neg'}">${pos?'▲':'▼'}${Math.abs(p)}%</span></div>`;}).join('');
  sigs.innerHTML=signals.slice(0,4).map(s=>`<div class="sig-line"><div class="sig-dot sig-${s.type}"></div><span class="sig-text">${s.text}</span><span class="sig-badge badge-${s.type==='buy'?'buy':s.type==='sell'?'sell':'neut'}">${s.type==='buy'?'매수':s.type==='sell'?'매도':'보유'}</span></div>`).join('');
  pks.innerHTML=picks.map(p=>`<div class="pick-line"><div class="pick-av" style="background:${p.color};color:${p.color==='#d97706'?'#000':'#fff'}">${p.av}</div><div class="pick-info"><div class="pick-name">${p.sym}</div><div class="pick-master">${p.master}</div></div><div class="pick-ret">${p.ret}</div></div>`).join('');
}
renderTerminal();
setInterval(renderTerminal,3000);

// ── Terminal chart ──
function initTermChart(){
  const canvas=document.getElementById('termChart');if(!canvas)return;
  canvas.width=canvas.offsetWidth||800;
  const c=canvas.getContext('2d');
  let data=Array.from({length:60},(_,i)=>100+Math.sin(i*.2)*8+Math.random()*4);
  function draw(){
    canvas.width=canvas.offsetWidth;c.clearRect(0,0,canvas.width,canvas.height);
    const w=canvas.width,h=canvas.height,min=Math.min(...data)-2,max=Math.max(...data)+2;
    const toY=v=>h-(v-min)/(max-min)*h;
    const grad=c.createLinearGradient(0,0,0,h);grad.addColorStop(0,'rgba(16,185,129,0.2)');grad.addColorStop(1,'rgba(16,185,129,0)');
    c.beginPath();data.forEach((v,i)=>{const x=i/(data.length-1)*w;i===0?c.moveTo(x,toY(v)):c.lineTo(x,toY(v));});c.lineTo(w,h);c.lineTo(0,h);c.closePath();c.fillStyle=grad;c.fill();
    c.beginPath();data.forEach((v,i)=>{const x=i/(data.length-1)*w;i===0?c.moveTo(x,toY(v)):c.lineTo(x,toY(v));});c.strokeStyle='#10b981';c.lineWidth=2;c.stroke();
    const lx=w,ly=toY(data[data.length-1]);c.beginPath();c.arc(lx-2,ly,4,0,Math.PI*2);c.fillStyle='#10b981';c.fill();
    c.fillStyle='#10b981';c.font='bold 12px Inter,sans-serif';c.textAlign='right';c.fillText('$'+data[data.length-1].toFixed(2),lx-10,ly-8);
  }
  draw();
  setInterval(()=>{data.push(data[data.length-1]+(Math.random()-.48)*1.5);if(data.length>80)data.shift();draw();},800);
}
setTimeout(initTermChart,100);

// ── Ticker infinite loop ──
const track=document.getElementById('tickerTrack');
if(track){const clone=track.innerHTML;track.innerHTML=clone+clone;}

// ── WB eye blink ──
setInterval(()=>{
  document.querySelectorAll('.wb-blink').forEach(el=>{
    el.style.transition='opacity 0.08s';el.style.opacity='1';
    setTimeout(()=>{el.style.opacity='0';},120);
  });
},3500);
