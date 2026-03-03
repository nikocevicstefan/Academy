// ============================================================
// THE DATA VISUALIZATION ATLAS — Rendering Engine
// ============================================================

// ---------- UTILITY ----------
function makeSVG(container, w = 400, h = 280, m = {top:25,right:20,bottom:30,left:40}) {
  const width = w - m.left - m.right, height = h - m.top - m.bottom;
  const svg = d3.select(container).append('svg')
    .attr('viewBox', `0 0 ${w} ${h}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')
    .append('g').attr('transform', `translate(${m.left},${m.top})`);
  return { svg, width, height, w, h, m };
}

function makeCanvas(container) {
  const box = container.getBoundingClientRect();
  const canvas = document.createElement('canvas');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = (box.width || 400) * dpr;
  canvas.height = (box.height || 280) * dpr;
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  return { canvas, ctx, width: box.width || 400, height: box.height || 280 };
}

const C = {
  conv: ['#5B8DEF','#3D5A80','#98B6E4','#7A9FD1','#456FA3','#6CA0DC','#4A7AB5'],
  art:  ['#FF6B6B','#FFE66D','#4ECDC4','#A8E6CF','#DDA0DD','#FFB347','#87CEEB','#F4A460','#C9B1FF'],
  grid: 'rgba(255,255,255,0.06)',
  axis: 'rgba(255,255,255,0.2)',
  muted:'rgba(255,255,255,0.35)',
};

function randNormal(mean=0, std=1) {
  let u=0,v=0;while(!u)u=Math.random();while(!v)v=Math.random();
  return mean + std * Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);
}

function drawAxis(svg, x, y, w, h, opts={}) {
  if (opts.xAxis !== false) {
    svg.append('g').attr('transform',`translate(0,${h})`)
      .call(d3.axisBottom(x).ticks(opts.xTicks||5).tickSize(0).tickPadding(8))
      .call(g => { g.select('.domain').attr('stroke',C.axis); g.selectAll('text').attr('fill',C.muted).style('font-size','9px').style('font-family','DM Mono'); });
  }
  if (opts.yAxis !== false) {
    svg.append('g')
      .call(d3.axisLeft(y).ticks(opts.yTicks||4).tickSize(-w).tickPadding(8))
      .call(g => { g.select('.domain').remove(); g.selectAll('.tick line').attr('stroke',C.grid); g.selectAll('text').attr('fill',C.muted).style('font-size','9px').style('font-family','DM Mono'); });
  }
}

// ---------- HERO CANVAS ----------
(function heroAnim() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];

  function resize() {
    const dpr = Math.min(devicePixelRatio, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.scale(dpr, dpr);
  }

  function init() {
    resize();
    particles = Array.from({length: 120}, () => ({
      x: Math.random()*W, y: Math.random()*H,
      vx: (Math.random()-0.5)*0.4, vy: (Math.random()-0.5)*0.4,
      r: Math.random()*2+0.5, o: Math.random()*0.5+0.1
    }));
  }

  function draw() {
    ctx.clearRect(0,0,W,H);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fillStyle = `rgba(255,255,255,${p.o})`;
      ctx.fill();
    });
    for (let i=0; i<particles.length; i++) {
      for (let j=i+1; j<particles.length; j++) {
        const dx=particles[i].x-particles[j].x, dy=particles[i].y-particles[j].y;
        const dist=Math.sqrt(dx*dx+dy*dy);
        if (dist < 120) {
          ctx.beginPath(); ctx.moveTo(particles[i].x,particles[i].y);
          ctx.lineTo(particles[j].x,particles[j].y);
          ctx.strokeStyle=`rgba(255,255,255,${0.06*(1-dist/120)})`;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }

  init();
  window.addEventListener('resize', () => { init(); });
  draw();
})();

// ---------- NAV HIGHLIGHTING ----------
(function navHighlight() {
  const links = document.querySelectorAll('#nav a');
  const sections = document.querySelectorAll('.viz-section');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        links.forEach(l => l.classList.remove('active'));
        const a = document.querySelector(`#nav a[data-section="${e.target.id}"]`);
        if (a) a.classList.add('active');
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  sections.forEach(s => obs.observe(s));
})();

// ---------- SCROLL REVEAL ----------
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.08 });
document.querySelectorAll('.viz-section').forEach(s => revealObs.observe(s));

// ---------- SAMPLE DATA ----------
const CATS = ['Alpha','Beta','Gamma','Delta','Epsilon','Zeta'];
const VALS = [42, 28, 35, 51, 17, 33];
const CATS2 = [38, 22, 40, 30, 25, 28];

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const TS = MONTHS.map((m,i) => ({ month:m, val: 30+Math.sin(i/2)*20+Math.random()*8 }));

// ---------- 01 COMPARISON ----------

function renderBarChart(id) {
  const {svg,width,height} = makeSVG(document.getElementById(id));
  const x = d3.scaleBand().domain(CATS).range([0,width]).padding(0.35);
  const y = d3.scaleLinear().domain([0,60]).range([height,0]);
  drawAxis(svg,x,y,width,height);
  svg.selectAll('rect').data(CATS.map((c,i)=>({c,v:VALS[i]}))).join('rect')
    .attr('x',d=>x(d.c)).attr('y',d=>y(d.v)).attr('width',x.bandwidth())
    .attr('height',d=>height-y(d.v)).attr('fill',C.conv[0]).attr('rx',3)
    .attr('opacity',0.9);
}

function renderLollipop(id) {
  const {svg,width,height} = makeSVG(document.getElementById(id));
  const x = d3.scaleBand().domain(CATS).range([0,width]).padding(0.35);
  const y = d3.scaleLinear().domain([0,60]).range([height,0]);
  drawAxis(svg,x,y,width,height);
  const data = CATS.map((c,i)=>({c,v:VALS[i]}));
  svg.selectAll('line.stem').data(data).join('line')
    .attr('x1',d=>x(d.c)+x.bandwidth()/2).attr('x2',d=>x(d.c)+x.bandwidth()/2)
    .attr('y1',height).attr('y2',d=>y(d.v))
    .attr('stroke',C.art[2]).attr('stroke-width',2);
  svg.selectAll('circle').data(data).join('circle')
    .attr('cx',d=>x(d.c)+x.bandwidth()/2).attr('cy',d=>y(d.v))
    .attr('r',6).attr('fill',C.art[2]).attr('stroke','#0c0d18').attr('stroke-width',2);
}

function renderHBar(id) {
  const cats = ['United States','Germany','Japan','Brazil','India','Canada','France','Australia','Mexico','Italy'];
  const vals = [95,72,68,55,50,47,44,40,35,30];
  const {svg,width,height} = makeSVG(document.getElementById(id),400,280,{top:10,right:20,bottom:20,left:90});
  const y = d3.scaleBand().domain(cats).range([0,height]).padding(0.3);
  const x = d3.scaleLinear().domain([0,100]).range([0,width]);
  svg.selectAll('rect').data(cats.map((c,i)=>({c,v:vals[i]}))).join('rect')
    .attr('y',d=>y(d.c)).attr('x',0).attr('width',d=>x(d.v))
    .attr('height',y.bandwidth()).attr('fill',C.conv[0]).attr('rx',2).attr('opacity',0.85);
  svg.selectAll('text.lab').data(cats.map((c,i)=>({c,v:vals[i]}))).join('text')
    .attr('x',-6).attr('y',d=>y(d.c)+y.bandwidth()/2)
    .attr('text-anchor','end').attr('dominant-baseline','middle')
    .attr('fill',C.muted).style('font-size','8px').style('font-family','DM Mono').text(d=>d.c);
}

function renderBumpChart(id) {
  const teams = ['Alpha','Beta','Gamma','Delta','Epsilon'];
  const periods = ['Q1','Q2','Q3','Q4'];
  const ranks = [[1,2,3,1],[2,1,1,2],[3,4,2,3],[4,3,5,4],[5,5,4,5]];
  const {svg,width,height} = makeSVG(document.getElementById(id),400,280,{top:20,right:50,bottom:30,left:30});
  const x = d3.scalePoint().domain(periods).range([0,width]).padding(0.2);
  const y = d3.scaleLinear().domain([1,5]).range([10,height-10]);

  svg.append('g').attr('transform',`translate(0,${height})`).call(d3.axisBottom(x).tickSize(0).tickPadding(10))
    .call(g=>{g.select('.domain').remove(); g.selectAll('text').attr('fill',C.muted).style('font-size','9px').style('font-family','DM Mono');});

  teams.forEach((t,ti) => {
    const line = d3.line().x((_,i)=>x(periods[i])).y((_,i)=>y(ranks[ti][i])).curve(d3.curveBumpX);
    svg.append('path').datum(ranks[ti]).attr('d',line)
      .attr('fill','none').attr('stroke',C.art[ti]).attr('stroke-width',3).attr('opacity',0.8);
    ranks[ti].forEach((r,i) => {
      svg.append('circle').attr('cx',x(periods[i])).attr('cy',y(r)).attr('r',4)
        .attr('fill',C.art[ti]).attr('stroke','#0c0d18').attr('stroke-width',2);
    });
    svg.append('text').attr('x',width+8).attr('y',y(ranks[ti][3]))
      .attr('fill',C.art[ti]).attr('dominant-baseline','middle')
      .style('font-size','8px').style('font-family','DM Mono').text(t);
  });
}

function renderGroupedBar(id) {
  const {svg,width,height} = makeSVG(document.getElementById(id));
  const x0 = d3.scaleBand().domain(CATS).range([0,width]).padding(0.25);
  const x1 = d3.scaleBand().domain(['A','B']).range([0,x0.bandwidth()]).padding(0.08);
  const y = d3.scaleLinear().domain([0,60]).range([height,0]);
  drawAxis(svg,x0,y,width,height);
  const data = CATS.map((c,i)=>({c,a:VALS[i],b:CATS2[i]}));
  data.forEach(d => {
    svg.append('rect').attr('x',x0(d.c)+x1('A')).attr('y',y(d.a)).attr('width',x1.bandwidth())
      .attr('height',height-y(d.a)).attr('fill',C.conv[0]).attr('rx',2).attr('opacity',0.85);
    svg.append('rect').attr('x',x0(d.c)+x1('B')).attr('y',y(d.b)).attr('width',x1.bandwidth())
      .attr('height',height-y(d.b)).attr('fill',C.conv[2]).attr('rx',2).attr('opacity',0.85);
  });
}

function renderDumbbell(id) {
  const {svg,width,height} = makeSVG(document.getElementById(id),400,280,{top:20,right:20,bottom:20,left:60});
  const y = d3.scaleBand().domain(CATS).range([0,height]).padding(0.4);
  const x = d3.scaleLinear().domain([0,60]).range([0,width]);
  svg.append('g').call(d3.axisBottom(x).ticks(5).tickSize(-height).tickPadding(8))
    .attr('transform',`translate(0,${height})`)
    .call(g=>{g.select('.domain').remove();g.selectAll('.tick line').attr('stroke',C.grid);g.selectAll('text').attr('fill',C.muted).style('font-size','9px').style('font-family','DM Mono');});
  const data = CATS.map((c,i)=>({c,a:VALS[i],b:CATS2[i]}));
  data.forEach(d => {
    const cy = y(d.c)+y.bandwidth()/2;
    svg.append('line').attr('x1',x(d.a)).attr('x2',x(d.b)).attr('y1',cy).attr('y2',cy)
      .attr('stroke',C.art[3]).attr('stroke-width',2);
    svg.append('circle').attr('cx',x(d.a)).attr('cy',cy).attr('r',5).attr('fill',C.art[0]);
    svg.append('circle').attr('cx',x(d.b)).attr('cy',cy).attr('r',5).attr('fill',C.art[2]);
    svg.append('text').attr('x',-8).attr('y',cy).attr('text-anchor','end').attr('dominant-baseline','middle')
      .attr('fill',C.muted).style('font-size','8px').style('font-family','DM Mono').text(d.c);
  });
}

