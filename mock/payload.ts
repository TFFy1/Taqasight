/**
 * Synthetic demo payload — tells the full demo story (spec §9):
 * farm down 4% → S2/INV3 flagged → soiling ramp on STR2 (P017–P019) →
 * cleaning recommended, 2.3 kWh/day recoverable → hotspot on P042 →
 * alert acknowledgeable.
 *
 * Farm layout (192 panels): S1 P001–P048 (INV1: STR1/STR2, INV2: STR3/STR4),
 * S2 P049–P096 (INV3: STR5/STR6, INV4: STR7/STR8), S3 P097–P144, S4 P145–P192.
 * No GPS coordinates on purpose — the map view renders a schematic grid.
 */

function hashSeed(s: string): number {
  let h = 1779033703;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

/** Deterministic 0–1 random from a string key — fixtures stay stable. */
export function seededRand(key: string): number {
  let t = hashSeed(key) + 0x6d2b79f5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

interface PanelOverride {
  status: string;
  healthScore?: number;
}

const OVERRIDES: Record<string, PanelOverride> = {
  P017: { status: "warning", healthScore: 67 },
  P018: { status: "warning", healthScore: 58 },
  P019: { status: "warning", healthScore: 63 },
  P042: { status: "critical", healthScore: 31 },
  P051: { status: "monitoring", healthScore: 78 },
  P055: { status: "monitoring", healthScore: 74 },
  P058: { status: "monitoring", healthScore: 76 },
  P063: { status: "warning", healthScore: 55 },
  P160: { status: "offline" },
};

const pad3 = (n: number) => `P${String(n).padStart(3, "0")}`;

export function panelTopology(n: number) {
  const stationIdx = Math.floor((n - 1) / 48);
  const invWithin = Math.floor(((n - 1) % 48) / 24);
  const strWithin = Math.floor(((n - 1) % 24) / 12);
  const inverterNum = stationIdx * 2 + invWithin + 1;
  const stringNum = inverterNum * 2 - 1 + strWithin;
  return {
    stationId: `S${stationIdx + 1}`,
    inverterId: `INV${inverterNum}`,
    stringId: `STR${stringNum}`,
  };
}

function buildMap() {
  const panels = [];
  for (let n = 1; n <= 192; n++) {
    const panelId = pad3(n);
    const topo = panelTopology(n);
    const override = OVERRIDES[panelId];
    if (override) {
      panels.push({ panelId, ...topo, status: override.status, healthScore: override.healthScore });
      continue;
    }
    const r = seededRand(panelId);
    // ~7% of untouched panels read "monitoring" for realistic texture.
    const monitoring = r < 0.07;
    const healthScore = monitoring
      ? Math.round(72 + seededRand(panelId + "h") * 12)
      : Math.round(88 + seededRand(panelId + "h") * 9);
    panels.push({ panelId, ...topo, status: monitoring ? "monitoring" : "healthy", healthScore });
  }
  return panels;
}

/** Timestamps are computed relative to load time so "Last updated" reads live. */
export function buildMockPayload() {
  const now = Date.now();
  const generatedAt = new Date(now - 6 * 60_000).toISOString();
  const runStarted = new Date(now - 7 * 60_000).toISOString();
  const alertTs = (minAgo: number) => new Date(now - minAgo * 60_000).toISOString();

  return {
    runId: `${runStarted}-${hashSeed(runStarted).toString(16).slice(0, 4)}`,
    generatedAt,
    payloadVersion: "1.0.0",
    farm: {
      healthScore: 78,
      status: "Monitoring",
      kpis: {
        avgPerformanceRatio: 0.87,
        avgInverterEff_pct: 95.1,
        avgPanelTemp_C: 44.2,
        avgSoilingIndex: 0.14,
        totalACPower_kW: 41.2,
        totalDailyEnergy_kWh: 228.4,
        selfSufficiency_pct: 71,
        gridDependency_pct: 12,
      },
      trend: {
        healthScore7d: [82, 81, 80, 79, 77, 78, 78],
        pr7d: [0.9, 0.89, 0.89, 0.88, 0.86, 0.87, 0.87],
        energy7d: [238.1, 236.4, 234.9, 231.2, 226.8, 227.5, 228.4],
        acPower7d: [43.0, 42.7, 42.4, 41.8, 40.9, 41.0, 41.2],
        selfSufficiency7d: [74, 73, 73, 72, 70, 71, 71],
        soiling7d: [0.11, 0.11, 0.12, 0.12, 0.13, 0.14, 0.14],
        inverterEff7d: [95.8, 95.7, 95.6, 95.4, 95.0, 95.1, 95.1],
      },
    },
    stations: [
      {
        stationId: "S1",
        healthScore: 84,
        status: "Monitoring",
        kpis: { avgPR: 0.86, avgInverterEff_pct: 95.6, avgSoilingIndex: 0.21 },
        trend: { pr7d: [0.9, 0.9, 0.89, 0.88, 0.87, 0.86, 0.86] },
        inverters: [
          {
            inverterId: "INV1",
            avgEff_pct: 95.8,
            status: "Monitoring",
            strings: [
              { stringId: "STR1", avgPR: 0.89, imbalance_pct: 1.2 },
              { stringId: "STR2", avgPR: 0.8, imbalance_pct: 3.8 },
            ],
          },
          {
            inverterId: "INV2",
            avgEff_pct: 95.4,
            status: "Warning",
            strings: [
              { stringId: "STR3", avgPR: 0.88, imbalance_pct: 1.5 },
              { stringId: "STR4", avgPR: 0.82, imbalance_pct: 4.6 },
            ],
          },
        ],
      },
      {
        stationId: "S2",
        healthScore: 66,
        status: "Warning",
        kpis: { avgPR: 0.81, avgInverterEff_pct: 92.9, avgSoilingIndex: 0.13 },
        trend: { pr7d: [0.88, 0.87, 0.86, 0.85, 0.83, 0.82, 0.81] },
        inverters: [
          {
            inverterId: "INV3",
            avgEff_pct: 91.4,
            status: "Warning",
            strings: [
              { stringId: "STR5", avgPR: 0.79, imbalance_pct: 6.2 },
              { stringId: "STR6", avgPR: 0.81, imbalance_pct: 2.9 },
            ],
          },
          {
            inverterId: "INV4",
            avgEff_pct: 94.5,
            status: "Healthy",
            strings: [
              { stringId: "STR7", avgPR: 0.86, imbalance_pct: 1.1 },
              { stringId: "STR8", avgPR: 0.85, imbalance_pct: 1.7 },
            ],
          },
        ],
      },
      {
        stationId: "S3",
        healthScore: 93,
        status: "Healthy",
        kpis: { avgPR: 0.9, avgInverterEff_pct: 96.2, avgSoilingIndex: 0.08 },
        trend: { pr7d: [0.9, 0.9, 0.91, 0.9, 0.9, 0.9, 0.9] },
        inverters: [
          {
            inverterId: "INV5",
            avgEff_pct: 96.4,
            status: "Healthy",
            strings: [
              { stringId: "STR9", avgPR: 0.9, imbalance_pct: 0.8 },
              { stringId: "STR10", avgPR: 0.9, imbalance_pct: 1.0 },
            ],
          },
          {
            inverterId: "INV6",
            avgEff_pct: 96.0,
            status: "Healthy",
            strings: [
              { stringId: "STR11", avgPR: 0.89, imbalance_pct: 1.3 },
              { stringId: "STR12", avgPR: 0.9, imbalance_pct: 0.9 },
            ],
          },
        ],
      },
      {
        stationId: "S4",
        healthScore: 90,
        status: "Healthy",
        kpis: { avgPR: 0.89, avgInverterEff_pct: 95.9, avgSoilingIndex: 0.1 },
        trend: { pr7d: [0.89, 0.89, 0.88, 0.89, 0.89, 0.88, 0.89] },
        inverters: [
          {
            inverterId: "INV7",
            avgEff_pct: 96.1,
            status: "Healthy",
            strings: [
              { stringId: "STR13", avgPR: 0.89, imbalance_pct: 1.1 },
              { stringId: "STR14", avgPR: 0.88, imbalance_pct: 1.4 },
            ],
          },
          {
            inverterId: "INV8",
            avgEff_pct: 95.7,
            status: "Monitoring",
            strings: [
              { stringId: "STR15", avgPR: 0.88, imbalance_pct: 1.6 },
              { stringId: "STR16", avgPR: 0.87, imbalance_pct: 2.2 },
            ],
          },
        ],
      },
    ],
    alerts: [
      {
        alertId: "AL-0091",
        severity: "critical",
        entityType: "panel",
        entityId: "P042",
        rule: "PanelTemp_C > 60",
        value: 63.5,
        message: "Hotspot risk on P042 (S1/INV2/STR4)",
        ts: alertTs(9),
        status: "open",
      },
      {
        alertId: "AL-0090",
        severity: "critical",
        entityType: "panel",
        entityId: "P042",
        rule: "PanelTemp_C > 60",
        value: 62.1,
        message: "Hotspot risk on P042 (S1/INV2/STR4)",
        ts: alertTs(68),
        status: "open",
      },
      {
        alertId: "AL-0087",
        severity: "warning",
        entityType: "inverter",
        entityId: "INV3",
        rule: "InverterEff_pct < 93",
        value: 91.4,
        message: "INV3 efficiency 3.7 pts below fleet mean",
        ts: alertTs(11),
        status: "open",
      },
      {
        alertId: "AL-0082",
        severity: "warning",
        entityType: "string",
        entityId: "STR5",
        rule: "StringImbalance_pct > 5",
        value: 6.2,
        message: "Current imbalance on STR5 (S2/INV3)",
        ts: alertTs(12),
        status: "open",
      },
      {
        alertId: "AL-0079",
        severity: "warning",
        entityType: "panel",
        entityId: "P018",
        rule: "SoilingIndex > 0.6",
        value: 0.82,
        message: "Soiling ramp on P018 (S1/INV1/STR2)",
        ts: alertTs(14),
        status: "open",
      },
      {
        alertId: "AL-0075",
        severity: "info",
        entityType: "station",
        entityId: "S2",
        rule: "StationPR declining 5d",
        value: 0.81,
        message: "S2 performance ratio declined 5 consecutive days",
        ts: alertTs(15),
        status: "open",
      },
      {
        alertId: "AL-0068",
        severity: "warning",
        entityType: "panel",
        entityId: "P063",
        rule: "PR decline 5 consecutive days",
        value: 0.74,
        message: "Sustained PR decline on P063 (S2/INV3/STR6)",
        ts: alertTs(26 * 60),
        status: "acknowledged",
      },
      {
        alertId: "AL-0061",
        severity: "info",
        entityType: "panel",
        entityId: "P160",
        rule: "No telemetry 24h",
        message: "P160 (S4/INV7) stopped reporting — comms or optimizer",
        ts: alertTs(31 * 60),
        status: "open",
      },
      {
        alertId: "AL-0047",
        severity: "warning",
        entityType: "panel",
        entityId: "P019",
        rule: "SoilingIndex > 0.6",
        value: 0.64,
        message: "Soiling ramp on P019 (S1/INV1/STR2)",
        ts: alertTs(50 * 60),
        status: "resolved",
      },
    ],
    criticalPanels: [
      {
        panelId: "P042",
        stationId: "S1",
        inverterId: "INV2",
        stringId: "STR4",
        pr: 0.71,
        temp_C: 63.5,
        soilingIndex: 0.12,
        failureProb_pct: 74,
        trend: { pr7d: [0.86, 0.85, 0.84, 0.82, 0.79, 0.75, 0.71] },
      },
      {
        panelId: "P063",
        stationId: "S2",
        inverterId: "INV3",
        stringId: "STR6",
        pr: 0.74,
        temp_C: 47.1,
        soilingIndex: 0.18,
        failureProb_pct: 61,
        trend: { pr7d: [0.85, 0.84, 0.82, 0.8, 0.78, 0.76, 0.74] },
      },
      {
        panelId: "P018",
        stationId: "S1",
        inverterId: "INV1",
        stringId: "STR2",
        pr: 0.78,
        temp_C: 45.3,
        soilingIndex: 0.82,
        failureProb_pct: 22,
        trend: { pr7d: [0.88, 0.87, 0.85, 0.83, 0.81, 0.79, 0.78] },
      },
    ],
    maintenancePlan: [
      {
        priority: 1,
        entityId: "P042",
        action: "Inspect for hotspot / bypass diode failure",
        type: "corrective",
        deadline: "24h",
        estimatedGain_kWh_day: 1.1,
        rationale: "Temperature 19°C above station mean with declining PR over 5 consecutive days.",
      },
      {
        priority: 2,
        entityId: "STR2",
        action: "Schedule cleaning — soiling ramp on P017–P019",
        type: "preventive",
        deadline: "72h",
        estimatedGain_kWh_day: 2.3,
        rationale: "DustIndex rose from 0.12 to 0.82 in 6 days; PR loss correlated.",
      },
      {
        priority: 3,
        entityId: "INV3",
        action: "Diagnose efficiency drop; verify DC input balance on STR5",
        type: "corrective",
        deadline: "72h",
        estimatedGain_kWh_day: 1.8,
        rationale: "Efficiency 3.7 pts below fleet mean and STR5 imbalance 6.2% — consistent with a DC-side fault.",
      },
      {
        priority: 4,
        entityId: "P063",
        action: "Run IV-curve trace before predicted failure window",
        type: "preventive",
        deadline: "2w",
        estimatedGain_kWh_day: 0.9,
        rationale: "Failure probability 61% within 3 weeks if the current PR slope continues.",
      },
      {
        priority: 5,
        entityId: "P160",
        action: "Restore telemetry — check optimizer and comms link",
        type: "corrective",
        deadline: "1w",
        estimatedGain_kWh_day: 0.4,
        rationale: "No data for 31h; panel state unknown and excluded from aggregates.",
      },
    ],
    aiInsights: {
      headline: "Farm output down 4% this week — two treatable causes identified.",
      summary:
        "Fleet health slipped from 82 to 78 over the last seven days, driven almost entirely by Station S2 and a localized soiling ramp on S1. INV3 (S2) is converting 3.7 points below the fleet mean with a 6.2% current imbalance on STR5, which points to a DC-side fault rather than irradiance. Separately, dust accumulation on STR2 panels P017–P019 rose from 0.12 to 0.82 in six days and now costs an estimated 2.3 kWh/day. Both causes are treatable within 72 hours; the hotspot on P042 is the only safety-relevant item and should be inspected first.",
      anomalies: [
        {
          entityId: "INV3",
          explanation:
            "Efficiency dropped to 91.4% while sibling INV4 held 94.5% under identical irradiance — the divergence began 5 days ago and correlates with STR5 imbalance, indicating a string-level DC fault.",
          confidence: "high",
        },
        {
          entityId: "STR2",
          explanation:
            "Soiling index on P017–P019 ramped 6.8× in six days while neighboring strings stayed flat — consistent with localized dust deposition, not sensor drift.",
          confidence: "high",
        },
        {
          entityId: "P042",
          explanation:
            "Panel temperature 19°C above station mean with PR down 15 points in 7 days — thermal signature matches a bypass diode failure or cell-level hotspot.",
          confidence: "medium",
        },
      ],
      predictions: [
        {
          entityId: "P063",
          prediction: "Likely failure within 3 weeks if PR decline continues at the current slope",
          failureProb_pct: 61,
        },
        {
          entityId: "S2",
          prediction: "Station PR recovers to ~0.86 within a week of correcting INV3/STR5",
        },
      ],
      recommendations: [
        {
          text: "Dispatch a technician to P042 within 24h — hotspot signatures carry fire risk and the panel is still energized.",
          impact: "high",
          effort: "low",
        },
        {
          text: "Book a cleaning crew for STR2 (P017–P019) this week; 2.3 kWh/day is recoverable for the cost of one wash.",
          impact: "high",
          effort: "low",
        },
        {
          text: "Schedule an electrical inspection of INV3's DC inputs and STR5 connectors before the weekend to stop the S2 slide.",
          impact: "medium",
          effort: "medium",
        },
      ],
    },
    map: buildMap(),
  };
}
