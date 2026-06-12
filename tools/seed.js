// ─── seed.js ──────────────────────────────────────────────────────────────────
// Script para cargar datos iniciales en MongoDB.
// Ejecutar UNA sola vez: node seed.js
// Carga: 3 proveedores → 6 productos → 3 clientes
// (Las ventas se crean desde Thunder Client para probar el flujo completo)

import mongoose from 'mongoose';
import Proveedor from '../src/schemas/proveedor.schema.js';
import Producto  from '../src/schemas/producto.schema.js';
import Cliente   from '../src/schemas/cliente.schema.js';
import Venta     from '../src/schemas/venta.schema.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/todostock';

async function seed() {
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

  // ── 1. PROVEEDORES ──────────────────────────────────────────────────────────
  const proveedores = await Proveedor.insertMany([
    {
      razonSocial: 'Limpio S.A.',
      cuit: '30-12345678-9',
      telefono: '11-4444-5555',
      email: 'ventas@limpio.com',
      activo: true,
    },
    {
      razonSocial: 'QuímicaNor S.R.L.',
      cuit: '30-99887766-1',
      telefono: '351-222-3344',
      email: 'compras@quimicanor.com',
      activo: true,
    },
    {
      razonSocial: 'Distribuidora Sur S.A.',
      cuit: '30-55556677-2',
      telefono: '261-333-4455',
      email: 'info@distrisur.com',
      activo: true,
    },
  ]);
  console.log(`✅ ${proveedores.length} proveedores cargados`);
  console.log('   prov[0]:', proveedores[0]._id, '—', proveedores[0].razonSocial);
  console.log('   prov[1]:', proveedores[1]._id, '—', proveedores[1].razonSocial);
  console.log('   prov[2]:', proveedores[2]._id, '—', proveedores[2].razonSocial);

  // ── 2. PRODUCTOS ────────────────────────────────────────────────────────────
  const productos = await Producto.insertMany([
    {
      nombre: 'Lavandina 1L',
      descripcion: 'Lavandina concentrada apta para uso doméstico e industrial',
      precio: 850,
      stock: 120,
      stockMinimo: 40,
      stockMaximo: 80,
      proveedorId: proveedores[0]._id,
      activo: true,
    },
    {
      nombre: 'Detergente 500ml',
      descripcion: 'Detergente líquido concentrado multiuso',
      precio: 620,
      stock: 35,   // ← cerca del stockMinimo para probar alertas
      stockMinimo: 30,
      stockMaximo: 60,
      proveedorId: proveedores[0]._id,
      activo: true,
    },
    {
      nombre: 'Desinfectante 750ml',
      descripcion: 'Desinfectante multiusos con fragancia',
      precio: 1100,
      stock: 80,
      stockMinimo: 25,
      stockMaximo: 50,
      proveedorId: proveedores[1]._id,
      activo: true,
    },
    {
      nombre: 'Limpiador de pisos 1L',
      descripcion: 'Limpiador concentrado para todo tipo de pisos',
      precio: 780,
      stock: 60,
      stockMinimo: 20,
      stockMaximo: 40,
      proveedorId: proveedores[1]._id,
      activo: true,
    },
    {
      nombre: 'Jabón en polvo 500g',
      descripcion: 'Jabón en polvo para ropa blanca y de color',
      precio: 540,
      stock: 0,   // ← sin stock para probar alerta SIN_STOCK
      stockMinimo: 20,
      stockMaximo: 40,
      proveedorId: proveedores[2]._id,
      activo: true,
    },
    {
      nombre: 'Esponja de cocina x3',
      descripcion: 'Pack de 3 esponjas doble función',
      precio: 320,
      stock: 150,
      stockMinimo: 50,
      stockMaximo: 100,
      proveedorId: proveedores[2]._id,
      activo: true,
    },
  ]);
  console.log(`✅ ${productos.length} productos cargados`);
  productos.forEach(p => console.log(`   prod: ${p._id} — ${p.nombre} (stock: ${p.stock})`));

  // ── 3. CLIENTES ─────────────────────────────────────────────────────────────
  const clientes = await Cliente.insertMany([
    {
      razonSocial: 'Almacén Don Pepe',
      cuit: '20-87654321-3',
      condicionIva: 'consumidor_final',
      telefono: '11-3333-4444',
      email: 'donpepe@mail.com',
      limiteCrediticio: 50000,
      deudaActual: 12000,   // tiene deuda para probar crédito disponible
      activo: true,
    },
    {
      razonSocial: 'Limpieza Express S.R.L.',
      cuit: '30-55556666-7',
      condicionIva: 'responsable_inscripto',
      telefono: '351-444-5566',
      email: 'compras@limpiezaexpress.com',
      limiteCrediticio: 150000,
      deudaActual: 148000,  // deuda alta (99%) para probar rechazo de crédito
      activo: true,
    },
    {
      razonSocial: 'Minimarket El Sol',
      cuit: '27-11223344-5',
      condicionIva: 'monotributista',
      telefono: '11-6677-8899',
      email: 'elsol@mail.com',
      limiteCrediticio: 30000,
      deudaActual: 0,       // sin deuda para pruebas limpias
      activo: true,
    },
  ]);
  console.log(`✅ ${clientes.length} clientes cargados`);
  clientes.forEach(c => console.log(`   cli: ${c._id} — ${c.razonSocial} (deuda: $${c.deudaActual})`));

  // ── RESUMEN FINAL ───────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════════════');
  console.log('✅ SEED COMPLETADO — Datos listos para las pruebas');
  console.log('══════════════════════════════════════════════════');
  console.log('\n📋 IDs para usar en Thunder Client:');
  console.log('\nPROVEEDORES:');
  proveedores.forEach(p => console.log(`  ${p.razonSocial.padEnd(25)} → ${p._id}`));
  console.log('\nPRODUCTOS:');
  productos.forEach(p => console.log(`  ${p.nombre.padEnd(25)} → ${p._id}`));
  console.log('\nCLIENTES:');
  clientes.forEach(c => console.log(`  ${c.razonSocial.padEnd(25)} → ${c._id}`));
  console.log('\n🎯 Casos de prueba listos:');
  console.log('  · Detergente 500ml tiene stock=35, mínimo=30 → alerta STOCK_MINIMO');
  console.log('  · Jabón en polvo tiene stock=0 → alerta SIN_STOCK en /api/resumen');
  console.log('  · Limpieza Express tiene deuda 148000/150000 → rechazo de crédito');
  console.log('  · Minimarket El Sol tiene deuda 0 → listo para ventas en cuenta corriente');

  await mongoose.disconnect();
  console.log('\n🔌 Desconectado de MongoDB');
}

seed().catch(err => {
  console.error('❌ Error en seed:', err.message);
  process.exit(1);
});