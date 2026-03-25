/**
 * Area definitions and map creation utilities
 * Extracted from page.tsx for world module refactoring
 */

export const T = { Grass: 0, Wall: 1, Water: 2, Town: 3, Cave: 4, Castle: 5 };

export const ROWS = 9, COLS = 13;

/**
 * Initialize grid with grass and add wall borders
 */
function initializeGridWithBorders() {
    const g = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => T.Grass));

    // Add borders
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (r === 0 || c === 0 || r === ROWS - 1 || c === COLS - 1) {
                g[r][c] = T.Wall;
            }
        }
    }

    return g;
}

/**
 * Apply water pattern to grid
 */
function applyWaterPattern(g, pattern) {
    if (pattern === 'river') {
        for (let r = 2; r < ROWS - 2; r++) {
            g[r][4] = T.Water;
        }
    } else if (pattern === 'lake') {
        for (let r = 3; r < 6; r++) {
            for (let c = 5; c < 8; c++) {
                g[r][c] = T.Water;
            }
        }
    }
}

/**
 * Place special tiles (town, cave, castle)
 */
function placeSpecialTiles(
    g,
    townPos,
    cavePos,
    castlePos
) {
    if (townPos) g[townPos.r][townPos.c] = T.Town;
    if (cavePos) g[cavePos.r][cavePos.c] = T.Cave;
    if (castlePos) g[castlePos.r][castlePos.c] = T.Castle;
}

/**
 * Place custom walls (avoiding special tiles)
 */
function placeCustomWalls(g, wallPositions) {
    wallPositions?.forEach(({ r, c }) => {
        // POI（Town/Cave/Castle）の上には壁を置かない
        const cur = g[r][c];
        if (cur === T.Town || cur === T.Cave || cur === T.Castle) return;
        g[r][c] = T.Wall;
    });
}

export function createMap(config) {
    const g = initializeGridWithBorders();
    applyWaterPattern(g, config.waterPattern);
    placeSpecialTiles(g, config.townPos, config.cavePos, config.castlePos);
    placeCustomWalls(g, config.wallPositions);
    return g;
}

/**
 * Generate a random map layout for endless dungeon mode
 * Uses a simple seed-based generation for reproducibility
 */
/**
 * Creates a seeded random number generator using xorshift32
 */
function createSeededRandom(seed) {
    let state = (seed >>> 0) || 1;
    return () => {
        let x = state;
        x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
        state = x >>> 0;
        return (state >>> 0) / 0xFFFFFFFF;
    };
}

/**
 * Adds wall borders around the grid edges
 */
function addBorders(grid) {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (r === 0 || c === 0 || r === ROWS - 1 || c === COLS - 1) {
                grid[r][c] = T.Wall;
            }
        }
    }
}

/**
 * Adds random water features to the grid
 */
function addWaterPatternRand(grid, rand) {
    const waterType = Math.floor(rand() * 4);

    if (waterType === 0) {
        // Vertical river
        const col = 4 + Math.floor(rand() * 4);
        for (let r = 2; r < ROWS - 2; r++) {
            if (grid[r][col] === T.Grass) {
                grid[r][col] = T.Water;
            }
        }
    } else if (waterType === 1) {
        // Small lake
        const centerR = 3 + Math.floor(rand() * 2);
        const centerC = 5 + Math.floor(rand() * 3);
        for (let r = centerR; r < Math.min(centerR + 3, ROWS - 1); r++) {
            for (let c = centerC; c < Math.min(centerC + 3, COLS - 1); c++) {
                if (grid[r][c] === T.Grass) {
                    grid[r][c] = T.Water;
                }
            }
        }
    }
}

/**
 * Checks if a position should be protected from obstacles
 */
function isProtectedPosition(r, c, dojoPos) {
    return (r === 2 && c === 2) || (r === 6 && c === 10) || (r === dojoPos.r && c === dojoPos.c);
}

/**
 * Adds random wall obstacles to the grid
 */
