import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [nombre, setNombre] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Estados para creación de usuario
  const [regNombre, setRegNombre] = useState('');
  const [regContrasena, setRegContrasena] = useState('');
  const [regCargo, setRegCargo] = useState('Usuario');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  // Estados para productos y pedidos
  const [productos, setProductos] = useState([]);
  const [productosLoading, setProductosLoading] = useState(false);
  const [productosError, setProductosError] = useState('');
  const [pedido, setPedido] = useState([]);
  const [pedidoConfirmado, setPedidoConfirmado] = useState(false);
  const [activeTab, setActiveTab] = useState('pedidos'); // 'pedidos' o 'usuarios' (solo admin)
  // Estados para administración de usuarios
  const [usuarios, setUsuarios] = useState([]);
  const [usuariosLoading, setUsuariosLoading] = useState(false);
  const [usuariosError, setUsuariosError] = useState('');

  // Estados para administración de productos
  const [prodNombre, setProdNombre] = useState('');
  const [prodPrecio, setProdPrecio] = useState('');
  const [prodImagen, setProdImagen] = useState('🍔');
  const [prodCategoria, setProdCategoria] = useState('');
  const [prodError, setProdError] = useState('');
  const [prodSuccess, setProdSuccess] = useState('');
  const [prodLoading, setProdLoading] = useState(false);

  // Estados para ingredientes en productos
  const [listaIngredientes, setListaIngredientes] = useState([]);
  const [ingredientesSeleccionados, setIngredientesSeleccionados] = useState([]);
  const [currIngredienteId, setCurrIngredienteId] = useState('');
  const [currIngredienteCantidad, setCurrIngredienteCantidad] = useState('');

  // Filtro de categorías en Catálogo POS
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('Todos');

  // Estados para creación dinámica de categorías
  const [listaCategorias, setListaCategorias] = useState([]);
  const [nuevaCategoriaNombre, setNuevaCategoriaNombre] = useState('');
  const [catSuccess, setCatSuccess] = useState('');
  const [catError, setCatError] = useState('');
  const [editandoCatId, setEditandoCatId] = useState(null);

  // Estado para alertas y confirmaciones personalizadas (reemplaza alert/confirm nativos de Electron)
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: 'Aviso',
    message: '',
    confirmText: 'Aceptar',
    cancelText: 'Cancelar',
    isAlert: false,
    onConfirm: null,
    onCancel: null
  });

  const abrirAlerta = (mensaje, titulo = 'Aviso') => {
    setModalConfig({
      isOpen: true,
      title: titulo,
      message: mensaje,
      confirmText: 'Aceptar',
      cancelText: 'Cancelar',
      isAlert: true,
      onConfirm: () => cerrarModal(),
      onCancel: null
    });
  };

  const abrirConfirmacion = (mensaje, titulo, accionConfirmar) => {
    setModalConfig({
      isOpen: true,
      title: titulo,
      message: mensaje,
      confirmText: 'Aceptar',
      cancelText: 'Cancelar',
      isAlert: false,
      onConfirm: () => {
        accionConfirmar();
        cerrarModal();
      },
      onCancel: () => cerrarModal()
    });
  };

  const cerrarModal = () => {
    setModalConfig(prev => ({ ...prev, isOpen: false }));
  };

  const cargarProductos = async () => {
    setProductosLoading(true);
    setProductosError('');
    try {
      const response = await fetch('http://localhost:5000/api/productos');
      const data = await response.json();
      if (response.ok && data.success) {
        setProductos(data.productos);
      } else {
        setProductosError(data.message || 'Error al obtener productos.');
      }
    } catch (err) {
      console.error(err);
      setProductosError('No se pudo conectar al servidor para obtener los productos.');
    } finally {
      setProductosLoading(false);
    }
  };

  const cargarUsuarios = async () => {
    setUsuariosLoading(true);
    setUsuariosError('');
    try {
      const response = await fetch('http://localhost:5000/api/usuarios');
      const data = await response.json();
      if (response.ok && data.success) {
        setUsuarios(data.usuarios);
      } else {
        setUsuariosError(data.message || 'Error al obtener usuarios.');
      }
    } catch (err) {
      console.error(err);
      setUsuariosError('No se pudo conectar al servidor para obtener los usuarios.');
    } finally {
      setUsuariosLoading(false);
    }
  };

  const cargarIngredientes = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/ingredientes');
      const data = await response.json();
      if (response.ok && data.success) {
        setListaIngredientes(data.ingredientes);
      }
    } catch (err) {
      console.error('Error al cargar ingredientes:', err);
    }
  };

  const agregarIngredienteAlForm = (e) => {
    e.preventDefault();
    if (!currIngredienteId || !currIngredienteCantidad) {
      abrirAlerta('Por favor, selecciona un ingrediente y escribe la cantidad.', 'Faltan Datos');
      return;
    }
    const cantidadNum = parseFloat(currIngredienteCantidad);
    if (isNaN(cantidadNum) || cantidadNum <= 0) {
      abrirAlerta('La cantidad debe ser un número mayor a 0.', 'Cantidad Inválida');
      return;
    }
    if (ingredientesSeleccionados.some(i => i.ingrediente_id === parseInt(currIngredienteId))) {
      abrirAlerta('Este ingrediente ya está agregado. Si deseas cambiar la cantidad, quítalo y agrégalo de nuevo.', 'Ingrediente Duplicado');
      return;
    }
    const ingredienteObj = listaIngredientes.find(i => i.id === parseInt(currIngredienteId));
    if (!ingredienteObj) return;

    setIngredientesSeleccionados([
      ...ingredientesSeleccionados,
      {
        ingrediente_id: ingredienteObj.id,
        nombre: ingredienteObj.nombre,
        cantidad: cantidadNum
      }
    ]);
    setCurrIngredienteCantidad('');
  };

  const quitarIngredienteDelForm = (ingredienteId) => {
    setIngredientesSeleccionados(
      ingredientesSeleccionados.filter(i => i.ingrediente_id !== ingredienteId)
    );
  };

  const cargarCategorias = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/categorias');
      const data = await response.json();
      if (response.ok && data.success) {
        setListaCategorias(data.categorias);
        if (data.categorias.length > 0 && !prodCategoria) {
          setProdCategoria(data.categorias[0].nombre);
        }
      }
    } catch (err) {
      console.error('Error al cargar categorías:', err);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!nuevaCategoriaNombre.trim()) {
      setCatError('Escribe el nombre de la categoría.');
      setCatSuccess('');
      return;
    }
    setCatError('');
    setCatSuccess('');
    try {
      const response = await fetch('http://localhost:5000/api/categorias', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nombre: nuevaCategoriaNombre.trim() }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setCatSuccess(data.message);
        setNuevaCategoriaNombre('');
        cargarCategorias();
        setProdCategoria(data.categoria.nombre);
        setTimeout(() => {
          setCatSuccess('');
        }, 3000);
      } else {
        setCatError(data.message || 'Error al crear categoría.');
      }
    } catch (err) {
      console.error(err);
      setCatError('Error de red al conectar con el servidor.');
    }
  };

  const iniciarEdicionCat = (cat) => {
    setEditandoCatId(cat.id);
    setNuevaCategoriaNombre(cat.nombre);
    setCatError('');
    setCatSuccess('');
  };

  const cancelarEdicionCat = () => {
    setEditandoCatId(null);
    setNuevaCategoriaNombre('');
    setCatError('');
    setCatSuccess('');
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    if (!nuevaCategoriaNombre.trim()) {
      setCatError('Escribe el nombre de la categoría.');
      setCatSuccess('');
      return;
    }
    setCatError('');
    setCatSuccess('');
    try {
      const response = await fetch(`http://localhost:5000/api/categorias/${editandoCatId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nombre: nuevaCategoriaNombre.trim() }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setCatSuccess(data.message);
        setNuevaCategoriaNombre('');
        setEditandoCatId(null);
        await cargarCategorias();
        await cargarProductos();
        setTimeout(() => {
          setCatSuccess('');
        }, 3000);
      } else {
        setCatError(data.message || 'Error al actualizar categoría.');
      }
    } catch (err) {
      console.error(err);
      setCatError('Error de red al conectar con el servidor.');
    }
  };

  const handleDeleteCategory = (catId, catNombre) => {
    abrirConfirmacion(
      `¿Estás seguro de que deseas eliminar la categoría "${catNombre}"? Los productos de esta categoría pasarán a ser "Otros".`,
      'Confirmar Eliminación',
      async () => {
        setCatError('');
        setCatSuccess('');
        try {
          const response = await fetch(`http://localhost:5000/api/categorias/${catId}`, {
            method: 'DELETE',
          });
          const data = await response.json();
          if (response.ok && data.success) {
            setCatSuccess(data.message);
            if (editandoCatId === catId) {
              setEditandoCatId(null);
              setNuevaCategoriaNombre('');
            }
            await cargarCategorias();
            await cargarProductos();
            setTimeout(() => {
              setCatSuccess('');
            }, 3000);
          } else {
            setCatError(data.message || 'Error al eliminar categoría.');
          }
        } catch (err) {
          console.error(err);
          setCatError('Error de red al conectar con el servidor.');
        }
      }
    );
  };

  const handleDeleteUser = (userId, userName) => {
    if (userId === user.id) {
      abrirAlerta('No puedes eliminarte a ti mismo.', 'Acción no permitida');
      return;
    }
    abrirConfirmacion(
      `¿Estás seguro de que deseas eliminar al usuario "${userName}"?`,
      'Confirmar Eliminación',
      async () => {
        try {
          const response = await fetch(`http://localhost:5000/api/usuarios/${userId}`, {
            method: 'DELETE'
          });
          const data = await response.json();
          if (response.ok && data.success) {
            cargarUsuarios();
            setRegSuccess(`Usuario "${userName}" eliminado correctamente.`);
            setRegError('');
          } else {
            setRegError(data.message || 'Error al eliminar el usuario.');
          }
        } catch (err) {
          console.error(err);
          setRegError('Error al conectar con el servidor para eliminar al usuario.');
        }
      }
    );
  };

  const handleRegisterProduct = async (e) => {
    e.preventDefault();
    if (!prodNombre.trim() || !prodPrecio.toString().trim()) {
      setProdError('Por favor, completa todos los campos obligatorios (nombre y precio).');
      setProdSuccess('');
      return;
    }
    if (listaCategorias.length === 0) {
      setProdError('Debes crear al menos una categoría antes de registrar un producto.');
      setProdSuccess('');
      return;
    }

    setProdLoading(true);
    setProdError('');
    setProdSuccess('');

    try {
      const response = await fetch('http://localhost:5000/api/productos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: prodNombre.trim(),
          precio: parseFloat(prodPrecio),
          imagen: prodImagen.trim() || '🍔',
          categoria: prodCategoria.trim(),
          ingredientes: ingredientesSeleccionados.map(i => ({
            ingrediente_id: i.ingrediente_id,
            cantidad: i.cantidad
          }))
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setProdSuccess(data.message || 'Producto creado correctamente.');
        setProdNombre('');
        setProdPrecio('');
        setProdImagen('🍔');
        setProdCategoria(listaCategorias[0]?.nombre || '');
        setIngredientesSeleccionados([]);
        setCurrIngredienteId('');
        setCurrIngredienteCantidad('');
        cargarProductos();
      } else {
        setProdError(data.message || 'Error al crear el producto.');
      }
    } catch (err) {
      console.error(err);
      setProdError('Error al conectar con el servidor.');
    } finally {
      setProdLoading(false);
    }
  };

  const handleDeleteProduct = (productId, productName) => {
    abrirConfirmacion(
      `¿Estás seguro de que deseas eliminar el producto "${productName}"?`,
      'Confirmar Eliminación',
      async () => {
        try {
          const response = await fetch(`http://localhost:5000/api/productos/${productId}`, {
            method: 'DELETE',
          });
          const data = await response.json();
          if (response.ok && data.success) {
            cargarProductos();
            setProdSuccess(`Producto "${productName}" eliminado correctamente.`);
            setProdError('');
          } else {
            setProdError(data.message || 'Error al eliminar el producto.');
          }
        } catch (err) {
          console.error(err);
          setProdError('Error al conectar con el servidor para eliminar el producto.');
        }
      }
    );
  };

  // Intentar cargar la sesión del usuario si ya estaba logueado en esta ventana
  useEffect(() => {
    const savedUser = sessionStorage.getItem('calibre_session');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        sessionStorage.removeItem('calibre_session');
      }
    }
  }, []);

  useEffect(() => {
    if (user) {
      cargarProductos();
      cargarCategorias();
    }
  }, [user]);

  useEffect(() => {
    if (user && activeTab === 'usuarios') {
      cargarUsuarios();
    }
  }, [user, activeTab]);

  useEffect(() => {
    if (user && activeTab === 'productos') {
      cargarIngredientes();
      cargarCategorias();
    }
  }, [user, activeTab]);

  const agregarAlPedido = (producto) => {
    setPedido((prev) => {
      const existe = prev.find((item) => item.id === producto.id);
      if (existe) {
        return prev.map((item) =>
          item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item
        );
      }
      return [...prev, { ...producto, cantidad: 1 }];
    });
  };

  const actualizarCantidad = (productoId, delta) => {
    setPedido((prev) =>
      prev
        .map((item) => {
          if (item.id === productoId) {
            const nuevaCantidad = item.cantidad + delta;
            return nuevaCantidad > 0 ? { ...item, cantidad: nuevaCantidad } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const eliminarDelPedido = (productoId) => {
    setPedido((prev) => prev.filter((item) => item.id !== productoId));
  };

  const handleConfirmarPedido = () => {
    if (pedido.length === 0) return;
    setPedidoConfirmado(true);
    setPedido([]);
    setTimeout(() => {
      setPedidoConfirmado(false);
    }, 4000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!nombre.trim() || !contrasena.trim()) {
      setError('Por favor, completa todos los campos.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: nombre.trim(),
          contrasena: contrasena.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setUser(data.user);
        sessionStorage.setItem('calibre_session', JSON.stringify(data.user));
      } else {
        setError(data.message || 'Error al iniciar sesión.');
      }
    } catch (err) {
      console.error(err);
      setError('No se pudo conectar con el servidor. ¿Está corriendo el backend?');
    } finally {
      setLoading(false);
    }
  };

    const handleLogout = () => {
    setUser(null);
    sessionStorage.removeItem('calibre_session');
    setNombre('');
    setContrasena('');
    setError('');
    setRegNombre('');
    setRegContrasena('');
    setRegCargo('Usuario');
    setRegError('');
    setRegSuccess('');
    // Limpiar estados de pedidos y productos
    setPedido([]);
    setProductos([]);
    setActiveTab('pedidos');
    setPedidoConfirmado(false);
    // Limpiar estados de creación de productos
    setProdNombre('');
    setProdPrecio('');
    setProdImagen('🍔');
    setProdCategoria('');
    setProdError('');
    setProdSuccess('');
    // Limpiar estados de ingredientes
    setListaIngredientes([]);
    setIngredientesSeleccionados([]);
    setCurrIngredienteId('');
    setCurrIngredienteCantidad('');
    // Limpiar filtro y categorías
    setCategoriaSeleccionada('Todos');
    setListaCategorias([]);
    setNuevaCategoriaNombre('');
    setCatSuccess('');
    setCatError('');
    setEditandoCatId(null);
  };

  const handleRegisterUser = async (e) => {
    e.preventDefault();
    if (!regNombre.trim() || !regContrasena.trim()) {
      setRegError('Por favor, completa todos los campos.');
      setRegSuccess('');
      return;
    }

    setRegLoading(true);
    setRegError('');
    setRegSuccess('');

    try {
      const response = await fetch('http://localhost:5000/api/usuarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: regNombre.trim(),
          contrasena: regContrasena.trim(),
          cargo: regCargo,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setRegSuccess(data.message || 'Usuario creado correctamente.');
        setRegNombre('');
        setRegContrasena('');
        setRegCargo('Usuario');
        cargarUsuarios();
      } else {
        setRegError(data.message || 'Error al crear el usuario.');
      }
    } catch (err) {
      console.error(err);
      setRegError('Error al conectar con el servidor.');
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <>
      {/* Elementos decorativos de fondo (blobs animados) */}
      <div className="bg-blobs">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      <main className="app-container">
        {!user ? (
          /* Formulario de Login */
          <div className="glass-card">
            <div className="card-header">
              <span className="logo-icon">🍔</span>
              <h1 className="card-title">Calibre</h1>
              <p className="card-subtitle">Inicia sesión para acceder al sistema</p>
            </div>

            {error && (
              <div className="alert alert-error">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label className="form-label" htmlFor="username">Nombre de Usuario</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    id="username"
                    className="form-input"
                    placeholder="Ej. Juan Pérez"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    disabled={loading}
                    autoFocus
                  />
                  <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="password">Contraseña</label>
                <div className="input-wrapper">
                  <input
                    type="password"
                    id="password"
                    className="form-input"
                    placeholder="••••••••"
                    value={contrasena}
                    onChange={(e) => setContrasena(e.target.value)}
                    disabled={loading}
                  />
                  <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>
              </div>

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? (
                  <>
                    <div className="spinner"></div>
                    <span>Ingresando...</span>
                  </>
                ) : (
                  <span>Iniciar Sesión</span>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* Dashboard del Usuario */
          <div className="glass-card dashboard-card pos-card">
            <div className="dashboard-header">
              <div className="user-profile">
                <div className="avatar">
                  {user.nombre.charAt(0).toUpperCase()}
                </div>
                <div className="welcome-info">
                  <h2>Bienvenido, {user.nombre}</h2>
                  <p>
                    Sesión iniciada como:{' '}
                    <span className={`badge ${user.cargo.toLowerCase() === 'administrador' ? 'badge-admin' : ''}`}>
                      {user.cargo}
                    </span>
                  </p>
                </div>
              </div>

              {/* Navegación para Administrador */}
              {user.cargo.toLowerCase() === 'administrador' && (
                <div className="nav-tabs">
                  <button 
                    onClick={() => setActiveTab('pedidos')} 
                    className={`nav-tab ${activeTab === 'pedidos' ? 'active' : ''}`}
                  >
                    🛒 Pedidos
                  </button>
                  <button 
                    onClick={() => setActiveTab('usuarios')} 
                    className={`nav-tab ${activeTab === 'usuarios' ? 'active' : ''}`}
                  >
                    👥 Usuarios
                  </button>
                  <button 
                    onClick={() => setActiveTab('productos')} 
                    className={`nav-tab ${activeTab === 'productos' ? 'active' : ''}`}
                  >
                    📦 Productos
                  </button>
                </div>
              )}

              <button onClick={handleLogout} className="btn-secondary">
                Cerrar Sesión
              </button>
            </div>

            {/* PESTAÑA DE PEDIDOS (Visible para todos) */}
            {activeTab === 'pedidos' && (
              <div className="pos-container">
                {/* Columna Izquierda: Catálogo de Productos */}
                <div className="catalog-section">
                  <h3 className="section-title">🍔 Catálogo de Productos</h3>
                  <p className="section-subtitle">Haz clic en un producto para agregarlo al pedido</p>
                  
                  {productosLoading && (
                    <div className="loading-container">
                      <div className="spinner"></div>
                      <span>Cargando catálogo...</span>
                    </div>
                  )}

                  {productosError && (
                    <div className="alert alert-error">
                      <span>{productosError}</span>
                      <button onClick={cargarProductos} className="btn-retry">Reintentar</button>
                    </div>
                  )}

                  {!productosLoading && !productosError && productos.length === 0 && (
                    <p className="empty-catalog">No hay productos registrados en la base de datos.</p>
                  )}

                  {/* Filtro de Categorías */}
                  <div className="category-filters">
                    {['Todos', ...listaCategorias.map(c => c.nombre)].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setCategoriaSeleccionada(cat)}
                        className={`category-filter-btn ${categoriaSeleccionada === cat ? 'active' : ''}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <div className="products-grid">
                    {productos
                      .filter((prod) => categoriaSeleccionada === 'Todos' || prod.categoria === categoriaSeleccionada)
                      .map((prod) => (
                      <div key={prod.id} className="product-card" onClick={() => agregarAlPedido(prod)}>
                        <div className="product-emoji">{prod.imagen || '🍔'}</div>
                        <div className="product-info">
                          <h4 className="product-name">{prod.nombre}</h4>
                          {prod.ingredientes && prod.ingredientes.length > 0 && (
                            <div className="product-card-ingredients">
                              {prod.ingredientes.map(ing => (
                                <span key={ing.id} className="card-ingredient-tag">
                                  {ing.nombre} ({ing.cantidad})
                                </span>
                              ))}
                            </div>
                          )}
                          <span className="product-price">
                            ${parseFloat(prod.precio).toLocaleString('es-CL', { minimumFractionDigits: 0 })}
                          </span>
                        </div>
                        <button className="btn-add">
                          <span>+</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Columna Derecha: Ticket de Pedido */}
                <div className="order-section">
                  <h3 className="section-title">📝 Detalle del Pedido</h3>
                  
                  {pedidoConfirmado && (
                    <div className="alert alert-success animate-pop">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                      <span>¡Pedido realizado con éxito! (En memoria)</span>
                    </div>
                  )}

                  <div className="order-ticket">
                    {pedido.length === 0 ? (
                      <div className="empty-order">
                        <span className="empty-icon">🛒</span>
                        <p>No hay elementos en el pedido actual.</p>
                        <p className="empty-help">Selecciona productos de la izquierda para comenzar.</p>
                      </div>
                    ) : (
                      <>
                        <div className="order-items">
                          {pedido.map((item) => (
                            <div key={item.id} className="order-item">
                              <span className="item-emoji">{item.imagen || '🍔'}</span>
                              <div className="item-details">
                                <span className="item-name">{item.nombre}</span>
                                <span className="item-price">
                                  ${(parseFloat(item.precio) * item.cantidad).toLocaleString('es-CL', { minimumFractionDigits: 0 })}
                                </span>
                              </div>
                              <div className="qty-controls">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); actualizarCantidad(item.id, -1); }} 
                                  className="btn-qty"
                                >
                                  -
                                </button>
                                <span className="item-qty">{item.cantidad}</span>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); actualizarCantidad(item.id, 1); }} 
                                  className="btn-qty"
                                >
                                  +
                                </button>
                              </div>
                              <button 
                                onClick={(e) => { e.stopPropagation(); eliminarDelPedido(item.id); }} 
                                className="btn-delete"
                                title="Eliminar del pedido"
                              >
                                &times;
                              </button>
                            </div>
                          ))}
                        </div>

                        <div className="order-summary">
                          <div className="total-row">
                            <span>Total:</span>
                            <span className="total-amount">
                              ${pedido.reduce((acc, curr) => acc + (parseFloat(curr.precio) * curr.cantidad), 0).toLocaleString('es-CL', { minimumFractionDigits: 0 })}
                            </span>
                          </div>
                          <button onClick={handleConfirmarPedido} className="btn-primary btn-checkout">
                            Confirmar Pedido
                          </button>
                          <button onClick={() => setPedido([])} className="btn-secondary btn-clear-order">
                            Limpiar Pedido
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* PESTAÑA DE ADMINISTRACIÓN (Solo Admin) */}
            {activeTab === 'usuarios' && user.cargo.toLowerCase() === 'administrador' && (
              <div className="admin-tab-content animate-fade">
                <div className="admin-grid-layout">
                  {/* Formulario de creación */}
                  <div className="admin-section">
                    <h3 className="section-title">👥 Registrar Nuevo Usuario</h3>
                    <p className="section-subtitle">Registra un nuevo miembro del equipo en el sistema</p>
                    
                    {regError && (
                      <div className="alert alert-error">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="8" x2="12" y2="12"></line>
                          <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        <span>{regError}</span>
                      </div>
                    )}
                    {regSuccess && (
                      <div className="alert alert-success">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                          <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                        <span>{regSuccess}</span>
                      </div>
                    )}

                    <form onSubmit={handleRegisterUser} className="admin-form">
                      <div className="form-group">
                        <label className="form-label" htmlFor="regNombre">Nombre de Usuario</label>
                        <div className="input-wrapper">
                          <input
                            type="text"
                            id="regNombre"
                            className="form-input"
                            placeholder="Ej. María Gómez"
                            value={regNombre}
                            onChange={(e) => setRegNombre(e.target.value)}
                            disabled={regLoading}
                          />
                          <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                          </svg>
                        </div>
                      </div>
                      
                      <div className="form-group">
                        <label className="form-label" htmlFor="regContrasena">Contraseña</label>
                        <div className="input-wrapper">
                          <input
                            type="password"
                            id="regContrasena"
                            className="form-input"
                            placeholder="Mínimo 4 caracteres"
                            value={regContrasena}
                            onChange={(e) => setRegContrasena(e.target.value)}
                            disabled={regLoading}
                          />
                          <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                          </svg>
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label" htmlFor="regCargo">Rol / Cargo</label>
                        <div className="input-wrapper">
                          <select
                            id="regCargo"
                            className="form-input form-select"
                            value={regCargo}
                            onChange={(e) => setRegCargo(e.target.value)}
                            disabled={regLoading}
                          >
                            <option value="Usuario">Usuario (Operario)</option>
                            <option value="Administrador">Administrador</option>
                          </select>
                          <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                          </svg>
                        </div>
                      </div>

                      <button type="submit" className="btn-primary" disabled={regLoading}>
                        {regLoading ? (
                          <>
                            <div className="spinner"></div>
                            <span>Registrando...</span>
                          </>
                        ) : (
                          <span>Registrar Nuevo Usuario</span>
                        )}
                      </button>
                    </form>
                  </div>

                  {/* Listado de usuarios */}
                  <div className="admin-section users-list-section">
                    <h3 className="section-title">📋 Usuarios Registrados</h3>
                    <p className="section-subtitle font-sm">Lista de miembros con acceso al sistema</p>

                    {usuariosLoading && (
                      <div className="loading-container">
                        <div className="spinner"></div>
                        <span>Cargando lista de usuarios...</span>
                      </div>
                    )}

                    {usuariosError && (
                      <div className="alert alert-error">
                        <span>{usuariosError}</span>
                      </div>
                    )}

                    {!usuariosLoading && !usuariosError && (
                      <div className="users-list-container">
                        {usuarios.map((u) => (
                          <div key={u.id} className="user-list-item">
                            <div className="user-list-info">
                              <span className="user-list-name">{u.nombre}</span>
                              <span className={`badge ${u.cargo.toLowerCase() === 'administrador' ? 'badge-admin' : ''}`}>
                                {u.cargo}
                              </span>
                            </div>
                            <button
                              onClick={() => handleDeleteUser(u.id, u.nombre)}
                              className="btn-delete-user"
                              disabled={u.id === user.id}
                              title={u.id === user.id ? "No puedes eliminarte a ti mismo" : "Eliminar usuario"}
                            >
                              🗑️
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* PESTAÑA DE PRODUCTOS (Solo Admin) */}
            {activeTab === 'productos' && user.cargo.toLowerCase() === 'administrador' && (
              <div className="admin-tab-content animate-fade">
                <div className="admin-grid-layout">
                  {/* Formulario de creación */}
                  <div className="admin-section">
                    <h3 className="section-title">📦 Registrar Nuevo Producto</h3>
                    <p className="section-subtitle">Registra un nuevo plato o artículo al catálogo</p>
                    
                    {prodError && (
                      <div className="alert alert-error">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="8" x2="12" y2="12"></line>
                          <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        <span>{prodError}</span>
                      </div>
                    )}
                    {prodSuccess && (
                      <div className="alert alert-success">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                          <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                        <span>{prodSuccess}</span>
                      </div>
                    )}

                    <form onSubmit={handleRegisterProduct} className="admin-form">
                      <div className="form-group">
                        <label className="form-label" htmlFor="prodNombre">Nombre del Producto</label>
                        <div className="input-wrapper">
                          <input
                            type="text"
                            id="prodNombre"
                            className="form-input"
                            placeholder="Ej. Hamburguesa Doble"
                            value={prodNombre}
                            onChange={(e) => setProdNombre(e.target.value)}
                            disabled={prodLoading}
                          />
                          <span className="input-icon">🍔</span>
                        </div>
                      </div>
                      
                      <div className="form-group">
                        <label className="form-label" htmlFor="prodPrecio">Precio ($)</label>
                        <div className="input-wrapper">
                          <input
                            type="number"
                            id="prodPrecio"
                            className="form-input"
                            placeholder="Ej. 5500"
                            value={prodPrecio}
                            onChange={(e) => setProdPrecio(e.target.value)}
                            disabled={prodLoading}
                          />
                          <span className="input-icon">💲</span>
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label" htmlFor="prodImagen">Emoji Representativo</label>
                        <div className="input-wrapper">
                          <select
                            id="prodImagen"
                            className="form-input form-select"
                            value={prodImagen}
                            onChange={(e) => setProdImagen(e.target.value)}
                            disabled={prodLoading}
                          >
                            <option value="🍔">🍔 Hamburguesa</option>
                            <option value="🧀">🧀 Queso / Cheeseburger</option>
                            <option value="🍟">🍟 Papas Fritas</option>
                            <option value="🥤">🥤 Bebida</option>
                            <option value="🧅">🧅 Aros de Cebolla</option>
                            <option value="🍕">🍕 Pizza</option>
                            <option value="🌮">🌮 Taco</option>
                            <option value="🌭">🌭 Hot Dog / Completo</option>
                            <option value="🍦">🍦 Helado</option>
                            <option value="🍗">🍗 Pollo Frito</option>
                          </select>
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label" htmlFor="prodCategoria">Categoría</label>
                        <div className="input-wrapper">
                          <select
                            id="prodCategoria"
                            className="form-input form-select"
                            value={prodCategoria}
                            onChange={(e) => setProdCategoria(e.target.value)}
                            disabled={prodLoading}
                          >
                            {listaCategorias.map(cat => (
                              <option key={cat.id} value={cat.nombre}>
                                {cat.nombre}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Crear / Editar Categoría */}
                      <div className="form-group">
                        <label className="form-label">
                          {editandoCatId ? '✏️ Editar Categoría' : 'Crear Nueva Categoría'}
                        </label>
                        <div className="ingredients-selector-row">
                          <input
                            type="text"
                            className="form-input"
                            style={{ paddingLeft: '1rem' }}
                            placeholder="Ej. Postres"
                            value={nuevaCategoriaNombre}
                            onChange={(e) => setNuevaCategoriaNombre(e.target.value)}
                            disabled={prodLoading}
                          />
                          {editandoCatId ? (
                            <div style={{ display: 'flex', gap: '0.25rem', flex: 1.5 }}>
                              <button
                                type="button"
                                onClick={handleUpdateCategory}
                                className="btn-primary"
                                style={{ flex: 1, padding: '0.6rem 0', fontSize: '0.85rem' }}
                              >
                                Guardar
                              </button>
                              <button
                                type="button"
                                onClick={cancelarEdicionCat}
                                className="btn-secondary"
                                style={{ flex: 1, padding: '0.6rem 0', fontSize: '0.85rem' }}
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={handleCreateCategory}
                              className="btn-secondary btn-add-ingredient"
                              disabled={prodLoading}
                            >
                              + Crear
                            </button>
                          )}
                        </div>
                        {catError && <p className="cat-error-msg">{catError}</p>}
                        {catSuccess && <p className="cat-success-msg">{catSuccess}</p>}

                        {/* Listado de categorías registradas */}
                        {listaCategorias.length > 0 && (
                          <div className="admin-categories-list-container">
                            <span className="selected-title">Categorías Registradas:</span>
                            <div className="admin-categories-mini-list">
                              {listaCategorias.map((cat) => (
                                <div key={cat.id} className="admin-category-item">
                                  <span className="admin-category-item-name">{cat.nombre}</span>
                                  <div className="admin-category-item-actions">
                                    <button
                                      type="button"
                                      onClick={() => iniciarEdicionCat(cat)}
                                      className="btn-edit-cat-icon"
                                      title="Editar categoría"
                                    >
                                      ✏️
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteCategory(cat.id, cat.nombre)}
                                      className="btn-delete-cat-icon"
                                      title="Eliminar categoría"
                                    >
                                      🗑️
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="form-group">
                        <label className="form-label">Ingredientes del Producto</label>
                        <div className="ingredients-selector-row">
                          <select
                            className="form-input form-select ingrediente-select"
                            value={currIngredienteId}
                            onChange={(e) => setCurrIngredienteId(e.target.value)}
                            disabled={prodLoading}
                          >
                            <option value="">-- Seleccionar Ingrediente --</option>
                            {listaIngredientes.map((ing) => (
                              <option key={ing.id} value={ing.id}>
                                {ing.nombre}
                              </option>
                            ))}
                          </select>
                          <input
                            type="number"
                            step="any"
                            className="form-input ingrediente-cantidad-input"
                            placeholder="Cant."
                            value={currIngredienteCantidad}
                            onChange={(e) => setCurrIngredienteCantidad(e.target.value)}
                            disabled={prodLoading}
                          />
                          <button
                            type="button"
                            onClick={agregarIngredienteAlForm}
                            className="btn-secondary btn-add-ingredient"
                            disabled={prodLoading}
                          >
                            + Agregar
                          </button>
                        </div>

                        {/* Listado de ingredientes seleccionados */}
                        {ingredientesSeleccionados.length > 0 && (
                          <div className="selected-ingredients-container">
                            <span className="selected-title">Ingredientes seleccionados:</span>
                            <div className="selected-ingredients-list">
                              {ingredientesSeleccionados.map((ing) => (
                                <span key={ing.ingrediente_id} className="selected-ingredient-badge">
                                  {ing.nombre}: <strong>{ing.cantidad}</strong>
                                  <button
                                    type="button"
                                    onClick={() => quitarIngredienteDelForm(ing.ingrediente_id)}
                                    className="btn-remove-badge"
                                    title="Quitar ingrediente"
                                  >
                                    &times;
                                  </button>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <button type="submit" className="btn-primary" disabled={prodLoading}>
                        {prodLoading ? (
                          <>
                            <div className="spinner"></div>
                            <span>Registrando...</span>
                          </>
                        ) : (
                          <span>Registrar Producto</span>
                        )}
                      </button>
                    </form>
                  </div>

                  {/* Listado de productos */}
                  <div className="admin-section users-list-section">
                    <h3 className="section-title">📋 Catálogo de Productos</h3>
                    <p className="section-subtitle font-sm">Lista de productos disponibles para pedidos</p>

                    {productosLoading && (
                      <div className="loading-container">
                        <div className="spinner"></div>
                        <span>Cargando productos...</span>
                      </div>
                    )}

                    {productosError && (
                      <div className="alert alert-error">
                        <span>{productosError}</span>
                      </div>
                    )}

                    {!productosLoading && !productosError && (
                      <div className="users-list-container">
                        {productos.map((p) => (
                          <div key={p.id} className="user-list-item">
                            <div className="user-list-info">
                              <div className="product-list-main-info">
                                <span className="user-list-name">
                                  {p.imagen || '🍔'} {p.nombre}
                                </span>
                                <div className="product-list-badges">
                                  <span className="badge badge-category">{p.categoria || 'Otros'}</span>
                                  <span className="badge">
                                    ${parseFloat(p.precio).toLocaleString('es-CL', { minimumFractionDigits: 0 })}
                                  </span>
                                </div>
                              </div>
                              {p.ingredientes && p.ingredientes.length > 0 && (
                                <div className="product-list-ingredients">
                                  <span className="ingredients-label">Ingredientes:</span>{' '}
                                  {p.ingredientes.map(ing => `${ing.nombre} (${ing.cantidad})`).join(', ')}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => handleDeleteProduct(p.id, p.nombre)}
                              className="btn-delete-user"
                              title="Eliminar producto"
                            >
                              🗑️
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {modalConfig.isOpen && (
        <div className="custom-modal-overlay">
          <div className="custom-modal-card">
            <div className="custom-modal-header">
              <span className="custom-modal-icon">{modalConfig.isAlert ? '⚠️' : '❓'}</span>
              <h3 className="custom-modal-title">{modalConfig.title}</h3>
            </div>
            <div className="custom-modal-body">
              <p className="custom-modal-message">{modalConfig.message}</p>
            </div>
            <div className="custom-modal-actions">
              {!modalConfig.isAlert && (
                <button
                  type="button"
                  className="btn-secondary custom-modal-btn-cancel"
                  onClick={modalConfig.onCancel}
                >
                  {modalConfig.cancelText}
                </button>
              )}
              <button
                type="button"
                className="btn-primary custom-modal-btn-confirm"
                onClick={modalConfig.onConfirm}
              >
                {modalConfig.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
