import './commands';
import './recorder';

// Clear localStorage before every test to prevent stale recorder settings
// (e.g. allowReadWriteFiles: true) from triggering automatic dialogs.
beforeEach(() => {
  cy.clearLocalStorage();
});
