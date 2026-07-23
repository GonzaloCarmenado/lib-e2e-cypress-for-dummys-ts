describe('04 — Form input recording', () => {
  describe('Checkout page (checkbox, radio, textarea)', () => {
    beforeEach(() => {
      cy.clearRecorderState();
      cy.visit('/forms');
      cy.startRecording();
    });

    // AC-19
    it('checking a checkbox generates .check()', () => {
      cy.get('[data-cy="chk-terms"]').check();
      cy.openCommandsPanel();
      cy.commandShouldContain('.check()');
    });

    // AC-20
    it('unchecking a pre-checked checkbox generates .uncheck()', () => {
      cy.get('[data-cy="chk-promo"]').uncheck();
      cy.openCommandsPanel();
      cy.commandShouldContain('.uncheck()');
    });

    // AC-21
    it('selecting a radio button generates .check()', () => {
      cy.get('[data-cy="radio-express"]').check();
      cy.openCommandsPanel();
      cy.commandShouldContain('.check()');
    });

    // AC-24
    it('typing in a textarea generates .type(…)', () => {
      cy.get('[data-cy="textarea-notes"]').clear().type('Entregar por la mañana');
      cy.openCommandsPanel();
      cy.commandShouldContain('.type(');
      cy.commandShouldContain('Entregar por la mañana');
    });
  });

  describe('Store page (select, text input)', () => {
    beforeEach(() => {
      cy.clearRecorderState();
      cy.visit('/store');
      cy.startRecording();
    });

    // AC-22
    it('selecting a <select> option generates .select(…)', () => {
      cy.get('[data-cy="category-filter"]').select('Monitores');
      cy.openCommandsPanel();
      cy.commandShouldContain('.select(');
      cy.commandShouldContain('Monitores');
    });

    // AC-23
    it('typing in a text input generates .type(…)', () => {
      cy.get('[data-cy="search-input"]').clear().type('teclado');
      cy.openCommandsPanel();
      cy.commandShouldContain('.type(');
      cy.commandShouldContain('teclado');
    });
  });
});
