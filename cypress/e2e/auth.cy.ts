describe("Auth flows - login & signup", () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  it("login: validates required fields and shows friendly errors", () => {
    cy.visit("/login");
    // attempt empty submit
    cy.findByRole("button", { name: /sign in/i }).click();
    // expect browser validation to stop submit (required)
    // then type invalid email
    cy.findByLabelText(/email/i).type("not-an-email");
    cy.findByLabelText(/password/i).type("short");
    cy.findByRole("button", { name: /sign in/i }).click();
    // app should surface a friendly error
    cy.findByRole("alert").should("exist");
  });

  it("signup: shows errors for password mismatch and weak password", () => {
    cy.visit("/signup");
    cy.findByLabelText(/full name/i).type("Test User");
    cy.findByLabelText(/^email$/i).type("test@example.com");
    cy.findByLabelText(/^password$/i).type("123"); // weak
    cy.findByLabelText(/confirm password/i).type("456"); // mismatch
    cy.findByRole("button", { name: /create account/i }).click();
    cy.findByRole("alert").should("exist");
  });
});
