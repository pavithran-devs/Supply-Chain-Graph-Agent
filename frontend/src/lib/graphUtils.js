// colour and size per entity type (prefix before first underscore)
export const GROUP_STYLES = {
    Customer: { bg: '#3b82f6', fg: '#fff', size: 28 },
    Order: { bg: '#6366f1', fg: '#fff', size: 26 },
    Delivery: { bg: '#0ea5e9', fg: '#fff', size: 22 },
    Billing: { bg: '#f59e0b', fg: '#fff', size: 20 },
    Product: { bg: '#10b981', fg: '#fff', size: 18 },
    ProductGroup: { bg: '#84cc16', fg: '#fff', size: 16 },
    ProductType: { bg: '#a3e635', fg: '#333', size: 14 },
    Address: { bg: '#e879f9', fg: '#fff', size: 16 },
    CustomerGroup: { bg: '#f472b6', fg: '#fff', size: 16 },
    Unknown: { bg: '#94a3b8', fg: '#fff', size: 16 },
};

export function groupOf(nodeId) {
    if (!nodeId) return 'Unknown';
    const parts = String(nodeId).split('_');
    if (parts.length < 2) return 'Unknown';
    // handle multi-word: CustomerGroup, ProductGroup, ProductType
    const full = parts.slice(0, -1).join('_');
    if (GROUP_STYLES[full]) return full;
    return parts[0];
}

export function styleOf(nodeId) {
    const g = groupOf(nodeId);
    return GROUP_STYLES[g] || GROUP_STYLES.Unknown;
}

/** Build Cytoscape elements from graph-data API response */
export function buildElements(nodes, edges) {
    const cyNodes = nodes.map(n => ({
        data: {
            id: n.id,
            label: n.label,
            group: n.group,
            tooltip: n.title,
        },
        selectable: true,
        grabbable: true,
    }));

    const cyEdges = edges.map((e, i) => ({
        data: {
            id: `e-${i}`,
            source: e.from,
            target: e.to,
            label: e.label,
        },
    }));

    return [...cyNodes, ...cyEdges];
}

/** Cytoscape stylesheet */
export function buildStylesheet() {
    const nodeStyles = Object.entries(GROUP_STYLES).map(([group, s]) => ({
        selector: `node[group="${group}"]`,
        style: {
            'background-color': s.bg,
            'width': s.size,
            'height': s.size,
        },
    }));

    return [
        {
            selector: 'node',
            style: {
                'label': 'data(label)',
                'font-size': '9px',
                'font-family': 'Inter, sans-serif',
                'color': '#374151',
                'text-valign': 'bottom',
                'text-halign': 'center',
                'text-margin-y': '4px',
                'text-outline-color': '#f4f6f9',
                'text-outline-width': '2px',
                'border-width': '2px',
                'border-color': '#fff',
                'border-opacity': 0.8,
                'transition-property': 'background-color, border-color, width, height',
                'transition-duration': '0.15s',
            },
        },
        ...nodeStyles,
        {
            selector: 'node:selected',
            style: {
                'border-color': '#1d4ed8',
                'border-width': '3px',
                'background-blacken': -0.2,
            },
        },
        {
            selector: 'node.highlighted',
            style: {
                'border-color': '#f59e0b',
                'border-width': '3px',
            },
        },
        {
            selector: 'node.faded',
            style: {
                'opacity': 0.15,
            },
        },
        {
            selector: 'edge',
            style: {
                'width': 1,
                'line-color': '#bfdbfe',
                'target-arrow-color': '#93c5fd',
                'target-arrow-shape': 'triangle',
                'curve-style': 'bezier',
                'arrow-scale': 0.7,
                'opacity': 0.7,
                'transition-property': 'opacity',
                'transition-duration': '0.15s',
            },
        },
        {
            selector: 'edge.highlighted',
            style: {
                'line-color': '#3b82f6',
                'target-arrow-color': '#3b82f6',
                'width': 2,
                'opacity': 1,
            },
        },
        {
            selector: 'edge.faded',
            style: {
                'opacity': 0.05,
            },
        },
    ];
}
