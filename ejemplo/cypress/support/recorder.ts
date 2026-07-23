const RECORDER = 'lib-e2e-recorder';
const PREVISUALIZER = 'lib-e2e-test-previsualizer';

Cypress.Commands.add('clearRecorderState', () => {
  cy.window().then(win => new Promise<void>(resolve => {
    const req = win.indexedDB.deleteDatabase('E2ECypressDB');
    req.onsuccess = () => resolve();
    req.onerror = () => resolve();
  }));
});

Cypress.Commands.add('startRecording', () => {
  cy.get(RECORDER).shadow().find('[data-action="toggle"]').click();
});

Cypress.Commands.add('stopRecording', () => {
  cy.get(RECORDER).shadow().find('[data-action="toggle"]').click();
});

Cypress.Commands.add('openCommandsPanel', () => {
  cy.get(RECORDER).shadow().find('[data-action="commands"]').click();
  cy.get(PREVISUALIZER).shadow().find('[data-ref="cmds"]').should('exist');
});

Cypress.Commands.add('commandShouldContain', (text: string) => {
  cy.get(PREVISUALIZER).shadow().find('[data-ref="cmds"]').should('contain.text', text);
});

Cypress.Commands.add('commandShouldNotContain', (text: string) => {
  cy.get(PREVISUALIZER).shadow().find('[data-ref="cmds"]').should('not.contain.text', text);
});

Cypress.Commands.add('interceptorShouldContain', (text: string) => {
  cy.get(PREVISUALIZER).shadow().find('[data-action="toggle-icp"]').click();
  cy.get(PREVISUALIZER).shadow().find('[data-section="interceptors"]').should('contain.text', text);
});

Cypress.Commands.add('interceptorCountShouldBe', (n: number) => {
  cy.get(PREVISUALIZER).shadow().find('[data-action="toggle-icp"]').should('contain.text', `(${n})`);
});
