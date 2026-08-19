import Link from "next/link";
import { requireUser } from "@/lib/auth-helpers";
import { getLeaderboardCategories, getLeaderboard } from "@/lib/leaderboard";
import { formatMs } from "@/lib/format";
import { AppShell, AppHeader } from "@/components/app-shell";
import { BottomNav } from "@/components/bottom-nav";
import { Avatar } from "@/components/avatar";
import { cn } from "@/lib/cn";

function formatValue(kind: "time" | "reps", value: number) {
  return kind === "time" ? formatMs(value) : `${value} ISM`;
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const user = await requireUser();
  const { cat } = await searchParams;

  const categories = await getLeaderboardCategories();
  const selected = cat && categories.some((c) => c.name === cat) ? cat : categories[0]?.name;
  const { category, rows } = selected
    ? await getLeaderboard(selected)
    : { category: null, rows: [] };

  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);
  const ownRow = rows.find((r) => r.userId === user.id);

  // Podium rendered in visual order 2nd, 1st, 3rd.
  const podiumOrder = [podium[1], podium[0], podium[2]];

  return (
    <AppShell>
      <AppHeader title="Ranglista" />

      {categories.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-text-muted">
          Még nincs rögzített stopperes eredmény.
        </div>
      ) : (
        <>
          <div className="flex gap-1.5 overflow-x-auto border-b border-border px-5 py-3.5">
            {categories.map((c) => (
              <Link
                key={c.name}
                href={`/leaderboard?cat=${encodeURIComponent(c.name)}`}
                className={cn(
                  "whitespace-nowrap rounded-full px-3 py-2 text-[12px] font-medium",
                  c.name === selected
                    ? "bg-text text-bg"
                    : "border border-border-strong bg-bg-inset text-text-secondary"
                )}
              >
                {c.name}
              </Link>
            ))}
          </div>

          {rows.length === 0 ? (
            <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-text-muted">
              Ebben a kategóriában még senki nem rögzített eredményt.
            </div>
          ) : (
            <>
              <div className="flex items-end gap-2.5 border-b border-border bg-bg-inset px-5 py-6">
                {podiumOrder.map((row, i) => {
                  if (!row) return <div key={i} className="flex-1" />;
                  const place = i === 1 ? 1 : i === 0 ? 2 : 3;
                  const isFirst = place === 1;
                  return (
                    <div key={row.userId} className="flex-1 text-center">
                      <Avatar
                        name={row.userName}
                        size={isFirst ? 54 : 44}
                        highlight={isFirst}
                        className="mx-auto mb-2.5"
                      />
                      <div className="mb-1 truncate text-[12px] font-medium">{row.userName}</div>
                      <div
                        className={cn(
                          "mono text-[12px] font-medium",
                          isFirst ? "text-warning" : "text-text-secondary"
                        )}
                      >
                        {category && formatValue(category.resultKind, row.value)}
                      </div>
                      <div
                        className={cn(
                          "mono mt-2.5 flex items-center justify-center rounded-t-lg font-medium",
                          isFirst
                            ? "h-16 bg-warning-bg text-warning text-[16px]"
                            : "h-8 bg-bg-elevated text-text-secondary text-[13px]"
                        )}
                      >
                        {place}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-1 flex-col overflow-hidden px-5">
                {rest.map((row) => (
                  <div
                    key={row.userId}
                    className="flex items-center gap-3 border-b border-border py-3.5"
                  >
                    <span className="mono w-5 text-[12px] text-text-secondary">{row.rank}</span>
                    <Avatar name={row.userName} size={28} highlight={row.userId === user.id} />
                    <div className="flex-1 text-[13px] font-medium">
                      {row.userName}
                      {row.userId === user.id && (
                        <span className="mono ml-1.5 text-[10.5px] text-text-muted">TE</span>
                      )}
                    </div>
                    <span className="mono text-[13px]">
                      {category && formatValue(category.resultKind, row.value)}
                    </span>
                  </div>
                ))}
              </div>

              {ownRow && ownRow.rank > 3 && category && (
                <div className="mx-3.5 mb-3.5 flex items-center gap-3 rounded-[11px] border border-border-strong bg-bg-inset px-4 py-3.5">
                  <span className="mono text-[13px] font-medium">#{ownRow.rank}</span>
                  <div className="flex-1 text-[12px] text-text-muted">A te helyezésed</div>
                  <span className="mono text-[15px] font-medium">
                    {formatValue(category.resultKind, ownRow.value)}
                  </span>
                </div>
              )}
            </>
          )}
        </>
      )}

      <BottomNav variant="user" />
    </AppShell>
  );
}
