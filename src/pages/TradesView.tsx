import React, { useEffect, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore';
import { ArrowLeftRight, Check, X } from 'lucide-react';

interface Trade {
  id: string;
  creatorId: string;
  creatorStickersOffered: string[];
  creatorStickersRequested: string[];
  status: 'open' | 'completed' | 'cancelled';
  responderId?: string;
}

export default function TradesView() {
  const { user } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [offered, setOffered] = useState('');
  const [requested, setRequested] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!user) return;

    try {
      // For simplicity, we fetch all open trades and user's own trades (even if completed)
      // Since rules allow reading all trades, we will read all open trades, plus my trades.
      // Firestore v9 doesn't easily let us say (status == open OR creatorId == me) with complex indexes if we aren't careful, 
      // but we can just query all trades, or just query status == 'open'. 
      // Let's just fetch all trades and filter in JS (rules allow read all).
      // Note: In a real large app we'd restrict read via rules, but here read is allowed for authenticated.
      const q = query(collection(db, 'trades'));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const tradesData: Trade[] = [];
        snapshot.forEach((doc) => {
          tradesData.push({ id: doc.id, ...doc.data() } as Trade);
        });
        
        // Sort: open first
        tradesData.sort((a, b) => {
           if (a.status === 'open' && b.status !== 'open') return -1;
           if (a.status !== 'open' && b.status === 'open') return 1;
           return 0;
        });
        setTrades(tradesData);
        setLoading(false);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'trades');
      });

      return unsubscribe;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'trades');
    }
  }, [user]);

  const handleCreateTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const offeredList = offered.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
    const requestedList = requested.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);

    if (offeredList.length === 0 || requestedList.length === 0) return;

    setIsCreating(true);
    try {
      await addDoc(collection(db, 'trades'), {
        creatorId: user.uid,
        creatorStickersOffered: offeredList,
        creatorStickersRequested: requestedList,
        status: 'open',
      });
      setOffered('');
      setRequested('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'trades');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancelTrade = async (tradeId: string) => {
    try {
      await updateDoc(doc(db, 'trades', tradeId), { status: 'cancelled' });
    } catch (error) {
       handleFirestoreError(error, OperationType.UPDATE, `trades/${tradeId}`);
    }
  };

  const handleAcceptTrade = async (tradeId: string) => {
    if (!user) return;
    try {
       await updateDoc(doc(db, 'trades', tradeId), { 
         status: 'completed',
         responderId: user.uid
       });
    } catch (error) {
       handleFirestoreError(error, OperationType.UPDATE, `trades/${tradeId}`);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando mercado de trocas...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Mercado de Trocas</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
           <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
             <h3 className="font-semibold text-lg mb-4 text-gray-900">Nova Proposta</h3>
             <form onSubmit={handleCreateTrade} className="space-y-4">
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Ofereço as figurinhas</label>
                   <input
                     type="text"
                     placeholder="BRA-1, ARG-5, FWC-3"
                     value={offered}
                     onChange={(e) => setOffered(e.target.value)}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-green-500 focus:border-green-500"
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Quero em troca</label>
                   <input
                     type="text"
                     placeholder="USA-10, STA-1"
                     value={requested}
                     onChange={(e) => setRequested(e.target.value)}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-green-500 focus:border-green-500"
                   />
                </div>
                <button
                  type="submit"
                  disabled={isCreating || !offered.trim() || !requested.trim()}
                  className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                >
                  Publicar Troca
                </button>
             </form>
           </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
           {trades.filter(t => t.status === 'open' || t.creatorId === user?.uid).map(trade => {
              const isMine = trade.creatorId === user?.uid;
              const isOpen = trade.status === 'open';

              return (
                <div key={trade.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-center justify-between">
                   <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                         <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                           {isMine ? 'Minha Proposta' : 'Oferta do Mercado'}
                         </span>
                         <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            trade.status === 'open' ? 'bg-green-100 text-green-800' :
                            trade.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                            'bg-red-100 text-red-800'
                         }`}>
                            {trade.status === 'open' ? 'Aberta' : trade.status === 'completed' ? 'Concluída' : 'Cancelada'}
                         </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 mt-4">
                         <div className="flex-1 bg-gray-50 border border-gray-100 rounded-lg p-3 text-sm">
                            <span className="block text-gray-500 text-xs mb-1">Oferece:</span>
                            <div className="font-semibold text-gray-800">{trade.creatorStickersOffered.join(', ')}</div>
                         </div>
                         <ArrowLeftRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                         <div className="flex-1 bg-gray-50 border border-gray-100 rounded-lg p-3 text-sm">
                            <span className="block text-gray-500 text-xs mb-1">Pede:</span>
                            <div className="font-semibold text-gray-800">{trade.creatorStickersRequested.join(', ')}</div>
                         </div>
                      </div>
                   </div>

                   <div className="ml-6 flex flex-col space-y-2">
                      {isMine && isOpen && (
                         <button 
                           onClick={() => handleCancelTrade(trade.id)}
                           className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-md text-sm font-medium transition-colors"
                         >
                           <X className="w-4 h-4 inline mr-1" /> Cancelar
                         </button>
                      )}
                      {!isMine && isOpen && (
                         <button 
                           onClick={() => handleAcceptTrade(trade.id)}
                           className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-md text-sm font-medium transition-colors"
                         >
                           <Check className="w-4 h-4 inline mr-1" /> Aceitar Troca
                         </button>
                      )}
                   </div>
                </div>
              );
           })}
           {trades.filter(t => t.status === 'open' || t.creatorId === user?.uid).length === 0 && (
             <div className="text-center text-gray-500 py-10 bg-white rounded-xl border border-dashed border-gray-300">
                Nenhuma proposta de troca no momento.
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
