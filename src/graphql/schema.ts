export const typeDefs = /* GraphQL */ `
  enum AccountType { checking savings credit }
  enum CardStatus { active locked canceled }
  enum TransactionType { credit debit }

  type User {
    id: ID!
    email: String!
    name: String!
    createdAt: String!
  }

  type Account {
    id: ID!
    userId: ID!
    type: AccountType!
    balanceCents: Int!
    createdAt: String!
  }

  type Card {
    id: ID!
    accountId: ID!
    last4: String!
    status: CardStatus!
    createdAt: String!
    updatedAt: String!
  }

  type Transaction {
    id: ID!
    accountId: ID!
    type: TransactionType!
    amountCents: Int!
    balanceAfterCents: Int!
    description: String
    createdAt: String!
  }

  type AuthPayload {
    accessToken: String!
    refreshToken: String!
    user: User!
  }

  input CreateUserInput {
    email: String!
    name: String!
  }

  input RegisterInput {
    email: String!
    name: String!
    password: String!
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input CreateAccountInput {
    userId: ID!
    type: AccountType!
    openingCents: Int = 0
  }

  input IssueCardInput {
    accountId: ID!
  }

  input MakeTransactionInput {
    accountId: ID!
    type: TransactionType!
    amountCents: Int!
    description: String
    requestId: String
  }

  type Query {
    health: String!
    me: User
    users: [User!]!
    accountsByUser(userId: ID!): [Account!]!
    cardsByAccount(accountId: ID!): [Card!]!
    transactionsByAccount(accountId: ID!): [Transaction!]!
  }

  type Mutation {
    noop: Boolean!
    # existing
    createUser(input: CreateUserInput!): User!
    createAccount(input: CreateAccountInput!): Account!
    issueCard(input: IssueCardInput!): Card!
    lockCard(cardId: ID!): Card!
    unlockCard(cardId: ID!): Card!
    cancelCard(cardId: ID!): Card!
    makeTransaction(input: MakeTransactionInput!): Transaction!

    # new auth
    registerUser(input: RegisterInput!): AuthPayload!
    loginUser(input: LoginInput!): AuthPayload!
    refreshToken(token: String!): AuthPayload!
  }
`;
