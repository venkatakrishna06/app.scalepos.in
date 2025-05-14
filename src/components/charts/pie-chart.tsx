import {Cell, Legend, Pie, PieChart as RechartsPieChart, ResponsiveContainer, Sector, Tooltip} from 'recharts';
import {useState} from 'react';

interface PieChartData {
  name: string;
  value: number;
}

interface PieChartProps {
  data: PieChartData[];
}

// Define types for the props passed to custom components
interface ActiveShapeProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
  fill: string;
  percent: number;
  value: number;
  name: string;
}

interface CustomLabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
  value: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FF6B6B', '#6B66FF'];

// Custom active shape component for enhanced visualization
const renderActiveShape = (props: ActiveShapeProps) => {
  const { 
    cx, cy, innerRadius, outerRadius, startAngle, endAngle,
    fill
  } = props;

  return (
    <g>
      {/* The active sector with slightly larger radius */}
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 5}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />

    </g>
  );
};

// Custom label component for non-active slices
const renderCustomizedLabel = (props: CustomLabelProps) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent, value } = props;

  // Only show label for slices with significant percentage
  if (percent < 0.05) return null;

  // Dynamically adjust radius based on slice size
  // Smaller slices get labels positioned closer to the outer edge
  const radiusRatio = 0.5 + (percent < 0.1 ? 0.2 : 0);
  const radius = innerRadius + (outerRadius - innerRadius) * radiusRatio;

  // Calculate position
  const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
  const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

  // Dynamically adjust font size based on slice size
  const fontSize = percent < 0.1 ? '9px' : '10px';

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor="middle" 
      dominantBaseline="central"
      style={{ 
        fontWeight: 'bold', 
        fontSize, 
        textShadow: '0px 0px 2px rgba(0,0,0,0.5)',
        pointerEvents: 'none' // Prevent labels from interfering with mouse events
      }}
    >
      {`${value} (${(percent * 100).toFixed(0)}%)`}
    </text>
  );
};

export function PieChart({ data }: PieChartProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const onPieEnter = (_: unknown, index: number) => {
    setActiveIndex(index);
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          nameKey="name"
          label={renderCustomizedLabel}
          activeIndex={activeIndex}
          activeShape={renderActiveShape}
          onMouseEnter={onPieEnter}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value) => [`${value}`, 'Value']}
          contentStyle={{ 
            borderRadius: '8px', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            border: 'none'
          }}
        />
        <Legend 
          layout="horizontal" 
          verticalAlign="bottom" 
          align="center"
          wrapperStyle={{ paddingTop: '10px' }}
        />
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}
