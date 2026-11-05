import { useEffect, useMemo, useState } from 'react';
import { Archive, ArrowDownRight, ArrowUpRight, Box, ChevronDown, ChevronRight, ClipboardList, Edit3, Eye, LayoutDashboard, LogOut, Menu, Package, Palette, Plus, Save, Search, Settings, ShieldCheck, ShoppingBag, Store as StoreIcon, Trash2, Users, X } from 'lucide-react';
import { firebaseConfigured, auth, db, functions } from './firebase';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { collection, doc, onSnapshot, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { seedStores, type Store, type Product } from './models';
type Page = 'overview' | 'products' | 'inventory' | 'branding' | 'settings';
type Notice = {
    message: string;
    kind: 'ok' | 'error';
} | null;
const key = 'tcg-merchant-demo-v1';
function readDemo(): Store[] { try {
    const x = localStorage.getItem(key);
    return x ? JSON.parse(x) as Store[] : seedStores;
}
catch {
    return seedStores;
} }
const money = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
export default function App() {
    const [stores, setStores] = useState<Store[]>(readDemo);
    const [activeId, setActiveId] = useState('demo-north');
    const [page, setPage] = useState<Page>('overview');
    const [query, setQuery] = useState('');
    const [notice, setNotice] = useState<Notice>(null);
    const [showProduct, setShowProduct] = useState(false);
    const [editing, setCurrentEdit] = useState<Product | undefined>();
    const [showCreate, setShowCreate] = useState(false);
    const [mobileMenu, setMobileMenu] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [loaded, setLoaded] = useState(!firebaseConfigured);
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [authError, setAuthError] = useState('');
    const [authWorking, setAuthWorking] = useState(false);
    useEffect(() => { if (!firebaseConfigured || !auth)
        return; return onAuthStateChanged(auth, u => { setUser(u); setLoaded(true); }); }, []);
    useEffect(() => { if (!firebaseConfigured)
        localStorage.setItem(key, JSON.stringify(stores)); }, [stores]);
    useEffect(() => { if (!firebaseConfigured || !db || !user) {
        if (firebaseConfigured)
            setStores([]);
        return;
    } const database = db; const unsub = onSnapshot(collection(database, 'users', user.uid, 'memberships'), async (snap) => { try {
        const records = await Promise.all(snap.docs.map(async (member) => { const storeSnap = await getDoc(doc(database, 'stores', member.id)); return storeSnap.exists() ? { id: storeSnap.id, ...storeSnap.data(), products: [] } as Store : null; }));
        setStores(prev => records.filter((s): s is Store => s !== null).map(s => ({ ...s, products: prev.find(p => p.id === s.id)?.products ?? [] })));
    }
    catch (e) {
        setNotice({ kind: 'error', message: (e as Error).message });
    } }, e => setNotice({ kind: 'error', message: e.message })); return unsub; }, [user]);
    useEffect(() => { if (!firebaseConfigured || !db || !user || !activeId || !stores.some(s => s.id === activeId))
        return; const unsub = onSnapshot(collection(db, 'stores', activeId, 'products'), snap => setStores(prev => prev.map(s => s.id === activeId ? { ...s, products: snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)) } : s)), e => setNotice({ kind: 'error', message: e.message })); return unsub; }, [activeId, user, stores.map(s => s.id).join(',')]);
    useEffect(() => { if (stores.length && !stores.find(s => s.id === activeId))
        setActiveId(stores[0].id); }, [stores, activeId]);
    const store = stores.find(s => s.id === activeId);
    const products = store?.products ?? [];
    const stats = useMemo(() => ({ total: products.length, published: products.filter(p => p.published).length, low: products.filter(p => p.quantity < 5).length, units: products.reduce((sum, p) => sum + p.quantity, 0) }), [products]);
    const alert = (message: string, kind: 'ok' | 'error' = 'ok') => { setNotice({ message, kind }); };
    async function updateStore(patch: Partial<Store>) { if (!store)
        return; try {
        if (firebaseConfigured) {
            if (!db)
                throw Error('Firebase unavailable');
            await updateDoc(doc(db, 'stores', store.id), patch);
        }
        else
            setStores(prev => prev.map(s => s.id === activeId ? { ...s, ...patch } : s));
        alert('Changes saved successfully');
    }
    catch (e) {
        alert((e as Error).message, 'error');
    } }
    async function saveProduct(p: Product) { if (!store)
        return; try {
        if (firebaseConfigured) {
            if (!db)
                throw Error('Firebase unavailable');
            await setDoc(doc(db, 'stores', store.id, 'products', p.id), p);
        }
        else
            setStores(prev => prev.map(s => s.id === activeId ? { ...s, products: s.products.some(x => x.id === p.id) ? s.products.map(x => x.id === p.id ? p : x) : [...s.products, p] } : s));
        setShowProduct(false);
        alert('Product saved');
    }
    catch (e) {
        alert((e as Error).message, 'error');
    } }
    async function removeProduct(id: string) { if (!store || !confirm('Delete this product?'))
        return; try {
        if (firebaseConfigured) {
            throw Error('Deletion is intentionally not enabled in Firebase mode yet.');
        }
        setStores(prev => prev.map(s => s.id === activeId ? { ...s, products: s.products.filter(p => p.id !== id) } : s));
        alert('Product removed');
    }
    catch (e) {
        alert((e as Error).message, 'error');
    } }
    async function createStore(name: string, email: string) { const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); if (!slug) {
        alert('Enter a valid store name', 'error');
        return;
    } try {
        if (firebaseConfigured) {
            if (!functions)
                throw Error('Cloud Functions unavailable');
            const fn = httpsCallable<{
                name: string;
                email: string;
            }, {
                storeId: string;
            }>(functions, 'createMerchantStore');
            const result = await fn({ name, email });
            setActiveId(result.data.storeId);
        }
        else {
            const id = 'demo-' + crypto.randomUUID();
            const newStore: Store = { id, name, slug, email, description: '', theme: { primary: '#4d71e8', accent: '#95b4ff', surface: '#ffffff' }, products: [] };
            setStores(prev => [...prev, newStore]);
            setActiveId(id);
        }
        setShowCreate(false);
        setPage('overview');
        alert('New merchant store created');
    }
    catch (e) {
        alert((e as Error).message, 'error');
    } }
    async function login(register: boolean) { if (!auth)
        return; setAuthWorking(true); setAuthError(''); try {
        if (register)
            await createUserWithEmailAndPassword(auth, loginEmail, loginPassword);
        else
            await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
    }
    catch (e) {
        setAuthError((e as Error).message);
    }
    finally {
        setAuthWorking(false);
    } }
    if (!loaded)
        return <main className="center">Loading authentication…</main>;
    if (firebaseConfigured && !user)
        return <main className="login-page"><div className="login-panel"><div className="brand dark"><span className="brand-icon"><ShoppingBag size={23}/></span><span>cardforge<span className="brand-dot">.</span></span></div><h1>Merchant Console</h1><p>Sign in to manage your store. Create an account if this is your first visit.</p><form onSubmit={e => { e.preventDefault(); void login(false); }}><label>Email<input type="email" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="merchant@example.com"/></label><label>Password<input type="password" required minLength={6} value={loginPassword} onChange={e => setLoginPassword(e.target.value)}/></label>{authError && <p className="error">{authError}</p>}<button className="primary full" disabled={authWorking} type="submit">Sign in</button><button className="secondary full" disabled={authWorking} type="button" onClick={() => void login(true)}>Create account</button></form><p className="small-note">Firebase mode. A new account has no store until you create one.</p></div></main>;
    const menu: [
        Page,
        typeof LayoutDashboard,
        string
    ][] = [['overview', LayoutDashboard, 'Overview'], ['products', Package, 'Products'], ['inventory', Box, 'Inventory'], ['branding', Palette, 'Branding'], ['settings', Settings, 'Store settings']];
    return <div className="shell">
    <aside className={'sidebar ' + (mobileMenu ? 'mobile-open' : '')}><div className="brand"><span className="brand-icon"><ShoppingBag size={22}/></span><span>cardforge<span className="brand-dot">.</span></span></div><div className="workspace-label">WORKSPACE</div><button className="store-picker" onClick={() => setShowCreate(true)}><div className="store-avatar" style={{ background: store?.theme.primary || '#4d71e8' }}>{store?.name?.[0] ?? '+'}</div><span><strong>{store?.name || 'Create store'}</strong><small>Merchant workspace</small></span><ChevronDown size={15}/></button><div className="nav-label">MANAGEMENT</div><nav>{menu.map(([id, Icon, label]) => <button key={id} className={'nav-item ' + (page === id ? 'selected' : '')} onClick={() => { setPage(id); setMobileMenu(false); }}><Icon size={18}/>{label}{page === id && <ChevronRight className="push" size={15}/>}</button>)}</nav><div className="sidebar-bottom"><div className="sidebar-tip"><ShieldCheck size={20}/><strong>Tenant-aware by design</strong><span>Store data stays separated.</span></div><button className="nav-item" onClick={() => { if (firebaseConfigured && auth)
        void signOut(auth);
    else
        alert('Demo mode: no account session'); }}><LogOut size={17}/>{firebaseConfigured ? 'Sign out' : 'Demo workspace'}</button></div></aside>
    <div className="main-wrap"><header className="topbar"><button className="mobile-toggle" aria-label="Open navigation" onClick={() => setMobileMenu(!mobileMenu)}><Menu size={22}/></button><div className="breadcrumbs">Workspace <ChevronRight size={14}/> <strong>{page === 'overview' ? 'Overview' : menu.find(m => m[0] === page)?.[2]}</strong></div><div className="top-right"><span className={'mode-pill ' + (firebaseConfigured ? 'connected' : '')}>{firebaseConfigured ? 'FIREBASE' : 'LOCAL DEMO'}</span><div className="profile">{user?.email?.[0].toUpperCase() ?? 'M'}</div></div></header>
      <main className="content">{notice && <div className={'toast ' + notice.kind}>{notice.message}<button aria-label="Dismiss" onClick={() => setNotice(null)}><X size={16}/></button></div>}
        {!store ? <section className="empty"><StoreIcon size={35}/><h2>Create your first store</h2><p>Every merchant has their own configuration and catalog.</p><button className="primary" onClick={() => setShowCreate(true)}><Plus size={17}/> Create store</button></section> : <>
        {page === 'overview' && <><div className="heading-row"><div><div className="eyebrow">MERCHANT DASHBOARD</div><h1>Good to see you <span className="wave">✦</span></h1><p className="subhead">Here's what's happening at <strong>{store.name}</strong>.</p></div><button className="secondary" onClick={() => setShowCreate(true)}><StoreIcon size={16}/> Switch / create store</button></div><div className="stats-grid"><Stat label="Total products" value={stats.total} icon={<Package size={19}/>} foot="Items in your catalog"/><Stat label="Published" value={stats.published} icon={<Eye size={19}/>} foot="Visible to customers"/><Stat label="Units in stock" value={stats.units} icon={<Archive size={19}/>} foot="Across all products"/><Stat label="Low stock alerts" value={stats.low} icon={<ClipboardList size={19}/>} foot="Fewer than 5 remaining" warn/></div><div className="columns"><section className="panel"><div className="panel-header"><div><h2>Recent products</h2><p>Your latest catalog items</p></div><button className="text-button" onClick={() => setPage('products')}>View all <ArrowUpRight size={15}/></button></div><ProductTable products={products.slice(0, 5)} onEdit={() => { setPage('products'); }}/></section><section className="panel quick-panel"><div className="panel-header"><div><h2>Quick actions</h2><p>Manage your storefront</p></div></div><button onClick={() => setShowProduct(true)}><span className="quick-icon blue"><Plus size={19}/></span><span><strong>Add new product</strong><small>Create a catalog item</small></span><ChevronRight size={17}/></button><button onClick={() => setPage('branding')}><span className="quick-icon peach"><Palette size={19}/></span><span><strong>Customize branding</strong><small>Change store colors</small></span><ChevronRight size={17}/></button><button onClick={() => setPage('settings')}><span className="quick-icon green"><Settings size={19}/></span><span><strong>Store information</strong><small>Edit merchant settings</small></span><ChevronRight size={17}/></button></section></div><div className="info-banner"><ShieldCheck size={20}/><div><strong>Built for multiple merchants</strong><p>Switch to another store to see a completely separate product catalog. Firebase mode additionally enforces permissions with Firestore rules.</p></div></div></>}
        {page === 'products' && <><PageHeading eyebrow="CATALOG" title="Products" subtitle="Add and manage products in this store." action={<button className="primary" onClick={() => setShowProduct(true)}><Plus size={16}/> Add product</button>}/><section className="panel"><div className="table-tools"><div className="searchbox"><Search size={17}/><input aria-label="Search products" placeholder="Search by name, game or SKU" value={query} onChange={e => setQuery(e.target.value)}/></div><span className="count-pill">{products.length} products</span></div><table className="table"><thead><tr><th>PRODUCT</th><th>GAME / CATEGORY</th><th>PRICE</th><th>STOCK</th><th>STATUS</th><th></th></tr></thead><tbody>{products.filter(p => [p.name, p.game, p.sku].some(t => t.toLowerCase().includes(query.toLowerCase()))).map(p => <tr key={p.id}><td><strong>{p.name}</strong><small>{p.sku}</small></td><td>{p.game}</td><td>{money(p.price)}</td><td>{p.quantity}</td><td><span className={'status ' + (p.published ? 'live' : 'draft')}>{p.published ? 'Published' : 'Draft'}</span></td><td><button className="icon-button" title="Edit product" onClick={() => { setEditing(p); setShowProduct(true); }}><Edit3 size={16}/></button><button className="icon-button" title="Delete product" onClick={() => void removeProduct(p.id)}><Trash2 size={16}/></button></td></tr>)}</tbody></table>{products.length === 0 && <p className="table-empty">No products yet. Add your first product.</p>}</section></>}
        {page === 'inventory' && <><PageHeading eyebrow="OPERATIONS" title="Inventory" subtitle="Review quantities and identify items that need restocking."/><section className="panel"><table className="table"><thead><tr><th>PRODUCT</th><th>SKU</th><th>QUANTITY</th><th>STOCK HEALTH</th></tr></thead><tbody>{products.map(p => <tr key={p.id}><td><strong>{p.name}</strong></td><td>{p.sku}</td><td>{p.quantity}</td><td><span className={'status ' + (p.quantity < 5 ? 'low' : 'live')}>{p.quantity === 0 ? 'Out of stock' : p.quantity < 5 ? 'Low stock' : 'Healthy'}</span></td></tr>)}</tbody></table>{!products.length && <p className="table-empty">Inventory will appear when you add products.</p>}</section><p className="muted-hint">Edit product quantities from the Products section.</p></>}
        {page === 'branding' && <Branding store={store} save={updateStore}/>}
        {page === 'settings' && <SettingsPage store={store} save={updateStore}/>}
        </>}
      </main></div>
      {showCreate && <CreateStoreModal stores={stores} choose={id => { setActiveId(id); setShowCreate(false); setPage('overview'); }} create={createStore} close={() => setShowCreate(false)}/>}
      {showProduct && <ProductModal product={editing} close={() => { setShowProduct(false); setEditing(undefined); }} save={async (p) => { await saveProduct(p); setEditing(undefined); }}/>}
    </div>;
    function setEditing(p: Product | undefined) { setCurrentEdit(p); }
}
function Stat({ label, value, icon, foot, warn = false }: {
    label: string;
    value: number;
    icon: React.ReactNode;
    foot: string;
    warn?: boolean;
}) { return <div className="stat-card"><div className="stat-top"><span>{label}</span><div className={'stat-icon ' + (warn ? 'warn' : '')}>{icon}</div></div><strong>{value}</strong><small>{foot}</small></div>; }
function PageHeading({ eyebrow, title, subtitle, action }: {
    eyebrow: string;
    title: string;
    subtitle: string;
    action?: React.ReactNode;
}) { return <div className="heading-row"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p className="subhead">{subtitle}</p></div>{action}</div>; }
function ProductTable({ products, onEdit }: {
    products: Product[];
    onEdit: () => void;
}) { return <table className="table"><thead><tr><th>PRODUCT</th><th>CATEGORY</th><th>PRICE</th><th>STATUS</th></tr></thead><tbody>{products.map(p => <tr key={p.id}><td><strong>{p.name}</strong><small>{p.sku}</small></td><td>{p.game}</td><td>{money(p.price)}</td><td><span className={'status ' + (p.published ? 'live' : 'draft')}>{p.published ? 'Published' : 'Draft'}</span></td></tr>)}</tbody></table>; }
function Branding({ store, save }: {
    store: Store;
    save: (p: Partial<Store>) => Promise<void>;
}) { const [theme, setTheme] = useState(store.theme); useEffect(() => setTheme(store.theme), [store.id, store.theme]); return <><PageHeading eyebrow="DESIGN SYSTEM" title="Store branding" subtitle="Customize how customers see your store." action={<button className="primary" onClick={() => void save({ theme })}><Save size={16}/> Save branding</button>}/><div className="branding-grid"><section className="panel form-panel"><h2>Brand colors</h2><p>Change these tokens without changing application code.</p>{(['primary', 'accent', 'surface'] as const).map(key => <label className="color-field" key={key}><span>{key[0].toUpperCase() + key.slice(1)} color</span><div className="color-control"><input aria-label={key + ' color'} type="color" value={theme[key]} onChange={e => setTheme(x => ({ ...x, [key]: e.target.value }))}/><code>{theme[key]}</code></div></label>)}<p className="muted-hint">Demo styling preview only. Production theme contrast checks are a later enhancement.</p></section><section className="panel preview-panel"><h2>Live brand preview</h2><div className="phone-mock" style={{ background: theme.surface }}><div className="phone-top" style={{ background: theme.primary }}><small>YOUR STORE</small><h2>{store.name}</h2><p>Collect what you love.</p></div><div className="preview-inner"><div className="preview-line"/><div className="preview-line shorter"/><div className="preview-products"><div /><div /></div><button style={{ background: theme.primary, color: '#fff' }}>Explore products <ArrowUpRight size={16}/></button><div className="preview-accent" style={{ background: theme.accent }}/></div></div></section></div></>; }
function SettingsPage({ store, save }: {
    store: Store;
    save: (p: Partial<Store>) => Promise<void>;
}) { const [name, setName] = useState(store.name), [email, setEmail] = useState(store.email), [description, setDescription] = useState(store.description); useEffect(() => { setName(store.name); setEmail(store.email); setDescription(store.description); }, [store.id]); return <><PageHeading eyebrow="STORE PROFILE" title="Store information" subtitle="Manage your public-facing merchant details."/><section className="panel form-panel settings-panel"><form onSubmit={e => { e.preventDefault(); void save({ name, email, description }); }}><label>Store name<input required maxLength={80} value={name} onChange={e => setName(e.target.value)}/></label><label>Support email<input required type="email" value={email} onChange={e => setEmail(e.target.value)}/></label><label>Store description<textarea rows={4} maxLength={500} value={description} onChange={e => setDescription(e.target.value)}/></label><label>Store ID<input disabled value={store.id}/></label><button className="primary" type="submit"><Save size={16}/> Save store information</button></form></section></>; }
function CreateStoreModal({ stores, choose, create, close }: {
    stores: Store[];
    choose: (id: string) => void;
    create: (name: string, email: string) => Promise<void>;
    close: () => void;
}) { const [name, setName] = useState(''), [email, setEmail] = useState(''); return <div className="overlay" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget)
    close(); }}><section className="modal" role="dialog" aria-modal="true" aria-label="Store selector"><div className="modal-header"><div><h2>Merchant workspaces</h2><p>Choose an existing store or create another.</p></div><button className="icon-button" aria-label="Close" onClick={close}><X size={20}/></button></div><div className="store-options">{stores.map(s => <button key={s.id} onClick={() => choose(s.id)}><span className="store-avatar" style={{ background: s.theme.primary }}>{s.name[0]}</span><strong>{s.name}</strong><ChevronRight size={17}/></button>)}</div><form className="modal-form" onSubmit={e => { e.preventDefault(); void create(name, email); }}><h3>Create another store</h3><label>Store name<input required placeholder="Example: Riverside Cards" maxLength={80} value={name} onChange={e => setName(e.target.value)}/></label><label>Support email<input required type="email" placeholder="support@example.com" value={email} onChange={e => setEmail(e.target.value)}/></label><button className="primary full" type="submit"><Plus size={16}/> Create store</button></form>{firebaseConfigured && <p className="small-note">In Firebase mode, store provisioning is validated by a Cloud Function.</p>}</section></div>; }
