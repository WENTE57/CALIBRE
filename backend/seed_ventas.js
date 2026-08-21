const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE || 'calibre',
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const generateData = async () => {
  try {
    console.log('Iniciando carga de ventas históricas para Enero, Febrero y Marzo de 2026...');
    const year = 2026;
    const months = [0, 1, 2]; // 0=Ene, 1=Feb, 2=Mar
    
    const productosRes = await pool.query('SELECT id, nombre, precio FROM productos');
    const productos = productosRes.rows;

    if (productos.length === 0) {
      console.log('No hay productos en la base de datos.');
      process.exit(1);
    }

    const tiposTransaccion = ['Efectivo', 'Débito', 'Crédito'];
    let totalPedidosInsertados = 0;

    for (let month of months) {
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      for (let day = 1; day <= daysInMonth; day++) {
        // 3 a 8 pedidos por día
        const numPedidos = Math.floor(Math.random() * 6) + 3;
        
        for (let p = 0; p < numPedidos; p++) {
          const hora = Math.floor(Math.random() * (23 - 12) + 12); 
          const minuto = Math.floor(Math.random() * 60);
          
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}:00`;
          
          const tipo = tiposTransaccion[Math.floor(Math.random() * tiposTransaccion.length)];
          const cliente = `Cliente ${Math.floor(Math.random() * 1000)}`;
          
          const numProds = Math.floor(Math.random() * 3) + 1;
          let totalPedido = 0;
          const productosPedido = [];
          
          for (let i = 0; i < numProds; i++) {
            const prod = productos[Math.floor(Math.random() * productos.length)];
            const cantidad = Math.floor(Math.random() * 2) + 1; 
            totalPedido += parseFloat(prod.precio) * cantidad;
            productosPedido.push({ ...prod, cantidad });
          }

          const resPedido = await pool.query(`
            INSERT INTO pedidos (cliente_nombre, total, fecha_hora, atendido_por, tipo_entrega, tipo_transaccion)
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
          `, [cliente, totalPedido, dateStr, 'Juan Perez', 'Llevar', tipo]);
          
          const pedidoId = resPedido.rows[0].id;
          
          for (const item of productosPedido) {
            await pool.query(`
              INSERT INTO pedido_productos (pedido_id, producto_id, nombre_producto, cantidad, precio_unitario)
              VALUES ($1, $2, $3, $4, $5)
            `, [pedidoId, item.id, item.nombre, item.cantidad, item.precio]);
          }
          
          totalPedidosInsertados++;
        }
      }
    }
    
    console.log(`✅ ¡Se han insertado exitosamente ${totalPedidosInsertados} pedidos de prueba para el primer trimestre de 2026!`);
  } catch (err) {
    console.error('❌ Error insertando datos:', err);
  } finally {
    await pool.end();
  }
};

generateData();