function renderOrderedBar(id) {
  const sorted = CATS.map((c,i)=>({c,v:VALS[i]})).sort((a,b)=>b.v-a.v);
  const {svg,width,height} = makeSVG(document.getElementById(id));
  const x = d3.scaleBand().domain(sorted.map(d=>d.c)).range([0,width]).padding(0.35);
  const y = d3.scaleLinear().domain([0,60]).range([height,0]);
  drawAxis(svg,x,y,width,height);
  svg.selectAll('rect').data(sorted).join('rect')
    .attr('x',d=>x(d.c)).attr('y',d=>y(d.v)).attr('width',x.bandwidth())
    .attr('height',d=>height-y(d.v))
    .attr('fill',(d,i)=>d3.interpolateBlues(0.4+i*0.1)).attr('rx',3);
}

function renderRadialBar(id) {
  const {svg,width:w,height:h} = makeSVG(document.getElementById(id),400,280,{top:0,right:0,bottom:0,left:0});
  const cx=200, cy=145, maxR=110, innerR=35;
  const g = svg.append('g').attr('transform',`translate(${cx},${cy})`);
  const angle = d3.scaleBand().domain(CATS).range([0, 2*Math.PI]).padding(0.12);
  const r = d3.scaleLinear().domain([0,60]).range([innerR,maxR]);
  const arc = d3.arc().innerRadius(innerR).startAngle(d=>angle(d.c)).endAngle(d=>angle(d.c)+angle.bandwidth()).padAngle(0.02).padRadius(innerR);
  const data = CATS.map((c,i)=>({c,v:VALS[i]}));
  g.selectAll('path').data(data).join('path')
    .attr('d',d=>arc.outerRadius(r(d.v))(d))
    .attr('fill',(d,i)=>C.art[i]).attr('opacity',0.85);
  data.forEach(d => {
    const a = angle(d.c)+angle.bandwidth()/2 - Math.PI/2;
    const lr = r(d.v)+14;
    g.append('text').attr('x',Math.cos(a)*lr).attr('y',Math.sin(a)*lr)
      .attr('text-anchor','middle').attr('dominant-baseline','middle')
      .attr('fill',C.muted).style('font-size','7px').style('font-family','DM Mono').text(d.c);
  });
}

// ---------- 02 DISTRIBUTION ----------

function renderHistogram(id) {
  const data = Array.from({length:200}, ()=>randNormal(50,12));
  const {svg,width,height} = makeSVG(document.getElementById(id));
  const x = d3.scaleLinear().domain([10,90]).range([0,width]);
  const bins = d3.bin().domain(x.domain()).thresholds(18)(data);
  const y = d3.scaleLinear().domain([0,d3.max(bins,d=>d.length)]).nice().range([height,0]);
  drawAxis(svg,x,y,width,height,{yTicks:3});
  svg.selectAll('rect').data(bins).join('rect')
    .attr('x',d=>x(d.x0)+1).attr('y',d=>y(d.length))
    .attr('width',d=>Math.max(0,x(d.x1)-x(d.x0)-2))
    .attr('height',d=>height-y(d.length)).attr('fill',C.conv[0]).attr('opacity',0.8).attr('rx',1);
}

function renderBeeswarm(id) {
  const data = Array.from({length:100}, (_,i)=>({v:randNormal(50,12), id:i}));
  const {svg,width,height} = makeSVG(document.getElementById(id));
  const x = d3.scaleLinear().domain([10,90]).range([0,width]);
  svg.append('g').attr('transform',`translate(0,${height})`).call(d3.axisBottom(x).ticks(6).tickSize(0).tickPadding(8))
    .call(g=>{g.select('.domain').attr('stroke',C.axis);g.selectAll('text').attr('fill',C.muted).style('font-size','9px').style('font-family','DM Mono');});

  const simulation = d3.forceSimulation(data)
    .force('x', d3.forceX(d=>x(d.v)).strength(1))
    .force('y', d3.forceY(height/2).strength(0.06))
    .force('collide', d3.forceCollide(3.5))
    .stop();
  for(let i=0;i<120;i++) simulation.tick();

  svg.selectAll('circle').data(data).join('circle')
    .attr('cx',d=>d.x).attr('cy',d=>d.y)
    .attr('r',3).attr('fill',C.art[2]).attr('opacity',0.7);
}

function renderBoxPlot(id) {
  const data = Array.from({length:150}, ()=>Math.pow(Math.random(),2)*80+5);
  const {svg,width,height} = makeSVG(document.getElementById(id),400,280,{top:25,right:20,bottom:30,left:50});
  const sorted = data.slice().sort(d3.ascending);
  const q1=d3.quantile(sorted,0.25), med=d3.quantile(sorted,0.5), q3=d3.quantile(sorted,0.75);
  const iqr=q3-q1, lo=Math.max(d3.min(data),q1-1.5*iqr), hi=Math.min(d3.max(data),q3+1.5*iqr);
  const x = d3.scaleLinear().domain([0,90]).range([0,width]);
  svg.append('g').attr('transform',`translate(0,${height})`).call(d3.axisBottom(x).ticks(5).tickSize(0).tickPadding(8))
    .call(g=>{g.select('.domain').attr('stroke',C.axis);g.selectAll('text').attr('fill',C.muted).style('font-size','9px').style('font-family','DM Mono');});
  const cy=height/2, bh=50;
  svg.append('line').attr('x1',x(lo)).attr('x2',x(hi)).attr('y1',cy).attr('y2',cy).attr('stroke',C.conv[0]).attr('stroke-width',1.5);
  svg.append('rect').attr('x',x(q1)).attr('y',cy-bh/2).attr('width',x(q3)-x(q1)).attr('height',bh)
    .attr('fill',C.conv[0]).attr('opacity',0.3).attr('stroke',C.conv[0]).attr('stroke-width',1.5).attr('rx',3);
  svg.append('line').attr('x1',x(med)).attr('x2',x(med)).attr('y1',cy-bh/2).attr('y2',cy+bh/2)
    .attr('stroke','#fff').attr('stroke-width',2);
  [lo,hi].forEach(v=>{svg.append('line').attr('x1',x(v)).attr('x2',x(v)).attr('y1',cy-15).attr('y2',cy+15).attr('stroke',C.conv[0]).attr('stroke-width',1.5);});
}

function renderViolin(id) {
  const groups = ['A','B','C'];
  const datasets = [
    Array.from({length:80}, ()=>randNormal(40,10)),
    Array.from({length:80}, ()=>randNormal(55,8)),
    Array.from({length:80}, ()=>randNormal(35,15))
  ];
  const {svg,width,height} = makeSVG(document.getElementById(id));
  const x = d3.scaleBand().domain(groups).range([0,width]).padding(0.3);
  const y = d3.scaleLinear().domain([0,90]).range([height,0]);
  drawAxis(svg,x,y,width,height,{yTicks:4});

  datasets.forEach((data,gi) => {
    const kde = kernelDensity(data, d3.range(0,90,1), 6);
    const maxD = d3.max(kde,d=>d[1]);
    const bw = x.bandwidth()/2;
    const area = d3.area()
      .x0(d => x(groups[gi])+bw - (d[1]/maxD)*bw)
      .x1(d => x(groups[gi])+bw + (d[1]/maxD)*bw)
      .y(d => y(d[0])).curve(d3.curveBasis);
    svg.append('path').datum(kde).attr('d',area)
      .attr('fill',C.art[gi]).attr('opacity',0.5).attr('stroke',C.art[gi]).attr('stroke-width',1);
  });
}

function kernelDensity(data, ticks, bandwidth) {
  return ticks.map(t => [t, d3.mean(data, d => gaussianKernel((t-d)/bandwidth))/bandwidth]);
}
function gaussianKernel(u) { return Math.abs(u)<=3 ? Math.exp(-0.5*u*u)/Math.sqrt(2*Math.PI) : 0; }

function renderKDE(id) {
  const d1 = Array.from({length:120}, ()=>randNormal(35,8));
  const d2 = Array.from({length:120}, ()=>randNormal(60,10));
  const {svg,width,height} = makeSVG(document.getElementById(id));
  const x = d3.scaleLinear().domain([0,100]).range([0,width]);
  const kde1 = kernelDensity(d1, d3.range(0,100,1), 5);
  const kde2 = kernelDensity(d2, d3.range(0,100,1), 5);
  const yMax = d3.max([...kde1,...kde2], d=>d[1]);
  const y = d3.scaleLinear().domain([0,yMax]).range([height,0]);
  drawAxis(svg,x,y,width,height,{yTicks:3});

  const area = d3.area().x(d=>x(d[0])).y0(height).y1(d=>y(d[1])).curve(d3.curveBasis);
  svg.append('path').datum(kde1).attr('d',area).attr('fill',C.conv[0]).attr('opacity',0.4);
  svg.append('path').datum(kde2).attr('d',area).attr('fill',C.conv[2]).attr('opacity',0.4);
  const line = d3.line().x(d=>x(d[0])).y(d=>y(d[1])).curve(d3.curveBasis);
  svg.append('path').datum(kde1).attr('d',line).attr('fill','none').attr('stroke',C.conv[0]).attr('stroke-width',2);
  svg.append('path').datum(kde2).attr('d',line).attr('fill','none').attr('stroke',C.conv[2]).attr('stroke-width',2);
}

function renderRidgeline(id) {
  const groups = ['Group A','Group B','Group C','Group D','Group E'];
  const means = [30,40,50,45,55];
  const {svg,width,height} = makeSVG(document.getElementById(id),400,280,{top:10,right:20,bottom:20,left:55});
  const x = d3.scaleLinear().domain([0,100]).range([0,width]);
  const yGroup = d3.scaleBand().domain(groups).range([0,height]).padding(0.05);
  const overlap = 1.6;

  groups.forEach((g,gi) => {
    const data = Array.from({length:100}, ()=>randNormal(means[gi],10));
    const kde = kernelDensity(data, d3.range(0,100,1), 6);
    const yMax = d3.max(kde,d=>d[1]);
    const yScale = d3.scaleLinear().domain([0,yMax]).range([0, yGroup.bandwidth()*overlap]);
    const base = yGroup(g)+yGroup.bandwidth();
    const area = d3.area().x(d=>x(d[0])).y0(base).y1(d=>base-yScale(d[1])).curve(d3.curveBasis);

    svg.append('path').datum(kde).attr('d',area)
      .attr('fill',C.art[gi]).attr('opacity',0.5).attr('stroke',C.art[gi]).attr('stroke-width',1.5);
    svg.append('text').attr('x',-8).attr('y',base-4)
      .attr('text-anchor','end').attr('fill',C.muted).style('font-size','8px').style('font-family','DM Mono').text(g);
  });
}

