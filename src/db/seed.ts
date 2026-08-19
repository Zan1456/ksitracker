import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "./index";
import { levels, workouts, workoutTasks, users } from "./schema";

type TaskSeed = {
  name: string;
  note?: string;
  type: "reps" | "time" | "stopwatch";
  targetReps?: number;
  targetSeconds?: number;
  targetDistanceMeters?: number;
  rankDirection?: "asc" | "desc";
  resultKind?: "time" | "reps";
  rounds?: number;
};

type WorkoutSeed = {
  name: string;
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
        estimatedMinutes: 22,
        tasks: [
          { name: "Térdelt fekvőtámasz", type: "reps", targetReps: 10, rounds: 3 },
          { name: "Guggolás", type: "reps", targetReps: 15, rounds: 3 },
          { name: "Fekvőtartás (plank)", type: "time", targetSeconds: 30 },
          { name: "Kitörés", type: "reps", targetReps: 10, rounds: 2 },
        ],
      },
      {
        name: "Kardió alapok",
        estimatedMinutes: 20,
        tasks: [
          { name: "Helyben futás", type: "time", targetSeconds: 60, rounds: 3 },
          { name: "Jumping jack", type: "reps", targetReps: 20, rounds: 3 },
          {
            name: "Sprint 400 m",
            type: "stopwatch",
            targetDistanceMeters: 400,
            rankDirection: "asc",
            resultKind: "time",
            note: "saját tempó, mérd az időt",
          },
        ],
      },
      {
        name: "Core aktiválás",
        estimatedMinutes: 16,
        tasks: [
          { name: "Felülés", type: "reps", targetReps: 15, rounds: 3 },
          { name: "Oldalsó plank", type: "time", targetSeconds: 25, rounds: 2 },
          {
            name: "Plank",
            type: "stopwatch",
            rankDirection: "desc",
            resultKind: "time",
            note: "tarts ki, ameddig bírod",
          },
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
        estimatedMinutes: 24,
        tasks: [
          { name: "Fekvőtámasz", type: "reps", targetReps: 15, rounds: 4 },
          { name: "Diamond fekvőtámasz", type: "reps", targetReps: 10, rounds: 3 },
          { name: "Tricepsz dip", type: "reps", targetReps: 12, rounds: 3 },
          { name: "Vállkör tartás", type: "time", targetSeconds: 40 },
        ],
      },
      {
        name: "HIIT intervallum",
        estimatedMinutes: 18,
        tasks: [
          { name: "Burpee", type: "reps", targetReps: 12, rounds: 4, note: "20 mp pihenő körök között" },
          { name: "Mountain climber", type: "time", targetSeconds: 40, rounds: 4 },
          {
            name: "Burpee 1'",
            type: "stopwatch",
            rankDirection: "desc",
            resultKind: "reps",
            note: "hány burpee 60 mp alatt",
          },
        ],
      },
      {
        name: "Törzs és állóképesség",
        estimatedMinutes: 22,
        tasks: [
          { name: "Orosz csavarás", type: "reps", targetReps: 20, rounds: 3 },
          { name: "Hollow hold", type: "time", targetSeconds: 35, rounds: 3 },
          { name: "Lábemelés", type: "reps", targetReps: 15, rounds: 3 },
          { name: "Fal melletti ülés", type: "time", targetSeconds: 90, note: "90 fokos szög" },
        ],
      },
      {
        name: "Láberő",
        estimatedMinutes: 24,
        tasks: [
          { name: "Bolgár kitörés", type: "reps", targetReps: 12, rounds: 3 },
          { name: "Jump squat", type: "reps", targetReps: 15, rounds: 3 },
          { name: "Vádli emelés", type: "reps", targetReps: 20, rounds: 3 },
          { name: "Fal melletti ülés", type: "time", targetSeconds: 90, note: "90 fokos szög" },
          {
            name: "Sprint",
            type: "stopwatch",
            targetDistanceMeters: 400,
            rankDirection: "asc",
            resultKind: "time",
          },
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
        estimatedMinutes: 26,
        tasks: [
          { name: "Plyo fekvőtámasz", type: "reps", targetReps: 10, rounds: 4 },
          { name: "Box jump", type: "reps", targetReps: 12, rounds: 4 },
          { name: "Broad jump", type: "reps", targetReps: 8, rounds: 3 },
          { name: "Fal melletti ülés", type: "time", targetSeconds: 120, note: "90 fokos szög" },
        ],
      },
      {
        name: "Sprint és állóképesség",
        estimatedMinutes: 24,
        tasks: [
          { name: "Magas térdemelés", type: "time", targetSeconds: 45, rounds: 4 },
          {
            name: "Sprint 400 m",
            type: "stopwatch",
            targetDistanceMeters: 400,
            rankDirection: "asc",
            resultKind: "time",
          },
          { name: "Aktív nyújtás", type: "time", targetSeconds: 60 },
        ],
      },
      {
        name: "Funkcionális körkör",
        estimatedMinutes: 28,
        tasks: [
          { name: "Kettlebell swing", type: "reps", targetReps: 20, rounds: 4 },
          { name: "Fekvőtámasz + tapintás", type: "reps", targetReps: 12, rounds: 4 },
          { name: "Farmer's walk", type: "time", targetSeconds: 45, rounds: 3 },
          {
            name: "Burpee 1'",
            type: "stopwatch",
            rankDirection: "desc",
            resultKind: "reps",
            note: "hány burpee 60 mp alatt",
          },
        ],
      },
      {
        name: "Maximális kitartás",
        estimatedMinutes: 25,
        tasks: [
          {
            name: "Plank",
            type: "stopwatch",
            rankDirection: "desc",
            resultKind: "time",
            note: "tarts ki, ameddig bírod",
          },
          { name: "Fal melletti ülés", type: "time", targetSeconds: 150, note: "90 fokos szög" },
          { name: "Végső sprint", type: "reps", targetReps: 1, rounds: 1, note: "minden erőddel" },
        ],
      },
    ],
  },
];

async function main() {
  console.log("Seeding levels, workouts and tasks…");

  for (const levelSeed of data) {
    const [level] = await db
      .insert(levels)
      .values({
        index: levelSeed.index,
        name: levelSeed.name,
        description: levelSeed.description,
        order: levelSeed.index,
      })
      .onConflictDoUpdate({
        target: levels.index,
        set: { name: levelSeed.name, description: levelSeed.description, order: levelSeed.index },
      })
      .returning();

    for (let wi = 0; wi < levelSeed.workouts.length; wi++) {
      const workoutSeed = levelSeed.workouts[wi];
      const [workout] = await db
        .insert(workouts)
        .values({
          levelId: level.id,
          name: workoutSeed.name,
          order: wi,
          estimatedMinutes: workoutSeed.estimatedMinutes,
        })
        .returning();

      await db.insert(workoutTasks).values(
        workoutSeed.tasks.map((t, ti) => ({
          workoutId: workout.id,
          order: ti,
          name: t.name,
          note: t.note,
          type: t.type,
          targetReps: t.targetReps,
          targetSeconds: t.targetSeconds,
          targetDistanceMeters: t.targetDistanceMeters,
          rankDirection: t.rankDirection,
          resultKind: t.resultKind,
          rounds: t.rounds ?? 1,
        }))
      );
    }
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
