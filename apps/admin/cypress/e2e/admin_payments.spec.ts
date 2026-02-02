describe('Admin payments flow', () => {

  it('allows super admin to view payments and view proof', () => {
    // intercept proof endpoint
    cy.intercept('GET', '/api/admin/payments/proof*', {
      statusCode: 200,
      body: { url: 'https://example.com/proof.jpg' }
    }).as('getProof');

    // visit payments page and wait for the UI to render
    cy.visit('/payments');

    // wait for the page title to show up
    cy.contains('Pending Payments');

    // If there is a payment checkbox in the UI (rendered from server-side mock), interact with it.
    cy.get('body').then(($b) => {
      if ($b.find('[data-cy^="chk-"]').length) {
        cy.get('[data-cy^="chk-"]').first().click();
        cy.get('button').contains('View Proof').first().click();
        cy.wait('@getProof');
      } else {
        // assert no pending payments text exists
        cy.contains('No pending payments');
      }
    });
  });

  it('batch confirm sends request', () => {
    // prepare intercept for batch verify
    cy.intercept('POST', '/api/admin/payments/verify-batch', (req) => {
      req.reply({ results: req.body.payment_ids.map((id: string) => ({ id, success: true, queue_no: 1 })) });
    }).as('batchVerify');

    cy.visit('/payments');
    cy.contains('Pending Payments');

    // If payments exist in UI, select and confirm; otherwise assert empty state
    cy.get('body').then(($b) => {
      if ($b.find('[data-cy^="chk-"]').length) {
        cy.get('[data-cy^="chk-"]').first().click();
        cy.get('button').contains('Confirm Selected').click();
        // confirm modal
        cy.get('button').contains('Confirm').click();
        cy.wait('@batchVerify').its('request.body').should('have.property', 'payment_ids');
      } else {
        cy.contains('No pending payments');
      }
    });
  });
});