function renderCountBar(id) {
  const cats = ['A','B','C','D','E','F'];
  const vals = [25,18,32,14,28,8];
  const {svg,width,height} = makeSVG(document.getElementById(id));
  const x = d3.scaleBand().domain(cats).range([0,width]).padding(0.3);
  const y = d3.scaleLinear().domain([0,35]).range([height,0]);
  drawAxis(svg,x,y,width,height);
  svg.selectAll('rect').data(cats.map((c,i)=>({c,v:vals[i]}))).join('rect')
    .attr('x',d=>x(d.c)).attr('y',d=>y(d.v)).attr('width',x.bandwidth())
    .attr('height',d=>height-y(d.v)).attr('fill',C.conv[0]).attr('rx',2).attr('opacity',0.85);
}

function renderWaffleDist(id) {
  const cats = [{n:'A',v:25,c:C.art[0]},{n:'B',v:18,c:C.art[1]},{n:'C',v:32,c:C.art[2]},{n:'D',v:14,c:C.art[3]},{n:'E',v:11,c:C.art[4]}];
  const total = cats.reduce((s,d)=>s+d.v,0);
  const {svg,width,height} = makeSVG(document.getElementById(id),400,280,{top:10,right:10,bottom:10,left:10});
  const cols=10, rows=10;
  const cellW=width/cols, cellH=height/rows, pad=2;
  let idx=0;
  const cells = [];
  cats.forEach(cat => {
    const count = Math.round(cat.v/total*100);
    for(let i=0;i<count&&idx<100;i++,idx++) cells.push({row:Math.floor(idx/cols),col:idx%cols,c:cat.c,n:cat.n});
  });
  while(idx<100) { cells.push({row:Math.floor(idx/cols),col:idx%cols,c:'rgba(255,255,255,0.05)',n:''}); idx++; }

  svg.selectAll('rect').data(cells).join('rect')
    .attr('x',d=>d.col*cellW+pad).attr('y',d=>d.row*cellH+pad)
    .attr('width',cellW-pad*2).attr('height',cellH-pad*2)
    .attr('fill',d=>d.c).attr('rx',2).attr('opacity',0.8);
}

// ---------- 03 RELATIONSHIP ----------

function renderScatter(id) {
  const data = Array.from({length:80}, ()=>({ x:Math.random()*100, y:0 }));
  data.forEach(d => d.y = d.x*0.6 + randNormal(0,15) + 20);
  const {svg,width,height} = makeSVG(document.getElementById(id));
  const x = d3.scaleLinear().domain([0,100]).range([0,width]);
  const y = d3.scaleLinear().domain([0,100]).range([height,0]);
  drawAxis(svg,x,y,width,height);
  svg.selectAll('circle').data(data).join('circle')
    .attr('cx',d=>x(d.x)).attr('cy',d=>y(d.y)).attr('r',3)
    .attr('fill',C.conv[0]).attr('opacity',0.6);
}

function renderHexbin(id) {
  const data = Array.from({length:300}, ()=>{
    const xv=Math.random()*100; return {x:xv, y:xv*0.6+randNormal(0,15)+20};
  });
  const {svg,width,height} = makeSVG(document.getElementById(id));
  const x = d3.scaleLinear().domain([0,100]).range([0,width]);
  const y = d3.scaleLinear().domain([0,100]).range([height,0]);
  drawAxis(svg,x,y,width,height);

  const gridSize=20;
  const bins = {};
  data.forEach(d => {
    const gx=Math.floor(x(d.x)/gridSize), gy=Math.floor(y(d.y)/gridSize);
    const key=`${gx},${gy}`;
    bins[key] = (bins[key]||0)+1;
  });
  const maxCount = d3.max(Object.values(bins));
  const color = d3.scaleSequential(d3.interpolateViridis).domain([0,maxCount]);

  Object.entries(bins).forEach(([key,count]) => {
    const [gx,gy] = key.split(',').map(Number);
    const points = hexPoints(gx*gridSize+gridSize/2, gy*gridSize+gridSize/2, gridSize/2-1);
    svg.append('polygon').attr('points',points.map(p=>p.join(',')).join(' '))
      .attr('fill',color(count)).attr('opacity',0.8);
  });
}

function hexPoints(cx,cy,r) {
  return Array.from({length:6},(_,i)=>{const a=Math.PI/3*i-Math.PI/6;return[cx+r*Math.cos(a),cy+r*Math.sin(a)];});
}

function renderCorrHeatmap(id) {
  const vars = ['Var A','Var B','Var C','Var D','Var E'];
  const matrix = vars.map((_,i) => vars.map((_,j) => i===j ? 1 : (Math.random()*1.6-0.3)));
  const {svg,width,height} = makeSVG(document.getElementById(id),400,280,{top:40,right:10,bottom:10,left:50});
  const x = d3.scaleBand().domain(vars).range([0,width]).padding(0.08);
  const y = d3.scaleBand().domain(vars).range([0,height]).padding(0.08);
  const color = d3.scaleSequential(d3.interpolateRdYlBu).domain([1,-1]);

  vars.forEach((vi,i) => {
    vars.forEach((vj,j) => {
      svg.append('rect').attr('x',x(vj)).attr('y',y(vi))
        .attr('width',x.bandwidth()).attr('height',y.bandwidth())
        .attr('fill',color(Math.max(-1,Math.min(1,matrix[i][j])))).attr('rx',3);
    });
  });
  svg.selectAll('text.xl').data(vars).join('text')
    .attr('x',d=>x(d)+x.bandwidth()/2).attr('y',-6)
    .attr('text-anchor','middle').attr('fill',C.muted).style('font-size','8px').style('font-family','DM Mono').text(d=>d);
  svg.selectAll('text.yl').data(vars).join('text')
    .attr('x',-6).attr('y',d=>y(d)+y.bandwidth()/2)
    .attr('text-anchor','end').attr('dominant-baseline','middle')
    .attr('fill',C.muted).style('font-size','8px').style('font-family','DM Mono').text(d=>d);
}

function renderChord(id) {
  const matrix = [
    [0,20,10,5,8],
    [20,0,15,8,3],
    [10,15,0,12,6],
    [5,8,12,0,9],
    [8,3,6,9,0]
  ];
  const {svg} = makeSVG(document.getElementById(id),400,280,{top:0,right:0,bottom:0,left:0});
  const g = svg.append('g').attr('transform','translate(200,145)');
  const chord = d3.chord().padAngle(0.05).sortSubgroups(d3.descending)(matrix);
  const arc = d3.arc().innerRadius(90).outerRadius(95);
  const ribbon = d3.ribbon().radius(88);

  g.selectAll('path.group').data(chord.groups).join('path')
    .attr('d',arc).attr('fill',(d,i)=>C.art[i]).attr('opacity',0.9);
  g.selectAll('path.ribbon').data(chord).join('path')
    .attr('d',ribbon).attr('fill',d=>C.art[d.source.index]).attr('opacity',0.25)
    .attr('stroke',d=>C.art[d.source.index]).attr('stroke-width',0.5).attr('stroke-opacity',0.4);
}

function renderBubble(id) {
  const data = Array.from({length:30}, ()=>({
    x:Math.random()*100, y:Math.random()*100, r:Math.random()*30+5
  }));
  const {svg,width,height} = makeSVG(document.getElementById(id));
  const x = d3.scaleLinear().domain([0,100]).range([0,width]);
  const y = d3.scaleLinear().domain([0,100]).range([height,0]);
  const r = d3.scaleSqrt().domain([5,35]).range([3,18]);
  drawAxis(svg,x,y,width,height);
  svg.selectAll('circle').data(data).join('circle')
    .attr('cx',d=>x(d.x)).attr('cy',d=>y(d.y)).attr('r',d=>r(d.r))
    .attr('fill',C.conv[0]).attr('opacity',0.4).attr('stroke',C.conv[0]).attr('stroke-width',1);
}

function renderColorScatter(id) {
  const data = Array.from({length:60}, ()=>({
    x:Math.random()*100, y:Math.random()*100, z:Math.random()*100
  }));
  const {svg,width,height} = makeSVG(document.getElementById(id));
  const x = d3.scaleLinear().domain([0,100]).range([0,width]);
  const y = d3.scaleLinear().domain([0,100]).range([height,0]);
  const color = d3.scaleSequential(d3.interpolatePlasma).domain([0,100]);
  drawAxis(svg,x,y,width,height);
  svg.selectAll('circle').data(data).join('circle')
    .attr('cx',d=>x(d.x)).attr('cy',d=>y(d.y)).attr('r',5)
    .attr('fill',d=>color(d.z)).attr('opacity',0.8);
}

function renderParallel(id) {
  const dims = ['A','B','C','D','E'];
  const data = Array.from({length:25}, ()=>dims.map(()=>Math.random()*100));
  const {svg,width,height} = makeSVG(document.getElementById(id),400,280,{top:25,right:15,bottom:20,left:15});
  const x = d3.scalePoint().domain(dims).range([0,width]);
  const ys = dims.map(()=>d3.scaleLinear().domain([0,100]).range([height,0]));

  dims.forEach((dim,i) => {
    svg.append('line').attr('x1',x(dim)).attr('x2',x(dim)).attr('y1',0).attr('y2',height)
      .attr('stroke',C.axis).attr('stroke-width',1);
    svg.append('text').attr('x',x(dim)).attr('y',-8).attr('text-anchor','middle')
      .attr('fill',C.muted).style('font-size','9px').style('font-family','DM Mono').text(dim);
  });

  data.forEach(row => {
    const line = d3.line().x((_,i)=>x(dims[i])).y((v,i)=>ys[i](v)).curve(d3.curveLinear);
    svg.append('path').datum(row).attr('d',line)
      .attr('fill','none').attr('stroke',C.conv[0]).attr('stroke-width',1).attr('opacity',0.3);
  });
}

function renderRadialParallel(id) {
  const dims = ['A','B','C','D','E','F'];
  const data = Array.from({length:15}, ()=>dims.map(()=>Math.random()*100));
  const {svg} = makeSVG(document.getElementById(id),400,280,{top:0,right:0,bottom:0,left:0});
  const g = svg.append('g').attr('transform','translate(200,145)');
  const maxR = 100;
  const angleScale = d3.scalePoint().domain(dims).range([0, 2*Math.PI*(dims.length/(dims.length))]);

  [25,50,75,100].forEach(v => {
    const r = v/100*maxR;
    g.append('circle').attr('r',r).attr('fill','none').attr('stroke',C.grid);
  });
  dims.forEach(dim => {
    const a = angleScale(dim)-Math.PI/2;
    g.append('line').attr('x1',0).attr('y1',0)
      .attr('x2',Math.cos(a)*maxR).attr('y2',Math.sin(a)*maxR)
      .attr('stroke',C.grid);
    g.append('text').attr('x',Math.cos(a)*(maxR+14)).attr('y',Math.sin(a)*(maxR+14))
      .attr('text-anchor','middle').attr('dominant-baseline','middle')
      .attr('fill',C.muted).style('font-size','8px').style('font-family','DM Mono').text(dim);
  });

  data.forEach(row => {
    const points = dims.map((dim,i) => {
      const a = angleScale(dim)-Math.PI/2;
      const r = row[i]/100*maxR;
      return [Math.cos(a)*r, Math.sin(a)*r];
    });
    points.push(points[0]);
    const line = d3.line().x(d=>d[0]).y(d=>d[1]).curve(d3.curveLinearClosed);
    g.append('path').datum(points).attr('d',line)
      .attr('fill',C.art[Math.floor(Math.random()*C.art.length)]).attr('fill-opacity',0.05)
      .attr('stroke',C.art[Math.floor(Math.random()*C.art.length)]).attr('stroke-width',1).attr('opacity',0.4);
  });
}

