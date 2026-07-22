import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number | string; strokeWidth?: number | string };
type Shape = { type?: "path" | "circle" | "line" | "polyline" | "rect"; d?: string; cx?: number; cy?: number; r?: number; x1?: number; y1?: number; x2?: number; y2?: number; points?: string; x?: number; y?: number; width?: number; height?: number; rx?: number };

function icon(shapes: Shape[]) {
  return function Icon({ size = 24, strokeWidth = 2, ...props }: IconProps) {
    return (
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        {...props}
      >
        {shapes.map((shape, index) => {
          if (shape.type === "circle") return <circle key={index} cx={shape.cx} cy={shape.cy} r={shape.r} />;
          if (shape.type === "line") return <line key={index} x1={shape.x1} y1={shape.y1} x2={shape.x2} y2={shape.y2} />;
          if (shape.type === "polyline") return <polyline key={index} points={shape.points} />;
          if (shape.type === "rect") return <rect key={index} x={shape.x} y={shape.y} width={shape.width} height={shape.height} rx={shape.rx} />;
          return <path key={index} d={shape.d} />;
        })}
      </svg>
    );
  };
}

export const AlertCircle = icon([
  { type: "circle", cx: 12, cy: 12, r: 9 },
  { type: "line", x1: 12, y1: 7, x2: 12, y2: 13 },
  { type: "line", x1: 12, y1: 17, x2: 12.01, y2: 17 },
]);
export const BriefcaseBusiness = icon([
  { type: "rect", x: 3, y: 7, width: 18, height: 13, rx: 2 },
  { d: "M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" },
  { d: "M3 12h18" },
]);
export const Check = icon([{ type: "polyline", points: "20 6 9 17 4 12" }]);
export const CheckCircle2 = icon([
  { type: "circle", cx: 12, cy: 12, r: 9 },
  { type: "polyline", points: "8 12 11 15 17 9" },
]);
export const ChevronLeft = icon([{ type: "polyline", points: "15 18 9 12 15 6" }]);
export const ChevronRight = icon([{ type: "polyline", points: "9 18 15 12 9 6" }]);
export const CircleGauge = icon([
  { d: "M4.5 18a9 9 0 1 1 15 0" },
  { type: "line", x1: 12, y1: 12, x2: 16, y2: 8 },
  { type: "line", x1: 6, y1: 18, x2: 18, y2: 18 },
]);
export const Download = icon([
  { type: "line", x1: 12, y1: 3, x2: 12, y2: 15 },
  { type: "polyline", points: "7 10 12 15 17 10" },
  { d: "M5 21h14" },
]);
export const Footprints = icon([
  { d: "M8.5 3c2 0 3 2.2 2.6 4.5-.4 2.2-1.8 4.1-3.6 3.8-1.8-.3-2.5-2.7-2-4.8C6 4.4 7 3 8.5 3Z" },
  { d: "M15.5 12.5c2 0 3 2.2 2.6 4.5-.4 2.2-1.8 4.1-3.6 3.8-1.8-.3-2.5-2.7-2-4.8.5-2.1 1.5-3.5 3-3.5Z" },
]);
export const Gem = icon([
  { type: "polyline", points: "6 3 18 3 22 9 12 21 2 9 6 3" },
  { type: "polyline", points: "2 9 22 9" },
  { type: "polyline", points: "8 3 6 9 12 21 18 9 16 3" },
]);
export const Layers3 = icon([
  { type: "polyline", points: "12 2 22 7 12 12 2 7 12 2" },
  { type: "polyline", points: "2 12 12 17 22 12" },
  { type: "polyline", points: "2 17 12 22 22 17" },
]);
export const LockKeyhole = icon([
  { type: "rect", x: 4, y: 10, width: 16, height: 11, rx: 2 },
  { d: "M8 10V7a4 4 0 0 1 8 0v3" },
  { type: "circle", cx: 12, cy: 15, r: 1 },
]);
export const Pencil = icon([
  { d: "M4 20h4L19 9a2.1 2.1 0 0 0-4-4L4 16v4Z" },
  { type: "line", x1: 13.5, y1: 6.5, x2: 17.5, y2: 10.5 },
]);
export const Plus = icon([
  { type: "line", x1: 12, y1: 5, x2: 12, y2: 19 },
  { type: "line", x1: 5, y1: 12, x2: 19, y2: 12 },
]);
export const RotateCcw = icon([
  { d: "M3 12a9 9 0 1 0 3-6.7" },
  { type: "polyline", points: "3 3 3 9 9 9" },
]);
export const Ruler = icon([
  { d: "M4 16 16 4l4 4L8 20l-4-4Z" },
  { type: "line", x1: 13, y1: 7, x2: 16, y2: 10 },
  { type: "line", x1: 10, y1: 10, x2: 12, y2: 12 },
  { type: "line", x1: 7, y1: 13, x2: 10, y2: 16 },
]);
export const Save = icon([
  { type: "rect", x: 4, y: 3, width: 16, height: 18, rx: 2 },
  { type: "rect", x: 8, y: 3, width: 8, height: 6, rx: 1 },
  { type: "circle", cx: 12, cy: 15, r: 3 },
]);
export const Search = icon([
  { type: "circle", cx: 10.5, cy: 10.5, r: 6.5 },
  { type: "line", x1: 15.5, y1: 15.5, x2: 21, y2: 21 },
]);
export const Shirt = icon([
  { d: "M8 4 4 6 2 11l4 2v8h12v-8l4-2-2-5-4-2a4 4 0 0 1-8 0Z" },
]);
export const ShoppingBag = icon([
  { d: "M5 8h14l1 13H4L5 8Z" },
  { d: "M9 8a3 3 0 0 1 6 0" },
]);
export const Sparkles = icon([
  { d: "m12 3 1.4 3.6L17 8l-3.6 1.4L12 13l-1.4-3.6L7 8l3.6-1.4L12 3Z" },
  { d: "m19 14 .8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14Z" },
  { d: "m5 14 .8 1.7 1.7.8-1.7.8L5 19l-.8-1.7-1.7-.8 1.7-.8L5 14Z" },
]);
export const Trash2 = icon([
  { d: "M4 7h16" },
  { d: "M9 7V4h6v3" },
  { d: "m6 7 1 14h10l1-14" },
  { type: "line", x1: 10, y1: 11, x2: 10, y2: 17 },
  { type: "line", x1: 14, y1: 11, x2: 14, y2: 17 },
]);
export const UserRound = icon([
  { type: "circle", cx: 12, cy: 8, r: 4 },
  { d: "M4 21a8 8 0 0 1 16 0" },
]);
export const WandSparkles = icon([
  { type: "line", x1: 4, y1: 20, x2: 15, y2: 9 },
  { type: "line", x1: 13, y1: 7, x2: 17, y2: 11 },
  { d: "m19 3 .7 1.8 1.8.7-1.8.7L19 8l-.7-1.8-1.8-.7 1.8-.7L19 3Z" },
  { d: "m7 3 .7 1.8 1.8.7-1.8.7L7 8l-.7-1.8-1.8-.7 1.8-.7L7 3Z" },
]);
export const X = icon([
  { type: "line", x1: 6, y1: 6, x2: 18, y2: 18 },
  { type: "line", x1: 18, y1: 6, x2: 6, y2: 18 },
]);
