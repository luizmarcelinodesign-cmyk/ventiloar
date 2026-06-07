import { useState, useEffect, useRef, useCallback } from 'react'

/* ═══════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════ */
const STORAGE_KEY = 'ventiloar-plantas-tecnicas'
const PAD = 48
const SC = [
  '#BA7517','#1D9E75','#534AB7','#D85A30','#D4537E',
  '#0F6E56','#185FA5','#993C1D','#6B21A8','#0E7490','#92400E','#065f46',
]

/* ═══════════════════════════════════════════════════════
   PURE HELPERS
   ═══════════════════════════════════════════════════════ */
function cfg(W, H) {
  return (W * H) <= 500
    ? { diam: 60, reach: 6, m2: 13, helPerSerie: 9, label: '60 cm', widthSingle: 6 }
    : { diam: 100, reach: 10, m2: 42, helPerSerie: 5, label: '100 cm', widthSingle: 10 }
}

function getDims(W, H) {
  if (W >= H) return { comp: W, larg: H, wallLong1: 'top', wallLong2: 'bottom', wallCurt1: 'left', wallCurt2: 'right' }
  return { comp: H, larg: W, wallLong1: 'left', wallLong2: 'right', wallCurt1: 'top', wallCurt2: 'bottom' }
}

function getMode(W, H) {
  const { larg } = getDims(W, H)
  const c = cfg(W, H)
  return larg <= c.widthSingle ? 'single' : 'double'
}

function isLargeSpaceMode(W, H) {
  const area = W * H
  const dm = getDims(W, H)
  return area > 500 && dm.comp > 8
}

function wallFanCount4m(wallLen) {
  return Math.max(2, Math.floor(wallLen / 4))
}

function findEntradaWall(entries, dm) {
  if (entries.length === 0) return dm.wallLong1
  const counts = {}
  entries.forEach(e => { counts[e.wall] = (counts[e.wall] || 0) + 1 })
  const walls = [dm.wallLong1, dm.wallLong2]
  const best = walls.reduce((a, b) => (counts[a] || 0) >= (counts[b] || 0) ? a : b)
  return (counts[best] || 0) > 0 ? best : dm.wallLong1
}

function totalNeeded(W, H, ports) {
  const c = cfg(W, H)
  const area = W * H
  const ne = ports.filter(p => p.type === 'entrada').length
  const ns = ports.filter(p => p.type === 'saida').length

  if (area <= 20) return Math.max(2, ne + ns)
  if (area <= 30) {
    if (ne > 0 && ns > 0) return Math.max(4, ne + ns + 2)
    if (ne > 0) return Math.max(3, ne + 2)
    return 3
  }

  const byArea = Math.ceil(area / c.m2)
  const dm = getDims(W, H)
  const md = getMode(W, H)
  let byWall
  if (md === 'single') {
    byWall = Math.ceil(dm.comp / c.reach)
  } else {
    const perim = 2 * (W + H)
    byWall = Math.ceil(perim / c.reach)
  }
  return Math.max(2, Math.max(byArea, byWall))
}

/* ─── Canvas geometry helpers (need canvas dimensions) ─── */
function makeGeom(W, H, cW, cH) {
  const iX = () => PAD
  const iY = () => PAD
  const fX = () => cW - PAD
  const fY = () => cH - PAD
  const flW = () => cW - PAD * 2
  const flH = () => cH - PAD * 2
  const toCX = mx => iX() + (mx / W) * flW()
  const toCY = my => iY() + (my / H) * flH()
  const toMX = cx => (cx - iX()) / flW() * W
  const toMY = cy => (cy - iY()) / flH() * H
  const ppm = () => flW() / W

  function wallSnap(cx, cy) {
    const o = [
      { wall: 'top',    px: Math.max(iX(), Math.min(fX(), cx)), py: iY(), inAng: Math.PI / 2 },
      { wall: 'bottom', px: Math.max(iX(), Math.min(fX(), cx)), py: fY(), inAng: -Math.PI / 2 },
      { wall: 'left',   px: iX(), py: Math.max(iY(), Math.min(fY(), cy)), inAng: 0 },
      { wall: 'right',  px: fX(), py: Math.max(iY(), Math.min(fY(), cy)), inAng: Math.PI },
    ]
    let best = null, bd = Infinity
    o.forEach(w => { const d = Math.hypot(w.px - cx, w.py - cy); if (d < bd) { bd = d; best = w } })
    return best
  }

  function isInsideFloor(cx, cy) {
    return cx > iX() + 10 && cx < fX() - 10 && cy > iY() + 10 && cy < fY() - 10
  }

  return { iX, iY, fX, fY, flW, flH, toCX, toCY, toMX, toMY, ppm, wallSnap, isInsideFloor }
}

function calcScale(W, H) {
  const maxW = Math.min(680, (typeof window !== 'undefined' ? window.innerWidth : 800) - 44)
  const ratio = W / H
  let w, h
  if (ratio >= 1) { w = maxW; h = Math.round(maxW / ratio) } else { h = Math.min(500, maxW); w = Math.round(h * ratio) }
  return { cW: Math.max(w, 240), cH: Math.max(h, 200) }
}

function maxFansForWall(wallLenM, spacing) {
  if (wallLenM <= 0 || spacing <= 0) return 1
  const usable = Math.max(0, wallLenM - 1)
  return Math.max(1, Math.floor(usable / spacing) + 1)
}

function wallInAng(w) {
  return { top: Math.PI / 2, bottom: -Math.PI / 2, left: 0, right: Math.PI }[w] || 0
}

function normAng(a) {
  a = a % (2 * Math.PI)
  if (a < 0) a += 2 * Math.PI
  return a
}

function blendA(a, b, t) {
  return Math.atan2(Math.sin(a) * (1 - t) + Math.sin(b) * t, Math.cos(a) * (1 - t) + Math.cos(b) * t)
}

function naturalFlow(entries, exits, iX, iY, flW, flH) {
  if (entries.length === 0 && exits.length === 0) return { fx: 0, fy: 0 }
  let ecx = iX + flW / 2, ecy = iY + flH / 2
  if (entries.length > 0) {
    ecx = entries.reduce((s, e) => s + e.px, 0) / entries.length
    ecy = entries.reduce((s, e) => s + e.py, 0) / entries.length
  }
  let scx = iX + flW / 2, scy = iY + flH / 2
  if (exits.length > 0) {
    scx = exits.reduce((s, e) => s + e.px, 0) / exits.length
    scy = exits.reduce((s, e) => s + e.py, 0) / exits.length
  }
  const dx = scx - ecx, dy = scy - ecy
  const len = Math.hypot(dx, dy)
  if (len < 1) return { fx: 0, fy: 0 }
  return { fx: dx / len, fy: dy / len }
}

function findDeadZone(fan, allPts, fanIdx, gridPts, reachPx, coneHalf) {
  const coverage = gridPts.map(gp => {
    let score = 0
    allPts.forEach((h, i) => {
      if (i === fanIdx) return
      if (h.ang === 0 && h.deg === 0 && i > fanIdx) return
      const dist = Math.hypot(gp.px - h.px, gp.py - h.py)
      if (dist > reachPx) return
      const toGp = Math.atan2(gp.py - h.py, gp.px - h.px)
      let diff = Math.abs(normAng(toGp) - normAng(h.ang))
      if (diff > Math.PI) diff = 2 * Math.PI - diff
      if (diff <= coneHalf * 1.2) score += 1
    })
    return { px: gp.px, py: gp.py, score }
  })
  const reachable = coverage.filter(gp => Math.hypot(gp.px - fan.px, gp.py - fan.py) <= reachPx * 1.3)
  if (reachable.length === 0) return null
  const minScore = Math.min(...reachable.map(r => r.score))
  const deadPts = reachable.filter(r => r.score === minScore)
  if (deadPts.length === 0) return null
  const dcx = deadPts.reduce((s, p) => s + p.px, 0) / deadPts.length
  const dcy = deadPts.reduce((s, p) => s + p.py, 0) / deadPts.length
  return Math.atan2(dcy - fan.py, dcx - fan.px)
}

