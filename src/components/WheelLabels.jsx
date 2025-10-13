const WheelLabels = ({ slices, sliceAngle, startAngle, size, radius, fontSize }) => {
  if (!slices.length || !sliceAngle || !size) {
    return null;
  }

  const center = size / 2;
  const labelRadius = Math.max(radius, 0);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="pointer-events-none absolute inset-0"
      aria-hidden
    >
      {slices.map((slice, index) => {
        const bisectorCss = startAngle + sliceAngle * (index + 0.5);
        const bisectorSvg = bisectorCss - 90;

        return (
          <g
            key={slice.id ?? index}
            transform={`translate(${center} ${center}) rotate(${bisectorSvg})`}
          >
            <text
              x={labelRadius}
              y={0}
              textAnchor="middle"
              dominantBaseline="middle"
              alignmentBaseline="middle"
              style={{
                fontSize,
                fontWeight: 700,
                letterSpacing: "0.02em",
                paintOrder: "stroke",
                strokeWidth: 1.5,
                stroke: "rgba(15,23,42,0.55)",
              }}
              fill="white"
            >
              {slice.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

export default WheelLabels;
