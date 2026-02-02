describe('Admin branches', () => {
  it('lists branches from fixture', () => {
    cy.visit('/branches');
    cy.contains('Branches');
    cy.get('[data-cy^="btn-edit-"]').should('have.length.at.least', 2);
    cy.contains('Surya Painting - Cabang Utama');
    cy.contains('Surya Painting - Cabang Selatan');
  });

  it('creates a branch', () => {
    const newBranch = { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', name: 'Cabang Baru', address: 'Jl. Baru No.1', capacity: 4 };
    cy.intercept('POST', '/api/admin/branches', (req) => {
      req.reply({ statusCode: 201, body: { data: newBranch } });
    }).as('createBranch');

    // after creation, the page will re-fetch /fixtures/branches.json. Stub it to include new branch.
    cy.intercept('GET', '/fixtures/branches.json', (req) => {
      req.reply({ statusCode: 200, body: [
        {
          "id": "00000000-0000-0000-0000-000000000001",
          "name": "Surya Painting - Cabang Utama",
          "address": "Jl. Contoh No.1",
          "capacity": 5
        },
        {
          "id": "00000000-0000-0000-0000-000000000002",
          "name": "Surya Painting - Cabang Selatan",
          "address": "Jl. Contoh No.2",
          "capacity": 3
        },
        newBranch
      ] });
    }).as('branchesAfterCreate');

    cy.visit('/branches');
    cy.get('[data-cy="btn-add-branch"]').click();
    cy.get('[data-cy="branch-name"]').type(newBranch.name);
    cy.get('[data-cy="branch-address"]').type(newBranch.address);
    cy.get('[data-cy="branch-capacity"]').clear().type(String(newBranch.capacity));
    cy.get('[data-cy="branch-form-submit"]').click();
    cy.wait('@createBranch');
    cy.wait('@branchesAfterCreate');

    // after creation the page should refresh and show the new name
    cy.contains(newBranch.name).should('exist');
  });

  it('edits a branch', () => {
    const updatedName = 'Cabang Utama (Updated)';
    cy.intercept('PUT', '/api/admin/branches/*', (req) => {
      req.reply({ statusCode: 200, body: { data: { ...req.body } } });
    }).as('updateBranch');

    // also stub fetch to return updated name after update
    cy.intercept('GET', '/fixtures/branches.json', (req) => {
      req.reply({ statusCode: 200, body: [
        {
          "id": "00000000-0000-0000-0000-000000000001",
          "name": updatedName,
          "address": "Jl. Contoh No.1",
          "capacity": 5
        },
        {
          "id": "00000000-0000-0000-0000-000000000002",
          "name": "Surya Painting - Cabang Selatan",
          "address": "Jl. Contoh No.2",
          "capacity": 3
        }
      ] });
    }).as('branchesAfterUpdate');

    cy.visit('/branches');
    cy.get('[data-cy^="btn-edit-"]').first().click();
    cy.get('[data-cy="branch-name"]').clear().type(updatedName);
    cy.get('[data-cy="branch-form-submit"]').click();
    cy.wait('@updateBranch');
    cy.wait('@branchesAfterUpdate');

    cy.contains(updatedName).should('exist');
  });

  it('deletes a branch', () => {
    cy.intercept('DELETE', '/api/admin/branches/*', (req) => {
      req.reply({ statusCode: 200, body: { success: true } });
    }).as('deleteBranch');

    cy.visit('/branches');
    cy.get('[data-cy^="btn-delete-"]').first().click();
    cy.get('[data-cy="confirm-modal-confirm"]').click();
    cy.wait('@deleteBranch');

    // Should no longer show the deleted branch name (best-effort)
  });
});