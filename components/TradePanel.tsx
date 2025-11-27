import React, { useState } from 'react';
import { Transaction } from '../types';
import { fetchQuote } from '../services/marketService';
import { addTransaction } from '../services/portfolioService';
import { Search, RefreshCw, ArrowRight } from 'lucide-react';

interface Props {
  onTradeComplete: () => void;
}

const TradePanel: React.FC<Props> = ({ onTradeComplete }) => {
  const [symbol, setSymbol] = useState('AAPL');
  const [price, setPrice] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [type, setType] = useState<'BUY' | 'SELL'>('BUY');
  const [loading, setLoading] = useState(false);

  const handleQuote = async () => {
    setLoading(true);
    const data = await fetchQuote(symbol);
    if (data) {
      setPrice(data.c);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!price) return;
    setLoading(true);
    const tx: Omit<Transaction, 'id'> = {
      symbol: symbol.toUpperCase(),
      type,
      price,
      quantity,
      timestamp: Date.now()
    };
    await addTransaction(tx);
    onTradeComplete();
    setLoading(false);
    alert('交易成功！已寫入紀錄。');
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
      <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
        <span className="w-2 h-6 bg-accent rounded-full"></span>
        模擬交易下單
      </h2>

      <div className="space-y-4">
        {/* Symbol Input */}
        <div>
          <label className="block text-sm font-medium text-slate-500 mb-1">股票代號</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              className="flex-1 border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-accent outline-none"
            />
            <button 
              onClick={handleQuote}
              disabled={loading}
              className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 transition flex items-center gap-1"
            >
              {loading ? <RefreshCw className="animate-spin w-4 h-4" /> : <Search className="w-4 h-4" />}
              詢價
            </button>
          </div>
        </div>

        {/* Price Display */}
        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg">
          <span className="text-slate-500">參考現價</span>
          <span className="text-xl font-bold font-mono">
            {price ? `$${price.toFixed(2)}` : '--'}
          </span>
        </div>

        {/* Order Details */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">交易方向</label>
            <div className="flex rounded-lg overflow-hidden border border-slate-200">
              <button 
                onClick={() => setType('BUY')}
                className={`flex-1 py-2 text-sm font-bold ${type === 'BUY' ? 'bg-danger text-white' : 'bg-white text-slate-500'}`}
              >
                買進
              </button>
              <button 
                onClick={() => setType('SELL')}
                className={`flex-1 py-2 text-sm font-bold ${type === 'SELL' ? 'bg-success text-white' : 'bg-white text-slate-500'}`}
              >
                賣出
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">股數</label>
            <input 
              type="number" 
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
              className="w-full border border-slate-300 rounded-lg px-4 py-2 outline-none"
            />
          </div>
        </div>

        {/* Total & Submit */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex justify-between mb-4 text-sm">
            <span>預估總額</span>
            <span className="font-bold text-slate-900">
              ${price ? (price * quantity).toFixed(2) : '0.00'}
            </span>
          </div>
          <button 
            onClick={handleSubmit}
            disabled={!price || loading}
            className="w-full bg-primary text-white py-3 rounded-lg font-bold hover:bg-slate-800 transition disabled:opacity-50 flex justify-center items-center gap-2"
          >
            確認下單 <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TradePanel;
