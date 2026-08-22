commit ebe70628b3d37e3ab21c2f731339c1fe6a8467bd
Author: WENTE57 <chuentecura57@gmail.com>
Date:   Wed Aug 19 20:22:41 2026 -0400

    implementacion de graficos, informes por rango etc

diff --git a/frontend/src/App.jsx b/frontend/src/App.jsx
index 7940bfb..f19d39d 100644
--- a/frontend/src/App.jsx
+++ b/frontend/src/App.jsx
@@ -127,6 +127,108 @@ const SearchableProductSelect = ({ options, value, onChange, placeholder = "-- B
   );
 };
 
+const AutocompleteGhostInput = ({
+  value,
+  onChange,
+  onSelectSuggestion,
+  suggestions = [],
+  placeholder = '',
+  className = 'form-input',
+  style = {},
+  disabled = false,
+  autoFocus = false,
+  required = false,
+  ...props
+}) => {
+  const [activeSuggestion, setActiveSuggestion] = useState('');
+
+  useEffect(() => {
+    if (!value) {
+      setActiveSuggestion('');
+      return;
+    }
+    const valLower = value.toLowerCase();
+    const match = suggestions.find(
+      sug => sug.toLowerCase().startsWith(valLower) && sug.toLowerCase() !== valLower
+    );
+    if (match) {
+      setActiveSuggestion(match);
+    } else {
+      setActiveSuggestion('');
+    }
+  }, [value, suggestions]);
+
+  const handleKeyDown = (e) => {
+    if ((e.key === 'Tab' || e.key === 'ArrowRight' || e.key === 'Enter') && activeSuggestion) {
+      e.preventDefault();
+      onSelectSuggestion(activeSuggestion);
+      setActiveSuggestion('');
+    }
+  };
+
+  return (
+    <div style={{ position: 'relative', width: '100%', display: 'inline-block' }}>
+      {activeSuggestion && (
+        <div
+          style={{
+            position: 'absolute',
+            left: 0,
+            top: 0,
+            right: 0,
+            bottom: 0,
+            padding: 'inherit',
+            margin: 'inherit',
+            border: '1.5px solid transparent',
+            fontFamily: 'inherit',
+            fontSize: 'inherit',
+            fontWeight: 'inherit',
+            lineHeight: 'inherit',
+            pointerEvents: 'none',
+            display: 'flex',
+            alignItems: 'center',
+            paddingLeft: '14px',
+            whiteSpace: 'nowrap',
+            overflow: 'hidden'
+          }}
+        >
+          <span style={{ color: 'transparent' }}>{value}</span>
+          <span style={{ color: 'rgba(128, 128, 128, 0.55)', opacity: 0.7 }}>
+            {activeSuggestion.slice(value.length)}
+          </span>
+          <span style={{
+            marginLeft: '8px',
+            fontSize: '0.65rem',
+            background: 'var(--glass-bg, rgba(255,255,255,0.1))',
+            padding: '2px 5px',
+            borderRadius: '4px',
+            color: 'var(--text-secondary)',
+            opacity: 0.8
+          }}>
+            [Tab]
+          </span>
+        </div>
+      )}
+      <input
+        type="text"
+        className={className}
+        placeholder={placeholder}
+        value={value}
+        onChange={(e) => onChange(e.target.value)}
+        onKeyDown={handleKeyDown}
+        disabled={disabled}
+        autoFocus={autoFocus}
+        required={required}
+        style={{
+          ...style,
+          background: 'var(--input-bg)'
+        }}
+        {...props}
+      />
+    </div>
+  );
+};
+
+
 const getPromoSubItems = (item) => {
   if (!item) return [];
   const subItems = [];
@@ -422,6 +524,19 @@ function App() {
   const [llegadaSuccess, setLlegadaSuccess] = useState('');
   const [llegadaLoading, setLlegadaLoading] = useState(false);
 
+  // Estados para consumo / merma
+  const [consumoIngId, setConsumoIngId] = useState('');
+  const [consumoCantidad, setConsumoCantidad] = useState('');
+  const [consumoError, setConsumoError] = useState('');
+  const [consumoSuccess, setConsumoSuccess] = useState('');
+  const [consumoLoading, setConsumoLoading] = useState(false);
+
+  // Estados para autocompletado y búsqueda
+  const [llegadaSearch, setLlegadaSearch] = useState('');
+  const [llegadaDropdownOpen, setLlegadaDropdownOpen] = useState(false);
+  const [consumoSearch, setConsumoSearch] = useState('');
+  const [consumoDropdownOpen, setConsumoDropdownOpen] = useState(false);
+
   // Filtro de categorías en Catálogo POS
   const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('Todos');
   const [paginaProductos, setPaginaProductos] = useState(1);
@@ -1920,31 +2035,133 @@ function App() {
     }
     setLlegadaError('');
     setLlegadaSuccess('');
-    setLlegadaLoading(true);
-    try {
-      const response = await fetch(`http://127.0.0.1:5000/api/ingredientes/${llegadaIngId}/llegada`, {
-        method: 'POST',
-        headers: {
-          'Content-Type': 'application/json'
-        },
-        body: JSON.stringify({ cantidad: cantNum })
-      });
-      const data = await response.json();
-      if (response.ok && data.success) {
-        setLlegadaSuccess(data.message);
-        setLlegadaCantidad('');
-        setLlegadaIngId('');
-        await cargarIngredientes();
-        setTimeout(() => setLlegadaSuccess(''), 3000);
-      } else {
-        setLlegadaError(data.message || 'Error al registrar llegada de materia prima.');
+
+    const ingrediente = listaIngredientes.find(ing => String(ing.id) === String(llegadaIngId));
+    const ingNombre = ingrediente ? ingrediente.nombre : 'Ingrediente';
+
+    abrirConfirmacion(
+      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', textAlign: 'left' }}>
+        <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
+          ¿Estás seguro que deseas registrar la llegada de materia prima?
+        </p>
+        <div style={{
+          background: 'rgba(22, 163, 74, 0.12)',
+          border: '1.5px solid #16a34a',
+          padding: '1rem',
+          borderRadius: '12px',
+          color: '#16a34a',
+          fontWeight: '800',
+          fontSize: '1.2rem',
+          textAlign: 'center',
+          boxShadow: '0 4px 12px rgba(22, 163, 74, 0.15)',
+          display: 'flex',
+          flexDirection: 'column',
+          gap: '0.25rem'
+        }}>
+          <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', opacity: 0.8, fontWeight: '700' }}>Se sumará al Stock:</span>
+          <span>➕ {cantNum.toLocaleString('es-CL')} de {ingNombre}</span>
+        </div>
+      </div>,
+      'Confirmar ingreso',
+      async () => {
+        setLlegadaLoading(true);
+        try {
+          const response = await fetch(`http://127.0.0.1:5000/api/ingredientes/${llegadaIngId}/llegada`, {
+            method: 'POST',
+            headers: { 'Content-Type': 'application/json' },
+            body: JSON.stringify({ cantidad: cantNum, turno_id: activeShift?.id || null })
+          });
+          const data = await response.json();
+          if (response.ok && data.success) {
+            setLlegadaSuccess(data.message);
+            setLlegadaCantidad('');
+            setLlegadaIngId('');
+            setLlegadaSearch('');
+            await cargarIngredientes();
+            setTimeout(() => setLlegadaSuccess(''), 3000);
+          } else {
+            setLlegadaError(data.message || 'Error al registrar llegada de materia prima.');
+          }
+        } catch (err) {
+          console.error(err);
+          setLlegadaError('Error al conectar con el servidor.');
+        } finally {
+          setLlegadaLoading(false);
+        }
       }
-    } catch (err) {
-      console.error(err);
-      setLlegadaError('Error al conectar con el servidor.');
-    } finally {
-      setLlegadaLoading(false);
+    );
+  };
+
+  const handleConsumoMerma = async (e) => {
+    e.preventDefault();
+    if (!consumoIngId) {
+      setConsumoError('Selecciona un ingrediente.');
+      setConsumoSuccess('');
+      return;
     }
+    const cantNum = parseFloat(consumoCantidad);
+    if (isNaN(cantNum) || cantNum <= 0) {
+      setConsumoError('Ingresa una cantidad válida mayor que 0.');
+      setConsumoSuccess('');
+      return;
+    }
+    setConsumoError('');
+    setConsumoSuccess('');
+    
+    const ingrediente = listaIngredientes.find(ing => String(ing.id) === String(consumoIngId));
+    const ingNombre = ingrediente ? ingrediente.nombre : 'Ingrediente';
+
+    abrirConfirmacion(
+      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', textAlign: 'left' }}>
+        <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
+          ¿Estás seguro que deseas registrar la merma / consumo de materia prima?
+        </p>
+        <div style={{
+          background: 'rgba(217, 119, 6, 0.12)',
+          border: '1.5px solid #d97706',
+          padding: '1rem',
+          borderRadius: '12px',
+          color: '#d97706',
+          fontWeight: '800',
+          fontSize: '1.2rem',
+          textAlign: 'center',
+          boxShadow: '0 4px 12px rgba(217, 119, 6, 0.15)',
+          display: 'flex',
+          flexDirection: 'column',
+          gap: '0.25rem'
+        }}>
+          <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', opacity: 0.8, fontWeight: '700' }}>Se descontará del Stock:</span>
+          <span>➖ {cantNum.toLocaleString('es-CL')} de {ingNombre}</span>
+        </div>
+      </div>,
+      'Confirmar merma',
+      async () => {
+        setConsumoLoading(true);
+        try {
+          const response = await fetch(`http://127.0.0.1:5000/api/ingredientes/${consumoIngId}/consumo`, {
+            method: 'POST',
+            headers: { 'Content-Type': 'application/json' },
+            body: JSON.stringify({ cantidad: cantNum, turno_id: activeShift?.id || null })
+          });
+          const data = await response.json();
+          if (response.ok && data.success) {
+            setConsumoSuccess(data.message);
+            setConsumoCantidad('');
+            setConsumoIngId('');
+            setConsumoSearch('');
+            await cargarIngredientes();
+            setTimeout(() => setConsumoSuccess(''), 3000);
+          } else {
+            setConsumoError(data.message || 'Error al registrar consumo.');
+          }
+        } catch (err) {
+          console.error(err);
+          setConsumoError('Error de red al conectar con el servidor.');
+        } finally {
+          setConsumoLoading(false);
+        }
+      }
+    );
   };
 
   // Intentar cargar la sesión del usuario si ya estaba logueado en esta ventana
@@ -2686,15 +2903,15 @@ function App() {
                     >
                       🎁 Promociones
                     </button>
-                    <button 
-                      onClick={() => setActiveTab('inventario')} 
-                      className={`nav-tab ${activeTab === 'inventario' ? 'active' : ''}`}
-                    >
-                      🥑 Inventario
-                    </button>
 
                   </>
                 )}
+                <button 
+                  onClick={() => setActiveTab('inventario')} 
+                  className={`nav-tab ${activeTab === 'inventario' ? 'active' : ''}`}
+                >
+                  🥑 Inventario
+                </button>
                 <button 
                   onClick={() => setActiveTab('historial')} 
                   className={`nav-tab ${activeTab === 'historial' ? 'active' : ''}`}
@@ -5583,7 +5800,8 @@ function App() {
                     {/* Columna Izquierda: Formularios de Registro/Edición y Entrada de Stock */}
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%', minHeight: 0, overflowY: 'auto' }}>
                       
-                      {/* Registro/Edición */}
+                      {/* Registro/Edición: solo para Administrador */}
+                      {user?.cargo?.toLowerCase() === 'administrador' && (
                       <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: '16px', padding: '1.25rem', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                         <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>
                           {editandoIngId ? '✏️ Editar Ingrediente' : '➕ Nuevo Ingrediente'}
@@ -5649,6 +5867,7 @@ function App() {
                           </div>
                         </form>
                       </div>
+                      )}
 
                       {/* Llegada de Materia Prima */}
                       <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: '16px', padding: '1.25rem', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
@@ -5670,21 +5889,85 @@ function App() {
                         <form onSubmit={handleLlegadaMateriaPrima} className="admin-form" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                           <div className="form-group" style={{ marginBottom: 0 }}>
                             <label className="form-label">Seleccionar Materia Prima</label>
-                            <div className="input-wrapper">
-                              <select
-                                className="form-input form-select"
-                                value={llegadaIngId}
-                                onChange={(e) => setLlegadaIngId(e.target.value)}
+                            <div style={{ position: 'relative', width: '100%' }}>
+                              <AutocompleteGhostInput
+                                placeholder="🔍 Escribe para buscar ingrediente..."
+                                value={llegadaSearch}
+                                suggestions={listaIngredientes.map(ing => ing.nombre)}
+                                onSelectSuggestion={(sug) => {
+                                  setLlegadaSearch(sug);
+                                  const matched = listaIngredientes.find(ing => ing.nombre.toLowerCase() === sug.toLowerCase());
+                                  if (matched) {
+                                    setLlegadaIngId(matched.id);
+                                    setLlegadaDropdownOpen(false);
+                                  }
+                                }}
+                                onChange={(val) => {
+                                  setLlegadaSearch(val);
+                                  setLlegadaDropdownOpen(true);
+                                  const matched = listaIngredientes.find(ing => ing.nombre.toLowerCase() === val.toLowerCase());
+                                  if (matched) {
+                                    setLlegadaIngId(matched.id);
+                                  } else {
+                                    setLlegadaIngId('');
+                                  }
+                                }}
                                 disabled={llegadaLoading}
+                                onFocus={() => setLlegadaDropdownOpen(true)}
+                                onBlur={() => setTimeout(() => setLlegadaDropdownOpen(false), 250)}
                                 style={{ color: 'var(--text-primary)', background: 'var(--input-bg)' }}
-                              >
-                                <option value="">-- Selecciona un ingrediente --</option>
-                                {listaIngredientes.map((ing) => (
-                                  <option key={ing.id} value={ing.id}>
-                                    {ing.nombre} (actual: {parseFloat(ing.stock)})
-                                  </option>
-                                ))}
-                              </select>
+                              />
+                              {llegadaDropdownOpen && (
+                                <div style={{
+                                  position: 'absolute',
+                                  top: '100%',
+                                  left: 0,
+                                  right: 0,
+                                  zIndex: 100,
+                                  background: 'var(--glass-bg, #1a1515)',
+                                  backdropFilter: 'blur(10px)',
+                                  border: '1.5px solid var(--glass-border)',
+                                  borderRadius: '12px',
+                                  maxHeight: '200px',
+                                  overflowY: 'auto',
+                                  marginTop: '4px',
+                                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
+                                  padding: '4px'
+                                }}>
+                                  {listaIngredientes
+                                    .filter(ing => ing.nombre.toLowerCase().includes(llegadaSearch.toLowerCase()))
+                                    .map(ing => (
+                                      <div
+                                        key={ing.id}
+                                        onClick={() => {
+                                          setLlegadaIngId(ing.id);
+                                          setLlegadaSearch(ing.nombre);
+                                          setLlegadaDropdownOpen(false);
+                                        }}
+                                        style={{
+                                          padding: '8px 12px',
+                                          cursor: 'pointer',
+                                          borderRadius: '8px',
+                                          color: 'var(--text-primary)',
+                                          fontSize: '0.85rem',
+                                          display: 'flex',
+                                          justifyContent: 'space-between',
+                                          alignItems: 'center',
+                                          transition: 'background 0.2s',
+                                          background: String(llegadaIngId) === String(ing.id) ? 'rgba(255,255,255,0.08)' : 'transparent'
+                                        }}
+                                      >
+                                        <span style={{ fontWeight: '600' }}>{ing.nombre}</span>
+                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Stock: {parseFloat(ing.stock)}</span>
+                                      </div>
+                                    ))}
+                                  {listaIngredientes.filter(ing => ing.nombre.toLowerCase().includes(llegadaSearch.toLowerCase())).length === 0 && (
+                                    <div style={{ padding: '8px 12px', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
+                                      No se encontraron coincidencias
+                                    </div>
+                                  )}
+                                </div>
+                              )}
                             </div>
                           </div>
 
@@ -5710,6 +5993,135 @@ function App() {
                         </form>
                       </div>
 
+                      {/* Consumo / Merma */}
+                      <div style={{ background: 'rgba(255, 140, 0, 0.06)', borderRadius: '16px', padding: '1.25rem', border: '1px solid rgba(217, 119, 6, 0.3)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
+                        <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.25rem', color: '#d97706' }}>
+                          📉 Registro de Consumo / Merma
+                        </h4>
+                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
+                          Descuenta stock por merma, consumo interno u otras bajas.
+                        </p>
+
+                        {consumoError && (
+                          <div className="alert alert-error" style={{ marginBottom: '0.5rem', padding: '0.5rem 0.75rem' }}>
+                            <span>{consumoError}</span>
+                          </div>
+                        )}
+                        {consumoSuccess && (
+                          <div className="alert alert-success" style={{ marginBottom: '0.5rem', padding: '0.5rem 0.75rem' }}>
+                            <span>{consumoSuccess}</span>
+                          </div>
+                        )}
+
+                        <form onSubmit={handleConsumoMerma} className="admin-form" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
+                          <div className="form-group" style={{ marginBottom: 0 }}>
+                            <label className="form-label">Seleccionar Ingrediente</label>
+                            <div style={{ position: 'relative', width: '100%' }}>
+                              <AutocompleteGhostInput
+                                placeholder="🔍 Escribe para buscar ingrediente..."
+                                value={consumoSearch}
+                                suggestions={listaIngredientes.map(ing => ing.nombre)}
+                                onSelectSuggestion={(sug) => {
+                                  setConsumoSearch(sug);
+                                  const matched = listaIngredientes.find(ing => ing.nombre.toLowerCase() === sug.toLowerCase());
+                                  if (matched) {
+                                    setConsumoIngId(matched.id);
+                                    setConsumoDropdownOpen(false);
+                                  }
+                                }}
+                                onChange={(val) => {
+                                  setConsumoSearch(val);
+                                  setConsumoDropdownOpen(true);
+                                  const matched = listaIngredientes.find(ing => ing.nombre.toLowerCase() === val.toLowerCase());
+                                  if (matched) {
+                                    setConsumoIngId(matched.id);
+                                  } else {
+                                    setConsumoIngId('');
+                                  }
+                                }}
+                                disabled={consumoLoading}
+                                onFocus={() => setConsumoDropdownOpen(true)}
+                                onBlur={() => setTimeout(() => setConsumoDropdownOpen(false), 250)}
+                                style={{ color: 'var(--text-primary)', background: 'var(--input-bg)' }}
+                              />
+                              {consumoDropdownOpen && (
+                                <div style={{
+                                  position: 'absolute',
+                                  top: '100%',
+                                  left: 0,
+                                  right: 0,
+                                  zIndex: 100,
+                                  background: 'var(--glass-bg, #1a1515)',
+                                  backdropFilter: 'blur(10px)',
+                                  border: '1.5px solid var(--glass-border)',
+                                  borderRadius: '12px',
+                                  maxHeight: '200px',
+                                  overflowY: 'auto',
+                                  marginTop: '4px',
+                                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
+                                  padding: '4px'
+                                }}>
+                                  {listaIngredientes
+                                    .filter(ing => ing.nombre.toLowerCase().includes(consumoSearch.toLowerCase()))
+                                    .map(ing => (
+                                      <div
+                                        key={ing.id}
+                                        onClick={() => {
+                                          setConsumoIngId(ing.id);
+                                          setConsumoSearch(ing.nombre);
+                                          setConsumoDropdownOpen(false);
+                                        }}
+                                        style={{
+                                          padding: '8px 12px',
+                                          cursor: 'pointer',
+                                          borderRadius: '8px',
+                                          color: 'var(--text-primary)',
+                                          fontSize: '0.85rem',
+                                          display: 'flex',
+                                          justifyContent: 'space-between',
+                                          alignItems: 'center',
+                                          transition: 'background 0.2s',
+                                          background: String(consumoIngId) === String(ing.id) ? 'rgba(255,255,255,0.08)' : 'transparent'
+                                        }}
+                                      >
+                                        <span style={{ fontWeight: '600' }}>{ing.nombre}</span>
+                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Stock: {parseFloat(ing.stock)}</span>
+                                      </div>
+                                    ))}
+                                  {listaIngredientes.filter(ing => ing.nombre.toLowerCase().includes(consumoSearch.toLowerCase())).length === 0 && (
+                                    <div style={{ padding: '8px 12px', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
+                                      No se encontraron coincidencias
+                                    </div>
+                                  )}
+                                </div>
+                              )}
+                            </div>
+                          </div>
+
+                          <div className="form-group" style={{ marginBottom: 0 }}>
+                            <label className="form-label">Cantidad a Descontar</label>
+                            <div className="input-wrapper">
+                              <input
+                                type="number"
+                                step="any"
+                                className="form-input"
+                                placeholder="Ej. 50"
+                                value={consumoCantidad}
+                                onChange={(e) => setConsumoCantidad(e.target.value)}
+                                disabled={consumoLoading}
+                              />
+                              <span className="input-icon">➖</span>
+                            </div>
+                          </div>
+
+                          <button type="submit"
+                            style={{ width: '100%', marginTop: '0.5rem', background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)', color: '#fff', border: 'none', borderRadius: '12px', padding: '0.75rem', fontSize: '0.95rem', fontWeight: '700', cursor: 'pointer', opacity: consumoLoading ? 0.6 : 1 }}
+                            disabled={consumoLoading}>
+                            {consumoLoading ? 'Descontando...' : '⚠️ Registrar Merma'}
+                          </button>
+                        </form>
+                      </div>
+
                     </div>
 
                     {/* Columna Derecha: Tabla de Ingredientes y cantidades */}
@@ -5727,7 +6139,9 @@ function App() {
                               <tr style={{ borderBottom: '2px solid var(--glass-border)' }}>
                                 <th style={{ padding: '0.65rem 0.5rem', color: 'var(--text-primary)', fontWeight: '700' }}>Ingrediente</th>
                                 <th style={{ padding: '0.65rem 0.5rem', color: 'var(--text-primary)', fontWeight: '700', textAlign: 'right' }}>Stock Disponible</th>
-                                <th style={{ padding: '0.65rem 0.5rem', color: 'var(--text-primary)', fontWeight: '700', textAlign: 'center' }}>Acciones</th>
+                                {user?.cargo?.toLowerCase() === 'administrador' && (
+                                  <th style={{ padding: '0.65rem 0.5rem', color: 'var(--text-primary)', fontWeight: '700', textAlign: 'center' }}>Acciones</th>
+                                )}
                               </tr>
                             </thead>
                             <tbody>
@@ -5744,24 +6158,26 @@ function App() {
                                       {isLowStock && <span style={{ marginLeft: '0.35rem', fontSize: '0.85rem' }} title="Stock bajo">⚠️</span>}
                                     </td>
                                     <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
-                                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
-                                        <button
-                                          type="button"
-                                          onClick={() => iniciarEdicionIng(ing)}
-                                          style={{ background: 'var(--btn-secondary-bg)', border: '1px solid var(--glass-border)', cursor: 'pointer', padding: '0.45rem 0.6rem', borderRadius: '10px' }}
-                                          title="Editar ingrediente / stock"
-                                        >
-                                          ✏️
-                                        </button>
-                                        <button
-                                          type="button"
-                                          onClick={() => handleDeleteIngredient(ing.id, ing.nombre)}
-                                          style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', cursor: 'pointer', padding: '0.45rem 0.6rem', borderRadius: '10px' }}
-                                          title="Eliminar ingrediente"
-                                        >
-                                          🗑️
-                                        </button>
-                                      </div>
+                                      {user?.cargo?.toLowerCase() === 'administrador' && (
+                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
+                                          <button
+                                            type="button"
+                                            onClick={() => iniciarEdicionIng(ing)}
+                                            style={{ background: 'var(--btn-secondary-bg)', border: '1px solid var(--glass-border)', cursor: 'pointer', padding: '0.45rem 0.6rem', borderRadius: '10px' }}
+                                            title="Editar ingrediente / stock"
+                                          >
+                                            ✏️
+                                          </button>
+                                          <button
+                                            type="button"
+                                            onClick={() => handleDeleteIngredient(ing.id, ing.nombre)}
+                                            style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', cursor: 'pointer', padding: '0.45rem 0.6rem', borderRadius: '10px' }}
+                                            title="Eliminar ingrediente"
+                                          >
+                                            🗑️
+                                          </button>
+                                        </div>
+                                      )}
                                     </td>
                                   </tr>
                                 );
@@ -6016,12 +6432,12 @@ function App() {
                   Por favor, ingresa el nombre del cliente para este pedido:
                 </p>
                 <div className="form-group" style={{ margin: 0 }}>
-                  <input
-                    type="text"
-                    className="form-input"
+                  <AutocompleteGhostInput
                     placeholder="Nombre del Cliente (Ej. Carlos Muñoz)"
                     value={clienteNombre}
-                    onChange={(e) => setClienteNombre(e.target.value)}
+                    suggestions={Array.from(new Set(historialPedidos.map(p => p.cliente_nombre).filter(Boolean)))}
+                    onSelectSuggestion={(sug) => setClienteNombre(sug)}
+                    onChange={(val) => setClienteNombre(val)}
                     autoFocus
                     required
                   />
@@ -6672,7 +7088,7 @@ function App() {
               <h3 className="custom-modal-title">{modalConfig.title}</h3>
             </div>
             <div className="custom-modal-body">
-              <p className="custom-modal-message">{modalConfig.message}</p>
+              <div className="custom-modal-message" style={{ whiteSpace: 'pre-wrap' }}>{modalConfig.message}</div>
             </div>
             <div className="custom-modal-actions">
               {!modalConfig.isAlert && (
