import {Nullable} from '../../types/common';

interface ErrorConstructor<T extends any[]> {
  new (...args: T): Error;
}

export function ensure<T extends any[]>(condition: boolean, ErrorToThrow: ErrorConstructor<T>, ...errorArgs: T):
  asserts condition {
  if (!condition) {
    throw new ErrorToThrow(...errorArgs);
  }
}

export type NonFalsy<T> = T extends null | undefined | 0 | '' ? never : T;
export type NonNull<T> = T extends null ? never : T;

export function ensureNotFalsy<T, E extends any[]>(value: T, error: ErrorConstructor<E>, ...errorArgs: E):
  asserts value is NonFalsy<T> {
  return ensure(!!value, error, ...errorArgs);
}

export function ensureNotNull<T, E extends any[]>(value: Nullable<T>, error: ErrorConstructor<E>, ...errorArgs: E):
  asserts value is NonNull<T> {
  return ensure(value !== null, error, ...errorArgs);
}

export function ensureNotEmpty<T extends any[]>(object: object, error: ErrorConstructor<T>, ...errorArgs: T) {
  return ensure((Object.entries(object).length !== 0), error, ...errorArgs);
}