function addRandomWalls(grid, rand, dojoPos) {
    const numWalls = 3 + Math.floor(rand() * 5);
    for (let i = 0; i < numWalls; i++) {
        const r = 2 + Math.floor(rand() * (ROWS - 4));
        const c = 2 + Math.floor(rand() * (COLS - 4));
        if (grid[r][c] === T.Grass && !isProtectedPosition(r, c, dojoPos)) {
            grid[r][c] = T.Wall;
        }
    }
}

/**
 * Adds random cave tiles to the grid
 */
function addRandomCaves(grid, rand, dojoPos) {
    const numCaves = 1 + Math.floor(rand() * 2);
    for (let i = 0; i < numCaves; i++) {
        const r = 2 + Math.floor(rand() * (ROWS - 4));
        const c = 3 + Math.floor(rand() * (COLS - 6));
        if (grid[r][c] === T.Grass && !isProtectedPosition(r, c, dojoPos)) {
            grid[r][c] = T.Cave;
        }
    }
}

/**
 * Creates a random map with town, castle, water, walls, and caves
 */
export function createRandomMap(seed) {
    const grid = Array.from({ length: ROWS }, () =>
        Array.from({ length: COLS }, () => T.Grass)
    );

    const rand = createSeededRandom(seed);
    const dojoPos = { r: 4, c: 2 };

    addBorders(grid);

    // Town at start
    grid[2][2] = T.Town;

    // Castle/stairs at end
    grid[6][10] = T.Castle;

    addWaterPatternRand(grid, rand);
    addRandomWalls(grid, rand, dojoPos);
    addRandomCaves(grid, rand, dojoPos);

    return grid;
}

// Simple reachability check (passable tiles: Grass/Town/Cave/Castle)
export function isPassable(t) {
    return t === T.Grass || t === T.Town || t === T.Cave || t === T.Castle;
}

/**
 * 4-directional movement vectors (up, down, left, right)
 */
const DIR4 = [{ r: 1, c: 0 }, { r: -1, c: 0 }, { r: 0, c: 1 }, { r: 0, c: -1 }];

/**
 * Check if a position is valid (both endpoints passable)
 */
function areEndpointsValid(
    map,
    from,
    to,
    inBounds
) {
    if (!inBounds(from.r, from.c) || !inBounds(to.r, to.c)) return false;
    if (!isPassable(map[from.r][from.c]) || !isPassable(map[to.r][to.c])) return false;
    return true;
}

/**
 * Process neighbor positions for BFS pathfinding
 */
function exploreNeighbors(
    cur,
    map,
    seen,
    queue,
    inBounds
) {
    for (const d of DIR4) {
        const nr = cur.r + d.r;
        const nc = cur.c + d.c;

        // Skip if out of bounds or already visited
        if (!inBounds(nr, nc) || seen[nr][nc]) continue;

        // Skip if not passable
        if (!isPassable(map[nr][nc])) continue;

        // Mark as seen and add to queue
        seen[nr][nc] = true;
        queue.push({ r: nr, c: nc });
    }
}

/**
 * BFS pathfinding to check if there's a path between two positions
 */
export function hasPath(map, from, to) {
    const H = map.length;
    const W = map[0]?.length ?? 0;
    const inBounds = (r, c) => r >= 0 && c >= 0 && r < H && c < W;

    // Validate endpoints
    if (!areEndpointsValid(map, from, to, inBounds)) return false;

    // Initialize BFS
    const queue = [from];
    const seen = Array.from({ length: H }, () => Array(W).fill(false));
    seen[from.r][from.c] = true;

    // BFS traversal
    while (queue.length > 0) {
        const cur = queue.shift();

        // Check if we reached the destination
        if (cur.r === to.r && cur.c === to.c) return true;

        // Explore neighbors
        exploreNeighbors(cur, map, seen, queue, inBounds);
    }

    return false;
}