function computeAngles(allPts, entries, exits, geom) {
  const { iX, iY, flW, flH, ppm } = geom
  const W_ = entries.length > 0 ? null : null // unused
  const flow = naturalFlow(entries, exits, iX(), iY(), flW(), flH())
  const flowAng = Math.atan2(flow.fy, flow.fx)
  const hasFlow = Math.hypot(flow.fx, flow.fy) > 0.1
  const cx = iX() + flW() / 2, cy = iY() + flH() / 2
  const RES = 8
  const gridPts = []
  for (let gx = 0; gx < RES; gx++) {
    for (let gy = 0; gy < RES; gy++) {
      gridPts.push({ px: iX() + ((gx + 0.5) / RES) * flW(), py: iY() + ((gy + 0.5) / RES) * flH() })
    }
  }
  const reachPx = ppm() * (allPts.length > 0 && allPts[0]._reach ? allPts[0]._reach : 6)
  const coneHalf = 0.42

  allPts.forEach((h, idx) => {
    const wallIn = wallInAng(h.wall)
    if (h.kind === 'saida') {
      let base = wallIn + Math.PI
      if (hasFlow) base = blendA(base, flowAng, 0.25)
      let d = Math.round(base * 180 / Math.PI)
      if (d < 0) d += 360
      h.ang = base; h.deg = d; return
    }
    if (h.kind === 'entrada') {
      let base = wallIn
      if (hasFlow) base = blendA(base, flowAng, 0.45)
      if (exits.length === 0) {
        const toCenter = Math.atan2(cy - h.py, cx - h.px)
        base = blendA(base, toCenter, 0.3)
      }
      let d = Math.round(base * 180 / Math.PI)
      if (d < 0) d += 360
      h.ang = base; h.deg = d; return
    }
    if (h.kind === 'coluna') {
      let base = hasFlow ? flowAng : Math.atan2(cy - h.py, cx - h.px)
      const deadZone = findDeadZone(h, allPts, idx, gridPts, reachPx, coneHalf)
      if (deadZone) base = blendA(base, deadZone, 0.6)
      let d = Math.round(base * 180 / Math.PI)
      if (d < 0) d += 360
      h.ang = base; h.deg = d; return
    }
    // circulação
    let base = wallIn
    if (hasFlow) base = blendA(base, flowAng, 0.35)
    const deadZone = findDeadZone(h, allPts, idx, gridPts, reachPx, coneHalf)
    if (deadZone) base = blendA(base, deadZone, 0.4)
    const diff = normAng(base - wallIn)
    if (diff > Math.PI / 2 && diff < 3 * Math.PI / 2) {
      const sign = diff < Math.PI ? 1 : -1
      base = wallIn + sign * (Math.PI * 0.44)
    }
    let d = Math.round(base * 180 / Math.PI)
    if (d < 0) d += 360
    h.ang = base; h.deg = d
  })
}

function placeOnWall(wallName, nTotal, exits, entries, use4mSpacing, W, H, CABO, geom) {
  const { iX, iY, fX, fY, flW, flH } = geom
  const isHoriz = wallName === 'top' || wallName === 'bottom'
  const wallLenM = isHoriz ? W : H
  const spacing = use4mSpacing ? 4 : CABO
  const maxFit = maxFansForWall(wallLenM, spacing)
  const MARGIN = 0.5

  function toPixel(posM) {
    const frac = posM / wallLenM
    if (isHoriz) return { px: iX() + frac * flW(), py: wallName === 'top' ? iY() : fY() }
    return { px: wallName === 'left' ? iX() : fX(), py: iY() + frac * flH() }
  }
  function portToM(port) {
    const toMX = cx => (cx - iX()) / flW() * W
    const toMY = cy => (cy - iY()) / flH() * H
    if (isHoriz) return toMX(port.px)
    return toMY(port.py)
  }

  const fixed = []
  entries.filter(e => e.wall === wallName).forEach(ent => {
    const m = Math.max(MARGIN, Math.min(wallLenM - MARGIN, portToM(ent)))
    fixed.push({ posM: m, kind: 'entrada' })
  })
  exits.filter(e => e.wall === wallName).forEach(ex => {
    const m = Math.max(MARGIN, Math.min(wallLenM - MARGIN, portToM(ex)))
    fixed.push({ posM: m, kind: 'saida' })
  })
  fixed.sort((a, b) => a.posM - b.posM)

  const nCirc = Math.max(0, Math.min(nTotal, maxFit) - fixed.length)
  const segments = []
  let prev = MARGIN
  fixed.forEach(f => {
    if (f.posM - prev > spacing * 0.5) segments.push({ from: prev, to: f.posM })
    prev = f.posM
  })
  if (wallLenM - MARGIN - prev > spacing * 0.5) segments.push({ from: prev, to: wallLenM - MARGIN })

  const totalSegLen = segments.reduce((s, seg) => s + Math.max(0, seg.to - seg.from), 0)
  const circPositions = []

  if (nCirc > 0 && fixed.length === 0) {
    const actual = Math.min(nCirc, maxFit)
    for (let i = 0; i < actual; i++) {
      let posM
      if (use4mSpacing && actual > 1) {
        const totalSpanM = (actual - 1) * 4
        const startM = Math.max(MARGIN, (wallLenM - totalSpanM) / 2)
        posM = startM + i * 4
      } else if (actual === 1) {
        posM = wallLenM / 2
      } else {
        const usable = wallLenM - MARGIN * 2
        posM = MARGIN + usable * (i / (actual - 1))
      }
      circPositions.push(Math.max(MARGIN, Math.min(wallLenM - MARGIN, posM)))
    }
  } else if (nCirc > 0 && totalSegLen > 0) {
    let allocated = 0
    segments.forEach((seg, si) => {
      const segLen = seg.to - seg.from
      const isLast = si === segments.length - 1
      let nSeg = isLast ? (nCirc - allocated) : Math.round(nCirc * (segLen / totalSegLen))
      nSeg = Math.max(0, nSeg)
      const maxInSeg = Math.max(0, Math.floor(segLen / spacing))
      nSeg = Math.min(nSeg, maxInSeg)
      for (let j = 0; j < nSeg; j++) {
        const m = seg.from + segLen * ((j + 1) / (nSeg + 1))
        circPositions.push(Math.max(MARGIN, Math.min(wallLenM - MARGIN, m)))
      }
      allocated += nSeg
    })
  }

  const allSlots = []
  fixed.forEach(f => allSlots.push({ posM: f.posM, kind: f.kind }))
  circPositions.forEach(m => allSlots.push({ posM: m, kind: 'circ' }))
  allSlots.sort((a, b) => a.posM - b.posM)

  return allSlots.map(s => {
    const { px, py } = toPixel(s.posM)
    return { px, py, pos: s.posM / wallLenM, kind: s.kind, wall: wallName, ang: 0, deg: 0 }
  })
}

/* ═══════════════════════════════════════════════════════
   CANVAS DRAWING
   ═══════════════════════════════════════════════════════ */
function drawFanIcon(ctx, x, y, r, rotAng, kind) {
  const bg = kind === 'saida' ? '#C0392B' : kind === 'coluna' ? '#534AB7' : '#111'
  const ring = kind === 'entrada' ? '#1D9E75' : kind === 'saida' ? '#8B1A1A' : kind === 'coluna' ? '#3C3489' : '#BA7517'
  ctx.save(); ctx.translate(x, y)
  ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill()
  ctx.strokeStyle = ring; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke()
  ctx.save(); ctx.rotate(rotAng)
  const br = r * 0.82
  const b1 = 'white'
  const b2 = kind === 'saida' ? 'rgba(255,255,255,.42)' : kind === 'coluna' ? 'rgba(255,255,255,.7)' : '#4fd1ed'
  function blade(ang, col) {
    ctx.save(); ctx.rotate(ang); ctx.fillStyle = col
    ctx.beginPath(); ctx.moveTo(0, 0)
    ctx.bezierCurveTo(br * 0.18, -br * 0.3, br * 0.5, -br * 0.9, br * 0.22, -br * 0.97)
    ctx.bezierCurveTo(-br * 0.12, -br * 1.02, -br * 0.58, -br * 0.66, -br * 0.46, -br * 0.32)
    ctx.bezierCurveTo(-br * 0.38, -br * 0.1, -br * 0.15, -br * 0.03, 0, 0)
    ctx.closePath(); ctx.fill(); ctx.restore()
  }
  blade(0, b1); blade(Math.PI / 2, b2); blade(Math.PI, b1); blade(3 * Math.PI / 2, b2)
  ctx.restore()
  ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 0.6
  ctx.beginPath(); ctx.arc(0, 0, r * 0.25, 0, Math.PI * 2); ctx.stroke()
  ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(0, 0, r * 0.22, 0, Math.PI * 2); ctx.fill()
  if (kind === 'saida') {
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 0.9; const xr = r * 0.12
    ctx.beginPath(); ctx.moveTo(-xr, -xr); ctx.lineTo(xr, xr); ctx.moveTo(xr, -xr); ctx.lineTo(-xr, xr); ctx.stroke()
  }
  ctx.restore()
}

function drawCone(ctx, x, y, ang, rPx, kind) {
  ctx.save(); ctx.translate(x, y)
  const rgb = kind === 'saida' ? '192,57,43' : kind === 'coluna' ? '127,119,221' : '79,209,237'
  const half = 0.42
  const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, rPx)
  gr.addColorStop(0, `rgba(${rgb},.12)`); gr.addColorStop(0.7, `rgba(${rgb},.03)`); gr.addColorStop(1, `rgba(${rgb},0)`)
  ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, rPx, ang - half, ang + half); ctx.closePath(); ctx.fill()
  ctx.strokeStyle = `rgba(${rgb},.12)`; ctx.lineWidth = 0.5; ctx.setLineDash([3, 4])
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(ang - half) * rPx, Math.sin(ang - half) * rPx); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(ang + half) * rPx, Math.sin(ang + half) * rPx); ctx.stroke()
  ctx.setLineDash([])
  const al = rPx * 0.78, aw = 5, ax = Math.cos(ang) * al, ay = Math.sin(ang) * al
  ctx.strokeStyle = `rgba(${rgb},.38)`; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax - aw * Math.cos(ang - 0.45), ay - aw * Math.sin(ang - 0.45)); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax - aw * Math.cos(ang + 0.45), ay - aw * Math.sin(ang + 0.45)); ctx.stroke()
  ctx.restore()
}

