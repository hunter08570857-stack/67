import React, { useState } from 'react';
import { Search, CheckCircle, AlertCircle } from 'lucide-react';
import { fetchQuote } from '../services/marketService';
import { addTransaction } from '../services/portfolioService';

interface TradePanelProps {
  onTradeComplete: () => void;
}

const TradePanel: React.FC<TradePanelProps> = ({ onTradeComplete }) => {
  const [symbol, setSymbol] = useState('');
  const [quote, setQuote] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState<number>(1);
  const [type, setType] = useState<'BUY' | 'SELL'>('BUY');
  const [status, setStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE');

  const handleInquiry = async () => {
    if (!symbol) return;
    setLoading(true);
    setQuote(null);
    setStatus('IDLE');
    
    const data = await fetchQuote(symbol.toUpperCase());
    if (data) {
      setQuote(data.c);
    } else {
      setStatus('ERROR');
    }
    setLoading(false);
  };

  const handleTrade = async () => {
    if (!quote || !symbol || quantity <= 0) return;
    
    setLoading(true);
    try {
      await addTransaction({
        symbol: symbol.toUpperCase(),
        type,
        price: quote,
        quantity: Number(quantity),
        timestamp: Date.now()
      });
      setStatus('SUCCESS');
      onTradeComplete();
      // Reset after delay
      setTimeout(() => {
        setStatus('IDLE');
        setSymbol('');
        setQuote(null);
        setQuantity(1);
      }, 2000);
    } catch (e) {
      setStatus('ERROR');
    }
    setLoading(false);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
      <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">下單交易</h3>
      
      <div className="space-y-4">
        {/* Step 1: Inquiry */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="股票代號 (e.g. AAPL)"
            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 uppercase font-mono focus:ring-2 focus:ring-primary focus:outline-none"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
          />
          <button 
            onClick={handleInquiry}
            disabled={loading}
            className="bg-slate-100 text-slate-600 px-3 py-2 rounded-lg hover:bg-slate-200 transition"
          >
            <Search size={20} />
          </button>
        </div>

        {/* Price Display */}
        <div className="bg-slate-50 p-3 rounded-lg text-center h-20 flex flex-col justify-center">
          {loading && !quote ? (
            <span className="text-slate-400 text-sm">查詢中...</span>
          ) : quote ? (
            <>
              <span className="text-xs text-slate-500">現價</span>
              <span className="text-2xl font-bold text-slate-900">${quote.toFixed(2)}</span>
            </>
          ) : (
            <span className="text-slate-400 text-sm">請輸入代號並詢價</span>
          )}
        </div>

        {/* Step 2: Order Details */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setType('BUY')}
            className={`py-2 rounded-lg font-bold text-sm transition ${type === 'BUY' ? 'bg-red-500 text-white shadow-md' : 'bg-slate-100 text-slate-400'}`}
          >
            買進 BUY
          </button>
          <button
            onClick={() => setType('SELL')}
            className={`py-2 rounded-lg font-bold text-sm transition ${type === 'SELL' ? 'bg-green-500 text-white shadow-md' : 'bg-slate-100 text-slate-400'}`}
          >
            賣出 SELL
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">股數</span>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-right focus:ring-2 focus:ring-primary focus:outline-none"
          />
        </div>

        <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-sm">
          <span className="text-slate-500">預估金額</span>
          <span className="font-bold text-slate-800">
            ${(quote ? quote * quantity : 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Submit */}
        <button
          onClick={handleTrade}
          disabled={!quote || loading || status === 'SUCCESS'}
          className={`w-full py-3 rounded-lg font-bold text-white transition flex items-center justify-center gap-2
            ${status === 'SUCCESS' ? 'bg-green-500' : 'bg-primary hover:bg-slate-800'}
            ${(!quote || loading) && 'opacity-50 cursor-not-allowed'}
          `}
        >
          {status === 'SUCCESS' ? (
            <><CheckCircle size={20} /> 交易成功</>
          ) : (
            '確認下單'
          )}
        </button>
      </div>
    </div>
  );
};

export default TradePanel;
