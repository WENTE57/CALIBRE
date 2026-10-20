import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import logoImg from './assets/logo.png';
import { LineChart, Line, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LabelList } from 'recharts';

class ReportesErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', backgroundColor: '#fef2f2', color: '#991b1b', borderRadius: '12px', margin: '2rem', border: '2px solid #f87171' }}>
          <h2 style={{ marginBottom: '1rem' }}>💥 Ocurrió un error en la interfaz</h2>
          <p style={{ fontWeight: 'bold' }}>{this.state.error?.toString()}</p>
          <pre style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#fee2e2', borderRadius: '8px', overflowX: 'auto', fontSize: '0.85rem' }}>
            {this.state.errorInfo?.componentStack}
          </pre>
          <button onClick={() => this.setState({ hasError: false })} style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Intentar de nuevo</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const parseFechaHoraChile = (fechaInput) => {
  if (!fechaInput) return { fechaStr: '—', horaStr: '—' };
  const rawStr = String(fechaInput).trim();
  const match = rawStr.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (match && !rawStr.includes('Z') && !rawStr.includes('+') && !rawStr.match(/-\d{2}:\d{2}$/)) {
    const [_, yyyy, mm, dd, hh, min] = match;
    return {
      fechaStr: `${dd}/${mm}/${yyyy}`,
      horaStr: `${hh}:${min}`
    };
  }
  const dObj = new Date(rawStr);
  if (isNaN(dObj.getTime())) {
    return { fechaStr: rawStr, horaStr: '' };
  }
  const fStr = dObj.toLocaleDateString('es-CL', { timeZone: 'America/Santiago' });
  const hStr = dObj.toLocaleTimeString('es-CL', { timeZone: 'America/Santiago', hour: '2-digit', minute: '2-digit', hour12: false });
  return { fechaStr: fStr, horaStr: hStr };
};

const formatFechaHoraChile = (fechaInput) => {
  const { fechaStr, horaStr } = parseFechaHoraChile(fechaInput);
  if (fechaStr === '—') return '—';
  return horaStr ? `${fechaStr} - ${horaStr} hrs` : fechaStr;
};

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


