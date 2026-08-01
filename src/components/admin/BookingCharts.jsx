"use client"
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
} from 'recharts';

const COLORS = ['#1B5E20', '#4CAF50', '#81C784', '#C8E6C9', '#FF8F00', '#C62828'];

function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
}

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant/30 px-4 py-3">
      <p className="text-xs text-on-surface-variant">{payload[0].name}</p>
      <p className="text-sm font-bold text-primary">{payload[0].value} bookings</p>
    </div>
  );
}

function LineTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant/30 px-4 py-3">
      <p className="text-xs text-on-surface-variant mb-1">{label}</p>
      <p className="text-sm font-bold text-primary">{payload[0].value} bookings</p>
    </div>
  );
}

function renderPieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  if (percent < 0.05) return null;
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

export default function BookingCharts({ statusData = [], dailyData = [] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Pie Chart */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-6">
        <h3 className="font-display font-bold text-on-surface mb-4">Bookings by Status</h3>
        {statusData.length ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  labelLine={false}
                  label={renderPieLabel}
                >
                  {statusData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => <span className="text-xs text-on-surface-variant">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center h-72 text-on-surface-variant text-sm">
            No status data available
          </div>
        )}
      </div>

      {/* Line Chart */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-6">
        <h3 className="font-display font-bold text-on-surface mb-4">Daily Bookings</h3>
        {dailyData.length ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#5F6368' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#5F6368' }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<LineTooltip />} />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#1B5E20"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#1B5E20', strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#4CAF50' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center h-72 text-on-surface-variant text-sm">
            No daily data available
          </div>
        )}
      </div>
    </div>
  );
}
