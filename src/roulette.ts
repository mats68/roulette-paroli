// Rot-Schwarz-Mapping für europäisches Roulette
const REDS = new Set([
  1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36
]);

export function numberColor(n: number): "red" | "black" | "green" {
  if (n === 0) return "green";
  return REDS.has(n) ? "red" : "black";
}

/**
 * Grid-Anordnung wie am Tisch:
 *  - 3 Spalten (links->rechts): 3rd, 2nd, 1st column
 *  - Oben nach unten: 3/6/.../36, 2/5/.../35, 1/4/.../34
 *  - 12 Reihen, jeweils 3 Zellen
 */
export const gridRows: number[][] = Array.from({ length: 12 }, (_, i) => {
  const topIndex = 11 - i; // oben beginnen
  return [
    3 + topIndex * 3, // 3rd column
    2 + topIndex * 3, // 2nd column
    1 + topIndex * 3, // 1st column
  ];
});

export const WHEEL_ORDER: number[] = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
  5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

// export type SimpleChanceKey = "black" | "red" | "even" | "odd" | "low" | "high";

export function isBlack(n: number) { return n !== 0 && numberColor(n) === "black"; }
export function isRed(n: number)   { return n !== 0 && numberColor(n) === "red"; }
export function isEven(n: number)  { return n !== 0 && n % 2 === 0; }
export function isOdd(n: number)   { return n % 2 === 1; } // 0 ist weder gerade noch ungerade
export function isLow(n: number)   { return n >= 1 && n <= 18; }
export function isHigh(n: number)  { return n >= 19 && n <= 36; }

export const SIMPLE_CHANCE_PREDICATE: Record<SimpleChanceKey, (n: number) => boolean> = {
  low: isLow,
  odd: isOdd,
  red: isRed,
  black: isBlack,
  even: isEven,
  high: isHigh,
};

/**
 * Simuliert das System für EINFACHE CHANCE:
 * - Start mit baseStake
 * - Bei Gewinn: nächster Einsatz = vorheriger Einsatz + Gewinn (bei 1:1 -> Verdopplung)
 * - Nach 3 Gewinnen in Folge: Reset auf baseStake
 * - Bei Verlust: EXACT EIN Versuch mit 2*baseStake; egal ob dieser gewinnt oder verliert -> Reset auf baseStake
 * Gibt den Einsatz für den NÄCHSTEN Spin zurück sowie Metadaten.
 */
export function nextBetForSimpleChance(
  throws: number[],
  baseStake: number,
  pred: (n: number) => boolean
) {
  let stake = baseStake;
  let winStreak = 0;
  let inRecovery = false; // sind wir im "einmal doppelt"-Versuch?

  for (const n of throws) {
    const win = pred(n);
    if (win) {
      if (inRecovery) {
        // Erholungsversuch gewonnen -> sofortiger Reset
        stake = baseStake;
        winStreak = 0;
        inRecovery = false;
      } else {
        // normaler Gewinn -> Paroli bis 3
        winStreak += 1;
        if (winStreak >= 3) {
          stake = baseStake; // nach 3 Gewinnen reset
          winStreak = 0;
        } else {
          stake = stake * 2; // Gewinn zum Einsatz addiert -> bei 1:1 verdoppelt
        }
      }
    } else {
      if (inRecovery) {
        // Erholungsversuch verloren -> Reset
        stake = baseStake;
        winStreak = 0;
        inRecovery = false;
      } else {
        // erster Verlust -> starte einmaligen Erholungsversuch (2 * base)
        winStreak = 0;
        inRecovery = true;
        stake = baseStake * 2;
      }
    }
  }

  return { nextStake: stake, winStreak, inRecovery };
}

export type SimpleChanceKey = "black" | "red" | "even" | "odd" | "low" | "high";

/** true/false-Prädikate hast du bereits (SIMPLE_CHANCE_PREDICATE) */

/**
 * Simuliert DEIN System für EINE einfache Chance über alle Würfe:
 * - Start mit baseStake
 * - Gewinn => Gewinn (1:1) zum Einsatz addieren -> nächster Stake = 2*aktueller
 * - Nach 3 Gewinnen in Folge Reset auf baseStake
 * - Verlust => genau 1 Recovery-Versuch mit 2*baseStake; danach Reset (egal ob Win/Loss)
 * Gibt Netto-Profit (Summe +Stake bei Win / -Stake bei Loss) + Status für den nächsten Wurf zurück.
 */
export function simulateParoliForChance(
  throws: number[],
  baseStake: number,
  pred: (n: number) => boolean
) {
  let stake = baseStake;
  let winStreak = 0;
  let inRecovery = false;
  let profit = 0;

  for (const n of throws) {
    const hit = pred(n);

    if (inRecovery) {
      // Einsatz ist hier immer 2*baseStake
      if (hit) {
        profit += stake;               // Nettogewinn = +Stake (1:1)
      } else {
        profit -= stake;               // Nettoverlust = -Stake
      }
      // nach Recovery IMMER Reset
      stake = baseStake;
      winStreak = 0;
      inRecovery = false;
      continue;
    }

    // Normalmodus (Paroli bis max 3)
    if (hit) {
      profit += stake;
      winStreak += 1;
      if (winStreak >= 3) {
        // 3. Gewinn erreicht -> Reset
        stake = baseStake;
        winStreak = 0;
      } else {
        stake = stake * 2; // Gewinn zum Einsatz addiert (1:1 => Verdopplung)
      }
    } else {
      profit -= stake;
      // Einmaliger Erholungsversuch mit 2*baseStake beim nächsten Wurf
      inRecovery = true;
      winStreak = 0;
      stake = baseStake * 2;
    }
  }

  return { profit, nextStake: stake, winStreak, inRecovery };
}

/** Gesamtsaldo für mehrere aktivierte einfache Chancen */
export function calcParoliSaldo(
  throws: number[],
  baseStake: number,
  active: SimpleChanceKey[]
) {
  let totalProfit = 0;
  for (const key of active) {
    const pred = SIMPLE_CHANCE_PREDICATE[key];
    const { profit } = simulateParoliForChance(throws, baseStake, pred);
    totalProfit += profit;
  }
  return totalProfit; // Nettogewinn (kann negativ sein)
}


export function calcSimpleChanceResult(
  throws: number[],
  baseStake: number,
  chances: SimpleChanceKey[]
) {
  let saldo = 0;

  for (const n of throws) {
    for (const key of chances) {
      const pred = SIMPLE_CHANCE_PREDICATE[key];
      const hit = pred(n);
      saldo += hit ? baseStake : -baseStake;
    }
  }

  return saldo;
}
