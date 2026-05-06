import React, { useState, useEffect } from 'react';
import { HelpCircle, X, Search, Filter, Plus, Share2 } from 'lucide-react';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TutorialModal({ isOpen, onClose }: TutorialModalProps) {
  const [step, setStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: "Bem-vindo ao seu Álbum!",
      description: "Aqui você pode gerenciar todas as suas figurinhas de forma fácil. Vamos conhecer as principais funções?",
      icon: <HelpCircle className="w-12 h-12 text-green-600" />
    },
    {
      title: "Adicionar ou Remover",
      description: "Toque em uma figurinha para adicioná-la. Toque novamente se tiver repetidas. Para remover, use o botão de menos (-) que aparece ao passar o mouse ou tocar.",
      icon: <Plus className="w-12 h-12 text-blue-600" />
    },
    {
      title: "Buscar e Filtrar",
      description: "Use a barra de busca para encontrar seleções ou números específicos (ex: BRA, 10). Use os filtros para ver apenas as que faltam ou as repetidas.",
      icon: <div className="flex gap-2"><Search className="w-10 h-10 text-yellow-600" /><Filter className="w-10 h-10 text-yellow-600" /></div>
    },
    {
      title: "Compartilhe com Amigos",
      description: "Convide amigos para gerenciar o álbum junto com você clicando em 'Compartilhar', ou gere um PDF com suas figurinhas repetidas para facilitar a troca!",
      icon: <Share2 className="w-12 h-12 text-purple-600" />
    }
  ];

  const currentStep = steps[step];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="p-6">
          <div className="flex justify-end">
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="flex flex-col items-center text-center mt-2">
            <div className="bg-gray-50 p-6 rounded-full mb-6">
              {currentStep.icon}
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-3">{currentStep.title}</h2>
            <p className="text-gray-600 leading-relaxed min-h-[80px]">
              {currentStep.description}
            </p>
          </div>

          <div className="mt-8 flex items-center justify-between">
            <div className="flex gap-2">
              {steps.map((_, i) => (
                <div 
                  key={i} 
                  className={`w-2 h-2 rounded-full transition-all ${i === step ? 'bg-green-600 w-4' : 'bg-gray-300'}`} 
                />
              ))}
            </div>
            
            <div className="flex gap-3">
              {step > 0 && (
                <button 
                  onClick={() => setStep(step - 1)}
                  className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Voltar
                </button>
              )}
              {step < steps.length - 1 ? (
                <button 
                  onClick={() => setStep(step + 1)}
                  className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors"
                >
                  Próximo
                </button>
              ) : (
                <button 
                  onClick={onClose}
                  className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors"
                >
                  Começar!
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
