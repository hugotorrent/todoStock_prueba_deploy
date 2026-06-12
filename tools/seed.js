// ─── seed.js ──────────────────────────────────────────────────────────────────
// Script para cargar datos iniciales en MongoDB.
// Ejecutar UNA sola vez: npm run seed (desde la raíz del proyecto)
// Carga: 3 proveedores → 6 productos → 3 clientes

import 'dotenv/config';   // ← LÍNEA NUEVA: carga el .env de la raíz del proyecto
import mongoose from 'mongoose';
import Proveedor from '../src/schemas/proveedor.schema.js';
import Producto  from '../src/schemas/producto.schema.js';
import Cliente   from '../src/schemas/cliente.schema.js';
import Venta     from '../src/schemas/venta.schema.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/todostock';

async function seed() {
  console.log('🔌 Conectando a:', MONGO_URI.split('@').pop()); // muestra el host sin la pass
  await mongoose.connect(MONGO_URI);
  console.log('✅ MongoDB conectado');

  // Limpiar colecciones existentes
  await Promise.all([
    Proveedor.deleteMany({}),
    Producto.deleteMany({}),
    Cliente.deleteMany({}),
    Venta.deleteMany({}),
  ]);
  console.log('🧹 Colecciones limpiadas');

  // ── 1. PROVEEDORES ─────────────────────────────────────────────────────────
  const proveedores = await Proveedor.insertMany([
    { razonSocial: 'Limpio S.A.',           cuit: '30-12345678-9', telefono: '11-4444-5555', email: 'ventas@limpio.com',        activo: true },
    { razonSocial: 'QuímicaNor S.R.L.',     cuit: '30-99887766-1', telefono: '351-222-3344', email: 'compras@quimicanor.com',   activo: true },
    { razonSocial: 'Distribuidora Sur S.A.',cuit: '30-55556677-2', telefono: '261-333-4455', email: 'info@distrisur.com',       activo: true },
  ]);
  console.log(`✅ ${proveedores.length} proveedores cargados`);
  proveedores.forEach(p => console.log(`   ${p.razonSocial.padEnd(25)} → ${p._id}`));

  // ── 2. PRODUCTOS ───────────────────────────────────────────────────────────
  const productos = await Producto.insertMany([
    { nombre: 'Lavandina 1L',        descripcion: 'Lavandina concentrada', precio: 850,  stock: 120, stockMinimo: 40, stockMaximo: 80,  proveedorId: proveedores[0]._id, activo: true },
    { nombre: 'Detergente 500ml',    descripcion: 'Detergente multiuso',   precio: 620,  stock: 35,  stockMinimo: 30, stockMaximo: 60,  proveedorId: proveedores[0]._id, activo: true },
    { nombre: 'Desinfectante 750ml', descripcion: 'Desinfectante multiuso',precio: 1100, stock: 80,  stockMinimo: 25, stockMaximo: 50,  proveedorId: proveedores[1]._id, activo: true },
    { nombre: 'Limpiador de pisos 1L',descripcion:'Limpiador concentrado', precio: 780,  stock: 60,  stockMinimo: 20, stockMaximo: 40,  proveedorId: proveedores[1]._id, activo: true },
    { nombre: 'Jabón en polvo 500g', descripcion: 'Jabón para ropa',       precio: 540,  stock: 0,   stockMinimo: 20, stockMaximo: 40,  proveedorId: proveedores[2]._id, activo: true },
    { nombre: 'Esponja de cocina x3',descripcion: 'Pack 3 esponjas',       precio: 320,  stock: 150, stockMinimo: 50, stockMaximo: 100, proveedorId: proveedores[2]._id, activo: true },
  ]);
  console.log(`✅ ${productos.length} productos cargados`);
  productos.forEach(p => console.log(`   ${p.nombre.padEnd(25)} → ${p._id} (stock: ${p.stock})`));

  // ── 3. CLIENTES ────────────────────────────────────────────────────────────
  const clientes = await Cliente.insertMany([
    { razonSocial: 'Almacén Don Pepe',       cuit: '20-87654321-3', condicionIva: 'consumidor_final',    telefono: '11-3333-4444', email: 'donpepe@mail.com',              limiteCrediticio: 50000,  deudaActual: 12000,  activo: true },
    { razonSocial: 'Limpieza Express S.R.L.',cuit: '30-55556666-7', condicionIva: 'responsable_inscripto',telefono: '351-444-5566', email: 'compras@limpiezaexpress.com',   limiteCrediticio: 150000, deudaActual: 148000, activo: true },
    { razonSocial: 'Minimarket El Sol',      cuit: '27-11223344-5', condicionIva: 'monotributista',      telefono: '11-6677-8899', email: 'elsol@mail.com',                 limiteCrediticio: 30000,  deudaActual: 0,      activo: true },
  ]);
  console.log(`✅ ${clientes.length} clientes cargados`);
  clientes.forEach(c => console.log(`   ${c.razonSocial.padEnd(25)} → ${c._id} (deuda: $${c.deudaActual})`));

  console.log('\n══════════════════════════════════════════════════');
  console.log('✅ SEED COMPLETADO — Datos listos en Atlas');
  console.log('══════════════════════════════════════════════════');
  console.log('\n📋 IDs para usar en Postman:');
  console.log('\nPROVEEDORES:');
  proveedores.forEach(p => console.log(`  ${p.razonSocial.padEnd(25)} → ${p._id}`));
  console.log('\nPRODUCTOS:');
  productos.forEach(p => console.log(`  ${p.nombre.padEnd(25)} → ${p._id}`));
  console.log('\nCLIENTES:');
  clientes.forEach(c => console.log(`  ${c.razonSocial.padEnd(25)} → ${c._id}`));
  console.log('\n🎯 Casos de prueba:');
  console.log('  · Detergente 500ml stock=35, mínimo=30 → alerta STOCK_MINIMO');
  console.log('  · Jabón en polvo stock=0 → alerta SIN_STOCK en /api/resumen');
  console.log('  · Limpieza Express deuda 148000/150000 → rechazo de crédito');
  console.log('  · Minimarket El Sol deuda 0 → listo para ventas en cc');

  await mongoose.disconnect();
  console.log('\n🔌 Desconectado de MongoDB');
}

seed().catch(err => {
  console.error('❌ Error en seed:', err.message);
  process.exit(1);
});