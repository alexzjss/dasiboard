// ===== DASIBOARD PAC-MAN EASTER EGG =====
// Unlock: click every entity card in the Entidades tab (all must be visited)

const _pacVisitedEntities = new Set();
let _pacAllEntityIds = [];

function trackEntityVisit(entityId) {
  _pacVisitedEntities.add(entityId);
  if (typeof entidadesData !== 'undefined' && entidadesData.length) {
    _pacAllEntityIds = entidadesData.map(e => e.id);
  }
  _checkPacManUnlock();
}

function _checkPacManUnlock() {
  if (!_pacAllEntityIds.length) {
    if (typeof entidadesData !== 'undefined' && entidadesData.length) {
      _pacAllEntityIds = entidadesData.map(e => e.id);
    } else return;
  }
  const allVisited = _pacAllEntityIds.every(id => _pacVisitedEntities.has(id));
  if (allVisited && _pacAllEntityIds.length > 0) {
    setTimeout(triggerPacManEasterEgg, 600);
    _pacVisitedEntities.clear();
  }
}

// Legacy nav tracker kept for compat
function trackEggNavigation(page) {}

// ===== GAME CONSTANTS =====
const CELL = 20, COLS = 21, ROWS = 15;

const MAZE_TEMPLATE = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
  [1,3,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,3,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,0,1,0,1,1,1,1,1,1,1,0,1,0,1,1,0,1],
  [1,0,0,0,0,1,0,0,0,1,4,1,0,0,0,1,0,0,0,0,1],
  [1,1,1,1,0,1,1,1,2,1,4,1,2,1,1,1,0,1,1,1,1],
  [1,1,1,1,0,1,2,2,2,4,4,4,2,2,2,1,0,1,1,1,1],
  [1,1,1,1,0,1,2,1,1,1,2,1,1,1,2,1,0,1,1,1,1],
  [4,4,4,4,0,2,2,1,4,4,4,4,4,1,2,2,0,4,4,4,4],
  [1,1,1,1,0,1,2,1,1,1,1,1,1,1,2,1,0,1,1,1,1],
  [1,1,1,1,0,1,2,2,2,2,2,2,2,2,2,1,0,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,1,4,1,0,0,0,0,0,0,0,0,1],
  [1,3,1,0,1,1,1,0,0,0,0,0,0,0,1,1,1,0,1,3,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

let gameState = null, gameAnim = null;

function triggerPacManEasterEgg() {
  if (document.getElementById('pacman-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'pacman-overlay';
  overlay.className = 'pacman-overlay';
  overlay.innerHTML = `
    <div class="pacman-box" id="pacman-box">
      <div class="pacman-header">
        <span class="pacman-title">🦅 GrifinMAN</span>
        <span class="pacman-score">Pontos: <span id="pac-score">0</span></span>
        <button class="pacman-close" onclick="closePacMan()">×</button>
      </div>
      <canvas id="pac-canvas" class="pacman-canvas" width="${COLS*CELL}" height="${ROWS*CELL}"></canvas>
      <div class="pacman-controls">
        <span class="pacman-hint" id="pac-hint">← ↑ ↓ → ou WASD para mover</span>
        <span class="pacman-lives">Vidas: <span id="pac-lives">♦♦♦</span></span>
      </div>
      <div class="pacman-dpad" id="pacman-dpad">
        <div class="dpad-row"><button class="dpad-btn dpad-up" id="dpad-up">▲</button></div>
        <div class="dpad-row dpad-middle">
          <button class="dpad-btn dpad-left" id="dpad-left">◀</button>
          <div class="dpad-center">🦅</div>
          <button class="dpad-btn dpad-right" id="dpad-right">▶</button>
        </div>
        <div class="dpad-row"><button class="dpad-btn dpad-down" id="dpad-down">▼</button></div>
        <button class="dpad-restart" id="dpad-restart" onclick="initPacGame()">↺</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) closePacMan(); });

  requestAnimationFrame(() => {
    const box = document.getElementById('pacman-box');
    const canvas = document.getElementById('pac-canvas');
    if (box && canvas) {
      const maxW = box.clientWidth - 32;
      const maxH = window.innerHeight * 0.44;
      const scale = Math.min(1, maxW / (COLS*CELL), maxH / (ROWS*CELL));
      canvas.style.width  = Math.round(COLS * CELL * scale) + 'px';
      canvas.style.height = Math.round(ROWS * CELL * scale) + 'px';
      if (window.innerWidth < 600) {
        const h = document.getElementById('pac-hint');
        if (h) h.textContent = 'Use o direcional abaixo';
      }
    }
    initPacGame();
    _setupDpad();
  });
}

function _setupDpad() {
  [['dpad-up',[0,-1]],['dpad-down',[0,1]],['dpad-left',[-1,0]],['dpad-right',[1,0]]].forEach(([id,[dx,dy]]) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    const go = (e) => {
      e.preventDefault();
      if (!gameState) return;
      gameState.player.nextDx = dx;
      gameState.player.nextDy = dy;
      if (gameState.gameOver || gameState.won) initPacGame();
    };
    btn.addEventListener('touchstart', go, { passive: false });
    btn.addEventListener('mousedown',  go);
  });
}

function closePacMan() {
  if (gameAnim) cancelAnimationFrame(gameAnim);
  gameAnim = null; gameState = null;
  document.getElementById('pacman-overlay')?.remove();
  document.removeEventListener('keydown', pacKeyHandler);
}

function initPacGame() {
  const maze = MAZE_TEMPLATE.map(r => [...r]);
  let totalDots = 0;
  maze.forEach(row => row.forEach(c => { if (c===0||c===3) totalDots++; }));

  gameState = {
    maze, totalDots, dotsEaten: 0, score: 0, lives: 3,
    frameCount: 0, gameOver: false, won: false, message: '', msgTimer: 0,
    player: { x:1, y:1, dx:0, dy:0, nextDx:1, nextDy:0, mouthOpen:true, powered:0 },
    enemies: [
      { x:9,  y:7, dx:1,  dy:0,  type:0, frightened:0, homeX:9,  homeY:7  },
      { x:10, y:7, dx:-1, dy:0,  type:1, frightened:0, homeX:10, homeY:7  },
      { x:11, y:8, dx:0,  dy:1,  type:2, frightened:0, homeX:11, homeY:8  },
      { x:10, y:9, dx:0,  dy:-1, type:3, frightened:0, homeX:10, homeY:9  },
    ],
  };
  document.addEventListener('keydown', pacKeyHandler);
  if (gameAnim) cancelAnimationFrame(gameAnim);
  gamePacLoop();
}

function pacKeyHandler(e) {
  if (!gameState) return;
  const dirs = {ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1],
                 a:[-1,0],d:[1,0],w:[0,-1],s:[0,1],A:[-1,0],D:[1,0],W:[0,-1],S:[0,1]};
  const d = dirs[e.key];
  if (d) { e.preventDefault(); gameState.player.nextDx=d[0]; gameState.player.nextDy=d[1]; }
  if (e.key==='Escape') closePacMan();
  if (e.key===' ' && (gameState.gameOver||gameState.won)) { e.preventDefault(); initPacGame(); }
}

function canMove(maze, x, y, dx, dy) {
  const nx=x+dx, ny=y+dy;
  if (nx<0||nx>=COLS||ny<0||ny>=ROWS) return false;
  return maze[ny][nx] !== 1;
}

function gamePacLoop() {
  if (!gameState) return;
  const canvas = document.getElementById('pac-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const { player:p, enemies, maze } = gameState;

  gameState.frameCount++;

  if (!gameState.gameOver && !gameState.won) {
    if (gameState.frameCount % 8 === 0) {
      if (canMove(maze,p.x,p.y,p.nextDx,p.nextDy)) { p.dx=p.nextDx; p.dy=p.nextDy; }
      if (canMove(maze,p.x,p.y,p.dx,p.dy)) {
        p.x+=p.dx; p.y+=p.dy;
        if (p.x<0) p.x=COLS-1; if (p.x>=COLS) p.x=0;
        const cell = maze[p.y][p.x];
        if (cell===0) { maze[p.y][p.x]=2; gameState.score+=10; gameState.dotsEaten++; }
        if (cell===3) {
          maze[p.y][p.x]=2; gameState.score+=50; gameState.dotsEaten++;
          enemies.forEach(en => { en.frightened=60; }); p.powered=60;
        }
      }
      p.mouthOpen=!p.mouthOpen;
    }
    if (gameState.frameCount % 12 === 0) {
      enemies.forEach(en => {
        if (en.frightened>0) en.frightened--;
        const dirs=[[1,0],[-1,0],[0,1],[0,-1]].sort(()=>Math.random()-.5);
        let best=null, bestDist=Infinity;
        for (const [dx,dy] of dirs) {
          if (dx===-en.dx && dy===-en.dy) continue;
          if (!canMove(maze,en.x,en.y,dx,dy)) continue;
          const tx=en.frightened>0 ? Math.floor(COLS/2) : p.x;
          const ty=en.frightened>0 ? Math.floor(ROWS/2) : p.y;
          const dist=Math.abs(en.x+dx-tx)+Math.abs(en.y+dy-ty);
          if (dist<bestDist) { bestDist=dist; best=[dx,dy]; }
        }
        if (best) { en.dx=best[0]; en.dy=best[1]; en.x+=en.dx; en.y+=en.dy; }
      });
    }
    enemies.forEach(en => {
      if (en.x===p.x && en.y===p.y) {
        if (en.frightened>0) {
          en.x=en.homeX; en.y=en.homeY; en.frightened=0;
          gameState.score+=200; gameState.msgTimer=30; gameState.message='+200!';
        } else {
          gameState.lives--;
          if (gameState.lives<=0) gameState.gameOver=true;
          else { p.x=1; p.y=1; p.dx=0; p.dy=0; }
        }
      }
    });
    if (gameState.dotsEaten>=gameState.totalDots) gameState.won=true;
    if (p.powered>0) p.powered--;
  }

  updatePacHUD();
  _drawPac(ctx, canvas.width, canvas.height);
  gameAnim = requestAnimationFrame(gamePacLoop);
}

function updatePacHUD() {
  if (!gameState) return;
  const se=document.getElementById('pac-score'), le=document.getElementById('pac-lives');
  if (se) se.textContent=gameState.score;
  if (le) le.textContent='♦'.repeat(Math.max(0,gameState.lives));
}

const ENEMY_EMOJIS = ['📚','📅','🧮','💻'];

function _drawPac(ctx, W, H) {
  const { maze, player:p, enemies } = gameState;
  const sx=W/(COLS*CELL), sy=H/(ROWS*CELL);
  ctx.save(); ctx.scale(sx,sy);
  ctx.fillStyle='#000'; ctx.fillRect(0,0,COLS*CELL,ROWS*CELL);

  maze.forEach((row,ry) => row.forEach((cell,rx) => {
    const cx=rx*CELL, cy=ry*CELL;
    if (cell===1) {
      ctx.fillStyle='#1a0a3a'; ctx.fillRect(cx,cy,CELL,CELL);
      ctx.strokeStyle='#6622cc'; ctx.lineWidth=1.5; ctx.strokeRect(cx+1,cy+1,CELL-2,CELL-2);
    } else if (cell===0) {
      ctx.fillStyle='#cc88ff'; ctx.beginPath();
      ctx.arc(cx+CELL/2,cy+CELL/2,2.5,0,Math.PI*2); ctx.fill();
    } else if (cell===3) {
      const pulse=0.7+0.3*Math.sin(gameState.frameCount*0.15);
      ctx.fillStyle=`rgba(255,200,68,${pulse})`; ctx.shadowColor='#ffcc44'; ctx.shadowBlur=6;
      ctx.beginPath(); ctx.arc(cx+CELL/2,cy+CELL/2,5,0,Math.PI*2); ctx.fill(); ctx.shadowBlur=0;
    }
  }));

  // Player
  const px=p.x*CELL+CELL/2, py=p.y*CELL+CELL/2;
  ctx.font=`${CELL-2}px serif`; ctx.textAlign='center'; ctx.textBaseline='middle';
  if (p.powered>0) { ctx.shadowColor='#ffcc44'; ctx.shadowBlur=10; }
  ctx.save(); ctx.translate(px,py);
  const ang=p.dx===1?0:p.dx===-1?Math.PI:p.dy===-1?-Math.PI/2:p.dy===1?Math.PI/2:0;
  ctx.rotate(ang); ctx.fillText(p.mouthOpen?'🦅':'🐦',0,1); ctx.restore(); ctx.shadowBlur=0;

  // Enemies
  enemies.forEach(en => {
    ctx.font=`${CELL-2}px serif`; ctx.textAlign='center'; ctx.textBaseline='middle';
    const flash=en.frightened>0&&en.frightened<20&&gameState.frameCount%6<3;
    const emoji=en.frightened>0&&!flash?'😱':ENEMY_EMOJIS[en.type];
    if (en.frightened>0) ctx.globalAlpha=0.7+0.3*Math.sin(gameState.frameCount*0.3);
    ctx.fillText(emoji,en.x*CELL+CELL/2,en.y*CELL+CELL/2+1); ctx.globalAlpha=1;
  });

  // Overlay
  const mid=ROWS*CELL/2;
  if (gameState.won||gameState.gameOver) {
    ctx.fillStyle='rgba(0,0,0,.78)'; ctx.fillRect(0,mid-44,COLS*CELL,88);
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if (gameState.won) {
      ctx.fillStyle='#ffcc44'; ctx.font='bold 20px sans-serif';
      ctx.fillText('🎉 Você venceu! '+gameState.score+' pts',COLS*CELL/2,mid-14);
    } else {
      ctx.fillStyle='#ff4060'; ctx.font='bold 20px sans-serif';
      ctx.fillText('💀 Game Over',COLS*CELL/2,mid-14);
    }
    ctx.fillStyle='#cc88ff'; ctx.font='12px monospace';
    ctx.fillText('Espaço ou ↺ para '+(gameState.won?'jogar de novo':'reiniciar'),COLS*CELL/2,mid+18);
  }

  if (gameState.msgTimer>0) {
    gameState.msgTimer--;
    ctx.fillStyle='#ffcc44'; ctx.font='bold 14px monospace';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(gameState.message,px,py-16);
  }
  ctx.restore();
}