// ---------- 04 COMPOSITION ----------

function renderPie(id) {
  const data = [{n:'A',v:35},{n:'B',v:25},{n:'C',v:20},{n:'D',v:12},{n:'E',v:8}];
  const {svg} = makeSVG(document.getElementById(id),400,280,{top:0,right:0,bottom:0,left:0});
  const g = svg.append('g').attr('transform','translate(200,145)');
  const pie = d3.pie().value(d=>d.v).sort(null).padAngle(0.02);
  const arc = d3.arc().innerRadius(0).outerRadius(100);
  g.selectAll('path').data(pie(data)).join('path')
    .attr('d',arc).attr('fill',(d,i)=>C.conv[i]).attr('opacity',0.85)
    .attr('stroke','#0c0d18').attr('stroke-width',2);
}

function renderWaffle(id) {
  const data = [{n:'A',v:35,c:C.art[0]},{n:'B',v:25,c:C.art[1]},{n:'C',v:20,c:C.art[2]},{n:'D',v:12,c:C.art[3]},{n:'E',v:8,c:C.art[4]}];
  const {svg,width,height} = makeSVG(document.getElementById(id),400,280,{top:10,right:10,bottom:10,left:10});
  const cols=10, rows=10, cellW=width/cols, cellH=height/rows, pad=2;
  let idx=0;
  const cells=[];
  data.forEach(d=>{for(let i=0;i<d.v&&idx<100;i++,idx++)cells.push({row:Math.floor(idx/cols),col:idx%cols,c:d.c});});
  while(idx<100){cells.push({row:Math.floor(idx/cols),col:idx%cols,c:'rgba(255,255,255,0.04)'});idx++;}
  svg.selectAll('rect').data(cells).join('rect')
    .attr('x',d=>d.col*cellW+pad).attr('y',d=>d.row*cellH+pad)
    .attr('width',cellW-pad*2).attr('height',cellH-pad*2)
    .attr('fill',d=>d.c).attr('rx',2).attr('opacity',0.8);
}

function renderTreemap(id) {
  const data = {name:'root',children:[
    {name:'Tech',children:[{name:'SW',value:40},{name:'HW',value:20},{name:'AI',value:15}]},
    {name:'Health',children:[{name:'Pharma',value:25},{name:'Bio',value:10}]},
    {name:'Finance',children:[{name:'Bank',value:30},{name:'Ins',value:12}]},
    {name:'Energy',value:18}
  ]};
  const {svg,width,height} = makeSVG(document.getElementById(id),400,280,{top:5,right:5,bottom:5,left:5});
  const root = d3.treemap().size([width,height]).padding(2)(d3.hierarchy(data).sum(d=>d.value));
  svg.selectAll('rect').data(root.leaves()).join('rect')
    .attr('x',d=>d.x0).attr('y',d=>d.y0).attr('width',d=>d.x1-d.x0).attr('height',d=>d.y1-d.y0)
    .attr('fill',(d,i)=>C.conv[i%C.conv.length]).attr('opacity',0.7).attr('rx',3);
  svg.selectAll('text').data(root.leaves().filter(d=>(d.x1-d.x0)>30)).join('text')
    .attr('x',d=>d.x0+5).attr('y',d=>d.y0+14)
    .attr('fill','rgba(255,255,255,0.7)').style('font-size','8px').style('font-family','DM Mono').text(d=>d.data.name);
}

function renderCirclePacking(id) {
  const data = {name:'root',children:[
    {name:'Tech',children:[{name:'SW',value:40},{name:'HW',value:20},{name:'AI',value:15}]},
    {name:'Health',children:[{name:'Pharma',value:25},{name:'Bio',value:10}]},
    {name:'Finance',children:[{name:'Bank',value:30},{name:'Ins',value:12}]},
    {name:'Energy',value:18}
  ]};
  const {svg} = makeSVG(document.getElementById(id),400,280,{top:0,right:0,bottom:0,left:0});
  const root = d3.pack().size([390,270]).padding(4)(d3.hierarchy(data).sum(d=>d.value));
  const g = svg.append('g').attr('transform','translate(5,5)');
  g.selectAll('circle').data(root.descendants()).join('circle')
    .attr('cx',d=>d.x).attr('cy',d=>d.y).attr('r',d=>d.r)
    .attr('fill',d=>d.children?'none':C.art[d.depth+Math.floor(Math.random()*3)])
    .attr('opacity',d=>d.children?0:0.5)
    .attr('stroke',d=>d.children?C.art[d.depth]:'none').attr('stroke-width',1.5).attr('stroke-opacity',0.4);
  g.selectAll('text').data(root.leaves().filter(d=>d.r>14)).join('text')
    .attr('x',d=>d.x).attr('y',d=>d.y+3).attr('text-anchor','middle')
    .attr('fill','rgba(255,255,255,0.7)').style('font-size','7px').style('font-family','DM Mono').text(d=>d.data.name);
}

function renderStackedArea(id) {
  const keys = ['A','B','C','D'];
  const n = 12;
  const tableData = Array.from({length:n}, (_,i) => {
    const obj = {month:i};
    keys.forEach(k => obj[k] = Math.random()*20+5);
    return obj;
  });
  const {svg,width,height} = makeSVG(document.getElementById(id));
  const x = d3.scaleLinear().domain([0,n-1]).range([0,width]);
  const stack = d3.stack().keys(keys)(tableData);
  const y = d3.scaleLinear().domain([0,d3.max(stack[stack.length-1],d=>d[1])]).range([height,0]);
  drawAxis(svg,x,y,width,height,{xTicks:6,yTicks:4});
  const area = d3.area().x(d=>x(d.data.month)).y0(d=>y(d[0])).y1(d=>y(d[1])).curve(d3.curveMonotoneX);
  svg.selectAll('path').data(stack).join('path')
    .attr('d',area).attr('fill',(d,i)=>C.conv[i]).attr('opacity',0.7);
}

function renderStreamgraph(id) {
  const keys = ['A','B','C','D','E'];
  const n = 20;
  const tableData = Array.from({length:n}, (_,i) => {
    const obj = {t:i};
    keys.forEach(k => obj[k] = Math.random()*15+3+Math.sin(i/3)*5);
    return obj;
  });
  const {svg,width,height} = makeSVG(document.getElementById(id),400,280,{top:10,right:10,bottom:10,left:10});
  const x = d3.scaleLinear().domain([0,n-1]).range([0,width]);
  const stack = d3.stack().keys(keys).offset(d3.stackOffsetWiggle).order(d3.stackOrderInsideOut)(tableData);
  const yMin = d3.min(stack, s=>d3.min(s,d=>d[0]));
  const yMax = d3.max(stack, s=>d3.max(s,d=>d[1]));
  const y = d3.scaleLinear().domain([yMin,yMax]).range([height,0]);
  const area = d3.area().x(d=>x(d.data.t)).y0(d=>y(d[0])).y1(d=>y(d[1])).curve(d3.curveBasis);
  svg.selectAll('path').data(stack).join('path')
    .attr('d',area).attr('fill',(d,i)=>C.art[i]).attr('opacity',0.65);
}

function renderNestedTreemap(id) {
  const data = {name:'root',children:[
    {name:'Tech',children:[{name:'SW',value:35},{name:'HW',value:18},{name:'AI',value:22}]},
    {name:'Health',children:[{name:'Pharma',value:28},{name:'Bio',value:12}]},
    {name:'Finance',children:[{name:'Bank',value:25},{name:'Ins',value:15},{name:'Crypto',value:8}]}
  ]};
  const {svg,width,height} = makeSVG(document.getElementById(id),400,280,{top:5,right:5,bottom:5,left:5});
  const root = d3.treemap().size([width,height]).padding(3).paddingTop(16)(d3.hierarchy(data).sum(d=>d.value));
  const parents = root.descendants().filter(d=>d.depth===1);
  svg.selectAll('rect.parent').data(parents).join('rect')
    .attr('x',d=>d.x0).attr('y',d=>d.y0).attr('width',d=>d.x1-d.x0).attr('height',d=>d.y1-d.y0)
    .attr('fill','none').attr('stroke',C.conv[3]).attr('stroke-width',1).attr('stroke-opacity',0.3).attr('rx',4);
  svg.selectAll('text.parent').data(parents).join('text')
    .attr('x',d=>d.x0+4).attr('y',d=>d.y0+11)
    .attr('fill',C.muted).style('font-size','8px').style('font-family','DM Mono').style('font-weight','600').text(d=>d.data.name);
  svg.selectAll('rect.leaf').data(root.leaves()).join('rect')
    .attr('x',d=>d.x0).attr('y',d=>d.y0).attr('width',d=>d.x1-d.x0).attr('height',d=>d.y1-d.y0)
    .attr('fill',(d,i)=>C.conv[i%C.conv.length]).attr('opacity',0.6).attr('rx',2);
}

function renderMarimekko(id) {
  const cats = ['Tech','Health','Finance'];
  const subs = ['A','B','C'];
  const widths = [45,30,25];
  const shares = [[50,30,20],[40,35,25],[30,40,30]];
  const {svg,width,height} = makeSVG(document.getElementById(id),400,280,{top:15,right:10,bottom:25,left:10});
  const totalW = d3.sum(widths);
  let xOff = 0;
  cats.forEach((cat,ci) => {
    const w = widths[ci]/totalW*width;
    let yOff = 0;
    subs.forEach((sub,si) => {
      const h = shares[ci][si]/100*height;
      svg.append('rect').attr('x',xOff+1).attr('y',yOff).attr('width',w-2).attr('height',h)
        .attr('fill',C.art[si]).attr('opacity',0.6).attr('rx',2);
      if (h>20) svg.append('text').attr('x',xOff+w/2).attr('y',yOff+h/2+3).attr('text-anchor','middle')
        .attr('fill','rgba(255,255,255,0.6)').style('font-size','8px').style('font-family','DM Mono').text(sub);
      yOff += h;
    });
    svg.append('text').attr('x',xOff+w/2).attr('y',height+15).attr('text-anchor','middle')
      .attr('fill',C.muted).style('font-size','8px').style('font-family','DM Mono').text(cat);
    xOff += w;
  });
}

// ---------- 05 TEMPORAL ----------

function renderLineChart(id) {
  const {svg,width,height} = makeSVG(document.getElementById(id));
  const x = d3.scalePoint().domain(MONTHS).range([0,width]).padding(0.1);
  const y = d3.scaleLinear().domain([10,60]).range([height,0]);
  drawAxis(svg,x,y,width,height,{xTicks:12});
  const line = d3.line().x(d=>x(d.month)).y(d=>y(d.val)).curve(d3.curveMonotoneX);
  const area = d3.area().x(d=>x(d.month)).y0(height).y1(d=>y(d.val)).curve(d3.curveMonotoneX);
  svg.append('path').datum(TS).attr('d',area).attr('fill',C.conv[0]).attr('opacity',0.1);
  svg.append('path').datum(TS).attr('d',line).attr('fill','none')
    .attr('stroke',C.conv[0]).attr('stroke-width',2.5);
  svg.selectAll('circle').data(TS).join('circle')
    .attr('cx',d=>x(d.month)).attr('cy',d=>y(d.val)).attr('r',3)
    .attr('fill',C.conv[0]).attr('stroke','#0c0d18').attr('stroke-width',2);
}

