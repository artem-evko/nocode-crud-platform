import type { AppNode, EntityFieldType } from '../components/EntityNode';
import type { Edge } from '@xyflow/react';
import type { ProjectFormData } from '../components/ProjectModal';

export interface BackendSpec {
    specVersion: number;
    project: {
        groupId: string;
        artifactId: string;
        name: string;
        basePackage: string;
        version: string;
        authEnabled: boolean;
        generateFrontend: boolean;
    };
    entities: {
        name: string;
        table: string;
        fields: {
            name: string;
            type: string;
            required: boolean;
        }[];
        relations: {
            name: string;
            targetEntity: string;
            type: string;
        }[];
    }[];
}

const mapType = (type: EntityFieldType): string => {
    switch (type) {
        case 'String':
        case 'UUID':
            return 'STRING';
        case 'Integer':
        case 'Long':
            return 'INTEGER';
        case 'Boolean':
            return 'BOOLEAN';
        case 'LocalDate':
        case 'OffsetDateTime':
            return 'DATE';
        case 'Double':
        case 'BigDecimal':
            return 'DECIMAL';
        default:
            return 'STRING';
    }
};

export const compileToSpec = (project: ProjectFormData, nodes: AppNode[], edges: Edge[]): string => {
    // We export to JSON. The Jackson ObjectMapper handles JSON just as well as YAML 
    // because YAML is a superset and the backend just uses `readValue(p.getSpecText(), Spec.class)`.

    const spec: BackendSpec = {
        specVersion: 1,
        project: {
            groupId: project.groupId || 'com.example',
            artifactId: project.artifactId || 'demo',
            name: project.name || 'Demo',
            basePackage: project.basePackage || 'com.example.demo',
            version: project.version || '0.0.1-SNAPSHOT',
            authEnabled: project.authEnabled || false,
            generateFrontend: project.generateFrontend || false
        },
        entities: nodes.map(node => {
            // Find relations stemming from this entity
            const relations = edges
                .filter(edge => edge.source === node.id)
                .map(edge => {
                    const targetNode = nodes.find(n => n.id === edge.target);
                    if (!targetNode) return null;

                    // Simple heuristic: If it's a target, we map it to ONE_TO_MANY for now
                    return {
                        name: targetNode.data.name.toLowerCase() + 's',
                        targetEntity: targetNode.data.name,
                        type: 'ONE_TO_MANY'
                    };
                }).filter(Boolean) as BackendSpec['entities'][0]['relations'];

            return {
                name: node.data.name,
                table: node.data.name.toLowerCase() + 's',
                fields: node.data.fields.map(f => ({
                    name: f.name,
                    type: mapType(f.type),
                    required: f.required
                })),
                relations,
                readRoles: node.data.readRoles,
                createRoles: node.data.createRoles,
                updateRoles: node.data.updateRoles,
                deleteRoles: node.data.deleteRoles
            };
        })
    };

    return JSON.stringify(spec, null, 2);
};
