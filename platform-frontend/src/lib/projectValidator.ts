export type ValidationSeverity = 'error' | 'warning';
export type ValidationElementType = 'component' | 'entity' | 'flow' | 'general';

export interface ValidationMessage {
    id?: string;
    type: ValidationElementType;
    message: string;
    severity: ValidationSeverity;
}

export function validateProject(specText: string | null | undefined): { errors: ValidationMessage[], warnings: ValidationMessage[] } {
    const errors: ValidationMessage[] = [];
    const warnings: ValidationMessage[] = [];

    if (!specText || specText === '{}') {
        warnings.push({
            type: 'general',
            message: 'Проект пуст. Вам необходимо создать Модель данных и UI перед развертыванием.',
            severity: 'warning'
        });
        return { errors, warnings };
    }

    try {
        const parsed = JSON.parse(specText);
        
        // 1. Validate Entities
        let nodes = [];
        if (parsed._flow && parsed._flow.nodes) nodes = parsed._flow.nodes;
        else if (parsed.flow && parsed.flow.nodes) nodes = parsed.flow.nodes;
        else if (parsed.nodes) nodes = parsed.nodes;

        const entities = nodes.filter((n: any) => n.type === 'entity');
        const entityNames = new Set<string>();

        entities.forEach((entity: any) => {
            const name = entity.data?.name;
            if (!name) return; // Unnamed entity

            // Validate Entity Name against SQL Injection / special chars
            if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(name)) {
                errors.push({
                    id: entity.id,
                    type: 'entity',
                    message: `Имя сущности "${name}" некорректно. Используйте только латинские буквы, цифры и подчеркивания (без пробелов), начиная с буквы.`,
                    severity: 'error'
                });
            }

            if (entityNames.has(name)) {
                errors.push({
                    id: entity.id,
                    type: 'entity',
                    message: `Обнаружены сущности с одинаковым именем: ${name}. Имена должны быть уникальными.`,
                    severity: 'error'
                });
            }
            entityNames.add(name);

            if (!entity.data.fields || entity.data.fields.length === 0) {
                errors.push({
                    id: entity.id,
                    type: 'entity',
                    message: `В сущности "${name}" не добавлено ни одного поля. База данных не сможет создать пустую таблицу.`,
                    severity: 'error'
                });
            } else {
                entity.data.fields.forEach((field: any) => {
                    const fieldName = field.name;
                    if (fieldName && !/^[a-zA-Z][a-zA-Z0-9_]*$/.test(fieldName)) {
                        errors.push({
                            id: entity.id,
                            type: 'entity',
                            message: `Имя поля "${fieldName}" в сущности "${name}" некорректно. Используйте только латинские буквы без пробелов.`,
                            severity: 'error'
                        });
                    }
                });
            }
        });

        // 2. Validate Action Flows
        if (parsed.actionFlows) {
            parsed.actionFlows.forEach((flow: any) => {
                if (!flow.nodes || flow.nodes.length <= 1) { // 1 is usually just the Start node
                    warnings.push({
                        id: flow.id,
                        type: 'flow',
                        message: `Логика (Action Flow) "${flow.name}" пуста. В ней нет действий.`,
                        severity: 'warning'
                    });
                }
            });
        }

        // 3. Validate UI Components
        if (parsed.uiSpec && parsed.uiSpec.components) {
            const components = parsed.uiSpec.components;
            components.forEach((c: any) => {
                // Must have entityName
                if (['DataTable', 'FormModule', 'BarChart', 'LineChart'].includes(c.type)) {
                    if (!c.props.entityName || c.props.entityName === 'none') {
                        errors.push({
                            id: c.id,
                            type: 'component',
                            message: `Компонент [${c.type}] на холсте не привязан к Сущности (источнику данных).`,
                            severity: 'error'
                        });
                    } else if (!entityNames.has(c.props.entityName)) {
                        errors.push({
                            id: c.id,
                            type: 'component',
                            message: `Компонент [${c.type}] привязан к несуществующей сущности "${c.props.entityName}". Выберите актуальный источник в Свойствах.`,
                            severity: 'error'
                        });
                    }
                }

                // Buttons action checks
                if (c.type === 'Button') {
                    if (!c.props.actionFlowId || c.props.actionFlowId === 'none') {
                        warnings.push({
                            id: c.id,
                            type: 'component',
                            message: `Кнопка "${c.props.text || 'Button'}" не выполняет никаких действий (не выбран Action Flow).`,
                            severity: 'warning'
                        });
                    }
                }
            });
        }

    } catch (e) {
        errors.push({
            type: 'general',
            message: 'Ошибка чтения конфигурации проекта. Попробуйте пересохранить UI.',
            severity: 'error'
        });
    }

    return { errors, warnings };
}
