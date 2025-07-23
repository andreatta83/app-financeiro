import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, doc, onSnapshot, setDoc, updateDoc, collection, query, addDoc, deleteDoc, getDoc, getDocs } from 'firebase/firestore';
import { getAnalytics } from "firebase/analytics";
import { Landmark, CreditCard, TrendingUp, LayoutDashboard, Plus, Trash2, Edit, X, Copy, ArrowDown, ArrowUp, LogOut, KeyRound, Target, ChevronLeft, ChevronRight } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';


// --- CONFIGURAÇÃO DO FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyARHXDG8M6Qd8U7UMsdjCFlDlwGpR6uors",
  authDomain: "meu-app-financeirov2.firebaseapp.com",
  projectId: "meu-app-financeirov2",
  storageBucket: "meu-app-financeirov2.firebasestorage.app",
  messagingSenderId: "30295709812",
  appId: "1:30295709812:web:b17b76c70c96c468aed921",
  measurementId: "G-D61EFQJYQ6"
};

// Inicializar Firebase e serviços
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = getAnalytics(app);
const appId = firebaseConfig.projectId;

// Listas de Categorias e Tipos
const CATEGORIES = ['Moradia', 'Transporte', 'Alimentação', 'Saúde', 'Lazer', 'Educação', 'Vestuário', 'Dívidas', 'Investimentos', 'Outros'];
const EXPENSE_TYPES = {
    fixed: 'Fixo',
    essential: 'Essencial',
    variable: 'Variável',
    superfluous: 'Supérfluo'
};
const CATEGORY_COLORS = {
    'Moradia': '#FF6384',
    'Transporte': '#36A2EB',
    'Alimentação': '#FFCE56',
    'Saúde': '#4BC0C0',
    'Lazer': '#9966FF',
    'Educação': '#FF9F40',
    'Vestuário': '#C9CBCF',
    'Dívidas': '#E75252',
    'Investimentos': '#32CD32',
    'Outros': '#A9A9A9'
};


// --- COMPONENTES DE UI (Helpers) ---

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
      <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md m-4">
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

const AlertModal = ({ isOpen, onClose, title, message }) => {
  if (!isOpen) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title || "Aviso"}>
      <p className="text-gray-300 mb-6 whitespace-pre-wrap">{message}</p>
      <div className="flex justify-end">
        <Button onClick={onClose}>OK</Button>
      </div>
    </Modal>
  );
};

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title || "Confirmar Ação"}>
            <p className="text-gray-300 mb-6">{message}</p>
            <div className="flex justify-end gap-4">
                <Button onClick={onClose} variant="secondary">Cancelar</Button>
                <Button onClick={onConfirm} variant="danger">Excluir</Button>
            </div>
        </Modal>
    );
};

const Input = React.forwardRef((props, ref) => (
  <input
    ref={ref}
    {...props}
    className="w-full bg-gray-700 text-white placeholder-gray-400 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
  />
));

const Select = ({ children, ...props }) => (
    <select {...props} className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition">
        {children}
    </select>
);

