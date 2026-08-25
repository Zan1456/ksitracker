import Link from "next/link";
import { requireUser } from "@/lib/auth-helpers";
import {
  getLeaderboardCategories,
  getLeaderboard,
  getPersonalTrend,
  type LeaderboardScope,
} from "@/lib/leaderboard";
import { formatMs } from "@/lib/format";
import { AppShell } from "@/components/app-shell";
import { BottomNav } from "@/components/bottom-nav";
import { CategorySelect } from "@/components/category-select";
import { PageTransition } from "@/components/motion/page-transition";
import { StaggerContainer, StaggerItem } from "@/components/motion/stagger-list";
import { AnimatedBar } from "@/components/motion/animated-bar";
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

  const [{ category, rows }, trend] = selected
    ? await Promise.all([getLeaderboard(selected, scope), getPersonalTrend(user.id, selected, 5)])
    : [{ category: null, rows: [] }, { category: null, points: [] }];

  const top5 = rows.slice(0, 5);
  const ownRow = rows.find((r) => r.userId === user.id);

  const values = trend.points.map((p) => p.value);
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 0;
  const barHeight = (v: number) => 30 + (max > min ? ((v - min) / (max - min)) * 40 : 20);

  return (
    <AppShell>
      <div className="glass sticky top-0 z-10 border-b px-5 pb-3.5 pt-4">
        <h1 className="mb-3.5 text-[22px] font-medium leading-[1.2] tracking-[-0.03em]">Ranglista</h1>

        {categories.length > 0 && selected && (
          <>
            <CategorySelect categories={categories} selected={selected} />
            <div className="mt-3.25 flex gap-0.75 rounded-[9px] border border-border bg-bg-inset p-0.75">
              {(
                [
                  ["alltime", "Örökranglista"],
                  ["week", "Ez a hét"],
                ] as [LeaderboardScope, string][]
              ).map(([key, label]) => (
                <Link
                  key={key}
                  href={`/leaderboard?cat=${encodeURIComponent(selected)}&scope=${key}`}
                  className={cn(
                    "flex-1 rounded-[7px] py-2 text-center text-[12px] font-medium",
                    scope === key ? "bg-text text-bg" : "text-text-muted"
                  )}
                >
                  {label}
                </Link>
              ))}
            </div>
          </>
        )}
      </div>

      {categories.length === 0 || !selected || !category ? (
        <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-text-muted">
          Még nincs rögzített stopperes eredmény.
        </div>
      ) : (
        <PageTransition className="gap-4 overflow-y-auto px-5 pt-4.5 pb-5">
          {ownRow && (
            <div className="rounded-[11px] border border-border bg-bg-inset p-3.75">
              <div className="mb-4 flex items-end justify-between">
                <div>
                  <div className="mono mb-1.75 text-[10px] text-text-faint">A TE IDŐID</div>
                  <div className="mono text-[22px] font-medium">
                    {formatValue(category.resultKind, ownRow.value)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="mono mb-1.75 text-[10px] text-text-faint">HELYEZÉS</div>
                  <div className="mono text-[22px] font-medium">#{ownRow.rank}</div>
                </div>
              </div>
              {trend.points.length > 1 && (
                <div className="flex items-end gap-2.25" style={{ height: 74 }}>
                  {trend.points.map((p, i) => {
                    const isLast = i === trend.points.length - 1;
                    return (
                      <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1.75">
                        <AnimatedBar
                          height={barHeight(p.value)}
                          className={isLast ? "bg-text" : "bg-bg-elevated"}
                        />
                        <div
                          className={cn(
                            "mono text-center text-[9.5px]",
                            isLast ? "text-text" : "text-text-faint"
                          )}
                        >
                          {formatValue(category.resultKind, p.value)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2.75">
            <div className="mono flex items-center justify-between text-[10.5px] text-text-faint">
              <span>TOP 5 · {rows.length} RÉSZTVEVŐ</span>
              <span>LEGJOBB IDŐ</span>
            </div>
            <StaggerContainer className="flex flex-col gap-1.75">
              {top5.length === 0 && (
                <p className="py-4 text-center text-[12.5px] text-text-muted">
                  Ebben a kategóriában még senki nem rögzített eredményt.
                </p>
              )}
              {top5.map((row) => {
                const isMe = row.userId === user.id;
                const isFirst = row.rank === 1;
                return (
                  <StaggerItem
                    key={row.userId}
                    className={cn(
                      "flex items-center gap-3 rounded-[9px] border px-3.25 py-2.75",
                      isFirst
                        ? "border-warning-border bg-warning-bg"
                        : isMe
                          ? "border-border-strong bg-bg-inset"
                          : "border-border bg-bg-elevated"
                    )}
                  >
                    <span
                      className={cn(
                        "mono w-4 text-[12px] font-medium",
                        isFirst ? "text-warning" : "text-text-muted"
                      )}
                    >
                      {row.rank}
                    </span>
                    <span className={cn("flex-1 text-[13px] font-medium", !isFirst && !isMe && "text-[#e5e5e5]")}>
                      {isMe ? "Te" : row.userName}
                    </span>
                    <span
                      className={cn(
                        "mono text-[13px] font-medium",
                        isFirst ? "text-warning" : isMe ? "text-text" : "text-text-secondary"
                      )}
                    >
                      {formatValue(category.resultKind, row.value)}
                    </span>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          </div>

          {ownRow && ownRow.rank > 5 && (
            <div className="flex items-center gap-3 rounded-[9px] border border-border-strong bg-bg-inset px-3.25 py-2.75">
              <span className="mono w-4 text-[12px] font-medium">#{ownRow.rank}</span>
              <span className="flex-1 text-[13px] font-medium">Te</span>
              <span className="mono text-[13px] font-medium">
                {formatValue(category.resultKind, ownRow.value)}
              </span>
            </div>
          )}
        </PageTransition>
      )}

      <BottomNav variant="user" />
    </AppShell>
  );
}