function renderSpiral(id) {
  const {svg} = makeSVG(document.getElementById(id),400,280,{top:0,right:0,bottom:0,left:0});
  const g = svg.append('g').attr('transform','translate(200,145)');
  const n = 48;
  const data = Array.from({length:n}, (_,i) => 20+Math.sin(i/4)*15+Math.random()*5);
  const maxVal = d3.max(data);
  const color = d3.scaleSequential(d3.interpolatePlasma).domain([0,maxVal]);

  data.forEach((v,i) => {
    const angle = (i/n)*Math.PI*6 - Math.PI/2;
    const baseR = 15 + (i/n)*70;
    const r = v/maxVal * 6 + 2;
    g.append('circle')
      .attr('cx', Math.cos(angle)*baseR).attr('cy', Math.sin(angle)*baseR)
      .attr('r', r).attr('fill', color(v)).attr('opacity',0.8);
  });
  [30,60,90].forEach(r => {
    g.append('circle').attr('r',r).attr('fill','none').attr('stroke',C.grid).attr('stroke-dasharray','2,4');
  });
}

function renderMultiLine(id) {
  const series = ['Series A','Series B','Series C'];
  const data = series.map(s => MONTHS.map((m,i) => ({
    month:m, val: 25+Math.sin(i/2+series.indexOf(s))*15+Math.random()*8
  })));
  const {svg,width,height} = makeSVG(document.getElementById(id));
  const x = d3.scalePoint().domain(MONTHS).range([0,width]).padding(0.1);
  const y = d3.scaleLinear().domain([5,55]).range([height,0]);
  drawAxis(svg,x,y,width,height);
  data.forEach((s,si) => {
    const line = d3.line().x(d=>x(d.month)).y(d=>y(d.val)).curve(d3.curveMonotoneX);
    svg.append('path').datum(s).attr('d',line)
      .attr('fill','none').attr('stroke',C.conv[si]).attr('stroke-width',2).attr('opacity',0.8);
  });
}

function renderHorizon(id) {
  const n = 50;
  const bands = 3;
  const series = Array.from({length:n}, (_,i) => 30+Math.sin(i/4)*25+Math.random()*10);
  const {svg,width,height} = makeSVG(document.getElementById(id),400,280,{top:10,right:10,bottom:10,left:10});
  const bandH = height/bands;
  const x = d3.scaleLinear().domain([0,n-1]).range([0,width]);
  const baseVal = d3.mean(series);
  const maxDev = d3.max(series, d=>Math.abs(d-baseVal));

  for (let b=0; b<bands; b++) {
    const lo = baseVal + (b/bands)*maxDev;
    const hi = baseVal + ((b+1)/bands)*maxDev;
    const area = d3.area()
      .x((_,i)=>x(i))
      .y0(bandH)
      .y1((_,i)=> {
        const v = series[i]-lo;
        return v > 0 ? bandH - Math.min(v/(hi-lo),1)*bandH : bandH;
      })
      .curve(d3.curveMonotoneX);
    svg.append('path').datum(series).attr('d',area)
      .attr('fill',C.art[2]).attr('opacity',0.25+b*0.25);
  }
  for (let b=0; b<bands; b++) {
    const lo = baseVal - ((b+1)/bands)*maxDev;
    const hi = baseVal - (b/bands)*maxDev;
    const area = d3.area()
      .x((_,i)=>x(i))
      .y0(bandH)
      .y1((_,i)=> {
        const v = hi - series[i];
        return v > 0 ? bandH - Math.min(v/(hi-lo),1)*bandH : bandH;
      })
      .curve(d3.curveMonotoneX);
    svg.append('path').datum(series).attr('d',area)
      .attr('fill',C.art[0]).attr('opacity',0.25+b*0.25);
  }
}

function renderSeasonalDecomp(id) {
  const n = 24;
  const data = Array.from({length:n}, (_,i) => ({
    t:i, raw: 30+i*0.8+Math.sin(i*Math.PI/6)*12+Math.random()*5,
    trend: 30+i*0.8,
    seasonal: Math.sin(i*Math.PI/6)*12
  }));
  const {svg,width,height} = makeSVG(document.getElementById(id),400,280,{top:15,right:10,bottom:20,left:35});
  const x = d3.scaleLinear().domain([0,n-1]).range([0,width]);
  const h1 = height*0.45, h2 = height*0.35;

  const y1 = d3.scaleLinear().domain(d3.extent(data,d=>d.raw)).range([h1,0]);
  const y2 = d3.scaleLinear().domain([-15,15]).range([height,height-h2]);

  svg.append('path').datum(data).attr('d',d3.line().x(d=>x(d.t)).y(d=>y1(d.raw)).curve(d3.curveMonotoneX))
    .attr('fill','none').attr('stroke',C.conv[0]).attr('stroke-width',1.5).attr('opacity',0.6);
  svg.append('path').datum(data).attr('d',d3.line().x(d=>x(d.t)).y(d=>y1(d.trend)).curve(d3.curveMonotoneX))
    .attr('fill','none').attr('stroke',C.conv[1]).attr('stroke-width',2);
  svg.append('path').datum(data).attr('d',d3.area().x(d=>x(d.t)).y0(y2(0)).y1(d=>y2(d.seasonal)).curve(d3.curveMonotoneX))
    .attr('fill',C.conv[2]).attr('opacity',0.3);
  svg.append('path').datum(data).attr('d',d3.line().x(d=>x(d.t)).y(d=>y2(d.seasonal)).curve(d3.curveMonotoneX))
    .attr('fill','none').attr('stroke',C.conv[2]).attr('stroke-width',1.5);

  svg.append('text').attr('x',0).attr('y',6).attr('fill',C.muted).style('font-size','7px').style('font-family','DM Mono').text('Trend + Raw');
  svg.append('text').attr('x',0).attr('y',height-h2-4).attr('fill',C.muted).style('font-size','7px').style('font-family','DM Mono').text('Seasonal');
}

function renderRadialClock(id) {
  const {svg} = makeSVG(document.getElementById(id),400,280,{top:0,right:0,bottom:0,left:0});
  const g = svg.append('g').attr('transform','translate(200,145)');
  const months = ['J','F','M','A','M','J','J','A','S','O','N','D'];
  const data = months.map(()=>Math.random()*40+10);
  const maxR = 100, innerR = 25;
  const angle = d3.scaleBand().domain(months).range([0,2*Math.PI]).padding(0.08);
  const r = d3.scaleLinear().domain([0,50]).range([innerR,maxR]);
  const arc = d3.arc().innerRadius(innerR).startAngle((_,i)=>angle(months[i])).endAngle((_,i)=>angle(months[i])+angle.bandwidth());

  g.selectAll('path').data(data).join('path')
    .attr('d',(d,i)=>arc.outerRadius(r(d))(d,i))
    .attr('fill',(d,i)=>C.art[i%C.art.length]).attr('opacity',0.6);
  months.forEach((m,i) => {
    const a = angle(m)+angle.bandwidth()/2-Math.PI/2;
    g.append('text').attr('x',Math.cos(a)*(maxR+12)).attr('y',Math.sin(a)*(maxR+12))
      .attr('text-anchor','middle').attr('dominant-baseline','middle')
      .attr('fill',C.muted).style('font-size','8px').style('font-family','DM Mono').text(m);
  });
}

function renderSlope(id) {
  const items = ['Alpha','Beta','Gamma','Delta','Epsilon'];
  const before = [42,35,28,51,19];
  const after = [38,48,25,40,32];
  const {svg,width,height} = makeSVG(document.getElementById(id),400,280,{top:20,right:60,bottom:20,left:60});
  const y = d3.scaleLinear().domain([10,60]).range([height,0]);

  svg.append('text').attr('x',0).attr('y',-6).attr('fill',C.muted).style('font-size','9px').style('font-family','DM Mono').text('Before');
  svg.append('text').attr('x',width).attr('y',-6).attr('text-anchor','end').attr('fill',C.muted).style('font-size','9px').style('font-family','DM Mono').text('After');
  svg.append('line').attr('x1',0).attr('x2',0).attr('y1',0).attr('y2',height).attr('stroke',C.axis);
  svg.append('line').attr('x1',width).attr('x2',width).attr('y1',0).attr('y2',height).attr('stroke',C.axis);

  items.forEach((item,i) => {
    svg.append('line').attr('x1',0).attr('x2',width).attr('y1',y(before[i])).attr('y2',y(after[i]))
      .attr('stroke',C.conv[i]).attr('stroke-width',2).attr('opacity',0.7);
    svg.append('circle').attr('cx',0).attr('cy',y(before[i])).attr('r',4).attr('fill',C.conv[i]);
    svg.append('circle').attr('cx',width).attr('cy',y(after[i])).attr('r',4).attr('fill',C.conv[i]);
    svg.append('text').attr('x',-8).attr('y',y(before[i])+3).attr('text-anchor','end')
      .attr('fill',C.muted).style('font-size','7px').style('font-family','DM Mono').text(item);
  });
}

function renderConnectedScatter(id) {
  const n = 12;
  const data = Array.from({length:n}, (_,i) => ({
    x: 20+Math.sin(i/2)*25+Math.random()*8,
    y: 20+Math.cos(i/3)*20+i*3+Math.random()*5,
    t: i
  }));
  const {svg,width,height} = makeSVG(document.getElementById(id));
  const x = d3.scaleLinear().domain(d3.extent(data,d=>d.x)).nice().range([0,width]);
  const y = d3.scaleLinear().domain(d3.extent(data,d=>d.y)).nice().range([height,0]);
  drawAxis(svg,x,y,width,height);

  const line = d3.line().x(d=>x(d.x)).y(d=>y(d.y)).curve(d3.curveMonotoneX);
  svg.append('path').datum(data).attr('d',line)
    .attr('fill','none').attr('stroke',C.art[4]).attr('stroke-width',1.5).attr('opacity',0.6);
  svg.selectAll('circle').data(data).join('circle')
    .attr('cx',d=>x(d.x)).attr('cy',d=>y(d.y)).attr('r',4)
    .attr('fill',d=>d3.interpolatePlasma(d.t/n)).attr('stroke','#0c0d18').attr('stroke-width',1.5);
}

// ---------- 06 SPATIAL ----------

function renderDotMap(id) {
  const {svg,width,height} = makeSVG(document.getElementById(id),400,280,{top:10,right:10,bottom:10,left:10});
  // Abstract continent shapes as backdrop
  svg.append('rect').attr('width',width).attr('height',height).attr('fill','rgba(255,255,255,0.02)').attr('rx',8);
  // Random points clustered around 3 "cities"
  const centers = [[width*0.3,height*0.4],[width*0.6,height*0.3],[width*0.5,height*0.7]];
  const points = [];
  centers.forEach(c => {
    for(let i=0;i<40;i++) points.push({x:c[0]+randNormal(0,30),y:c[1]+randNormal(0,25)});
  });
  svg.selectAll('circle').data(points).join('circle')
    .attr('cx',d=>d.x).attr('cy',d=>d.y).attr('r',2)
    .attr('fill',C.conv[0]).attr('opacity',0.5);
}

