import React from 'react';
import { GROUP_STYLES } from '../lib/graphUtils';

const LEGEND_ITEMS = [
    'Customer', 'Order', 'Delivery', 'Billing',
    'Product', 'ProductGroup', 'ProductType',
    'Address', 'CustomerGroup',
];

export default function Legend() {
    return (
        <div className="absolute bottom-4 left-4 z-30 bg-white/90 backdrop-blur-sm border border-gray-100 rounded-xl shadow-card px-3 py-2.5">
            <p className="text-[10px] uppercase font-semibold text-gray-400 tracking-widest mb-1.5">Legend</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {LEGEND_ITEMS.map(g => (
                    <div key={g} className="flex items-center gap-1.5">
                        <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ background: GROUP_STYLES[g]?.bg ?? '#94a3b8' }}
                        />
                        <span className="text-[11px] text-gray-600">{g}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