function drawCanvas(canvas, W, H, ports, colsP, allH, allCDs, allMotors, serData) {
  const { cW, cH } = calcScale(W, H)
  canvas.width = cW; canvas.height = cH
  const geom = makeGeom(W, H, cW, cH)
  const { iX, iY, fX, fY, flW, flH, toMX, toMY, ppm } = geom
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, cW, cH)

  // Background
  ctx.fillStyle = '#1c2026'; ctx.fillRect(0, 0, cW, cH)
  ctx.fillStyle = '#10141a'; ctx.fillRect(iX(), iY(), flW(), flH())

  // Grid
  const gx = flW() / W, gy = flH() / H
  ctx.strokeStyle = 'rgba(255,255,255,0.025)'; ctx.lineWidth = 0.5
  for (let x = iX() + gx; x < fX(); x += gx) { ctx.beginPath(); ctx.moveTo(x, iY()); ctx.lineTo(x, fY()); ctx.stroke() }
  for (let y = iY() + gy; y < fY(); y += gy) { ctx.beginPath(); ctx.moveTo(iX(), y); ctx.lineTo(fX(), y); ctx.stroke() }
  ctx.strokeStyle = '#3d494c'; ctx.lineWidth = 1.5; ctx.strokeRect(iX(), iY(), flW(), flH())

  // Labels
  ctx.fillStyle = '#869397'; ctx.font = "500 11px 'Inter', sans-serif"; ctx.textAlign = 'center'
  ctx.fillText(W + 'm', cW / 2, iY() - 13); ctx.fillText(W + 'm', cW / 2, fY() + 22)
  ctx.save(); ctx.translate(iX() - 16, cH / 2); ctx.rotate(-Math.PI / 2); ctx.fillText(H + 'm', 0, 0); ctx.restore()
  ctx.save(); ctx.translate(fX() + 16, cH / 2); ctx.rotate(Math.PI / 2); ctx.fillText(H + 'm', 0, 0); ctx.restore()
  ctx.textAlign = 'left'

  // Tick marks
  const tw = 5; ctx.strokeStyle = '#3d494c'; ctx.lineWidth = 0.7
  for (let x = iX(); x <= fX() + 0.5; x += gx) {
    ctx.beginPath(); ctx.moveTo(x, iY()); ctx.lineTo(x, iY() - tw); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(x, fY()); ctx.lineTo(x, fY() + tw); ctx.stroke()
  }
  for (let y = iY(); y <= fY() + 0.5; y += gy) {
    ctx.beginPath(); ctx.moveTo(iX(), y); ctx.lineTo(iX() - tw, y); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(fX(), y); ctx.lineTo(fX() + tw, y); ctx.stroke()
  }

  const c = cfg(W, H)
  const rPx = ppm() * c.reach

  // Cones
  allH.forEach(h => drawCone(ctx, h.px, h.py, h.ang, rPx, h.kind))

  // Series cables
  serData.forEach(s => {
    const col = s.color
    ctx.strokeStyle = col + 'cc'; ctx.lineWidth = 2.5
    if (s.motor && s.cds.length > 0) {
      ctx.beginPath(); ctx.moveTo(s.motor.px, s.motor.py); ctx.lineTo(s.cds[0].px, s.cds[0].py); ctx.stroke()
    }
    for (let i = 1; i < s.cds.length; i++) {
      ctx.strokeStyle = col + '99'; ctx.lineWidth = 2
      ctx.beginPath(); ctx.moveTo(s.cds[i - 1].px, s.cds[i - 1].py); ctx.lineTo(s.cds[i].px, s.cds[i].py); ctx.stroke()
    }
    s.cds.forEach(cd => {
      for (let i = 1; i < cd.helices.length; i++) {
        ctx.strokeStyle = '#534AB7'; ctx.lineWidth = 1.3
        ctx.beginPath(); ctx.moveTo(cd.helices[i - 1].px, cd.helices[i - 1].py); ctx.lineTo(cd.helices[i].px, cd.helices[i].py); ctx.stroke()
      }
    })
  })

  // CDs
  allCDs.forEach(cd => {
    ctx.fillStyle = '#534AB7'; ctx.strokeStyle = '#3C3489'; ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.arc(cd.px, cd.py, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
    ctx.fillStyle = '#fff'; ctx.font = "bold 5.5px 'Inter', sans-serif"; ctx.textAlign = 'center'
    ctx.fillText('CD', cd.px, cd.py + 2); ctx.textAlign = 'left'
  })

  // Motors
  allMotors.forEach(m => {
    const col = SC[m.serieIdx % SC.length]
    ctx.fillStyle = col; ctx.strokeStyle = 'rgba(0,0,0,.22)'; ctx.lineWidth = 1.5
    const ms = 12; ctx.fillRect(m.px - ms / 2, m.py - ms / 2, ms, ms); ctx.strokeRect(m.px - ms / 2, m.py - ms / 2, ms, ms)
    ctx.fillStyle = '#fff'; ctx.font = "bold 6px 'Inter', sans-serif"; ctx.textAlign = 'center'
    ctx.fillText('M' + (m.serieIdx + 1), m.px, m.py + 2.5); ctx.textAlign = 'left'
  })

  // Fan icons
  const r = Math.max(9, Math.min(14, ppm() * 0.72))
  allH.forEach(h => {
    drawFanIcon(ctx, h.px, h.py, r, h.ang, h.kind)
    const lx = h.px + Math.cos(h.ang) * (r + 8), ly = h.py + Math.sin(h.ang) * (r + 8)
    const tc = h.kind === 'saida' ? '#8B1A1A' : h.kind === 'entrada' ? '#065c36' : h.kind === 'coluna' ? '#3C3489' : '#633806'
    ctx.fillStyle = tc; ctx.strokeStyle = '#10141a'; ctx.lineWidth = 2
    ctx.font = "bold 8px 'Inter', sans-serif"; ctx.textAlign = 'center'
    ctx.strokeText(h.deg + '°', lx, ly + 3); ctx.fillText(h.deg + '°', lx, ly + 3); ctx.textAlign = 'left'
  })

  // Ports (entrada/saída labels)
  ports.forEach(p => {
    const isEnt = p.type === 'entrada'
    ctx.fillStyle = isEnt ? 'rgba(6,92,54,.9)' : 'rgba(140,20,14,.9)'
    const lw = 32, lh = 13
    const off = { top: { ox: 0, oy: -lh * 2.2 }, bottom: { ox: 0, oy: lh * 1.1 }, left: { ox: -lw / 2 - 16, oy: 0 }, right: { ox: lw / 2 + 4, oy: 0 } }[p.wall] || { ox: 0, oy: -lh * 2 }
    const lx = p.px + off.ox - lw / 2, ly = p.py + off.oy - lh / 2
    ctx.beginPath()
    if (ctx.roundRect) ctx.roundRect(lx, ly, lw, lh, 3); else ctx.rect(lx, ly, lw, lh)
    ctx.fill()
    ctx.fillStyle = 'white'; ctx.font = "bold 7px 'Inter', sans-serif"; ctx.textAlign = 'center'
    ctx.fillText(isEnt ? 'ENTRADA' : 'SAÍDA', lx + lw / 2, ly + lh / 2 + 2.5); ctx.textAlign = 'left'
  })

  // Columns
  colsP.forEach(col => {
    const cs = Math.max(12, Math.min(gx, gy) * 0.42)
    ctx.fillStyle = '#28224a'; ctx.strokeStyle = '#7F77DD'; ctx.lineWidth = 1.8
    ctx.fillRect(col.px - cs / 2, col.py - cs / 2, cs, cs); ctx.strokeRect(col.px - cs / 2, col.py - cs / 2, cs, cs)
    ctx.fillStyle = '#534AB7'; ctx.font = "bold 7px 'Inter', sans-serif"; ctx.textAlign = 'center'
    ctx.fillText('COL', col.px, col.py + 2.5); ctx.textAlign = 'left'
  })
}

/* ═══════════════════════════════════════════════════════
   GENERATE PLANT (compute positions)
   ═══════════════════════════════════════════════════════ */
