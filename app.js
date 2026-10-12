const $ = id => document.getElementById(id);

// Format with SI prefixes
function si(v, unit) {
  if (!isFinite(v)) return "—";
  if (v === 0) return "0 " + unit;
  const p = [[1e9,"G"],[1e6,"M"],[1e3,"k"],[1,""],[1e-3,"m"],[1e-6,"µ"],[1e-9,"n"],[1e-12,"p"]];
  const a = Math.abs(v);
  for (const [s, n] of p) if (a >= s) return (v / s).toPrecision(4).replace(/\.?0+$/, "") + " " + n + unit;
  return v.toExponential(3) + " " + unit;
}

// Theme
const root = document.documentElement;
try { const t = localStorage.getItem("theme"); if (t) root.dataset.theme = t; } catch (e) {}
$("theme").onclick = () => {
  const t = root.dataset.theme === "dark" ? "light" : "dark";
  root.dataset.theme = t;
  try { localStorage.setItem("theme", t); } catch (e) {}
};

// Tabs
document.querySelectorAll("#tabs button").forEach(b => b.onclick = () => {
  document.querySelectorAll("#tabs button, .panel").forEach(e => e.classList.remove("active"));
  b.classList.add("active");
  $(b.dataset.tab).classList.add("active");
  if (b.dataset.tab === "rc") drawRC();
});

// Ohm's law
function ohm() {
  const val = id => { const x = $(id).value; return x === "" ? null : parseFloat(x); };
  let V = val("ohm-v"), I = val("ohm-i"), R = val("ohm-r"), P = val("ohm-p");
  const known = [V, I, R, P].filter(x => x !== null).length;
  const msg = $("ohm-msg"); msg.className = "msg";
  if (known !== 2) { msg.textContent = "Enter exactly two values."; msg.classList.add("err"); return; }
  if (V !== null && I !== null) { R = V / I; P = V * I; }
  else if (V !== null && R !== null) { I = V / R; P = V * V / R; }
  else if (V !== null && P !== null) { I = P / V; R = V * V / P; }
  else if (I !== null && R !== null) { V = I * R; P = I * I * R; }
  else if (I !== null && P !== null) { V = P / I; R = P / (I * I); }
  else { V = Math.sqrt(P * R); I = Math.sqrt(P / R); }
  const set = (id, x) => $(id).value = isFinite(x) ? +x.toPrecision(6) : "";
  set("ohm-v", V); set("ohm-i", I); set("ohm-r", R); set("ohm-p", P);
  msg.textContent = `V = ${si(V,"V")}, I = ${si(I,"A")}, R = ${si(R,"Ω")}, P = ${si(P,"W")}`;
}
$("ohm-calc").onclick = ohm;
$("ohm-clear").onclick = () => { ["ohm-v","ohm-i","ohm-r","ohm-p"].forEach(i => $(i).value = ""); $("ohm-msg").textContent = ""; };

// Resistor colors
const digits = [["Black","#000"],["Brown","#8b4513"],["Red","#e22"],["Orange","#f80"],["Yellow","#ee2"],["Green","#2a2"],["Blue","#22e"],["Violet","#82c"],["Grey","#888"],["White","#fff"]];
const mults = [...digits.map((d,i)=>[d[0],d[1],10**i]), ["Gold","#d4af37",0.1], ["Silver","#c0c0c0",0.01]];
const tols = [["Brown","#8b4513",1],["Red","#e22",2],["Green","#2a2",0.5],["Blue","#22e",0.25],["Violet","#82c",0.1],["Gold","#d4af37",5],["Silver","#c0c0c0",10]];
function fill(id, arr, def) { arr.forEach((c,i)=>{ const o=document.createElement("option"); o.value=i; o.textContent=c[0]; $(id).appendChild(o); }); $(id).value = def; }
fill("b1", digits.slice(1), 0); fill("b2", digits, 0); fill("b3", mults, 2); fill("b4", tols, 5);
function color() {
  const d1 = digits.slice(1)[$("b1").value], d2 = digits[$("b2").value], m = mults[$("b3").value], t = tols[$("b4").value];
  const val = (parseInt($("b1").value)+1) * 10 + parseInt($("b2").value);
  $("r1").style.background = d1[1]; $("r2").style.background = d2[1]; $("r3").style.background = m[1]; $("r4").style.background = t[1];
  $("color-out").textContent = `${si(val * m[2], "Ω")} ±${t[2]}%`;
}
["b1","b2","b3","b4"].forEach(i => $(i).onchange = color); color();

// Voltage divider
function divider() {
  const vin = +$("d-vin").value, r1 = +$("d-r1").value, r2 = +$("d-r2").value;
  if (r1 + r2 <= 0) { $("div-out").textContent = "R1 + R2 must be greater than 0."; return; }
  const vout = vin * r2 / (r1 + r2), i = vin / (r1 + r2);
  $("div-out").innerHTML = `Vout = ${si(vout,"V")}<br>Current = ${si(i,"A")}<br>Power = ${si(vin*i,"W")}`;
}
["d-vin","d-r1","d-r2"].forEach(i => $(i).oninput = divider); divider();

// RC
function drawRC() {
  const R = +$("rc-r").value, C = +$("rc-c").value * 1e-6, Vs = +$("rc-v").value, tau = R * C;
  $("rc-out").innerHTML = tau > 0
    ? `τ = ${si(tau,"s")}<br>Cutoff frequency = ${si(1/(2*Math.PI*tau),"Hz")}<br>Charged to 99% in ≈ ${si(5*tau,"s")}`
    : "Enter positive R and C.";
  const cv = $("rc-chart"), g = cv.getContext("2d"), w = cv.width, h = cv.height;
  g.clearRect(0,0,w,h);
  if (!(tau > 0)) return;
  const css = getComputedStyle(root);
  g.strokeStyle = css.getPropertyValue("--border"); g.fillStyle = css.getPropertyValue("--muted"); g.font = "12px sans-serif";
  const pad = 36;
  g.beginPath(); g.moveTo(pad,10); g.lineTo(pad,h-pad); g.lineTo(w-10,h-pad); g.stroke();
  g.fillText(si(Vs,"V"), 2, 20); g.fillText("0", 20, h-pad+4); g.fillText(si(5*tau,"s"), w-60, h-pad+16);
  g.strokeStyle = css.getPropertyValue("--accent"); g.lineWidth = 2; g.beginPath();
  for (let x = 0; x <= 1; x += 0.005) {
    const v = 1 - Math.exp(-5 * x);
    const px = pad + x * (w - pad - 10), py = (h - pad) - v * (h - pad - 20);
    x === 0 ? g.moveTo(px, py) : g.lineTo(px, py);
  }
  g.stroke(); g.lineWidth = 1;
}
["rc-r","rc-c","rc-v"].forEach(i => $(i).oninput = drawRC); drawRC();
