import { useState, useEffect, useRef } from 'react';
import './App.css';
import logoImg from './assets/logo.png';

// Componente de Selección de Productos con Buscador por Teclado Integrado
const SearchableProductSelect = ({ options, value, onChange, placeholder = "-- Buscar o seleccionar producto --", style, id }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOpt = options.find(o => String(o.value) === String(value));

  const filteredOptions = options.filter(o => 
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%', ...style }} id={id}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          height: '38px',
          padding: '0 0.75rem',
          borderRadius: '8px',
          background: 'var(--input-bg)',
          border: isOpen ? '1.5px solid var(--accent-primary)' : '1px solid var(--glass-border)',
          color: selectedOpt ? 'var(--text-primary)' : 'var(--text-muted)',
          fontSize: '0.85rem',
          cursor: 'pointer',
          userSelect: 'none'
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedOpt ? selectedOpt.label : placeholder}
        </span>
        <span style={{ fontSize: '0.75rem', opacity: 0.7, marginLeft: '0.5rem' }}>▼</span>
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '4px',
          background: 'var(--dropdown-bg, #231209)',
          border: '1.5px solid var(--accent-primary)',
          borderRadius: '12px',
          boxShadow: 'var(--dropdown-shadow, 0 12px 32px rgba(0, 0, 0, 0.85))',
          zIndex: 99999,
          overflow: 'hidden',
          padding: '0.45rem',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)'
        }}>
          <input
            type="text"
            className="form-input"
            placeholder="🔍 Escribe para buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              height: '36px',
              fontSize: '0.85rem',
              marginBottom: '0.45rem',
              background: 'var(--input-bg)',
              color: 'var(--text-primary)',
              border: '1px solid var(--glass-border)',
              borderRadius: '8px'
            }}
          />
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '0.6rem', fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                No hay coincidencias
              </div>
            ) : (
              filteredOptions.map((opt) => (
                <div
                  key={opt.value}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(opt.value);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  style={{
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.84rem',
                    color: String(opt.value) === String(value) ? 'var(--accent-primary)' : 'var(--text-primary)',
                    fontWeight: String(opt.value) === String(value) ? 'bold' : 'normal',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: String(opt.value) === String(value) ? 'rgba(234, 88, 12, 0.25)' : 'transparent',
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = String(opt.value) === String(value) ? 'rgba(234, 88, 12, 0.3)' : 'rgba(234, 88, 12, 0.15)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = String(opt.value) === String(value) ? 'rgba(234, 88, 12, 0.25)' : 'transparent'}
                >
                  <span>{opt.label}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const AutocompleteGhostInput = ({
  value,
  onChange,
  onSelectSuggestion,
  suggestions = [],
  placeholder = '',
  className = 'form-input',
  style = {},
  disabled = false,
  autoFocus = false,
  required = false,
  ...props
}) => {
  const [activeSuggestion, setActiveSuggestion] = useState('');

  useEffect(() => {
    if (!value) {
      setActiveSuggestion('');
      return;
    }
    const valLower = value.toLowerCase();
    const match = suggestions.find(
      sug => sug.toLowerCase().startsWith(valLower) && sug.toLowerCase() !== valLower
    );
    if (match) {
      setActiveSuggestion(match);
    } else {
      setActiveSuggestion('');
    }
  }, [value, suggestions]);

  const handleKeyDown = (e) => {
    if ((e.key === 'Tab' || e.key === 'ArrowRight' || e.key === 'Enter') && activeSuggestion) {
      e.preventDefault();
      onSelectSuggestion(activeSuggestion);
      setActiveSuggestion('');
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', display: 'inline-block' }}>
      {activeSuggestion && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
            padding: 'inherit',
            margin: 'inherit',
            border: '1.5px solid transparent',
            fontFamily: 'inherit',
            fontSize: 'inherit',
            fontWeight: 'inherit',
            lineHeight: 'inherit',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: '14px',
            whiteSpace: 'nowrap',
            overflow: 'hidden'
          }}
        >
          <span style={{ color: 'transparent' }}>{value}</span>
          <span style={{ color: 'rgba(128, 128, 128, 0.55)', opacity: 0.7 }}>
            {activeSuggestion.slice(value.length)}
          </span>
          <span style={{
            marginLeft: '8px',
            fontSize: '0.65rem',
            background: 'var(--glass-bg, rgba(255,255,255,0.1))',
            padding: '2px 5px',
            borderRadius: '4px',
            color: 'var(--text-secondary)',
            opacity: 0.8
          }}>
            [Tab]
          </span>
        </div>
      )}
      <input
        type="text"
        className={className}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        autoFocus={autoFocus}
        required={required}
        style={{
          ...style,
          background: 'var(--input-bg)'
        }}
        {...props}
      />
    </div>
  );
};


const getPromoSubItems = (item) => {
  if (!item) return [];
  const subItems = [];

  const getItemName = (obj) => {
    if (!obj) return '';
    if (typeof obj === 'string') return obj.trim();
    return (
      obj.nombre_producto ||
      obj.nombre ||
      obj.nombre_opcion ||
      obj.producto_nombre ||
      obj.label ||
      ''
    ).trim();
  };

  let prodsIncl = item.productos_incluidos;
  if (typeof prodsIncl === 'string') {
    try { prodsIncl = JSON.parse(prodsIncl); } catch (e) {}
  }

  // 1. Si vienen productos_incluidos (formato procesado por backend / BD)
  if (prodsIncl && Array.isArray(prodsIncl) && prodsIncl.length > 0) {
    const agrupados = prodsIncl.reduce((acc, opt) => {
      const nom = getItemName(opt);
      if (nom && nom !== 'undefined') {
        const cant = parseInt(opt.cantidad) || 1;
        if (!acc[nom]) {
          acc[nom] = { nombre: nom, cantidad: 0 };
        }
        acc[nom].cantidad += cant;
      }
      return acc;
    }, {});

    Object.values(agrupados).forEach(group => {
      const cantStr = group.cantidad > 1 ? `${group.cantidad}x ` : '';
      subItems.push(`${cantStr}${group.nombre}`);
    });
  } else {
    // 2. Productos fijos de la promoción
    if (item.productos_fijos && Array.isArray(item.productos_fijos) && item.productos_fijos.length > 0) {
      item.productos_fijos.forEach(pf => {
        const nom = getItemName(pf);
        if (nom && nom !== 'undefined') {
          const cant = parseInt(pf.cantidad) || 1;
          const cantStr = cant > 1 ? `${cant}x ` : '';
          subItems.push(`${cantStr}${nom}`);
        }
      });
    }

    // 3. Opciones elegidas en los pasos de la promoción (agrupadas)
    if (item.opciones_elegidas && Array.isArray(item.opciones_elegidas) && item.opciones_elegidas.length > 0) {
      const agrupados = item.opciones_elegidas.reduce((acc, opt) => {
        const nom = getItemName(opt);
        if (nom && nom !== 'undefined') {
          const cant = parseInt(opt.cantidad) || 1;
          if (!acc[nom]) {
            acc[nom] = { nombre: nom, cantidad: 0 };
          }
          acc[nom].cantidad += cant;
        }
        return acc;
      }, {});

      Object.values(agrupados).forEach(group => {
        const cantStr = group.cantidad > 1 ? `${group.cantidad}x ` : '';
        subItems.push(`${cantStr}${group.nombre}`);
      });
    }
  }

  return subItems.filter(str => str && !str.includes('undefined'));
};

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
  const [tipoTransaccion, setTipoTransaccion] = useState('Efectivo'); // 'Efectivo', 'Débito', 'Crédito', 'Mixto'
  const [montoEfectivoMixto, setMontoEfectivoMixto] = useState('');
  const [montoDebitoMixto, setMontoDebitoMixto] = useState('');
  const [montoCreditoMixto, setMontoCreditoMixto] = useState('');
  const [comandaData, setComandaData] = useState(null);
  const [historialPedidos, setHistorialPedidos] = useState([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [subTabHistorial, setSubTabHistorial] = useState('activas'); // 'activas' o 'eliminadas'

  // Estados para eliminación de comanda con contraseña de Administrador
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pedidoToDelete, setPedidoToDelete] = useState(null);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [errorDeleteModal, setErrorDeleteModal] = useState('');
  const [loadingDeleteModal, setLoadingDeleteModal] = useState(false);

  const handleConfirmDeletePedido = async (e) => {
    if (e) e.preventDefault();
    if (!pedidoToDelete || !adminPasswordInput.trim()) {
      setErrorDeleteModal('Por favor ingresa la contraseña de Administrador.');
      return;
    }

    setLoadingDeleteModal(true);
    setErrorDeleteModal('');

    try {
      const response = await fetch(`http://127.0.0.1:5000/api/pedidos/${pedidoToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contrasena: adminPasswordInput.trim(),
          admin_nombre: user?.nombre || ''
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'No se pudo eliminar la comanda.');
      }

      setShowDeleteModal(false);
      setPedidoToDelete(null);
      setAdminPasswordInput('');
      setErrorDeleteModal('');

      cargarHistorial();
      cargarIngredientes();
      if (typeof cargarCierreCaja === 'function') {
        cargarCierreCaja();
      }
    } catch (err) {
      console.error('Error al eliminar la comanda:', err);
      setErrorDeleteModal(err.message || 'Error al conectar con el servidor.');
    } finally {
      setLoadingDeleteModal(false);
    }
  };
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

  // Estados para consumo / merma
  const [consumoIngId, setConsumoIngId] = useState('');
  const [consumoCantidad, setConsumoCantidad] = useState('');
  const [consumoError, setConsumoError] = useState('');
  const [consumoSuccess, setConsumoSuccess] = useState('');
  const [consumoLoading, setConsumoLoading] = useState(false);

  // Estados para autocompletado y búsqueda
  const [llegadaSearch, setLlegadaSearch] = useState('');
  const [llegadaDropdownOpen, setLlegadaDropdownOpen] = useState(false);
  const [consumoSearch, setConsumoSearch] = useState('');
  const [consumoDropdownOpen, setConsumoDropdownOpen] = useState(false);

  // Filtro de categorías en Catálogo POS
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('Todos');
  const [paginaProductos, setPaginaProductos] = useState(1);

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

  // Estados para el Sistema de Turnos
  const [activeShift, setActiveShift] = useState(null);
  const [showShiftPrompt, setShowShiftPrompt] = useState(false);
  const [listaTurnos, setListaTurnos] = useState([]);
  const [loadingTurnos, setLoadingTurnos] = useState(false);
  const [filtroTurnoCierre, setFiltroTurnoCierre] = useState('all');
  const [filtroTurnoHistorial, setFiltroTurnoHistorial] = useState('all');
  const [efectivoInicialInput, setEfectivoInicialInput] = useState('');
  const [efectivoFinalInput, setEfectivoFinalInput] = useState('');
  const [showCerrarTurnoPrompt, setShowCerrarTurnoPrompt] = useState(false);
  const [errorShiftInput, setErrorShiftInput] = useState('');
  const [errorCerrarShiftInput, setErrorCerrarShiftInput] = useState('');
  const [observacionesCerrarShiftInput, setObservacionesCerrarShiftInput] = useState('');
  const [activeShiftSalesInfo, setActiveShiftSalesInfo] = useState(null);

  // Estados para configuración y cobro de envases para llevar
  const [precioEnvase, setPrecioEnvase] = useState(300);
  const [envasesCantidadOverride, setEnvasesCantidadOverride] = useState(null);
  const [precioEnvaseOverride, setPrecioEnvaseOverride] = useState(null);
  const [prodAplicaEnvase, setProdAplicaEnvase] = useState('heredar');
  const [nuevaCatCobraEnvase, setNuevaCatCobraEnvase] = useState(true);
  const [promoAplicaEnvase, setPromoAplicaEnvase] = useState('no');
  const [promoCantidadEnvases, setPromoCantidadEnvases] = useState(1);
  const [promoPrecio, setPromoPrecio] = useState('');
  const [promoActivo, setPromoActivo] = useState(true);
  const [promoProductosFijos, setPromoProductosFijos] = useState([]);
  const [promoPasos, setPromoPasos] = useState([]);
  const [editandoPromoId, setEditandoPromoId] = useState(null);
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promocionesView, setPromocionesView] = useState('list'); // 'list', 'create', 'edit'
  const [formatoPromoMode, setFormatoPromoMode] = useState('categoria'); // 'categoria', 'pack', 'combo'
  const [packProductoId, setPackProductoId] = useState('');
  const [packCantidad, setPackCantidad] = useState(2);
  const [catComboNombre, setCatComboNombre] = useState('');
  const [catComboCategoria, setCatComboCategoria] = useState('');
  const [catComboCantidad, setCatComboCantidad] = useState(2);
  const [catComboPrecioBase, setCatComboPrecioBase] = useState('');
  const [catComboEmoji, setCatComboEmoji] = useState('🍔');
  const [selectedFixedProdId, setSelectedFixedProdId] = useState('');
  const [selectedStepProds, setSelectedStepProds] = useState({});

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
      const itemPromo = {
        id: `promo-${promo.id}-${Date.now()}`,
        promocion_id: promo.id,
        nombre: promo.nombre,
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

  // Funciones auxiliares para la contabilidad del producto Envase
  const isEnvaseProduct = (item) => {
    if (!item || !item.nombre) return false;
    const name = item.nombre.toLowerCase().trim();
    return name === 'envase para llevar' || name === 'envases para llevar' || name === 'envase';
  };

  const getEnvaseProductsQty = (itemsPedido = pedido) => {
    return itemsPedido
      .filter(isEnvaseProduct)
      .reduce((acc, curr) => acc + (parseInt(curr.cantidad) || 0), 0);
  };

  const calcularSubtotalProductos = (itemsPedido = pedido) => {
    return itemsPedido
      .filter(item => !isEnvaseProduct(item))
      .reduce((acc, curr) => acc + (parseFloat(curr.precio) * curr.cantidad), 0);
  };

  // Función para calcular la cantidad y el costo total de envases para llevar
  const calcularEnvases = (itemsPedido = pedido, entrega = tipoEntrega) => {
    const unitPrice = parseFloat(precioEnvase) || 0;
    const envasesFromProducts = getEnvaseProductsQty(itemsPedido);

    if (entrega !== 'Llevar') {
      const cantidadTotal = envasesFromProducts;
      const montoTotal = cantidadTotal * unitPrice;
      return { cantidadTotal, montoTotal, unitPrice, cantidadAuto: 0 };
    }

    let cantidadAuto = 0;
    for (const item of itemsPedido) {
      if (isEnvaseProduct(item)) continue;

      if (item.promocion_id || (typeof item.id === 'string' && item.id.startsWith('promo-'))) {
        const promoRef = promociones.find(p => p.id === item.promocion_id) || item;
        const aplica = promoRef.aplica_envase || 'no';
        if (aplica === 'combo') {
          const cantPorCombo = parseInt(promoRef.cantidad_envases) || 1;
          cantidadAuto += cantPorCombo * (parseInt(item.cantidad) || 1);
        }
      } else {
        const prodRef = productos.find(p => p.id === item.id) || item;
        const aplica = prodRef.aplica_envase || 'heredar';
        if (aplica === 'si') {
          cantidadAuto += parseInt(item.cantidad) || 1;
        } else if (aplica === 'heredar' || !aplica) {
          const catNombre = prodRef.categoria || item.categoria;
          const catObj = listaCategorias.find(c => c.nombre === catNombre);
          const cobraCat = catObj ? catObj.cobra_envase !== false : true;
          if (cobraCat) {
            cantidadAuto += parseInt(item.cantidad) || 1;
          }
        }
      }
    }

    const baseCantidad = envasesCantidadOverride !== null ? envasesCantidadOverride : (cantidadAuto + envasesFromProducts);
    const cantidadTotal = baseCantidad;
    const montoTotal = cantidadTotal * unitPrice;
    return { cantidadTotal, montoTotal, unitPrice, cantidadAuto };
  };

  const seleccionarOpcionPaso = (opcion) => {
    const paso = selectedPromo.pasos[currentPromoStepIndex];
    
    // Calcular el extraVal en tiempo real contra la moda de precios del paso
    const prodRef = productos.find(p => p.id === opcion.producto_id);
    let extraVal = parseFloat(opcion.precio_adicional) || 0;
    
    const preciosOpciones = paso.opciones.map(o => {
      const p = productos.find(pr => pr.id === o.producto_id);
      return p ? parseFloat(p.precio) || 0 : (parseFloat(o.precio_producto) || 0);
    }).filter(p => p > 0);

    if (prodRef && preciosOpciones.length > 0) {
      const frecs = {};
      let maxF = 0;
      let refP = preciosOpciones[0];
      preciosOpciones.forEach(p => {
        frecs[p] = (frecs[p] || 0) + 1;
        if (frecs[p] > maxF) {
          maxF = frecs[p];
          refP = p;
        }
      });
      const multiplier = (selectedPromo.pasos && selectedPromo.pasos.length) || 2;
      const singleDiff = (parseFloat(prodRef.precio) || 0) - refP;
      extraVal = singleDiff * multiplier;
    }

    const choice = {
      paso_id: paso.id,
      producto_id: opcion.producto_id,
      nombre_producto: opcion.nombre_producto,
      precio_adicional: extraVal
    };

    const nuevasOpciones = [...chosenPromoOpciones, choice];
    setChosenPromoOpciones(nuevasOpciones);

    if (currentPromoStepIndex < selectedPromo.pasos.length - 1) {
      setCurrentPromoStepIndex(currentPromoStepIndex + 1);
    } else {
      const maxExtra = Math.max(...nuevasOpciones.map(opt => parseFloat(opt.precio_adicional) || 0));
      const finalPrice = parseFloat(selectedPromo.precio) + maxExtra;
      
      const itemPromo = {
        id: `promo-${selectedPromo.id}-${Date.now()}`,
        promocion_id: selectedPromo.id,
        nombre: selectedPromo.nombre,
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

    let finalFijos = [...promoProductosFijos];
    let finalPasos = [...promoPasos];

    if (formatoPromoMode === 'categoria') {
      if (!catComboCategoria || !promoPrecio.toString().trim()) {
        setPromoError('Por favor selecciona la categoría permitida y asigna el precio base de la oferta.');
        setPromoSuccess('');
        return;
      }

      const prodsCat = productos.filter(p => p.categoria === catComboCategoria);
      if (prodsCat.length === 0) {
        setPromoError(`La categoría "${catComboCategoria}" no contiene productos registrados.`);
        setPromoSuccess('');
        return;
      }

      // Encontrar la MODA de los precios (el precio que más se repite en la categoría)
      const preciosArr = prodsCat.map(p => parseFloat(p.precio) || 0).filter(p => p > 0);
      const frecuencias = {};
      let maxFrecuencia = 0;
      let precioModa = preciosArr[0] || 0;

      preciosArr.forEach(precio => {
        frecuencias[precio] = (frecuencias[precio] || 0) + 1;
        if (frecuencias[precio] > maxFrecuencia) {
          maxFrecuencia = frecuencias[precio];
          precioModa = precio;
        }
      });

      const cant = parseInt(catComboCantidad) || 2;
      const pasosAuto = [];

      for (let i = 1; i <= cant; i++) {
        const opciones = prodsCat.map(p => {
          const pPrecio = parseFloat(p.precio) || 0;
          const extra = Math.max(0, pPrecio - precioModa);
          return {
            producto_id: p.id,
            nombre_producto: p.nombre,
            precio_producto: p.precio,
            precio_adicional: extra
          };
        });

        pasosAuto.push({
          nombre_paso: `Elige ${catComboCategoria} #${i}`,
          obligatorio: true,
          opciones: opciones
        });
      }

      finalFijos = [];
      finalPasos = pasosAuto;
    } else if (formatoPromoMode === 'pack') {
      finalPasos = [];
      if (finalFijos.length === 0 && packProductoId) {
        const prod = productos.find(p => p.id === parseInt(packProductoId));
        if (prod) {
          finalFijos = [{
            producto_id: prod.id,
            nombre_producto: prod.nombre,
            precio_producto: prod.precio,
            cantidad: parseInt(packCantidad) || 1
          }];
        }
      }

      if (finalFijos.length === 0) {
        setPromoError('Por favor selecciona un producto base para crear el pack u oferta.');
        setPromoSuccess('');
        return;
      }
    } else {
      if (finalPasos.length === 0 && finalFijos.length === 0) {
        setPromoError('Una promoción tipo combo debe incluir al menos un producto fijo o un paso de selección.');
        setPromoSuccess('');
        return;
      }

      for (const paso of finalPasos) {
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
          productos_fijos: finalFijos,
          pasos: finalPasos,
          emoji: promoEmoji,
          aplica_envase: promoAplicaEnvase,
          cantidad_envases: promoCantidadEnvases
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setPromoSuccess(data.message);
        setPromoNombre('');
        setPromoPrecio('');
        setPromoEmoji('🎁');
        setPromoActivo(true);
        setPromoAplicaEnvase('no');
        setPromoCantidadEnvases(1);
        setPromoProductosFijos([]);
        setPromoPasos([]);
        setPackProductoId('');
        setPackCantidad(2);
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
    setPromoAplicaEnvase(promo.aplica_envase || 'no');
    setPromoCantidadEnvases(promo.cantidad_envases || 1);
    setPromoProductosFijos(promo.productos_fijos || []);
    setPromoPasos((promo.pasos || []).map(paso => ({
      ...paso,
      temp_id: paso.id || (Date.now() + Math.random())
    })));

    if (promo.pasos && promo.pasos.length > 0) {
      setFormatoPromoMode('combo');
    } else {
      setFormatoPromoMode('pack');
      if (promo.productos_fijos && promo.productos_fijos.length > 0) {
        setPackProductoId(promo.productos_fijos[0].producto_id);
        setPackCantidad(promo.productos_fijos[0].cantidad);
      }
    }

    setSelectedFixedProdId('');
    setSelectedStepProds({});
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

  const verificarTurnoActivo = async (mostrarPromptAlIniciar = false) => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/turnos/activo');
      const data = await response.json();
      if (response.ok && data.success) {
        if (data.activo) {
          setActiveShift(data.turno);
          if (mostrarPromptAlIniciar) {
            abrirAlerta(`Se continuará trabajando en el Turno #${data.turno.id} activo, iniciado por ${data.turno.usuario_inicio} el ${new Date(data.turno.fecha_hora_inicio).toLocaleDateString('es-CL')} a las ${new Date(data.turno.fecha_hora_inicio).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}.`, 'Turno Activo Detectado');
            setShowShiftPrompt(false);
          }
        } else {
          setActiveShift(null);
          if (mostrarPromptAlIniciar) {
            setShowShiftPrompt(true);
          }
        }
      }
    } catch (err) {
      console.error('Error al verificar turno activo:', err);
      if (mostrarPromptAlIniciar) {
        setShowShiftPrompt(true);
      }
    }
  };

  const iniciarTurno = async (username, efectivoInicialVal) => {
    const userToStart = username || (user ? user.nombre : 'Desconocido');
    try {
      const response = await fetch('http://127.0.0.1:5000/api/turnos/iniciar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          usuario_inicio: userToStart,
          efectivo_inicial: parseFloat(efectivoInicialVal)
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setActiveShift(data.turno);
        abrirAlerta('Se ha iniciado un nuevo turno correctamente.', 'Turno Iniciado');
        cargarHistorialTurnos();
      } else {
        abrirAlerta(data.message || 'Error al iniciar el turno.', 'Error');
      }
    } catch (err) {
      console.error('Error al iniciar turno:', err);
      abrirAlerta('Error de red al intentar iniciar el turno.', 'Error de Conexión');
    }
  };

  const cerrarTurno = async (efectivoFinalVal, observacionesVal) => {
    const userToClose = user ? user.nombre : 'Desconocido';
    try {
      const response = await fetch('http://127.0.0.1:5000/api/turnos/cerrar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          usuario_fin: userToClose,
          efectivo_final: parseFloat(efectivoFinalVal),
          observaciones: observacionesVal || ''
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setActiveShift(null);
        abrirAlerta('Se ha cerrado el turno actual con éxito.', 'Turno Cerrado');
        cargarHistorialTurnos();
        verificarTurnoActivo(true);
      } else {
        abrirAlerta(data.message || 'Error al cerrar el turno.', 'Error');
      }
    } catch (err) {
      console.error('Error al cerrar turno:', err);
      abrirAlerta('Error de red al intentar cerrar el turno.', 'Error de Conexión');
    }
  };

  const cargarHistorialTurnos = async () => {
    setLoadingTurnos(true);
    try {
      const response = await fetch('http://127.0.0.1:5000/api/turnos');
      const data = await response.json();
      if (response.ok && data.success) {
        setListaTurnos(data.turnos || []);
      }
    } catch (err) {
      console.error('Error al cargar historial de turnos:', err);
    } finally {
      setLoadingTurnos(false);
    }
  };

  const cargarConfiguracion = async () => {
    try {
      setConfigLoading(true);
      setConfigError('');
      setConfigSuccess('');
      const response = await fetch('http://127.0.0.1:5000/api/configuracion');
      const data = await response.json();
      if (response.ok && data.success) {
        const config = data.configuracion || data.config || {};
        setConfigEmailTo(config.REPORT_EMAIL_TO || '');
        setConfigEmailFrom(config.REPORT_EMAIL_FROM || 'inglesnaipe61@gmail.com');
        setConfigSmtpHost(config.SMTP_HOST || 'smtp.gmail.com');
        setConfigSmtpPort(config.SMTP_PORT || '587');
        setConfigSmtpSecure(config.SMTP_SECURE === 'true' || config.SMTP_SECURE === '1');
        setConfigSmtpUser(config.SMTP_USER || 'inglesnaipe61@gmail.com');
        setConfigSmtpPass(config.SMTP_PASS || '');
        if (config.precio_envase) {
          setPrecioEnvase(parseInt(config.precio_envase, 10) || 300);
        }
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

      await fetch('http://127.0.0.1:5000/api/configuracion', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ clave: 'precio_envase', valor: parseInt(precioEnvase, 10) || 0 })
      });

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
          emoji: nuevaCategoriaEmoji.trim() || '🏷️',
          cobra_envase: nuevaCatCobraEnvase
        }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setCatSuccess(data.message);
        setNuevaCategoriaNombre('');
        setNuevaCategoriaEmoji('🏷️');
        setNuevaCatCobraEnvase(true);
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
    setNuevaCatCobraEnvase(cat.cobra_envase !== false);
    setCatError('');
    setCatSuccess('');
  };

  const cancelarEdicionCat = () => {
    setEditandoCatId(null);
    setNuevaCategoriaNombre('');
    setNuevaCategoriaEmoji('🏷️');
    setNuevaCatCobraEnvase(true);
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
          emoji: nuevaCategoriaEmoji.trim() || '🏷️',
          cobra_envase: nuevaCatCobraEnvase
        }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setCatSuccess(data.message);
        setNuevaCategoriaNombre('');
        setNuevaCategoriaEmoji('🏷️');
        setNuevaCatCobraEnvase(true);
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
          aplica_envase: prodAplicaEnvase,
          ingredientes: ingredientesSeleccionados.map(i => ({
            ingrediente_id: i.ingrediente_id,
            cantidad: i.cantidad
          }))
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const wasEditing = !!editandoProdId;
        setProdSuccess(data.message || (wasEditing ? 'Producto actualizado correctamente.' : 'Producto creado correctamente.'));
        await cargarProductos();

        if (wasEditing) {
          // Mantener al usuario en la misma ventana de edición
          setTimeout(() => {
            setProdSuccess('');
          }, 3500);
        } else {
          // Al crear un nuevo producto, resetear el formulario y volver al listado
          setProdNombre('');
          setProdPrecio('');
          setProdImagen('🍔');
          setProdAplicaEnvase('heredar');
          if (activeTab === 'categorias' && selectedCatForProducts) {
            setProdCategoria(selectedCatForProducts.nombre);
          } else {
            setProdCategoria(listaCategorias[0]?.nombre || '');
          }
          setIngredientesSeleccionados([]);
          setCurrIngredienteId('');
          setCurrIngredienteCantidad('');
          setEditandoProdId(null);
          if (activeTab === 'categorias') {
            setCatProductView('list');
          }
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
    setProdAplicaEnvase(prod.aplica_envase || 'heredar');
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
    setProdAplicaEnvase('heredar');
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

    const ingrediente = listaIngredientes.find(ing => String(ing.id) === String(llegadaIngId));
    const ingNombre = ingrediente ? ingrediente.nombre : 'Ingrediente';

    abrirConfirmacion(
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', textAlign: 'left' }}>
        <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
          ¿Estás seguro que deseas registrar la llegada de materia prima?
        </p>
        <div style={{
          background: 'rgba(22, 163, 74, 0.12)',
          border: '1.5px solid #16a34a',
          padding: '1rem',
          borderRadius: '12px',
          color: '#16a34a',
          fontWeight: '800',
          fontSize: '1.2rem',
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(22, 163, 74, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.25rem'
        }}>
          <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', opacity: 0.8, fontWeight: '700' }}>Se sumará al Stock:</span>
          <span>➕ {cantNum.toLocaleString('es-CL')} de {ingNombre}</span>
        </div>
      </div>,
      'Confirmar ingreso',
      async () => {
        setLlegadaLoading(true);
        try {
          const response = await fetch(`http://127.0.0.1:5000/api/ingredientes/${llegadaIngId}/llegada`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cantidad: cantNum, turno_id: activeShift?.id || null })
          });
          const data = await response.json();
          if (response.ok && data.success) {
            setLlegadaSuccess(data.message);
            setLlegadaCantidad('');
            setLlegadaIngId('');
            setLlegadaSearch('');
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
      }
    );
  };

  const handleConsumoMerma = async (e) => {
    e.preventDefault();
    if (!consumoIngId) {
      setConsumoError('Selecciona un ingrediente.');
      setConsumoSuccess('');
      return;
    }
    const cantNum = parseFloat(consumoCantidad);
    if (isNaN(cantNum) || cantNum <= 0) {
      setConsumoError('Ingresa una cantidad válida mayor que 0.');
      setConsumoSuccess('');
      return;
    }
    setConsumoError('');
    setConsumoSuccess('');
    
    const ingrediente = listaIngredientes.find(ing => String(ing.id) === String(consumoIngId));
    const ingNombre = ingrediente ? ingrediente.nombre : 'Ingrediente';

    abrirConfirmacion(
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', textAlign: 'left' }}>
        <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
          ¿Estás seguro que deseas registrar la merma / consumo de materia prima?
        </p>
        <div style={{
          background: 'rgba(217, 119, 6, 0.12)',
          border: '1.5px solid #d97706',
          padding: '1rem',
          borderRadius: '12px',
          color: '#d97706',
          fontWeight: '800',
          fontSize: '1.2rem',
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(217, 119, 6, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.25rem'
        }}>
          <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', opacity: 0.8, fontWeight: '700' }}>Se descontará del Stock:</span>
          <span>➖ {cantNum.toLocaleString('es-CL')} de {ingNombre}</span>
        </div>
      </div>,
      'Confirmar merma',
      async () => {
        setConsumoLoading(true);
        try {
          const response = await fetch(`http://127.0.0.1:5000/api/ingredientes/${consumoIngId}/consumo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cantidad: cantNum, turno_id: activeShift?.id || null })
          });
          const data = await response.json();
          if (response.ok && data.success) {
            setConsumoSuccess(data.message);
            setConsumoCantidad('');
            setConsumoIngId('');
            setConsumoSearch('');
            await cargarIngredientes();
            setTimeout(() => setConsumoSuccess(''), 3000);
          } else {
            setConsumoError(data.message || 'Error al registrar consumo.');
          }
        } catch (err) {
          console.error(err);
          setConsumoError('Error de red al conectar con el servidor.');
        } finally {
          setConsumoLoading(false);
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
      cargarPromociones();
      cargarConfiguracion();
      verificarTurnoActivo(true);
    }
  }, [user]);

  useEffect(() => {
    if (user && activeTab === 'usuarios') {
      cargarUsuarios();
    }
  }, [user, activeTab]);



  useEffect(() => {
    if (user && (activeTab === 'productos' || activeTab === 'categorias' || activeTab === 'inventario' || activeTab === 'cierre' || activeTab === 'promociones' || activeTab === 'configuraciones')) {
      cargarIngredientes();
      cargarCategorias();
      cargarProductos();
      cargarPromociones();
      if (activeTab === 'cierre' || activeTab === 'configuraciones') {
        cargarConfiguracion();
        if (activeTab === 'cierre') {
          cargarHistorialTurnos();
        }
      }
    }
  }, [user, activeTab]);

  useEffect(() => {
    setSelectedCatForProducts(null);
    setCatProductView('list');
  }, [activeTab]);

  const cargarCuadradoCaja = async (dateStr, efectivoSugerido) => {
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
          setFondoApertura(efectivoSugerido !== undefined ? efectivoSugerido : 50000);
          setEfectivoReal('');
          setObservacionesCierre('');
          setModoEdicionCierre(false);
        }
      }
    } catch (err) {
      console.error('Error al obtener arqueo de caja de la DB:', err);
    }
  };

  const cargarCierreCaja = async (dateStr, shiftFilterStr) => {
    const targetDate = dateStr || fechaCierre;
    const targetShift = shiftFilterStr !== undefined ? shiftFilterStr : filtroTurnoCierre;
    if (!targetDate) return;
    setLoadingCierre(true);
    setErrorCierre('');
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/informes/cierre?fecha=${targetDate}&turno_id=${targetShift}`);
      const data = await response.json();
      if (response.ok && data.success) {
        setCierreData(data.data);
        await cargarCuadradoCaja(targetDate, data.data.efectivo_inicial_sugerido);
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

  const handleShiftFilterChange = (val) => {
    setFiltroTurnoCierre(val);
    cargarCierreCaja(fechaCierre, val);
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

  const handleCorregirArqueoTurno = async (shiftId, efFinalVal, obsVal) => {
    setGuardandoCierre(true);
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/turnos/arqueo/${shiftId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          efectivo_final: parseFloat(efFinalVal),
          observaciones: obsVal || ''
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        abrirAlerta('El arqueo del turno se ha corregido con éxito.', 'Arqueo Actualizado');
        setModoEdicionCierre(false);
        cargarHistorialTurnos();
        // Recargar el cierre diario consolidado del día
        cargarCierreCaja(fechaCierre, filtroTurnoCierre);
      } else {
        abrirAlerta(data.message || 'Error al actualizar el arqueo.', 'Error');
      }
    } catch (err) {
      console.error(err);
      abrirAlerta('Error de red al intentar actualizar el arqueo.', 'Error de Conexión');
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
      setFiltroTurnoCierre('all');
      cargarCierreCaja(fechaCierre, 'all');
    }
  }, [user, activeTab, fechaCierre]);

  useEffect(() => {
    if (user && activeTab === 'historial') {
      cargarHistorial(subTabHistorial);
    }
  }, [user, activeTab, subTabHistorial]);

  const cargarHistorial = async (tipo = subTabHistorial) => {
    setLoadingHistorial(true);
    try {
      const endpoint = tipo === 'activas' 
        ? 'http://127.0.0.1:5000/api/pedidos' 
        : 'http://127.0.0.1:5000/api/pedidos/eliminados';
      const response = await fetch(endpoint);
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
    setTipoTransaccion('Efectivo');
    setMontoEfectivoMixto('');
    setMontoDebitoMixto('');
    setMontoCreditoMixto('');
    setShowPromptCliente(true);
  };

  const handleSubmitPedido = async (e) => {
    e.preventDefault();
    if (!clienteNombre.trim()) {
      abrirAlerta('Por favor, ingresa el nombre del cliente para confirmar el pedido.', 'Nombre de Cliente Requerido');
      return;
    }

    const envasesInfo = calcularEnvases(pedido, tipoEntrega);
    const subtotalProductos = calcularSubtotalProductos(pedido);
    const totalPedido = subtotalProductos + envasesInfo.montoTotal;
    const atendidoPor = user ? user.nombre : 'Desconocido';

    let montoEfec = 0;
    let montoDeb = 0;
    let montoCred = 0;
    let detalleMixto = null;

    if (tipoTransaccion === 'Mixto') {
      montoEfec = parseFloat(montoEfectivoMixto) || 0;
      montoDeb = parseFloat(montoDebitoMixto) || 0;
      montoCred = parseFloat(montoCreditoMixto) || 0;
      const sumaIngresada = montoEfec + montoDeb + montoCred;

      if (Math.abs(sumaIngresada - totalPedido) > 0.01) {
        abrirAlerta(`La suma de los montos ingresados ($${sumaIngresada.toLocaleString('es-CL')}) debe ser exactamente igual al total del pedido ($${totalPedido.toLocaleString('es-CL')}).`, 'Error en Pago Mixto');
        return;
      }

      if (sumaIngresada === 0) {
        abrirAlerta('Por favor ingresa los montos correspondientes para el pago mixto.', 'Pago Mixto Vacío');
        return;
      }

      const partes = [];
      if (montoEfec > 0) partes.push(`Efec: $${montoEfec.toLocaleString('es-CL')}`);
      if (montoDeb > 0) partes.push(`Déb: $${montoDeb.toLocaleString('es-CL')}`);
      if (montoCred > 0) partes.push(`Créd: $${montoCred.toLocaleString('es-CL')}`);
      detalleMixto = partes.join(' | ');
    } else if (tipoTransaccion === 'Débito') {
      montoDeb = totalPedido;
    } else if (tipoTransaccion === 'Crédito') {
      montoCred = totalPedido;
    } else {
      montoEfec = totalPedido;
    }

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
        productos_fijos: item.productos_fijos || [],
        opciones_elegidas: item.opciones_elegidas || []
      })),
      nota: pedidoNota.trim() || null,
      tipo_entrega: tipoEntrega,
      tipo_transaccion: tipoTransaccion,
      monto_efectivo: montoEfec,
      monto_debito: montoDeb,
      monto_credito: montoCred,
      pago_mixto_detalle: detalleMixto,
      cantidad_envases: envasesInfo.cantidadTotal,
      monto_envases: envasesInfo.montoTotal,
      turno_id: activeShift?.id || null
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
          tipo_transaccion: payload.tipo_transaccion,
          monto_efectivo: payload.monto_efectivo,
          monto_debito: payload.monto_debito,
          monto_credito: payload.monto_credito,
          pago_mixto_detalle: payload.pago_mixto_detalle,
          cantidad_envases: envasesInfo.cantidadTotal,
          monto_envases: envasesInfo.montoTotal
        };
        setComandaData(newComanda);

        // Imprimir automáticamente el ticket si estamos en Electron
        if (window.electronAPI && typeof window.electronAPI.printTicket === 'function') {
          window.electronAPI.printTicket(newComanda);
        }

        setPedido([]);
        setEnvasesCantidadOverride(null);
        setPrecioEnvaseOverride(null);
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

  // Shortcut A+L+P+T para ingresar como el primer usuario Administrador desde la pantalla de Login
  const keysPressed = useRef(new Set());
  const keyTimestamps = useRef({});

  const handleAdminShortcutLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://127.0.0.1:5000/api/login/admin-first', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setUser(data.user);
        sessionStorage.setItem('calibre_session', JSON.stringify(data.user));
      } else {
        setError(data.message || 'No se encontró un usuario administrador.');
      }
    } catch (err) {
      console.error(err);
      setError('Error al ingresar con el atajo de administrador.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) return; // Solo escuchar cuando estemos en la pantalla de Login

    const handleKeyDown = (e) => {
      const key = e.key ? e.key.toLowerCase() : '';
      const code = e.code ? e.code.toLowerCase() : '';
      const now = Date.now();

      // Mapear teclas A, L, P, T (por e.key o por e.code físico)
      let char = '';
      if (key === 'a' || code === 'keya') char = 'a';
      else if (key === 'l' || code === 'keyl') char = 'l';
      else if (key === 'p' || code === 'keyp') char = 'p';
      else if (key === 't' || code === 'keyt') char = 't';

      if (char) {
        keysPressed.current.add(char);
        keyTimestamps.current[char] = now;

        // 1. Verificación simultánea (manteniendo presionadas A, L, P, T al mismo tiempo)
        const hasA = keysPressed.current.has('a');
        const hasL = keysPressed.current.has('l');
        const hasP = keysPressed.current.has('p');
        const hasT = keysPressed.current.has('t');

        // 2. Verificación por ventana de tiempo (si fueron presionadas/tocadas en un lapso de 800ms)
        const times = keyTimestamps.current;
        const recentA = times.a && (now - times.a < 800);
        const recentL = times.l && (now - times.l < 800);
        const recentP = times.p && (now - times.p < 800);
        const recentT = times.t && (now - times.t < 800);

        if ((hasA && hasL && hasP && hasT) || (recentA && recentL && recentP && recentT)) {
          keysPressed.current.clear();
          keyTimestamps.current = {};
          handleAdminShortcutLogin();
        }
      }
    };

    const handleKeyUp = (e) => {
      const key = e.key ? e.key.toLowerCase() : '';
      const code = e.code ? e.code.toLowerCase() : '';
      if (key === 'a' || code === 'keya') keysPressed.current.delete('a');
      if (key === 'l' || code === 'keyl') keysPressed.current.delete('l');
      if (key === 'p' || code === 'keyp') keysPressed.current.delete('p');
      if (key === 't' || code === 'keyt') keysPressed.current.delete('t');
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [user]);

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
            <div className="card-header" style={{ position: 'relative' }}>
              <img 
                src={logoImg} 
                alt="Calibre 25" 
                className="logo-image" 
                title="Doble clic para ingreso directo como Administrador"
                onDoubleClick={handleAdminShortcutLogin}
                style={{ cursor: 'pointer' }}
              />
              <p 
                className="card-subtitle" 
                title="Doble clic para ingreso directo como Administrador"
                onDoubleClick={handleAdminShortcutLogin}
                style={{ cursor: 'pointer' }}
              >
                Inicia sesión para acceder al sistema
              </p>
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

                  </>
                )}
                <button 
                  onClick={() => setActiveTab('inventario')} 
                  className={`nav-tab ${activeTab === 'inventario' ? 'active' : ''}`}
                >
                  🥑 Inventario
                </button>
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
                <button 
                  onClick={() => setActiveTab('configuraciones')} 
                  className={`nav-tab ${activeTab === 'configuraciones' ? 'active' : ''}`}
                >
                  ⚙️ Configuraciones
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
                        onClick={() => { setCategoriaSeleccionada('Todos'); setPaginaProductos(1); }}
                        className={`category-sidebar-btn ${categoriaSeleccionada === 'Todos' ? 'active' : ''}`}
                      >
                        <span className="category-btn-icon">🍽️</span>
                        <span className="category-btn-text" title="Todos">Todos</span>
                      </button>
                      <button
                        onClick={() => { setCategoriaSeleccionada('Promociones'); setPaginaProductos(1); }}
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
                            onClick={() => { setCategoriaSeleccionada(nombre); setPaginaProductos(1); }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                setCategoriaSeleccionada(nombre);
                                setPaginaProductos(1);
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
                        {(() => {
                          const itemsFiltrados = categoriaSeleccionada === 'Promociones'
                            ? promociones.filter(promo => promo.activo !== false)
                            : productos.filter((prod) => (categoriaSeleccionada === 'Todos' && prod.categoria !== 'Promociones') || prod.categoria === categoriaSeleccionada);

                          const requierePaginacion = itemsFiltrados.length > 16;
                          let totalPaginas = 1;
                          let paginaActual = 1;
                          let itemsPagina = itemsFiltrados;

                          if (requierePaginacion) {
                            totalPaginas = 1 + Math.ceil((itemsFiltrados.length - 15) / 14);
                            paginaActual = Math.min(paginaProductos, totalPaginas);

                            let startIndex = 0;
                            let count = 14;

                            if (paginaActual === 1) {
                              startIndex = 0;
                              count = 15;
                            } else if (paginaActual === totalPaginas) {
                              startIndex = 15 + (paginaActual - 2) * 14;
                              count = 15;
                            } else {
                              startIndex = 15 + (paginaActual - 2) * 14;
                              count = 14;
                            }

                            itemsPagina = itemsFiltrados.slice(startIndex, startIndex + count);
                          }

                          return (
                            <>
                              {/* Cuadrícula 1: Card de Retroceder (Solo si no es la primera página) */}
                              {requierePaginacion && paginaActual > 1 && (
                                <div 
                                  className="product-card pagination-card prev-page"
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    setPaginaProductos(paginaActual - 1); 
                                  }}
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '0.85rem 0.5rem',
                                    background: 'var(--item-bg)',
                                    border: '2px dashed var(--accent-primary)',
                                    boxShadow: '0 4px 15px var(--accent-glow)',
                                    borderRadius: '22px',
                                    cursor: 'pointer'
                                  }}
                                  title="Página anterior"
                                >
                                  <div className="pagination-icon" style={{ fontSize: '2.2rem' }}>⬅️</div>
                                  <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0.2rem 0' }}>
                                    Retroceder
                                  </span>
                                  <span className="pagination-text" style={{ fontSize: '0.75rem' }}>
                                    Pág. {paginaActual} de {totalPaginas}
                                  </span>
                                </div>
                              )}

                              {/* Cuadrículas intermedias: Productos de la página */}
                              {itemsPagina.map((item) => {
                                if (categoriaSeleccionada === 'Promociones') {
                                  return (
                                    <div key={`promo-${item.id}`} className="product-card promotion-card" onClick={() => seleccionarPromocion(item)} style={{ border: '1px dashed var(--accent-primary)', position: 'relative' }}>
                                      <div className="product-emoji" style={{ color: 'var(--accent-primary)' }}>{item.emoji || '🎁'}</div>
                                      <div className="product-info">
                                        <h4 className="product-name" style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>{item.nombre}</h4>
                                        <span className="product-price">
                                           ${parseFloat(item.precio).toLocaleString('es-CL', { minimumFractionDigits: 0 })}
                                        </span>
                                      </div>
                                      <button className="btn-add" style={{ background: 'var(--accent-primary)' }}>
                                        <span>+</span>
                                      </button>
                                    </div>
                                  );
                                }

                                return (
                                  <div key={item.id} className="product-card" onClick={() => agregarAlPedido(item)}>
                                    <div className="product-emoji">{item.imagen || '🍔'}</div>
                                    <div className="product-info">
                                      <h4 className="product-name">{item.nombre}</h4>
                                      <span className="product-price">
                                         ${parseFloat(item.precio).toLocaleString('es-CL', { minimumFractionDigits: 0 })}
                                      </span>
                                    </div>
                                    <button className="btn-add">
                                      <span>+</span>
                                    </button>
                                  </div>
                                );
                              })}

                              {/* Cuadrícula Final: Card de Continuar (Solo si no es la última página) */}
                              {requierePaginacion && paginaActual < totalPaginas && (
                                <div 
                                  className="product-card pagination-card next-page"
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    setPaginaProductos(paginaActual + 1); 
                                  }}
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '0.85rem 0.5rem',
                                    background: 'var(--item-bg)',
                                    border: '2px dashed var(--accent-primary)',
                                    boxShadow: '0 4px 15px var(--accent-glow)',
                                    borderRadius: '22px',
                                    cursor: 'pointer'
                                  }}
                                  title="Página siguiente"
                                >
                                  <div className="pagination-icon" style={{ fontSize: '2.2rem' }}>➡️</div>
                                  <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0.2rem 0' }}>
                                    Continuar
                                  </span>
                                  <span className="pagination-text" style={{ fontSize: '0.75rem' }}>
                                    Pág. {paginaActual} de {totalPaginas}
                                  </span>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Columna Derecha: Ticket de Pedido */}
                <div className="order-section">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h3 className="section-title" style={{ margin: 0 }}>📝 Detalle del Pedido</h3>
                    
                    {/* Selector Servir / Llevar */}
                    <div className="delivery-selector-group" style={{ margin: 0, minWidth: '210px' }}>
                      <button
                        type="button"
                        className={`delivery-option-btn ${tipoEntrega === 'Servir' ? 'active' : ''}`}
                        onClick={() => setTipoEntrega('Servir')}
                        style={{ padding: '0.4rem 0.65rem', fontSize: '0.8rem', fontWeight: 'bold' }}
                      >
                        🍽️ Servir
                      </button>
                      <button
                        type="button"
                        className={`delivery-option-btn ${tipoEntrega === 'Llevar' ? 'active' : ''}`}
                        onClick={() => setTipoEntrega('Llevar')}
                        style={{ padding: '0.4rem 0.65rem', fontSize: '0.8rem', fontWeight: 'bold' }}
                      >
                        🛍️ Llevar
                      </button>
                    </div>
                  </div>
                  
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
                                {(() => {
                                  const subItems = getPromoSubItems(item);
                                  if (subItems.length === 0) return null;
                                  return (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', marginTop: '0.2rem' }}>
                                      {subItems.map((sub, sIdx) => (
                                        <span key={sIdx} style={{ fontSize: '0.82rem', color: '#10b981', fontWeight: '600', lineHeight: 1.3 }}>
                                          - {sub}
                                        </span>
                                      ))}
                                    </div>
                                  );
                                })()}
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
                          {(() => {
                            const envasesInfo = calcularEnvases(pedido, tipoEntrega);
                            const subtotalProd = calcularSubtotalProductos(pedido);
                            const grandTotal = subtotalProd + envasesInfo.montoTotal;

                            return (
                              <>
                                {tipoEntrega === 'Llevar' && (
                                  <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.4rem',
                                    padding: '0.6rem 0.75rem',
                                    background: 'rgba(234, 88, 12, 0.08)',
                                    border: '1px dashed var(--accent-primary)',
                                    borderRadius: '10px',
                                    marginBottom: '0.75rem'
                                  }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                        <span>📦</span>
                                        <span>Envases para llevar</span>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--text-secondary)' }}>
                                          (${precioEnvase} c/u)
                                        </span>
                                      </span>
                                      <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                                        +${envasesInfo.montoTotal.toLocaleString('es-CL')}
                                      </span>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.15rem' }}>
                                      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                        Cantidad de envases:
                                      </span>

                                      {/* Controles + / - de cantidad de envases */}
                                      <div className="qty-controls" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                        <button
                                          type="button"
                                          className="btn-qty"
                                          style={{ width: '26px', height: '26px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                          onClick={() => {
                                            const currentCant = envasesInfo.cantidadTotal;
                                            setEnvasesCantidadOverride(Math.max(0, currentCant - 1));
                                          }}
                                        >
                                          -
                                        </button>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold', minWidth: '20px', textAlign: 'center', color: 'var(--text-primary)' }}>
                                          {envasesInfo.cantidadTotal}
                                        </span>
                                        <button
                                          type="button"
                                          className="btn-qty"
                                          style={{ width: '26px', height: '26px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                          onClick={() => {
                                            const currentCant = envasesInfo.cantidadTotal;
                                            setEnvasesCantidadOverride(currentCant + 1);
                                          }}
                                        >
                                          +
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                <div className="total-row">
                                  <span>Total:</span>
                                  <span className="total-amount">
                                    ${grandTotal.toLocaleString('es-CL', { minimumFractionDigits: 0 })}
                                  </span>
                                </div>
                              </>
                            );
                          })()}
                          <button onClick={handleConfirmarPedido} className="btn-primary btn-checkout">
                            Confirmar Pedido
                          </button>
                          <button
                            onClick={() => {
                              setPedido([]);
                              setEnvasesCantidadOverride(null);
                              setPrecioEnvaseOverride(null);
                            }}
                            className="btn-secondary btn-clear-order"
                          >
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
                                  <div key={p.id} className="user-list-item" style={{ background: 'var(--item-bg)', border: '1px solid var(--glass-border)', padding: '0.75rem 1rem' }}>
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
                                  <option value="🥤">🥤 Bebida / Coca-Cola (Vaso)</option>
                                  <option value="🍾">🍾 Botella de Gaseosa</option>
                                  <option value="🥫">🥫 Lata de Bebida / Gaseosa</option>
                                  <option value="💧">💧 Botella de Agua</option>
                                  <option value="🧃">🧃 Jugo / Cajita</option>
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
                              <option value="🥤">🥤 Bebidas / Coca-Cola</option>
                              <option value="🍾">🍾 Botellas de Gaseosa</option>
                              <option value="🥫">🥫 Latas de Bebida</option>
                              <option value="💧">💧 Botellas de Agua</option>
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

                        <div className="form-group" style={{ marginTop: '1rem' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '600' }}>
                            <input
                              type="checkbox"
                              checked={nuevaCatCobraEnvase}
                              onChange={(e) => setNuevaCatCobraEnvase(e.target.checked)}
                              style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--accent-primary)' }}
                            />
                            <span>📦 Cobrar envase para llevar por defecto</span>
                          </label>
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

                        {/* Ajuste Rápido del Precio Global de Envase */}
                        <div style={{ marginTop: '1.5rem', background: 'rgba(234, 88, 12, 0.08)', border: '1px dashed var(--accent-primary)', padding: '1rem', borderRadius: '12px' }}>
                          <label className="form-label" style={{ marginBottom: '0.4rem', fontWeight: '700', fontSize: '0.85rem', color: 'var(--text-primary)' }}>📦 Precio Global del Envase (Para Llevar)</label>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.75rem', alignItems: 'center' }}>
                            <div className="input-wrapper" style={{ margin: 0, position: 'relative' }}>
                              <input
                                type="number"
                                min="0"
                                className="form-input"
                                style={{ height: '38px', fontSize: '0.95rem', paddingLeft: '2.2rem', paddingRight: '0.75rem', width: '100%', boxSizing: 'border-box' }}
                                value={precioEnvase}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setPrecioEnvase(val === '' ? '' : parseInt(val, 10) || 0);
                                }}
                                onBlur={() => setPrecioEnvase(parseInt(precioEnvase, 10) || 0)}
                              />
                              <span className="input-icon" style={{ left: '0.75rem' }}>💲</span>
                            </div>
                            <button
                              type="button"
                              className="btn-primary"
                              style={{ height: '38px', padding: '0 1rem', fontSize: '0.82rem', width: 'auto', whiteSpace: 'nowrap', flexShrink: 0 }}
                              onClick={guardarConfiguracion}
                            >
                              💾 Guardar Precio
                            </button>
                          </div>
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
                              background: selectedCatForProducts?.id === cat.id ? 'var(--item-bg-hover)' : 'var(--item-bg)', 
                              border: selectedCatForProducts?.id === cat.id ? '1.5px solid var(--accent-primary)' : '1px solid var(--glass-border)', 
                              borderRadius: '22px',
                              boxShadow: selectedCatForProducts?.id === cat.id ? '0 0 12px var(--accent-glow)' : 'var(--card-shadow)'
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
                            setPromoProductosFijos([]);
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

                      {/* Selector de Formato de Promoción / Oferta */}
                      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', background: 'rgba(255,255,255,0.03)', padding: '0.4rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setFormatoPromoMode('categoria');
                            if (!promoNombre) setPromoNombre('2x Churrascos a Elección');
                            if (!promoPrecio) setPromoPrecio('6900');
                          }}
                          style={{
                            flex: 1,
                            padding: '0.6rem 0.5rem',
                            borderRadius: '8px',
                            border: 'none',
                            fontWeight: '700',
                            fontSize: '0.82rem',
                            cursor: 'pointer',
                            background: formatoPromoMode === 'categoria' ? 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)' : 'transparent',
                            color: formatoPromoMode === 'categoria' ? 'white' : 'var(--text-secondary)',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.2rem',
                            boxShadow: formatoPromoMode === 'categoria' ? '0 4px 12px rgba(124, 58, 237, 0.3)' : 'none'
                          }}
                        >
                          <span style={{ fontSize: '0.9rem' }}>🏷️ Combo por Categoría</span>
                          <span style={{ fontSize: '0.7rem', opacity: 0.85 }}>(Ej: 2 Churrascos a Elección)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setFormatoPromoMode('pack')}
                          style={{
                            flex: 1,
                            padding: '0.6rem 0.5rem',
                            borderRadius: '8px',
                            border: 'none',
                            fontWeight: '700',
                            fontSize: '0.82rem',
                            cursor: 'pointer',
                            background: formatoPromoMode === 'pack' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'transparent',
                            color: formatoPromoMode === 'pack' ? 'white' : 'var(--text-secondary)',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.2rem',
                            boxShadow: formatoPromoMode === 'pack' ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none'
                          }}
                        >
                          <span style={{ fontSize: '0.9rem' }}>📦 Pack Rápido Fijo</span>
                          <span style={{ fontSize: '0.7rem', opacity: 0.85 }}>(Ej: 2 Churrascos Fijos)</span>
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => setFormatoPromoMode('combo')}
                          style={{
                            flex: 1,
                            padding: '0.6rem 0.5rem',
                            borderRadius: '8px',
                            border: 'none',
                            fontWeight: '700',
                            fontSize: '0.82rem',
                            cursor: 'pointer',
                            background: formatoPromoMode === 'combo' ? 'linear-gradient(135deg, var(--accent-primary) 0%, #ef4444 100%)' : 'transparent',
                            color: formatoPromoMode === 'combo' ? 'white' : 'var(--text-secondary)',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.2rem',
                            boxShadow: formatoPromoMode === 'combo' ? '0 4px 12px var(--accent-glow)' : 'none'
                          }}
                        >
                          <span style={{ fontSize: '0.9rem' }}>🎁 Combo Personalizado</span>
                          <span style={{ fontSize: '0.7rem', opacity: 0.85 }}>(Pasos Libres)</span>
                        </button>
                      </div>

                      <form onSubmit={handleSavePromo} className="admin-form" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '0.5rem' }}>
                        
                        {formatoPromoMode === 'categoria' ? (
                          /* MODO COMBO POR CATEGORÍA (Ej: 2 Churrascos a Elección con ajuste automático por más caro) */
                          <div style={{ background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(109, 40, 217, 0.03) 100%)', padding: '1.25rem', borderRadius: '14px', border: '1px solid rgba(124, 58, 237, 0.3)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <h4 style={{ margin: 0, fontSize: '1rem', color: '#a78bfa', fontWeight: 'bold' }}>🏷️ Creador de Combo por Categoría</h4>
                                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Permite combinar productos de una misma categoría. Si se elige un producto de mayor precio (ej. Chacarero), calcula automáticamente la diferencia.</p>
                              </div>
                              <span style={{ background: 'rgba(124, 58, 237, 0.25)', color: '#c4b5fd', padding: '0.25rem 0.65rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', border: '1px solid rgba(124, 58, 237, 0.4)' }}>
                                ⚡ Autocalcula Extras
                              </span>
                            </div>

                            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
                              <div className="form-group">
                                <label className="form-label">Categoría Permitida</label>
                                <select
                                  className="form-input form-select"
                                  value={catComboCategoria}
                                  onChange={(e) => {
                                    const cat = e.target.value;
                                    setCatComboCategoria(cat);
                                    if (!catComboNombre || catComboNombre.includes('a Elección')) {
                                      setCatComboNombre(`2x ${cat} a Elección`);
                                    }
                                  }}
                                >
                                  <option value="" disabled>-- Seleccionar Categoría (Ej: Churrasco) --</option>
                                  {listaCategorias.map(c => (
                                    <option key={c.id} value={c.nombre}>{c.emoji || '📁'} {c.nombre}</option>
                                  ))}
                                </select>
                              </div>

                              <div className="form-group">
                                <label className="form-label">Cantidad a Elección</label>
                                <input
                                  type="number"
                                  min="2"
                                  className="form-input"
                                  placeholder="Ej: 2"
                                  value={catComboCantidad}
                                  onChange={(e) => {
                                    const cant = parseInt(e.target.value) || 2;
                                    setCatComboCantidad(cant);
                                    if (catComboCategoria && (!catComboNombre || catComboNombre.includes('a Elección'))) {
                                      setCatComboNombre(`${cant}x ${catComboCategoria} a Elección`);
                                    }
                                  }}
                                />
                              </div>

                              <div className="form-group">
                                <label className="form-label">Precio Base Oferta ($)</label>
                                <input
                                  type="number"
                                  className="form-input"
                                  placeholder="Ej: 6900"
                                  value={promoPrecio}
                                  onChange={(e) => setPromoPrecio(e.target.value)}
                                />
                              </div>
                            </div>

                            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                              <div className="form-group">
                                <label className="form-label">Nombre de la Promoción</label>
                                <input
                                  type="text"
                                  className="form-input"
                                  placeholder="Ej. 2 Churrascos a Elección"
                                  value={promoNombre}
                                  onChange={(e) => setPromoNombre(e.target.value)}
                                />
                              </div>

                              <div className="form-group">
                                <label className="form-label">Emoji Representativo</label>
                                <select
                                  className="form-input form-select"
                                  value={promoEmoji}
                                  onChange={(e) => setPromoEmoji(e.target.value)}
                                >
                                  <option value="🍔">🍔 Hamburguesa / Churrasco</option>
                                  <option value="🎁">🎁 Regalo / Combo</option>
                                  <option value="🏷️">🏷️ Oferta</option>
                                  <option value="🌭">🌭 Completo</option>
                                  <option value="🍟">🍟 Papas Fritas</option>
                                  <option value="🥤">🥤 Bebida / Coca-Cola</option>
                                  <option value="🍾">🍾 Botella de Gaseosa</option>
                                  <option value="🥫">🥫 Lata de Bebida</option>
                                  <option value="💧">💧 Botella de Agua</option>
                                </select>
                              </div>
                            </div>

                            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.8rem', color: 'var(--text-secondary)', border: '1px solid rgba(124, 58, 237, 0.2)' }}>
                              💡 <strong>Ajuste de Precio Automático:</strong> El sistema importará todos los productos de la categoría seleccionada. Si el cliente elige un producto de mayor precio (ej. Chacarero $4.400 vs Italiano $4.100), el recargo de $300 se sumará automáticamente a los $6.900 base, quedando el total en <strong>$7.200</strong>.
                            </div>
                          </div>
                        ) : formatoPromoMode === 'pack' ? (
                          /* MODO PACK / OFERTA MULTI-UNIDAD (Ej: 2 Churrascos x $6.900) */
                          <div style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.06) 0%, rgba(5, 150, 105, 0.03) 100%)', padding: '1.25rem', borderRadius: '14px', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <h4 style={{ margin: 0, fontSize: '1rem', color: '#10b981', fontWeight: 'bold' }}>📦 Creador de Pack u Oferta Multi-Unidad</h4>
                                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Crea ofertas directas de varios productos iguales o combinados (Ej: 2 Churrascos, 3 Bebidas, 2x1) sin configuración compleja.</p>
                              </div>
                              <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '0.25rem 0.65rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
                                ⚡ Alta Rápida
                              </span>
                            </div>

                            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
                              <div className="form-group">
                                <label className="form-label">Producto Base para la Oferta</label>
                                <SearchableProductSelect
                                  placeholder="-- Buscar o Seleccionar Producto (Ej. Churrasco) --"
                                  options={productos.map(p => ({
                                    value: p.id,
                                    label: `${p.nombre} ($${parseFloat(p.precio).toLocaleString('es-CL')})`
                                  }))}
                                  value={packProductoId}
                                  onChange={(val) => {
                                    setPackProductoId(val);
                                    const prod = productos.find(p => p.id === parseInt(val));
                                    if (prod) {
                                      if (!promoNombre || promoNombre.startsWith(`${packCantidad}x `)) {
                                        setPromoNombre(`${packCantidad}x ${prod.nombre}`);
                                      }
                                      if (prod.imagen) {
                                        setPromoEmoji(prod.imagen);
                                      }
                                    }
                                  }}
                                />
                              </div>

                              <div className="form-group">
                                <label className="form-label">Cantidad Unidades</label>
                                <input
                                  type="number"
                                  min="1"
                                  className="form-input"
                                  placeholder="Ej: 2"
                                  value={packCantidad}
                                  onChange={(e) => {
                                    const cant = parseInt(e.target.value) || 1;
                                    setPackCantidad(cant);
                                    const prod = productos.find(p => p.id === parseInt(packProductoId));
                                    if (prod && (!promoNombre || promoNombre.includes(prod.nombre))) {
                                      setPromoNombre(`${cant}x ${prod.nombre}`);
                                    }
                                  }}
                                />
                              </div>

                              <div className="form-group">
                                <label className="form-label">Precio Oferta ($)</label>
                                <input
                                  type="number"
                                  className="form-input"
                                  placeholder="Ej: 6900"
                                  value={promoPrecio}
                                  onChange={(e) => setPromoPrecio(e.target.value)}
                                />
                              </div>
                            </div>

                            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                              <div className="form-group">
                                <label className="form-label">Nombre de la Oferta / Pack</label>
                                <input
                                  type="text"
                                  className="form-input"
                                  placeholder="Ej. 2 Churrascos por $6.900"
                                  value={promoNombre}
                                  onChange={(e) => setPromoNombre(e.target.value)}
                                />
                              </div>

                              <div className="form-group">
                                <label className="form-label">Emoji Representativo</label>
                                <select
                                  className="form-input form-select"
                                  value={promoEmoji}
                                  onChange={(e) => setPromoEmoji(e.target.value)}
                                >
                                  <option value="🎁">🎁 Regalo / Combo</option>
                                  <option value="📦">📦 Pack / Multi-Unidad</option>
                                  <option value="🏷️">🏷️ Oferta</option>
                                  <option value="🔥">🔥 Destacado</option>
                                  <option value="🍔">🍔 Hamburguesa</option>
                                  <option value="🌭">🌭 Completo</option>
                                  <option value="🍟">🍟 Papas Fritas</option>
                                  <option value="🥤">🥤 Bebida / Coca-Cola</option>
                                  <option value="🍾">🍾 Botella de Gaseosa</option>
                                  <option value="🥫">🥫 Lata de Bebida</option>
                                  <option value="💧">💧 Botella de Agua</option>
                                  <option value="🍕">🍕 Pizza</option>
                                  <option value="🍗">🍗 Pollo Frito</option>
                                  <option value="🥪">🥪 Sándwich</option>
                                  <option value="🍻">🍻 Cervezas</option>
                                </select>
                              </div>
                            </div>

                            {/* Mostrar productos adicionales o listado fijo */}
                            <div style={{ borderTop: '1px dashed rgba(16, 185, 129, 0.25)', paddingTop: '0.85rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <span style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#10b981' }}>Contenido Incluido en este Pack:</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Descuento automático de stock de insumos</span>
                              </div>

                              {promoProductosFijos.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                  {promoProductosFijos.map((pf) => (
                                    <div key={pf.producto_id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '0.3rem 0.6rem', borderRadius: '8px', fontSize: '0.8rem', border: '1px solid rgba(16,185,129,0.3)' }}>
                                      <span style={{ fontWeight: 'bold', color: '#10b981' }}>{pf.cantidad}x</span>
                                      <span>{pf.nombre_producto}</span>
                                      <button type="button" onClick={() => eliminarProductoFijoPromoForm(pf.producto_id)} style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}>&times;</button>
                                    </div>
                                  ))}
                                </div>
                              )}

                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px auto', gap: '0.5rem', alignItems: 'center' }}>
                                <SearchableProductSelect
                                  placeholder="-- Buscar producto secundario --"
                                  options={productos.map(p => ({
                                    value: p.id,
                                    label: `${p.nombre} ($${parseFloat(p.precio).toLocaleString('es-CL')})`
                                  }))}
                                  value={selectedFixedProdId}
                                  onChange={(val) => setSelectedFixedProdId(val)}
                                />
                                <input type="number" className="form-input" placeholder="Cant" defaultValue="1" min="1" style={{ height: '38px', fontSize: '0.82rem', textAlign: 'center', width: '100%' }} id="cant-fixed-product" />
                                <button type="button" className="btn-secondary" style={{ height: '38px', fontSize: '0.8rem', padding: '0 0.85rem', width: 'auto', whiteSpace: 'nowrap' }} onClick={() => {
                                  const cant = document.getElementById('cant-fixed-product');
                                  if (selectedFixedProdId) {
                                    agregarProductoFijoPromoForm(selectedFixedProdId, cant ? cant.value || 1 : 1);
                                    setSelectedFixedProdId('');
                                    if (cant) cant.value = "1";
                                  }
                                }}>+ Agregar</button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* MODO COMBO PERSONALIZADO (Paso a Paso con Opciones) */
                          <>
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
                                  <option value="🥤">🥤 Bebida / Coca-Cola</option>
                                  <option value="🍾">🍾 Botella de Gaseosa</option>
                                  <option value="🥫">🥫 Lata de Bebida</option>
                                  <option value="💧">💧 Botella de Agua</option>
                                  <option value="🍕">🍕 Pizza</option>
                                  <option value="🍗">🍗 Pollo Frito</option>
                                  <option value="🌮">🌮 Taco</option>
                                  <option value="🥪">🥪 Sándwich</option>
                                  <option value="🍻">🍻 Cervezas</option>
                                </select>
                              </div>
                            </div>

                            {/* Apartado Extra: Productos Fijos */}
                            <div className="form-group" style={{ 
                              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.02) 100%)', 
                              padding: '1.25rem', 
                              borderRadius: '14px', 
                              border: '1px solid rgba(16, 185, 129, 0.25)'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                                <div>
                                  <label className="form-label" style={{ marginBottom: 0, fontWeight: '700', color: '#10b981' }}>📌 Productos Fijos Incluidos</label>
                                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Se agregan de forma fija a la comanda.</p>
                                </div>
                              </div>

                              {promoProductosFijos.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '0.85rem' }}>
                                  {promoProductosFijos.map((pf) => (
                                    <div key={pf.producto_id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'var(--item-bg)', padding: '0.4rem 0.75rem', borderRadius: '10px', fontSize: '0.85rem', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                                      <span style={{ background: '#10b981', color: 'white', padding: '0.1rem 0.45rem', borderRadius: '6px', fontWeight: 'bold' }}>{pf.cantidad}x</span>
                                      <span>{pf.nombre_producto}</span>
                                      <button type="button" onClick={() => eliminarProductoFijoPromoForm(pf.producto_id)} style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}>&times;</button>
                                    </div>
                                  ))}
                                </div>
                              )}

                              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                                <select className="form-input form-select" style={{ height: '38px', fontSize: '0.85rem', flex: 1 }} id="sel-fixed-product" defaultValue="">
                                  <option value="" disabled>-- Seleccionar Producto Fijo --</option>
                                  {productos.map(p => (
                                    <option key={p.id} value={p.id}>{p.nombre}</option>
                                  ))}
                                </select>
                                <input type="number" className="form-input" placeholder="Cant" defaultValue="1" min="1" style={{ width: '65px', height: '38px', fontSize: '0.85rem', textAlign: 'center' }} id="cant-fixed-product" />
                                <button type="button" className="btn-secondary" style={{ height: '38px', fontSize: '0.85rem' }} onClick={() => {
                                  const sel = document.getElementById('sel-fixed-product');
                                  const cant = document.getElementById('cant-fixed-product');
                                  if (sel && sel.value) {
                                    agregarProductoFijoPromoForm(sel.value, cant.value || 1);
                                    sel.value = "";
                                    cant.value = "1";
                                  }
                                }}>➕ Incluir</button>
                              </div>
                            </div>

                            {/* Pasos de selección */}
                            <div className="form-group" style={{ marginTop: '0.5rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <label className="form-label" style={{ marginBottom: 0 }}>Pasos de Selección (Combo)</label>
                                <button type="button" className="btn-secondary" onClick={agregarPasoPromoForm} style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}>
                                  ➕ Agregar Paso
                                </button>
                              </div>

                              {promoPasos.length === 0 ? (
                                <p style={{ fontSize: '0.85rem', fontStyle: 'italic', color: 'var(--text-secondary)', textAlign: 'center', padding: '1.5rem', border: '1px dashed rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                  Agrega al menos un paso para definir qué productos componen este combo.
                                </p>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                  {promoPasos.map((paso, pIdx) => {
                                    const idKey = paso.id || paso.temp_id;
                                    const isReal = !!paso.id;
                                    return (
                                      <div key={idKey} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', padding: '1rem' }}>
                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                                          <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>#{pIdx + 1}</span>
                                          <input type="text" className="form-input" placeholder="Ej. Elige tu Bebida" style={{ flex: 1, height: '32px', fontSize: '0.85rem' }} value={paso.nombre_paso} onChange={(e) => actualizarNombrePasoForm(idKey, isReal, e.target.value)} />
                                          <button type="button" onClick={() => eliminarPasoPromoForm(idKey, isReal)} style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.3rem 0.5rem', borderRadius: '4px' }}>🗑️</button>
                                        </div>

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
                                                    <span style={{ color: 'var(--accent-primary)', fontSize: '0.75rem' }}>(+${parseFloat(opc.precio_adicional)})</span>
                                                  )}
                                                  <button type="button" onClick={() => eliminarOpcionDelPasoForm(idKey, isReal, opc.producto_id)} style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}>&times;</button>
                                                </div>
                                              ))}
                                            </div>
                                          )}

                                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 95px auto', gap: '0.5rem', marginTop: '0.5rem', alignItems: 'center' }}>
                                            <SearchableProductSelect
                                              placeholder="-- Buscar o Seleccionar Producto --"
                                              options={productos.map(p => ({
                                                value: p.id,
                                                label: `${p.nombre} ($${parseFloat(p.precio).toLocaleString('es-CL')})`
                                              }))}
                                              value={selectedStepProds[idKey] || ''}
                                              onChange={(val) => setSelectedStepProds(prev => ({ ...prev, [idKey]: val }))}
                                            />
                                            <input type="number" className="form-input" placeholder="Extra $" style={{ height: '38px', fontSize: '0.85rem', textAlign: 'center', width: '100%' }} id={`extra-price-${idKey}`} />
                                            <button type="button" className="btn-primary" style={{ height: '38px', padding: '0 1.1rem', fontSize: '0.85rem', width: 'auto', whiteSpace: 'nowrap' }} onClick={() => {
                                              const val = selectedStepProds[idKey];
                                              const extra = document.getElementById(`extra-price-${idKey}`);
                                              if (val) {
                                                agregarOpcionAlPasoForm(idKey, isReal, val, extra ? extra.value : 0);
                                                setSelectedStepProds(prev => ({ ...prev, [idKey]: '' }));
                                                if (extra) extra.value = "";
                                              }
                                            }}>+ Añadir</button>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </>
                        )}

                        <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.85rem', borderRadius: '12px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                          <label className="form-label" style={{ marginBottom: 0, fontWeight: '700' }}>📦 Cobro de Envase para Llevar</label>
                          <div style={{ display: 'grid', gridTemplateColumns: promoAplicaEnvase === 'combo' ? '1.5fr 1fr' : '1fr', gap: '0.75rem', alignItems: 'center' }}>
                            <select
                              className="form-input form-select"
                              value={promoAplicaEnvase}
                              onChange={(e) => setPromoAplicaEnvase(e.target.value)}
                            >
                              <option value="no">🚫 No cobrar envase (Exento)</option>
                              <option value="combo">✅ Cobrar envase por promoción</option>
                            </select>
                            {promoAplicaEnvase === 'combo' && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Cant. Envases:</label>
                                <input
                                  type="number"
                                  min="1"
                                  className="form-input"
                                  value={promoCantidadEnvases}
                                  onChange={(e) => setPromoCantidadEnvases(parseInt(e.target.value) || 1)}
                                  style={{ textAlign: 'center', height: '38px', fontSize: '0.85rem' }}
                                />
                              </div>
                            )}
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

                        <button
                          type="submit"
                          className="btn-primary"
                          style={{ width: '100%', height: '42px', marginTop: '0.5rem', fontWeight: 'bold', fontSize: '0.95rem' }}
                          disabled={promoLoading}
                        >
                          {promoLoading ? 'Guardando...' : (formatoPromoMode === 'pack' ? '⚡ Guardar Pack / Oferta' : 'Guardar Combo Personalizado')}
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
                        <div key={promo.id} className="user-list-item" style={{ background: 'var(--item-bg)', padding: '1rem', border: '1px solid var(--glass-border)', boxShadow: 'var(--card-shadow)', borderRadius: '22px', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
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
                            <div style={{ paddingLeft: '1.75rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                              {promo.pasos.map((paso, idx) => {
                                const catsFound = [...new Set(paso.opciones.map(o => {
                                  const p = productos.find(pr => pr.id === o.producto_id);
                                  return p?.categoria;
                                }).filter(Boolean))];

                                let resumenOpciones = '';
                                if (catsFound.length === 1) {
                                  resumenOpciones = `Categoría ${catsFound[0]} (${paso.opciones.length} opciones disponibles)`;
                                } else if (paso.opciones.length > 3) {
                                  const primeros3 = paso.opciones.slice(0, 3).map(o => o.nombre_producto).join(', ');
                                  resumenOpciones = `${primeros3} y ${paso.opciones.length - 3} más...`;
                                } else if (paso.opciones.length > 0) {
                                  resumenOpciones = paso.opciones.map(o => o.nombre_producto).join(', ');
                                } else {
                                  resumenOpciones = 'Sin opciones registradas';
                                }

                                return (
                                  <div key={paso.id || idx} style={{ marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    <strong style={{ color: 'var(--text-primary)' }}>Paso {idx + 1}: {paso.nombre_paso}</strong>
                                    <span style={{ 
                                      background: 'rgba(139, 92, 246, 0.15)', 
                                      color: '#a78bfa', 
                                      border: '1px solid rgba(139, 92, 246, 0.3)', 
                                      padding: '0.15rem 0.55rem', 
                                      borderRadius: '12px', 
                                      fontSize: '0.75rem', 
                                      fontWeight: 'bold' 
                                    }}>
                                      🏷️ {resumenOpciones}
                                    </span>
                                  </div>
                                );
                              })}
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
                  <div className="admin-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem' }}>
                    <div style={{ flex: '1', minWidth: '250px' }}>
                      <h3 className="section-title">📋 Historial de Pedidos (Tickets)</h3>
                      <p className="section-subtitle" style={{ margin: 0 }}>Visualiza todas las comandas y tickets registrados en el sistema</p>
                    </div>
                    <div className="nav-tabs" style={{ display: 'flex', gap: '0.25rem' }}>
                      <button
                        type="button"
                        className={`nav-tab ${subTabHistorial === 'activas' ? 'active' : ''}`}
                        onClick={() => setSubTabHistorial('activas')}
                      >
                        📋 Comandas Activas
                      </button>
                      <button
                        type="button"
                        className={`nav-tab ${subTabHistorial === 'eliminadas' ? 'active' : ''}`}
                        style={subTabHistorial === 'eliminadas' ? { background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)', color: 'white' } : {}}
                        onClick={() => setSubTabHistorial('eliminadas')}
                      >
                        🗑️ Comandas Eliminadas
                      </button>
                    </div>
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
                    <div style={{ flex: '1.5 1 140px', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Filtrar por Turno</label>
                      <select
                        className="form-input"
                        style={{ 
                          padding: '0.5rem 1.5rem 0.5rem 0.75rem', 
                          fontSize: '0.9rem', 
                          height: '38px', 
                          color: 'var(--text-primary)', 
                          background: 'var(--input-bg)',
                          border: '1px solid var(--glass-border)',
                          borderRadius: '12px',
                          cursor: 'pointer'
                        }}
                        value={filtroTurnoHistorial}
                        onChange={(e) => setFiltroTurnoHistorial(e.target.value)}
                      >
                        <option value="all">📅 Todos los turnos</option>
                        {listaTurnos.map(t => (
                          <option key={t.id} value={t.id}>
                            ⏰ Turno #{t.id} ({t.usuario_inicio} - {new Date(t.fecha_hora_inicio).toLocaleDateString('es-CL')})
                          </option>
                        ))}
                      </select>
                    </div>
                    {(filtroTicketId || filtroCliente || filtroFechaInicio || filtroFechaFin || filtroTurnoHistorial !== 'all') && (
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
                            setFiltroTurnoHistorial('all');
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
                        if (filtroTurnoHistorial !== 'all' && String(ped.turno_id) !== String(filtroTurnoHistorial)) {
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
                                  precio: parseFloat(p.precio_unitario),
                                  promocion_id: p.promocion_id,
                                  productos_incluidos: p.productos_incluidos
                                })),
                                total: parseFloat(ped.total),
                                atendido_por: ped.atendido_por,
                                nota: ped.nota,
                                tipo_entrega: ped.tipo_entrega,
                                tipo_transaccion: ped.tipo_transaccion,
                                pago_mixto_detalle: ped.pago_mixto_detalle,
                                eliminado: ped.eliminado || subTabHistorial === 'eliminadas',
                                eliminado_por: ped.eliminado_por,
                                eliminado_fecha: ped.eliminado_fecha
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
                                      : ped.tipo_transaccion === 'Mixto'
                                        ? 'rgba(139, 92, 246, 0.18)'
                                        : 'rgba(234, 179, 8, 0.15)',
                                  border: ped.tipo_transaccion === 'Crédito' 
                                    ? '1px solid rgba(59, 130, 246, 0.3)' 
                                    : ped.tipo_transaccion === 'Débito' 
                                      ? '1px solid rgba(16, 185, 129, 0.3)' 
                                      : ped.tipo_transaccion === 'Mixto'
                                        ? '1px solid rgba(139, 92, 246, 0.4)'
                                        : '1px solid rgba(234, 179, 8, 0.3)',
                                  color: ped.tipo_transaccion === 'Crédito' 
                                    ? (isDark ? '#93c5fd' : '#1d4ed8') 
                                    : ped.tipo_transaccion === 'Débito' 
                                      ? (isDark ? '#a7f3d0' : '#047857') 
                                      : ped.tipo_transaccion === 'Mixto'
                                        ? (isDark ? '#c4b5fd' : '#6d28d9')
                                        : (isDark ? '#fef08a' : '#b45309'),
                                  fontSize: '0.75rem',
                                  padding: '0.15rem 0.5rem'
                                }}>
                                  {ped.tipo_transaccion === 'Mixto' ? `🔀 Mixto ${ped.pago_mixto_detalle ? `(${ped.pago_mixto_detalle})` : ''}` : (ped.tipo_transaccion || 'Efectivo')}
                                </span>
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: '600' }}>
                                  - {ped.cliente_nombre}
                                </span>
                                <span style={{ 
                                  fontWeight: '800', 
                                  color: 'var(--accent-primary)', 
                                  fontSize: '0.95rem', 
                                  background: 'var(--item-bg)', 
                                  padding: '0.2rem 0.6rem', 
                                  borderRadius: '8px', 
                                  border: '1px solid var(--glass-border)',
                                  marginLeft: '0.25rem'
                                }}>
                                  ${parseFloat(ped.total).toLocaleString('es-CL', { minimumFractionDigits: 0 })}
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                  {new Date(ped.fecha_hora).toLocaleDateString('es-CL')} - {new Date(ped.fecha_hora).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {subTabHistorial === 'activas' && user?.cargo?.toLowerCase() === 'administrador' && (
                                   <button
                                     type="button"
                                     className="btn-danger"
                                     style={{
                                       padding: '0.3rem 0.65rem',
                                       fontSize: '0.78rem',
                                       borderRadius: '8px',
                                       background: 'rgba(239, 68, 68, 0.18)',
                                       border: '1px solid rgba(239, 68, 68, 0.4)',
                                       color: '#ef4444',
                                       fontWeight: 'bold',
                                       cursor: 'pointer',
                                       display: 'flex',
                                       alignItems: 'center',
                                       gap: '0.25rem',
                                       transition: 'all 0.2s ease'
                                     }}
                                     title="Eliminar Comanda (Requiere contraseña Admin)"
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       setPedidoToDelete(ped);
                                       setAdminPasswordInput('');
                                       setErrorDeleteModal('');
                                       setShowDeleteModal(true);
                                     }}
                                   >
                                     🗑️ Eliminar
                                   </button>
                                 )}
                                {subTabHistorial === 'eliminadas' && (
                                  <span style={{
                                    fontSize: '0.78rem',
                                    color: '#ef4444',
                                    background: 'rgba(239, 68, 68, 0.12)',
                                    border: '1px solid rgba(239, 68, 68, 0.25)',
                                    borderRadius: '8px',
                                    padding: '0.25rem 0.5rem',
                                    fontWeight: '700'
                                  }}>
                                    🗑️ Eliminada por {ped.eliminado_por || 'N/A'} ({ped.eliminado_fecha ? new Date(ped.eliminado_fecha).toLocaleDateString('es-CL') : ''})
                                  </span>
                                )}
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
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
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
                                  envases_vendidos: cierreData.envases_vendidos,
                                  productos_promociones: cierreData.productos_promociones,
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
                              🖨️ Reporte de Cierre
                            </button>

                            <button
                              type="button"
                              className="btn-secondary"
                              style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem', height: '32px' }}
                              onClick={() => {
                                window.electronAPI.printReport({
                                  fecha: fechaCierre,
                                  tipo_reporte: 'consolidado',
                                  productos_unificados: cierreData.productos_unificados
                                });
                              }}
                            >
                              📦 Reporte de Productos
                            </button>
                          </div>
                        )}
                      </div>
                      
                      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                          <label style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Fecha:</label>
                          <input
                            type="date"
                            className="form-input"
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.9rem', height: '36px', width: '135px', color: 'var(--text-primary)' }}
                            value={fechaCierre}
                            onChange={(e) => setFechaCierre(e.target.value)}
                          />
                        </div>

                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                          <label style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Turno:</label>
                          <select
                            value={filtroTurnoCierre}
                            onChange={(e) => handleShiftFilterChange(e.target.value)}
                            className="form-input"
                            style={{ 
                              padding: '0.35rem 1.75rem 0.35rem 0.65rem', 
                              fontSize: '0.9rem', 
                              height: '36px', 
                              color: 'var(--text-primary)', 
                              background: 'var(--input-bg)',
                              border: '1px solid var(--glass-border)',
                              borderRadius: '12px',
                              cursor: 'pointer',
                              maxWidth: '180px'
                            }}
                          >
                            <option value="all">📅 Todo el día (Todos)</option>
                            {listaTurnos
                              .filter(t => {
                                const tDate = new Date(t.fecha_hora_inicio);
                                const y = tDate.getFullYear();
                                const m = String(tDate.getMonth() + 1).padStart(2, '0');
                                const d = String(tDate.getDate()).padStart(2, '0');
                                return `${y}-${m}-${d}` === fechaCierre;
                              })
                              .map(t => (
                                <option key={t.id} value={t.id}>
                                  ⏰ Turno #{t.id} ({t.usuario_inicio})
                                </option>
                              ))
                            }
                          </select>
                        </div>

                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ height: '36px', padding: '0 0.85rem', fontSize: '0.85rem' }}
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
                            {/* LISTA UNIFICADA DE PRODUCTOS VENDIDOS (Unidades Totales) */}
                            <div className="cierre-sub-card">
                              <h5 className="cierre-sub-card-title">🍔 Total de Productos Vendidos (Unidades)</h5>
                              {cierreData.productos_unificados && cierreData.productos_unificados.length > 0 ? (
                                <div className="cierre-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                  {cierreData.productos_unificados.map((p, idx) => (
                                    <div key={idx} className="cierre-list-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <span className="cierre-item-name" style={{ flex: 1 }}>{p.nombre_producto}</span>
                                      {p.cantidad_directa > 0 && p.cantidad_promo > 0 && (
                                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginRight: '0.75rem' }}>
                                          ({p.cantidad_directa} indiv. + {p.cantidad_promo} promo)
                                        </span>
                                      )}
                                      <strong className="cierre-item-qty" style={{ color: 'var(--accent-primary)', fontSize: '0.95rem' }}>
                                        {p.cantidad_total} un.
                                      </strong>
                                    </div>
                                  ))}
                                  <div className="cierre-list-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px dashed var(--accent-primary)', paddingTop: '0.65rem', marginTop: '0.5rem', background: 'rgba(255, 255, 255, 0.06)', fontWeight: 'bold' }}>
                                    <span className="cierre-item-name" style={{ fontWeight: '700' }}>Total Unidades Producidas / Vendidas:</span>
                                    <strong style={{ color: 'var(--accent-primary)', fontSize: '0.98rem' }}>
                                      {cierreData.productos_unificados.reduce((acc, curr) => acc + (curr.cantidad_total || 0), 0)} un.
                                    </strong>
                                  </div>
                                </div>
                              ) : (
                                <p className="cierre-empty-text">No hay productos registrados en esta fecha.</p>
                              )}
                            </div>

                            {/* DETALLE FINANCIERO POR ÍTEM / PROMO COBRADA */}
                            <div className="cierre-sub-card">
                              <h5 className="cierre-sub-card-title">💳 Detalle Financiero por Ítem Cobrado ($)</h5>
                              {(cierreData.productos_vendidos && cierreData.productos_vendidos.length > 0) || (cierreData.envases_vendidos && cierreData.envases_vendidos.cantidad > 0) ? (
                                <div className="cierre-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                  {cierreData.productos_vendidos && cierreData.productos_vendidos.map((p, idx) => (
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
                                  {cierreData.envases_vendidos && cierreData.envases_vendidos.cantidad > 0 && (
                                    <div className="cierre-list-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.02)' }}>
                                      <span className="cierre-item-name" style={{ flex: 1 }}>🛍️ Envases para llevar</span>
                                      <span style={{ marginRight: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                        {cierreData.envases_vendidos.cantidad} un.
                                      </span>
                                      <strong className="cierre-item-qty">
                                        ${(cierreData.envases_vendidos.total_pesos || 0).toLocaleString('es-CL', { minimumFractionDigits: 0 })}
                                      </strong>
                                    </div>
                                  )}
                                  <div className="cierre-list-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px dashed var(--accent-primary)', paddingTop: '0.65rem', marginTop: '0.5rem', background: 'rgba(255, 255, 255, 0.06)', fontWeight: 'bold' }}>
                                    <span className="cierre-item-name" style={{ fontWeight: '700' }}>Total Productos y Envases:</span>
                                    <strong style={{ color: 'var(--accent-primary)', fontSize: '0.98rem' }}>
                                      ${(
                                        (cierreData.productos_vendidos || []).reduce((acc, curr) => acc + (curr.total_pesos || 0), 0) +
                                        (cierreData.envases_vendidos ? (cierreData.envases_vendidos.total_pesos || 0) : 0)
                                      ).toLocaleString('es-CL', { minimumFractionDigits: 0 })}
                                    </strong>
                                  </div>
                                </div>
                              ) : (
                                <p className="cierre-empty-text">No hay productos ni envases vendidos en esta fecha.</p>
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


                        </div>
                      ) : (
                        <p style={{ color: 'var(--text-muted)' }}>Selecciona una fecha para visualizar el cierre.</p>
                      )}
                    </div>

                    {/* Columna Derecha: Reportes y Exportaciones */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%', overflowY: 'auto', paddingRight: '0.25rem' }}>
                      {/* Gestión de Turnos */}
                      <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '16px', padding: '1.25rem', border: '1px solid var(--glass-border)' }}>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.75rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          ⏰ Gestión de Turnos (Sesiones)
                        </h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                          Inicia y finaliza turnos de trabajo de forma independiente a la fecha del calendario. Cada venta queda asociada al turno correspondiente.
                        </p>

                        {/* Estado del Turno Activo */}
                        <div style={{
                          background: activeShift ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                          border: activeShift ? '1px dashed var(--success)' : '1px dashed var(--error)',
                          borderRadius: '12px',
                          padding: '0.85rem',
                          marginBottom: '1rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '1rem'
                        }}>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                            {activeShift ? (
                              <>
                                <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>● Turno Activo #{activeShift.id}</span>
                                <div style={{ marginTop: '0.2rem', color: 'var(--text-secondary)' }}>
                                  Iniciado por: <strong>{activeShift.usuario_inicio}</strong><br />
                                  Desde: {new Date(activeShift.fecha_hora_inicio).toLocaleDateString('es-CL')} - {new Date(activeShift.fecha_hora_inicio).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </>
                            ) : (
                              <>
                                <span style={{ color: 'var(--error)', fontWeight: 'bold' }}>○ Sin Turno Activo</span>
                                <div style={{ marginTop: '0.2rem', color: 'var(--text-secondary)' }}>
                                  Inicia un turno para asociarle las nuevas ventas.
                                </div>
                              </>
                            )}
                          </div>
                          
                          {activeShift ? (
                            <button
                              type="button"
                              className="btn-danger"
                              style={{ height: '36px', padding: '0 0.85rem', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
                              onClick={async () => {
                                setEfectivoFinalInput('');
                                setObservacionesCerrarShiftInput('');
                                setErrorCerrarShiftInput('');
                                setActiveShiftSalesInfo(null);
                                setShowCerrarTurnoPrompt(true);
                                try {
                                  const today = new Date().toISOString().split('T')[0];
                                  const response = await fetch(`http://127.0.0.1:5000/api/informes/cierre?fecha=${today}&turno_id=${activeShift.id}`);
                                  const data = await response.json();
                                  if (response.ok && data.success) {
                                    setActiveShiftSalesInfo(data.data);
                                  }
                                } catch (e) {
                                  console.error("Error al obtener ventas del turno activo:", e);
                                }
                              }}
                            >
                              🔒 Cerrar Turno
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn-primary"
                              style={{ height: '36px', padding: '0 0.85rem', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
                              onClick={() => {
                                setEfectivoInicialInput('');
                                setErrorShiftInput('');
                                setShowShiftPrompt(true);
                              }}
                            >
                              🔑 Iniciar Turno
                            </button>
                          )}
                        </div>

                        {/* Historial de Turnos */}
                        <div style={{ marginTop: '0.5rem' }}>
                          <h5 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>📋 Historial Reciente de Turnos</h5>
                          
                          {loadingTurnos ? (
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Cargando turnos...</p>
                          ) : listaTurnos.length === 0 ? (
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>No hay turnos registrados en el sistema.</p>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '250px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                              {listaTurnos.map((t) => (
                                <div key={t.id} style={{
                                  background: 'rgba(255, 255, 255, 0.02)',
                                  border: '1px solid var(--glass-border)',
                                  borderRadius: '10px',
                                  padding: '0.65rem 0.75rem',
                                  fontSize: '0.8rem',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '0.35rem'
                                }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <strong style={{ color: t.activo ? 'var(--success)' : 'var(--text-primary)' }}>
                                      Turno #{t.id} {t.activo ? '(Activo)' : ''}
                                    </strong>
                                    <span style={{ fontWeight: '700', color: 'var(--accent-primary)' }}>
                                      ${t.total_ventas.toLocaleString('es-CL', { minimumFractionDigits: 0 })}
                                    </span>
                                  </div>
                                  
                                  <div style={{ color: 'var(--text-secondary)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem' }}>
                                    <div>
                                      🔑 <strong>Inicio:</strong> {t.usuario_inicio}<br />
                                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        {new Date(t.fecha_hora_inicio).toLocaleDateString('es-CL')} - {new Date(t.fecha_hora_inicio).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                                      </span><br />
                                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                        💵 Inicial: <strong>${(t.efectivo_inicial || 0).toLocaleString('es-CL')}</strong>
                                      </span>
                                    </div>
                                    <div>
                                      🔒 <strong>Cierre:</strong> {t.usuario_fin || (t.activo ? '—' : 'Auto')}<br />
                                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        {t.fecha_hora_fin ? `${new Date(t.fecha_hora_fin).toLocaleDateString('es-CL')} - ${new Date(t.fecha_hora_fin).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}` : 'En curso'}
                                      </span><br />
                                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                        💵 Final: <strong>{t.activo ? '—' : `$${(t.efectivo_final || 0).toLocaleString('es-CL')}`}</strong>
                                      </span>
                                    </div>
                                  </div>

                                  <div style={{
                                    borderTop: '1px solid var(--glass-border)',
                                    paddingTop: '0.35rem',
                                    marginTop: '0.15rem',
                                    fontSize: '0.75rem',
                                    color: 'var(--text-muted)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    flexWrap: 'wrap',
                                    gap: '0.5rem'
                                  }}>
                                    <span>🛒 Pedidos: <strong>{t.cantidad_pedidos}</strong></span>
                                    <span>💵 Efec: <strong>${t.total_efectivo.toLocaleString('es-CL')}</strong></span>
                                    <span>💳 Tarj: <strong>${(t.total_debito + t.total_credito).toLocaleString('es-CL')}</strong></span>
                                    <span>📦 Envs: <strong>${t.total_envases.toLocaleString('es-CL')}</strong></span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>



                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'configuraciones' && (
              <div className="admin-container animate-fade-in" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div className="admin-card full-width" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <div className="admin-card-header" style={{ marginBottom: '1rem' }}>
                    <h3 className="section-title">⚙️ Configuraciones de la Aplicación</h3>
                    <p className="section-subtitle">Gestiona las opciones de impresión, envases, correos y otras preferencias de la plataforma</p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: user?.cargo?.toLowerCase() === 'administrador' ? '1fr 1fr' : '1fr', gap: '2rem', flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: '0.25rem' }}>
                    {/* Columna Izquierda: Configuración de Impresora y Precio de Envase */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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
                                  {p.name} {p.isDefault ? '(Predeterminada del sistema)' : ''}
                                </option>
                              ))}
                            </select>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                              Impresora configurada actualmente: <strong>{selectedPrinter || 'Predeterminada del Sistema'}</strong>
                            </p>
                          </div>
                        </div>
                      )}

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
                    </div>

                    {/* Columna Derecha: Configuración de Correo de Recepción */}
                    {user?.cargo?.toLowerCase() === 'administrador' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {/* Configuración de Correo de Recepción */}
                        <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '16px', padding: '1.25rem', border: '1px solid var(--glass-border)' }}>
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

                        {/* Configuración de Precio de Envase */}
                        <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '16px', padding: '1.25rem', border: '1px solid var(--glass-border)' }}>
                          <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            📦 Precio del Envase para Llevar
                          </h4>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.85rem' }}>
                            Establece el precio unitario del envase ($) que se calculará en los pedidos Para Llevar.
                          </p>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.75rem', alignItems: 'center' }}>
                            <div className="input-wrapper" style={{ margin: 0, position: 'relative' }}>
                              <input
                                type="number"
                                min="0"
                                className="form-input"
                                placeholder="300"
                                value={precioEnvase}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setPrecioEnvase(val === '' ? '' : parseInt(val, 10) || 0);
                                }}
                                onBlur={() => setPrecioEnvase(parseInt(precioEnvase, 10) || 0)}
                                style={{ height: '38px', fontSize: '0.95rem', paddingLeft: '2.2rem', paddingRight: '0.75rem', width: '100%', boxSizing: 'border-box', color: 'var(--text-primary)' }}
                              />
                              <span className="input-icon" style={{ left: '0.75rem' }}>💲</span>
                            </div>
                            <button
                              type="button"
                              className="btn-primary"
                              style={{ height: '38px', padding: '0 1rem', fontSize: '0.85rem', width: 'auto', whiteSpace: 'nowrap', flexShrink: 0 }}
                              onClick={guardarConfiguracion}
                            >
                              💾 Guardar Precio
                            </button>
                          </div>
                        </div>

                      </div>
                    )}
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
                      
                      {/* Registro/Edición: solo para Administrador */}
                      {user?.cargo?.toLowerCase() === 'administrador' && (
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
                      )}

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
                            <div style={{ position: 'relative', width: '100%' }}>
                              <AutocompleteGhostInput
                                placeholder="🔍 Escribe para buscar ingrediente..."
                                value={llegadaSearch}
                                suggestions={listaIngredientes.map(ing => ing.nombre)}
                                onSelectSuggestion={(sug) => {
                                  setLlegadaSearch(sug);
                                  const matched = listaIngredientes.find(ing => ing.nombre.toLowerCase() === sug.toLowerCase());
                                  if (matched) {
                                    setLlegadaIngId(matched.id);
                                    setLlegadaDropdownOpen(false);
                                  }
                                }}
                                onChange={(val) => {
                                  setLlegadaSearch(val);
                                  setLlegadaDropdownOpen(true);
                                  const matched = listaIngredientes.find(ing => ing.nombre.toLowerCase() === val.toLowerCase());
                                  if (matched) {
                                    setLlegadaIngId(matched.id);
                                  } else {
                                    setLlegadaIngId('');
                                  }
                                }}
                                disabled={llegadaLoading}
                                onFocus={() => setLlegadaDropdownOpen(true)}
                                onBlur={() => setTimeout(() => setLlegadaDropdownOpen(false), 250)}
                                style={{ color: 'var(--text-primary)', background: 'var(--input-bg)' }}
                              />
                              {llegadaDropdownOpen && (
                                <div style={{
                                  position: 'absolute',
                                  top: '100%',
                                  left: 0,
                                  right: 0,
                                  zIndex: 100,
                                  background: 'var(--glass-bg, #1a1515)',
                                  backdropFilter: 'blur(10px)',
                                  border: '1.5px solid var(--glass-border)',
                                  borderRadius: '12px',
                                  maxHeight: '200px',
                                  overflowY: 'auto',
                                  marginTop: '4px',
                                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                                  padding: '4px'
                                }}>
                                  {listaIngredientes
                                    .filter(ing => ing.nombre.toLowerCase().includes(llegadaSearch.toLowerCase()))
                                    .map(ing => (
                                      <div
                                        key={ing.id}
                                        onClick={() => {
                                          setLlegadaIngId(ing.id);
                                          setLlegadaSearch(ing.nombre);
                                          setLlegadaDropdownOpen(false);
                                        }}
                                        style={{
                                          padding: '8px 12px',
                                          cursor: 'pointer',
                                          borderRadius: '8px',
                                          color: 'var(--text-primary)',
                                          fontSize: '0.85rem',
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          alignItems: 'center',
                                          transition: 'background 0.2s',
                                          background: String(llegadaIngId) === String(ing.id) ? 'rgba(255,255,255,0.08)' : 'transparent'
                                        }}
                                      >
                                        <span style={{ fontWeight: '600' }}>{ing.nombre}</span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Stock: {parseFloat(ing.stock)}</span>
                                      </div>
                                    ))}
                                  {listaIngredientes.filter(ing => ing.nombre.toLowerCase().includes(llegadaSearch.toLowerCase())).length === 0 && (
                                    <div style={{ padding: '8px 12px', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
                                      No se encontraron coincidencias
                                    </div>
                                  )}
                                </div>
                              )}
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

                      {/* Consumo / Merma */}
                      <div style={{ background: 'rgba(255, 140, 0, 0.06)', borderRadius: '16px', padding: '1.25rem', border: '1px solid rgba(217, 119, 6, 0.3)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.25rem', color: '#d97706' }}>
                          📉 Registro de Consumo / Merma
                        </h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                          Descuenta stock por merma, consumo interno u otras bajas.
                        </p>

                        {consumoError && (
                          <div className="alert alert-error" style={{ marginBottom: '0.5rem', padding: '0.5rem 0.75rem' }}>
                            <span>{consumoError}</span>
                          </div>
                        )}
                        {consumoSuccess && (
                          <div className="alert alert-success" style={{ marginBottom: '0.5rem', padding: '0.5rem 0.75rem' }}>
                            <span>{consumoSuccess}</span>
                          </div>
                        )}

                        <form onSubmit={handleConsumoMerma} className="admin-form" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Seleccionar Ingrediente</label>
                            <div style={{ position: 'relative', width: '100%' }}>
                              <AutocompleteGhostInput
                                placeholder="🔍 Escribe para buscar ingrediente..."
                                value={consumoSearch}
                                suggestions={listaIngredientes.map(ing => ing.nombre)}
                                onSelectSuggestion={(sug) => {
                                  setConsumoSearch(sug);
                                  const matched = listaIngredientes.find(ing => ing.nombre.toLowerCase() === sug.toLowerCase());
                                  if (matched) {
                                    setConsumoIngId(matched.id);
                                    setConsumoDropdownOpen(false);
                                  }
                                }}
                                onChange={(val) => {
                                  setConsumoSearch(val);
                                  setConsumoDropdownOpen(true);
                                  const matched = listaIngredientes.find(ing => ing.nombre.toLowerCase() === val.toLowerCase());
                                  if (matched) {
                                    setConsumoIngId(matched.id);
                                  } else {
                                    setConsumoIngId('');
                                  }
                                }}
                                disabled={consumoLoading}
                                onFocus={() => setConsumoDropdownOpen(true)}
                                onBlur={() => setTimeout(() => setConsumoDropdownOpen(false), 250)}
                                style={{ color: 'var(--text-primary)', background: 'var(--input-bg)' }}
                              />
                              {consumoDropdownOpen && (
                                <div style={{
                                  position: 'absolute',
                                  top: '100%',
                                  left: 0,
                                  right: 0,
                                  zIndex: 100,
                                  background: 'var(--glass-bg, #1a1515)',
                                  backdropFilter: 'blur(10px)',
                                  border: '1.5px solid var(--glass-border)',
                                  borderRadius: '12px',
                                  maxHeight: '200px',
                                  overflowY: 'auto',
                                  marginTop: '4px',
                                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                                  padding: '4px'
                                }}>
                                  {listaIngredientes
                                    .filter(ing => ing.nombre.toLowerCase().includes(consumoSearch.toLowerCase()))
                                    .map(ing => (
                                      <div
                                        key={ing.id}
                                        onClick={() => {
                                          setConsumoIngId(ing.id);
                                          setConsumoSearch(ing.nombre);
                                          setConsumoDropdownOpen(false);
                                        }}
                                        style={{
                                          padding: '8px 12px',
                                          cursor: 'pointer',
                                          borderRadius: '8px',
                                          color: 'var(--text-primary)',
                                          fontSize: '0.85rem',
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          alignItems: 'center',
                                          transition: 'background 0.2s',
                                          background: String(consumoIngId) === String(ing.id) ? 'rgba(255,255,255,0.08)' : 'transparent'
                                        }}
                                      >
                                        <span style={{ fontWeight: '600' }}>{ing.nombre}</span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Stock: {parseFloat(ing.stock)}</span>
                                      </div>
                                    ))}
                                  {listaIngredientes.filter(ing => ing.nombre.toLowerCase().includes(consumoSearch.toLowerCase())).length === 0 && (
                                    <div style={{ padding: '8px 12px', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
                                      No se encontraron coincidencias
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Cantidad a Descontar</label>
                            <div className="input-wrapper">
                              <input
                                type="number"
                                step="any"
                                className="form-input"
                                placeholder="Ej. 50"
                                value={consumoCantidad}
                                onChange={(e) => setConsumoCantidad(e.target.value)}
                                disabled={consumoLoading}
                              />
                              <span className="input-icon">➖</span>
                            </div>
                          </div>

                          <button type="submit"
                            style={{ width: '100%', marginTop: '0.5rem', background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)', color: '#fff', border: 'none', borderRadius: '12px', padding: '0.75rem', fontSize: '0.95rem', fontWeight: '700', cursor: 'pointer', opacity: consumoLoading ? 0.6 : 1 }}
                            disabled={consumoLoading}>
                            {consumoLoading ? 'Descontando...' : '⚠️ Registrar Merma'}
                          </button>
                        </form>
                      </div>

                    </div>

                    {/* Columna Derecha: Tabla de Ingredientes y cantidades */}
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, background: 'var(--item-bg)', borderRadius: '22px', padding: '1.25rem', border: '1.5px solid var(--glass-border)', boxShadow: 'var(--card-shadow)' }}>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>📋 Existencias Actuales</h4>

                      {listaIngredientes.length === 0 ? (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <p style={{ color: 'var(--text-muted)' }}>No hay ingredientes en el inventario.</p>
                        </div>
                      ) : (
                        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                              <tr style={{ borderBottom: '2px solid var(--glass-border)' }}>
                                <th style={{ padding: '0.65rem 0.5rem', color: 'var(--text-primary)', fontWeight: '700' }}>Ingrediente</th>
                                <th style={{ padding: '0.65rem 0.5rem', color: 'var(--text-primary)', fontWeight: '700', textAlign: 'right' }}>Stock Disponible</th>
                                {user?.cargo?.toLowerCase() === 'administrador' && (
                                  <th style={{ padding: '0.65rem 0.5rem', color: 'var(--text-primary)', fontWeight: '700', textAlign: 'center' }}>Acciones</th>
                                )}
                              </tr>
                            </thead>
                            <tbody>
                              {listaIngredientes.map((ing) => {
                                const stockNum = parseFloat(ing.stock);
                                const isLowStock = stockNum <= 50; // alerta de stock bajo
                                return (
                                  <tr key={ing.id} style={{ borderBottom: '1px solid var(--glass-border)', verticalAlign: 'middle' }}>
                                    <td style={{ padding: '0.75rem 0.5rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                                      {ing.nombre}
                                    </td>
                                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontWeight: '700', color: isLowStock ? 'var(--error)' : 'var(--text-primary)' }}>
                                      {stockNum.toLocaleString('es-CL', { maximumFractionDigits: 2 })}
                                      {isLowStock && <span style={{ marginLeft: '0.35rem', fontSize: '0.85rem' }} title="Stock bajo">⚠️</span>}
                                    </td>
                                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                                      {user?.cargo?.toLowerCase() === 'administrador' && (
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                          <button
                                            type="button"
                                            onClick={() => iniciarEdicionIng(ing)}
                                            style={{ background: 'var(--btn-secondary-bg)', border: '1px solid var(--glass-border)', cursor: 'pointer', padding: '0.45rem 0.6rem', borderRadius: '10px' }}
                                            title="Editar ingrediente / stock"
                                          >
                                            ✏️
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteIngredient(ing.id, ing.nombre)}
                                            style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', cursor: 'pointer', padding: '0.45rem 0.6rem', borderRadius: '10px' }}
                                            title="Eliminar ingrediente"
                                          >
                                            🗑️
                                          </button>
                                        </div>
                                      )}
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

      {showShiftPrompt && (
        <div className="custom-modal-overlay">
          <div className="custom-modal-card" style={{ maxWidth: '420px' }}>
            <div className="custom-modal-header">
              <span className="custom-modal-icon">🔑</span>
              <h3 className="custom-modal-title">Apertura de Turno Requerida</h3>
            </div>
            <div className="custom-modal-body">
              <p className="custom-modal-message" style={{ marginBottom: '1.25rem' }}>
                No hay ningún turno de trabajo activo actualmente. Debes iniciar un nuevo turno para poder operar en el sistema de comandas.
              </p>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Efectivo Inicial en Caja ($) <span style={{ color: 'red' }}>*</span></label>
                <div className="input-wrapper" style={{ position: 'relative' }}>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Monto de apertura (ej. 15000)"
                    value={efectivoInicialInput}
                    onChange={(e) => {
                      setEfectivoInicialInput(e.target.value);
                      if (errorShiftInput) setErrorShiftInput('');
                    }}
                    style={{ 
                      color: 'var(--text-primary)', 
                      background: 'var(--input-bg)', 
                      paddingLeft: '2.5rem',
                      borderColor: errorShiftInput ? '#ef4444' : undefined
                    }}
                  />
                  <span className="input-icon" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}>💵</span>
                </div>
                {errorShiftInput && (
                  <div style={{ color: '#ef4444', fontSize: '0.82rem', fontWeight: 'bold', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    ⚠️ {errorShiftInput}
                  </div>
                )}
              </div>
            </div>
            <div className="custom-modal-footer" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setShowShiftPrompt(false);
                  setErrorShiftInput('');
                  handleLogout();
                }}
              >
                🚪 Cerrar Sesión
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={async () => {
                  if (efectivoInicialInput === '' || isNaN(parseFloat(efectivoInicialInput)) || parseFloat(efectivoInicialInput) < 0) {
                    const msg = 'Por favor, ingresa un monto válido para el efectivo inicial de apertura.';
                    setErrorShiftInput(msg);
                    abrirAlerta(msg, 'Monto Inválido');
                    return;
                  }
                  setErrorShiftInput('');
                  setShowShiftPrompt(false);
                  await iniciarTurno(null, efectivoInicialInput);
                  setEfectivoInicialInput('');
                }}
              >
                🔑 Iniciar Turno
              </button>
            </div>
          </div>
        </div>
      )}
      {showCerrarTurnoPrompt && (
        <div className="custom-modal-overlay">
          <div className="custom-modal-card" style={{ maxWidth: '450px' }}>
            <div className="custom-modal-header">
              <span className="custom-modal-icon">🔐</span>
              <h3 className="custom-modal-title">Arqueo y Cierre de Turno #{activeShift?.id}</h3>
            </div>
            <div className="custom-modal-body">
              <p className="custom-modal-message" style={{ marginBottom: '1rem', fontSize: '0.88rem' }}>
                Cuenta e ingresa el efectivo total final en caja. El sistema calculará la diferencia automáticamente.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                {activeShiftSalesInfo ? (
                  <div className="cierre-live-summary" style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.65rem 0.75rem', borderRadius: '10px', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span>💵 Fondo Inicial de Apertura:</span>
                      <strong>${(activeShift.efectivo_inicial || 0).toLocaleString('es-CL')}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span>🍔 Ventas en Efectivo del Turno:</span>
                      <strong>${(activeShiftSalesInfo.total_efectivo || 0).toLocaleString('es-CL')}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '0.35rem', fontWeight: '700' }}>
                      <span>💰 Efectivo Esperado en Caja:</span>
                      <strong>${((activeShift.efectivo_inicial || 0) + (activeShiftSalesInfo.total_efectivo || 0)).toLocaleString('es-CL')}</strong>
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Calculando resumen de ventas del turno...</p>
                )}

                <div className="form-group">
                  <label className="form-label" style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', fontSize: '0.85rem' }}>
                    Efectivo Final en Caja ($) <span style={{ color: 'red' }}>*</span>
                  </label>
                  <div className="input-wrapper" style={{ position: 'relative' }}>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="Monto de cierre (ej. 45000)"
                      value={efectivoFinalInput}
                      onChange={(e) => {
                        setEfectivoFinalInput(e.target.value);
                        if (errorCerrarShiftInput) setErrorCerrarShiftInput('');
                      }}
                      style={{ 
                        color: 'var(--text-primary)', 
                        background: 'var(--input-bg)', 
                        paddingLeft: '2.5rem',
                        borderColor: errorCerrarShiftInput ? '#ef4444' : undefined,
                        height: '36px'
                      }}
                    />
                    <span className="input-icon" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}>💵</span>
                  </div>
                </div>

                {activeShiftSalesInfo && efectivoFinalInput !== '' && (
                  (() => {
                    const expected = (activeShift.efectivo_inicial || 0) + (activeShiftSalesInfo.total_efectivo || 0);
                    const declared = parseFloat(efectivoFinalInput) || 0;
                    const diff = declared - expected;
                    return (
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: '0.5rem 0.75rem', 
                        borderRadius: '8px', 
                        fontSize: '0.85rem', 
                        fontWeight: '700',
                        background: diff === 0 ? 'rgba(16, 185, 129, 0.1)' : diff > 0 ? 'rgba(59, 130, 246, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: diff === 0 ? '#10b981' : diff > 0 ? '#3b82f6' : '#ef4444'
                      }}>
                        <span>Diferencia:</span>
                        <span>
                          {diff === 0 ? 'Caja Cuadrada ($0)' : `${diff > 0 ? 'Sobrante (+$' : 'Faltante (-$'}${Math.abs(diff).toLocaleString('es-CL')}`}
                        </span>
                      </div>
                    );
                  })()
                )}

                <div className="form-group">
                  <label className="form-label" style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', fontSize: '0.85rem' }}>
                    Observaciones / Notas
                  </label>
                  <textarea
                    className="form-input"
                    placeholder="Nota opcional (ej. retiro de sencillo, descuadre de vuelto)"
                    value={observacionesCerrarShiftInput}
                    onChange={(e) => setObservacionesCerrarShiftInput(e.target.value)}
                    style={{ 
                      color: 'var(--text-primary)', 
                      background: 'var(--input-bg)', 
                      height: '50px',
                      padding: '0.4rem 0.65rem',
                      resize: 'none',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>

                {errorCerrarShiftInput && (
                  <div style={{ color: '#ef4444', fontSize: '0.82rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    ⚠️ {errorCerrarShiftInput}
                  </div>
                )}
              </div>
            </div>
            <div className="custom-modal-footer" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setShowCerrarTurnoPrompt(false);
                  setErrorCerrarShiftInput('');
                  setEfectivoFinalInput('');
                  setObservacionesCerrarShiftInput('');
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={async () => {
                  if (efectivoFinalInput === '' || isNaN(parseFloat(efectivoFinalInput)) || parseFloat(efectivoFinalInput) < 0) {
                    const msg = 'Por favor, ingresa un monto válido para el efectivo final de cierre.';
                    setErrorCerrarShiftInput(msg);
                    abrirAlerta(msg, 'Monto Inválido');
                    return;
                  }
                  setErrorCerrarShiftInput('');
                  setShowCerrarTurnoPrompt(false);
                  await cerrarTurno(efectivoFinalInput, observacionesCerrarShiftInput);
                  setEfectivoFinalInput('');
                  setObservacionesCerrarShiftInput('');
                }}
              >
                Confirmar y Cerrar
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
                  <AutocompleteGhostInput
                    placeholder="Nombre del Cliente (Ej. Carlos Muñoz)"
                    value={clienteNombre}
                    suggestions={Array.from(new Set(historialPedidos.map(p => p.cliente_nombre).filter(Boolean)))}
                    onSelectSuggestion={(sug) => setClienteNombre(sug)}
                    onChange={(val) => setClienteNombre(val)}
                    autoFocus
                    required
                  />
                </div>

                <div className="form-group" style={{ marginTop: '1.25rem', marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>Tipo de Transacción</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    {/* Fila Superior: 3 métodos individuales */}
                    <div className="delivery-selector-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.4rem' }}>
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

                    {/* Fila Inferior: Pago Mixto centrado y compacto */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.1rem' }}>
                      <button
                        type="button"
                        className={`delivery-option-btn ${tipoTransaccion === 'Mixto' ? 'active' : ''}`}
                        onClick={() => setTipoTransaccion('Mixto')}
                        style={{ padding: '0.45rem 1.25rem', fontSize: '0.85rem' }}
                      >
                        🔀 Pago Mixto
                      </button>
                    </div>
                  </div>

                  {tipoTransaccion === 'Mixto' && (() => {
                    const envasesInfo = calcularEnvases(pedido, tipoEntrega);
                    const totalM = calcularSubtotalProductos(pedido) + envasesInfo.montoTotal;
                    const efecM = parseFloat(montoEfectivoMixto) || 0;
                    const debM = parseFloat(montoDebitoMixto) || 0;
                    const credM = parseFloat(montoCreditoMixto) || 0;
                    const sumaM = efecM + debM + credM;
                    const diffM = totalM - sumaM;

                    return (
                      <div style={{
                        marginTop: '0.85rem',
                        padding: '0.85rem 1rem',
                        borderRadius: '16px',
                        background: 'var(--item-bg)',
                        border: '1.5px solid var(--accent-primary)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.65rem'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                            🔀 Ingresa la división del pago:
                          </span>
                          <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--accent-primary)' }}>
                            Total: ${totalM.toLocaleString('es-CL')}
                          </span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                          <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem' }}>
                              💵 Efectivo ($)
                            </label>
                            <input
                              type="number"
                              min="0"
                              className="form-input"
                              placeholder="0"
                              value={montoEfectivoMixto}
                              onChange={(e) => setMontoEfectivoMixto(e.target.value)}
                              style={{ fontSize: '0.85rem', height: '36px', padding: '0 0.5rem', fontWeight: '700' }}
                            />
                          </div>

                          <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem' }}>
                              💳 Débito ($)
                            </label>
                            <input
                              type="number"
                              min="0"
                              className="form-input"
                              placeholder="0"
                              value={montoDebitoMixto}
                              onChange={(e) => setMontoDebitoMixto(e.target.value)}
                              style={{ fontSize: '0.85rem', height: '36px', padding: '0 0.5rem', fontWeight: '700' }}
                            />
                          </div>

                          <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem' }}>
                              💳 Crédito ($)
                            </label>
                            <input
                              type="number"
                              min="0"
                              className="form-input"
                              placeholder="0"
                              value={montoCreditoMixto}
                              onChange={(e) => setMontoCreditoMixto(e.target.value)}
                              style={{ fontSize: '0.85rem', height: '36px', padding: '0 0.5rem', fontWeight: '700' }}
                            />
                          </div>
                        </div>

                        <div style={{ 
                          display: 'flex', 
                          justify: 'space-between', 
                          alignItems: 'center', 
                          padding: '0.4rem 0.65rem', 
                          borderRadius: '10px', 
                          fontSize: '0.8rem', 
                          fontWeight: '700',
                          background: diffM === 0 ? 'rgba(16, 185, 129, 0.15)' : diffM > 0 ? 'rgba(234, 179, 8, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: diffM === 0 ? 'var(--success)' : diffM > 0 ? '#d97706' : 'var(--error)',
                          border: diffM === 0 ? '1px solid rgba(16, 185, 129, 0.35)' : diffM > 0 ? '1px solid rgba(234, 179, 8, 0.35)' : '1px solid rgba(239, 68, 68, 0.35)'
                        }}>
                          <span>
                            Suma Asignada: ${sumaM.toLocaleString('es-CL')}
                          </span>
                          <span>
                            {diffM === 0 ? '✅ Suma Exacta' : diffM > 0 ? `⚠️ Faltan $${diffM.toLocaleString('es-CL')}` : `❌ Excede en $${Math.abs(diffM).toLocaleString('es-CL')}`}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
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

                {/* Total del Pedido elegante */}
                {(() => {
                  const envasesInfo = calcularEnvases(pedido, tipoEntrega);
                  const subtotalProd = calcularSubtotalProductos(pedido);
                  const grandTotal = subtotalProd + envasesInfo.montoTotal;

                  return (
                    <div style={{
                      marginTop: '1.5rem',
                      marginBottom: '1.25rem',
                      paddingTop: '1rem',
                      borderTop: '1px solid var(--glass-border)',
                      display: 'flex',
                      justify: 'space-between',
                      alignItems: 'center',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, paddingRight: '1rem' }}>
                        <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', fontWeight: '700' }}>
                          Total a Pagar
                        </span>
                        {tipoEntrega === 'Llevar' && envasesInfo.montoTotal > 0 && (
                          <span style={{ fontSize: '0.78rem', color: 'var(--accent-primary)', fontWeight: '500', marginTop: '0.2rem' }}>
                            (Incluye +${envasesInfo.montoTotal.toLocaleString('es-CL')} de envases)
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '1.65rem', fontWeight: '800', color: 'var(--accent-primary)', letterSpacing: '-0.5px', whiteSpace: 'nowrap' }}>
                        ${grandTotal.toLocaleString('es-CL', { minimumFractionDigits: 0 })}
                      </span>
                    </div>
                  );
                })()}
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
              {comandaData.eliminado && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '10px',
                  padding: '0.6rem 0.8rem',
                  marginBottom: '1rem',
                  textAlign: 'center',
                  color: '#ef4444',
                  fontWeight: '800',
                  fontSize: '0.9rem',
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.1)'
                }}>
                  🚨 COMANDA ELIMINADA<br/>
                  <span style={{ fontSize: '0.78rem', fontWeight: '500', color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'inline-block' }}>
                    Por: {comandaData.eliminado_por || 'N/A'} el {comandaData.eliminado_fecha ? new Date(comandaData.eliminado_fecha).toLocaleString('es-CL') : ''}
                  </span>
                </div>
              )}
              <h2 className="comanda-client-name">{comandaData.cliente}</h2>
              <div className="comanda-local-name">Calibre 25</div>
              <div className="comanda-ticket-number">Ticket N° {comandaData.ticket}</div>
              <div style={{ marginTop: '0.5rem', fontWeight: 'bold', fontSize: '0.95rem', color: comandaData.tipo_entrega === 'Llevar' ? '#dc2626' : '#059669' }}>
                {comandaData.tipo_entrega === 'Llevar' ? 'PARA LLEVAR' : 'PARA SERVIR'}
                {comandaData.tipo_transaccion && ` | MÉT. PAGO: ${comandaData.tipo_transaccion.toUpperCase()}`}
                {comandaData.tipo_transaccion === 'Mixto' && comandaData.pago_mixto_detalle && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600', marginTop: '0.15rem' }}>
                    ({comandaData.pago_mixto_detalle})
                  </div>
                )}
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
                  {comandaData.productos.map((prod, idx) => {
                    const subItems = getPromoSubItems(prod);
                    return (
                      <tr key={idx}>
                        <td>{prod.cantidad}</td>
                        <td>
                          <div style={{ fontWeight: 'bold' }}>{prod.nombre || 'Producto'}</div>
                          {subItems.length > 0 && (
                            <div style={{ fontSize: '0.8rem', color: '#10b981', marginTop: '0.15rem', fontWeight: '600' }}>
                              {subItems.map((sub, sIdx) => (
                                <div key={sIdx}>- {sub}</div>
                              ))}
                            </div>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          ${(parseFloat(prod.precio) * prod.cantidad).toLocaleString('es-CL', { minimumFractionDigits: 0 })}
                        </td>
                      </tr>
                    );
                  })}
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
              {((comandaData.cantidad_envases > 0) || (comandaData.monto_envases > 0)) && (
                <div style={{
                  textAlign: 'right',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  color: 'var(--ticket-text-secondary, #666)',
                  marginTop: '0.35rem',
                  marginBottom: '0.25rem'
                }}>
                  📦 Envases p/llevar: {comandaData.cantidad_envases || 0} (${(parseFloat(comandaData.monto_envases || 0)).toLocaleString('es-CL', { minimumFractionDigits: 0 })})
                </div>
              )}
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

      {showPromoSelectorModal && selectedPromo && selectedPromo.pasos && selectedPromo.pasos[currentPromoStepIndex] && (() => {
        const pasoActual = selectedPromo.pasos[currentPromoStepIndex];
        const isCategoryGrid = (pasoActual.opciones || []).length >= 6;

        return (
          <div className="custom-modal-overlay">
            <div 
              className="custom-modal" 
              style={{ 
                maxWidth: isCategoryGrid ? '1080px' : '550px', 
                width: '95%', 
                padding: '1.25rem 1.5rem', 
                borderRadius: '20px', 
                maxHeight: '90vh', 
                display: 'flex', 
                flexDirection: 'column' 
              }}
            >
              <div className="custom-modal-header" style={{ marginBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>
                    {selectedPromo.emoji || '🎁'} {selectedPromo.nombre}
                  </h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--accent-primary)', fontWeight: '700', marginTop: '0.2rem', margin: 0 }}>
                    👉 {pasoActual.nombre_paso}
                  </p>
                  {chosenPromoOpciones.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                      {chosenPromoOpciones.map((opt, idx) => (
                        <span key={idx} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.35)', padding: '0.15rem 0.55rem', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          ✅ Paso {idx + 1}: {opt.nombre_producto}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <span style={{ background: 'rgba(234, 88, 12, 0.2)', color: 'var(--accent-primary)', padding: '0.3rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', border: '1px solid rgba(234, 88, 12, 0.3)' }}>
                  Paso {currentPromoStepIndex + 1} de {selectedPromo.pasos.length}
                </span>
              </div>
              
              {isCategoryGrid ? (
                /* VISTA CUADRÍCULA (Para Promos de Categoría con muchas opciones como Churrascos) */
                <div className="products-grid" style={{ 
                  maxHeight: 'none', 
                  overflowY: 'auto', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))', 
                  gap: '0.65rem', 
                  marginTop: 0, 
                  paddingRight: '0.25rem', 
                  flex: 1 
                }}>
                  {(() => {
                    const multiplier = (selectedPromo.pasos && selectedPromo.pasos.length) || 2;
                    const preciosOpciones = (pasoActual.opciones || []).map(o => {
                      const p = productos.find(pr => pr.id === o.producto_id);
                      return p ? parseFloat(p.precio) || 0 : (parseFloat(o.precio_producto) || 0);
                    }).filter(p => p > 0);

                    let precioModaPaso = 0;
                    if (preciosOpciones.length > 0) {
                      const frecs = {};
                      let maxF = 0;
                      preciosOpciones.forEach(p => {
                        frecs[p] = (frecs[p] || 0) + 1;
                        if (frecs[p] > maxF) {
                          maxF = frecs[p];
                          precioModaPaso = p;
                        }
                      });
                    }

                    return (pasoActual.opciones || []).map((opc) => {
                      const prodRef = productos.find(p => p.id === opc.producto_id);
                      const emojiItem = prodRef?.imagen || '🍔';
                      
                      let extraVal = parseFloat(opc.precio_adicional) || 0;
                      if (prodRef && precioModaPaso > 0) {
                        const singleDiff = (parseFloat(prodRef.precio) || 0) - precioModaPaso;
                        extraVal = singleDiff * multiplier;
                      }

                      const isChosenInPreviousStep = chosenPromoOpciones.some(opt => opt.producto_id === opc.producto_id);

                      return (
                        <div
                          key={opc.id || opc.producto_id}
                          className="product-card"
                          onClick={() => seleccionarOpcionPaso(opc)}
                          style={{ 
                            position: 'relative', 
                            padding: '0.65rem 0.5rem', 
                            minHeight: '105px',
                            borderColor: isChosenInPreviousStep ? '#10b981' : undefined,
                            boxShadow: isChosenInPreviousStep ? '0 0 12px rgba(16, 185, 129, 0.4)' : undefined,
                            background: isChosenInPreviousStep ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0.03) 100%)' : undefined
                          }}
                        >
                          {isChosenInPreviousStep && (
                            <div style={{ 
                              position: 'absolute', 
                              top: '5px', 
                              right: '5px', 
                              background: '#10b981', 
                              color: 'white', 
                              borderRadius: '50%', 
                              width: '20px', 
                              height: '20px', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              fontSize: '0.75rem', 
                              fontWeight: '800', 
                              boxShadow: '0 2px 6px rgba(16, 185, 129, 0.5)',
                              zIndex: 2
                            }} title="Seleccionado">
                              ✓
                            </div>
                          )}
                          <div className="product-emoji" style={{ fontSize: '1.6rem', marginBottom: '0.15rem' }}>{emojiItem}</div>
                          <div className="product-info" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1, width: '100%' }}>
                            <h4 className="product-name" style={{ fontSize: '0.78rem', lineHeight: '1.2', minHeight: '2.4em', maxHeight: 'none', margin: '0 0 0.2rem 0', wordBreak: 'break-word' }}>
                              {opc.nombre_producto}
                            </h4>
                            <div className="product-price" style={{ marginTop: 'auto', fontSize: '0.82rem' }}>
                              {extraVal > 0 ? (
                                <span style={{ color: '#ef4444', fontWeight: '800' }}>
                                  +${extraVal.toLocaleString('es-CL')}
                                </span>
                              ) : extraVal < 0 ? (
                                <span style={{ color: '#3b82f6', fontWeight: '800' }}>
                                  -${Math.abs(extraVal).toLocaleString('es-CL')}
                                </span>
                              ) : (
                                <span style={{ color: '#10b981', fontSize: '0.78rem', fontWeight: '700' }}>
                                  Incluido
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              ) : (
                /* VISTA LISTA VERTICAL (Para Promos 1, 2, 3, 4 y combos con pocas opciones seleccionadas a mano) */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', overflowY: 'auto', flex: 1, paddingRight: '0.25rem' }}>
                  {(pasoActual.opciones || []).map((opc) => {
                    const prodRef = productos.find(p => p.id === opc.producto_id);
                    const emojiItem = prodRef?.imagen || '🎁';
                    const extraVal = parseFloat(opc.precio_adicional) || 0;
                    const isChosenInPreviousStep = chosenPromoOpciones.some(opt => opt.producto_id === opc.producto_id);

                    return (
                      <button
                        key={opc.id || opc.producto_id}
                        type="button"
                        className="btn-select-option-list"
                        onClick={() => seleccionarOpcionPaso(opc)}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.85rem 1.1rem',
                          borderRadius: '22px',
                          background: isChosenInPreviousStep 
                            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.05) 100%)' 
                            : 'var(--item-bg)',
                          border: isChosenInPreviousStep 
                            ? '1.5px solid #10b981' 
                            : '1.5px solid var(--glass-border)',
                          boxShadow: 'var(--card-shadow)',
                          color: 'var(--text-primary)',
                          fontSize: '0.95rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          textAlign: 'left'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ fontSize: '1.4rem' }}>{emojiItem}</span>
                          <span style={{ fontWeight: '700' }}>{opc.nombre_producto}</span>
                          {isChosenInPreviousStep && (
                            <span style={{ background: '#10b981', color: 'white', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 'bold' }}>✓</span>
                          )}
                        </div>
                        <div>
                          {extraVal > 0 ? (
                            <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--error)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.82rem', fontWeight: 'bold' }}>
                              +${extraVal.toLocaleString('es-CL')}
                            </span>
                          ) : extraVal < 0 ? (
                            <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.82rem', fontWeight: 'bold' }}>
                              -${Math.abs(extraVal).toLocaleString('es-CL')}
                            </span>
                          ) : (
                            <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.18)', color: 'var(--success)', border: '1px solid rgba(16, 185, 129, 0.35)', padding: '0.2rem 0.65rem', borderRadius: '12px', fontSize: '0.82rem', fontWeight: 'bold' }}>
                              INCLUIDO
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
              
              <div className="custom-modal-actions" style={{ marginTop: '0.85rem', display: 'flex', gap: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.75rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ flex: 1, padding: '0.6rem 1rem', fontSize: '0.88rem', fontWeight: 'bold' }}
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
                  {currentPromoStepIndex > 0 ? '⬅️ Volver al Paso Anterior' : '❌ Cancelar'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
      
      {showDeleteModal && pedidoToDelete && (
        <div className="custom-modal-overlay">
          <div className="custom-modal-content" style={{ maxWidth: '440px', padding: '1.5rem', background: 'var(--modal-bg, #1e1e2e)', borderRadius: '16px', border: '1.5px solid rgba(239, 68, 68, 0.4)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.8rem' }}>🗑️</span>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#ef4444', fontWeight: 'bold' }}>Eliminar Comanda</h3>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Requiere autorización del Administrador</p>
              </div>
            </div>

            <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '0.85rem', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.25)', marginBottom: '1.25rem', fontSize: '0.88rem', color: 'var(--text-primary)' }}>
              ¿Estás seguro de que deseas eliminar el <strong>Ticket #{pedidoToDelete.id}</strong> ({pedidoToDelete.cliente_nombre}) por un valor de <strong>${parseFloat(pedidoToDelete.total).toLocaleString('es-CL')}</strong>?
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                ⚠️ Se recalculará el total diario y los ingredientes utilizados se devolverán al inventario.
              </p>
            </div>

            <form onSubmit={handleConfirmDeletePedido} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>
                  🔒 Contraseña de Administrador ({user?.nombre || 'Admin'})
                </label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Ingresa la contraseña para autorizar"
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  autoFocus
                />
              </div>

              {errorDeleteModal && (
                <div className="alert alert-error" style={{ margin: 0, padding: '0.5rem 0.75rem', fontSize: '0.82rem' }}>
                  <span>{errorDeleteModal}</span>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ flex: 1, padding: '0.6rem', fontSize: '0.88rem' }}
                  onClick={() => {
                    setShowDeleteModal(false);
                    setPedidoToDelete(null);
                    setAdminPasswordInput('');
                    setErrorDeleteModal('');
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-danger"
                  disabled={loadingDeleteModal}
                  style={{ flex: 1, padding: '0.6rem', fontSize: '0.88rem', background: '#ef4444', color: 'white', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                >
                  {loadingDeleteModal ? 'Eliminando...' : 'Confirmar Eliminación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {modalConfig.isOpen && (
        <div className="custom-modal-overlay alert-modal-overlay">
          <div className="custom-modal-card">
            <div className="custom-modal-header">
              <span className="custom-modal-icon">{modalConfig.isAlert ? '⚠️' : '❓'}</span>
              <h3 className="custom-modal-title">{modalConfig.title}</h3>
            </div>
            <div className="custom-modal-body">
              <div className="custom-modal-message" style={{ whiteSpace: 'pre-wrap' }}>{modalConfig.message}</div>
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
