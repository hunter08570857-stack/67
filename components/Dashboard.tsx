import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { Asset, PortfolioSummary } from '../types';
import { fetchQuote } from '../services/marketService';

interface Props {
  assets: Asset[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const Dashboard: React.FC<Props> = ({ assets }) => {
  // Calculate summary (Simple logic: assume current price ~ avg cost for demo speed, 
  // in real app we'd fetch current prices for all assets to calc NAV)
  
  const data = useMemo(() => {
    return assets.map(a => ({
      name: a.symbol,
      value: a.quantity * a.avgCost // Using cost as proxy for value if live price not available in batch
    }));
  }, [assets]);

  const totalValue = data.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {/* Summary Card */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-center">
        <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wide mb-2">總資產估值 (NAV)</h3>
        <div className="text-4xl font-bold text-slate-900">
          ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </div>
        <div className="mt-4 flex items-center gap-2">
          <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-semibold">+5.4%</span>
          <span className="text-slate-400 text-sm">本月績效 (模擬)</span>
        </div>
      </div>

      {/* Distribution Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center">
        <h3 className="text-slate-700 font-bold mb-4 w-full text-left">資產分佈</h3>
        <div className="w-full h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip formatter={(val: number) => `$${val.toLocaleString()}`} />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
