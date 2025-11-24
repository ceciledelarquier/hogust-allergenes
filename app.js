const { useState, useEffect } = React;

// Backend API Client
const API_BASE_URL = 'https://hogust-allergenes.onrender.com';

const callBackendAPI = async (fileContent, isImage = false) => {
    console.log("Calling Hogust Backend API", { isImage });

    try {
        const response = await fetch(`${API_BASE_URL}/analyze`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                content: fileContent,
                isImage: isImage
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Erreur lors de l'analyse");
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error calling Backend API", error);
        throw error;
    }
};

function App() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentFile, setCurrentFile] = useState(null);
    const [error, setError] = useState('');
    const [serverStatus, setServerStatus] = useState('checking'); // 'checking' | 'ok' | 'error'

    // Vérifier que le serveur backend est accessible
    useEffect(() => {
        fetch(`${API_BASE_URL}/health`)
            .then(res => res.json())
            .then(data => {
                if (data.status === 'ok' && data.api_key_configured) {
                    setServerStatus('ok');
                } else {
                    setServerStatus('error');
                    setError('Le serveur backend n\'a pas de clé API configurée.');
                }
            })
            .catch(() => {
                setServerStatus('error');
                setError('Impossible de joindre le serveur backend. Assurez-vous qu\'il est démarré (python3 api.py).');
            });
    }, []);

    const handleFileUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setError('');
        setCurrentFile(file.name);
        setProducts([]); // Reset previous results

        try {
            let content = "";
            let isImage = false;

            if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                const data = await file.arrayBuffer();
                const workbook = XLSX.read(data);
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                content = XLSX.utils.sheet_to_csv(sheet);
            } else if (file.name.endsWith('.docx')) {
                const arrayBuffer = await file.arrayBuffer();
                const result = await mammoth.extractRawText({ arrayBuffer });
                content = result.value;
            } else if (file.type.startsWith('image/')) {
                isImage = true;
                content = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result); // Base64 string
                    reader.readAsDataURL(file);
                });
            } else {
                // Text file fallback
                content = await file.text();
            }

            // Appeler le backend qui gère l'IA
            const result = await callBackendAPI(content, isImage);

            if (result.products) {
                setProducts(result.products);
            } else {
                throw new Error("Format de réponse invalide");
            }

        } catch (err) {
            console.error(err);
            setError("Erreur lors de l'analyse : " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-4 max-w-4xl">
            {/* Header */}
            <header className="flex justify-between items-center mb-8 no-print">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-hogust-primary rounded-full flex items-center justify-center text-white font-bold text-xl">H</div>
                    <div>
                        <h1 className="text-2xl font-bold text-hogust-secondary">Hogust Allergènes</h1>
                        <p className="text-sm text-slate-500">Générateur d'étiquettes conforme & sexy</p>
                    </div>
                </div>
                <div className="text-right">
                    {serverStatus === 'checking' && (
                        <span className="text-slate-400 text-sm font-medium">Connexion...</span>
                    )}
                    {serverStatus === 'ok' && (
                        <span className="text-green-600 text-sm font-medium">✓ Prêt</span>
                    )}
                    {serverStatus === 'error' && (
                        <span className="text-red-500 text-sm font-medium">⚠ Serveur offline</span>
                    )}
                </div>
            </header>

            {/* Main Content */}
            {serverStatus === 'ok' && (
                <main>
                    {/* File Upload Area */}
                    <div className="mb-8 no-print">
                        <label className={`block bg-white p-12 rounded-xl border-2 border-dashed transition-all cursor-pointer group relative ${loading ? 'opacity-50 pointer-events-none' : 'hover:border-hogust-primary border-slate-300'}`}>
                            <input type="file" className="hidden" onChange={handleFileUpload} accept=".xlsx,.xls,.docx,.txt,image/*" />
                            <div className="text-center">
                                {loading ? (
                                    <div className="animate-spin w-10 h-10 border-4 border-hogust-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                                ) : (
                                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-hogust-light transition-colors">
                                        <i data-lucide="upload" className="w-8 h-8 text-slate-400 group-hover:text-hogust-primary"></i>
                                    </div>
                                )}
                                <h3 className="text-lg font-medium text-slate-900">
                                    {loading ? "Analyse en cours..." : "Déposez vos fichiers ici"}
                                </h3>
                                <p className="text-slate-500 mt-1">
                                    {loading ? "L'IA lit votre recette" : "Excel, Word, ou Photos de recettes"}
                                </p>
                            </div>
                        </label>
                        {error && (
                            <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg border border-red-100 flex items-center gap-2">
                                <i data-lucide="alert-circle" className="w-5 h-5"></i>
                                {error}
                            </div>
                        )}
                    </div>

                    {/* Results Display */}
                    {products.length > 0 && (
                        <div className="animate-fade-in">
                            <div className="flex justify-between items-end mb-6 no-print">
                                <h2 className="text-xl font-bold text-slate-800">Résultats ({products.length})</h2>
                                <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors">
                                    <i data-lucide="printer" className="w-4 h-4"></i>
                                    Imprimer
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4">
                                {products.map((product, idx) => (
                                    <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 print:break-inside-avoid print:border-slate-300 print:shadow-none">
                                        <h3 className="text-lg font-bold text-hogust-secondary mb-3 border-b pb-2 border-slate-100">{product.name}</h3>

                                        <div className="mb-4">
                                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Allergènes présents</span>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {product.allergens && product.allergens.length > 0 ? (
                                                    product.allergens.map((allergen, i) => (
                                                        <span key={i} className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm font-medium border border-red-100 print:border-red-200">
                                                            {allergen}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium border border-green-100">
                                                        Aucun allergène détecté
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Optional: Add traces if the API returns them */}
                                        {product.traces && product.traces.length > 0 && (
                                            <div>
                                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Traces éventuelles</span>
                                                <div className="flex flex-wrap gap-2 mt-1">
                                                    {product.traces.map((trace, i) => (
                                                        <span key={i} className="text-sm text-slate-500 italic">
                                                            {trace}{i < product.traces.length - 1 ? ',' : ''}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </main>
            )}

            {/* Footer */}
            <footer className="mt-12 text-center text-slate-400 text-sm no-print">
                <p>Propulsé par Hogust & Antigravity</p>
            </footer>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

// Initialize Lucide icons
setTimeout(() => {
    if (window.lucide) window.lucide.createIcons();
}, 100);