function renderDensityHeatmap(id) {
  const {svg,width,height} = makeSVG(document.getElementById(id),400,280,{top:10,right:10,bottom:10,left:10});
  svg.append('rect').attr('width',width).attr('height',height).attr('fill','rgba(255,255,255,0.02)').attr('rx',8);
  const centers = [[width*0.3,height*0.4],[width*0.6,height*0.3],[width*0.5,height*0.7]];
  const gridW=20, cols=Math.ceil(width/gridW), rows=Math.ceil(height/gridW);
  const grid = [];
  for(let r=0;r<rows;r++) for(let c=0;c<cols;c++) {
    const cx=c*gridW+gridW/2, cy=r*gridW+gridW/2;
    let density = 0;
    centers.forEach(([px,py])=>{ const d=Math.sqrt((cx-px)**2+(cy-py)**2); density+=Math.exp(-d*d/(2*40*40)); });
    grid.push({x:c*gridW,y:r*gridW,d:density});
  }
  const maxD = d3.max(grid,d=>d.d);
  const color = d3.scaleSequential(d3.interpolateInferno).domain([0,maxD]);
  svg.selectAll('rect.cell').data(grid).join('rect')
    .attr('x',d=>d.x).attr('y',d=>d.y).attr('width',gridW).attr('height',gridW)
    .attr('fill',d=>color(d.d)).attr('opacity',0.7);
}

function renderChoropleth(id) {
  const {svg,width,height} = makeSVG(document.getElementById(id),400,280,{top:10,right:10,bottom:10,left:10});
  const regions = [];
  const cols=5, rows=4;
  const rw=width/cols, rh=height/rows;
  for(let r=0;r<rows;r++) for(let c=0;c<cols;c++) {
    regions.push({x:c*rw,y:r*rh,w:rw,h:rh,v:Math.random()});
  }
  const color = d3.scaleSequential(d3.interpolateBlues).domain([0,1]);
  svg.selectAll('rect').data(regions).join('rect')
    .attr('x',d=>d.x+1).attr('y',d=>d.y+1).attr('width',d=>d.w-2).attr('height',d=>d.h-2)
    .attr('fill',d=>color(d.v)).attr('rx',3).attr('stroke','#0c0d18').attr('stroke-width',1);
}

function renderCartogram(id) {
  const {svg,width,height} = makeSVG(document.getElementById(id),400,280,{top:10,right:10,bottom:10,left:10});
  const g = svg.append('g').attr('transform',`translate(${width/2},${height/2})`);
  const regions = Array.from({length:15}, (_,i) => ({
    angle: (i/15)*Math.PI*2,
    dist: 40+Math.random()*40,
    value: Math.random()*50+10
  }));
  const r = d3.scaleSqrt().domain([10,60]).range([12,35]);
  const color = d3.scaleSequential(d3.interpolateYlOrRd).domain([10,60]);
  regions.forEach(d => {
    g.append('circle')
      .attr('cx', Math.cos(d.angle)*d.dist).attr('cy', Math.sin(d.angle)*d.dist)
      .attr('r', r(d.value)).attr('fill', color(d.value)).attr('opacity',0.7)
      .attr('stroke','#0c0d18').attr('stroke-width',1);
  });
}

function renderFlowMap(id) {
  const {svg,width,height} = makeSVG(document.getElementById(id),400,280,{top:10,right:10,bottom:10,left:10});
  svg.append('rect').attr('width',width).attr('height',height).attr('fill','rgba(255,255,255,0.02)').attr('rx',8);
  const cities = [[80,60],[250,40],[150,140],[300,160],[100,200]];
  const flows = [[0,1,5],[0,2,3],[1,3,4],[2,4,2],[3,2,3],[1,4,2]];
  flows.forEach(([from,to,w]) => {
    svg.append('line').attr('x1',cities[from][0]).attr('y1',cities[from][1])
      .attr('x2',cities[to][0]).attr('y2',cities[to][1])
      .attr('stroke',C.conv[0]).attr('stroke-width',w).attr('opacity',0.4);
  });
  cities.forEach(([x,y]) => {
    svg.append('circle').attr('cx',x).attr('cy',y).attr('r',5).attr('fill',C.conv[0]).attr('stroke','#0c0d18').attr('stroke-width',2);
  });
}

function renderArcMap(id) {
  const {svg,width,height} = makeSVG(document.getElementById(id),400,280,{top:10,right:10,bottom:10,left:10});
  svg.append('rect').attr('width',width).attr('height',height).attr('fill','rgba(255,255,255,0.02)').attr('rx',8);
  const cities = [[80,180],[250,160],[150,100],[300,60],[180,200]];
  const flows = [[0,1,C.art[0]],[0,2,C.art[1]],[1,3,C.art[2]],[2,4,C.art[3]],[3,0,C.art[4]]];
  flows.forEach(([from,to,color]) => {
    const [x1,y1]=cities[from], [x2,y2]=cities[to];
    const mx=(x1+x2)/2, my=Math.min(y1,y2)-40-Math.random()*30;
    svg.append('path')
      .attr('d',`M${x1},${y1} Q${mx},${my} ${x2},${y2}`)
      .attr('fill','none').attr('stroke',color).attr('stroke-width',2).attr('opacity',0.6);
  });
  cities.forEach(([x,y]) => {
    svg.append('circle').attr('cx',x).attr('cy',y).attr('r',5).attr('fill','#fff').attr('opacity',0.8);
  });
}

// ---------- 07 NETWORK ----------

function renderForceGraph(id) {
  const nodes = Array.from({length:20}, (_,i) => ({id:i}));
  const links = [];
  for(let i=1;i<20;i++) { links.push({source:Math.floor(Math.random()*i),target:i}); }
  for(let i=0;i<8;i++) { links.push({source:Math.floor(Math.random()*20),target:Math.floor(Math.random()*20)}); }

  const {svg,width,height} = makeSVG(document.getElementById(id),400,280,{top:10,right:10,bottom:10,left:10});
  const sim = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).id(d=>d.id).distance(35))
    .force('charge', d3.forceManyBody().strength(-60))
    .force('center', d3.forceCenter(width/2,height/2))
    .stop();
  for(let i=0;i<200;i++) sim.tick();

  svg.selectAll('line').data(links).join('line')
    .attr('x1',d=>d.source.x).attr('y1',d=>d.source.y)
    .attr('x2',d=>d.target.x).attr('y2',d=>d.target.y)
    .attr('stroke',C.axis).attr('stroke-width',1);
  svg.selectAll('circle').data(nodes).join('circle')
    .attr('cx',d=>d.x).attr('cy',d=>d.y).attr('r',5)
    .attr('fill',C.conv[0]).attr('stroke','#0c0d18').attr('stroke-width',1.5);
}

function renderArcDiagram(id) {
  const n = 15;
  const nodes = Array.from({length:n}, (_,i) => ({id:i, name:String.fromCharCode(65+i)}));
  const links = [];
  for(let i=0;i<20;i++) links.push({source:Math.floor(Math.random()*n),target:Math.floor(Math.random()*n)});

  const {svg,width,height} = makeSVG(document.getElementById(id),400,280,{top:20,right:20,bottom:30,left:20});
  const x = d3.scalePoint().domain(nodes.map(d=>d.id)).range([0,width]).padding(0.2);

  links.forEach(l => {
    const x1=x(l.source), x2=x(l.target);
    const r = Math.abs(x2-x1)/2;
    svg.append('path')
      .attr('d',`M${x1},${height} A${r},${r} 0 0,1 ${x2},${height}`)
      .attr('fill','none').attr('stroke',C.art[Math.abs(l.source-l.target)%C.art.length]).attr('stroke-width',1.5).attr('opacity',0.3);
  });
  nodes.forEach(n => {
    svg.append('circle').attr('cx',x(n.id)).attr('cy',height).attr('r',4)
      .attr('fill',C.art[n.id%C.art.length]);
    svg.append('text').attr('x',x(n.id)).attr('y',height+14).attr('text-anchor','middle')
      .attr('fill',C.muted).style('font-size','7px').style('font-family','DM Mono').text(n.name);
  });
}

function renderAdjMatrix(id) {
  const n = 12;
  const labels = Array.from({length:n}, (_,i) => String.fromCharCode(65+i));
  const matrix = Array.from({length:n}, ()=>Array.from({length:n}, ()=>Math.random()>0.65?Math.random():0));
  const {svg,width,height} = makeSVG(document.getElementById(id),400,280,{top:25,right:10,bottom:10,left:25});
  const s = Math.min(width,height)/n;
  const color = d3.scaleSequential(d3.interpolateViridis).domain([0,1]);

  for(let i=0;i<n;i++) for(let j=0;j<n;j++) {
    svg.append('rect').attr('x',j*s).attr('y',i*s).attr('width',s-1).attr('height',s-1)
      .attr('fill',matrix[i][j]>0?color(matrix[i][j]):'rgba(255,255,255,0.02)').attr('rx',1);
  }
  labels.forEach((l,i) => {
    svg.append('text').attr('x',i*s+s/2).attr('y',-6).attr('text-anchor','middle')
      .attr('fill',C.muted).style('font-size','7px').style('font-family','DM Mono').text(l);
    svg.append('text').attr('x',-6).attr('y',i*s+s/2+3).attr('text-anchor','end')
      .attr('fill',C.muted).style('font-size','7px').style('font-family','DM Mono').text(l);
  });
}

function renderBundledEdges(id) {
  const n = 20;
  const {svg} = makeSVG(document.getElementById(id),400,280,{top:0,right:0,bottom:0,left:0});
  const g = svg.append('g').attr('transform','translate(200,145)');
  const r = 100;
  const nodes = Array.from({length:n}, (_,i) => {
    const a = (i/n)*Math.PI*2-Math.PI/2;
    return {id:i, x:Math.cos(a)*r, y:Math.sin(a)*r, a};
  });

  for(let i=0;i<30;i++) {
    const s=Math.floor(Math.random()*n), t=Math.floor(Math.random()*n);
    if(s===t) continue;
    const ctrl = {x:nodes[s].x*0.15+nodes[t].x*0.15, y:nodes[s].y*0.15+nodes[t].y*0.15};
    svg.select('g').append('path')
      .attr('d',`M${nodes[s].x},${nodes[s].y} Q${ctrl.x},${ctrl.y} ${nodes[t].x},${nodes[t].y}`)
      .attr('fill','none').attr('stroke',C.art[s%C.art.length]).attr('stroke-width',1).attr('opacity',0.2);
  }
  nodes.forEach(n => {
    g.append('circle').attr('cx',n.x).attr('cy',n.y).attr('r',3)
      .attr('fill',C.art[n.id%C.art.length]);
  });
}

