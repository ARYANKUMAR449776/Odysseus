export const typeDefs = /* GraphQL */ `
  """Allowed account types"""
  enum AccountType {
    checking
    savings
    credit
  }

  """A user in Odysseus"""
  type User {
    id: ID!
    email: String!
    name: String!
    createdAt: String!
  }

  """Bank account owned by a user"""
  type Account {
    id: ID!
    userId: ID!
    type: AccountType!
    balanceCents: Int!
    createdAt: String!
  }

  input CreateUserInput {
    email: String!
    name: String!
  }

  input CreateAccountInput {
    userId: ID!
    type: AccountType!
    openingCents: Int = 0
  }

  type Query {
    health: String!
    users: [User!]!
    accountsByUser(userId: ID!): [Account!]!
  }

  type Mutation {
    noop: Boolean!
    createUser(input: CreateUserInput!): User!
    createAccount(input: CreateAccountInput!): Account!
  }
`;
