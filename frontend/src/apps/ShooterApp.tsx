import { useEffect, useRef, useState, useCallback } from 'react';
import { Crosshair, Shield, Zap, Skull, Timer, Trophy, RotateCcw } from 'lucide-react';

const MAP = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 1],
    [1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1],
    [1, 0, 1, 0, 1, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
    [1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 1],
    [1, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

const ROT_SPEED = 0.05;
const MOVE_SPEED = 0.08;
const GAME_TIME = 120; // 2 minutes
const TARGET_KILLS = 10;

interface Enemy {
    id: number;
    x: number;
    y: number;
    alive: boolean;
}

const ShooterApp = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stats, setStats] = useState({ health: 100, kills: 0, ammo: 100 });
    const [timeLeft, setTimeLeft] = useState(GAME_TIME);
    const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');

    // Game State Ref
    const gameState = useRef({
        pos: { x: 5.5, y: 5.5 },
        dir: { x: -1, y: 0 },
        plane: { x: 0, y: 0.66 },
        isShooting: false,
        lastShootTime: 0,
        keys: {} as { [key: string]: boolean },
        enemies: [] as Enemy[],
        enemyCounter: 0,
        zBuffer: [] as number[]
    });

    const spawnEnemy = useCallback(() => {
        let x, y;
        do {
            x = Math.random() * (MAP.length - 2) + 1;
            y = Math.random() * (MAP[0].length - 2) + 1;
        } while (MAP[Math.floor(x)][Math.floor(y)] !== 0);

        const newEnemy = {
            id: gameState.current.enemyCounter++,
            x,
            y,
            alive: true
        };
        gameState.current.enemies.push(newEnemy);
    }, []);

    const resetGame = useCallback(() => {
        gameState.current.enemies = [];
        gameState.current.pos = { x: 5.5, y: 5.5 };
        gameState.current.dir = { x: -1, y: 0 };
        gameState.current.plane = { x: 0, y: 0.66 };
        setStats({ health: 100, kills: 0, ammo: 100 });
        setTimeLeft(GAME_TIME);
        setGameStatus('playing');
        for (let i = 0; i < 5; i++) spawnEnemy();
    }, [spawnEnemy]);

    useEffect(() => {
        for (let i = 0; i < 5; i++) spawnEnemy();
    }, [spawnEnemy]);

    // Timer Effect
    useEffect(() => {
        if (gameStatus !== 'playing') return;
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    setGameStatus('lost');
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [gameStatus]);

    const shoot = useCallback(() => {
        if (gameStatus !== 'playing') return;
        const now = Date.now();
        if (now - gameState.current.lastShootTime < 250) return;
        if (stats.ammo <= 0) return;

        gameState.current.isShooting = true;
        gameState.current.lastShootTime = now;

        setStats(prev => ({ ...prev, ammo: Math.max(0, prev.ammo - 1) }));

        // Hit Detection (Doom style: check if ray hits enemy near screen center)
        const state = gameState.current;
        let hitSomething = false;

        state.enemies.forEach(enemy => {
            if (!enemy.alive) return;

            // Simple vector math for hit detection
            const relX = enemy.x - state.pos.x;
            const relY = enemy.y - state.pos.y;

            // Angle to enemy
            const angleToEnemy = Math.atan2(relY, relX);
            const playerAngle = Math.atan2(state.dir.y, state.dir.x);
            let diff = angleToEnemy - playerAngle;

            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;

            const dist = Math.sqrt(relX * relX + relY * relY);

            // If enemy is centered and within reasonable distance
            if (Math.abs(diff) < 0.15 && dist < 15 && !hitSomething) {
                enemy.alive = false;
                hitSomething = true;
                setStats(prev => {
                    const newKills = prev.kills + 1;
                    if (newKills >= TARGET_KILLS) setGameStatus('won');
                    return { ...prev, kills: newKills };
                });
                setTimeout(spawnEnemy, 2000); // Respawn after delay
            }
        });

        setTimeout(() => {
            gameState.current.isShooting = false;
        }, 100);
    }, [stats.ammo, gameStatus, spawnEnemy]);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        gameState.current.keys[e.code] = true;
        if (e.code === 'Space') {
            e.preventDefault();
            shoot();
        }
    }, [shoot]);

    const handleKeyUp = useCallback((e: KeyboardEvent) => {
        gameState.current.keys[e.code] = false;
    }, []);

    const update = () => {
        if (gameStatus !== 'playing') return;
        const state = gameState.current;
        const k = state.keys;

        // Rotation
        if (k['ArrowLeft'] || k['KeyA']) {
            const oldDirX = state.dir.x;
            state.dir.x = state.dir.x * Math.cos(ROT_SPEED) - state.dir.y * Math.sin(ROT_SPEED);
            state.dir.y = oldDirX * Math.sin(ROT_SPEED) + state.dir.y * Math.cos(ROT_SPEED);
            const oldPlaneX = state.plane.x;
            state.plane.x = state.plane.x * Math.cos(ROT_SPEED) - state.plane.y * Math.sin(ROT_SPEED);
            state.plane.y = oldPlaneX * Math.sin(ROT_SPEED) + state.plane.y * Math.cos(ROT_SPEED);
        }
        if (k['ArrowRight'] || k['KeyD']) {
            const oldDirX = state.dir.x;
            state.dir.x = state.dir.x * Math.cos(-ROT_SPEED) - state.dir.y * Math.sin(-ROT_SPEED);
            state.dir.y = oldDirX * Math.sin(-ROT_SPEED) + state.dir.y * Math.cos(-ROT_SPEED);
            const oldPlaneX = state.plane.x;
            state.plane.x = state.plane.x * Math.cos(-ROT_SPEED) - state.plane.y * Math.sin(-ROT_SPEED);
            state.plane.y = oldPlaneX * Math.sin(-ROT_SPEED) + state.plane.y * Math.cos(-ROT_SPEED);
        }

        // Movement
        if (k['ArrowUp'] || k['KeyW']) {
            const nextX = state.pos.x + state.dir.x * MOVE_SPEED;
            const nextY = state.pos.y + state.dir.y * MOVE_SPEED;
            if (MAP[Math.floor(nextX)][Math.floor(state.pos.y)] === 0) state.pos.x = nextX;
            if (MAP[Math.floor(state.pos.x)][Math.floor(nextY)] === 0) state.pos.y = nextY;
        }
        if (k['ArrowDown'] || k['KeyS']) {
            const nextX = state.pos.x - state.dir.x * MOVE_SPEED;
            const nextY = state.pos.y - state.dir.y * MOVE_SPEED;
            if (MAP[Math.floor(nextX)][Math.floor(state.pos.y)] === 0) state.pos.x = nextX;
            if (MAP[Math.floor(state.pos.x)][Math.floor(nextY)] === 0) state.pos.y = nextY;
        }
    };

    const render = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const w = canvas.width;
        const h = canvas.height;
        const state = gameState.current;

        // Reset Z-buffer
        state.zBuffer = new Array(w).fill(Infinity);

        // Clear
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, w, h);

        // Ceiling and Floor
        ctx.fillStyle = '#222';
        ctx.fillRect(0, 0, w, h / 2);
        ctx.fillStyle = '#333';
        ctx.fillRect(0, h / 2, w, h / 2);

        // Raycasting Walls
        for (let x = 0; x < w; x++) {
            const cameraX = 2 * x / w - 1;
            const rayDirX = state.dir.x + state.plane.x * cameraX;
            const rayDirY = state.dir.y + state.plane.y * cameraX;

            let mapX = Math.floor(state.pos.x);
            let mapY = Math.floor(state.pos.y);

            const deltaDistX = Math.abs(1 / rayDirX);
            const deltaDistY = Math.abs(1 / rayDirY);

            let sideDistX, sideDistY;
            let stepX, stepY;

            if (rayDirX < 0) { stepX = -1; sideDistX = (state.pos.x - mapX) * deltaDistX; }
            else { stepX = 1; sideDistX = (mapX + 1.0 - state.pos.x) * deltaDistX; }

            if (rayDirY < 0) { stepY = -1; sideDistY = (state.pos.y - mapY) * deltaDistY; }
            else { stepY = 1; sideDistY = (mapY + 1.0 - state.pos.y) * deltaDistY; }

            let hit = 0, side = 0;
            while (hit === 0) {
                if (sideDistX < sideDistY) { sideDistX += deltaDistX; mapX += stepX; side = 0; }
                else { sideDistY += deltaDistY; mapY += stepY; side = 1; }
                if (MAP[mapX][mapY] > 0) hit = 1;
            }

            let perpWallDist;
            if (side === 0) perpWallDist = (mapX - state.pos.x + (1 - stepX) / 2) / rayDirX;
            else perpWallDist = (mapY - state.pos.y + (1 - stepY) / 2) / rayDirY;

            state.zBuffer[x] = perpWallDist;

            const lineH = Math.floor(h / perpWallDist);
            const drawStart = -lineH / 2 + h / 2;
            const brightness = Math.min(100, 200 / perpWallDist);
            ctx.strokeStyle = `hsl(0, 100%, ${brightness / (side === 1 ? 6 : 4)}%)`;

            ctx.beginPath();
            ctx.moveTo(x, drawStart);
            ctx.lineTo(x, drawStart + lineH);
            ctx.stroke();
        }

        // Raycasting Enemies (Sprites)
        const sortedEnemies = [...state.enemies].sort((a, b) => {
            const distA = Math.pow(state.pos.x - a.x, 2) + Math.pow(state.pos.y - a.y, 2);
            const distB = Math.pow(state.pos.x - b.x, 2) + Math.pow(state.pos.y - b.y, 2);
            return distB - distA;
        });

        sortedEnemies.forEach(enemy => {
            if (!enemy.alive) return;

            const spriteX = enemy.x - state.pos.x;
            const spriteY = enemy.y - state.pos.y;

            const invDet = 1.0 / (state.plane.x * state.dir.y - state.dir.x * state.plane.y);
            const transformX = invDet * (state.dir.y * spriteX - state.dir.x * spriteY);
            const transformY = invDet * (-state.plane.y * spriteX + state.plane.x * spriteY);

            const spriteScreenX = Math.floor((w / 2) * (1 + transformX / transformY));
            const spriteHeight = Math.abs(Math.floor(h / transformY));
            const drawStartY = -spriteHeight / 2 + h / 2;
            const drawEndY = spriteHeight / 2 + h / 2;
            const spriteWidth = Math.abs(Math.floor(h / transformY));
            const drawStartX = Math.floor(-spriteWidth / 2 + spriteScreenX);
            const drawEndX = Math.floor(spriteWidth / 2 + spriteScreenX);

            if (transformY > 0) {
                for (let stripe = drawStartX; stripe < drawEndX; stripe++) {
                    if (stripe > 0 && stripe < w && transformY < state.zBuffer[stripe]) {
                        // Drawing simple "demon" silhouette
                        ctx.fillStyle = `rgba(255, 0, 0, ${Math.min(1, 2 / transformY)})`;
                        ctx.fillRect(stripe, drawStartY, 1, drawEndY - drawStartY);

                        // Eyes
                        if (stripe > spriteScreenX - 5 && stripe < spriteScreenX + 5) {
                            ctx.fillStyle = '#fff';
                            ctx.fillRect(stripe, drawStartY + spriteHeight / 4, 1, 5);
                        }
                    }
                }
            }
        });

        // Weapon Overlay
        const weaponX = w / 2 - 100;
        const weaponY = h - 200 + (state.isShooting ? 40 : 0);
        ctx.fillStyle = '#222';
        ctx.fillRect(weaponX + 40, weaponY + 50, 120, 150);
        ctx.fillStyle = '#444';
        ctx.fillRect(weaponX + 60, weaponY + 20, 80, 100);

        if (state.isShooting) {
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(w / 2, weaponY + 20, 40, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ff0';
            ctx.beginPath();
            ctx.arc(w / 2, weaponY + 20, 20, 0, Math.PI * 2);
            ctx.fill();
        }
    };

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        let frameId: number;
        const loop = () => {
            update();
            render();
            frameId = requestAnimationFrame(loop);
        };
        frameId = requestAnimationFrame(loop);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            cancelAnimationFrame(frameId);
        };
    }, [handleKeyDown, handleKeyUp, gameStatus]); // Re-bind on status change

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="win-app bg-black text-white overflow-hidden flex flex-col h-full font-mono relative">
            <div className="win-app-header !bg-zinc-900 !border-zinc-800">
                <Crosshair size={20} className="text-red-500 animate-pulse" />
                <div className="win-app-title">
                    <h1 className="!text-red-600 font-black italic">DOOM.EXE</h1>
                    <div className="flex items-center gap-4 !text-zinc-500 text-[10px]">
                        <span className="flex items-center gap-1"><Timer size={12} /> {formatTime(timeLeft)}</span>
                        <span>[Space] Shoot</span>
                    </div>
                </div>
                <div className="ml-auto flex items-center gap-2 pr-4 text-[10px] text-zinc-500 font-black">
                    TARGET: {stats.kills}/{TARGET_KILLS} KILLS
                </div>
            </div>

            <div className="flex-1 relative bg-black">
                <canvas
                    ref={canvasRef}
                    width={800}
                    height={600}
                    className="w-full h-full object-cover"
                />

                {/* Result Overlays */}
                {gameStatus === 'won' && (
                    <div className="absolute inset-0 bg-green-900/40 backdrop-blur-md flex flex-col items-center justify-center z-50 animate-in fade-in zoom-in duration-300">
                        <Trophy size={80} className="text-yellow-400 mb-4 drop-shadow-[0_0_20px_rgba(250,204,21,0.5)]" />
                        <h2 className="text-6xl font-black italic text-white mb-2">MISSION COMPLETE</h2>
                        <p className="text-xl text-green-200 mb-8 uppercase tracking-widest">You have Purged the system</p>
                        <button onClick={resetGame} className="win-button !bg-white !text-green-900 hover:!bg-zinc-200 px-8 py-3 rounded-none font-bold flex items-center gap-2">
                            <RotateCcw size={20} /> REBOOT SYSTEM
                        </button>
                    </div>
                )}

                {gameStatus === 'lost' && (
                    <div className="absolute inset-0 bg-red-950/80 backdrop-blur-md flex flex-col items-center justify-center z-50 animate-in fade-in zoom-in duration-300">
                        <Skull size={80} className="text-red-600 mb-4 drop-shadow-[0_0_20px_rgba(220,38,38,0.5)]" />
                        <h2 className="text-6xl font-black italic text-white mb-2">SYSTEM FAILURE</h2>
                        <p className="text-xl text-red-300 mb-8 uppercase tracking-widest">Time Expired</p>
                        <button onClick={resetGame} className="win-button !bg-red-600 !text-white hover:!bg-red-700 px-8 py-3 rounded-none font-bold flex items-center gap-2">
                            <RotateCcw size={20} /> TRY AGAIN
                        </button>
                    </div>
                )}

                {/* HUD */}
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-zinc-900 border-t-4 border-zinc-800 flex items-center justify-around px-8">
                    <div className="text-center">
                        <div className="text-[10px] text-zinc-500">HEALTH</div>
                        <div className="text-3xl font-black text-green-500 flex items-center gap-2">
                            <Shield size={20} /> {stats.health}%
                        </div>
                    </div>
                    <div className="w-20 h-20 border-4 border-zinc-800 bg-zinc-950 flex items-center justify-center">
                        <Skull size={40} className={gameStatus === 'playing' ? "text-zinc-700" : "text-red-600 animate-pulse"} />
                    </div>
                    <div className="text-center">
                        <div className="text-[10px] text-zinc-500">AMMO</div>
                        <div className="text-3xl font-black text-yellow-500 flex items-center gap-2">
                            <Zap size={20} /> {stats.ammo}
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-[10px] text-zinc-500">KILLS</div>
                        <div className="text-3xl font-black text-white">
                            {stats.kills.toString().padStart(2, '0')}/{TARGET_KILLS}
                        </div>
                    </div>
                </div>

                {/* Reticle */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                    <div className="w-8 h-8 border-2 border-red-500 rounded-full flex items-center justify-center">
                        <div className="w-1 h-1 bg-red-500 rounded-full" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShooterApp;