const isOptionEnabled = (val, defaultVal = true) => {
  if (val === undefined || val === null) return defaultVal;
  if (val === false || val === 0 || val === '0' || val === 'false' || val === 'f' || val === 'FALSE') return false;
  return true;
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
  const [visibleHistorialCount, setVisibleHistorialCount] = useState(50);
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
      setErrorDeleteModal('Por favor ingresa la contraseña de autorización.');
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
  const [configSmtpPort, setConfigSmtpPort] = useState('587');
  const [configSmtpSecure, setConfigSmtpSecure] = useState(false);
  const [configSmtpUser, setConfigSmtpUser] = useState('');
  const [configSmtpPass, setConfigSmtpPass] = useState('');
  const [configLoading, setConfigLoading] = useState(false);
  const [testEmailLoading, setTestEmailLoading] = useState(false);
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
  const [showPromptImprimirFinanciero, setShowPromptImprimirFinanciero] = useState(false);
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
  const [nuevaCatAsignarEnvase, setNuevaCatAsignarEnvase] = useState(false);
  const [promoAplicaEnvase, setPromoAplicaEnvase] = useState('no');
  const [promoCantidadEnvases, setPromoCantidadEnvases] = useState(1);
  const [promoToparPrecioIndividual, setPromoToparPrecioIndividual] = useState(false);
  const [promoMostrarNombreTicket, setPromoMostrarNombreTicket] = useState(true);
  const [promoPrecio, setPromoPrecio] = useState('');
  const [promoActivo, setPromoActivo] = useState(true);
  const [promoProductosFijos, setPromoProductosFijos] = useState([]);
  const [promoPasos, setPromoPasos] = useState([]);
  const [editandoPromoId, setEditandoPromoId] = useState(null);
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promocionesView, setPromocionesView] = useState('list'); // 'list', 'create', 'edit'
  const [selectedFixedProdId, setSelectedFixedProdId] = useState('');
  const [selectedStepProds, setSelectedStepProds] = useState({});
  const [showGenCatSection, setShowGenCatSection] = useState(false);
  const [genCatSelected, setGenCatSelected] = useState('');
  const [genCatCantidad, setGenCatCantidad] = useState(2);
  const [busquedaCategoria, setBusquedaCategoria] = useState('');
  const [busquedaProductoEnCat, setBusquedaProductoEnCat] = useState('');
  const [busquedaPromo, setBusquedaPromo] = useState('');
  const [busquedaIngrediente, setBusquedaIngrediente] = useState('');

  // Estados de Configuración adicionales
  const [localNombre, setLocalNombre] = useState('Calibre 25');
  const [localDireccion, setLocalDireccion] = useState('');
  const [localTelefono, setLocalTelefono] = useState('');
  const [localPieTicket, setLocalPieTicket] = useState('Gracias por su preferencia');
  const [umbralStockBajo, setUmbralStockBajo] = useState(50);
  const [impuestoIvaPorcentaje, setImpuestoIvaPorcentaje] = useState(19);
  const [impuestoIncluido, setImpuestoIncluido] = useState(true);

  // Lista de resoluciones de pantalla soportadas
  const RESOLUCIONES_PANTALLA = [
    { id: '1366x768', label: '💻 1366 x 768 (HD / Notebooks - Letras Grandes)', scale: 0.90, fontSize: '15.5px' },
    { id: '1366x768_compact', label: '💻 1366 x 768 (Compacto)', scale: 0.85, fontSize: '13.5px' },
    { id: '1280x720', label: '💻 1280 x 720 (720p / Pantallas Pequeñas)', scale: 0.80, fontSize: '13px' },
    { id: '1600x900', label: '🖥️ 1600 x 900 (HD+ / All-in-One)', scale: 0.92, fontSize: '14.5px' },
    { id: '1920x1080', label: '🖥️ 1920 x 1080 (Full HD / Monitores Grandes)', scale: 1.0, fontSize: '16px' },
    { id: '2560x1440', label: '🖥️ 2560 x 1440 (2K / Pantallas Gigantes)', scale: 1.25, fontSize: '18px' },
    { id: 'auto', label: '🔄 Auto (Adaptación Automática)', scale: 1.0, fontSize: '15px' }
  ];

  // Estado de Resolución de Pantalla
  const [appResolucion, setAppResolucion] = useState(() => localStorage.getItem('calibre_app_resolucion') || '1366x768');

  useEffect(() => {
    // Resetear zoom CSS del elemento raíz para evitar márgenes blancos en los bordes
    document.documentElement.style.zoom = '1';

    const match = RESOLUCIONES_PANTALLA.find(r => r.id === appResolucion) || RESOLUCIONES_PANTALLA[0];
    
    if (window.electronAPI && typeof window.electronAPI.setZoomFactor === 'function') {
      window.electronAPI.setZoomFactor(match.scale);
    }
    
    document.documentElement.style.fontSize = match.fontSize;
    localStorage.setItem('calibre_app_resolucion', appResolucion);
  }, [appResolucion]);

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
  
  // Estados para Pestaña de Reportes
  const [reporteResumen, setReporteResumen] = useState(null);
  const [reporteProductos, setReporteProductos] = useState([]);
  const [reporteVentasDiarias, setReporteVentasDiarias] = useState([]);
  const [agrupacionGrafico, setAgrupacionGrafico] = useState('');
  const [loadingReportes, setLoadingReportes] = useState(false);
  const [errorReportes, setErrorReportes] = useState('');
  const [searchProductoReporte, setSearchProductoReporte] = useState('');
  const [enviandoCorreoReporte, setEnviandoCorreoReporte] = useState(false);
  const [mensajeCorreoReporte, setMensajeCorreoReporte] = useState('');
  const [tipoMensajeCorreoReporte, setTipoMensajeCorreoReporte] = useState('success');
  
  // Estados para Sub-pestaña e Impresión de Reportes
  const [subTabReportes, setSubTabReportes] = useState('metricas'); // 'metricas' | 'impresion'
  const [fechaInicioImpresion, setFechaInicioImpresion] = useState(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });
  const [fechaFinImpresion, setFechaFinImpresion] = useState(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });
  const [filtroTurnoImpresion, setFiltroTurnoImpresion] = useState('all');
  const [cierreDataImpresion, setCierreDataImpresion] = useState(null);
  const [loadingCierreImpresion, setLoadingCierreImpresion] = useState(false);
  const [imprimiendoTipo, setImprimiendoTipo] = useState(null);
  const [mensajeImpresion, setMensajeImpresion] = useState('');
  
  // Estados para Cuadrado de Caja (Arqueo)
  const [fondoApertura, setFondoApertura] = useState(50000);
  const [efectivoReal, setEfectivoReal] = useState('');
  const [observacionesCierre, setObservacionesCierre] = useState('');
  const [cierreRegistradoData, setCierreRegistradoData] = useState(null);
  const [modoEdicionCierre, setModoEdicionCierre] = useState(false);
  const [guardandoCierre, setGuardandoCierre] = useState(false);

  // Estados para Gastos en Efectivo
  const [nuevoGastoDesc, setNuevoGastoDesc] = useState('');
  const [nuevoGastoMonto, setNuevoGastoMonto] = useState('');
  const [guardandoGasto, setGuardandoGasto] = useState(false);

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

  // Manejador global de la tecla Enter para aceptar/confirmar alertas y modales en todo el programa
  useEffect(() => {
    const handleGlobalEnterKey = (e) => {
      if (e.key !== 'Enter') return;

      // No interceptar si el usuario está escribiendo en un textarea multilínea (a menos que use Ctrl+Enter)
      if (e.target && e.target.tagName === 'TEXTAREA' && !e.ctrlKey) return;

      // 1. Si hay una alerta o confirmación activa (abrirAlerta / abrirConfirmacion)
      if (modalConfig.isOpen) {
        e.preventDefault();
        e.stopPropagation();
        if (typeof modalConfig.onConfirm === 'function') {
          modalConfig.onConfirm();
        } else {
          cerrarModal();
        }
        return;
      }

      // 2. Si hay modales superpuestos en pantalla (.custom-modal-overlay)
      const overlays = document.querySelectorAll('.custom-modal-overlay');
      if (overlays.length > 0) {
        // Tomar el overlay superior (último en el DOM)
        const topOverlay = overlays[overlays.length - 1];

        // Buscar botón de aceptar o confirmar principal
        const actionBtn = topOverlay.querySelector(
          '.custom-modal-btn-confirm, button[type="submit"]:not(:disabled), .btn-primary:not(:disabled), .comanda-btn-close'
        );

        if (actionBtn && e.target !== actionBtn) {
          e.preventDefault();
          e.stopPropagation();
          actionBtn.click();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleGlobalEnterKey, true);
    return () => window.removeEventListener('keydown', handleGlobalEnterKey, true);
  }, [modalConfig]);

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
        mostrar_nombre_ticket: isOptionEnabled(promo.mostrar_nombre_ticket, true),
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
    const unitPrice = parseFloat(precioEnvaseOverride !== null ? precioEnvaseOverride : precioEnvase) || 0;
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
          const cobraCat = catObj ? (catObj.cobra_envase === true || catObj.cobra_envase === 1 || catObj.cobra_envase === 'true') : true;
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

  const getOpcionExtraValue = (opc) => {
    let extraVal = parseFloat(opc?.precio_adicional) || 0;
    const nombreLower = (opc?.nombre_producto || '').toLowerCase();
    if (extraVal === 0 || extraVal === 150 || extraVal === 300) {
      if (nombreLower.includes('romano')) {
        return 600;
      } else if (nombreLower.includes('chacarero')) {
        return 300;
      }
    }
    return extraVal;
  };

  const seleccionarOpcionPaso = (opcion) => {
    const paso = selectedPromo.pasos[currentPromoStepIndex];
    
    const extraVal = getOpcionExtraValue(opcion);

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
      // Jerarquía por categoría / Dominancia del mayor recargo en la promoción:
      // Si la promoción incluye al menos una opción con recargo positivo (ej. Romano +600 o Chacarero +300),
      // la promoción adopta el recargo de la opción más alta elegida (Math.max de los extras positivos):
      // - 1 Romano (+600) + 1 Barato (-200) o Estándar (0) o Chacarero (+300) -> Extra = +600 -> Total = $7.500
      // - 2 Romanos (+600 y +600) -> Extra = +600 -> Total = $7.500
      // - 1 Chacarero (+300) + 1 Barato (-200) o Estándar (0) -> Extra = +300 -> Total = $7.200
      // - 2 Chacareros (+300 y +300) -> Extra = +300 -> Total = $7.200
      // - 2 Estándar (0 y 0) -> Extra = 0 -> Total = $6.900
      // - 2 Económicos (-200 y -200) -> Extra = -400 -> Total = $6.500
      const extrasPositivos = nuevasOpciones
        .map(opt => parseFloat(opt.precio_adicional) || 0)
        .filter(val => val > 0);

      let totalExtra = 0;
      if (extrasPositivos.length > 0) {
        totalExtra = Math.max(...extrasPositivos);
      } else {
        // Si NO hay opciones con recargo positivo: verificar si TODAS las opciones son económicas (-200 cada una)
        const todasSonMenores = nuevasOpciones.length > 0 && nuevasOpciones.every(opt => (parseFloat(opt.precio_adicional) || 0) < 0);
        if (todasSonMenores) {
          totalExtra = nuevasOpciones.reduce((sum, opt) => sum + (parseFloat(opt.precio_adicional) || 0), 0);
        } else {
          totalExtra = 0;
        }
      }

      const precioPromoCalculado = Math.max(0, parseFloat(selectedPromo.precio) + totalExtra);

      let finalPrice = precioPromoCalculado;

      // Evaluar si la opción "Proteger precio" está activada para ESTA promoción específica
      const estaProteccionEncendida = selectedPromo.topar_precio_individual === true || selectedPromo.topar_precio_individual === 1 || selectedPromo.topar_precio_individual === 'true';

      if (estaProteccionEncendida) {
        const precioNormalFijos = (selectedPromo.productos_fijos || []).reduce((acc, f) => {
          const prod = productos.find(p => String(p.id) === String(f.producto_id) || p.nombre === f.nombre);
          return acc + ((prod ? parseFloat(prod.precio) : 0) * (parseInt(f.cantidad) || 1));
        }, 0);

        const precioNormalOpciones = nuevasOpciones.reduce((acc, opt) => {
          const prod = productos.find(p => String(p.id) === String(opt.producto_id) || p.nombre === opt.nombre_producto);
          return acc + (prod ? parseFloat(prod.precio) : 0);
        }, 0);

        const precioSumIndividual = precioNormalFijos + precioNormalOpciones;

        if (precioSumIndividual > 0 && precioSumIndividual < precioPromoCalculado) {
          finalPrice = precioSumIndividual;
        }
      }
      
      const itemPromo = {
        id: `promo-${selectedPromo.id}-${Date.now()}`,
        promocion_id: selectedPromo.id,
        nombre: selectedPromo.nombre,
        precio: finalPrice,
        cantidad: 1,
        imagen: selectedPromo.emoji || '🎁',
        mostrar_nombre_ticket: isOptionEnabled(selectedPromo.mostrar_nombre_ticket, true),
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

  const recalcularExtrasPaso = (paso) => {
    if (paso.autocalcular === false) return paso;
    
    const precios = paso.opciones.map(o => {
      const prod = productos.find(p => String(p.id) === String(o.producto_id));
      return prod ? parseFloat(prod.precio) || 0 : (parseFloat(o.precio_producto) || 0);
    }).filter(p => p > 0);

    if (precios.length === 0) {
      return {
        ...paso,
        opciones: paso.opciones.map(o => ({ ...o, precio_adicional: 0.00 }))
      };
    }

    const frecs = {};
    let maxFrec = 0;
    let precioModa = precios[0];
    precios.forEach(p => {
      frecs[p] = (frecs[p] || 0) + 1;
      if (frecs[p] > maxFrec) {
        maxFrec = frecs[p];
        precioModa = p;
      }
    });

    const nuevasOpciones = paso.opciones.map(o => {
      const prod = productos.find(p => String(p.id) === String(o.producto_id));
      const pPrecio = prod ? parseFloat(prod.precio) || 0 : (parseFloat(o.precio_producto) || 0);
      let extra = pPrecio - precioModa;
      const nom = (o.nombre_producto || prod?.nombre || '').toLowerCase();
      if (nom.includes('romano')) {
        extra = 600;
      } else if (nom.includes('chacarero')) {
        extra = 300;
      }
      return {
        ...o,
        precio_adicional: extra
      };
    });

    return {
      ...paso,
      opciones: nuevasOpciones
    };
  };

  const generarPasosDesdeCategoria = () => {
    if (!genCatSelected) {
      abrirAlerta('Por favor selecciona una categoría.', 'Error');
      return;
    }
    const prodsCat = productos.filter(p => p.categoria === genCatSelected);
    if (prodsCat.length === 0) {
      abrirAlerta(`La categoría "${genCatSelected}" no contiene productos registrados.`, 'Categoría Vacía');
      return;
    }

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

    const cant = parseInt(genCatCantidad) || 2;
    const nuevosPasos = [];

    for (let i = 1; i <= cant; i++) {
      const opciones = prodsCat.map(p => {
        const pPrecio = parseFloat(p.precio) || 0;
        const extra = pPrecio - precioModa;
        return {
          producto_id: p.id,
          nombre_producto: p.nombre,
          precio_producto: p.precio,
          precio_adicional: extra
        };
      });

      nuevosPasos.push({
        temp_id: Date.now().toString() + '-' + Math.random().toString().substring(2) + '-' + i,
        nombre_paso: `Elige ${genCatSelected} #${i}`,
        obligatorio: true,
        autocalcular: true,
        opciones: opciones
      });
    }

    // Reemplazar pasos existentes de la misma categoría para evitar duplicaciones
    const catLower = genCatSelected.toLowerCase().trim();
    const pasosFiltrados = promoPasos.filter(p => {
      const nombreLower = (p.nombre_paso || '').toLowerCase().trim();
      return !nombreLower.includes(catLower);
    });

    setPromoPasos([...pasosFiltrados, ...nuevosPasos]);
    setShowGenCatSection(false);
    setGenCatSelected('');
    setGenCatCantidad(2);
  };

  const agregarPasoPromoForm = () => {
    setPromoPasos([
      ...promoPasos,
      {
        temp_id: Date.now().toString() + '-' + Math.random().toString().substring(2),
        nombre_paso: '',
        obligatorio: true,
        autocalcular: true,
        opciones: []
      }
    ]);
  };

  const isStepMatch = (p, targetId, isRealId) => {
    if (isRealId && p.id != null) {
      return String(p.id) === String(targetId);
    }
    if (p.temp_id != null) {
      return String(p.temp_id) === String(targetId);
    }
    return String(p.id) === String(targetId);
  };

  const eliminarPasoPromoForm = (tempIdOrRealId, isRealId) => {
    setPromoPasos(promoPasos.filter(p => String(p.id) !== String(tempIdOrRealId) && String(p.temp_id) !== String(tempIdOrRealId)));
  };

  const actualizarNombrePasoForm = (tempIdOrRealId, isRealId, val) => {
    setPromoPasos(promoPasos.map(p => {
      const match = isStepMatch(p, tempIdOrRealId, isRealId);
      return match ? { ...p, nombre_paso: val } : p;
    }));
  };

  const actualizarObligatorioPasoForm = (tempIdOrRealId, isRealId, val) => {
    setPromoPasos(promoPasos.map(p => {
      const match = isStepMatch(p, tempIdOrRealId, isRealId);
      return match ? { ...p, obligatorio: val } : p;
    }));
  };

  const toggleAutocalcularPasoForm = (pasoTempIdOrRealId, isRealId, val) => {
    setPromoPasos(promoPasos.map(p => {
      const match = isStepMatch(p, pasoTempIdOrRealId, isRealId);
      if (!match) return p;

      let stepMod = { ...p, autocalcular: val };
      if (val) {
        stepMod = recalcularExtrasPaso(stepMod);
      }
      return stepMod;
    }));
  };

  const aplicarBaseManualPasoForm = (pasoTempIdOrRealId, isRealId, baseVal) => {
    const basePrice = parseFloat(baseVal) || 0;
    setPromoPasos(promoPasos.map(p => {
      const match = isStepMatch(p, pasoTempIdOrRealId, isRealId);
      if (!match) return p;

      const nuevasOpciones = p.opciones.map(o => {
        const pPrecio = parseFloat(o.precio_producto) || 0;
        const extra = pPrecio - basePrice;
        return { ...o, precio_adicional: extra };
      });

      return { ...p, autocalcular: false, precio_base_manual: baseVal, opciones: nuevasOpciones };
    }));
  };

  const fijarSinExtraOpcionForm = (pasoTempIdOrRealId, isRealId, productoId) => {
    setPromoPasos(promoPasos.map(p => {
      const match = isStepMatch(p, pasoTempIdOrRealId, isRealId);
      if (!match) return p;

      const nuevasOpciones = p.opciones.map(o => {
        if (String(o.producto_id) === String(productoId)) {
          return { ...o, precio_adicional: 0 };
        }
        return o;
      });

      return { ...p, opciones: nuevasOpciones };
    }));
  };

  const importarCategoriaAlPasoForm = (pasoTempIdOrRealId, isRealId, categoriaNombre) => {
    if (!categoriaNombre) return;
    const prodsCat = productos.filter(p => p.categoria === categoriaNombre);
    if (prodsCat.length === 0) {
      abrirAlerta(`La categoría "${categoriaNombre}" no contiene productos registrados.`, 'Categoría Vacía');
      return;
    }

    setPromoPasos(promoPasos.map(p => {
      const match = isStepMatch(p, pasoTempIdOrRealId, isRealId);
      if (!match) return p;

      const nuevasOpciones = [...p.opciones];
      prodsCat.forEach(prod => {
        if (!nuevasOpciones.some(o => String(o.producto_id) === String(prod.id))) {
          nuevasOpciones.push({
            producto_id: prod.id,
            nombre_producto: prod.nombre,
            precio_producto: prod.precio,
            precio_adicional: 0.00
          });
        }
      });

      let stepConOpc = { ...p, opciones: nuevasOpciones };
      if (stepConOpc.autocalcular !== false) {
        stepConOpc = recalcularExtrasPaso(stepConOpc);
      }

      return stepConOpc;
    }));
  };

  const agregarOpcionAlPasoForm = (pasoTempIdOrRealId, isRealId, productoId, precioAdicional) => {
    const prod = productos.find(p => String(p.id) === String(productoId));
    if (!prod) return;

    setPromoPasos(promoPasos.map(p => {
      const match = isStepMatch(p, pasoTempIdOrRealId, isRealId);
      if (!match) return p;

      if (p.opciones.some(o => String(o.producto_id) === String(prod.id))) {
        abrirAlerta('Este producto ya está agregado en este paso.', 'Opción Duplicada');
        return p;
      }

      const nuevasOpciones = [
        ...p.opciones,
        {
          producto_id: prod.id,
          nombre_producto: prod.nombre,
          precio_producto: prod.precio,
          precio_adicional: p.autocalcular !== false ? 0 : (parseInt(precioAdicional.toString().replace(/\D/g, ''), 10) || 0)
        }
      ];

      let stepConOpc = { ...p, opciones: nuevasOpciones };
      if (stepConOpc.autocalcular !== false) {
        stepConOpc = recalcularExtrasPaso(stepConOpc);
      }

      return stepConOpc;
    }));
  };

  const eliminarOpcionDelPasoForm = (pasoTempIdOrRealId, isRealId, productoId) => {
    setPromoPasos(promoPasos.map(p => {
      const match = isStepMatch(p, pasoTempIdOrRealId, isRealId);
      if (!match) return p;

      const nuevasOpciones = p.opciones.filter(o => String(o.producto_id) !== String(productoId));
      let stepConOpc = { ...p, opciones: nuevasOpciones };
      if (stepConOpc.autocalcular !== false) {
        stepConOpc = recalcularExtrasPaso(stepConOpc);
      }

      return stepConOpc;
    }));
  };

  const actualizarPrecioAdicionalOpcionForm = (pasoTempIdOrRealId, isRealId, productoId, val) => {
    setPromoPasos(promoPasos.map(p => {
      const match = isStepMatch(p, pasoTempIdOrRealId, isRealId);
      if (!match) return p;

      const nuevasOpciones = p.opciones.map(o => {
        if (String(o.producto_id) === String(productoId)) {
          const cleanVal = val.toString().replace(/[^\d-]/g, '');
          const parsed = parseInt(cleanVal, 10);
          return { ...o, precio_adicional: isNaN(parsed) ? 0 : parsed };
        }
        return o;
      });

      return { ...p, opciones: nuevasOpciones };
    }));
  };

  const agregarProductoFijoPromoForm = (productoId, cantidad) => {
    const prod = productos.find(p => p.id === parseInt(productoId));
    if (!prod) return;
    const cant = parseInt(cantidad) || 1;

    const existe = promoProductosFijos.find(pf => String(pf.producto_id) === String(prod.id));
    if (existe) {
      setPromoProductosFijos(promoProductosFijos.map(pf =>
        String(pf.producto_id) === String(prod.id) ? { ...pf, cantidad: pf.cantidad + cant } : pf
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
    setPromoProductosFijos(promoProductosFijos.filter(pf => String(pf.producto_id) !== String(productoId)));
  };

  const handleSavePromo = async (e) => {
    e.preventDefault();
    if (promoLoading) return;
    if (!promoNombre.trim() || !promoPrecio.toString().trim()) {
      setPromoError('Completa todos los campos obligatorios (nombre y precio).');
      setPromoSuccess('');
      return;
    }

    // Deduplicar productos fijos sumando cantidades
    const fijosMap = new Map();
    for (const pf of promoProductosFijos) {
      if (pf && pf.producto_id) {
        const pid = String(pf.producto_id);
        const cant = parseInt(pf.cantidad, 10) || 1;
        if (fijosMap.has(pid)) {
          const item = fijosMap.get(pid);
          item.cantidad += cant;
        } else {
          fijosMap.set(pid, { ...pf, producto_id: parseInt(pid, 10), cantidad: cant });
        }
      }
    }
    let finalFijos = Array.from(fijosMap.values());

    // Deduplicar pasos por clave compuesta (nombre de paso + lista de productos de sus opciones)
    const pasosMap = new Map();
    for (const paso of promoPasos) {
      const opcIds = (paso.opciones || [])
        .map(o => String(o.producto_id || ''))
        .filter(Boolean)
        .sort()
        .join(',');
      const key = `${(paso.nombre_paso || '').trim().toLowerCase()}_[${opcIds}]`;
      if (!pasosMap.has(key)) {
        pasosMap.set(key, paso);
      }
    }
    const pasosUnicos = Array.from(pasosMap.values());

    // Deduplicar opciones dentro de cada paso
    let finalPasos = pasosUnicos.map(paso => {
      const opcMap = new Map();
      if (paso.opciones && Array.isArray(paso.opciones)) {
        for (const opc of paso.opciones) {
          if (opc && opc.producto_id) {
            const pid = String(opc.producto_id);
            if (!opcMap.has(pid)) {
              opcMap.set(pid, { ...opc, producto_id: parseInt(pid, 10) });
            }
          }
        }
      }
      return {
        ...paso,
        opciones: Array.from(opcMap.values())
      };
    });

    if (finalPasos.length === 0 && finalFijos.length === 0) {
      setPromoError('Una promoción debe incluir al menos un producto fijo o un paso de selección.');
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
          precio: parseInt(promoPrecio.toString().replace(/\D/g, ''), 10) || 0,
          activo: promoActivo,
          productos_fijos: finalFijos,
          pasos: finalPasos,
          emoji: promoEmoji,
          aplica_envase: promoAplicaEnvase,
          cantidad_envases: promoCantidadEnvases,
          topar_precio_individual: promoToparPrecioIndividual,
          mostrar_nombre_ticket: promoMostrarNombreTicket
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
        setPromoToparPrecioIndividual(false);
        setPromoMostrarNombreTicket(true);
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

  const iniciarNuevaPromo = () => {
    setEditandoPromoId(null);
    setPromoNombre('');
    setPromoPrecio('');
    setPromoEmoji('🎁');
    setPromoActivo(true);
    setPromoAplicaEnvase('no');
    setPromoCantidadEnvases(1);
    setPromoToparPrecioIndividual(false);
    setPromoMostrarNombreTicket(true);
    setPromoProductosFijos([]);
    setPromoPasos([]);
    setSelectedFixedProdId('');
    setSelectedStepProds({});
    setGenCatSelected('');
    setGenCatCantidad(2);
    setPromoError('');
    setPromoSuccess('');
    setPromocionesView('create');
  };

  const iniciarEdicionPromo = (promo) => {
    setEditandoPromoId(promo.id);
    setPromoNombre(promo.nombre);
    setPromoPrecio(promo.precio);
    setPromoEmoji(promo.emoji || '🎁');
    setPromoActivo(promo.activo !== false);
    setPromoAplicaEnvase(promo.aplica_envase || 'no');
    setPromoCantidadEnvases(promo.cantidad_envases || 1);
    setPromoToparPrecioIndividual(promo.topar_precio_individual === true || promo.topar_precio_individual === 1 || promo.topar_precio_individual === 'true');
    setPromoMostrarNombreTicket(isOptionEnabled(promo.mostrar_nombre_ticket, true));
    setPromoProductosFijos(promo.productos_fijos || []);
    setPromoPasos((promo.pasos || []).map((paso, idx) => ({
      ...paso,
      autocalcular: paso.autocalcular === true || paso.autocalcular === 1 || paso.autocalcular === 'true',
      temp_id: String(paso.id || paso.temp_id || `paso-${idx}-${Date.now()}`)
    })));

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
            abrirAlerta(`Se continuará trabajando en el Turno #${data.turno.id} activo, iniciado por ${data.turno.usuario_inicio} el ${formatFechaHoraChile(data.turno.fecha_hora_inicio)}.`, 'Turno Activo Detectado');
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
        setActiveTab('pedidos');
        abrirAlerta('Se ha iniciado un nuevo turno correctamente. La pestaña de pedidos ha sido habilitada.', 'Turno Iniciado');
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

  const imprimirReporteFinancieroModal = async (finalCashVal, obsVal) => {
    if (!activeShift) return;
    if (!window.electronAPI) {
      abrirAlerta('La función de impresión de tickets solo está disponible en la aplicación de escritorio.', 'Aviso');
      return;
    }

    let salesInfo = activeShiftSalesInfo;
    if (!salesInfo) {
      try {
        const today = new Date().toISOString().split('T')[0];
        const resp = await fetch(`http://127.0.0.1:5000/api/informes/cierre?fecha=${today}&turno_id=${activeShift.id}`);
        const json = await resp.json();
        if (resp.ok && json.success) {
          salesInfo = json.data;
          setActiveShiftSalesInfo(salesInfo);
        }
      } catch (e) {
        console.error("Error al obtener ventas del turno para imprimir:", e);
      }
    }

    const declaredCash = (finalCashVal !== undefined && finalCashVal !== '' && !isNaN(parseFloat(finalCashVal)))
      ? parseFloat(finalCashVal)
      : (efectivoFinalInput !== '' && !isNaN(parseFloat(efectivoFinalInput)))
        ? parseFloat(efectivoFinalInput)
        : null;

    const totalEfectivo = salesInfo?.total_efectivo || 0;
    const totalGastos = salesInfo?.total_gastos || 0;
    const expectedCash = (activeShift.efectivo_inicial || 0) + totalEfectivo - totalGastos;
    const hasArqueo = declaredCash !== null;
    const diff = hasArqueo ? declaredCash - expectedCash : 0;

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    window.electronAPI.printReport({
      tipo_reporte: 'financiero',
      fecha: todayStr,
      turno_nombre: `Turno #${activeShift.id}`,
      total_ventas: salesInfo?.total_ventas || 0,
      total_efectivo: totalEfectivo,
      total_debito: salesInfo?.total_debito || 0,
      total_credito: salesInfo?.total_credito || 0,
      total_tarjeta: salesInfo?.total_tarjeta || 0,
      total_gastos: totalGastos,
      gastos: salesInfo?.gastos || [],
      productos_vendidos: salesInfo?.productos_vendidos || [],
      envases_vendidos: salesInfo?.envases_vendidos || { cantidad: 0, total_pesos: 0 },
      productos_promociones: salesInfo?.productos_promociones || [],
      comandas_eliminadas: salesInfo?.comandas_eliminadas || [],
      monto_total_eliminado: salesInfo?.monto_total_eliminado || 0,
      has_arqueo: hasArqueo,
      cargado_por: user?.nombre || activeShift.usuario_inicio || 'Cajero',
      fondo_apertura: parseFloat(activeShift.efectivo_inicial || 0),
      efectivo_real: declaredCash !== null ? declaredCash : 0,
      diferencia: diff,
      observaciones: obsVal !== undefined ? obsVal : (observacionesCerrarShiftInput || '')
    });
  };

  const imprimirReporteInventarioModal = async () => {
    if (!activeShift || !activeShiftSalesInfo) {
      abrirAlerta('Los datos del turno aún se están calculando. Por favor espera un momento.', 'Cargando Datos');
      return;
    }
    if (!window.electronAPI) {
      abrirAlerta('La función de impresión de tickets solo está disponible en la aplicación de escritorio.', 'Aviso');
      return;
    }

    let stockActual = listaIngredientes;
    if (!stockActual || stockActual.length === 0) {
      try {
        const resp = await fetch('http://127.0.0.1:5000/api/ingredientes');
        const dataIng = await resp.json();
        if (resp.ok && dataIng.success && dataIng.ingredientes) {
          stockActual = dataIng.ingredientes;
          setListaIngredientes(dataIng.ingredientes);
        }
      } catch (e) {
        console.error('Error al obtener inventario actual:', e);
      }
    }

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    window.electronAPI.printReport({
      tipo_reporte: 'inventario',
      fecha: todayStr,
      turno_nombre: `Turno #${activeShift.id}`,
      ingredientes_gastados: activeShiftSalesInfo.ingredientes_gastados || [],
      entradas_inventario: activeShiftSalesInfo.entradas_inventario || [],
      mermas_inventario: activeShiftSalesInfo.mermas_inventario || [],
      inventario_actual: stockActual || []
    });
  };

  const imprimirReporteProductosModal = () => {
    if (!activeShift || !activeShiftSalesInfo) {
      abrirAlerta('Los datos del turno aún se están calculando. Por favor espera un momento.', 'Cargando Datos');
      return;
    }
    if (!window.electronAPI) {
      abrirAlerta('La función de impresión de tickets solo está disponible en la aplicación de escritorio.', 'Aviso');
      return;
    }

    const unificadosConCategoria = (activeShiftSalesInfo.productos_unificados || []).map(item => {
      const prod = productos.find(p => p.nombre.toLowerCase().trim() === item.nombre_producto.toLowerCase().trim());
      const catName = item.categoria || prod?.categoria || (item.nombre_producto === 'Envases para llevar' ? 'Envases' : 'Otros');
      const catObj = listaCategorias.find(c => c.nombre.toLowerCase().trim() === catName.toLowerCase().trim());
      return {
        ...item,
        categoria: catName,
        categoria_emoji: item.categoria_emoji || catObj?.emoji || '🏷️',
        categoria_orden: item.categoria_orden !== undefined ? item.categoria_orden : (catObj?.orden !== undefined ? catObj.orden : 999)
      };
    });

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    window.electronAPI.printReport({
      fecha: todayStr,
      tipo_reporte: 'consolidado',
      productos_unificados: unificadosConCategoria,
      categorias_orden: listaCategorias.map(c => c.nombre)
    });
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
        
        // Cargar nuevos campos
        setLocalNombre(config.LOCAL_NOMBRE || 'Calibre 25');
        setLocalDireccion(config.LOCAL_DIRECCION || '');
        setLocalTelefono(config.LOCAL_TELEFONO || '');
        setLocalPieTicket(config.LOCAL_PIE_TICKET || 'Gracias por su preferencia');
        setUmbralStockBajo(parseInt(config.UMBRAL_STOCK_BAJO, 10) || 50);
        setImpuestoIvaPorcentaje(parseFloat(config.IMPUESTO_IVA_PORCENTAJE) || 19);
        setImpuestoIncluido(config.IMPUESTO_INCLUIDO !== 'false');
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
        precio_envase: String(parseInt(precioEnvase, 10) || 0),
        REPORT_EMAIL_TO: configEmailTo,
        REPORT_EMAIL_FROM: configSmtpUser,
        SMTP_HOST: configSmtpHost,
        SMTP_PORT: String(configSmtpPort),
        SMTP_SECURE: configSmtpSecure ? 'true' : 'false',
        SMTP_USER: configSmtpUser,
        SMTP_PASS: configSmtpPass,
        LOCAL_NOMBRE: localNombre,
        LOCAL_DIRECCION: localDireccion,
        LOCAL_TELEFONO: localTelefono,
        LOCAL_PIE_TICKET: localPieTicket,
        UMBRAL_STOCK_BAJO: String(umbralStockBajo),
        IMPUESTO_IVA_PORCENTAJE: String(impuestoIvaPorcentaje),
        IMPUESTO_INCLUIDO: String(impuestoIncluido)
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
        await cargarConfiguracion();
        await cargarProductos();
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
          cobra_envase: nuevaCatCobraEnvase,
          asignar_envase: nuevaCatAsignarEnvase
        }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setCatSuccess(data.message);
        setNuevaCategoriaNombre('');
        setNuevaCategoriaEmoji('🏷️');
        setNuevaCatCobraEnvase(true);
        setNuevaCatAsignarEnvase(false);
        await cargarCategorias();
        await cargarProductos();
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
    setNuevaCatCobraEnvase(cat.cobra_envase === true || cat.cobra_envase === 1 || cat.cobra_envase === 'true');
    const envaseProd = productos.find(p => p.id === 108 || p.nombre?.toLowerCase().includes('envase para llevar'));
    setNuevaCatAsignarEnvase(Boolean(envaseProd && envaseProd.categoria?.toLowerCase() === cat.nombre?.toLowerCase()));
    setCatError('');
    setCatSuccess('');
  };

  const cancelarEdicionCat = () => {
    setEditandoCatId(null);
    setNuevaCategoriaNombre('');
    setNuevaCategoriaEmoji('🏷️');
    setNuevaCatCobraEnvase(true);
    setNuevaCatAsignarEnvase(false);
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
          cobra_envase: nuevaCatCobraEnvase,
          asignar_envase: nuevaCatAsignarEnvase
        }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setCatSuccess(data.message);
        setNuevaCategoriaNombre('');
        setNuevaCategoriaEmoji('🏷️');
        setNuevaCatCobraEnvase(true);
        setNuevaCatAsignarEnvase(false);
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

  const toggleEnvaseEnCategoria = async (catNombre, asignar) => {
    try {
      setProdError('');
      setProdSuccess('');
      const response = await fetch('http://127.0.0.1:5000/api/productos/asignar-envase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoria: catNombre, asignar })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setProdSuccess(data.message);
        await cargarProductos();
        setTimeout(() => setProdSuccess(''), 3500);
      } else {
        setProdError(data.message || 'Error al actualizar asignación de envase.');
      }
    } catch (err) {
      console.error(err);
      setProdError('Error de red al conectar con el servidor.');
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
          precio: parseInt(prodPrecio.toString().replace(/\D/g, ''), 10) || 0,
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

  const getIngredientIndexInfo = () => {
    if (!editandoIngId || listaIngredientes.length <= 1) return { isFirst: true, isLast: true };

    const list = listaIngredientes.filter(ing => ing.nombre.toLowerCase().includes(busquedaIngrediente.toLowerCase()));
    if (list.length <= 1) return { isFirst: true, isLast: true };

    const currentIndex = list.findIndex(ing => ing.id === editandoIngId);
    if (currentIndex === -1) return { isFirst: true, isLast: true };

    return {
      isFirst: currentIndex === 0,
      isLast: currentIndex === list.length - 1
    };
  };

  const navegarEdicionIng = (direccion) => {
    if (!editandoIngId || listaIngredientes.length <= 1) return;

    const list = listaIngredientes.filter(ing => ing.nombre.toLowerCase().includes(busquedaIngrediente.toLowerCase()));
    if (list.length <= 1) return;

    const currentIndex = list.findIndex(ing => ing.id === editandoIngId);
    if (currentIndex === -1) return;

    let targetIndex;
    if (direccion === 'siguiente') {
      if (currentIndex === list.length - 1) return;
      targetIndex = currentIndex + 1;
    } else {
      if (currentIndex === 0) return;
      targetIndex = currentIndex - 1;
    }

    const targetIngredient = list[targetIndex];
    iniciarEdicionIng(targetIngredient);
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
    if (user) {
      if (activeTab === 'ventas' || activeTab === 'cierre' || activeTab === 'configuraciones' || activeTab === 'reportes') {
        cargarConfiguracion();
      }
      if (activeTab === 'productos' || activeTab === 'categorias' || activeTab === 'inventario' || activeTab === 'cierre' || activeTab === 'promociones' || activeTab === 'configuraciones' || activeTab === 'reportes' || activeTab === 'ventas') {
        cargarIngredientes();
        cargarCategorias();
        cargarProductos();
        cargarPromociones();
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

  const cargarCuadradoCaja = async (dateStr, efectivoSugerido, shiftFilterStr) => {
    const targetDate = dateStr || fechaCierre;
    const targetShift = shiftFilterStr !== undefined ? shiftFilterStr : filtroTurnoCierre;
    const isShift = (targetShift && targetShift !== 'all' && targetShift !== 'todos' && targetShift !== 'undefined');
    if (!targetDate) return;

    if (isShift) {
      const foundShift = listaTurnos.find(t => String(t.id) === String(targetShift));
      if (foundShift) {
        if (!foundShift.activo) {
          setCierreRegistradoData({
            fondo_apertura: foundShift.efectivo_inicial,
            efectivo_real: foundShift.efectivo_final,
            diferencia: foundShift.diferencia,
            observaciones: foundShift.observaciones || '',
            cargado_por: foundShift.usuario_fin || foundShift.usuario_inicio
          });
          setFondoApertura(foundShift.efectivo_inicial);
          setEfectivoReal(foundShift.efectivo_final !== undefined && foundShift.efectivo_final !== null ? foundShift.efectivo_final.toString() : '');
          setObservacionesCierre(foundShift.observaciones || '');
        } else {
          setCierreRegistradoData(null);
          setFondoApertura(foundShift.efectivo_inicial);
          setEfectivoReal('');
          setObservacionesCierre('');
        }
        setModoEdicionCierre(false);
        return;
      }
    }

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
          setFondoApertura(efectivoSugerido !== undefined ? efectivoSugerido : (activeShift?.efectivo_inicial || 50000));
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
        await cargarCuadradoCaja(targetDate, data.data.efectivo_inicial_sugerido, targetShift);
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

  const handleAgregarGasto = async (e) => {
    e.preventDefault();
    if (!nuevoGastoDesc.trim() || !nuevoGastoMonto || parseFloat(nuevoGastoMonto) <= 0) {
      abrirAlerta('Por favor ingresa una descripción válida y un monto mayor a 0.', 'Datos Incompletos');
      return;
    }

    setGuardandoGasto(true);
    try {
      const targetShift = (filtroTurnoCierre && filtroTurnoCierre !== 'all' && filtroTurnoCierre !== 'todos' && filtroTurnoCierre !== 'undefined') ? filtroTurnoCierre : (activeShift?.id || null);
      const response = await fetch('http://127.0.0.1:5000/api/gastos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          descripcion: nuevoGastoDesc.trim(),
          monto: parseFloat(nuevoGastoMonto),
          registrado_por: user?.nombre || 'Cajero',
          turno_id: targetShift,
          fecha: fechaCierre
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setNuevoGastoDesc('');
        setNuevoGastoMonto('');
        abrirAlerta('Gasto en efectivo registrado correctamente.', 'Éxito');
        cargarCierreCaja(fechaCierre, filtroTurnoCierre);
      } else {
        abrirAlerta(data.message || 'Error al registrar el gasto.', 'Error');
      }
    } catch (err) {
      console.error(err);
      abrirAlerta('Error de conexión al guardar el gasto.', 'Error de Conexión');
    } finally {
      setGuardandoGasto(false);
    }
  };

  const handleEliminarGasto = (gastoId, gastoDesc) => {
    abrirConfirmacion(
      `¿Estás seguro de eliminar el gasto "${gastoDesc}"?`,
      'Eliminar Gasto',
      async () => {
        try {
          const response = await fetch(`http://127.0.0.1:5000/api/gastos/${gastoId}`, {
            method: 'DELETE'
          });
          const data = await response.json();
          if (response.ok && data.success) {
            abrirAlerta('El gasto ha sido eliminado.', 'Éxito');
            cargarCierreCaja(fechaCierre, filtroTurnoCierre);
          } else {
            abrirAlerta(data.message || 'Error al eliminar el gasto.', 'Error');
          }
        } catch (err) {
          console.error(err);
          abrirAlerta('Error de conexión al eliminar el gasto.', 'Error de Conexión');
        }
      }
    );
  };

  const descargarExcelMensual = async () => {
    if (!mesExcel) return;
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/informes/excel?mes=${mesExcel}`);
      if (!response.ok) throw new Error('Error al descargar');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Reporte_Calibre_${mesExcel}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Error al descargar excel mensual:', e);
    }
  };

  const descargarReporteProductosRango = async () => {
    if (!fechaInicioReporte || !fechaFinReporte) return;
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/informes/rango-productos/excel?fecha_inicio=${fechaInicioReporte}&fecha_fin=${fechaFinReporte}`);
      if (!response.ok) throw new Error('Error al descargar');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Reporte_Productos_${fechaInicioReporte}_al_${fechaFinReporte}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Error al descargar reporte de productos:', e);
    }
  };


  const aplicarPresetFecha = (preset) => {
    const now = new Date();
    const formatDate = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    if (preset === 'hoy') {
      setFechaInicioReporte(formatDate(now));
      setFechaFinReporte(formatDate(now));
    } else if (preset === 'ayer') {
      const d = new Date(now);
      d.setDate(d.getDate() - 1);
      setFechaInicioReporte(formatDate(d));
      setFechaFinReporte(formatDate(d));
    } else if (preset === '7dias') {
      const d = new Date(now);
      d.setDate(d.getDate() - 6);
      setFechaInicioReporte(formatDate(d));
      setFechaFinReporte(formatDate(now));
    } else if (preset === 'esteMes') {
      const d = new Date(now.getFullYear(), now.getMonth(), 1);
      setFechaInicioReporte(formatDate(d));
      setFechaFinReporte(formatDate(now));
    } else if (preset === 'mesPasado') {
      const inicio = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const fin = new Date(now.getFullYear(), now.getMonth(), 0);
      setFechaInicioReporte(formatDate(inicio));
      setFechaFinReporte(formatDate(fin));
    }
  };

  const cargarReportesData = async () => {
    if (!fechaInicioReporte || !fechaFinReporte) return;
    setLoadingReportes(true);
    setErrorReportes('');
    try {
      const [resResumen, resProductos, resDiarias] = await Promise.all([
        fetch(`http://127.0.0.1:5000/api/informes/rango-resumen?fecha_inicio=${fechaInicioReporte}&fecha_fin=${fechaFinReporte}`),
        fetch(`http://127.0.0.1:5000/api/informes/rango-productos-json?fecha_inicio=${fechaInicioReporte}&fecha_fin=${fechaFinReporte}`),
        fetch(`http://127.0.0.1:5000/api/informes/rango-ventas-diarias?fecha_inicio=${fechaInicioReporte}&fecha_fin=${fechaFinReporte}&agrupacion=${agrupacionGrafico}`)
      ]);

      const dataResumen = await resResumen.json();
      const dataProductos = await resProductos.json();
      const dataDiarias = await resDiarias.json();

      if (dataResumen.success) {
        setReporteResumen(dataResumen.data);
      }
      if (dataProductos.success) {
        setReporteProductos(dataProductos.data);
      }
      if (dataDiarias.success) {
        setReporteVentasDiarias(dataDiarias.data);
      }
    } catch (err) {
      console.error('Error al cargar datos de reportes:', err);
      setErrorReportes('Error de conexión al cargar los reportes.');
    } finally {
      setLoadingReportes(false);
    }
  };

  useEffect(() => {
    if (user && activeTab === 'reportes') {
      cargarReportesData();
    }
  }, [user, activeTab, fechaInicioReporte, fechaFinReporte, agrupacionGrafico]);

  const aplicarPresetImpresion = (tipo) => {
    const hoy = new Date();
    const formatDate = (date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    if (tipo === 'hoy') {
      const hoyStr = formatDate(hoy);
      setFechaInicioImpresion(hoyStr);
      setFechaFinImpresion(hoyStr);
      setFiltroTurnoImpresion('all');
    } else if (tipo === 'ayer') {
      const ayer = new Date();
      ayer.setDate(hoy.getDate() - 1);
      const ayerStr = formatDate(ayer);
      setFechaInicioImpresion(ayerStr);
      setFechaFinImpresion(ayerStr);
      setFiltroTurnoImpresion('all');
    } else if (tipo === '7dias') {
      const hace7 = new Date();
      hace7.setDate(hoy.getDate() - 6);
      setFechaInicioImpresion(formatDate(hace7));
      setFechaFinImpresion(formatDate(hoy));
      setFiltroTurnoImpresion('all');
    } else if (tipo === 'esteMes') {
      const primero = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      setFechaInicioImpresion(formatDate(primero));
      setFechaFinImpresion(formatDate(hoy));
      setFiltroTurnoImpresion('all');
    } else if (tipo === 'mesPasado') {
      const primero = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
      const ultimo = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
      setFechaInicioImpresion(formatDate(primero));
      setFechaFinImpresion(formatDate(ultimo));
      setFiltroTurnoImpresion('all');
    }
  };

  const cargarCierreParaImpresion = async (targetStart, targetEnd, targetShift) => {
    const start = targetStart || fechaInicioImpresion;
    const end = targetEnd || fechaFinImpresion || start;
    const isInterval = Boolean(end && end !== start);
    const s = !isInterval ? (targetShift !== undefined ? targetShift : filtroTurnoImpresion) : 'all';
    if (!start) return;
    setLoadingCierreImpresion(true);
    try {
      const url = isInterval 
        ? `http://127.0.0.1:5000/api/informes/cierre?fecha_inicio=${start}&fecha_fin=${end}&turno_id=${s}`
        : `http://127.0.0.1:5000/api/informes/cierre?fecha=${start}&turno_id=${s}`;
      const response = await fetch(url);
      const data = await response.json();
      if (response.ok && data.success) {
        setCierreDataImpresion(data.data);
      } else {
        setCierreDataImpresion(null);
      }
    } catch (err) {
      console.error('Error al cargar datos de informe para impresión:', err);
      setCierreDataImpresion(null);
    } finally {
      setLoadingCierreImpresion(false);
    }
  };

  useEffect(() => {
    if (user && activeTab === 'reportes' && subTabReportes === 'impresion') {
      cargarCierreParaImpresion(fechaInicioImpresion, fechaFinImpresion, filtroTurnoImpresion);
    }
  }, [user, activeTab, subTabReportes, fechaInicioImpresion, fechaFinImpresion, filtroTurnoImpresion]);

  const handleImprimirFinancieroReportes = async () => {
    if (!window.electronAPI) {
      abrirAlerta('La impresión de tickets requiere la aplicación de escritorio Electron.', 'Aviso');
      return;
    }
    const isIntervalo = Boolean(fechaFinImpresion && fechaFinImpresion !== fechaInicioImpresion);
    let data = cierreDataImpresion;
    if (!data) {
      setLoadingCierreImpresion(true);
      try {
        const url = isIntervalo
          ? `http://127.0.0.1:5000/api/informes/cierre?fecha_inicio=${fechaInicioImpresion}&fecha_fin=${fechaFinImpresion}&turno_id=${filtroTurnoImpresion}`
          : `http://127.0.0.1:5000/api/informes/cierre?fecha=${fechaInicioImpresion}&turno_id=${filtroTurnoImpresion}`;
        const resp = await fetch(url);
        const json = await resp.json();
        if (resp.ok && json.success) {
          data = json.data;
          setCierreDataImpresion(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingCierreImpresion(false);
      }
    }
    if (!data) {
      abrirAlerta('No se pudieron obtener los datos para el Resumen Financiero.', 'Error');
      return;
    }

    setImprimiendoTipo('financiero');
    setMensajeImpresion('Imprimiendo Resumen Financiero...');

    const isShiftFilter = (!isIntervalo && filtroTurnoImpresion && filtroTurnoImpresion !== 'all' && filtroTurnoImpresion !== 'todos' && filtroTurnoImpresion !== 'undefined');
    const selectedShift = isShiftFilter 
      ? listaTurnos.find(t => String(t.id) === String(filtroTurnoImpresion)) 
      : null;

    let fondoAperturaReporte = 0;
    let hasArqueoReporte = false;
    let cargadoPorReporte = '';
    let efectivoRealReporte = 0;
    let diferenciaReporte = 0;
    let observacionesReporte = '';
    let turnoNombreReporte = isIntervalo 
      ? 'Intervalo Completo' 
      : (isShiftFilter ? `Turno #${filtroTurnoImpresion}` : 'Día Completo (Todos)');

    if (!isIntervalo && isShiftFilter && selectedShift) {
      fondoAperturaReporte = parseFloat(selectedShift.efectivo_inicial || 0);
      cargadoPorReporte = selectedShift.usuario_fin || selectedShift.usuario_inicio || '';
      if (!selectedShift.activo) {
        hasArqueoReporte = true;
        efectivoRealReporte = parseFloat(selectedShift.efectivo_final || 0);
        diferenciaReporte = parseFloat(selectedShift.diferencia || 0);
        observacionesReporte = selectedShift.observaciones || '';
      }
    } else if (!isIntervalo) {
      fondoAperturaReporte = parseFloat(data.efectivo_inicial_sugerido || 0);
      cargadoPorReporte = user?.nombre || 'Administrador';
    }

    try {
      window.electronAPI.printReport({
        tipo_reporte: 'financiero',
        is_intervalo: isIntervalo,
        fecha_inicio: fechaInicioImpresion,
        fecha_fin: fechaFinImpresion,
        fecha: isIntervalo ? `${fechaInicioImpresion} al ${fechaFinImpresion}` : fechaInicioImpresion,
        turno_nombre: turnoNombreReporte,
        total_ventas: data.total_ventas,
        total_efectivo: data.total_efectivo,
        total_debito: data.total_debito,
        total_credito: data.total_credito,
        total_tarjeta: data.total_tarjeta,
        total_gastos: data.total_gastos,
        gastos: data.gastos || [],
        productos_vendidos: data.productos_vendidos || [],
        envases_vendidos: data.envases_vendidos || { cantidad: 0, total_pesos: 0 },
        productos_promociones: data.productos_promociones || [],
        comandas_eliminadas: data.comandas_eliminadas || [],
        monto_total_eliminado: data.monto_total_eliminado || 0,
        has_arqueo: hasArqueoReporte,
        cargado_por: cargadoPorReporte,
        fondo_apertura: fondoAperturaReporte,
        efectivo_real: efectivoRealReporte,
        diferencia: diferenciaReporte,
        observaciones: observacionesReporte
      });
      setMensajeImpresion(`✅ Ticket de Resumen Financiero ${isIntervalo ? 'del intervalo' : ''} enviado a impresión.`);
      setTimeout(() => setMensajeImpresion(''), 4000);
    } catch (err) {
      console.error(err);
      abrirAlerta('Error al imprimir ticket: ' + err.message, 'Error');
    } finally {
      setImprimiendoTipo(null);
    }
  };

  const handleImprimirInventarioReportes = async () => {
    if (!window.electronAPI) {
      abrirAlerta('La impresión de tickets requiere la aplicación de escritorio Electron.', 'Aviso');
      return;
    }
    const isIntervalo = Boolean(fechaFinImpresion && fechaFinImpresion !== fechaInicioImpresion);
    let data = cierreDataImpresion;
    if (!data) {
      setLoadingCierreImpresion(true);
      try {
        const url = isIntervalo
          ? `http://127.0.0.1:5000/api/informes/cierre?fecha_inicio=${fechaInicioImpresion}&fecha_fin=${fechaFinImpresion}&turno_id=${filtroTurnoImpresion}`
          : `http://127.0.0.1:5000/api/informes/cierre?fecha=${fechaInicioImpresion}&turno_id=${filtroTurnoImpresion}`;
        const resp = await fetch(url);
        const json = await resp.json();
        if (resp.ok && json.success) {
          data = json.data;
          setCierreDataImpresion(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingCierreImpresion(false);
      }
    }
    if (!data) {
      abrirAlerta('No se pudieron obtener los datos para el Resumen de Inventario.', 'Error');
      return;
    }

    setImprimiendoTipo('inventario');
    setMensajeImpresion('Imprimiendo Resumen de Inventario...');

    const isShiftFilter = (!isIntervalo && filtroTurnoImpresion && filtroTurnoImpresion !== 'all' && filtroTurnoImpresion !== 'todos' && filtroTurnoImpresion !== 'undefined');
    const turnoNombreReporte = isIntervalo 
      ? 'Intervalo Completo' 
      : (isShiftFilter ? `Turno #${filtroTurnoImpresion}` : 'Día Completo (Todos)');

    let stockActual = listaIngredientes;
    if (!stockActual || stockActual.length === 0) {
      try {
        const resp = await fetch('http://127.0.0.1:5000/api/ingredientes');
        const dataIng = await resp.json();
        if (resp.ok && dataIng.success && dataIng.ingredientes) {
          stockActual = dataIng.ingredientes;
          setListaIngredientes(dataIng.ingredientes);
        }
      } catch (e) {
        console.error('Error al obtener stock actual:', e);
      }
    }

    try {
      window.electronAPI.printReport({
        tipo_reporte: 'inventario',
        is_intervalo: isIntervalo,
        fecha_inicio: fechaInicioImpresion,
        fecha_fin: fechaFinImpresion,
        fecha: isIntervalo ? `${fechaInicioImpresion} al ${fechaFinImpresion}` : fechaInicioImpresion,
        turno_nombre: turnoNombreReporte,
        ingredientes_gastados: data.ingredientes_gastados || [],
        entradas_inventario: data.entradas_inventario || [],
        mermas_inventario: data.mermas_inventario || [],
        inventario_actual: stockActual || []
      });
      setMensajeImpresion(`✅ Ticket de Resumen de Inventario ${isIntervalo ? 'del intervalo' : ''} enviado a impresión.`);
      setTimeout(() => setMensajeImpresion(''), 4000);
    } catch (err) {
      console.error(err);
      abrirAlerta('Error al imprimir ticket: ' + err.message, 'Error');
    } finally {
      setImprimiendoTipo(null);
    }
  };

  const handleImprimirProductosReportes = async () => {
    if (!window.electronAPI) {
      abrirAlerta('La impresión de tickets requiere la aplicación de escritorio Electron.', 'Aviso');
      return;
    }
    const isIntervalo = Boolean(fechaFinImpresion && fechaFinImpresion !== fechaInicioImpresion);
    let data = cierreDataImpresion;
    if (!data) {
      setLoadingCierreImpresion(true);
      try {
        const url = isIntervalo
          ? `http://127.0.0.1:5000/api/informes/cierre?fecha_inicio=${fechaInicioImpresion}&fecha_fin=${fechaFinImpresion}&turno_id=${filtroTurnoImpresion}`
          : `http://127.0.0.1:5000/api/informes/cierre?fecha=${fechaInicioImpresion}&turno_id=${filtroTurnoImpresion}`;
        const resp = await fetch(url);
        const json = await resp.json();
        if (resp.ok && json.success) {
          data = json.data;
          setCierreDataImpresion(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingCierreImpresion(false);
      }
    }
    if (!data) {
      abrirAlerta('No se pudieron obtener los datos de productos vendidos.', 'Error');
      return;
    }

    setImprimiendoTipo('productos');
    setMensajeImpresion('Imprimiendo Productos por Categoría...');

    const unificadosConCategoria = (data.productos_unificados || []).map(item => {
      const prod = productos.find(p => p.nombre.toLowerCase().trim() === item.nombre_producto.toLowerCase().trim());
      const catName = item.categoria || prod?.categoria || (item.nombre_producto === 'Envases para llevar' ? 'Envases' : 'Otros');
      const catObj = listaCategorias.find(c => c.nombre.toLowerCase().trim() === catName.toLowerCase().trim());
      return {
        ...item,
        categoria: catName,
        categoria_emoji: item.categoria_emoji || catObj?.emoji || '🏷️',
        categoria_orden: item.categoria_orden !== undefined ? item.categoria_orden : (catObj?.orden !== undefined ? catObj.orden : 999)
      };
    });

    try {
      window.electronAPI.printReport({
        fecha: isIntervalo ? `${fechaInicioImpresion} al ${fechaFinImpresion}` : fechaInicioImpresion,
        fecha_inicio: fechaInicioImpresion,
        fecha_fin: fechaFinImpresion,
        is_intervalo: isIntervalo,
        tipo_reporte: 'consolidado',
        productos_unificados: unificadosConCategoria,
        categorias_orden: listaCategorias.map(c => c.nombre)
      });
      setMensajeImpresion(`✅ Ticket de Productos por Categoría ${isIntervalo ? 'del intervalo' : ''} enviado a impresión.`);
      setTimeout(() => setMensajeImpresion(''), 4000);
    } catch (err) {
      console.error(err);
      abrirAlerta('Error al imprimir ticket: ' + err.message, 'Error');
    } finally {
      setImprimiendoTipo(null);
    }
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
    if (!activeShift) {
      abrirAlerta('La pestaña de pedidos está deshabilitada porque no hay un turno activo. Debes ingresar el monto inicial de apertura para operar.', 'Turno Requerido');
      setShowShiftPrompt(true);
      return;
    }
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
    if (!activeShift) {
      abrirAlerta('No puedes registrar pedidos porque no hay un turno activo. Debes ingresar el monto inicial de apertura.', 'Turno Requerido');
      setShowShiftPrompt(true);
      return;
    }
    if (pedido.length === 0) return;
    if (tipoEntrega === 'Pedido Externo') {
      handleConfirmarPedidoExterno();
      return;
    }
    setClienteNombre('');
    setPedidoNota('');
    setTipoTransaccion('Efectivo');
    setMontoEfectivoMixto('');
    setMontoDebitoMixto('');
    setMontoCreditoMixto('');
    setShowPromptCliente(true);
  };

  const handleConfirmarPedidoExterno = () => {
    if (pedido.length === 0) return;
    setTipoEntrega('Llevar');
    setClienteNombre('PedidosYa');
    setPedidoNota('');
    setTipoTransaccion('Pedido Externo');
    setMontoEfectivoMixto('');
    setMontoDebitoMixto('');
    setMontoCreditoMixto('');
    setShowPromptCliente(true);
  };

  const handleImprimirComprobante = () => {
    if (!pedido || pedido.length === 0) {
      abrirAlerta('No hay productos en el pedido para imprimir un comprobante.', 'Pedido Vacío');
      return;
    }

    const envasesInfo = calcularEnvases(pedido, tipoEntrega);
    const subtotalProductos = calcularSubtotalProductos(pedido);
    const totalPedido = subtotalProductos + envasesInfo.montoTotal;
    const atendidoPor = user ? user.nombre : 'Atención';

    const comprobanteData = {
      ticket: 'COMPROBANTE',
      es_comprobante: true,
      abrir_caja: false,
      cliente: clienteNombre && clienteNombre.trim() !== '' ? clienteNombre.trim() : 'PRE-CUENTA / COMPROBANTE',
      fecha_hora: new Date().toISOString(),
      productos: pedido.map(item => ({
        id: item.id,
        nombre: item.nombre,
        cantidad: item.cantidad,
        precio: parseFloat(item.precio),
        promocion_id: item.promocion_id || null,
        mostrar_nombre_ticket: isOptionEnabled(item.mostrar_nombre_ticket, true),
        productos_fijos: item.productos_fijos || [],
        opciones_elegidas: item.opciones_elegidas || []
      })),
      total: totalPedido,
      atendido_por: atendidoPor,
      nota: pedidoNota && pedidoNota.trim() !== '' ? pedidoNota.trim() : null,
      tipo_entrega: tipoEntrega,
      tipo_transaccion: 'Comprobante',
      cantidad_envases: envasesInfo.cantidadTotal,
      monto_envases: envasesInfo.montoTotal,
      local_nombre: localNombre,
      local_direccion: localDireccion,
      local_telefono: localTelefono,
      local_pie_ticket: localPieTicket,
      impuesto_iva_porcentaje: impuestoIvaPorcentaje,
      impuesto_incluido: impuestoIncluido
    };

    if (window.electronAPI && typeof window.electronAPI.printTicket === 'function') {
      window.electronAPI.printTicket(comprobanteData);
      abrirAlerta('Se ha enviado el comprobante del pedido actual a la impresora (sin registrar en base de datos ni historial).', 'Comprobante Impreso');
    } else {
      abrirAlerta('La impresión de comprobantes solo está disponible desde la versión de escritorio conectada a la impresora.', 'Función de Impresora');
    }
  };

  const handleSubmitPedido = async (e) => {
    e.preventDefault();

    const envasesInfo = calcularEnvases(pedido, tipoEntrega);
    const subtotalProductos = calcularSubtotalProductos(pedido);
    const totalPedido = subtotalProductos + envasesInfo.montoTotal;
    const atendidoPor = user ? user.nombre : 'Desconocido';

    let montoEfec = 0;
    let montoDeb = 0;
    let montoCred = 0;
    let detalleMixto = null;
    let finalTotalPedido = totalPedido;

    if (tipoTransaccion === 'Pedido Externo') {
      montoEfec = 0;
      montoDeb = 0;
      montoCred = 0;
      finalTotalPedido = 0;
    } else if (tipoTransaccion === 'Mixto') {
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
      cliente_nombre: (clienteNombre && clienteNombre.trim() !== '') ? clienteNombre.trim() : (tipoTransaccion === 'Pedido Externo' ? 'PedidosYa' : 'Cliente'),
      total: finalTotalPedido,
      atendido_por: atendidoPor,
      productos: pedido.map(item => ({
        id: item.id,
        nombre: item.nombre,
        cantidad: item.cantidad,
        precio: parseFloat(item.precio),
        promocion_id: item.promocion_id || null,
        mostrar_nombre_ticket: isOptionEnabled(item.mostrar_nombre_ticket, true),
        productos_fijos: item.productos_fijos || [],
        opciones_elegidas: item.opciones_elegidas || []
      })),
      nota: pedidoNota.trim() || null,
      tipo_entrega: tipoEntrega === 'Pedido Externo' ? 'Llevar' : tipoEntrega,
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
          cliente: payload.cliente_nombre,
          fecha_hora: data.fecha_hora,
          productos: payload.productos,
          total: payload.total,
          atendido_por: atendidoPor,
          nota: payload.nota,
          tipo_entrega: payload.tipo_entrega,
          tipo_transaccion: payload.tipo_transaccion,
          monto_efectivo: payload.monto_efectivo,
          monto_debito: payload.monto_debito,
          monto_credito: payload.monto_credito,
          pago_mixto_detalle: payload.pago_mixto_detalle,
          cantidad_envases: envasesInfo.cantidadTotal,
          monto_envases: envasesInfo.montoTotal,
          local_nombre: localNombre,
          local_direccion: localDireccion,
          local_telefono: localTelefono,
          local_pie_ticket: localPieTicket,
          impuesto_iva_porcentaje: impuestoIvaPorcentaje,
          impuesto_incluido: impuestoIncluido,
          abrir_caja: payload.tipo_transaccion !== 'Pedido Externo'
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
                    {activeShift ? (
                      <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: '700', marginLeft: '0.5rem' }}>
                        ● Turno #{activeShift.id}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowShiftPrompt(true)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid rgba(239, 68, 68, 0.4)',
                          color: '#f87171',
                          padding: '0.15rem 0.55rem',
                          borderRadius: '50px',
                          fontSize: '0.72rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          marginLeft: '0.5rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                        title="Haz clic para ingresar monto inicial y abrir turno"
                      >
                        🔒 Sin Turno (Abrir)
                      </button>
                    )}
                  </p>
                </div>
              </div>

              {/* Navegación según el rol del usuario */}
              <div className="nav-tabs">
                <button 
                  onClick={() => {
                    if (!activeShift) {
                      abrirAlerta('La pestaña de pedidos está deshabilitada porque no hay un turno activo. Para habilitarla y tomar pedidos, debes ingresar el monto inicial de apertura.', 'Turno Requerido');
                      setShowShiftPrompt(true);
                      return;
                    }
                    setActiveTab('pedidos');
                  }} 
                  className={`nav-tab ${activeTab === 'pedidos' ? 'active' : ''}`}
                  style={!activeShift ? { 
                    opacity: 0.55, 
                    cursor: 'not-allowed',
                    borderStyle: 'dashed',
                    borderColor: 'rgba(239, 68, 68, 0.4)',
                    color: 'var(--text-muted)'
                  } : {}}
                  title={!activeShift ? 'Deshabilitado: Debes ingresar monto inicial para abrir turno' : '🛒 Pedidos y Comandas'}
                >
                  🛒 Pedidos {!activeShift && <span style={{ fontSize: '0.75rem', color: '#ef4444', marginLeft: '0.25rem' }}>🔒</span>}
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
                  onClick={() => setActiveTab('reportes')} 
                  className={`nav-tab ${activeTab === 'reportes' ? 'active' : ''}`}
                >
                  📈 Reportes
                </button>
                <button 
                  onClick={() => setActiveTab('configuraciones')} 
                  className={`nav-tab ${activeTab === 'configuraciones' ? 'active' : ''}`}
                >
                  ⚙️ Configuraciones
                </button>
              </div>

              <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap', justifyContent: 'flex-end', marginLeft: 'auto', flexShrink: 0 }}>
                <button 
                  type="button"
                  onClick={() => {
                    const presets = ['1366x768', '1280x720', '1920x1080'];
                    const nextIdx = (presets.indexOf(appResolucion) + 1) % presets.length;
                    setAppResolucion(presets[nextIdx]);
                  }} 
                  className="theme-toggle-header"
                  title="Cambiar resolución de pantalla"
                  style={{ whiteSpace: 'nowrap', height: '38px', padding: '0 0.85rem', flexShrink: 0 }}
                >
                  📺 {appResolucion === '1366x768' ? '1366x768' : appResolucion === '1280x720' ? '1280x720' : appResolucion === '1920x1080' ? '1920x1080' : appResolucion}
                </button>
                <button 
                  type="button"
                  onClick={() => setIsDark(!isDark)} 
                  className="theme-toggle-header"
                  title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
                  style={{ whiteSpace: 'nowrap', height: '38px', padding: '0 0.85rem', flexShrink: 0 }}
                >
                  {isDark ? '☀️ Claro' : '🌙 Oscuro'}
                </button>
                <button onClick={handleLogout} className="btn-secondary" style={{ whiteSpace: 'nowrap', height: '38px', padding: '0 1rem', flexShrink: 0 }}>
                  Cerrar Sesión
                </button>
              </div>
            </div>

            {/* PESTAÑA DE PEDIDOS (Visible para todos) */}
            {activeTab === 'pedidos' && (
              !activeShift ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 1.5rem', minHeight: '400px' }}>
                  <div className="report-panel" style={{ maxWidth: '480px', width: '100%', textAlign: 'center', padding: '2.5rem 2rem', border: '1.5px dashed rgba(239, 68, 68, 0.45)', borderRadius: '24px', background: 'rgba(239, 68, 68, 0.04)', boxShadow: '0 10px 40px rgba(0,0,0,0.4)' }}>
                    <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🔒</div>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                      Pestaña de Pedidos Deshabilitada
                    </h3>
                    <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '1.75rem' }}>
                      No hay ningún turno de caja abierto actualmente. Para registrar pedidos, cobrar comandas y gestionar ventas en el sistema, debes ingresar el <strong>monto inicial de apertura</strong>.
                    </p>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => setShowShiftPrompt(true)}
                      style={{ padding: '0.8rem 1.75rem', fontSize: '0.95rem', fontWeight: '700', borderRadius: '50px', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      🔑 Abrir Turno con Monto Inicial
                    </button>
                  </div>
                </div>
              ) : (
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
                      {listaCategorias
                        .filter(cat => {
                          const n = cat.nombre ? cat.nombre.toLowerCase().trim() : '';
                          return n !== 'todos' && n !== 'promociones' && n !== 'promoción' && n !== 'promocion';
                        })
                        .map((cat, idx) => {
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <h3 className="section-title" style={{ margin: 0, fontSize: '1.25rem' }}>📝 Detalle del Pedido</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <button
                          type="button"
                          onClick={handleImprimirComprobante}
                          disabled={pedido.length === 0}
                          style={{
                            padding: '0.65rem 0.95rem',
                            fontSize: '0.9rem',
                            fontWeight: '700',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            background: pedido.length === 0 ? 'rgba(59, 130, 246, 0.12)' : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                            border: '1px solid rgba(37, 99, 235, 0.4)',
                            color: pedido.length === 0 ? 'var(--text-secondary)' : '#ffffff',
                            borderRadius: '12px',
                            cursor: pedido.length === 0 ? 'not-allowed' : 'pointer',
                            opacity: pedido.length === 0 ? 0.6 : 1,
                            boxShadow: pedido.length === 0 ? 'none' : '0 4px 12px rgba(37, 99, 235, 0.3)',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            whiteSpace: 'nowrap'
                          }}
                          onMouseEnter={(e) => {
                            if (pedido.length > 0) {
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.boxShadow = '0 6px 16px rgba(37, 99, 235, 0.45)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (pedido.length > 0) {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.3)';
                            }
                          }}
                          title="Imprimir comprobante previo del pedido actual sin guardar"
                        >
                          <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>🧾</span>
                          <span>Comprobante</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (window.electronAPI && typeof window.electronAPI.openCashDrawer === 'function') {
                              window.electronAPI.openCashDrawer();
                              abrirAlerta('Se ha enviado la señal de apertura a la caja registradora.', 'Caja Registradora');
                            } else {
                              abrirAlerta('La apertura de cajón monedero solo está disponible desde la versión de escritorio conectada a la impresora.', 'Función de Impresora');
                            }
                          }}
                          style={{
                            padding: '0.65rem 1.05rem',
                            fontSize: '0.92rem',
                            fontWeight: '800',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.45rem',
                            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                            border: 'none',
                            color: '#ffffff',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(234, 88, 12, 0.35)',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            whiteSpace: 'nowrap'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 6px 16px rgba(234, 88, 12, 0.45)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(234, 88, 12, 0.35)';
                          }}
                          title="Enviar comando para abrir la caja de dinero"
                        >
                          <span style={{ fontSize: '1.15rem', lineHeight: 1 }}>🔓</span>
                          <span>Abrir Caja</span>
                        </button>
                      </div>
                    </div>
                    
                    {/* Selector Servir / Llevar / Pedido Externo */}
                    <div className="delivery-selector-group" style={{ margin: 0, width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr 1.15fr', gap: '0.35rem' }}>
                      <button
                        type="button"
                        className={`delivery-option-btn ${tipoEntrega === 'Servir' ? 'active' : ''}`}
                        onClick={() => {
                          setTipoEntrega('Servir');
                          if (tipoTransaccion === 'Pedido Externo') {
                            setTipoTransaccion('Efectivo');
                            setClienteNombre('');
                          }
                        }}
                        style={{ 
                          padding: '0.48rem 0.4rem', 
                          fontSize: '0.85rem', 
                          fontWeight: 'bold',
                          ...(tipoEntrega === 'Servir' ? {
                            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                            borderColor: '#047857',
                            color: '#ffffff',
                            boxShadow: '0 2px 8px rgba(5, 150, 105, 0.35)'
                          } : {})
                        }}
                      >
                        🍽️ Servir
                      </button>
                      <button
                        type="button"
                        className={`delivery-option-btn ${tipoEntrega === 'Llevar' ? 'active' : ''}`}
                        onClick={() => {
                          setTipoEntrega('Llevar');
                          if (tipoTransaccion === 'Pedido Externo') {
                            setTipoTransaccion('Efectivo');
                            setClienteNombre('');
                          }
                        }}
                        style={{ 
                          padding: '0.48rem 0.4rem', 
                          fontSize: '0.88rem', 
                          fontWeight: '800',
                          ...(tipoEntrega === 'Llevar' ? {
                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            borderColor: '#b91c1c',
                            color: '#ffffff',
                            boxShadow: '0 0 12px rgba(239, 68, 68, 0.55)',
                            transform: 'scale(1.02)'
                          } : {})
                        }}
                      >
                        🛍️ ¡LLEVAR!
                      </button>
                      <button
                        type="button"
                        className={`delivery-option-btn ${tipoEntrega === 'Pedido Externo' ? 'active' : ''}`}
                        onClick={() => {
                          setTipoEntrega('Pedido Externo');
                          setTipoTransaccion('Pedido Externo');
                          if (!clienteNombre || clienteNombre === 'Cliente') {
                            setClienteNombre('PedidosYa');
                          }
                        }}
                        style={{ 
                          padding: '0.45rem 0.4rem', 
                          fontSize: '0.83rem', 
                          fontWeight: 'bold',
                          whiteSpace: 'nowrap',
                          ...(tipoEntrega === 'Pedido Externo' ? {
                            background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
                            borderColor: '#e11d48',
                            color: '#ffffff',
                            boxShadow: '0 2px 8px rgba(225, 29, 72, 0.35)'
                          } : {
                            border: '1px dashed rgba(244, 63, 94, 0.4)',
                            color: 'var(--text-secondary)'
                          })
                        }}
                        title="PedidosYa / Delivery App (descuenta inventario, sin registrar dinero en caja)"
                      >
                        🛵 Pedido Externo
                      </button>
                    </div>

                    {/* Banner indicador evidente de modalidad de entrega */}
                    {tipoEntrega === 'Llevar' && (
                      <div style={{
                        marginTop: '0.35rem',
                        padding: '0.4rem 0.6rem',
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        color: '#ffffff',
                        borderRadius: '8px',
                        fontSize: '0.82rem',
                        fontWeight: '900',
                        textAlign: 'center',
                        letterSpacing: '0.8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                        boxShadow: '0 2px 8px rgba(220, 38, 38, 0.35)'
                      }}>
                        <span>🛍️</span>
                        <span>PEDIDO PARA LLEVAR (EMPAQUE)</span>
                      </div>
                    )}
                    {tipoEntrega === 'Servir' && (
                      <div style={{
                        marginTop: '0.35rem',
                        padding: '0.32rem 0.6rem',
                        background: 'rgba(5, 150, 105, 0.12)',
                        border: '1px solid rgba(5, 150, 105, 0.35)',
                        color: isDark ? '#a7f3d0' : '#047857',
                        borderRadius: '8px',
                        fontSize: '0.78rem',
                        fontWeight: '700',
                        textAlign: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem'
                      }}>
                        <span>🍽️</span>
                        <span>CONSUMO EN LOCAL (SERVIR)</span>
                      </div>
                    )}
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
                                    {tipoEntrega === 'Pedido Externo' ? (
                                      <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1.2 }}>
                                        <span style={{ fontSize: '0.9rem', color: '#f43f5e', fontWeight: 'bold' }}>🛵 Externo ($0 Caja)</span>
                                        <span style={{ fontSize: '0.75rem', opacity: 0.65, textDecoration: 'line-through' }}>
                                          ${grandTotal.toLocaleString('es-CL')}
                                        </span>
                                      </span>
                                    ) : (
                                      `$${grandTotal.toLocaleString('es-CL', { minimumFractionDigits: 0 })}`
                                    )}
                                  </span>
                                </div>
                              </>
                            );
                          })()}
                          <button 
                            onClick={handleConfirmarPedido} 
                            className="btn-primary btn-checkout"
                            style={tipoEntrega === 'Pedido Externo' ? {
                              background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
                              borderColor: '#e11d48',
                              boxShadow: '0 4px 14px rgba(225, 29, 72, 0.35)'
                            } : {}}
                          >
                            {tipoEntrega === 'Pedido Externo' ? '🛵 Confirmar Pedido Externo' : 'Confirmar Pedido'}
                          </button>

                          <button
                            onClick={() => {
                              setPedido([]);
                              setEnvasesCantidadOverride(null);
                              setPrecioEnvaseOverride(null);
                              setTipoEntrega('Servir');
                              setTipoTransaccion('Efectivo');
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
            )
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
                                setBusquedaProductoEnCat('');
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

                          {/* Asignación Rápida del Envase para Llevar a esta Categoría */}
                          {(() => {
                            const envaseAsignadoEstaCat = productos.some(p =>
                              (p.id === 108 || p.nombre?.toLowerCase().includes('envase para llevar')) &&
                              p.categoria?.toLowerCase() === selectedCatForProducts.nombre?.toLowerCase()
                            );
                            const envaseProd = productos.find(p => p.id === 108 || p.nombre?.toLowerCase().includes('envase para llevar'));
                            const catActualEnvase = envaseProd?.categoria || 'Otros';

                            return (
                              <div style={{
                                marginBottom: '1rem',
                                padding: '0.75rem 1rem',
                                borderRadius: '14px',
                                background: envaseAsignadoEstaCat ? 'rgba(16, 185, 129, 0.08)' : 'rgba(234, 88, 12, 0.08)',
                                border: envaseAsignadoEstaCat ? '1.5px solid rgba(16, 185, 129, 0.35)' : '1px dashed var(--accent-primary)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: '0.75rem',
                                flexWrap: 'wrap'
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                  <span style={{ fontSize: '1.4rem' }}>📦</span>
                                  <div>
                                    <div style={{ fontWeight: '700', fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                                      Producto "Envase para llevar" ({precioEnvase ? `$${precioEnvase}` : '$300'})
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                      {envaseAsignadoEstaCat
                                        ? '✅ Asignado actualmente a esta categoría (se muestra en su sección del menú)'
                                        : `⚪ Actualmente ubicado en: "${catActualEnvase}"`}
                                    </div>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => toggleEnvaseEnCategoria(selectedCatForProducts.nombre, !envaseAsignadoEstaCat)}
                                  className={envaseAsignadoEstaCat ? 'btn-secondary' : 'btn-primary'}
                                  style={{
                                    fontSize: '0.8rem',
                                    padding: '0.45rem 0.9rem',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {envaseAsignadoEstaCat ? 'Quitar de esta Categoría' : '🛍️ Asignar a esta Categoría'}
                                </button>
                              </div>
                            );
                          })()}

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

                          {/* Buscador de Productos */}
                          <div style={{ position: 'relative', marginBottom: '1rem' }}>
                            <input
                              type="text"
                              className="form-input"
                              placeholder={`🔍 Buscar producto en ${selectedCatForProducts.nombre}...`}
                              value={busquedaProductoEnCat}
                              onChange={(e) => setBusquedaProductoEnCat(e.target.value)}
                              style={{
                                width: '100%',
                                height: '38px',
                                paddingLeft: '2.5rem',
                                borderRadius: '12px',
                                border: '1px solid var(--glass-border)',
                                boxSizing: 'border-box'
                              }}
                            />
                            {busquedaProductoEnCat && (
                              <button
                                type="button"
                                onClick={() => setBusquedaProductoEnCat('')}
                                style={{
                                  position: 'absolute',
                                  right: '0.75rem',
                                  top: '50%',
                                  transform: 'translateY(-50%)',
                                  background: 'transparent',
                                  border: 'none',
                                  color: 'var(--text-secondary)',
                                  cursor: 'pointer',
                                  fontSize: '1.2rem',
                                  lineHeight: 1,
                                  padding: '0.2rem'
                                }}
                              >
                                &times;
                              </button>
                            )}
                          </div>

                          <div className="users-list-container" style={{ flex: 1, overflowY: 'auto' }}>
                            {productos.filter(p => p.categoria?.toLowerCase() === selectedCatForProducts.nombre?.toLowerCase()).length === 0 ? (
                              <p className="empty-catalog" style={{ textAlign: 'center', marginTop: '2rem' }}>
                                No hay productos en esta categoría.
                              </p>
                            ) : productos.filter(p => p.categoria?.toLowerCase() === selectedCatForProducts.nombre?.toLowerCase() && p.nombre.toLowerCase().includes(busquedaProductoEnCat.toLowerCase())).length === 0 ? (
                              <p className="empty-catalog" style={{ textAlign: 'center', marginTop: '2rem', fontStyle: 'italic' }}>
                                No se encontraron productos que coincidan con la búsqueda.
                              </p>
                            ) : (
                              productos
                                .filter(p => p.categoria?.toLowerCase() === selectedCatForProducts.nombre?.toLowerCase() && p.nombre.toLowerCase().includes(busquedaProductoEnCat.toLowerCase()))
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
                                  <option value="🍅">🍅 Tomate</option>
                                  <option value="🥑">🥑 Palta</option>
                                  <option value="🌶️">🌶️ Ají</option>
                                  <option value="🥩">🥩 Carne</option>
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

                        <div className="form-group" style={{ marginTop: '0.75rem', background: 'rgba(234, 88, 12, 0.08)', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px dashed var(--accent-primary)' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '700' }}>
                            <input
                              type="checkbox"
                              checked={nuevaCatAsignarEnvase}
                              onChange={(e) => setNuevaCatAsignarEnvase(e.target.checked)}
                              style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--accent-primary)' }}
                            />
                            <span>🛍️ Asignar el producto "Envase para llevar" a esta categoría</span>
                          </label>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginLeft: '1.75rem', marginTop: '0.25rem', lineHeight: '1.3' }}>
                            Al marcarlo, el producto <strong>Envase para llevar (${precioEnvase ? `$${precioEnvase}` : ''})</strong> se ubicará en esta categoría para aparecer en su sección del menú y catálogo.
                          </span>
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

                    {/* Buscador de Categorías */}
                    <div style={{ position: 'relative', marginTop: '1rem', marginBottom: '1rem' }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="🔍 Buscar categoría..."
                        value={busquedaCategoria}
                        onChange={(e) => setBusquedaCategoria(e.target.value)}
                        style={{
                          width: '100%',
                          height: '38px',
                          paddingLeft: '2.5rem',
                          borderRadius: '12px',
                          border: '1px solid var(--glass-border)',
                          boxSizing: 'border-box'
                        }}
                      />
                      {busquedaCategoria && (
                        <button
                          type="button"
                          onClick={() => setBusquedaCategoria('')}
                          style={{
                            position: 'absolute',
                            right: '0.75rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            fontSize: '1.2rem',
                            lineHeight: 1,
                            padding: '0.2rem'
                          }}
                        >
                          &times;
                        </button>
                      )}
                    </div>

                    {listaCategorias.length === 0 ? (
                      <p className="empty-catalog" style={{ marginTop: '1rem' }}>No hay categorías registradas.</p>
                    ) : listaCategorias.filter(cat => cat.nombre.toLowerCase().includes(busquedaCategoria.toLowerCase())).length === 0 ? (
                      <p className="empty-catalog" style={{ marginTop: '1rem', fontStyle: 'italic' }}>No se encontraron categorías que coincidan con la búsqueda.</p>
                    ) : (
                      <div className="admin-categories-mini-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {listaCategorias
                          .filter(cat => cat.nombre.toLowerCase().includes(busquedaCategoria.toLowerCase()))
                          .map((cat) => (
                          <div 
                            key={cat.id} 
                            className={`admin-category-item ${selectedCatForProducts?.id === cat.id ? 'active' : ''}`}
                            onClick={() => {
                              setSelectedCatForProducts(cat);
                              setCatProductView('list');
                              setProdSuccess('');
                              setProdError('');
                              setBusquedaProductoEnCat('');
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
                        onClick={iniciarNuevaPromo}
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
                            setPromoAplicaEnvase('no');
                            setPromoCantidadEnvases(1);
                            setPromoToparPrecioIndividual(false);
                            setPromoMostrarNombreTicket(true);
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

                      <form onSubmit={handleSavePromo} className="admin-form" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '0.5rem' }}>
                        
                        {/* Datos Generales */}
                        <div style={{ background: 'rgba(255,255,255,0.01)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>🏷️ Datos Generales de la Promoción</h4>
                          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                              <label className="form-label">Nombre de la Promoción</label>
                              <input
                                type="text"
                                className="form-input"
                                placeholder="Ej. Promo Burger + Papas"
                                value={promoNombre}
                                onChange={(e) => setPromoNombre(e.target.value)}
                              />
                            </div>
                            <div className="form-group">
                              <label className="form-label">Precio ($)</label>
                              <input
                                type="number"
                                className="form-input"
                                placeholder="Ej: 5990"
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
                                <option value="🍅">🍅 Tomate</option>
                                <option value="🥑">🥑 Palta</option>
                                <option value="🌶️">🌶️ Ají</option>
                                <option value="🥩">🥩 Carne</option>
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
                        </div>

                        {/* Productos Fijos Incluidos */}
                        <div style={{ 
                          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.02) 100%)', 
                          padding: '1.25rem', 
                          borderRadius: '14px', 
                          border: '1px solid rgba(16, 185, 129, 0.25)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.85rem'
                        }}>
                          <div>
                            <label className="form-label" style={{ marginBottom: 0, fontWeight: '700', color: '#10b981' }}>📌 Productos Fijos Incluidos</label>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Productos obligatorios que vienen con la promoción y se descuentan del stock al vender.</p>
                          </div>

                          {promoProductosFijos.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '0.5rem' }}>
                              {promoProductosFijos.map((pf) => (
                                <div key={pf.producto_id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'var(--item-bg)', padding: '0.4rem 0.75rem', borderRadius: '10px', fontSize: '0.85rem', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                                  <span style={{ background: '#10b981', color: 'white', padding: '0.1rem 0.45rem', borderRadius: '6px', fontWeight: 'bold' }}>{pf.cantidad}x</span>
                                  <span>{pf.nombre_producto}</span>
                                  <button type="button" onClick={() => eliminarProductoFijoPromoForm(pf.producto_id)} style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', padding: 0, fontSize: '1.1rem' }}>&times;</button>
                                </div>
                              ))}
                            </div>
                          )}

                          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                            <div style={{ flex: 1 }}>
                              <SearchableProductSelect
                                placeholder="-- Buscar o Seleccionar Producto Fijo --"
                                options={productos.map(p => ({
                                  value: p.id,
                                  label: `${p.nombre} ($${parseFloat(p.precio).toLocaleString('es-CL')})`
                                }))}
                                value={selectedFixedProdId}
                                onChange={(val) => setSelectedFixedProdId(val)}
                              />
                            </div>
                            <input type="number" className="form-input" placeholder="Cant" defaultValue="1" min="1" style={{ width: '65px', height: '38px', fontSize: '0.85rem', textAlign: 'center' }} id="cant-fixed-product" />
                            <button type="button" className="btn-secondary" style={{ height: '38px', fontSize: '0.85rem' }} onClick={() => {
                              const cant = document.getElementById('cant-fixed-product');
                              if (selectedFixedProdId) {
                                agregarProductoFijoPromoForm(selectedFixedProdId, cant ? cant.value || 1 : 1);
                                setSelectedFixedProdId('');
                                if (cant) cant.value = "1";
                              }
                            }}>➕ Incluir</button>
                          </div>
                        </div>

                        {/* Pasos de Selección (Opciones a Elección) */}
                        <div style={{ 
                          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(109, 40, 217, 0.02) 100%)', 
                          padding: '1.25rem', 
                          borderRadius: '14px', 
                          border: '1px solid rgba(139, 92, 246, 0.25)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.85rem'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <div>
                              <label className="form-label" style={{ marginBottom: 0, fontWeight: '700', color: '#a78bfa' }}>🎁 Pasos de Selección (Opciones a Elección)</label>
                              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Pasos interactivos donde el cajero debe seleccionar una opción al vender.</p>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button type="button" className="btn-secondary" onClick={() => setShowGenCatSection(!showGenCatSection)} style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem', border: '1px solid rgba(139, 92, 246, 0.4)' }}>
                                ⚡ Generar desde Categoría
                              </button>
                              <button type="button" className="btn-secondary" onClick={agregarPasoPromoForm} style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}>
                                ➕ Agregar Paso Manual
                              </button>
                            </div>
                          </div>

                          {/* Sección rápida de generación por categoría */}
                          {showGenCatSection && (
                            <div style={{ 
                              background: 'rgba(139, 92, 246, 0.1)', 
                              border: '1px solid rgba(139, 92, 246, 0.3)', 
                              borderRadius: '10px', 
                              padding: '1rem',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.75rem'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <strong style={{ fontSize: '0.85rem', color: '#c4b5fd' }}>⚡ Generar Pasos Automáticamente</strong>
                                <button type="button" onClick={() => setShowGenCatSection(false)} style={{ border: 'none', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}>&times;</button>
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '0.75rem', alignItems: 'center' }}>
                                <select 
                                  className="form-input form-select" 
                                  value={genCatSelected} 
                                  onChange={(e) => setGenCatSelected(e.target.value)}
                                  style={{ height: '38px', fontSize: '0.85rem' }}
                                >
                                  <option value="" disabled>-- Selecciona Categoría (Ej: Bebida) --</option>
                                  {listaCategorias.map(c => (
                                    <option key={c.id} value={c.nombre}>{c.emoji || '📁'} {c.nombre}</option>
                                  ))}
                                </select>
                                <input 
                                  type="number" 
                                  className="form-input" 
                                  placeholder="Cant. Pasos" 
                                  value={genCatCantidad} 
                                  onChange={(e) => setGenCatCantidad(parseInt(e.target.value) || 1)}
                                  min="1" 
                                  style={{ height: '38px', fontSize: '0.85rem', textAlign: 'center' }} 
                                />
                                <button type="button" className="btn-primary" onClick={generarPasosDesdeCategoria} style={{ height: '38px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                                  Generar
                                </button>
                              </div>
                              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                💡 Genera la cantidad de pasos indicada con los productos de la categoría elegida, autocalculando la diferencia adicional según el precio de moda.
                              </p>
                            </div>
                          )}

                          {promoPasos.length === 0 ? (
                            <p style={{ fontSize: '0.85rem', fontStyle: 'italic', color: 'var(--text-secondary)', textAlign: 'center', padding: '1.5rem', border: '1px dashed rgba(255,255,255,0.05)', borderRadius: '8px', margin: 0 }}>
                              No hay pasos de selección agregados aún. La promoción consistirá únicamente en los productos fijos.
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
                                      <input 
                                        type="text" 
                                        className="form-input" 
                                        placeholder="Nombre del Paso (Ej. Elige tu Bebida)" 
                                        style={{ flex: 1, height: '32px', fontSize: '0.85rem' }} 
                                        value={paso.nombre_paso} 
                                        onChange={(e) => actualizarNombrePasoForm(idKey, isReal, e.target.value)} 
                                      />
                                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none', color: 'var(--text-secondary)' }}>
                                        <input 
                                          type="checkbox" 
                                          checked={paso.obligatorio !== false} 
                                          onChange={(e) => actualizarObligatorioPasoForm(idKey, isReal, e.target.checked)} 
                                        />
                                        Obligatorio
                                      </label>
                                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none', color: 'var(--text-secondary)' }}>
                                        <input 
                                          type="checkbox" 
                                          checked={paso.autocalcular === true || paso.autocalcular === 1 || paso.autocalcular === 'true'} 
                                          onChange={(e) => toggleAutocalcularPasoForm(idKey, isReal, e.target.checked)} 
                                        />
                                        ⚡ Autocalcular
                                      </label>
                                      <button type="button" onClick={() => eliminarPasoPromoForm(idKey, isReal)} style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.3rem 0.5rem', borderRadius: '4px' }}>🗑️</button>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Productos Opcionales en este Paso:</span>
                                        
                                        {/* Importar categoría completa a este paso */}
                                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                          <select 
                                            className="form-input form-select" 
                                            defaultValue="" 
                                            style={{ height: '24px', fontSize: '0.75rem', padding: '0 0.5rem', width: '130px' }} 
                                            id={`import-cat-${idKey}`}
                                          >
                                            <option value="" disabled>-- Cargar Cat. --</option>
                                            {listaCategorias.map(c => (
                                              <option key={c.id} value={c.nombre}>{c.nombre}</option>
                                            ))}
                                          </select>
                                          <button 
                                            type="button" 
                                            className="btn-secondary" 
                                            style={{ height: '24px', fontSize: '0.75rem', padding: '0 0.5rem' }}
                                            onClick={() => {
                                              const sel = document.getElementById(`import-cat-${idKey}`);
                                              if (sel && sel.value) {
                                                importarCategoriaAlPasoForm(idKey, isReal, sel.value);
                                                sel.value = "";
                                              }
                                            }}
                                          >
                                            Cargar
                                          </button>
                                        </div>
                                      </div>

                                      {(paso.autocalcular === false || paso.autocalcular === 0 || paso.autocalcular === 'false') && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.35rem 0.6rem', borderRadius: '6px', fontSize: '0.78rem', margin: '0.2rem 0', border: '1px dashed rgba(255,255,255,0.1)' }}>
                                          <span style={{ color: '#a78bfa', fontWeight: '600' }}>💲 Precio Base Manual:</span>
                                          <input 
                                            type="number" 
                                            className="form-input" 
                                            placeholder="Ej. 1500" 
                                            id={`base-manual-${idKey}`}
                                            defaultValue={paso.precio_base_manual || ''}
                                            style={{ width: '85px', height: '26px', fontSize: '0.75rem', textAlign: 'center', padding: '0 0.3rem' }}
                                          />
                                          <button 
                                            type="button" 
                                            className="btn-secondary" 
                                            style={{ height: '26px', fontSize: '0.72rem', padding: '0 0.5rem', whiteSpace: 'nowrap' }}
                                            onClick={() => {
                                              const inp = document.getElementById(`base-manual-${idKey}`);
                                              if (inp && inp.value !== '') {
                                                aplicarBaseManualPasoForm(idKey, isReal, inp.value);
                                              }
                                            }}
                                          >
                                            🎯 Aplicar a Opciones
                                          </button>
                                        </div>
                                      )}

                                      {paso.opciones.length === 0 ? (
                                        <p style={{ fontSize: '0.8rem', fontStyle: 'italic', color: 'var(--text-muted)', margin: '0.25rem 0' }}>No hay opciones agregadas aún.</p>
                                      ) : (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', margin: '0.25rem 0' }}>
                                          {paso.opciones.map(opc => (
                                            <div key={opc.producto_id} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.8rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                              <span>{opc.nombre_producto}</span>
                                              {(paso.autocalcular === true || paso.autocalcular === 1 || paso.autocalcular === 'true') ? (
                                                parseFloat(opc.precio_adicional) > 0 && (
                                                  <span style={{ color: '#a78bfa', fontSize: '0.75rem', fontWeight: '600' }}>(+${parseFloat(opc.precio_adicional)})</span>
                                                )
                                              ) : (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', marginLeft: '0.25rem' }}>
                                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>+$</span>
                                                  <input 
                                                    type="number" 
                                                    style={{ 
                                                      width: '55px', 
                                                      height: '20px', 
                                                      fontSize: '0.75rem', 
                                                      background: 'rgba(0,0,0,0.3)', 
                                                      border: '1px solid rgba(255,255,255,0.15)', 
                                                      color: 'var(--text-primary)', 
                                                      borderRadius: '4px',
                                                      textAlign: 'center',
                                                      padding: '0 0.2rem'
                                                    }}
                                                    value={opc.precio_adicional}
                                                    onChange={(e) => actualizarPrecioAdicionalOpcionForm(idKey, isReal, opc.producto_id, e.target.value)}
                                                  />
                                                  <button 
                                                    type="button"
                                                    title="Fijar sin recargo adicional ($0 extra)"
                                                    style={{ 
                                                      border: 'none', 
                                                      background: parseFloat(opc.precio_adicional) === 0 ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255,255,255,0.08)', 
                                                      color: parseFloat(opc.precio_adicional) === 0 ? '#10b981' : 'var(--text-secondary)', 
                                                      cursor: 'pointer', 
                                                      padding: '0.1rem 0.3rem', 
                                                      borderRadius: '3px', 
                                                      fontSize: '0.7rem', 
                                                      fontWeight: 'bold' 
                                                    }}
                                                    onClick={() => fijarSinExtraOpcionForm(idKey, isReal, opc.producto_id)}
                                                  >
                                                    =$0
                                                  </button>
                                                </div>
                                              )}
                                              <button type="button" onClick={() => eliminarOpcionDelPasoForm(idKey, isReal, opc.producto_id)} style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', padding: 0, fontSize: '0.95rem', marginLeft: '0.15rem' }}>&times;</button>
                                            </div>
                                          ))}
                                        </div>
                                      )}

                                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 95px auto', gap: '0.5rem', marginTop: '0.5rem', alignItems: 'center' }}>
                                        <div style={{ flex: 1 }}>
                                          <SearchableProductSelect
                                            placeholder="-- Buscar o Seleccionar Opción --"
                                            options={productos.map(p => ({
                                              value: p.id,
                                              label: `${p.nombre} ($${parseFloat(p.precio).toLocaleString('es-CL')})`
                                            }))}
                                            value={selectedStepProds[idKey] || ''}
                                            onChange={(val) => setSelectedStepProds(prev => ({ ...prev, [idKey]: val }))}
                                          />
                                        </div>
                                        <input 
                                          type="number" 
                                          className="form-input" 
                                          placeholder="Extra $" 
                                          disabled={paso.autocalcular === true || paso.autocalcular === 1 || paso.autocalcular === 'true'}
                                          style={{ height: '38px', fontSize: '0.85rem', textAlign: 'center', width: '100%' }} 
                                          id={`extra-price-${idKey}`} 
                                        />
                                        <button 
                                          type="button" 
                                          className="btn-primary" 
                                          style={{ height: '38px', padding: '0 1.1rem', fontSize: '0.85rem', width: 'auto', whiteSpace: 'nowrap' }} 
                                          onClick={() => {
                                            const val = selectedStepProds[idKey];
                                            const extra = document.getElementById(`extra-price-${idKey}`);
                                            if (val) {
                                              agregarOpcionAlPasoForm(idKey, isReal, val, extra ? extra.value : 0);
                                              setSelectedStepProds(prev => ({ ...prev, [idKey]: '' }));
                                              if (extra) extra.value = "";
                                            }
                                          }}
                                        >
                                          + Añadir
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Cobro de Envase para Llevar */}
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

                        {/* Protección / Techo de Precio Individual */}
                        <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.85rem', borderRadius: '12px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <input
                              type="checkbox"
                              id="promoToparPrecioCheck"
                              checked={promoToparPrecioIndividual}
                              onChange={(e) => setPromoToparPrecioIndividual(e.target.checked)}
                              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                            />
                            <label htmlFor="promoToparPrecioCheck" style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--text-primary)', cursor: 'pointer' }}>
                              🛡️ Proteger precio (No cobrar más que compra individual)
                            </label>
                          </div>
                          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', paddingLeft: '1.8rem' }}>
                            Si se activa: Si la suma de productos elegidos cuesta menos por separado (ej. Vienesa sola), se cobrará el valor menor. Si se desactiva (ej. Promo 2 Churrascos), se cobrará el precio fijo de la promoción.
                          </p>
                        </div>

                        {/* Configuración de Nombre en Ticket */}
                        <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.85rem', borderRadius: '12px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <input
                              type="checkbox"
                              id="promoMostrarNombreTicketCheck"
                              checked={promoMostrarNombreTicket}
                              onChange={(e) => setPromoMostrarNombreTicket(e.target.checked)}
                              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                            />
                            <label htmlFor="promoMostrarNombreTicketCheck" style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--text-primary)', cursor: 'pointer' }}>
                              🧾 Mostrar nombre de la promoción en el ticket
                            </label>
                          </div>
                          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', paddingLeft: '1.8rem' }}>
                            Si está desmarcado: En el ticket se omitirá el título de la promoción y solo se detallarán los productos contenidos con el precio de la oferta (ej. 1x Luco, 1x Italiano - $6.900).
                          </p>
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

                  {/* Buscador de Promociones */}
                  <div style={{ position: 'relative', margin: '0.5rem 1rem 0.75rem 1rem' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="🔍 Buscar promoción..."
                      value={busquedaPromo}
                      onChange={(e) => setBusquedaPromo(e.target.value)}
                      style={{
                        width: '100%',
                        height: '38px',
                        paddingLeft: '2.5rem',
                        borderRadius: '12px',
                        border: '1px solid var(--glass-border)',
                        boxSizing: 'border-box'
                      }}
                    />
                    {busquedaPromo && (
                      <button
                        type="button"
                        onClick={() => setBusquedaPromo('')}
                        style={{
                          position: 'absolute',
                          right: '0.75rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          fontSize: '1.2rem',
                          lineHeight: 1,
                          padding: '0.2rem'
                        }}
                      >
                        &times;
                      </button>
                    )}
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
                    <>
                      {promociones.filter(p => p.nombre.toLowerCase().includes(busquedaPromo.toLowerCase())).length === 0 ? (
                        <p className="empty-catalog" style={{ textAlign: 'center', marginTop: '3rem', fontStyle: 'italic' }}>
                          No se encontraron promociones que coincidan con la búsqueda.
                        </p>
                      ) : (
                        <div className="users-list-container" style={{ flex: 1, overflowY: 'auto', marginTop: '0.5rem' }}>
                          {promociones
                            .filter(p => p.nombre.toLowerCase().includes(busquedaPromo.toLowerCase()))
                            .map((promo) => (
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
                    </>
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
                        if (filtroCliente && !(ped.cliente_nombre || '').toLowerCase().includes(filtroCliente.toLowerCase().trim())) {
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
                          {pedidosFiltrados.slice(0, visibleHistorialCount).map((ped) => (
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
                                  background: ped.tipo_entrega === 'Llevar' ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'rgba(16, 185, 129, 0.15)',
                                  border: ped.tipo_entrega === 'Llevar' ? '1px solid #b91c1c' : '1px solid rgba(16, 185, 129, 0.3)',
                                  color: ped.tipo_entrega === 'Llevar' ? '#ffffff' : (isDark ? '#a7f3d0' : '#047857'),
                                  fontSize: '0.78rem',
                                  fontWeight: '800',
                                  padding: '0.2rem 0.55rem',
                                  borderRadius: '6px',
                                  boxShadow: ped.tipo_entrega === 'Llevar' ? '0 2px 6px rgba(220, 38, 38, 0.3)' : 'none'
                                }}>
                                  {ped.tipo_entrega === 'Llevar' ? '🛍️ LLEVAR' : '🍽️ Servir'}
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
                                  {ped.tipo_transaccion === 'Pedido Externo'
                                    ? '🛵 Pedido Externo'
                                    : ped.tipo_transaccion === 'Mixto' 
                                      ? `🔀 Mixto ${ped.pago_mixto_detalle ? `(${ped.pago_mixto_detalle})` : ''}` 
                                      : (ped.tipo_transaccion || 'Efectivo')}
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
                                  {ped.tipo_transaccion === 'Pedido Externo'
                                    ? '🛵 Externo ($0)'
                                    : `$${parseFloat(ped.total).toLocaleString('es-CL', { minimumFractionDigits: 0 })}`}
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                  {formatFechaHoraChile(ped.fecha_hora)}
                                </span>
                                {subTabHistorial === 'activas' && (
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
                          {visibleHistorialCount < pedidosFiltrados.length && (
                            <button
                              type="button"
                              className="btn-secondary"
                              style={{ padding: '0.75rem', marginTop: '1rem', alignSelf: 'center', fontWeight: 'bold' }}
                              onClick={() => setVisibleHistorialCount(prev => prev + 50)}
                            >
                              Cargar más tickets
                            </button>
                          )}
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
                                const tDateIni = new Date(t.fecha_hora_inicio);
                                const yIni = tDateIni.getFullYear();
                                const mIni = String(tDateIni.getMonth() + 1).padStart(2, '0');
                                const dIni = String(tDateIni.getDate()).padStart(2, '0');
                                const dateIniStr = `${yIni}-${mIni}-${dIni}`;

                                let dateFinStr = '';
                                if (t.fecha_hora_fin) {
                                  const tDateFin = new Date(t.fecha_hora_fin);
                                  const yFin = tDateFin.getFullYear();
                                  const mFin = String(tDateFin.getMonth() + 1).padStart(2, '0');
                                  const dFin = String(tDateFin.getDate()).padStart(2, '0');
                                  dateFinStr = `${yFin}-${mFin}-${dFin}`;
                                }
                                
                                const todayStr = new Date().toISOString().split('T')[0];
                                return dateIniStr === fechaCierre || dateFinStr === fechaCierre || (Boolean(t.activo) && fechaCierre === todayStr);
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
                              <span>💵 Total Efectivo Ventas:</span>
                              <strong style={{ color: 'var(--success)' }}>+${cierreData.total_efectivo.toLocaleString('es-CL', { minimumFractionDigits: 0 })}</strong>
                            </div>
                            {(cierreData.total_gastos > 0) && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#ef4444' }}>
                                <span>💸 Total Gastos en Efectivo (-):</span>
                                <strong>-${(cierreData.total_gastos || 0).toLocaleString('es-CL', { minimumFractionDigits: 0 })}</strong>
                              </div>
                            )}
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

                          {/* MÓDULO DE GASTOS EN EFECTIVO */}
                          <div className="cierre-sub-card" style={{ border: '1px solid rgba(239, 68, 68, 0.25)', background: 'rgba(239, 68, 68, 0.03)' }}>
                            <h5 className="cierre-sub-card-title" style={{ color: '#ef4444', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span>💸 Registro de Gastos en Efectivo</span>
                              {cierreData.total_gastos > 0 && (
                                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', background: 'rgba(239, 68, 68, 0.15)', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                                  Total: -${(cierreData.total_gastos || 0).toLocaleString('es-CL')}
                                </span>
                              )}
                            </h5>

                            {/* Formulario para agregar gasto */}
                            <form onSubmit={handleAgregarGasto} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
                              <input
                                type="text"
                                className="form-input"
                                placeholder="Descripción (ej. Compra hielo)"
                                value={nuevoGastoDesc}
                                onChange={(e) => setNuevoGastoDesc(e.target.value)}
                                style={{ flex: '2', minWidth: '150px', height: '36px', fontSize: '0.85rem' }}
                              />
                              <input
                                type="number"
                                className="form-input"
                                placeholder="Monto ($)"
                                value={nuevoGastoMonto}
                                onChange={(e) => setNuevoGastoMonto(e.target.value)}
                                style={{ flex: '1', minWidth: '100px', height: '36px', fontSize: '0.85rem' }}
                              />
                              <button
                                type="submit"
                                className="btn-primary"
                                disabled={guardandoGasto}
                                style={{ height: '36px', padding: '0 0.85rem', fontSize: '0.82rem', whiteSpace: 'nowrap', background: '#ef4444', borderColor: '#dc2626' }}
                              >
                                {guardandoGasto ? 'Guardando...' : '➕ Registrar Gasto'}
                              </button>
                            </form>

                            {/* Listado de Gastos */}
                            {cierreData.gastos && cierreData.gastos.length > 0 ? (
                              <div className="cierre-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '180px', overflowY: 'auto' }}>
                                {cierreData.gastos.map((g) => (
                                  <div key={g.id} className="cierre-list-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.02)', padding: '0.4rem 0.6rem', borderRadius: '8px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                                      <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>{g.descripcion}</span>
                                      <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>Por: {g.registrado_por}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                      <strong style={{ color: '#ef4444', fontSize: '0.9rem' }}>
                                        -${(g.monto || 0).toLocaleString('es-CL')}
                                      </strong>
                                      <button
                                        type="button"
                                        onClick={() => handleEliminarGasto(g.id, g.descripcion)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', opacity: 0.8 }}
                                        title="Eliminar gasto"
                                      >
                                        🗑️
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="cierre-empty-text" style={{ fontSize: '0.82rem', margin: 0 }}>No hay gastos en efectivo registrados para esta fecha/turno.</p>
                            )}
                          </div>

                          {/* Desglose de Ventas y Consumo de Materia Prima (Junto al informe de ventas) */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                            {/* LISTA UNIFICADA DE PRODUCTOS VENDIDOS (Unidades Totales) */}
                            <div className="cierre-sub-card">
                              <h5 className="cierre-sub-card-title">🍔 Total de Productos Vendidos (Unidades)</h5>
                              {cierreData.productos_unificados && cierreData.productos_unificados.length > 0 ? (
                                <div className="cierre-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                                  {(() => {
                                    const groups = {};
                                    cierreData.productos_unificados.forEach(p => {
                                      const prod = productos.find(x => x.nombre.toLowerCase().trim() === p.nombre_producto.toLowerCase().trim());
                                      const cat = p.categoria || prod?.categoria || (p.nombre_producto === 'Envases para llevar' ? 'Envases' : 'Otros');
                                      if (!groups[cat]) groups[cat] = [];
                                      groups[cat].push({ ...p, categoria: cat });
                                    });

                                    const sortedCatNames = Object.keys(groups).sort((a, b) => {
                                      const idxA = listaCategorias.findIndex(c => c.nombre.toLowerCase().trim() === a.toLowerCase().trim());
                                      const idxB = listaCategorias.findIndex(c => c.nombre.toLowerCase().trim() === b.toLowerCase().trim());
                                      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                                      if (idxA !== -1) return -1;
                                      if (idxB !== -1) return 1;
                                      return a.localeCompare(b);
                                    });

                                    return sortedCatNames.map((catName, cIdx) => {
                                      const catObj = listaCategorias.find(c => c.nombre.toLowerCase().trim() === catName.toLowerCase().trim());
                                      const catTotal = groups[catName].reduce((acc, curr) => acc + (curr.cantidad_total || 0), 0);
                                      return (
                                        <div key={cIdx} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', background: 'rgba(255, 255, 255, 0.02)', padding: '0.55rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed rgba(255, 255, 255, 0.1)', paddingBottom: '0.3rem', marginBottom: '0.2rem' }}>
                                            <span style={{ fontWeight: '700', fontSize: '0.85rem', color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
                                              {catObj?.emoji || '🏷️'} {catName}
                                            </span>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
                                              {catTotal} un.
                                            </span>
                                          </div>
                                          {groups[catName].map((p, idx) => (
                                            <div key={idx} className="cierre-list-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.2rem 0' }}>
                                              <span className="cierre-item-name" style={{ flex: 1, fontSize: '0.88rem' }}>{p.nombre_producto}</span>
                                              {p.cantidad_directa > 0 && p.cantidad_promo > 0 && (
                                                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginRight: '0.75rem' }}>
                                                  ({p.cantidad_directa} indiv. + {p.cantidad_promo} promo)
                                                </span>
                                              )}
                                              <strong className="cierre-item-qty" style={{ color: 'var(--accent-primary)', fontSize: '0.9rem' }}>
                                                {p.cantidad_total} un.
                                              </strong>
                                            </div>
                                          ))}
                                        </div>
                                      );
                                    });
                                  })()}
                                  <div className="cierre-list-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px dashed var(--accent-primary)', paddingTop: '0.65rem', marginTop: '0.3rem', background: 'rgba(255, 255, 255, 0.06)', fontWeight: 'bold' }}>
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

                            {/* Llegada de Mercadería (Entradas de Inventario) */}
                            <div className="cierre-sub-card">
                              <h5 className="cierre-sub-card-title" style={{ color: 'var(--success, #10b981)' }}>
                                📥 Llegada de Mercadería (Entradas)
                              </h5>
                              {cierreData.entradas_inventario && cierreData.entradas_inventario.length > 0 ? (
                                <div className="cierre-list">
                                  {cierreData.entradas_inventario.map((item, idx) => (
                                    <div key={idx} className="cierre-list-item">
                                      <span className="cierre-item-name">{item.ingrediente_nombre}</span>
                                      <strong className="cierre-item-qty" style={{ color: 'var(--success, #10b981)' }}>
                                        +{parseFloat(item.cantidad_total).toLocaleString('es-CL', { maximumFractionDigits: 2 })} {item.unidad || ''}
                                      </strong>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="cierre-empty-text">No hay entradas de mercadería registradas para esta fecha/turno.</p>
                              )}
                            </div>

                            {/* Registro de Mermas / Consumo Interno */}
                            <div className="cierre-sub-card">
                              <h5 className="cierre-sub-card-title" style={{ color: '#ef4444' }}>
                                ⚠️ Registro de Mermas y Desperdicios
                              </h5>
                              {cierreData.mermas_inventario && cierreData.mermas_inventario.length > 0 ? (
                                <div className="cierre-list">
                                  {cierreData.mermas_inventario.map((item, idx) => (
                                    <div key={idx} className="cierre-list-item">
                                      <span className="cierre-item-name">{item.ingrediente_nombre}</span>
                                      <strong className="cierre-item-qty" style={{ color: '#ef4444' }}>
                                        -{parseFloat(item.cantidad_total).toLocaleString('es-CL', { maximumFractionDigits: 2 })} {item.unidad || ''}
                                      </strong>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="cierre-empty-text">No hay mermas registradas para esta fecha/turno.</p>
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
                                  Desde: {formatFechaHoraChile(activeShift.fecha_hora_inicio)}
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
                                        {formatFechaHoraChile(t.fecha_hora_inicio)}
                                      </span><br />
                                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                        💵 Inicial: <strong>${(t.efectivo_inicial || 0).toLocaleString('es-CL')}</strong>
                                      </span>
                                    </div>
                                    <div>
                                      🔒 <strong>Cierre:</strong> {t.usuario_fin || (t.activo ? '—' : 'Auto')}<br />
                                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        {t.fecha_hora_fin ? formatFechaHoraChile(t.fecha_hora_fin) : 'En curso'}
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
                                    {t.total_gastos > 0 && (
                                      <span style={{ color: '#ef4444' }}>💸 Gastos: <strong>-${t.total_gastos.toLocaleString('es-CL')}</strong></span>
                                    )}
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
                  <div className="admin-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <h3 className="section-title">⚙️ Configuraciones de la Aplicación</h3>
                      <p className="section-subtitle">Gestiona las opciones de impresión, datos del local, impuestos, stock y correos</p>
                    </div>
                    {user?.cargo?.toLowerCase() === 'administrador' && (
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => guardarConfiguracion()}
                        disabled={configLoading}
                        style={{ height: '38px', padding: '0 1.5rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}
                      >
                        {configLoading ? 'Guardando...' : '💾 Guardar Todo'}
                      </button>
                    )}
                  </div>

                  {configSuccess && (
                    <div className="alert alert-success" style={{ margin: '0 0 1rem 0', padding: '0.6rem 1rem', fontSize: '0.9rem' }}>
                      <span>{configSuccess}</span>
                    </div>
                  )}
                  {configError && (
                    <div className="alert alert-error" style={{ margin: '0 0 1rem 0', padding: '0.6rem 1rem', fontSize: '0.9rem' }}>
                      <span>{configError}</span>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: user?.cargo?.toLowerCase() === 'administrador' ? '1fr 1fr' : '1fr', gap: '2rem', flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: '0.25rem', paddingBottom: '1rem' }}>
                    
                    {/* Columna Izquierda: Operación, Impuestos, Escala y Envases */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      
                      {/* Configuración de Resolución de Pantalla */}
                      <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--modal-bg, #231209)', borderRadius: '20px', padding: '1.25rem', border: '1.5px solid var(--accent-primary)', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          📺 Resolución de Pantalla y Adaptación Visual
                        </h4>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                          Selecciona la resolución de tu computador para que la interfaz se adapte perfectamente a toda la pantalla sin dejar espacios en blanco ni elementos gigantes.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Seleccionar Resolución Predeterminada</label>
                            <select
                              value={appResolucion}
                              onChange={(e) => setAppResolucion(e.target.value)}
                              className="form-input"
                              style={{
                                padding: '0.65rem 1rem',
                                fontSize: '0.95rem',
                                fontWeight: '700',
                                height: '44px',
                                color: 'var(--text-primary)',
                                background: 'var(--input-bg)',
                                border: '1.5px solid var(--accent-primary)',
                                borderRadius: '12px',
                                width: '100%',
                                cursor: 'pointer'
                              }}
                            >
                              {RESOLUCIONES_PANTALLA.map(res => (
                                <option key={res.id} value={res.id}>
                                  {res.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Tarjetas selectoras de resolución */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem', marginTop: '0.25rem' }}>
                            {RESOLUCIONES_PANTALLA.map(res => (
                              <button
                                key={res.id}
                                type="button"
                                onClick={() => setAppResolucion(res.id)}
                                style={{
                                  padding: '0.65rem 0.5rem',
                                  fontSize: '0.8rem',
                                  fontWeight: '700',
                                  borderRadius: '12px',
                                  cursor: 'pointer',
                                  textAlign: 'center',
                                  border: appResolucion === res.id ? '1.5px solid var(--accent-primary)' : '1px solid var(--glass-border)',
                                  background: appResolucion === res.id ? 'linear-gradient(135deg, var(--accent-primary) 0%, #ef4444 100%)' : 'var(--item-bg)',
                                  color: appResolucion === res.id ? '#ffffff' : 'var(--text-primary)',
                                  boxShadow: appResolucion === res.id ? '0 4px 12px var(--accent-glow)' : 'none',
                                  transition: 'all 0.2s ease',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  gap: '0.2rem'
                                }}
                              >
                                <span>{res.id === '1366x768' ? '💻 1366x768' : res.id === '1280x720' ? '💻 1280x720' : res.id === '1600x900' ? '🖥️ 1600x900' : res.id === '1920x1080' ? '🖥️ 1920x1080' : res.id === '2560x1440' ? '🖥️ 2560x1440' : '🔄 Auto'}</span>
                                <span style={{ fontSize: '0.7rem', opacity: appResolucion === res.id ? 0.95 : 0.7 }}>
                                  {res.id === '1366x768' ? 'Laptop HD (Ideal)' : res.id === '1280x720' ? 'Compacto 720p' : res.id === '1600x900' ? 'Estándar HD+' : res.id === '1920x1080' ? 'Full HD 1080p' : res.id === '2560x1440' ? 'Monitor 2K' : 'Automático'}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      {/* Impresora (si aplica) */}
                      {window.electronAPI && (
                        <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '16px', padding: '1.25rem', border: '1px solid var(--glass-border)' }}>
                          <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            🖨️ Impresora de Comandas
                          </h4>
                          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                            Selecciona la impresora que se utilizará para imprimir automáticamente las comandas de cocina y reportes.
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
                                  {p.name} {p.isDefault ? '(Predeterminada)' : ''}
                                </option>
                              ))}
                            </select>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                              Impresora configurada actualmente: <strong>{selectedPrinter || 'Predeterminada del Sistema'}</strong>
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Gestión de Base de Datos Local SQLite */}
                      {window.electronAPI && (
                        <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--modal-bg, #231209)', borderRadius: '16px', padding: '1.25rem', border: '1.5px solid var(--accent-primary)', boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }}>
                          <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            💾 Base de Datos del Sistema (SQLite)
                          </h4>
                          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                            Abre directamente la carpeta donde reside tu archivo <code>database.sqlite</code> para hacer respaldos, copias de seguridad o gestionar la información.
                          </p>
                          <button
                            type="button"
                            className="btn-primary"
                            onClick={async () => {
                              try {
                                if (window.electronAPI && typeof window.electronAPI.openDbFolder === 'function') {
                                  const res = await window.electronAPI.openDbFolder();
                                  if (!res?.success && res?.error) {
                                    alert('Error abriendo carpeta: ' + res.error);
                                  }
                                }
                              } catch (e) {
                                console.error(e);
                              }
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.6rem',
                              padding: '0.75rem 1.25rem',
                              fontSize: '0.9rem',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              borderRadius: '10px'
                            }}
                          >
                            <span>📂</span> Abrir Carpeta de la Base de Datos
                          </button>
                        </div>
                      )}

                      {/* Envase para Llevar */}
                      {user?.cargo?.toLowerCase() === 'administrador' && (
                        <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '16px', padding: '1.25rem', border: '1px solid var(--glass-border)' }}>
                          <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            📦 Precio del Envase para Llevar
                          </h4>
                          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
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
                                  setPrecioEnvase(val === '' ? '' : parseInt(val.toString().replace(/\D/g, ''), 10) || 0);
                                }}
                                onBlur={() => setPrecioEnvase(parseInt(precioEnvase.toString().replace(/\D/g, ''), 10) || 0)}
                                style={{ height: '38px', fontSize: '0.95rem', paddingLeft: '2.2rem', paddingRight: '0.75rem', width: '100%', boxSizing: 'border-box', color: 'var(--text-primary)' }}
                              />
                              <span className="input-icon" style={{ left: '0.75rem' }}>💲</span>
                            </div>
                            <button
                              type="button"
                              className="btn-secondary"
                              style={{ height: '38px', padding: '0 1rem', fontSize: '0.85rem' }}
                              onClick={() => guardarConfiguracion()}
                              disabled={configLoading}
                            >
                              Guardar Precio
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Alerta de Stock Bajo (Umbral) */}
                      {user?.cargo?.toLowerCase() === 'administrador' && (
                        <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '16px', padding: '1.25rem', border: '1px solid var(--glass-border)' }}>
                          <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            ⚠️ Alerta de Stock Bajo
                          </h4>
                          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                            Define el umbral global de stock (en gramos o unidades). Si el stock disponible es menor o igual a este valor, se mostrará una advertencia ⚠️ en la lista.
                          </p>
                          <div style={{ position: 'relative', width: '100%' }}>
                            <input
                              type="number"
                              min="0"
                              className="form-input"
                              placeholder="50"
                              value={umbralStockBajo}
                              onChange={(e) => setUmbralStockBajo(parseInt(e.target.value, 10) || 0)}
                              style={{ height: '38px', fontSize: '0.95rem', paddingLeft: '2.2rem', color: 'var(--text-primary)', width: '100%', boxSizing: 'border-box' }}
                            />
                            <span className="input-icon" style={{ left: '0.75rem' }}>📉</span>
                          </div>
                        </div>
                      )}

                      {/* Configuración de Impuestos */}
                      {user?.cargo?.toLowerCase() === 'administrador' && (
                        <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '16px', padding: '1.25rem', border: '1px solid var(--glass-border)' }}>
                          <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            ⚖️ Configuración de Impuestos (IVA)
                          </h4>
                          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                            Configura la tasa de impuesto para los reportes de ventas y la visualización de los tickets.
                          </p>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Porcentaje de IVA (%)</label>
                              <div style={{ position: 'relative', width: '100%' }}>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.1"
                                  className="form-input"
                                  placeholder="19"
                                  value={impuestoIvaPorcentaje}
                                  onChange={(e) => setImpuestoIvaPorcentaje(parseFloat(e.target.value) || 0)}
                                  style={{ height: '38px', fontSize: '0.95rem', paddingLeft: '2.2rem', color: 'var(--text-primary)', width: '100%', boxSizing: 'border-box' }}
                                />
                                <span className="input-icon" style={{ left: '0.75rem' }}>%</span>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                              <input
                                type="checkbox"
                                id="chkImpuestoIncluido"
                                checked={impuestoIncluido}
                                onChange={(e) => setImpuestoIncluido(e.target.checked)}
                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                              />
                              <label htmlFor="chkImpuestoIncluido" style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '600', cursor: 'pointer' }}>
                                Precios del POS ya incluyen el IVA (Impuesto Incluido)
                              </label>
                            </div>
                          </div>
                        </div>
                      )}

                    </div>

                    {/* Columna Derecha: Datos del Local y Correo de Reportes */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      
                      {/* Datos del Local */}
                      {user?.cargo?.toLowerCase() === 'administrador' && (
                        <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '16px', padding: '1.25rem', border: '1px solid var(--glass-border)' }}>
                          <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            🏢 Datos del Local
                          </h4>
                          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                            Ingresa la información comercial del local que se mostrará en los tickets comandas y en la plataforma.
                          </p>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Nombre Comercial</label>
                              <input
                                type="text"
                                className="form-input"
                                placeholder="Ej: Calibre 25"
                                value={localNombre}
                                onChange={(e) => setLocalNombre(e.target.value)}
                                style={{ height: '38px', color: 'var(--text-primary)' }}
                              />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Dirección del Establecimiento</label>
                              <input
                                type="text"
                                className="form-input"
                                placeholder="Ej: Av. Principal 1234, Santiago"
                                value={localDireccion}
                                onChange={(e) => setLocalDireccion(e.target.value)}
                                style={{ height: '38px', color: 'var(--text-primary)' }}
                              />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Teléfono / Contacto</label>
                              <input
                                type="text"
                                className="form-input"
                                placeholder="Ej: +56 9 1234 5678"
                                value={localTelefono}
                                onChange={(e) => setLocalTelefono(e.target.value)}
                                style={{ height: '38px', color: 'var(--text-primary)' }}
                              />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Mensaje de Pie de Ticket</label>
                              <textarea
                                className="form-input"
                                placeholder="Ej: Gracias por su preferencia"
                                value={localPieTicket}
                                onChange={(e) => setLocalPieTicket(e.target.value)}
                                style={{ height: '80px', color: 'var(--text-primary)', resize: 'vertical', padding: '0.5rem 1rem' }}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Correo de Recepción de Reportes */}
                      {user?.cargo?.toLowerCase() === 'administrador' && (
                        <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '16px', padding: '1.25rem', border: '1px solid var(--glass-border)' }}>
                          <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            📬 Correo de Recepción de Reportes
                          </h4>
                          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                            Ingresa el correo destinatario que recibirá los reportes de inventario y cierres de caja.
                          </p>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Correo Destinatario</label>
                              <input
                                type="email"
                                className="form-input"
                                placeholder="ejemplo@correo.com"
                                value={configEmailTo}
                                onChange={(e) => setConfigEmailTo(e.target.value)}
                                style={{ height: '38px', color: 'var(--text-primary)' }}
                              />
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                              <button
                                type="button"
                                className="btn-secondary"
                                style={{ flex: 1, padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                                disabled={testEmailLoading}
                                onClick={async () => {
                                  try {
                                    setTestEmailLoading(true);
                                    setConfigSuccess('');
                                    setConfigError('');
                                    
                                    const config = {
                                      REPORT_EMAIL_TO: configEmailTo,
                                      REPORT_EMAIL_FROM: configSmtpUser,
                                      SMTP_HOST: configSmtpHost,
                                      SMTP_PORT: String(configSmtpPort),
                                      SMTP_SECURE: configSmtpSecure ? 'true' : 'false',
                                      SMTP_USER: configSmtpUser,
                                      SMTP_PASS: configSmtpPass
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
                                    setTestEmailLoading(false);
                                  }
                                }}
                              >
                                {testEmailLoading ? 'Enviando...' : '📧 Probar Envío'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Configuración Servidor SMTP */}
                      {user?.cargo?.toLowerCase() === 'administrador' && (
                        <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '16px', padding: '1.25rem', border: '1px solid var(--glass-border)', marginTop: '1rem' }}>
                          <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            ⚙️ Servidor de Salida de Correos (SMTP)
                          </h4>
                          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                            Configura las credenciales de tu proveedor de correo para permitir el envío automático de reportes.
                          </p>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Servidor SMTP</label>
                              <input
                                type="text"
                                className="form-input"
                                placeholder="smtp.gmail.com"
                                value={configSmtpHost}
                                onChange={(e) => setConfigSmtpHost(e.target.value)}
                                style={{ height: '38px', color: 'var(--text-primary)' }}
                              />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Puerto</label>
                              <input
                                type="text"
                                className="form-input"
                                placeholder="587"
                                value={configSmtpPort}
                                onChange={(e) => setConfigSmtpPort(e.target.value)}
                                style={{ height: '38px', color: 'var(--text-primary)' }}
                              />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Correo Emisor / Usuario</label>
                              <input
                                type="email"
                                className="form-input"
                                placeholder="tu-correo@gmail.com"
                                value={configSmtpUser}
                                onChange={(e) => setConfigSmtpUser(e.target.value)}
                                style={{ height: '38px', color: 'var(--text-primary)' }}
                              />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Contraseña de Aplicación</label>
                              <input
                                type="password"
                                className="form-input"
                                placeholder="••••••••••••••••"
                                value={configSmtpPass}
                                onChange={(e) => setConfigSmtpPass(e.target.value)}
                                style={{ height: '38px', color: 'var(--text-primary)' }}
                              />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', gridColumn: '1 / -1' }}>
                              <input
                                type="checkbox"
                                id="smtpSecure"
                                checked={configSmtpSecure}
                                onChange={(e) => setConfigSmtpSecure(e.target.checked)}
                              />
                              <label htmlFor="smtpSecure" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>Usar conexión segura (SSL/TLS para puerto 465)</label>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                            <button
                              type="button"
                              className="btn-secondary"
                              style={{ flex: 1, padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                              disabled={configLoading}
                              onClick={guardarConfiguracion}
                            >
                              {configLoading ? 'Guardando...' : 'Guardar Credenciales SMTP'}
                            </button>
                          </div>
                        </div>
                      )}

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
                                  Retroceder
                                </button>
                              </>
                            ) : (
                              <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={ingLoading}>
                                {ingLoading ? 'Registrando...' : 'Registrar Ingrediente'}
                              </button>
                            )}
                          </div>
                          {editandoIngId && (
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                              <button
                                type="button"
                                onClick={() => navegarEdicionIng('anterior')}
                                className="btn-secondary"
                                style={{ flex: 1, display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center' }}
                                disabled={ingLoading || getIngredientIndexInfo().isFirst}
                              >
                                ◀️ Anterior
                              </button>
                              <button
                                type="button"
                                onClick={() => navegarEdicionIng('siguiente')}
                                className="btn-secondary"
                                style={{ flex: 1, display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center' }}
                                disabled={ingLoading || getIngredientIndexInfo().isLast}
                              >
                                Siguiente ▶️
                              </button>
                            </div>
                          )}
                        </form>
                      </div>
                      )}

                      {/* Llegada de Materia Prima */}
                      <div style={{ background: 'var(--modal-bg, #231209)', borderRadius: '20px', padding: '1.25rem', border: '1.5px solid var(--accent-primary)', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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

                        <form onSubmit={handleLlegadaMateriaPrima} className="admin-form" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'visible' }}>
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
                                onFocus={(e) => {
                                  setLlegadaDropdownOpen(true);
                                  const target = e.target;
                                  setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
                                }}
                                onBlur={() => setTimeout(() => setLlegadaDropdownOpen(false), 250)}
                                style={{ color: 'var(--text-primary)', background: 'var(--input-bg)' }}
                              />
                              {llegadaDropdownOpen && (
                                <div style={{
                                  position: 'relative',
                                  width: '100%',
                                  zIndex: 100,
                                  background: 'var(--bg-secondary)',
                                  color: 'var(--text-primary)',
                                  border: '1.5px solid var(--accent-primary)',
                                  borderRadius: '12px',
                                  maxHeight: '200px',
                                  overflowY: 'auto',
                                  marginTop: '4px',
                                  boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
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
                      <div style={{ background: 'var(--modal-bg, #231209)', borderRadius: '20px', padding: '1.25rem', border: '1.5px solid #d97706', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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

                        <form onSubmit={handleConsumoMerma} className="admin-form" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'visible' }}>
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
                                onFocus={(e) => {
                                  setConsumoDropdownOpen(true);
                                  const target = e.target;
                                  setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
                                }}
                                onBlur={() => setTimeout(() => setConsumoDropdownOpen(false), 250)}
                                style={{ color: 'var(--text-primary)', background: 'var(--input-bg)' }}
                              />
                              {consumoDropdownOpen && (
                                <div style={{
                                  position: 'relative',
                                  width: '100%',
                                  zIndex: 100,
                                  background: 'var(--bg-secondary)',
                                  color: 'var(--text-primary)',
                                  border: '1.5px solid var(--accent-primary)',
                                  borderRadius: '12px',
                                  maxHeight: '200px',
                                  overflowY: 'auto',
                                  marginTop: '4px',
                                  boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
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

                      {/* Buscador de Ingredientes */}
                      <div style={{ position: 'relative', marginBottom: '1rem' }}>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="🔍 Buscar ingrediente..."
                          value={busquedaIngrediente}
                          onChange={(e) => setBusquedaIngrediente(e.target.value)}
                          style={{
                            width: '100%',
                            height: '38px',
                            paddingLeft: '2.5rem',
                            borderRadius: '12px',
                            border: '1px solid var(--glass-border)',
                            boxSizing: 'border-box'
                          }}
                        />
                        {busquedaIngrediente && (
                          <button
                            type="button"
                            onClick={() => setBusquedaIngrediente('')}
                            style={{
                              position: 'absolute',
                              right: '0.75rem',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-secondary)',
                              cursor: 'pointer',
                              fontSize: '1.2rem',
                              lineHeight: 1,
                              padding: '0.2rem'
                            }}
                          >
                            &times;
                          </button>
                        )}
                      </div>

                      {listaIngredientes.length === 0 ? (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <p style={{ color: 'var(--text-muted)' }}>No hay ingredientes en el inventario.</p>
                        </div>
                      ) : listaIngredientes.filter(ing => ing.nombre.toLowerCase().includes(busquedaIngrediente.toLowerCase())).length === 0 ? (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No se encontraron ingredientes que coincidan con la búsqueda.</p>
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
                              {listaIngredientes
                                .filter(ing => ing.nombre.toLowerCase().includes(busquedaIngrediente.toLowerCase()))
                                .map((ing) => {
                                  const stockNum = parseFloat(ing.stock);
                                  const isLowStock = stockNum <= parseFloat(umbralStockBajo); // alerta de stock bajo
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

            {activeTab === 'reportes' && (
              <ReportesErrorBoundary>
              <div className="admin-container animate-fade-in" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div className="admin-card full-width" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  
                  {/* Selector de Puntos / Sub-pestañas de Reportes */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button
                        type="button"
                        className={`nav-tab ${subTabReportes === 'metricas' ? 'active' : ''}`}
                        onClick={() => setSubTabReportes('metricas')}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1.1rem', fontSize: '0.9rem' }}
                      >
                        📈 Dashboard & Métricas
                      </button>
                      <button
                        type="button"
                        className={`nav-tab ${subTabReportes === 'impresion' ? 'active' : ''}`}
                        onClick={() => {
                          setSubTabReportes('impresion');
                          setFechaInicioImpresion(fechaInicioReporte);
                          setFechaFinImpresion(fechaFinReporte);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.45rem',
                          padding: '0.5rem 1.1rem',
                          fontSize: '0.9rem',
                          fontWeight: '700',
                          ...(subTabReportes === 'impresion' ? {
                            background: 'linear-gradient(135deg, var(--accent-primary) 0%, #d97706 100%)',
                            color: '#fff',
                            borderColor: 'transparent',
                            boxShadow: '0 2px 8px rgba(230, 81, 0, 0.3)'
                          } : {})
                        }}
                      >
                        🖨️ Impresión de Reportes
                      </button>
                    </div>

                    {subTabReportes === 'impresion' && (
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setSubTabReportes('metricas')}
                        style={{ fontSize: '0.8rem', padding: '0.35rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        ← Volver a Métricas
                      </button>
                    )}
                  </div>

                  {subTabReportes === 'metricas' && (
                    <>
                      {/* Header de la pestaña */}
                      <div className="reportes-header">
                        <div>
                          <h3 className="section-title">📈 Reportes & Análisis de Ventas</h3>
                          <p className="section-subtitle">Consulta métricas clave en tiempo real, analiza el rendimiento de productos y descarga informes en Excel</p>
                        </div>
                        <div>
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => {
                              setSubTabReportes('impresion');
                              setFechaInicioImpresion(fechaInicioReporte);
                              setFechaFinImpresion(fechaFinReporte);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              padding: '0.55rem 1.15rem',
                              fontSize: '0.88rem',
                              fontWeight: '700',
                              borderRadius: '50px',
                              border: '1px solid var(--accent-primary)',
                              color: 'var(--accent-primary)',
                              cursor: 'pointer'
                            }}
                          >
                            🖨️ Impresión de Reportes
                          </button>
                        </div>
                      </div>

                  {/* Barra de Filtros & Presets */}
                  <div className="reportes-filters-bar">
                    {/* Presets Rápidos */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginRight: '0.5rem' }}>Presets:</span>
                      <button type="button" className="preset-chip" onClick={() => aplicarPresetFecha('hoy')}>Hoy</button>
                      <button type="button" className="preset-chip" onClick={() => aplicarPresetFecha('ayer')}>Ayer</button>
                      <button type="button" className="preset-chip" onClick={() => aplicarPresetFecha('7dias')}>Últimos 7 días</button>
                      <button type="button" className="preset-chip" onClick={() => aplicarPresetFecha('esteMes')}>Este Mes</button>
                      <button type="button" className="preset-chip" onClick={() => aplicarPresetFecha('mesPasado')}>Mes Pasado</button>
                    </div>

                    {/* Date Pickers */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Desde</label>
                        <input
                          type="date"
                          className="form-input"
                          style={{ padding: '0.5rem 0.8rem', fontSize: '0.85rem', width: '140px', borderRadius: '50px' }}
                          value={fechaInicioReporte}
                          onChange={(e) => setFechaInicioReporte(e.target.value)}
                        />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Hasta</label>
                        <input
                          type="date"
                          className="form-input"
                          style={{ padding: '0.5rem 0.8rem', fontSize: '0.85rem', width: '140px', borderRadius: '50px' }}
                          value={fechaFinReporte}
                          onChange={(e) => setFechaFinReporte(e.target.value)}
                        />
                      </div>
                      <button
                        type="button"
                        className="btn-primary"
                        style={{ padding: '0.5rem 1.2rem', fontSize: '0.85rem', borderRadius: '50px' }}
                        onClick={cargarReportesData}
                      >
                        🔍 Filtrar
                      </button>
                    </div>
                  </div>

                  {/* Contenido Principal de Reportes */}
                  <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingRight: '0.5rem' }}>
                    
                    {/* Tarjetas de Métricas KPI */}
                    <div className="kpi-grid">
                      
                      {/* Card Ventas Totales */}
                      <div className="kpi-card kpi-primary">
                        <span className="kpi-label">💰 Ventas Totales</span>
                        <strong className="kpi-value">
                          ${(reporteResumen?.total_ventas || 0).toLocaleString('es-CL', { minimumFractionDigits: 0 })}
                        </strong>
                        <span className="kpi-subtext">
                          Período: {fechaInicioReporte} al {fechaFinReporte}
                        </span>
                      </div>

                      {/* Card Efectivo */}
                      <div className="kpi-card kpi-success">
                        <span className="kpi-label">💵 Efectivo Recibido</span>
                        <strong className="kpi-value">
                          ${(reporteResumen?.total_efectivo || 0).toLocaleString('es-CL', { minimumFractionDigits: 0 })}
                        </strong>
                        <span className="kpi-subtext">
                          {reporteResumen?.total_ventas > 0 ? `${(((reporteResumen?.total_efectivo || 0) / reporteResumen.total_ventas) * 100).toFixed(1)}% del total` : '0%'}
                        </span>
                      </div>

                      {/* Card Tarjeta */}
                      <div className="kpi-card kpi-info">
                        <span className="kpi-label">💳 Débito & Crédito</span>
                        <strong className="kpi-value">
                          ${(reporteResumen?.total_tarjeta || 0).toLocaleString('es-CL', { minimumFractionDigits: 0 })}
                        </strong>
                        <span className="kpi-subtext">
                          {reporteResumen?.total_ventas > 0 ? `${(((reporteResumen?.total_tarjeta || 0) / reporteResumen.total_ventas) * 100).toFixed(1)}% del total` : '0%'} | Débito: ${(reporteResumen?.total_debito || 0).toLocaleString('es-CL')} | Crédito: ${(reporteResumen?.total_credito || 0).toLocaleString('es-CL')}
                        </span>
                      </div>

                      {/* Card Pedidos */}
                      <div className="kpi-card kpi-primary">
                        <span className="kpi-label">🛒 Pedidos</span>
                        <strong className="kpi-value">
                          {reporteResumen?.cantidad_pedidos || 0} <span style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-muted)' }}>órdenes</span>
                        </strong>
                        <span className="kpi-subtext">
                          Comandas cerradas en el rango
                        </span>
                      </div>

                      {/* Card Ticket Promedio */}
                      <div className="kpi-card kpi-warning">
                        <span className="kpi-label">📊 Ticket Promedio</span>
                        <strong className="kpi-value">
                          ${(reporteResumen?.ticket_promedio || 0).toLocaleString('es-CL', { minimumFractionDigits: 0 })}
                        </strong>
                        <span className="kpi-subtext">
                          Venta promedio por orden
                        </span>
                      </div>

                    </div>

                    {/* Gráfico de Ventas en el Tiempo */}
                    <div className="report-panel" style={{ marginBottom: '1.5rem' }}>
                      <div className="report-panel-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                          <h4 className="report-panel-title">📈 Ventas en el Tiempo</h4>
                          <p className="report-panel-subtitle">Total de ventas {agrupacionGrafico === 'hora' || (fechaInicioReporte === fechaFinReporte && agrupacionGrafico === '') ? 'por hora' : agrupacionGrafico === 'semana' ? 'por semana' : agrupacionGrafico === 'mes' ? 'mensuales' : 'diarias'} en el período seleccionado</p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginRight: '0.5rem', alignSelf: 'center' }}>Agrupar:</span>
                          <button 
                            type="button" 
                            className="preset-chip"
                            onClick={() => setAgrupacionGrafico(fechaInicioReporte === fechaFinReporte ? 'hora' : 'dia')}
                            style={agrupacionGrafico === '' || agrupacionGrafico === 'dia' || (fechaInicioReporte === fechaFinReporte && agrupacionGrafico === 'hora') ? { backgroundColor: 'var(--accent-primary)', color: '#fff' } : {}}
                          >
                            {fechaInicioReporte === fechaFinReporte ? 'Por Hora' : 'Día'}
                          </button>
                          {fechaInicioReporte !== fechaFinReporte && (
                            <>
                              <button 
                                type="button" 
                                className="preset-chip"
                                onClick={() => setAgrupacionGrafico('semana')}
                                style={agrupacionGrafico === 'semana' ? { backgroundColor: 'var(--accent-primary)', color: '#fff' } : {}}
                              >
                                Semana
                              </button>
                              <button 
                                type="button" 
                                className="preset-chip"
                                onClick={() => setAgrupacionGrafico('mes')}
                                style={agrupacionGrafico === 'mes' ? { backgroundColor: 'var(--accent-primary)', color: '#fff' } : {}}
                              >
                                Mes
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {loadingReportes ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                          <div className="spinner"></div>
                        </div>
                      ) : errorReportes ? (
                        <div className="alert alert-error">
                          <span>{errorReportes}</span>
                        </div>
                      ) : reporteVentasDiarias && reporteVentasDiarias.length > 0 ? (
                        <div style={{ height: '300px', width: '100%', marginTop: '1rem' }}>
                          <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={reporteVentasDiarias} layout="horizontal" margin={{ top: 35, right: 65, left: 10, bottom: 10 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border, rgba(128,128,128,0.2))" vertical={false} />
                              <XAxis 
                                xAxisId={0}
                                dataKey="fecha" 
                                type="category"
                                stroke="var(--glass-border, rgba(128,128,128,0.2))" 
                                tick={{ fill: 'var(--text-primary)', fontSize: 13, fontWeight: 600 }} 
                                tickMargin={12} 
                                minTickGap={20} 
                                tickFormatter={(value) => {
                                  if (!value) return '';
                                  const strValue = String(value);
                                  if (strValue.includes(':')) return `${strValue} hrs`;
                                  if (strValue.length === 7 && strValue.includes('-')) { // 2026-01
                                    const [y, m] = strValue.split('-');
                                    if (y && m) {
                                      const d = new Date(y, parseInt(m)-1, 1);
                                      if (!isNaN(d.getTime())) return d.toLocaleDateString('es-CL', { month: 'short', year: '2-digit' }).replace('.', '');
                                    }
                                  }
                                  if (strValue.length === 10 && strValue.includes('-')) { // 2026-01-05
                                    const [y, m, d] = strValue.split('-');
                                    if (y && m && d) {
                                      const dateObj = new Date(y, parseInt(m)-1, d);
                                      if (!isNaN(dateObj.getTime())) {
                                        const dateStr = dateObj.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' }).replace('.', '');
                                        return agrupacionGrafico === 'semana' ? `Sem ${dateStr}` : dateStr;
                                      }
                                    }
                                  }
                                  return strValue;
                                }}
                              />
                              <YAxis 
                                yAxisId={0}
                                type="number"
                                stroke="var(--glass-border, rgba(128,128,128,0.2))" 
                                tick={{ fill: 'var(--text-primary)', fontSize: 13, fontWeight: 600 }} 
                                tickFormatter={(value) => `$${(value / 1000)}k`} 
                                width={80} 
                              />
                              <Tooltip 
                                contentStyle={{ backgroundColor: 'var(--item-bg)', borderColor: 'var(--accent-primary)', borderWidth: '2px', borderRadius: '12px', color: 'var(--text-primary)', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}
                                itemStyle={{ color: 'var(--accent-primary)', fontWeight: 'bold', fontSize: '1.1rem' }}
                                formatter={(value) => [`$${(Number(value) || 0).toLocaleString('es-CL')}`, 'Total']}
                                labelFormatter={(label) => agrupacionGrafico === 'hora' || (fechaInicioReporte === fechaFinReporte && agrupacionGrafico === '') ? `Hora: ${label}` : agrupacionGrafico === 'semana' ? `Semana de: ${label}` : agrupacionGrafico === 'mes' ? `Mes: ${label}` : `Día: ${label}`}
                              />
                              <Line xAxisId={0} yAxisId={0} type="monotone" dataKey="total_ventas" stroke="var(--accent-primary)" strokeWidth={3} dot={{ r: 4, fill: 'var(--accent-primary)', strokeWidth: 0 }} activeDot={{ r: 7, fill: 'var(--accent-primary)', stroke: 'var(--item-bg)', strokeWidth: 2 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                          No hay suficientes datos diarios para mostrar el gráfico en este período.
                        </div>
                      )}
                    </div>

                    {/* Layout inferior (Tabla + Acciones) */}
                    <div className="reportes-layout-grid">
                      
                      {/* Desglose de Medios de Pago */}
                      <div className="report-panel">
                        <div className="report-panel-header" style={{ marginBottom: '1.5rem' }}>
                          <div>
                            <h4 className="report-panel-title">📊 Medios de Pago</h4>
                            <p className="report-panel-subtitle">Desglose porcentual por tipo de pago</p>
                          </div>
                        </div>

                        {loadingReportes ? (
                          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            <div className="spinner"></div>
                          </div>
                        ) : errorReportes ? (
                          <div className="alert alert-error">
                            <span>{errorReportes}</span>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingRight: '0.5rem' }}>
                            {/* Efectivo */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  💵 Efectivo
                                </span>
                                <div style={{ textAlign: 'right' }}>
                                  <span style={{ fontWeight: '800', color: 'var(--text-primary)' }}>${(reporteResumen?.total_efectivo || 0).toLocaleString('es-CL')}</span>
                                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                                    {reporteResumen?.total_ventas > 0 ? (((reporteResumen?.total_efectivo || 0) / reporteResumen.total_ventas) * 100).toFixed(1) : 0}%
                                  </span>
                                </div>
                              </div>
                              <div style={{ width: '100%', background: 'var(--glass-border, rgba(128,128,128,0.2))', borderRadius: '50px', height: '10px', overflow: 'hidden' }}>
                                <div style={{ width: `${reporteResumen?.total_ventas > 0 ? (((reporteResumen?.total_efectivo || 0) / reporteResumen.total_ventas) * 100) : 0}%`, background: 'var(--success, #10b981)', height: '100%', borderRadius: '50px', transition: 'width 1s ease-in-out' }}></div>
                              </div>
                            </div>

                            {/* Tarjeta */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  💳 Tarjeta (Débito & Crédito)
                                </span>
                                <div style={{ textAlign: 'right' }}>
                                  <span style={{ fontWeight: '800', color: 'var(--text-primary)' }}>${(reporteResumen?.total_tarjeta || 0).toLocaleString('es-CL')}</span>
                                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                                    {reporteResumen?.total_ventas > 0 ? (((reporteResumen?.total_tarjeta || 0) / reporteResumen.total_ventas) * 100).toFixed(1) : 0}%
                                  </span>
                                </div>
                              </div>
                              <div style={{ width: '100%', background: 'var(--glass-border, rgba(128,128,128,0.2))', borderRadius: '50px', height: '10px', overflow: 'hidden', display: 'flex' }}>
                                <div style={{ width: `${reporteResumen?.total_ventas > 0 ? (((reporteResumen?.total_debito || 0) / reporteResumen.total_ventas) * 100) : 0}%`, background: '#3b82f6', height: '100%', borderTopLeftRadius: '50px', borderBottomLeftRadius: '50px', transition: 'width 1s ease-in-out' }} title={`Débito: ${(reporteResumen?.total_debito || 0).toLocaleString('es-CL')}`}></div>
                                <div style={{ width: `${reporteResumen?.total_ventas > 0 ? (((reporteResumen?.total_credito || 0) / reporteResumen.total_ventas) * 100) : 0}%`, background: 'var(--accent-primary)', height: '100%', borderTopRightRadius: '50px', borderBottomRightRadius: '50px', transition: 'width 1s ease-in-out' }} title={`Crédito: ${(reporteResumen?.total_credito || 0).toLocaleString('es-CL')}`}></div>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', fontWeight: '600' }}>
                                <span style={{ color: '#3b82f6' }}>Débito: ${(reporteResumen?.total_debito || 0).toLocaleString('es-CL')}</span>
                                <span style={{ color: 'var(--accent-primary)' }}>Crédito: ${(reporteResumen?.total_credito || 0).toLocaleString('es-CL')}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Exportaciones & Acciones Rápidas */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {/* Impresión de Reportes Térmicos */}
                        <div className="report-panel" style={{ border: '1px solid rgba(230, 81, 0, 0.3)', background: 'rgba(230, 81, 0, 0.04)' }}>
                          <div>
                            <h4 className="report-panel-title">🖨️ Impresión de Reportes</h4>
                            <p className="report-panel-subtitle" style={{ marginTop: '0.5rem' }}>
                              Imprime tickets de Resumen Financiero, Resumen de Inventario o Productos por Categoría.
                            </p>
                          </div>
                          <button
                            type="button"
                            className="btn-primary"
                            style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem', borderRadius: '50px', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                            onClick={() => {
                              setSubTabReportes('impresion');
                              setFechaInicioImpresion(fechaInicioReporte);
                              setFechaFinImpresion(fechaFinReporte);
                            }}
                          >
                            🖨️ Ir a Impresión de Reportes
                          </button>
                        </div>

                        {/* Exportar Productos del Rango */}
                        <div className="report-panel">
                          <div>
                            <h4 className="report-panel-title">📦 Exportar Productos</h4>
                            <p className="report-panel-subtitle" style={{ marginTop: '0.5rem' }}>
                              Descarga un Excel con todos los productos vendidos en el período que tienes seleccionado arriba.
                            </p>
                          </div>
                          <button
                            type="button"
                            className="btn-secondary"
                            style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem', borderRadius: '50px', marginTop: '1rem', border: '1px solid var(--accent-primary)', color: 'var(--accent-primary)', backgroundColor: 'transparent' }}
                            onClick={descargarReporteProductosRango}
                          >
                            📥 Descargar Productos del Período
                          </button>
                        </div>
                        
                        {/* Exportar Reporte Mensual */}
                        <div className="report-panel">
                          <div>
                            <h4 className="report-panel-title">📅 Reporte Mensual</h4>
                            <p className="report-panel-subtitle" style={{ marginTop: '0.5rem' }}>
                              Descarga una planilla Excel con el resumen diario de ventas del mes.
                            </p>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Seleccionar Mes</label>
                            <input
                              type="month"
                              className="form-input"
                              style={{ padding: '0.6rem 1rem', fontSize: '0.9rem', borderRadius: '50px', color: 'var(--text-primary)', textAlign: 'center' }}
                              value={mesExcel}
                              onChange={(e) => setMesExcel(e.target.value)}
                            />
                          </div>

                          <button
                            type="button"
                            className="btn-primary"
                            style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem', borderRadius: '50px', marginTop: '0.5rem' }}
                            onClick={descargarExcelMensual}
                          >
                            📥 Descargar Excel Mensual
                          </button>
                        </div>

                        {/* Envío de Reporte por Correo */}
                        <div className="report-panel">
                          <div>
                            <h4 className="report-panel-title">📬 Envío por Correo</h4>
                            <p className="report-panel-subtitle" style={{ marginTop: '0.5rem' }}>
                              Envía el reporte completo de inventario y existencias a:
                            </p>
                          </div>
                          
                          <div style={{ background: 'var(--item-bg)', border: '1px solid var(--glass-border)', padding: '0.75rem 1rem', borderRadius: '12px', fontSize: '0.85rem', color: 'var(--accent-primary)', fontWeight: '700', textAlign: 'center', wordBreak: 'break-all' }}>
                            {configEmailTo || 'No configurado'}
                          </div>

                          {mensajeCorreoReporte && (
                            <div className={`alert alert-${tipoMensajeCorreoReporte}`} style={{ padding: '0.6rem 1rem', fontSize: '0.85rem', margin: 0, borderRadius: '12px' }}>
                              <span>{mensajeCorreoReporte}</span>
                            </div>
                          )}

                          <button
                            type="button"
                            className="btn-secondary"
                            style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem', borderRadius: '50px', marginTop: '0.5rem' }}
                            disabled={enviandoCorreoReporte}
                            onClick={async () => {
                              try {
                                setEnviandoCorreoReporte(true);
                                setMensajeCorreoReporte('');
                                const response = await fetch('http://127.0.0.1:5000/api/reportes/enviar', {
                                  method: 'POST'
                                });
                                const data = await response.json();
                                if (response.ok && data.success) {
                                  setTipoMensajeCorreoReporte('success');
                                  setMensajeCorreoReporte('¡Reporte enviado exitosamente!');
                                } else {
                                  setTipoMensajeCorreoReporte('error');
                                  setMensajeCorreoReporte(data.message || 'Error al enviar el reporte.');
                                }
                              } catch (err) {
                                console.error(err);
                                setTipoMensajeCorreoReporte('error');
                                setMensajeCorreoReporte('Error de red al intentar enviar el correo.');
                              } finally {
                                setEnviandoCorreoReporte(false);
                              }
                            }}
                          >
                            {enviandoCorreoReporte ? 'Enviando Reporte...' : '📧 Enviar Reporte Ahora'}
                          </button>
                        </div>

                      </div>

                    </div>

                  </div>
                </>
              )}

              {subTabReportes === 'impresion' && (
                <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingRight: '0.5rem' }}>
                  
                  {/* Header de la sección de Impresión */}
                  <div className="reportes-header" style={{ marginBottom: '0.75rem' }}>
                    <div>
                      <h3 className="section-title">🖨️ Impresión de Reportes Térmicos</h3>
                      <p className="section-subtitle">Imprime reportes térmicos individuales o de un intervalo de fechas directamente en tu impresora POS</p>
                    </div>
                  </div>

                  {/* Barra de Filtros: Intervalo y Turno */}
                  <div className="reportes-filters-bar" style={{ padding: '0.85rem 1.25rem', marginBottom: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {/* Presets de Intervalo */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-secondary)', marginRight: '0.25rem' }}>Presets de Intervalo:</span>
                      <button type="button" className="preset-chip" onClick={() => aplicarPresetImpresion('hoy')}>Hoy</button>
                      <button type="button" className="preset-chip" onClick={() => aplicarPresetImpresion('ayer')}>Ayer</button>
                      <button type="button" className="preset-chip" onClick={() => aplicarPresetImpresion('7dias')}>Últimos 7 días</button>
                      <button type="button" className="preset-chip" onClick={() => aplicarPresetImpresion('esteMes')}>Este Mes</button>
                      <button type="button" className="preset-chip" onClick={() => aplicarPresetImpresion('mesPasado')}>Mes Pasado</button>
                    </div>

                    {/* Selectores de Rango y Turno */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-secondary)' }}>📅 Desde:</label>
                        <input
                          type="date"
                          className="form-input"
                          style={{ padding: '0.45rem 0.8rem', fontSize: '0.85rem', width: '145px', borderRadius: '50px' }}
                          value={fechaInicioImpresion}
                          onChange={(e) => {
                            const newStart = e.target.value;
                            setFechaInicioImpresion(newStart);
                            if (fechaFinImpresion && newStart > fechaFinImpresion) {
                              setFechaFinImpresion(newStart);
                            }
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-secondary)' }}>📅 Hasta:</label>
                        <input
                          type="date"
                          className="form-input"
                          style={{ padding: '0.45rem 0.8rem', fontSize: '0.85rem', width: '145px', borderRadius: '50px' }}
                          value={fechaFinImpresion}
                          onChange={(e) => {
                            const newEnd = e.target.value;
                            setFechaFinImpresion(newEnd);
                            if (fechaInicioImpresion && newEnd < fechaInicioImpresion) {
                              setFechaInicioImpresion(newEnd);
                            }
                          }}
                        />
                      </div>

                      {fechaInicioImpresion === fechaFinImpresion ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <label style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-secondary)' }}>⏰ Turno:</label>
                          <select
                            value={filtroTurnoImpresion}
                            onChange={(e) => {
                              setFiltroTurnoImpresion(e.target.value);
                            }}
                            className="form-input"
                            style={{ padding: '0.45rem 1rem', fontSize: '0.85rem', borderRadius: '50px', maxWidth: '230px' }}
                          >
                            <option value="all">📅 Todo el día (Todos los turnos)</option>
                            {listaTurnos
                              .filter(t => {
                                const tDateIni = new Date(t.fecha_hora_inicio);
                                const yIni = tDateIni.getFullYear();
                                const mIni = String(tDateIni.getMonth() + 1).padStart(2, '0');
                                const dIni = String(tDateIni.getDate()).padStart(2, '0');
                                const dateIniStr = `${yIni}-${mIni}-${dIni}`;

                                let dateFinStr = '';
                                if (t.fecha_hora_fin) {
                                  const tDateFin = new Date(t.fecha_hora_fin);
                                  const yFin = tDateFin.getFullYear();
                                  const mFin = String(tDateFin.getMonth() + 1).padStart(2, '0');
                                  const dFin = String(tDateFin.getDate()).padStart(2, '0');
                                  dateFinStr = `${yFin}-${mFin}-${dFin}`;
                                }
                                const todayStr = new Date().toISOString().split('T')[0];
                                return dateIniStr === fechaInicioImpresion || dateFinStr === fechaInicioImpresion || (Boolean(t.activo) && fechaInicioImpresion === todayStr);
                              })
                              .map(t => (
                                <option key={t.id} value={t.id}>
                                  ⏰ Turno #{t.id} ({t.usuario_inicio})
                                </option>
                              ))
                            }
                          </select>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.35)', padding: '0.35rem 0.85rem', borderRadius: '50px', fontSize: '0.82rem', color: '#93c5fd' }}>
                          <span>📆 <strong>Intervalo activo:</strong> Consolidando todos los turnos del período</span>
                        </div>
                      )}

                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ padding: '0.45rem 1.1rem', fontSize: '0.85rem', borderRadius: '50px', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                        onClick={() => cargarCierreParaImpresion(fechaInicioImpresion, fechaFinImpresion, filtroTurnoImpresion)}
                      >
                        🔄 Recargar Datos
                      </button>
                    </div>
                  </div>

                  {/* Barra de Estado del Intervalo / Período */}
                  {(() => {
                    const isIntervalo = fechaFinImpresion && fechaFinImpresion !== fechaInicioImpresion;
                    const fIniParts = (fechaInicioImpresion || '').split('-');
                    const fFinParts = (fechaFinImpresion || '').split('-');
                    const fIniDisplay = fIniParts.length === 3 ? `${fIniParts[2]}/${fIniParts[1]}/${fIniParts[0]}` : fechaInicioImpresion;
                    const fFinDisplay = fFinParts.length === 3 ? `${fFinParts[2]}/${fFinParts[1]}/${fFinParts[0]}` : fechaFinImpresion;

                    return (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', border: '1px solid var(--glass-border)', fontSize: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '1.1rem' }}>📋</span>
                          <span>
                            {isIntervalo ? (
                              <>Imprimiendo intervalo: <strong style={{ color: 'var(--accent-primary)' }}>{fIniDisplay} al {fFinDisplay}</strong> <span style={{ color: 'var(--text-secondary)' }}>(Turnos consolidados)</span></>
                            ) : (
                              <>Imprimiendo fecha: <strong style={{ color: 'var(--accent-primary)' }}>{fIniDisplay}</strong> {filtroTurnoImpresion !== 'all' ? <span style={{ color: 'var(--text-secondary)' }}>(Turno #{filtroTurnoImpresion})</span> : <span style={{ color: 'var(--text-secondary)' }}>(Día completo)</span>}</>
                            )}
                          </span>
                        </div>
                        {loadingCierreImpresion ? (
                          <span style={{ color: 'var(--accent-primary)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            ⏳ Actualizando métricas...
                          </span>
                        ) : (
                          <span style={{ color: '#10b981', fontWeight: '600', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
                            Datos listos para enviar a impresora
                          </span>
                        )}
                      </div>
                    );
                  })()}

                  {mensajeImpresion && (
                    <div className="alert alert-success animate-fade-in" style={{ padding: '0.75rem 1.25rem', borderRadius: '12px', fontWeight: '600' }}>
                      <span>{mensajeImpresion}</span>
                    </div>
                  )}

                  {/* Lista de los 3 Reportes */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginTop: '0.5rem' }}>
                    
                    {/* 1. Resumen Financiero */}
                    <div className="report-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid rgba(16, 185, 129, 0.4)', background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.05) 0%, rgba(0,0,0,0) 100%)', borderRadius: '16px', padding: '1.5rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                          <span style={{ fontSize: '2rem' }}>💵</span>
                          <div>
                            <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-primary)' }}>1. Resumen Financiero</h4>
                            <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: '700', textTransform: 'uppercase' }}>Ventas, Arqueo y Caja</span>
                          </div>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4', marginBottom: '1rem' }}>
                          Imprime el balance de ventas totales, desglose en efectivo, débito, crédito, gastos pagados, comandas eliminadas y el arqueo de caja con sobrantes o faltantes.
                        </p>
                        
                        {cierreDataImpresion ? (
                          <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '0.75rem 1rem', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1.25rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--text-secondary)' }}>Total Ventas:</span>
                              <strong style={{ color: '#10b981' }}>${(cierreDataImpresion.total_ventas || 0).toLocaleString('es-CL')}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--text-secondary)' }}>Efectivo:</span>
                              <span>${(cierreDataImpresion.total_efectivo || 0).toLocaleString('es-CL')}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--text-secondary)' }}>Tarjetas:</span>
                              <span>${(cierreDataImpresion.total_tarjeta || 0).toLocaleString('es-CL')}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--text-secondary)' }}>Gastos:</span>
                              <span style={{ color: '#ef4444' }}>-${(cierreDataImpresion.total_gastos || 0).toLocaleString('es-CL')}</span>
                            </div>
                          </div>
                        ) : loadingCierreImpresion ? (
                          <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)' }}>Cargando datos...</div>
                        ) : null}
                      </div>

                      <button
                        type="button"
                        className="btn-primary"
                        disabled={loadingCierreImpresion || imprimiendoTipo === 'financiero'}
                        onClick={handleImprimirFinancieroReportes}
                        style={{ width: '100%', padding: '0.8rem 1rem', fontSize: '0.9rem', fontWeight: '700', borderRadius: '50px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)' }}
                      >
                        {imprimiendoTipo === 'financiero' ? '⏳ Imprimiendo...' : '🖨️ Imprimir Resumen Financiero'}
                      </button>
                    </div>

                    {/* 2. Resumen Inventario */}
                    <div className="report-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid rgba(245, 158, 11, 0.4)', background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.05) 0%, rgba(0,0,0,0) 100%)', borderRadius: '16px', padding: '1.5rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                          <span style={{ fontSize: '2rem' }}>🥑</span>
                          <div>
                            <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-primary)' }}>2. Resumen Inventario</h4>
                            <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: '700', textTransform: 'uppercase' }}>Movimientos de Bodega y Stock</span>
                          </div>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4', marginBottom: '1rem' }}>
                          Imprime exclusivamente métricas de bodega: materia prima gastada por recetas (con unidades), mermas, consumo de personal, compras/llegada de mercadería y existencias actuales.
                        </p>
                        
                        {cierreDataImpresion ? (
                          <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '0.75rem 1rem', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1.25rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--text-secondary)' }}>Ingredientes Gastados:</span>
                              <strong style={{ color: '#f59e0b' }}>{cierreDataImpresion.ingredientes_gastados?.length || 0} ítems</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--text-secondary)' }}>Llegada de Mercadería:</span>
                              <span>{cierreDataImpresion.entradas_inventario?.length || 0} registros</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--text-secondary)' }}>Mermas / Consumo:</span>
                              <span>{cierreDataImpresion.mermas_inventario?.length || 0} registros</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--text-secondary)' }}>Stock en Sistema:</span>
                              <span>{listaIngredientes?.length || 0} ingredientes</span>
                            </div>
                          </div>
                        ) : loadingCierreImpresion ? (
                          <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)' }}>Cargando datos...</div>
                        ) : null}
                      </div>

                      <button
                        type="button"
                        className="btn-primary"
                        disabled={loadingCierreImpresion || imprimiendoTipo === 'inventario'}
                        onClick={handleImprimirInventarioReportes}
                        style={{ width: '100%', padding: '0.8rem 1rem', fontSize: '0.9rem', fontWeight: '700', borderRadius: '50px', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.25)' }}
                      >
                        {imprimiendoTipo === 'inventario' ? '⏳ Imprimiendo...' : '🖨️ Imprimir Resumen Inventario'}
                      </button>
                    </div>

                    {/* 3. Productos por Categoría */}
                    <div className="report-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid rgba(59, 130, 246, 0.4)', background: 'linear-gradient(180deg, rgba(59, 130, 246, 0.05) 0%, rgba(0,0,0,0) 100%)', borderRadius: '16px', padding: '1.5rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                          <span style={{ fontSize: '2rem' }}>📦</span>
                          <div>
                            <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-primary)' }}>3. Productos por Categoría</h4>
                            <span style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: '700', textTransform: 'uppercase' }}>Consolidado de Unidades</span>
                          </div>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4', marginBottom: '1rem' }}>
                          Imprime el desglose consolidado de productos y promociones vendidos, ordenados y agrupados según su categoría oficial (Hamburguesas, Bebidas, Envases, etc.).
                        </p>
                        
                        {cierreDataImpresion ? (
                          <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '0.75rem 1rem', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1.25rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--text-secondary)' }}>Variedades Vendidas:</span>
                              <strong style={{ color: '#3b82f6' }}>{cierreDataImpresion.productos_unificados?.length || 0} ítems</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--text-secondary)' }}>Categorías:</span>
                              <span>{listaCategorias?.length || 0} activas</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--text-secondary)' }}>Envases Vendidos:</span>
                              <span>{cierreDataImpresion.envases_vendidos?.cantidad || 0} u.</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--text-secondary)' }}>Total Unidades:</span>
                              <span>{(cierreDataImpresion.productos_unificados || []).reduce((acc, p) => acc + (p.cantidad || 0), 0)} u.</span>
                            </div>
                          </div>
                        ) : loadingCierreImpresion ? (
                          <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)' }}>Cargando datos...</div>
                        ) : null}
                      </div>

                      <button
                        type="button"
                        className="btn-primary"
                        disabled={loadingCierreImpresion || imprimiendoTipo === 'productos'}
                        onClick={handleImprimirProductosReportes}
                        style={{ width: '100%', padding: '0.8rem 1rem', fontSize: '0.9rem', fontWeight: '700', borderRadius: '50px', background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)' }}
                      >
                        {imprimiendoTipo === 'productos' ? '⏳ Imprimiendo...' : '🖨️ Imprimir Productos por Categoría'}
                      </button>
                    </div>

                  </div>
                </div>
              )}

                </div>
              </div>
              </ReportesErrorBoundary>
            )}




            {/* Modal Overlay / Comanda / etc. */}
          </div>
        )}
      </main>

      {showShiftPrompt && (
        <div className="custom-modal-overlay" style={{ background: 'var(--modal-overlay-bg, rgba(0, 0, 0, 0.8))', backdropFilter: 'blur(8px)' }}>
          <form 
            onSubmit={async (e) => {
              e.preventDefault();
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
            className="custom-modal-card" 
            style={{ maxWidth: '440px', background: 'var(--modal-bg, #231209)', border: '1.5px solid var(--accent-primary)', boxShadow: '0 20px 60px rgba(0,0,0,0.85)', color: 'var(--text-primary)' }}
          >
            <div className="custom-modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span className="custom-modal-icon">🔑</span>
                <h3 className="custom-modal-title">Apertura de Turno de Caja</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowShiftPrompt(false);
                  setErrorShiftInput('');
                  setEfectivoInicialInput('');
                  if (activeTab === 'pedidos') {
                    setActiveTab('inventario');
                  }
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: '1.25rem',
                  cursor: 'pointer',
                  padding: '0.2rem 0.5rem',
                  lineHeight: '1',
                  borderRadius: '6px'
                }}
                title="Cerrar y continuar sin abrir turno"
              >
                ✕
              </button>
            </div>
            <div className="custom-modal-body">
              <p className="custom-modal-message" style={{ marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: '1.5' }}>
                No hay un turno de caja activo actualmente. Puedes ingresar el monto inicial de apertura para habilitar la <strong>pestaña de pedidos</strong>, o continuar al sistema (la pestaña de pedidos permanecerá deshabilitada hasta que ingreses el monto inicial).
              </p>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Efectivo Inicial en Caja ($) <span style={{ color: 'red' }}>*</span></label>
                <div className="input-wrapper" style={{ position: 'relative' }}>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Monto de apertura (ej. 15000)"
                    value={efectivoInicialInput}
                    autoFocus
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
            <div className="custom-modal-footer" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', width: '100%' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowShiftPrompt(false);
                    setErrorShiftInput('');
                    setEfectivoInicialInput('');
                    if (activeTab === 'pedidos') {
                      setActiveTab('inventario');
                    }
                  }}
                  style={{ whiteSpace: 'nowrap', padding: '0.7rem 0.5rem', fontSize: '0.88rem' }}
                  title="Entrar al programa manteniendo la pestaña de pedidos deshabilitada"
                >
                  Continuar sin abrir turno
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ whiteSpace: 'nowrap', padding: '0.7rem 0.5rem', fontSize: '0.88rem' }}
                >
                  🔑 Iniciar Turno
                </button>
              </div>
              <div style={{ textAlign: 'center', marginTop: '0.2rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowShiftPrompt(false);
                    setErrorShiftInput('');
                    handleLogout();
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  🚪 Cerrar Sesión
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
      {showCerrarTurnoPrompt && (
        <div className="custom-modal-overlay" style={{ background: 'var(--modal-overlay-bg, rgba(0, 0, 0, 0.8))', backdropFilter: 'blur(8px)' }}>
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (efectivoFinalInput === '' || isNaN(parseFloat(efectivoFinalInput)) || parseFloat(efectivoFinalInput) < 0) {
                const msg = 'Por favor, ingresa un monto válido para el efectivo final de cierre.';
                setErrorCerrarShiftInput(msg);
                abrirAlerta(msg, 'Monto Inválido');
                return;
              }
              setErrorCerrarShiftInput('');
              setShowPromptImprimirFinanciero(true);
            }}
            className="custom-modal-card" 
            style={{ maxWidth: '450px', maxHeight: '92vh', overflowY: 'auto', background: 'var(--modal-bg, #231209)', border: '1.5px solid var(--accent-primary)', boxShadow: '0 20px 60px rgba(0,0,0,0.85)', color: 'var(--text-primary)' }}
          >
            <div className="custom-modal-header">
              <span className="custom-modal-icon">🔐</span>
              <h3 className="custom-modal-title">Arqueo y Cierre de Turno #{activeShift?.id}</h3>
            </div>
            <div className="custom-modal-body">
              <p className="custom-modal-message" style={{ marginBottom: '1.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Cuenta e ingresa el efectivo total final en caja. El sistema registrará el arqueo y cierre del turno.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ display: 'block', marginBottom: '0.45rem', fontWeight: '700', fontSize: '0.88rem' }}>
                    Efectivo Final en Caja ($) <span style={{ color: 'red' }}>*</span>
                  </label>
                  <div className="input-wrapper" style={{ position: 'relative' }}>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="Monto de cierre (ej. 45000)"
                      value={efectivoFinalInput}
                      autoFocus
                      onChange={(e) => {
                        setEfectivoFinalInput(e.target.value);
                        if (errorCerrarShiftInput) setErrorCerrarShiftInput('');
                      }}
                      style={{ 
                        color: 'var(--text-primary)', 
                        background: 'var(--input-bg)', 
                        paddingLeft: '2.5rem',
                        borderColor: errorCerrarShiftInput ? '#ef4444' : undefined,
                        height: '42px',
                        fontSize: '1rem',
                        fontWeight: '600'
                      }}
                    />
                    <span className="input-icon" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', fontSize: '1.1rem' }}>💵</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'block', marginBottom: '0.45rem', fontWeight: '600', fontSize: '0.85rem' }}>
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
                      height: '60px',
                      padding: '0.5rem 0.75rem',
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
                type="submit"
                className="btn-primary"
              >
                Confirmar y Cerrar
              </button>
            </div>
          </form>
        </div>
      )}

      {showPromptImprimirFinanciero && (
        <div className="custom-modal-overlay alert-modal-overlay" style={{ background: 'var(--modal-overlay-bg, rgba(0, 0, 0, 0.85))', backdropFilter: 'blur(8px)', zIndex: 12000 }}>
          <div className="custom-modal-card" style={{ maxWidth: '430px', background: 'var(--modal-bg, #231209)', border: '1.5px solid var(--accent-primary)', boxShadow: '0 20px 60px rgba(0,0,0,0.85)', color: 'var(--text-primary)', textAlign: 'center', padding: '1.75rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🖨️</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>
              Cierre de Turno #{activeShift?.id}
            </h3>
            <p style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--accent-primary)', margin: '0 0 0.75rem 0' }}>
              ¿Desea imprimir el resumen financiero?
            </p>
            <div style={{ background: 'rgba(255, 255, 255, 0.04)', borderRadius: '10px', padding: '0.6rem 0.8rem', border: '1px solid var(--glass-border)', marginBottom: '1.25rem', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Monto final ingresado:</span>
              <strong style={{ color: '#10b981' }}>${parseFloat(efectivoFinalInput || 0).toLocaleString('es-CL')}</strong>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', width: '100%' }}>
              <button
                type="button"
                className="btn-primary"
                style={{ width: '100%', padding: '0.75rem 1rem', fontSize: '0.95rem', fontWeight: '700', borderRadius: '50px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)' }}
                autoFocus
                onClick={async () => {
                  const finalCash = efectivoFinalInput;
                  const obs = observacionesCerrarShiftInput;
                  setShowPromptImprimirFinanciero(false);
                  setShowCerrarTurnoPrompt(false);
                  setEfectivoFinalInput('');
                  setObservacionesCerrarShiftInput('');
                  if (window.electronAPI) {
                    await imprimirReporteFinancieroModal(finalCash, obs);
                  }
                  await cerrarTurno(finalCash, obs);
                }}
              >
                🖨️ Sí, Imprimir Resumen Financiero
              </button>

              <button
                type="button"
                className="btn-secondary"
                style={{ width: '100%', padding: '0.65rem 1rem', fontSize: '0.88rem', borderRadius: '50px' }}
                onClick={async () => {
                  const finalCash = efectivoFinalInput;
                  const obs = observacionesCerrarShiftInput;
                  setShowPromptImprimirFinanciero(false);
                  setShowCerrarTurnoPrompt(false);
                  setEfectivoFinalInput('');
                  setObservacionesCerrarShiftInput('');
                  await cerrarTurno(finalCash, obs);
                }}
              >
                No imprimir, solo cerrar turno
              </button>

              <button
                type="button"
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '0.3rem', cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => {
                  setShowPromptImprimirFinanciero(false);
                }}
              >
                ← Volver a revisar monto
              </button>
            </div>
          </div>
        </div>
      )}
      {showPromptCliente && (
        <div className="custom-modal-overlay" style={{ background: 'var(--modal-overlay-bg, rgba(0, 0, 0, 0.8))', backdropFilter: 'blur(8px)' }}>
          <div className="custom-modal-card" style={{ background: 'var(--modal-bg, #231209)', border: '1.5px solid var(--accent-primary)', boxShadow: '0 20px 60px rgba(0,0,0,0.85)', color: 'var(--text-primary)' }}>
            <form onSubmit={handleSubmitPedido}>
              <div className="custom-modal-header">
                <span className="custom-modal-icon">{tipoTransaccion === 'Pedido Externo' ? '🛵' : '👤'}</span>
                <h3 className="custom-modal-title">
                  {tipoTransaccion === 'Pedido Externo' ? 'Confirmar Pedido Externo' : 'Confirmar Pedido'}
                </h3>
              </div>
              <div className="custom-modal-body">
                <p className="custom-modal-message" style={{ marginBottom: '1rem' }}>
                  {tipoTransaccion === 'Pedido Externo'
                    ? 'Identificador o número de pedido en la plataforma (Ej. PedidosYa #324):'
                    : 'Por favor, ingresa el nombre del cliente para este pedido:'}
                </p>
                <div className="form-group" style={{ margin: 0 }}>
                  <AutocompleteGhostInput
                    placeholder={tipoTransaccion === 'Pedido Externo' ? "Identificador (Ej. PedidosYa #324 o nombre)" : "Nombre del Cliente (Ej. Carlos Muñoz)"}
                    value={clienteNombre}
                    suggestions={Array.from(new Set(historialPedidos.map(p => p.cliente_nombre).filter(Boolean)))}
                    onSelectSuggestion={(sug) => setClienteNombre(sug)}
                    onChange={(val) => setClienteNombre(val)}
                    autoFocus
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

                    {/* Fila Inferior: Pago Mixto y Pedido Externo */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', marginTop: '0.1rem' }}>
                      <button
                        type="button"
                        className={`delivery-option-btn ${tipoTransaccion === 'Mixto' ? 'active' : ''}`}
                        onClick={() => setTipoTransaccion('Mixto')}
                        style={{ padding: '0.45rem 0.5rem', fontSize: '0.85rem' }}
                      >
                        🔀 Pago Mixto
                      </button>
                      <button
                        type="button"
                        className={`delivery-option-btn ${tipoTransaccion === 'Pedido Externo' ? 'active' : ''}`}
                        onClick={() => {
                          setTipoTransaccion('Pedido Externo');
                          setTipoEntrega('Llevar');
                          if (!clienteNombre || clienteNombre.trim() === '') {
                            setClienteNombre('PedidosYa');
                          }
                        }}
                        style={{ 
                          padding: '0.45rem 0.5rem', 
                          fontSize: '0.85rem',
                          borderColor: tipoTransaccion === 'Pedido Externo' ? '#e11d48' : undefined,
                          color: tipoTransaccion === 'Pedido Externo' ? '#ffffff' : undefined,
                          background: tipoTransaccion === 'Pedido Externo' ? 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)' : undefined
                        }}
                      >
                        🛵 Pedido Externo
                      </button>
                    </div>
                  </div>

                  {tipoTransaccion === 'Pedido Externo' && (
                    <div style={{
                      marginTop: '0.85rem',
                      padding: '0.75rem 0.95rem',
                      borderRadius: '12px',
                      background: 'rgba(244, 63, 94, 0.12)',
                      border: '1.5px solid rgba(244, 63, 94, 0.35)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem',
                      fontSize: '0.82rem'
                    }}>
                      <span style={{ fontWeight: 'bold', color: '#f43f5e', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span>🛵</span> Modo Pedido Externo (PedidosYa / Apps)
                      </span>
                      <span style={{ color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                        • Descontará inventario y guardará el ticket en el historial.<br/>
                        • <strong>No sumará dinero a la caja ($0)</strong> en efectivo ni tarjeta.
                      </span>
                    </div>
                  )}

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
                        <span style={{ fontSize: '0.95rem', color: tipoTransaccion === 'Pedido Externo' ? '#f43f5e' : 'var(--text-secondary)', fontWeight: '700' }}>
                          {tipoTransaccion === 'Pedido Externo' ? 'Total en Caja (Pedido Externo)' : 'Total a Pagar'}
                        </span>
                        {tipoTransaccion === 'Pedido Externo' ? (
                          <span style={{ fontSize: '0.78rem', color: '#f43f5e', fontWeight: '500', marginTop: '0.2rem' }}>
                            (Pagado en PedidosYa / App — No ingresa dinero a caja)
                          </span>
                        ) : (tipoEntrega === 'Llevar' && envasesInfo.montoTotal > 0 && (
                          <span style={{ fontSize: '0.78rem', color: 'var(--accent-primary)', fontWeight: '500', marginTop: '0.2rem' }}>
                            (Incluye +${envasesInfo.montoTotal.toLocaleString('es-CL')} de envases)
                          </span>
                        ))}
                      </div>
                      <span style={{ fontSize: '1.65rem', fontWeight: '800', color: tipoTransaccion === 'Pedido Externo' ? '#f43f5e' : 'var(--accent-primary)', letterSpacing: '-0.5px', whiteSpace: 'nowrap' }}>
                        {tipoTransaccion === 'Pedido Externo' ? '$0' : `$${grandTotal.toLocaleString('es-CL', { minimumFractionDigits: 0 })}`}
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
                  style={{
                    background: tipoTransaccion === 'Pedido Externo' ? 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)' : undefined,
                    borderColor: tipoTransaccion === 'Pedido Externo' ? '#e11d48' : undefined
                  }}
                >
                  {tipoTransaccion === 'Pedido Externo' ? '🛵 Confirmar Pedido Externo' : 'Aceptar'}
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
              <div className="comanda-local-name">{localNombre}</div>
              {localDireccion && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>📍 {localDireccion}</div>}
              {localTelefono && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>📞 Tel: {localTelefono}</div>}
              <div className="comanda-ticket-number">Ticket N° {comandaData.ticket}</div>
              {comandaData.tipo_entrega === 'Llevar' ? (
                <div style={{
                  marginTop: '0.6rem',
                  marginBottom: '0.4rem',
                  padding: '0.55rem 0.75rem',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: '#ffffff',
                  fontWeight: '900',
                  fontSize: '1.05rem',
                  letterSpacing: '1px',
                  textAlign: 'center',
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.35)'
                }}>
                  🛍️ ★★★ PEDIDO PARA LLEVAR ★★★
                  {comandaData.tipo_transaccion && (
                    <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#fee2e2', marginTop: '0.2rem' }}>
                      PAGO: {comandaData.tipo_transaccion.toUpperCase()}
                      {comandaData.tipo_transaccion === 'Mixto' && comandaData.pago_mixto_detalle ? ` (${comandaData.pago_mixto_detalle})` : ''}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{
                  marginTop: '0.6rem',
                  marginBottom: '0.4rem',
                  padding: '0.45rem 0.75rem',
                  borderRadius: '10px',
                  background: 'rgba(5, 150, 105, 0.12)',
                  border: '1.5px solid #059669',
                  color: '#059669',
                  fontWeight: '800',
                  fontSize: '1rem',
                  textAlign: 'center'
                }}>
                  🍽️ PEDIDO PARA SERVIR
                  {comandaData.tipo_transaccion && (
                    <div style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      PAGO: {comandaData.tipo_transaccion.toUpperCase()}
                      {comandaData.tipo_transaccion === 'Mixto' && comandaData.pago_mixto_detalle ? ` (${comandaData.pago_mixto_detalle})` : ''}
                    </div>
                  )}
                </div>
              )}
              <div className="comanda-date-time">
                {(() => {
                  const { fechaStr, horaStr } = parseFechaHoraChile(comandaData.fecha_hora);
                  return (
                    <>
                      <span>Fecha: {fechaStr}</span>
                      <span style={{ marginLeft: '16px' }}>Hora: {horaStr} hrs</span>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Listado de Productos como tabla */}
            <div className="comanda-body">
              <table className="comanda-table">
                <thead>
                  <tr>
                    <th style={{ width: '15%', paddingLeft: '0.2rem', whiteSpace: 'nowrap' }}>Cant</th>
                    <th style={{ width: '63%' }}>Producto</th>
                    <th style={{ width: '22%', textAlign: 'right', paddingRight: '0.2rem', whiteSpace: 'nowrap' }}>Precio</th>
                  </tr>
                </thead>
                <tbody>
                  {comandaData.productos.map((prod, idx) => {
                    const subItems = getPromoSubItems(prod);
                    const mostrarNombre = isOptionEnabled(prod.mostrar_nombre_ticket, true);
                    return (
                      <tr key={idx}>
                        <td>{prod.cantidad}</td>
                        <td>
                          {mostrarNombre && <div style={{ fontWeight: 'bold' }}>{prod.nombre || 'Producto'}</div>}
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
              {impuestoIvaPorcentaje > 0 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.8rem',
                  color: 'var(--ticket-text-secondary, #666)',
                  marginTop: '0.35rem',
                  fontWeight: '600',
                  borderTop: '1px dashed var(--ticket-border)',
                  paddingTop: '0.25rem'
                }}>
                  <span>{impuestoIncluido ? 'IVA Incluido' : 'Neto'}:</span>
                  <span>
                    ${(impuestoIncluido
                      ? Math.round(comandaData.total - (comandaData.total / (1 + (impuestoIvaPorcentaje / 100))))
                      : Math.round(comandaData.total - (comandaData.total / (1 + (impuestoIvaPorcentaje / 100))))
                    ).toLocaleString('es-CL')}
                  </span>
                </div>
              )}
            </div>
            {/* Acción de Cerrar */}
            <div className="comanda-actions" style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              {window.electronAPI && (
                <button
                  type="button"
                  className="btn-secondary comanda-btn-print"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  onClick={() => window.electronAPI.printTicket({
                    ...comandaData,
                    local_nombre: comandaData.local_nombre || localNombre,
                    local_direccion: comandaData.local_direccion || localDireccion,
                    local_telefono: comandaData.local_telefono || localTelefono,
                    local_pie_ticket: comandaData.local_pie_ticket || localPieTicket,
                    impuesto_iva_porcentaje: comandaData.impuesto_iva_porcentaje !== undefined ? comandaData.impuesto_iva_porcentaje : impuestoIvaPorcentaje,
                    impuesto_incluido: comandaData.impuesto_incluido !== undefined ? comandaData.impuesto_incluido : impuestoIncluido
                  })}
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
          <div className="custom-modal-overlay" style={{ background: 'rgba(0, 0, 0, 0.78)', backdropFilter: 'blur(8px)' }}>
            <div 
              className="custom-modal" 
              style={{ 
                maxWidth: isCategoryGrid ? '1080px' : '550px', 
                width: '95%', 
                padding: '1.25rem 1.5rem', 
                borderRadius: '20px', 
                maxHeight: '90vh', 
                display: 'flex', 
                flexDirection: 'column',
                background: 'var(--bg-secondary)',
                border: '1.5px solid var(--accent-primary)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.85)'
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
                    return (pasoActual.opciones || []).map((opc) => {
                      const prodRef = productos.find(p => p.id === opc.producto_id);
                      const emojiItem = prodRef?.imagen || '🍔';
                      const extraVal = getOpcionExtraValue(opc);

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
                    const extraVal = getOpcionExtraValue(opc);
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
        <div className="custom-modal-overlay" style={{ background: 'var(--modal-overlay-bg, rgba(0, 0, 0, 0.75))', backdropFilter: 'blur(6px)' }}>
          <div className="custom-modal-content" style={{ maxWidth: '440px', padding: '1.5rem', background: 'var(--modal-bg, var(--bg-secondary))', color: 'var(--text-primary)', borderRadius: '16px', border: '1.5px solid rgba(239, 68, 68, 0.4)', boxShadow: '0 12px 35px rgba(0,0,0,0.35)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.8rem' }}>🗑️</span>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#dc2626', fontWeight: 'bold' }}>Eliminar Comanda</h3>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Requiere clave de autorización</p>
              </div>
            </div>

            <div style={{ background: 'rgba(239, 68, 68, 0.08)', padding: '0.85rem', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.25)', marginBottom: '1.25rem', fontSize: '0.88rem', color: 'var(--text-primary)' }}>
              ¿Estás seguro de que deseas eliminar el <strong>Ticket #{pedidoToDelete.id}</strong> ({pedidoToDelete.cliente_nombre}) por un valor de <strong>${parseFloat(pedidoToDelete.total).toLocaleString('es-CL')}</strong>?
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                ⚠️ Se recalculará el total diario y los ingredientes utilizados se devolverán al inventario.
              </p>
            </div>

            <form onSubmit={handleConfirmDeletePedido} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  🔒 Contraseña de Autorización ({user?.nombre || 'Usuario'})
                </label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Ingresa tu contraseña para autorizar"
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  style={{
                    background: 'var(--input-bg)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--glass-border)',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    width: '100%'
                  }}
                  autoFocus
                />
              </div>

              {errorDeleteModal && (
                <div className="alert alert-error" style={{ margin: 0, padding: '0.5rem 0.75rem', fontSize: '0.82rem', background: 'rgba(239, 68, 68, 0.12)', color: '#dc2626', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px' }}>
                  <span>{errorDeleteModal}</span>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ flex: 1, padding: '0.65rem', fontSize: '0.88rem', background: 'var(--btn-secondary-bg)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
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
                  style={{ flex: 1, padding: '0.65rem', fontSize: '0.88rem', background: '#dc2626', color: 'white', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(220,38,38,0.3)' }}
                >
                  {loadingDeleteModal ? 'Eliminando...' : 'Confirmar Eliminación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {modalConfig.isOpen && (
        <div className="custom-modal-overlay alert-modal-overlay" style={{ background: 'var(--modal-overlay-bg, rgba(0, 0, 0, 0.8))', backdropFilter: 'blur(8px)', zIndex: 10000 }}>
          <div className="custom-modal-card" style={{ background: 'var(--modal-bg, #231209)', border: '1.5px solid var(--accent-primary)', boxShadow: '0 20px 60px rgba(0,0,0,0.85)', color: 'var(--text-primary)' }}>
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
