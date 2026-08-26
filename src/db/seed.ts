import "dotenv/config";
import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { db } from "./index";
import { levels, workouts, workoutTasks, challengeTasks, challengeSettings, users, type RoundConfig } from "./schema";

type TaskSeed = {
  name: string;
  note?: string;
  type: "reps" | "time";
  targetReps?: number;
  perSide?: boolean;
  targetSeconds?: number;
  rounds?: number;
  restSeconds?: number;
  roundsConfig?: RoundConfig[];
};

type ChallengeTaskSeed = {
  name: string;
  note?: string;
  targetDistanceMeters?: number;
  rankDirection: "asc" | "desc";
  resultKind: "time" | "reps";
};

type WorkoutSeed = {
  name: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  estimatedMinutes: number;
  tasks: TaskSeed[];
};

type LevelSeed = {
  index: number;
  name: string;
  description: string;
  workouts: WorkoutSeed[];
};

const data: LevelSeed[] = [
  {
    index: 1,
    name: "Alapok",
    description: "Ismerkedés a mozgásmintákkal, technika és mobilitás.",
    workouts: [
      {
        name: "Bemelegítés és mobilitás",
        description: "Ízületi mobilizálás és könnyű aktiválás, a técnikára fókuszálva, sietség nélkül.",
        difficulty: "easy",
        estimatedMinutes: 18,
        tasks: [
          { name: "Karkörzés", type: "reps", targetReps: 15, rounds: 2 },
          { name: "Csípőkörzés", type: "reps", targetReps: 12, rounds: 2 },
          { name: "Világítótorony guggolás", type: "time", targetSeconds: 60, note: "lassú, kontrollált tempó" },
          { name: "Fal melletti ülés", type: "time", targetSeconds: 45, note: "90 fokos szög" },
        ],
      },
      {
        name: "Alapvető testsúlyos erő",
        description: "Az alap mozgásminták (nyomás, guggolás, plank) megismerése kis terheléssel.",
        difficulty: "easy",
        estimatedMinutes: 22,
        tasks: [
          { name: "Térdelt fekvőtámasz", type: "reps", targetReps: 10, rounds: 3, restSeconds: 30 },
          { name: "Guggolás", type: "reps", targetReps: 15, rounds: 3, restSeconds: 30 },
          { name: "Fekvőtartás (plank)", type: "time", targetSeconds: 30 },
          { name: "Kitörés", type: "reps", targetReps: 10, perSide: true, rounds: 2 },
        ],
      },
      {
        name: "Kardió alapok",
        description: "Könnyű állóképesség-fejlesztés és az első saját idő rögzítése a ranglistához.",
        difficulty: "easy",
        estimatedMinutes: 20,
        tasks: [
          {
            name: "Helyben futás",
            type: "time",
            targetSeconds: 30,
            rounds: 3,
            restSeconds: 30,
            // Demonstrates a custom per-round work/rest schedule: 30s work/30s
            // rest, then 35s work/25s rest, then 40s work/20s rest.
            roundsConfig: [
              { work: 30, restSeconds: 30 },
              { work: 35, restSeconds: 25 },
              { work: 40, restSeconds: 20 },
            ],
          },
          { name: "Jumping jack", type: "reps", targetReps: 20, rounds: 3, restSeconds: 20 },
        ],
      },
      {
        name: "Core aktiválás",
        description: "A törzsizomzat felkészítése a következő szintek intenzívebb feladataira.",
        difficulty: "easy",
        estimatedMinutes: 16,
        tasks: [
          { name: "Felülés", type: "reps", targetReps: 15, rounds: 3, restSeconds: 20 },
          { name: "Oldalsó plank", type: "time", targetSeconds: 25, perSide: true, rounds: 2 },
        ],
      },
    ],
  },
  {
    index: 2,
    name: "Fejlődés",
    description: "Nagyobb intenzitás, intervallumok és összetettebb feladatok.",
    workouts: [
      {
        name: "Felsőtest erő",
        description: "Nyomó- és tartó jellegű felsőtest feladatok, növekvő volumennel.",
        difficulty: "medium",
        estimatedMinutes: 22,
        tasks: [
          { name: "Fekvőtámasz", type: "reps", targetReps: 15, rounds: 3, restSeconds: 30 },
          { name: "Széles fogású fekvőtámasz", type: "reps", targetReps: 12, rounds: 2, restSeconds: 30 },
          { name: "Diamond fekvőtámasz", type: "reps", targetReps: 10, rounds: 3, restSeconds: 30 },
          { name: "Tricepsz dip", type: "reps", targetReps: 12, rounds: 3, restSeconds: 20 },
          { name: "Vállkör tartás", type: "time", targetSeconds: 40 },
        ],
      },
      {
        name: "HIIT intervallum",
        description: "Rövid, magas intenzitású körök minimális pihenővel — az állóképességedet teszteli.",
        difficulty: "medium",
        estimatedMinutes: 18,
        tasks: [
          { name: "Burpee", type: "reps", targetReps: 12, rounds: 4, restSeconds: 20 },
          { name: "Mountain climber", type: "time", targetSeconds: 40, rounds: 4, restSeconds: 20 },
          { name: "Kiugrásos kitörés", type: "reps", targetReps: 10, perSide: true, rounds: 3, restSeconds: 20 },
          { name: "Fel-le ugrás guggolásból", type: "reps", targetReps: 15, rounds: 3, restSeconds: 20 },
          { name: "Magas térdemelés", type: "time", targetSeconds: 30, rounds: 3, restSeconds: 15 },
        ],
      },
      {
        name: "Törzs és állóképesség",
        description: "Törzsstabilitás és kitartás kombinálva — a fal melletti ülésnél a 90 fokos szögre figyelj.",
        difficulty: "medium",
        estimatedMinutes: 22,
        tasks: [
          { name: "Orosz csavarás", type: "reps", targetReps: 20, rounds: 3, restSeconds: 20 },
          { name: "Hollow hold", type: "time", targetSeconds: 35, rounds: 3, restSeconds: 20 },
          { name: "Lábemelés", type: "reps", targetReps: 15, rounds: 3, restSeconds: 20 },
          { name: "Fal melletti ülés", type: "time", targetSeconds: 90, note: "90 fokos szög" },
        ],
      },
      {
        name: "Láberő",
        description: "Alsótest fókusz. A guggolásoknál a mélységre figyelj, a fal melletti ülésnél a 90 fokos szögre.",
        difficulty: "medium",
        estimatedMinutes: 26,
        tasks: [
          { name: "Bemelegítés – helyben futás", type: "time", targetSeconds: 180 },
          { name: "Guggolás", type: "reps", targetReps: 20, rounds: 3, restSeconds: 30 },
          { name: "Kitörés váltott lábbal", type: "reps", targetReps: 12, perSide: true, rounds: 3 },
          { name: "Fal melletti ülés", type: "time", targetSeconds: 90, note: "90 fokos szög" },
        ],
      },
    ],
  },
  {
    index: 3,
    name: "Haladó",
    description: "Magas intenzitás, robbanékonyság és maximális kitartás.",
    workouts: [
      {
        name: "Robbanékony erő",
        description: "Plyometrikus feladatok a robbanékonyság fejlesztésére — kontrollált leérkezéssel.",
        difficulty: "hard",
        estimatedMinutes: 26,
        tasks: [
          { name: "Plyo fekvőtámasz", type: "reps", targetReps: 10, rounds: 4, restSeconds: 30 },
          { name: "Box jump", type: "reps", targetReps: 12, rounds: 4, restSeconds: 30 },
          { name: "Broad jump", type: "reps", targetReps: 8, rounds: 3, restSeconds: 30 },
          { name: "Fal melletti ülés", type: "time", targetSeconds: 120, note: "90 fokos szög" },
        ],
      },
      {
        name: "Sprint és állóképesség",
        description: "Rövid, intenzív sprintek és a saját 400 m időd fejlesztése.",
        difficulty: "hard",
        estimatedMinutes: 24,
        tasks: [
          { name: "Magas térdemelés", type: "time", targetSeconds: 45, rounds: 4, restSeconds: 20 },
          { name: "Aktív nyújtás", type: "time", targetSeconds: 60 },
        ],
      },
      {
        name: "Funkcionális körkör",
        description: "Összetett, több izomcsoportot terhelő körök minimális pihenővel.",
        difficulty: "hard",
        estimatedMinutes: 28,
        tasks: [
          { name: "Kettlebell swing", type: "reps", targetReps: 20, rounds: 4, restSeconds: 20 },
          { name: "Fekvőtámasz + tapintás", type: "reps", targetReps: 12, rounds: 4, restSeconds: 20 },
          { name: "Farmer's walk", type: "time", targetSeconds: 45, rounds: 3, restSeconds: 20 },
        ],
      },
      {
        name: "Maximális kitartás",
        description: "A program csúcspontja — hosszú tartások és egy utolsó, mindent bele sprint.",
        difficulty: "hard",
        estimatedMinutes: 25,
        tasks: [
          { name: "Fal melletti ülés", type: "time", targetSeconds: 150, note: "90 fokos szög" },
          { name: "Végső sprint", type: "reps", targetReps: 1, rounds: 1, note: "minden erőddel" },
        ],
      },
    ],
  },
];