// エリア7: 四聖獣の出現座標（分散配置）
export const GUARDIANS_A7 = {
    genbu: { r: 2, c: 10 }, // 北東
    seiryu: { r: 2, c: 4 },  // 北西
    suzaku: { r: 6, c: 4 },  // 南西
    byakko: { r: 6, c: 10 }  // 南東
};

export const AREAS = [
    {
        id: 1,
        name: "草原の村",
        description: "平和な草原地帯。冒険の始まりの地。",
        map: createMap({
            waterPattern: 'river',
            townPos: { r: 2, c: 2 },
            cavePos: { r: 6, c: 10 },
            wallPositions: [{ r: 4, c: 7 }, { r: 5, c: 7 }]
        }),
        startPos: { r: 2, c: 2 },
        bossName: "巨大スライム",
        bossPos: { r: 6, c: 10 },
        bossDefeated: false,
        dojoPos: { r: 4, c: 2 },
        story: {
            intro: "🌱 草原の村へようこそ、若き勇者よ。\n\n村長：「最近、洞窟から巨大なスライムが現れて\n村人たちを襲っているのじゃ...\n魔物退治の経験を積むには良い機会かもしれん。\n頼んだぞ、勇者！」\n\n【クリア条件】洞窟の奥にいる「巨大スライム」を倒す",
            bossEncounter: "🟢👑 洞窟の最深部...\n\n巨大スライムが姿を現した！\n「ぐにゅぐにゅ...ここは我が縄張り！\n侵入者は許さない！」\n\nいよいよ、草原の村を救う戦いが始まる！",
            victory: "🎉 巨大スライムを倒した！\n\n村長：「やったぞ！村に平和が戻った！\nお主こそ真の勇者じゃ！」\n\n村人たちの歓声が響き渡る。\nしかし、世界にはまだ多くの脅威が...\n\n次の目的地：深い森\n（より強力な魔物が待ち受けている）"
        }
    },
    {
        id: 2,
        name: "深い森",
        description: "うっそうとした森。オークたちが支配している。",
        map: createMap({
            waterPattern: 'none',
            townPos: { r: 2, c: 2 },
            cavePos: { r: 6, c: 6 },
            castlePos: { r: 2, c: 10 },
            wallPositions: [{ r: 3, c: 4 }, { r: 4, c: 4 }, { r: 5, c: 4 }, { r: 4, c: 8 }]
        }),
        startPos: { r: 2, c: 2 },
        bossName: "オークキング",
        bossPos: { r: 2, c: 10 },
        bossDefeated: false,
        dojoPos: { r: 5, c: 2 },
        story: {
            intro: "🌳 深い森に足を踏み入れた。\n\n森の精霊：「勇者よ、警告する。\nこの森はオークたちに占拠されている。\nその王、オークキングは残忍で強大だ。\n彼を倒さぬ限り、先へは進めぬ。」\n\n【クリア条件】城で「オークキング」を倒す",
            bossEncounter: "👹👑 城の王座の間...\n\nオークキング：「グオオオ！\nよくぞ我が城まで来たな、人間ども！\nだが、貴様らが我らオーク族に\n勝てると思うな！」\n\n森を解放するための戦いが始まる！",
            victory: "🎉 オークキングを倒した！\n\nオークキング：「くっ...まさか...\nこれほどの強者が...」\n\n森の精霊：「感謝する。森が解放された。\nだが、これから先はさらに危険だ。\n気をつけるのだ...」\n\n次の目的地：暗黒の洞窟"
        }
    },
    {
        id: 3,
        name: "暗黒の洞窟",
        description: "暗く深い洞窟。強力な魔物が潜む。",
        map: createMap({
            waterPattern: 'lake',
            townPos: { r: 2, c: 2 },
            castlePos: { r: 6, c: 10 },
            wallPositions: [
                { r: 2, c: 5 }, { r: 3, c: 5 }, { r: 5, c: 5 }, { r: 6, c: 5 },
                { r: 3, c: 9 }, { r: 4, c: 9 }, { r: 5, c: 9 }
            ]
        }),
        startPos: { r: 2, c: 2 },
        bossName: "洞窟の主",
        bossPos: { r: 6, c: 10 },
        bossDefeated: false,
        dojoPos: { r: 4, c: 2 },
        story: {
            intro: "🕳️ 暗黒の洞窟へようこそ...\n\n旅人：「この洞窟の奥には、\n古代から眠る「洞窟の主」がいるという。\n数百年も生き続ける魔物で、\n多くの勇者が挑んでは敗れ去った...\nおまえも気をつけろ。」\n\n【クリア条件】城で「洞窟の主」を倒す",
            bossEncounter: "🦖👑 洞窟の最深部では...\n\n地鳴りのような咆哮が響き渡る！\n\n洞窟の主：「グオオオオオ！！\n何百年ぶりか...我を起こしたのは誰だ！\nその罰、その身で受けるがいい！」\n\n伝説の魔物との戦い！",
            victory: "🎉 洞窟の主を倒した！\n\n洞窟の主：「まさか...このわしが...\n貴様、真の勇者であったか...」\n\n洞窟が静かになる。\n先へ進むと、火山地帯が見えてきた。\n熱気が伝わってくる...\n\n次の目的地：火山地帯"
        }
    },
    {
        id: 4,
        name: "火山地帯",
        description: "灼熱の火山。炎の魔物が住む危険な場所。",
        map: createMap({
            waterPattern: 'none',
            townPos: { r: 2, c: 2 },
            cavePos: { r: 6, c: 6 },
            castlePos: { r: 2, c: 10 },
            wallPositions: [
                { r: 3, c: 4 }, { r: 4, c: 4 }, { r: 3, c: 8 }, { r: 4, c: 8 }, { r: 5, c: 8 }
            ]
        }),
        startPos: { r: 2, c: 2 },
        bossName: "炎龍ヴォルカノ",
        bossPos: { r: 2, c: 10 },
        bossDefeated: false,
        dojoPos: { r: 5, c: 2 },
        story: {
            intro: "🌋 灼熱の火山地帯に到着した。\n\n火山の賢者：「よくぞここまで来た。\nこの火山には炎龍ヴォルカノが棲んでいる。\n古からこの地を支配し、\nその炎ですべてを焼き尽くす魔龍だ。\n並大抵の力では挑めぬぞ。」\n\n【クリア条件】城で「炎龍ヴォルカノ」を倒す",
            bossEncounter: "🐲👑 火山の火口付近では...\n\n地鳴りとともに、巨大な影が！\n\n炎龍ヴォルカノ：「グルルルルル！！\n人間どもが我が領域に足を踏み入れるとは！\n貴様らを炎で焼いてやる！」\n\n伝説の炎龍との決戦！",
            victory: "🎉 炎龍ヴォルカノを倒した！\n\nヴォルカノ：「グルル...まさか、\nこのわしが敗れるとは...」\n\n火山の賢者：「やったな！\n火山の炎が収まっていく...\nだが、最後の試練が待っている。\n気を引き締めていけ！」\n\n次の目的地：氷の大地"
        }
    },
    {
        id: 5,
        name: "氷の大地",
        description: "永遠の冬に閉ざされた氷の世界。",
        map: createMap({
            waterPattern: 'lake',
            townPos: { r: 2, c: 2 },
            cavePos: { r: 6, c: 6 },
            castlePos: { r: 2, c: 10 },
            wallPositions: [
                { r: 3, c: 4 }, { r: 4, c: 5 }, { r: 5, c: 4 }, { r: 4, c: 9 }
            ]
        }),
        startPos: { r: 2, c: 2 },
        bossName: "氷帝フリーザー",
        bossPos: { r: 2, c: 10 },
        bossDefeated: false,
        dojoPos: { r: 4, c: 2 },
        story: {
            intro: "❄️ 氷の大地に足を踏み入れた。\n\n氷の巫女：「この地は永遠の冬に閉ざされている。\n氷帝フリーザーの力によって...\n彼を倒さねば、魔王城への道は開かぬ。\nこれが最後から二番目の試練だ...」\n\n【クリア条件】城で「氷帝フリーザー」を倒す",
            bossEncounter: "❄️👑 氷の城では...\n\n凍てつくような寒気が満ちている。\n\n氷帝フリーザー：「よくぞここまで来たな。\nだが、ここが貴様の墓場だ。\nこの世界を永遠の氷で閉ざし、\n貴様もその一部としてやろう...」\n\n氷帝との決戦！",
            victory: "🎉 氷帝フリーザーを倒した！\n\nフリーザー：「まさか...わたしが...\n貴様は...真の勇者だ...」\n\n氷の巫女：「やった！氷が溶けていく！\nそして、見えるか？\nあれが魔王城だ...\nいよいよ最後の戦いだ。気をつけて！」\n\n次の目的地：魔王城（最終決戦）"
        }
    },
    {
        id: 6,
        name: "魔王城",
        description: "全ての元凶、魔王の居城。最後の戦いが待つ。",
        map: createMap({
            waterPattern: 'none',
            townPos: { r: 2, c: 2 },
            castlePos: { r: 6, c: 10 },
            wallPositions: [
                { r: 2, c: 6 }, { r: 3, c: 6 }, { r: 4, c: 6 }, { r: 5, c: 6 }, { r: 6, c: 6 },
                { r: 4, c: 4 }, { r: 4, c: 8 }
            ]
        }),
        startPos: { r: 2, c: 2 },
        bossName: "魔王ダークロード",
        bossPos: { r: 6, c: 10 },
        bossDefeated: false,
        dojoPos: { r: 4, c: 3 },
        story: {
            intro: "🏰 ついに魔王城に到達した。\n\n光の精霊：「よくぞここまで来た。\nこの城には、この世界を闇に閉ざそうとする\n魔王ダークロードがいる。\n彼を倒さねば、世界に平和は訪れぬ。\nこれが最後の戦いだ。勝利を祈る。」\n\n【クリア条件】城で「魔王ダークロード」を倒す",
            bossEncounter: "😈👑 魔王城、玉座の間...\n\n闇のオーラが渦巻いている。\n\n魔王ダークロード：「ハッハッハ！\nよくぞここまで来た。\n貴様の旅もここで終わりだ。\nわたしの闇の力、とくと見るがいい！」\n\n運命を懸けた最後の戦い！",
            victory: "🎉🎉🎉 魔王ダークロードを倒した！\n\nダークロード：「まさか...このわたしが...\n貴様は...本当の勇者だ...」\n\n闇が晴れ、光が世界を照らす！\n\n光の精霊：「やった！世界に平和が戻った！\nおめでとう、勇者よ！\nあなたの名は永遠に語り継がれるだろう！」\n\n★★★ 全エリアクリア！ ★★★\nおめでとうございます！"
        }
    }
    ,
    // 任意で行ける最終試練（解放条件: 6をクリア済み）
    {
        id: 7,
        name: "試練の塔",
        description: "最後の方で任意で挑める秘匿の塔。四聖獣に挑み、究極の報酬を得よ。",
        map: createMap({
            waterPattern: 'none',
            townPos: { r: 2, c: 2 },
            castlePos: { r: 6, c: 10 },
            wallPositions: [
                { r: 3, c: 4 }, { r: 4, c: 4 }, { r: 5, c: 4 },
                { r: 3, c: 8 }, { r: 4, c: 8 }, { r: 5, c: 8 }
            ]
        }),
        startPos: { r: 2, c: 2 },
        bossName: "四聖獣の祝福",
        bossPos: { r: 6, c: 10 },
        bossDefeated: false,
        dojoPos: { r: 4, c: 2 },
        mainline: false,
        optionalUnlockAfterAreaId: 6,
        story: {
            intro: "🗼 伝説の試練の塔に辿り着いた…\n\n四聖獣は敵ではない。虚空の王を討ち滅ぼせる者を待ち続け、\nその者に祝福を授けるための『試練』を与えるという。\n\n四方に散る玄武・青龍・朱雀・白虎のもとへ赴き、試練を受けよ。\nそのすべてを越えた先に、『祝福』と『扉』は開かれる。\n\n【挑戦条件】魔王城クリア後に開放。四体すべての試練達成で報酬獲得",
            bossEncounter: "⛩️ 四聖獣の一体が静かに立ちはだかる。\n『力を見せよ──試練を越え、祝福を受けよ。』",
            victory: "🎉 四聖獣の試練をすべて越えた！\n\n『見事…これは約束の祝福。』\n\n最強の武器『勇者の聖杖』、最強の防具『光の聖衣』を得た！\nさらに、究極の必殺技『オーロラ・インパクト』と究極の魔法『コスモフレア』が解放された！"
        }
    },
    // 裏ボス（解放条件: 7をクリア済み）
    {
        id: 8,
        name: "虚空の間",
        description: "全てを越えた者のみが辿り着ける、裏の最終決戦の間。",
        map: createMap({
            waterPattern: 'none',
            townPos: { r: 2, c: 2 },
            castlePos: { r: 6, c: 10 },
            wallPositions: [{ r: 3, c: 6 }, { r: 4, c: 6 }, { r: 5, c: 6 }]
        }),
        startPos: { r: 2, c: 2 },
        bossName: "虚空の王",
        bossPos: { r: 6, c: 10 },
        bossDefeated: false,
        dojoPos: { r: 4, c: 2 },
        mainline: false,
        optionalUnlockAfterAreaId: 7,
        story: {
            intro: "🌌 深淵の裂け目の先に、虚空が揺らめいている…\n\n声なき声：『真なる強者よ、最後の扉へ』",
            bossEncounter: "🕳️👑 虚空の中心に王が現れた。『すべてを捨てよ』",
            victory: "🎉 虚空の王を打ち倒した！ 世界は静謐に包まれた…"
        }
    },
    // ボスの間（解放条件: 8をクリア済み）
    {
        id: 9,
        name: "ボスの間",
        description: "歴代のボスたちが集う、究極の戦いの間。",
        map: createMap({
            waterPattern: 'none',
            townPos: { r: 2, c: 2 },
            castlePos: { r: 6, c: 10 },
            wallPositions: []
        }),
        startPos: { r: 2, c: 2 },
        bossName: "九尾の麒麟",
        bossPos: { r: 6, c: 10 },
        bossDefeated: false,
        dojoPos: { r: 4, c: 2 },
        mainline: false,
        optionalUnlockAfterAreaId: 8,
        story: {
            intro: "⚔️ 歴代の強敵たちが再び立ち上がる間…\n\nここではフィールド敵は現れず、ボスのみが次々と現れる！\n\n真の強者としての力を証明せよ！",
            bossEncounter: "👑 強大なボスが立ちはだかる！",
            victory: "🏆 ボスの間を制覇した！ あなたは真の覇者だ！"
        }
    },
    // 無限の回廊（解放条件: 9で九尾の麒麟を倒す）
    {
        id: 10,
        name: "無限の回廊",
        description: "九尾の麒麟を倒した先に現れた、果てしなく続く謎の回廊。",
        map: createMap({
            waterPattern: 'none',
            townPos: { r: 2, c: 2 },
            castlePos: { r: 6, c: 10 },
            wallPositions: []
        }),
        startPos: { r: 2, c: 2 },
        bossName: "階段",
        bossPos: { r: 6, c: 10 },
        bossDefeated: false,
        dojoPos: { r: 4, c: 2 },
        mainline: false,
        optionalUnlockAfterAreaId: 9,
        story: {
            intro: "🌀 無限の回廊へようこそ…\n\n九尾の麒麟を倒した者のみが辿り着ける、\n終わりなき試練の迷宮。\n\n進むほどに強力な敵が現れる。\nどこまで深く潜れるか、試してみよ！",
            bossEncounter: "🪜 次の階層への階段を発見した！",
            victory: "🎉 次の階層へ進む準備が整った！"
        }
    }
];
