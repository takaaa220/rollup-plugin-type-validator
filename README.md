# rollup-plugin-type-validator

⚠ This is just a toy project.

Generate validator automaticaly by using TypeScript types. 

This library is inspired by https://github.com/vedantroy/typecheck.macro.

## Example

```typescript
const validate = initValidator<number>;
validate(3); // { ok: true, value: 3 }

validate("3"); // { ok: false, error: ValidationError(...) }
```

## License

MIT
