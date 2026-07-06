// Ejemplo de spec generada con lib-e2e-cypress-for-dummys.
// Inserta aquí los bloques it() que el recorder genere con "Guardar y editar".

describe('showcase — lib-e2e-cypress-for-dummys', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5000');
  });

  it('navega a la tienda y carga productos', () => {
    cy.visit('http://localhost:5000/store');
    cy.get('[data-cy="btn-load-products"]').click();
    cy.get('[data-cy="product-name-1"]').should('be.visible');
  });

  it('navega entre apps y verifica la URL', () => {
    cy.get('nav [data-route="/store"]').click();
    cy.url().should('include', '/store');

    cy.get('nav [data-route="/forms"]').click();
    cy.url().should('include', '/forms');
  });

  // ── Inserta aquí los tests grabados ────────────────────────────────────────
});