function generatePlant(W, H, CABO, ports, colsP, cW, cH) {
  const geom = makeGeom(W, H, cW, cH)
  const { iX, iY, fX, fY, flW, flH, toMX, toMY, ppm } = geom

  const allPts = []
  const c = cfg(W, H)
  const needed = totalNeeded(W, H, ports)
  const exits = ports.filter(p => p.type === 'saida')
  const entries = ports.filter(p => p.type === 'entrada')
  const dm = getDims(W, H)
  const md = getMode(W, H)
  const hasCols = colsP.length > 0
  const use4m = isLargeSpaceMode(W, H)
  const entryWall = findEntradaWall(entries, dm)

  if (md === 'single') {
    let portWallFanCount = 0
    ;['top', 'bottom', 'left', 'right'].forEach(wall => {
      if (wall === entryWall) return
      const wEnt = entries.filter(e => e.wall === wall)
      const wExit = exits.filter(e => e.wall === wall)
      if (wEnt.length === 0 && wExit.length === 0) return
      const isH = wall === 'top' || wall === 'bottom'
      const wallLen = isH ? W : H
      const nFans = Math.max(wEnt.length + wExit.length, Math.ceil(wallLen / c.reach))
      const pts = placeOnWall(wall, nFans, exits, entries, false, W, H, CABO, geom)
      allPts.push(...pts); portWallFanCount += pts.length
    })
    let total = Math.max(0, needed - portWallFanCount)
    if (use4m) total = Math.max(wallFanCount4m(dm.comp), total)
    if (total > 0) allPts.push(...placeOnWall(entryWall, total, exits, entries, use4m, W, H, CABO, geom))
  } else {
    let nCol = 0, nWall = needed
    if (hasCols) { nCol = Math.min(colsP.length, needed); nWall = needed - nCol }
    colsP.slice(0, nCol).forEach(col => {
      allPts.push({ px: col.px, py: col.py, ang: 0, deg: 0, kind: 'coluna', wall: 'interior' })
    })
    const walls4 = ['top', 'bottom', 'left', 'right']
    const wLen = { top: W, bottom: W, left: H, right: H }
    const perim = 2 * (W + H)
    const portsOn = {}
    walls4.forEach(w => { portsOn[w] = entries.filter(e => e.wall === w).length + exits.filter(e => e.wall === w).length })
    const target = {}
    walls4.forEach(w => { target[w] = Math.max(portsOn[w], Math.floor(nWall * wLen[w] / perim)) })
    let remainder = nWall - walls4.reduce((s, w) => s + target[w], 0)
    const priority = [entryWall, ...walls4.filter(w => w !== entryWall).sort((a, b) => wLen[b] - wLen[a])]
    let ri = 0
    while (remainder > 0 && ri < priority.length) { target[priority[ri]]++; remainder--; ri++ }
    if (use4m) walls4.forEach(w => { target[w] = Math.max(target[w], wallFanCount4m(wLen[w])) })
    walls4.forEach(w => { if (target[w] > 0) allPts.push(...placeOnWall(w, target[w], exits, entries, use4m, W, H, CABO, geom)) })
  }

  // Guarantee minimum
  if (allPts.length < needed) {
    const falta = needed - allPts.length
    const extra = placeOnWall(entryWall, allPts.filter(p => p.wall === entryWall).length + falta, exits, entries, use4m, W, H, CABO, geom)
    for (let i = allPts.length - 1; i >= 0; i--) { if (allPts[i].wall === entryWall) allPts.splice(i, 1) }
    allPts.push(...extra)
  }

  // Tag reach for angle computation
  allPts.forEach(p => { p._reach = c.reach })
  computeAngles(allPts, entries, exits, geom)

  // Build CDs (groups of 3)
  const CD_SIZE = 3
  const allH = [], allCDs = [], allMotors = [], serData = []
  let helIdx = 0
  const cdList = []
  for (let i = 0; i < allPts.length; i += CD_SIZE) {
    const grp = allPts.slice(i, i + CD_SIZE)
    const mid = grp[Math.floor(grp.length / 2)]
    const cd = { px: mid.px, py: mid.py, wall: mid.wall, helices: [] }
    grp.forEach(pt => {
      const h = { px: pt.px, py: pt.py, ang: pt.ang, deg: pt.deg, kind: pt.kind, wall: pt.wall, serieIdx: -1, idx: helIdx++ }
      cd.helices.push(h); allH.push(h)
    })
    cdList.push(cd); allCDs.push(cd)
  }

  // Series
  let serieIdx = 0, helInSerie = 0, currentCDs = []
  function flushSerie() {
    if (!currentCDs.length) return
    const col = SC[serieIdx % SC.length]
    const motor = { px: currentCDs[0].px, py: currentCDs[0].py, serieIdx, wall: currentCDs[0].wall }
    allMotors.push(motor)
    serData.push({ serieIdx, color: col, motor, cds: [...currentCDs] })
    currentCDs.forEach(cd => cd.helices.forEach(h => h.serieIdx = serieIdx))
    serieIdx++; currentCDs = []; helInSerie = 0
  }
  cdList.forEach(cd => {
    const n = cd.helices.length
    if (helInSerie + n > c.helPerSerie && currentCDs.length > 0) flushSerie()
    currentCDs.push(cd); helInSerie += n
    if (helInSerie >= c.helPerSerie) flushSerie()
  })
  if (currentCDs.length > 0) flushSerie()
  allH.forEach((h, i) => h.idx = i)

  return { allH, allCDs, allMotors, serData, c, needed, dm, md, use4m }
}

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */
export default function PlantaTecnica() {
  const canvasRef = useRef(null)

  // Identification
  const [nome, setNome] = useState('')
  const [endereco, setEndereco] = useState('')

  // Dimensions
  const [W, setW] = useState(16)
  const [H, setH] = useState(4)
  const [CABO, setCABO] = useState(3)

  // Mode
  const [mode, setMode] = useState(null)
  const [hint, setHint] = useState('Entradas e saídas são opcionais. Colunas: clique dentro do ambiente.')

  // Canvas data
  const [ports, setPorts] = useState([])
  const [colsP, setColsP] = useState([])
  const [plantResult, setPlantResult] = useState(null) // { allH, allCDs, allMotors, serData, c, needed, dm, md, use4m }
  const [showTable, setShowTable] = useState(false)
  const [showPdf, setShowPdf] = useState(false)
  const [message, setMessage] = useState(null) // { type: 'ok'|'warn', text }

  // Persistence
  const [savedPlants, setSavedPlants] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
  })
  const [notification, setNotification] = useState(null)
  const [showSavePanel, setShowSavePanel] = useState(false)
  const [saveName, setSaveName] = useState('')

  // Notification dismiss
  useEffect(() => {
    if (!notification) return
    const t = setTimeout(() => setNotification(null), 3000)
    return () => clearTimeout(t)
  }, [notification])

  // Canvas size
  const getCanvasSize = useCallback(() => calcScale(W, H), [W, H])

  // Draw canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const allH = plantResult?.allH || []
    const allCDs = plantResult?.allCDs || []
    const allMotors = plantResult?.allMotors || []
    const serData = plantResult?.serData || []
    drawCanvas(canvas, W, H, ports, colsP, allH, allCDs, allMotors, serData)
  }, [W, H, ports, colsP, plantResult])

  useEffect(() => { redrawCanvas() }, [redrawCanvas])
  useEffect(() => {
    const handler = () => redrawCanvas()
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [redrawCanvas])

  // Metrics computation
  const metrics = useCallback(() => {
    const c = cfg(W, H)
    const need = totalNeeded(W, H, ports)
    const area = W * H
    const dm = getDims(W, H)
    const md = getMode(W, H)
    const hasCols = colsP.length > 0
    const ne = ports.filter(p => p.type === 'entrada').length
    const ns = ports.filter(p => p.type === 'saida').length
    const large = isLargeSpaceMode(W, H)
    const actual = plantResult?.allH?.length > 0 ? plantResult.allH.length : need
    const actualCDs = plantResult?.allCDs?.length > 0 ? plantResult.allCDs.length : Math.ceil(actual / 3)
    const actualSeries = plantResult?.serData?.length > 0 ? plantResult.serData.length : Math.ceil(actual / c.helPerSerie)
    return { c, need, area, dm, md, hasCols, ne, ns, large, actual, actualCDs, actualSeries }
  }, [W, H, ports, colsP, plantResult])

  const m = metrics()

  // Mode button handler
  const handleSetMode = (m) => {
    setMode(m)
    const hints = {
      entrada: 'Clique em uma parede longa → ventilador de entrada.',
      saida: 'Clique em uma parede → exaustor de saída.',
      coluna: 'Clique dentro do ambiente para posicionar uma coluna.',
    }
    setHint(hints[m] || '')
  }

  // Clear all
  const handleClear = () => {
    setPorts([]); setColsP([]); setPlantResult(null); setMode(null)
    setShowTable(false); setShowPdf(false); setMessage(null)
    setHint('Entradas e saídas são opcionais. Colunas: clique dentro do ambiente.')
  }

  // Dimension change resets plant
  const handleDimChange = (newW, newH, newCABO) => {
    setPlantResult(null); setShowTable(false); setShowPdf(false); setMessage(null)
    if (newW !== undefined) setW(newW)
    if (newH !== undefined) setH(newH)
    if (newCABO !== undefined) setCABO(newCABO)
  }

  // Generate plant
  const handleGenerate = () => {
    const { cW, cH } = calcScale(W, H)
    const result = generatePlant(W, H, CABO, ports, colsP, cW, cH)
    setPlantResult(result)
    setShowTable(true)
    setShowPdf(true)

    const { allH, allCDs, serData: sd, c, needed, dm, md, use4m } = result
    const ne = allH.filter(h => h.kind === 'entrada').length
    const ns = allH.filter(h => h.kind === 'saida').length
    const nCol = allH.filter(h => h.kind === 'coluna').length
    const modeLabel = md === 'single'
      ? '1 parede' + (use4m ? ' · espaçamento 4m' : '')
      : '2 paredes' + (nCol > 0 ? ` + ${nCol} coluna(s)` : '') + (use4m ? ' · espaçamento 4m' : '')

    let warn = null
    if (allH.length < needed) {
      const diff = needed - allH.length
      warn = `A área de ${(W * H).toFixed(0)}m² precisa de ${needed} hélices, porém com cabo de ${CABO}m e paredes de ${dm.comp}m só é possível posicionar ${allH.length} hélices (−${diff}).`
    }
    setMessage({ type: warn ? 'warn' : 'ok', text: `${allH.length} hélices · modo: ${modeLabel} · ${allCDs.length} CDs · ${sd.length} motor${sd.length !== 1 ? 'es' : ''} (${c.helPerSerie}/série)`, warn })
  }

  // Canvas click
  const handleCanvasClick = useCallback((e) => {
    if (!mode) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const cx = e.clientX - rect.left
    const cy = e.clientY - rect.top
    const { cW, cH } = calcScale(W, H)
    const geom = makeGeom(W, H, cW, cH)
    const { wallSnap, isInsideFloor } = geom

    if (mode === 'coluna') {
      if (!isInsideFloor(cx, cy)) { setHint('Coluna deve ser dentro do ambiente.'); return }
      setColsP(prev => [...prev])
      colsP.push({ px: cx, py: cy })
      setColsP([...colsP])
      setPlantResult(null); setShowTable(false); setShowPdf(false); setMessage(null)
    } else {
      const s = wallSnap(cx, cy)
      if (s) {
        ports.push({ ...s, type: mode })
        setPorts([...ports])
        setPlantResult(null); setShowTable(false); setShowPdf(false); setMessage(null)
      }
    }
  }, [mode, W, H, ports, colsP])

  // Save plant
  const handleSave = () => {
    const plantName = saveName.trim() || nome.trim() || `Planta ${new Date().toLocaleDateString('pt-BR')}`
    const entry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      name: plantName,
      savedAt: new Date().toISOString(),
      data: { nome, endereco, W, H, CABO, ports, colsP },
    }
    const updated = [entry, ...savedPlants]
    setSavedPlants(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    setNotification({ type: 'ok', text: `Planta "${plantName}" salva.` })
    setShowSavePanel(false)
    setSaveName('')
  }

  // Load plant
  const handleLoad = (plant) => {
    const { nome: n, endereco: e, W: w, H: h, CABO: c, ports: p, colsP: cols } = plant.data
    setNome(n || ''); setEndereco(e || '')
    setW(w || 16); setH(h || 4); setCABO(c || 3)
    setPorts(p || []); setColsP(cols || [])
    setPlantResult(null); setShowTable(false); setShowPdf(false); setMessage(null); setMode(null)
    setHint('Planta carregada. Clique em "Gerar Planta" para recalcular.')
    setNotification({ type: 'ok', text: `Planta "${plant.name}" carregada.` })
  }

  // Delete saved plant
  const handleDeleteSaved = (id) => {
    const updated = savedPlants.filter(p => p.id !== id)
    setSavedPlants(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    setNotification({ type: 'ok', text: 'Planta removida.' })
  }

  // PDF export
  const handlePdf = () => {
    if (!plantResult?.allH?.length) return
    const { allH, allCDs, allMotors, serData: sd, c, dm, md, use4m } = plantResult
    const area = (W * H).toFixed(0)
    const nEntT = allH.filter(h => h.kind === 'entrada').length
    const nExT = allH.filter(h => h.kind === 'saida').length
    const nColT = allH.filter(h => h.kind === 'coluna').length
    const nSeries = sd.length
    const canvas = canvasRef.current
    const plantImg = canvas ? canvas.toDataURL('image/png', 1.0) : ''
    const now = new Date()
    const ds = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    const cdMap = new Map(); allCDs.forEach((cd, i) => cd.helices.forEach(h => cdMap.set(h.idx, i + 1)))
    const { cW, cH } = calcScale(W, H)
    const geom = makeGeom(W, H, cW, cH)
    const { toMX, toMY } = geom
    const wn = { top: 'Par. Superior', bottom: 'Par. Inferior', left: 'Par. Esquerda', right: 'Par. Direita', interior: 'Coluna' }
    const kindLabel = { entrada: 'Vent./Entrada', saida: 'Exaustor/Saída', circ: 'Vent./Circulação', coluna: 'Vent./Coluna' }
    const kindColor = { entrada: '#1D9E75', saida: '#C0392B', circ: '#BA7517', coluna: '#534AB7' }
    const modeLabel = md === 'single' ? `1 parede (larg. ≤ ${c.widthSingle}m)${use4m ? ' · 4m' : ''}` : `2 paredes${nColT > 0 ? ' + ' + nColT + ' col.' : ''}${use4m ? ' · 4m' : ''}`

    let srRows = ''
    sd.forEach(s => {
      const col = SC[s.serieIdx % SC.length]
      const sH = s.cds.flatMap(cd => cd.helices)
      srRows += `<tr><td style="text-align:center"><span style="background:${col};color:white;padding:2px 7px;border-radius:4px;font-size:10px;font-weight:700">S${s.serieIdx + 1}</span></td>
      <td style="text-align:center">M${s.serieIdx + 1}</td><td style="text-align:center">${s.cds.length}</td><td style="text-align:center">${sH.length}</td>
      <td style="text-align:center">${sH.filter(h => h.kind !== 'saida').length}</td><td style="text-align:center">${sH.filter(h => h.kind === 'saida').length}</td>
      <td style="font-size:9px">${sH.map(h => 'H' + (h.idx + 1)).join(', ')}</td></tr>`
    })

    let hRows = ''
    allH.forEach(h => {
      const sc_ = SC[(h.serieIdx || 0) % SC.length]
      hRows += `<tr><td style="text-align:center;font-weight:700">H${h.idx + 1}</td>
      <td style="text-align:center"><span style="background:${sc_};color:white;padding:1px 5px;border-radius:3px;font-size:9px">S${(h.serieIdx || 0) + 1}</span></td>
      <td style="text-align:center">M${(h.serieIdx || 0) + 1}</td><td style="text-align:center">CD${cdMap.get(h.idx) || '—'}</td>
      <td style="text-align:center"><span style="background:${kindColor[h.kind]};color:white;padding:1px 5px;border-radius:3px;font-size:9px">${kindLabel[h.kind] || h.kind}</span></td>
      <td>${wn[h.wall] || h.wall}</td><td style="text-align:center">${toMX(h.px).toFixed(2)}</td><td style="text-align:center">${toMY(h.py).toFixed(2)}</td>
      <td style="text-align:center;font-weight:700;color:#185FA5;font-size:12px">${h.deg}°</td><td style="text-align:center">${c.reach}m</td></tr>`
    })

    const idBlock = nome || endereco ? `<div style="background:#1a2230;border:1px solid rgba(79,209,237,.25);border-radius:6px;padding:8px 14px;margin-bottom:10px;display:flex;gap:16px;flex-wrap:wrap;align-items:center">
      ${nome ? `<div><div style="font-size:8px;color:rgba(79,209,237,.6);text-transform:uppercase;letter-spacing:.1em;margin-bottom:2px">Nome / Cliente</div><div style="font-size:13px;font-weight:700;color:#fff">${nome}</div></div>` : ''}
      ${nome && endereco ? `<div style="width:1px;height:32px;background:rgba(79,209,237,.15)"></div>` : ''}
      ${endereco ? `<div><div style="font-size:8px;color:rgba(79,209,237,.6);text-transform:uppercase;letter-spacing:.1em;margin-bottom:2px">Endereço</div><div style="font-size:11px;color:#ccc">${endereco}</div></div>` : ''}
    </div>` : ''

    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Ventiloar — Planta Técnica${nome ? ' — ' + nome : ''}</title>
    <style>@page{size:A4;margin:12mm 10mm}*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Inter',Arial,sans-serif;font-size:10px;color:#111}
    .pb{page-break-before:always}.hdr{background:#10141a;padding:11px 15px;display:flex;align-items:center;gap:10px;border-radius:6px;margin-bottom:10px}
    .nm{font-family:'Space Grotesk',sans-serif;font-size:17px;font-weight:700;color:#fff;text-transform:uppercase}.nm span{color:#4fd1ed}.sb{font-size:8px;color:rgba(255,255,255,.3);margin-top:1px}
    .bdg{background:rgba(79,209,237,.12);border:1px solid rgba(79,209,237,.25);border-radius:20px;padding:2px 8px;font-size:9px;color:#4fd1ed}
    .sec{font-family:'Space Grotesk',sans-serif;font-size:11px;font-weight:700;border-bottom:2px solid #4fd1ed;padding-bottom:3px;margin:10px 0 6px;text-transform:uppercase;letter-spacing:.05em}
    .mts{display:grid;grid-template-columns:repeat(6,1fr);gap:5px;margin-bottom:8px}
    .mt{background:#f5f6f8;border:1px solid #e0e2e8;border-radius:5px;padding:6px 4px;text-align:center}
    .mt .v{font-size:15px;font-weight:700;color:#111;line-height:1}.mt .l{font-size:8px;color:#666;margin-top:2px}.mt .s{font-size:7px;color:#999;margin-top:1px}
    .mt.hi{background:#10141a}.mt.hi .v{color:#4fd1ed}.mt.hi .l,.mt.hi .s{color:rgba(255,255,255,.4)}
    .mt.hig{background:#071a0f;border-color:#1D9E75}.mt.hig .v{color:#5DCAA5}.mt.hig .l{color:rgba(255,255,255,.4)}
    .mt.hir{background:#1a0707;border-color:#C0392B}.mt.hir .v{color:#F09595}.mt.hir .l{color:rgba(255,255,255,.4)}
    .mt.hio{background:#1c1000;border-color:#BA7517}.mt.hio .v{color:#EF9F27}.mt.hio .l{color:rgba(255,255,255,.4)}
    .mt.hip{background:#1a0e2a;border-color:#7F77DD}.mt.hip .v{color:#AFA9EC}.mt.hip .l{color:rgba(255,255,255,.4)}
    .fbox{background:#10141a;border-radius:5px;padding:6px 12px;margin-bottom:8px;font-size:9px;color:rgba(255,255,255,.4)}.fbox b{color:#4fd1ed}
    .plant{text-align:center;margin:6px 0}.plant img{max-width:100%;border:1px solid #dde;border-radius:5px}
    table{width:100%;border-collapse:collapse;font-size:9px;margin-bottom:8px}
    th{background:#f0f1f5;padding:5px 6px;text-align:center;font-weight:700;border:1px solid #dde;font-size:8px;color:#444}
    td{padding:4px 6px;border:1px solid #e8e9ee;vertical-align:middle}tr:nth-child(even) td{background:#fafbfc}
    .ft{margin-top:10px;text-align:center;font-size:8px;color:#bbb;border-top:1px solid #eee;padding-top:5px}
    @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body>
    <div class="hdr"><div><div class="nm">VENTILO<span>AR</span></div><div class="sb">relatório técnico · planta baixa${nome ? ' · ' + nome : ''}</div></div>
    <div style="margin-left:auto;display:flex;flex-direction:column;align-items:flex-end;gap:4px"><div class="bdg">${ds}</div>${endereco ? `<div style="font-size:8px;color:rgba(255,255,255,.35)">${endereco}</div>` : ''}</div></div>
    ${idBlock}<div class="sec">resumo</div>
    <div class="mts">
      <div class="mt hi"><div class="v">${allH.length}</div><div class="l">hélices total</div><div class="s">${area}÷${c.m2}</div></div>
      <div class="mt hig"><div class="v">${nEntT}</div><div class="l">entradas</div></div>
      <div class="mt hir"><div class="v">${nExT}</div><div class="l">saídas</div></div>
      <div class="mt hio"><div class="v">${nColT}</div><div class="l">colunas</div></div>
      <div class="mt hip"><div class="v">${allCDs.length}</div><div class="l">CDs</div><div class="s">3/CD</div></div>
      <div class="mt"><div class="v">${nSeries}</div><div class="l">motores</div><div class="s">${c.helPerSerie}/série</div></div>
    </div>
    <div class="fbox"><b>${area} m² ÷ ${c.m2} = ${allH.length} hélices</b> · largura ${dm.larg}m · modo: ${modeLabel} · ${allCDs.length} CDs · ${nSeries} motor${nSeries !== 1 ? 'es' : ''} · cabo ${CABO}m</div>
    <div class="sec">planta baixa</div><div class="plant"><img src="${plantImg}"/></div>
    <div class="pb"></div>
    <div class="hdr"><div><div class="nm">VENTILO<span>AR</span></div><div class="sb">tabelas${nome ? ' · ' + nome : ''}</div></div><div style="margin-left:auto"><div class="bdg">${allH.length} hélices · ${nSeries} séries</div></div></div>
    <div class="sec">séries</div>
    <table><thead><tr><th>Série</th><th>Motor</th><th>CDs</th><th>Total</th><th>Vent.</th><th>Exaust.</th><th>Hélices</th></tr></thead><tbody>${srRows}</tbody></table>
    <div class="sec">lista completa</div>
    <table><thead><tr><th>H#</th><th>Série</th><th>Motor</th><th>CD</th><th>Função</th><th>Local</th><th>X(m)</th><th>Y(m)</th><th>Ângulo</th><th>Alcance</th></tr></thead><tbody>${hRows}</tbody></table>
    <div class="ft">Ventiloar · Planta Técnica${nome ? ' · ' + nome : ''}${endereco ? ' · ' + endereco : ''} · ${ds}</div></body></html>`

    const w = window.open('', '_blank', 'width=900,height=700')
    if (w) { w.document.write(html); w.document.close(); w.onload = () => setTimeout(() => w.print(), 400) }
  }

  // Derived values for table
  const { cW, cH } = getCanvasSize()
  const geom = makeGeom(W, H, cW, cH)
  const { toMX, toMY } = geom

  const allH = plantResult?.allH || []
  const allCDs = plantResult?.allCDs || []
  const serData = plantResult?.serData || []
  const c = plantResult?.c || cfg(W, H)
  const area = (W * H).toFixed(0)
  const ne = ports.filter(p => p.type === 'entrada').length
  const ns = ports.filter(p => p.type === 'saida').length
  const large = isLargeSpaceMode(W, H)
  const md = getMode(W, H)
  const dm = getDims(W, H)
  const needed = totalNeeded(W, H, ports)
  const actual = allH.length > 0 ? allH.length : needed
  const actualCDs = allCDs.length > 0 ? allCDs.length : Math.ceil(actual / 3)
  const actualSeries = serData.length > 0 ? serData.length : Math.ceil(actual / c.helPerSerie)

  const cdMap = new Map()
  allCDs.forEach((cd, i) => cd.helices.forEach(h => cdMap.set(h.idx, i + 1)))

  const wn = { top: 'Par. Superior', bottom: 'Par. Inferior', left: 'Par. Esquerda', right: 'Par. Direita', interior: 'Coluna' }
  const kindLabel = { entrada: 'Vent./Entrada', saida: 'Exaustor/Saída', circ: 'Vent./Circulação', coluna: 'Vent./Coluna' }
  const kindBg = {
    entrada: 'bg-[#071a0f] text-[#5DCAA5] border border-[#1D9E75]',
    saida: 'bg-[#1a0707] text-[#F09595] border border-[#C0392B]',
    circ: 'bg-[#1c1000] text-[#EF9F27] border border-[#BA7517]',
    coluna: 'bg-[#1a0e2a] text-[#AFA9EC] border border-[#7F77DD]',
  }

  // Logic bar text
  let logicText = 'Configure as dimensões'
  if (md === 'single') {
    logicText = large
      ? `Largura ${dm.larg}m ≤ ${c.widthSingle}m → ${actual} hélices em 1 parede (espaçamento 4m)`
      : `Largura ${dm.larg}m ≤ ${c.widthSingle}m → todas as ${actual} hélices em 1 parede (parede de ${dm.comp}m)`
  } else {
    logicText = large
      ? `Área ${area}m² > 500 · Parede ${dm.comp}m > 8m → ${actual} hélices nas 4 paredes (espaçamento 4m)`
      : colsP.length > 0
        ? `Largura ${dm.larg}m > ${c.widthSingle}m + ${colsP.length} coluna(s) → ${colsP.length} col. + ${actual - colsP.length} nas 4 paredes`
        : `Largura ${dm.larg}m > ${c.widthSingle}m → ${actual} hélices nas 4 paredes (distribuição perimetral)`
  }

  /* ─── RENDER ─── */
  return (
    <div className="space-y-4">

      {/* Notification */}
      {notification && (
        <div className={`flex items-center gap-3 px-4 py-3 text-sm ${notification.type === 'ok' ? 'bg-[rgba(29,158,117,.1)] border border-[rgba(29,158,117,.3)] text-[#5DCAA5]' : 'bg-[rgba(186,117,23,.1)] border border-[rgba(186,117,23,.3)] text-[#EF9F27]'}`}>
          <span className="material-symbols-outlined text-base">{notification.type === 'ok' ? 'check_circle' : 'warning'}</span>
          {notification.text}
        </div>
      )}

      {/* ── SEÇÃO 00: IDENTIFICAÇÃO ── */}
      <div className="bg-surface-container-low p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="font-headline font-bold text-[10px] text-primary-container border border-primary-container/30 px-2 py-0.5">00</span>
          <span className="font-headline font-bold uppercase text-sm tracking-wide">Identificação da Planta</span>
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-[10px] font-headline uppercase tracking-widest text-on-surface-variant mb-1">Nome da Planta / Cliente</label>
            <input
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Ex: Galpão Norte — Empresa X"
              className="w-full bg-surface-container text-on-surface px-3 py-2 text-sm focus:outline-none border-b-2 border-transparent focus:border-primary-container transition-colors"
            />
          </div>
          <div className="flex-[2] min-w-[240px]">
            <label className="block text-[10px] font-headline uppercase tracking-widest text-on-surface-variant mb-1">Endereço</label>
            <input
              type="text"
              value={endereco}
              onChange={e => setEndereco(e.target.value)}
              placeholder="Ex: Av. Industrial, 100 — Fortaleza/CE"
              className="w-full bg-surface-container text-on-surface px-3 py-2 text-sm focus:outline-none border-b-2 border-transparent focus:border-primary-container transition-colors"
            />
          </div>
        </div>
        {(nome || endereco) && (
          <div className="mt-3 inline-flex items-center gap-2 bg-primary-container/[0.07] border border-primary-container/20 px-3 py-1.5 text-[11px] text-primary-container">
            <span className="material-symbols-outlined text-xs">location_on</span>
            {nome && <strong className="text-on-surface">{nome}</strong>}
            {nome && endereco && <span className="text-on-surface-variant">·</span>}
            {endereco && <span>{endereco}</span>}
          </div>
        )}
      </div>

      {/* ── SEÇÃO 01: DIMENSÕES ── */}
      <div className="bg-surface-container-low p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="font-headline font-bold text-[10px] text-primary-container border border-primary-container/30 px-2 py-0.5">01</span>
          <span className="font-headline font-bold uppercase text-sm tracking-wide">Dimensões do Ambiente</span>
        </div>
        <div className="flex flex-wrap gap-6 items-end">
          <div>
            <label className="block text-[10px] font-headline uppercase tracking-widest text-on-surface-variant mb-1">Comprimento (m)</label>
            <input
              type="number" min="2" max="500" step="0.5" value={W}
              onChange={e => handleDimChange(parseFloat(e.target.value) || 16, undefined, undefined)}
              className="w-28 bg-surface-container text-on-surface px-3 py-2 text-sm focus:outline-none border-b-2 border-transparent focus:border-primary-container transition-colors"
            />
          </div>
          <div>
            <label className="block text-[10px] font-headline uppercase tracking-widest text-on-surface-variant mb-1">Largura (m)</label>
            <input
              type="number" min="2" max="500" step="0.5" value={H}
              onChange={e => handleDimChange(undefined, parseFloat(e.target.value) || 4, undefined)}
              className="w-28 bg-surface-container text-on-surface px-3 py-2 text-sm focus:outline-none border-b-2 border-transparent focus:border-primary-container transition-colors"
            />
          </div>
          <div className="w-px h-10 bg-outline-variant opacity-20 self-end" />
          <div>
            <label className="block text-[10px] font-headline uppercase tracking-widest text-on-surface-variant mb-1">Cabo (m)</label>
            <select
              value={CABO}
              onChange={e => handleDimChange(undefined, undefined, parseFloat(e.target.value))}
              className="bg-surface-container text-on-surface px-3 py-2 text-sm focus:outline-none border-b-2 border-transparent focus:border-primary-container transition-colors cursor-pointer appearance-none w-32"
            >
              <option value="2">2 metros</option>
              <option value="3">3 metros</option>
              <option value="4">4 metros</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── LÓGICA + FÓRMULA + MÉTRICAS ── */}
      <div className="bg-surface-container-lowest border border-outline-variant/30 px-4 py-3 text-sm leading-relaxed">
        <span className="text-primary-container font-bold">{logicText}</span>
        {large && <span className="ml-2 text-[10px] px-2 py-0.5 bg-primary-container/10 text-primary-container border border-primary-container/20">regra 4m ativa</span>}
      </div>
      <div className="flex flex-wrap gap-2 items-center bg-surface-container-lowest border border-outline-variant/30 px-4 py-2 text-[12px] text-on-surface-variant/50">
        <span>hélice <strong className="text-primary-container">{c.label}</strong></span>
        <span className="text-outline-variant/50">·</span>
        <strong className="text-primary-container">{area} m² ÷ {c.m2} = {actual} hélices</strong>
        <span className="text-outline-variant/50">·</span>
        <span>{ne} entrada + {ns} saída + {Math.max(0, actual - ne - ns)} circulação</span>
        <span className="text-outline-variant/50">·</span>
        <strong className="text-primary-container">{actualCDs} CDs</strong>
        <span className="text-outline-variant/50">·</span>
        <strong className="text-primary-container">{actualSeries} motor{actualSeries !== 1 ? 'es' : ''}</strong>
        <span className="text-on-surface-variant/30">({c.helPerSerie}/série)</span>
        <span className="text-outline-variant/50">·</span>
        <span>cabo <strong className="text-primary-container">{CABO}m</strong></span>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
        {[
          { v: c.label, l: 'hélice', s: `alcance ${c.reach}m`, cls: 'bg-primary-container/[0.06] border-primary-container/35 text-white' },
          { v: actual, l: 'hélices total', s: `${area}÷${c.m2}`, cls: 'bg-surface-container-lowest border-primary-container/20 text-primary-container' },
          { v: ne, l: 'entradas', cls: 'bg-[#071a0f] border-[#1D9E75] text-[#5DCAA5]' },
          { v: ns, l: 'saídas', cls: 'bg-[#1a0707] border-[#C0392B] text-[#F09595]' },
          { v: colsP.length, l: 'colunas', cls: 'bg-[#1c1000] border-[#BA7517] text-[#EF9F27]' },
          { v: actualCDs, l: 'CDs', s: '3/CD', cls: 'bg-[#1a0e2a] border-[#7F77DD] text-[#AFA9EC]' },
        ].map((met, i) => (
          <div key={i} className={`border rounded px-2 py-3 text-center ${met.cls}`}>
            <div className="text-xl font-bold leading-none">{met.v}</div>
            <div className="text-[10px] mt-1 opacity-70">{met.l}</div>
            {met.s && <div className="text-[9px] mt-0.5 opacity-40">{met.s}</div>}
          </div>
        ))}
      </div>

      {/* ── SEÇÃO 02: PLANTA BAIXA ── */}
      <div className="bg-surface-container-low p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="font-headline font-bold text-[10px] text-primary-container border border-primary-container/30 px-2 py-0.5">02</span>
          <span className="font-headline font-bold uppercase text-sm tracking-wide">Planta Baixa</span>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap gap-2 mb-3">
          {/* Entrada */}
          <button
            onClick={() => handleSetMode('entrada')}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-headline font-bold border-[1.5px] transition-all ${mode === 'entrada' ? 'bg-[rgba(29,158,117,.15)] border-[#1D9E75] text-[#5DCAA5] shadow-[0_0_0_1px_rgba(29,158,117,.3)]' : 'bg-transparent border-[rgba(29,158,117,.3)] text-[#5DCAA5] hover:bg-[rgba(29,158,117,.15)] hover:border-[#1D9E75]'}`}
          >
            <svg viewBox="0 0 13 13" fill="none" className="w-3.5 h-3.5"><circle cx="6.5" cy="6.5" r="5" stroke="#1D9E75" strokeWidth="1.4"/><path d="M4.5 6.5h4M6.5 4.5l2 2-2 2" stroke="#1D9E75" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            + Entrada de ar
          </button>
          {/* Saída */}
          <button
            onClick={() => handleSetMode('saida')}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-headline font-bold border-[1.5px] transition-all ${mode === 'saida' ? 'bg-[rgba(192,57,43,.15)] border-[#C0392B] text-[#F09595] shadow-[0_0_0_1px_rgba(192,57,43,.3)]' : 'bg-transparent border-[rgba(192,57,43,.3)] text-[#F09595] hover:bg-[rgba(192,57,43,.15)] hover:border-[#C0392B]'}`}
          >
            <svg viewBox="0 0 13 13" fill="none" className="w-3.5 h-3.5"><circle cx="6.5" cy="6.5" r="5" stroke="#C0392B" strokeWidth="1.4"/><path d="M8.5 6.5h-4M6.5 8.5l-2-2 2-2" stroke="#C0392B" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            + Saída de ar
          </button>
          {/* Coluna */}
          <button
            onClick={() => handleSetMode('coluna')}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-headline font-bold border-[1.5px] transition-all ${mode === 'coluna' ? 'bg-[rgba(83,74,183,.15)] border-[#534AB7] text-[#AFA9EC] shadow-[0_0_0_1px_rgba(83,74,183,.3)]' : 'bg-transparent border-[rgba(83,74,183,.3)] text-[#AFA9EC] hover:bg-[rgba(83,74,183,.15)] hover:border-[#534AB7]'}`}
          >
            <svg viewBox="0 0 13 13" fill="none" className="w-3.5 h-3.5"><rect x="3.5" y="1.5" width="6" height="10" rx="1.2" stroke="#7F77DD" strokeWidth="1.4"/></svg>
            + Coluna
          </button>
          {/* Limpar */}
          <button
            onClick={handleClear}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-headline font-bold border-[1.5px] bg-transparent border-outline-variant text-on-surface-variant hover:bg-surface-container-high transition-all"
          >
            <svg viewBox="0 0 13 13" fill="none" className="w-3.5 h-3.5"><path d="M2.5 2.5l8 8M10.5 2.5l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
            Limpar
          </button>
          {/* Gerar */}
          <button
            onClick={handleGenerate}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-headline font-bold bg-primary-container text-on-primary-container border-[1.5px] border-primary-container hover:shadow-[0_0_20px_rgba(79,209,237,.2)] transition-all"
          >
            <svg viewBox="0 0 13 13" fill="none" className="w-3.5 h-3.5"><path d="M6.5 1v11M1 6.5h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            Gerar Planta
          </button>
          {/* PDF */}
          {showPdf && (
            <button
              onClick={handlePdf}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-headline font-bold bg-[#185FA5] text-white border-[1.5px] border-[#185FA5] hover:bg-[#0C447C] transition-all"
            >
              <svg viewBox="0 0 13 13" fill="none" className="w-3.5 h-3.5"><path d="M3 1.5h5l3 3V12a.5.5 0 01-.5.5h-7A.5.5 0 013 12V1.5z" stroke="white" strokeWidth="1.3"/><path d="M8 1.5V5h3.5M5 7.5h3M5 9.5h2" stroke="white" strokeWidth="1.2" strokeLinecap="round"/></svg>
              Salvar PDF
            </button>
          )}
          {/* Salvar planta */}
          <button
            onClick={() => setShowSavePanel(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-headline font-bold bg-transparent border-[1.5px] border-outline-variant text-on-surface-variant hover:bg-surface-container-high transition-all"
          >
            <span className="material-symbols-outlined text-xs">save</span>
            Salvar Planta
          </button>
        </div>

        {/* Hint */}
        <div className="bg-surface-container border border-outline-variant/10 px-4 py-2.5 text-sm text-on-surface-variant mb-3 min-h-[2.5rem] leading-relaxed">
          {hint}
        </div>

        {/* Canvas */}
        <div className="border border-outline-variant/20 overflow-hidden">
          <canvas
            ref={canvasRef}
            className="block cursor-crosshair max-w-full"
            onClick={handleCanvasClick}
          />
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 items-center mt-3 px-4 py-2.5 bg-surface-container border border-outline-variant/10 text-[11px] text-on-surface-variant">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-[#111] border-2 border-[#1D9E75]" />Vent. entrada</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-[#111] border-2 border-[#BA7517]" />Vent. circulação</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-[#C0392B] border-2 border-[#8B1A1A]" />Exaustor saída</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-[#534AB7] border-2 border-[#3C3489]" />Vent. coluna</div>
          <div className="w-px h-3 bg-outline-variant opacity-20" />
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#534AB7] border border-[#3C3489]" />CD</div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-[#BA7517] border border-[#633806]" />Motor</div>
          <div className="w-px h-3 bg-outline-variant opacity-20" />
          <div className="flex items-center gap-1.5"><div className="w-4 h-0.5 bg-[#BA7517]" />Cabo série</div>
          <div className="flex items-center gap-1.5"><div className="w-4 h-[1.5px] bg-[#534AB7]" />Cabo hél→hél</div>
        </div>

        {/* Message */}
        {message && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-3 bg-[rgba(29,158,117,.1)] border border-[rgba(29,158,117,.3)] px-4 py-3 text-sm text-[#5DCAA5]">
              <span className="material-symbols-outlined text-base">check_circle</span>
              <span>{message.text}</span>
            </div>
            {message.warn && (
              <div className="flex items-start gap-3 bg-[rgba(186,117,23,.1)] border border-[rgba(186,117,23,.3)] px-4 py-3 text-sm text-[#EF9F27] leading-relaxed">
                <span className="material-symbols-outlined text-base mt-0.5">warning</span>
                <span>{message.warn}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── TABELA DE EQUIPAMENTOS ── */}
      {showTable && allH.length > 0 && (
        <div className="bg-surface-container-low overflow-hidden">
          <div className="bg-surface-container-lowest px-4 py-3 flex flex-wrap items-center gap-2">
            <span className="material-symbols-outlined text-sm text-primary-container">hub</span>
            <span className="font-headline font-bold text-[12px] uppercase tracking-[0.18em] text-primary-container">Lista de Equipamentos</span>
            <span className="text-[10px] px-2 py-0.5 bg-primary-container/10 border border-primary-container/20 text-primary-container">{allH.length} hélices</span>
            <span className="text-[10px] px-2 py-0.5 bg-[rgba(192,57,43,.1)] border border-[rgba(192,57,43,.3)] text-[#F09595]">{allH.filter(h => h.kind === 'saida').length} exaustores</span>
            <span className="text-[10px] px-2 py-0.5 bg-[rgba(83,74,183,.1)] border border-[rgba(83,74,183,.3)] text-[#AFA9EC]">{serData.length} séries</span>
            <span className="text-[10px] px-2 py-0.5 bg-[rgba(186,117,23,.1)] border border-[rgba(186,117,23,.3)] text-[#EF9F27]">{allCDs.length} CDs · cabo {CABO}m</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] border-collapse">
              <thead>
                <tr>
                  {['H#', 'Série', 'Motor', 'CD', 'Função', 'Local', 'X(m)', 'Y(m)', 'Ângulo', 'Alcance'].map(th => (
                    <th key={th} className="bg-surface-container px-3 py-1.5 text-left text-[10px] font-bold text-on-surface-variant border-b border-outline-variant/10">{th}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allH.map(h => {
                  const sc_ = SC[(h.serieIdx || 0) % SC.length]
                  return (
                    <tr key={h.idx} className="hover:bg-surface-container/50">
                      <td className="px-3 py-1.5 font-semibold border-b border-outline-variant/5">H{h.idx + 1}</td>
                      <td className="px-3 py-1.5 border-b border-outline-variant/5">
                        <span className="text-[10px] px-1.5 py-0.5 font-medium" style={{ background: sc_ + '33', color: sc_, border: `0.5px solid ${sc_}66` }}>S{(h.serieIdx || 0) + 1}</span>
                      </td>
                      <td className="px-3 py-1.5 text-on-surface-variant border-b border-outline-variant/5">M{(h.serieIdx || 0) + 1}</td>
                      <td className="px-3 py-1.5 text-on-surface-variant border-b border-outline-variant/5">CD{cdMap.get(h.idx) || '—'}</td>
                      <td className="px-3 py-1.5 border-b border-outline-variant/5">
                        <span className={`text-[10px] px-1.5 py-0.5 font-medium ${kindBg[h.kind] || ''}`}>{kindLabel[h.kind] || h.kind}</span>
                      </td>
                      <td className="px-3 py-1.5 text-on-surface-variant border-b border-outline-variant/5">{wn[h.wall] || h.wall}</td>
                      <td className="px-3 py-1.5 border-b border-outline-variant/5">{toMX(h.px).toFixed(2)}</td>
                      <td className="px-3 py-1.5 border-b border-outline-variant/5">{toMY(h.py).toFixed(2)}</td>
                      <td className="px-3 py-1.5 border-b border-outline-variant/5">
                        <span className="text-[11px] font-semibold text-[#185FA5] bg-[#dff0fb] px-1.5 py-0.5 rounded-sm">{h.deg}°</span>
                      </td>
                      <td className="px-3 py-1.5 text-on-surface-variant border-b border-outline-variant/5">{c.reach}m</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── PLANTAS SALVAS ── */}
      <div className="bg-surface-container-low p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="font-headline font-bold text-[10px] text-primary-container border border-primary-container/30 px-2 py-0.5">03</span>
            <span className="font-headline font-bold uppercase text-sm tracking-wide">Plantas Salvas</span>
            <span className="text-[10px] text-on-surface-variant">{savedPlants.length} planta{savedPlants.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Save panel */}
        {showSavePanel && (
          <div className="bg-surface-container border border-outline-variant/20 p-4 mb-4 flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-[10px] font-headline uppercase tracking-widest text-on-surface-variant mb-1">Nome para salvar</label>
              <input
                type="text"
                value={saveName}
                onChange={e => setSaveName(e.target.value)}
                placeholder={nome || 'Nome da planta'}
                className="w-full bg-surface-container-high text-on-surface px-3 py-2 text-sm focus:outline-none border-b-2 border-transparent focus:border-primary-container transition-colors"
                onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
                autoFocus
              />
            </div>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-primary-container text-on-primary-container text-xs font-headline font-bold uppercase tracking-widest hover:bg-primary transition-colors"
            >
              Confirmar
            </button>
            <button
              onClick={() => { setShowSavePanel(false); setSaveName('') }}
              className="px-4 py-2 bg-surface-container-high text-on-surface-variant text-xs font-headline font-bold uppercase tracking-widest hover:bg-surface-container-highest transition-colors"
            >
              Cancelar
            </button>
          </div>
        )}

        {savedPlants.length === 0 ? (
          <p className="text-sm text-on-surface-variant/60">Nenhuma planta salva ainda. Crie uma planta e clique em "Salvar Planta".</p>
        ) : (
          <div className="space-y-2">
            {savedPlants.map(plant => (
              <div key={plant.id} className="flex items-center justify-between bg-surface-container px-4 py-3 border border-outline-variant/10 hover:border-primary-container/20 transition-colors">
                <div>
                  <div className="font-headline font-bold text-sm text-on-surface">{plant.name}</div>
                  <div className="text-[10px] text-on-surface-variant mt-0.5">
                    {new Date(plant.savedAt).toLocaleDateString('pt-BR')} ·{' '}
                    {plant.data.W}×{plant.data.H}m · cabo {plant.data.CABO}m ·{' '}
                    {(plant.data.ports?.length || 0)} porta{(plant.data.ports?.length || 0) !== 1 ? 's' : ''}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleLoad(plant)}
                    className="px-3 py-1.5 text-[10px] font-headline font-bold uppercase tracking-widest bg-primary-container/10 text-primary-container border border-primary-container/20 hover:bg-primary-container hover:text-on-primary-container transition-colors"
                  >
                    Carregar
                  </button>
                  <button
                    onClick={() => handleDeleteSaved(plant.id)}
                    className="px-3 py-1.5 text-[10px] font-headline font-bold uppercase tracking-widest bg-transparent text-error border border-error/20 hover:bg-error hover:text-on-error transition-colors"
                  >
                    <span className="material-symbols-outlined text-xs">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
