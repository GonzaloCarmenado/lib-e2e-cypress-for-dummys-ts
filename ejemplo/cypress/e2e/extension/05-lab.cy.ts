describe('05 — Lab edge cases', () => {
  beforeEach(() => {
    cy.clearRecorderState();
    cy.visit('/lab');
    cy.startRecording();
  });

  // AC-25
  it('selector with apostrophe is correctly escaped in the generated command', () => {
    cy.get('[data-cy="o\'brien-btn"]').click();
    cy.openCommandsPanel();
    cy.get('lib-e2e-test-previsualizer').shadow().find('[data-ref="cmds"]').invoke('text').then(text => {
      // The generated command must be syntactically valid (no raw unescaped single quote breaking the string)
      expect(text).to.include("o'brien-btn");
      // The outer quotes must be consistent (double-quoted attribute value or escaped)
      expect(text).not.to.match(/cy\.get\('[^']*'[^']*'\)/); // no broken single-quote string
    });
  });

  // AC-26
  it('selector with double quotes is correctly escaped in the generated command', () => {
    cy.get('[data-cy=\'say "hello"\']').click();
    cy.openCommandsPanel();
    cy.get('lib-e2e-test-previsualizer').shadow().find('[data-ref="cmds"]').invoke('text').then(text => {
      expect(text).to.include('say');
      expect(text).to.include('hello');
      // Outer selector string must not be broken by unescaped double quotes
      expect(text).not.to.match(/cy\.get\("[^"]*"[^"]*"\)/);
    });
  });

  // AC-27
  it('typing text with apostrophes generates a valid .type(…) command', () => {
    cy.get('[data-cy="apostrophe-input"]').clear().type("it's a valid input");
    cy.openCommandsPanel();
    cy.commandShouldContain('.type(');
    cy.commandShouldContain("it");
    cy.commandShouldContain("valid input");
  });

  // AC-28
  it('GET response with sensitive token is redacted in the interceptor body', () => {
    cy.get('[data-cy="btn-sensitive-get"]').click();
    cy.openCommandsPanel();
    cy.get('lib-e2e-test-previsualizer').shadow().find('[data-action="toggle-icp"]').click();
    cy.get('lib-e2e-test-previsualizer').shadow().find('[data-section="interceptors"]').invoke('text').then(text => {
      // The literal token value must not appear in the generated interceptor
      expect(text).not.to.match(/eyJ[A-Za-z0-9_-]{10,}/); // typical JWT pattern
      expect(text).not.to.match(/"token"\s*:\s*"[^"]{8,}"/);
    });
  });

  // AC-29
  it('POST response with password and access_token is redacted in the interceptor body', () => {
    cy.get('[data-cy="btn-sensitive-post"]').click();
    cy.openCommandsPanel();
    cy.get('lib-e2e-test-previsualizer').shadow().find('[data-action="toggle-icp"]').click();
    cy.get('lib-e2e-test-previsualizer').shadow().find('[data-section="interceptors"]').invoke('text').then(text => {
      expect(text).not.to.match(/"password"\s*:\s*"[^"]{3,}"/);
      expect(text).not.to.match(/"access_token"\s*:\s*"[^"]{8,}"/);
    });
  });
});
