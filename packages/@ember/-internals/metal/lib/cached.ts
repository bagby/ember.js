// NOTE: copied from: https://github.com/glimmerjs/glimmer.js/pull/358
// Both glimmerjs/glimmer.js and emberjs/ember.js have the exact same implementation
// of @cached, so any changes made to one should also be made to the other
import { DEBUG } from '@glimmer/env';
import { createCache, getValue } from '@glimmer/validator';

/**
 * @decorator
 *
 * Memoizes the result of a getter based on autotracking.
 *
 * The `@cached` decorator can be used on native getters to memoize their return
 * values based on the tracked state they consume while being calculated.
 *
 * By default a getter is always re-computed every time it is accessed. On
 * average this is faster than caching every getter result by default.
 *
 * However, there are absolutely cases where getters are expensive, and their
 * values are used repeatedly, so memoization would be very helpful.
 * Strategic, opt-in memoization is a useful tool that helps developers
 * optimize their apps when relevant, without adding extra overhead unless
 * necessary.
 *
 * @example
 *
 * ```ts
 * import { tracked, cached } from '@glimmer/tracking';
 *
 * class Person {
 *   @tracked firstName = 'Jen';
 *   @tracked lastName = 'Weber';
 *
 *   @cached
 *   get fullName() {
 *     return `${this.firstName} ${this.lastName}`;
 *   }
 * }
 * ```
 */
export const cached: PropertyDecorator = (...args: any[]) => {
  const [target, key, descriptor] = args;

  // Error on `@cached()`, `@cached(...args)`, and `@cached propName = value;`
  if (DEBUG && target === undefined) throwCachedExtraneousParens();
  if (
    DEBUG &&
    (typeof target !== 'object' ||
      typeof key !== 'string' ||
      typeof descriptor !== 'object' ||
      args.length !== 3)
  ) {
    throwCachedInvalidArgsError(args);
  }
  if (DEBUG && (!('get' in descriptor) || typeof descriptor.get !== 'function')) {
    throwCachedGetterOnlyError(key);
  }

  const caches = new WeakMap();
  const getter = descriptor.get;

  descriptor.get = function (): unknown {
    if (!caches.has(this)) {
      caches.set(this, createCache(getter.bind(this)));
    }

    return getValue(caches.get(this));
  };
};

function throwCachedExtraneousParens(): never {
  throw new Error(
    'You attempted to use @cached(), which is not necessary nor supported. Remove the parentheses and you will be good to go!'
  );
}

function throwCachedGetterOnlyError(key: string): never {
  throw new Error(`The @cached decorator must be applied to getters. '${key}' is not a getter.`);
}

function throwCachedInvalidArgsError(args: unknown[] = []): never {
  throw new Error(
    `You attempted to use @cached on with ${
      args.length > 1 ? 'arguments' : 'an argument'
    } ( @cached(${args
      .map((d) => `'${d}'`)
      .join(
        ', '
      )}), which is not supported. Dependencies are automatically tracked, so you can just use ${'`@cached`'}`
  );
}
