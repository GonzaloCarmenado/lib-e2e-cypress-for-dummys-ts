const RECORDER = 'lib-e2e-recorder';
const PREVISUALIZER = 'lib-e2e-test-previsualizer';

// Call this BEFORE cy.visit() so the flag is present when page scripts run.
// The recorder skips its Cypress detection guard when __e2eRecorderTestMode__ is in window.
export function allowRecorder(): void {
  cy.on('window:before:load', win => {
    (win as Record<string, unknown>)['__e2eRecorderTestMode__'] = true;
  });
}

Cypress.Commands.add('clearRecorderState', () => {
  cy.window().then(win => new Promise<void>(resolve => {
    const req = win.indexedDB.deleteDatabase('E2ECypressDB');
    req.onsuccess = () => resolve();
    req.onerror = () => resolve();
  }));
});

Cypress.Commands.add('setRecorderStrategy', (strategy: string) => {
  cy.on('window:before:load', win => {
    (win as Record<string, unknown>)['__e2eTestStrategy__'] = strategy;
  });
  cy.reload();
  cy.get(RECORDER).shadow().find('[data-action="toggle"]').should('exist');
});

Cypress.Commands.add('startRecording', () => {
  cy.get(RECORDER).shadow().find('[data-action="toggle"]').click();
});

Cypress.Commands.add('stopRecording', () => {
  cy.get(RECORDER).shadow().find('[data-action="toggle"]').click();
});

Cypress.Commands.add('openCommandsPanel', () => {
  cy.get(RECORDER).shadow().find('[data-action="commands"]').click({ force: true });
  cy.get(PREVISUALIZER).shadow().find('[data-ref="cmds"]').should('exist');
});

Cypress.Commands.add('commandShouldContain', (text: string) => {
  cy.get(PREVISUALIZER).shadow().find('[data-ref="cmds"]').should('contain.text', text);
});

Cypress.Commands.add('commandShouldNotContain', (text: string) => {
  cy.get(PREVISUALIZER).shadow().find('[data-ref="cmds"]').should('not.contain.text', text);
});

Cypress.Commands.add('interceptorShouldContain', (text: string) => {
  cy.get(PREVISUALIZER).shadow().find('[data-action="toggle-icp"]').then($btn => {
    if (!$btn.hasClass('active')) {
      cy.wrap($btn).click();
    }
  });
  cy.get(PREVISUALIZER).shadow().find('[data-section="interceptors"]').should('contain.text', text);
});

Cypress.Commands.add('interceptorCountShouldBe', (n: number) => {
  cy.get(PREVISUALIZER).shadow().find('[data-action="toggle-icp"]').should('contain.text', `(${n})`);
});