function renderTreeLayout(id) {
  const data = {name:'A',children:[
    {name:'B',children:[{name:'D'},{name:'E',children:[{name:'H'},{name:'I'}]}]},
    {name:'C',children:[{name:'F'},{name:'G',children:[{name:'J'}]}]}
  ]};
  const {svg,width,height} = makeSVG(document.getElementById(id),400,280,{top:20,right:30,bottom:20,left:30});
  const root = d3.tree().size([width,height])(d3.hierarchy(data));

  svg.selectAll('path').data(root.links()).join('path')
    .attr('d',d3.linkVertical().x(d=>d.x).y(d=>d.y))
    .attr('fill','none').attr('stroke',C.conv[0]).attr('stroke-width',1.5).attr('opacity',0.5);
  svg.selectAll('circle').data(root.descendants()).join('circle')
    .attr('cx',d=>d.x).attr('cy',d=>d.y).attr('r',5)
    .attr('fill',d=>d.children?C.conv[0]:C.conv[2]).attr('stroke','#0c0d18').attr('stroke-width',2);
}

function renderRadialTree(id) {
  const data = {name:'A',children:[
    {name:'B',children:[{name:'D'},{name:'E',children:[{name:'H'},{name:'I'}]}]},
    {name:'C',children:[{name:'F'},{name:'G',children:[{name:'J'},{name:'K'}]}]}
  ]};
  const {svg} = makeSVG(document.getElementById(id),400,280,{top:0,right:0,bottom:0,left:0});
  const g = svg.append('g').attr('transform','translate(200,145)');
  const root = d3.tree().size([2*Math.PI, 90])(d3.hierarchy(data));

  g.selectAll('path').data(root.links()).join('path')
    .attr('d', d3.linkRadial().angle(d=>d.x).radius(d=>d.y))
    .attr('fill','none').attr('stroke',C.art[2]).attr('stroke-width',1.5).attr('opacity',0.5);
  g.selectAll('circle').data(root.descendants()).join('circle')
    .attr('cx',d=>d.y*Math.cos(d.x-Math.PI/2)).attr('cy',d=>d.y*Math.sin(d.x-Math.PI/2))
    .attr('r',5).attr('fill',d=>d.children?C.art[2]:C.art[0]).attr('stroke','#0c0d18').attr('stroke-width',2);
}

function renderSankey(id) {
  const {svg,width,height} = makeSVG(document.getElementById(id),400,280,{top:15,right:10,bottom:15,left:10});
  const nodes = [{name:'A',x:0},{name:'B',x:0},{name:'C',x:0},{name:'D',x:1},{name:'E',x:1},{name:'F',x:2},{name:'G',x:2}];
  const flows = [{s:0,t:3,v:30},{s:0,t:4,v:15},{s:1,t:3,v:20},{s:1,t:4,v:10},{s:2,t:4,v:25},{s:3,t:5,v:35},{s:3,t:6,v:15},{s:4,t:5,v:20},{s:4,t:6,v:30}];

  const layers = [nodes.filter(n=>n.x===0),nodes.filter(n=>n.x===1),nodes.filter(n=>n.x===2)];
  const colX = [0,width*0.4,width*0.8];
  const nodeW = 18;

  layers.forEach((layer,li) => {
    const totalH = layer.reduce((s,n,i) => {
      const inFlow = flows.filter(f=>f.t===nodes.indexOf(n)).reduce((a,f)=>a+f.v,0);
      const outFlow = flows.filter(f=>f.s===nodes.indexOf(n)).reduce((a,f)=>a+f.v,0);
      n.h = Math.max(inFlow,outFlow)/50*height*0.6;
      return s+n.h;
    },0);
    let yOff = (height-totalH-(layer.length-1)*8)/2;
    layer.forEach(n => {
      n.px = colX[li]; n.py = yOff;
      svg.append('rect').attr('x',n.px).attr('y',n.py).attr('width',nodeW).attr('height',n.h)
        .attr('fill',C.conv[nodes.indexOf(n)%C.conv.length]).attr('rx',3);
      yOff += n.h+8;
    });
  });

  flows.forEach(f => {
    const sn = nodes[f.s], tn = nodes[f.t];
    const h = f.v/50*height*0.6;
    const x0 = sn.px+nodeW, x1 = tn.px;
    const y0 = sn.py+(sn._outOff||0), y1 = tn.py+(tn._inOff||0);
    sn._outOff = (sn._outOff||0)+h; tn._inOff = (tn._inOff||0)+h;
    const mx = (x0+x1)/2;
    svg.append('path')
      .attr('d',`M${x0},${y0} C${mx},${y0} ${mx},${y1} ${x1},${y1} L${x1},${y1+h} C${mx},${y1+h} ${mx},${y0+h} ${x0},${y0+h} Z`)
      .attr('fill',C.conv[f.s%C.conv.length]).attr('opacity',0.2);
  });
}

function renderAlluvial(id) {
  const {svg,width,height} = makeSVG(document.getElementById(id),400,280,{top:15,right:10,bottom:15,left:10});
  const cols = 3, nodeW = 14;
  const groups = [
    [{n:'A',v:40},{n:'B',v:35},{n:'C',v:25}],
    [{n:'D',v:30},{n:'E',v:45},{n:'F',v:25}],
    [{n:'G',v:50},{n:'H',v:50}]
  ];
  const colX = Array.from({length:cols},(_,i)=>i/(cols-1)*width*(1-nodeW/width));

  groups.forEach((group,gi) => {
    const total = d3.sum(group,d=>d.v);
    let yOff = (height-total/100*height*0.85)/2;
    group.forEach(node => {
      const h = node.v/100*height*0.85;
      node.px = colX[gi]; node.py = yOff; node.h = h;
      svg.append('rect').attr('x',node.px).attr('y',node.py).attr('width',nodeW).attr('height',h)
        .attr('fill',C.art[groups.flat().indexOf(node)%C.art.length]).attr('rx',3).attr('opacity',0.8);
      yOff += h+4;
    });
  });

  // Connect adjacent columns
  for(let gi=0;gi<cols-1;gi++) {
    const from = groups[gi], to = groups[gi+1];
    from.forEach((fn,fi) => {
      to.forEach((tn,ti) => {
        const share = Math.random()*fn.v*0.4;
        if(share < 3) return;
        const h = share/100*height*0.85;
        const x0=fn.px+nodeW, x1=tn.px;
        const y0=fn.py+fi*h, y1=tn.py+ti*h;
        const mx=(x0+x1)/2;
        svg.append('path')
          .attr('d',`M${x0},${y0} C${mx},${y0} ${mx},${y1} ${x1},${y1} L${x1},${y1+h} C${mx},${y1+h} ${mx},${y0+h} ${x0},${y0+h} Z`)
          .attr('fill',C.art[fi%C.art.length]).attr('opacity',0.15);
      });
    });
  }
}

// ---------- 08 TEXT DATA ----------

function renderWordBar(id) {
  const words = ['data','visual','chart','design','color','pattern','graph','form','shape','encode'];
  const vals = [48,42,38,35,30,28,24,20,18,15];
  const {svg,width,height} = makeSVG(document.getElementById(id),400,280,{top:10,right:15,bottom:15,left:55});
  const y = d3.scaleBand().domain(words).range([0,height]).padding(0.25);
  const x = d3.scaleLinear().domain([0,55]).range([0,width]);
  svg.selectAll('rect').data(words.map((w,i)=>({w,v:vals[i]}))).join('rect')
    .attr('y',d=>y(d.w)).attr('x',0).attr('width',d=>x(d.v)).attr('height',y.bandwidth())
    .attr('fill',C.conv[0]).attr('rx',2).attr('opacity',0.8);
  svg.selectAll('text').data(words.map((w,i)=>({w,v:vals[i]}))).join('text')
    .attr('x',-6).attr('y',d=>y(d.w)+y.bandwidth()/2)
    .attr('text-anchor','end').attr('dominant-baseline','middle')
    .attr('fill',C.muted).style('font-size','8px').style('font-family','DM Mono').text(d=>d.w);
}

function renderWordBubble(id) {
  const words = ['data','visual','chart','design','color','pattern','graph','form','shape','encode','type','flow','map','tree','arc'];
  const vals = [48,42,38,35,30,28,24,20,18,15,14,13,12,11,10];
  const data = {name:'root',children:words.map((w,i)=>({name:w,value:vals[i]}))};
  const {svg} = makeSVG(document.getElementById(id),400,280,{top:0,right:0,bottom:0,left:0});
  const root = d3.pack().size([390,270]).padding(3)(d3.hierarchy(data).sum(d=>d.value));
  const g = svg.append('g').attr('transform','translate(5,5)');
  g.selectAll('circle').data(root.leaves()).join('circle')
    .attr('cx',d=>d.x).attr('cy',d=>d.y).attr('r',d=>d.r)
    .attr('fill',(d,i)=>C.art[i%C.art.length]).attr('opacity',0.5)
    .attr('stroke',(d,i)=>C.art[i%C.art.length]).attr('stroke-width',1);
  g.selectAll('text').data(root.leaves().filter(d=>d.r>12)).join('text')
    .attr('x',d=>d.x).attr('y',d=>d.y+3).attr('text-anchor','middle')
    .attr('fill','rgba(255,255,255,0.8)').style('font-size',d=>Math.min(d.r*0.65,11)+'px').style('font-family','DM Mono').text(d=>d.data.name);
}

function renderSentimentLine(id) {
  const n = 30;
  const data = Array.from({length:n}, (_,i) => ({t:i, v:Math.sin(i/4)*0.5+Math.random()*0.4-0.2}));
  const {svg,width,height} = makeSVG(document.getElementById(id));
  const x = d3.scaleLinear().domain([0,n-1]).range([0,width]);
  const y = d3.scaleLinear().domain([-1,1]).range([height,0]);
  drawAxis(svg,x,y,width,height,{yTicks:3});
  svg.append('line').attr('x1',0).attr('x2',width).attr('y1',y(0)).attr('y2',y(0))
    .attr('stroke','rgba(255,255,255,0.1)').attr('stroke-dasharray','4,4');
  const line = d3.line().x(d=>x(d.t)).y(d=>y(d.v)).curve(d3.curveMonotoneX);
  svg.append('path').datum(data).attr('d',line)
    .attr('fill','none').attr('stroke',C.conv[0]).attr('stroke-width',2);
}

function renderColorStream(id) {
  const n = 40;
  const data = Array.from({length:n}, (_,i) => ({t:i, v:Math.sin(i/5)*0.6+Math.random()*0.3-0.15}));
  const {svg,width,height} = makeSVG(document.getElementById(id),400,280,{top:10,right:10,bottom:10,left:10});
  const x = d3.scaleLinear().domain([0,n-1]).range([0,width]);
  const bandH = height;

  data.forEach((d,i) => {
    if(i>=n-1) return;
    const color = d.v > 0.2 ? C.art[2] : d.v < -0.2 ? C.art[0] : C.art[1];
    const w = x(1)-x(0);
    svg.append('rect').attr('x',x(i)).attr('y',0).attr('width',w+0.5).attr('height',bandH)
      .attr('fill',color).attr('opacity',0.15+Math.abs(d.v)*0.5);
    svg.append('rect').attr('x',x(i)).attr('y',bandH*0.35).attr('width',w+0.5).attr('height',bandH*0.3)
      .attr('fill',color).attr('opacity',0.3+Math.abs(d.v)*0.4);
  });
  svg.append('text').attr('x',width/2).attr('y',height/2+3).attr('text-anchor','middle')
    .attr('fill','rgba(255,255,255,0.2)').style('font-size','9px').style('font-family','DM Mono').text('sentiment over time →');
}

