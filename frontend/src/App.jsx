import React, { useState, useEffect, useCallback } from 'react';
import { Minimize2, Layers, ChevronRight, AlertCircle, Loader2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import GraphCanvas from './components/GraphCanvas.jsx';
import ChatPanel from './components/ChatPanel.jsx';
import NodePopup from './components/NodePopup.jsx';
import Legend from './components/Legend.jsx';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function App() {
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [showOverlay, setShowOverlay] = useState(true);
  const [minimized, setMinimized] = useState(false);

  const fetchGraph = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/graph-data`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setGraphData(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGraph(); }, [fetchGraph]);

  const stats = graphData
    ? { nodes: graphData.nodes.length, edges: graphData.edges.length }
    : null;

  return (
    <div className="flex flex-col h-screen bg-[#f4f6f9] overflow-hidden select-none">

      {/* ── Top Bar ─────────────────────────────────────────────── */}
      <header className="flex items-center gap-3 px-5 py-3 bg-white border-b border-gray-100 shadow-sm z-40">
        <button className="w-8 h-8 flex flex-col items-center justify-center gap-1 rounded-md hover:bg-gray-100 transition-colors">
          {[0, 1, 2].map(i => <span key={i} className="w-4 h-0.5 bg-gray-500 rounded" />)}
        </button>
        <div className="flex items-center gap-1.5 text-sm">
          <span className="text-gray-400 font-medium hover:text-gray-700 cursor-pointer transition-colors">Mapping</span>
          <ChevronRight size={14} className="text-gray-300" />
          <span className="font-semibold text-gray-900">Order to Cash</span>
        </div>
        {stats && (
          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 font-medium px-3 py-1 rounded-full border border-blue-100">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              {stats.nodes.toLocaleString()} nodes
            </div>
            <div className="flex items-center gap-1.5 text-xs bg-indigo-50 text-indigo-700 font-medium px-3 py-1 rounded-full border border-indigo-100">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              {stats.edges.toLocaleString()} edges
            </div>
          </div>
        )}
      </header>

      {/* ── Main Content ─────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Graph Pane ────────────────────────────────────────── */}
        <div className={`relative flex-1 overflow-hidden transition-all duration-300 ${minimized ? 'w-0 opacity-0 pointer-events-none' : ''}`}>

          {/* Floating controls */}
          <div className="absolute top-3 left-3 z-30 flex items-center gap-2">
            <button
              onClick={() => setMinimized(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
              <Minimize2 size={12} />
              {minimized ? 'Expand' : 'Minimize'}
            </button>
            <button
              onClick={() => setShowOverlay(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm border transition-all ${showOverlay
                ? 'bg-gray-900 text-white border-gray-900 hover:bg-gray-700'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
            >
              <Layers size={12} />
              {showOverlay ? 'Hide Labels' : 'Show Labels'}
            </button>
          </div>

          {/* Loading */}
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#f4f6f9]/80 z-20 backdrop-blur-sm">
              <Loader2 size={32} className="text-blue-500 animate-spin" />
              <p className="text-sm text-gray-500 font-medium">Loading graph from backend…</p>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-20">
              <div className="bg-white rounded-2xl shadow-card p-8 flex flex-col items-center gap-3 max-w-sm">
                <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center">
                  <AlertCircle size={22} className="text-rose-500" />
                </div>
                <p className="text-sm font-semibold text-gray-800">Cannot connect to backend</p>
                <p className="text-xs text-gray-500 text-center">{error}</p>
                <button
                  onClick={fetchGraph}
                  className="px-5 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Canvas */}
          {graphData && !loading && (
            <GraphCanvas
              graphData={graphData}
              onNodeClick={setSelectedNode}
              showOverlay={showOverlay}
            />
          )}

          {/* Node popup */}
          {selectedNode && (
            <NodePopup
              node={selectedNode}
              onClose={() => setSelectedNode(null)}
            />
          )}

          {/* Legend */}
          {graphData && !loading && <Legend />}

          {/* Node count badge */}
          {selectedNode && (
            <div className="absolute top-3 right-3 z-30 bg-white/90 backdrop-blur-sm border border-gray-100 rounded-lg px-3 py-1.5 shadow-sm text-xs text-gray-600">
              Selected: <span className="font-semibold text-gray-900">{selectedNode.id}</span>
            </div>
          )}
        </div>

        {/* ── Chat Pane ─────────────────────────────────────────── */}
        <div className="w-[340px] flex-shrink-0 flex flex-col h-full overflow-hidden">
          <ChatPanel />
        </div>
      </div>
    </div>
  );
}
