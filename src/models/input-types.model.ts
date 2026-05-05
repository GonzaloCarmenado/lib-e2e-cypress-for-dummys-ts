export const INPUT_TYPES = [
  'text',
  'password',
  'email',
  'search',
  'tel',
  'url',
  'number',
  'textarea',
] as const;

export type InputType = (typeof INPUT_TYPES)[number];
