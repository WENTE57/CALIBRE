import { useState, useEffect } from 'react';
import './App.css';
import logoImg from './assets/logo.png';

function App() {
  const [isDark, setIsDark] = useState(() => localStorage.getItem('calibre_theme') === 'dark');
  const [nombre, setNombre] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Estados para configuración de impresora
  const [printers, setPrinters] = useState([]);
  const [selectedPrinter, setSelectedPrinter] = useState('');

  useEffect(() => {
    if (window.electronAPI && typeof window.electronAPI.getPrinters === 'function') {
      window.electronAPI.getPrinters().then(list => {
        setPrinters(list || []);
      }).catch(e => console.error('Error al listar impresoras:', e));

      window.electronAPI.getSelectedPrinter().then(name => {
        setSelectedPrinter(name || '');
      }).catch(e => console.error('Error al obtener impresora seleccionada:', e));
    }
  }, []);

  const handlePrinterChange = async (e) => {
    const val = e.target.value;
    setSelectedPrinter(val);
    if (window.electronAPI && typeof window.electronAPI.setSelectedPrinter === 'function') {
      try {
        await window.electronAPI.setSelectedPrinter(val);
      } catch (err) {
        console.error('Error al guardar la impresora configurada:', err);
      }
    }
  };

  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('calibre_theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('calibre_theme', 'light');
    }
  }, [isDark]);

  // Efecto para cambiar de campo al presionar ENTER en lugar de enviar el formulario
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        const target = e.target;
        if (
          target.tagName === 'INPUT' &&
          target.type !== 'submit' &&
          target.type !== 'button' &&
          target.type !== 'checkbox' &&
          target.type !== 'radio' &&
          target.type !== 'file'
        ) {
          // Evitar el envío automático del formulario
          e.preventDefault();

          const form = target.form;
          if (form) {
            // Obtener todos los elementos interactivos del formulario
            const elements = Array.from(form.elements).filter((el) => {
              return (
                (el.tagName === 'INPUT' ||
                  el.tagName === 'SELECT' ||
                  el.tagName === 'TEXTAREA' ||
                  el.tagName === 'BUTTON') &&
                !el.disabled &&
                el.type !== 'hidden' &&
                el.tabIndex !== -1 &&
                el.offsetWidth > 0 &&
                el.offsetHeight > 0
              );
            });

            const index = elements.indexOf(target);
            if (index > -1 && index < elements.length - 1) {
              const nextEl = elements[index + 1];
              nextEl.focus();
              if (
                nextEl.tagName === 'INPUT' &&
                (nextEl.type === 'text' || nextEl.type === 'number' || nextEl.type === 'password')
              ) {
                nextEl.select?.();
              }
            } else if (index === elements.length - 1) {
              // Si es el último campo de texto, permitimos que se envíe el formulario
              form.requestSubmit?.();
            }
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

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
  const [activeTab, setActiveTab] = useState('pedidos'); // 'pedidos', 'usuarios', 'productos', o 'historial'
  const [showPromptCliente, setShowPromptCliente] = useState(false);
  const [clienteNombre, setClienteNombre] = useState('');
  const [pedidoNota, setPedidoNota] = useState('');
  const [tipoEntrega, setTipoEntrega] = useState('Servir');
  const [tipoTransaccion, setTipoTransaccion] = useState('Efectivo'); // 'Efectivo' o 'Crédito'
  const [comandaData, setComandaData] = useState(null);
  const [historialPedidos, setHistorialPedidos] = useState([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
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
  const [editandoProdId, setEditandoProdId] = useState(null);

  // Estados para ingredientes en productos
  const [listaIngredientes, setListaIngredientes] = useState([]);
  const [ingredientesSeleccionados, setIngredientesSeleccionados] = useState([]);
  const [currIngredienteId, setCurrIngredienteId] = useState('');
  const [currIngredienteCantidad, setCurrIngredienteCantidad] = useState('');

  // Estados para administración de ingredientes en Inventario
  const [ingNombre, setIngNombre] = useState('');
  const [ingStock, setIngStock] = useState('');
  const [ingError, setIngError] = useState('');
  const [ingSuccess, setIngSuccess] = useState('');
  const [ingLoading, setIngLoading] = useState(false);
  const [editandoIngId, setEditandoIngId] = useState(null);

  // Estados para llegada de materia prima
  const [llegadaIngId, setLlegadaIngId] = useState('');
  const [llegadaCantidad, setLlegadaCantidad] = useState('');
  const [llegadaError, setLlegadaError] = useState('');
  const [llegadaSuccess, setLlegadaSuccess] = useState('');
  const [llegadaLoading, setLlegadaLoading] = useState(false);

  // Filtro de categorías en Catálogo POS
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('Todos');

  // Estados para creación dinámica de categorías
  const [listaCategorias, setListaCategorias] = useState([]);
  const [draggedCatIndex, setDraggedCatIndex] = useState(null);
  const [nuevaCategoriaNombre, setNuevaCategoriaNombre] = useState('');
  const [nuevaCategoriaEmoji, setNuevaCategoriaEmoji] = useState('🏷️');
  const [catSuccess, setCatSuccess] = useState('');
  const [catError, setCatError] = useState('');
  const [editandoCatId, setEditandoCatId] = useState(null);
  const [selectedCatForProducts, setSelectedCatForProducts] = useState(null);
  const [catProductView, setCatProductView] = useState('list'); // 'list', 'create', 'edit'

  // Estados para configuración de correo
  const [configEmailTo, setConfigEmailTo] = useState('');
  const [configEmailFrom, setConfigEmailFrom] = useState('');
  const [configSmtpHost, setConfigSmtpHost] = useState('');
  const [configSmtpPort, setConfigSmtpPort] = useState('1025');
  const [configSmtpSecure, setConfigSmtpSecure] = useState(false);
  const [configSmtpUser, setConfigSmtpUser] = useState('');
  const [configSmtpPass, setConfigSmtpPass] = useState('');
  const [configLoading, setConfigLoading] = useState(false);
  const [configSuccess, setConfigSuccess] = useState('');
  const [configError, setConfigError] = useState('');

  // Estados para búsqueda en historial
  const [filtroTicketId, setFiltroTicketId] = useState('');
  const [filtroCliente, setFiltroCliente] = useState('');
  const [filtroFechaInicio, setFiltroFechaInicio] = useState('');
  const [filtroFechaFin, setFiltroFechaFin] = useState('');
  const [filtroProductoAdmin, setFiltroProductoAdmin] = useState('');

  // Estados para administración de Promociones
  const [promociones, setPromociones] = useState([]);
  const [promocionesLoading, setPromocionesLoading] = useState(false);
  const [promocionesError, setPromocionesError] = useState('');
  const [promoNombre, setPromoNombre] = useState('');
  const [promoEmoji, setPromoEmoji] = useState('🎁');
  const [promoPrecio, setPromoPrecio] = useState('');
  const [promoActivo, setPromoActivo] = useState(true);
  const [promoProductosFijos, setPromoProductosFijos] = useState([]);
  const [promoPasos, setPromoPasos] = useState([]);
  const [editandoPromoId, setEditandoPromoId] = useState(null);
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promocionesView, setPromocionesView] = useState('list'); // 'list', 'create', 'edit'

  // Selección de promociones en el POS
  const [showPromoSelectorModal, setShowPromoSelectorModal] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState(null);
  const [currentPromoStepIndex, setCurrentPromoStepIndex] = useState(0);
  const [chosenPromoOpciones, setChosenPromoOpciones] = useState([]);

  // Estados para Cierre de Caja
  const [fechaCierre, setFechaCierre] = useState(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });
  const [mesExcel, setMesExcel] = useState(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  });
  const [fechaInicioReporte, setFechaInicioReporte] = useState(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });
  const [fechaFinReporte, setFechaFinReporte] = useState(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });
  const [cierreData, setCierreData] = useState(null);
  const [loadingCierre, setLoadingCierre] = useState(false);
  const [errorCierre, setErrorCierre] = useState('');
  
  // Estados para Cuadrado de Caja (Arqueo)
  const [fondoApertura, setFondoApertura] = useState(50000);
  const [efectivoReal, setEfectivoReal] = useState('');
  const [observacionesCierre, setObservacionesCierre] = useState('');
  const [cierreRegistradoData, setCierreRegistradoData] = useState(null);
  const [modoEdicionCierre, setModoEdicionCierre] = useState(false);
  const [guardandoCierre, setGuardandoCierre] = useState(false);

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
      const response = await fetch('http://127.0.0.1:5000/api/productos');
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

  const cargarPromociones = async () => {
    setPromocionesLoading(true);
    setPromocionesError('');
    try {
      const response = await fetch('http://127.0.0.1:5000/api/promociones');
      const data = await response.json();
      if (response.ok && data.success) {
        setPromociones(data.promociones);
      } else {
        setPromocionesError(data.message || 'Error al obtener las promociones.');
      }
    } catch (err) {
      console.error(err);
      setPromocionesError('No se pudo conectar al servidor para obtener las promociones.');
    } finally {
      setPromocionesLoading(false);
    }
  };

  const seleccionarPromocion = (promo) => {
    if (!promo.pasos || promo.pasos.length === 0) {
      const fijosStr = promo.productos_fijos && promo.productos_fijos.length > 0
        ? ` (${promo.productos_fijos.map(pf => `${pf.cantidad}x ${pf.nombre_producto}`).join(', ')})`
        : '';
      const itemPromo = {
        id: `promo-${promo.id}-${Date.now()}`,
        promocion_id: promo.id,
        nombre: `${promo.nombre}${fijosStr}`,
        precio: parseFloat(promo.precio),
        cantidad: 1,
        imagen: promo.emoji || '🎁',
        productos_fijos: promo.productos_fijos || [],
        opciones_elegidas: []
      };
      setPedido((prev) => [...prev, itemPromo]);
      return;
    }

    setSelectedPromo(promo);
    setCurrentPromoStepIndex(0);
    setChosenPromoOpciones([]);
    setShowPromoSelectorModal(true);
  };

  const seleccionarOpcionPaso = (opcion) => {
    const paso = selectedPromo.pasos[currentPromoStepIndex];
    const choice = {
      paso_id: paso.id,
      producto_id: opcion.producto_id,
      nombre_producto: opcion.nombre_producto,
      precio_adicional: parseFloat(opcion.precio_adicional) || 0.00
    };

    const nuevasOpciones = [...chosenPromoOpciones, choice];
    setChosenPromoOpciones(nuevasOpciones);

    if (currentPromoStepIndex < selectedPromo.pasos.length - 1) {
      setCurrentPromoStepIndex(currentPromoStepIndex + 1);
    } else {
      const totalExtra = nuevasOpciones.reduce((sum, opt) => sum + opt.precio_adicional, 0);
      const finalPrice = parseFloat(selectedPromo.precio) + totalExtra;
      
      const opcionesStr = nuevasOpciones.map(opt => opt.nombre_producto).join(', ');
      const finalName = `${selectedPromo.nombre} (${opcionesStr})`;
      
      const itemPromo = {
        id: `promo-${selectedPromo.id}-${Date.now()}`,
        promocion_id: selectedPromo.id,
        nombre: finalName,
        precio: finalPrice,
        cantidad: 1,
        imagen: selectedPromo.emoji || '🎁',
        productos_fijos: selectedPromo.productos_fijos || [],
        opciones_elegidas: nuevasOpciones.map(opt => ({
          producto_id: opt.producto_id,
          nombre_producto: opt.nombre_producto
        }))
      };

      setPedido((prev) => [...prev, itemPromo]);
      setShowPromoSelectorModal(false);
      setSelectedPromo(null);
    }
  };

  const agregarPasoPromoForm = () => {
    setPromoPasos([
      ...promoPasos,
      {
        temp_id: Date.now() + Math.random(),
        nombre_paso: '',
        obligatorio: true,
        opciones: []
      }
    ]);
  };

  const eliminarPasoPromoForm = (tempIdOrRealId, isRealId) => {
    setPromoPasos(promoPasos.filter(p => isRealId ? p.id !== tempIdOrRealId : p.temp_id !== tempIdOrRealId));
  };

  const actualizarNombrePasoForm = (tempIdOrRealId, isRealId, val) => {
    setPromoPasos(promoPasos.map(p => {
      const match = isRealId ? p.id === tempIdOrRealId : p.temp_id === tempIdOrRealId;
      return match ? { ...p, nombre_paso: val } : p;
    }));
  };

  const actualizarObligatorioPasoForm = (tempIdOrRealId, isRealId, val) => {
    setPromoPasos(promoPasos.map(p => {
      const match = isRealId ? p.id === tempIdOrRealId : p.temp_id === tempIdOrRealId;
      return match ? { ...p, obligatorio: val } : p;
    }));
  };

  const agregarOpcionAlPasoForm = (pasoTempIdOrRealId, isRealId, productoId, precioAdicional) => {
    const prod = productos.find(p => p.id === parseInt(productoId));
    if (!prod) return;

    setPromoPasos(promoPasos.map(p => {
      const match = isRealId ? p.id === pasoTempIdOrRealId : p.temp_id === pasoTempIdOrRealId;
      if (!match) return p;

      if (p.opciones.some(o => o.producto_id === prod.id)) {
        abrirAlerta('Este producto ya está agregado en este paso.', 'Opción Duplicada');
        return p;
      }

      return {
        ...p,
        opciones: [
          ...p.opciones,
          {
            producto_id: prod.id,
            nombre_producto: prod.nombre,
            precio_producto: prod.precio,
            precio_adicional: parseFloat(precioAdicional) || 0.00
          }
        ]
      };
    }));
  };

  const eliminarOpcionDelPasoForm = (pasoTempIdOrRealId, isRealId, productoId) => {
    setPromoPasos(promoPasos.map(p => {
      const match = isRealId ? p.id === pasoTempIdOrRealId : p.temp_id === pasoTempIdOrRealId;
      if (!match) return p;

      return {
        ...p,
        opciones: p.opciones.filter(o => o.producto_id !== productoId)
      };
    }));
  };

  const agregarProductoFijoPromoForm = (productoId, cantidad) => {
    const prod = productos.find(p => p.id === parseInt(productoId));
    if (!prod) return;
    const cant = parseInt(cantidad) || 1;

    const existe = promoProductosFijos.find(pf => pf.producto_id === prod.id);
    if (existe) {
      setPromoProductosFijos(promoProductosFijos.map(pf =>
        pf.producto_id === prod.id ? { ...pf, cantidad: pf.cantidad + cant } : pf
      ));
    } else {
      setPromoProductosFijos([
        ...promoProductosFijos,
        {
          producto_id: prod.id,
          nombre_producto: prod.nombre,
          precio_producto: prod.precio,
          cantidad: cant
        }
      ]);
    }
  };

  const eliminarProductoFijoPromoForm = (productoId) => {
    setPromoProductosFijos(promoProductosFijos.filter(pf => pf.producto_id !== productoId));
  };

  const handleSavePromo = async (e) => {
    e.preventDefault();
    if (!promoNombre.trim() || !promoPrecio.toString().trim()) {
      setPromoError('Completa todos los campos obligatorios (nombre y precio).');
      setPromoSuccess('');
      return;
    }

    if (promoPasos.length === 0 && promoProductosFijos.length === 0) {
      setPromoError('Una promoción debe incluir al menos un producto fijo o un paso de selección.');
      setPromoSuccess('');
      return;
    }

    for (const paso of promoPasos) {
      if (!paso.nombre_paso.trim()) {
        setPromoError('Todos los pasos deben tener un nombre.');
        setPromoSuccess('');
        return;
      }
      if (paso.opciones.length === 0) {
        setPromoError(`El paso "${paso.nombre_paso}" debe tener al menos una opción.`);
        setPromoSuccess('');
        return;
      }
    }

    setPromoLoading(true);
    setPromoError('');
    setPromoSuccess('');

    try {
      const url = editandoPromoId
        ? `http://127.0.0.1:5000/api/promociones/${editandoPromoId}`
        : 'http://127.0.0.1:5000/api/promociones';
      const method = editandoPromoId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nombre: promoNombre.trim(),
          precio: parseFloat(promoPrecio),
          activo: promoActivo,
          productos_fijos: promoProductosFijos,
          pasos: promoPasos,
          emoji: promoEmoji
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setPromoSuccess(data.message);
        setPromoNombre('');
        setPromoPrecio('');
        setPromoEmoji('🎁');
        setPromoActivo(true);
        setPromoProductosFijos([]);
        setPromoPasos([]);
        setEditandoPromoId(null);
        setPromocionesView('list');
        cargarPromociones();
      } else {
        setPromoError(data.message || 'Error al guardar la promoción.');
      }
    } catch (err) {
      console.error(err);
      setPromoError('Error de conexión con el servidor.');
    } finally {
      setPromoLoading(false);
    }
  };

  const iniciarEdicionPromo = (promo) => {
    setEditandoPromoId(promo.id);
    setPromoNombre(promo.nombre);
    setPromoPrecio(promo.precio);
    setPromoEmoji(promo.emoji || '🎁');
    setPromoActivo(promo.activo !== false);
    setPromoProductosFijos(promo.productos_fijos || []);
    setPromoPasos((promo.pasos || []).map(paso => ({
      ...paso,
      temp_id: paso.id || (Date.now() + Math.random())
    })));
    setPromoError('');
    setPromoSuccess('');
    setPromocionesView('edit');
  };

  const handleDeletePromo = (promoId, promoNombre) => {
    abrirConfirmacion(
      `¿Estás seguro de que deseas eliminar la promoción "${promoNombre}"?`,
      'Confirmar Eliminación',
      async () => {
        try {
          const response = await fetch(`http://127.0.0.1:5000/api/promociones/${promoId}`, {
            method: 'DELETE'
          });
          const data = await response.json();
          if (response.ok && data.success) {
            cargarPromociones();
            abrirAlerta(`Promoción "${promoNombre}" eliminada correctamente.`, 'Éxito');
          } else {
            abrirAlerta(data.message || 'Error al eliminar la promoción.', 'Error');
          }
        } catch (err) {
          console.error(err);
          abrirAlerta('Error de red al conectar con el servidor.', 'Error de Conexión');
        }
      }
    );
  };

  const cargarConfiguracion = async () => {
    try {
      setConfigLoading(true);
      setConfigError('');
      setConfigSuccess('');
      const response = await fetch('http://127.0.0.1:5000/api/configuracion');
      const data = await response.json();
      if (response.ok && data.success) {
        const config = data.config || {};
        setConfigEmailTo(config.REPORT_EMAIL_TO || '');
        setConfigEmailFrom(config.REPORT_EMAIL_FROM || 'inglesnaipe61@gmail.com');
        setConfigSmtpHost(config.SMTP_HOST || 'smtp.gmail.com');
        setConfigSmtpPort(config.SMTP_PORT || '587');
        setConfigSmtpSecure(config.SMTP_SECURE === 'true' || config.SMTP_SECURE === '1');
        setConfigSmtpUser(config.SMTP_USER || 'inglesnaipe61@gmail.com');
        setConfigSmtpPass(config.SMTP_PASS || '');
      } else {
        setConfigError(data.message || 'Error al cargar la configuración.');
      }
    } catch (err) {
      console.error('Error al cargar configuración:', err);
      setConfigError('Error de red al cargar la configuración.');
    } finally {
      setConfigLoading(false);
    }
  };

  const guardarConfiguracion = async (e) => {
    if (e) e.preventDefault();
    try {
      setConfigLoading(true);
      setConfigSuccess('');
      setConfigError('');
      
      const config = {
        REPORT_EMAIL_TO: configEmailTo
      };

      const response = await fetch('http://127.0.0.1:5000/api/configuracion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ config })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setConfigSuccess('Configuración guardada correctamente.');
      } else {
        setConfigError(data.message || 'Error al guardar la configuración.');
      }
    } catch (err) {
      console.error('Error al guardar configuración:', err);
      setConfigError('Error de red al guardar la configuración.');
    } finally {
      setConfigLoading(false);
    }
  };

  const cargarUsuarios = async () => {
    setUsuariosLoading(true);
    setUsuariosError('');
    try {
      const response = await fetch('http://127.0.0.1:5000/api/usuarios');
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
      const response = await fetch('http://127.0.0.1:5000/api/ingredientes');
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

  const handleIngredientesKeyDown = (e, currentFieldName) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      const container = e.currentTarget.closest('.ingredients-selector-row');
      if (!container) return;

      const selectEl = container.querySelector('.ingrediente-select');
      const qtyEl = container.querySelector('.ingrediente-cantidad-input');
      const btnEl = container.querySelector('.btn-add-ingredient');

      if (e.key === 'ArrowRight') {
        if (currentFieldName === 'select' && qtyEl) {
          e.preventDefault();
          qtyEl.focus();
          qtyEl.select?.();
        } else if (currentFieldName === 'quantity' && btnEl) {
          e.preventDefault();
          btnEl.focus();
        }
      } else if (e.key === 'ArrowLeft') {
        if (currentFieldName === 'quantity' && selectEl) {
          e.preventDefault();
          selectEl.focus();
        } else if (currentFieldName === 'button' && qtyEl) {
          e.preventDefault();
          qtyEl.focus();
          qtyEl.select?.();
        }
      }
    }
  };

  const cargarCategorias = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/categorias');
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

  const handleCatDragStart = (e, index) => {
    setDraggedCatIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index);
  };

  const handleCatDragOver = (e, index) => {
    e.preventDefault();
    if (draggedCatIndex === null || draggedCatIndex === index) return;

    // Obtener las coordenadas del elemento objetivo para evitar el parpadeo en cuadrícula 2D
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const isForward = draggedCatIndex < index;

    if (isForward) {
      // Si va hacia adelante (derecha o abajo), debe haber cruzado el centro en X o en Y
      if (e.clientX < centerX && e.clientY < centerY) return;
    } else {
      // Si va hacia atrás (izquierda o arriba), debe haber cruzado el centro en X o en Y
      if (e.clientX > centerX && e.clientY > centerY) return;
    }

    const newLista = [...listaCategorias];
    const draggedItem = newLista[draggedCatIndex];
    newLista.splice(draggedCatIndex, 1);
    newLista.splice(index, 0, draggedItem);

    setDraggedCatIndex(index);
    setListaCategorias(newLista);
  };

  const handleCatDragEnd = async () => {
    setDraggedCatIndex(null);
    try {
      const response = await fetch('http://127.0.0.1:5000/api/categorias/reordenar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ordenamiento: listaCategorias.map((c) => c.id),
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        console.error('Error al guardar el orden:', data.message);
      }
    } catch (err) {
      console.error('Error de red al guardar el orden de categorías:', err);
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
      const response = await fetch('http://127.0.0.1:5000/api/categorias', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          nombre: nuevaCategoriaNombre.trim(),
          emoji: nuevaCategoriaEmoji.trim() || '🏷️'
        }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setCatSuccess(data.message);
        setNuevaCategoriaNombre('');
        setNuevaCategoriaEmoji('🏷️');
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
    setSelectedCatForProducts(null);
    setCatProductView('list');
    setEditandoCatId(cat.id);
    setNuevaCategoriaNombre(cat.nombre);
    setNuevaCategoriaEmoji(cat.emoji || '🏷️');
    setCatError('');
    setCatSuccess('');
  };

  const cancelarEdicionCat = () => {
    setEditandoCatId(null);
    setNuevaCategoriaNombre('');
    setNuevaCategoriaEmoji('🏷️');
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
      const response = await fetch(`http://127.0.0.1:5000/api/categorias/${editandoCatId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          nombre: nuevaCategoriaNombre.trim(),
          emoji: nuevaCategoriaEmoji.trim() || '🏷️'
        }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setCatSuccess(data.message);
        setNuevaCategoriaNombre('');
        setNuevaCategoriaEmoji('🏷️');
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
          const response = await fetch(`http://127.0.0.1:5000/api/categorias/${catId}`, {
            method: 'DELETE',
          });
          const data = await response.json();
          if (response.ok && data.success) {
            setCatSuccess(data.message);
            if (editandoCatId === catId) {
              setEditandoCatId(null);
              setNuevaCategoriaNombre('');
              setNuevaCategoriaEmoji('🏷️');
            }
            setSelectedCatForProducts(null);
            setCatProductView('list');
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
          const response = await fetch(`http://127.0.0.1:5000/api/usuarios/${userId}`, {
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
      const url = editandoProdId
        ? `http://127.0.0.1:5000/api/productos/${editandoProdId}`
        : 'http://127.0.0.1:5000/api/productos';
      const method = editandoProdId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
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
        setProdSuccess(data.message || (editandoProdId ? 'Producto actualizado correctamente.' : 'Producto creado correctamente.'));
        setProdNombre('');
        setProdPrecio('');
        setProdImagen('🍔');
        if (activeTab === 'categorias' && selectedCatForProducts) {
          setProdCategoria(selectedCatForProducts.nombre);
        } else {
          setProdCategoria(listaCategorias[0]?.nombre || '');
        }
        setIngredientesSeleccionados([]);
        setCurrIngredienteId('');
        setCurrIngredienteCantidad('');
        setEditandoProdId(null);
        cargarProductos();
        if (activeTab === 'categorias') {
          setCatProductView('list');
        }
      } else {
        setProdError(data.message || (editandoProdId ? 'Error al actualizar el producto.' : 'Error al crear el producto.'));
      }
    } catch (err) {
      console.error(err);
      setProdError('Error al conectar con el servidor.');
    } finally {
      setProdLoading(false);
    }
  };

  const iniciarEdicionProd = (prod) => {
    setEditandoProdId(prod.id);
    setProdNombre(prod.nombre);
    setProdPrecio(prod.precio);
    setProdImagen(prod.imagen || '🍔');
    setProdCategoria(prod.categoria || 'Otros');
    if (prod.ingredientes && Array.isArray(prod.ingredientes)) {
      setIngredientesSeleccionados(
        prod.ingredientes.map(ing => ({
          ingrediente_id: ing.id,
          nombre: ing.nombre,
          cantidad: ing.cantidad
        }))
      );
    } else {
      setIngredientesSeleccionados([]);
    }
  };

  const cancelarEdicionProd = () => {
    setEditandoProdId(null);
    setProdNombre('');
    setProdPrecio('');
    setProdImagen('🍔');
    setProdCategoria(listaCategorias[0]?.nombre || '');
    setIngredientesSeleccionados([]);
    setCurrIngredienteId('');
    setCurrIngredienteCantidad('');
    setProdError('');
    setProdSuccess('');
  };

  const getProductIndexInfo = () => {
    const categoriaActiva = selectedCatForProducts ? selectedCatForProducts.nombre : prodCategoria;
    if (!categoriaActiva || !editandoProdId) return { isFirst: true, isLast: true };

    const list = productos.filter(p => p.categoria === categoriaActiva);
    if (list.length <= 1) return { isFirst: true, isLast: true };

    const currentIndex = list.findIndex(p => p.id === editandoProdId);
    if (currentIndex === -1) return { isFirst: true, isLast: true };

    return {
      isFirst: currentIndex === 0,
      isLast: currentIndex === list.length - 1
    };
  };

  const navegarEdicionProd = (direccion) => {
    const categoriaActiva = selectedCatForProducts ? selectedCatForProducts.nombre : prodCategoria;
    if (!categoriaActiva || !editandoProdId) return;

    const list = productos.filter(p => p.categoria === categoriaActiva);
    if (list.length <= 1) return;

    const currentIndex = list.findIndex(p => p.id === editandoProdId);
    if (currentIndex === -1) return;

    let targetIndex;
    if (direccion === 'siguiente') {
      if (currentIndex === list.length - 1) return;
      targetIndex = currentIndex + 1;
    } else {
      if (currentIndex === 0) return;
      targetIndex = currentIndex - 1;
    }

    const targetProduct = list[targetIndex];
    iniciarEdicionProd(targetProduct);
    setProdError('');
    setProdSuccess('');
  };

  const handleDeleteProduct = (productId, productName) => {
    abrirConfirmacion(
      `¿Estás seguro de que deseas eliminar el producto "${productName}"?`,
      'Confirmar Eliminación',
      async () => {
        try {
          const response = await fetch(`http://127.0.0.1:5000/api/productos/${productId}`, {
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

  const handleCreateIngredient = async (e) => {
    e.preventDefault();
    if (!ingNombre.trim()) {
      setIngError('Escribe el nombre del ingrediente.');
      setIngSuccess('');
      return;
    }
    setIngError('');
    setIngSuccess('');
    setIngLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:5000/api/ingredientes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: ingNombre.trim(),
          stock: parseFloat(ingStock.toString().replace(',', '.')) || 0.0,
        }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setIngSuccess(data.message);
        setIngNombre('');
        setIngStock('');
        cargarIngredientes();
        setTimeout(() => setIngSuccess(''), 3000);
      } else {
        setIngError(data.message || 'Error al crear ingrediente.');
      }
    } catch (err) {
      console.error(err);
      setIngError('Error de red al conectar con el servidor.');
    } finally {
      setIngLoading(false);
    }
  };

  const iniciarEdicionIng = (ing) => {
    setEditandoIngId(ing.id);
    setIngNombre(ing.nombre);
    setIngStock(ing.stock.toString());
    setIngError('');
    setIngSuccess('');
  };

  const cancelarEdicionIng = () => {
    setEditandoIngId(null);
    setIngNombre('');
    setIngStock('');
    setIngError('');
    setIngSuccess('');
  };

  const handleUpdateIngredient = async (e) => {
    e.preventDefault();
    if (!ingNombre.trim()) {
      setIngError('Escribe el nombre del ingrediente.');
      setIngSuccess('');
      return;
    }
    setIngError('');
    setIngSuccess('');
    setIngLoading(true);
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/ingredientes/${editandoIngId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: ingNombre.trim(),
          stock: parseFloat(ingStock.toString().replace(',', '.')) || 0.0,
        }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setIngSuccess(data.message);
        setIngNombre('');
        setIngStock('');
        setEditandoIngId(null);
        await cargarIngredientes();
        setTimeout(() => setIngSuccess(''), 3000);
      } else {
        setIngError(data.message || 'Error al actualizar ingrediente.');
      }
    } catch (err) {
      console.error(err);
      setIngError('Error de red al conectar con el servidor.');
    } finally {
      setIngLoading(false);
    }
  };

  const handleDeleteIngredient = (ingId, ingNombre) => {
    abrirConfirmacion(
      `¿Estás seguro de que deseas eliminar el ingrediente "${ingNombre}"? Esto puede afectar a las recetas de los productos que lo usen.`,
      'Confirmar Eliminación',
      async () => {
        setIngError('');
        setIngSuccess('');
        try {
          const response = await fetch(`http://127.0.0.1:5000/api/ingredientes/${ingId}`, {
            method: 'DELETE',
          });
          const data = await response.json();
          if (response.ok && data.success) {
            setIngSuccess(data.message);
            if (editandoIngId === ingId) {
              setEditandoIngId(null);
              setIngNombre('');
              setIngStock('');
            }
            await cargarIngredientes();
            setTimeout(() => setIngSuccess(''), 3000);
          } else {
            setIngError(data.message || 'Error al eliminar ingrediente.');
          }
        } catch (err) {
          console.error(err);
          setIngError('Error de red al conectar con el servidor.');
        }
      }
    );
  };

  const handleLlegadaMateriaPrima = async (e) => {
    e.preventDefault();
    if (!llegadaIngId) {
      setLlegadaError('Selecciona un ingrediente.');
      setLlegadaSuccess('');
      return;
    }
    const cantNum = parseFloat(llegadaCantidad);
    if (isNaN(cantNum) || cantNum <= 0) {
      setLlegadaError('Ingresa una cantidad válida mayor que 0.');
      setLlegadaSuccess('');
      return;
    }
    setLlegadaError('');
    setLlegadaSuccess('');
    setLlegadaLoading(true);
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/ingredientes/${llegadaIngId}/llegada`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ cantidad: cantNum })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setLlegadaSuccess(data.message);
        setLlegadaCantidad('');
        setLlegadaIngId('');
        await cargarIngredientes();
        setTimeout(() => setLlegadaSuccess(''), 3000);
      } else {
        setLlegadaError(data.message || 'Error al registrar llegada de materia prima.');
      }
    } catch (err) {
      console.error(err);
      setLlegadaError('Error al conectar con el servidor.');
    } finally {
      setLlegadaLoading(false);
    }
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
      cargarPromociones();
    }
  }, [user]);

  useEffect(() => {
    if (user && activeTab === 'usuarios') {
      cargarUsuarios();
    }
  }, [user, activeTab]);



  useEffect(() => {
    if (user && (activeTab === 'productos' || activeTab === 'categorias' || activeTab === 'inventario' || activeTab === 'cierre' || activeTab === 'promociones')) {
      cargarIngredientes();
      cargarCategorias();
      cargarProductos();
      cargarPromociones();
      if (activeTab === 'cierre') {
        cargarConfiguracion();
      }
    }
  }, [user, activeTab]);

  useEffect(() => {
    setSelectedCatForProducts(null);
    setCatProductView('list');
  }, [activeTab]);

  const cargarCuadradoCaja = async (dateStr) => {
    const targetDate = dateStr || fechaCierre;
    if (!targetDate) return;
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/cierres/${targetDate}`);
      const data = await response.json();
      if (response.ok && data.success) {
        if (data.exists) {
          setCierreRegistradoData(data.data);
          setFondoApertura(data.data.fondo_apertura);
          setEfectivoReal(data.data.efectivo_real.toString());
          setObservacionesCierre(data.data.observaciones || '');
          setModoEdicionCierre(false);
        } else {
          setCierreRegistradoData(null);
          setEfectivoReal('');
          setObservacionesCierre('');
          setModoEdicionCierre(false);
        }
      }
    } catch (err) {
      console.error('Error al obtener arqueo de caja de la DB:', err);
    }
  };

  const cargarCierreCaja = async (dateStr) => {
    const targetDate = dateStr || fechaCierre;
    if (!targetDate) return;
    setLoadingCierre(true);
    setErrorCierre('');
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/informes/cierre?fecha=${targetDate}`);
      const data = await response.json();
      if (response.ok && data.success) {
        setCierreData(data.data);
        await cargarCuadradoCaja(targetDate);
      } else {
        setErrorCierre(data.message || 'Error al cargar el cierre de caja.');
      }
    } catch (err) {
      console.error(err);
      setErrorCierre('No se pudo conectar al servidor para obtener el cierre de caja.');
    } finally {
      setLoadingCierre(false);
    }
  };

  const handleGuardarCuadradoCaja = async (e) => {
    e.preventDefault();
    if (!fechaCierre || !cierreData) return;
    if (efectivoReal === '') {
      abrirAlerta('Por favor, ingresa el efectivo real contado en caja.', 'Datos Incompletos');
      return;
    }
    
    const eRealNum = parseFloat(efectivoReal.toString().replace(',', '.'));
    if (isNaN(eRealNum) || eRealNum < 0) {
      abrirAlerta('El efectivo real debe ser un número válido mayor o igual a 0.', 'Valor Inválido');
      return;
    }

    setGuardandoCierre(true);
    try {
      const response = await fetch('http://127.0.0.1:5000/api/cierres', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fecha: fechaCierre,
          cargado_por: user.nombre,
          total_ventas: cierreData.total_ventas,
          total_efectivo: cierreData.total_efectivo,
          total_tarjeta: cierreData.total_tarjeta,
          fondo_apertura: parseFloat(fondoApertura.toString().replace(',', '.')) || 0,
          efectivo_real: eRealNum,
          observaciones: observacionesCierre
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setCierreRegistradoData(data.data);
        setModoEdicionCierre(false);
        abrirAlerta('El cuadrado de caja se ha guardado correctamente en la base de datos.', 'Éxito');
      } else {
        abrirAlerta(data.message || 'Error al guardar el cuadrado de caja.', 'Error');
      }
    } catch (err) {
      console.error(err);
      abrirAlerta(`Detalle del error: ${err.message}. Asegúrate de haber reiniciado el servidor backend para aplicar los cambios del arqueo de caja.`, 'Error de Conexión');
    } finally {
      setGuardandoCierre(false);
    }
  };

  const descargarExcelMensual = () => {
    if (!mesExcel) return;
    window.open(`http://127.0.0.1:5000/api/informes/excel?mes=${mesExcel}`);
  };

  const descargarReporteProductosRango = () => {
    if (!fechaInicioReporte || !fechaFinReporte) return;
    window.open(`http://127.0.0.1:5000/api/informes/rango-productos/excel?fecha_inicio=${fechaInicioReporte}&fecha_fin=${fechaFinReporte}`);
  };

  useEffect(() => {
    if (user && activeTab === 'cierre') {
      cargarCierreCaja();
    }
  }, [user, activeTab, fechaCierre]);

  useEffect(() => {
    if (user && activeTab === 'historial') {
      cargarHistorial();
    }
  }, [user, activeTab]);

  const cargarHistorial = async () => {
    setLoadingHistorial(true);
    try {
      const response = await fetch('http://127.0.0.1:5000/api/pedidos');
      const data = await response.json();
      if (response.ok && data.success) {
        setHistorialPedidos(data.pedidos);
      }
    } catch (err) {
      console.error('Error al cargar historial:', err);
    } finally {
      setLoadingHistorial(false);
    }
  };

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
    setClienteNombre('');
    setPedidoNota('');
    setTipoEntrega('Servir');
    setTipoTransaccion('Efectivo');
    setShowPromptCliente(true);
  };

  const handleSubmitPedido = async (e) => {
    e.preventDefault();
    if (!clienteNombre.trim()) {
      abrirAlerta('Por favor, ingresa el nombre del cliente para confirmar el pedido.', 'Nombre de Cliente Requerido');
      return;
    }

    const totalPedido = pedido.reduce((acc, curr) => acc + (parseFloat(curr.precio) * curr.cantidad), 0);
    const atendidoPor = user ? user.nombre : 'Desconocido';

    const payload = {
      cliente_nombre: clienteNombre.trim(),
      total: totalPedido,
      atendido_por: atendidoPor,
      productos: pedido.map(item => ({
        id: item.id,
        nombre: item.nombre,
        cantidad: item.cantidad,
        precio: parseFloat(item.precio),
        promocion_id: item.promocion_id || null,
        opciones_elegidas: item.opciones_elegidas || []
      })),
      nota: pedidoNota.trim() || null,
      tipo_entrega: tipoEntrega,
      tipo_transaccion: tipoTransaccion
    };

    try {
      const response = await fetch('http://127.0.0.1:5000/api/pedidos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (response.ok && data.success) {
        const newComanda = {
          ticket: data.ticket,
          cliente: clienteNombre.trim(),
          fecha_hora: data.fecha_hora,
          productos: payload.productos,
          total: totalPedido,
          atendido_por: atendidoPor,
          nota: payload.nota,
          tipo_entrega: payload.tipo_entrega,
          tipo_transaccion: payload.tipo_transaccion
        };
        setComandaData(newComanda);

        // Imprimir automáticamente el ticket si estamos en Electron
        if (window.electronAPI && typeof window.electronAPI.printTicket === 'function') {
          window.electronAPI.printTicket(newComanda);
        }

        setPedido([]);
        setClienteNombre('');
        setPedidoNota('');
        setTipoEntrega('Servir');
        setShowPromptCliente(false);
        cargarProductos();
      } else {
        abrirAlerta(data.message || 'Error al registrar el pedido.', 'Error');
      }
    } catch (err) {
      console.error(err);
      abrirAlerta('Error de conexión con el servidor al registrar el pedido.', 'Error de Red');
    }
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
      const response = await fetch('http://127.0.0.1:5000/api/login', {
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
    setNuevaCategoriaEmoji('🏷️');
    setCatSuccess('');
    setCatError('');
    setEditandoCatId(null);
    setTipoTransaccion('Efectivo');
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
      const response = await fetch('http://127.0.0.1:5000/api/usuarios', {
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
              <img src={logoImg} alt="Calibre 25" className="logo-image" />
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

              {/* Navegación según el rol del usuario */}
              <div className="nav-tabs">
                <button 
                  onClick={() => setActiveTab('pedidos')} 
                  className={`nav-tab ${activeTab === 'pedidos' ? 'active' : ''}`}
                >
                  🛒 Pedidos
                </button>
                {user.cargo.toLowerCase() === 'administrador' && (
                  <>
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
                    <button 
                      onClick={() => setActiveTab('categorias')} 
                      className={`nav-tab ${activeTab === 'categorias' ? 'active' : ''}`}
                    >
                      🏷️ Categorías
                    </button>
                    <button 
                      onClick={() => setActiveTab('promociones')} 
                      className={`nav-tab ${activeTab === 'promociones' ? 'active' : ''}`}
                    >
                      🎁 Promociones
                    </button>
                    <button 
                      onClick={() => setActiveTab('inventario')} 
                      className={`nav-tab ${activeTab === 'inventario' ? 'active' : ''}`}
                    >
                      🥑 Inventario
                    </button>

                  </>
                )}
                <button 
                  onClick={() => setActiveTab('historial')} 
                  className={`nav-tab ${activeTab === 'historial' ? 'active' : ''}`}
                >
                  📋 Historial
                </button>
                <button 
                  onClick={() => setActiveTab('cierre')} 
                  className={`nav-tab ${activeTab === 'cierre' ? 'active' : ''}`}
                >
                  📊 Cierre
                </button>
              </div>

              <div className="header-actions" style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <button onClick={handleLogout} className="btn-secondary">
                  Cerrar Sesión
                </button>
                <button 
                  type="button"
                  onClick={() => setIsDark(!isDark)} 
                  className="theme-toggle-header"
                  title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
                  style={{ position: 'absolute', top: '100%', marginTop: '0.4rem', right: 0 }}
                >
                  {isDark ? '☀️ Claro' : '🌙 Oscuro'}
                </button>
              </div>
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

                  {/* Layout dividido estilo TPV (Itactil): Categorías a la izquierda, Productos a la derecha */}
                  <div className="pos-catalog-layout">
                    {/* Filtro de Categorías (Sidebar Izquierdo) */}
                    <div className="category-sidebar">
                      {/* Categorías Estáticas (No arrastrables) */}
                      <button
                        onClick={() => setCategoriaSeleccionada('Todos')}
                        className={`category-sidebar-btn ${categoriaSeleccionada === 'Todos' ? 'active' : ''}`}
                      >
                        <span className="category-btn-icon">🍽️</span>
                        <span className="category-btn-text" title="Todos">Todos</span>
                      </button>
                      <button
                        onClick={() => setCategoriaSeleccionada('Promociones')}
                        className={`category-sidebar-btn ${categoriaSeleccionada === 'Promociones' ? 'active' : ''}`}
                      >
                        <span className="category-btn-icon">🎁</span>
                        <span className="category-btn-text" title="Promociones">Promociones</span>
                      </button>

                      {/* Categorías Dinámicas (Arrastrables) */}
                      {listaCategorias.map((cat, idx) => {
                        const nombre = cat.nombre;
                        const emoji = cat.emoji || '📁';
                        const isDragging = draggedCatIndex === idx;

                        return (
                          <div
                            key={cat.id}
                            draggable="true"
                            onDragStart={(e) => handleCatDragStart(e, idx)}
                            onDragOver={(e) => handleCatDragOver(e, idx)}
                            onDragEnd={handleCatDragEnd}
                            onClick={() => setCategoriaSeleccionada(nombre)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                setCategoriaSeleccionada(nombre);
                              }
                            }}
                            role="button"
                            tabIndex={0}
                            className={`category-sidebar-btn draggable ${categoriaSeleccionada === nombre ? 'active' : ''} ${isDragging ? 'dragging' : ''}`}
                          >
                            <span className="category-btn-icon">
                              {emoji}
                            </span>
                            <span className="category-btn-text" title={nombre}>
                              {nombre}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Contenedor de Productos (Derecha) */}
                    <div className="products-container">
                      <div className="products-grid">
                        {categoriaSeleccionada === 'Promociones' ? (
                          promociones
                            .filter(promo => promo.activo !== false)
                            .map((promo) => (
                              <div key={`promo-${promo.id}`} className="product-card promotion-card" onClick={() => seleccionarPromocion(promo)} style={{ border: '1px dashed var(--accent-primary)', position: 'relative' }}>
                                <div className="product-emoji" style={{ color: 'var(--accent-primary)' }}>{promo.emoji || '🎁'}</div>
                                <div className="product-info">
                                  <h4 className="product-name" style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>{promo.nombre}</h4>
                                  <span className="product-price">
                                     ${parseFloat(promo.precio).toLocaleString('es-CL', { minimumFractionDigits: 0 })}
                                  </span>
                                </div>
                                <button className="btn-add" style={{ background: 'var(--accent-primary)' }}>
                                  <span>+</span>
                                </button>
                              </div>
                            ))
                        ) : (
                          productos
                            .filter((prod) => (categoriaSeleccionada === 'Todos' && prod.categoria !== 'Promociones') || prod.categoria === categoriaSeleccionada)
                            .map((prod) => (
                              <div key={prod.id} className="product-card" onClick={() => agregarAlPedido(prod)}>
                                <div className="product-emoji">{prod.imagen || '🍔'}</div>
                                <div className="product-info">
                                  <h4 className="product-name">{prod.nombre}</h4>
                                  <span className="product-price">
                                     ${parseFloat(prod.precio).toLocaleString('es-CL', { minimumFractionDigits: 0 })}
                                  </span>
                                </div>
                                <button className="btn-add">
                                  <span>+</span>
                                </button>
                              </div>
                            ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Columna Derecha: Ticket de Pedido */}
                <div className="order-section">
                  <h3 className="section-title">📝 Detalle del Pedido</h3>
                  
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
                    <h3 className="section-title">
                      {editandoProdId ? '✏️ Editar Producto' : '📦 Registrar Nuevo Producto'}
                    </h3>
                    <p className="section-subtitle">
                      {editandoProdId ? 'Edita los datos del producto seleccionado' : 'Registra un nuevo plato o artículo al catálogo'}
                    </p>
                    
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
                            <option value="☕">☕ Café</option>
                            <option value="🍵">🍵 Té</option>
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
                                {cat.emoji || '🏷️'} {cat.nombre}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>



                      <div className="form-group">
                        <label className="form-label">Ingredientes del Producto</label>
                        <div className="ingredients-selector-row">
                          <select
                            className="form-input form-select ingrediente-select"
                            value={currIngredienteId}
                            onChange={(e) => setCurrIngredienteId(e.target.value)}
                            disabled={prodLoading}
                            onKeyDown={(e) => handleIngredientesKeyDown(e, 'select')}
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
                            onKeyDown={(e) => handleIngredientesKeyDown(e, 'quantity')}
                          />
                          <button
                            type="button"
                            onClick={agregarIngredienteAlForm}
                            className="btn-secondary btn-add-ingredient"
                            disabled={prodLoading}
                            onKeyDown={(e) => handleIngredientesKeyDown(e, 'button')}
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

                      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={prodLoading}>
                          {prodLoading ? (
                            <>
                              <div className="spinner"></div>
                              <span>{editandoProdId ? 'Guardando...' : 'Registrando...'}</span>
                            </>
                          ) : (
                            <span>{editandoProdId ? 'Guardar Cambios' : 'Registrar Producto'}</span>
                          )}
                        </button>
                        {editandoProdId && (
                          <button
                            type="button"
                            onClick={cancelarEdicionProd}
                            className="btn-secondary"
                            style={{ flex: 1 }}
                            disabled={prodLoading}
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                      {editandoProdId && (
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                          <button
                            type="button"
                            onClick={() => navegarEdicionProd('anterior')}
                            className="btn-secondary"
                            style={{ flex: 1, display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center' }}
                            disabled={prodLoading || getProductIndexInfo().isFirst}
                          >
                            ◀️ Anterior
                          </button>
                          <button
                            type="button"
                            onClick={() => navegarEdicionProd('siguiente')}
                            className="btn-secondary"
                            style={{ flex: 1, display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center' }}
                            disabled={prodLoading || getProductIndexInfo().isLast}
                          >
                            Siguiente ▶️
                          </button>
                        </div>
                      )}
                    </form>
                  </div>

                  {/* Listado de productos */}
                  <div className="admin-section users-list-section">
                    <h3 className="section-title">📋 Catálogo de Productos</h3>
                    <p className="section-subtitle font-sm">Lista de productos disponibles para pedidos</p>

                    <div style={{ margin: '1rem 0' }}>
                      <input
                        type="text"
                        placeholder="🔍 Buscar producto por nombre o categoría..."
                        className="form-input"
                        style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box', borderRadius: '8px' }}
                        value={filtroProductoAdmin}
                        onChange={(e) => setFiltroProductoAdmin(e.target.value)}
                      />
                    </div>

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
                        {productos
                          .filter((p) => {
                            const term = filtroProductoAdmin.trim().toLowerCase();
                            if (!term) return true;
                            return (
                              p.nombre.toLowerCase().includes(term) ||
                              (p.categoria && p.categoria.toLowerCase().includes(term))
                            );
                          })
                          .map((p) => (
                            <div key={p.id} className="user-list-item">
                            <div className="user-list-info" style={{ flexGrow: 1 }}>
                              <span className="user-list-name">
                                {p.imagen || '🍔'} {p.nombre}
                              </span>
                              {p.ingredientes && p.ingredientes.length > 0 && (
                                <div className="product-list-ingredients">
                                  <span className="ingredients-label">Ingredientes:</span>{' '}
                                  {p.ingredientes.map(ing => `${ing.nombre} (${ing.cantidad})`).join(', ')}
                                </div>
                              )}
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                              <div className="product-list-badges" style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                                <span className="badge badge-category">{p.categoria || 'Otros'}</span>
                                <span className="badge">
                                  ${parseFloat(p.precio).toLocaleString('es-CL', { minimumFractionDigits: 0 })}
                                </span>
                              </div>
                              
                              <button
                                onClick={() => iniciarEdicionProd(p)}
                                className="btn-edit-user"
                                title="Editar producto"
                                style={{ marginRight: '-0.75rem' }}
                              >
                                ✏️
                              </button>
                              
                              <button
                                onClick={() => handleDeleteProduct(p.id, p.nombre)}
                                className="btn-delete-user"
                                title="Eliminar producto"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* PESTAÑA DE CATEGORÍAS (Solo Admin) */}
            {activeTab === 'categorias' && user.cargo.toLowerCase() === 'administrador' && (
              <div className="admin-tab-content animate-fade">
                <div className="admin-grid-layout">
                  {/* Formulario de creación/edición o Lista/Formulario de productos de la categoría seleccionada */}
                  {selectedCatForProducts ? (
                    <div className="admin-section">
                      {catProductView === 'list' ? (
                        <>
                          <div className="admin-section-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <div>
                              <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span>{selectedCatForProducts.emoji || '🏷️'}</span>
                                <span>{selectedCatForProducts.nombre}</span>
                              </h3>
                              <p className="section-subtitle">Productos en esta categoría</p>
                            </div>
                            <button 
                              type="button" 
                              className="btn-secondary" 
                              style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                              onClick={() => {
                                setSelectedCatForProducts(null);
                                setCatProductView('list');
                                setProdError('');
                                setProdSuccess('');
                              }}
                            >
                              👈 Volver
                            </button>
                          </div>

                          {prodSuccess && (
                            <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                              </svg>
                              <span>{prodSuccess}</span>
                            </div>
                          )}
                          {prodError && (
                            <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                              </svg>
                              <span>{prodError}</span>
                            </div>
                          )}

                          <button 
                            type="button" 
                            className="btn-primary" 
                            style={{ width: '100%', marginBottom: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center' }}
                            onClick={() => {
                              setProdNombre('');
                              setProdPrecio('');
                              setProdImagen('🍔');
                              setProdCategoria(selectedCatForProducts.nombre);
                              setIngredientesSeleccionados([]);
                              setCurrIngredienteId('');
                              setCurrIngredienteCantidad('');
                              setEditandoProdId(null);
                              setProdError('');
                              setProdSuccess('');
                              setCatProductView('create');
                            }}
                          >
                            <span>➕ Registrar Producto en {selectedCatForProducts.nombre}</span>
                          </button>

                          <div className="users-list-container" style={{ flex: 1, overflowY: 'auto' }}>
                            {productos.filter(p => p.categoria === selectedCatForProducts.nombre).length === 0 ? (
                              <p className="empty-catalog" style={{ textAlign: 'center', marginTop: '2rem' }}>
                                No hay productos en esta categoría.
                              </p>
                            ) : (
                              productos
                                .filter(p => p.categoria === selectedCatForProducts.nombre)
                                .map(p => (
                                  <div key={p.id} className="user-list-item" style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.75rem 1rem' }}>
                                    <div className="user-list-info" style={{ flexGrow: 1 }}>
                                      <span className="user-list-name">
                                        {p.imagen || '🍔'} {p.nombre}
                                      </span>
                                      {p.ingredientes && p.ingredientes.length > 0 && (
                                        <div className="product-list-ingredients" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                                          <span className="ingredients-label">Ingredientes:</span>{' '}
                                          {p.ingredientes.map(ing => `${ing.nombre} (${ing.cantidad})`).join(', ')}
                                        </div>
                                      )}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                      <span className="badge" style={{ fontSize: '0.8rem' }}>
                                        ${parseFloat(p.precio).toLocaleString('es-CL', { minimumFractionDigits: 0 })}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          iniciarEdicionProd(p);
                                          setProdError('');
                                          setProdSuccess('');
                                          setCatProductView('edit');
                                        }}
                                        className="btn-edit-user"
                                        title="Editar producto"
                                        style={{ padding: '0.2rem 0.4rem', border: 'none', background: 'transparent', cursor: 'pointer' }}
                                      >
                                        ✏️
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteProduct(p.id, p.nombre)}
                                        className="btn-delete-user"
                                        title="Eliminar producto"
                                        style={{ padding: '0.2rem 0.4rem', border: 'none', background: 'transparent', cursor: 'pointer' }}
                                      >
                                        🗑️
                                      </button>
                                    </div>
                                  </div>
                                ))
                            )}
                          </div>
                        </>
                      ) : (
                        /* Formulario de Agregar / Editar Producto en la Categoría */
                        <>
                          <div className="admin-section-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <div>
                              <h3 className="section-title">
                                {catProductView === 'create' ? '➕ Registrar Producto' : '✏️ Editar Producto'}
                              </h3>
                              <p className="section-subtitle">
                                Categoría: {selectedCatForProducts.emoji || '🏷️'} {selectedCatForProducts.nombre}
                              </p>
                            </div>
                            <button 
                              type="button" 
                              className="btn-secondary" 
                              style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                              onClick={() => {
                                cancelarEdicionProd();
                                setCatProductView('list');
                              }}
                            >
                              👈 Cancelar
                            </button>
                          </div>

                          {prodError && (
                            <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                              </svg>
                              <span>{prodError}</span>
                            </div>
                          )}
                          {prodSuccess && (
                            <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                              </svg>
                              <span>{prodSuccess}</span>
                            </div>
                          )}

                          <form onSubmit={handleRegisterProduct} className="admin-form">
                            <div className="form-group">
                              <label className="form-label" htmlFor="catProdNombre">Nombre del Producto</label>
                              <div className="input-wrapper">
                                <input
                                  type="text"
                                  id="catProdNombre"
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
                              <label className="form-label" htmlFor="catProdPrecio">Precio ($)</label>
                              <div className="input-wrapper">
                                <input
                                  type="number"
                                  id="catProdPrecio"
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
                              <label className="form-label" htmlFor="catProdImagen">Emoji Representativo</label>
                              <div className="input-wrapper">
                                <select
                                  id="catProdImagen"
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
                                  <option value="☕">☕ Café</option>
                                  <option value="🍵">🍵 Té</option>
                                </select>
                              </div>
                            </div>

                            <div className="form-group">
                              <label className="form-label">Ingredientes del Producto</label>
                              <div className="ingredients-selector-row" style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                <select
                                  className="form-input form-select ingrediente-select"
                                  style={{ flex: 1 }}
                                  value={currIngredienteId}
                                  onChange={(e) => setCurrIngredienteId(e.target.value)}
                                  disabled={prodLoading}
                                  onKeyDown={(e) => handleIngredientesKeyDown(e, 'select')}
                                >
                                  <option value="">-- Seleccionar --</option>
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
                                  style={{ width: '80px' }}
                                  placeholder="Cant."
                                  value={currIngredienteCantidad}
                                  onChange={(e) => setCurrIngredienteCantidad(e.target.value)}
                                  disabled={prodLoading}
                                  onKeyDown={(e) => handleIngredientesKeyDown(e, 'quantity')}
                                />
                                <button
                                  type="button"
                                  onClick={agregarIngredienteAlForm}
                                  className="btn-secondary btn-add-ingredient"
                                  style={{ padding: '0.5rem' }}
                                  disabled={prodLoading}
                                  onKeyDown={(e) => handleIngredientesKeyDown(e, 'button')}
                                >
                                  +
                                </button>
                              </div>

                              {ingredientesSeleccionados.length > 0 && (
                                <div className="selected-ingredients-container" style={{ background: 'rgba(0,0,0,0.15)', padding: '0.5rem', borderRadius: '8px' }}>
                                  <span className="selected-title" style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.25rem' }}>Seleccionados:</span>
                                  <div className="selected-ingredients-list" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                                    {ingredientesSeleccionados.map((ing) => (
                                      <span key={ing.ingrediente_id} className="selected-ingredient-badge" style={{ fontSize: '0.75rem', padding: '0.15rem 0.4rem', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                        {ing.nombre}: <strong>{ing.cantidad}</strong>
                                        <button
                                          type="button"
                                          onClick={() => quitarIngredienteDelForm(ing.ingrediente_id)}
                                          className="btn-remove-badge"
                                          style={{ border: 'none', background: 'transparent', color: 'var(--error)', cursor: 'pointer', fontSize: '0.85rem' }}
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

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                              <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={prodLoading}>
                                {prodLoading ? (
                                  <>
                                    <div className="spinner"></div>
                                    <span>{editandoProdId ? 'Guardando...' : 'Registrando...'}</span>
                                  </>
                                ) : (
                                  <span>{editandoProdId ? 'Guardar Cambios' : 'Registrar Producto'}</span>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  cancelarEdicionProd();
                                  setCatProductView('list');
                                }}
                                className="btn-secondary"
                                style={{ flex: 1 }}
                                disabled={prodLoading}
                              >
                                Cancelar
                              </button>
                            </div>
                            {editandoProdId && (
                              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button
                                  type="button"
                                  onClick={() => navegarEdicionProd('anterior')}
                                  className="btn-secondary"
                                  style={{ flex: 1, display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center' }}
                                  disabled={prodLoading || getProductIndexInfo().isFirst}
                                >
                                  ◀️ Anterior
                                </button>
                                <button
                                  type="button"
                                  onClick={() => navegarEdicionProd('siguiente')}
                                  className="btn-secondary"
                                  style={{ flex: 1, display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center' }}
                                  disabled={prodLoading || getProductIndexInfo().isLast}
                                >
                                  Siguiente ▶️
                                </button>
                              </div>
                            )}
                          </form>
                        </>
                      )}
                    </div>
                  ) : (
                    /* Formulario de creación/edición de Categoría (Por defecto) */
                    <div className="admin-section">
                      <h3 className="section-title">🏷️ Registrar Categoría</h3>
                      <p className="section-subtitle">Crea, edita o elimina las categorías del catálogo</p>
                      
                      {catError && (
                        <div className="alert alert-error">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                          </svg>
                          <span>{catError}</span>
                        </div>
                      )}
                      {catSuccess && (
                        <div className="alert alert-success">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                          </svg>
                          <span>{catSuccess}</span>
                        </div>
                      )}

                      <form onSubmit={(e) => e.preventDefault()} className="admin-form">
                        <div className="form-group">
                          <label className="form-label" htmlFor="nuevaCategoriaNombre">
                            {editandoCatId ? '✏️ Editar Nombre de Categoría' : 'Nombre de la Categoría'}
                          </label>
                          <div className="input-wrapper">
                            <input
                              type="text"
                              id="nuevaCategoriaNombre"
                              className="form-input"
                              style={{ paddingLeft: '2.5rem' }}
                              placeholder="Ej. Postres"
                              value={nuevaCategoriaNombre}
                              onChange={(e) => setNuevaCategoriaNombre(e.target.value)}
                            />
                            <span className="input-icon">🏷️</span>
                          </div>
                        </div>

                        <div className="form-group" style={{ marginTop: '1rem' }}>
                          <label className="form-label" htmlFor="nuevaCategoriaEmoji">
                            Emoji de la Categoría
                          </label>
                          <div className="input-wrapper">
                            <select
                              id="nuevaCategoriaEmoji"
                              className="form-input form-select"
                              value={nuevaCategoriaEmoji}
                              onChange={(e) => setNuevaCategoriaEmoji(e.target.value)}
                            >
                              <option value="🏷️">🏷️ Categoría / Etiqueta</option>
                              <option value="🍔">🍔 Hamburguesas</option>
                              <option value="🌭">🌭 Completos / Hot Dogs</option>
                              <option value="🍟">🍟 Acompañamientos / Papas</option>
                              <option value="🥤">🥤 Bebidas / Bebestibles</option>
                              <option value="🍕">🍕 Pizzas</option>
                              <option value="🌮">🌮 Tacos</option>
                              <option value="🍦">🍦 Postres / Helados</option>
                              <option value="🍗">🍗 Pollos / Carnes</option>
                              <option value="🧅">🧅 Ensaladas / Verduras</option>
                              <option value="🧀">🧀 Quesos / Aderezos</option>
                              <option value="☕">☕ Café</option>
                              <option value="🍵">🍵 Té</option>
                            </select>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                          {editandoCatId ? (
                            <>
                              <button
                                type="button"
                                onClick={handleUpdateCategory}
                                className="btn-primary"
                                style={{ flex: 1 }}
                              >
                                Guardar
                              </button>
                              <button
                                type="button"
                                onClick={cancelarEdicionCat}
                                className="btn-secondary"
                                style={{ flex: 1 }}
                              >
                                Cancelar
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={handleCreateCategory}
                              className="btn-primary"
                              style={{ width: '100%' }}
                            >
                              Crear Categoría
                            </button>
                          )}
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Listado de categorías */}
                  <div className="admin-section users-list-section">
                    <h3 className="section-title">📋 Categorías Registradas</h3>
                    <p className="section-subtitle">Lista de categorías disponibles para clasificar productos</p>
                    <p className="section-subtitle" style={{ fontStyle: 'italic', fontSize: '0.8rem', marginTop: '0.25rem', color: 'var(--text-muted)' }}>
                      💡 Haz clic en una categoría para ver y gestionar sus productos.
                    </p>

                    {listaCategorias.length === 0 ? (
                      <p className="empty-catalog" style={{ marginTop: '1rem' }}>No hay categorías registradas.</p>
                    ) : (
                      <div className="admin-categories-mini-list" style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {listaCategorias.map((cat) => (
                          <div 
                            key={cat.id} 
                            className={`admin-category-item ${selectedCatForProducts?.id === cat.id ? 'active' : ''}`}
                            onClick={() => {
                              setSelectedCatForProducts(cat);
                              setCatProductView('list');
                              setProdSuccess('');
                              setProdError('');
                            }}
                            style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center', 
                              padding: '0.75rem 1rem', 
                              background: selectedCatForProducts?.id === cat.id ? 'var(--item-bg-hover)' : 'rgba(255, 255, 255, 0.03)', 
                              border: selectedCatForProducts?.id === cat.id ? '1px solid var(--accent-primary)' : '1px solid rgba(255, 255, 255, 0.05)', 
                              borderRadius: 'var(--radius-md)',
                              boxShadow: selectedCatForProducts?.id === cat.id ? '0 0 12px var(--accent-glow)' : 'none'
                            }}
                          >
                            <span className="admin-category-item-name" style={{ fontWeight: '500', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span>{cat.emoji || '🏷️'}</span>
                              <span>{cat.nombre}</span>
                            </span>
                            <div className="admin-category-item-actions" style={{ display: 'flex', gap: '0.5rem' }}>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  iniciarEdicionCat(cat);
                                }}
                                className="btn-edit-cat-icon"
                                style={{ background: 'rgba(255,255,255,0.05)', border: 'none', cursor: 'pointer', padding: '0.4rem', borderRadius: 'var(--radius-sm)' }}
                                title="Editar categoría"
                              >
                                ✏️
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteCategory(cat.id, cat.nombre);
                                }}
                                className="btn-delete-cat-icon"
                                style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', cursor: 'pointer', padding: '0.4rem', borderRadius: 'var(--radius-sm)' }}
                                title="Eliminar categoría"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'promociones' && (
              <div className="admin-container animate-fade-in" style={{ width: '100%', height: '100%', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', overflow: 'hidden' }}>
                {/* Formulario / Configuración de la Promoción (Izquierda) */}
                <div className="admin-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  {promocionesView === 'list' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                      <span style={{ fontSize: '3rem' }}>🎁</span>
                      <h4 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>Módulo de Promociones</h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', maxWidth: '300px' }}>
                        Crea promociones avanzadas y combos que descuenten ingredientes de forma precisa.
                      </p>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => {
                          setPromoNombre('');
                          setPromoPrecio('');
                          setPromoEmoji('🎁');
                          setPromoActivo(true);
                          setPromoPasos([]);
                          setEditandoPromoId(null);
                          setPromoError('');
                          setPromoSuccess('');
                          setPromocionesView('create');
                        }}
                        style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}
                      >
                        ➕ Crear Nueva Promoción
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="admin-section-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 className="section-title">
                          {promocionesView === 'create' ? '➕ Nueva Promoción' : '✏️ Editar Promoción'}
                        </h3>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => {
                            setPromoNombre('');
                            setPromoPrecio('');
                            setPromoEmoji('🎁');
                            setPromoPasos([]);
                            setEditandoPromoId(null);
                            setPromoError('');
                            setPromoSuccess('');
                            setPromocionesView('list');
                          }}
                          style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                        >
                          Volver a la Lista
                        </button>
                      </div>

                      {promoError && (
                        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                          <span>{promoError}</span>
                        </div>
                      )}

                      <form onSubmit={handleSavePromo} className="admin-form" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '0.5rem' }}>
                        <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
                          <div className="form-group">
                            <label className="form-label">Nombre de la Promoción</label>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="Ej. Promo Completo + Bebida"
                              value={promoNombre}
                              onChange={(e) => setPromoNombre(e.target.value)}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Precio ($)</label>
                            <input
                              type="number"
                              className="form-input"
                              placeholder="3500"
                              value={promoPrecio}
                              onChange={(e) => setPromoPrecio(e.target.value)}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Emoji</label>
                            <select
                              className="form-input form-select"
                              value={promoEmoji}
                              onChange={(e) => setPromoEmoji(e.target.value)}
                            >
                              <option value="🎁">🎁 Regalo / Combo</option>
                              <option value="🛍️">🛍️ Bolsa Compra</option>
                              <option value="🏷️">🏷️ Oferta</option>
                              <option value="✨">✨ Especial</option>
                              <option value="🔥">🔥 Destacado</option>
                              <option value="🍔">🍔 Hamburguesa</option>
                              <option value="🌭">🌭 Completo</option>
                              <option value="🍟">🍟 Papas Fritas</option>
                              <option value="🥤">🥤 Bebida</option>
                              <option value="🍕">🍕 Pizza</option>
                              <option value="🍗">🍗 Pollo Frito</option>
                              <option value="🌮">🌮 Taco</option>
                              <option value="🥪">🥪 Sándwich</option>
                              <option value="🍩">🍩 Dona</option>
                              <option value="🍦">🍦 Helado</option>
                              <option value="🍰">🍰 Pastel</option>
                              <option value="🍻">🍻 Cervezas</option>
                              <option value="☕">☕ Café</option>
                            </select>
                          </div>
                        </div>

                        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <input
                            type="checkbox"
                            id="promoActivoCheck"
                            checked={promoActivo}
                            onChange={(e) => setPromoActivo(e.target.checked)}
                          />
                          <label htmlFor="promoActivoCheck" style={{ fontSize: '0.9rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                            Promoción Activa
                          </label>
                        </div>

                        {/* Apartado Extra: Productos Fijos de la Promoción (Estética distintiva Esmeralda/Inventario) */}
                        <div className="form-group" style={{ 
                          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.02) 100%)', 
                          padding: '1.25rem', 
                          borderRadius: '14px', 
                          border: '1px solid rgba(16, 185, 129, 0.25)',
                          boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '1.2rem' }}>📌</span>
                                <label className="form-label" style={{ marginBottom: 0, fontWeight: '700', color: '#10b981', fontSize: '0.95rem' }}>
                                  Productos Fijos de la Promoción
                                </label>
                              </div>
                              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem', margin: 0 }}>
                                Productos incluidos automáticamente al vender esta promo (sin selección manual).
                              </p>
                            </div>
                            <span style={{ 
                              background: 'rgba(16, 185, 129, 0.15)', 
                              color: '#10b981', 
                              padding: '0.25rem 0.65rem', 
                              borderRadius: '20px', 
                              fontSize: '0.72rem', 
                              fontWeight: '700',
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.3rem'
                            }}>
                              ⚡ Stock Automático
                            </span>
                          </div>

                          {promoProductosFijos.length === 0 ? (
                            <div style={{ 
                              fontSize: '0.8rem', 
                              color: 'var(--text-muted)', 
                              textAlign: 'center', 
                              padding: '1rem', 
                              background: 'rgba(0, 0, 0, 0.05)', 
                              border: '1px dashed rgba(16, 185, 129, 0.2)', 
                              borderRadius: '10px',
                              marginBottom: '0.85rem',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '0.3rem'
                            }}>
                              <span style={{ fontSize: '1.4rem' }}>📦</span>
                              <span>No hay productos fijos en esta promoción aún.</span>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '0.85rem' }}>
                              {promoProductosFijos.map((pf) => (
                                <div key={pf.producto_id} style={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: '0.6rem', 
                                  background: 'var(--item-bg)', 
                                  padding: '0.4rem 0.75rem', 
                                  borderRadius: '10px', 
                                  fontSize: '0.85rem',
                                  border: '1px solid rgba(16, 185, 129, 0.25)',
                                  boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
                                }}>
                                  <span style={{ 
                                    background: '#10b981', 
                                    color: 'white', 
                                    padding: '0.1rem 0.45rem', 
                                    borderRadius: '6px', 
                                    fontWeight: 'bold', 
                                    fontSize: '0.78rem' 
                                  }}>
                                    {pf.cantidad}x
                                  </span>
                                  <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{pf.nombre_producto}</span>
                                  <button
                                    type="button"
                                    onClick={() => eliminarProductoFijoPromoForm(pf.producto_id)}
                                    style={{ 
                                      border: 'none', 
                                      background: 'rgba(239, 68, 68, 0.1)', 
                                      color: '#ef4444', 
                                      cursor: 'pointer', 
                                      fontSize: '0.8rem', 
                                      padding: '0.2rem 0.4rem',
                                      borderRadius: '4px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      transition: 'all 0.2s ease'
                                    }}
                                    title="Quitar producto fijo"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                            <select
                              className="form-input form-select"
                              style={{ 
                                height: '42px', 
                                fontSize: '0.88rem', 
                                flex: '1 1 auto', 
                                minWidth: '180px', 
                                background: 'var(--input-bg)', 
                                color: 'var(--text-primary)', 
                                padding: '0.4rem 0.85rem',
                                borderRadius: '10px',
                                border: '1px solid rgba(16, 185, 129, 0.3)'
                              }}
                              id="sel-fixed-product"
                              defaultValue=""
                            >
                              <option value="" disabled>-- Seleccionar Producto del Catálogo --</option>
                              {productos.map(p => (
                                <option key={p.id} value={p.id}>{p.nombre} (${parseFloat(p.precio)})</option>
                              ))}
                            </select>
                            <input
                              type="number"
                              className="form-input"
                              placeholder="Cant"
                              defaultValue="1"
                              min="1"
                              style={{ 
                                width: '70px', 
                                flexShrink: 0, 
                                height: '42px', 
                                fontSize: '0.9rem', 
                                padding: '0.4rem 0.5rem', 
                                textAlign: 'center',
                                borderRadius: '10px',
                                border: '1px solid rgba(16, 185, 129, 0.3)'
                              }}
                              id="cant-fixed-product"
                            />
                            <button
                              type="button"
                              style={{ 
                                height: '42px', 
                                width: 'auto', 
                                flexShrink: 0, 
                                padding: '0 1.25rem', 
                                fontSize: '0.88rem', 
                                fontWeight: 'bold', 
                                whiteSpace: 'nowrap',
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                border: 'none',
                                borderRadius: '10px',
                                color: 'white',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                                transition: 'all 0.2s ease'
                              }}
                              onClick={() => {
                                const sel = document.getElementById('sel-fixed-product');
                                const cant = document.getElementById('cant-fixed-product');
                                if (sel && sel.value) {
                                  agregarProductoFijoPromoForm(sel.value, cant.value || 1);
                                  sel.value = "";
                                  cant.value = "1";
                                }
                              }}
                            >
                              <span>➕ Incluir</span>
                            </button>
                          </div>
                        </div>

                        <div className="form-group" style={{ marginTop: '0.5rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <label className="form-label" style={{ marginBottom: 0 }}>Pasos de Selección (Combo)</label>
                            <button
                              type="button"
                              className="btn-secondary"
                              onClick={agregarPasoPromoForm}
                              style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}
                            >
                              ➕ Agregar Paso
                            </button>
                          </div>

                          {promoPasos.length === 0 ? (
                            <p style={{ fontSize: '0.85rem', fontStyle: 'italic', color: 'var(--text-secondary)', textAlign: 'center', padding: '1.5rem', border: '1px dashed rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                              Agrega al menos un paso para definir qué productos componen esta promoción.
                            </p>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                              {promoPasos.map((paso, pIdx) => {
                                const idKey = paso.id || paso.temp_id;
                                const isReal = !!paso.id;
                                return (
                                  <div key={idKey} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', padding: '1rem' }}>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                                      <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                                        #{pIdx + 1}
                                      </span>
                                      <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Ej. Elige tu Bebida"
                                        style={{ flex: 1, height: '32px', fontSize: '0.85rem' }}
                                        value={paso.nombre_paso}
                                        onChange={(e) => actualizarNombrePasoForm(idKey, isReal, e.target.value)}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => eliminarPasoPromoForm(idKey, isReal)}
                                        style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.3rem 0.5rem', borderRadius: '4px' }}
                                        title="Eliminar Paso"
                                      >
                                        🗑️
                                      </button>
                                    </div>

                                    {/* Opciones del paso */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                      <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Productos Opcionales en este Paso:</span>
                                      {paso.opciones.length === 0 ? (
                                        <p style={{ fontSize: '0.8rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>No hay opciones agregadas aún.</p>
                                      ) : (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                          {paso.opciones.map(opc => (
                                            <div key={opc.producto_id} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.8rem' }}>
                                              <span>{opc.nombre_producto}</span>
                                              {parseFloat(opc.precio_adicional) > 0 && (
                                                <span style={{ color: 'var(--accent-primary)', fontSize: '0.75rem' }}>
                                                  (+${parseFloat(opc.precio_adicional)})
                                                </span>
                                              )}
                                              <button
                                                type="button"
                                                onClick={() => eliminarOpcionDelPasoForm(idKey, isReal, opc.producto_id)}
                                                style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem', padding: '0 0.1rem' }}
                                              >
                                                &times;
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                      )}

                                      {/* Añadir opción al paso */}
                                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', alignItems: 'center' }}>
                                        <select
                                          className="form-input form-select"
                                          style={{ height: '38px', fontSize: '0.85rem', flex: '1 1 auto', minWidth: '180px', padding: '0.3rem 0.75rem', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                                          id={`sel-prod-${idKey}`}
                                          defaultValue=""
                                        >
                                          <option value="" disabled>-- Añadir Producto --</option>
                                          {productos.map(p => (
                                            <option key={p.id} value={p.id}>{p.nombre} (${parseFloat(p.precio)})</option>
                                          ))}
                                        </select>
                                        <input
                                          type="number"
                                          className="form-input"
                                          placeholder="Extra $"
                                          style={{ width: '75px', flexShrink: 0, height: '38px', fontSize: '0.85rem', padding: '0.3rem 0.5rem', textAlign: 'center' }}
                                          id={`extra-price-${idKey}`}
                                        />
                                        <button
                                          type="button"
                                          className="btn-primary"
                                          style={{ height: '38px', width: 'auto', flexShrink: 0, padding: '0 1rem', fontSize: '0.85rem', fontWeight: '600', whiteSpace: 'nowrap' }}
                                          onClick={() => {
                                            const sel = document.getElementById(`sel-prod-${idKey}`);
                                            const extra = document.getElementById(`extra-price-${idKey}`);
                                            if (sel && sel.value) {
                                              agregarOpcionAlPasoForm(idKey, isReal, sel.value, extra.value || 0);
                                              sel.value = "";
                                              extra.value = "";
                                            }
                                          }}
                                        >
                                          Añadir
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        <button
                          type="submit"
                          className="btn-primary"
                          style={{ width: '100%', height: '40px', marginTop: '1rem' }}
                          disabled={promoLoading}
                        >
                          {promoLoading ? 'Guardando...' : 'Guardar Promoción'}
                        </button>
                      </form>
                    </>
                  )}
                </div>

                {/* Listado de Promociones (Derecha) */}
                <div className="admin-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <div className="admin-card-header">
                    <h3 className="section-title">📋 Promociones Configuradas</h3>
                    <p className="section-subtitle">Gestión de combos y promociones disponibles en el sistema</p>
                  </div>

                  {promocionesLoading && (
                    <div className="loading-container" style={{ marginTop: '2rem' }}>
                      <div className="spinner"></div>
                      <span>Cargando promociones...</span>
                    </div>
                  )}

                  {!promocionesLoading && promoError && (
                    <div className="alert alert-error" style={{ margin: '1rem 0' }}>
                      <span>{promoError}</span>
                    </div>
                  )}

                  {!promocionesLoading && !promoError && promociones.length === 0 && (
                    <p className="empty-catalog" style={{ textAlign: 'center', marginTop: '3rem' }}>
                      No hay promociones registradas aún.
                    </p>
                  )}

                  {!promocionesLoading && !promoError && promociones.length > 0 && (
                    <div className="users-list-container" style={{ flex: 1, overflowY: 'auto', marginTop: '1rem' }}>
                      {promociones.map((promo) => (
                        <div key={promo.id} className="user-list-item" style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontSize: '1.25rem' }}>{promo.emoji || '🎁'}</span>
                              <span className="user-list-name" style={{ fontWeight: '700', fontSize: '1rem' }}>
                                {promo.nombre}
                              </span>
                              <span className={`badge ${promo.activo !== false ? 'badge-admin' : ''}`} style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem' }}>
                                {promo.activo !== false ? 'Activo' : 'Inactivo'}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <span className="badge" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                ${parseFloat(promo.precio).toLocaleString('es-CL', { minimumFractionDigits: 0 })}
                              </span>
                              <button
                                type="button"
                                onClick={() => iniciarEdicionPromo(promo)}
                                className="btn-edit-user"
                                title="Editar promoción"
                                style={{ padding: '0.2rem', border: 'none', background: 'transparent', cursor: 'pointer' }}
                              >
                                ✏️
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeletePromo(promo.id, promo.nombre)}
                                className="btn-delete-user"
                                title="Eliminar promoción"
                                style={{ padding: '0.2rem', border: 'none', background: 'transparent', cursor: 'pointer' }}
                              >
                                🗑️
                              </button>
                            </div>
                          </div>

                          {/* Mostrar resumen de productos fijos */}
                          {promo.productos_fijos && promo.productos_fijos.length > 0 && (
                            <div style={{ paddingLeft: '1.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                              <strong style={{ color: 'var(--accent-primary)' }}>📌 Incluye Fijo: </strong>
                              <span style={{ color: 'var(--text-primary)' }}>
                                {promo.productos_fijos.map(pf => `${pf.cantidad}x ${pf.nombre_producto}`).join(', ')}
                              </span>
                            </div>
                          )}

                          {/* Mostrar resumen de los pasos de la promo */}
                          {promo.pasos && promo.pasos.length > 0 && (
                            <div style={{ paddingLeft: '1.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                              {promo.pasos.map((paso, idx) => (
                                <div key={paso.id} style={{ marginTop: '0.25rem' }}>
                                  <strong style={{ color: 'var(--text-primary)' }}>Paso {idx + 1}: {paso.nombre_paso}</strong>
                                  <span style={{ color: 'var(--text-muted)' }}>
                                    {' '}({paso.opciones.map(o => o.nombre_producto).join(', ')})
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'historial' && (
              <div className="admin-container animate-fade-in" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div className="admin-card full-width" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <div className="admin-card-header">
                    <h3 className="section-title">📋 Historial de Pedidos (Tickets)</h3>
                    <p className="section-subtitle">Visualiza todas las comandas y tickets registrados en el sistema</p>
                  </div>
                  
                  {/* Buscador y Filtros */}
                  <div className="history-filters" style={{ display: 'flex', gap: '1rem', padding: '0.75rem 1rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div style={{ flex: '1 1 100px', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>N° Ticket</label>
                      <input
                        type="text"
                        placeholder="Buscar N°..."
                        className="form-input"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', height: '38px' }}
                        value={filtroTicketId}
                        onChange={(e) => setFiltroTicketId(e.target.value)}
                      />
                    </div>
                    <div style={{ flex: '2 1 180px', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Nombre de Cliente</label>
                      <input
                        type="text"
                        placeholder="Buscar cliente..."
                        className="form-input"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', height: '38px' }}
                        value={filtroCliente}
                        onChange={(e) => setFiltroCliente(e.target.value)}
                      />
                    </div>
                    <div style={{ flex: '1.5 1 140px', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Fecha Inicio</label>
                      <input
                        type="date"
                        className="form-input"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', height: '38px', color: 'var(--text-primary)' }}
                        value={filtroFechaInicio}
                        onChange={(e) => setFiltroFechaInicio(e.target.value)}
                      />
                    </div>
                    <div style={{ flex: '1.5 1 140px', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Fecha Fin</label>
                      <input
                        type="date"
                        className="form-input"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', height: '38px', color: 'var(--text-primary)' }}
                        value={filtroFechaFin}
                        onChange={(e) => setFiltroFechaFin(e.target.value)}
                      />
                    </div>
                    {(filtroTicketId || filtroCliente || filtroFechaInicio || filtroFechaFin) && (
                      <div style={{ display: 'flex' }}>
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ height: '38px', padding: '0.5rem 1rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                          onClick={() => {
                            setFiltroTicketId('');
                            setFiltroCliente('');
                            setFiltroFechaInicio('');
                            setFiltroFechaFin('');
                          }}
                        >
                          Limpiar Filtros
                        </button>
                      </div>
                    )}
                  </div>

                  {loadingHistorial ? (
                    <div className="loading-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem' }}>
                      <div className="spinner"></div>
                      <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Cargando historial...</p>
                    </div>
                  ) : historialPedidos.length === 0 ? (
                    <div className="empty-order" style={{ minHeight: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="empty-icon">📋</span>
                      <p style={{ color: 'var(--text-secondary)' }}>No se han registrado pedidos todavía.</p>
                    </div>
                  ) : (
                    (() => {
                      const pedidosFiltrados = historialPedidos.filter((ped) => {
                        if (filtroTicketId && !ped.id.toString().includes(filtroTicketId.trim())) {
                          return false;
                        }
                        if (filtroCliente && !ped.cliente_nombre.toLowerCase().includes(filtroCliente.toLowerCase().trim())) {
                          return false;
                        }
                        
                        // Obtener fecha del ticket en formato local YYYY-MM-DD
                        const dateObj = new Date(ped.fecha_hora);
                        const year = dateObj.getFullYear();
                        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                        const day = String(dateObj.getDate()).padStart(2, '0');
                        const fechaPedLocal = `${year}-${month}-${day}`;

                        if (filtroFechaInicio && fechaPedLocal < filtroFechaInicio) {
                          return false;
                        }
                        if (filtroFechaFin && fechaPedLocal > filtroFechaFin) {
                          return false;
                        }
                        return true;
                      });

                      if (pedidosFiltrados.length === 0) {
                        return (
                          <div className="empty-order" style={{ minHeight: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <span className="empty-icon">🔍</span>
                            <p style={{ color: 'var(--text-secondary)' }}>No se encontraron tickets con los filtros especificados.</p>
                          </div>
                        );
                      }

                      return (
                        <div className="history-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
                          {pedidosFiltrados.map((ped) => (
                            <div
                              key={ped.id}
                              className="history-list-item-btn"
                              onClick={() => setComandaData({
                                ticket: ped.id,
                                cliente: ped.cliente_nombre,
                                fecha_hora: ped.fecha_hora,
                                productos: ped.productos.map(p => ({
                                  id: p.producto_id,
                                  nombre: p.nombre_producto,
                                  cantidad: p.cantidad,
                                  precio: parseFloat(p.precio_unitario)
                                })),
                                total: parseFloat(ped.total),
                                atendido_por: ped.atendido_por,
                                nota: ped.nota,
                                tipo_entrega: ped.tipo_entrega,
                                tipo_transaccion: ped.tipo_transaccion
                              })}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <span style={{ fontWeight: '700', color: 'var(--accent-primary)', fontSize: '1rem' }}>
                                  Ticket #{ped.id}
                                </span>
                                <span className="badge" style={{
                                  background: ped.tipo_entrega === 'Llevar' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                  border: ped.tipo_entrega === 'Llevar' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                                  color: ped.tipo_entrega === 'Llevar' ? (isDark ? '#fca5a5' : '#dc2626') : (isDark ? '#a7f3d0' : '#047857'),
                                  fontSize: '0.75rem',
                                  padding: '0.15rem 0.5rem'
                                }}>
                                  {ped.tipo_entrega === 'Llevar' ? 'Llevar' : 'Servir'}
                                </span>
                                <span className="badge" style={{
                                  background: ped.tipo_transaccion === 'Crédito' 
                                    ? 'rgba(59, 130, 246, 0.15)' 
                                    : ped.tipo_transaccion === 'Débito' 
                                      ? 'rgba(16, 185, 129, 0.15)' 
                                      : 'rgba(234, 179, 8, 0.15)',
                                  border: ped.tipo_transaccion === 'Crédito' 
                                    ? '1px solid rgba(59, 130, 246, 0.3)' 
                                    : ped.tipo_transaccion === 'Débito' 
                                      ? '1px solid rgba(16, 185, 129, 0.3)' 
                                      : '1px solid rgba(234, 179, 8, 0.3)',
                                  color: ped.tipo_transaccion === 'Crédito' 
                                    ? (isDark ? '#93c5fd' : '#1d4ed8') 
                                    : ped.tipo_transaccion === 'Débito' 
                                      ? (isDark ? '#a7f3d0' : '#047857') 
                                      : (isDark ? '#fef08a' : '#b45309'),
                                  fontSize: '0.75rem',
                                  padding: '0.15rem 0.5rem'
                                }}>
                                  {ped.tipo_transaccion || 'Efectivo'}
                                </span>
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: '600' }}>
                                  - {ped.cliente_nombre}
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                  {new Date(ped.fecha_hora).toLocaleDateString('es-CL')} - {new Date(ped.fecha_hora).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>➔</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()
                  )}
                </div>
              </div>
            )}

            {activeTab === 'cierre' && (
              <div className="admin-container animate-fade-in" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div className="admin-card full-width" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <div className="admin-card-header" style={{ marginBottom: '1rem' }}>
                    <h3 className="section-title">📊 Informe de Cierre de Caja y Reportes</h3>
                    <p className="section-subtitle">Consulta el resumen de ventas del día e imprime o exporta reportes mensuales a Excel</p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', flex: 1, minHeight: 0, overflow: 'hidden' }}>
                    {/* Columna Izquierda: Cierre de Caja del Día */}
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, background: 'rgba(255, 255, 255, 0.03)', borderRadius: '16px', padding: '1.25rem', border: '1px solid var(--glass-border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>📅 Cierre Diario</h4>
                        {cierreData && window.electronAPI && (
                          <button
                            type="button"
                            className="btn-secondary"
                            style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem', height: '32px' }}
                            onClick={() => {
                              window.electronAPI.printReport({
                                fecha: fechaCierre,
                                total_ventas: cierreData.total_ventas,
                                total_efectivo: cierreData.total_efectivo,
                                total_debito: cierreData.total_debito,
                                total_credito: cierreData.total_credito,
                                total_tarjeta: cierreData.total_tarjeta,
                                productos_vendidos: cierreData.productos_vendidos,
                                ingredientes_gastados: cierreData.ingredientes_gastados,
                                has_arqueo: !!cierreRegistradoData,
                                cargado_por: cierreRegistradoData ? cierreRegistradoData.cargado_por : '',
                                fondo_apertura: cierreRegistradoData ? cierreRegistradoData.fondo_apertura : 0,
                                efectivo_real: cierreRegistradoData ? cierreRegistradoData.efectivo_real : 0,
                                diferencia: cierreRegistradoData ? cierreRegistradoData.diferencia : 0,
                                observaciones: cierreRegistradoData ? cierreRegistradoData.observaciones : '',
                                inventario_actual: listaIngredientes
                              });
                            }}
                          >
                            🖨️ Imprimir Reporte
                          </button>
                        )}
                      </div>
                      
                      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', alignItems: 'center' }}>
                        <label style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Seleccionar Fecha:</label>
                        <input
                          type="date"
                          className="form-input"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.9rem', height: '36px', width: '150px', color: 'var(--text-primary)' }}
                          value={fechaCierre}
                          onChange={(e) => setFechaCierre(e.target.value)}
                        />
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ height: '36px', padding: '0 1rem', fontSize: '0.85rem' }}
                          onClick={() => cargarCierreCaja()}
                        >
                          🔄 Recargar
                        </button>
                      </div>

                      {loadingCierre ? (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                          <div className="spinner"></div>
                          <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Cargando datos del cierre...</p>
                        </div>
                      ) : errorCierre ? (
                        <div className="alert alert-error" style={{ margin: 0 }}>
                          <span>{errorCierre}</span>
                        </div>
                      ) : cierreData ? (
                        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.85rem', paddingRight: '0.25rem' }}>
                          
                          {/* Resumen de Ventas Calculado del Día */}
                          <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '1rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                              <span style={{ color: 'var(--text-secondary)' }}>Ventas Totales:</span>
                              <strong style={{ fontSize: '1.2rem', color: 'var(--accent-primary)' }}>
                                ${cierreData.total_ventas.toLocaleString('es-CL', { minimumFractionDigits: 0 })}
                              </strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Rango de Tickets:</span>
                              <span style={{ fontWeight: 'bold' }}>
                                {cierreData.ticket_inicio ? `Ticket #${cierreData.ticket_inicio} al #${cierreData.ticket_fin}` : 'Sin ventas hoy'}
                              </span>
                            </div>
                          </div>

                          <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                              <span>💵 Total Efectivo:</span>
                              <strong>${cierreData.total_efectivo.toLocaleString('es-CL', { minimumFractionDigits: 0 })}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                              <span>💳 Total Débito:</span>
                              <strong>${cierreData.total_debito.toLocaleString('es-CL', { minimumFractionDigits: 0 })}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                              <span>💳 Total Crédito:</span>
                              <strong>${cierreData.total_credito.toLocaleString('es-CL', { minimumFractionDigits: 0 })}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '0.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                              <span>💳 Total Tarjeta (Créd+Déb):</span>
                              <strong>${cierreData.total_tarjeta.toLocaleString('es-CL', { minimumFractionDigits: 0 })}</strong>
                            </div>
                          </div>

                          {/* Desglose de Ventas y Consumo de Materia Prima (Junto al informe de ventas) */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                            {/* Productos Vendidos */}
                            <div className="cierre-sub-card">
                              <h5 className="cierre-sub-card-title">📦 Resumen de Ventas (Productos)</h5>
                              {cierreData.productos_vendidos && cierreData.productos_vendidos.length > 0 ? (
                                <div className="cierre-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                  {cierreData.productos_vendidos.map((p, idx) => (
                                    <div key={idx} className="cierre-list-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <span className="cierre-item-name" style={{ flex: 1 }}>{p.nombre_producto}</span>
                                      <span style={{ marginRight: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                        {p.cantidad_vendida} un.
                                      </span>
                                      <strong className="cierre-item-qty">
                                        ${(p.total_pesos || 0).toLocaleString('es-CL', { minimumFractionDigits: 0 })}
                                      </strong>
                                    </div>
                                  ))}
                                  <div className="cierre-list-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px dashed var(--accent-primary)', paddingTop: '0.65rem', marginTop: '0.5rem', background: 'rgba(255, 255, 255, 0.06)', fontWeight: 'bold' }}>
                                    <span className="cierre-item-name" style={{ fontWeight: '700' }}>Total Productos:</span>
                                    <strong style={{ color: 'var(--accent-primary)', fontSize: '0.98rem' }}>
                                      ${cierreData.productos_vendidos.reduce((acc, curr) => acc + (curr.total_pesos || 0), 0).toLocaleString('es-CL', { minimumFractionDigits: 0 })}
                                    </strong>
                                  </div>
                                </div>
                              ) : (
                                <p className="cierre-empty-text">No hay productos vendidos en esta fecha.</p>
                              )}
                            </div>

                            {/* Materia Prima Gastada */}
                            <div className="cierre-sub-card">
                              <h5 className="cierre-sub-card-title">🥑 Consumo Estimado de Materia Prima</h5>
                              {cierreData.ingredientes_gastados && cierreData.ingredientes_gastados.length > 0 ? (
                                <div className="cierre-list">
                                  {cierreData.ingredientes_gastados.map((ing, idx) => (
                                    <div key={idx} className="cierre-list-item">
                                      <span className="cierre-item-name">{ing.ingrediente_nombre}</span>
                                      <strong className="cierre-item-qty">{parseFloat(ing.cantidad_gastada).toLocaleString('es-CL', { maximumFractionDigits: 2 })}</strong>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="cierre-empty-text">No hay consumo de materia prima registrado hoy.</p>
                              )}
                            </div>
                          </div>

                          {/* SECCIÓN CUADRADO DE CAJA (Al final del informe) */}
                          {cierreRegistradoData && !modoEdicionCierre ? (
                            /* Vista: Caja ya cuadrada */
                            <div className="cierre-registrado-card">
                              <h5 className="cierre-card-title">✅ Caja Cuadrada para este Día</h5>
                              
                              <div className="cierre-card-details">
                                <div className="cierre-card-row">
                                  <span>Cerrado por:</span>
                                  <strong>{cierreRegistradoData.cargado_por}</strong>
                                </div>
                                <div className="cierre-card-row">
                                  <span>Fondo Inicial:</span>
                                  <strong>${cierreRegistradoData.fondo_apertura.toLocaleString('es-CL', { minimumFractionDigits: 0 })}</strong>
                                </div>
                                <div className="cierre-card-row">
                                  <span>Efectivo Ventas:</span>
                                  <strong>${cierreRegistradoData.total_efectivo.toLocaleString('es-CL', { minimumFractionDigits: 0 })}</strong>
                                </div>
                                <div className="cierre-card-row highlighted-row">
                                  <span>Efectivo Esperado:</span>
                                  <strong>${(cierreRegistradoData.total_efectivo + cierreRegistradoData.fondo_apertura).toLocaleString('es-CL', { minimumFractionDigits: 0 })}</strong>
                                </div>
                                <div className="cierre-card-row highlighted-row">
                                  <span>Efectivo Real en Caja:</span>
                                  <strong>${cierreRegistradoData.efectivo_real.toLocaleString('es-CL', { minimumFractionDigits: 0 })}</strong>
                                </div>
                                
                                <div className={`cierre-card-row result-row ${cierreRegistradoData.diferencia === 0 ? 'status-ok' : cierreRegistradoData.diferencia > 0 ? 'status-surplus' : 'status-shortage'}`}>
                                  <span>Diferencia:</span>
                                  <strong>
                                    {cierreRegistradoData.diferencia === 0 
                                      ? 'Caja Cuadrada ($0)' 
                                      : `${cierreRegistradoData.diferencia > 0 ? 'Sobrante (+$' : 'Faltante (-$'}${Math.abs(cierreRegistradoData.diferencia).toLocaleString('es-CL', { minimumFractionDigits: 0 })}`}
                                  </strong>
                                </div>

                                {cierreRegistradoData.observaciones && (
                                  <div className="cierre-card-obs">
                                    <span>Observaciones:</span>
                                    <p>{cierreRegistradoData.observaciones}</p>
                                  </div>
                                )}
                              </div>

                              <button 
                                type="button" 
                                className="btn-secondary" 
                                style={{ marginTop: '0.75rem', width: '100%' }}
                                onClick={() => setModoEdicionCierre(true)}
                              >
                                ✏️ Corregir Arqueo
                              </button>
                            </div>
                          ) : (
                            /* Vista: Formulario de Arqueo */
                            <form onSubmit={handleGuardarCuadradoCaja} className="cierre-form-card">
                              <h5 className="cierre-card-title">🔐 Realizar Arqueo (Cuadrado de Caja)</h5>
                              
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                                <div className="cierre-form-field">
                                  <label>💵 Fondo Inicial de Caja (Apertura):</label>
                                  <input 
                                    type="number" 
                                    className="form-input" 
                                    value={fondoApertura} 
                                    onChange={(e) => setFondoApertura(e.target.value)}
                                    placeholder="Ej: 50000"
                                    style={{ height: '36px', color: 'var(--text-primary)' }}
                                  />
                                </div>

                                <div className="cierre-form-field">
                                  <label>💰 Efectivo Real en Caja (Contado):</label>
                                  <input 
                                    type="number" 
                                    className="form-input" 
                                    value={efectivoReal} 
                                    onChange={(e) => setEfectivoReal(e.target.value)}
                                    placeholder="Ingresa el monto total contado"
                                    style={{ height: '36px', color: 'var(--text-primary)' }}
                                  />
                                </div>

                                <div className="cierre-form-field">
                                  <label>📝 Observaciones / Notas:</label>
                                  <textarea 
                                    className="form-input" 
                                    value={observacionesCierre} 
                                    onChange={(e) => setObservacionesCierre(e.target.value)}
                                    placeholder="Nota opcional (ej: retiro de sencillo, descuadre de vuelto)"
                                    style={{ height: '60px', color: 'var(--text-primary)', padding: '0.5rem', resize: 'none' }}
                                  />
                                </div>

                                {/* Resumen y cálculo de diferencia en tiempo real */}
                                {(() => {
                                  const fAperturaNum = parseFloat(fondoApertura) || 0;
                                  const eRealNum = parseFloat(efectivoReal) || 0;
                                  const eEsperadoNum = (cierreData.total_efectivo || 0) + fAperturaNum;
                                  const difNum = eRealNum - eEsperadoNum;

                                  return (
                                    <div className="cierre-live-summary">
                                      <div className="live-row">
                                        <span>Efectivo Esperado:</span>
                                        <strong>${eEsperadoNum.toLocaleString('es-CL', { minimumFractionDigits: 0 })}</strong>
                                      </div>
                                      <div className="live-row">
                                        <span>Efectivo Declarado:</span>
                                        <strong>${eRealNum.toLocaleString('es-CL', { minimumFractionDigits: 0 })}</strong>
                                      </div>
                                      <div className={`live-row live-difference ${efectivoReal === '' ? '' : difNum === 0 ? 'status-ok' : difNum > 0 ? 'status-surplus' : 'status-shortage'}`}>
                                        <span>Diferencia:</span>
                                        <strong>
                                          {efectivoReal === '' 
                                            ? 'Por calcular' 
                                            : difNum === 0 
                                              ? 'Cuadrado ($0)' 
                                              : `${difNum > 0 ? 'Sobrante (+$' : 'Faltante (-$'}${Math.abs(difNum).toLocaleString('es-CL', { minimumFractionDigits: 0 })}`}
                                        </strong>
                                      </div>
                                    </div>
                                  );
                                })()}

                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                  {modoEdicionCierre && (
                                    <button 
                                      type="button" 
                                      className="btn-secondary" 
                                      style={{ flex: 1, height: '40px' }}
                                      onClick={() => {
                                        setModoEdicionCierre(false);
                                        // Restablecer valores originales si se cancela
                                        if (cierreRegistradoData) {
                                          setFondoApertura(cierreRegistradoData.fondo_apertura);
                                          setEfectivoReal(cierreRegistradoData.efectivo_real.toString());
                                          setObservacionesCierre(cierreRegistradoData.observaciones);
                                        }
                                      }}
                                    >
                                      Cancelar
                                    </button>
                                  )}
                                  <button 
                                    type="submit" 
                                    className="btn-primary" 
                                    style={{ flex: 2, height: '40px', background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', boxShadow: 'none' }}
                                    disabled={guardandoCierre}
                                  >
                                    {guardandoCierre ? 'Guardando...' : modoEdicionCierre ? 'Actualizar Arqueo' : 'Finalizar Arqueo'}
                                  </button>
                                </div>
                              </div>
                            </form>
                          )}
                        </div>
                      ) : (
                        <p style={{ color: 'var(--text-muted)' }}>Selecciona una fecha para visualizar el cierre.</p>
                      )}
                    </div>

                    {/* Columna Derecha: Reportes y Exportaciones */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%', overflowY: 'auto', paddingRight: '0.25rem' }}>
                      {/* Reporte Mensual a Excel */}
                      <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '16px', padding: '1.25rem', border: '1px solid var(--glass-border)' }}>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>📈 Reporte Mensual a Excel</h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                          Descarga un archivo de Excel (.xlsx) con el resumen diario de ventas (separando efectivo de tarjetas) de todo el mes seleccionado.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Seleccionar Mes:</label>
                            <input
                              type="month"
                              className="form-input"
                              style={{ padding: '0.5rem 1rem', fontSize: '0.95rem', height: '38px', color: 'var(--text-primary)' }}
                              value={mesExcel}
                              onChange={(e) => setMesExcel(e.target.value)}
                            />
                          </div>

                          <button
                            type="button"
                            className="btn-primary"
                            style={{ marginTop: '1rem', height: '42px', gap: '0.5rem' }}
                            onClick={descargarExcelMensual}
                          >
                            📥 Descargar Excel (.xlsx)
                          </button>
                        </div>
                      </div>

                      {/* Nuevo Reporte de Ventas Detallado por Rango de Fechas */}
                      <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '16px', padding: '1.25rem', border: '1px solid var(--glass-border)' }}>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>📊 Reporte de Ventas por Rango (Detallado)</h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                          Descarga un archivo de Excel (.xlsx) con el detalle de todos los productos vendidos, sus cantidades y los montos totales recaudados entre las fechas seleccionadas.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                          <div style={{ display: 'flex', gap: '1rem' }}>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Fecha Inicio:</label>
                              <input
                                type="date"
                                className="form-input"
                                style={{ padding: '0.5rem 1rem', fontSize: '0.95rem', height: '38px', color: 'var(--text-primary)' }}
                                value={fechaInicioReporte}
                                onChange={(e) => setFechaInicioReporte(e.target.value)}
                              />
                            </div>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Fecha Fin:</label>
                              <input
                                type="date"
                                className="form-input"
                                style={{ padding: '0.5rem 1rem', fontSize: '0.95rem', height: '38px', color: 'var(--text-primary)' }}
                                value={fechaFinReporte}
                                onChange={(e) => setFechaFinReporte(e.target.value)}
                              />
                            </div>
                          </div>

                          <button
                            type="button"
                            className="btn-primary"
                            style={{ marginTop: '1rem', height: '42px', gap: '0.5rem' }}
                            onClick={descargarReporteProductosRango}
                          >
                            📥 Descargar Reporte (.xlsx)
                          </button>
                        </div>
                      </div>

                      {/* Configuración de Impresora */}
                      {window.electronAPI && (
                        <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '16px', padding: '1.25rem', border: '1px solid var(--glass-border)' }}>
                          <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.75rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            🖨️ Impresora de Comandas
                          </h4>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                            Selecciona la impresora que se utilizará para imprimir automáticamente las comandas de cocina y los reportes de cierre de caja.
                          </p>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <select 
                              value={selectedPrinter} 
                              onChange={handlePrinterChange}
                              className="form-input"
                              style={{ 
                                padding: '0.5rem 1rem', 
                                fontSize: '0.95rem', 
                                height: '38px', 
                                color: 'var(--text-primary)', 
                                background: 'var(--input-bg)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '12px',
                                width: '100%',
                                cursor: 'pointer'
                              }}
                            >
                              <option value="">Predeterminada del Sistema</option>
                              {printers.map(p => (
                                <option key={p.name} value={p.name}>
                                  {p.name}
                                </option>
                              ))}
                            </select>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                              Impresora configurada actualmente: <strong>{selectedPrinter || 'Predeterminada'}</strong>
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Configuración de Correo de Recepción */}
                      <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '16px', padding: '1.25rem', border: '1px solid var(--glass-border)', marginTop: '1rem' }}>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          📬 Correo de Recepción de Reportes
                        </h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                          Ingresa el correo destinatario que recibirá los reportes de inventario y cierres de caja.
                        </p>

                        <form onSubmit={guardarConfiguracion} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Correo Destinatario (Para)</label>
                            <input
                              type="email"
                              className="form-input"
                              placeholder="ejemplo@correo.com"
                              value={configEmailTo}
                              onChange={(e) => setConfigEmailTo(e.target.value)}
                              required
                              style={{
                                padding: '0.5rem 1rem',
                                fontSize: '0.95rem',
                                height: '38px',
                                color: 'var(--text-primary)',
                                background: 'var(--input-bg)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '12px',
                                width: '100%'
                              }}
                            />
                          </div>

                          {configSuccess && (
                            <div className="alert alert-success" style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}>
                              <span>{configSuccess}</span>
                            </div>
                          )}
                          {configError && (
                            <div className="alert alert-error" style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}>
                              <span>{configError}</span>
                            </div>
                          )}

                          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                            <button type="submit" className="btn-primary" style={{ flex: 1, padding: '0.5rem 1rem', fontSize: '0.85rem' }} disabled={configLoading}>
                              {configLoading ? 'Guardando...' : '💾 Guardar Correo'}
                            </button>
                            
                            <button
                              type="button"
                              className="btn-secondary"
                              style={{ flex: 1, padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                              disabled={configLoading}
                              onClick={async () => {
                                try {
                                  setConfigLoading(true);
                                  setConfigSuccess('');
                                  setConfigError('');
                                  
                                  const config = {
                                    REPORT_EMAIL_TO: configEmailTo
                                  };

                                  let saveResponse = await fetch('http://127.0.0.1:5000/api/configuracion', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ config })
                                  });
                                  
                                  if (!saveResponse.ok) {
                                    throw new Error('Error al guardar el correo.');
                                  }

                                  const response = await fetch('http://127.0.0.1:5000/api/reportes/enviar', {
                                    method: 'POST'
                                  });
                                  const data = await response.json();
                                  if (response.ok && data.success) {
                                    setConfigSuccess('¡Reporte de prueba enviado!');
                                  } else {
                                    setConfigError(data.message || 'Error al enviar correo de prueba.');
                                  }
                                } catch (err) {
                                  console.error(err);
                                  setConfigError(err.message || 'Error de red al enviar correo de prueba.');
                                } finally {
                                  setConfigLoading(false);
                                }
                              }}
                            >
                              {configLoading ? 'Enviando...' : '📧 Probar Envío'}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'inventario' && (
              <div className="admin-container animate-fade-in" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div className="admin-card full-width" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <div className="admin-card-header" style={{ marginBottom: '1rem' }}>
                    <h3 className="section-title">🥑 Inventario de Ingredientes</h3>
                    <p className="section-subtitle">Visualiza y gestiona las existencias (stock) de ingredientes para tus productos</p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '2rem', flex: 1, minHeight: 0, overflow: 'hidden' }}>
                    {/* Columna Izquierda: Formularios de Registro/Edición y Entrada de Stock */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%', minHeight: 0, overflowY: 'auto' }}>
                      
                      {/* Registro/Edición */}
                      <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: '16px', padding: '1.25rem', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>
                          {editandoIngId ? '✏️ Editar Ingrediente' : '➕ Nuevo Ingrediente'}
                        </h4>

                        {ingError && (
                          <div className="alert alert-error" style={{ marginBottom: '0.5rem', padding: '0.5rem 0.75rem' }}>
                            <span>{ingError}</span>
                          </div>
                        )}
                        {ingSuccess && (
                          <div className="alert alert-success" style={{ marginBottom: '0.5rem', padding: '0.5rem 0.75rem' }}>
                            <span>{ingSuccess}</span>
                          </div>
                        )}

                        <form onSubmit={editandoIngId ? handleUpdateIngredient : handleCreateIngredient} className="admin-form" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Nombre del Ingrediente</label>
                            <div className="input-wrapper">
                              <input
                                type="text"
                                className="form-input"
                                placeholder="Ej. Carne de Res (gramos)"
                                value={ingNombre}
                                onChange={(e) => setIngNombre(e.target.value)}
                                disabled={ingLoading}
                              />
                              <span className="input-icon">🥑</span>
                            </div>
                          </div>

                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Stock Actual (Cantidad)</label>
                            <div className="input-wrapper">
                              <input
                                type="text"
                                className="form-input"
                                placeholder="Ej. 1000"
                                value={ingStock}
                                onChange={(e) => setIngStock(e.target.value)}
                                disabled={ingLoading}
                              />
                              <span className="input-icon">📦</span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                            {editandoIngId ? (
                              <>
                                <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={ingLoading}>
                                  Guardar
                                </button>
                                <button type="button" onClick={cancelarEdicionIng} className="btn-secondary" style={{ flex: 1 }} disabled={ingLoading}>
                                  Cancelar
                                </button>
                              </>
                            ) : (
                              <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={ingLoading}>
                                {ingLoading ? 'Registrando...' : 'Registrar Ingrediente'}
                              </button>
                            )}
                          </div>
                        </form>
                      </div>

                      {/* Llegada de Materia Prima */}
                      <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: '16px', padding: '1.25rem', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>
                          📦 Llegada de Materia Prima
                        </h4>

                        {llegadaError && (
                          <div className="alert alert-error" style={{ marginBottom: '0.5rem', padding: '0.5rem 0.75rem' }}>
                            <span>{llegadaError}</span>
                          </div>
                        )}
                        {llegadaSuccess && (
                          <div className="alert alert-success" style={{ marginBottom: '0.5rem', padding: '0.5rem 0.75rem' }}>
                            <span>{llegadaSuccess}</span>
                          </div>
                        )}

                        <form onSubmit={handleLlegadaMateriaPrima} className="admin-form" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Seleccionar Materia Prima</label>
                            <div className="input-wrapper">
                              <select
                                className="form-input form-select"
                                value={llegadaIngId}
                                onChange={(e) => setLlegadaIngId(e.target.value)}
                                disabled={llegadaLoading}
                                style={{ color: 'var(--text-primary)', background: 'var(--input-bg)' }}
                              >
                                <option value="">-- Selecciona un ingrediente --</option>
                                {listaIngredientes.map((ing) => (
                                  <option key={ing.id} value={ing.id}>
                                    {ing.nombre} (actual: {parseFloat(ing.stock)})
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Cantidad que Llegó</label>
                            <div className="input-wrapper">
                              <input
                                type="number"
                                step="any"
                                className="form-input"
                                placeholder="Ej. 500"
                                value={llegadaCantidad}
                                onChange={(e) => setLlegadaCantidad(e.target.value)}
                                disabled={llegadaLoading}
                              />
                              <span className="input-icon">➕</span>
                            </div>
                          </div>

                          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={llegadaLoading}>
                            {llegadaLoading ? 'Registrando...' : 'Registrar Ingreso'}
                          </button>
                        </form>
                      </div>

                    </div>

                    {/* Columna Derecha: Tabla de Ingredientes y cantidades */}
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, background: 'rgba(255, 255, 255, 0.03)', borderRadius: '16px', padding: '1.25rem', border: '1px solid var(--glass-border)' }}>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>📋 Existencias Actuales</h4>

                      {listaIngredientes.length === 0 ? (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <p style={{ color: 'var(--text-muted)' }}>No hay ingredientes en el inventario.</p>
                        </div>
                      ) : (
                        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                <th style={{ padding: '0.5rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Ingrediente</th>
                                <th style={{ padding: '0.5rem', color: 'var(--text-secondary)', fontWeight: '600', textAlign: 'right' }}>Stock Disponible</th>
                                <th style={{ padding: '0.5rem', color: 'var(--text-secondary)', fontWeight: '600', textAlign: 'center' }}>Acciones</th>
                              </tr>
                            </thead>
                            <tbody>
                              {listaIngredientes.map((ing) => {
                                const stockNum = parseFloat(ing.stock);
                                const isLowStock = stockNum <= 50; // alerta de stock bajo
                                return (
                                  <tr key={ing.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', verticalAlign: 'middle' }}>
                                    <td style={{ padding: '0.75rem 0.5rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                                      {ing.nombre}
                                    </td>
                                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontWeight: '700', color: isLowStock ? 'var(--error)' : 'var(--text-primary)' }}>
                                      {stockNum.toLocaleString('es-CL', { maximumFractionDigits: 2 })}
                                      {isLowStock && <span style={{ marginLeft: '0.35rem', fontSize: '0.85rem' }} title="Stock bajo">⚠️</span>}
                                    </td>
                                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                        <button
                                          type="button"
                                          onClick={() => iniciarEdicionIng(ing)}
                                          style={{ background: 'rgba(255,255,255,0.05)', border: 'none', cursor: 'pointer', padding: '0.4rem', borderRadius: '8px' }}
                                          title="Editar ingrediente / stock"
                                        >
                                          ✏️
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteIngredient(ing.id, ing.nombre)}
                                          style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', cursor: 'pointer', padding: '0.4rem', borderRadius: '8px' }}
                                          title="Eliminar ingrediente"
                                        >
                                          🗑️
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}



            {/* Modal Overlay / Comanda / etc. */}
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
      {showPromptCliente && (
        <div className="custom-modal-overlay">
          <div className="custom-modal-card">
            <form onSubmit={handleSubmitPedido}>
              <div className="custom-modal-header">
                <span className="custom-modal-icon">👤</span>
                <h3 className="custom-modal-title">Confirmar Pedido</h3>
              </div>
              <div className="custom-modal-body">
                <p className="custom-modal-message" style={{ marginBottom: '1rem' }}>
                  Por favor, ingresa el nombre del cliente para este pedido:
                </p>
                <div className="form-group" style={{ margin: 0 }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Nombre del Cliente (Ej. Carlos Muñoz)"
                    value={clienteNombre}
                    onChange={(e) => setClienteNombre(e.target.value)}
                    autoFocus
                    required
                  />
                </div>
                <div className="form-group" style={{ marginTop: '1.25rem', marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>Tipo de Entrega</label>
                  <div className="delivery-selector-group">
                    <button
                      type="button"
                      className={`delivery-option-btn ${tipoEntrega === 'Servir' ? 'active' : ''}`}
                      onClick={() => setTipoEntrega('Servir')}
                    >
                      Para Servir
                    </button>
                    <button
                      type="button"
                      className={`delivery-option-btn ${tipoEntrega === 'Llevar' ? 'active' : ''}`}
                      onClick={() => setTipoEntrega('Llevar')}
                    >
                      Para Llevar
                    </button>
                  </div>
                </div>
                <div className="form-group" style={{ marginTop: '1.25rem', marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>Tipo de Transacción</label>
                  <div className="delivery-selector-group" style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className={`delivery-option-btn ${tipoTransaccion === 'Efectivo' ? 'active' : ''}`}
                      onClick={() => setTipoTransaccion('Efectivo')}
                    >
                      💵 Efectivo
                    </button>
                    <button
                      type="button"
                      className={`delivery-option-btn ${tipoTransaccion === 'Débito' ? 'active' : ''}`}
                      onClick={() => setTipoTransaccion('Débito')}
                    >
                      💳 Débito
                    </button>
                    <button
                      type="button"
                      className={`delivery-option-btn ${tipoTransaccion === 'Crédito' ? 'active' : ''}`}
                      onClick={() => setTipoTransaccion('Crédito')}
                    >
                      💳 Crédito
                    </button>
                  </div>
                </div>
                <div className="form-group" style={{ marginTop: '1.25rem', marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.35rem' }}>Nota para la Cocina (Opcional)</label>
                  <textarea
                    className="form-input"
                    placeholder="Ej. Sin cebolla, extra salsa, papas bien cocidas..."
                    value={pedidoNota}
                    onChange={(e) => setPedidoNota(e.target.value)}
                    rows="2"
                    style={{ resize: 'none', height: 'auto', paddingTop: '0.5rem', fontFamily: 'inherit' }}
                  />
                </div>
              </div>
              <div className="custom-modal-actions">
                <button
                  type="button"
                  className="btn-secondary custom-modal-btn-cancel"
                  onClick={() => setShowPromptCliente(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary custom-modal-btn-confirm"
                >
                  Aceptar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {comandaData && (
        <div className="custom-modal-overlay">
          <div className="comanda-ticket-card">
            {/* Cabecera del Ticket */}
            <div className="comanda-header">
              <h2 className="comanda-client-name">{comandaData.cliente}</h2>
              <div className="comanda-local-name">Calibre 25</div>
              <div className="comanda-ticket-number">Ticket N° {comandaData.ticket}</div>
              <div style={{ marginTop: '0.5rem', fontWeight: 'bold', fontSize: '0.95rem', color: comandaData.tipo_entrega === 'Llevar' ? '#dc2626' : '#059669' }}>
                {comandaData.tipo_entrega === 'Llevar' ? 'PARA LLEVAR' : 'PARA SERVIR'}
                {comandaData.tipo_transaccion && ` | MÉT. PAGO: ${comandaData.tipo_transaccion.toUpperCase()}`}
              </div>
              <div className="comanda-date-time">
                <span>Fecha: {new Date(comandaData.fecha_hora).toLocaleDateString('es-CL')}</span>
                <span>Hora: {new Date(comandaData.fecha_hora).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>

            {/* Listado de Productos como tabla */}
            <div className="comanda-body">
              <table className="comanda-table">
                <thead>
                  <tr>
                    <th>Cant</th>
                    <th>Producto</th>
                    <th style={{ textAlign: 'right' }}>Precio</th>
                  </tr>
                </thead>
                <tbody>
                  {comandaData.productos.map((prod, idx) => (
                    <tr key={idx}>
                      <td>{prod.cantidad}</td>
                      <td>{prod.nombre}</td>
                      <td style={{ textAlign: 'right' }}>
                        ${(parseFloat(prod.precio) * prod.cantidad).toLocaleString('es-CL', { minimumFractionDigits: 0 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pie del Ticket */}
            <div className="comanda-footer">
              {comandaData.nota && (
                <div className="comanda-note" style={{ borderBottom: '1.5px dashed var(--ticket-border)', paddingBottom: '0.5rem', marginBottom: '0.5rem', fontStyle: 'italic', fontSize: '0.85rem', color: 'var(--ticket-text-secondary)', textAlign: 'left' }}>
                  Nota: "{comandaData.nota}"
                </div>
              )}
              <div className="comanda-attendant">
                Fue atendido por {comandaData.atendido_por}
              </div>
              <div className="comanda-total-row">
                <span className="comanda-total-label">TOTAL:</span>
                <span className="comanda-total-value">
                  ${comandaData.total.toLocaleString('es-CL', { minimumFractionDigits: 0 })}
                </span>
              </div>
            </div>

            {/* Acción de Cerrar */}
            <div className="comanda-actions" style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              {window.electronAPI && (
                <button
                  type="button"
                  className="btn-secondary comanda-btn-print"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  onClick={() => window.electronAPI.printTicket(comandaData)}
                >
                  🖨️ Reimprimir Ticket
                </button>
              )}
              <button
                type="button"
                className="btn-primary comanda-btn-close"
                style={{ flex: 1 }}
                onClick={() => setComandaData(null)}
              >
                Cerrar Comanda
              </button>
            </div>
          </div>
        </div>
      )}

      {showPromoSelectorModal && selectedPromo && (
        <div className="custom-modal-overlay">
          <div className="custom-modal" style={{ maxWidth: '480px', width: '90%', padding: '1.75rem' }}>
            <div className="custom-modal-header" style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                {selectedPromo.emoji || '🎁'} Configurar Promoción: {selectedPromo.nombre}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', fontWeight: '700', marginTop: '0.35rem' }}>
                Paso {currentPromoStepIndex + 1} de {selectedPromo.pasos.length}: {selectedPromo.pasos[currentPromoStepIndex].nombre_paso}
              </p>
            </div>
            
            <div className="custom-modal-body" style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '0.25rem' }}>
              {selectedPromo.pasos[currentPromoStepIndex].opciones.map((opc) => (
                <button
                  key={opc.id}
                  type="button"
                  className="custom-modal-option"
                  onClick={() => seleccionarOpcionPaso(opc)}
                >
                  <span style={{ fontWeight: '600' }}>{opc.nombre_producto}</span>
                  {parseFloat(opc.precio_adicional) > 0 && (
                    <span style={{ fontSize: '0.8rem', background: 'rgba(234, 88, 12, 0.15)', color: 'var(--accent-primary)', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 'bold' }}>
                      +${parseFloat(opc.precio_adicional).toLocaleString('es-CL', { minimumFractionDigits: 0 })}
                    </span>
                  )}
                </button>
              ))}
            </div>
            
            <div className="custom-modal-actions" style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ flex: 1 }}
                onClick={() => {
                  if (currentPromoStepIndex > 0) {
                    setCurrentPromoStepIndex(currentPromoStepIndex - 1);
                    setChosenPromoOpciones(chosenPromoOpciones.slice(0, -1));
                  } else {
                    setShowPromoSelectorModal(false);
                    setSelectedPromo(null);
                  }
                }}
              >
                {currentPromoStepIndex > 0 ? 'Volver' : 'Cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {!user && (
        <button 
          type="button"
          onClick={() => setIsDark(!isDark)} 
          className="theme-toggle"
          title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        >
          {isDark ? '☀️ Claro' : '🌙 Oscuro'}
        </button>
      )}
    </>
  );
}

export default App;
