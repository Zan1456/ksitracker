import Link from "next/link";
import { requireUser } from "@/lib/auth-helpers";
import { getLeaderboardCategories, getLeaderboard, type LeaderboardScope } from "@/lib/leaderboard";
import { formatMs, initials } from "@/lib/format";
import { AppShell } from "@/components/app-shell";
import { BottomNav } from "@/components/bottom-nav";
import { StaggerContainer, StaggerItem } from "@/components/motion/stagger-list";
import { cn } from "@/lib/cn";

function formatValue(kind: "time" | "reps", value: number) {
  return kind === "time" ? formatMs(value) : `${value} ISM`;
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string; scope?: string }>;
}) {
  const user = await requireUser();
  const { cat, scope: scopeParam } = await searchParams;
  const scope: LeaderboardScope = scopeParam === "week" ? "week" : "alltime";

  const categories = await getLeaderboardCategories();
  const selected = cat && categories.some((c) => c.name === cat) ? cat : categories[0]?.name;

  const { category, rows } = selected ? await getLeaderboard(selected, scope) : { category: null, rows: [] };

  const ownRow = rows.find((r) => r.userId === user.id);
  const podium = [1, 0, 2].map((i) => rows[i] ?? null);
  const rest = rows.slice(3);

  const scopeTabs: [LeaderboardScope, string][] = [
    ["alltime", "Örökranglista"],
    ["week", "Ez a hét"],
  ];

  return (
    <AppShell>
      <div className="px-5.5 pb-3.5 pt-1.5">
        <div className="text-[25px] font-extrabold leading-[1.1] tracking-[-0.03em]">Ranglista</div>
        <div className="mono mt-2.25 text-[10.5px] tracking-[0.12em] text-white/65">
          KIHÍVÁS-FELADATOK LEGJOBB IDŐI
        </div>
      </div>

      {categories.length > 0 && selected && (
        <>
          <div className="flex gap-2 overflow-x-auto px-5.5 pb-2.5">
            {categories.map((c) => (
              <Link
                key={c.name}
                href={`/leaderboard?cat=${encodeURIComponent(c.name)}&scope=${scope}`}
                className={cn(
                  "shrink-0 rounded-full px-4 py-2.5 text-[12.5px] font-bold",
                  c.name === selected ? "bg-white text-brand-blue" : "bg-white/14 text-white/85"
                )}
              >
                {c.name}
              </Link>
            ))}
          </div>
          <div className="flex gap-1.5 px-5.5 pb-3.5">
            {scopeTabs.map(([key, label]) => (
              <Link
                key={key}
                href={`/leaderboard?cat=${encodeURIComponent(selected)}&scope=${key}`}
                className={cn(
                  "flex-1 rounded-full py-2.25 text-center text-[11.5px] font-bold",
                  scope === key ? "bg-white/20 text-white" : "text-white/55"
                )}
              >
                {label}
              </Link>
            ))}
          </div>
        </>
      )}

      {categories.length === 0 || !selected || !category ? (
        <div className="flex flex-1 items-center justify-center px-6 text-center text-[13px] font-semibold text-white/60">
          Még nincs rögzített kihívás-eredmény.
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto px-5.5 pb-8">
          <div className="mb-4 flex items-end gap-2.25">
            {podium.map((row, i) => {
              const pos = i + 1;
              const h = pos === 1 ? 132 : pos === 2 ? 114 : 100;
              return (
                <div
                  key={pos}
                  className={cn(
                    "flex flex-1 flex-col justify-end gap-2.25 rounded-[22px] p-3.5 text-center",
                    pos === 1 ? "bg-accent text-accent-fg" : "bg-white/12 text-white"
                  )}
                  style={{ height: h }}
                >
                  <div className="mono text-[10.5px] font-bold tracking-[0.1em] opacity-70">{pos}.</div>
                  <div className="truncate text-[12.5px] font-bold">
                    {row ? (row.userId === user.id ? "Te" : row.userName) : "—"}
                  </div>
                  <div className="mono text-[14px] font-bold">
                    {row ? formatValue(category.resultKind, row.value) : "—"}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="overflow-hidden rounded-[24px] border border-white/15 bg-white/8">
            {rest.length === 0 && rows.length <= 3 && (
              <p className="py-6 text-center text-[12.5px] font-semibold text-white/60">
                Nincs több résztvevő ebben a kategóriában.
              </p>
            )}
            <StaggerContainer>
              {rest.map((row) => {
                const isMe = row.userId === user.id;
                return (
                  <StaggerItem
                    key={row.userId}
                    className={cn(
                      "flex items-center gap-3 border-b border-white/8 px-4.25 py-3.5 last:border-b-0",
                      isMe && "bg-accent/14"
                    )}
                  >
                    <span className="mono w-5.5 text-[11.5px] text-white/50">{row.rank}</span>
                    <span className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-full bg-white/16 text-[10.5px] font-bold">
                      {initials(row.userName)}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold">
                      {isMe ? "Te" : row.userName}
                    </span>
                    <span className="mono text-[13.5px] font-semibold">
                      {formatValue(category.resultKind, row.value)}
                    </span>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          </div>

          {ownRow ? (
            <div className="mt-3.5 flex items-center gap-3.25 rounded-[22px] bg-accent p-4.25 text-accent-fg">
              <span className="mono text-[14px] font-extrabold">{ownRow.rank}.</span>
              <span className="flex-1 truncate text-[13.5px] font-extrabold">{user.name} · te</span>
              <span className="mono text-[15px] font-extrabold">
                {formatValue(category.resultKind, ownRow.value)}
              </span>
            </div>
          ) : (
            <div className="mt-3.5 rounded-[22px] border border-white/15 bg-white/8 p-4.25 text-[12.5px] font-semibold leading-[1.45] text-white/75">
              Még nincs időd ebben a feladatban. Válaszd be a következő szintzáró kihívásba.
            </div>
          )}
          <div className="h-24 shrink-0" aria-hidden />
        </div>
      )}

      <BottomNav variant="user" />
    </AppShell>
  );
}
