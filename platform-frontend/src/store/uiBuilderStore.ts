import { create } from 'zustand';

export type ComponentType = 'Heading' | 'Text' | 'Button' | 'DataTable' | 'FormModule' | 'Container' | 'BarChart' | 'LineChart';

export interface UIComponent {
    id: string;
    type: ComponentType;
    props: Record<string, any>;
    layout?: { x: number, y: number, w: number, h: number };
    children?: UIComponent[]; // For nested containers later
}

export interface UIBuilderState {
    components: UIComponent[];
    selectedComponentId: string | null;

    setComponents: (components: UIComponent[]) => void;
    addComponent: (component: UIComponent, index?: number) => void;
    removeComponent: (id: string) => void;
    updateComponentProps: (id: string, props: Record<string, any>) => void;
    updateComponentLayout: (id: string, layout: { x: number, y: number, w: number, h: number }) => void;
    selectComponent: (id: string | null) => void;
    moveComponent: (oldIndex: number, newIndex: number) => void;
}

export const useUIBuilderStore = create<UIBuilderState>((set) => ({
    components: [],
    selectedComponentId: null,

    setComponents: (components) => set({ components }),

    addComponent: (component, index) => set((state) => {
        const newComponents = [...state.components];
        if (index !== undefined && index >= 0) {
            newComponents.splice(index, 0, component);
        } else {
            newComponents.push(component);
        }
        return { components: newComponents };
    }),

    removeComponent: (id) => set((state) => ({
        components: state.components.filter(c => c.id !== id),
        selectedComponentId: state.selectedComponentId === id ? null : state.selectedComponentId
    })),

    updateComponentProps: (id, props) => set((state) => ({
        components: state.components.map(c =>
            c.id === id ? { ...c, props: { ...c.props, ...props } } : c
        )
    })),

    updateComponentLayout: (id, layout) => set((state) => ({
        components: state.components.map(c =>
            c.id === id ? { ...c, layout } : c
        )
    })),

    selectComponent: (id) => set({ selectedComponentId: id }),

    moveComponent: (oldIndex, newIndex) => set((state) => {
        const newComponents = [...state.components];
        const [movedItem] = newComponents.splice(oldIndex, 1);
        newComponents.splice(newIndex, 0, movedItem);
        return { components: newComponents };
    })
}));
