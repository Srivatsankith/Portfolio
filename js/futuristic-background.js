/* Ambient neural constellations for the portfolio background. */
function initFuturisticBackground(container) {
  if (!container) return;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { alpha: false });
  container.replaceChildren(canvas);
  let width = 0, height = 0, nodes = [], stars = [], animationFrame, lastTime = 0;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const clusters = [
    { x: 0.08, y: 0.22, sx: 0.22, sy: 0.24, hue: 190 },
    { x: 0.90, y: 0.28, sx: 0.20, sy: 0.30, hue: 275 },
    { x: 0.72, y: 0.82, sx: 0.30, sy: 0.18, hue: 210 }
  ];

  function makeNode(cluster, id) {
    const angle = Math.random() * Math.PI * 2, speed = 0.07 + Math.random() * 0.13;
    return { x: (cluster.x + (Math.random() - .5) * cluster.sx) * width, y: (cluster.y + (Math.random() - .5) * cluster.sy) * height,
      homeX: cluster.x * width, homeY: cluster.y * height, rangeX: cluster.sx * width * .55, rangeY: cluster.sy * height * .55,
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, radius: 2.1 + Math.random() * 2.1,
      hue: cluster.hue + (Math.random() - .5) * 20, phase: Math.random() * Math.PI * 2, id };
  }

  function setup() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = container.clientWidth; height = container.clientHeight;
    canvas.width = Math.max(1, Math.floor(width * ratio)); canvas.height = Math.max(1, Math.floor(height * ratio));
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const total = Math.max(34, Math.min(58, Math.round((width * height) / 33000)));
    nodes = Array.from({ length: total }, (_, id) => makeNode(clusters[id % clusters.length], id));
    stars = Array.from({ length: Math.round(total * 1.8) }, () => ({ x: Math.random() * width, y: Math.random() * height, radius: Math.random() * .7 + .15, phase: Math.random() * Math.PI * 2 }));
  }

  function drawAtmosphere(time) {
    ctx.fillStyle = "#050816"; ctx.fillRect(0, 0, width, height);
    [[width*.08,height*.18,"rgba(0,214,255,.11)"],[width*.92,height*.3,"rgba(156,91,255,.10)"],[width*.7,height*.84,"rgba(20,124,255,.075)"]].forEach(([x,y,color]) => {
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, Math.min(width, height) * .42);
      gradient.addColorStop(0, color); gradient.addColorStop(1, "rgba(5,8,22,0)"); ctx.fillStyle = gradient; ctx.fillRect(0, 0, width, height);
    });
    stars.forEach((star) => { ctx.globalAlpha = .16 + (Math.sin(time*.0008 + star.phase)+1)*.11; ctx.fillStyle="#b8eaff"; ctx.beginPath(); ctx.arc(star.x,star.y,star.radius,0,Math.PI*2); ctx.fill(); });
    ctx.globalAlpha = 1;
  }

  function update(delta, time) {
    nodes.forEach((node) => {
      node.x += node.vx * delta;
      node.y += node.vy * delta;
      node.x += Math.sin(time * 0.00055 + node.phase) * 0.08;
      node.y += Math.cos(time * 0.0007 + node.phase) * 0.12;
      if (Math.abs(node.x-node.homeX)>node.rangeX) node.vx*=-1;
      if (Math.abs(node.y-node.homeY)>node.rangeY) node.vy*=-1;
    });
  }

  function drawLink(from, to, time) {
    const dx=to.x-from.x, dy=to.y-from.y, distance=Math.hypot(dx,dy), alpha=Math.max(.035,.24*(1-distance/185));
    const curve=Math.sin(from.id*2.7+to.id)*13, midX=(from.x+to.x)/2-dy/distance*curve, midY=(from.y+to.y)/2+dx/distance*curve;
    ctx.beginPath(); ctx.moveTo(from.x,from.y); ctx.quadraticCurveTo(midX,midY,to.x,to.y); ctx.strokeStyle=`hsla(${from.hue},92%,68%,${alpha})`; ctx.lineWidth=.45; ctx.stroke();
    if ((from.id+to.id)%11===0) { const p=(time*.000075+from.id*.13)%1, q=1-p, x=q*q*from.x+2*q*p*midX+p*p*to.x, y=q*q*from.y+2*q*p*midY+p*p*to.y; ctx.beginPath(); ctx.arc(x,y,1.1,0,Math.PI*2); ctx.fillStyle="rgba(169,247,255,.82)"; ctx.fill(); }
  }

  function drawNetwork(time) {
    nodes.forEach((node,index) => nodes.slice(index+1).map((next)=>({next,distance:Math.hypot(next.x-node.x,next.y-node.y)})).filter(({distance})=>distance<185).sort((a,b)=>a.distance-b.distance).slice(0,2).forEach(({next})=>drawLink(node,next,time)));
    nodes.forEach((node) => { const pulse=.68+(Math.sin(time*.0011+node.phase)+1)*.16; ctx.beginPath(); ctx.arc(node.x,node.y,node.radius*pulse,0,Math.PI*2); ctx.fillStyle=`hsla(${node.hue},100%,76%,.9)`; ctx.shadowColor=`hsla(${node.hue},100%,70%,.9)`; ctx.shadowBlur=11; ctx.fill(); });
    ctx.shadowBlur=0;
  }

  function animate(time) { const delta=Math.min((time-lastTime)/16.67||1,2); lastTime=time; drawAtmosphere(time); if(!reducedMotion.matches) update(delta, time); drawNetwork(time); if(!reducedMotion.matches) animationFrame=requestAnimationFrame(animate); }
  const observer = new ResizeObserver(setup); observer.observe(container);
  const onMotionChange = () => { cancelAnimationFrame(animationFrame); lastTime=0; if(reducedMotion.matches) animate(0); else animationFrame=requestAnimationFrame(animate); };
  reducedMotion.addEventListener("change", onMotionChange); setup(); if(reducedMotion.matches) animate(0); else animationFrame=requestAnimationFrame(animate);
  return () => { observer.disconnect(); reducedMotion.removeEventListener("change",onMotionChange); cancelAnimationFrame(animationFrame); container.replaceChildren(); };
}
