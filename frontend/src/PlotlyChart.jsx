import { useEffect, useRef } from "react";

export default function PlotlyChart({ data, layout, style = { width: "100%", height: "360px" } }) {
  const chartRef = useRef(null);

  useEffect(() => {
    if (!chartRef.current || !window.Plotly) return;
    const defaultLayout = {
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(15,23,42,0.4)",
      font: { color: "#cbd5e1", family: "Inter, sans-serif", size: 12 },
      margin: { t: 40, r: 25, b: 45, l: 55 },
      ...layout,
    };
    window.Plotly.newPlot(chartRef.current, data, defaultLayout, {
      responsive: true,
      displayModeBar: false,
    });
  }, [data, layout]);

  return <div ref={chartRef} style={style} />;
}