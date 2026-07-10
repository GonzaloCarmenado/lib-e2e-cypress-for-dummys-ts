import { http, HttpResponse } from 'msw';
import { PRODUCTS, USERS, ORDER_RESPONSE } from './mock-data.js';

export const handlers = [
  // GET /api/products
  http.get('/api/products', () =>
    HttpResponse.json({ products: PRODUCTS, total: PRODUCTS.length })
  ),
  // GET /api/products/:id
  http.get('/api/products/:id', ({ params }) => {
    const product = PRODUCTS.find(p => p.id === Number(params['id']));
    return product
      ? HttpResponse.json(product)
      : new HttpResponse(null, { status: 404 });
  }),
  // POST /api/orders
  http.post('/api/orders', () =>
    HttpResponse.json(ORDER_RESPONSE, { status: 201 })
  ),
  // PUT /api/orders/:id
  http.put('/api/orders/:id', ({ params }) =>
    HttpResponse.json({ id: Number(params['id']), status: 'updated', total: 89.99 })
  ),
  // DELETE /api/orders/:id  — returns 204 (no body; recorder ignores DELETE)
  http.delete('/api/orders/:id', () =>
    new HttpResponse(null, { status: 204 })
  ),
  // GET /api/users  (for admin panel)
  http.get('/api/users', () =>
    HttpResponse.json({ users: USERS })
  ),
  // GET /api/edge-case  (laboratorio — claves kebab-case para probar Caso C)
  http.get('/api/edge-case', () =>
    HttpResponse.json({
      'user-id': 42,
      'x-auth-token': 'abc-123',
      'Content-Type': 'application/json',
      normalKey: 'valor normal',
      price: 99.99,
    })
  ),
  // GET /api/sensitive  (laboratorio — campos sensibles para probar Caso D)
  http.get('/api/sensitive', () =>
    HttpResponse.json({
      userId: 1,
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.super-secret-value',
      name: 'Alice',
    })
  ),
  // POST /api/login  (laboratorio — body con contraseña + respuesta con tokens, Caso D)
  http.post('/api/login', () =>
    HttpResponse.json({
      access_token: 'bearer-abc-xyz-secret',
      refresh_token: 'refresh-def-456-secret',
      userId: 42,
    })
  ),
];
