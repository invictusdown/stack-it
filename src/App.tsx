import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Bitcoin, Trash2, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { db, Transaction } from './db';

function App() {
  const [bitcoinPrice, setBitcoinPrice] = useState<number | null>(null);
  const [usdAmount, setUsdAmount] = useState<string>('');
  const transactions = useLiveQuery(() => db.transactions.toArray());
  const [totalBitcoin, setTotalBitcoin] = useState<number>(0);
  const [totalValueUSD, setTotalValueUSD] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [showTransactions, setShowTransactions] = useState<boolean>(true);

  const fetchBitcoinPrice = async () => {
    try {
      setError(null);
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
      if (!response.ok) {
        throw new Error('Failed to fetch Bitcoin price');
      }
      const data = await response.json();
      setBitcoinPrice(data.bitcoin.usd);
    } catch (error) {
      console.error('Error fetching Bitcoin price:', error);
      setError('Failed to fetch Bitcoin price. Please try again.');
    }
  };

  useEffect(() => {
    fetchBitcoinPrice();
    const interval = setInterval(fetchBitcoinPrice, 60000); // Update price every minute

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (transactions && bitcoinPrice) {
      const total = transactions.reduce((acc, tx) => acc + tx.bitcoinAmount, 0);
      setTotalBitcoin(total);
      setTotalValueUSD(total * bitcoinPrice);
    }
  }, [transactions, bitcoinPrice]);

  const handleStack = async () => {
    if (bitcoinPrice && usdAmount) {
      const btcAmount = parseFloat(usdAmount) / bitcoinPrice;
      const transaction: Transaction = {
        usdAmount: parseFloat(usdAmount),
        bitcoinAmount: btcAmount,
        date: new Date()
      };
      await db.transactions.add(transaction);
      setUsdAmount('');
    }
  };

  const handleDelete = async (id: number) => {
    await db.transactions.delete(id);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-start p-8">
      <h1 className="text-4xl font-bold mb-8 flex items-center">
        <Bitcoin className="mr-2 text-primary" /> Bitcoin Stacking App
      </h1>
      
      {error ? (
        <div className="text-2xl mb-8 text-destructive flex items-center">
          {error}
          <button onClick={fetchBitcoinPrice} className="ml-4 text-primary hover:text-primary/80 transition-colors">
            <RefreshCw size={24} />
          </button>
        </div>
      ) : bitcoinPrice ? (
        <div className="text-2xl mb-8 text-primary">
          Current Bitcoin Price: ${bitcoinPrice.toLocaleString()}
        </div>
      ) : (
        <div className="text-2xl mb-8 text-muted-foreground">
          Fetching Bitcoin price...
        </div>
      )}
      
      <div className="mb-8 flex flex-col w-full max-w-md">
        <input
          type="number"
          value={usdAmount}
          onChange={(e) => setUsdAmount(e.target.value)}
          placeholder="Enter USD amount"
          className="p-2 bg-input text-foreground border border-border rounded-md mb-2 focus:outline-none focus:ring-2 focus:ring-ring w-full"
        />
        <button
          onClick={handleStack}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors w-full"
          disabled={!bitcoinPrice}
        >
          Stack Now
        </button>
      </div>
      
      <div className="w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-primary">Transaction History</h2>
          <button
            onClick={() => setShowTransactions(!showTransactions)}
            className="text-primary hover:text-primary/80 transition-colors"
          >
            {showTransactions ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
          </button>
        </div>
        {showTransactions && (
          <ul className="space-y-4">
            {transactions?.map((tx) => (
              <li key={tx.id} className="transaction-item flex justify-between items-center">
                <div>
                  <span className="font-semibold text-primary">${tx.usdAmount.toFixed(2)}</span>
                  <span className="mx-2 text-muted-foreground">→</span>
                  <span className="text-accent-foreground">{tx.bitcoinAmount.toFixed(8)} BTC</span>
                  <span className="ml-4 text-muted-foreground">{tx.date.toLocaleString()}</span>
                </div>
                <button onClick={() => tx.id && handleDelete(tx.id)} className="text-destructive hover:text-destructive/80 transition-colors">
                  <Trash2 size={20} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      <div className="mt-8 text-xl text-primary">
        <p>Total Bitcoin: <span className="font-semibold">{totalBitcoin.toFixed(8)} BTC</span></p>
        <p>Total Value: <span className="font-semibold">${totalValueUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
      </div>
    </div>
  );
}

export default App;
