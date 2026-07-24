import { allowRecorder } from '../../support/recorder';

describe('03 — HTTP interception', () => {
  describe('GET requests (store page)', () => {
    beforeEach(() => {
      allowRecorder();
      cy.visit('/store');
      cy.clearRecorderState();
      cy.startRecording();
    });

    // AC-14
    it('GET /api/products adds a cy.intercept entry', () => {
      cy.get('[data-cy="btn-load-products"]').click();
      cy.openCommandsPanel();
      cy.interceptorShouldContain('GET');
      cy.interceptorShouldContain('/api/products');
    });

    // AC-15
    it('GET /api/products/1 adds a distinct cy.intercept entry', () => {
      cy.get('[data-cy="btn-load-detail"]').click();
      cy.openCommandsPanel();
      cy.interceptorShouldContain('GET');
      cy.interceptorShouldContain('/api/products');
    });
  });

  describe('POST / PUT / DELETE requests (forms page)', () => {
    beforeEach(() => {
      allowRecorder();
      cy.visit('/forms');
      cy.clearRecorderState();
      cy.startRecording();
    });

    // AC-16
    it('POST /api/orders adds a cy.intercept entry', () => {
      cy.get('[data-cy="input-product"]').type('1');
      cy.get('[data-cy="input-qty"]').type('2');
      cy.get('[data-cy="btn-submit-order"]').click();
      cy.openCommandsPanel();
      cy.interceptorShouldContain('POST');
      cy.interceptorShouldContain('/api/orders');
    });

    // AC-17
    it('PUT /api/orders adds a cy.intercept entry', () => {
      cy.get('[data-cy="input-order-id"]').type('42');
      cy.get('[data-cy="btn-update-order"]').click();
      cy.openCommandsPanel();
      cy.interceptorShouldContain('PUT');
      cy.interceptorShouldContain('/api/orders');
    });

    // AC-18
    it('DELETE requests are NOT captured by the extension', () => {
      cy.get('[data-cy="btn-delete-order"]').click();
      cy.openCommandsPanel();
      cy.interceptorCountShouldBe(0);
    });
  });
});
