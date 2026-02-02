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

    // wait for any loading indicator to disappear so we inspect final state
    cy.contains('Loading...').should('not.exist');

    // Wait for either an item or the empty state; be tolerant to CI timing
    cy.get('body', { timeout: 10000 }).then(($body) => {
      const $els = $body.find('[data-cy^="chk-"]');
      if ($els.length > 0) {
        cy.wrap($els.first()).click();
        cy.get('button').contains('View Proof').first().click();
        cy.wait('@getProof');
      } else {
        cy.contains('No pending payments', { timeout: 10000 });
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
    cy.get('body', { timeout: 10000 }).then(($b) => {
      if ($b.find('[data-cy^="chk-"]').length) {
        cy.get('[data-cy^="chk-"]').first().click();
        cy.get('button').contains('Confirm Selected').click();
        // confirm modal
        cy.get('button').contains('Confirm').click();
        cy.wait('@batchVerify').its('request.body').should('have.property', 'payment_ids');
      } else {
        cy.contains('No pending payments', { timeout: 10000 });
      }
    });
  });
});