function renderEmbeddingScatter(id) {
  const clusters = [
    {cx:25,cy:30,n:20,label:'Topic A'},
    {cx:65,cy:60,n:25,label:'Topic B'},
    {cx:40,cy:75,n:15,label:'Topic C'},
    {cx:80,cy:25,n:18,label:'Topic D'}
  ];
  const data = [];
  clusters.forEach((cl,ci) => {
    for(let i=0;i<cl.n;i++) data.push({x:cl.cx+randNormal(0,8),y:cl.cy+randNormal(0,8),c:ci});
  });
  const {svg,width,height} = makeSVG(document.getElementById(id));
  const x = d3.scaleLinear().domain([0,100]).range([0,width]);
  const y = d3.scaleLinear().domain([0,100]).range([height,0]);
  drawAxis(svg,x,y,width,height);
  svg.selectAll('circle').data(data).join('circle')
    .attr('cx',d=>x(d.x)).attr('cy',d=>y(d.y)).attr('r',3)
    .attr('fill',d=>C.conv[d.c]).attr('opacity',0.6);
}

function renderTSNE(id) {
  const clusters = [
    {cx:25,cy:30,n:25},{cx:70,cy:55,n:30},{cx:35,cy:75,n:20},{cx:80,cy:20,n:22},{cx:55,cy:45,n:15}
  ];
  const data = [];
  clusters.forEach((cl,ci) => {
    for(let i=0;i<cl.n;i++) data.push({x:cl.cx+randNormal(0,6),y:cl.cy+randNormal(0,6),c:ci});
  });
  const {svg,width,height} = makeSVG(document.getElementById(id),400,280,{top:10,right:10,bottom:10,left:10});
  const x = d3.scaleLinear().domain([0,100]).range([0,width]);
  const y = d3.scaleLinear().domain([0,100]).range([height,0]);

  // Contour-like backgrounds for clusters
  clusters.forEach((cl,ci) => {
    [18,12,6].forEach((r,ri) => {
      svg.append('circle').attr('cx',x(cl.cx)).attr('cy',y(cl.cy)).attr('r',r*3)
        .attr('fill',C.art[ci]).attr('opacity',0.03+ri*0.02);
    });
  });
  svg.selectAll('circle.pt').data(data).join('circle')
    .attr('cx',d=>x(d.x)).attr('cy',d=>y(d.y)).attr('r',3)
    .attr('fill',d=>C.art[d.c]).attr('opacity',0.7);
}

// ---------- 09 UNCONVENTIONAL ----------

function renderFlowField(id) {
  const el = document.getElementById(id);
  const {ctx,width,height} = makeCanvas(el);

  const cols=30, rows=20, cellW=width/cols, cellH=height/rows;
  const field = [];
  for(let r=0;r<rows;r++) for(let c=0;c<cols;c++) {
    field.push(Math.sin(c*0.3)*Math.cos(r*0.4)*Math.PI + Math.cos(c*0.15+r*0.2)*0.5);
  }

  ctx.fillStyle = '#0c0d18';
  ctx.fillRect(0,0,width,height);

  for(let p=0;p<400;p++) {
    let px=Math.random()*width, py=Math.random()*height;
    const hue = (px/width*360 + py/height*60) % 360;
    ctx.strokeStyle = `hsla(${hue},70%,60%,0.15)`;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(px,py);
    for(let s=0;s<30;s++) {
      const c=Math.floor(px/cellW), r=Math.floor(py/cellH);
      if(c<0||c>=cols||r<0||r>=rows) break;
      const angle = field[r*cols+c];
      px += Math.cos(angle)*2;
      py += Math.sin(angle)*2;
      ctx.lineTo(px,py);
    }
    ctx.stroke();
  }
}

function renderParticleSystem(id) {
  const el = document.getElementById(id);
  const {canvas,ctx,width,height} = makeCanvas(el);
  const data = Array.from({length:60}, ()=>Math.random()*100);
  const particles = data.map((v,i) => ({
    x: (i/data.length)*width,
    y: height/2,
    vx: (Math.random()-0.5)*1,
    vy: (v-50)/25,
    life: 1,
    color: d3.interpolatePlasma(v/100),
    size: 1+v/30
  }));

  let frame = 0;
  function animate() {
    if(frame > 150) return;
    ctx.fillStyle = 'rgba(12,13,24,0.08)';
    ctx.fillRect(0,0,width,height);
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.02;
      p.life *= 0.995;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size*p.life, 0, Math.PI*2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life*0.6;
      ctx.fill();
      ctx.globalAlpha = 1;
      // Wrap
      if(p.x<0) p.x=width; if(p.x>width) p.x=0;
      if(p.y>height) { p.y=height/2; p.vy=(data[Math.floor(Math.random()*data.length)]-50)/25; p.life=1; }
    });
    frame++;
    requestAnimationFrame(animate);
  }
  ctx.fillStyle = '#0c0d18';
  ctx.fillRect(0,0,width,height);
  animate();
}

function renderDearData(id) {
  const {svg,width,height} = makeSVG(document.getElementById(id),400,280,{top:15,right:15,bottom:15,left:15});
  svg.append('rect').attr('width',width).attr('height',height).attr('fill','#F5F0E8').attr('rx',6);

  const data = [3,5,2,7,4,6,1,5,3,8,2,4,6,3,5];
  const spacing = width/(data.length+1);

  data.forEach((v,i) => {
    const x = spacing*(i+1);
    const baseY = height*0.75;
    // Hand-drawn wobbly lines
    for(let j=0;j<v;j++) {
      const y = baseY - j*12 - 8;
      const shape = Math.floor(Math.random()*3);
      const colors = ['#E8453C','#2DC653','#00B4D8','#FFB703','#9D4EDD'];
      const c = colors[j%colors.length];
      if(shape===0) { // circle
        svg.append('circle').attr('cx',x+randNormal(0,1)).attr('cy',y+randNormal(0,1)).attr('r',4+Math.random()*2)
          .attr('fill','none').attr('stroke',c).attr('stroke-width',1.5);
      } else if(shape===1) { // cross
        svg.append('line').attr('x1',x-3).attr('x2',x+3).attr('y1',y-3).attr('y2',y+3).attr('stroke',c).attr('stroke-width',1.5);
        svg.append('line').attr('x1',x+3).attr('x2',x-3).attr('y1',y-3).attr('y2',y+3).attr('stroke',c).attr('stroke-width',1.5);
      } else { // triangle
        svg.append('polygon').attr('points',`${x},${y-4} ${x-4},${y+3} ${x+4},${y+3}`)
          .attr('fill','none').attr('stroke',c).attr('stroke-width',1.5);
      }
    }
    // Wobbly baseline
    svg.append('line').attr('x1',x-6).attr('x2',x+6).attr('y1',baseY+2).attr('y2',baseY+2)
      .attr('stroke','#333').attr('stroke-width',0.8);
  });

  svg.append('text').attr('x',width/2).attr('y',height-2).attr('text-anchor','middle')
    .attr('fill','#666').style('font-size','8px').style('font-family','DM Mono').text('each symbol = one unit');
}

function renderDataTypography(id) {
  const {svg,width,height} = makeSVG(document.getElementById(id),400,280,{top:10,right:10,bottom:10,left:10});
  const word = 'DATA';
  const data = [85,42,67,93];
  const letterW = width/word.length;
  const color = d3.scaleSequential(d3.interpolatePlasma).domain([0,100]);

  word.split('').forEach((letter,i) => {
    const x = i*letterW+letterW/2;
    const val = data[i];
    const size = 30 + val*0.5;
    const weight = val > 50 ? 700 : 400;

    // Background bar
    svg.append('rect').attr('x',i*letterW+4).attr('y',height*(1-val/100))
      .attr('width',letterW-8).attr('height',height*val/100)
      .attr('fill',color(val)).attr('opacity',0.1).attr('rx',4);

    svg.append('text').attr('x',x).attr('y',height/2+size*0.35)
      .attr('text-anchor','middle').attr('fill',color(val))
      .style('font-size',size+'px').style('font-family','DM Serif Display')
      .style('font-weight',weight).text(letter);

    svg.append('text').attr('x',x).attr('y',height-8)
      .attr('text-anchor','middle').attr('fill',C.muted)
      .style('font-size','8px').style('font-family','DM Mono').text(val+'%');
  });
}

// ---------- LAZY RENDERER ----------

const vizMap = {
  'bar-chart': renderBarChart,
  'lollipop-chart': renderLollipop,
  'hbar-chart': renderHBar,
  'bump-chart': renderBumpChart,
  'grouped-bar': renderGroupedBar,
  'dumbbell-plot': renderDumbbell,
  'ordered-bar': renderOrderedBar,
  'radial-bar': renderRadialBar,
  'histogram': renderHistogram,
  'beeswarm': renderBeeswarm,
  'box-plot': renderBoxPlot,
  'violin-plot': renderViolin,
  'kde-overlay': renderKDE,
  'ridgeline': renderRidgeline,
  'count-bar': renderCountBar,
  'waffle-dist': renderWaffleDist,
  'scatter-plot': renderScatter,
  'hexbin-plot': renderHexbin,
  'corr-heatmap': renderCorrHeatmap,
  'chord-diagram': renderChord,
  'bubble-chart': renderBubble,
  'color-scatter': renderColorScatter,
  'parallel-coords': renderParallel,
  'radial-parallel': renderRadialParallel,
  'pie-chart': renderPie,
  'waffle-chart': renderWaffle,
  'treemap': renderTreemap,
  'circle-packing': renderCirclePacking,
  'stacked-area': renderStackedArea,
  'streamgraph': renderStreamgraph,
  'nested-treemap': renderNestedTreemap,
  'marimekko': renderMarimekko,
  'line-chart': renderLineChart,
  'spiral-plot': renderSpiral,
  'multi-line': renderMultiLine,
  'horizon-chart': renderHorizon,
  'seasonal-decomp': renderSeasonalDecomp,
  'radial-clock': renderRadialClock,
  'slope-graph': renderSlope,
  'connected-scatter': renderConnectedScatter,
  'dot-map': renderDotMap,
  'density-heatmap': renderDensityHeatmap,
  'choropleth': renderChoropleth,
  'cartogram': renderCartogram,
  'flow-map': renderFlowMap,
  'arc-map': renderArcMap,
  'force-graph': renderForceGraph,
  'arc-diagram': renderArcDiagram,
  'adj-matrix': renderAdjMatrix,
  'bundled-edges': renderBundledEdges,
  'tree-layout': renderTreeLayout,
  'radial-tree': renderRadialTree,
  'sankey': renderSankey,
  'alluvial': renderAlluvial,
  'word-bar': renderWordBar,
  'word-bubble': renderWordBubble,
  'sentiment-line': renderSentimentLine,
  'color-stream': renderColorStream,
  'embedding-scatter': renderEmbeddingScatter,
  'tsne-landscape': renderTSNE,
  'flow-field': renderFlowField,
  'particle-system': renderParticleSystem,
  'dear-data': renderDearData,
  'data-typography': renderDataTypography
};

const rendered = new Set();

const vizObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.id;
      if (!rendered.has(id) && vizMap[id]) {
        try { vizMap[id](id); } catch(e) { console.warn('Viz error:', id, e); }
        rendered.add(id);
      }
    }
  });
}, { rootMargin: '200px 0px' });

document.querySelectorAll('.viz-box[id]').forEach(el => vizObserver.observe(el));
