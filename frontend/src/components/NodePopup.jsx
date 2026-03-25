import React from 'react';
import { X } from 'lucide-react';
import { styleOf, groupOf } from '../lib/graphUtils';

export default function NodePopup({ node, onClose }) {
    if (!node) return null;

    const style = styleOf(node.id);
    const group = groupOf(node.id);

    // Parse tooltip HTML into field-value pairs (from the backend)
    const fields = [
        { label: 'Entity ID', value: node.id },
        { label: 'Type', value: group },
        { label: 'Connections', value: node.connections },
    ];

    // Try to extract more metadata from the id pattern
    const parts = node.id.split('_');
    const entityNum = parts[parts.length - 1];
    if (!isNaN(entityNum) && entityNum.length > 4) {
        fields.push({ label: 'Reference Number', value: entityNum });
    }

    return (
        <div className="absolute z-50 bg-white rounded-xl shadow-popup border border-gray-100 w-72 pointer-events-auto animate-fadeIn"
            style={{ top: 80, right: 16 }}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ background: style.bg }}
                    />
                    <span className="font-semibold text-sm text-gray-800">{group}</span>
                </div>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-700 transition-colors rounded p-0.5 hover:bg-gray-100"
                >
                    <X size={14} />
                </button>
            </div>

            {/* Fields */}
            <div className="px-4 py-3 space-y-2">
                {fields.map((f, i) => (
                    <div key={i} className="flex justify-between items-start gap-2">
                        <span className="text-xs text-gray-400 flex-shrink-0">{f.label}:</span>
                        <span className="text-xs text-gray-800 font-medium text-right break-all">{String(f.value)}</span>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-gray-50 bg-gray-50 rounded-b-xl">
                <p className="text-xs text-gray-400">
                    Click a connected node to explore further.
                </p>
            </div>
        </div>
    );
}
