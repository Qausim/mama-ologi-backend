/* eslint-disable import/prefer-default-export */

export const extractValidationErrors = (errors) => errors.errors.map((el) => {
  let key;
  if (el.nestedErrors) key = el.nestedErrors[0].param;
  else key = el.param;
  return ({ [key]: el.msg });
});