function ProductModal({ product, close, save }: {
    product?: Product;
    close: () => void;
    save: (p: Product) => Promise<void>;
}) { const [name, setName] = useState(product?.name ?? ''), [game, setGame] = useState(product?.game ?? 'Pokémon'), [sku, setSku] = useState(product?.sku ?? ''), [price, setPrice] = useState(String(product?.price ?? 0)), [quantity, setQuantity] = useState(String(product?.quantity ?? 0)), [published, setPublished] = useState(product?.published ?? true); return <div className="overlay" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget)
    close(); }}><section className="modal" role="dialog" aria-modal="true" aria-label="Product editor"><div className="modal-header"><div><h2>{product ? 'Edit product' : 'Add product'}</h2><p>Changes apply only to this merchant.</p></div><button className="icon-button" aria-label="Close" onClick={close}><X size={20}/></button></div><form className="modal-form" onSubmit={e => { e.preventDefault(); void save({ id: product?.id ?? crypto.randomUUID(), name: name.trim(), game, sku: sku.trim(), price: Number(price), quantity: Number(quantity), published }); }}><label>Product name<input required maxLength={100} value={name} onChange={e => setName(e.target.value)}/></label><label>Game / category<select value={game} onChange={e => setGame(e.target.value)}><option>Pokémon</option><option>Magic: The Gathering</option><option>Yu-Gi-Oh!</option><option>One Piece</option><option>Disney Lorcana</option><option>Sports Cards</option><option>Accessories</option><option>Other</option></select></label><label>SKU<input required maxLength={40} value={sku} onChange={e => setSku(e.target.value)}/></label><div className="two-fields"><label>Price (USD)<input required type="number" step="0.01" min="0" value={price} onChange={e => setPrice(e.target.value)}/></label><label>Quantity<input required type="number" min="0" step="1" value={quantity} onChange={e => setQuantity(e.target.value)}/></label></div><label className="check"><input type="checkbox" checked={published} onChange={e => setPublished(e.target.checked)}/> Published</label><button className="primary full" type="submit"><Save size={16}/> Save product</button></form></section></div>; }
