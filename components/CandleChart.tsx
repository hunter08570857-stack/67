import React from 'react';
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { CandleData } from '../types';

interface CandleChartProps {
  data: CandleData[];
}

// Custom Shape for Candlestick (Wick + Body)
const CandleStickShape = (props: any) => {
  const { x, y, width, height, open, close, high, low } = props;
  
  const isUp = close > open;
  const color = isUp ? '#ef4444' : '#10b981'; // Red for Up (Taiwan style: Red=Up, Green=Down? Or US? Finnhub is US based usually, but let's stick to standard financial colors. US: Green Up, Red Down. Taiwan/Asia: Red Up, Green Down. Let's use US Standard for consistency with library defaults, or follow the colors defined in index.html. Let's stick to US: Green=Up (#10b981), Red=Down (#ef4444).
  // Wait, the previous code in Education section said: "Red K (Yang): Close > Open". This is Asian style.
  // I will match the Education section: Red = Up, Green = Down.
  
  const fill = isUp ? '#ef4444' : '#10b981'; 

  // Calculate coordinates
  // Recharts passes standardized x, y, width, height for the "bar" (body)
  // We need to map high/low manually if not provided, but usually we pass the payload.
  
  // Note: logic is tricky in Recharts custom shapes. 
  // Simplified approach: The "Bar" represents the body (Open to Close).
  // We draw the wick (High to Low) manually.
  
  // However, getting the Y pixel for High/Low requires the YAxis scale.
  // Recharts passes `yAxis` scale function in props if we are lucky, or we calculate based on pixels.
  // To avoid complex scaling math here, we simply assume the Bar handles the Body, 
  // but drawing the Wick is hard without the scale function.
  
  // ALTERNATIVE: Use ErrorBar for Wicks? 
  // BETTER: Draw everything based on pixel values provided by the library for the specific data points if available.
  
  // Robust Approach:
  // We rely on the fact that Recharts renders the Bar from Math.min(open, close) to Math.max(open, close).
  // But we need High and Low.
  // We will pass the full payload to the shape.

  const { payload, yAxis } = props;
  if (!payload || !yAxis) return null;

  // Scale values to pixels
  const yHigh = yAxis.scale(payload.high);
  const yLow = yAxis.scale(payload.low);
  const yOpen = yAxis.scale(payload.open);
  const yClose = yAxis.scale(payload.close);
  
  const bodyTop = Math.min(yOpen, yClose);
  const bodyHeight = Math.abs(yOpen - yClose);
  // Ensure minimal height for doji
  const effectiveBodyHeight = bodyHeight < 1 ? 1 : bodyHeight;

  return (
    <g>
      {/* Wick */}
      <line 
        x1={x + width / 2} 
        y1={yHigh} 
        x2={x + width / 2} 
        y2={yLow} 
        stroke={fill} 
        strokeWidth={1.5} 
      />
      {/* Body */}
      <rect 
        x={x} 
        y={bodyTop} 
        width={width} 
        height={effectiveBodyHeight} 
        fill={fill} 
      />
    </g>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-slate-200 shadow-lg rounded text-xs">
        <p className="font-bold text-slate-700 mb-1">{label}</p>
        <p className="text-slate-900">Price: {data.close}</p>
        <p className="text-slate-500">Open: {data.open}</p>
        <p className="text-slate-500">High: {data.high}</p>
        <p className="text-slate-500">Low: {data.low}</p>
        <p className="text-slate-500">Vol: {data.volume.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

const CandleChart: React.FC<CandleChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="h-full flex items-center justify-center text-slate-400">Loading Chart...</div>;
  }

  // Calculate domain for Y-axis to make chart look good (not start at 0)
  const minPrice = Math.min(...data.map(d => d.low));
  const maxPrice = Math.max(...data.map(d => d.high));
  const domain = [minPrice * 0.98, maxPrice * 1.02];

  return (
    <div style={{ width: '100%', height: 400 }}>
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis 
            dataKey="time" 
            tick={{ fontSize: 10, fill: '#64748b' }} 
            tickFormatter={(tick) => tick.slice(5)} // Show MM-DD
          />
          <YAxis 
            domain={domain} 
            tick={{ fontSize: 10, fill: '#64748b' }} 
            orientation="right"
            tickCount={6}
          />
          <Tooltip content={<CustomTooltip />} />
          
          {/* We use a Bar chart to render the custom shape */}
          <Bar 
            dataKey="close" 
            shape={<CandleStickShape />} 
            isAnimationActive={false}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.close > entry.open ? '#ef4444' : '#10b981'} />
            ))}
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CandleChart;
