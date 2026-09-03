import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Database, Copy, Check, AlertCircle, ArrowRight } from "lucide-react";
import { toast } from "sonner";

const TOTAL_ENTITIES = 67;
const BATCH_SIZE = 10;

export default function AdminSupabaseMigration() {
  const [loading, setLoading] = useState(false);
  const [allSql, setAllSql] = useState("");
  const [tableStatus, setTableStatus] = useState(null);
  const [checkingTables, setCheckingTables] = useState(false);
  const [copied, setCopied] = useState(false);
  const [batchesDone, setBatchesDone] = useState(0);

  const fetchTableStatus = useCallback(async () => {
    setCheckingTables(true);
    try {
      const res = await base44.functions.invoke("checkSupabaseTables", {});
      setTableStatus(res.data);
    } catch (e) {
      toast.error("Failed to check table status");
    } finally {
      setCheckingTables(false);
    }
  }, []);

  useEffect(() => {
    fetchTableStatus();
  }, [fetchTableStatus]);

  const generateAllDDL = async () => {
    setLoading(true);
    setAllSql("");
    setBatchesDone(0);
    const sqlParts = [];
    const numBatches = Math.ceil(TOTAL_ENTITIES / BATCH_SIZE);

    for (let i = 0; i < numBatches; i++) {
      try {
        const res = await base44.functions.invoke("generateTableDDL", {
          batch_index: i,
          batch_size: BATCH_SIZE,
        });
        if (res.data?.sql) {
          sqlParts.push(res.data.sql);
        }
        setBatchesDone(i + 1);
      } catch (e) {
        toast.error(`Batch ${i + 1} failed: ${e.message}`);
        break;
      }
    }

    const fullSql = sqlParts.join("\n\n");
    setAllSql(fullSql);
    setLoading(false);
    toast.success(`Generated DDL for ${numBatches * BATCH_SIZE} tables`);
  };

  const copySql = async () => {
    await navigator.clipboard.writeText(allSql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("SQL copied to clipboard!");
  };

  const presentCount = tableStatus?.tables_present || 0;
  const missingCount = tableStatus?.tables_missing || 0;
  const progress = Math.round((presentCount / TOTAL_ENTITIES) * 100);

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Database className="w-8 h-8 text-cyan-400" />
            <h1 className="text-3xl font-bold">Supabase Table Migration</h1>
          </div>
          <p className="text-gray-400">
            Create all Base44 entity tables in Supabase. Direct Postgres connections from the serverless runtime are blocked,
            so DDL must be run manually in the Supabase SQL Editor.
          </p>
        </div>

        {/* Progress Card */}
        <div className="rounded-2xl bg-[#121826] border border-cyan-500/20 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Table Status</h2>
            <button
              onClick={fetchTableStatus}
              disabled={checkingTables}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 transition disabled:opacity-50"
            >
              {checkingTables ? "Checking..." : "Refresh"}
            </button>
          </div>

          {tableStatus ? (
            <>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="rounded-xl bg-[#0B0F1A] p-4 text-center">
                  <div className="text-3xl font-bold text-white">{TOTAL_ENTITIES}</div>
                  <div className="text-xs text-gray-500 mt-1">Total Tables</div>
                </div>
                <div className="rounded-xl bg-[#0B0F1A] p-4 text-center">
                  <div className="text-3xl font-bold text-green-400">{presentCount}</div>
                  <div className="text-xs text-gray-500 mt-1">Created</div>
                </div>
                <div className="rounded-xl bg-[#0B0F1A] p-4 text-center">
                  <div className="text-3xl font-bold text-amber-400">{missingCount}</div>
                  <div className="text-xs text-gray-500 mt-1">Missing</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-3 rounded-full bg-[#0B0F1A] overflow-hidden mb-2">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progress}%`, background: "linear-gradient(90deg, #00CFFF, #8A5CFF)" }}
                />
              </div>
              <div className="text-right text-xs text-gray-500">{progress}% complete</div>

              {missingCount > 0 && (
                <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-200">
                    <strong>{missingCount} tables</strong> are missing from Supabase. Generate the DDL SQL below and run it in the Supabase SQL Editor.
                  </div>
                </div>
              )}

              {missingCount === 0 && (
                <div className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30 flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-green-200">
                    All tables exist! You can now sync data using the REST sync function.
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
            </div>
          )}
        </div>

        {/* DDL Generation Card */}
        <div className="rounded-2xl bg-[#121826] border border-cyan-500/20 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Step 1: Generate DDL SQL</h2>
            {batchesDone > 0 && loading && (
              <span className="text-sm text-gray-400">Batch {batchesDone}/{Math.ceil(TOTAL_ENTITIES / BATCH_SIZE)}...</span>
            )}
          </div>

          <button
            onClick={generateAllDDL}
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-sm transition disabled:opacity-50"
            style={{ background: "linear-gradient(90deg, #00CFFF, #8A5CFF)", color: "#0B0F1A" }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" /> Generating... ({batchesDone}/{Math.ceil(TOTAL_ENTITIES / BATCH_SIZE)})
              </span>
            ) : (
              "Generate DDL for All Tables"
            )}
          </button>

          {allSql && (
            <>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-gray-400">SQL generated ({allSql.length.toLocaleString()} chars)</span>
                <button
                  onClick={copySql}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 transition"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied!" : "Copy SQL"}
                </button>
              </div>
              <textarea
                readOnly
                value={allSql}
                className="w-full mt-3 h-64 p-4 rounded-xl bg-[#0B0F1A] border border-white/10 text-xs font-mono text-gray-300 resize-y focus:outline-none"
                placeholder="Generated SQL will appear here..."
              />
            </>
          )}
        </div>

        {/* Instructions Card */}
        {allSql && (
          <div className="rounded-2xl bg-[#121826] border border-cyan-500/20 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ArrowRight className="w-5 h-5 text-cyan-400" />
              Step 2: Run in Supabase SQL Editor
            </h2>
            <ol className="space-y-3 text-sm text-gray-300">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold">1</span>
                <span>Open your <a href={tableStatus?.supabase_url ? `${tableStatus.supabase_url}/project/_/sql/new` : "https://supabase.com/dashboard"} target="_blank" rel="noreferrer noopener noreferrer" className="text-cyan-400 underline">Supabase SQL Editor</a></span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold">2</span>
                <span>Paste the copied SQL into the editor</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold">3</span>
                <span>Click <strong>Run</strong> to create all tables</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold">4</span>
                <span>Come back here and click <strong>Refresh</strong> to verify all tables are created</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold">5</span>
                <span>Once all tables exist, data sync can proceed via the REST API</span>
              </li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}