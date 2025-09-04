import { gql } from "@apollo/client";

// auth
export const REGISTER = gql`
  mutation Register($input: RegisterInput!) {
    registerUser(input: $input) {
      accessToken
      refreshToken
      user { id email name }
    }
  }
`;

export const LOGIN = gql`
  mutation Login($input: LoginInput!) {
    loginUser(input: $input) {
      accessToken
      refreshToken
      user { id email name }
    }
  }
`;

export const ME = gql`
  query Me {
    me { id email name }
  }
`;

// accounts
export const ACCOUNTS_BY_USER = gql`
  query AccountsByUser($userId: ID!) {
    accountsByUser(userId: $userId) {
      id
      type
      balanceCents
    }
  }
`;

export const CREATE_ACCOUNT = gql`
  mutation CreateAccount($input: CreateAccountInput!) {
    createAccount(input: $input) {
      id
      type
      balanceCents
      createdAt
    }
  }
`;

// transactions
export const MAKE_TX = gql`
  mutation MakeTransaction($input: MakeTransactionInput!) {
    makeTransaction(input: $input) {
      id
      type
      amountCents
      balanceAfterCents
      createdAt
    }
  }
`;