// The global challenge list — the same tasks reappear at the end of every
// level. At least `minRequired` of them (not necessarily all) must be
// completed for the challenge to count as passed.
const challengeTasksSeed: ChallengeTaskSeed[] = [
  {
    name: "Sprint 400 m",
    note: "saját tempó, mérd az időt",
    targetDistanceMeters: 400,
    rankDirection: "asc",
    resultKind: "time",
  },
  { name: "Plank", note: "tarts ki, ameddig bírod", rankDirection: "desc", resultKind: "time" },
  { name: "Burpee 1'", note: "hány burpee 60 mp alatt", rankDirection: "desc", resultKind: "reps" },
];
const challengeMinRequired = 2;

async function main() {
  console.log("Seeding levels, workouts and tasks…");

  for (const levelSeed of data) {
    let [level] = await db
      .insert(levels)
      .values({
        index: levelSeed.index,
        name: levelSeed.name,
        description: levelSeed.description,
        order: levelSeed.index,
      })
      .onConflictDoNothing({ target: levels.index })
      .returning();

    // Row already existed (conflict) — fetch it instead of overwriting
    // whatever an admin may have edited since the last seed.
    if (!level) {
      [level] = await db.select().from(levels).where(eq(levels.index, levelSeed.index)).limit(1);
    }

    for (let wi = 0; wi < levelSeed.workouts.length; wi++) {
      const workoutSeed = levelSeed.workouts[wi];
      let [workout] = await db
        .insert(workouts)
        .values({
          levelId: level.id,
          name: workoutSeed.name,
          description: workoutSeed.description,
          difficulty: workoutSeed.difficulty,
          order: wi,
          estimatedMinutes: workoutSeed.estimatedMinutes,
        })
        .onConflictDoNothing({ target: [workouts.levelId, workouts.order] })
        .returning();

      if (!workout) {
        [workout] = await db
          .select()
          .from(workouts)
          .where(and(eq(workouts.levelId, level.id), eq(workouts.order, wi)))
          .limit(1);
      }

      for (let ti = 0; ti < workoutSeed.tasks.length; ti++) {
        const t = workoutSeed.tasks[ti];
        const values = {
          workoutId: workout.id,
          order: ti,
          name: t.name,
          note: t.note,
          type: t.type,
          targetReps: t.targetReps,
          perSide: t.perSide ?? false,
          targetSeconds: t.targetSeconds,
          rounds: t.rounds ?? 1,
          restSeconds: t.restSeconds,
          roundsConfig: t.roundsConfig,
        };
        await db
          .insert(workoutTasks)
          .values(values)
          .onConflictDoNothing({ target: [workoutTasks.workoutId, workoutTasks.order] });
      }
    }
  }

  console.log("Seeding challenge tasks…");
  for (let ci = 0; ci < challengeTasksSeed.length; ci++) {
    const c = challengeTasksSeed[ci];
    const values = {
      order: ci,
      name: c.name,
      note: c.note,
      targetDistanceMeters: c.targetDistanceMeters,
      rankDirection: c.rankDirection,
      resultKind: c.resultKind,
    };
    await db
      .insert(challengeTasks)
      .values(values)
      .onConflictDoNothing({ target: challengeTasks.order });
  }

  // Only create the settings row if it doesn't exist yet — an admin may
  // have changed `minRequired` since the last seed run.
  const [existingSettings] = await db.select().from(challengeSettings).limit(1);
  if (!existingSettings) {
    await db.insert(challengeSettings).values({ minRequired: challengeMinRequired });
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@repline.app";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "admin1234";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await db
    .insert(users)
    .values({
      name: "Admin",
      email: adminEmail,
      passwordHash,
      role: "admin",
    })
    .onConflictDoNothing({ target: users.email });

  console.log(`Seed kész. Admin belépés: ${adminEmail} / ${adminPassword}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
