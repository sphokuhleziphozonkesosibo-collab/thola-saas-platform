describe('Thola Enterprise E2E User Journey', () => {
  it('Successfully loads the customer emergency portal homepage', () => {
    cy.visit('http://localhost:3000');
    cy.contains('Thola Platform').should('be.visible');
    cy.get('input[placeholder*="Umlazi"]').should('be.visible').type('Umlazi');
  });

  it('Successfully navigates to the Secure Login / Registration gateway', () => {
    cy.visit('http://localhost:3000/login');
    // Match the exact text rendered inside app/login/page.tsx
    cy.contains('Secure Enterprise Sign In').should('be.visible');
    cy.get('input[type="email"]').should('be.visible');
    cy.get('input[type="password"]').should('be.visible');
  });
});