import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import DemoFrame from './DemoFrame';

/**
 * LossCurve
 *
 * Hoverable, togglable loss curve. Accepts arbitrary series.
 * Default demo data is a fake training run — replace with your own.
 */

interface Series {
  key: string;
  label: string;
  color: string;
}

interface Props {
  data?: Array<Record<string, number>>;
  series?: Series[];
  xKey?: string;
}

// Demo data: a fake training run, train + val + a "with regularization" variant
const defaultData = Array.from({ length: 50 }, (_, i) => {
  const step = i * 100;
  const noise = () => (Math.random() - 0.5) * 0.05;
  const train = 2.3 * Math.exp(-i / 12) + 0.2 + noise();
  const val = 2.3 * Math.exp(-i / 14) + 0.35 + noise() + (i > 30 ? (i - 30) * 0.01 : 0);
  const regularized = 2.3 * Math.exp(-i / 15) + 0.28 + noise();
  return { step, train, val, regularized };
});

const defaultSeries: Series[] = [
  { key: 'train', label: 'train', color: 'var(--color-accent)' },
  { key: 'val', label: 'val', color: 'var(--color-accent-2)' },
  { key: 'regularized', label: 'train (L2)', color: 'var(--color-accent-3)' },
];

export default function LossCurve({
  data = defaultData,
  series = defaultSeries,
  xKey = 'step',
}: Props) {
  const [visible, setVisible] = useState<Record<string, boolean>>(
    Object.fromEntries(series.map((s) => [s.key, true]))
  );

  return (
    <DemoFrame
      title="Loss curve"
      caption="Click any series in the legend to toggle. Hover for exact values."
    >
      <div className="rounded-lg bg-white p-4" style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="2 4" stroke="var(--color-line)" />
            <XAxis
              dataKey={xKey}
              stroke="var(--color-muted)"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: 'var(--color-line)' }}
              label={{ value: 'step', position: 'insideBottom', offset: -4, fontSize: 11, fill: 'var(--color-muted)' }}
            />
            <YAxis
              stroke="var(--color-muted)"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: 'var(--color-line)' }}
              label={{ value: 'loss', angle: -90, position: 'insideLeft', fontSize: 11, fill: 'var(--color-muted)' }}
            />
            <Tooltip
              contentStyle={{
                background: 'white',
                border: '1px solid var(--color-line)',
                borderRadius: '8px',
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
              }}
              labelStyle={{ color: 'var(--color-muted)' }}
            />
            <Legend
              onClick={(e) => {
                const key = e.dataKey as string;
                setVisible((v) => ({ ...v, [key]: !v[key] }));
              }}
              wrapperStyle={{ fontSize: '12px', cursor: 'pointer' }}
            />
            {series.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={s.color}
                strokeWidth={2}
                dot={false}
                hide={!visible[s.key]}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </DemoFrame>
  );
}
