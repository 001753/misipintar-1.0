"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AuditLog = {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  before: unknown;
  after: unknown;
  ipAddress: string;
  createdAt: string;
  adminName: string;
  adminEmail: string;
};

interface Props {
  logs: AuditLog[];
  total: number;
  page: number;
  pageSize: number;
  currentAction: string;
  availableActions: string[];
}

const ACTION_COLORS: Record<string, string> = {
  UPDATE_PLAN_PRICE: "text-blue-400",
  UPDATE_PLAN_LIMITS: "text-blue-400",
  TOGGLE_PLAN_ACTIVE: "text-yellow-400",
  UPDATE_PHASE_MODE: "text-purple-400",
  FORCE_UPGRADE_SUB: "text-emerald-400",
  FORCE_EXPIRE_SUB: "text-red-400",
  SUSPEND_FAMILY: "text-red-400",
  MANUAL_REFUND: "text-orange-400",
  MANUAL_UNBLOCK_LOGIN: "text-cyan-400",
};

function JsonDiff({ label, value }: { label: string; value: unknown }) {
  if (value === null || value === undefined) return null;
  return (
    <div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <pre className="text-xs font-mono bg-gray-950 text-gray-300 px-3 py-2 rounded-lg overflow-auto max-h-32">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}

export default function AuditLogClient({
  logs,
  total,
  page,
  pageSize,
  currentAction,
  availableActions,
}: Props) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const totalPages = Math.ceil(total / pageSize);

  function setFilter(action: string) {
    const params = new URLSearchParams();
    if (action !== "ALL") params.set("action", action);
    router.push(`/superadmin/audit?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      {/* Filter chips */}
      <div className="flex gap-2 flex-wrap">
        {availableActions.map((a) => (
          <button
            key={a}
            onClick={() => setFilter(a)}
            className={`text-xs px-3 py-1.5 rounded-lg font-mono font-medium transition-colors ${
              currentAction === a
                ? "bg-emerald-700 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            {a}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-500 self-center">{total} entri</span>
      </div>

      {/* Log list */}
      <div className="space-y-2">
        {logs.length === 0 ? (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 text-center text-gray-500">
            Belum ada audit log.
          </div>
        ) : (
          logs.map((log) => {
            const isExpanded = expandedId === log.id;
            return (
              <div
                key={log.id}
                className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : log.id)}
                  className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-gray-700/40 transition-colors"
                >
                  <span
                    className={`text-xs font-mono font-bold ${
                      ACTION_COLORS[log.action] ?? "text-gray-300"
                    }`}
                  >
                    {log.action}
                  </span>
                  <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">
                    {log.targetType}
                  </span>
                  <span className="text-xs text-gray-500 font-mono truncate max-w-[160px]">
                    {log.targetId}
                  </span>
                  <span className="text-xs text-gray-500 ml-auto flex-shrink-0">
                    {log.adminName} · {new Date(log.createdAt).toLocaleString("id-ID")}
                  </span>
                  <span className="text-gray-500 text-xs ml-2">{isExpanded ? "▲" : "▼"}</span>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-gray-700 pt-4 space-y-3">
                    <div className="flex gap-6 text-xs text-gray-400">
                      <span>Admin: <strong className="text-white">{log.adminName}</strong></span>
                      <span>Email: <strong className="text-gray-300">{log.adminEmail}</strong></span>
                      <span>IP: <strong className="font-mono text-gray-300">{log.ipAddress}</strong></span>
                      <span>Waktu: <strong className="text-gray-300">{new Date(log.createdAt).toLocaleString("id-ID")}</strong></span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <JsonDiff label="Sebelum (before)" value={log.before} />
                      <JsonDiff label="Sesudah (after)" value={log.after} />
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => {
                const params = new URLSearchParams();
                if (currentAction !== "ALL") params.set("action", currentAction);
                params.set("page", String(p));
                router.push(`/superadmin/audit?${params.toString()}`);
              }}
              className={`w-8 h-8 rounded-lg text-xs font-medium ${
                p === page
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
