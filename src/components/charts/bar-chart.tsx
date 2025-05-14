import {
    Bar,
    BarChart as RechartsBarChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';

interface DataPoint {
  [key: string]: string | number;
}

interface BarChartProps {
  data: DataPoint[];
  xAxisKey: string;
  series: string[];
}

export function BarChart({ data, xAxisKey, series }: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsBarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xAxisKey} />
        <YAxis />
        <Tooltip />
        <Legend />
        {series.map((key, index) => (
          <Bar key={key} dataKey={key} fill={`hsl(${index * 40}, 70%, 50%)`} />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