const Button = ({ children, onClick, className = '', variant = 'primary', disabled = false }) => {
  const baseClasses = "px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${baseClasses} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

const StatCard = ({ title, value, icon, color, subValue }) => (
    <div className="bg-gray-800 p-6 rounded-2xl flex items-center gap-4">
        <div className={`p-3 rounded-full ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-gray-400 text-sm font-medium">{title}</p>
            <p className="text-white text-2xl font-bold">{value}</p>
            {subValue && <p className="text-gray-400 text-xs mt-1">{subValue}</p>}
        </div>
    </div>
);

// --- ECRÃ DE LOGIN ---

const LoginScreen = ({ showAlert }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            showAlert("Erro de Login", "Por favor, preencha o email e a senha.");
            return;
        }
        setIsLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error("Erro de login:", error.code);
            let friendlyMessage = "Ocorreu um erro ao tentar fazer o login.";
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                friendlyMessage = "Email ou senha inválidos. Por favor, tente novamente.";
            } else if (error.code === 'auth/invalid-email') {
                friendlyMessage = "O formato do email é inválido.";
            }
            showAlert("Erro de Login", friendlyMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-gray-900 min-h-screen flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white">Controle Financeiro</h1>
                    <p className="text-gray-400 mt-2">Faça login para aceder ao seu painel.</p>
                </div>
                <form onSubmit={handleLogin} className="bg-gray-800 p-8 rounded-2xl shadow-2xl space-y-6">
                    <div>
                        <label className="block text-gray-400 mb-2" htmlFor="email">Email</label>
                        <Input 
                            id="email"
                            type="email" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            placeholder="seu.email@exemplo.com"
                            disabled={isLoading}
                        />
                    </div>
                    <div>
                        <label className="block text-gray-400 mb-2" htmlFor="password">Senha</label>
                        <Input 
                            id="password"
                            type="password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            placeholder="••••••••"
                            disabled={isLoading}
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                        ) : (
                            <>
                                <KeyRound size={16} />
                                Entrar
                            </>
                        )}
                    </Button>
                </form>
            </div>
        </div>
    );
};


// --- ABA DE GASTOS MENSAIS ---

const MonthlyExpenses = ({ db, userId, showAlert, currentMonth }) => {
  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState({ fixed: [], essential: [], variable: [], superfluous: [] });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [itemName, setItemName] = useState('');
  const [itemValue, setItemValue] = useState('');
  const [itemCategory, setItemCategory] = useState('Outros');

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [actionToConfirm, setActionToConfirm] = useState(null);
  
  useEffect(() => {
    if (!userId) return;

    const carryOverData = async () => {
        const [year, month] = currentMonth.split('-').map(Number);
        const prevDate = new Date(year, month - 2, 1);
        const prevMonthStr = prevDate.toISOString().slice(0, 7);
        
        const prevDocRef = doc(db, 'artifacts', appId, 'users', userId, 'monthlyData', prevMonthStr);
        const prevDocSnap = await getDoc(prevDocRef);

        if (prevDocSnap.exists()) {
            const prevData = prevDocSnap.data();
            const newId = () => Date.now().toString() + Math.random();

            const newIncomes = (prevData.incomes || []).map(item => ({ ...item, id: newId() }));
            const newExpenses = {
                fixed: (prevData.expenses?.fixed || []).map(item => ({ ...item, id: newId() })),
                essential: (prevData.expenses?.essential || []).map(item => ({ ...item, id: newId() })),
                variable: (prevData.expenses?.variable || []).map(item => ({ ...item, id: newId() })),
                superfluous: []
            };

            const newMonthData = {
                incomes: newIncomes,
                expenses: newExpenses
            };

            const currentDocRef = doc(db, 'artifacts', appId, 'users', userId, 'monthlyData', currentMonth);
            await setDoc(currentDocRef, newMonthData);
            showAlert("Mês Iniciado", "Dados do mês anterior foram copiados com sucesso!");
        }
    };
    
    const docRef = doc(db, 'artifacts', appId, 'users', userId, 'monthlyData', currentMonth);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setIncomes(data.incomes || []);
        setExpenses(data.expenses || { fixed: [], essential: [], variable: [], superfluous: [] });
      } else {
        setIncomes([]);
        setExpenses({ fixed: [], essential: [], variable: [], superfluous: [] });
        carryOverData();
      }
    }, (error) => {
        console.error("Erro no listener do Firestore (Gastos): ", error);
        showAlert("Erro de Leitura", `Não foi possível carregar os dados mensais.\n\nErro: ${error.code}`);
    });

    return () => unsubscribe();
  }, [userId, currentMonth, db]);

  const handleSave = async () => {
    if (!itemName || !itemValue) return;
    const value = parseFloat(itemValue);
    if (isNaN(value)) return;

    const newItem = { 
        id: editingItem ? editingItem.id : Date.now().toString(), 
        name: itemName, 
        value, 
        ...(modalType !== 'income' && { category: itemCategory })
    };
    let updatedData = {};

    if (modalType === 'income') {
        const updatedIncomes = editingItem ? incomes.map(i => i.id === editingItem.id ? newItem : i) : [...incomes, newItem];
        updatedData = { incomes: updatedIncomes };
    } else {
        const categoryExpenses = expenses[modalType] || [];
        const updatedCategoryExpenses = editingItem ? categoryExpenses.map(e => e.id === editingItem.id ? newItem : e) : [...categoryExpenses, newItem];
        updatedData = { expenses: { ...expenses, [modalType]: updatedCategoryExpenses } };
    }
    
    try {
        const docRef = doc(db, 'artifacts', appId, 'users', userId, 'monthlyData', currentMonth);
        await setDoc(docRef, updatedData, { merge: true });
        closeModal();
    } catch (error) {
        console.error("Erro ao guardar: ", error);
        showAlert("Erro ao Guardar", `Não foi possível guardar os dados.\n\nErro: ${error.code}\n${error.message}`);
    }
  };
  
  const openModal = (type, item = null) => {
    setModalType(type);
    setEditingItem(item);
    setItemName(item ? item.name : '');
    setItemValue(item ? item.value : '');
    setItemCategory(item ? item.category || 'Outros' : 'Outros');
    setIsModalOpen(true);
  };
  const closeModal = () => setIsModalOpen(false);

  const requestDelete = (type, id) => {
    setActionToConfirm(() => () => performDelete(type, id));
    setIsConfirmOpen(true);
  };

  const performDelete = async (type, id) => {
    let updatedData = {};
    if (type === 'income') {
        updatedData = { incomes: incomes.filter(i => i.id !== id) };
    } else {
        const updatedCategoryExpenses = expenses[type].filter(e => e.id !== id);
        updatedData = { expenses: { ...expenses, [type]: updatedCategoryExpenses } };
    }
    try {
        const docRef = doc(db, 'artifacts', appId, 'users', userId, 'monthlyData', currentMonth);
        await setDoc(docRef, updatedData, { merge: true });
    } catch (error) {
        console.error("Erro ao apagar: ", error);
        showAlert("Erro ao Apagar", `Não foi possível apagar o item.\n\nErro: ${error.code}\n${error.message}`);
    }
    setIsConfirmOpen(false);
  };

  const handleKeyDown = (event) => { if (event.key === 'Enter') { handleSave(); } };

  const renderTable = (title, data, type) => {
    const isExpense = type !== 'income';
    const total = data.reduce((sum, item) => sum + item.value, 0);
    return (
      <div className="bg-gray-800 rounded-2xl p-6">
        <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold text-white">{title}</h3><Button onClick={() => openModal(type)} variant="secondary"><Plus size={16} /> Adicionar</Button></div>
        <div className="overflow-x-auto"><table className="w-full text-left">
            <thead><tr className="border-b border-gray-700">
                <th className="p-3 text-sm font-semibold text-gray-400">Descrição</th>
                {isExpense && <th className="p-3 text-sm font-semibold text-gray-400">Categoria</th>}
                <th className="p-3 text-sm font-semibold text-gray-400 text-right">Valor</th>
                <th className="p-3 text-sm font-semibold text-gray-400 text-right">Ações</th>
            </tr></thead>
            <tbody>
              {data.map(item => (<tr key={item.id} className="border-b border-gray-700/50">
                <td className="p-3 text-white">
                    {item.name}
                    {item.cardName && <span className="text-xs text-gray-400 ml-2">({item.cardName})</span>}
                </td>
                {isExpense && <td className="p-3 text-white"><span className="bg-gray-700 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full">{item.category || 'N/A'}</span></td>}
                <td className="p-3 text-white text-right">R$ {item.value.toFixed(2)}</td>
                <td className="p-3 text-right">
                    <button onClick={() => openModal(type, item)} className="text-blue-400 hover:text-blue-300 mr-2"><Edit size={16} /></button>
                    <button onClick={() => requestDelete(type, item.id)} className="text-red-400 hover:text-red-300"><Trash2 size={16} /></button>
                </td>
              </tr>))}
              {data.length === 0 && (<tr><td colSpan={isExpense ? 4 : 3} className="text-center p-4 text-gray-500">Nenhum item.</td></tr>)}
            </tbody>
            <tfoot><tr className="font-bold">
                <td className="p-3 text-white" colSpan={isExpense ? 2 : 1}>Total</td>
                <td className="p-3 text-white text-right" colSpan="2">R$ {total.toFixed(2)}</td>
            </tr></tfoot>
        </table></div>
      </div>
    );
  };
  
  const totalIncomes = incomes.reduce((sum, item) => sum + item.value, 0);
  const totalExpenses = Object.values(expenses).flat().reduce((sum, item) => sum + item.value, 0);
  const balance = totalIncomes - totalExpenses;

  return (
    <div className="space-y-8">
        <ConfirmModal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={actionToConfirm} message="Tem a certeza que deseja apagar este item? Esta ação não pode ser desfeita."/>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard title="Total de Receitas" value={`R$ ${totalIncomes.toFixed(2)}`} icon={<ArrowUp size={24} />} color="bg-green-500/30 text-green-400" />
            <StatCard title="Total de Despesas" value={`R$ ${totalExpenses.toFixed(2)}`} icon={<ArrowDown size={24} />} color="bg-red-500/30 text-red-400" />
            <StatCard title="Saldo do Mês" value={`R$ ${balance.toFixed(2)}`} icon={<Landmark size={24} />} color={balance >= 0 ? "bg-blue-500/30 text-blue-400" : "bg-yellow-500/30 text-yellow-400"} />
        </div>
        {renderTable('Receitas', incomes, 'income')}
        <div className="grid md:grid-cols-2 gap-8">{renderTable('Gastos Fixos', expenses.fixed, 'fixed')}{renderTable('Gastos Essenciais', expenses.essential, 'essential')}{renderTable('Gastos Variáveis', expenses.variable, 'variable')}{renderTable('Gastos Supérfluos', expenses.superfluous, 'superfluous')}</div>
        <Modal isOpen={isModalOpen} onClose={closeModal} title={editingItem ? "Editar Item" : "Adicionar Item"}><div className="space-y-4" onKeyDown={handleKeyDown}>
            <Input type="text" placeholder="Nome" value={itemName} onChange={e => setItemName(e.target.value)} />
            <Input type="number" placeholder="Valor" value={itemValue} onChange={e => setItemValue(e.target.value)} />
            {modalType !== 'income' && (
                <div>
                    <label className="block text-gray-400 mb-2 text-sm">Categoria</label>
                    <Select value={itemCategory} onChange={e => setItemCategory(e.target.value)}>
                        {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </Select>
                </div>
            )}
            <Button onClick={handleSave} className="w-full">{editingItem ? "Guardar" : "Adicionar"}</Button>
        </div></Modal>
    </div>
  );
};

// --- ABA DE CONTROLO DE CARTÕES ---

const CardControl = ({ db, userId, showAlert, currentMonth }) => {
    const [cards, setCards] = useState([]);
    const [isCardModalOpen, setIsCardModalOpen] = useState(false);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [editingCard, setEditingCard] = useState(null);
    const [cardName, setCardName] = useState('');
    
    const [currentCardId, setCurrentCardId] = useState(null);
    const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
    const [expenseDescription, setExpenseDescription] = useState('');
    const [expenseValue, setExpenseValue] = useState('');
    const [expenseCategory, setExpenseCategory] = useState('Outros');
    const [expenseType, setExpenseType] = useState('variable');

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [actionToConfirm, setActionToConfirm] = useState(null);

    const cardsCollectionRef = useMemo(() => {
        if (!userId) return null;
        return collection(db, 'artifacts', appId, 'users', userId, 'creditCards');
    }, [userId, db]);

    useEffect(() => {
        if (!cardsCollectionRef) return;
        const unsubscribe = onSnapshot(query(cardsCollectionRef), (snap) => {
            setCards(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
        }, (error) => {
            console.error("Erro no listener do Firestore (Cartões): ", error);
            showAlert("Erro de Leitura", `Não foi possível carregar os dados dos cartões.\n\nErro: ${error.code}`);
        });
        return () => unsubscribe();
    }, [cardsCollectionRef]);

    const openCardModal = (card = null) => { setEditingCard(card); setCardName(card ? card.name : ''); setIsCardModalOpen(true); };
    const closeCardModal = () => setIsCardModalOpen(false);

    const handleSaveCard = async () => {
        if (!cardName) return;
        try {
            if (editingCard) {
                await updateDoc(doc(cardsCollectionRef, editingCard.id), { name: cardName });
            } else {
                await addDoc(cardsCollectionRef, { name: cardName, expenses: [] });
            }
            closeCardModal();
        } catch (error) {
            console.error("Erro ao guardar cartão: ", error);
            showAlert("Erro ao Guardar", `Não foi possível guardar o cartão.\n\nErro: ${error.code}`);
        }
    };

    const requestDeleteCard = (cardId) => {
        setActionToConfirm(() => () => performDeleteCard(cardId));
        setIsConfirmOpen(true);
    };
    const performDeleteCard = async (cardId) => {
        try {
            await deleteDoc(doc(cardsCollectionRef, cardId));
        } catch(error) {
            console.error("Erro ao apagar cartão: ", error);
            showAlert("Erro ao Apagar", `Não foi possível apagar o cartão.\n\nErro: ${error.code}`);
        }
        setIsConfirmOpen(false);
    };

    const openExpenseModal = (cardId) => { 
        setCurrentCardId(cardId); 
        setExpenseDate(currentMonth + '-15'); // Padrão para o meio do mês selecionado
        setExpenseDescription(''); 
        setExpenseValue('');
        setExpenseCategory('Outros');
        setExpenseType('variable');
        setIsExpenseModalOpen(true); 
    };
    const closeExpenseModal = () => setIsExpenseModalOpen(false);

    const handleSaveExpense = async () => {
        if (!expenseDescription || !expenseValue || !expenseDate || !expenseType || !expenseCategory) return;
        const value = parseFloat(expenseValue);
        if (isNaN(value)) return;

        const card = cards.find(c => c.id === currentCardId);
        if (!card) return;

        const expenseMonth = expenseDate.slice(0, 7);
        const newExpenseId = Date.now().toString();
        
        const newExpenseForCard = { 
            id: newExpenseId, 
            date: expenseDate, 
            description: expenseDescription, 
            value, 
            category: expenseCategory,
            type: expenseType
        };
        
        const newExpenseForMonthly = {
            id: newExpenseId,
            name: expenseDescription,
            value,
            category: expenseCategory,
            cardName: card.name
        };

        const updatedCardExpenses = [...(card.expenses || []), newExpenseForCard].sort((a, b) => new Date(b.date) - new Date(a.date));
        const cardDocRef = doc(cardsCollectionRef, currentCardId);
        
        const monthlyDocRef = doc(db, 'artifacts', appId, 'users', userId, 'monthlyData', expenseMonth);

        try {
            const monthlyDocSnap = await getDoc(monthlyDocRef);
            const currentMonthlyData = monthlyDocSnap.exists() ? monthlyDocSnap.data() : { expenses: {} };
            const currentTypeExpenses = currentMonthlyData.expenses[expenseType] || [];
            const updatedTypeExpenses = [...currentTypeExpenses, newExpenseForMonthly];
            
            const updatedMonthlyExpenses = {
                ...currentMonthlyData.expenses,
                [expenseType]: updatedTypeExpenses
            };

            await updateDoc(cardDocRef, { expenses: updatedCardExpenses });
            await setDoc(monthlyDocRef, { expenses: updatedMonthlyExpenses }, { merge: true });
            
            closeExpenseModal();
        } catch(error) {
            console.error("Erro ao guardar gasto sincronizado: ", error);
            showAlert("Erro ao Guardar", `Não foi possível guardar o gasto.\n\nErro: ${error.code}`);
        }
    };
    
    const requestDeleteExpense = (cardId, expenseId) => {
        setActionToConfirm(() => () => performDeleteExpense(cardId, expenseId));
        setIsConfirmOpen(true);
    };

    const performDeleteExpense = async (cardId, expenseId) => {
        const card = cards.find(c => c.id === cardId);
        const expenseToDelete = (card?.expenses || []).find(e => e.id === expenseId);
        if (!card || !expenseToDelete) return;

        const expenseMonth = expenseToDelete.date.slice(0, 7);
        const expenseTypeToDelete = expenseToDelete.type;

        const updatedCardExpenses = card.expenses.filter(e => e.id !== expenseId);
        const cardDocRef = doc(cardsCollectionRef, cardId);

        const monthlyDocRef = doc(db, 'artifacts', appId, 'users', userId, 'monthlyData', expenseMonth);

        try {
            const monthlyDocSnap = await getDoc(monthlyDocRef);
            if(monthlyDocSnap.exists()) {
                const currentMonthlyData = monthlyDocSnap.data();
                const updatedMonthlyExpenses = { ...currentMonthlyData.expenses };

                if (updatedMonthlyExpenses[expenseTypeToDelete]) {
                    updatedMonthlyExpenses[expenseTypeToDelete] = updatedMonthlyExpenses[expenseTypeToDelete].filter(exp => exp.id !== expenseId);
                }

                await updateDoc(cardDocRef, { expenses: updatedCardExpenses });
                await setDoc(monthlyDocRef, { expenses: updatedMonthlyExpenses }, { merge: true });
            } else {
                await updateDoc(cardDocRef, { expenses: updatedCardExpenses });
            }
        } catch(error) {
            console.error("Erro ao apagar gasto sincronizado: ", error);
            showAlert("Erro ao Apagar", `Não foi possível apagar o gasto.\n\nErro: ${error.code}`);
        }
        setIsConfirmOpen(false);
    };

    const handleCardModalKeyDown = (event) => { if (event.key === 'Enter') { handleSaveCard(); } };
    const handleExpenseModalKeyDown = (event) => { if (event.key === 'Enter') { handleSaveExpense(); } };

    return (
        <div className="space-y-8">
            <ConfirmModal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={actionToConfirm} message="Tem a certeza que deseja apagar este item? Esta ação não pode ser desfeita."/>
            <div className="flex justify-between items-center"><h2 className="text-3xl font-bold text-white">Controle de Cartões</h2><Button onClick={() => openCardModal()}><Plus size={16} /> Novo Cartão</Button></div>
            {cards.length === 0 && <div className="text-center py-16 bg-gray-800 rounded-2xl"><CreditCard size={48} className="mx-auto text-gray-500" /><p className="mt-4 text-gray-400">Nenhum cartão adicionado.</p></div>}
            <div className="space-y-6">
                {cards.map(card => {
                    const monthlyExpenses = (card.expenses || []).filter(exp => exp.date.startsWith(currentMonth));
                    const total = monthlyExpenses.reduce((sum, exp) => sum + exp.value, 0);
                    return (
                        <div key={card.id} className="bg-gray-800 rounded-2xl p-6">
                            <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-4"><div><h3 className="text-xl font-bold text-white">{card.name}</h3><p className="text-red-400 font-semibold">Total do Mês: R$ {total.toFixed(2)}</p></div><div className="flex gap-2"><Button onClick={() => openExpenseModal(card.id)} variant="secondary"><Plus size={16} /> Adicionar Gasto</Button><Button onClick={() => requestDeleteCard(card.id)} variant="danger"><Trash2 size={16} /></Button></div></div>
                            <div className="overflow-x-auto"><table className="w-full text-left">
                                <thead><tr className="border-b border-gray-700/50"><th className="p-2 text-sm font-semibold text-gray-400">Data</th><th className="p-2 text-sm font-semibold text-gray-400">Descrição</th><th className="p-2 text-sm font-semibold text-gray-400">Categoria</th><th className="p-2 text-sm font-semibold text-gray-400 text-right">Valor</th><th className="p-2 text-sm font-semibold text-gray-400 text-right">Ações</th></tr></thead>
                                <tbody>
                                    {monthlyExpenses.map(exp => (<tr key={exp.id}>
                                        <td className="p-2 text-white">{new Date(exp.date + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                                        <td className="p-2 text-white">{exp.description}</td>
                                        <td className="p-2 text-white"><span className="bg-gray-700 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full">{exp.category || 'N/A'}</span></td>
                                        <td className="p-2 text-white text-right">R$ {exp.value.toFixed(2)}</td>
                                        <td className="p-2 text-right"><button onClick={() => requestDeleteExpense(card.id, exp.id)} className="text-red-400 hover:text-red-300"><Trash2 size={16} /></button></td>
                                    </tr>))}
                                    {monthlyExpenses.length === 0 && <tr><td colSpan="5" className="text-center p-4 text-gray-500">Nenhum gasto este mês.</td></tr>}
                                </tbody>
                            </table></div>
                        </div>
                    );
                })}
            </div>
            <Modal isOpen={isCardModalOpen} onClose={closeCardModal} title={editingCard ? "Editar Cartão" : "Novo Cartão"}><div className="space-y-4" onKeyDown={handleCardModalKeyDown}><Input type="text" placeholder="Nome do Cartão" value={cardName} onChange={e => setCardName(e.target.value)} /><Button onClick={handleSaveCard} className="w-full">{editingCard ? "Guardar" : "Adicionar"}</Button></div></Modal>
            <Modal isOpen={isExpenseModalOpen} onClose={closeExpenseModal} title="Adicionar Gasto"><div className="space-y-4" onKeyDown={handleExpenseModalKeyDown}>
                <label className="text-gray-400">Data</label><Input type="date" value={expenseDate} onChange={e => setExpenseDate(e.target.value)} />
                <Input type="text" placeholder="Descrição" value={expenseDescription} onChange={e => setExpenseDescription(e.target.value)} />
                <Input type="number" placeholder="Valor" value={expenseValue} onChange={e => setExpenseValue(e.target.value)} />
                <div>
                    <label className="block text-gray-400 mb-2 text-sm">Tipo de Gasto</label>
                    <Select value={expenseType} onChange={e => setExpenseType(e.target.value)}>
                        {Object.entries(EXPENSE_TYPES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                    </Select>
                </div>
                <div>
                    <label className="block text-gray-400 mb-2 text-sm">Categoria</label>
                    <Select value={expenseCategory} onChange={e => setExpenseCategory(e.target.value)}>
                        {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </Select>
                </div>
                <Button onClick={handleSaveExpense} className="w-full">Adicionar</Button>
            </div></Modal>
        </div>
    );
};

// --- ABA DE INVESTIMENTOS ---

const Investments = ({ db, userId, showAlert }) => {
    const GOAL = 1000000;
    const MONTHLY_INTEREST_RATE = 0.01;
    const TOTAL_PERIOD_MONTHS = 72; // 6 anos

    const [history, setHistory] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState(null);
    const [contributionDate, setContributionDate] = useState(new Date().toISOString().slice(0, 7));
    const [contributionValue, setContributionValue] = useState('');
    
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [actionToConfirm, setActionToConfirm] = useState(null);

    const docRef = useMemo(() => {
        if (!userId) return null;
        return doc(db, 'artifacts', appId, 'users', userId, 'investments', 'data');
    }, [userId, db]);

    useEffect(() => {
        if (!docRef) return;
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            const data = docSnap.exists() ? docSnap.data().history || [] : [];
            const sortedData = [...data].sort((a, b) => a.date.localeCompare(b.date));
            setHistory(sortedData);
        }, (error) => {
            console.error("Erro no listener do Firestore (Investimentos): ", error);
            showAlert("Erro de Leitura", `Não foi possível carregar o histórico de investimentos.\n\nErro: ${error.code}`);
        });
        return () => unsubscribe();
    }, [docRef]);

    const recalculateHistory = (historyArray) => {
        const sortedHistory = [...historyArray].sort((a, b) => a.date.localeCompare(b.date));
        let runningTotal = 0;
        return sortedHistory.map(entry => {
            const balanceBeforeInterest = runningTotal + entry.contribution;
            const interestEarned = balanceBeforeInterest * MONTHLY_INTEREST_RATE;
            runningTotal = balanceBeforeInterest + interestEarned;
            return { ...entry, interestEarned, total: runningTotal };
        });
    };

    const handleSave = async () => {
        const value = parseFloat(contributionValue);
        if (isNaN(value) || value <= 0 || !contributionDate) {
            showAlert("Aviso", "Por favor, preencha a data e um valor de aporte válido.");
            return;
        }

        let newHistory;
        if (editingEntry) {
            newHistory = history.map(entry => entry.id === editingEntry.id ? { ...entry, date: contributionDate, contribution: value } : entry);
        } else {
            const newEntry = { id: Date.now().toString(), date: contributionDate, contribution: value, interestEarned: 0, total: 0 };
            newHistory = [...history, newEntry];
        }

        const recalculated = recalculateHistory(newHistory);
        try {
            await setDoc(docRef, { history: recalculated });
            closeModal();
        } catch(error) {
            console.error("Erro ao guardar investimento: ", error);
            showAlert("Erro ao Guardar", `Não foi possível guardar o aporte.\n\nErro: ${error.code}`);
        }
    };

    const openModal = (entry = null) => { setEditingEntry(entry); setContributionDate(entry ? entry.date : new Date().toISOString().slice(0, 7)); setContributionValue(entry ? entry.contribution : ''); setIsModalOpen(true); };
    const closeModal = () => { setIsModalOpen(false); setEditingEntry(null); };

    const requestDelete = (id) => {
        setActionToConfirm(() => () => performDelete(id));
        setIsConfirmOpen(true);
    };

    const performDelete = async (id) => {
        const newHistory = history.filter(entry => entry.id !== id);
        const recalculated = recalculateHistory(newHistory);
        try {
            await setDoc(docRef, { history: recalculated });
        } catch(error) {
            console.error("Erro ao apagar investimento: ", error);
            showAlert("Erro ao Apagar", `Não foi possível apagar o aporte.\n\nErro: ${error.code}`);
        }
        setIsConfirmOpen(false);
    };

    const handleKeyDown = (event) => { if (event.key === 'Enter') { handleSave(); } };

    const currentTotal = history.length > 0 ? history[history.length - 1].total : 0;
    const progress = (currentTotal / GOAL) * 100;

    const averageMonthlyInvestment = useMemo(() => {
        const r = MONTHLY_INTEREST_RATE;
        
        if (history.length === 0) {
            const n = TOTAL_PERIOD_MONTHS;
            if (GOAL <= 0 || r <= 0 || n <= 0) return 0;
            return GOAL * (r / (Math.pow(1 + r, n) - 1));
        }

        const firstContributionDate = new Date(history[0].date + '-02T00:00:00');
        const today = new Date();

        const monthsElapsed = (today.getFullYear() - firstContributionDate.getFullYear()) * 12 + (today.getMonth() - firstContributionDate.getMonth());
        const monthsRemaining = Math.max(0, TOTAL_PERIOD_MONTHS - monthsElapsed);

        if (monthsRemaining <= 0) return 0;

        const n = monthsRemaining;
        const fv_of_current = currentTotal * Math.pow(1 + r, n);
        const remainingGoal = GOAL - fv_of_current;

        if (remainingGoal <= 0) return 0;

        return remainingGoal * (r / (Math.pow(1 + r, n) - 1));
    }, [history, currentTotal]);
    
    return (
        <div className="space-y-8">
            <ConfirmModal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={actionToConfirm} message="Tem a certeza que deseja apagar este aporte? Esta ação não pode ser desfeita."/>
            
            <h2 className="text-3xl font-bold text-white">Plano de Investimentos: Rumo a R$ 1 Milhão</h2>
            
            <div className="bg-gray-800 rounded-2xl p-6 space-y-4"><h3 className="text-xl font-bold text-white">Progresso Atual</h3><div className="w-full bg-gray-700 rounded-full h-4"><div className="bg-green-500 h-4 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }}></div></div><div className="flex justify-between text-white font-semibold"><span>R$ {currentTotal.toFixed(2)}</span><span>Meta: R$ {GOAL.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span></div><p className="text-center text-2xl font-bold text-green-400">{progress.toFixed(2)}%</p></div>
            
            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-800 rounded-2xl p-6 flex flex-col justify-center">
                    <h3 className="text-lg font-bold text-white mb-4">Novo Aporte</h3>
                    <Button onClick={() => openModal()} className="w-full"><Plus size={16} /> Adicionar Aporte</Button>
                </div>
                <div className="bg-gray-800 rounded-2xl p-6 flex flex-col justify-center items-center text-center">
                    <div className="flex items-center gap-3 mb-2">
                        <Target size={24} className="text-blue-400" />
                        <h3 className="text-lg font-bold text-white">Meta para 6 Anos</h3>
                    </div>
                    <p className="text-gray-400 text-sm mb-2">Para atingir R$ 1 milhão em 72 meses, o seu aporte mensal precisa ser de:</p>
                    <p className="text-3xl font-bold text-blue-400">R$ {averageMonthlyInvestment.toFixed(2)}</p>
                </div>
            </div>
            
            <div className="bg-gray-800 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">Histórico de Aportes</h3>
                <div className="overflow-x-auto max-h-96"><table className="w-full text-left">
                    <thead><tr className="border-b border-gray-700"><th className="p-3 text-sm font-semibold text-gray-400">Mês/Ano</th><th className="p-3 text-sm font-semibold text-gray-400 text-right">Aporte</th><th className="p-3 text-sm font-semibold text-gray-400 text-right">Juros</th><th className="p-3 text-sm font-semibold text-gray-400 text-right">Saldo Total</th><th className="p-3 text-sm font-semibold text-gray-400 text-right">Ações</th></tr></thead>
                    <tbody>
                        {history.map(entry => (<tr key={entry.id} className="border-b border-gray-700/50"><td className="p-3 text-white">{new Date(entry.date + '-02').toLocaleString('pt-BR', {month: 'long', year: 'numeric'})}</td><td className="p-3 text-green-400 text-right">+ R$ {entry.contribution.toFixed(2)}</td><td className="p-3 text-blue-400 text-right">+ R$ {entry.interestEarned.toFixed(2)}</td><td className="p-3 text-white font-bold text-right">R$ {entry.total.toFixed(2)}</td><td className="p-3 text-right flex gap-2 justify-end"><button onClick={() => openModal(entry)} className="text-blue-400 hover:text-blue-300"><Edit size={16} /></button><button onClick={() => requestDelete(entry.id)} className="text-red-400 hover:text-red-300"><Trash2 size={16} /></button></td></tr>))}
                        {history.length === 0 && <tr><td colSpan="5" className="text-center p-8 text-gray-500">Comece por adicionar o seu primeiro aporte.</td></tr>}
                    </tbody>
                </table></div>
            </div>
            <Modal isOpen={isModalOpen} onClose={closeModal} title={editingEntry ? "Editar Aporte" : "Novo Aporte"}><div className="space-y-4" onKeyDown={handleKeyDown}><label className="text-gray-400">Mês/Ano do Aporte</label><Input type="month" value={contributionDate} onChange={e => setContributionDate(e.target.value)} /><label className="text-gray-400">Valor do Aporte</label><Input type="number" placeholder="1000.00" value={contributionValue} onChange={e => setContributionValue(e.target.value)} /><Button onClick={handleSave} className="w-full">{editingEntry ? "Guardar Alterações" : "Adicionar"}</Button></div></Modal>
        </div>
    );
};

// --- ABA DE DASHBOARD ---

const Dashboard = ({ db, userId, showAlert, currentMonth }) => {
    const [monthlyData, setMonthlyData] = useState(null);
    const [cardData, setCardData] = useState([]);
    const [investmentData, setInvestmentData] = useState(null);

    useEffect(() => {
        if (!userId) return;
        const unsubscribers = [];

        const monthlyDocRef = doc(db, 'artifacts', appId, 'users', userId, 'monthlyData', currentMonth);
        unsubscribers.push(onSnapshot(monthlyDocRef, (docSnap) => {
            setMonthlyData(docSnap.exists() ? docSnap.data() : { incomes: [], expenses: {} });
        }, (error) => {
            console.error("Dashboard: Erro ao carregar dados mensais:", error);
            showAlert("Erro de Leitura (Mensal)", `Não foi possível carregar os dados do dashboard.\n\nErro: ${error.code || error.message}`);
        }));

        const cardsCollectionRef = collection(db, 'artifacts', appId, 'users', userId, 'creditCards');
        unsubscribers.push(onSnapshot(query(cardsCollectionRef), (querySnapshot) => {
            setCardData(querySnapshot.docs.map(d => d.data()));
        }, (error) => {
            console.error("Dashboard: Erro ao carregar dados dos cartões:", error);
            showAlert("Erro de Leitura (Cartões)", `Não foi possível carregar os dados do dashboard.\n\nErro: ${error.code || error.message}`);
        }));

        const investmentDocRef = doc(db, 'artifacts', appId, 'users', userId, 'investments', 'data');
        unsubscribers.push(onSnapshot(investmentDocRef, (docSnap) => {
            setInvestmentData(docSnap.exists() ? docSnap.data() : { history: [] });
        }, (error) => {
            console.error("Dashboard: Erro ao carregar dados de investimentos:", error);
            showAlert("Erro de Leitura (Investimentos)", `Não foi possível carregar os dados do dashboard.\n\nErro: ${error.code || error.message}`);
        }));

        return () => unsubscribers.forEach(unsub => unsub());
    }, [userId, db, currentMonth, showAlert]);

    const summary = useMemo(() => {
        const totalIncomes = (monthlyData?.incomes || []).reduce((sum, i) => sum + i.value, 0);
        
        const monthlyExpenses = Object.values(monthlyData?.expenses || {}).flat();
        
        const totalExpensesValue = monthlyExpenses.reduce((sum, e) => sum + e.value, 0);
        const balance = totalIncomes - totalExpensesValue;
        
        const cardExpenses = cardData.flatMap(card => card.expenses || []).filter(exp => exp.date.startsWith(currentMonth));
        const totalCardDebt = cardExpenses.reduce((sum, e) => sum + e.value, 0);
        
        const investmentHistory = investmentData?.history || [];
        const investmentTotal = investmentHistory.length > 0 ? investmentHistory[investmentHistory.length - 1].total : 0;

        const categoryAggregates = monthlyExpenses.reduce((acc, expense) => {
            const category = expense.category || 'Outros';
            acc[category] = (acc[category] || 0) + expense.value;
            return acc;
        }, {});
        
        const monthlyExpenseTypes = Object.entries(monthlyData?.expenses || {}).reduce((acc, [type, expenses]) => {
            acc[type] = expenses.reduce((sum, e) => sum + e.value, 0);
            return acc;
        }, {});

        return {
            totalIncomes,
            totalExpenses: totalExpensesValue,
            balance,
            totalCardDebt,
            investmentTotal,
            categoryAggregates,
            monthlyExpenseTypes
        };
    }, [monthlyData, cardData, investmentData, currentMonth]);

    const pieChartData = useMemo(() => {
        return Object.entries(summary.categoryAggregates)
            .map(([name, value]) => ({ name, value }))
            .filter(item => item.value > 0);
    }, [summary.categoryAggregates]);

    const expenseTypeData = useMemo(() => {
        const labels = { fixed: 'Fixos', essential: 'Essenciais', variable: 'Variáveis', superfluous: 'Supérfluos' };
        return Object.entries(summary.monthlyExpenseTypes).map(([type, value]) => ({
            name: labels[type] || type,
            value
        }));
    }, [summary.monthlyExpenseTypes]);

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold text-white">Dashboard Financeiro</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Saldo do Mês" value={`R$ ${summary.balance.toFixed(2)}`} icon={<Landmark size={24} />} color="bg-blue-500/30 text-blue-400" />
                <StatCard title="Gastos nos Cartões (Mês)" value={`R$ ${summary.totalCardDebt.toFixed(2)}`} icon={<CreditCard size={24} />} color="bg-red-500/30 text-red-400" />
                <StatCard title="Total Investido" value={`R$ ${summary.investmentTotal.toFixed(2)}`} icon={<TrendingUp size={24} />} color="bg-green-500/30 text-green-400" />
                <StatCard title="Receitas do Mês" value={`R$ ${summary.totalIncomes.toFixed(2)}`} icon={<ArrowUp size={24} />} color="bg-green-500/30 text-green-400" />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gray-800 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-white mb-4">Distribuição de Despesas do Mês</h3>
                    {expenseTypeData.length > 0 && summary.totalExpenses > 0 ? (
                        <div className="space-y-4">
                            <div className="w-full flex h-10 rounded-full overflow-hidden">
                                {expenseTypeData.map(({ name, value }) => {
                                    const percentage = (value / summary.totalExpenses) * 100;
                                    const colors = { 'Fixos': 'bg-red-500', 'Essenciais': 'bg-orange-500', 'Variáveis': 'bg-yellow-500', 'Supérfluos': 'bg-purple-500' };
                                    if (percentage === 0) return null;
                                    return <div key={name} className={colors[name]} style={{ width: `${percentage}%` }} title={`${name}: ${percentage.toFixed(1)}%`}></div>
                                })}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {expenseTypeData.map(({name, value}) => (<div key={name} className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${ { 'Fixos': 'bg-red-500', 'Essenciais': 'bg-orange-500', 'Variáveis': 'bg-yellow-500', 'Supérfluos': 'bg-purple-500' }[name]}`}></div>
                                    <div><span className="text-white font-medium">{name}</span><span className="text-gray-400 text-sm ml-2">R$ {value.toFixed(2)}</span></div>
                                </div>))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-10 text-gray-500"><p>Nenhuma despesa registada este mês.</p></div>
                    )}
                </div>

                <div className="bg-gray-800 rounded-2xl p-6">
                     <h3 className="text-xl font-bold text-white mb-4">Análise de Categorias</h3>
                     {pieChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={pieChartData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                    nameKey="name"
                                >
                                    {pieChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || '#8884d8'} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => `R$ ${value.toFixed(2)}`} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                     ) : (
                        <div className="text-center py-10 text-gray-500 flex flex-col items-center justify-center h-full">
                            <p>Nenhuma despesa com categoria registada.</p>
                        </div>
                     )}
                </div>
            </div>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL DA APLICAÇÃO ---

