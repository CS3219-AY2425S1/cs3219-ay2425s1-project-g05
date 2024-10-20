export type User = {
  email: string,
  password?: string,
  displayName: string,
  isAdmin: boolean,
  id: string,
}

export interface UserResponseData {
  user: User;
}