import React, { useEffect, useRef, useCallback } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import { buildElements, buildStylesheet } from '../lib/graphUtils';
import cytoscape from 'cytoscape';

export default function GraphCanvas({ graphData, onNodeClick, showOverlay }) {
    const cyRef = useRef(null);

    const layout = {
        name: 'cose',
        animate: true,
        animationDuration: 800,
        animationEasing: 'ease-out',
        randomize: false,
        nodeOverlap: 24,
        idealEdgeLength: () => 90,
        edgeElasticity: () => 45,
        gravity: 0.05,
        numIter: 2500,
        initialTemp: 200,
        coolingFactor: 0.99,
        minTemp: 1.0,
        fit: true,
        padding: 40,
    };

    const elements = graphData
        ? buildElements(graphData.nodes, graphData.edges)
        : [];

    const stylesheet = buildStylesheet();

    const handleCyInit = useCallback((cy) => {
        cyRef.current = cy;

        cy.on('tap', 'node', (evt) => {
            const node = evt.target;
            const nodeId = node.id();

            // Reset all
            cy.elements().removeClass('highlighted faded');

            // Highlight neighbourhood
            const neighborhood = node.closedNeighborhood();
            cy.elements().addClass('faded');
            neighborhood.removeClass('faded').addClass('highlighted');
            neighborhood.connectedEdges().removeClass('faded').addClass('highlighted');

            onNodeClick({
                id: nodeId,
                data: node.data(),
                group: node.data('group'),
                connections: node.degree(),
                position: node.renderedPosition(),
            });
        });

        cy.on('tap', (evt) => {
            if (evt.target === cy) {
                cy.elements().removeClass('highlighted faded');
                onNodeClick(null);
            }
        });
    }, [onNodeClick]);

    // Toggle overlay labels
    useEffect(() => {
        const cy = cyRef.current;
        if (!cy) return;
        cy.style()
            .selector('node')
            .style({ 'label': showOverlay ? 'data(label)' : '' })
            .update();
    }, [showOverlay]);

    return (
        <CytoscapeComponent
            elements={elements}
            stylesheet={stylesheet}
            layout={layout}
            cy={handleCyInit}
            style={{ width: '100%', height: '100%' }}
            wheelSensitivity={0.3}
        />
    );
}
