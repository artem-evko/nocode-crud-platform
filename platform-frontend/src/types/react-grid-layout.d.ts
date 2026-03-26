declare module 'react-grid-layout' {
    import * as React from 'react';

    export interface LayoutItem {
        w: number;
        h: number;
        x: number;
        y: number;
        i: string;
        minW?: number;
        minH?: number;
        maxW?: number;
        maxH?: number;
        static?: boolean;
        isDraggable?: boolean;
        isResizable?: boolean;
    }

    export type Layout = LayoutItem;

    export interface ReactGridLayoutProps {
        className?: string;
        style?: React.CSSProperties;
        width?: number;
        autoSize?: boolean;
        cols?: number;
        draggableCancel?: string;
        draggableHandle?: string;
        verticalCompact?: boolean;
        compactType?: 'vertical' | 'horizontal' | null;
        layout?: Layout[];
        margin?: [number, number];
        containerPadding?: [number, number] | null;
        rowHeight?: number;
        maxRows?: number;
        isDraggable?: boolean;
        isResizable?: boolean;
        isDroppable?: boolean;
        preventCollision?: boolean;
        useCSSTransforms?: boolean;
        onLayoutChange?: (layout: Layout[]) => void;
        onDrop?: (layout: Layout[], item: LayoutItem, e: Event) => void;
        children?: React.ReactNode;
        [key: string]: any;
    }

    export interface ResponsiveProps extends Omit<ReactGridLayoutProps, 'layout' | 'cols'> {
        breakpoints?: { [key: string]: number };
        cols?: { [key: string]: number };
        layouts?: { [key: string]: Layout[] };
        onBreakpointChange?: (breakpoint: string, cols: number) => void;
        onLayoutChange?: (layout: Layout[], allLayouts: { [key: string]: Layout[] }) => void;
    }

    export class ReactGridLayout extends React.Component<ReactGridLayoutProps> {}
    export class Responsive extends React.Component<ResponsiveProps> {}

    export function WidthProvider<T>(ComposedComponent: React.ComponentType<T>): React.ComponentType<Omit<T, 'width'>>;

    export default ReactGridLayout;
}
