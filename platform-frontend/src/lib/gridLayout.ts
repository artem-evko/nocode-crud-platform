// Wrapper to overcome TypeScript verbatimModuleSyntax limitation with react-grid-layout v3
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import ReactGridLayoutPkg from 'react-grid-layout';

export const GridLayout = ReactGridLayoutPkg.default || ReactGridLayoutPkg;
export const Responsive = ReactGridLayoutPkg.Responsive || (ReactGridLayoutPkg.default && ReactGridLayoutPkg.default.Responsive)!;
export const WidthProvider = ReactGridLayoutPkg.WidthProvider || (ReactGridLayoutPkg.default && ReactGridLayoutPkg.default.WidthProvider)!;
export type Layout = import('react-grid-layout').LayoutItem;
