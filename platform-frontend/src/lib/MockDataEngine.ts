import type { EntityNodeData } from '../components/EntityNode';

export const generateMockData = (entity: EntityNodeData, count: number = 5): any[] => {
    const data = [];
    for (let i = 0; i < count; i++) {
        const row: any = { id: i + 1 };
        if (entity.fields) {
            entity.fields.forEach(field => {
                row[field.name] = generateFakeValue(field.type, i);
            });
        }
        data.push(row);
    }
    return data;
};

const generateFakeValue = (type: string, index: number): any => {
    switch (type) {
        case 'String': return `Sample Text ${index + 1}`;
        case 'Integer': 
        case 'Long': return Math.floor(Math.random() * 1000);
        case 'Double':
        case 'BigDecimal': return (Math.random() * 100).toFixed(2);
        case 'Boolean': return Math.random() > 0.5;
        case 'LocalDate': return new Date().toISOString().split('T')[0];
        case 'OffsetDateTime': return new Date().toISOString();
        case 'UUID': return crypto.randomUUID();
        default: return `Value ${index}`;
    }
};