const MainApp = ({ userId, showAlert }) => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Erro ao fazer logout:", error);
            showAlert("Erro de Logout", "Não foi possível terminar a sessão.");
        }
    };
    
    const changeMonth = (offset) => {
        const [year, month] = currentMonth.split('-').map(Number);
        const date = new Date(year, month - 1, 1);
        date.setMonth(date.getMonth() + offset);
        setCurrentMonth(date.toISOString().slice(0, 7));
    };

    const tabs = {
        dashboard: { label: 'Dashboard', icon: <LayoutDashboard size={20} />, component: <Dashboard db={db} userId={userId} showAlert={showAlert} currentMonth={currentMonth} /> },
        monthly: { label: 'Gastos Mensais', icon: <Landmark size={20} />, component: <MonthlyExpenses db={db} userId={userId} showAlert={showAlert} currentMonth={currentMonth} /> },
        cards: { label: 'Cartões', icon: <CreditCard size={20} />, component: <CardControl db={db} userId={userId} showAlert={showAlert} currentMonth={currentMonth} /> },
        investments: { label: 'Investimentos', icon: <TrendingUp size={20} />, component: <Investments db={db} userId={userId} showAlert={showAlert} /> },
    };

    return (
        <div className="bg-gray-900 text-white min-h-screen font-sans">
            <div className="container mx-auto p-4 md:p-8">
                <header className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-bold">Controle Financeiro Inteligente</h1>
                        <p className="text-gray-400 mt-2">O seu assistente pessoal para uma vida financeira organizada.</p>
                    </div>
                    <Button onClick={handleLogout} variant="danger">
                        <LogOut size={16} />
                        Sair
                    </Button>
                </header>
                
                {(activeTab === 'monthly' || activeTab === 'cards' || activeTab === 'dashboard') && (
                    <div className="flex justify-center items-center bg-gray-800 p-4 rounded-2xl mb-8">
                        <div className="flex items-center gap-4">
                            <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-700 transition"><ChevronLeft size={24} /></button>
                            <span className="text-xl font-semibold w-48 text-center">{new Date(currentMonth + '-02').toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</span>
                            <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-700 transition"><ChevronRight size={24} /></button>
                        </div>
                    </div>
                )}

                <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-2 mb-8 flex flex-wrap justify-center gap-2">
                    {Object.entries(tabs).map(([key, { label, icon }]) => (<button key={key} onClick={() => setActiveTab(key)} className={`flex-grow md:flex-grow-0 px-4 py-2 rounded-lg flex items-center justify-center gap-2 font-semibold transition ${activeTab === key ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-300 hover:bg-gray-700/50'}`}>{icon}<span>{label}</span></button>))}
                </div>
                <main>{tabs[activeTab].component}</main>
                <footer className="text-center text-gray-500 mt-12 text-sm">
                    <p>O seu ID de utilizador (para referência): {userId || 'Nenhum'}</p>
                    <p>Desenvolvido com React e Firebase.</p>
                </footer>
            </div>
        </div>
    );
};

// --- GESTOR DE AUTENTICAÇÃO ---

export default function App() {
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  
  const [alertInfo, setAlertInfo] = useState({ isOpen: false, title: '', message: '' });

  const showAlert = (title, message) => {
    setAlertInfo({ isOpen: true, title, message });
  };
  
  const closeAlert = () => {
    setAlertInfo({ isOpen: false, title: '', message: '' });
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
        setUser(user);
        setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);
  
  if (!isAuthReady) {
    return (<div className="bg-gray-900 text-white min-h-screen flex flex-col justify-center items-center"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div><p className="mt-4 text-lg">A carregar...</p></div>);
  }

  return (
    <>
        <AlertModal isOpen={alertInfo.isOpen} onClose={closeAlert} title={alertInfo.title} message={alertInfo.message} />
        {user ? <MainApp userId={user.uid} showAlert={showAlert} /> : <LoginScreen showAlert={showAlert} />}
    </>
  );
}
