export type User = {
  email: string,
  password?: string,
  displayName: string,
  isAdmin: boolean,
  _id: string,
}

export interface UserResponseData {
  user: User;
}