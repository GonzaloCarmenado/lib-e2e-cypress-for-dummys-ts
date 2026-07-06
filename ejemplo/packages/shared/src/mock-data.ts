export const PRODUCTS = [
  { id: 1, name: 'Teclado mecánico', price: 89.99, stock: 14, category: 'Periféricos' },
  { id: 2, name: 'Monitor 27"',      price: 329.00, stock: 5,  category: 'Monitores'   },
  { id: 3, name: 'Ratón inalámbrico',price: 39.90, stock: 31, category: 'Periféricos' },
  { id: 4, name: 'SSD 1TB',          price: 74.50, stock: 20, category: 'Almacenamiento' },
];

export const USERS = [
  { id: 1, name: 'Ana García',    role: 'Admin',    email: 'ana@example.com',   status: 'active' },
  { id: 2, name: 'Carlos López',  role: 'Editor',   email: 'carlos@example.com',status: 'active' },
  { id: 3, name: 'Marta Ruiz',    role: 'Viewer',   email: 'marta@example.com', status: 'inactive' },
  { id: 4, name: 'Pedro Sánchez', role: 'Editor',   email: 'pedro@example.com', status: 'active' },
];

export const ORDER_RESPONSE = { id: 42, status: 'created', total: 89.99 };
