describe('test', () => {
  beforeEach(() => {
  // Auto-generated Cypress interceptors
  cy.intercept('GET', '**/api/products').as('get-api-products')
  cy.intercept('GET', '**/api/products/1').as('get-api-products-1')
  })


  it('should ', () => {

  });


/**
 * Probando cosas basicas
 */
it('holaaa', () => {
  cy.viewport(1900, 1200)
  cy.visit('/')
  cy.get('[data-cy="lib-e2e-cypress-for-dummys"]').invoke('hide');
  cy.get('.nav-card').click()
  cy.get('[data-cy="btn-click"]').click()
  cy.get('[data-testid="testid-btn"]').click()
  cy.get('[data-cy="category-filter"]').select('Monitores')
  cy.get('[data-cy="search-input"]').clear().type('pdiosajkdhsajkldaslk')
  cy.get('[data-cy="btn-load-products"]').click()
  cy.wait('@get-api-products').then((interception) => {
    if (interception.response) {
  expect(interception.response.body.products).to.equal([{"id":1,"name":"Teclado mecánico","price":89.99,"stock":14,"category":"Periféricos"},{"id":2,"name":"Monitor 27\"","price":329,"stock":5,"category":"Monitores"},{"id":3,"name":"Ratón inalámbrico","price":39.9,"stock":31,"category":"Periféricos"},{"id":4,"name":"SSD 1TB","price":74.5,"stock":20,"category":"Almacenamiento"}]);
  expect(interception.response.body.total).to.equal(4);
    }
  })
  cy.get('[data-cy="btn-load-detail"]').click()
  cy.wait('@get-api-products-1').then((interception) => {
    if (interception.response) {
  expect(interception.response.body.name).to.equal("Teclado mecánico");
  expect(interception.response.body.price).to.equal(89.99);
  expect(interception.response.body.stock).to.equal(14);
  expect(interception.response.body.category).to.equal("Periféricos");
    }
  })
});
});
